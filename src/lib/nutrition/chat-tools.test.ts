import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { buildNutritionContext, runNutritionTool, type ToolContext } from "./chat-tools.ts";
import type { MealResult } from "./engine/pipeline.ts";
import { JUAN_PROFILE, missingForTargets, type NutritionProfile } from "./profile.ts";
import { createLocalStore } from "./store.ts";
import { computeTargets, type TargetsLookup } from "./targets.ts";
import type { Nutrients } from "./engine/types.ts";

// Hoy a las 13:00 de Colombia: los borradores vencen con el reloj real (24 h), así que la fecha no puede ser fija.
const NOW = new Date(`${new Date().toISOString().slice(0, 10)}T18:00:00Z`);
const TODAY = NOW.toISOString().slice(0, 10);

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

/** Igual que server.ts: objetivos si el perfil está completo; si no, lo que falta. */
async function lookup(store: ToolContext["store"], weighIns: number[]): Promise<TargetsLookup> {
  const profile = await store.getProfile();
  const missing = missingForTargets(profile, weighIns.length > 0);
  if (missing.length || !profile) return { ok: false, missing, profile };
  return { ok: true, profile, targets: computeTargets({ profile, weightKg: weighIns.at(-1) ?? profile.weightKg!, workoutDates: [], today: TODAY }) };
}

const n = (kcal: number, protein_g: number, fat_g: number, carb_g: number): Nutrients => ({ kcal, protein_g, fat_g, carb_g, fiber_g: 0, alcohol_g: 0, water_g: 0 });
const NUTRIENTS: Record<string, Nutrients> = {
  pechuga_asada: n(163, 29.7, 4.9, 0),
  res_asada: n(277, 36.9, 14.4, 0),
  huevo_cocido: n(134, 14, 8.6, 0.1),
  lentejas: n(117, 7, 1.4, 19),
  frijoles: n(137, 8.2, 1.7, 22.2),
  yogurt_griego: n(94, 8.8, 4.4, 4.8),
  arroz_blanco: n(153, 3.2, 2.1, 30.5),
  arepa_blanca: n(160, 3.6, 0.5, 35.5),
  ensalada: n(35, 1.8, 0.3, 6.4),
};

function makeCtx(turnId: string, store = createLocalStore(path.join(mkdtempSync(path.join(tmpdir(), "nutri-")), "s.json")), profile: NutritionProfile | null = JUAN_PROFILE): ToolContext {
  const weighIns: number[] = [];
  if (profile) void store.saveProfile(profile);
  return {
    store,
    analyze: fakeAnalyze,
    targetsFor: () => lookup(store, weighIns),
    nutrientsOf: (k) => NUTRIENTS[k],
    logWeight: async (_d, kg) => {
      weighIns.push(kg);
    },
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
    assert.equal((await ctx.store.listMeals(TODAY, TODAY)).length, 0);
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
    const meals = await ctx.store.listMeals(TODAY, TODAY);
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
    assert.equal((await ctx.store.listMeals(TODAY, TODAY)).length, 1);
    const done = await runNutritionTool("borrar_comida", { comida_id: saved.comida_id }, { ...ctx, turnId: "t4" });
    assert.equal(done.borrada, true);
    assert.equal((await ctx.store.listMeals(TODAY, TODAY)).length, 0);
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
    assert.equal((await ctx.store.listMeals(TODAY, TODAY)).length, 0);
    assert.equal((await ctx.store.listDrafts("hilo-1")).length, 0);
  });
});

