import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getDefaultRoutines,
  canonicalizeRoutines,
  getExercisesForDayCustom,
  insertExerciseBefore,
  renameExercise,
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
    assert.deepEqual(first.appliedIds, [
      "curl-biceps-barra-z",
      "remove-curl-biceps-polea",
      "rename-face-pull",
    ]);

    // Ya aplicado: si el usuario lo quitó, no vuelve.
    const second = mergeNewDefaults(saved, first.appliedIds);
    assert.deepEqual(second.routines.espalda, ["Dominadas", "Curl martillo"]);
  });

  it("insertExerciseBefore no duplica", () => {
    const list = ["A", "Curl de bíceps con barra Z"];
    assert.equal(insertExerciseBefore(list, "Curl de bíceps con barra Z", "A"), list);
  });
});

describe("custom-routines: retiro del curl con polea", () => {
  it("ya no está en las rutinas de fábrica", () => {
    const defaults = getDefaultRoutines();
    for (const list of Object.values(defaults)) {
      assert.ok(!list.includes("Curl de bíceps con polea"));
    }
  });

  it("se retira una sola vez de rutinas guardadas", () => {
    const saved: CustomRoutines = {
      pecho: ["Press banca"],
      espalda: ["Curl martillo", "Curl de bíceps con polea"],
      hombro_biceps: ["Curl de bíceps con polea"],
      hombro_triceps: ["Fondos"],
      pierna: ["Sentadilla libre"],
    };
    const first = mergeNewDefaults(saved, []);
    assert.deepEqual(first.routines.espalda, ["Curl de bíceps con barra Z", "Curl martillo"]);
    assert.deepEqual(first.routines.hombro_biceps, ["Curl de bíceps con barra Z"]);

    // Si el usuario lo vuelve a agregar, no se le quita de nuevo
    const readded = { ...first.routines, espalda: [...first.routines.espalda, "Curl de bíceps con polea"] };
    const second = mergeNewDefaults(readded, first.appliedIds);
    assert.ok(second.routines.espalda.includes("Curl de bíceps con polea"));
  });
});

describe("custom-routines: Face pull unificado", () => {
  it("las rutinas de fábrica solo usan Face pull", () => {
    for (const list of Object.values(getDefaultRoutines())) {
      assert.ok(!list.includes("Face-pull o reverse peck deck"));
    }
    assert.ok(getDefaultRoutines().hombro_biceps.includes("Face pull"));
  });

  it("renombra en su posición o elimina el duplicado", () => {
    assert.deepEqual(
      renameExercise(["Press militar con mancuernas", "Face-pull o reverse peck deck", "Encogimiento de hombros"], "Face-pull o reverse peck deck", "Face pull"),
      ["Press militar con mancuernas", "Face pull", "Encogimiento de hombros"],
    );
    assert.deepEqual(
      renameExercise(["Face pull", "Face-pull o reverse peck deck"], "Face-pull o reverse peck deck", "Face pull"),
      ["Face pull"],
    );
  });
});

describe("custom-routines: alias en rutinas guardadas", () => {
  it("unifica variantes del crunch en polea y quita duplicados", () => {
    const routines = canonicalizeRoutines({
      pecho: ["Press banca"],
      espalda: ["Dominadas", "Crunch de polea", "Crunch de polea alta", "Crunch abdominal"],
      hombro_biceps: ["Crunch abdominal en polea"],
      hombro_triceps: ["Face-pull o reverse peck deck", "Face pull"],
      pierna: ["Sentadilla libre"],
    });
    assert.deepEqual(routines.espalda, ["Dominadas", "Crunch de polea alta", "Crunch abdominal"]);
    assert.deepEqual(routines.hombro_biceps, ["Crunch de polea alta"]);
    assert.deepEqual(routines.hombro_triceps, ["Face pull"]);
  });
});
