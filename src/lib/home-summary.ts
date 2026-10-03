import type { DayType } from "./routines.ts";
import type { BodyWeightEntry, Workout } from "./types.ts";

/** Días de la rutina. */
export const DAY_ROTATION: DayType[] = ["pecho", "espalda", "hombro", "pierna"];

export type DayStat = { sessions: number; lastDate: string | null };

function byDateDesc<T extends { date: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

/** El último entreno por fecha (no depende del orden en que llegan). */
export function latestWorkout(workouts: Workout[]): Workout | null {
  return byDateDesc(workouts)[0] ?? null;
}

/** Sesiones y fecha de la última por cada día de la rutina. */
export function dayStats(workouts: Workout[]): Record<DayType, DayStat> {
  const stats = Object.fromEntries(
    DAY_ROTATION.map((d) => [d, { sessions: 0, lastDate: null }]),
  ) as Record<DayType, DayStat>;
  for (const w of workouts) {
    if (!w.dayType || !stats[w.dayType]) continue;
    const s = stats[w.dayType];
    s.sessions += 1;
    if (!s.lastDate || w.date > s.lastDate) s.lastDate = w.date;
  }
  return stats;
}

function isoLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function mondayOf(d: Date): Date {
  const m = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  m.setDate(m.getDate() - ((m.getDay() + 6) % 7));
  return m;
}

/** Series totales por semana (lunes a domingo), de la más antigua a la actual. */
export function weeklySets(workouts: Workout[], now = new Date(), weeks = 6): number[] {
  const thisMonday = mondayOf(now);
  const starts = Array.from({ length: weeks }, (_, i) => {
    const d = new Date(thisMonday);
    d.setDate(d.getDate() - (weeks - 1 - i) * 7);
    return isoLocal(d);
  });
  const counts = new Array<number>(weeks).fill(0);
  for (const w of workouts) {
    for (let i = weeks - 1; i >= 0; i--) {
      if (w.date >= starts[i]) {
        const end = i + 1 < weeks ? starts[i + 1] : "9999-12-31";
        if (w.date < end) counts[i] += w.sets.length;
        break;
      }
    }
  }
  return counts;
}

export type WeightTrend = {
  latest: BodyWeightEntry | null;
  /** Diferencia con el registro anterior (kg); null si solo hay uno. */
  delta: number | null;
  /** Últimos valores, del más antiguo al más reciente, para la mini gráfica. */
  series: number[];
};

export function weightTrend(entries: BodyWeightEntry[], points = 8): WeightTrend {
  const sorted = byDateDesc(entries);
  const latest = sorted[0] ?? null;
  const prev = sorted[1];
  const delta = latest && prev ? Math.round((latest.weightKg - prev.weightKg) * 10) / 10 : null;
  const series = sorted.slice(0, points).map((e) => e.weightKg).reverse();
  return { latest, delta, series };
}
