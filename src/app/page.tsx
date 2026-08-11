"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DAY_OPTIONS, getDayLabel } from "@/lib/routines";
import type { BodyWeightEntry, Workout } from "@/lib/types";

export default function HomePage() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [weights, setWeights] = useState<BodyWeightEntry[]>([]);
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
        if (!wRes.ok) throw new Error(wData.error || "Error al cargar entrenos");
        if (!bRes.ok) throw new Error(bData.error || "Error al cargar peso");
        setWorkouts(wData.workouts ?? []);
        setWeights(bData.entries ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error");
      } finally {
        setLoading(false);
      }
    }
    void load();
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

      <section className="grid grid-cols-2 gap-2.5">
        {DAY_OPTIONS.map((day) => (
          <Link
            key={day.id}
            href={`/entreno?day=${day.id}`}
            className="card card-interactive flex min-h-[5.5rem] flex-col justify-center p-4"
          >
            <p className="font-[family-name:var(--font-display)] text-2xl tracking-[0.04em]">
              {day.label}
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">{day.subtitle}</p>
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
