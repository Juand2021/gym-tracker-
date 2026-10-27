import { structuredCompletion, type AiClient } from "../ai-client.ts";
import { normalize } from "../engine/text.ts";
import type { DietStyle } from "../profile.ts";
import { INGREDIENTS, INGREDIENT_BY_KEY } from "./ingredients.ts";
import { ALL_EQUIPMENT, type Equipment, type Recipe, type RecipeIngredient, type RecipeKind, type RecipeSource, type RecipeTag, type ScaleRole } from "./recipes.ts";

/**
 * Recetas propias y de la IA (docs/nutricion/06-planes-recetas.md §3).
 * La IA solo estructura la receta con ingredientes del catálogo y gramos crudos;
 * las kcal las calcula el código, igual que con la biblioteca.
 */

const KINDS: RecipeKind[] = ["desayuno", "comida", "snack"];
const TAGS: RecipeTag[] = ["alta-proteina", "meal-prep", "dulce", "salado", "sin-cocinar", "vegetariana", "colombiana", "rapida"];
const ROLES: ScaleRole[] = ["protein", "carb", "fat"];

/** Lo que devuelve el modelo (nombres en español para que sea natural). */
export type RawRecipe = {
  nombre: string;
  descripcion: string;
  tipo: string;
  porciones: number;
  minutos: number;
  dificultad: number;
  equipo: string[];
  etiquetas: string[];
  ingredientes: { clave: string; gramos: number; opcional: boolean; ajuste: string | null; nota: string | null }[];
  pasos: { texto: string; minutos_temporizador: number | null }[];
  consejos: string[];
  /** Ingredientes que la persona nombró y no están en el catálogo. */
  sin_catalogo: string[];
};

const INGREDIENT_KEYS = INGREDIENTS.map((i) => i.key);

export const RECIPE_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: ["nombre", "descripcion", "tipo", "porciones", "minutos", "dificultad", "equipo", "etiquetas", "ingredientes", "pasos", "consejos", "sin_catalogo"],
  properties: {
    nombre: { type: "string" },
    descripcion: { type: "string" },
    tipo: { type: "string", enum: KINDS },
    porciones: { type: "integer" },
    minutos: { type: "integer" },
    dificultad: { type: "integer", enum: [1, 2, 3] },
    equipo: { type: "array", items: { type: "string", enum: ALL_EQUIPMENT } },
    etiquetas: { type: "array", items: { type: "string", enum: TAGS } },
    ingredientes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["clave", "gramos", "opcional", "ajuste", "nota"],
        properties: {
          clave: { type: "string", enum: INGREDIENT_KEYS },
          gramos: { type: "number" },
          opcional: { type: "boolean" },
          ajuste: { type: ["string", "null"], enum: [...ROLES, null] },
          nota: { type: ["string", "null"] },
        },
      },
    },
    pasos: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["texto", "minutos_temporizador"],
        properties: { texto: { type: "string" }, minutos_temporizador: { type: ["integer", "null"] } },
      },
    },
    consejos: { type: "array", items: { type: "string" } },
    sin_catalogo: { type: "array", items: { type: "string" } },
  },
};

/** Catálogo para el modelo: clave, nombre y cuánto pesa una unidad o medida. */
function catalogText(keys?: Set<string>): string {
  return INGREDIENTS.filter((i) => !keys || keys.has(i.key) || i.staple)
    .map((i) => {
      const u = i.unit ? ` (1 ${i.unit.one} = ${i.unit.grams} g)` : i.measure ? ` (1 ${i.measure.one} = ${i.measure.grams} g)` : "";
      return `${i.key}: ${i.name}${u}${i.staple ? " [básico]" : ""}`;
    })
    .join("\n");
}

const RULES = `Reglas de la receta:
- Usa SOLO claves del catálogo. Los gramos son de ingrediente CRUDO (como se compra), para TODAS las porciones.
- Convierte medidas caseras a gramos con el catálogo (1 huevo = 50 g, 1 taza de avena = 90 g…).
- Aceite: la cantidad real en cucharaditas (1 cucharadita = 4,5 g), sin exagerar.
- "ajuste": marca "protein" en la fuente principal de proteína, "carb" en el carbohidrato principal (arroz, arepa, avena, papa, pan…) y "fat" solo si la grasa es protagonista (aguacate, maní). El resto null.
- Pasos cortos y claros para alguien que NO sabe cocinar: fuego, tiempos, cómo saber que está listo. Pon minutos_temporizador cuando haya que esperar.
- Si la persona nombró ingredientes que no están en el catálogo, ponlos en sin_catalogo y usa el más parecido del catálogo solo si es casi lo mismo.
- "nota": máximo 3 palabras sobre cómo va cortado o preparado (picado, en cubos, rallado) o null. No repitas la cantidad.
- "descripcion": UNA línea corta (máximo 90 caracteres) que diga por qué vale la pena.
- Español de Colombia, sin tecnicismos.`;

