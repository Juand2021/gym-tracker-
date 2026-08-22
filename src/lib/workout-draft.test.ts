import assert from "node:assert/strict";
import test from "node:test";
import {
  clearWorkoutDraft,
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
    updatedAt: Date.now(),
  };

  saveWorkoutDraft(mockDraft);
  assert.equal(hasWorkoutDraft(), true);

  const recovered = getWorkoutDraft();
  assert.ok(recovered);
  assert.equal(recovered?.dayType, "pecho");
  assert.equal(recovered?.sets.length, 2);
  assert.equal(recovered?.notes, "Buena energía");

  clearWorkoutDraft();
  assert.equal(getWorkoutDraft(), null);
  assert.equal(hasWorkoutDraft(), false);
});
