import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateConsecutiveWeeks,
  calculateUserStreakSummary,
  getBadgeForStreak,
  getMondayOfWeek,
  getWeekDaysStatus,
  formatLocalDateIso,
} from "./user-streak.ts";
import type { Workout } from "./types.ts";

describe("user-streak: gym streak and badges", () => {
  it("getMondayOfWeek returns Monday for any date", () => {
    // 2026-08-23 is Sunday
    const sunday = new Date(2026, 7, 23);
    const monday = getMondayOfWeek(sunday);
    assert.equal(monday.getDay(), 1); // 1 = Monday
    assert.equal(formatLocalDateIso(monday), "2026-08-17");
  });

  it("getWeekDaysStatus marks trained days in the current week", () => {
    const fixedNow = new Date(2026, 7, 23); // Domingo 23 de agosto de 2026
    const mockWorkouts: Workout[] = [
      {
        id: "w1",
        date: "2026-08-17", // Lunes
        notes: "",
        createdAt: "2026-08-17T10:00:00Z",
        sets: [],
      },
      {
        id: "w2",
        date: "2026-08-19", // Miércoles
        notes: "",
        createdAt: "2026-08-19T10:00:00Z",
        sets: [],
      },
    ];

    const days = getWeekDaysStatus(mockWorkouts, fixedNow);
    assert.equal(days.length, 7);
    assert.equal(days[0]?.isTrained, true); // Lunes
    assert.equal(days[1]?.isTrained, false); // Martes
    assert.equal(days[2]?.isTrained, true); // Miércoles
    assert.equal(days[6]?.isToday, true); // Domingo is today
  });

  it("calculateConsecutiveWeeks returns 0 when no workouts exist", () => {
    const fixedNow = new Date(2026, 7, 23);
    const weeks = calculateConsecutiveWeeks([], fixedNow);
    assert.equal(weeks, 0);
  });

  it("getBadgeForStreak awards appropriate badge based on streak weeks", () => {
    const b0 = getBadgeForStreak(0);
    assert.equal(b0.title, "Iniciador de Hierro");

    const b2 = getBadgeForStreak(2);
    assert.equal(b2.title, "Constancia de Acero");

    const b4 = getBadgeForStreak(4);
    assert.equal(b4.title, "Atleta Imparable");

    const b10 = getBadgeForStreak(10);
    assert.equal(b10.title, "Titán de la Fuerza");
  });

  it("calculateUserStreakSummary computes complete summary", () => {
    const fixedNow = new Date(2026, 7, 23);
    const mockWorkouts: Workout[] = [
      { id: "1", date: "2026-08-17", notes: "", createdAt: "", sets: [] },
      { id: "2", date: "2026-08-18", notes: "", createdAt: "", sets: [] },
      { id: "3", date: "2026-08-20", notes: "", createdAt: "", sets: [] },
      { id: "4", date: "2026-08-22", notes: "", createdAt: "", sets: [] },
    ];

    const summary = calculateUserStreakSummary(mockWorkouts, fixedNow, 4);
    assert.equal(summary.currentWeekCount, 4);
    assert.equal(summary.totalWorkouts, 4);
    assert.ok(summary.motivationalMessage.includes("Semana cumplida"));
  });
});
