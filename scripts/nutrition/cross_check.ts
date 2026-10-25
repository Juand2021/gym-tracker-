/**
 * Verificación del núcleo curado:
 *  1. Cada alimento con `crossCheck` vs su equivalente (alerta si difiere >30 % en kcal/100 g).
 *     Si la diferencia está explicada en `sourceNote` se muestra como ℹ y no cuenta.
 *  2. Atwater: 4P + 4C + 9G + 2F + 7A debe explicar las kcal (±15 %) en alimentos de >50 kcal/100 g.
 *
 * Uso: node --experimental-strip-types scripts/nutrition/cross_check.ts
 * Requiere .data/nutrition/foods.json (build_db.ts).
 */
import { CORE_FOODS } from "../../src/lib/nutrition/engine/core-foods.ts";
import { atwaterKcal } from "../../src/lib/nutrition/engine/compute.ts";
import { loadFoodDb } from "../../src/lib/nutrition/engine/db.ts";

const db = loadFoodDb();
let alerts = 0;

for (const core of CORE_FOODS) {
  const rec = db.resolveCore(core.key);
  if (!rec) {
    console.log(`✗ ${core.key}: no se encontró en la base`);
    alerts++;
    continue;
  }
  const k = rec.per100g.kcal;
  if (core.crossCheck) {
    const other = db.byId.get(core.crossCheck);
    if (other) {
      const diff = (k - other.per100g.kcal) / other.per100g.kcal;
      const big = Math.abs(diff) > 0.3;
      // Una diferencia grande explicada en sourceNote es una decisión ya tomada, no un error.
      const flag = big && !core.sourceNote;
      if (flag) alerts++;
      console.log(`${flag ? "⚠" : big ? "ℹ" : "✓"} ${core.key.padEnd(20)} ${k} vs ${other.per100g.kcal} (${other.name_en ?? other.name_es}) ${(diff * 100).toFixed(0)} %`);
    }
  }
  if (k > 50) {
    const at = atwaterKcal(rec.per100g);
    const err = (at - k) / k;
    if (Math.abs(err) > 0.15) {
      alerts++;
      console.log(`⚠ Atwater ${core.key}: tabla ${k} kcal, calculado ${at.toFixed(0)} (${(err * 100).toFixed(0)} %)`);
    }
  }
}

console.log(alerts ? `\n${alerts} alertas` : "\nSin alertas");
process.exit(alerts ? 1 : 0);
