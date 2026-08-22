import type { ArmFocus, DayType } from "@/lib/routines";
import type { BodyWeightEntry, Workout, WorkoutSet } from "@/lib/types";

/**
 * Datos inventados (~1 mes) para previsualizar métricas/gráficas.
 * Activos mientras DEMO_SEED !== "0".
 * No se guardan en disco: al quitar el flag desaparecen.
 */
export function isDemoSeedEnabled(): boolean {
  return process.env.DEMO_SEED !== "0";
}

type SetSpec = { exercise: string; weightKg: number; reps: number[] };

function buildSets(specs: SetSpec[], workoutId: string): WorkoutSet[] {
  const sets: WorkoutSet[] = [];
  let i = 0;
  for (const spec of specs) {
    spec.reps.forEach((reps, idx) => {
      i += 1;
      sets.push({
        id: `${workoutId}-s${i}`,
        exercise: spec.exercise,
        weightKg: spec.weightKg,
        reps,
        setNumber: idx + 1,
      });
    });
  }
  return sets;
}

function workout(
  id: string,
  date: string,
  dayType: DayType,
  armFocus: ArmFocus | null,
  specs: SetSpec[],
): Workout {
  return {
    id,
    date,
    notes: "demo",
    createdAt: `${date}T18:00:00.000Z`,
    dayType,
    armFocus,
    sets: buildSets(specs, id),
  };
}

/** week 0 = más antigua (~4 semanas atrás), week 3 ≈ nivel actual */
function w(week: number, start: number, end: number): number {
  const t = week / 3;
  return Math.round((start + (end - start) * t) * 2) / 2;
}

function pecho(week: number, date: string, id: string): Workout {
  return workout(id, date, "pecho", null, [
    { exercise: "Press banca", weightKg: w(week, 55, 65), reps: [6, 6, 7] },
    {
      exercise: "Press inclinado con mancuernas",
      weightKg: w(week, 20, 25),
      reps: [8, 7, 7],
    },
    { exercise: "Pec deck", weightKg: w(week, 40, 50), reps: [10, 9, 8] },
    {
      exercise: "Cruce de poleas alto",
      weightKg: w(week, 15, 20),
      reps: [12, 12, 12],
    },
    { exercise: "Fondos", weightKg: 0, reps: [8, 8, 7] },
    {
      exercise: "Press francés con barra Z",
      weightKg: w(week, 20, 25),
      reps: [10, 9, 8],
    },
    {
      exercise: "Extensión de tríceps con cuerda",
      weightKg: w(week, 30, 40),
      reps: [12, 12, 10],
    },
    {
      exercise: "Extensión de tríceps trasnuca",
      weightKg: w(week, 35, 45),
      reps: [12, 10, 10],
    },
    {
      exercise: "Extensión de tríceps unilateral",
      weightKg: 5,
      reps: [12, 12, 12],
    },
  ]);
}

function espalda(week: number, date: string, id: string): Workout {
  return workout(id, date, "espalda", null, [
    { exercise: "Dominadas", weightKg: 0, reps: [5 + week, 5, 4] },
    { exercise: "Jalón al pecho", weightKg: w(week, 45, 55), reps: [10, 9, 8] },
    {
      exercise: "Remo con máquina",
      weightKg: w(week, 50, 60),
      reps: [10, 10, 8],
    },
    {
      exercise: "Remo unilateral con agarre de polea",
      weightKg: w(week, 20, 28),
      reps: [10, 10, 9],
    },
    { exercise: "Face pull", weightKg: w(week, 12.5, 20), reps: [15, 15, 12] },
    { exercise: "Curl martillo", weightKg: w(week, 12, 16), reps: [10, 10, 9] },
    {
      exercise: "Bíceps con mancuernas",
      weightKg: w(week, 10, 14),
      reps: [10, 10, 8],
    },
    {
      exercise: "Bíceps unilateral concentrado",
      weightKg: w(week, 8, 12),
      reps: [10, 10, 8],
    },
    { exercise: "Bíceps barra Z", weightKg: w(week, 20, 25), reps: [10, 9, 8] },
  ]);
}

function hombro(
  week: number,
  date: string,
  id: string,
  armFocus: ArmFocus,
): Workout {
  const shoulders: SetSpec[] = [
    { exercise: "Dominadas agarre neutro", weightKg: 0, reps: [5, 5, 4] },
    {
      exercise: "Press militar con mancuernas",
      weightKg: w(week, 14, 18),
      reps: [8, 8, 7],
    },
    {
      exercise: "Elevaciones unilaterales con cable",
      weightKg: w(week, 5, 8),
      reps: [12, 12, 10],
    },
    {
      exercise: "Elevaciones hacia el frente unilaterales con cable",
      weightKg: w(week, 5, 7.5),
      reps: [12, 12, 10],
    },
    {
      exercise: "Face-pull o reverse peck deck",
      weightKg: w(week, 30, 40),
      reps: [12, 12, 12],
    },
    {
      exercise: "Encogimiento de hombros",
      weightKg: w(week, 40, 50),
      reps: [12, 12, 10],
    },
  ];

  const arms: SetSpec[] =
    armFocus === "biceps"
      ? [
          {
            exercise: "Curl martillo",
            weightKg: w(week, 12, 16),
            reps: [10, 10, 9],
          },
          {
            exercise: "Bíceps con mancuernas",
            weightKg: w(week, 10, 14),
            reps: [10, 9, 8],
          },
          {
            exercise: "Bíceps unilateral concentrado",
            weightKg: w(week, 8, 12),
            reps: [10, 10, 8],
          },
          {
            exercise: "Bíceps barra Z",
            weightKg: w(week, 20, 25),
            reps: [10, 9, 8],
          },
        ]
      : [
          {
            exercise: "Press francés con barra Z",
            weightKg: w(week, 20, 25),
            reps: [10, 9, 8],
          },
          {
            exercise: "Extensión de tríceps con cuerda",
            weightKg: w(week, 30, 40),
            reps: [12, 12, 10],
          },
          {
            exercise: "Extensión de tríceps trasnuca",
            weightKg: w(week, 35, 45),
            reps: [12, 10, 10],
          },
          {
            exercise: "Extensión de tríceps unilateral",
            weightKg: 5,
            reps: [12, 12, 12],
          },
        ];

  return workout(id, date, "hombro", armFocus, [...shoulders, ...arms]);
}

