import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { buildNutritionContext, runNutritionTool, type ToolContext } from "./chat-tools.ts";
import type { MealResult } from "./engine/pipeline.ts";
import { JUAN_DEFAULT_PROFILE } from "./profile.ts";
import { createLocalStore } from "./store.ts";
import { computeTargets } from "./targets.ts";

const NOW = new Date("2026-10-25T18:00:00Z"); // 13:00 en Colombia

function fakeAnalyze(text: string): Promise<MealResult> {
  const arepas = /2 arepas/.test(text) ? 2 : 1;
  const beers = Number(text.match(/(\d+) polas/)?.[1] ?? 0);
  const items = [
    { name: "arepa", recordId: "TCAC-4", recordName: "Arepa", coreKey: "arepa_blanca", grams: 70 * arepas, gramsBasis: "core" as const, gramsNote: "", nutrients: { kcal: 112 * arepas, protein_g: 2.5 * arepas, fat_g: 0.4, carb_g: 25 * arepas, fiber_g: 0, alcohol_g: 0, water_g: 0 }, confidence: 0.8, assumption: null, fromDish: null, addedOil: false, warnings: [] },
  ];
  if (beers) items.push({ ...items[0], name: "cerveza", coreKey: "cerveza", grams: 330 * beers, nutrients: { kcal: 142 * beers, protein_g: 1.5 * beers, fat_g: 0, carb_g: 12 * beers, fiber_g: 0, alcohol_g: 12.9 * beers, water_g: 0 } });
  const totals = items.reduce((a, i) => ({ ...a, kcal: a.kcal + i.nutrients.kcal, protein_g: a.protein_g + i.nutrients.protein_g, alcohol_g: a.alcohol_g + i.nutrients.alcohol_g }), { kcal: 0, protein_g: 0, fat_g: 0, carb_g: 0, fiber_g: 0, alcohol_g: 0, water_g: 0 });
  return Promise.resolve({ items, totals, question: null });
}

function makeCtx(turnId: string, store = createLocalStore(path.join(mkdtempSync(path.join(tmpdir(), "nutri-")), "s.json"))): ToolContext {
  return {
    store,
    analyze: fakeAnalyze,
    targetsFor: async () => computeTargets({ profile: JUAN_DEFAULT_PROFILE, weightKg: 78, workoutDates: [], today: "2026-10-25" }),
    threadId: "hilo-1",
    turnId,
    now: NOW,
  };
}

