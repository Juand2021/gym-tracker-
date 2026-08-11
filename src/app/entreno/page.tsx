"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { getLoadHint, LOAD_CONVENTION_NOTE } from "@/lib/exercises";
import {
  DAY_OPTIONS,
  getDayLabel,
  getExercisesForDay,
  type ArmFocus,
  type DayType,
} from "@/lib/routines";

type DraftSet = {
  key: string;
  exercise: string;
  weightKg: string;
  reps: string;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function isDayType(value: string | null): value is DayType {
  return value === "pecho" || value === "espalda" || value === "hombro" || value === "pierna";
}

function ExerciseBlock({
  exercise,
  sets,
  onAdd,
  onRemove,
}: {
  exercise: string;
  sets: DraftSet[];
  onAdd: (weightKg: string, reps: string) => void;
  onRemove: (key: string) => void;
}) {
  const last = sets[sets.length - 1];
  const load = getLoadHint(exercise);
  const [weightKg, setWeightKg] = useState(last?.weightKg ?? "");
  const [reps, setReps] = useState(last?.reps ?? "");

  useEffect(() => {
    if (last) {
      setWeightKg(last.weightKg);
      setReps(last.reps);
    }
  }, [last?.weightKg, last?.reps, last]);

  function add() {
    if (!weightKg || !reps) return;
    onAdd(weightKg, reps);
  }

  return (
    <div className="card space-y-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold leading-snug tracking-wide">
            {exercise}
          </p>
          <p className="mt-0.5 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            {sets.length === 0
              ? "Sin series"
              : `${sets.length} serie${sets.length > 1 ? "s" : ""}`}
            {" · "}
            <span className="text-[var(--accent)]">{load.short}</span>
          </p>
        </div>
      </div>

      {sets.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {sets.map((set, index) => (
            <button
              key={set.key}
              type="button"
              onClick={() => onRemove(set.key)}
              className="chip min-h-10"
              title="Toca para quitar"
            >
              {index + 1}. {set.weightKg}×{set.reps}
            </button>
          ))}
        </div>
      ) : null}

      <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
        <div>
          <label className="label" title={load.detail}>
            kg · {load.short}
          </label>
          <input
            className="field text-center text-xl font-semibold tabular-nums"
            inputMode="decimal"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            aria-description={load.detail}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
          />
        </div>
        <div>
          <label className="label">reps</label>
          <input
            className="field text-center text-xl font-semibold tabular-nums"
            inputMode="numeric"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
          />
        </div>
        <button
          type="button"
          className="btn btn-primary min-w-[3.4rem] px-0 text-2xl"
          onClick={add}
          disabled={!weightKg || !reps}
          aria-label="Añadir serie"
        >
          +
        </button>
      </div>
    </div>
  );
}

function EntrenoForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialDay = searchParams.get("day");

  const [step, setStep] = useState<"day" | "arms" | "log">(
    isDayType(initialDay) ? (initialDay === "hombro" ? "arms" : "log") : "day",
  );
  const [dayType, setDayType] = useState<DayType | null>(
    isDayType(initialDay) ? initialDay : null,
  );
  const [armFocus, setArmFocus] = useState<ArmFocus | null>(null);
  const [date, setDate] = useState(todayIso);
  const [notes, setNotes] = useState("");
  const [sets, setSets] = useState<DraftSet[]>([]);
  const [extraExercises, setExtraExercises] = useState<string[]>([]);
  const [customExercise, setCustomExercise] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const templateExercises = useMemo(() => {
    if (!dayType) return [];
    if (dayType === "hombro" && !armFocus) return getExercisesForDay("hombro");
    return getExercisesForDay(dayType, armFocus);
  }, [dayType, armFocus]);

  const exercises = useMemo(
    () => [...templateExercises, ...extraExercises],
    [templateExercises, extraExercises],
  );

  function selectDay(day: DayType) {
    setDayType(day);
    setArmFocus(null);
    setSets([]);
    setExtraExercises([]);
    setError("");
    if (day === "hombro") {
      setStep("arms");
    } else {
      setStep("log");
    }
  }

  function selectArms(focus: ArmFocus) {
    setArmFocus(focus);
    setSets([]);
    setStep("log");
  }

  function addSet(exercise: string, weightKg: string, reps: string) {
    setError("");
    setSets((prev) => [
      ...prev,
      {
        key: `${Date.now()}-${prev.length}`,
        exercise,
        weightKg,
        reps,
      },
    ]);
  }

  function removeSet(key: string) {
    setSets((prev) => prev.filter((s) => s.key !== key));
  }

  function addCustomExercise() {
    const name = customExercise.trim();
    if (!name) return;
    if (exercises.includes(name)) {
      setCustomExercise("");
      return;
    }
    setExtraExercises((prev) => [...prev, name]);
    setCustomExercise("");
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!dayType) {
      setError("Elige un día de entreno.");
      return;
    }
    if (dayType === "hombro" && !armFocus) {
      setError("En día de hombro elige bíceps o tríceps.");
      return;
    }
    if (sets.length === 0) {
      setError("Añade al menos una serie.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const ordered: DraftSet[] = [];
      for (const exercise of exercises) {
        ordered.push(...sets.filter((s) => s.exercise === exercise));
      }
      const leftovers = sets.filter((s) => !exercises.includes(s.exercise));
      const finalSets = [...ordered, ...leftovers];

      const byExerciseCount = new Map<string, number>();
      const payloadSets = finalSets.map((set) => {
        const n = (byExerciseCount.get(set.exercise) ?? 0) + 1;
        byExerciseCount.set(set.exercise, n);
        return {
          exercise: set.exercise,
          weightKg: Number(set.weightKg),
          reps: Number(set.reps),
          setNumber: n,
        };
      });

      const res = await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          notes,
          dayType,
          armFocus,
          sets: payloadSets,
        }),
      });
      const data = (await res.json()) as { error?: string; workout?: { id: string } };
      if (!res.ok) throw new Error(data.error || "No se pudo guardar");
      router.push(`/historial/${data.workout?.id ?? ""}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  if (step === "day") {
    return (
      <div className="space-y-5">
        <div>
          <p className="page-kicker">Sesión</p>
          <h1 className="page-title mt-1">¿Qué día?</h1>
          <p className="mt-2 text-[var(--muted)]">
            Elige la rutina y solo mete peso × reps.
          </p>
        </div>
        <div className="grid gap-2.5">
          {DAY_OPTIONS.map((day) => (
            <button
              key={day.id}
              type="button"
              className="card card-interactive min-h-[5.25rem] p-5 text-left"
              onClick={() => selectDay(day.id)}
            >
              <p className="font-[family-name:var(--font-display)] text-3xl tracking-[0.04em]">
                {day.label}
              </p>
              <p className="mt-1 text-sm text-[var(--muted)]">{day.subtitle}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === "arms") {
    return (
      <div className="space-y-5">
        <button
          type="button"
          className="min-h-10 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--muted)]"
          onClick={() => setStep("day")}
        >
          ← Cambiar día
        </button>
        <div>
          <p className="page-kicker">Hombro</p>
          <h1 className="page-title mt-1">¿Brazos?</h1>
          <p className="mt-2 text-[var(--muted)]">
            Cierra con bíceps o con tríceps.
          </p>
        </div>
        <div className="grid gap-2.5">
          <button
            type="button"
            className="card card-interactive min-h-[5.25rem] p-5 text-left"
            onClick={() => selectArms("biceps")}
          >
            <p className="font-[family-name:var(--font-display)] text-3xl tracking-[0.04em]">
              Bíceps
            </p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Curl martillo, mancuernas, concentrado, barra Z
            </p>
          </button>
          <button
            type="button"
            className="card card-interactive min-h-[5.25rem] p-5 text-left"
            onClick={() => selectArms("triceps")}
          >
            <p className="font-[family-name:var(--font-display)] text-3xl tracking-[0.04em]">
              Tríceps
            </p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Press francés, cuerda, trasnuca, unilateral
            </p>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <button
            type="button"
            className="min-h-10 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--muted)]"
            onClick={() => {
              if (dayType === "hombro") setStep("arms");
              else setStep("day");
            }}
          >
            ← Cambiar
          </button>
          <h1 className="page-title mt-1">
            {dayType ? getDayLabel(dayType) : "Entreno"}
            {armFocus ? (
              <span className="text-[var(--accent)]">
                {" "}
                · {armFocus === "biceps" ? "Bíceps" : "Tríceps"}
              </span>
            ) : null}
          </h1>
          <p className="mt-2 text-[var(--muted)]">
            Toca + en cada ejercicio. Peso y reps se reutilizan.
          </p>
          <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
            {LOAD_CONVENTION_NOTE}
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="card grid grid-cols-2 gap-3 p-4">
          <div className="col-span-2 sm:col-span-1">
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
          <div className="col-span-2">
            <label className="label" htmlFor="notes">
              Notas (opcional)
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
          {exercises.map((exercise) => (
            <ExerciseBlock
              key={exercise}
              exercise={exercise}
              sets={sets.filter((s) => s.exercise === exercise)}
              onAdd={(weightKg, reps) => addSet(exercise, weightKg, reps)}
              onRemove={removeSet}
            />
          ))}
        </div>

        <div className="card space-y-3 p-4">
          <p className="font-semibold">Otro ejercicio</p>
          <div className="flex gap-2">
            <input
              className="field"
              value={customExercise}
              onChange={(e) => setCustomExercise(e.target.value)}
              placeholder="Nombre libre"
            />
            <button
              type="button"
              className="btn btn-ghost shrink-0"
              onClick={addCustomExercise}
            >
              Añadir
            </button>
          </div>
        </div>

        {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}

        <div className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-10 pt-2">
          <button
            className="btn btn-primary w-full"
            type="submit"
            disabled={saving}
          >
            {saving
              ? "Guardando…"
              : `Guardar (${sets.length} serie${sets.length === 1 ? "" : "s"})`}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function EntrenoPage() {
  return (
    <Suspense fallback={<p className="text-[var(--muted)]">Cargando…</p>}>
      <EntrenoForm />
    </Suspense>
  );
}