/** Lee una receta escrita por la persona ("mi receta de pollo al curry: 200 g de pollo…"). */
export function parseOwnRecipe(ai: AiClient, text: string): Promise<RawRecipe> {
  return structuredCompletion<RawRecipe>(ai, {
    system: `Conviertes una receta escrita por una persona en datos estructurados para su app de nutrición.\n${RULES}\nRespeta la receta: no inventes ingredientes ni cambies cantidades; si falta la cantidad de algo, usa una porción normal colombiana.\n\nCatálogo (clave: nombre):\n${catalogText()}`,
    user: text,
    schemaName: "receta",
    schema: RECIPE_SCHEMA,
    reasoningEffort: "low",
  });
}

export type ProposeInput = {
  kind: RecipeKind | null;
  wish: string | null;
  pantry: string[];
  equipment: Equipment[];
  dietStyle: DietStyle;
  avoidFoods: string[];
  /** Meta aproximada de una porción. */
  target: { kcal: number; protein_g: number } | null;
  /** Nombres de recetas que ya tiene (para no repetir). */
  existing: string[];
};

/** Propone una receta NUEVA con lo que hay en casa. */
export function proposeRecipe(ai: AiClient, input: ProposeInput): Promise<RawRecipe> {
  const pantry = new Set(input.pantry);
  const equipment = input.equipment.length ? input.equipment.map((e) => ({ estufa: "estufa", airfryer: "air fryer", licuadora: "licuadora" })[e]).join(", ") : "ninguno (sin cocinar)";
  const user = [
    `Tipo: ${input.kind ?? "el que mejor quede con lo que hay"}.`,
    input.wish ? `Lo que quiere: ${input.wish}.` : "",
    `Equipo disponible: ${equipment}. No uses otro.`,
    `Estilo: ${input.dietStyle}.${input.avoidFoods.length ? ` No come: ${input.avoidFoods.join(", ")}.` : ""}`,
    input.target ? `Meta de UNA porción: ~${input.target.kcal} kcal y ~${input.target.protein_g} g de proteína.` : "",
    input.existing.length ? `Ya tiene estas recetas (propón algo distinto): ${input.existing.slice(0, 60).join("; ")}.` : "",
  ]
    .filter(Boolean)
    .join("\n");
  return structuredCompletion<RawRecipe>(ai, {
    system: `Eres cocinero y nutricionista colombiano. Propones UNA receta nueva, fácil (máximo 25 minutos y pocos pasos), rica y alta en proteína, para alguien que no es experto en cocina.\n${RULES}\nUsa SOLO ingredientes de la lista (lo que tiene en casa) más los básicos. Una porción por persona salvo que sea meal prep.\n\nLo que tiene en casa (clave: nombre):\n${catalogText(pantry)}`,
    user,
    schemaName: "receta",
    schema: RECIPE_SCHEMA,
    reasoningEffort: "low",
  });
}

const clampInt = (x: unknown, lo: number, hi: number, dflt: number) => {
  const n = Math.round(Number(x));
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : dflt;
};

