import type { MealResult } from "./engine/pipeline.ts";
import { timeInBogota, todayInBogota } from "./profile.ts";
import { draftExpiry, newId, sumTotals, type Meal, type MealDraft, type MealMoment, type MealTotals, type NutritionStore, type StoredItem } from "./store.ts";
import { PARTY_ETHANOL_G, type Targets } from "./targets.ts";

/**
 * Herramientas que el Coach (chat /ia) usa para registrar comidas por conversación
 * (docs/nutricion/03-arquitectura.md §4.2).
 *
 * Regla clave, en código: guardar o borrar solo funciona en un turno POSTERIOR al que mostró
 * el resumen. Así nada se guarda sin que Juan lo haya visto y dicho que sí.
 */

export const ENGINE_VERSION = "2026-10-25-r9";

export type ToolContext = {
  store: NutritionStore;
  /** Corre el motor de la Fase 2 sobre un texto. */
  analyze: (text: string) => Promise<MealResult>;
  /** Objetivos del día (perfil + peso + entrenos). */
  targetsFor: (date: string) => Promise<Targets>;
  threadId: string | null;
  /** Identificador de esta petición al chat. */
  turnId: string;
  now?: Date;
};

const MOMENTS: MealMoment[] = ["desayuno", "almuerzo", "cena", "snack", "fiesta"];

export const NUTRITION_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "analizar_comida",
      description:
        "Analiza lo que Juan comió o bebió (texto tal como lo dijo) y crea un BORRADOR. No guarda nada. Úsala cuando cuente una comida o bebida que ya consumió.",
      parameters: {
        type: "object",
        additionalProperties: false,
        required: ["texto", "fecha", "momento"],
        properties: {
          texto: { type: "string", description: "Lo que comió, con sus palabras (sin resumir)" },
          fecha: { type: ["string", "null"], description: "YYYY-MM-DD si no es hoy (ej. 'ayer'); null = hoy" },
          momento: { type: ["string", "null"], enum: [...MOMENTS, null], description: "null = según la hora" },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "corregir_comida",
      description: "Corrige un borrador pendiente o una comida ya guardada con lo que Juan dijo (\"eran 2 arepas\", \"sin sopa\"). Crea un borrador nuevo; no guarda.",
      parameters: {
        type: "object",
        additionalProperties: false,
        required: ["borrador_id", "comida_id", "correccion"],
        properties: {
          borrador_id: { type: ["string", "null"] },
          comida_id: { type: ["string", "null"], description: "id de una comida ya guardada" },
          correccion: { type: "string" },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "guardar_comida",
      description: "Guarda un borrador SOLO después de que Juan respondió que sí al resumen que le mostraste en un mensaje anterior.",
      parameters: { type: "object", additionalProperties: false, required: ["borrador_id"], properties: { borrador_id: { type: "string" } } },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "descartar_borrador",
      description: "Descarta un borrador si Juan dice que no lo guarde.",
      parameters: { type: "object", additionalProperties: false, required: ["borrador_id"], properties: { borrador_id: { type: "string" } } },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "borrar_comida",
      description: "Pide borrar una comida guardada. La primera llamada solo prepara el borrado; se confirma llamando de nuevo en un turno posterior, cuando Juan diga que sí.",
      parameters: { type: "object", additionalProperties: false, required: ["comida_id"], properties: { comida_id: { type: "string" } } },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "resumen_dia",
      description: "Lo que Juan lleva consumido en un día vs sus objetivos, con las comidas guardadas y sus ids.",
      parameters: { type: "object", additionalProperties: false, required: ["fecha"], properties: { fecha: { type: ["string", "null"], description: "YYYY-MM-DD; null = hoy" } } },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "consultar_opciones",
      description: "Modo '¿qué pido?': calcula 2 a 4 opciones de comida SIN guardar nada, para compararlas con lo que le queda del día.",
      parameters: {
        type: "object",
        additionalProperties: false,
        required: ["opciones"],
        properties: { opciones: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 4 } },
      },
    },
  },
];

const r = (x: number) => Math.round(x);

function momentFor(time: string): MealMoment {
  const h = Number(time.slice(0, 2));
  if (h < 11) return "desayuno";
  if (h < 16) return "almuerzo";
  if (h < 19) return "snack";
  return "cena";
}

