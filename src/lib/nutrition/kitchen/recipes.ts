/**
 * Recetas de NutriVerse (docs/nutricion/06-planes-recetas.md §2).
 * Gramos de ingrediente CRUDO para la receta completa; las kcal se calculan en código con la base (nutrition.ts).
 */

export type RecipeKind = "desayuno" | "comida" | "snack";
export type Equipment = "estufa" | "airfryer" | "licuadora";
/** Qué se ajusta para cuadrar la receta con lo que queda del día. */
export type ScaleRole = "protein" | "carb" | "fat";

export type RecipeIngredient = {
  key: string;
  grams: number;
  optional?: boolean;
  scale?: ScaleRole;
  /** Reemplazos válidos si no hay el principal en la despensa (mismos gramos). */
  alt?: string[];
  /** Detalle para la lista ("picado", "en cubos"). */
  note?: string;
};

export type RecipeStep = { text: string; timerMin?: number };

export type RecipeSource = "nutriverse" | "mia" | "ia";

export type Recipe = {
  id: string;
  name: string;
  /** Una línea: por qué vale la pena. */
  description: string;
  kind: RecipeKind;
  servings: number;
  minutes: number;
  difficulty: 1 | 2 | 3;
  equipment: Equipment[];
  tags: RecipeTag[];
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  tips?: string[];
  source: RecipeSource;
  createdAt?: string;
  updatedAt?: string;
};

export type RecipeTag = "alta-proteina" | "meal-prep" | "dulce" | "salado" | "sin-cocinar" | "vegetariana" | "colombiana" | "rapida";

export const KIND_LABEL: Record<RecipeKind, string> = { desayuno: "Desayuno", comida: "Almuerzo o cena", snack: "Snack" };
export const EQUIPMENT_LABEL: Record<Equipment, string> = { estufa: "Estufa", airfryer: "Air fryer", licuadora: "Licuadora" };
export const ALL_EQUIPMENT: Equipment[] = ["estufa", "airfryer", "licuadora"];
