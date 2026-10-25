import { CORE_BY_KEY } from "./engine/core-foods.ts";
import { normalize } from "./engine/text.ts";
import type { CoreFood, Nutrients } from "./engine/types.ts";
import type { DietStyle, NutritionProfile } from "./profile.ts";
import type { Targets } from "./targets.ts";

/**
 * "¿Qué como?": reparte lo que falta del día entre las comidas que quedan y arma
 * opciones con alimentos colombianos del catálogo, con gramos calculados (no inventados por la IA).
 */

type Pick = { key: string; max: number };

/** Fuentes de proteína en orden de preferencia (más proteína por kcal primero). */
const PROTEINS: Pick[] = [
  { key: "pechuga_asada", max: 250 },
  { key: "atun_agua", max: 160 },
  { key: "pescado_plancha", max: 250 },
  { key: "camarones", max: 250 },
  { key: "res_asada", max: 220 },
  { key: "cerdo_asado", max: 220 },
  { key: "yogurt_griego", max: 300 },
  { key: "huevo_cocido", max: 200 },
  { key: "queso_campesino", max: 80 },
  { key: "proteina_whey", max: 40 },
  { key: "lentejas", max: 300 },
  { key: "frijoles", max: 300 },
  { key: "garbanzos", max: 250 },
];

const CARBS: Pick[] = [
  { key: "arroz_blanco", max: 250 },
  { key: "papa_cocida", max: 300 },
  { key: "arepa_blanca", max: 140 },
  { key: "avena_hojuelas", max: 80 },
  { key: "platano_verde_cocido", max: 200 },
  { key: "yuca_cocida", max: 250 },
  { key: "banano", max: 240 },
  { key: "pasta_cocida", max: 250 },
];

const VEGGIE = { key: "ensalada", grams: 100 };

/** Proteínas "de desayuno/merienda": van con avena o fruta, no con ensalada. */
const SWEET_PROTEINS = new Set(["yogurt_griego", "proteina_whey"]);
const SWEET_CARBS = ["avena_hojuelas", "banano"];

/** Una opción debe cubrir al menos este % de la proteína de la comida. */
const MIN_PROTEIN_SHARE = 0.75;

const EXCLUDED_CATEGORIES: Record<DietStyle, string[]> = {
  omnivoro: [],
  pescetariano: ["carne", "pollo"],
  vegetariano: ["carne", "pollo", "pescado"],
  vegano: ["carne", "pollo", "pescado", "huevo", "lacteo"],
};
const VEGAN_EXTRA = new Set(["proteina_whey"]);

export type PlanFood = { alimento: string; clave: string; gramos: number; kcal: number; proteina_g: number };
export type PlanOption = { alimentos: PlanFood[]; kcal: number; proteina_g: number };
export type MealSlotPlan = { comida: number; kcal_objetivo: number; proteina_objetivo_g: number; opciones: PlanOption[] };
export type MealPlan = {
  restante_kcal: number;
  restante_proteina_g: number;
  comidas_restantes: number;
  comidas: MealSlotPlan[];
  notas: string[];
};

function allowed(core: CoreFood, profile: NutritionProfile): boolean {
  if (EXCLUDED_CATEGORIES[profile.dietStyle].includes(core.category)) return false;
  if (profile.dietStyle === "vegano" && VEGAN_EXTRA.has(core.key)) return false;
  const names = [core.name, ...core.aliases].map(normalize).join(" | ");
  return !profile.avoidFoods.some((f) => {
    const term = normalize(f);
    return term.length > 2 && names.includes(term);
  });
}

const round5 = (g: number) => Math.max(5, Math.round(g / 5) * 5);

function food(key: string, grams: number, per100g: Nutrients): PlanFood {
  const core = CORE_BY_KEY.get(key)!;
  return { alimento: core.name, clave: key, gramos: grams, kcal: Math.round((per100g.kcal * grams) / 100), proteina_g: Math.round((per100g.protein_g * grams) / 10) / 10 };
}

/**
 * @param nutrientsOf nutrientes por 100 g de un alimento del núcleo (desde la base).
 * @param eaten lo consumido hoy; mealsEaten cuántas comidas ya registró.
 */
