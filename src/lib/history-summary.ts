import type { BodyWeightEntry } from "./types.ts";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const MONTH_ABBR = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const WEEKDAY_ABBR = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

export type DateParts = {
  day: number;
  monthAbbr: string;
  weekday: string;
  /** "2026-10": clave para agrupar por mes. */
  monthKey: string;
  /** "Octubre 2026" */
  monthLabel: string;
};

/** Descompone una fecha "AAAA-MM-DD" sin pasar por zonas horarias. */
export function dateParts(iso: string): DateParts | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  const day = Number(m[3]);
  if (month < 0 || month > 11 || day < 1 || day > 31) return null;
  return {
    day,
    monthAbbr: MONTH_ABBR[month],
    weekday: WEEKDAY_ABBR[new Date(year, month, day).getDay()],
    monthKey: `${m[1]}-${m[2]}`,
    monthLabel: `${MONTH_NAMES[month]} ${year}`,
  };
}

export type MonthGroup<T> = { key: string; label: string; items: T[] };

/** Agrupa por mes, del más reciente al más antiguo (y cada grupo también). */
export function groupByMonth<T extends { date: string }>(items: T[]): MonthGroup<T>[] {
  const sorted = [...items].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  const groups: MonthGroup<T>[] = [];
  for (const item of sorted) {
    const parts = dateParts(item.date);
    const key = parts?.monthKey ?? "sin-fecha";
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(item);
    else groups.push({ key, label: parts?.monthLabel ?? "Sin fecha", items: [item] });
  }
  return groups;
}

export type WeightRow = BodyWeightEntry & {
  /** Diferencia con el registro anterior en el tiempo (kg); null en el primero. */
  delta: number | null;
};

export type WeightStats = {
  rows: WeightRow[];
  min: number | null;
  max: number | null;
  avg: number | null;
  /** Último menos el primero (kg). */
  totalChange: number | null;
  /** Valores del más antiguo al más reciente, para la gráfica. */
  series: number[];
};

const round1 = (n: number) => Math.round(n * 10) / 10;

export function weightStats(entries: BodyWeightEntry[]): WeightStats {
  const asc = [...entries].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  if (asc.length === 0) {
    return { rows: [], min: null, max: null, avg: null, totalChange: null, series: [] };
  }
  const values = asc.map((e) => e.weightKg);
  const rows: WeightRow[] = asc
    .map((e, i) => ({ ...e, delta: i === 0 ? null : round1(e.weightKg - asc[i - 1].weightKg) }))
    .reverse();
  return {
    rows,
    min: Math.min(...values),
    max: Math.max(...values),
    avg: round1(values.reduce((s, v) => s + v, 0) / values.length),
    totalChange: asc.length > 1 ? round1(values[values.length - 1] - values[0]) : null,
    series: values,
  };
}
