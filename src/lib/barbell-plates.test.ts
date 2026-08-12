import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  OLYMPIC_BAR_LBS,
  PLATE_LBS,
  addPlate,
  buildBarbellLoad,
  emptyBarbellLoad,
  hasBarbellPlatePicker,
  lbsToKg,
  nearestPlateLoad,
  removeOutermostPlate,
  totalKg,
  totalLbs,
} from "./barbell-plates.ts";

describe("barbell-plates", () => {
  it("define barra 45 lb y discos del gym", () => {
    assert.equal(OLYMPIC_BAR_LBS, 45);
    assert.deepEqual(PLATE_LBS, [2.5, 5, 10, 25, 45]);
  });

  it("activa Press banca, encogimientos y pierna con barra", () => {
    assert.equal(hasBarbellPlatePicker("Press banca"), true);
    assert.equal(hasBarbellPlatePicker("Encogimiento de hombros"), true);
    assert.equal(hasBarbellPlatePicker("Sentadilla libre"), true);
    assert.equal(hasBarbellPlatePicker("Peso muerto rumano"), true);
    assert.equal(hasBarbellPlatePicker("Press francés con barra Z"), false);
    assert.equal(hasBarbellPlatePicker("Jalón al pecho"), false);
  });

  it("calcula total espejado barra + discos", () => {
    assert.equal(totalLbs(45, []), 45);
    assert.equal(totalLbs(45, [45]), 135);
    assert.equal(totalLbs(45, [45, 10, 2.5]), 160);
    assert.equal(totalKg(45, []), lbsToKg(45));
    assert.equal(totalKg(45, [45]), lbsToKg(135));
    assert.equal(lbsToKg(45), 20.4);
    assert.equal(lbsToKg(135), 61.2);
  });

  it("add/remove discos por lado", () => {
    let plates = addPlate([], 45);
    plates = addPlate(plates, 10);
    assert.deepEqual(plates, [45, 10]);
    plates = removeOutermostPlate(plates);
    assert.deepEqual(plates, [45]);
    plates = removeOutermostPlate(plates);
    assert.deepEqual(plates, []);
    assert.deepEqual(removeOutermostPlate([]), []);
    assert.deepEqual(addPlate([], 99), []);
  });

  it("nearestPlateLoad recupera barra vacía y cargas típicas", () => {
    const empty = nearestPlateLoad(0);
    assert.deepEqual(empty.platesPerSide, []);
    assert.equal(empty.totalLbs, 45);

    const onlyBar = nearestPlateLoad(lbsToKg(45));
    assert.deepEqual(onlyBar.platesPerSide, []);
    assert.equal(onlyBar.totalKg, lbsToKg(45));

    const one45 = nearestPlateLoad(lbsToKg(135));
    assert.deepEqual(one45.platesPerSide, [45]);
    assert.equal(one45.totalLbs, 135);

    const mixed = buildBarbellLoad([45, 10, 2.5]);
    const recovered = nearestPlateLoad(mixed.totalKg);
    assert.deepEqual(recovered.platesPerSide, [45, 10, 2.5]);
    assert.equal(recovered.totalKg, mixed.totalKg);
  });

  it("emptyBarbellLoad es solo la barra", () => {
    const load = emptyBarbellLoad();
    assert.equal(load.barLbs, 45);
    assert.deepEqual(load.platesPerSide, []);
    assert.equal(load.totalLbs, 45);
  });
});
