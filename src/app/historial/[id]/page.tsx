"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { CatalogExercisePicker } from "@/components/CatalogExercisePicker";
import { getLoadHint } from "@/lib/exercises";
import {
  isValidReps,
  isValidWeight,
  parseDecimal,
} from "@/lib/numbers";
import { getDayLabel } from "@/lib/routines";
import type { Workout } from "@/lib/types";

type DraftSet = {
  key: string;
  exercise: string;
  weightKg: string;
  reps: string;
};

function toDraftSets(workout: Workout): DraftSet[] {
  return workout.sets.map((set, index) => ({
    key: set.id || `${set.exercise}-${index}`,
    exercise: set.exercise,
    weightKg: String(set.weightKg),
    reps: String(set.reps),
  }));
}

export default function WorkoutDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [draftSets, setDraftSets] = useState<DraftSet[]>([]);

  const isDemo = Boolean(workout?.id.startsWith("demo-"));

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/workouts/${params.id}`);
        const data = (await res.json()) as {
          workout?: Workout;
          error?: string;
        };
        if (!res.ok) throw new Error(data.error || "Error");
        const next = data.workout ?? null;
        setWorkout(next);
        if (next) {
          setDate(next.date);
          setNotes(next.notes);
          setDraftSets(toDraftSets(next));
        }
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

  const editGrouped = useMemo(() => {
    const order: string[] = [];
    const map = new Map<string, DraftSet[]>();
    for (const set of draftSets) {
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
  }, [draftSets]);

  function startEditing() {
    if (!workout || isDemo) return;
    setDate(workout.date);
    setNotes(workout.notes);
    setDraftSets(toDraftSets(workout));
    setError("");
    setEditing(true);
  }

  function cancelEditing() {
    if (!workout) return;
    setDate(workout.date);
    setNotes(workout.notes);
    setDraftSets(toDraftSets(workout));
    setError("");
    setEditing(false);
  }

  function updateSet(key: string, field: "weightKg" | "reps", value: string) {
    setDraftSets((prev) =>
      prev.map((set) => (set.key === key ? { ...set, [field]: value } : set)),
    );
  }

  function removeSet(key: string) {
    setDraftSets((prev) => prev.filter((set) => set.key !== key));
  }

  function addSetToExercise(exerciseName: string) {
    setDraftSets((prev) => {
      const matchingIndices: number[] = [];
      prev.forEach((s, idx) => {
        if (s.exercise === exerciseName) matchingIndices.push(idx);
      });

      const lastIdx =
        matchingIndices.length > 0
          ? matchingIndices[matchingIndices.length - 1]
          : -1;
      const lastSet = lastIdx >= 0 ? prev[lastIdx] : null;

      const newSet: DraftSet = {
        key: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        exercise: exerciseName,
        weightKg: lastSet ? lastSet.weightKg : "",
        reps: lastSet ? lastSet.reps : "",
      };

      if (lastIdx >= 0) {
        const next = [...prev];
        next.splice(lastIdx + 1, 0, newSet);
        return next;
      }

      return [...prev, newSet];
    });
  }

  function addExerciseFromCatalog(exerciseName: string) {
    const newSet: DraftSet = {
      key: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      exercise: exerciseName,
      weightKg: "",
      reps: "",
    };
    setDraftSets((prev) => [...prev, newSet]);
  }

  function removeExercise(exerciseName: string) {
    setDraftSets((prev) => prev.filter((set) => set.exercise !== exerciseName));
  }

  async function onSave(event: FormEvent) {
    event.preventDefault();
    if (!workout) return;
    if (draftSets.length === 0) {
      setError("Deja al menos una serie.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const byExerciseCount = new Map<string, number>();
      const sets = draftSets.map((set) => {
        const weightKg = parseDecimal(set.weightKg);
        const reps = parseDecimal(set.reps);
        if (!isValidWeight(weightKg) || !isValidReps(reps)) {
          throw new Error(
            `Serie inválida en ${set.exercise}. Usa decimales con punto o coma (ej. 4,5).`,
          );
        }
        const n = (byExerciseCount.get(set.exercise) ?? 0) + 1;
        byExerciseCount.set(set.exercise, n);
        return {
          exercise: set.exercise,
          weightKg,
          reps,
          setNumber: n,
        };
      });

      const res = await fetch(`/api/workouts/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          notes,
          dayType: workout.dayType ?? null,
          armFocus: workout.armFocus ?? null,
          sets,
        }),
      });
      const data = (await res.json()) as {
        workout?: Workout;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error || "No se pudo guardar");

      const next = data.workout!;
      setWorkout(next);
      setDate(next.date);
      setNotes(next.notes);
      setDraftSets(toDraftSets(next));
      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

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
        <h1 className="page-title mt-2">{editing ? "Editar sesión" : workout.date}</h1>
        {workout.dayType ? (
          <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-[var(--accent)]">
            {getDayLabel(workout.dayType)}
            {workout.armFocus
              ? ` · ${workout.armFocus === "biceps" ? "Bíceps" : "Tríceps"}`
              : ""}
          </p>
        ) : null}
        {!editing && workout.notes ? (
          <p className="mt-2 text-[var(--muted)]">{workout.notes}</p>
        ) : null}
      </div>

      {editing ? (
        <form onSubmit={onSave} className="space-y-4">
          <div className="card space-y-3 p-4">
            <div className="field-wrap">
              <label className="label" htmlFor="date">
                Fecha
              </label>
              <input
                id="date"
                type="date"
                className="field"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="field-wrap">
              <label className="label" htmlFor="notes">
                Notas
              </label>
              <input
                id="notes"
                className="field"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Energía, dolor, etc."
              />
            </div>
          </div>

          <div className="space-y-3">
            {editGrouped.map((group) => {
              const load = getLoadHint(group.exercise);
              return (
                <div key={group.exercise} className="card space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-lg font-semibold tracking-wide">
                        {group.exercise}
                      </p>
                      <p className="mt-0.5 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                        kg · <span className="text-[var(--accent)]">{load.short}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeExercise(group.exercise)}
                      className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--danger)] hover:underline active:opacity-75 py-1 px-1.5 transition-opacity"
                      title={`Quitar ${group.exercise}`}
                    >
                      Quitar ejercicio
                    </button>
                  </div>

                  <div className="space-y-2">
                    {group.sets.map((set) => (
                      <div
                        key={set.key}
                        className="grid grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-2"
                      >
                        <span
                          className="set-bullet pb-3 text-[var(--muted)]"
                          aria-hidden
                        >
                          ·
                        </span>
                        <div className="field-wrap">
                          <label className="label">kg</label>
                          <input
                            className="field text-center text-lg font-semibold tabular-nums"
                            inputMode="decimal"
                            value={set.weightKg}
                            onChange={(e) =>
                              updateSet(set.key, "weightKg", e.target.value)
                            }
                            required
                          />
                        </div>
                        <div className="field-wrap">
                          <label className="label">reps</label>
                          <input
                            className="field text-center text-lg font-semibold tabular-nums"
                            inputMode="decimal"
                            value={set.reps}
                            onChange={(e) =>
                              updateSet(set.key, "reps", e.target.value)
                            }
                            required
                          />
                        </div>
                        <button
                          type="button"
                          className="btn btn-ghost min-w-[3rem] shrink-0 px-0 text-[var(--danger)]"
                          onClick={() => removeSet(set.key)}
                          aria-label="Quitar serie"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="btn btn-ghost w-full min-h-[2.5rem] border border-dashed border-[var(--line)] text-xs font-bold uppercase tracking-[0.12em] text-[var(--accent)] hover:border-[var(--accent)] hover:bg-[var(--accent)]/10 active:scale-[0.99] transition-all"
                    onClick={() => addSetToExercise(group.exercise)}
                  >
                    + Añadir serie
                  </button>
                </div>
              );
            })}

            <button
              type="button"
              className="btn btn-ghost w-full min-h-[3rem] border border-dashed border-[var(--line-strong)] text-sm font-semibold tracking-wide text-[var(--ink)] hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              onClick={() => setCatalogOpen(true)}
            >
              <span className="text-base font-bold text-[var(--accent)]">+</span> Añadir ejercicio a la sesión
            </button>
          </div>

          {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={cancelEditing}
              disabled={saving}
            >
              Cancelar
            </button>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="space-y-2.5">
            {grouped.map((group) => {
              const load = getLoadHint(group.exercise);
              return (
                <div key={group.exercise} className="card p-4">
                  <p className="text-lg font-semibold tracking-wide">
                    {group.exercise}
                  </p>
                  <p className="mt-0.5 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                    kg · <span className="text-[var(--accent)]">{load.short}</span>
                    {" — "}
                    {load.detail}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {group.sets.map((set) => (
                      <span key={set.id} className="chip">
                        <span className="set-bullet" aria-hidden>
                          ·
                        </span>
                        {set.weightKg}×{set.reps}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}

          <div className="grid gap-2">
            {!isDemo ? (
              <button
                type="button"
                className="btn btn-primary w-full"
                onClick={startEditing}
              >
                Editar sesión
              </button>
            ) : (
              <p className="text-center text-sm text-[var(--muted)]">
                Las sesiones de demostración no se pueden editar.
              </p>
            )}
            <button
              type="button"
              className="btn btn-ghost w-full text-[var(--danger)]"
              onClick={onDelete}
              disabled={deleting || isDemo}
            >
              {deleting ? "Borrando…" : "Borrar sesión"}
            </button>
          </div>
        </>
      )}

      <CatalogExercisePicker
        open={catalogOpen}
        activeExercises={editGrouped.map((g) => g.exercise)}
        onSelect={addExerciseFromCatalog}
        onClose={() => setCatalogOpen(false)}
      />
    </div>
  );
}

