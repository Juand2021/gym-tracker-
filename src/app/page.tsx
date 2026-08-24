"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DAY_OPTIONS, getDayLabel } from "@/lib/routines";
import { MuscleGroupIcon } from "@/components/MuscleGroupIcon";
import type { BodyWeightEntry, Workout } from "@/lib/types";
import { useWorkoutDraft } from "@/lib/workout-draft";

export default function HomePage() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [weights, setWeights] = useState<BodyWeightEntry[]>([]);
  const draft = useWorkoutDraft();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
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
        if (!active) return;
        if (!wRes.ok) throw new Error(wData.error || "Error al cargar entrenos");
        if (!bRes.ok) throw new Error(bData.error || "Error al cargar peso");
        setWorkouts(wData.workouts ?? []);
        setWeights(bData.entries ?? []);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Error");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  const lastWorkout = workouts[0];
  const lastWeight = weights[0];
  const uniqueExercises = new Set(
    workouts.flatMap((w) => w.sets.map((s) => s.exercise)),
  ).size;

  return (
    <div className="space-y-6">
      <section>
        <p className="page-kicker">Hoy</p>
        <h1 className="page-title mt-1">
          A entrenar
          <span className="text-[var(--accent)]">.</span>
        </h1>
        <p className="mt-3 max-w-sm text-[var(--muted)]">
          Elige el día, mete peso × reps entre series y sigue.
        </p>
      </section>

      {draft && (draft.dayType || (draft.sets && draft.sets.length > 0)) ? (
        <Link
          href="/entreno"
          className="card card-interactive block border-emerald-500/40 bg-emerald-950/20 p-4"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
              </span>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-400">
                Entreno en curso
              </p>
            </div>
            <span className="text-xs font-semibold text-emerald-400">
              Continuar →
            </span>
          </div>
          <p className="mt-2 font-[family-name:var(--font-display)] text-2xl tracking-[0.03em]">
            {draft.dayType ? getDayLabel(draft.dayType) : "Sesión"}
            {draft.armFocus
              ? ` · ${draft.armFocus === "biceps" ? "Bíceps" : "Tríceps"}`
              : ""}
          </p>
          <p className="mt-0.5 text-xs text-[var(--muted)]">
            {draft.sets?.length ?? 0} series registradas en tu borrador
          </p>
        </Link>
      ) : null}

      <section className="grid grid-cols-2 gap-2.5">
        {DAY_OPTIONS.map((day) => (
          <Link
            key={day.id}
            href={`/entreno?day=${day.id}`}
            className="card card-interactive group relative flex min-h-[6.25rem] sm:min-h-[6.5rem] items-center justify-between p-3.5 sm:p-4 overflow-hidden transition-all hover:border-[var(--accent)] active:scale-[0.99] rounded-2xl"
          >
            <div className="min-w-0 pr-1.5 z-10">
              <p className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl tracking-[0.04em] text-white leading-none">
                {day.label}
              </p>
              <p className="mt-1 text-xs text-[var(--muted)] truncate">{day.subtitle}</p>
            </div>
            <MuscleGroupIcon
              group={day.id}
              className="h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
            />
          </Link>
        ))}
      </section>

      {loading ? <p className="text-[var(--muted)]">Cargando resumen…</p> : null}
      {error ? (
        <div className="card border-[var(--danger)] p-4 text-sm text-[var(--danger)]">
          {error}
        </div>
      ) : null}

      {!loading && !error ? (
        <section className="grid grid-cols-2 gap-2.5">
          <div className="card p-4">
            <p className="label">Sesiones</p>
            <p className="stat-value">{workouts.length}</p>
          </div>
          <div className="card p-4">
            <p className="label">Ejercicios</p>
            <p className="stat-value">{uniqueExercises}</p>
          </div>
          <div className="card col-span-2 p-4">
            <p className="label">Último entreno</p>
            {lastWorkout ? (
              <>
                <p className="font-[family-name:var(--font-display)] text-2xl tracking-[0.03em]">
                  {lastWorkout.date}
                  {lastWorkout.dayType
                    ? ` · ${getDayLabel(lastWorkout.dayType)}`
                    : ""}
                </p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {lastWorkout.sets.length} series ·{" "}
                  {[...new Set(lastWorkout.sets.map((s) => s.exercise))]
                    .slice(0, 3)
                    .join(", ")}
                </p>
              </>
            ) : (
              <p className="text-[var(--muted)]">Aún no hay sesiones.</p>
            )}
          </div>
          <div className="card col-span-2 p-4">
            <p className="label">Último peso corporal</p>
            {lastWeight ? (
              <p className="font-[family-name:var(--font-display)] text-2xl tracking-[0.03em]">
                {lastWeight.weightKg} kg{" "}
                <span className="text-base font-normal tracking-normal text-[var(--muted)]">
                  ({lastWeight.date})
                </span>
              </p>
            ) : (
              <p className="text-[var(--muted)]">Sin registros aún.</p>
            )}
          </div>
        </section>
      ) : null}

      <section className="grid gap-2.5">
        <Link href="/ia" className="card card-interactive block p-4">
          <p className="font-semibold uppercase tracking-wide">Análisis con IA</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Pregunta cómo va tu progreso y qué ajustar.
          </p>
        </Link>
        <Link href="/metricas" className="card card-interactive block p-4">
          <p className="font-semibold uppercase tracking-wide">Métricas</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Evolución de fuerza y peso corporal.
          </p>
        </Link>
      </section>
    </div>
  );
}
