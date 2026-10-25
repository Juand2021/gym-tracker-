/**
 * Traduce nombres USDA al español (Colombia) y genera sinónimos colombianos
 * para la TCAC. Guarda el progreso en un caché para poder reanudar.
 *
 * Uso: node --env-file=.env.local --experimental-strip-types scripts/nutrition/enrich_names.ts
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { getNutritionAiClient, structuredCompletion } from "../../src/lib/nutrition/ai-client.ts";

const RAW = ".data/nutrition-raw";
const CACHE = `${RAW}/names_cache.json`;
const BATCH = 60;
const CONCURRENCY = 6;

type Cache = Record<string, { es?: string; en?: string; aliases: string[] }>;
type Item = { id: string; name: string; lang: "en" | "es" };

const cache: Cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, "utf8")) : {};

const fdc = JSON.parse(readFileSync(`${RAW}/fdc_compact.json`, "utf8")) as { id: string; name_en: string }[];
const tcac = JSON.parse(readFileSync(`${RAW}/tcac_2015.json`, "utf8")) as { id: string; name: string }[];

const items: Item[] = [
  ...tcac.map((f) => ({ id: f.id, name: f.name, lang: "es" as const })),
  ...fdc.map((f) => ({ id: f.id, name: f.name_en, lang: "en" as const })),
].filter((it) => !cache[it.id]);

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["items"],
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["i", "translated", "aliases"],
        properties: {
          i: { type: "integer" },
          translated: { type: "string" },
          aliases: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
};

const SYSTEM_EN = [
  "Traduces nombres de alimentos de la base USDA al español de Colombia.",
  "translated: nombre claro y corto en español, conservando estado y cocción (crudo, cocido, frito, asado, sin piel...).",
  "aliases: 0 a 4 formas en que un colombiano diría ese alimento en el día a día (ej. 'pechuga de pollo asada', 'gaseosa', 'tinto').",
  "No inventes ingredientes. Marcas: conserva el nombre de la marca.",
].join(" ");

const SYSTEM_ES = [
  "Recibes nombres de la Tabla de Composición de Alimentos Colombianos.",
  "translated: traducción al inglés estilo USDA (ej. 'Rice, white, cooked').",
  "aliases: 0 a 5 formas coloquiales en que un colombiano nombraría ese alimento (sin tildes opcionales no hacen falta), incluyendo regionalismos (ej. 'fríjol' → 'frijoles', 'frisoles'; 'plátano maduro frito' → 'tajadas', 'maduro').",
  "No inventes alimentos distintos.",
].join(" ");

async function runBatch(batch: Item[], lang: "en" | "es") {
  const ai = getNutritionAiClient();
  if (!ai) throw new Error("IA no configurada");
  const user = batch.map((it, i) => `${i}\t${it.name}`).join("\n");
  const res = await structuredCompletion<{ items: { i: number; translated: string; aliases: string[] }[] }>(ai, {
    system: lang === "en" ? SYSTEM_EN : SYSTEM_ES,
    user,
    schemaName: "food_names",
    schema,
    reasoningEffort: "minimal",
  });
  for (const r of res.items) {
    const it = batch[r.i];
    if (!it) continue;
    cache[it.id] =
      lang === "en"
        ? { es: r.translated, aliases: r.aliases.slice(0, 5) }
        : { en: r.translated, aliases: r.aliases.slice(0, 6) };
  }
}

async function main() {
  const groups: { batch: Item[]; lang: "en" | "es" }[] = [];
  for (const lang of ["es", "en"] as const) {
    const list = items.filter((it) => it.lang === lang);
    for (let i = 0; i < list.length; i += BATCH) groups.push({ batch: list.slice(i, i + BATCH), lang });
  }
  console.log(`Pendientes: ${items.length} nombres en ${groups.length} lotes`);
  let done = 0;
  let next = 0;
  async function worker() {
    while (next < groups.length) {
      const g = groups[next++];
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          await runBatch(g.batch, g.lang);
          break;
        } catch (err) {
          if (attempt === 3) console.error("Lote fallido:", (err as Error).message);
          else await new Promise((r) => setTimeout(r, 2000 * attempt));
        }
      }
      done++;
      if (done % 10 === 0) {
        writeFileSync(CACHE, JSON.stringify(cache));
        console.log(`${done}/${groups.length} lotes`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  writeFileSync(CACHE, JSON.stringify(cache));
  console.log(`Listo. En caché: ${Object.keys(cache).length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
