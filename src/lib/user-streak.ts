/**
 * Utilidades para el cálculo de rachas de gimnasio e insignias estilo Duolingo.
 */

import type { Workout } from "@/lib/types";

export interface DayStreakInfo {
  dayIndex: number; // 0 = Lunes, 6 = Domingo
  dayLetter: string; // 'L', 'M', 'M', 'J', 'V', 'S', 'D'
  dayName: string; // 'Lunes', 'Martes', etc.
  dateIso: string;
  isTrained: boolean;
  isToday: boolean;
}

export interface BadgeInfo {
  level: number;
  title: string;
  badgeEmoji: string;
  description: string;
  minWeeks: number;
}

export interface UserStreakSummary {
  currentWeekCount: number; // Días entrenados esta semana
  weeklyGoal: number; // Meta semanal (por defecto 4 días)
  consecutiveWeeks: number; // Semanas consecutivas cumpliendo la meta
  totalWorkouts: number;
  daysOfWeek: DayStreakInfo[];
  badge: BadgeInfo;
  motivationalMessage: string;
}

export const BADGES: BadgeInfo[] = [
  {
    level: 1,
    title: "Iniciador de Hierro",
    badgeEmoji: "⚡",
    description: "Primeros pasos en la disciplina constante",
    minWeeks: 0,
  },
  {
    level: 2,
    title: "Constancia de Acero",
    badgeEmoji: "🛡️",
    description: "2 semanas seguidas sin fallar",
    minWeeks: 2,
  },
  {
    level: 3,
    title: "Atleta Imparable",
    badgeEmoji: "⚔️",
    description: "1 mes de constancia inquebrantable",
    minWeeks: 4,
  },
  {
    level: 4,
    title: "Titán de la Fuerza",
    badgeEmoji: "👑",
    description: "2 meses de disciplina absoluta",
    minWeeks: 8,
  },
  {
    level: 5,
    title: "Leyenda del Gym",
    badgeEmoji: "🏆",
    description: "Más de 3 meses entrenando con maestría",
    minWeeks: 12,
  },
];

/**
 * Obtiene el lunes de la semana para una fecha dada (ISO local).
 */
export function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajustar cuando es domingo
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Formatea una fecha local a YYYY-MM-DD sin desajustes de zona horaria */
export function formatLocalDateIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Calcula el desglose semanal (Lunes a Domingo) para la fecha actual
 */
export function getWeekDaysStatus(
  workouts: Workout[],
  now = new Date(),
): DayStreakInfo[] {
  const trainedDates = new Set(
    workouts
      .map((w) => w.date)
      .filter((d): d is string => typeof d === "string" && Boolean(d)),
  );

  const monday = getMondayOfWeek(now);
  const todayIso = formatLocalDateIso(now);
  const dayLetters = ["L", "M", "M", "J", "V", "S", "D"];
  const dayNames = [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
    "Domingo",
  ];

  const result: DayStreakInfo[] = [];

  for (let i = 0; i < 7; i++) {
    const current = new Date(monday);
    current.setDate(monday.getDate() + i);
    const dateIso = formatLocalDateIso(current);

    result.push({
      dayIndex: i,
      dayLetter: dayLetters[i] ?? "D",
      dayName: dayNames[i] ?? "Día",
      dateIso,
      isTrained: trainedDates.has(dateIso),
      isToday: dateIso === todayIso,
    });
  }

  return result;
}

/**
 * Calcula las semanas consecutivas entrenadas hacia atrás a partir de una lista de entrenamientos.
 */
export function calculateConsecutiveWeeks(
  workouts: Workout[],
  now = new Date(),
  minDaysPerWeek = 2,
): number {
  if (workouts.length === 0) return 0;

  const trainedDates = new Set(
    workouts
      .map((w) => w.date)
      .filter((d): d is string => typeof d === "string" && Boolean(d)),
  );

  const currentMonday = getMondayOfWeek(now);
  let streakWeeks = 0;

  // Analizar la semana actual: si ya tiene al menos 1 entreno o si acaba de empezar
  let checkMonday = new Date(currentMonday);

  // Contar días entrenados en la semana actual
  let currentWeekTrained = 0;
  for (let i = 0; i < 7; i++) {
    const day = new Date(checkMonday);
    day.setDate(checkMonday.getDate() + i);
    if (trainedDates.has(formatLocalDateIso(day))) {
      currentWeekTrained++;
    }
  }

  // Si en la semana actual ya se entrenó al menos 1 día, cuenta para mantener la racha activa
  if (currentWeekTrained >= 1) {
    streakWeeks = 1;
  }

  // Retroceder semana por semana hacia el pasado
  while (true) {
    checkMonday = new Date(checkMonday);
    checkMonday.setDate(checkMonday.getDate() - 7);

    let daysInWeek = 0;
    for (let i = 0; i < 7; i++) {
      const day = new Date(checkMonday);
      day.setDate(checkMonday.getDate() + i);
      if (trainedDates.has(formatLocalDateIso(day))) {
        daysInWeek++;
      }
    }

    if (daysInWeek >= minDaysPerWeek) {
      streakWeeks++;
    } else {
      break;
    }

    // Límite de seguridad para evitar bucle infinito
    if (streakWeeks > 200) break;
  }

  return streakWeeks;
}

/**
 * Obtiene la insignia correspondiente a las semanas consecutivas de racha.
 */
export function getBadgeForStreak(consecutiveWeeks: number): BadgeInfo {
  let matched = BADGES[0]!;
  for (const b of BADGES) {
    if (consecutiveWeeks >= b.minWeeks) {
      matched = b;
    }
  }
  return matched;
}

/**
 * Genera un mensaje motivador según el estado de la racha actual.
 */
export function getMotivationalStreakMessage(
  currentWeekCount: number,
  consecutiveWeeks: number,
  weeklyGoal = 4,
): string {
  if (currentWeekCount >= weeklyGoal) {
    return `¡Semana perfecta cumplida! ${currentWeekCount}/${weeklyGoal} entrenos completados. ¡Eres una máquina!`;
  }
  if (currentWeekCount === 0) {
    return `Comienza la semana con fuerza. ¡Registra tu primer entreno y mantén la racha viva!`;
  }
  const remaining = weeklyGoal - currentWeekCount;
  if (consecutiveWeeks >= 2) {
    return `¡Llevas ${consecutiveWeeks} semanas en racha! Solo te faltan ${remaining} ${remaining === 1 ? "sesión" : "sesiones"} para completar la meta de esta semana.`;
  }
  return `Llevas ${currentWeekCount} de ${weeklyGoal} entrenos esta semana. ¡No te detengas!`;
}

/**
 * Función principal para generar el resumen completo de racha para el perfil.
 */
export function calculateUserStreakSummary(
  workouts: Workout[],
  now = new Date(),
  weeklyGoal = 4,
): UserStreakSummary {
  const daysOfWeek = getWeekDaysStatus(workouts, now);
  const currentWeekCount = daysOfWeek.filter((d) => d.isTrained).length;
  const consecutiveWeeks = calculateConsecutiveWeeks(workouts, now, 2);
  const badge = getBadgeForStreak(consecutiveWeeks);
  const motivationalMessage = getMotivationalStreakMessage(
    currentWeekCount,
    consecutiveWeeks,
    weeklyGoal,
  );

  return {
    currentWeekCount,
    weeklyGoal,
    consecutiveWeeks,
    totalWorkouts: workouts.length,
    daysOfWeek,
    badge,
    motivationalMessage,
  };
}
