/**
 * Revisa ingredientes y recetas contra la base de alimentos real:
 * - cada ingrediente apunta a un registro que existe (o tiene valores propios);
 * - las recetas solo usan ingredientes del catálogo;
 * - las kcal por porción están en un rango razonable para su tipo y cuadran con Atwater.
 *
 * Uso: node --experimental-strip-types scripts/nutrition/check_recipes.ts [ruta a foods.json]
 * Por defecto .data/nutrition/foods.json; la base de prueba está en .data/nutrition-local/foods.json.
 * (la base local se genera con build_db.ts o se baja con download_db.ts)
 */
import { atwaterKcal } from "../../src/lib/nutrition/engine/compute.ts";
import { loadFoodDb } from "../../src/lib/nutrition/engine/db.ts";
import { INGREDIENTS, INGREDIENT_BY_KEY } from "../../src/lib/nutrition/kitchen/ingredients.ts";
import { LIBRARY } from "../../src/lib/nutrition/kitchen/library.ts";
import { per100gFromDb, recipeNutrition } from "../../src/lib/nutrition/kitchen/nutrition.ts";
import type { RecipeKind } from "../../src/lib/nutrition/kitchen/recipes.ts";

const db = loadFoodDb(process.argv[2] ?? ".data/nutrition/foods.json");
// (para la base de prueba: node … check_recipes.ts .data/nutrition-local/foods.json)
const per100gOf = per100gFromDb(db);
const problems: string[] = [];

for (const ing of INGREDIENTS) {
  const n = per100gOf(ing);
  if (!n) {
    problems.push(`Ingrediente ${ing.key}: no se encontró ${ing.ref ?? ing.core}`);
    continue;
  }
  // El cacao del USDA usa factores propios (mucha fibra): no cuadra con Atwater y es conocido.
  const gap = Math.abs(atwaterKcal(n) - n.kcal);
  if (ing.key !== "cacao" && gap > 15 && gap / n.kcal > 0.15) problems.push(`Ingrediente ${ing.key}: kcal no cuadran con macros (${n.kcal} vs ${Math.round(atwaterKcal(n))})`);
}

const RANGE: Record<RecipeKind, [number, number]> = { desayuno: [220, 750], comida: [350, 950], snack: [60, 420] };
const ids = new Set<string>();
const rows: string[] = [];
for (const r of LIBRARY) {
  if (ids.has(r.id)) problems.push(`Receta repetida: ${r.id}`);
  ids.add(r.id);
  for (const ri of r.ingredients) for (const k of [ri.key, ...(ri.alt ?? [])]) if (!INGREDIENT_BY_KEY.has(k)) problems.push(`${r.id}: ingrediente desconocido ${k}`);
  const n = recipeNutrition(r, per100gOf);
  const [lo, hi] = RANGE[r.kind];
  if (n.totals.kcal < lo || n.totals.kcal > hi) problems.push(`${r.id}: ${n.totals.kcal} kcal por porción, fuera de ${lo}–${hi} para ${r.kind}`);
  if (!r.ingredients.some((x) => x.scale)) problems.push(`${r.id}: ningún ingrediente se puede ajustar`);
  if (!r.steps.length) problems.push(`${r.id}: sin pasos`);
  const pk = Math.round((n.totals.protein_g * 4 * 100) / Math.max(1, n.totals.kcal));
  rows.push(`${r.kind.padEnd(8)} ${String(n.totals.kcal).padStart(4)} kcal ${String(Math.round(n.totals.protein_g)).padStart(3)} g P (${String(pk).padStart(2)} %) ${String(Math.round(n.totals.carb_g)).padStart(3)} C ${String(Math.round(n.totals.fat_g)).padStart(3)} G  ${r.name}`);
}

console.log(rows.sort().join("\n"));
console.log(`\n${INGREDIENTS.length} ingredientes, ${LIBRARY.length} recetas.`);
if (problems.length) {
  console.log(`\n${problems.length} problemas:\n- ${problems.join("\n- ")}`);
  process.exit(1);
}
console.log("Todo en orden.");
