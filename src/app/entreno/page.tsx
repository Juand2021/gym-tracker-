"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { BarbellPlatePicker } from "@/components/BarbellPlatePicker";
import { CatalogExercisePicker } from "@/components/CatalogExercisePicker";
import { DumbbellRackPicker } from "@/components/DumbbellRackPicker";
import { EzBarRackPicker } from "@/components/EzBarRackPicker";
import { MachineStackPicker } from "@/components/MachineStackPicker";
import {
  hasBarbellPlatePicker,
  isPlateMachineExercise,
} from "@/lib/barbell-plates";
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
import { getExercisesForDayCustom } from "@/lib/custom-routines";
import { RoutineCustomizer } from "@/components/RoutineCustomizer";
import { MuscleGroupIcon } from "@/components/MuscleGroupIcon";
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
  lastHistory,
  onAdd,
  onRemove,
  onDelete,
  onPointerDownDrag,
}: {
  exercise: string;
  sets: DraftSet[];
  orderNumber: number;
  lastHistory?: LastExerciseHistory;
  onAdd: (weightKg: string, reps: string) => void;
  onRemove: (key: string) => void;
  onDelete?: () => void;
  onPointerDownDrag?: (e: React.PointerEvent<HTMLButtonElement>) => void;
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
      className="card space-y-3 p-4 transition-all duration-150"
    >
      <div className="flex items-start justify-between gap-2.5">
        {/* Controles de secuencia y arrastre táctil */}
        <div className="flex items-center gap-2 shrink-0 self-start mt-0.5">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--line)] bg-[#141414] text-[var(--muted)] hover:text-white active:bg-[var(--accent)]/20 active:text-[var(--accent)] cursor-grab active:cursor-grabbing touch-none select-none"
            title="Arrastra para reordenar"
            onPointerDown={onPointerDownDrag}
          >
            <span className="text-sm font-mono tracking-tighter">⠿</span>
          </button>

          <span className="inline-flex h-6 min-w-[1.6rem] items-center justify-center rounded-md bg-white/5 px-1.5 text-[11px] font-bold tabular-nums text-[var(--muted)] border border-white/10">
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
              <span className="text-[var(--muted)]">
                {" "}
                · {isPlateMachineExercise(exercise) ? "discos" : "barra"}
              </span>
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
                      ? isPlateMachineExercise(exercise)
                        ? "Abrir selector de discos"
                        : "Abrir selector de barra olímpica"
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
                    ? isPlateMachineExercise(exercise)
                      ? "Usar discos"
                      : "Usar barra"
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

  const [step, setStep] = useState<"day" | "arms" | "log" | "customize">(() => {
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
      return getExercisesForDayCustom(initialDay);
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

  const templateExercises = useMemo(() => {
    if (!dayType) return [];
    if (dayType === "hombro" && !armFocus) return getExercisesForDayCustom("hombro");
    return getExercisesForDayCustom(dayType, armFocus);
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
        step: step === "customize" ? "day" : step,
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

  // Estados de arrastre táctil profesional (Pointer Drag & Drop con listeners globales y auto-scroll a 60fps)
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [targetIndex, setTargetIndex] = useState<number | null>(null);
  const [dragCardRect, setDragCardRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const [dragCurrentY, setDragCurrentY] = useState<number>(0);

  // Refs de estado para callbacks síncronos en animación frame y eventos globales
  const dragClientYRef = useRef<number>(0);
  const isDraggingActiveRef = useRef<boolean>(false);
  const draggingIndexRef = useRef<number | null>(null);
  const targetIndexRef = useRef<number | null>(null);
  const pointerOffsetInCard = useRef<number>(0);
  const autoScrollRaf = useRef<number | null>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);

  // Lista simulada en tiempo real para el preview
  const previewOrder = useMemo(() => {
    if (draggingIndex === null || targetIndex === null || draggingIndex === targetIndex) {
      return activeExercises;
    }
    const list = [...activeExercises];
    const [moved] = list.splice(draggingIndex, 1);
    list.splice(targetIndex, 0, moved);
    return list;
  }, [activeExercises, draggingIndex, targetIndex]);

  // Recalcular dinámicamente sobre qué tarjeta se encuentra el puntero
  const updateTargetSlotFromY = (clientY: number) => {
    if (!cardsContainerRef.current) return;
    const cards = Array.from(
      cardsContainerRef.current.querySelectorAll<HTMLElement>("[data-exercise-card]"),
    );
    if (cards.length === 0) return;

    let found = cards.length - 1;
    for (let i = 0; i < cards.length; i++) {
      const rect = cards[i].getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      if (clientY <= midpoint) {
        found = i;
        break;
      }
    }
    targetIndexRef.current = found;
    setTargetIndex(found);
  };

  // Auto-scroll loop continuo a 60fps mientras se arrastra cerca de los bordes de la pantalla
  const startAutoScroll = () => {
    if (autoScrollRaf.current !== null) return;

    const scrollStep = () => {
      if (!isDraggingActiveRef.current) {
        autoScrollRaf.current = null;
        return;
      }

      const y = dragClientYRef.current;
      const topThreshold = 160;
      const bottomThreshold = window.innerHeight - 160;

      if (y > 0 && y < topThreshold) {
        const factor = (topThreshold - Math.max(0, y)) / topThreshold;
        const speed = Math.max(3, Math.round(factor * 20));
        window.scrollBy(0, -speed);
        updateTargetSlotFromY(y);
      } else if (y > bottomThreshold && y < window.innerHeight + 80) {
        const factor = Math.min(1, (y - bottomThreshold) / 160);
        const speed = Math.max(3, Math.round(factor * 20));
        window.scrollBy(0, speed);
        updateTargetSlotFromY(y);
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

  // Handlers globales registrados en window para evitar pérdida de captura al re-renderizar
  const onGlobalPointerMove = (e: PointerEvent) => {
    if (!isDraggingActiveRef.current) return;
    dragClientYRef.current = e.clientY;
    setDragCurrentY(e.clientY);
    updateTargetSlotFromY(e.clientY);
  };

  const onGlobalPointerUp = () => {
    if (!isDraggingActiveRef.current) return;
    isDraggingActiveRef.current = false;
    stopAutoScroll();

    window.removeEventListener("pointermove", onGlobalPointerMove);
    window.removeEventListener("pointerup", onGlobalPointerUp);
    window.removeEventListener("pointercancel", onGlobalPointerUp);

    const fromIdx = draggingIndexRef.current;
    const toIdx = targetIndexRef.current;

    if (fromIdx !== null && toIdx !== null && fromIdx !== toIdx) {
      moveExercise(fromIdx, toIdx);
    }

    draggingIndexRef.current = null;
    targetIndexRef.current = null;
    setDraggingIndex(null);
    setTargetIndex(null);
    setDragCardRect(null);
  };

  function handlePointerDownDrag(e: React.PointerEvent<HTMLButtonElement>, index: number) {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    const card = e.currentTarget.closest("[data-exercise-card]") as HTMLElement | null;
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

    isDraggingActiveRef.current = true;
    draggingIndexRef.current = index;
    targetIndexRef.current = index;
    dragClientYRef.current = e.clientY;

    setDragCurrentY(e.clientY);
    setDraggingIndex(index);
    setTargetIndex(index);

    window.addEventListener("pointermove", onGlobalPointerMove, { passive: false });
    window.addEventListener("pointerup", onGlobalPointerUp);
    window.addEventListener("pointercancel", onGlobalPointerUp);

    startAutoScroll();
  }

  // Cleanup de seguridad al desmontar
  useEffect(() => {
    return () => {
      stopAutoScroll();
      window.removeEventListener("pointermove", onGlobalPointerMove);
      window.removeEventListener("pointerup", onGlobalPointerUp);
      window.removeEventListener("pointercancel", onGlobalPointerUp);
    };
  }, []);

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
    const defaultTemplate = getExercisesForDayCustom(day);
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
    const defaultTemplate = getExercisesForDayCustom("hombro", focus);
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

  if (step === "customize") {
    return (
      <RoutineCustomizer
        onBack={() => setStep("day")}
        onSaved={() => {
          if (dayType) {
            setExerciseOrder(getExercisesForDayCustom(dayType, armFocus));
          }
        }}
      />
    );
  }

  if (step === "day") {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <p className="page-kicker">Nuevo entreno</p>
          <h1 className="page-title mt-1">¿Qué toca hoy?</h1>
          <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
            Elige tu rutina para cargar los ejercicios previstos.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {DAY_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => selectDay(opt.id)}
              className="card card-interactive group relative flex min-h-[6.25rem] sm:min-h-[6.5rem] items-center justify-between p-3.5 sm:p-4 overflow-hidden text-left transition-all hover:border-[var(--accent)] active:scale-[0.99] rounded-2xl"
            >
              <div className="min-w-0 pr-1.5 z-10">
                <p className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl tracking-[0.04em] text-white leading-none">
                  {opt.label}
                </p>
                <p className="mt-1 text-xs text-[var(--muted)] truncate">
                  {opt.subtitle}
                </p>
              </div>
              <MuscleGroupIcon
                group={opt.id}
                className="h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
              />
            </button>
          ))}
        </div>

        {/* Botón destacado para Ajustar Rutinas */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setStep("customize")}
            className="card card-interactive flex items-center justify-between p-4 border border-[var(--accent)]/30 bg-gradient-to-r from-[var(--surface-2)]/90 via-[var(--surface-2)]/60 to-[var(--accent)]/10 hover:border-[var(--accent)] transition-all active:scale-[0.99] shadow-sm w-full rounded-2xl"
          >
            <div className="flex items-center gap-3.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30 shadow-sm flex-shrink-0">
                <svg
                  className="h-4 w-4 text-[var(--accent)]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </span>
              <div className="text-left">
                <p className="font-[family-name:var(--font-display)] text-xl tracking-[0.04em] text-white">
                  Ajustar Rutinas
                </p>
                <p className="text-xs text-[var(--muted)]">
                  Personaliza y guarda los ejercicios de cada día
                </p>
              </div>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent)] flex items-center gap-1 flex-shrink-0">
              Configurar
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </span>
          </button>
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

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => selectArms("biceps")}
            className="card card-interactive flex min-h-[5.5rem] flex-col justify-center p-4 text-left transition hover:border-[var(--accent)] active:scale-[0.99]"
          >
            <p className="font-[family-name:var(--font-display)] text-2xl tracking-[0.04em]">
              Bíceps
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Curls y antebrazo
            </p>
          </button>

          <button
            type="button"
            onClick={() => selectArms("triceps")}
            className="card card-interactive flex min-h-[5.5rem] flex-col justify-center p-4 text-left transition hover:border-[var(--accent)] active:scale-[0.99]"
          >
            <p className="font-[family-name:var(--font-display)] text-2xl tracking-[0.04em]">
              Tríceps
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Fondos y extensiones
            </p>
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

        {/* Lista de ejercicios con reordenamiento dinámico y preview interactivo */}
        <div
          ref={cardsContainerRef}
          className="space-y-3 relative select-none"
        >
          {previewOrder.map((exercise, index) => {
            const isExtra = extraExercises.includes(exercise);
            const isBeingDragged = draggingIndex !== null && exercise === activeExercises[draggingIndex];

            if (isBeingDragged) {
              return (
                <div
                  key={`slot-${exercise}`}
                  data-exercise-card
                  className="flex items-center justify-center rounded-2xl border-2 border-dashed border-[var(--accent)] bg-[var(--accent)]/10 p-5 text-center shadow-inner transition-all duration-150 animate-pulse min-h-[80px]"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-[var(--accent)] uppercase tracking-wider">
                    <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
                    <span>Soltar aquí · Posición #{index + 1}</span>
                  </div>
                </div>
              );
            }

            return (
              <ExerciseBlock
                key={exercise}
                exercise={exercise}
                orderNumber={index + 1}
                sets={sets.filter((s) => s.exercise === exercise)}
                lastHistory={historyByExercise[exercise]}
                onAdd={(weightKg, reps) => addSet(exercise, weightKg, reps)}
                onRemove={removeSet}
                onDelete={isExtra ? () => removeExtraExercise(exercise) : undefined}
                onPointerDownDrag={(e) => {
                  const originalIdx = activeExercises.indexOf(exercise);
                  if (originalIdx !== -1) {
                    handlePointerDownDrag(e, originalIdx);
                  }
                }}
              />
            );
          })}

          {/* Tarjeta flotante visual que sigue el dedo en tiempo real */}
          {draggingIndex !== null && dragCardRect !== null ? (
            <div
              className="fixed pointer-events-none z-50 transition-none"
              style={{
                top: Math.max(60, Math.min(window.innerHeight - 120, dragCurrentY - pointerOffsetInCard.current)),
                left: dragCardRect.left,
                width: dragCardRect.width,
                transform: "scale(0.96)",
                opacity: 0.92,
              }}
            >
              <div className="card border-2 border-[var(--accent)] bg-[#181818] p-3.5 sm:p-4 shadow-[0_20px_60px_rgba(0,0,0,0.98)] ring-4 ring-[var(--accent)]/25">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-6 min-w-[2rem] px-1.5 items-center justify-center rounded bg-[var(--accent)] text-black font-bold text-xs">
                      #{(targetIndex ?? draggingIndex) + 1}
                    </span>
                    <p className="font-bold text-white text-base truncate max-w-[200px] sm:max-w-[280px]">
                      {activeExercises[draggingIndex]}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-[var(--accent)]">
                    Moviendo a #{(targetIndex ?? draggingIndex) + 1}
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
