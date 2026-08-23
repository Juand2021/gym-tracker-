import type { BodyWeightEntry, Workout, WorkoutSet } from "./types.ts";

export type TimeRange = "1m" | "3m" | "6m" | "all";

export type IntensityZone = "fuerza" | "hipertrofia" | "resistencia";

export type OneRmSessionPoint = {
  date: string;
  weightKg: number;
  reps: number;
  est1rm: number;
  movingAvg1rm: number;
  relative1rm: number | null;
  bodyWeightKg: number | null;
  totalSets: number;
  sessionVolumeKg: number;
};

export type WeeklyVolumePoint = {
  weekKey: string;
  weekLabel: string;
  volumeKg: number;
  tonnage: number;
  setsCount: number;
  sessionsCount: number;
  deltaPct: number | null;
};

export type ScatterSetPoint = {
  id: string;
  date: string;
  exercise: string;
  weightKg: number;
  reps: number;
  est1rm: number;
  zone: IntensityZone;
  bodyWeightKg: number | null;
};

export type MuscleGroupVolumePoint = {
  group: string;
  volumeKg: number;
  tonnage: number;
  setsCount: number;
  percentage: number;
};

export type IntensityZoneSummary = {
  fuerza: { count: number; pct: number };
  hipertrofia: { count: number; pct: number };
  resistencia: { count: number; pct: number };
  totalSets: number;
};

export type AnalyticsKpiSummary = {
  current1rm: number | null;
  current1rmDate: string | null;
  allTimeMax1rm: number | null;
  allTimeMax1rmDate: string | null;
  allTimeMaxSet: { weightKg: number; reps: number } | null;
  totalTonnageKg: number;
  totalTonnageTon: number;
  weeklyAvgTonnageTon: number;
  progressionPct: number | null;
  firstWindowAvg1rm: number | null;
  lastWindowAvg1rm: number | null;
  totalSets: number;
  totalSessions: number;
};

export type AnalyticsOptions = {
  timeRange?: TimeRange;
  maxRepsThreshold?: number; // p. ej. 15 o 20 reps max para cálculo 1RM
  movingAverageWindow?: number; // p. ej. 3 o 5 sesiones
};

const DEFAULT_OPTIONS: Required<AnalyticsOptions> = {
  timeRange: "all",
  maxRepsThreshold: 20,
  movingAverageWindow: 3,
};

export function daysAgoIso(days: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export function weekKey(date: string): string {
  const d = new Date(`${date}T12:00:00`);
  const day = d.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + mondayOffset);
  return d.toISOString().slice(0, 10);
}

export function nearestBodyWeight(
  date: string,
  weights: BodyWeightEntry[],
): number | null {
  if (weights.length === 0) return null;
  let best: BodyWeightEntry | null = null;
  let bestDelta = Infinity;
  const targetTime = Date.parse(date);
  for (const entry of weights) {
    const delta = Math.abs(Date.parse(entry.date) - targetTime);
    if (delta < bestDelta) {
      best = entry;
      bestDelta = delta;
    }
  }
  return best?.weightKg ?? null;
}

export function isBodyweightExercise(exercise: string): boolean {
  const name = exercise.toLowerCase();
  return (
    name.includes("dominada") ||
    name.includes("fondo") ||
    name.includes("fondos")
  );
}

export function effectiveLoadKg(
  exercise: string,
  weightKg: number,
  bodyWeightKg: number | null,
): number {
  if (isBodyweightExercise(exercise)) {
    return (bodyWeightKg ?? 0) + weightKg;
  }
  return weightKg;
}

export function setVolumeKg(
  set: WorkoutSet,
  bodyWeightKg: number | null,
): number {
  return effectiveLoadKg(set.exercise, set.weightKg, bodyWeightKg) * set.reps;
}

