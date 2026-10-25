import assert from "node:assert/strict";
import test from "node:test";
import {
  clearWorkoutDraft,
  discardDraftBackup,
  getDraftBackup,
  getWorkoutDraft,
  hasWorkoutDraft,
  saveWorkoutDraft,
  type WorkoutDraft,
} from "./workout-draft.ts";

// Mock localStorage para entorno Node de test
const store: Record<string, string> = {};
globalThis.localStorage = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, val: string) => {
    store[key] = val;
  },
  removeItem: (key: string) => {
    delete store[key];
  },
  clear: () => {
    for (const k of Object.keys(store)) delete store[k];
  },
  length: 0,
  key: () => null,
};

test("workout-draft: guarda, recupera y limpia borradores", () => {
  clearWorkoutDraft();
  assert.equal(getWorkoutDraft(), null);
  assert.equal(hasWorkoutDraft(), false);

  const mockDraft: WorkoutDraft = {
    step: "log",
    dayType: "pecho",
    armFocus: null,
    date: "2026-08-21",
    notes: "Buena energía",
    sets: [
      { key: "1", exercise: "Press de banca", weightKg: "60", reps: "10" },
      { key: "2", exercise: "Press inclinado", weightKg: "50", reps: "8" },
    ],
    extraExercises: ["Aperturas en polea"],
    exerciseOrder: ["Aperturas en polea", "Press de banca", "Press inclinado"],
    updatedAt: Date.now(),
  };

  saveWorkoutDraft(mockDraft);
  assert.equal(hasWorkoutDraft(), true);

  const recovered = getWorkoutDraft();
  assert.ok(recovered);
  assert.equal(recovered?.dayType, "pecho");
  assert.equal(recovered?.sets.length, 2);
  assert.equal(recovered?.notes, "Buena energía");
  assert.deepEqual(recovered?.exerciseOrder, [
    "Aperturas en polea",
    "Press de banca",
    "Press inclinado",
  ]);

  clearWorkoutDraft();
  assert.equal(getWorkoutDraft(), null);
  assert.equal(hasWorkoutDraft(), false);
});

test("workout-draft: la copia de seguridad sobrevive al descarte y se borra al guardar", () => {
  clearWorkoutDraft({ dropBackup: true });
  const now = Date.now();
  const draft: WorkoutDraft = {
    step: "log",
    dayType: "espalda",
    armFocus: null,
    date: "2026-10-24",
    notes: "",
    sets: [{ key: "a", exercise: "Dominadas", weightKg: "0", reps: "8" }],
    extraExercises: [],
    updatedAt: now,
  };
  saveWorkoutDraft(draft);
  // Un borrador vacío o un descarte no se llevan la copia
  saveWorkoutDraft({ ...draft, sets: [], updatedAt: now + 1 });
  clearWorkoutDraft();
  assert.equal(getWorkoutDraft(), null);
  assert.equal(getDraftBackup(now)?.sets.length, 1);

  // Copias de hace más de 48 h ya no se ofrecen
  assert.equal(getDraftBackup(now + 49 * 60 * 60 * 1000), null);

  // Guardar el entreno la elimina
  clearWorkoutDraft({ dropBackup: true });
  assert.equal(getDraftBackup(now), null);

  saveWorkoutDraft(draft);
  discardDraftBackup();
  assert.equal(getDraftBackup(now), null);
});
