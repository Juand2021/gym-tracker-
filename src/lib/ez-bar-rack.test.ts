import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  EZ_BAR_LBS,
  EZ_SLEEVE_CAPACITY,
  addEzPlate,
  ezPlateFits,
  hasEzBarPlatePicker,
  nearestEzLoad,
} from "./ez-bar-rack.ts";
import { sleeveUsed } from "./barbell-plates.ts";

describe("ez-bar-rack", () => {
  it("activa Press francés con barra Z", () => {
    assert.equal(hasEzBarPlatePicker("Press francés con barra Z"), true);
    assert.equal(hasEzBarPlatePicker("Curl con barra EZ"), true);
    assert.equal(hasEzBarPlatePicker("Curl de bíceps con polea"), false);
    assert.equal(hasEzBarPlatePicker("Press banca"), false);
    assert.equal(hasEzBarPlatePicker("Curl martillo"), false);
  });

  it("la barra vacía pesa 25 lb", () => {
    const load = nearestEzLoad(0);
    assert.equal(load.barLbs, EZ_BAR_LBS);
    assert.deepEqual(load.platesPerSide, []);
    assert.equal(load.totalKg, 11.3);
  });

  it("la manga corta limita los discos por lado", () => {
    let plates: number[] = [];
    for (let i = 0; i < 10; i++) plates = addEzPlate(plates, 45);
    assert.deepEqual(plates, [45, 45, 45, 45]);
    assert.ok(sleeveUsed(plates) <= EZ_SLEEVE_CAPACITY);
    assert.equal(ezPlateFits(plates, 2.5), false);
    assert.deepEqual(addEzPlate(plates, 2.5), plates);
    assert.deepEqual(addEzPlate([], 7), []);
  });

  it("nearestEzLoad acerca pesos históricos en kg", () => {
    // 25 lb barra + 2×10 lb = 45 lb ≈ 20.4 kg
    assert.deepEqual(nearestEzLoad(20).platesPerSide, [10]);
    // 25 + 2×(25+5) = 85 lb ≈ 38.6 kg
    assert.deepEqual(nearestEzLoad(38.5).platesPerSide, [25, 5]);
    // Peso enorme: se queda en lo que cabe
    assert.deepEqual(nearestEzLoad(500).platesPerSide, [45, 45, 45, 45]);
  });
});

describe("ez-bar-rack: curl con barra Z", () => {
  it("activa el selector de barra Z en el curl de bíceps", () => {
    assert.equal(hasEzBarPlatePicker("Curl de bíceps con barra Z"), true);
  });
});