export function getExerciseMuscleGroup(exercise: string): string {
  const name = exercise.toLowerCase();
  if (
    name.includes("pecho") ||
    name.includes("banca") ||
    name.includes("pec deck") ||
    name.includes("fondos") ||
    name.includes("cruce de poleas")
  ) {
    return "Pecho";
  }
  if (
    name.includes("espalda") ||
    name.includes("remo") ||
    name.includes("jalón") ||
    name.includes("dominada") ||
    name.includes("pull")
  ) {
    return "Espalda";
  }
  if (
    name.includes("militar") ||
    name.includes("hombro") ||
    name.includes("elevaciones") ||
    name.includes("deltoides") ||
    name.includes("encogimiento")
  ) {
    return "Hombro";
  }
  if (
    name.includes("sentadilla") ||
    name.includes("prensa") ||
    name.includes("cuádriceps") ||
    name.includes("femoral") ||
    name.includes("gemelo") ||
    name.includes("pierna") ||
    name.includes("peso muerto") ||
    name.includes("aducción")
  ) {
    return "Pierna";
  }
  if (
    name.includes("bíceps") ||
    name.includes("biceps") ||
    name.includes("curl martillo") ||
    (name.includes("curl") && !name.includes("antebrazo"))
  ) {
    return "Bíceps";
  }
  if (
    name.includes("tríceps") ||
    name.includes("triceps") ||
    name.includes("francés") ||
    name.includes("extensión de tríceps")
  ) {
    return "Tríceps";
  }
  if (name.includes("antebrazo") || name.includes("muñeca")) {
    return "Antebrazo";
  }
  if (
    name.includes("abdomen") ||
    name.includes("crunch") ||
    name.includes("plancha") ||
    name.includes("core") ||
    name.includes("oblicuos") ||
    name.includes("elevación de piernas") ||
    name.includes("rueda")
  ) {
    return "Abdomen y Core";
  }
  return "Otros";
}

/**
 * Fórmula de 1RM de Epley:
 * 1RM = Peso * (1 + Reps / 30)
 * Si Reps = 1 => 1RM = Peso.
 * Si Reps <= 0 o Peso <= 0 => 0.
 * Si Reps > maxRepsThreshold => retorna 0 para no distorsionar con rangos de alta resistencia.
 */
