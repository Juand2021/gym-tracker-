import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { dayStats, latestWorkout, weeklySets, weightTrend } from "./home-summary.ts";
import type { Workout } from "./types.ts";

function workout(date: string, dayType: Workout["dayType"], sets = 3): Workout {
  return {
    id: date,
    date,
    notes: "",
    createdAt: date,
    dayType,
    sets: Array.from({ length: sets }, (_, i) => ({
      id: `${date}-${i}`,
      exercise: "Press banca",
      weightKg: 60,
      reps: 8,
      setNumber: i + 1,
    })),
  };
}

describe("home-summary", () => {
  it("cuenta sesiones y última fecha por día", () => {
    const stats = dayStats([
      workout("2026-09-20", "pecho"),
      workout("2026-10-01", "pecho"),
      workout("2026-09-25", "pierna"),
    ]);
    assert.deepEqual(stats.pecho, { sessions: 2, lastDate: "2026-10-01" });
    assert.deepEqual(stats.espalda, { sessions: 0, lastDate: null });
    assert.equal(latestWorkout([workout("2026-09-20", "pecho"), workout("2026-10-01", "pierna")])?.date, "2026-10-01");
  });

  it("suma series por semana (lunes a domingo)", () => {
    // 3 oct 2026 es sábado; su semana empieza el lunes 28 sep
    const now = new Date(2026, 9, 3);
    const series = weeklySets(
      [workout("2026-09-28", "pecho", 10), workout("2026-10-03", "espalda", 5), workout("2026-09-27", "pierna", 7)],
      now,
      3,
    );
    assert.deepEqual(series, [0, 7, 15]);
  });

  it("calcula la tendencia del peso", () => {
    const trend = weightTrend([
      { id: "a", date: "2026-09-01", weightKg: 80 },
      { id: "b", date: "2026-10-01", weightKg: 79.4 },
    ]);
    assert.equal(trend.latest?.weightKg, 79.4);
    assert.equal(trend.delta, -0.6);
    assert.deepEqual(trend.series, [80, 79.4]);
    assert.equal(weightTrend([]).latest, null);
  });
});
