import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getDefaultRoutines,
  getExercisesForDayCustom,
  type CustomRoutines,
} from "./custom-routines.ts";

describe("custom-routines: customization engine", () => {
  it("getDefaultRoutines returns the 4 day routines with expected exercises", () => {
    const defaults = getDefaultRoutines();
    assert.ok(defaults.pecho.includes("Press banca"));
    assert.ok(defaults.espalda.includes("Dominadas"));
    assert.ok(defaults.hombro_biceps.includes("Press militar con mancuernas"));
    assert.ok(defaults.hombro_biceps.includes("Curl martillo"));
    assert.ok(defaults.hombro_triceps.includes("Press militar con mancuernas"));
    assert.ok(defaults.hombro_triceps.includes("Press francés con barra Z"));
    assert.ok(defaults.pierna.includes("Sentadilla libre"));
  });

  it("getExercisesForDayCustom returns modified list when custom routines are passed", () => {
    const custom: CustomRoutines = {
      pecho: ["Press banca modificado", "Fondos"],
      espalda: ["Dominadas con lastre"],
      hombro_biceps: ["Elevaciones laterales"],
      hombro_triceps: ["Fondos paralelas"],
      pierna: ["Prensa inclinada"],
    };

    assert.deepEqual(getExercisesForDayCustom("pecho", null, custom), [
      "Press banca modificado",
      "Fondos",
    ]);
    assert.deepEqual(getExercisesForDayCustom("espalda", null, custom), [
      "Dominadas con lastre",
    ]);
    assert.deepEqual(getExercisesForDayCustom("hombro", "biceps", custom), [
      "Elevaciones laterales",
    ]);
    assert.deepEqual(getExercisesForDayCustom("hombro", "triceps", custom), [
      "Fondos paralelas",
    ]);
    assert.deepEqual(getExercisesForDayCustom("pierna", null, custom), [
      "Prensa inclinada",
    ]);
  });
});
