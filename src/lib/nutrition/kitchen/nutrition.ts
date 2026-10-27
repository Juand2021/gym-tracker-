import { ZERO, round, scale, sum } from "../engine/compute.ts";
import type { FoodDb } from "../engine/db.ts";
import type { Nutrients } from "../engine/types.ts";
import { INGREDIENT_BY_KEY, type Ingredient } from "./ingredients.ts";
import type { Recipe, RecipeIngredient, ScaleRole } from "./recipes.ts";

/**
 * Nutrientes de una receta (por porción), calculados en código con la base de alimentos.
 * Se suman los ingredientes crudos y se divide por las porciones: Juan no pesa la comida cocinada,
 * así que no hace falta el factor de rendimiento de cocción.
 */

export type Per100gOf = (ing: Ingredient) => Nutrients | undefined;

/** Nutrientes por 100 g de un ingrediente: registro de la base, alimento del núcleo o valores propios. */
export function per100gFromDb(db: FoodDb): Per100gOf {
  return (ing) => {
    if (ing.per100g) return ing.per100g;
    if (ing.ref) return db.byId.get(ing.ref)?.per100g;
    if (ing.core) return db.resolveCore(ing.core)?.per100g;
    return undefined;
  };
}

export type RecipeLine = {
  key: string;
  name: string;
  /** Gramos para las porciones pedidas. */
  grams: number;
  amount: string;
  optional: boolean;
  included: boolean;
  scale: ScaleRole | null;
  note: string | null;
  staple: boolean;
  /** Reemplazo usado (por la despensa o por la dieta). */
  swappedFrom: string | null;
  kcal: number;
  protein_g: number;
  /** El ingrediente no está en el catálogo o en la base (sus kcal cuentan 0). */
  unknown: boolean;
};

export type RecipeNutrition = { servings: number; totals: Nutrients; lines: RecipeLine[]; unknown: string[] };

export type NutritionOpts = {
  /** Porciones que se van a comer (por defecto 1). */
  servings?: number;
  /** Opcionales que sí se incluyen. */
  withOptional?: Iterable<string>;
  /** Reemplazos: clave original → clave usada. */
  swaps?: Record<string, string>;
  /** Gramos por porción ya ajustados (scale.ts); si falta una clave se usa la receta. */
  gramsPerServing?: Record<string, number>;
};

const FRACTIONS: [number, string][] = [
  [0.25, "¼"],
  [0.5, "½"],
  [0.75, "¾"],
];

/** 1.5 → "1½", 0.25 → "¼", 2 → "2". */
export function fraction(n: number): string {
  const whole = Math.floor(n + 1e-9);
  const rest = n - whole;
  const f = FRACTIONS.find(([v]) => Math.abs(v - rest) < 0.01)?.[1] ?? "";
  if (!f) return String(Math.round(n * 100) / 100).replace(".", ",");
  return whole ? `${whole}${f}` : f;
}

const roundTo = (x: number, step: number) => Math.round(x / step) * step;

/** Gramos "de cocina": las unidades enteras o en mitades; el resto de a 5 g (de a 1 g si es poquito). */
export function kitchenGrams(ing: Ingredient | undefined, grams: number): number {
  if (grams <= 0) return 0;
  if (ing?.unit) {
    const n = Math.max(ing.unit.step, roundTo(grams / ing.unit.grams, ing.unit.step));
    return Math.round(n * ing.unit.grams * 10) / 10;
  }
  if (grams < 20) return Math.max(1, Math.round(grams));
  return roundTo(grams, 5);
}

/** "2 huevos", "½ taza (45 g)", "150 g". */
export function formatAmount(ing: Ingredient | undefined, grams: number): string {
  const g = Math.round(grams);
  if (!ing) return `${g} g`;
  // Sal, pimienta y especias: no tiene sentido medirlas en gramos.
  if (ing.staple && !ing.unit && !ing.measure && grams < 5) return "al gusto";
  if (ing.unit) {
    const n = Math.max(ing.unit.step, roundTo(grams / ing.unit.grams, ing.unit.step));
    const label = n > 1 ? ing.unit.many : ing.unit.one;
    // Las unidades grandes (lata, plátano) llevan los gramos para no confundir.
    const showGrams = ing.unit.grams >= 100 && n % 1 !== 0;
    return `${fraction(n)} ${label}${showGrams ? ` (${g} g)` : ""}`;
  }
  if (ing.measure) {
    const n = roundTo(grams / ing.measure.grams, 0.25);
    if (n >= 0.25) return `${fraction(n)} ${n > 1 ? ing.measure.many : ing.measure.one}${ing.measure.grams >= 20 ? ` (${g} g)` : ""}`;
  }
  return `${g} g`;
}

/** Gramos por porción de cada ingrediente según la receta. */
export function baseGramsPerServing(recipe: Recipe): Record<string, number> {
  const out: Record<string, number> = {};
  for (const ri of recipe.ingredients) out[ri.key] = ri.grams / recipe.servings;
  return out;
}

export function recipeNutrition(recipe: Recipe, per100gOf: Per100gOf, opts: NutritionOpts = {}): RecipeNutrition {
  const servings = opts.servings ?? 1;
  const withOptional = new Set(opts.withOptional ?? []);
  const lines: RecipeLine[] = [];
  const unknown: string[] = [];
  const included: Nutrients[] = [];
  for (const ri of recipe.ingredients) {
    const usedKey = opts.swaps?.[ri.key] ?? ri.key;
    const ing = INGREDIENT_BY_KEY.get(usedKey);
    const perServing = opts.gramsPerServing?.[ri.key] ?? ri.grams / recipe.servings;
    const grams = perServing * servings;
    const per100 = ing ? per100gOf(ing) : undefined;
    if (!per100) unknown.push(usedKey);
    const n = per100 ? scale(per100, grams) : ZERO;
    const isIncluded = !ri.optional || withOptional.has(ri.key);
    if (isIncluded) included.push(n);
    lines.push(lineFor(ri, usedKey, ing, grams, n, isIncluded, !per100));
  }
  return { servings, totals: round(sum(included)), lines, unknown };
}

function lineFor(ri: RecipeIngredient, usedKey: string, ing: Ingredient | undefined, grams: number, n: Nutrients, included: boolean, unknown: boolean): RecipeLine {
  return {
    key: usedKey,
    name: ing?.name ?? usedKey,
    grams: Math.round(grams * 10) / 10,
    amount: formatAmount(ing, grams),
    optional: Boolean(ri.optional),
    included,
    scale: ri.scale ?? null,
    note: ri.note ?? null,
    staple: Boolean(ing?.staple),
    swappedFrom: usedKey !== ri.key ? ri.key : null,
    kcal: Math.round(n.kcal),
    protein_g: Math.round(n.protein_g * 10) / 10,
    unknown,
  };
}
