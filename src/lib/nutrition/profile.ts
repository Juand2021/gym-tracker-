/** Perfil único, compartido por Fuerza y Comidas (docs/nutricion/03-arquitectura.md §3.1). */

export type PhaseType = "deficit" | "mantenimiento" | "recomposicion" | "volumen";

export type NutritionProfile = {
  sex: "M" | "F";
  birthDate: string; // YYYY-MM-DD; la edad se calcula
  heightCm: number;
  /** Solo si viene de una medida fiable (DXA, bioimpedancia). */
  bodyFatPct: number | null;
  /** Estimación a ojo mientras no hay medida: sirve para elegir la proteína. */
  bodyFatEstimate: "bajo" | "medio" | "alto" | null;
  stepsPerDay: number;
  /** Duración típica de una sesión de pesas, si el historial no la trae. */
  sessionMinutes: number;
  /** Peso a usar si todavía no hay ningún pesaje en Fuerza. */
  fallbackWeightKg: number;
  phase: {
    type: PhaseType;
    start: string;
    end: string | null;
    /** % del peso por semana (déficit o volumen). */
    ratePctPerWeek: number;
    objective: string;
  };
  updatedAt: string;
};

/** Datos de Juan acordados en la Fase 0 y confirmados el 2026-10-25 (déficit grande = 1 %/semana). */
export const JUAN_DEFAULT_PROFILE: NutritionProfile = {
  sex: "M",
  birthDate: "2001-10-15",
  heightCm: 179,
  bodyFatPct: null,
  bodyFatEstimate: "alto",
  stepsPerDay: 3500,
  sessionMinutes: 90,
  fallbackWeightKg: 78,
  phase: {
    type: "deficit",
    start: "2026-10-24",
    end: "2026-11-14",
    ratePctPerWeek: 1.0,
    objective: "Bajar grasa (abdomen y pecho) manteniendo la fuerza",
  },
  updatedAt: "2026-10-25T00:00:00.000Z",
};

export function ageOn(birthDate: string, today: string): number {
  const [by, bm, bd] = birthDate.split("-").map(Number);
  const [ty, tm, td] = today.split("-").map(Number);
  let age = ty - by;
  if (tm < bm || (tm === bm && td < bd)) age--;
  return age;
}

/** Fecha de hoy en Colombia (YYYY-MM-DD). */
export function todayInBogota(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** Hora actual en Colombia (HH:MM). */
export function timeInBogota(now = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "America/Bogota", hour: "2-digit", minute: "2-digit", hour12: false }).format(now);
}
