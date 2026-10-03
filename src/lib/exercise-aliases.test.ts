import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canonicalExerciseName } from "./exercise-aliases.ts";

describe("exercise-aliases", () => {
  it("unifica Face-pull o reverse peck deck con Face pull", () => {
    assert.equal(canonicalExerciseName("Face-pull o reverse peck deck"), "Face pull");
    assert.equal(canonicalExerciseName("  Face-pull o reverse peck deck "), "Face pull");
    assert.equal(canonicalExerciseName("Face pull"), "Face pull");
  });

  it("mantiene el alias histórico del remo unilateral", () => {
    assert.equal(
      canonicalExerciseName("Remo unilateral (agarre al tronco)"),
      "Remo unilateral con agarre de polea",
    );
  });

  it("unifica todas las variantes del crunch en polea", () => {
    for (const variant of [
      "Crunch de polea alta",
      "Crunch de polea",
      "Crunch en polea alta",
      "Crunch abdominal en polea",
      "crunch polea",
      "CRUNCH DE POLEA ALTA ",
      "Crunch  en  polea",
    ]) {
      assert.equal(canonicalExerciseName(variant), "Crunch de polea alta", variant);
    }
  });

  it("deja intactos los demás nombres", () => {
    assert.equal(canonicalExerciseName("Press banca"), "Press banca");
    // Sin polea es otro ejercicio (peso corporal)
    assert.equal(canonicalExerciseName("Crunch abdominal"), "Crunch abdominal");
    assert.equal(canonicalExerciseName("Oblicuos en polea"), "Oblicuos en polea");
  });
});
