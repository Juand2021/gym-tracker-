import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ageOn, JUAN_DEFAULT_PROFILE, todayInBogota } from "./profile.ts";
import { computeTargets, ethanolGrams, restingKcal } from "./targets.ts";

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
  const maintenance = { ...JUAN_DEFAULT_PROFILE, phase: { ...JUAN_DEFAULT_PROFILE.phase, type: "mantenimiento" as const } };

  it("reposo ≈ 1.860 kcal (promedio Mifflin + Tinsley)", () => {
    assert.equal(Math.round(restingKcal("M", 78, 179, 25, true)), 1862);
  });
  it("mantenimiento ≈ 2.800 kcal con su historial de entrenos", () => {
    const t = computeTargets({ profile: maintenance, weightKg: 78, workoutDates: sessions, today: "2026-10-25" });
    assert.ok(Math.abs(t.tdee - 2800) < 30, `tdee ${t.tdee}`);
    assert.ok(Math.abs(t.basis.trainingKcalPerDay - 190) < 15);
  });
  it("déficit grande (1 %/semana) ≈ 1.950 kcal y 2,4 g/kg de proteína", () => {
    const t = computeTargets({ profile: JUAN_DEFAULT_PROFILE, weightKg: 78, workoutDates: sessions, today: "2026-10-25" });
    assert.ok(Math.abs(t.kcal - 1940) <= 30, `kcal ${t.kcal}`);
    assert.equal(t.protein_g, 187);
    assert.ok(t.kcal >= t.minKcal);
    assert.equal(t.fiber_g, 27);
  });
  it("con grasa medida > 25 % usa la masa magra para la proteína", () => {
    const t = computeTargets({ profile: { ...JUAN_DEFAULT_PROFILE, bodyFatPct: 30 }, weightKg: 78, workoutDates: sessions, today: "2026-10-25" });
    assert.equal(t.protein_g, Math.round(2.6 * 78 * 0.7));
  });
  it("nunca baja del mínimo seguro", () => {
    const t = computeTargets({ profile: { ...JUAN_DEFAULT_PROFILE, phase: { ...JUAN_DEFAULT_PROFILE.phase, ratePctPerWeek: 2 } }, weightKg: 78, workoutDates: sessions, today: "2026-10-25" });
    assert.ok(t.kcal >= t.minKcal - 10);
    assert.ok(t.warnings.length > 0);
  });
  it("los macros suman las kcal", () => {
    const t = computeTargets({ profile: JUAN_DEFAULT_PROFILE, weightKg: 78, workoutDates: sessions, today: "2026-10-25" });
    const kcal = t.protein_g * 4 + t.fat_g * 9 + t.carb_g * 4;
    assert.ok(Math.abs(kcal - t.kcal) < 25);
  });
  it("agua extra en día de entreno", () => {
    const rest = computeTargets({ profile: JUAN_DEFAULT_PROFILE, weightKg: 78, workoutDates: sessions, today: "2026-10-25" });
    const train = computeTargets({ profile: JUAN_DEFAULT_PROFILE, weightKg: 78, workoutDates: sessions, today: "2026-10-25", trainingToday: true });
    assert.ok(train.water_l > rest.water_l);
  });
});

describe("alcohol", () => {
  it("una media de aguardiente (375 ml, 29 %) ≈ 86 g de etanol", () => {
    assert.equal(Math.round(ethanolGrams(375, 29)), 86);
  });
});
