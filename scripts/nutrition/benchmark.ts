/**
 * Banco de pruebas del motor de comidas.
 *
 * Uso:
 *   node --experimental-strip-types scripts/nutrition/benchmark.ts [--parser rules|llm] [--set dev|test|all] [--worst 10]
 *   (con IA: node --env-file=.env.local --experimental-strip-types scripts/nutrition/benchmark.ts --parser llm)
 *
 * Meta (Fase 2): con gramos ≥90 % dentro de ±10 % kcal; vaga ≥80 % dentro de ±20 %.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { getNutritionAiClient } from "../../src/lib/nutrition/ai-client.ts";
import { CORE_BY_KEY } from "../../src/lib/nutrition/engine/core-foods.ts";
import { loadFoodDb } from "../../src/lib/nutrition/engine/db.ts";
import { makeLlmParser } from "../../src/lib/nutrition/engine/parse.ts";
import { parseWithRules } from "../../src/lib/nutrition/engine/parse-rules.ts";
import { analyzeMeal, type MealParser, type PipelineDeps } from "../../src/lib/nutrition/engine/pipeline.ts";
import { makeLlmReranker } from "../../src/lib/nutrition/engine/rerank.ts";
import { REF_MEALS, REF_MEALS_TEST, type RefMeal } from "./benchmark/meals.ts";

const args = process.argv.slice(2);
const arg = (name: string, def: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
};
const parserName = arg("parser", "rules");
const setName = arg("set", "dev");
const worstN = Number(arg("worst", "10"));

const db = loadFoodDb();

function truthOf(meal: RefMeal) {
  let kcal = 0;
  let protein = 0;
  for (const [key, grams] of meal.items) {
    const rec = CORE_BY_KEY.has(key) ? db.resolveCore(key) : db.byId.get(key);
    if (!rec) throw new Error(`Comida ${meal.id}: "${key}" no existe en la base`);
    kcal += (rec.per100g.kcal * grams) / 100;
    protein += (rec.per100g.protein_g * grams) / 100;
  }
  return { kcal, protein };
}

// dev = comidas 1–100 (ajuste) · test = 101–150 (congelado) · all = ambas.
const meals = setName === "all" ? [...REF_MEALS, ...REF_MEALS_TEST] : setName === "test" ? REF_MEALS_TEST : REF_MEALS;
for (const m of meals) truthOf(m); // falla antes de gastar llamadas si una clave no existe
if (args.includes("--check")) {
  console.log(`OK: ${meals.length} comidas con verdad válida`);
  process.exit(0);
}

let deps: PipelineDeps;
if (parserName === "llm") {
  const ai = getNutritionAiClient();
  if (!ai) {
    console.error("IA no configurada: faltan AZURE_OPENAI_ENDPOINT / AZURE_OPENAI_API_KEY (o OPENAI_API_KEY).");
    process.exit(1);
  }
  deps = { db, parser: makeLlmParser(ai), reranker: makeLlmReranker(ai) };
} else {
  deps = { db, parser: parseWithRules as MealParser };
}

type Row = { id: number; cat: string; mode: "grams" | "vague"; text: string; truth: number; got: number; err: number; pTruth: number; pGot: number; detail: string };
const rows: Row[] = [];

async function runOne(meal: RefMeal, mode: "grams" | "vague") {
  const truth = truthOf(meal);
  const text = mode === "grams" ? meal.grams : meal.vague;
  let got = 0;
  let pGot = 0;
  let detail = "";
  try {
    const res = await analyzeMeal(text, deps);
    got = res.totals.kcal;
    pGot = res.totals.protein_g;
    detail = res.items.map((i) => `${i.coreKey ?? i.recordId ?? "?"} ${i.grams}g`).join(", ");
  } catch (err) {
    detail = `ERROR ${(err as Error).message}`;
  }
  rows.push({ id: meal.id, cat: meal.cat, mode, text, truth: truth.kcal, got, err: (got - truth.kcal) / truth.kcal, pTruth: truth.protein, pGot, detail });
}

const jobs = meals.flatMap((m) => [() => runOne(m, "grams"), () => runOne(m, "vague")]);
const CONCURRENCY = parserName === "llm" ? 4 : 1;
let next = 0;
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (next < jobs.length) await jobs[next++]();
  }),
);

const pct = (x: number) => `${(x * 100).toFixed(1)} %`;
function stats(list: Row[]) {
  const n = list.length;
  const within = (t: number) => list.filter((r) => Math.abs(r.err) <= t).length / n;
  const mape = list.reduce((a, r) => a + Math.abs(r.err), 0) / n;
  const bias = list.reduce((a, r) => a + r.err, 0) / n;
  const pList = list.filter((r) => r.pTruth >= 5);
  const pMape = pList.reduce((a, r) => a + Math.abs(r.pGot - r.pTruth) / r.pTruth, 0) / Math.max(1, pList.length);
  return { n, w10: within(0.1), w20: within(0.2), mape, bias, pMape };
}

const summary: Record<string, ReturnType<typeof stats>> = {};
console.log(`\nMotor: lector=${parserName} · set=${setName} · ${meals.length} comidas\n`);
console.log("modo   categoría   n   ±10 %    ±20 %    error medio  sesgo    error proteína");
for (const mode of ["grams", "vague"] as const) {
  const byMode = rows.filter((r) => r.mode === mode);
  for (const cat of ["todas", "desayuno", "almuerzo", "cena", "domicilio", "snack", "fiesta"]) {
    const list = cat === "todas" ? byMode : byMode.filter((r) => r.cat === cat);
    if (!list.length) continue;
    const s = stats(list);
    if (cat === "todas") summary[mode] = s;
    console.log(`${mode.padEnd(6)} ${cat.padEnd(10)} ${String(s.n).padStart(3)}  ${pct(s.w10).padStart(7)}  ${pct(s.w20).padStart(7)}  ${pct(s.mape).padStart(9)}  ${pct(s.bias).padStart(7)}  ${pct(s.pMape).padStart(9)}`);
  }
  console.log("");
}

const goalGrams = summary.grams.w10 >= 0.9;
const goalVague = summary.vague.w20 >= 0.8;
console.log(`Meta con gramos (≥90 % en ±10 %): ${pct(summary.grams.w10)} ${goalGrams ? "✅" : "❌"}`);
console.log(`Meta vaga (≥80 % en ±20 %):       ${pct(summary.vague.w20)} ${goalVague ? "✅" : "❌"}`);

console.log(`\nPeores ${worstN}:`);
for (const r of [...rows].sort((a, b) => Math.abs(b.err) - Math.abs(a.err)).slice(0, worstN)) {
  console.log(`  #${r.id} ${r.mode} ${pct(r.err)}  verdad ${Math.round(r.truth)} vs ${Math.round(r.got)} kcal — "${r.text}"\n      → ${r.detail}`);
}

mkdirSync(".data/nutrition/bench", { recursive: true });
const out = `.data/nutrition/bench/${new Date().toISOString().replace(/[:.]/g, "-")}_${parserName}_${setName}.json`;
writeFileSync(out, JSON.stringify({ parser: parserName, set: setName, summary, rows }, null, 1));
console.log(`\nReporte: ${out}`);
