import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildStackPlates,
  formatStackKg,
  formatStackLbs,
  getMachineStack,
  hasMachineStackPicker,
  kgToLbs,
  nearestPlateIndex,
} from "./machine-stacks.ts";
import {
  isValidReps,
  isValidWeight,
  parseDecimal,
} from "./numbers.ts";

describe("machine-stacks: Jalón al pecho", () => {
  const config = getMachineStack("Jalón al pecho");

  it("tiene config en las máquinas de cable/polea con el mismo stack", () => {
    assert.ok(config);
    assert.equal(hasMachineStackPicker("Jalón al pecho"), true);
    assert.equal(hasMachineStackPicker("Remo con máquina"), true);
    assert.equal(
      hasMachineStackPicker("Remo unilateral con agarre de polea"),
      true,
    );
    assert.equal(
      hasMachineStackPicker("Remo unilateral (agarre al tronco)"),
      true,
    );
    assert.equal(hasMachineStackPicker("Face pull"), true);
    assert.equal(hasMachineStackPicker("Cruce de poleas alto"), true);
    assert.equal(hasMachineStackPicker("Extensión de tríceps con cuerda"), true);
    assert.equal(hasMachineStackPicker("Extensión de tríceps trasnuca"), true);
    assert.equal(
      hasMachineStackPicker("Extensión de tríceps unilateral"),
      true,
    );
    assert.equal(
      hasMachineStackPicker("Curl de bíceps con polea"),
      true,
    );
    assert.equal(
      hasMachineStackPicker("Bíceps con polea"),
      true,
    );
    assert.equal(
      hasMachineStackPicker("Elevaciones unilaterales con cable"),
      true,
    );
    assert.equal(
      hasMachineStackPicker(
        "Elevaciones hacia el frente unilaterales con cable",
      ),
      true,
    );
    assert.equal(
      hasMachineStackPicker("Face-pull o reverse peck deck"),
      true,
    );
    assert.equal(hasMachineStackPicker("Extensión de cuádriceps"), true);
    assert.equal(hasMachineStackPicker("Aducción de cadera"), true);
    assert.equal(hasMachineStackPicker("Crunch abdominal en polea"), true);
    assert.equal(hasMachineStackPicker("Oblicuos en polea"), true);
    assert.equal(hasMachineStackPicker("Press banca"), false);
    assert.equal(hasMachineStackPicker("Pec deck"), false);
    assert.equal(hasMachineStackPicker("Encogimiento de hombros"), false);
    assert.equal(hasMachineStackPicker("Sentadilla libre"), false);
    assert.equal(hasMachineStackPicker(""), false);

    const remo = getMachineStack("Remo con máquina");
    const face = getMachineStack("Face pull");
    const cruce = getMachineStack("Cruce de poleas alto");
    const cuerda = getMachineStack("Extensión de tríceps con cuerda");
    assert.deepEqual(
      {
        smallKg: remo?.smallKg,
        smallCount: remo?.smallCount,
        largeKg: remo?.largeKg,
        largeCount: remo?.largeCount,
      },
      {
        smallKg: config!.smallKg,
        smallCount: config!.smallCount,
        largeKg: config!.largeKg,
        largeCount: config!.largeCount,
      },
    );
    assert.deepEqual(
      {
        smallKg: face?.smallKg,
        smallCount: face?.smallCount,
        largeKg: face?.largeKg,
        largeCount: face?.largeCount,
      },
      {
        smallKg: config!.smallKg,
        smallCount: config!.smallCount,
        largeKg: config!.largeKg,
        largeCount: config!.largeCount,
      },
    );
    assert.deepEqual(
      {
        smallKg: cruce?.smallKg,
        smallCount: cruce?.smallCount,
        largeKg: cruce?.largeKg,
        largeCount: cruce?.largeCount,
      },
      {
        smallKg: config!.smallKg,
        smallCount: config!.smallCount,
        largeKg: config!.largeKg,
        largeCount: config!.largeCount,
      },
    );
    assert.deepEqual(
      {
        smallKg: cuerda?.smallKg,
        smallCount: cuerda?.smallCount,
        largeKg: cuerda?.largeKg,
        largeCount: cuerda?.largeCount,
      },
      {
        smallKg: config!.smallKg,
        smallCount: config!.smallCount,
        largeKg: config!.largeKg,
        largeCount: config!.largeCount,
      },
    );
  });

  it("usa 5 placas pequeñas de 2.5 y 10 grandes de 5", () => {
    assert.equal(config!.smallCount, 5);
    assert.equal(config!.smallKg, 2.5);
    assert.equal(config!.largeCount, 10);
    assert.equal(config!.largeKg, 5);
  });

  it("genera 15 placas con pesos acumulados correctos", () => {
    const plates = buildStackPlates(config!);
    assert.equal(plates.length, 15);
    assert.deepEqual(
      plates.map((p) => p.cumulativeKg),
      [
        2.5, 5, 7.5, 10, 12.5, 17.5, 22.5, 27.5, 32.5, 37.5, 42.5, 47.5, 52.5,
        57.5, 62.5,
      ],
    );
    assert.equal(plates[0].size, "small");
    assert.equal(plates[4].size, "small");
    assert.equal(plates[5].size, "large");
    assert.equal(plates[14].size, "large");
    assert.equal(plates[14].cumulativeKg, 62.5);
  });

  it("nearestPlateIndex resuelve 0, exactos y cercanos al historial", () => {
    const plates = buildStackPlates(config!);
    assert.equal(nearestPlateIndex(plates, 0), -1);
    assert.equal(nearestPlateIndex(plates, -1), -1);
    assert.equal(nearestPlateIndex(plates, 37.5), 9);
    assert.equal(plates[nearestPlateIndex(plates, 38)].cumulativeKg, 37.5);
    assert.equal(plates[nearestPlateIndex(plates, 33)].cumulativeKg, 32.5);
    assert.equal(plates[nearestPlateIndex(plates, 62.5)].cumulativeKg, 62.5);
  });

  it("formatStackKg no deja ceros raros", () => {
    assert.equal(formatStackKg(37.5), "37.5");
    assert.equal(formatStackKg(40), "40");
    assert.equal(formatStackKg(2.5), "2.5");
  });

  it("muestra libras solo como referencia visual", () => {
    assert.ok(Math.abs(kgToLbs(10) - 22.046) < 0.01);
    assert.equal(formatStackLbs(10), "22");
    assert.equal(formatStackLbs(2.5), "5.5");
    assert.equal(formatStackLbs(37.5), "82.7");
  });
});

describe("numbers: decimales para series", () => {
  it("acepta coma y punto", () => {
    assert.equal(parseDecimal("4,5"), 4.5);
    assert.equal(parseDecimal("4.5"), 4.5);
    assert.equal(parseDecimal("37.5"), 37.5);
    assert.equal(parseDecimal(11.4), 11.4);
  });

  it("valida pesos y reps de stack", () => {
    assert.equal(isValidWeight(0), true);
    assert.equal(isValidWeight(37.5), true);
    assert.equal(isValidWeight(Number.NaN), false);
    assert.equal(isValidReps(10), true);
    assert.equal(isValidReps(0), false);
  });
});
