import assert from "node:assert/strict";
import test, { describe } from "node:test";
import {
  calculateEpley1RM,
  calculateMovingAverage,
  getExerciseMuscleGroup,
  getIntensityZone,
  WorkoutAnalyticsService,
} from "./analytics.ts";
import type { BodyWeightEntry, Workout } from "./types.ts";

describe("Analytics: calculateEpley1RM", () => {
  test("calcula 1RM exacto para 1 repetición", () => {
    assert.equal(calculateEpley1RM(100, 1), 100);
  });

  test("calcula 1RM con fórmula de Epley: Peso * (1 + Reps / 30)", () => {
    // 60 * (1 + 6/30) = 60 * 1.2 = 72
    assert.equal(calculateEpley1RM(60, 6), 72);
    // 100 * (1 + 10/30) = 133.33333333333334
    const res = calculateEpley1RM(100, 10);
    assert.ok(Math.abs(res - 133.333) < 0.01);
  });

  test("retorna 0 para valores inválidos (reps <= 0 o peso <= 0)", () => {
    assert.equal(calculateEpley1RM(0, 5), 0);
    assert.equal(calculateEpley1RM(-50, 5), 0);
    assert.equal(calculateEpley1RM(100, 0), 0);
    assert.equal(calculateEpley1RM(100, -2), 0);
  });

  test("retorna 0 si supera el umbral de repeticiones de precisión", () => {
    assert.equal(calculateEpley1RM(50, 25, 20), 0);
    assert.ok(calculateEpley1RM(50, 15, 20) > 0);
  });
});

describe("Analytics: calculateMovingAverage", () => {
  test("maneja arrays vacíos", () => {
    assert.deepEqual(calculateMovingAverage([]), []);
  });

  test("calcula media móvil simple con ventana creciente y completa", () => {
    const values = [100, 110, 120, 130];
    // i=0: avg([100]) = 100
    // i=1: avg([100, 110]) = 105
    // i=2: avg([100, 110, 120]) = 110
    // i=3: avg([110, 120, 130]) = 120
    const sma = calculateMovingAverage(values, 3);
    assert.deepEqual(sma, [100, 105, 110, 120]);
  });
});

describe("Analytics: getIntensityZone & MuscleGroups", () => {
  test("categoriza zonas de intensidad adecuadamente", () => {
    assert.equal(getIntensityZone(1), "fuerza");
    assert.equal(getIntensityZone(5), "fuerza");
    assert.equal(getIntensityZone(6), "hipertrofia");
    assert.equal(getIntensityZone(10), "hipertrofia");
    assert.equal(getIntensityZone(12), "hipertrofia");
    assert.equal(getIntensityZone(13), "resistencia");
    assert.equal(getIntensityZone(20), "resistencia");
  });

  test("asigna grupos musculares correctos", () => {
    assert.equal(getExerciseMuscleGroup("Press banca"), "Pecho");
    assert.equal(getExerciseMuscleGroup("Dominadas"), "Espalda");
    assert.equal(getExerciseMuscleGroup("Sentadilla libre"), "Pierna");
    assert.equal(getExerciseMuscleGroup("Press militar con mancuernas"), "Hombro");
    assert.equal(getExerciseMuscleGroup("Curl martillo"), "Bíceps");
    assert.equal(getExerciseMuscleGroup("Press francés con barra Z"), "Tríceps");
    assert.equal(getExerciseMuscleGroup("Dragon Fly en el piso"), "Abdomen y Core");
    assert.equal(getExerciseMuscleGroup("Crunch de polea alta"), "Abdomen y Core");
  });
});

