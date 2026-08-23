"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AnalyticsKpiCards } from "@/components/analytics/AnalyticsKpiCards";
import { IntensityScatterChart } from "@/components/analytics/IntensityScatterChart";
import { MuscleGroupVolumeChart } from "@/components/analytics/MuscleGroupVolumeChart";
import { StrengthProgressionChart } from "@/components/analytics/StrengthProgressionChart";
import { WeeklyVolumeChart } from "@/components/analytics/WeeklyVolumeChart";
import { CatalogExercisePicker } from "@/components/CatalogExercisePicker";
import {
  getExerciseMuscleGroup,
  WorkoutAnalyticsService,
  type TimeRange,
} from "@/lib/analytics";
import { getExerciseImage } from "@/lib/exercise-images";
import { getLoadHint } from "@/lib/exercises";
import { computeExercisePrs } from "@/lib/metrics";
import type { BodyWeightEntry, Workout } from "@/lib/types";

function fmt(n: number, digits = 1) {
  return Number.isInteger(n) ? String(n) : n.toFixed(digits);
}

export default function MetricasPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [weights, setWeights] = useState<BodyWeightEntry[]>([]);
  const [exercise, setExercise] = useState("");
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [filterHighReps, setFilterHighReps] = useState(true);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [wRes, bRes] = await Promise.all([
          fetch("/api/workouts"),
          fetch("/api/body-weight"),
        ]);
        const wData = (await wRes.json()) as {
          workouts?: Workout[];
          error?: string;
        };
        const bData = (await bRes.json()) as {
          entries?: BodyWeightEntry[];
          error?: string;
        };
        if (!wRes.ok) throw new Error(wData.error || "Error");
        if (!bRes.ok) throw new Error(bData.error || "Error");
        const list = wData.workouts ?? [];
        setWorkouts(list);
        setWeights(bData.entries ?? []);

        const preferred = [
          "Press banca",
          "Sentadilla libre",
          "Peso muerto rumano",
          "Press militar con mancuernas",
          "Dominadas",
        ];
        const names = new Set(
          list.flatMap((w) => w.sets.map((s) => s.exercise)),
        );
        const firstPreferred = preferred.find((name) => names.has(name));
        const firstAny = list
          .flatMap((w) => w.sets.map((s) => s.exercise))
          .find(Boolean);
        if (firstPreferred || firstAny) {
          setExercise(firstPreferred || firstAny || "");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const exerciseOptions = useMemo(() => {
    return [
      ...new Set(workouts.flatMap((w) => w.sets.map((s) => s.exercise))),
    ].sort();
  }, [workouts]);

  const analyticsOptions = useMemo(
    () => ({
      timeRange,
      maxRepsThreshold: filterHighReps ? 20 : 50,
      movingAverageWindow: 3,
    }),
    [timeRange, filterHighReps],
  );

  // 1. KPIs
  const kpiSummary = useMemo(() => {
    return WorkoutAnalyticsService.getKpiSummary(
      workouts,
      weights,
      exercise,
      analyticsOptions,
    );
  }, [workouts, weights, exercise, analyticsOptions]);

  // 2. Progresión 1RM + Media Móvil
  const strengthSeries = useMemo(() => {
    return WorkoutAnalyticsService.getSession1RMProgression(
      workouts,
      weights,
      exercise,
      analyticsOptions,
    );
  }, [workouts, weights, exercise, analyticsOptions]);

  // 3. Volumen Semanal por Ejercicio
  const weeklyVolumeSeries = useMemo(() => {
    return WorkoutAnalyticsService.getWeeklyVolumeSeries(
      workouts,
      weights,
      exercise,
      analyticsOptions,
    );
  }, [workouts, weights, exercise, analyticsOptions]);

  // 4. Dispersión Reps vs Peso (Scatter)
  const scatterSets = useMemo(() => {
    return WorkoutAnalyticsService.getScatterSets(
      workouts,
      weights,
      exercise,
      analyticsOptions,
    );
  }, [workouts, weights, exercise, analyticsOptions]);

  // 5. Distribución por Grupo Muscular (Global del rango)
  const muscleGroupVolume = useMemo(() => {
    return WorkoutAnalyticsService.getMuscleGroupVolumeBreakdown(
      workouts,
      weights,
      analyticsOptions,
    );
  }, [workouts, weights, analyticsOptions]);

  // 6. PRs Históricos de todos los ejercicios
  const prs = useMemo(
    () => computeExercisePrs(workouts, weights).slice(0, 8),
    [workouts, weights],
  );

  // 7. Peso corporal histórico
  const weightSeries = useMemo(() => {
    return [...weights]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((w) => ({ date: w.date, weightKg: w.weightKg }));
  }, [weights]);

  const loadHint = exercise ? getLoadHint(exercise) : null;
  const exerciseImage = exercise ? getExerciseImage(exercise) : null;
  const exerciseGroup = exercise ? getExerciseMuscleGroup(exercise) : null;

  const axisStyle = { fontSize: 11, fill: "#8b8b86" };
  const tooltipStyle = {
    background: "#141414",
    border: "1px solid #3a3a3a",
    borderRadius: 8,
    color: "#f3f3f1",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="page-kicker text-[var(--accent)] font-semibold tracking-wider">
            ANALYTICS & RENDIMIENTO
          </p>
          <h1 className="page-title mt-1">Métricas & Dashboard</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Evolución de 1RM, media móvil, volumen de carga y zonas de intensidad.
          </p>
        </div>
      </div>

      {/* Estados de carga y error */}
      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="card h-24 animate-pulse bg-white/5 p-4"
              />
            ))}
          </div>
          <div className="card h-72 animate-pulse bg-white/5 p-4" />
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 p-4 text-sm text-[var(--danger)]">
          {error}
        </div>
      ) : null}

      {!loading && !error ? (
        <>
          {/* Barra de Filtros y Selectores */}
          <section className="card space-y-4 p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {/* Selector de Ejercicio */}
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="exercise-select" className="label text-xs">
                    Ejercicio Seleccionado
                  </label>
                  {exerciseGroup ? (
                    <span className="rounded-full bg-[var(--accent)]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--accent)]">
                      {exerciseGroup}
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <select
                      id="exercise-select"
                      value={exercise}
                      onChange={(e) => setExercise(e.target.value)}
                      disabled={exerciseOptions.length === 0}
                      className="w-full rounded-xl border border-[var(--line-strong)] bg-[#111] px-3.5 py-2.5 text-sm font-semibold text-[var(--ink)] shadow-inner transition-colors focus:border-[var(--accent)] focus:outline-none"
                    >
                      {exerciseOptions.length === 0 ? (
                        <option value="">Sin datos de entrenamiento</option>
                      ) : (
                        exerciseOptions.map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsCatalogOpen(true)}
                    className="flex h-10 items-center justify-center rounded-xl border border-[var(--line)] bg-[#141414] px-3 text-xs font-semibold text-[var(--ink)] hover:border-[var(--accent)] transition-all"
                    title="Ver catálogo completo"
                  >
                    Catálogo
                  </button>
                </div>
              </div>

              {/* Selector de Rango Temporal */}
              <div className="space-y-1.5">
                <label className="label text-xs">Rango Temporal</label>
                <div className="flex items-center rounded-xl border border-[var(--line)] bg-[#0d0d0d] p-1 text-xs">
                  {(
                    [
                      { id: "1m", label: "1M" },
                      { id: "3m", label: "3M" },
                      { id: "6m", label: "6M" },
                      { id: "all", label: "Todo" },
                    ] as const
                  ).map((range) => (
                    <button
                      key={range.id}
                      type="button"
                      onClick={() => setTimeRange(range.id)}
                      className={`rounded-lg px-3 py-1.5 font-bold transition-all ${
                        timeRange === range.id
                          ? "bg-[var(--accent)] text-white shadow-md shadow-[var(--accent)]/20"
                          : "text-[var(--muted)] hover:text-white"
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Hint de Carga y Configuración de precisión */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-3 text-xs text-[var(--muted)]">
              {loadHint ? (
                <div>
                  <span className="font-semibold text-[var(--ink)]">
                    Modo de carga:
                  </span>{" "}
                  <span className="text-[var(--accent)]">{loadHint.short}</span>{" "}
                  — {loadHint.detail}
                  {loadHint.mode === "bodyweight"
                    ? " (se suma tu peso corporal al 1RM)."
                    : ""}
                </div>
              ) : (
                <div />
              )}

              <label className="flex items-center gap-2 cursor-pointer select-none text-[11px]">
                <input
                  type="checkbox"
                  checked={filterHighReps}
                  onChange={(e) => setFilterHighReps(e.target.checked)}
                  className="rounded border-[var(--line)] bg-[#111] accent-[var(--accent)]"
                />
                <span>Filtro de precisión 1RM (≤20 reps)</span>
              </label>
            </div>
          </section>

          {/* Imagen y Hero del Ejercicio (si aplica) */}
          {exerciseImage ? (
            <div className="relative mx-auto aspect-[21/9] w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--line)] bg-[#0c0c0c] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              <Image
                src={exerciseImage}
                alt={exercise}
                fill
                className="object-cover object-center"
                sizes="(max-width: 768px) 100vw, 512px"
                priority
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                    {exerciseGroup}
                  </p>
                  <h2 className="text-lg font-bold text-white drop-shadow">
                    {exercise}
                  </h2>
                </div>
                {kpiSummary.allTimeMax1rm ? (
                  <div className="rounded-lg bg-black/60 px-2.5 py-1 text-right backdrop-blur-md">
                    <p className="text-[10px] text-[var(--muted)] uppercase font-semibold">
                      PR Histórico
                    </p>
                    <p className="text-sm font-bold text-[var(--accent)]">
                      {kpiSummary.allTimeMax1rm} kg
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {/* Tarjetas de KPIs */}
          <AnalyticsKpiCards kpi={kpiSummary} exerciseName={exercise} />

          {/* Gráfica 1: Progresión de Fuerza y Media Móvil */}
          <StrengthProgressionChart
            data={strengthSeries}
            exerciseName={exercise}
          />

          {/* Gráfica 2: Volumen de Carga Semanal (Tonelaje) */}
          <WeeklyVolumeChart
            data={weeklyVolumeSeries}
            exerciseName={exercise}
          />

          {/* Gráfica 3: Dispersión Repeticiones vs. Peso (Scatter) */}
          <IntensityScatterChart data={scatterSets} exerciseName={exercise} />

          {/* Gráfica 4: Distribución por Grupo Muscular */}
          <MuscleGroupVolumeChart data={muscleGroupVolume} />

          {/* Récords Históricos (PRs) */}
          <section className="card space-y-3 p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold uppercase tracking-wide text-[var(--ink)]">
                  Mejores Marcas Históricas (PRs)
                </p>
                <p className="text-xs text-[var(--muted)]">
                  Top ejercicios con mayor 1RM estimado y evolución
                </p>
              </div>
            </div>

            {prs.length > 0 ? (
              <div className="space-y-2 divide-y divide-[var(--line)]">
                {prs.map((pr) => {
                  const thumb = getExerciseImage(pr.exercise);
                  const isSelected = pr.exercise === exercise;
                  return (
                    <div
                      key={pr.exercise}
                      onClick={() => setExercise(pr.exercise)}
                      className={`flex cursor-pointer items-center justify-between gap-3 pt-2.5 pb-2 transition-colors hover:bg-white/[0.02] ${
                        isSelected ? "bg-[var(--accent)]/5 rounded-lg px-2" : ""
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        {thumb ? (
                          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-[var(--line)] bg-[#111]">
                            <Image
                              src={thumb}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="44px"
                            />
                          </div>
                        ) : null}
                        <div className="min-w-0">
                          <p className="font-semibold text-sm leading-snug truncate text-[var(--ink)]">
                            {pr.exercise}
                          </p>
                          <p className="mt-0.5 text-xs text-[var(--muted)]">
                            {pr.bestWeight} kg × {pr.bestReps} · {pr.date}
                            {pr.relative != null
                              ? ` · ${fmt(pr.relative, 2)}×PC`
                              : ""}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-[family-name:var(--font-display)] text-xl tracking-tight text-[var(--ink)] tabular-nums">
                          {fmt(pr.best1rm)}
                          <span className="ml-0.5 text-xs font-normal text-[var(--muted)]">
                            kg
                          </span>
                        </p>
                        <p
                          className={`text-xs font-semibold tabular-nums ${
                            pr.deltaPct == null
                              ? "text-[var(--muted)]"
                              : pr.deltaPct >= 0
                                ? "text-[#10b981]"
                                : "text-[var(--danger)]"
                          }`}
                        >
                          {pr.deltaPct == null
                            ? "PR"
                            : `${pr.deltaPct > 0 ? "+" : ""}${fmt(pr.deltaPct)}%`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-[var(--muted)]">
                Cuando registres series con peso y repeticiones, aparecerán tus mejores marcas.
              </p>
            )}
          </section>

          {/* Gráfico de Peso Corporal */}
          <section className="card space-y-3 p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold uppercase tracking-wide text-[var(--ink)]">
                  Evolución de Peso Corporal
                </p>
                <p className="text-xs text-[var(--muted)]">
                  Seguimiento de peso en la báscula
                </p>
              </div>
            </div>
            {weightSeries.length > 0 ? (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weightSeries}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#222"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tick={axisStyle}
                      stroke="#333"
                      tickFormatter={(val: string) => val.slice(5)}
                    />
                    <YAxis
                      tick={axisStyle}
                      domain={["auto", "auto"]}
                      stroke="#333"
                      unit="kg"
                    />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line
                      type="monotone"
                      dataKey="weightKg"
                      name="Peso Corporal"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: "#10b981" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-[var(--muted)]">
                Aún no hay registros de peso corporal.
              </p>
            )}

            {/* Explicación y Guía de Interpretación */}
            <div className="rounded-xl border border-[var(--line)] bg-[#0a0a0a]/70 p-3.5 text-xs text-[var(--muted)] space-y-2.5">
              <div className="flex items-center gap-2 font-bold text-[var(--ink)]">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#10b981]" />
                <span className="uppercase tracking-wider text-[11px] text-[#10b981]">
                  Interpretación y análisis
                </span>
              </div>
              <div className="grid gap-3 text-[11px] leading-relaxed sm:grid-cols-3">
                <div className="rounded-lg bg-black/40 p-2.5 border border-white/5">
                  <p className="font-semibold text-[var(--ink)]">
                    ¿Qué está midiendo?
                  </p>
                  <p className="mt-1 text-[var(--muted)]">
                    La trayectoria y fluctuación de tu <strong className="text-[var(--ink)]">masa corporal</strong> a lo largo del tiempo.
                  </p>
                </div>
                <div className="rounded-lg bg-black/40 p-2.5 border border-white/5">
                  <p className="font-semibold text-[var(--ink)]">
                    ¿Cómo lo mide?
                  </p>
                  <p className="mt-1 text-[var(--muted)]">
                    Traza los valores registrados en la báscula y se cruza con tus marcas de entrenamiento para calcular tu <strong className="text-[var(--ink)]">fuerza relativa (1RM ÷ Peso)</strong>.
                  </p>
                </div>
                <div className="rounded-lg bg-black/40 p-2.5 border border-white/5">
                  <p className="font-semibold text-[var(--ink)]">
                    Impacto en tu entreno
                  </p>
                  <p className="mt-1 text-[var(--muted)]">
                    Si tu peso se mantiene o baja mientras tu 1RM sube, estás logrando una <strong className="text-[#10b981]">recomposición corporal óptima</strong> y aumentando tu ratio de fuerza por kg de peso.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </>
      ) : null}

      {/* Modal de Catálogo para explorar y seleccionar ejercicios */}
      <CatalogExercisePicker
        open={isCatalogOpen}
        activeExercises={[]}
        onSelect={(name) => {
          setExercise(name);
          setIsCatalogOpen(false);
        }}
        onClose={() => setIsCatalogOpen(false)}
      />
    </div>
  );
}
