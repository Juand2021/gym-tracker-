import { useSyncExternalStore } from "react";
import type { ArmFocus, DayType } from "@/lib/routines";

export type DraftSet = {
  key: string;
  exercise: string;
  weightKg: string;
  reps: string;
};

export type WorkoutDraft = {
  step: "day" | "arms" | "log";
  dayType: DayType | null;
  armFocus: ArmFocus | null;
  date: string;
  notes: string;
  sets: DraftSet[];
  extraExercises: string[];
  exerciseOrder?: string[];
  updatedAt: number;
};

const STORAGE_KEY = "fuerza_workout_draft_v1";
const DRAFT_CHANGE_EVENT = "fuerza_workout_draft_changed";

let cachedDraftRaw: string | null = null;
let cachedDraft: WorkoutDraft | null = null;

export function getWorkoutDraft(): WorkoutDraft | null {
  if (typeof window === "undefined" && typeof localStorage === "undefined") {
    return null;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      cachedDraftRaw = null;
      cachedDraft = null;
      return null;
    }
    if (raw === cachedDraftRaw && cachedDraft) {
      return cachedDraft;
    }
    cachedDraftRaw = raw;
    cachedDraft = JSON.parse(raw) as WorkoutDraft;
    return cachedDraft;
  } catch {
    return null;
  }
}

export function saveWorkoutDraft(draft: WorkoutDraft): void {
  if (typeof window === "undefined" && typeof localStorage === "undefined") {
    return;
  }
  try {
    const raw = JSON.stringify(draft);
    localStorage.setItem(STORAGE_KEY, raw);
    cachedDraftRaw = raw;
    cachedDraft = draft;
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(DRAFT_CHANGE_EVENT));
    }
  } catch {
    // Manejo silencioso en caso de cuota de localStorage llena o modo privado estricto
  }
}

export function clearWorkoutDraft(): void {
  if (typeof window === "undefined" && typeof localStorage === "undefined") {
    return;
  }
  try {
    localStorage.removeItem(STORAGE_KEY);
    cachedDraftRaw = null;
    cachedDraft = null;
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(DRAFT_CHANGE_EVENT));
    }
  } catch {
    // Manejo silencioso
  }
}

export function hasWorkoutDraft(): boolean {
  const draft = getWorkoutDraft();
  if (!draft) return false;
  return Boolean(draft.dayType || draft.sets?.length > 0 || draft.notes);
}

function subscribeDraft(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(DRAFT_CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(DRAFT_CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function useWorkoutDraft(): WorkoutDraft | null {
  return useSyncExternalStore(
    subscribeDraft,
    getWorkoutDraft,
    () => null,
  );
}