describe("perfil y objetivo por el chat (cualquier persona)", () => {
  it("una persona nueva: sin perfil pide datos y no da objetivos", async () => {
    const ctx = makeCtx("t1", undefined, null);
    const res = await runNutritionTool("ver_perfil", {}, ctx);
    assert.equal(res.perfil_incompleto, true);
    assert.ok((res.faltan as string[]).includes("objetivo"));
    const text = await buildNutritionContext(ctx);
    assert.match(text, /PERFIL INCOMPLETO/);
    assert.match(text, /persona nueva/);
  });

  it("completa el perfil paso a paso y calcula sus objetivos", async () => {
    const ctx = makeCtx("t1", undefined, null);
    const a = await runNutritionTool("actualizar_perfil", { sexo: "F", fecha_nacimiento: "1996-03-02", estatura_cm: 163 }, ctx);
    assert.equal(a.guardado, true);
    assert.equal(a.perfil_incompleto, true);
    const b = await runNutritionTool(
      "actualizar_perfil",
      { peso_kg: 64, actividad: "ligero", dias_entreno_semana: 3, objetivo: { tipo: "deficit", ritmo_pct_semana: 0.5, descripcion: "bajar 4 kg" } },
      ctx,
    );
    assert.equal(b.guardado, true);
    const objetivos = b.objetivos_diarios as { kcal: number; proteina_g: number };
    assert.ok(objetivos.kcal >= 1200 && objetivos.kcal < 2200, String(objetivos.kcal));
    assert.equal(objetivos.proteina_g, Math.round(2.2 * 64));
  });

  it("no guarda datos imposibles", async () => {
    const ctx = makeCtx("t1", undefined, null);
    const res = await runNutritionTool("actualizar_perfil", { estatura_cm: 400 }, ctx);
    assert.ok(res.error);
    assert.equal(await ctx.store.getProfile(), null);
  });

  it("cambiar a volumen sube las calorías", async () => {
    const ctx = makeCtx("t1");
    const before = (await runNutritionTool("ver_perfil", {}, ctx)).objetivos_diarios as { kcal: number };
    const after = (await runNutritionTool("actualizar_perfil", { objetivo: { tipo: "volumen" } }, ctx)).objetivos_diarios as { kcal: number };
    assert.ok(after.kcal > before.kcal + 500);
  });

  it("registrar peso lo manda a Fuerza y recalcula", async () => {
    const ctx = makeCtx("t1");
    const res = await runNutritionTool("registrar_peso", { peso_kg: 75, fecha: null }, ctx);
    assert.equal(res.registrado, true);
    assert.equal((res.calculo as { peso_usado_kg: number }).peso_usado_kg, 75);
  });

  it("medidas: estima la grasa con cintura y cuello", async () => {
    const ctx = makeCtx("t1");
    const res = await runNutritionTool("registrar_medidas", { fecha: null, cintura_cm: 92, cuello_cm: 38 }, ctx);
    assert.equal(res.guardadas, true);
    assert.ok(typeof res.grasa_estimada_pct === "number");
    assert.equal((await ctx.store.listMeasurements()).length, 1);
  });

  it("plan de comidas: reparte lo que falta con gramos calculados", async () => {
    const ctx = makeCtx("t1");
    const plan = await runNutritionTool("plan_comidas", {}, ctx);
    const comidas = plan.comidas as { kcal_objetivo: number; proteina_objetivo_g: number; opciones: { alimentos: { clave: string; gramos: number }[]; proteina_g: number }[] }[];
    assert.equal(comidas.length, JUAN_PROFILE.mealsPerDay);
    const first = comidas[0].opciones[0];
    assert.ok(first.alimentos[0].gramos > 0);
    assert.ok(Math.abs(first.proteina_g - comidas[0].proteina_objetivo_g) < 15, `${first.proteina_g} vs ${comidas[0].proteina_objetivo_g}`);
  });

  it("plan de comidas vegetariano no trae carnes y respeta lo que no come", async () => {
    const ctx = makeCtx("t1", undefined, { ...JUAN_PROFILE, dietStyle: "vegetariano", avoidFoods: ["huevo"] });
    const plan = await runNutritionTool("plan_comidas", {}, ctx);
    const keys = (plan.comidas as { opciones: { alimentos: { clave: string }[] }[] }[]).flatMap((c) => c.opciones.flatMap((o) => o.alimentos.map((a) => a.clave)));
    assert.ok(!keys.some((k) => ["pechuga_asada", "res_asada", "huevo_cocido"].includes(k)), keys.join(","));
    assert.ok(keys.some((k) => ["lentejas", "frijoles", "yogurt_griego"].includes(k)));
  });
});

describe("plan de comidas: calidad", () => {
  it("cada opción cubre al menos ~75 % de la proteína de su comida", async () => {
    const ctx = makeCtx("t1");
    const plan = await runNutritionTool("plan_comidas", {}, ctx);
    for (const c of plan.comidas as { proteina_objetivo_g: number; opciones: { proteina_g: number }[] }[]) {
      for (const o of c.opciones) assert.ok(o.proteina_g >= c.proteina_objetivo_g * 0.7, `${o.proteina_g} vs ${c.proteina_objetivo_g}`);
    }
  });
  it("el yogur griego no va con ensalada", async () => {
    const ctx = makeCtx("t1", undefined, { ...JUAN_PROFILE, dietStyle: "vegetariano" });
    const plan = await runNutritionTool("plan_comidas", {}, ctx);
    for (const c of plan.comidas as { opciones: { alimentos: { clave: string }[] }[] }[]) {
      for (const o of c.opciones) {
        const keys = o.alimentos.map((a) => a.clave);
        if (keys.includes("yogurt_griego")) assert.ok(!keys.includes("ensalada"), keys.join(","));
      }
    }
  });
});

