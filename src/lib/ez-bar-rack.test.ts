import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  EZ_BAR_KG,
  buildEzBarRack,
  hasEzBarRackPicker,
  nearestEzBarKg,
} from "./ez-bar-rack.ts";

describe("ez-bar-rack", () => {
  it("cubre las barras Z del gym", () => {
    assert.deepEqual(EZ_BAR_KG, [20, 22.5, 25, 27.5, 30, 35, 40]);
    assert.equal(buildEzBarRack().length, 7);
  });

  it("activa Press francés con barra Z", () => {
    assert.equal(hasEzBarRackPicker("Press francés con barra Z"), true);
    assert.equal(hasEzBarRackPicker("Curl de bíceps con polea"), false);
    assert.equal(hasEzBarRackPicker("Press banca"), false);
    assert.equal(hasEzBarRackPicker("Curl martillo"), false);
  });

  it("nearestEzBarKg acerca pesos históricos", () => {
    assert.equal(nearestEzBarKg(0), null);
    assert.equal(nearestEzBarKg(20), 20);
    assert.equal(nearestEzBarKg(22.4), 22.5);
    assert.equal(nearestEzBarKg(28), 27.5);
    assert.equal(nearestEzBarKg(39), 40);
  });
});