function toStored(result: MealResult): { items: StoredItem[]; totals: MealTotals } {
  const items = result.items.map((item) => {
    const { nutrients } = item;
    const rest: Omit<typeof item, "warnings" | "nutrients"> & { warnings?: unknown; nutrients?: unknown } = { ...item };
    delete rest.warnings;
    delete rest.nutrients;
    return {
    ...(rest as Omit<typeof item, "warnings" | "nutrients">),
    nutrients: { kcal: nutrients.kcal, protein_g: nutrients.protein_g, fat_g: nutrients.fat_g, carb_g: nutrients.carb_g, fiber_g: nutrients.fiber_g, alcohol_g: nutrients.alcohol_g },
    };
  });
  return { items, totals: sumTotals(items.map((i) => ({ totals: i.nutrients }))) };
}

function describeItems(items: StoredItem[]) {
  return items.map((i) => ({
    alimento: i.name,
    base: i.recordName,
    gramos: i.grams,
    kcal: i.nutrients.kcal,
    proteina_g: i.nutrients.protein_g,
    ...(i.assumption ? { supuesto: i.assumption } : {}),
    ...(i.recordId ? {} : { sin_coincidencia: true }),
  }));
}

async function dayStatus(ctx: ToolContext, date: string, extra?: MealTotals) {
  const [meals, targets] = await Promise.all([ctx.store.listMeals(date, date), ctx.targetsFor(date)]);
  const eaten = sumTotals(meals);
  const after = extra ? sumTotals([{ totals: eaten }, { totals: extra }]) : eaten;
  return {
    meals,
    targets,
    eaten,
    resumen: {
      objetivo_kcal: targets.kcal,
      objetivo_proteina_g: targets.protein_g,
      consumido_kcal: after.kcal,
      consumido_proteina_g: after.protein_g,
      restante_kcal: targets.kcal - after.kcal,
      restante_proteina_g: r(targets.protein_g - after.protein_g),
      alcohol_g: after.alcohol_g,
      ...(after.alcohol_g > PARTY_ETHANOL_G ? { dia_de_fiesta: true } : {}),
    },
  };
}

async function makeDraft(ctx: ToolContext, text: string, date: string, moment: MealMoment | null, replacesMealId: string | null, keepId?: string): Promise<MealDraft> {
  const result = await ctx.analyze(text);
  const now = ctx.now ?? new Date();
  const time = timeInBogota(now);
  const { items, totals } = toStored(result);
  const draft: MealDraft = {
    id: keepId ?? newId(),
    date,
    time,
    moment: moment ?? (totals.alcohol_g > PARTY_ETHANOL_G / 2 ? "fiesta" : momentFor(time)),
    text,
    items,
    totals,
    engineVersion: ENGINE_VERSION,
    chatThreadId: ctx.threadId,
    createdAt: now.toISOString(),
    turnId: ctx.turnId,
    replacesMealId,
    expiresAt: draftExpiry(now.getTime()),
  };
  await ctx.store.saveDraft(draft);
  return draft;
}

async function presentDraft(ctx: ToolContext, draft: MealDraft, question: string | null) {
  const day = await dayStatus(ctx, draft.date, draft.totals);
  return {
    borrador_id: draft.id,
    fecha: draft.date,
    momento: draft.moment,
    alimentos: describeItems(draft.items),
    totales: draft.totals,
    ...(question ? { pregunta_sugerida: question } : {}),
    dia_si_se_guarda: day.resumen,
    instruccion: "Muéstrale a Juan los alimentos con gramos y kcal, los supuestos importantes y el total; luego pregunta si lo guardas. NO llames guardar_comida en este turno.",
  };
}

type Args = Record<string, unknown>;
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

