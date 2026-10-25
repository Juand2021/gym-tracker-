import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { atwaterKcal, scale, sum, validateItem } from "./compute.ts";
import { CORE_FOODS, DISH_TEMPLATES } from "./core-foods.ts";
import { makeFoodDb } from "./db.ts";
import { parseWithRules } from "./parse-rules.ts";
import { analyzeMeal, expandDish, oilFor } from "./pipeline.ts";
import { resolveGrams } from "./portions.ts";
import { fuseRankings, searchFoods } from "./search.ts";
import { normalize, parseQuantity, stem, tokenize } from "./text.ts";
import type { FoodRecord, Nutrients } from "./types.ts";

const n = (kcal: number, protein_g: number, fat_g: number, carb_g: number, fiber_g = 0): Nutrients => ({
  kcal, protein_g, fat_g, carb_g, fiber_g, alcohol_g: 0, water_g: 0,
});
const rec = (id: string, name_es: string, per100g: Nutrients, name_en?: string): FoodRecord => ({
  id, source: id.startsWith("TCAC") ? "TCAC-2015" : "FDC-SR", name_es, name_en, aliases: [], per100g, portions: [], quality: "analyzed",
});

// Base mínima con las referencias reales del núcleo que usan las pruebas.
const db = makeFoodDb([
  rec("TCAC-10", "Arroz blanco, cocido", n(153, 3.2, 2.1, 30.5)),
  rec("TCAC-530", "Carne de pollo, pechuga, asada", n(163, 29.7, 4.9, 0)),
  rec("TCAC-377", "Aceite, refinado, de girasol", n(900, 0, 100, 0)),
  rec("TCAC-4", "Arepa de maíz blanco trillado, asado", n(160, 3.6, 0.5, 35.5)),
  rec("TCAC-680", "Huevo de gallina, revuelto", n(207, 14.3, 16.7, 0)),
  rec("TCAC-637", "Queso campesino", n(264, 18.8, 20.3, 1.6)),
  rec("TCAC-908", "Chocolate, bebida con agua y leche", n(88, 2.1, 3.6, 11.8)),
  rec("TCAC-307", "Guanábana, pulpa", n(66, 1, 0.3, 15)),
  rec("FDC-1", "", n(52, 0.3, 0.2, 13.8), "Apples, raw, with skin"),
]);

describe("text", () => {
  it("normaliza tildes, mayúsculas y signos", () => {
    assert.equal(normalize("  Fríjoles, ¡Papá!  "), "frijoles, papa");
  });
  it("reduce plurales comunes", () => {
    assert.equal(stem("frijoles"), "frijol");
    assert.equal(stem("papas"), "papa");
    assert.equal(stem("patacones"), "patacon");
    assert.equal(stem("huevos"), "huevo");
    assert.equal(stem("arroz"), "arroz");
  });
  it("quita palabras vacías", () => {
    assert.deepEqual(tokenize("Arroz con pollo y papas"), ["arroz", "pollo", "papa"]);
  });
  it("lee cantidades en número y en palabras", () => {
    assert.equal(parseQuantity("2"), 2);
    assert.equal(parseQuantity("1,5"), 1.5);
    assert.equal(parseQuantity("media"), 0.5);
    assert.equal(parseQuantity("tres"), 3);
    assert.equal(parseQuantity("1/2"), 0.5);
    assert.equal(parseQuantity("arroz"), null);
  });
});

describe("compute", () => {
  it("escala por gramos y suma", () => {
    const a = scale(n(150, 3, 2, 30), 200);
    assert.equal(a.kcal, 300);
    assert.equal(sum([a, a]).protein_g, 12);
  });
  it("Atwater cuadra con el arroz de la TCAC", () => {
    const err = Math.abs(atwaterKcal(n(153, 3.2, 2.1, 30.5)) - 153) / 153;
    assert.ok(err < 0.05);
  });
  it("avisa cantidades imposibles", () => {
    assert.ok(validateItem(n(100, 5, 5, 8.75), 2000).some((w) => w.code === "grams_high"));
    assert.equal(validateItem({ ...n(43, 0.5, 0, 3.5), alcohol_g: 3.9 }, 2000, true).length, 0);
  });
});

