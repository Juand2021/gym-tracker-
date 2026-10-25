/**
 * Prueba rápida del motor con IA sobre frases sueltas.
 * Uso: node --experimental-strip-types scripts/nutrition/try_meal.ts "almorcé un corrientazo con cerdo" "..."
 */
import { getNutritionAiClient } from "../../src/lib/nutrition/ai-client.ts";
import { loadFoodDb } from "../../src/lib/nutrition/engine/db.ts";
import { makeLlmParser } from "../../src/lib/nutrition/engine/parse.ts";
import { makeLlmReranker } from "../../src/lib/nutrition/engine/rerank.ts";
import { analyzeMeal } from "../../src/lib/nutrition/engine/pipeline.ts";
const ai = getNutritionAiClient()!;
const db = loadFoodDb();
for (const q of process.argv.slice(2)) {
  const t = Date.now();
  try {
    const r = await analyzeMeal(q, { db, parser: makeLlmParser(ai), reranker: makeLlmReranker(ai) });
    console.log(`\n${q} → ${r.totals.kcal} kcal (${Date.now() - t} ms) ${r.question ?? ""}`);
    for (const i of r.items) console.log(`   ${i.coreKey ?? i.recordId} | ${i.recordName.slice(0, 40)} | ${i.grams} g ${i.gramsBasis} | ${i.nutrients.kcal} kcal${i.assumption ? " | " + i.assumption : ""}`);
  } catch (e) { console.log("ERROR", (e as Error).message.slice(0, 400)); }
}