/** Ejecuta una herramienta y devuelve el resultado como objeto (se envía al modelo en JSON). */
export async function runNutritionTool(name: string, args: Args, ctx: ToolContext): Promise<Record<string, unknown>> {
  const today = todayInBogota(ctx.now ?? new Date());
  switch (name) {
    case "analizar_comida": {
      const text = str(args.texto);
      if (!text) return { error: "Falta el texto de la comida" };
      const moment = MOMENTS.includes(args.momento as MealMoment) ? (args.momento as MealMoment) : null;
      const date = str(args.fecha) ?? today;
      const result = await ctx.analyze(text);
      // Se reutiliza el análisis para no llamar dos veces al motor.
      const draft = await makeDraft({ ...ctx, analyze: async () => result }, text, date, moment, null);
      return presentDraft(ctx, draft, result.question);
    }
    case "corregir_comida": {
      const correction = str(args.correccion);
      if (!correction) return { error: "Falta la corrección" };
      const draftId = str(args.borrador_id);
      const mealId = str(args.comida_id);
      if (draftId) {
        const old = await ctx.store.getDraft(draftId);
        if (!old) return { error: "Ese borrador ya no existe (venció o se guardó)" };
        const text = `${old.text}\nCorrección de Juan: ${correction}`;
        const draft = await makeDraft(ctx, text, old.date, old.moment, old.replacesMealId, old.id);
        return presentDraft(ctx, draft, null);
      }
      if (mealId) {
        const meal = await ctx.store.getMeal(mealId);
        if (!meal) return { error: "No encontré esa comida" };
        const text = `${meal.text}\nCorrección de Juan: ${correction}`;
        const draft = await makeDraft(ctx, text, meal.date, meal.moment, meal.id);
        return presentDraft(ctx, draft, null);
      }
      return { error: "Indica borrador_id o comida_id" };
    }
    case "guardar_comida": {
      const draft = await ctx.store.getDraft(String(args.borrador_id ?? ""));
      if (!draft) return { error: "Ese borrador ya no existe (venció o ya se guardó)" };
      if (draft.turnId === ctx.turnId) {
        return { error: "No se puede guardar en el mismo turno en que se analizó. Muéstrale el resumen a Juan y espera su sí." };
      }
      const now = (ctx.now ?? new Date()).toISOString();
      const meal: Meal = {
        id: draft.replacesMealId ?? draft.id,
        date: draft.date,
        time: draft.time,
        moment: draft.moment,
        text: draft.text,
        items: draft.items,
        totals: draft.totals,
        engineVersion: draft.engineVersion,
        chatThreadId: draft.chatThreadId,
        createdAt: draft.createdAt,
        updatedAt: now,
      };
      if (draft.replacesMealId) {
        const old = await ctx.store.getMeal(draft.replacesMealId);
        if (old) meal.createdAt = old.createdAt;
      }
      await ctx.store.saveMeal(meal);
      await ctx.store.deleteDraft(draft.id);
      const day = await dayStatus(ctx, meal.date);
      return { guardada: true, comida_id: meal.id, dia: day.resumen };
    }
    case "descartar_borrador": {
      await ctx.store.deleteDraft(String(args.borrador_id ?? ""));
      return { descartado: true };
    }
    case "borrar_comida": {
      const mealId = String(args.comida_id ?? "");
      const meal = await ctx.store.getMeal(mealId);
      if (!meal) return { error: "No encontré esa comida" };
      const pending = (await ctx.store.listDrafts(ctx.threadId)).find((d) => d.replacesMealId === mealId && d.items.length === 0);
      if (pending && pending.turnId !== ctx.turnId) {
        await ctx.store.deleteMeal(mealId);
        await ctx.store.deleteDraft(pending.id);
        return { borrada: true, dia: (await dayStatus(ctx, meal.date)).resumen };
      }
      if (!pending) {
        const now = ctx.now ?? new Date();
        await ctx.store.saveDraft({
          ...meal,
          id: newId(),
          items: [],
          turnId: ctx.turnId,
          replacesMealId: mealId,
          chatThreadId: ctx.threadId,
          createdAt: now.toISOString(),
          expiresAt: draftExpiry(now.getTime()),
        });
      }
      return {
        pendiente_de_confirmar: true,
        comida: { fecha: meal.date, hora: meal.time, texto: meal.text, kcal: meal.totals.kcal },
        instruccion: "Pregúntale a Juan si de verdad la borras. Solo si dice que sí, vuelve a llamar borrar_comida en el siguiente turno.",
      };
    }
    case "resumen_dia": {
      const date = str(args.fecha) ?? today;
      const day = await dayStatus(ctx, date);
      return {
        fecha: date,
        ...day.resumen,
        grasa_g: day.eaten.fat_g,
        carbohidratos_g: day.eaten.carb_g,
        fibra_g: day.eaten.fiber_g,
        objetivo_grasa_g: day.targets.fat_g,
        objetivo_carbohidratos_g: day.targets.carb_g,
        objetivo_fibra_g: day.targets.fiber_g,
        comidas: day.meals.map((m) => ({ comida_id: m.id, hora: m.time, momento: m.moment, texto: m.text, kcal: m.totals.kcal, proteina_g: m.totals.protein_g })),
      };
    }
    case "consultar_opciones": {
      const options = Array.isArray(args.opciones) ? args.opciones.map(String).slice(0, 4) : [];
      if (!options.length) return { error: "Faltan las opciones" };
      const day = await dayStatus(ctx, today);
      const analyzed = await Promise.all(
        options.map(async (o) => {
          const { totals } = toStored(await ctx.analyze(o));
          return { opcion: o, kcal: totals.kcal, proteina_g: totals.protein_g, grasa_g: totals.fat_g, carbohidratos_g: totals.carb_g, alcohol_g: totals.alcohol_g, quedaria_kcal: day.resumen.restante_kcal - totals.kcal };
        }),
      );
      return { restante_hoy: day.resumen, opciones: analyzed, instruccion: "Compara y recomienda una según la fase de déficit: más proteína por kcal y que no se pase del día. No guardes nada." };
    }
    default:
      return { error: `Herramienta desconocida: ${name}` };
  }
}

