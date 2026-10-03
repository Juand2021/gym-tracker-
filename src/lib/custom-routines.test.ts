import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getDefaultRoutines,
  getExercisesForDayCustom,
  insertExerciseBefore,
  mergeNewDefaults,
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

describe("custom-routines: nuevos ejercicios de fábrica", () => {
  it("Curl de bíceps con barra Z está en los días de bíceps", () => {
    const defaults = getDefaultRoutines();
    assert.ok(defaults.espalda.includes("Curl de bíceps con barra Z"));
    assert.ok(defaults.hombro_biceps.includes("Curl de bíceps con barra Z"));
    assert.ok(!defaults.hombro_triceps.includes("Curl de bíceps con barra Z"));
  });

  it("mergeNewDefaults lo inserta una sola vez en rutinas ya guardadas", () => {
    const saved: CustomRoutines = {
      pecho: ["Press banca"],
      espalda: ["Dominadas", "Curl martillo"],
      hombro_biceps: ["Press militar con mancuernas"],
      hombro_triceps: ["Fondos"],
      pierna: ["Sentadilla libre"],
    };
    const first = mergeNewDefaults(saved, []);
    assert.deepEqual(first.routines.espalda, [
      "Dominadas",
      "Curl de bíceps con barra Z",
      "Curl martillo",
    ]);
    assert.deepEqual(first.routines.hombro_biceps, [
      "Press militar con mancuernas",
      "Curl de bíceps con barra Z",
    ]);
    assert.deepEqual(first.routines.hombro_triceps, ["Fondos"]);
    assert.deepEqual(first.appliedIds, ["curl-biceps-barra-z"]);

    // Ya aplicado: si el usuario lo quitó, no vuelve.
    const second = mergeNewDefaults(saved, first.appliedIds);
    assert.deepEqual(second.routines.espalda, ["Dominadas", "Curl martillo"]);
  });

  it("insertExerciseBefore no duplica", () => {
    const list = ["A", "Curl de bíceps con barra Z"];
    assert.equal(insertExerciseBefore(list, "Curl de bíceps con barra Z", "A"), list);
  });
});
