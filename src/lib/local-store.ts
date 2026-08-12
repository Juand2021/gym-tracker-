import { randomUUID } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
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
const STORE_PATH = path.join(DATA_DIR, "store.json");

function emptyStore(): Store {
  return { workouts: [], bodyWeight: [] };
}

function readStore(): Store {
  if (!existsSync(STORE_PATH)) return emptyStore();
  try {
    return JSON.parse(readFileSync(STORE_PATH, "utf8")) as Store;
  } catch {
    return emptyStore();
  }
}

function writeStore(store: Store) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

export function localListWorkouts(limit = 50): Workout[] {
  return readStore()
    .workouts.sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
}

export function localGetWorkout(id: string): Workout | null {
  return readStore().workouts.find((w) => w.id === id) ?? null;
}

export function localCreateWorkout(input: CreateWorkoutInput): Workout {
  const store = readStore();
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
  writeStore(store);
  return workout;
}

export function localDeleteWorkout(id: string): void {
  const store = readStore();
  store.workouts = store.workouts.filter((w) => w.id !== id);
  writeStore(store);
}

export function localUpdateWorkout(
  id: string,
  input: UpdateWorkoutInput,
): Workout | null {
  const store = readStore();
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
  writeStore(store);
  return updated;
}

export function localListBodyWeight(limit = 90): BodyWeightEntry[] {
  return readStore()
    .bodyWeight.sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
}

export function localCreateBodyWeight(
  input: CreateBodyWeightInput,
): BodyWeightEntry {
  const store = readStore();
  const entry: BodyWeightEntry = {
    id: randomUUID(),
    date: input.date,
    weightKg: input.weightKg,
  };
  store.bodyWeight.unshift(entry);
  writeStore(store);
  return entry;
}

export function localDeleteBodyWeight(id: string): void {
  const store = readStore();
  store.bodyWeight = store.bodyWeight.filter((b) => b.id !== id);
  writeStore(store);
}
