import { ALL_EQUIPMENT, type Equipment } from "./recipes.ts";

/**
 * Estado de la cocina de una persona, en UN solo documento (`kitchen/main`) para gastar una lectura:
 * qué hay en la despensa, con qué cocina y qué recetas ha probado.
 */

export type RecipeState = {
  /** Ya la cocinó o la marcó como probada. */
  tried: boolean;
  /** -1 no le gustó · 0 sin opinión · 1 le gustó. */
  liked: -1 | 0 | 1;
  favorite: boolean;
  timesCooked: number;
  lastCooked: string | null;
};

export type KitchenState = {
  pantry: string[];
  equipment: Equipment[];
  recipes: Record<string, RecipeState>;
  /** Cosas de la lista de compras ya marcadas (se limpian al pasarlas a la despensa). */
  shoppingChecked: string[];
  updatedAt: string;
};

export const EMPTY_RECIPE_STATE: RecipeState = { tried: false, liked: 0, favorite: false, timesCooked: 0, lastCooked: null };

/** Despensa inicial: lo que casi toda casa colombiana tiene. Se edita en la pantalla Despensa. */
export const STARTER_PANTRY = ["huevo", "arroz", "arepa", "tomate", "cebolla", "cebolla_larga", "leche_descremada", "banano", "avena", "limon"];

export function emptyKitchen(): KitchenState {
  return { pantry: [...STARTER_PANTRY], equipment: [...ALL_EQUIPMENT], recipes: {}, shoppingChecked: [], updatedAt: "" };
}

/** Completa estados guardados con versiones anteriores. */
export function normalizeKitchen(stored: unknown): KitchenState {
  const base = emptyKitchen();
  if (!stored || typeof stored !== "object") return base;
  const s = stored as Partial<KitchenState>;
  return {
    pantry: Array.isArray(s.pantry) ? s.pantry : base.pantry,
    equipment: Array.isArray(s.equipment) ? s.equipment.filter((e): e is Equipment => ALL_EQUIPMENT.includes(e as Equipment)) : base.equipment,
    recipes: s.recipes && typeof s.recipes === "object" ? s.recipes : {},
    shoppingChecked: Array.isArray(s.shoppingChecked) ? s.shoppingChecked : [],
    updatedAt: s.updatedAt ?? "",
  };
}

export function recipeState(k: KitchenState, id: string): RecipeState {
  return { ...EMPTY_RECIPE_STATE, ...(k.recipes[id] ?? {}) };
}

// ───────── Plan de la semana ─────────

export type PlanSlotKind = "desayuno" | "almuerzo" | "cena" | "snack";

export const SLOT_LABEL: Record<PlanSlotKind, string> = { desayuno: "Desayuno", almuerzo: "Almuerzo", cena: "Cena", snack: "Snack" };

export type WeekSlot = {
  slot: PlanSlotKind;
  recipeId: string | null;
  /** Gramos por porción ya ajustados al objetivo del día. */
  gramsPerServing?: Record<string, number>;
  swaps?: Record<string, string>;
  /** Meal prep: es la misma preparación de otro día (no se vuelve a cocinar). */
  leftoverOf?: string | null;
  kcal: number;
  protein_g: number;
};

export type WeekDay = { date: string; slots: WeekSlot[] };

export type WeekPlan = { weekStart: string; days: WeekDay[]; createdAt: string; updatedAt: string };
