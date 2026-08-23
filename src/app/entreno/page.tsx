"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
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
  orderNumber,
  totalExercises,
  lastHistory,
  onAdd,
  onRemove,
  onDelete,
  onMoveUp,
  onMoveDown,
  onPointerDownDrag,
  onPointerMoveDrag,
  onPointerUpDrag,
  isDragging,
  isDropTarget,
}: {
  exercise: string;
  sets: DraftSet[];
  orderNumber: number;
  totalExercises: number;
  lastHistory?: LastExerciseHistory;
  onAdd: (weightKg: string, reps: string) => void;
  onRemove: (key: string) => void;
  onDelete?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onPointerDownDrag?: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerMoveDrag?: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerUpDrag?: (e: React.PointerEvent<HTMLButtonElement>) => void;
  isDragging?: boolean;
  isDropTarget?: boolean;
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
    <div
      data-exercise-card
      className={`card space-y-3 p-4 transition-all duration-150 ${
        isDragging
          ? "border-2 border-dashed border-[var(--accent)]/50 bg-[var(--accent)]/5 opacity-40 scale-[0.98]"
          : isDropTarget
            ? "border-2 border-[var(--accent)] bg-[var(--accent)]/10 shadow-lg"
            : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2.5">
        {/* Controles de secuencia, arrastre táctil y flechas */}
        <div className="flex items-center gap-1.5 shrink-0 self-start mt-0.5">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--line)] bg-[#141414] text-[var(--muted)] hover:text-white active:bg-[var(--accent)]/20 active:text-[var(--accent)] cursor-grab active:cursor-grabbing touch-none select-none"
            title="Arrastra para reordenar"
            onPointerDown={onPointerDownDrag}
            onPointerMove={onPointerMoveDrag}
            onPointerUp={onPointerUpDrag}
            onPointerCancel={onPointerUpDrag}
          >
            <span className="text-sm font-mono tracking-tighter">⠿</span>
          </button>

          <div className="flex flex-col gap-0.5">
            <button
              type="button"
              disabled={orderNumber <= 1}
              onClick={onMoveUp}
              className="flex h-4 w-4 items-center justify-center rounded text-[9px] font-bold text-[var(--muted)] hover:text-white disabled:opacity-20 disabled:pointer-events-none active:scale-90 transition-all"
              title="Mover arriba"
              aria-label={`Mover ${exercise} arriba`}
            >
              ▲
            </button>
            <button
              type="button"
              disabled={orderNumber >= totalExercises}
              onClick={onMoveDown}
              className="flex h-4 w-4 items-center justify-center rounded text-[9px] font-bold text-[var(--muted)] hover:text-white disabled:opacity-20 disabled:pointer-events-none active:scale-90 transition-all"
              title="Mover abajo"
              aria-label={`Mover ${exercise} abajo`}
            >
              ▼
            </button>
          </div>

          <span className="inline-flex h-6 min-w-[1.6rem] items-center justify-center rounded-md bg-white/5 px-1 text-[11px] font-bold tabular-nums text-[var(--muted)] border border-white/10">
            #{orderNumber}
          </span>
        </div>

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

  const [exerciseOrder, setExerciseOrder] = useState<string[]>(() => {
    const draft = getWorkoutDraft();
    if (
      draft?.exerciseOrder &&
      draft.exerciseOrder.length > 0 &&
      (!initialDay || draft.dayType === initialDay || (draft.sets && draft.sets.length > 0))
    ) {
      return draft.exerciseOrder;
    }
    if (initialDay && isDayType(initialDay)) {
      return getExercisesForDay(initialDay);
    }
    return [];
  });

  const [customExercise, setCustomExercise] = useState("");
  const [catalogPickerOpen, setCatalogPickerOpen] = useState(false);
  const [pastWorkouts, setPastWorkouts] = useState<Workout[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Estados de arrastre táctil profesional (Pointer Drag & Drop con auto-scroll)
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [targetIndex, setTargetIndex] = useState<number | null>(null);
  const [dragCardRect, setDragCardRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const [dragCurrentY, setDragCurrentY] = useState<number>(0);
  const dragStartY = useRef<number>(0);
  const pointerOffsetInCard = useRef<number>(0);
  const autoScrollRaf = useRef<number | null>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);

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

  const templateExercises = useMemo(() => {
    if (!dayType) return [];
    if (dayType === "hombro" && !armFocus) return getExercisesForDay("hombro");
    return getExercisesForDay(dayType, armFocus);
  }, [dayType, armFocus]);

  // Lista unificada de ejercicios en su orden real
  const activeExercises = useMemo(() => {
    if (exerciseOrder.length === 0 && templateExercises.length > 0) {
      return [...templateExercises, ...extraExercises];
    }
    const allExpected = [...templateExercises, ...extraExercises];
    const missing = allExpected.filter((e) => !exerciseOrder.includes(e));
    if (missing.length > 0) {
      return [...exerciseOrder, ...missing];
    }
    return exerciseOrder;
  }, [exerciseOrder, templateExercises, extraExercises]);

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
        exerciseOrder: activeExercises,
        updatedAt: Date.now(),
      });
    } else {
      clearWorkoutDraft();
    }
  }, [step, dayType, armFocus, date, notes, sets, extraExercises, activeExercises]);

  // Auto-scroll loop mientras se arrastra cerca de los bordes de la pantalla
  const startAutoScroll = () => {
    if (autoScrollRaf.current !== null) return;
    const scrollStep = () => {
      if (dragStartY.current === 0) {
        autoScrollRaf.current = null;
        return;
      }
      const y = dragCurrentY;
      const topThreshold = 140;
      const bottomThreshold = window.innerHeight - 140;

      if (y > 0 && y < topThreshold) {
        const speed = Math.min(16, Math.max(3, (topThreshold - y) * 0.15));
        window.scrollBy({ top: -speed, behavior: "auto" });
      } else if (y > bottomThreshold && y < window.innerHeight) {
        const speed = Math.min(16, Math.max(3, (y - bottomThreshold) * 0.15));
        window.scrollBy({ top: speed, behavior: "auto" });
      }

      autoScrollRaf.current = requestAnimationFrame(scrollStep);
    };
    autoScrollRaf.current = requestAnimationFrame(scrollStep);
  };

  const stopAutoScroll = () => {
    if (autoScrollRaf.current !== null) {
      cancelAnimationFrame(autoScrollRaf.current);
      autoScrollRaf.current = null;
    }
  };

  function handlePointerDownDrag(e: React.PointerEvent<HTMLButtonElement>, index: number) {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    const btn = e.currentTarget;
    try {
      btn.setPointerCapture(e.pointerId);
    } catch {
      // Ignorar si no soporta
    }

    const card = btn.closest("[data-exercise-card]") as HTMLElement | null;
    if (card) {
      const rect = card.getBoundingClientRect();
      setDragCardRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
      pointerOffsetInCard.current = e.clientY - rect.top;
    }

    dragStartY.current = e.clientY;
    setDragCurrentY(e.clientY);
    setDraggingIndex(index);
    setTargetIndex(index);
    startAutoScroll();
  }

  function handlePointerMoveDrag(e: React.PointerEvent<HTMLButtonElement>) {
    if (draggingIndex === null || !cardsContainerRef.current) return;
    setDragCurrentY(e.clientY);

    const cards = Array.from(
      cardsContainerRef.current.querySelectorAll<HTMLElement>("[data-exercise-card]"),
    );

    let foundTarget = draggingIndex;
    for (let i = 0; i < cards.length; i++) {
      const rect = cards[i].getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      if (e.clientY <= midpoint) {
        foundTarget = i;
        break;
      }
      foundTarget = i;
    }

    if (foundTarget !== targetIndex) {
      setTargetIndex(foundTarget);
    }
  }

  function handlePointerUpDrag(e: React.PointerEvent<HTMLButtonElement>) {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignorar
    }
    stopAutoScroll();

    if (draggingIndex !== null && targetIndex !== null && draggingIndex !== targetIndex) {
      moveExercise(draggingIndex, targetIndex);
    }

    dragStartY.current = 0;
    setDraggingIndex(null);
    setTargetIndex(null);
    setDragCardRect(null);
  }

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
    const defaultTemplate = getExercisesForDay(day);
    setExerciseOrder(defaultTemplate);
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
    const defaultTemplate = getExercisesForDay("hombro", focus);
    setExerciseOrder(defaultTemplate);
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
    setExerciseOrder([]);
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

  function moveExercise(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
    setExerciseOrder((prev) => {
      const list = prev.length > 0 ? [...prev] : [...activeExercises];
      if (toIndex >= list.length) return prev;
      const [item] = list.splice(fromIndex, 1);
      list.splice(toIndex, 0, item);
      return list;
    });
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
    setExerciseOrder((prev) => prev.filter((e) => e !== name));
  }

  function addCustomExercise() {
    const name = customExercise.trim();
    if (!name) return;
    if (activeExercises.includes(name)) {
      setCustomExercise("");
      return;
    }
    setExtraExercises((prev) => [...prev, name]);
    setExerciseOrder((prev) => [...prev, name]);
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
      // Ordenar las series exactamente según el orden personalizado de activeExercises
      const ordered: DraftSet[] = [];
      for (const exercise of activeExercises) {
        ordered.push(...sets.filter((s) => s.exercise === exercise));
      }
      const leftovers = sets.filter((s) => !activeExercises.includes(s.exercise));
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
      <div className="space-y-6">
        <div>
          <p className="page-kicker">Nuevo entreno</p>
          <h1 className="page-title mt-1">¿Qué toca hoy?</h1>
          <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
            Elige tu rutina para cargar los ejercicios previstos.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {DAY_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => selectDay(opt.id)}
              className="card flex flex-col items-start p-5 text-left transition hover:border-[var(--accent)] active:scale-[0.99]"
            >
              <span className="font-semibold text-lg">{opt.label}</span>
              <span className="mt-1 text-xs text-[var(--muted)]">
                {opt.subtitle}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === "arms") {
    return (
      <div className="space-y-6">
        <div>
          <button
            type="button"
            onClick={handleBackStep}
            className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)] mb-2 inline-block"
          >
            ← Cambiar día
          </button>
          <p className="page-kicker">Hombro</p>
          <h1 className="page-title mt-1">Enfoque de brazo</h1>
          <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
            ¿Con qué complementas hombro hoy?
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => selectArms("biceps")}
            className="card flex flex-col items-start p-5 text-left transition hover:border-[var(--accent)] active:scale-[0.99]"
          >
            <span className="font-semibold text-lg">Bíceps</span>
            <span className="mt-1 text-xs text-[var(--muted)]">
              Curls y antebrazo
            </span>
          </button>

          <button
            type="button"
            onClick={() => selectArms("triceps")}
            className="card flex flex-col items-start p-5 text-left transition hover:border-[var(--accent)] active:scale-[0.99]"
          >
            <span className="font-semibold text-lg">Tríceps</span>
            <span className="mt-1 text-xs text-[var(--muted)]">
              Fondos y extensiones
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={handleBackStep}
            className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)] mb-2 inline-block"
          >
            ← Cambiar rutina
          </button>
          <p className="page-kicker">Registro</p>
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
            Toca + en cada ejercicio. Arrastra desde ⠿ para reordenar según cómo entrenes hoy.
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-[var(--muted)]">
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

        {/* Lista de ejercicios con reordenamiento dinámico y soporte táctil */}
        <div
          ref={cardsContainerRef}
          className="space-y-3 relative"
        >
          {activeExercises.map((exercise, index) => {
            const isExtra = extraExercises.includes(exercise);
            const isDragging = draggingIndex === index;
            const isDropTarget = targetIndex === index && draggingIndex !== index;

            return (
              <ExerciseBlock
                key={exercise}
                exercise={exercise}
                orderNumber={index + 1}
                totalExercises={activeExercises.length}
                sets={sets.filter((s) => s.exercise === exercise)}
                lastHistory={historyByExercise[exercise]}
                onAdd={(weightKg, reps) => addSet(exercise, weightKg, reps)}
                onRemove={removeSet}
                onDelete={isExtra ? () => removeExtraExercise(exercise) : undefined}
                onMoveUp={() => moveExercise(index, index - 1)}
                onMoveDown={() => moveExercise(index, index + 1)}
                onPointerDownDrag={(e) => handlePointerDownDrag(e, index)}
                onPointerMoveDrag={handlePointerMoveDrag}
                onPointerUpDrag={handlePointerUpDrag}
                isDragging={isDragging}
                isDropTarget={isDropTarget}
              />
            );
          })}

          {/* Tarjeta flotante visual que sigue el dedo en tiempo real */}
          {draggingIndex !== null && dragCardRect !== null ? (
            <div
              className="fixed pointer-events-none z-50 transition-none"
              style={{
                top: Math.max(10, Math.min(window.innerHeight - 90, dragCurrentY - pointerOffsetInCard.current)),
                left: dragCardRect.left,
                width: dragCardRect.width,
                transform: "scale(0.97)",
                opacity: 0.88,
              }}
            >
              <div className="card border-2 border-[var(--accent)] bg-[#181818] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.95)] ring-4 ring-[var(--accent)]/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-6 min-w-[2rem] px-1.5 items-center justify-center rounded bg-[var(--accent)] text-black font-bold text-xs">
                      #{(targetIndex ?? draggingIndex) + 1}
                    </span>
                    <p className="font-bold text-white text-base truncate max-w-[200px] sm:max-w-[280px]">
                      {activeExercises[draggingIndex]}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-[var(--muted)]">
                    {sets.filter((s) => s.exercise === activeExercises[draggingIndex]).length} series
                  </span>
                </div>
              </div>
            </div>
          ) : null}
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
          activeExercises={activeExercises}
          onSelect={(name) => {
            if (!activeExercises.includes(name)) {
              setExtraExercises((prev) => [...prev, name]);
              setExerciseOrder((prev) => [...prev, name]);
            }
          }}
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
