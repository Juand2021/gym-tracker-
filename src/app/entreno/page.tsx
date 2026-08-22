"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { BarbellPlatePicker } from "@/components/BarbellPlatePicker";
import { CatalogExercisePicker } from "@/components/CatalogExercisePicker";
import { DumbbellRackPicker } from "@/components/DumbbellRackPicker";
import { EzBarRackPicker } from "@/components/EzBarRackPicker";
import { MachineStackPicker } from "@/components/MachineStackPicker";
import { hasBarbellPlatePicker } from "@/lib/barbell-plates";
import { hasDumbbellRackPicker } from "@/lib/dumbbell-rack";
import { hasEzBarRackPicker } from "@/lib/ez-bar-rack";
import { getLoadHint, LOAD_CONVENTION_NOTE } from "@/lib/exercises";
import {
  formatStackKg,
  getMachineStack,
  hasMachineStackPicker,
} from "@/lib/machine-stacks";
import {
  getLastHistoryByExercise,
  type LastExerciseHistory,
} from "@/lib/metrics";
import {
  isValidReps,
  isValidWeight,
  parseDecimal,
} from "@/lib/numbers";
import {
  DAY_OPTIONS,
  getDayLabel,
  getExercisesForDay,
  type ArmFocus,
  type DayType,
} from "@/lib/routines";
import type { Workout } from "@/lib/types";
import {
  clearWorkoutDraft,
  getWorkoutDraft,
  saveWorkoutDraft,
  type DraftSet,
} from "@/lib/workout-draft";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function isDayType(value: string | null): value is DayType {
  return value === "pecho" || value === "espalda" || value === "hombro" || value === "pierna";
}

