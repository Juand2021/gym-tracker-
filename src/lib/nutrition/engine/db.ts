import { readFileSync } from "node:fs";
import { CORE_BY_KEY } from "./core-foods.ts";
import type { CoreFood, FoodRecord } from "./types.ts";

export type FoodDb = {
  records: FoodRecord[];
  byId: Map<string, FoodRecord>;
  /** Registro con los nutrientes de un alimento del núcleo (su `ref` o el registro propio CORE-x). */
  resolveCore(key: string): FoodRecord | undefined;
  /** Alimento del núcleo al que pertenece un registro, si lo hay. */
  coreOf(recordId: string): CoreFood | undefined;
};

export function makeFoodDb(records: FoodRecord[]): FoodDb {
  const byId = new Map(records.map((r) => [r.id, r]));
  const coreByRecord = new Map<string, CoreFood>();
  for (const core of CORE_BY_KEY.values()) {
    const id = core.ref ?? `CORE-${core.key}`;
    if (!coreByRecord.has(id)) coreByRecord.set(id, core);
  }
  return {
    records,
    byId,
    resolveCore(key) {
      const core = CORE_BY_KEY.get(key);
      if (!core) return undefined;
      const rec = byId.get(core.ref ?? `CORE-${core.key}`);
      if (rec) return rec;
      // Base sin el registro propio (p. ej. en tests): se arma desde el núcleo.
      if (core.per100g) return { id: `CORE-${core.key}`, source: core.source ?? "ESTIMATE", name_es: core.name, aliases: core.aliases, per100g: core.per100g, portions: [], quality: "estimated" };
      return undefined;
    },
    coreOf(recordId) {
      if (recordId.startsWith("CORE-")) return CORE_BY_KEY.get(recordId.slice(5));
      return coreByRecord.get(recordId);
    },
  };
}

let cached: FoodDb | null = null;

/** Carga la base generada por scripts/nutrition/build_db.ts (solo en servidor / scripts). */
export function loadFoodDb(path = ".data/nutrition/foods.json"): FoodDb {
  if (!cached) cached = makeFoodDb(JSON.parse(readFileSync(path, "utf8")) as FoodRecord[]);
  return cached;
}
