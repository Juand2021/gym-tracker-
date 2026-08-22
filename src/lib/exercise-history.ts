import type { Workout } from "@/lib/types";

export type LastExerciseHistory = {
  date: string;
  shortDate: string;
  sets: Array<{ weightKg: number; reps: number }>;
};

const MONTH_ABBR = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

export function formatShortDate(dateIso: string): string {
  try {
    const parts = dateIso.split("-");
    if (parts.length === 3) {
      const day = parseInt(parts[2], 10);
      const monthIdx = parseInt(parts[1], 10) - 1;
      if (monthIdx >= 0 && monthIdx < 12) {
        return `${day} ${MONTH_ABBR[monthIdx]}`;
      }
    }
    return dateIso;
  } catch {
    return dateIso;
  }
}

export function getLastHistoryByExercise(
  workouts: Workout[],
): Record<string, LastExerciseHistory> {
  const result: Record<string, LastExerciseHistory> = {};
  const sorted = [...workouts].sort((a, b) => b.date.localeCompare(a.date));

  for (const w of sorted) {
    const setsByExercise = new Map<
      string,
      Array<{ weightKg: number; reps: number }>
    >();

    for (const set of w.sets) {
      if (!setsByExercise.has(set.exercise)) {
        setsByExercise.set(set.exercise, []);
      }
      setsByExercise.get(set.exercise)!.push({
        weightKg: set.weightKg,
        reps: set.reps,
      });
    }

    for (const [exercise, sets] of setsByExercise.entries()) {
      if (!result[exercise]) {
        result[exercise] = {
          date: w.date,
          shortDate: formatShortDate(w.date),
          sets,
        };
      }
    }
  }

  return result;
}
