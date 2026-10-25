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
/**
 * Copia de seguridad del último borrador que tuvo series. No se borra al
 * descartar ni si el borrador se vacía por error: solo al guardar el entreno.
 */
const BACKUP_KEY = "fuerza_workout_draft_backup_v1";
/** Una copia más vieja que esto ya no se ofrece para recuperar. */
const BACKUP_MAX_AGE_MS = 48 * 60 * 60 * 1000;
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
    if (draft.sets?.length > 0) localStorage.setItem(BACKUP_KEY, raw);
    cachedDraftRaw = raw;
    cachedDraft = draft;
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(DRAFT_CHANGE_EVENT));
    }
  } catch {
    // Manejo silencioso en caso de cuota de localStorage llena o modo privado estricto
  }
}

/**
 * Borra el borrador en curso. La copia de seguridad se conserva salvo que se
 * pida `dropBackup` (después de guardar el entreno con éxito).
 */
export function clearWorkoutDraft(options: { dropBackup?: boolean } = {}): void {
  if (typeof window === "undefined" && typeof localStorage === "undefined") {
    return;
  }
  try {
    localStorage.removeItem(STORAGE_KEY);
    if (options.dropBackup) localStorage.removeItem(BACKUP_KEY);
    cachedDraftRaw = null;
    cachedDraft = null;
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(DRAFT_CHANGE_EVENT));
    }
  } catch {
    // Manejo silencioso
  }
}

/** Último borrador con series (reciente), para ofrecer recuperarlo si se perdió. */
export function getDraftBackup(now = Date.now()): WorkoutDraft | null {
  try {
    const raw = localStorage.getItem(BACKUP_KEY);
    if (!raw) return null;
    const backup = JSON.parse(raw) as WorkoutDraft;
    if (!backup.sets?.length) return null;
    if (typeof backup.updatedAt === "number" && now - backup.updatedAt > BACKUP_MAX_AGE_MS) return null;
    return backup;
  } catch {
    return null;
  }
}

export function discardDraftBackup(): void {
  try {
    localStorage.removeItem(BACKUP_KEY);
  } catch {
    // Ignorar
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
