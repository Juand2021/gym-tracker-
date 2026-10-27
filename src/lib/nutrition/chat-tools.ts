import type { MealResult } from "./engine/pipeline.ts";
import type { Nutrients } from "./engine/types.ts";
import { buildMealPlan } from "./meal-plan.ts";
import { applyProfilePatch, ageOn, PHASE_RATES, timeInBogota, todayInBogota, type NutritionProfile, type ProfilePatch } from "./profile.ts";
import { draftExpiry, newId, sumTotals, type Meal, type MealDraft, type MealMoment, type MealTotals, type NutritionStore, type StoredItem } from "./store.ts";
import { navyBodyFat, PARTY_ETHANOL_G, type TargetsLookup } from "./targets.ts";

/**
 * Herramientas del asistente de la app Comidas (docs/nutricion/03-arquitectura.md §4.2).
 * Sirven para cualquier persona: si el perfil está incompleto, el asistente lo completa primero.
 *
 * Regla clave, en código: guardar o borrar una comida solo funciona en un turno POSTERIOR al que
 * mostró el resumen. Así nada se guarda sin que la persona lo haya visto y dicho que sí.
 */

export const ENGINE_VERSION = "2026-10-25-r9";

/** Cocina (Planes): recetas, despensa y snacks. La implementa src/lib/nutrition/kitchen/server.ts. */
export type KitchenChatTools = {
  search(query: string | null, kind: "desayuno" | "comida" | "snack" | null, onlyReady: boolean): Promise<Record<string, unknown>[]>;
  pantry(addText: string | null, removeText: string | null): Promise<{ agregados: string[]; quitados: string[]; recetas_listas: number }>;
  snacks(): Promise<Record<string, unknown>>;
  /** Plan del día con recetas; null si falta el perfil. */
  plan(): Promise<Record<string, unknown> | null>;
  /** Alimentos y totales de una receta (ajustada a la siguiente comida si `fitted`). */
  /** Acepta el id o el nombre; si el nombre no es claro devuelve las candidatas. */
  recipeMeal(idOrName: string, servings: number, fitted: boolean): Promise<{ recipeId: string; kind: string; text: string; items: StoredItem[]; totals: MealTotals } | { candidatas: string[] }>;
  markCooked(recipeId: string, date: string): Promise<void>;
  /** La IA propone una receta con la despensa y queda guardada como "Por probar". */
  propose(kind: "desayuno" | "comida" | "snack" | null, wish: string | null): Promise<Record<string, unknown>>;
  /** Guarda una receta escrita por la persona. */
  saveText(text: string): Promise<Record<string, unknown>>;
};

export type ToolContext = {
  store: NutritionStore;
  /** Corre el motor de la Fase 2 sobre un texto. */
  analyze: (text: string) => Promise<MealResult>;
  /** Objetivos del día (perfil + peso + entrenos) o los datos que faltan. */
  targetsFor: (date: string) => Promise<TargetsLookup>;
  /** Nutrientes por 100 g de un alimento del núcleo (para el plan de comidas). */
  nutrientsOf?: (coreKey: string) => Nutrients | undefined;
  /** Registra un pesaje (se comparte con Fuerza). */
  logWeight?: (date: string, weightKg: number) => Promise<void>;
  /** Recetas, despensa y snacks (Planes). */
  kitchen?: KitchenChatTools;
  threadId: string | null;
  /** Identificador de esta petición al chat. */
  turnId: string;
  now?: Date;
};

const MOMENTS: MealMoment[] = ["desayuno", "almuerzo", "cena", "snack", "fiesta"];
const nullable = (type: string, extra: Record<string, unknown> = {}) => ({ type: [type, "null"], ...extra });