describe("recetas en el chat", () => {
  const recipeItems = [{ name: "Huevos", recordId: "FDC-171287", recordName: "Egg", coreKey: null, grams: 150, gramsBasis: "recipe" as const, gramsNote: "receta", nutrients: { kcal: 215, protein_g: 19, fat_g: 14, carb_g: 1, fiber_g: 0, alcohol_g: 0 }, confidence: 1, assumption: null, fromDish: "Pericos", addedOil: false }];
  const withKitchen = (ctx: ToolContext, cooked: string[]) => ({
    ...ctx,
    kitchen: {
      search: async () => [{ receta_id: "pericos-con-arepa", nombre: "Pericos", despensa: "tiene todo" }],
      pantry: async (add: string | null) => ({ agregados: add ? ["Pechuga de pollo"] : [], quitados: [], recetas_listas: 4 }),
      snacks: async () => ({ snacks: [] }),
      plan: async () => null,
      recipeMeal: async (id: string, servings: number) => ({ recipeId: id, kind: "desayuno", text: "Pericos", items: recipeItems, totals: { kcal: 215 * servings, protein_g: 19 * servings, fat_g: 14, carb_g: 1, fiber_g: 0, alcohol_g: 0 } }),
      markCooked: async (id: string) => void cooked.push(id),
      propose: async () => ({ receta_id: "ia-x", nombre: "Nueva" }),
      saveText: async () => ({ receta_id: "mia-x", nombre: "Mía" }),
    },
  });

  it("registrar_receta crea un borrador y solo se guarda en el turno siguiente", async () => {
    const cooked: string[] = [];
    const t1 = withKitchen(makeCtx("t1"), cooked);
    const res = await runNutritionTool("registrar_receta", { receta_id: "pericos-con-arepa", porciones: 1, ajustada: true }, t1);
    assert.ok(res.borrador_id);
    assert.equal(res.momento, "desayuno");
    assert.ok((await runNutritionTool("guardar_comida", { borrador_id: res.borrador_id }, t1)).error);
    const t2 = withKitchen({ ...t1, turnId: "t2" }, cooked);
    const saved = await runNutritionTool("guardar_comida", { borrador_id: res.borrador_id }, t2);
    assert.equal(saved.guardada, true);
    const meals = await t2.store.listMeals(TODAY, TODAY);
    assert.equal(meals[0].recipeId, "pericos-con-arepa");
    assert.deepEqual(cooked, ["pericos-con-arepa"]);
  });

  it("si el modelo copia mal el id, guarda el único borrador pendiente", async () => {
    const t1 = makeCtx("t1");
    await runNutritionTool("analizar_comida", { texto: "una arepa", fecha: null, momento: null }, t1);
    const saved = await runNutritionTool("guardar_comida", { borrador_id: "id-inventado" }, { ...t1, turnId: "t2" });
    assert.equal(saved.guardada, true);
  });

  it("despensa y búsqueda responden; sin cocina dan error claro", async () => {
    const ctx = withKitchen(makeCtx("t1"), []);
    assert.deepEqual((await runNutritionTool("actualizar_despensa", { agregar: "compré pollo", quitar: null }, ctx)).agregados, ["Pechuga de pollo"]);
    assert.equal(((await runNutritionTool("buscar_recetas", { texto: "huevo", tipo: null, solo_listas: false }, ctx)).recetas as unknown[]).length, 1);
    assert.ok((await runNutritionTool("sugerir_snack", {}, makeCtx("t1"))).error);
  });

  it("plan_comidas usa el plan de alimentos si no hay recetas", async () => {
    const ctx = withKitchen(makeCtx("t1"), []);
    const res = await runNutritionTool("plan_comidas", {}, ctx);
    assert.ok(Array.isArray(res.comidas));
    assert.equal(res.con_recetas, undefined);
  });
});
