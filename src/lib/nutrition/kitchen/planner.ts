import type { MealMoment } from "../store.ts";
import { matchRecipe, type KitchenPrefs, type RecipeMatch } from "./match.ts";
import type { Per100gOf } from "./nutrition.ts";
import type { Recipe, RecipeKind } from "./recipes.ts";
import { scaleRecipe, type ScaledRecipe } from "./scale.ts";
import { recipeState, type KitchenState, type PlanSlotKind } from "./state.ts";

/**
 * Plan del día con recetas (docs/nutricion/06-planes-recetas.md §3):
 * reparte lo que queda entre las comidas que faltan y elige para cada una la receta que mejor encaja:
 * primero lo que se puede hacer con la despensa, luego las favoritas, variedad y cercanía a la meta.
 */

/** Comidas del día según cuántas come la persona. */
export function slotsFor(mealsPerDay: number): PlanSlotKind[] {
  const n = Math.max(1, Math.min(6, Math.round(mealsPerDay)));
  const map: Record<number, PlanSlotKind[]> = {
    1: ["almuerzo"],
    2: ["almuerzo", "cena"],
    3: ["desayuno", "almuerzo", "cena"],
    4: ["desayuno", "almuerzo", "snack", "cena"],
    5: ["desayuno", "snack", "almuerzo", "snack", "cena"],
    6: ["desayuno", "snack", "almuerzo", "snack", "cena", "snack"],
  };
  return map[n];
}

/** Hasta qué hora tiene sentido proponer cada comida (hora de Colombia). */
const SLOT_UNTIL: Record<PlanSlotKind, string> = { desayuno: "11:30", almuerzo: "16:30", snack: "23:59", cena: "23:59" };
/** Peso de cada comida al repartir lo que queda. */
const SLOT_WEIGHT: Record<PlanSlotKind, { kcal: number; protein: number }> = {
  desayuno: { kcal: 0.27, protein: 0.25 },
  almuerzo: { kcal: 0.36, protein: 0.33 },
  cena: { kcal: 0.29, protein: 0.3 },
  snack: { kcal: 0.1, protein: 0.12 },
};

export { SLOT_LABEL } from "./state.ts";

export const kindForSlot = (slot: PlanSlotKind): RecipeKind => (slot === "desayuno" ? "desayuno" : slot === "snack" ? "snack" : "comida");

/** Comidas que faltan hoy: quita las ya registradas (por momento) y las que ya pasaron de hora. */
export function remainingSlots(mealsPerDay: number, eatenMoments: MealMoment[], now: string): PlanSlotKind[] {
  const left = slotsFor(mealsPerDay);
  for (const m of eatenMoments) {
    if (m === "fiesta") continue;
    const i = left.indexOf(m);
    if (i >= 0) left.splice(i, 1);
    else if (left.length && m !== "snack") left.splice(0, 1); // registró algo que no estaba previsto: cuenta como la siguiente comida
  }
  const timely = left.filter((s) => now <= SLOT_UNTIL[s]);
  return timely.length ? timely : left.slice(-1);
}

export type SlotTarget = { slot: PlanSlotKind; kcal: number; protein_g: number };

/** Tope de una sola comida: aunque sobre mucho del día, nadie se come 1.400 kcal en la cena. */
const SLOT_MAX: Record<PlanSlotKind, { kcalShare: number; protein: number }> = {
  desayuno: { kcalShare: 0.35, protein: 50 },
  almuerzo: { kcalShare: 0.42, protein: 65 },
  cena: { kcalShare: 0.4, protein: 60 },
  snack: { kcalShare: 0.16, protein: 30 },
};

/**
 * Reparte kcal y proteína que quedan entre las comidas que faltan.
 * Con `daily` (objetivo del día) ninguna comida pasa de su tope; lo que sobre se dice aparte.
 */
export function splitTargets(slots: PlanSlotKind[], kcalLeft: number, proteinLeft: number, daily?: { kcal: number; protein_g: number }): SlotTarget[] {
  const wk = slots.reduce((a, s) => a + SLOT_WEIGHT[s].kcal, 0) || 1;
  const wp = slots.reduce((a, s) => a + SLOT_WEIGHT[s].protein, 0) || 1;
  return slots.map((slot) => {
    let kcal = Math.max(0, (kcalLeft * SLOT_WEIGHT[slot].kcal) / wk);
    let protein = Math.max(0, (proteinLeft * SLOT_WEIGHT[slot].protein) / wp);
    if (daily) {
      kcal = Math.min(kcal, daily.kcal * SLOT_MAX[slot].kcalShare);
      protein = Math.min(protein, SLOT_MAX[slot].protein);
    }
    return { slot, kcal: Math.round(kcal), protein_g: Math.round(protein) };
  });
}

