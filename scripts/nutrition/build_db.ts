/**
 * Une TCAC 2015 + USDA FDC + nombres traducidos (si existen) + núcleo curado
 * en una sola base: .data/nutrition/foods.json
 *
 * Uso: node --experimental-strip-types scripts/nutrition/build_db.ts
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { CORE_FOODS } from "../../src/lib/nutrition/engine/core-foods.ts";
import type { FoodRecord, FoodSource, Nutrients, Portion, PortionUnit } from "../../src/lib/nutrition/engine/types.ts";

const RAW = ".data/nutrition-raw";
const OUT_DIR = ".data/nutrition";

type TcacRow = {
  id: string;
  name: string;
  group: string;
  kcal: number;
  water_g: number | null;
  protein_g: number | null;
  fat_g: number | null;
  carb_g: number | null;
  fiber_g: number | null;
};
type FdcRow = {
  id: string;
  source: FoodSource;
  name_en: string;
  category_en: string;
  kcal: number;
  protein_g: number;
  fat_g: number;
  carb_g: number;
  fiber_g: number;
  water_g: number;
  alcohol_g: number;
  portions: { label_en: string; grams: number }[];
};
type NamesCache = Record<string, { es?: string; en?: string; aliases: string[] }>;

const r1 = (x: number) => Math.round(x * 10) / 10;
const num = (x: number | null | undefined) => (typeof x === "number" && Number.isFinite(x) ? x : 0);

const tcac = JSON.parse(readFileSync(`${RAW}/tcac_2015.json`, "utf8")) as TcacRow[];
const fdc = JSON.parse(readFileSync(`${RAW}/fdc_compact.json`, "utf8")) as FdcRow[];
const namesPath = `${RAW}/names_cache.json`;
const names: NamesCache = existsSync(namesPath) ? JSON.parse(readFileSync(namesPath, "utf8")) : {};

const ALCOHOLIC = /\b(cerveza|chicha|guarapo|vino|aguardiente|ron|whisky|vodka)\b/i;

function tcacRecord(row: TcacRow): FoodRecord {
  const per100g: Nutrients = {
    kcal: num(row.kcal),
    protein_g: num(row.protein_g),
    fat_g: num(row.fat_g),
    carb_g: num(row.carb_g),
    fiber_g: num(row.fiber_g),
    alcohol_g: 0,
    water_g: num(row.water_g),
  };
  // La TCAC no trae etanol: se deduce de las kcal que Atwater no explica.
  if (ALCOHOLIC.test(row.name)) {
    const atwater = 4 * per100g.protein_g + 4 * per100g.carb_g + 9 * per100g.fat_g + 2 * per100g.fiber_g;
    const gap = per100g.kcal - atwater;
    if (gap > 0) per100g.alcohol_g = r1(gap / 7);
  }
  const extra = names[row.id];
  return {
    id: row.id,
    source: "TCAC-2015",
    name_es: row.name,
    name_en: extra?.en,
    aliases: extra?.aliases ?? [],
    per100g,
    portions: [],
    quality: "analyzed",
  };
}

const UNIT_MAP: [RegExp, PortionUnit][] = [
  [/\bcups?\b/i, "taza"],
  [/\btbsp|tablespoons?\b/i, "cucharada"],
  [/\btsp|teaspoons?\b/i, "cucharadita"],
  [/\bslices?\b/i, "tajada"],
  [/\bcans?\b/i, "lata"],
  [/\bbottles?\b/i, "botella"],
  [/\bglass(es)?\b/i, "vaso"],
  [/\bscoops?\b/i, "scoop"],
  [/\bpackets?|packages?|bags?\b/i, "paquete"],
];
/** Medidas que no son "una unidad" del alimento: onzas, libras, gramos, recetas. */
const NOT_A_UNIT = /\b(oz|fl|lb|pounds?|g|grams?|kg|ml|liters?|recipes?|servings?|batch|container)\b/i;

function fdcPortions(row: FdcRow): Portion[] {
  const out: Portion[] = [];
  for (const p of row.portions ?? []) {
    if (!p.grams || /RACC/i.test(p.label_en)) continue;
    // FNDDS: código 90000 = "cantidad no especificada" = la porción típica.
    if (/\b9\d{4}\b|quantity not specified/i.test(p.label_en)) {
      out.push({ unit: "porcion", grams: p.grams, label: "Porción típica (USDA)", basis: "USDA" });
      continue;
    }
    const known = UNIT_MAP.find(([re]) => re.test(p.label_en))?.[1];
    if (known) out.push({ unit: known, grams: p.grams, label: p.label_en, basis: "USDA" });
    // "1 nugget", "1 taco", "1 medium": una unidad del alimento.
    else if (!NOT_A_UNIT.test(p.label_en)) out.push({ unit: "unidad", grams: p.grams, label: p.label_en, basis: "USDA" });
  }
  // Si hay varias del mismo tipo, la primera del USDA es la más común.
  return out;
}

function fdcRecord(row: FdcRow): FoodRecord {
  const extra = names[row.id];
  return {
    id: row.id,
    source: row.source,
    name_es: extra?.es ?? "",
    name_en: row.name_en,
    aliases: extra?.aliases ?? [],
    per100g: {
      kcal: num(row.kcal),
      protein_g: num(row.protein_g),
      fat_g: num(row.fat_g),
      carb_g: num(row.carb_g),
      fiber_g: num(row.fiber_g),
      alcohol_g: num(row.alcohol_g),
      water_g: num(row.water_g),
    },
    portions: fdcPortions(row),
    quality: row.source === "FDC-FNDDS" ? "imputed" : "analyzed",
  };
}

const records: FoodRecord[] = [...tcac.map(tcacRecord), ...fdc.map(fdcRecord)];
const byId = new Map(records.map((r) => [r.id, r]));

// Núcleo: validar referencias y crear registros propios para los que traen valores.
const problems: string[] = [];
for (const core of CORE_FOODS) {
  if (core.ref) {
    if (!byId.has(core.ref)) problems.push(`${core.key}: ref ${core.ref} no existe`);
  } else if (core.per100g) {
    const rec: FoodRecord = {
      id: `CORE-${core.key}`,
      source: core.source ?? "ESTIMATE",
      name_es: core.name,
      aliases: core.aliases,
      per100g: core.per100g,
      portions: [],
      quality: "estimated",
    };
    records.push(rec);
    byId.set(rec.id, rec);
  } else {
    problems.push(`${core.key}: sin ref ni per100g`);
  }
  if (core.crossCheck && !byId.has(core.crossCheck)) problems.push(`${core.key}: crossCheck ${core.crossCheck} no existe`);
}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(`${OUT_DIR}/foods.json`, JSON.stringify(records));

const translated = records.filter((r) => r.source.startsWith("FDC") && r.name_es).length;
console.log(`Registros: ${records.length} (TCAC ${tcac.length}, FDC ${fdc.length}, núcleo propio ${records.length - tcac.length - fdc.length})`);
console.log(`FDC con nombre en español: ${translated}/${fdc.length}`);
console.log(`Bebidas TCAC con alcohol deducido: ${records.filter((r) => r.source === "TCAC-2015" && r.per100g.alcohol_g > 0).map((r) => `${r.name_es} ${r.per100g.alcohol_g} g`).join(", ")}`);
if (problems.length) {
  console.error(`Problemas en el núcleo (${problems.length}):\n  ${problems.join("\n  ")}`);
  process.exit(1);
}
console.log("Núcleo: todas las referencias existen.");
