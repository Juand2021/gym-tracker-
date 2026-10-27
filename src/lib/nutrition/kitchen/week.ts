import { shiftDate } from "../views.ts";
import { GROUP_LABEL, INGREDIENT_BY_KEY, type PantryGroup } from "./ingredients.ts";
import { inPantry } from "./match.ts";
import { kindForSlot, rankForSlot, slotsFor, splitTargets, type PlanContext } from "./planner.ts";
import type { Recipe } from "./recipes.ts";
import type { PlanSlotKind, WeekDay, WeekPlan, WeekSlot } from "./state.ts";

/**
 * Plan de la semana y lista de compras (docs/nutricion/06-planes-recetas.md §3).
 * - Cada día reparte el objetivo entre sus comidas con una receta ajustada.
 * - Meal prep: una receta que rinde varias porciones se cocina una vez y cubre los días siguientes.
 * - Para la semana no se exige tener todo en casa (para eso es la lista de compras).
 */

/** Lunes de la semana de una fecha (YYYY-MM-DD). */
export function weekStartOf(date: string): string {
  const d = new Date(`${date}T12:00:00Z`);
  const dow = (d.getUTCDay() + 6) % 7; // lunes = 0
  return shiftDate(date, -dow);
}

export const weekDates = (start: string) => Array.from({ length: 7 }, (_, i) => shiftDate(start, i));

export type WeekInput = {
  ctx: PlanContext;
  start: string;
  mealsPerDay: number;
  daily: { kcal: number; protein_g: number };
  /** Días ya pasados no se planean (se dejan vacíos). */
  fromDate?: string;
  now?: string;
};

export function buildWeekPlan({ ctx, start, mealsPerDay, daily, fromDate }: WeekInput): WeekPlan {
  const used = new Map<string, number>();
  // Meal prep en curso por comida: receta, porciones que quedan y el día en que se cocinó.
  const prep = new Map<PlanSlotKind, { recipe: Recipe; left: number; cookedOn: string; slot: WeekSlot }>();
  const days: WeekDay[] = weekDates(start).map((date) => {
    if (fromDate && date < fromDate) return { date, slots: [] };
    const targets = splitTargets(slotsFor(mealsPerDay), daily.kcal, daily.protein_g, daily);
    const slots: WeekSlot[] = targets.map((t) => {
      const running = prep.get(t.slot);
      if (running && running.left > 0) {
        running.left -= 1;
        return { ...running.slot, leftoverOf: running.cookedOn };
      }
      const avoid = new Set([...used.entries()].filter(([, n]) => n >= 1).map(([id]) => id));
      const ranked = rankForSlot({ ...ctx, today: date }, t, avoid, { shopping: true });
      const pick = ranked[0];
      if (!pick) return { slot: t.slot, recipeId: null, kcal: 0, protein_g: 0 };
      used.set(pick.recipe.id, (used.get(pick.recipe.id) ?? 0) + 1);
      const slot: WeekSlot = {
        slot: t.slot,
        recipeId: pick.recipe.id,
        gramsPerServing: pick.scaled.gramsPerServing,
        swaps: pick.match.swaps,
        leftoverOf: null,
        kcal: pick.scaled.totals.kcal,
        protein_g: Math.round(pick.scaled.totals.protein_g),
      };
      if (pick.recipe.servings > 1 && kindForSlot(t.slot) !== "desayuno") prep.set(t.slot, { recipe: pick.recipe, left: pick.recipe.servings - 1, cookedOn: date, slot });
      else prep.delete(t.slot);
      return slot;
    });
    return { date, slots };
  });
  const now = new Date().toISOString();
  return { weekStart: start, days, createdAt: now, updatedAt: now };
}

// ───────── Lista de compras ─────────

export type ShoppingItem = {
  key: string;
  name: string;
  group: PantryGroup;
  grams: number;
  /** "2 libras (500 g)", "8 huevos". */
  amount: string;
  /** Ya está marcado en la despensa: solo revisar que alcance. */
  inPantry: boolean;
  checked: boolean;
  /** En qué recetas se usa. */
  usedIn: string[];
};

export type ShoppingList = { groups: { group: PantryGroup; label: string; items: ShoppingItem[] }[]; toBuy: number };

function buyAmount(key: string, grams: number): string {
  const ing = INGREDIENT_BY_KEY.get(key);
  if (!ing) return `${Math.round(grams)} g`;
  if (ing.unit) {
    const n = Math.max(1, Math.ceil(grams / ing.unit.grams - 0.05));
    const units = `${n} ${n === 1 ? ing.unit.one : ing.unit.many}`;
    // Si se vende en paquete (cubeta, paquete de 5), cuántos paquetes.
    if (ing.buy && ing.buy.grams > ing.unit.grams * 1.5) return `${units} · ${Math.ceil(grams / ing.buy.grams - 0.05) || 1} × ${ing.buy.label}`;
    return units;
  }
  if (ing.buy && ing.buy.grams > 0) {
    const n = Math.max(1, Math.ceil(grams / ing.buy.grams - 0.05));
    return `${n} × ${ing.buy.label} · usas ~${Math.round(grams)} g`;
  }
  return `${Math.round(grams)} g`;
}

/** Suma lo que piden las recetas de la semana (las sobras no se vuelven a comprar). */
export function shoppingList(plan: WeekPlan, recipes: Map<string, Recipe>, pantry: Set<string>, checked: Set<string>, fromDate?: string): ShoppingList {
  const need = new Map<string, { grams: number; usedIn: Set<string> }>();
  for (const day of plan.days) {
    if (fromDate && day.date < fromDate) continue;
    for (const s of day.slots) {
      if (!s.recipeId || s.leftoverOf) continue;
      const r = recipes.get(s.recipeId);
      if (!r) continue;
      for (const ri of r.ingredients) {
        if (ri.optional) continue;
        let key = s.swaps?.[ri.key] ?? ri.key;
        const ing = INGREDIENT_BY_KEY.get(key);
        if (!ing || ing.staple) continue;
        let grams = (s.gramsPerServing?.[ri.key] ?? ri.grams / r.servings) * r.servings;
        // Claras → huevos (por unidades).
        if (ing.buyAs && ing.unit) {
          const target = INGREDIENT_BY_KEY.get(ing.buyAs);
          if (target?.unit) {
            grams = Math.ceil(grams / ing.unit.grams) * target.unit.grams;
            key = target.key;
          }
        }
        const cur = need.get(key) ?? { grams: 0, usedIn: new Set<string>() };
        cur.grams += grams;
        cur.usedIn.add(r.name);
        need.set(key, cur);
      }
    }
  }
  const order = Object.keys(GROUP_LABEL) as PantryGroup[];
  const items: ShoppingItem[] = [...need.entries()].map(([key, v]) => {
    const ing = INGREDIENT_BY_KEY.get(key)!;
    return { key, name: ing.name, group: ing.group, grams: Math.round(v.grams), amount: buyAmount(key, v.grams), inPantry: inPantry(key, pantry), checked: checked.has(key), usedIn: [...v.usedIn] };
  });
  const groups = order
    .map((group) => ({ group, label: GROUP_LABEL[group], items: items.filter((i) => i.group === group).sort((a, b) => Number(a.inPantry) - Number(b.inPantry) || a.name.localeCompare(b.name)) }))
    .filter((g) => g.items.length);
  return { groups, toBuy: items.filter((i) => !i.inPantry && !i.checked).length };
}