export const NUTRITION_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "analizar_comida",
      description: "Analiza lo que la persona comió o bebió (texto tal como lo dijo) y crea un BORRADOR. No guarda nada. Úsala cuando cuente una comida o bebida que ya consumió.",
      parameters: {
        type: "object",
        additionalProperties: false,
        required: ["texto", "fecha", "momento"],
        properties: {
          texto: { type: "string", description: "Lo que comió, con sus palabras (sin resumir)" },
          fecha: nullable("string", { description: "YYYY-MM-DD si no es hoy (ej. 'ayer'); null = hoy" }),
          momento: { type: ["string", "null"], enum: [...MOMENTS, null], description: "null = según la hora" },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "corregir_comida",
      description: 'Corrige un borrador pendiente o una comida ya guardada ("eran 2 arepas", "sin sopa"). Crea un borrador nuevo; no guarda.',
      parameters: {
        type: "object",
        additionalProperties: false,
        required: ["borrador_id", "comida_id", "correccion"],
        properties: {
          borrador_id: nullable("string"),
          comida_id: nullable("string", { description: "id de una comida ya guardada" }),
          correccion: { type: "string" },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "guardar_comida",
      description: "Guarda un borrador SOLO después de que la persona respondió que sí al resumen que le mostraste en un mensaje anterior.",
      parameters: { type: "object", additionalProperties: false, required: ["borrador_id"], properties: { borrador_id: { type: "string" } } },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "descartar_borrador",
      description: "Descarta un borrador si la persona dice que no lo guarde.",
      parameters: { type: "object", additionalProperties: false, required: ["borrador_id"], properties: { borrador_id: { type: "string" } } },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "borrar_comida",
      description: "Pide borrar una comida guardada. La primera llamada solo prepara el borrado; se confirma llamando de nuevo en un turno posterior, cuando la persona diga que sí.",
      parameters: { type: "object", additionalProperties: false, required: ["comida_id"], properties: { comida_id: { type: "string" } } },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "resumen_dia",
      description: "Lo que lleva consumido en un día vs sus objetivos, con las comidas guardadas y sus ids.",
      parameters: { type: "object", additionalProperties: false, required: ["fecha"], properties: { fecha: nullable("string", { description: "YYYY-MM-DD; null = hoy" }) } },
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
  {
    type: "function" as const,
    function: {
      name: "plan_comidas",
      description: "Qué y cuánto comer en lo que queda del día: una receta de su recetario por cada comida que falta, ajustada a las kcal y proteína que le quedan y a lo que tiene en casa.",
      parameters: { type: "object", additionalProperties: false, required: [], properties: {} },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "buscar_recetas",
      description: "Busca en su recetario (Planes) recetas fáciles con kcal y proteína por porción y si tiene los ingredientes en casa. Para: qué puedo cocinar, una receta con pollo, algo rápido de desayuno.",
      parameters: {
        type: "object",
        additionalProperties: false,
        required: ["texto", "tipo", "solo_listas"],
        properties: {
          texto: nullable("string", { description: "Ingrediente o palabra a buscar (pollo, avena, air fryer...)" }),
          tipo: nullable("string", { enum: ["desayuno", "comida", "snack", null] }),
          solo_listas: { type: "boolean", description: "true si solo quiere las que puede hacer ya con lo que tiene" },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "actualizar_despensa",
      description: "Actualiza lo que tiene en casa (compré pollo y huevos; se me acabó la avena). Sal, aceite y especias ya cuentan.",
      parameters: {
        type: "object",
        additionalProperties: false,
        required: ["agregar", "quitar"],
        properties: {
          agregar: nullable("string", { description: "Lo que compró o tiene, como lo dijo" }),
          quitar: nullable("string", { description: "Lo que se le acabó" }),
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "sugerir_snack",
      description: "Tiene hambre entre comidas: 3 snacks de su recetario que caben en lo que le queda, los que más llenan primero.",
      parameters: { type: "object", additionalProperties: false, required: [], properties: {} },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "registrar_receta",
      description: "Comió una receta de su recetario (hice los pancakes de avena): crea un borrador calculado con la receta. Igual que analizar_comida: muestra y pregunta antes de guardar.",
      parameters: {
        type: "object",
        additionalProperties: false,
        required: ["receta_id", "porciones", "ajustada"],
        properties: {
          receta_id: { type: "string", description: "El receta_id, o el nombre de la receta si no lo sabes" },
          porciones: nullable("number", { description: "Porciones que comió (por defecto 1)" }),
          ajustada: { type: "boolean", description: "true si la hizo con las cantidades ajustadas a su día que muestra la app (lo normal)" },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "proponer_receta",
      description: "Inventa una receta NUEVA, fácil y alta en proteína con lo que tiene en la despensa y su equipo. Queda guardada en su recetario como 'Por probar'.",
      parameters: {
        type: "object",
        additionalProperties: false,
        required: ["tipo", "deseo"],
        properties: {
          tipo: nullable("string", { enum: ["desayuno", "comida", "snack", null] }),
          deseo: nullable("string", { description: "Lo que pidió (con pollo, algo dulce, sin estufa...)" }),
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "guardar_receta",
      description: "Guarda en su recetario una receta que la persona escribió (ingredientes y pasos). Solo si pidió guardarla.",
      parameters: {
        type: "object",
        additionalProperties: false,
        required: ["texto"],
        properties: { texto: { type: "string", description: "La receta tal como la escribió" } },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "ver_perfil",
      description: "Muestra el perfil (datos, objetivo) y cómo se calculan sus calorías y macros, o qué datos faltan.",
      parameters: { type: "object", additionalProperties: false, required: [], properties: {} },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "actualizar_perfil",
      description:
        "Guarda datos del perfil o el objetivo. Manda SOLO los campos que la persona dijo. Úsala para el registro inicial y para cambios (\"quiero hacer volumen\", \"mido 1,72\", \"no como cerdo\").",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {
          sexo: { type: "string", enum: ["M", "F"] },
          fecha_nacimiento: { type: "string", description: "YYYY-MM-DD; si solo dice la edad, usa el 1 de enero del año que corresponde" },
          estatura_cm: { type: "number" },
          peso_kg: { type: "number", description: "Peso declarado (si es un pesaje de hoy, usa registrar_peso)" },
          grasa_pct: { type: "number", description: "Solo si la midió (bioimpedancia, DXA, cinta)" },
          grasa_estimada: { type: "string", enum: ["bajo", "medio", "alto"], description: "Si no la ha medido: cómo se ve" },
          actividad: { type: "string", enum: ["sedentario", "ligero", "activo", "muy_activo"], description: "Su día sin contar el gym: oficina = sedentario; de pie/caminando = ligero/activo" },
          pasos_dia: { type: "number" },
          dias_entreno_semana: { type: "number" },
          minutos_sesion: { type: "number" },
          estilo_alimentacion: { type: "string", enum: ["omnivoro", "pescetariano", "vegetariano", "vegano"] },
          evitar_alimentos: { type: "array", items: { type: "string" }, description: "Lista COMPLETA de lo que no come (reemplaza la anterior)" },
          comidas_al_dia: { type: "number" },
          objetivo: {
            type: "object",
            additionalProperties: false,
            properties: {
              tipo: { type: "string", enum: ["deficit", "mantenimiento", "recomposicion", "volumen"] },
              ritmo_pct_semana: { type: "number", description: "Déficit: 0,5 suave · 0,7 moderado · 1,0 grande. Volumen: 0,25 limpio · 0,5 rápido" },
              inicio: { type: "string", description: "YYYY-MM-DD; por defecto hoy" },
              fin: { type: ["string", "null"], description: "YYYY-MM-DD o null si no tiene fecha" },
              descripcion: { type: "string", description: "Su meta con sus palabras (ej. 'marcar abdomen para diciembre')" },
            },
          },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "registrar_peso",
      description: "Registra un pesaje (se ve también en Fuerza) y recalcula los objetivos.",
      parameters: {
        type: "object",
        additionalProperties: false,
        required: ["peso_kg", "fecha"],
        properties: { peso_kg: { type: "number" }, fecha: nullable("string", { description: "YYYY-MM-DD; null = hoy" }) },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "registrar_medidas",
      description: "Guarda medidas con cinta métrica (cintura en el ombligo, cuello, bíceps, muslo, cadera) y estima la grasa corporal si se puede.",
      parameters: {
        type: "object",
        additionalProperties: false,
        required: ["fecha"],
        properties: {
          fecha: nullable("string"),
          cintura_cm: { type: "number" },
          cuello_cm: { type: "number" },
          cadera_cm: { type: "number" },
          biceps_cm: { type: "number" },
          muslo_cm: { type: "number" },
        },
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
  const [meals, lookup] = await Promise.all([ctx.store.listMeals(date, date), ctx.targetsFor(date)]);
  const eaten = sumTotals(meals);
  const after = extra ? sumTotals([{ totals: eaten }, { totals: extra }]) : eaten;
  const base = {
    consumido_kcal: after.kcal,
    consumido_proteina_g: r(after.protein_g),
    alcohol_g: after.alcohol_g,
    ...(after.alcohol_g > PARTY_ETHANOL_G ? { dia_de_fiesta: true } : {}),
  };
  if (!lookup.ok) return { meals, lookup, eaten, resumen: { ...base, perfil_incompleto: true, faltan: lookup.missing } };
  const t = lookup.targets;
  return {
    meals,
    lookup,
    eaten,
    resumen: {
      objetivo_kcal: t.kcal,
      objetivo_proteina_g: t.protein_g,
      ...base,
      restante_kcal: t.kcal - after.kcal,
      restante_proteina_g: r(t.protein_g - after.protein_g),
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
    instruccion: "Muestra los alimentos con gramos y kcal, los supuestos importantes y el total; luego pregunta si lo guardas. NO llames guardar_comida en este turno.",
  };
}

/** Perfil + explicación de los objetivos, para el modelo. */
function describeProfile(lookup: TargetsLookup, today: string) {
  const p = lookup.profile;
  const perfil = p
    ? {
        sexo: p.sex,
        edad: p.birthDate ? ageOn(p.birthDate, today) : null,
        fecha_nacimiento: p.birthDate,
        estatura_cm: p.heightCm,
        peso_declarado_kg: p.weightKg,
        grasa_pct: p.bodyFatPct,
        grasa_estimada: p.bodyFatEstimate,
        actividad: p.activity,
        pasos_dia: p.stepsPerDay,
        dias_entreno_semana: p.trainingDaysPerWeek,
        minutos_sesion: p.sessionMinutes,
        estilo_alimentacion: p.dietStyle,
        evitar_alimentos: p.avoidFoods,
        comidas_al_dia: p.mealsPerDay,
        objetivo: p.phase,
      }
    : null;
  if (!lookup.ok) return { perfil, perfil_incompleto: true, faltan: lookup.missing };
  const t = lookup.targets;
  return {
    perfil,
    objetivos_diarios: { kcal: t.kcal, proteina_g: t.protein_g, grasa_g: t.fat_g, carbohidratos_g: t.carb_g, fibra_g: t.fiber_g, agua_l: t.water_l },
    calculo: {
      gasto_en_reposo_kcal: t.rmr,
      mantenimiento_kcal: t.tdee,
      ajuste_por_objetivo_kcal: t.basis.phaseKcal,
      minimo_seguro_kcal: t.minKcal,
      peso_usado_kg: t.basis.weightKg,
      masa_magra_kg: t.basis.ffmKg,
      entrenos_por_semana: t.basis.sessionsPerWeek,
      entrenos_segun: t.basis.sessionsSource,
      kcal_entreno_por_dia: t.basis.trainingKcalPerDay,
      nota: "El mantenimiento es una estimación ±10 %; se ajusta con el peso real después de 2–3 semanas de registro.",
    },
    avisos: t.warnings,
  };
}

/** Pasa los nombres en español del chat al formato del perfil. */
function toPatch(args: Record<string, unknown>): ProfilePatch {
  const patch: ProfilePatch = {};
  const has = (k: string) => args[k] !== undefined && args[k] !== null;
  if (has("sexo")) patch.sex = args.sexo as "M" | "F";
  if (has("fecha_nacimiento")) patch.birthDate = String(args.fecha_nacimiento);
  if (has("estatura_cm")) patch.heightCm = Number(args.estatura_cm);
  if (has("peso_kg")) patch.weightKg = Number(args.peso_kg);
  if (has("grasa_pct")) patch.bodyFatPct = Number(args.grasa_pct);
  if (has("grasa_estimada")) patch.bodyFatEstimate = args.grasa_estimada as ProfilePatch["bodyFatEstimate"];
  if (has("actividad")) patch.activity = args.actividad as ProfilePatch["activity"];
  if (has("pasos_dia")) patch.stepsPerDay = Number(args.pasos_dia);
  if (has("dias_entreno_semana")) patch.trainingDaysPerWeek = Number(args.dias_entreno_semana);
  if (has("minutos_sesion")) patch.sessionMinutes = Number(args.minutos_sesion);
  if (has("estilo_alimentacion")) patch.dietStyle = args.estilo_alimentacion as ProfilePatch["dietStyle"];
  if (Array.isArray(args.evitar_alimentos)) patch.avoidFoods = args.evitar_alimentos.map(String);
  if (has("comidas_al_dia")) patch.mealsPerDay = Number(args.comidas_al_dia);
  const o = args.objetivo as Record<string, unknown> | undefined;
  if (o && typeof o === "object") {
    patch.phase = {
      ...(o.tipo ? { type: o.tipo as NonNullable<NutritionProfile["phase"]>["type"] } : {}),
      ...(typeof o.ritmo_pct_semana === "number" ? { ratePctPerWeek: o.ritmo_pct_semana } : {}),
      ...(typeof o.inicio === "string" ? { start: o.inicio } : {}),
      ...(o.fin !== undefined ? { end: (o.fin as string | null) ?? null } : {}),
      ...(typeof o.descripcion === "string" ? { objective: o.descripcion } : {}),
    };
  }
  return patch;
}

type Args = Record<string, unknown>;
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
const numOrNull = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

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
        const text = `${old.text}\nCorrección: ${correction}`;
        const draft = await makeDraft(ctx, text, old.date, old.moment, old.replacesMealId, old.id);
        return presentDraft(ctx, draft, null);
      }
      if (mealId) {
        const meal = await ctx.store.getMeal(mealId);
        if (!meal) return { error: "No encontré esa comida" };
        const text = `${meal.text}\nCorrección: ${correction}`;
        const draft = await makeDraft(ctx, text, meal.date, meal.moment, meal.id);
        return presentDraft(ctx, draft, null);
      }
      return { error: "Indica borrador_id o comida_id" };
    }
    case "guardar_comida": {
      let draft = await ctx.store.getDraft(String(args.borrador_id ?? ""));
      if (!draft) {
        // El modelo a veces copia mal el id: si hay UN solo borrador pendiente de un turno anterior, es ese.
        const pending = (await ctx.store.listDrafts(ctx.threadId)).filter((d) => d.items.length > 0 && d.turnId !== ctx.turnId);
        if (pending.length === 1) draft = pending[0];
      }
      if (!draft) return { error: "Ese borrador ya no existe (venció o ya se guardó)" };
      if (draft.turnId === ctx.turnId) {
        return { error: "No se puede guardar en el mismo turno en que se analizó. Muestra el resumen y espera el sí." };
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
        ...(draft.recipeId ? { recipeId: draft.recipeId } : {}),
        createdAt: draft.createdAt,
        updatedAt: now,
      };
      if (draft.replacesMealId) {
        const old = await ctx.store.getMeal(draft.replacesMealId);
        if (old) meal.createdAt = old.createdAt;
      }
      await ctx.store.saveMeal(meal);
      await ctx.store.deleteDraft(draft.id);
      if (draft.recipeId && !draft.replacesMealId) await ctx.kitchen?.markCooked(draft.recipeId, meal.date).catch(() => undefined);
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
        instruccion: "Pregunta si de verdad la borras. Solo si dice que sí, vuelve a llamar borrar_comida en el siguiente turno.",
      };
    }
    case "resumen_dia": {
      const date = str(args.fecha) ?? today;
      const day = await dayStatus(ctx, date);
      const t = day.lookup.ok ? day.lookup.targets : null;
      return {
        fecha: date,
        ...day.resumen,
        grasa_g: r(day.eaten.fat_g),
        carbohidratos_g: r(day.eaten.carb_g),
        fibra_g: r(day.eaten.fiber_g),
        ...(t ? { objetivo_grasa_g: t.fat_g, objetivo_carbohidratos_g: t.carb_g, objetivo_fibra_g: t.fiber_g } : {}),
        comidas: day.meals.map((m) => ({ comida_id: m.id, hora: m.time, momento: m.moment, texto: m.text, kcal: m.totals.kcal, proteina_g: r(m.totals.protein_g) })),
      };
    }
    case "consultar_opciones": {
      const options = Array.isArray(args.opciones) ? args.opciones.map(String).slice(0, 4) : [];
      if (!options.length) return { error: "Faltan las opciones" };
      const day = await dayStatus(ctx, today);
      const left = "restante_kcal" in day.resumen ? day.resumen.restante_kcal : null;
      const analyzed = await Promise.all(
        options.map(async (o) => {
          const { totals } = toStored(await ctx.analyze(o));
          return { opcion: o, kcal: totals.kcal, proteina_g: r(totals.protein_g), grasa_g: r(totals.fat_g), carbohidratos_g: r(totals.carb_g), alcohol_g: totals.alcohol_g, ...(left != null ? { quedaria_kcal: left - totals.kcal } : {}) };
        }),
      );
      return {
        restante_hoy: day.resumen,
        objetivo: day.lookup.profile?.phase?.type ?? null,
        opciones: analyzed,
        instruccion: "Compara y recomienda una según su objetivo (déficit: más proteína por kcal y no pasarse; volumen: llegar a las kcal con proteína suficiente). No guardes nada.",
      };
    }
    case "plan_comidas": {
      if (ctx.kitchen) {
        const plan = await ctx.kitchen.plan();
        const comidas = (plan?.comidas as { receta: unknown }[] | undefined) ?? [];
        if (plan && comidas.some((c) => c.receta)) {
          return {
            con_recetas: true,
            ...plan,
            instruccion:
              "La app muestra una tarjeta con las recetas (cada una abre la receta con sus pasos). Da en pocas líneas la idea del día: qué cocinar en cada comida y, si le falta algo, qué comprar. Si quiere otra opción, usa buscar_recetas.",
          };
        }
      }
      const day = await dayStatus(ctx, today);
      if (!day.lookup.ok) return { error: "Faltan datos del perfil para planear", faltan: day.lookup.missing };
      if (!ctx.nutrientsOf) return { error: "La base de alimentos no está disponible" };
      const plan = buildMealPlan({
        profile: day.lookup.profile,
        targets: day.lookup.targets,
        eaten: { kcal: day.eaten.kcal, protein_g: day.eaten.protein_g },
        mealsEaten: day.meals.length,
        nutrientsOf: ctx.nutrientsOf,
      });
      return {
        ...plan,
        instruccion:
          "Presenta las opciones como comidas colombianas normales (ej. 'pechuga a la plancha 150 g + arroz 120 g + ensalada'), con kcal y proteína de cada una. Puede cambiar alimentos por equivalentes; si pide otra cosa, usa consultar_opciones para calcularla.",
      };
    }
    case "buscar_recetas": {
      if (!ctx.kitchen) return { error: "El recetario no está disponible" };
      const kind = ["desayuno", "comida", "snack"].includes(String(args.tipo)) ? (args.tipo as "desayuno" | "comida" | "snack") : null;
      const recetas = await ctx.kitchen.search(str(args.texto), kind, args.solo_listas === true);
      return {
        recetas,
        instruccion: recetas.length
          ? "La app muestra una tarjeta con las recetas. Recomienda 1–2 en pocas líneas (lo que tiene en casa y su objetivo). Si quiere registrarla después de comerla, usa registrar_receta."
          : "No hay recetas con eso. Ofrece buscar sin filtros o revisar la despensa en Planes.",
      };
    }
    case "actualizar_despensa": {
      if (!ctx.kitchen) return { error: "La despensa no está disponible" };
      const add = str(args.agregar);
      const remove = str(args.quitar);
      if (!add && !remove) return { error: "No hay nada para agregar ni quitar" };
      const res = await ctx.kitchen.pantry(add, remove);
      return {
        ...res,
        instruccion:
          res.agregados.length || res.quitados.length
            ? "Confirma en una línea qué quedó en la despensa y cuántas recetas puede hacer ya."
            : "No reconocí esos ingredientes en el catálogo: pide que los marque en Planes → Despensa.",
      };
    }
    case "sugerir_snack": {
      if (!ctx.kitchen) return { error: "El recetario no está disponible" };
      return { ...(await ctx.kitchen.snacks()), instruccion: "La app muestra una tarjeta con los snacks. Recomienda uno en una o dos líneas." };
    }
    case "registrar_receta": {
      if (!ctx.kitchen) return { error: "El recetario no está disponible" };
      const id = str(args.receta_id);
      if (!id) return { error: "Falta la receta" };
      const servings = Math.min(4, Math.max(0.25, numOrNull(args.porciones) ?? 1));
      const meal = await ctx.kitchen.recipeMeal(id, servings, args.ajustada !== false);
      if ("candidatas" in meal) return { error: "No sé cuál de estas recetas es", candidatas: meal.candidatas };
      const now = ctx.now ?? new Date();
      const time = timeInBogota(now);
      const draft: MealDraft = {
        id: newId(),
        date: today,
        time,
        moment: meal.kind === "desayuno" ? "desayuno" : meal.kind === "snack" ? "snack" : time < "16:30" ? "almuerzo" : "cena",
        text: meal.text,
        items: meal.items,
        totals: meal.totals,
        engineVersion: "receta-1",
        chatThreadId: ctx.threadId,
        recipeId: meal.recipeId,
        createdAt: now.toISOString(),
        turnId: ctx.turnId,
        replacesMealId: null,
        expiresAt: draftExpiry(now.getTime()),
      };
      await ctx.store.saveDraft(draft);
      return presentDraft(ctx, draft, null);
    }
    case "proponer_receta": {
      if (!ctx.kitchen) return { error: "El recetario no está disponible" };
      const kind = ["desayuno", "comida", "snack"].includes(String(args.tipo)) ? (args.tipo as "desayuno" | "comida" | "snack") : null;
      return {
        ...(await ctx.kitchen.propose(kind, str(args.deseo))),
        instruccion: "La app muestra la receta en una tarjeta. Cuéntala en 2–3 líneas (por qué le sirve) y dile que quedó en su recetario como 'Por probar' para cocinarla en modo paso a paso.",
      };
    }
    case "guardar_receta": {
      if (!ctx.kitchen) return { error: "El recetario no está disponible" };
      const text = str(args.texto);
      if (!text) return { error: "Falta la receta" };
      return { ...(await ctx.kitchen.saveText(text)), instruccion: "Confirma que quedó guardada con sus kcal y proteína por porción; menciona los avisos si los hay." };
    }
    case "ver_perfil": {
      return describeProfile(await ctx.targetsFor(today), today);
    }
    case "actualizar_perfil": {
      const patch = toPatch(args);
      if (!Object.keys(patch).length) return { error: "No hay cambios para guardar" };
      const current = await ctx.store.getProfile();
      const { profile, errors } = applyProfilePatch(current, patch, today);
      if (errors.length) return { error: "No guardé nada", problemas: errors };
      await ctx.store.saveProfile(profile);
      return { guardado: true, ...describeProfile(await ctx.targetsFor(today), today) };
    }
    case "registrar_peso": {
      const kg = numOrNull(args.peso_kg);
      if (kg == null || kg < 35 || kg > 250) return { error: "El peso debe estar entre 35 y 250 kg" };
      const date = str(args.fecha) ?? today;
      if (ctx.logWeight) await ctx.logWeight(date, Math.round(kg * 10) / 10);
      const { profile } = applyProfilePatch(await ctx.store.getProfile(), { weightKg: kg }, today);
      await ctx.store.saveProfile(profile);
      return { registrado: true, fecha: date, peso_kg: kg, ...describeProfile(await ctx.targetsFor(today), today) };
    }
    case "registrar_medidas": {
      const date = str(args.fecha) ?? today;
      const m = {
        id: newId(),
        date,
        waistCm: numOrNull(args.cintura_cm),
        neckCm: numOrNull(args.cuello_cm),
        bicepsCm: numOrNull(args.biceps_cm),
        thighCm: numOrNull(args.muslo_cm),
        hipCm: numOrNull(args.cadera_cm),
        notes: "",
      };
      if ([m.waistCm, m.neckCm, m.bicepsCm, m.thighCm, m.hipCm].every((v) => v == null)) return { error: "No hay medidas para guardar" };
      if ([m.waistCm, m.neckCm, m.bicepsCm, m.thighCm, m.hipCm].some((v) => v != null && (v < 15 || v > 200))) return { error: "Alguna medida no tiene sentido (debe estar entre 15 y 200 cm)" };
      await ctx.store.saveMeasurement(m);
      const profile = await ctx.store.getProfile();
      const bf =
        profile?.sex && profile.heightCm && m.waistCm && m.neckCm ? navyBodyFat(profile.sex, profile.heightCm, m.waistCm, m.neckCm, m.hipCm) : null;
      return {
        guardadas: true,
        fecha: date,
        ...(bf != null
          ? {
              grasa_estimada_pct: bf,
              instruccion: "Dile la estimación (±3–4 puntos, sirve para ver la tendencia). Pregunta si quiere usarla en su perfil; si dice que sí, llama actualizar_perfil con grasa_pct.",
            }
          : {}),
        ...(profile?.sex === "F" && !m.hipCm ? { nota: "Para estimar la grasa en mujeres también hace falta la cadera." } : {}),
      };
    }
    default:
      return { error: `Herramienta desconocida: ${name}` };
  }
}

/** Bloque de contexto para el asistente: perfil/objetivos, el día, la semana y los borradores. */
export async function buildNutritionContext(ctx: ToolContext): Promise<string> {
  const now = ctx.now ?? new Date();
  const today = todayInBogota(now);
  const weekAgo = todayInBogota(new Date(now.getTime() - 6 * 86400000));
  const [day, week, drafts] = await Promise.all([dayStatus(ctx, today), ctx.store.listMeals(weekAgo, today), ctx.store.listDrafts(ctx.threadId)]);
  const lines = [`Hoy es ${today}, ${timeInBogota(now)} (hora de Colombia).`];

  if (!day.lookup.ok) {
    const p = day.lookup.profile;
    lines.push(
      `PERFIL INCOMPLETO. Faltan: ${day.lookup.missing.join(", ")}.`,
      p ? `Lo que ya sabemos: ${JSON.stringify(describeProfile(day.lookup, today).perfil)}` : "Es una persona nueva: todavía no hay perfil.",
    );
  } else {
    const { targets: t, profile: p } = day.lookup;
    const phase = p.phase!;
    const rates = PHASE_RATES[phase.type];
    lines.push(
      `Objetivo: ${phase.type}${rates.max ? ` a ${phase.ratePctPerWeek} % del peso por semana` : ""} desde ${phase.start}${phase.end ? ` hasta ${phase.end}` : ""}.${phase.objective ? ` Meta: ${phase.objective}.` : ""}`,
      `Estilo: ${p.dietStyle}${p.avoidFoods.length ? `; no come: ${p.avoidFoods.join(", ")}` : ""}; ${p.mealsPerDay} comidas al día.`,
      `Objetivos diarios: ${t.kcal} kcal, ${t.protein_g} g proteína, ${t.fat_g} g grasa, ${t.carb_g} g carbohidratos, ${t.fiber_g} g fibra, ${t.water_l} L de agua. Mantenimiento estimado ${t.tdee} kcal (±10 %), peso usado ${t.basis.weightKg} kg.`,
      `Hoy lleva: ${day.eaten.kcal} kcal y ${r(day.eaten.protein_g)} g de proteína (${day.meals.length} comidas). Le quedan ${t.kcal - day.eaten.kcal} kcal y ${r(t.protein_g - day.eaten.protein_g)} g de proteína.`,
    );
  }

  const byDay = new Map<string, Meal[]>();
  for (const m of week) byDay.set(m.date, [...(byDay.get(m.date) ?? []), m]);
  const days = [...byDay.entries()].map(([d, ms]) => {
    const tot = sumTotals(ms);
    return `${d}: ${tot.kcal} kcal, ${r(tot.protein_g)} g prot${tot.alcohol_g > 0 ? `, ${tot.alcohol_g} g alcohol` : ""}${tot.alcohol_g > PARTY_ETHANOL_G ? " (FIESTA)" : ""}`;
  });
  lines.push(days.length ? `Últimos 7 días registrados:\n${days.join("\n")}` : "Aún no hay comidas registradas esta semana.");
  const pending = drafts.filter((d) => d.items.length > 0);
  lines.push(
    pending.length
      ? `Borradores pendientes de confirmar en este chat:\n${pending.map((d) => `- borrador_id ${d.id}: "${d.text.slice(0, 80)}" = ${d.totals.kcal} kcal`).join("\n")}`
      : "No hay borradores pendientes.",
  );
  return lines.join("\n");
}

export const NUTRITION_PROMPT = `
PERFIL Y OBJETIVO:
- Si el contexto dice PERFIL INCOMPLETO, primero ayuda a completarlo, con calidez y de a 2–3 preguntas por mensaje: objetivo (bajar grasa, mantener, recomponer o subir de peso/volumen y si tiene fecha), sexo, edad o fecha de nacimiento, estatura, peso, cómo es su día (oficina, de pie, caminando), cuántos días entrena y cuánto dura, y si sabe su % de grasa o cómo se ve. Pregunta también si es vegetariano o hay algo que no coma. Guarda cada respuesta con actualizar_perfil apenas la tengas.
- Cuando esté completo, usa ver_perfil y explica en simple: cuánto gasta al día, cuánto comer, cuánta proteína y por qué; y ofrece armar el plan del día (plan_comidas).
- Si pide cambiar de objetivo ("quiero hacer volumen", "quiero un déficit más suave"), usa actualizar_perfil con el nuevo objetivo y explica cómo cambian sus números. Recomienda ritmos seguros: déficit 0,5–1 % del peso por semana; volumen 0,25–0,5 %. Si tiene mucha grasa y pide volumen, sugiere primero déficit o recomposición, pero respeta su decisión.
- "Hoy pesé X" → registrar_peso. Medidas con cinta → registrar_medidas.
- "¿Qué como?", "¿qué ceno?", "arma mi día" → plan_comidas (usa su recetario y su despensa).

RECETAS Y DESPENSA (Planes):
- "¿Qué puedo cocinar?", "una receta con pollo", "algo rápido" → buscar_recetas. Prefiere las que puede hacer ya.
- "Tengo hambre", "¿qué pico?" entre comidas → sugerir_snack.
- "Compré…", "se me acabó…" → actualizar_despensa.
- "Invéntame una receta", "¿qué hago con lo que tengo?" → proponer_receta. "Guarda mi receta de…" (con ingredientes) → guardar_receta.
- "Hice/comí <receta del recetario>" (pericos, pancakes de avena, bowl mexicano…) → registrar_receta con su id o su nombre, NO analizar_comida. Es un borrador: igual que una comida, pregunta "¿Lo guardo?".
- No todos son expertos en cocina: si pregunta cómo se hace algo, explica en pasos cortos o sugiere abrir la receta en modo cocinar.

REGISTRO DE COMIDAS:
- Si cuenta algo que comió o bebió, llama analizar_comida con su texto tal cual. La app muestra una TARJETA con cada alimento, gramos, kcal y el total: tu texto debe ser corto (1–3 líneas): los supuestos importantes, cómo queda el día y termina preguntando "¿Lo guardo?". No repitas la lista de alimentos. Si hay pregunta_sugerida, inclúyela. Si el perfil está incompleto, igual se puede registrar.
- Con plan_comidas y consultar_opciones la app también muestra tarjetas: no repitas todos los números, da la recomendación en pocas líneas.
- Si responde que sí (sí, dale, guárdalo, listo…) a un borrador pendiente, llama guardar_comida con ese borrador_id. Si corrige algo, corregir_comida y vuelve a mostrar el resumen. Si dice que no, descartar_borrador.
- Nunca digas que guardaste algo si la herramienta no respondió guardada/guardado = true.
- Si pregunta qué pedir o compara opciones de un menú, usa consultar_opciones (no guarda nada). Si pregunta cómo va, resumen_dia.
- Fiestas: el alcohol cuenta en las kcal del día. Si hubo un día de fiesta esta semana, sugiere repartir el exceso en los 3–4 días siguientes bajando grasa y carbohidratos, NUNCA la proteína, y sin ayunar.
- Si solo pregunta por un alimento ("¿cuánta proteína tiene un huevo?"), responde sin crear borradores.
- Respuestas cortas y en español simple. Números redondos (sin decimales en kcal ni proteína). Nunca muestres kcal negativas: si se pasa, di "te pasarías X kcal".`;