describe("Analytics: WorkoutAnalyticsService", () => {
  const dummyWeights: BodyWeightEntry[] = [
    { id: "bw-1", date: "2026-03-01", weightKg: 80 },
    { id: "bw-2", date: "2026-03-15", weightKg: 80 },
  ];

  const dummyWorkouts: Workout[] = [
    {
      id: "w-1",
      date: "2026-03-01",
      notes: "Sesión 1",
      createdAt: "2026-03-01T10:00:00Z",
      sets: [
        { id: "s1", exercise: "Press banca", weightKg: 60, reps: 10, setNumber: 1 }, // 1RM = 60*(1+10/30) = 80
        { id: "s2", exercise: "Press banca", weightKg: 70, reps: 6, setNumber: 2 },  // 1RM = 70*(1+6/30) = 84 (Mejor)
        { id: "s3", exercise: "Press banca", weightKg: 65, reps: 8, setNumber: 3 },  // 1RM = 65*(1+8/30) = 82.3
        { id: "s4", exercise: "Pec deck", weightKg: 40, reps: 10, setNumber: 1 },
      ],
    },
    {
      id: "w-2",
      date: "2026-03-08",
      notes: "Sesión 2",
      createdAt: "2026-03-08T10:00:00Z",
      sets: [
        { id: "s5", exercise: "Press banca", weightKg: 75, reps: 6, setNumber: 1 }, // 1RM = 75*(1.2) = 90
        { id: "s6", exercise: "Press banca", weightKg: 75, reps: 5, setNumber: 2 }, // 1RM = 75*(1+5/30) = 87.5
      ],
    },
    {
      id: "w-3",
      date: "2026-03-15",
      notes: "Sesión 3",
      createdAt: "2026-03-15T10:00:00Z",
      sets: [
        { id: "s7", exercise: "Press banca", weightKg: 80, reps: 6, setNumber: 1 }, // 1RM = 80*(1.2) = 96
      ],
    },
  ];

  test("getSession1RMProgression extrae solo la mejor serie por sesión y calcula SMA", () => {
    const series = WorkoutAnalyticsService.getSession1RMProgression(
      dummyWorkouts,
      dummyWeights,
      "Press banca",
      { movingAverageWindow: 3 },
    );

    assert.equal(series.length, 3);
    assert.equal(series[0].date, "2026-03-01");
    assert.equal(series[0].est1rm, 84); // Mejor de la sesión 1
    assert.equal(series[0].weightKg, 70);
    assert.equal(series[0].reps, 6);
    assert.equal(series[0].totalSets, 3);
    assert.equal(series[0].movingAvg1rm, 84);

    assert.equal(series[1].est1rm, 90); // Sesión 2
    assert.equal(series[1].movingAvg1rm, 87); // (84 + 90) / 2 = 87

    assert.equal(series[2].est1rm, 96); // Sesión 3
    assert.equal(series[2].movingAvg1rm, 90); // (84 + 90 + 96) / 3 = 90
  });

  test("getWeeklyVolumeSeries agrupa el volumen por semana", () => {
    const weekly = WorkoutAnalyticsService.getWeeklyVolumeSeries(
      dummyWorkouts,
      dummyWeights,
      "Press banca",
    );

    assert.equal(weekly.length, 3);
    // Sesión 1: 60*10 + 70*6 + 65*8 = 600 + 420 + 520 = 1540 kg
    assert.equal(weekly[0].volumeKg, 1540);
    assert.equal(weekly[0].tonnage, 1.54);
    assert.equal(weekly[0].setsCount, 3);

    // Sesión 2: 75*6 + 75*5 = 450 + 375 = 825 kg
    assert.equal(weekly[1].volumeKg, 825);
    assert.ok(weekly[1].deltaPct !== null);
  });

  test("getScatterSets y getIntensityZoneSummary extraen y categorizan series", () => {
    const scatter = WorkoutAnalyticsService.getScatterSets(
      dummyWorkouts,
      dummyWeights,
      "Press banca",
    );

    // 3 en w1 + 2 en w2 + 1 en w3 = 6 series en total
    assert.equal(scatter.length, 6);

    const summary = WorkoutAnalyticsService.getIntensityZoneSummary(scatter);
    assert.equal(summary.totalSets, 6);
    // s1 (10 reps -> hipertrofia), s2 (6 reps -> hipertrofia), s3 (8 reps -> hipertrofia)
    // s5 (6 reps -> hipertrofia), s6 (5 reps -> fuerza), s7 (6 reps -> hipertrofia)
    // Total: 1 fuerza (5 reps), 5 hipertrofia (6, 8, 10 reps), 0 resistencia
    assert.equal(summary.fuerza.count, 1);
    assert.equal(summary.hipertrofia.count, 5);
    assert.equal(summary.resistencia.count, 0);
  });

  test("getKpiSummary calcula métricas clave y % de progresión", () => {
    const kpi = WorkoutAnalyticsService.getKpiSummary(
      dummyWorkouts,
      dummyWeights,
      "Press banca",
    );

    assert.equal(kpi.current1rm, 96);
    assert.equal(kpi.allTimeMax1rm, 96);
    assert.equal(kpi.allTimeMax1rmDate, "2026-03-15");
    assert.equal(kpi.totalSets, 6);
    assert.equal(kpi.totalSessions, 3);
    // Primera ventana: 84 kg. Última ventana: 96 kg.
    // Delta % = (96 - 84) / 84 * 100 = 14.28% -> 14.3%
    assert.equal(kpi.progressionPct, 14.3);
  });
});