function ExerciseBlock({
  exercise,
  sets,
  lastHistory,
  onAdd,
  onRemove,
  onDelete,
}: {
  exercise: string;
  sets: DraftSet[];
  lastHistory?: LastExerciseHistory;
  onAdd: (weightKg: string, reps: string) => void;
  onRemove: (key: string) => void;
  onDelete?: () => void;
}) {
  const last = sets[sets.length - 1];
  const load = getLoadHint(exercise);
  const stackConfig = getMachineStack(exercise);
  const useStackPicker = hasMachineStackPicker(exercise);
  const useDumbbellPicker =
    !useStackPicker && hasDumbbellRackPicker(exercise);
  const useBarbellPicker =
    !useStackPicker && !useDumbbellPicker && hasBarbellPlatePicker(exercise);
  const useEzBarPicker =
    !useStackPicker &&
    !useDumbbellPicker &&
    !useBarbellPicker &&
    hasEzBarRackPicker(exercise);
  const useVisualPicker =
    useStackPicker || useDumbbellPicker || useBarbellPicker || useEzBarPicker;
  const [weightKg, setWeightKg] = useState(last?.weightKg ?? "");
  const [reps, setReps] = useState(last?.reps ?? "");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [manualKg, setManualKg] = useState(false);
  const lastKey = last?.key ?? "";
  const [syncedKey, setSyncedKey] = useState(lastKey);

  if (lastKey !== syncedKey) {
    setSyncedKey(lastKey);
    if (last) {
      setWeightKg(last.weightKg);
      setReps(last.reps);
    }
  }

  function add() {
    const w = parseDecimal(weightKg);
    const r = parseDecimal(reps);
    if (!isValidWeight(w) || !isValidReps(r)) return;
    onAdd(String(w), String(r));
  }

  const parsedWeight = parseDecimal(weightKg);
  const weightLabel =
    weightKg && isValidWeight(parsedWeight)
      ? formatStackKg(parsedWeight)
      : "Elegir";

  return (
    <div className="card space-y-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-lg font-semibold leading-snug tracking-wide">
            {exercise}
          </p>
          <p className="mt-0.5 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            {sets.length === 0
              ? "Sin series"
              : `${sets.length} serie${sets.length > 1 ? "s" : ""}`}
            {" · "}
            <span className="text-[var(--accent)]">{load.short}</span>
            {useStackPicker ? (
              <span className="text-[var(--muted)]"> · stack</span>
            ) : null}
            {useDumbbellPicker ? (
              <span className="text-[var(--muted)]"> · rack</span>
            ) : null}
            {useBarbellPicker ? (
              <span className="text-[var(--muted)]"> · barra</span>
            ) : null}
            {useEzBarPicker ? (
              <span className="text-[var(--muted)]"> · barra Z</span>
            ) : null}
          </p>
        </div>

        <div className="flex items-start gap-2 shrink-0">
          {lastHistory && lastHistory.sets.length > 0 ? (
            <button
              type="button"
              className="rounded-lg bg-[var(--surface-2)]/80 border border-[var(--glass-stroke)] px-2.5 py-1.5 text-right transition hover:border-[var(--accent)]/50 active:scale-95 text-left"
              title="Toca para usar este peso y repeticiones"
              onClick={() => {
                const targetSet =
                  lastHistory.sets[lastHistory.sets.length - 1];
                if (targetSet) {
                  setWeightKg(String(targetSet.weightKg));
                  setReps(String(targetSet.reps));
                }
              }}
            >
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-[var(--muted)]">
                Último registro{" "}
                <span className="text-[var(--ink)] font-medium">
                  ({lastHistory.shortDate})
                </span>
              </p>
              <p className="mt-0.5 text-xs font-semibold tabular-nums text-[var(--ink)] tracking-tight">
                {lastHistory.sets.map((s, idx) => (
                  <span key={idx}>
                    {idx > 0 ? " · " : ""}
                    <span className="font-bold text-[var(--accent)]">
                      {s.weightKg}
                    </span>
                    <span className="text-[0.7rem] text-[var(--muted)]">×</span>
                    {s.reps}
                  </span>
                ))}
              </p>
            </button>
          ) : (
            <div className="rounded-lg bg-[var(--surface-2)]/35 px-2.5 py-1 text-right">
              <p className="text-[0.62rem] font-medium uppercase tracking-[0.08em] text-[var(--muted)]/60">
                Sin historial
              </p>
            </div>
          )}

          {onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-sm text-[var(--muted)] transition hover:bg-[var(--surface-raised)] hover:text-[var(--danger)]"
              title="Quitar ejercicio de la sesión"
              aria-label={`Quitar ${exercise}`}
            >
              ✕
            </button>
          ) : null}
        </div>
      </div>

      {sets.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {sets.map((set) => (
            <button
              key={set.key}
              type="button"
              onClick={() => onRemove(set.key)}
              className="chip min-h-10"
              title="Toca para quitar"
            >
              <span className="set-bullet" aria-hidden>
                ·
              </span>
              {set.weightKg}×{set.reps}
            </button>
          ))}
        </div>
      ) : null}

      <div className="space-y-2">
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-2">
          <div className="field-wrap">
            <label className="label text-center" title={load.detail}>
              kg · {load.short}
            </label>
            {useVisualPicker && !manualKg ? (
              <button
                type="button"
                className="field stack-kg-trigger"
                onClick={() => setPickerOpen(true)}
                aria-label={
                  useDumbbellPicker
                    ? "Abrir selector de mancuernas"
                    : useBarbellPicker
                      ? "Abrir selector de barra olímpica"
                      : useEzBarPicker
                        ? "Abrir selector de barra Z"
                        : "Abrir selector de placas"
                }
              >
                {weightLabel}
              </button>
            ) : (
              <input
                className="field text-center text-xl font-semibold tabular-nums"
                inputMode="decimal"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                title={load.detail}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    add();
                  }
                }}
              />
            )}
          </div>
          <div className="field-wrap">
            <label className="label text-center">reps</label>
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
            className="btn btn-primary min-h-[var(--touch)] min-w-[3.4rem] shrink-0 self-end px-0 text-2xl"
            onClick={add}
            disabled={
              !isValidWeight(parseDecimal(weightKg)) ||
              !isValidReps(parseDecimal(reps))
            }
            aria-label="Añadir serie"
          >
            +
          </button>
        </div>
        {useVisualPicker ? (
          <div className="text-center">
            <button
              type="button"
              className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]"
              onClick={() => {
                setManualKg((v) => !v);
                setPickerOpen(false);
              }}
            >
              {manualKg
                ? useDumbbellPicker
                  ? "Usar mancuernas"
                  : useBarbellPicker
                    ? "Usar barra"
                    : useEzBarPicker
                      ? "Usar barra Z"
                      : "Usar placas"
                : "Escribir kg"}
            </button>
          </div>
        ) : null}
      </div>

      {stackConfig ? (
        <MachineStackPicker
          open={pickerOpen}
          config={stackConfig}
          valueKg={isValidWeight(parsedWeight) ? parsedWeight : null}
          onClose={() => setPickerOpen(false)}
          onConfirm={(kg) => {
            setWeightKg(formatStackKg(kg));
            setPickerOpen(false);
            setManualKg(false);
          }}
        />
      ) : null}

      {useDumbbellPicker ? (
        <DumbbellRackPicker
          open={pickerOpen}
          exercise={exercise}
          valueKg={isValidWeight(parsedWeight) ? parsedWeight : null}
          onClose={() => setPickerOpen(false)}
          onConfirm={(kg) => {
            setWeightKg(formatStackKg(kg));
            setPickerOpen(false);
            setManualKg(false);
          }}
        />
      ) : null}

      {useBarbellPicker ? (
        <BarbellPlatePicker
          open={pickerOpen}
          exercise={exercise}
          valueKg={isValidWeight(parsedWeight) ? parsedWeight : null}
          onClose={() => setPickerOpen(false)}
          onConfirm={(kg) => {
            setWeightKg(formatStackKg(kg));
            setPickerOpen(false);
            setManualKg(false);
          }}
        />
      ) : null}

      {useEzBarPicker ? (
        <EzBarRackPicker
          open={pickerOpen}
          exercise={exercise}
          valueKg={isValidWeight(parsedWeight) ? parsedWeight : null}
          onClose={() => setPickerOpen(false)}
          onConfirm={(kg) => {
            setWeightKg(formatStackKg(kg));
            setPickerOpen(false);
            setManualKg(false);
          }}
        />
      ) : null}
    </div>
  );
}

function EntrenoForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialDay = searchParams.get("day");

  const [step, setStep] = useState<"day" | "arms" | "log">(() => {
    const draft = getWorkoutDraft();
    if (draft?.step && (!initialDay || draft.dayType === initialDay || (draft.sets && draft.sets.length > 0))) {
      return draft.step;
    }
    return isDayType(initialDay) ? (initialDay === "hombro" ? "arms" : "log") : "day";
  });

  const [dayType, setDayType] = useState<DayType | null>(() => {
    const draft = getWorkoutDraft();
    if (draft?.dayType && (!initialDay || draft.dayType === initialDay || (draft.sets && draft.sets.length > 0))) {
      return draft.dayType;
    }
    return isDayType(initialDay) ? initialDay : null;
  });

  const [armFocus, setArmFocus] = useState<ArmFocus | null>(() => {
    const draft = getWorkoutDraft();
    if (draft && (!initialDay || draft.dayType === initialDay || (draft.sets && draft.sets.length > 0))) {
      return draft.armFocus ?? null;
    }
    return null;
  });

  const [date, setDate] = useState<string>(() => {
    const draft = getWorkoutDraft();
    if (draft?.date && (!initialDay || draft.dayType === initialDay || (draft.sets && draft.sets.length > 0))) {
      return draft.date;
    }
    return todayIso();
  });

  const [notes, setNotes] = useState<string>(() => {
    const draft = getWorkoutDraft();
    if (draft?.notes && (!initialDay || draft.dayType === initialDay || (draft.sets && draft.sets.length > 0))) {
      return draft.notes;
    }
    return "";
  });

  const [sets, setSets] = useState<DraftSet[]>(() => {
    const draft = getWorkoutDraft();
    if (draft?.sets && (!initialDay || draft.dayType === initialDay || draft.sets.length > 0)) {
      return draft.sets;
    }
    return [];
  });

  const [extraExercises, setExtraExercises] = useState<string[]>(() => {
    const draft = getWorkoutDraft();
    if (draft?.extraExercises && (!initialDay || draft.dayType === initialDay || (draft.sets && draft.sets.length > 0))) {
      return draft.extraExercises;
    }
    return [];
  });

  const [customExercise, setCustomExercise] = useState("");
  const [catalogPickerOpen, setCatalogPickerOpen] = useState(false);
  const [pastWorkouts, setPastWorkouts] = useState<Workout[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Cargar entrenamientos históricos para consultar sesiones anteriores de cada ejercicio
  useEffect(() => {
    let active = true;
    async function loadPastWorkouts() {
      try {
        const res = await fetch("/api/workouts");
        if (!res.ok) return;
        const data = (await res.json()) as { workouts?: Workout[] };
        if (active && Array.isArray(data.workouts)) {
          setPastWorkouts(data.workouts);
        }
      } catch {
        // Ignorar silenciosamente
      }
    }
    void loadPastWorkouts();
    return () => {
      active = false;
    };
  }, []);

  const historyByExercise = useMemo(
    () => getLastHistoryByExercise(pastWorkouts),
    [pastWorkouts],
  );

  // Auto-guardar cualquier cambio en localStorage
  useEffect(() => {
    if (dayType || sets.length > 0 || notes.trim()) {
      saveWorkoutDraft({
        step,
        dayType,
        armFocus,
        date,
        notes,
        sets,
        extraExercises,
        updatedAt: Date.now(),
      });
    } else {
      clearWorkoutDraft();
    }
  }, [step, dayType, armFocus, date, notes, sets, extraExercises]);

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
    if (dayType && dayType !== day && sets.length > 0) {
      const confirmChange = window.confirm(
        `Tienes ${sets.length} serie${sets.length > 1 ? "s" : ""} en curso de ${getDayLabel(dayType)}. ¿Iniciar ${getDayLabel(day)} y reiniciar las series actuales?`,
      );
      if (!confirmChange) return;
    }
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
    if (armFocus && armFocus !== focus && sets.length > 0) {
      const confirmChange = window.confirm(
        `Tienes ${sets.length} serie${sets.length > 1 ? "s" : ""} en curso. ¿Deseas cambiar a ${focus === "biceps" ? "Bíceps" : "Tríceps"} y reiniciar las series?`,
      );
      if (!confirmChange) return;
    }
    setArmFocus(focus);
    setSets([]);
    setStep("log");
  }

  function handleDiscard() {
    if (sets.length > 0 || notes.trim()) {
      const confirmDiscard = window.confirm(
        "¿Descartar este entrenamiento y borrar las series en curso?",
      );
      if (!confirmDiscard) return;
    }
    clearWorkoutDraft();
    setStep("day");
    setDayType(null);
    setArmFocus(null);
    setSets([]);
    setExtraExercises([]);
    setNotes("");
    setError("");
    router.replace("/entreno");
  }

  function handleBackStep() {
    if (dayType === "hombro" && step === "log") {
      setStep("arms");
    } else {
      setStep("day");
    }
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

  function removeExtraExercise(name: string) {
    const exerciseSets = sets.filter((s) => s.exercise === name);
    if (exerciseSets.length > 0) {
      const confirmRemove = window.confirm(
        `¿Quitar "${name}" y borrar sus ${exerciseSets.length} serie${exerciseSets.length > 1 ? "s" : ""}?`,
      );
      if (!confirmRemove) return;
      setSets((prev) => prev.filter((s) => s.exercise !== name));
    }
    setExtraExercises((prev) => prev.filter((e) => e !== name));
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

      // Limpiar el borrador local tras guardar exitosamente
      clearWorkoutDraft();

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
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="min-h-10 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--muted)]"
              onClick={handleBackStep}
            >
              ← Cambiar
            </button>
            {sets.length > 0 ? (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium tracking-wide">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Guardado en el celular
              </span>
            ) : null}
          </div>
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

        {sets.length > 0 || dayType ? (
          <button
            type="button"
            onClick={handleDiscard}
            className="min-h-10 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--danger)] shrink-0"
            title="Descartar borrador"
          >
            Descartar
          </button>
        ) : null}
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
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
          {exercises.map((exercise) => {
            const isExtra = extraExercises.includes(exercise);
            return (
              <ExerciseBlock
                key={exercise}
                exercise={exercise}
                sets={sets.filter((s) => s.exercise === exercise)}
                lastHistory={historyByExercise[exercise]}
                onAdd={(weightKg, reps) => addSet(exercise, weightKg, reps)}
                onRemove={removeSet}
                onDelete={isExtra ? () => removeExtraExercise(exercise) : undefined}
              />
            );
          })}
        </div>

        <div className="card space-y-3 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-base">Añadir del catálogo</p>
              <p className="mt-0.5 text-xs text-[var(--muted)]">
                Abdominales, brazos, pierna u otro ejercicio
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCatalogPickerOpen(true)}
              className="btn btn-primary shrink-0 min-h-[2.6rem] px-4 text-xs font-bold tracking-[0.08em]"
            >
              + Catálogo
            </button>
          </div>
        </div>

        <CatalogExercisePicker
          open={catalogPickerOpen}
          activeExercises={exercises}
          onSelect={(name) => setExtraExercises((prev) => [...prev, name])}
          onClose={() => setCatalogPickerOpen(false)}
        />

        <div className="card space-y-3 p-4">
          <p className="font-semibold">Otro ejercicio</p>
          <div className="flex min-w-0 gap-2">
            <div className="field-wrap min-w-0 flex-1">
              <input
                className="field"
                value={customExercise}
                onChange={(e) => setCustomExercise(e.target.value)}
                placeholder="Nombre libre"
              />
            </div>
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

        <div className="sticky-save">
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