export function calculateEpley1RM(
  weightKg: number,
  reps: number,
  maxRepsThreshold = 20,
): number {
  if (weightKg <= 0 || reps <= 0) return 0;
  if (reps > maxRepsThreshold) return 0;
  if (reps === 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

/**
 * Determina la fecha de inicio según el TimeRange.
 */
export function getStartDateForTimeRange(timeRange: TimeRange): string | null {
  switch (timeRange) {
    case "1m":
      return daysAgoIso(30);
    case "3m":
      return daysAgoIso(90);
    case "6m":
      return daysAgoIso(180);
    case "all":
    default:
      return null;
  }
}

/**
 * Filtra entrenamientos por rango de tiempo.
 */
export function filterWorkoutsByTimeRange(
  workouts: Workout[],
  timeRange: TimeRange,
): Workout[] {
  const startDate = getStartDateForTimeRange(timeRange);
  if (!startDate) return workouts;
  return workouts.filter((w) => w.date >= startDate);
}

/**
 * Calcula la Media Móvil Simple (SMA) de un array de números.
 * Para los primeros puntos calcula la media de los puntos disponibles hasta el momento.
 */
export function calculateMovingAverage(
  values: number[],
  windowSize = 3,
): number[] {
  if (values.length === 0) return [];
  const validWindow = Math.max(1, windowSize);
  const result: number[] = [];

  for (let i = 0; i < values.length; i++) {
    const startIdx = Math.max(0, i - validWindow + 1);
    const windowValues = values.slice(startIdx, i + 1);
    const sum = windowValues.reduce((acc, val) => acc + val, 0);
    const avg = sum / windowValues.length;
    result.push(Math.round(avg * 10) / 10);
  }

  return result;
}

/**
 * Formatea una fecha o clave de semana de forma amigable (ej. "07 Abr").
 */
export function formatWeekLabel(dateIso: string): string {
  try {
    const d = new Date(`${dateIso}T12:00:00`);
    const day = d.getDate().toString().padStart(2, "0");
    const months = [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ];
    const month = months[d.getMonth()] ?? "";
    return `${day} ${month}`;
  } catch {
    return dateIso.slice(5);
  }
}

/**
 * Categoriza una serie en una zona de intensidad.
 */
export function getIntensityZone(reps: number): IntensityZone {
  if (reps <= 5) return "fuerza";
  if (reps <= 12) return "hipertrofia";
  return "resistencia";
}

export class WorkoutAnalyticsService {
  /**
   * Genera la serie temporal de 1RM sesión por sesión para un ejercicio dado.
   * Considera únicamente la serie con mayor 1RM de cada sesión.
   * Agrega la Media Móvil (SMA) calculada.
   */
  static getSession1RMProgression(
    workouts: Workout[],
    weights: BodyWeightEntry[],
    exercise: string,
    options: AnalyticsOptions = {},
  ): OneRmSessionPoint[] {
    if (!exercise) return [];
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const filteredWorkouts = filterWorkoutsByTimeRange(workouts, opts.timeRange);

    // Ordenar de más antiguo a más reciente para graficar cronológicamente
    const sortedWorkouts = [...filteredWorkouts].sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    const sessionPoints: Array<Omit<OneRmSessionPoint, "movingAvg1rm">> = [];

    for (const workout of sortedWorkouts) {
      const exerciseSets = workout.sets.filter(
        (s) => s.exercise.toLowerCase() === exercise.toLowerCase(),
      );
      if (exerciseSets.length === 0) continue;

      const bw = nearestBodyWeight(workout.date, weights);
      let bestEst1rm = 0;
      let bestSet: WorkoutSet | null = null;
      let sessionVol = 0;
      let validSetsCount = 0;

      for (const set of exerciseSets) {
        if (set.reps <= 0 || set.weightKg < 0) continue;
        const load = effectiveLoadKg(set.exercise, set.weightKg, bw);
        if (load <= 0) continue;

        sessionVol += load * set.reps;
        validSetsCount++;

        const est = calculateEpley1RM(load, set.reps, opts.maxRepsThreshold);
        if (est > bestEst1rm) {
          bestEst1rm = est;
          bestSet = set;
        }
      }

      if (!bestSet || bestEst1rm <= 0) continue;

      const rounded1rm = Math.round(bestEst1rm * 10) / 10;
      const relative1rm =
        bw && bw > 0 ? Math.round((rounded1rm / bw) * 100) / 100 : null;

      sessionPoints.push({
        date: workout.date,
        weightKg: bestSet.weightKg,
        reps: bestSet.reps,
        est1rm: rounded1rm,
        relative1rm,
        bodyWeightKg: bw,
        totalSets: validSetsCount,
        sessionVolumeKg: Math.round(sessionVol),
      });
    }

    const est1rmValues = sessionPoints.map((p) => p.est1rm);
    const movingAverages = calculateMovingAverage(
      est1rmValues,
      opts.movingAverageWindow,
    );

    return sessionPoints.map((point, index) => ({
      ...point,
      movingAvg1rm: movingAverages[index] ?? point.est1rm,
    }));
  }

  /**
   * Calcula el volumen de carga semanal (tonelaje) agrupado por semana de calendario.
   * Si se provee `exercise`, filtra por ese ejercicio; si no, calcula el volumen global.
   */
  static getWeeklyVolumeSeries(
    workouts: Workout[],
    weights: BodyWeightEntry[],
    exercise?: string,
    options: AnalyticsOptions = {},
  ): WeeklyVolumePoint[] {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const filteredWorkouts = filterWorkoutsByTimeRange(workouts, opts.timeRange);

    const weekMap = new Map<
      string,
      { volumeKg: number; setsCount: number; sessionDates: Set<string> }
    >();

    for (const workout of filteredWorkouts) {
      const wKey = weekKey(workout.date);
      const bw = nearestBodyWeight(workout.date, weights);

      const relevantSets = exercise
        ? workout.sets.filter(
            (s) => s.exercise.toLowerCase() === exercise.toLowerCase(),
          )
        : workout.sets;

      if (relevantSets.length === 0) continue;

      const entry = weekMap.get(wKey) ?? {
        volumeKg: 0,
        setsCount: 0,
        sessionDates: new Set<string>(),
      };

      for (const set of relevantSets) {
        if (set.reps <= 0 || set.weightKg < 0) continue;
        const vol = setVolumeKg(set, bw);
        if (vol > 0) {
          entry.volumeKg += vol;
          entry.setsCount += 1;
        }
      }

      entry.sessionDates.add(workout.date);
      weekMap.set(wKey, entry);
    }

    const sortedWeeks = [...weekMap.entries()].sort((a, b) =>
      a[0].localeCompare(b[0]),
    );

    const points: WeeklyVolumePoint[] = [];

    for (let i = 0; i < sortedWeeks.length; i++) {
      const [wKey, data] = sortedWeeks[i];
      const tonnage = Math.round((data.volumeKg / 1000) * 100) / 100;
      const prevVolume = i > 0 ? sortedWeeks[i - 1][1].volumeKg : null;
      const deltaPct =
        prevVolume && prevVolume > 0
          ? Math.round(((data.volumeKg - prevVolume) / prevVolume) * 1000) / 10
          : null;

      points.push({
        weekKey: wKey,
        weekLabel: formatWeekLabel(wKey),
        volumeKg: Math.round(data.volumeKg),
        tonnage,
        setsCount: data.setsCount,
        sessionsCount: data.sessionDates.size,
        deltaPct,
      });
    }

    return points;
  }

  /**
   * Extrae todas las series individuales para el Scatter Plot (Reps vs. Peso).
   */
  static getScatterSets(
    workouts: Workout[],
    weights: BodyWeightEntry[],
    exercise: string,
    options: AnalyticsOptions = {},
  ): ScatterSetPoint[] {
    if (!exercise) return [];
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const filteredWorkouts = filterWorkoutsByTimeRange(workouts, opts.timeRange);

    const points: ScatterSetPoint[] = [];

    for (const workout of filteredWorkouts) {
      const bw = nearestBodyWeight(workout.date, weights);
      const sets = workout.sets.filter(
        (s) => s.exercise.toLowerCase() === exercise.toLowerCase(),
      );

      for (const set of sets) {
        if (set.reps <= 0 || set.weightKg < 0) continue;
        const load = effectiveLoadKg(set.exercise, set.weightKg, bw);
        if (load <= 0) continue;

        const est1rm = Math.round(
          calculateEpley1RM(load, set.reps, opts.maxRepsThreshold) * 10,
        ) / 10;

        points.push({
          id: set.id,
          date: workout.date,
          exercise: set.exercise,
          weightKg: set.weightKg,
          reps: set.reps,
          est1rm,
          zone: getIntensityZone(set.reps),
          bodyWeightKg: bw,
        });
      }
    }

    return points.sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Desglose porcentual de zonas de intensidad a partir de los puntos del scatter plot.
   */
  static getIntensityZoneSummary(
    points: ScatterSetPoint[],
  ): IntensityZoneSummary {
    const total = points.length;
    if (total === 0) {
      return {
        fuerza: { count: 0, pct: 0 },
        hipertrofia: { count: 0, pct: 0 },
        resistencia: { count: 0, pct: 0 },
        totalSets: 0,
      };
    }

    let fuerza = 0;
    let hipertrofia = 0;
    let resistencia = 0;

    for (const p of points) {
      if (p.zone === "fuerza") fuerza++;
      else if (p.zone === "hipertrofia") hipertrofia++;
      else resistencia++;
    }

    return {
      fuerza: { count: fuerza, pct: Math.round((fuerza / total) * 100) },
      hipertrofia: {
        count: hipertrofia,
        pct: Math.round((hipertrofia / total) * 100),
      },
      resistencia: {
        count: resistencia,
        pct: Math.round((resistencia / total) * 100),
      },
      totalSets: total,
    };
  }

  /**
   * Agrupa el volumen total por grupo muscular dentro del periodo seleccionado.
   */
  static getMuscleGroupVolumeBreakdown(
    workouts: Workout[],
    weights: BodyWeightEntry[],
    options: AnalyticsOptions = {},
  ): MuscleGroupVolumePoint[] {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const filteredWorkouts = filterWorkoutsByTimeRange(workouts, opts.timeRange);

    const groupMap = new Map<string, { volumeKg: number; setsCount: number }>();
    let totalVolumeAll = 0;

    for (const workout of filteredWorkouts) {
      const bw = nearestBodyWeight(workout.date, weights);
      for (const set of workout.sets) {
        if (set.reps <= 0 || set.weightKg < 0) continue;
        const vol = setVolumeKg(set, bw);
        if (vol <= 0) continue;

        const group = getExerciseMuscleGroup(set.exercise);
        const entry = groupMap.get(group) ?? { volumeKg: 0, setsCount: 0 };
        entry.volumeKg += vol;
        entry.setsCount += 1;
        totalVolumeAll += vol;
        groupMap.set(group, entry);
      }
    }

    const result: MuscleGroupVolumePoint[] = [];
    for (const [group, data] of groupMap.entries()) {
      const percentage =
        totalVolumeAll > 0
          ? Math.round((data.volumeKg / totalVolumeAll) * 1000) / 10
          : 0;
      result.push({
        group,
        volumeKg: Math.round(data.volumeKg),
        tonnage: Math.round((data.volumeKg / 1000) * 10) / 10,
        setsCount: data.setsCount,
        percentage,
      });
    }

    return result.sort((a, b) => b.volumeKg - a.volumeKg);
  }

  /**
   * Calcula el resumen de KPIs para un ejercicio:
   * 1. 1RM actual
   * 2. 1RM máximo histórico
   * 3. Tonelaje acumulado en el rango
   * 4. % de progresión de fuerza (promedio 1RM últimas 2 semanas vs. 2 semanas iniciales del periodo)
   */
  static getKpiSummary(
    workouts: Workout[],
    weights: BodyWeightEntry[],
    exercise: string,
    options: AnalyticsOptions = {},
  ): AnalyticsKpiSummary {
    const emptyResult: AnalyticsKpiSummary = {
      current1rm: null,
      current1rmDate: null,
      allTimeMax1rm: null,
      allTimeMax1rmDate: null,
      allTimeMaxSet: null,
      totalTonnageKg: 0,
      totalTonnageTon: 0,
      weeklyAvgTonnageTon: 0,
      progressionPct: null,
      firstWindowAvg1rm: null,
      lastWindowAvg1rm: null,
      totalSets: 0,
      totalSessions: 0,
    };

    if (!exercise) return emptyResult;

    // Calcular máximo histórico sobre todos los entrenamientos
    let allTimeMax1rm: number | null = null;
    let allTimeMax1rmDate: string | null = null;
    let allTimeMaxSet: { weightKg: number; reps: number } | null = null;

    for (const workout of workouts) {
      const bw = nearestBodyWeight(workout.date, weights);
      const sets = workout.sets.filter(
        (s) => s.exercise.toLowerCase() === exercise.toLowerCase(),
      );
      for (const set of sets) {
        if (set.reps <= 0 || set.weightKg < 0) continue;
        const load = effectiveLoadKg(set.exercise, set.weightKg, bw);
        const est = calculateEpley1RM(
          load,
          set.reps,
          options.maxRepsThreshold ?? 20,
        );
        if (est > (allTimeMax1rm ?? 0)) {
          allTimeMax1rm = Math.round(est * 10) / 10;
          allTimeMax1rmDate = workout.date;
          allTimeMaxSet = { weightKg: set.weightKg, reps: set.reps };
        }
      }
    }

    // Datos del rango seleccionado
    const progression = this.getSession1RMProgression(
      workouts,
      weights,
      exercise,
      options,
    );

    if (progression.length === 0) {
      return {
        ...emptyResult,
        allTimeMax1rm,
        allTimeMax1rmDate,
        allTimeMaxSet,
      };
    }

    const currentSession = progression[progression.length - 1];
    const totalTonnageKg = progression.reduce(
      (sum, p) => sum + p.sessionVolumeKg,
      0,
    );
    const totalTonnageTon = Math.round((totalTonnageKg / 1000) * 100) / 100;
    const totalSets = progression.reduce((sum, p) => sum + p.totalSets, 0);
    const totalSessions = progression.length;

    // Cantidad de semanas activas
    const distinctWeeks = new Set(progression.map((p) => weekKey(p.date))).size;
    const weeklyAvgTonnageTon =
      distinctWeeks > 0
        ? Math.round((totalTonnageTon / distinctWeeks) * 100) / 100
        : totalTonnageTon;

    // % de progresión de fuerza:
    // Compara el promedio de 1RM de las últimas 2 semanas (o últimas 2 sesiones)
    // vs. las 2 semanas iniciales (o primeras 2 sesiones)
    let progressionPct: number | null = null;
    let firstWindowAvg1rm: number | null = null;
    let lastWindowAvg1rm: number | null = null;

    if (progression.length >= 2) {
      const windowSize = Math.min(2, Math.floor(progression.length / 2));
      const firstWindow = progression.slice(0, windowSize);
      const lastWindow = progression.slice(progression.length - windowSize);

      const firstAvg =
        firstWindow.reduce((s, p) => s + p.est1rm, 0) / firstWindow.length;
      const lastAvg =
        lastWindow.reduce((s, p) => s + p.est1rm, 0) / lastWindow.length;

      firstWindowAvg1rm = Math.round(firstAvg * 10) / 10;
      lastWindowAvg1rm = Math.round(lastAvg * 10) / 10;

      if (firstAvg > 0) {
        progressionPct =
          Math.round(((lastAvg - firstAvg) / firstAvg) * 1000) / 10;
      }
    }

    return {
      current1rm: currentSession.est1rm,
      current1rmDate: currentSession.date,
      allTimeMax1rm,
      allTimeMax1rmDate,
      allTimeMaxSet,
      totalTonnageKg,
      totalTonnageTon,
      weeklyAvgTonnageTon,
      progressionPct,
      firstWindowAvg1rm,
      lastWindowAvg1rm,
      totalSets,
      totalSessions,
    };
  }
}
