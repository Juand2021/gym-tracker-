import assert from "node:assert/strict";
import test from "node:test";
import { formatShortDate, getLastHistoryByExercise } from "./exercise-history.ts";
import type { Workout } from "./types.ts";

test("exercise-history: formatShortDate formatea fechas correctamente", () => {
  assert.equal(formatShortDate("2026-08-18"), "18 ago");
  assert.equal(formatShortDate("2026-01-05"), "5 ene");
  assert.equal(formatShortDate("2026-12-31"), "31 dic");
});

test("exercise-history: getLastHistoryByExercise extrae las series de la sesión más reciente", () => {
  const mockWorkouts: Workout[] = [
    {
      id: "w1",
      date: "2026-08-10",
      notes: "",
      createdAt: "2026-08-10T10:00:00Z",
      dayType: "pecho",
      armFocus: null,
      sets: [
        { id: "s1", exercise: "Press banca", weightKg: 50, reps: 10, setNumber: 1 },
        { id: "s2", exercise: "Press banca", weightKg: 55, reps: 8, setNumber: 2 },
      ],
    },
    {
      id: "w2",
      date: "2026-08-17",
      notes: "",
      createdAt: "2026-08-17T10:00:00Z",
      dayType: "pecho",
      armFocus: null,
      sets: [
        { id: "s3", exercise: "Press banca", weightKg: 60, reps: 10, setNumber: 1 },
        { id: "s4", exercise: "Press banca", weightKg: 65, reps: 8, setNumber: 2 },
        { id: "s5", exercise: "Press banca", weightKg: 70, reps: 6, setNumber: 3 },
        { id: "s6", exercise: "Pec deck", weightKg: 40, reps: 12, setNumber: 1 },
      ],
    },
  ];

  const history = getLastHistoryByExercise(mockWorkouts);

  // Press banca debe tomar la sesión más reciente (w2 del 17 de agosto con 3 series)
  assert.ok(history["Press banca"]);
  assert.equal(history["Press banca"].date, "2026-08-17");
  assert.equal(history["Press banca"].shortDate, "17 ago");
  assert.equal(history["Press banca"].sets.length, 3);
  assert.deepEqual(history["Press banca"].sets, [
    { weightKg: 60, reps: 10 },
    { weightKg: 65, reps: 8 },
    { weightKg: 70, reps: 6 },
  ]);

  // Pec deck solo estuvo en w2
  assert.ok(history["Pec deck"]);
  assert.equal(history["Pec deck"].sets.length, 1);
  assert.deepEqual(history["Pec deck"].sets, [{ weightKg: 40, reps: 12 }]);

  // Ejercicio no existente
  assert.equal(history["Sentadilla libre"], undefined);
});
