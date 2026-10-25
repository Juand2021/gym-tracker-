import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applyProfilePatch, EMPTY_PROFILE, JUAN_PROFILE, missingForTargets } from "./profile.ts";

const TODAY = "2026-10-25";

describe("perfil: validación y datos que faltan", () => {
  it("una persona nueva necesita todo", () => {
    assert.deepEqual(missingForTargets(null, false), ["sexo", "fecha de nacimiento", "estatura", "peso", "nivel de actividad", "objetivo"]);
  });
  it("con un pesaje en Fuerza no hace falta el peso declarado", () => {
    assert.ok(!missingForTargets({ ...JUAN_PROFILE, weightKg: null }, true).includes("peso"));
  });
  it("el perfil de Juan está completo", () => {
    assert.deepEqual(missingForTargets(JUAN_PROFILE, false), []);
  });
  it("aplica cambios válidos y redondea", () => {
    const { profile, errors } = applyProfilePatch(null, { sex: "F", heightCm: 162.4, weightKg: 60.26, activity: "ligero" }, TODAY);
    assert.deepEqual(errors, []);
    assert.equal(profile.heightCm, 162);
    assert.equal(profile.weightKg, 60.3);
    assert.equal(profile.dietStyle, EMPTY_PROFILE.dietStyle);
  });
  it("rechaza datos imposibles con mensajes simples", () => {
    const { errors } = applyProfilePatch(null, { heightCm: 300, weightKg: 10, birthDate: "2015-01-01" }, TODAY);
    assert.equal(errors.length, 3);
  });
  it("al cambiar de objetivo usa el ritmo por defecto y empieza hoy", () => {
    const { profile } = applyProfilePatch(JUAN_PROFILE, { phase: { type: "volumen" } }, TODAY);
    assert.equal(profile.phase?.type, "volumen");
    assert.equal(profile.phase?.ratePctPerWeek, 0.25);
    assert.equal(profile.phase?.start, TODAY);
    assert.equal(profile.phase?.end, null);
  });
  it("cambiar solo el ritmo conserva el resto del objetivo", () => {
    const { profile } = applyProfilePatch(JUAN_PROFILE, { phase: { ratePctPerWeek: 0.5 } }, TODAY);
    assert.equal(profile.phase?.type, "deficit");
    assert.equal(profile.phase?.start, JUAN_PROFILE.phase?.start);
    assert.equal(profile.phase?.ratePctPerWeek, 0.5);
  });
  it("ritmos fuera de rango no se guardan", () => {
    const { errors } = applyProfilePatch(JUAN_PROFILE, { phase: { type: "volumen", ratePctPerWeek: 2 } }, TODAY);
    assert.equal(errors.length, 1);
  });
  it("mantenimiento no tiene ritmo", () => {
    const { profile } = applyProfilePatch(JUAN_PROFILE, { phase: { type: "mantenimiento", ratePctPerWeek: 0.7 } }, TODAY);
    assert.equal(profile.phase?.ratePctPerWeek, 0);
  });
});
