"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getDayLabel } from "@/lib/routines";
import type { Workout } from "@/lib/types";

export default function HistorialPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/workouts");
        const data = (await res.json()) as {
          workouts?: Workout[];
          error?: string;
        };
        if (!res.ok) throw new Error(data.error || "Error");
        setWorkouts(data.workouts ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <p className="page-kicker">Registro</p>
        <h1 className="page-title mt-1">Historial</h1>
        <p className="mt-2 text-[var(--muted)]">Todas tus sesiones guardadas.</p>
      </div>

      {loading ? <p className="text-[var(--muted)]">Cargando…</p> : null}
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}

      <div className="space-y-2.5">
        {workouts.map((workout) => {
          const exercises = [...new Set(workout.sets.map((s) => s.exercise))];
          return (
            <Link
              key={workout.id}
              href={`/historial/${workout.id}`}
              className="card card-interactive block p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-[family-name:var(--font-display)] text-2xl tracking-[0.03em]">
                    {workout.date}
                  </p>
                  {workout.dayType ? (
                    <p className="mt-0.5 text-sm font-semibold uppercase tracking-wide text-[var(--accent)]">
                      {getDayLabel(workout.dayType)}
                      {workout.armFocus
                        ? ` · ${workout.armFocus === "biceps" ? "Bíceps" : "Tríceps"}`
                        : ""}
                    </p>
                  ) : null}
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {workout.sets.length} series · {exercises.slice(0, 4).join(", ")}
                    {exercises.length > 4 ? "…" : ""}
                  </p>
                  {workout.notes ? (
                    <p
                      className={`mt-2 text-sm ${
                        workout.notes === "demo"
                          ? "font-semibold uppercase tracking-wide text-[var(--muted)]"
                          : ""
                      }`}
                    >
                      {workout.notes === "demo" ? "Datos demo" : workout.notes}
                    </p>
                  ) : null}
                </div>
                <span className="pt-1 text-xs font-bold uppercase tracking-[0.12em] text-[var(--accent)]">
                  Ver
                </span>
              </div>
            </Link>
          );
        })}
        {!loading && !error && workouts.length === 0 ? (
          <p className="text-[var(--muted)]">Aún no hay entrenamientos.</p>
        ) : null}
      </div>
    </div>
  );
}
