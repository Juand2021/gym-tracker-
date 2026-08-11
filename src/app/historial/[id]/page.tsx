"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getLoadHint } from "@/lib/exercises";
import { getDayLabel } from "@/lib/routines";
import type { Workout } from "@/lib/types";

export default function WorkoutDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/workouts/${params.id}`);
        const data = (await res.json()) as {
          workout?: Workout;
          error?: string;
        };
        if (!res.ok) throw new Error(data.error || "Error");
        setWorkout(data.workout ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error");
      } finally {
        setLoading(false);
      }
    }
    if (params.id) void load();
  }, [params.id]);

  const grouped = useMemo(() => {
    if (!workout) return [];
    const order: string[] = [];
    const map = new Map<string, typeof workout.sets>();
    for (const set of workout.sets) {
      if (!map.has(set.exercise)) {
        map.set(set.exercise, []);
        order.push(set.exercise);
      }
      map.get(set.exercise)!.push(set);
    }
    return order.map((exercise) => ({
      exercise,
      sets: map.get(exercise)!,
    }));
  }, [workout]);

  async function onDelete() {
    if (!confirm("¿Borrar esta sesión?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/workouts/${params.id}`, { method: "DELETE" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "No se pudo borrar");
      router.push("/historial");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
      setDeleting(false);
    }
  }

  if (loading) return <p className="text-[var(--muted)]">Cargando…</p>;
  if (error && !workout) {
    return <p className="text-sm text-[var(--danger)]">{error}</p>;
  }
  if (!workout) return <p>No encontrado.</p>;

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/historial"
          className="inline-flex min-h-10 items-center text-sm font-semibold uppercase tracking-[0.12em] text-[var(--muted)]"
        >
          ← Historial
        </Link>
        <h1 className="page-title mt-2">{workout.date}</h1>
        {workout.dayType ? (
          <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-[var(--accent)]">
            {getDayLabel(workout.dayType)}
            {workout.armFocus
              ? ` · ${workout.armFocus === "biceps" ? "Bíceps" : "Tríceps"}`
              : ""}
          </p>
        ) : null}
        {workout.notes ? (
          <p className="mt-2 text-[var(--muted)]">{workout.notes}</p>
        ) : null}
      </div>

      <div className="space-y-2.5">
        {grouped.map((group) => {
          const load = getLoadHint(group.exercise);
          return (
            <div key={group.exercise} className="card p-4">
              <p className="text-lg font-semibold tracking-wide">{group.exercise}</p>
              <p className="mt-0.5 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                kg · <span className="text-[var(--accent)]">{load.short}</span>
                {" — "}
                {load.detail}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {group.sets.map((set) => (
                  <span key={set.id} className="chip">
                    {set.setNumber}. {set.weightKg} kg × {set.reps}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}

      <button
        type="button"
        className="btn btn-ghost w-full text-[var(--danger)]"
        onClick={onDelete}
        disabled={deleting}
      >
        {deleting ? "Borrando…" : "Borrar sesión"}
      </button>
    </div>
  );
}
