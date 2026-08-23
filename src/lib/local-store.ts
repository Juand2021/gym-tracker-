import { randomUUID } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import type { ProfileId } from "@/lib/profiles";
import type {
  BodyWeightEntry,
  ChatMessage,
  ChatMessageRole,
  ChatThread,
  ChatThreadSummary,
  CreateBodyWeightInput,
  CreateWorkoutInput,
  UpdateWorkoutInput,
  Workout,
} from "@/lib/types";

type Store = {
  workouts: Workout[];
  bodyWeight: BodyWeightEntry[];
  chatThreads?: ChatThread[];
};

const DATA_DIR = path.join(process.cwd(), ".data");

function storePath(profileId: ProfileId): string {
  // Juan reutiliza store.json (datos locales previos).
  if (profileId === "juan") return path.join(DATA_DIR, "store.json");
  return path.join(DATA_DIR, `store-${profileId}.json`);
}

function emptyStore(): Store {
  return { workouts: [], bodyWeight: [], chatThreads: [] };
}

function readStore(profileId: ProfileId): Store {
  const file = storePath(profileId);
  if (!existsSync(file)) return emptyStore();
  try {
    const parsed = JSON.parse(readFileSync(file, "utf8")) as Store;
    if (!parsed.chatThreads) parsed.chatThreads = [];
    return parsed;
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

// -------------------------------------------------------------
// AI Chat Threads Storage
// -------------------------------------------------------------

export function localListChatThreads(profileId: ProfileId): ChatThreadSummary[] {
  const store = readStore(profileId);
  const threads = store.chatThreads ?? [];
  return threads
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((t) => {
      const lastMsg = t.messages[t.messages.length - 1];
      return {
        id: t.id,
        title: t.title || "Conversación",
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        messageCount: t.messages.length,
        lastMessageSnippet: lastMsg ? lastMsg.content.slice(0, 90) : undefined,
      };
    });
}

export function localGetChatThread(
  profileId: ProfileId,
  threadId: string,
): ChatThread | null {
  const store = readStore(profileId);
  const threads = store.chatThreads ?? [];
  return threads.find((t) => t.id === threadId) ?? null;
}

export function localCreateChatThread(
  profileId: ProfileId,
  title?: string,
  initialMessage?: { role: ChatMessageRole; content: string },
): ChatThread {
  const store = readStore(profileId);
  if (!store.chatThreads) store.chatThreads = [];

  const now = new Date().toISOString();
  const threadId = randomUUID();
  const messages: ChatMessage[] = [];

  if (initialMessage) {
    messages.push({
      id: randomUUID(),
      role: initialMessage.role,
      content: initialMessage.content,
      createdAt: now,
    });
  }

  const thread: ChatThread = {
    id: threadId,
    title: title?.trim() || "Nueva conversación",
    createdAt: now,
    updatedAt: now,
    messages,
  };

  store.chatThreads.unshift(thread);
  writeStore(profileId, store);
  return thread;
}

export function localAppendChatMessage(
  profileId: ProfileId,
  threadId: string,
  message: { role: ChatMessageRole; content: string },
  newTitle?: string,
): { thread: ChatThread; message: ChatMessage } | null {
  const store = readStore(profileId);
  if (!store.chatThreads) store.chatThreads = [];

  const thread = store.chatThreads.find((t) => t.id === threadId);
  if (!thread) return null;

  const now = new Date().toISOString();
  const newMsg: ChatMessage = {
    id: randomUUID(),
    role: message.role,
    content: message.content,
    createdAt: now,
  };

  thread.messages.push(newMsg);
  thread.updatedAt = now;
  if (newTitle && (!thread.title || thread.title === "Nueva conversación")) {
    thread.title = newTitle;
  }

  writeStore(profileId, store);
  return { thread, message: newMsg };
}

export function localDeleteChatThread(profileId: ProfileId, threadId: string): void {
  const store = readStore(profileId);
  if (!store.chatThreads) return;
  store.chatThreads = store.chatThreads.filter((t) => t.id !== threadId);
  writeStore(profileId, store);
}

