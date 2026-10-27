import { normalize } from "../engine/text.ts";
import { EXCLUDED_CATEGORIES } from "../meal-plan.ts";
import type { DietStyle } from "../profile.ts";
import { INGREDIENT_BY_KEY, type Ingredient } from "./ingredients.ts";
import type { Equipment, Recipe } from "./recipes.ts";

/**
 * ¿Puedo hacer esta receta con lo que hay en casa? (docs/nutricion/06-planes-recetas.md §2).
 * Sal, aceite y especias se dan por hechos. Un reemplazo (`alt`) que sí está en la despensa cuenta.
 */

export type KitchenPrefs = {
  pantry: Set<string>;
  equipment: Equipment[];
  dietStyle: DietStyle;
  avoidFoods: string[];
};

export type MatchStatus = "ready" | "almost" | "missing";

export type RecipeMatch = {
  status: MatchStatus;
  /** Ingredientes obligatorios que faltan (claves). */
  missing: string[];
  /** Reemplazos a usar: clave de la receta → clave que se usa. */
  swaps: Record<string, string>;
  /** Opcionales que sí hay en casa (se incluyen al cocinar). */
  optionalAvailable: string[];
  /** Si no sirve para esta persona: falta equipo, no va con su dieta o tiene algo que no come. */
  blocked: null | { reason: "equipo" | "dieta" | "evitar"; detail: string };
};

/** "Te falta 1 o 2 cosas" todavía se muestra como casi lista. */
export const ALMOST_MAX_MISSING = 2;

function dietAllows(ing: Ingredient, style: DietStyle): boolean {
  return !ing.diet || !EXCLUDED_CATEGORIES[style].includes(ing.diet);
}

function avoided(ing: Ingredient, avoidFoods: string[]): string | null {
  const names = [ing.name, ...ing.aliases].map(normalize).join(" | ");
  for (const f of avoidFoods) {
    const term = normalize(f);
    if (term.length > 2 && names.includes(term)) return f;
  }
  return null;
}

/** El ingrediente cuenta como "en casa": está, es básico o sale de otro que está (claras → huevos). */
export function inPantry(key: string, pantry: Set<string>): boolean {
  const ing = INGREDIENT_BY_KEY.get(key);
  if (!ing) return false;
  return Boolean(ing.staple) || pantry.has(key) || (ing.buyAs ? pantry.has(ing.buyAs) : false);
}

export function matchRecipe(recipe: Recipe, prefs: KitchenPrefs): RecipeMatch {
  const result: RecipeMatch = { status: "ready", missing: [], swaps: {}, optionalAvailable: [], blocked: null };
  const noEquip = recipe.equipment.filter((e) => !prefs.equipment.includes(e));
  if (noEquip.length) result.blocked = { reason: "equipo", detail: noEquip.join(", ") };

  for (const ri of recipe.ingredients) {
    const options = [ri.key, ...(ri.alt ?? [])].map((k) => INGREDIENT_BY_KEY.get(k)).filter((x): x is Ingredient => Boolean(x));
    // Opciones que la persona sí come.
    const fit = options.filter((o) => dietAllows(o, prefs.dietStyle) && !avoided(o, prefs.avoidFoods));
    if (!fit.length) {
      if (ri.optional) continue; // Un opcional que no come simplemente no se pone.
      const main = options[0];
      const why = main ? avoided(main, prefs.avoidFoods) : null;
      result.blocked ??= why ? { reason: "evitar", detail: why } : { reason: "dieta", detail: main?.name ?? ri.key };
      continue;
    }
    const have = fit.find((o) => inPantry(o.key, prefs.pantry));
    const chosen = have ?? fit[0];
    if (chosen.key !== ri.key) result.swaps[ri.key] = chosen.key;
    if (ri.optional) {
      if (have) result.optionalAvailable.push(ri.key);
    } else if (!have) {
      result.missing.push(chosen.key);
    }
  }
  result.status = result.missing.length === 0 ? "ready" : result.missing.length <= ALMOST_MAX_MISSING ? "almost" : "missing";
  return result;
}

/** Cuántas recetas se pueden hacer ya con esta despensa (para el contador de la pantalla Despensa). */
export function countReady(recipes: Recipe[], prefs: KitchenPrefs): number {
  return recipes.reduce((n, rc) => {
    const m = matchRecipe(rc, prefs);
    return n + (!m.blocked && m.status === "ready" ? 1 : 0);
  }, 0);
}