/** Corta en una palabra completa con "…". */
export function shorten(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 20)).replace(/[,;:.\s]+$/, "")}…`;
}

export function slugify(text: string): string {
  return (
    normalize(text)
      .replace(/[^a-z0-9 ]/g, "")
      .trim()
      .split(" ")
      .slice(0, 6)
      .join("-") || "receta"
  );
}

/**
 * Deja una receta lista para guardar: ingredientes del catálogo, gramos con sentido,
 * equipo conocido y al menos un ingrediente que se pueda ajustar. Devuelve también los avisos.
 */
export function sanitizeRecipe(raw: RawRecipe, source: RecipeSource, id?: string): { recipe: Recipe; warnings: string[] } {
  const warnings: string[] = [];
  const kind = KINDS.includes(raw.tipo as RecipeKind) ? (raw.tipo as RecipeKind) : "comida";
  const servings = clampInt(raw.porciones, 1, 8, 1);
  const seen = new Map<string, RecipeIngredient>();
  for (const x of raw.ingredientes ?? []) {
    const ing = INGREDIENT_BY_KEY.get(x.clave);
    if (!ing) {
      warnings.push(`Ingrediente desconocido: ${x.clave}`);
      continue;
    }
    const grams = Number(x.gramos);
    if (!Number.isFinite(grams) || grams <= 0) continue;
    const perServing = grams / servings;
    if (perServing > 900) {
      warnings.push(`${ing.name}: ${Math.round(perServing)} g por porción es demasiado; lo dejé en 900 g`);
    }
    const g = Math.round(Math.min(grams, 900 * servings) * 10) / 10;
    const prev = seen.get(ing.key);
    if (prev) {
      prev.grams += g;
      continue;
    }
    seen.set(ing.key, {
      key: ing.key,
      grams: g,
      ...(x.opcional ? { optional: true } : {}),
      ...(ROLES.includes(x.ajuste as ScaleRole) && !ing.staple ? { scale: x.ajuste as ScaleRole } : {}),
      ...(x.nota && String(x.nota).trim() ? { note: shorten(String(x.nota).trim().replace(/[.]+$/, ""), 28) } : {}),
    });
  }
  const ingredients = [...seen.values()];
  if (!ingredients.length) throw new Error("La receta no tiene ingredientes que reconozca");
  // Al menos un ingrediente ajustable: la primera proteína y el primer carbohidrato (por su sección).
  if (!ingredients.some((i) => i.scale)) {
    const protein = ingredients.find((i) => !i.optional && ["proteinas", "lacteos"].includes(INGREDIENT_BY_KEY.get(i.key)!.group));
    const carb = ingredients.find((i) => !i.optional && INGREDIENT_BY_KEY.get(i.key)!.group === "granos");
    if (protein) protein.scale = "protein";
    if (carb) carb.scale = "carb";
    if (!protein && !carb) ingredients[0].scale = "carb";
  }
  for (const s of raw.sin_catalogo ?? []) if (s.trim()) warnings.push(`No está en el catálogo: ${s.trim()} (no cuenta en las kcal)`);
  const steps = (raw.pasos ?? [])
    .filter((p) => p.texto?.trim())
    .slice(0, 14)
    .map((p) => ({ text: p.texto.trim(), ...(p.minutos_temporizador && p.minutos_temporizador > 0 ? { timerMin: clampInt(p.minutos_temporizador, 1, 180, 5) } : {}) }));
  if (!steps.length) steps.push({ text: "Prepara los ingredientes como de costumbre." });
  const name = (raw.nombre ?? "").trim().slice(0, 70) || "Mi receta";
  const now = new Date().toISOString();
  return {
    recipe: {
      id: id ?? `${source}-${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      description: shorten((raw.descripcion ?? "").trim(), 120),
      kind,
      servings,
      minutes: clampInt(raw.minutos, 1, 240, 20),
      difficulty: clampInt(raw.dificultad, 1, 3, 1) as 1 | 2 | 3,
      equipment: [...new Set((raw.equipo ?? []).filter((e): e is Equipment => ALL_EQUIPMENT.includes(e as Equipment)))],
      tags: [...new Set((raw.etiquetas ?? []).filter((t): t is RecipeTag => TAGS.includes(t as RecipeTag)))],
      ingredients,
      steps,
      ...(raw.consejos?.length ? { tips: raw.consejos.filter((t) => t.trim()).slice(0, 4) } : {}),
      source,
      createdAt: now,
      updatedAt: now,
    },
    warnings,
  };
}

/** Pasa una receta guardada al formato del modelo (para editarla o re-validarla). */
export function toRaw(r: Recipe): RawRecipe {
  return {
    nombre: r.name,
    descripcion: r.description,
    tipo: r.kind,
    porciones: r.servings,
    minutos: r.minutes,
    dificultad: r.difficulty,
    equipo: r.equipment,
    etiquetas: r.tags,
    ingredientes: r.ingredients.map((i) => ({ clave: i.key, gramos: i.grams, opcional: Boolean(i.optional), ajuste: i.scale ?? null, nota: i.note ?? null })),
    pasos: r.steps.map((s) => ({ texto: s.text, minutos_temporizador: s.timerMin ?? null })),
    consejos: r.tips ?? [],
    sin_catalogo: [],
  };
}

/** Una receta por id o por nombre ("los pericos" → Huevos pericos con arepa). */
export function resolveRecipe(recipes: Recipe[], idOrName: string): Recipe | { candidatas: string[] } {
  const byId = recipes.find((r) => r.id === idOrName);
  if (byId) return byId;
  const words = normalize(idOrName)
    .split(" ")
    .filter((w) => w.length > 2 && !["los", "las", "con", "del", "receta", "mis", "unos", "unas"].includes(w))
    .map((w) => w.replace(/s$/, ""));
  if (!words.length) return { candidatas: [] };
  const scored = recipes
    .map((r) => {
      const name = normalize(r.name);
      return { r, hits: words.filter((w) => name.includes(w)).length };
    })
    .filter((x) => x.hits > 0)
    .sort((a, b) => b.hits - a.hits);
  if (scored.length && (scored.length === 1 || scored[0].hits > scored[1].hits)) return scored[0].r;
  return { candidatas: scored.slice(0, 4).map((x) => `${x.r.id}: ${x.r.name}`) };
}