export function buildMealPlan(opts: {
  profile: NutritionProfile;
  targets: Targets;
  eaten: { kcal: number; protein_g: number };
  mealsEaten: number;
  nutrientsOf: (key: string) => Nutrients | undefined;
  optionsPerMeal?: number;
}): MealPlan {
  const { profile, targets, eaten, nutrientsOf } = opts;
  const notas: string[] = [];
  const restKcal = Math.max(0, targets.kcal - eaten.kcal);
  const restProtein = Math.max(0, targets.protein_g - eaten.protein_g);
  const mealsLeft = Math.max(1, profile.mealsPerDay - opts.mealsEaten);
  if (restKcal < 150) notas.push("Ya casi llegas a tus calorías del día: si tienes hambre, prioriza proteína magra y verduras.");

  const proteins = PROTEINS.filter((p) => {
    const c = CORE_BY_KEY.get(p.key);
    return c && allowed(c, profile) && nutrientsOf(p.key);
  });
  const carbs = CARBS.filter((p) => {
    const c = CORE_BY_KEY.get(p.key);
    return c && allowed(c, profile) && nutrientsOf(p.key);
  });
  const veggie = nutrientsOf(VEGGIE.key);
  if (!proteins.length) notas.push("Con tus restricciones no encontré fuentes de proteína en el catálogo; cuéntale al chat qué sí comes.");

  const perMealKcal = restKcal / mealsLeft;
  const perMealProtein = restProtein / mealsLeft;
  const optionsPerMeal = opts.optionsPerMeal ?? 2;
  const comidas: MealSlotPlan[] = [];

  for (let m = 0; m < mealsLeft; m++) {
    const opciones: PlanOption[] = [];
    const used = new Set<string>();
    for (let o = 0; o < optionsPerMeal && proteins.length; o++) {
      // Rota las fuentes para variar, saltando las que no alcanzan la proteína (por su tope de porción).
      let pick = proteins[(m * optionsPerMeal + o) % proteins.length];
      for (let k = 0; k < proteins.length; k++) {
        const cand = proteins[(m * optionsPerMeal + o + k) % proteins.length];
        const cN = nutrientsOf(cand.key)!;
        const reach = (Math.min(cand.max, (perMealProtein / Math.max(cN.protein_g, 1)) * 100) * cN.protein_g) / 100;
        if (!used.has(cand.key) && reach >= perMealProtein * MIN_PROTEIN_SHARE) {
          pick = cand;
          break;
        }
      }
      used.add(pick.key);
      const pN = nutrientsOf(pick.key)!;
      const pGrams = round5(Math.min(pick.max, (perMealProtein / Math.max(pN.protein_g, 1)) * 100));
      const items: PlanFood[] = [food(pick.key, pGrams, pN)];
      const sweet = SWEET_PROTEINS.has(pick.key);
      if (veggie && !sweet && perMealKcal > 250) items.push(food(VEGGIE.key, VEGGIE.grams, veggie));
      const kcalSoFar = items.reduce((a, i) => a + i.kcal, 0);
      const sweetCarbs = carbs.filter((c) => SWEET_CARBS.includes(c.key));
      const carbPool = sweet && sweetCarbs.length ? sweetCarbs : carbs.filter((c) => !SWEET_CARBS.includes(c.key) || !carbs.some((x) => !SWEET_CARBS.includes(x.key)));
      const carb = carbPool[(m + o) % Math.max(1, carbPool.length)];
      if (carb && perMealKcal - kcalSoFar > 60) {
        const cN = nutrientsOf(carb.key)!;
        const cGrams = round5(Math.min(carb.max, ((perMealKcal - kcalSoFar) / Math.max(cN.kcal, 1)) * 100));
        items.push(food(carb.key, cGrams, cN));
      }
      opciones.push({
        alimentos: items,
        kcal: items.reduce((a, i) => a + i.kcal, 0),
        proteina_g: Math.round(items.reduce((a, i) => a + i.proteina_g, 0)),
      });
    }
    comidas.push({ comida: m + 1, kcal_objetivo: Math.round(perMealKcal), proteina_objetivo_g: Math.round(perMealProtein), opciones });
  }

  return { restante_kcal: Math.round(restKcal), restante_proteina_g: Math.round(restProtein), comidas_restantes: mealsLeft, comidas, notas };
}