describe("herramientas de Comidas en el chat", () => {
  it("analizar crea un borrador que no cuenta en el día", async () => {
    const ctx = makeCtx("t1");
    const res = await runNutritionTool("analizar_comida", { texto: "una arepa", fecha: null, momento: null }, ctx);
    assert.ok(res.borrador_id);
    assert.equal(res.momento, "almuerzo");
    const day = await runNutritionTool("resumen_dia", { fecha: null }, ctx);
    assert.equal(day.consumido_kcal, 0);
  });

  it("NO guarda en el mismo turno en que analizó", async () => {
    const ctx = makeCtx("t1");
    const res = await runNutritionTool("analizar_comida", { texto: "una arepa", fecha: null, momento: null }, ctx);
    const save = await runNutritionTool("guardar_comida", { borrador_id: res.borrador_id }, ctx);
    assert.ok(save.error);
    assert.equal((await ctx.store.listMeals("2026-10-25", "2026-10-25")).length, 0);
  });

  it("guarda en el turno siguiente y cuenta en el día", async () => {
    const ctx1 = makeCtx("t1");
    const res = await runNutritionTool("analizar_comida", { texto: "una arepa", fecha: null, momento: null }, ctx1);
    const ctx2 = { ...ctx1, turnId: "t2" };
    const save = await runNutritionTool("guardar_comida", { borrador_id: res.borrador_id }, ctx2);
    assert.equal(save.guardada, true);
    const day = await runNutritionTool("resumen_dia", { fecha: null }, ctx2);
    assert.equal(day.consumido_kcal, 112);
    // El borrador ya no existe: no se puede guardar dos veces.
    assert.ok((await runNutritionTool("guardar_comida", { borrador_id: res.borrador_id }, { ...ctx1, turnId: "t3" })).error);
  });

  it("una corrección rehace el borrador y exige mostrarlo otra vez", async () => {
    const ctx1 = makeCtx("t1");
    const res = await runNutritionTool("analizar_comida", { texto: "una arepa", fecha: null, momento: null }, ctx1);
    const ctx2 = { ...ctx1, turnId: "t2" };
    const fixed = await runNutritionTool("corregir_comida", { borrador_id: res.borrador_id, comida_id: null, correccion: "eran 2 arepas" }, ctx2);
    assert.equal((fixed.totales as { kcal: number }).kcal, 224);
    assert.ok((await runNutritionTool("guardar_comida", { borrador_id: fixed.borrador_id }, ctx2)).error);
    assert.equal((await runNutritionTool("guardar_comida", { borrador_id: fixed.borrador_id }, { ...ctx1, turnId: "t3" })).guardada, true);
  });

  it("corregir una comida guardada la reemplaza (no la duplica)", async () => {
    const ctx = makeCtx("t1");
    const a = await runNutritionTool("analizar_comida", { texto: "una arepa", fecha: null, momento: null }, ctx);
    const saved = await runNutritionTool("guardar_comida", { borrador_id: a.borrador_id }, { ...ctx, turnId: "t2" });
    const fix = await runNutritionTool("corregir_comida", { borrador_id: null, comida_id: saved.comida_id, correccion: "eran 2 arepas" }, { ...ctx, turnId: "t3" });
    await runNutritionTool("guardar_comida", { borrador_id: fix.borrador_id }, { ...ctx, turnId: "t4" });
    const meals = await ctx.store.listMeals("2026-10-25", "2026-10-25");
    assert.equal(meals.length, 1);
    assert.equal(meals[0].totals.kcal, 224);
  });

  it("borrar pide confirmación en un turno posterior", async () => {
    const ctx = makeCtx("t1");
    const a = await runNutritionTool("analizar_comida", { texto: "una arepa", fecha: null, momento: null }, ctx);
    const saved = await runNutritionTool("guardar_comida", { borrador_id: a.borrador_id }, { ...ctx, turnId: "t2" });
    const ask = await runNutritionTool("borrar_comida", { comida_id: saved.comida_id }, { ...ctx, turnId: "t3" });
    assert.equal(ask.pendiente_de_confirmar, true);
    // Repetir en el mismo turno no borra.
    await runNutritionTool("borrar_comida", { comida_id: saved.comida_id }, { ...ctx, turnId: "t3" });
    assert.equal((await ctx.store.listMeals("2026-10-25", "2026-10-25")).length, 1);
    const done = await runNutritionTool("borrar_comida", { comida_id: saved.comida_id }, { ...ctx, turnId: "t4" });
    assert.equal(done.borrada, true);
    assert.equal((await ctx.store.listMeals("2026-10-25", "2026-10-25")).length, 0);
  });

  it("marca la fiesta y la muestra en el contexto", async () => {
    const ctx = makeCtx("t1");
    const a = await runNutritionTool("analizar_comida", { texto: "una arepa y 6 polas", fecha: null, momento: null }, ctx);
    assert.equal(a.momento, "fiesta");
    assert.equal((a.dia_si_se_guarda as { dia_de_fiesta?: boolean }).dia_de_fiesta, true);
    await runNutritionTool("guardar_comida", { borrador_id: a.borrador_id }, { ...ctx, turnId: "t2" });
    const text = await buildNutritionContext({ ...ctx, turnId: "t3" });
    assert.match(text, /FIESTA/);
    assert.match(text, /Objetivos diarios: \d+ kcal/);
  });

  it("consultar opciones no guarda nada", async () => {
    const ctx = makeCtx("t1");
    const res = await runNutritionTool("consultar_opciones", { opciones: ["una arepa", "2 arepas"] }, ctx);
    assert.equal((res.opciones as unknown[]).length, 2);
    assert.equal((await ctx.store.listMeals("2026-10-25", "2026-10-25")).length, 0);
    assert.equal((await ctx.store.listDrafts("hilo-1")).length, 0);
  });
});