describe("portions", () => {
  const arepa = CORE_FOODS.find((f) => f.key === "arepa_blanca")!;
  const arroz = CORE_FOODS.find((f) => f.key === "arroz_blanco")!;
  it("los gramos dichos mandan", () => {
    assert.deepEqual(resolveGrams({ grams: 300, quantity: 2, unit: "unidad" }, arepa).grams, 300);
  });
  it("usa la porción colombiana del núcleo", () => {
    assert.equal(resolveGrams({ quantity: 2, unit: "unidad" }, arepa).grams, 140);
    assert.equal(resolveGrams({ quantity: 1, unit: "plato" }, arroz).grams, 250);
  });
  it("sin unidad usa la porción por defecto", () => {
    const r = resolveGrams({}, arroz);
    assert.equal(r.grams, 180);
    assert.equal(r.basis, "core_default");
  });
  it("media taza = la mitad de la taza", () => {
    assert.equal(resolveGrams({ quantity: 0.5, unit: "taza" }, arroz).grams, 80);
  });
  it("tamaño grande aumenta la porción", () => {
    assert.ok(resolveGrams({ size: "grande" }, arepa).grams > 70);
  });
  it("unidad genérica si el alimento no la tiene", () => {
    assert.equal(resolveGrams({ quantity: 2, unit: "cucharada" }).grams, 30);
  });
});

describe("search", () => {
  it("encuentra por nombre en español sin tildes", () => {
    assert.equal(searchFoods(db, "guanabana")[0]?.id, "TCAC-307");
  });
  it("encuentra por sinónimo del núcleo", () => {
    assert.equal(searchFoods(db, "pericos")[0]?.id, "TCAC-680");
  });
  it("encuentra nombres USDA en inglés", () => {
    assert.equal(searchFoods(db, "apple raw")[0]?.id, "FDC-1");
  });
  it("RRF premia lo que aparece arriba en varias listas", () => {
    const fused = fuseRankings([
      [{ id: "a", score: 1 }, { id: "b", score: 0.5 }],
      [{ id: "b", score: 1 }, { id: "c", score: 0.5 }],
    ]);
    assert.equal(fused[0].id, "b");
  });
});

describe("pipeline", () => {
  it("todas las plantillas de platos usan claves del núcleo", () => {
    const keys = new Set(CORE_FOODS.map((f) => f.key));
    for (const d of DISH_TEMPLATES) for (const c of d.components) {
      assert.ok(keys.has(c.coreKey), `${d.key}.${c.slot} → ${c.coreKey}`);
      for (const alt of c.alternatives ?? []) assert.ok(keys.has(alt), `${d.key}.${c.slot} alt ${alt}`);
    }
  });
  it("las claves y sinónimos del núcleo no se repiten", () => {
    const keys = CORE_FOODS.map((f) => f.key);
    assert.equal(new Set(keys).size, keys.length);
  });
  it("expande un plato con cambios y omisiones", () => {
    const items = expandDish("corrientazo", { overrides: { proteina: "cerdo_asado" }, omit: ["sopa"] });
    assert.ok(items.some((i) => i.core_key === "cerdo_asado"));
    assert.ok(!items.some((i) => i.core_key === "sopa_dia"));
    assert.ok(items.every((i) => i.grams_from === "template"));
  });
  it("suma aceite al freír lo que no lo trae incluido", () => {
    const pechuga = CORE_FOODS.find((f) => f.key === "pechuga_asada")!;
    const arroz = CORE_FOODS.find((f) => f.key === "arroz_blanco")!;
    assert.equal(oilFor("frito", pechuga, 150), 12);
    assert.equal(oilFor("frito", arroz, 150), 0);
    assert.equal(oilFor(null, pechuga, 150), 0);
  });
  it("calcula una comida completa con el lector por reglas", async () => {
    const r = await analyzeMeal("2 arepas, 3 huevos pericos y 200 g de arroz", { db, parser: parseWithRules });
    const byKey = Object.fromEntries(r.items.map((i) => [i.coreKey, i]));
    assert.equal(byKey.arepa_blanca.grams, 140);
    assert.equal(byKey.huevos_revueltos.grams, 180);
    assert.equal(byKey.arroz_blanco.grams, 200);
    assert.equal(byKey.arroz_blanco.gramsBasis, "said");
    assert.equal(r.totals.kcal, Math.round(224 + 372.6 + 306));
  });
  it("respeta 'sin' y unidades de tajada", async () => {
    const r = await analyzeMeal("pechuga 130 g y 2 tajadas de queso, chocolate sin azúcar", { db, parser: parseWithRules });
    assert.deepEqual(r.items.map((i) => i.coreKey), ["pechuga_asada", "queso_campesino", "chocolate_bebida"]);
    assert.equal(r.items[1].grams, 60);
  });
  it("entiende fracciones dentro de la frase", async () => {
    const r = await analyzeMeal("1/2 arepa", { db, parser: parseWithRules });
    assert.equal(r.items[0].grams, 35);
  });
  it("agrega el aceite de una pechuga frita", async () => {
    const r = await analyzeMeal("una pechuga frita", { db, parser: parseWithRules });
    assert.ok(r.items.some((i) => i.addedOil && i.grams === 10));
  });
});
