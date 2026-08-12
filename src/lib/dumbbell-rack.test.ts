import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildDumbbellRack,
  DUMBBELL_LBS,
  hasDumbbellRackPicker,
  lbsToKg,
  nearestDumbbellLbs,
} from "./dumbbell-rack.ts";

describe("dumbbell-rack", () => {
  it("cubre 10–60 lb en saltos de 5", () => {
    assert.deepEqual(DUMBBELL_LBS, [
      10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60,
    ]);
    assert.equal(buildDumbbellRack().length, 11);
  });

  it("convierte lb a kg con 1 decimal", () => {
    assert.equal(lbsToKg(15), 6.8);
    assert.equal(lbsToKg(20), 9.1);
    assert.equal(lbsToKg(25), 11.3);
    assert.equal(lbsToKg(10), 4.5);
    assert.equal(lbsToKg(60), 27.2);
  });

  it("nearestDumbbellLbs acerca pesos históricos en kg", () => {
    assert.equal(nearestDumbbellLbs(0), null);
    assert.equal(nearestDumbbellLbs(6.8), 15);
    assert.equal(nearestDumbbellLbs(9), 20);
    assert.equal(nearestDumbbellLbs(11.4), 25);
  });

  it("se activa en ejercicios de mancuerna", () => {
    assert.equal(hasDumbbellRackPicker("Curl martillo"), true);
    assert.equal(hasDumbbellRackPicker("Bíceps con mancuernas"), true);
    assert.equal(hasDumbbellRackPicker("Press militar con mancuernas"), true);
    assert.equal(hasDumbbellRackPicker("Contracción Antebrazo"), true);
    assert.equal(hasDumbbellRackPicker("Aducción de antebrazo"), true);
    assert.equal(hasDumbbellRackPicker("Jalón al pecho"), false);
    assert.equal(hasDumbbellRackPicker("Press banca"), false);
  });
});
