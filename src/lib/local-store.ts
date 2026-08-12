import { randomUUID } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import type { ProfileId } from "@/lib/profiles";
import type {
  BodyWeightEntry,
  CreateBodyWeightInput,
  CreateWorkoutInput,
  UpdateWorkoutInput,
  Workout,
} from "@/lib/types";

type Store = {
  workouts: Workout[];
  bodyWeight: BodyWeightEntry[];
};

const DATA_DIR = path.join(process.cwd(), ".data");

function storePath(profileId: ProfileId): string {
  // Juan reutiliza store.json (datos locales previos).
  if (profileId === "juan") return path.join(DATA_DIR, "store.json");
  return path.join(DATA_DIR, `store-${profileId}.json`);
}

function emptyStore(): Store {
  return { workouts: [], bodyWeight: [] };
}

function readStore(profileId: ProfileId): Store {
  const file = storePath(profileId);
  if (!existsSync(file)) return emptyStore();
  try {
    return JSON.parse(readFileSync(file, "utf8")) as Store;
  } catch {
    return emptyStore();
  }
}

function writeStore(profileId: ProfileId, store: Store) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(storePath(profileId), JSON.stringify(store, null, 2), "utf8");
}

export function localListWorkouts(
  profileId: ProfileId,
  limit = 50,
): Workout[] {
  return readStore(profileId)
    .workouts.sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
}

export function localGetWorkout(
  profileId: ProfileId,
  id: string,
): Workout | null {
  return readStore(profileId).workouts.find((w) => w.id === id) ?? null;
}

export function localCreateWorkout(
  profileId: ProfileId,
  input: CreateWorkoutInput,
): Workout {
  const store = readStore(profileId);
  const workout: Workout = {
    id: randomUUID(),
    date: input.date,
    notes: input.notes ?? "",
    createdAt: new Date().toISOString(),
    dayType: input.dayType ?? null,
    armFocus: input.armFocus ?? null,
    sets: input.sets.map((set, index) => ({
      id: randomUUID(),
      exercise: set.exercise,
      weightKg: set.weightKg,
      reps: set.reps,
      setNumber: set.setNumber,
      orderIndex: set.orderIndex ?? index,
    })),
  };
  store.workouts.unshift(workout);
  writeStore(profileId, store);
  return workout;
}

export function localDeleteWorkout(profileId: ProfileId, id: string): void {
  const store = readStore(profileId);
  store.workouts = store.workouts.filter((w) => w.id !== id);
  writeStore(profileId, store);
}

export function localUpdateWorkout(
  profileId: ProfileId,
  id: string,
  input: UpdateWorkoutInput,
): Workout | null {
  const store = readStore(profileId);
  const index = store.workouts.findIndex((w) => w.id === id);
  if (index < 0) return null;

  const previous = store.workouts[index];
  const updated: Workout = {
    ...previous,
    date: input.date,
    notes: input.notes ?? "",
    dayType: input.dayType ?? null,
    armFocus: input.armFocus ?? null,
    sets: input.sets.map((set, setIndex) => ({
      id: randomUUID(),
      exercise: set.exercise,
      weightKg: set.weightKg,
      reps: set.reps,
      setNumber: set.setNumber,
      orderIndex: set.orderIndex ?? setIndex,
    })),
  };
  store.workouts[index] = updated;
  writeStore(profileId, store);
  return updated;
}

export function localListBodyWeight(
  profileId: ProfileId,
  limit = 90,
): BodyWeightEntry[] {
  return readStore(profileId)
    .bodyWeight.sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
}

export function localCreateBodyWeight(
  profileId: ProfileId,
  input: CreateBodyWeightInput,
): BodyWeightEntry {
  const store = readStore(profileId);
  const entry: BodyWeightEntry = {
    id: randomUUID(),
    date: input.date,
    weightKg: input.weightKg,
  };
  store.bodyWeight.unshift(entry);
  writeStore(profileId, store);
  return entry;
}

export function localDeleteBodyWeight(profileId: ProfileId, id: string): void {
  const store = readStore(profileId);
  store.bodyWeight = store.bodyWeight.filter((b) => b.id !== id);
  writeStore(profileId, store);
}