/** Bloque corto de nutrición para el prompt del Coach (solo Juan). */
export async function buildNutritionContext(ctx: ToolContext): Promise<string> {
  const now = ctx.now ?? new Date();
  const today = todayInBogota(now);
  const weekAgo = todayInBogota(new Date(now.getTime() - 6 * 86400000));
  const [profile, day, week, drafts] = await Promise.all([
    ctx.store.getProfile(),
    dayStatus(ctx, today),
    ctx.store.listMeals(weekAgo, today),
    ctx.store.listDrafts(ctx.threadId),
  ]);
  const t = day.targets;
  const byDay = new Map<string, Meal[]>();
  for (const m of week) byDay.set(m.date, [...(byDay.get(m.date) ?? []), m]);
  const days = [...byDay.entries()].map(([d, ms]) => {
    const tot = sumTotals(ms);
    return `${d}: ${tot.kcal} kcal, ${tot.protein_g} g prot${tot.alcohol_g > 0 ? `, ${tot.alcohol_g} g alcohol` : ""}${tot.alcohol_g > PARTY_ETHANOL_G ? " (FIESTA)" : ""}`;
  });
  const pending = drafts.filter((d) => d.items.length > 0);
  return [
    `NUTRICIÓN (módulo Comidas). Hoy es ${today}, ${timeInBogota(now)} en Colombia.`,
    `Fase: ${profile.phase.type} (${profile.phase.ratePctPerWeek} %/semana) del ${profile.phase.start} al ${profile.phase.end ?? "sin fecha"}. Objetivo: ${profile.phase.objective}.`,
    `Objetivos diarios: ${t.kcal} kcal, ${t.protein_g} g proteína, ${t.fat_g} g grasa, ${t.carb_g} g carbohidratos, ${t.fiber_g} g fibra, ${t.water_l} L de agua. Mantenimiento estimado ${t.tdee} kcal (±10 %), peso usado ${t.basis.weightKg} kg.`,
    `Hoy lleva: ${day.eaten.kcal} kcal y ${day.eaten.protein_g} g de proteína (${day.meals.length} comidas). Le quedan ${t.kcal - day.eaten.kcal} kcal y ${r(t.protein_g - day.eaten.protein_g)} g de proteína.`,
    days.length ? `Últimos 7 días registrados:\n${days.join("\n")}` : "Aún no hay comidas registradas esta semana.",
    pending.length
      ? `Borradores pendientes de confirmar en este chat:\n${pending.map((d) => `- borrador_id ${d.id}: "${d.text.slice(0, 80)}" = ${d.totals.kcal} kcal`).join("\n")}`
      : "No hay borradores pendientes.",
  ].join("\n");
}

export const NUTRITION_PROMPT = `
REGISTRO DE COMIDAS (solo para Juan):
- Si Juan cuenta algo que comió o bebió, llama analizar_comida con su texto tal cual. Luego muéstrale, en pocas líneas: cada alimento con gramos y kcal, los supuestos importantes, el total (kcal y proteína) y cuánto le quedaría del día. Termina preguntando "¿Lo guardo?". Si hay pregunta_sugerida, inclúyela.
- Si responde que sí (sí, dale, guárdalo, listo…) a un borrador pendiente, llama guardar_comida con ese borrador_id. Si corrige algo, llama corregir_comida y vuelve a mostrar el resumen. Si dice que no, descartar_borrador.
- Nunca digas que guardaste algo si guardar_comida no respondió guardada = true.
- Si pregunta qué pedir o compara opciones de un menú, usa consultar_opciones (no guarda nada).
- Si pregunta cómo va, usa resumen_dia.
- Fiestas: el alcohol cuenta en las kcal del día. Si hubo un día de fiesta esta semana, sugiere repartir el exceso en los 3–4 días siguientes bajando grasa y carbohidratos, NUNCA la proteína, y sin ayunar. Antes de salir: comida con proteína; durante: agua; después: comida proteica en vez de domicilio.
- Si Juan solo pregunta por un alimento ("¿cuánta proteína tiene un huevo?"), responde sin crear borradores.
- Respuestas cortas y en español simple. Usa números redondos (sin decimales en kcal ni en proteína). Nunca muestres kcal negativas: si se pasa, di "te pasarías X kcal".`;