/** Lo que queda sin repartir por los topes (para sugerir un snack extra). */
export function unassigned(targets: SlotTarget[], kcalLeft: number, proteinLeft: number) {
  return {
    kcal: Math.max(0, Math.round(kcalLeft - targets.reduce((a, t) => a + t.kcal, 0))),
    protein_g: Math.max(0, Math.round(proteinLeft - targets.reduce((a, t) => a + t.protein_g, 0))),
  };
}

export type RecipePick = { recipe: Recipe; match: RecipeMatch; scaled: ScaledRecipe; score: number };

export type PlanContext = {
  recipes: Recipe[];
  kitchen: KitchenState;
  prefs: KitchenPrefs;
  per100gOf: Per100gOf;
  today: string;
};

/** Variación estable por día: el mismo día da el mismo plan, el siguiente cambia. */
function jitter(seed: string): number {
  let h = 2166136261;
  for (let k = 0; k < seed.length; k++) h = Math.imul(h ^ seed.charCodeAt(k), 16777619);
  return ((h >>> 0) % 1000) / 1000;
}

const daysBetween = (a: string, b: string) => Math.round((new Date(`${b}T12:00:00Z`).getTime() - new Date(`${a}T12:00:00Z`).getTime()) / 86400000);

/** Candidatas ordenadas para una comida. `avoid` = recetas ya elegidas en el plan. */
export function rankForSlot(ctx: PlanContext, target: SlotTarget, avoid: Set<string> = new Set(), opts: { shopping?: boolean } = {}): RecipePick[] {
  const kind = kindForSlot(target.slot);
  const picks: RecipePick[] = [];
  for (const recipe of ctx.recipes) {
    if (recipe.kind !== kind) continue;
    const state = recipeState(ctx.kitchen, recipe.id);
    if (state.liked === -1) continue;
    const match = matchRecipe(recipe, ctx.prefs);
    if (match.blocked) continue;
    const scaled = scaleRecipe(recipe, ctx.per100gOf, target, { swaps: match.swaps, withOptional: match.optionalAvailable });
    let score = 0;
    // Para hoy manda la despensa; para la semana (habrá lista de compras) pesa menos.
    if (opts.shopping) score += match.status === "ready" ? 12 : match.status === "almost" ? 8 - match.missing.length : 0;
    else score += match.status === "ready" ? 40 : match.status === "almost" ? 18 - 6 * match.missing.length : -40;
    if (state.favorite) score += 15;
    if (state.liked === 1) score += 10;
    else if (state.tried) score += 4;
    // Cercanía a la meta después de ajustar.
    // Pasarse de kcal pesa el doble que quedarse corto (lo que sobra se cubre con un snack).
    score -= (scaled.diff.kcal > 0 ? scaled.diff.kcal / 6 : -scaled.diff.kcal / 12) + Math.abs(scaled.diff.protein_g) * 0.8;
    if (avoid.has(recipe.id)) score -= 30;
    if (state.lastCooked && daysBetween(state.lastCooked, ctx.today) <= 1) score -= 12;
    score += jitter(`${ctx.today}:${target.slot}:${recipe.id}`) * 8;
    picks.push({ recipe, match, scaled, score: Math.round(score * 10) / 10 });
  }
  return picks.sort((a, b) => b.score - a.score);
}

export type DayPlanSlot = SlotTarget & { pick: RecipePick | null; alternatives: RecipePick[] };

export function planDay(ctx: PlanContext, targets: SlotTarget[], alternatives = 3): DayPlanSlot[] {
  const used = new Set<string>();
  return targets.map((t) => {
    const ranked = rankForSlot(ctx, t, used);
    const pick = ranked[0] ?? null;
    if (pick) used.add(pick.recipe.id);
    return { ...t, pick, alternatives: ranked.slice(1, 1 + alternatives) };
  });
}

/**
 * "Tengo hambre": snacks que caben en lo que queda, primero los que llenan más por caloría
 * (proteína y volumen) y los que se pueden hacer ya.
 */
export function hungrySnacks(ctx: PlanContext, kcalLeft: number, proteinLeft: number, count = 3): RecipePick[] {
  const budget = Math.round(Math.min(280, Math.max(110, kcalLeft * 0.3)));
  const target: SlotTarget = { slot: "snack", kcal: budget, protein_g: Math.min(30, Math.max(10, proteinLeft * 0.25)) };
  return rankForSlot(ctx, target)
    .map((p) => {
      const t = p.scaled.totals;
      const grams = p.scaled.lines.filter((l) => l.included).reduce((a, l) => a + l.grams, 0);
      // Proteína por cada 100 kcal y gramos por kcal (volumen): lo que más sacia.
      const satiety = (t.protein_g / Math.max(t.kcal, 1)) * 100 * 2 + (grams / Math.max(t.kcal, 1)) * 6;
      const over = Math.max(0, t.kcal - Math.max(kcalLeft, 0));
      // Con hambre se quiere algo YA: lo que se puede hacer con la despensa pesa más que lo que más llena.
      const now = p.match.status === "ready" ? 25 : 0;
      return { ...p, score: Math.round((p.score + now + satiety - over / 5) * 10) / 10 };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
}