function pierna(week: number, date: string, id: string): Workout {
  return workout(id, date, "pierna", null, [
    {
      exercise: "Sentadilla libre",
      weightKg: w(week, 60, 75),
      reps: [6, 6, 5],
    },
    {
      exercise: "Peso muerto rumano",
      weightKg: w(week, 50, 65),
      reps: [8, 8, 7],
    },
    { exercise: "Extensión de espalda", weightKg: 0, reps: [12, 12, 12] },
    {
      exercise: "Extensión de cuádriceps",
      weightKg: w(week, 40, 55),
      reps: [12, 12, 10],
    },
    {
      exercise: "Prensa de pierna",
      weightKg: w(week, 100, 140),
      reps: [10, 10, 8],
    },
    {
      exercise: "Extensión de gemelos",
      weightKg: w(week, 40, 55),
      reps: [15, 15, 12],
    },
    {
      exercise: "Aducción de cadera",
      weightKg: w(week, 35, 45),
      reps: [12, 12, 12],
    },
  ]);
}

/** 4 semanas × 4 días, terminando antes del entreno real del 10-ago. */
export function getDemoWorkouts(): Workout[] {
  if (!isDemoSeedEnabled()) return [];

  const plan: Array<{
    date: string;
    week: number;
    build: (week: number, date: string, id: string) => Workout;
  }> = [
    { date: "2026-07-14", week: 0, build: pecho },
    { date: "2026-07-16", week: 0, build: espalda },
    {
      date: "2026-07-18",
      week: 0,
      build: (wk, d, id) => hombro(wk, d, id, "biceps"),
    },
    { date: "2026-07-20", week: 0, build: pierna },
    { date: "2026-07-21", week: 1, build: pecho },
    { date: "2026-07-23", week: 1, build: espalda },
    {
      date: "2026-07-25",
      week: 1,
      build: (wk, d, id) => hombro(wk, d, id, "triceps"),
    },
    { date: "2026-07-27", week: 1, build: pierna },
    { date: "2026-07-28", week: 2, build: pecho },
    { date: "2026-07-30", week: 2, build: espalda },
    {
      date: "2026-08-01",
      week: 2,
      build: (wk, d, id) => hombro(wk, d, id, "biceps"),
    },
    { date: "2026-08-03", week: 2, build: pierna },
    { date: "2026-08-04", week: 3, build: pecho },
    { date: "2026-08-06", week: 3, build: espalda },
    {
      date: "2026-08-08",
      week: 3,
      build: (wk, d, id) => hombro(wk, d, id, "triceps"),
    },
    { date: "2026-08-09", week: 3, build: pierna },
  ];

  return plan.map((item, index) =>
    item.build(item.week, item.date, `demo-w${String(index + 1).padStart(2, "0")}`),
  );
}

export function getDemoBodyWeight(): BodyWeightEntry[] {
  if (!isDemoSeedEnabled()) return [];

  const points: Array<[string, number]> = [
    ["2026-07-14", 74.1],
    ["2026-07-18", 73.9],
    ["2026-07-21", 74.0],
    ["2026-07-25", 73.7],
    ["2026-07-28", 73.6],
    ["2026-08-01", 73.5],
    ["2026-08-04", 73.4],
    ["2026-08-08", 73.3],
  ];

  return points.map(([date, weightKg], i) => ({
    id: `demo-bw${String(i + 1).padStart(2, "0")}`,
    date,
    weightKg,
  }));
}

export function getDemoWorkoutById(id: string): Workout | null {
  if (!id.startsWith("demo-")) return null;
  return getDemoWorkouts().find((w) => w.id === id) ?? null;
}

export function mergeWithDemoWorkouts(real: Workout[], limit = 50): Workout[] {
  const demo = getDemoWorkouts();
  if (demo.length === 0) return real.slice(0, limit);
  const realIds = new Set(real.map((w) => w.id));
  const realDates = new Set(real.map((w) => w.date));
  const extra = demo.filter((w) => !realIds.has(w.id) && !realDates.has(w.date));
  return [...real, ...extra]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
}

export function mergeWithDemoBodyWeight(
  real: BodyWeightEntry[],
  limit = 90,
): BodyWeightEntry[] {
  const demo = getDemoBodyWeight();
  if (demo.length === 0) return real.slice(0, limit);
  const realIds = new Set(real.map((b) => b.id));
  const realDates = new Set(real.map((b) => b.date));
  const extra = demo.filter((b) => !realIds.has(b.id) && !realDates.has(b.date));
  return [...real, ...extra]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
}
