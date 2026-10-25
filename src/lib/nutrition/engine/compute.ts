import type { Nutrients } from "./types.ts";

export const ZERO: Nutrients = { kcal: 0, protein_g: 0, fat_g: 0, carb_g: 0, fiber_g: 0, alcohol_g: 0, water_g: 0 };
const KEYS = Object.keys(ZERO) as (keyof Nutrients)[];

/** Nutrientes de `grams` gramos a partir de valores por 100 g. */
export function scale(per100g: Nutrients, grams: number): Nutrients {
  const f = grams / 100;
  const out = { ...ZERO };
  for (const k of KEYS) out[k] = per100g[k] * f;
  return out;
}

export function sum(list: Nutrients[]): Nutrients {
  const out = { ...ZERO };
  for (const n of list) for (const k of KEYS) out[k] += n[k];
  return out;
}

export function round(n: Nutrients): Nutrients {
  const out = { ...ZERO };
  for (const k of KEYS) out[k] = k === "kcal" ? Math.round(n[k]) : Math.round(n[k] * 10) / 10;
  return out;
}

/** Energía calculada con factores de Atwater (fibra a 2 kcal/g, alcohol a 7). */
export function atwaterKcal(n: Nutrients): number {
  return 4 * n.protein_g + 4 * n.carb_g + 9 * n.fat_g + 2 * n.fiber_g + 7 * n.alcohol_g;
}

export type Warning = { code: "atwater" | "density" | "grams_high" | "grams_low"; message: string };

/** Límites de porción por ítem: más allá probablemente hay un error de cantidad o unidad. */
const MAX_GRAMS = 1500;
const MAX_DRINK_GRAMS = 6000;
const MIN_GRAMS = 1;

/** Revisa que un ítem tenga sentido. No corrige nada: solo avisa. */
export function validateItem(per100g: Nutrients, grams: number, isDrink = false): Warning[] {
  const out: Warning[] = [];
  if (per100g.kcal > 20) {
    const err = (atwaterKcal(per100g) - per100g.kcal) / per100g.kcal;
    if (Math.abs(err) > 0.15) out.push({ code: "atwater", message: `Las kcal del alimento no cuadran con sus macros (${Math.round(err * 100)} %)` });
  }
  if (per100g.kcal > 902) out.push({ code: "density", message: "Más de 900 kcal por 100 g es imposible" });
  if (grams > (isDrink ? MAX_DRINK_GRAMS : MAX_GRAMS)) out.push({ code: "grams_high", message: `${Math.round(grams)} g es demasiado para un solo ítem` });
  if (grams < MIN_GRAMS) out.push({ code: "grams_low", message: "Cantidad casi nula" });
  return out;
}
