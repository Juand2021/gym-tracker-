import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { embeddedSets, setsForDoc, subcollectionSet } from "./workout-sets.ts";

describe("series dentro del entreno", () => {
  it("un entreno antiguo sin campo sets devuelve null (se lee la subcolección)", () => {
    assert.equal(embeddedSets({ date: "2026-10-20" }), null);
  });

  it("lee las series del campo con el mismo formato que la subcolección", () => {
    const sets = embeddedSets({
      sets: [
        { id: "a1", exercise: "Press banca", weightKg: 60, reps: 8, setNumber: 1, orderIndex: 0 },
        { id: "a2", exercise: "Press banca", weightKg: "62.5", reps: "6", setNumber: 2 },
      ],
    });
    assert.deepEqual(sets, [
      { id: "a1", exercise: "Press banca", weightKg: 60, reps: 8, setNumber: 1, orderIndex: 0 },
      { id: "a2", exercise: "Press banca", weightKg: 62.5, reps: 6, setNumber: 2, orderIndex: undefined },
    ]);
  });

  it("al guardar, cada serie lleva el id de su copia en la subcolección y su orden", () => {
    const input = [
      { exercise: "Remo", weightKg: 40, reps: 10, setNumber: 1 },
      { exercise: "Remo", weightKg: 40, reps: 9, setNumber: 2, orderIndex: 5 },
    ];
    const doc = setsForDoc(input, ["x", "y"]);
    assert.deepEqual(doc.map((s) => [s.id, s.orderIndex]), [["x", 0], ["y", 5]]);
    // La copia de la subcolección es igual a la de antes (sin id) y vuelve a leerse igual desde el campo.
    assert.deepEqual(subcollectionSet(doc[0]), { exercise: "Remo", weightKg: 40, reps: 10, setNumber: 1, orderIndex: 0 });
    assert.deepEqual(embeddedSets({ sets: doc })!.map((s) => s.id), ["x", "y"]);
  });
});
