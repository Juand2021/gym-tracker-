import { epleyOneRm, getLoadMode } from "@/lib/exercises";
import type { BodyWeightEntry, Workout, WorkoutSet } from "@/lib/types";
export * from "@/lib/exercise-history";

export function nearestBodyWeight(
  date: string,
  weights: BodyWeightEntry[],
): number | null {
  if (weights.length === 0) return null;
  let best: BodyWeightEntry | null = null;
  let bestDelta = Infinity;
  for (const entry of weights) {
    const delta = Math.abs(Date.parse(entry.date) - Date.parse(date));
    if (delta < bestDelta) {
      best = entry;
      bestDelta = delta;
    }
  }
  return best?.weightKg ?? null;
}

/** Carga efectiva para estimar fuerza (incluye peso corporal en dominadas/fondos). */
export function effectiveLoadKg(
  exercise: string,
  weightKg: number,
  bodyWeightKg: number | null,
): number {
  if (getLoadMode(exercise) === "bodyweight") {
    return (bodyWeightKg ?? 0) + weightKg;
  }
  return weightKg;
}

export function setEstimated1rm(
  set: WorkoutSet,
  bodyWeightKg: number | null,
): number {
  const load = effectiveLoadKg(set.exercise, set.weightKg, bodyWeightKg);
  return epleyOneRm(load, set.reps);
}

export function setVolumeKg(
  set: WorkoutSet,
  bodyWeightKg: number | null,
): number {
  return effectiveLoadKg(set.exercise, set.weightKg, bodyWeightKg) * set.reps;
}

export function weekKey(date: string): string {
  const d = new Date(`${date}T12:00:00`);
  const day = d.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + mondayOffset);
  return d.toISOString().slice(0, 10);
}

export function daysAgoIso(days: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export type ExercisePr = {
  exercise: string;
  best1rm: number;
  bestWeight: number;
  bestReps: number;
  date: string;
  previous1rm: number | null;
  deltaPct: number | null;
  relative: number | null;
};

export function computeExercisePrs(
  workouts: Workout[],
  weights: BodyWeightEntry[],
): ExercisePr[] {
  const byExercise = new Map<
    string,
    Array<{
      date: string;
      est1rm: number;
      weightKg: number;
      reps: number;
      relative: number | null;
    }>
  >();

  for (const workout of workouts) {
    const bw = nearestBodyWeight(workout.date, weights);
    const bestByExercise = new Map<
      string,
      { est1rm: number; weightKg: number; reps: number }
    >();

    for (const set of workout.sets) {
      const est = setEstimated1rm(set, bw);
      const prev = bestByExercise.get(set.exercise);
      if (!prev || est > prev.est1rm) {
        bestByExercise.set(set.exercise, {
          est1rm: est,
          weightKg: set.weightKg,
          reps: set.reps,
        });
      }
    }

    for (const [exercise, best] of bestByExercise) {
      const list = byExercise.get(exercise) ?? [];
      list.push({
        date: workout.date,
        est1rm: best.est1rm,
        weightKg: best.weightKg,
        reps: best.reps,
        relative: bw && bw > 0 ? best.est1rm / bw : null,
      });
      byExercise.set(exercise, list);
    }
  }

  const prs: ExercisePr[] = [];
  for (const [exercise, points] of byExercise) {
    const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
    const best = sorted.reduce((acc, p) =>
      p.est1rm > acc.est1rm ? p : acc,
    );
    const older = sorted.filter((p) => p.date < best.date);
    const previous = older.length
      ? older.reduce((acc, p) => (p.est1rm > acc.est1rm ? p : acc))
      : null;
    const deltaPct =
      previous && previous.est1rm > 0
        ? ((best.est1rm - previous.est1rm) / previous.est1rm) * 100
        : null;

    prs.push({
      exercise,
      best1rm: Math.round(best.est1rm * 10) / 10,
      bestWeight: best.weightKg,
      bestReps: best.reps,
      date: best.date,
      previous1rm: previous ? Math.round(previous.est1rm * 10) / 10 : null,
      deltaPct: deltaPct == null ? null : Math.round(deltaPct * 10) / 10,
      relative:
        best.relative == null
          ? null
          : Math.round(best.relative * 100) / 100,
    });
  }

  return prs.sort((a, b) => b.best1rm - a.best1rm);
}
