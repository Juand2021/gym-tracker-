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
import { getExerciseImage } from "@/lib/exercise-images";
import { getLoadHint } from "@/lib/exercises";
import {
  computeExercisePrs,
  daysAgoIso,
  nearestBodyWeight,
  setEstimated1rm,
  setVolumeKg,
  weekKey,
} from "@/lib/metrics";
import type { BodyWeightEntry, Workout } from "@/lib/types";

function fmt(n: number, digits = 1) {
  return Number.isInteger(n) ? String(n) : n.toFixed(digits);
}

export default function MetricasPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [weights, setWeights] = useState<BodyWeightEntry[]>([]);
  const [exercise, setExercise] = useState("");
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
        ];
        const names = new Set(
          list.flatMap((w) => w.sets.map((s) => s.exercise)),
        );
        const firstPreferred = preferred.find((name) => names.has(name));
        const firstAny = list.flatMap((w) => w.sets.map((s) => s.exercise)).find(
          Boolean,
        );
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
    return [...new Set(workouts.flatMap((w) => w.sets.map((s) => s.exercise)))].sort();
  }, [workouts]);

  const summary = useMemo(() => {
    const since30 = daysAgoIso(30);
    const recent = workouts.filter((w) => w.date >= since30);
    let volume30 = 0;
    for (const workout of recent) {
      const bw = nearestBodyWeight(workout.date, weights);
      for (const set of workout.sets) {
        volume30 += setVolumeKg(set, bw);
      }
    }
    const weeks = new Set(recent.map((w) => weekKey(w.date))).size || 1;
    const lastWeight = [...weights].sort((a, b) =>
      b.date.localeCompare(a.date),
    )[0];

    return {
      sessions30: recent.length,
      volume30: Math.round(volume30),
      perWeek: Math.round((recent.length / weeks) * 10) / 10,
      bodyWeight: lastWeight?.weightKg ?? null,
    };
  }, [workouts, weights]);

  const strengthSeries = useMemo(() => {
    if (!exercise) return [];
    return workouts
      .map((workout) => {
        const sets = workout.sets.filter((s) => s.exercise === exercise);
        if (sets.length === 0) return null;
        const bw = nearestBodyWeight(workout.date, weights);
        const bestWeight = Math.max(...sets.map((s) => s.weightKg));
        const bestEst = Math.max(...sets.map((s) => setEstimated1rm(s, bw)));
        const relative =
          bw && bw > 0 ? Math.round((bestEst / bw) * 100) / 100 : null;
        return {
          date: workout.date,
          bestWeight,
          est1rm: Math.round(bestEst * 10) / 10,
          relative,
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null)
      .reverse();
  }, [exercise, workouts, weights]);

  const exerciseDelta = useMemo(() => {
    if (strengthSeries.length < 2) return null;
    const first = strengthSeries[0];
    const last = strengthSeries[strengthSeries.length - 1];
    if (first.est1rm <= 0) return null;
    return {
      from: first.est1rm,
      to: last.est1rm,
      pct: Math.round(((last.est1rm - first.est1rm) / first.est1rm) * 1000) / 10,
      sessions: strengthSeries.length,
    };
  }, [strengthSeries]);

  const volumeSeries = useMemo(() => {
    const map = new Map<string, number>();
    for (const workout of workouts) {
      const key = weekKey(workout.date);
      const bw = nearestBodyWeight(workout.date, weights);
      let vol = map.get(key) ?? 0;
      for (const set of workout.sets) {
        vol += setVolumeKg(set, bw);
      }
      map.set(key, vol);
    }
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12)
      .map(([week, volume]) => ({
        week: week.slice(5),
        volume: Math.round(volume),
      }));
  }, [workouts, weights]);

  const weightSeries = useMemo(() => {
    return [...weights]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((w) => ({ date: w.date, weightKg: w.weightKg }));
  }, [weights]);

  const prs = useMemo(
    () => computeExercisePrs(workouts, weights).slice(0, 8),
    [workouts, weights],
  );

  const load = exercise ? getLoadHint(exercise) : null;
  const exerciseImage = exercise ? getExerciseImage(exercise) : null;
  const hasRelative = strengthSeries.some((p) => p.relative != null);

  const axisStyle = { fontSize: 11, fill: "#8b8b86" };
  const tooltipStyle = {
    background: "#141414",
    border: "1px solid #3a3a3a",
    borderRadius: 8,
    color: "#f3f3f1",
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="page-kicker">Progreso</p>
        <h1 className="page-title mt-1">Métricas</h1>
        <p className="mt-2 text-[var(--muted)]">
          Fuerza, volumen y relación con tu peso corporal.
        </p>
      </div>

      {loading ? <p className="text-[var(--muted)]">Cargando…</p> : null}
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}

      {!loading && !error ? (
        <section className="grid grid-cols-2 gap-2.5">
          <div className="card p-4">
            <p className="label">Sesiones / 30d</p>
            <p className="stat-value">{summary.sessions30}</p>
          </div>
          <div className="card p-4">
            <p className="label">Freq. semanal</p>
            <p className="stat-value">{fmt(summary.perWeek)}</p>
          </div>
          <div className="card p-4">
            <p className="label">Volumen / 30d</p>
            <p className="stat-value text-[1.7rem]">
              {summary.volume30 > 999
                ? `${fmt(summary.volume30 / 1000)}t`
                : summary.volume30}
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">tonelaje estimado</p>
          </div>
          <div className="card p-4">
            <p className="label">Peso corporal</p>
            <p className="stat-value">
              {summary.bodyWeight != null ? fmt(summary.bodyWeight) : "—"}
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">kg</p>
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        {exerciseImage ? (
          <div className="relative mx-auto aspect-square w-full max-w-[280px] overflow-hidden rounded-lg border border-[var(--line)] bg-[#0c0c0c] shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
            <Image
              src={exerciseImage}
              alt={exercise || "Ejercicio"}
              fill
              className="object-cover object-center"
              sizes="280px"
              priority
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent" />
          </div>
        ) : null}

        <div className="space-y-2 text-center">
          <p className="page-kicker">Ejercicio</p>
          <div className="relative mx-auto max-w-full">
            <label htmlFor="exercise" className="sr-only">
              Cambiar ejercicio
            </label>
            <select
              id="exercise"
              value={exercise}
              onChange={(e) => setExercise(e.target.value)}
              disabled={exerciseOptions.length === 0}
              className="exercise-title-select"
            >
              {exerciseOptions.length === 0 ? (
                <option value="">Sin datos</option>
              ) : (
                exerciseOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))
              )}
            </select>
            <span
              aria-hidden
              className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-[var(--accent)]"
            >
              ▾
            </span>
          </div>
          {load ? (
            <p className="text-xs text-[var(--muted)]">
              kg · <span className="text-[var(--accent)]">{load.short}</span>
              {" — "}
              {load.detail}
              {load.mode === "bodyweight"
                ? ". En el 1RM se suma tu peso corporal."
                : ""}
            </p>
          ) : null}
        </div>
      </section>

      <section className="card space-y-3 p-4">
        <p className="font-semibold uppercase tracking-wide">Fuerza en el tiempo</p>

        {exerciseDelta ? (
          <div className="grid grid-cols-3 gap-2 rounded-md border border-[var(--line)] bg-[#0a0a0a] p-3">
            <div>
              <p className="label">Inicio</p>
              <p className="text-lg font-semibold tabular-nums">
                {fmt(exerciseDelta.from)}
              </p>
            </div>
            <div>
              <p className="label">Ahora</p>
              <p className="text-lg font-semibold tabular-nums">
                {fmt(exerciseDelta.to)}
              </p>
            </div>
            <div>
              <p className="label">Cambio</p>
              <p
                className={`text-lg font-semibold tabular-nums ${
                  exerciseDelta.pct >= 0
                    ? "text-[var(--accent)]"
                    : "text-[var(--danger)]"
                }`}
              >
                {exerciseDelta.pct > 0 ? "+" : ""}
                {fmt(exerciseDelta.pct)}%
              </p>
            </div>
          </div>
        ) : null}

        {strengthSeries.length > 0 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={strengthSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="date" tick={axisStyle} stroke="#3a3a3a" />
                <YAxis tick={axisStyle} width={40} stroke="#3a3a3a" />
                <Tooltip contentStyle={tooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="bestWeight"
                  name="Mejor peso"
                  stroke="#ff4d1a"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#ff4d1a" }}
                />
                <Line
                  type="monotone"
                  dataKey="est1rm"
                  name="1RM est."
                  stroke="#c9c9c3"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: "#c9c9c3" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-[var(--muted)]">
            Registra series de un ejercicio para ver su evolución.
          </p>
        )}

        {hasRelative ? (
          <div className="space-y-2">
            <p className="font-semibold uppercase tracking-wide">
              Fuerza relativa
            </p>
            <p className="text-xs text-[var(--muted)]">
              1RM estimado ÷ peso corporal. Sube aunque el peso en barra se
              mantenga si bajas de peso.
            </p>
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={strengthSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                  <XAxis dataKey="date" tick={axisStyle} stroke="#3a3a3a" />
                  <YAxis
                    tick={axisStyle}
                    width={40}
                    domain={["auto", "auto"]}
                    stroke="#3a3a3a"
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line
                    type="monotone"
                    dataKey="relative"
                    name="× peso corporal"
                    stroke="#ff4d1a"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#ff4d1a" }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <p className="text-xs text-[var(--muted)]">
            Registra peso corporal para ver fuerza relativa (1RM ÷ kg).
          </p>
        )}
      </section>

      <section className="card space-y-3 p-4">
        <p className="font-semibold uppercase tracking-wide">Volumen semanal</p>
        <p className="text-xs text-[var(--muted)]">
          Suma de carga × reps (en dominadas/fondos usa peso corporal + lastre).
        </p>
        {volumeSeries.length > 0 ? (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={volumeSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="week" tick={axisStyle} stroke="#3a3a3a" />
                <YAxis tick={axisStyle} width={44} stroke="#3a3a3a" />
                <Tooltip contentStyle={tooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="volume"
                  name="kg·reps"
                  stroke="#ff4d1a"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#ff4d1a" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-[var(--muted)]">Sin volumen todavía.</p>
        )}
      </section>

      <section className="card space-y-3 p-4">
        <p className="font-semibold uppercase tracking-wide">Mejores marcas</p>
        <p className="text-xs text-[var(--muted)]">
          Mejor 1RM estimado por ejercicio y cambio vs marca anterior.
        </p>
        {prs.length > 0 ? (
          <div className="space-y-2">
            {prs.map((pr) => {
              const thumb = getExerciseImage(pr.exercise);
              return (
              <div
                key={pr.exercise}
                className="flex items-start justify-between gap-3 border-b border-[var(--line)] pb-2 last:border-0 last:pb-0"
              >
                <div className="flex min-w-0 items-start gap-2.5">
                  {thumb ? (
                    <div className="relative mt-0.5 h-11 w-11 shrink-0 overflow-hidden rounded border border-[var(--line)] bg-[#111]">
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
                    <p className="font-semibold leading-snug">{pr.exercise}</p>
                    <p className="mt-0.5 text-xs text-[var(--muted)]">
                      {pr.bestWeight} kg × {pr.bestReps} · {pr.date}
                      {pr.relative != null ? ` · ${fmt(pr.relative, 2)}×PC` : ""}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-[family-name:var(--font-display)] text-xl tracking-[0.03em] tabular-nums">
                    {fmt(pr.best1rm)}
                  </p>
                  <p
                    className={`text-xs font-semibold tabular-nums ${
                      pr.deltaPct == null
                        ? "text-[var(--muted)]"
                        : pr.deltaPct >= 0
                          ? "text-[var(--accent)]"
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
            Cuando tengas series, aquí salen tus marcas.
          </p>
        )}
      </section>

      <section className="card space-y-3 p-4">
        <p className="font-semibold uppercase tracking-wide">Peso corporal</p>
        {weightSeries.length > 0 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="date" tick={axisStyle} stroke="#3a3a3a" />
                <YAxis
                  tick={axisStyle}
                  width={40}
                  domain={["auto", "auto"]}
                  stroke="#3a3a3a"
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="weightKg"
                  name="kg"
                  stroke="#ff4d1a"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#ff4d1a" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-[var(--muted)]">
            Aún no hay registros de peso corporal.
          </p>
        )}
      </section>
    </div>
  );
}
