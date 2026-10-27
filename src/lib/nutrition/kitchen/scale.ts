import { scale } from "../engine/compute.ts";
import type { Nutrients } from "../engine/types.ts";
import { INGREDIENT_BY_KEY } from "./ingredients.ts";
import { kitchenGrams, recipeNutrition, type NutritionOpts, type Per100gOf, type RecipeNutrition } from "./nutrition.ts";
import type { Recipe, ScaleRole } from "./recipes.ts";

/**
 * Ajusta UNA porción de la receta a lo que queda del día (docs/nutricion/06-planes-recetas.md §2):
 * 1) la proteína se acerca a la meta subiendo o bajando los ingredientes `scale: "protein"`;
 * 2) las kcal se acercan con los de `scale: "carb"` (o los de grasa si no hay carbohidrato).
 * Los demás ingredientes no cambian y todo se redondea a medidas de cocina.
 */

export type ScaleTarget = { kcal: number; protein_g: number };

export type ScaledRecipe = RecipeNutrition & {
  /** Gramos por porción ya ajustados y redondeados. */
  gramsPerServing: Record<string, number>;
  factors: Record<ScaleRole, number>;
  /** Diferencia con la meta después de ajustar (positivo = se pasa). */
  diff: { kcal: number; protein_g: number };
};

export const SCALE_LIMITS = { protein: [0.6, 1.8], carb: [0.3, 2.0], fat: [0.4, 1.6] } as const satisfies Record<ScaleRole, readonly [number, number]>;

const clamp = (x: number, [lo, hi]: readonly [number, number]) => Math.min(hi, Math.max(lo, x));

type Part = { kcal: number; protein_g: number };

export function scaleRecipe(recipe: Recipe, per100gOf: Per100gOf, target: ScaleTarget, opts: Omit<NutritionOpts, "gramsPerServing" | "servings"> = {}): ScaledRecipe {
  const withOptional = new Set(opts.withOptional ?? []);
  // Nutrientes de una porción, separados por papel en el ajuste.
  const parts: Record<ScaleRole | "fixed", Part> = { protein: z(), carb: z(), fat: z(), fixed: z() };
  for (const ri of recipe.ingredients) {
    if (ri.optional && !withOptional.has(ri.key)) continue;
    const ing = INGREDIENT_BY_KEY.get(opts.swaps?.[ri.key] ?? ri.key);
    const per100 = ing ? per100gOf(ing) : undefined;
    if (!per100) continue;
    const n: Nutrients = scale(per100, ri.grams / recipe.servings);
    const p = parts[ri.scale ?? "fixed"];
    p.kcal += n.kcal;
    p.protein_g += n.protein_g;
  }

  const f: Record<ScaleRole, number> = { protein: 1, carb: 1, fat: 1 };
  const kcalRole: ScaleRole | null = parts.carb.kcal > 0 ? "carb" : parts.fat.kcal > 0 ? "fat" : null;
  // Dos vueltas: el carbohidrato también aporta algo de proteína.
  for (let k = 0; k < 2; k++) {
    if (parts.protein.protein_g > 0) {
      const other = parts.fixed.protein_g + f.carb * parts.carb.protein_g + f.fat * parts.fat.protein_g;
      f.protein = clamp((target.protein_g - other) / parts.protein.protein_g, SCALE_LIMITS.protein);
    }
    if (kcalRole) {
      const otherRole: ScaleRole = kcalRole === "carb" ? "fat" : "carb";
      const rest = parts.fixed.kcal + f.protein * parts.protein.kcal + f[otherRole] * parts[otherRole].kcal;
      f[kcalRole] = clamp((target.kcal - rest) / parts[kcalRole].kcal, SCALE_LIMITS[kcalRole]);
    }
  }

  const gramsPerServing: Record<string, number> = {};
  for (const ri of recipe.ingredients) {
    const base = ri.grams / recipe.servings;
    const factor = ri.scale ? f[ri.scale] : 1;
    const ing = INGREDIENT_BY_KEY.get(opts.swaps?.[ri.key] ?? ri.key);
    gramsPerServing[ri.key] = ri.scale ? kitchenGrams(ing, base * factor) : base;
  }
  const result = recipeNutrition(recipe, per100gOf, { ...opts, servings: 1, gramsPerServing });
  return {
    ...result,
    gramsPerServing,
    factors: { protein: round2(f.protein), carb: round2(f.carb), fat: round2(f.fat) },
    diff: { kcal: Math.round(result.totals.kcal - target.kcal), protein_g: Math.round(result.totals.protein_g - target.protein_g) },
  };
}

const z = (): Part => ({ kcal: 0, protein_g: 0 });
const round2 = (x: number) => Math.round(x * 100) / 100;
