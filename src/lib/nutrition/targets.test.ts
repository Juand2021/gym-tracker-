import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ageOn, JUAN_PROFILE, todayInBogota } from "./profile.ts";
import { computeTargets, ethanolGrams, navyBodyFat, restingKcal } from "./targets.ts";

// 4,3 sesiones/semana ≈ 17 sesiones en 28 días.
const sessions = Array.from({ length: 17 }, (_, i) => `2026-10-${String(i + 1).padStart(2, "0")}`);

describe("perfil", () => {
  it("calcula la edad con la fecha de nacimiento", () => {
    assert.equal(ageOn("2001-10-15", "2026-10-25"), 25);
    assert.equal(ageOn("2001-10-15", "2026-10-14"), 24);
  });
  it("usa la fecha de Colombia (UTC-5)", () => {
    assert.equal(todayInBogota(new Date("2026-10-26T03:00:00Z")), "2026-10-25");
  });
});

describe("objetivos (caso de Juan, Fase 1)", () => {
  const maintenance = { ...JUAN_PROFILE, phase: { ...JUAN_PROFILE.phase!, type: "mantenimiento" as const } };

  it("reposo ≈ 1.860 kcal (promedio Mifflin + Tinsley)", () => {
    assert.equal(Math.round(restingKcal("M", 78, 179, 25, true)), 1862);
  });
  it("mantenimiento ≈ 2.800 kcal con su historial de entrenos", () => {
    const t = computeTargets({ profile: maintenance, weightKg: 78, workoutDates: sessions, today: "2026-10-25" });
    assert.ok(Math.abs(t.tdee - 2800) < 30, `tdee ${t.tdee}`);
    assert.ok(Math.abs(t.basis.trainingKcalPerDay - 190) < 15);
  });
  it("déficit grande (1 %/semana) ≈ 1.950 kcal y 2,4 g/kg de proteína", () => {
    const t = computeTargets({ profile: JUAN_PROFILE, weightKg: 78, workoutDates: sessions, today: "2026-10-25" });
    assert.ok(Math.abs(t.kcal - 1940) <= 30, `kcal ${t.kcal}`);
    assert.equal(t.protein_g, 187);
    assert.ok(t.kcal >= t.minKcal);
    assert.equal(t.fiber_g, 27);
  });
  it("con grasa medida > 25 % usa la masa magra para la proteína", () => {
    const t = computeTargets({ profile: { ...JUAN_PROFILE, bodyFatPct: 30 }, weightKg: 78, workoutDates: sessions, today: "2026-10-25" });
    assert.equal(t.protein_g, Math.round(2.6 * 78 * 0.7));
  });
  it("nunca baja del mínimo seguro", () => {
    const t = computeTargets({ profile: { ...JUAN_PROFILE, phase: { ...JUAN_PROFILE.phase!, ratePctPerWeek: 2 } }, weightKg: 78, workoutDates: sessions, today: "2026-10-25" });
    assert.ok(t.kcal >= t.minKcal - 10);
    assert.ok(t.warnings.length > 0);
  });
  it("los macros suman las kcal", () => {
    const t = computeTargets({ profile: JUAN_PROFILE, weightKg: 78, workoutDates: sessions, today: "2026-10-25" });
    const kcal = t.protein_g * 4 + t.fat_g * 9 + t.carb_g * 4;
    assert.ok(Math.abs(kcal - t.kcal) < 25);
  });
  it("agua extra en día de entreno", () => {
    const rest = computeTargets({ profile: JUAN_PROFILE, weightKg: 78, workoutDates: sessions, today: "2026-10-25" });
    const train = computeTargets({ profile: JUAN_PROFILE, weightKg: 78, workoutDates: sessions, today: "2026-10-25", trainingToday: true });
    assert.ok(train.water_l > rest.water_l);
  });
});

describe("alcohol", () => {
  it("una media de aguardiente (375 ml, 29 %) ≈ 86 g de etanol", () => {
    assert.equal(Math.round(ethanolGrams(375, 29)), 86);
  });
});

describe("cualquier persona", () => {
  const base = { ...JUAN_PROFILE, stepsPerDay: null, trainingDaysPerWeek: 3, sessionMinutes: 60 };
  it("sin historial de Fuerza usa los días de entreno declarados", () => {
    const t = computeTargets({ profile: base, weightKg: 70, workoutDates: [], today: "2026-10-25" });
    assert.equal(t.basis.sessionsSource, "declarado");
    assert.equal(t.basis.sessionsPerWeek, 3);
  });
  it("una persona más activa gasta más", () => {
    const sed = computeTargets({ profile: { ...base, activity: "sedentario" }, weightKg: 70, workoutDates: [], today: "2026-10-25" });
    const act = computeTargets({ profile: { ...base, activity: "activo" }, weightKg: 70, workoutDates: [], today: "2026-10-25" });
    assert.ok(act.tdee > sed.tdee);
  });
  it("volumen suma calorías y usa 1,8 g/kg de proteína", () => {
    const v = computeTargets({ profile: { ...base, bodyFatEstimate: "medio", phase: { type: "volumen", start: "2026-10-25", end: null, ratePctPerWeek: 0.25, objective: "" } }, weightKg: 70, workoutDates: [], today: "2026-10-25" });
    assert.ok(v.kcal > v.tdee);
    assert.equal(v.protein_g, 126);
  });
  it("mujer: usa su fórmula y su mínimo", () => {
    const f = computeTargets({ profile: { ...base, sex: "F", heightCm: 162, bodyFatEstimate: "medio" }, weightKg: 60, workoutDates: [], today: "2026-10-25" });
    assert.ok(f.rmr < 1500);
    assert.ok(f.kcal >= 1200);
  });
  it("perfil incompleto no calcula", () => {
    assert.throws(() => computeTargets({ profile: { ...base, sex: null }, weightKg: 70, workoutDates: [], today: "2026-10-25" }));
  });
  it("grasa con cinta (Marina de EE. UU.)", () => {
    const bf = navyBodyFat("M", 179, 92, 38);
    assert.ok(bf != null && bf > 18 && bf < 25, String(bf));
    assert.equal(navyBodyFat("F", 165, 75, 32), null);
  });
});
