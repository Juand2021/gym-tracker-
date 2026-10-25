import { countReads } from "../firestore-usage.ts";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { MealItemResult } from "./engine/pipeline.ts";
import type { Nutrients } from "./engine/types.ts";
import type { ChatCard } from "./cards.ts";
import { EMPTY_PROFILE, type NutritionProfile } from "./profile.ts";

/**
 * Datos de Comidas (docs/nutricion/03-arquitectura.md §3): perfil, comidas, borradores y medidas.
 * Dos implementaciones con la misma interfaz: archivo local (.data/, sin Firebase) y Firestore.
 * Cada persona tiene su propio almacén (ver server.ts: raíz para Juan, users/{id}/... para los demás).
 */

export type MealMoment = "desayuno" | "almuerzo" | "cena" | "snack" | "fiesta";

export type MealTotals = Pick<Nutrients, "kcal" | "protein_g" | "fat_g" | "carb_g" | "fiber_g" | "alcohol_g">;

export type StoredItem = Omit<MealItemResult, "nutrients" | "warnings"> & { nutrients: MealTotals };

export type Meal = {
  id: string;
  date: string;
  time: string;
  moment: MealMoment;
  text: string;
  items: StoredItem[];
  totals: MealTotals;
  engineVersion: string;
  chatThreadId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MealDraft = Omit<Meal, "updatedAt"> & {
  /** Turno del chat en que se creó: no se puede guardar en ese mismo turno. */
  turnId: string;
  /** Si corrige una comida ya guardada, su id. */
  replacesMealId: string | null;
  expiresAt: string;
};

/** Conversación del chat de la app de Comidas (aparte de los chats del Coach de Fuerza). */
export type ComidasChatMessage = { id: string; role: "user" | "assistant"; content: string; createdAt: string; cards?: ChatCard[] };
export type ComidasChat = { id: string; title: string; messages: ComidasChatMessage[]; createdAt: string; updatedAt: string };

export type BodyMeasurement = { id: string; date: string; waistCm: number | null; neckCm: number | null; hipCm?: number | null; bicepsCm: number | null; thighCm: number | null; notes: string };

export interface NutritionStore {
  /** null si la persona todavía no ha creado su perfil. */
  getProfile(): Promise<NutritionProfile | null>;
  saveProfile(p: NutritionProfile): Promise<void>;
  listMeals(fromDate: string, toDate: string): Promise<Meal[]>;
  getMeal(id: string): Promise<Meal | null>;
  saveMeal(m: Meal): Promise<void>;
  deleteMeal(id: string): Promise<void>;
  getDraft(id: string): Promise<MealDraft | null>;
  /** Borradores vigentes de un hilo de chat, el más reciente primero. */
  listDrafts(chatThreadId: string | null): Promise<MealDraft[]>;
  saveDraft(d: MealDraft): Promise<void>;
  deleteDraft(id: string): Promise<void>;
  listMeasurements(): Promise<BodyMeasurement[]>;
  saveMeasurement(m: BodyMeasurement): Promise<void>;
  /** Agua bebida en un día (ml). */
  getWater(date: string): Promise<number>;
  setWater(date: string, ml: number): Promise<void>;
  listChats(): Promise<ComidasChat[]>;
  getChat(id: string): Promise<ComidasChat | null>;
  saveChat(c: ComidasChat): Promise<void>;
  deleteChat(id: string): Promise<void>;
}

export const newId = () => randomUUID();

const DRAFT_TTL_MS = 24 * 3600 * 1000;
export const draftExpiry = (now = Date.now()) => new Date(now + DRAFT_TTL_MS).toISOString();
const alive = (d: MealDraft) => d.expiresAt > new Date().toISOString();

/** Completa perfiles guardados con versiones anteriores del esquema. */
export function normalizeProfile(stored: unknown): NutritionProfile | null {
  if (!stored || typeof stored !== "object") return null;
  const old = stored as Partial<NutritionProfile> & { fallbackWeightKg?: number };
  const { fallbackWeightKg, ...rest } = old;
  return { ...EMPTY_PROFILE, ...rest, weightKg: rest.weightKg ?? fallbackWeightKg ?? null, avoidFoods: rest.avoidFoods ?? [] };
}

// ───────── Archivo local ─────────

type LocalData = { profile: NutritionProfile | null; meals: Meal[]; drafts: MealDraft[]; measurements: BodyMeasurement[]; chats: ComidasChat[]; water: Record<string, number> };
const emptyLocal = (): LocalData => ({ profile: null, meals: [], drafts: [], measurements: [], chats: [], water: {} });

export function createLocalStore(file = path.join(process.cwd(), ".data", "nutrition-store.json")): NutritionStore {
  const read = (): LocalData => {
    if (!existsSync(file)) return emptyLocal();
    try {
      return { ...emptyLocal(), ...(JSON.parse(readFileSync(file, "utf8")) as Partial<LocalData>) };
    } catch {
      return emptyLocal();
    }
  };
  const write = (data: LocalData) => {
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
  };
  const update = (fn: (d: LocalData) => void) => {
    const d = read();
    fn(d);
    write(d);
  };
  return {
    async getProfile() {
      return normalizeProfile(read().profile);
    },
    async saveProfile(p) {
      update((d) => void (d.profile = p));
    },
    async listMeals(from, to) {
      return read().meals.filter((m) => m.date >= from && m.date <= to).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    },
    async getMeal(id) {
      return read().meals.find((m) => m.id === id) ?? null;
    },
    async saveMeal(m) {
      update((d) => void (d.meals = [...d.meals.filter((x) => x.id !== m.id), m]));
    },
    async deleteMeal(id) {
      update((d) => void (d.meals = d.meals.filter((x) => x.id !== id)));
    },
    async getDraft(id) {
      const d = read().drafts.find((x) => x.id === id);
      return d && alive(d) ? d : null;
    },
    async listDrafts(threadId) {
      return read()
        .drafts.filter((d) => alive(d) && d.chatThreadId === threadId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    async saveDraft(draft) {
      update((d) => void (d.drafts = [...d.drafts.filter((x) => x.id !== draft.id && alive(x)), draft]));
    },
    async deleteDraft(id) {
      update((d) => void (d.drafts = d.drafts.filter((x) => x.id !== id)));
    },
    async listMeasurements() {
      return read().measurements.sort((a, b) => a.date.localeCompare(b.date));
    },
    async saveMeasurement(m) {
      update((d) => void (d.measurements = [...d.measurements.filter((x) => x.id !== m.id), m]));
    },
    async getWater(date) {
      return read().water[date] ?? 0;
    },
    async setWater(date, ml) {
      update((d) => void (d.water[date] = Math.max(0, Math.round(ml))));
    },
    async listChats() {
      return read().chats.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },
    async getChat(id) {
      return read().chats.find((c) => c.id === id) ?? null;
    },
    async saveChat(c) {
      update((d) => void (d.chats = [...d.chats.filter((x) => x.id !== c.id), c]));
    },
    async deleteChat(id) {
      update((d) => void (d.chats = d.chats.filter((x) => x.id !== id)));
    },
  };
}

// ───────── Firestore ─────────

export type CollectionLike = {
  doc(id: string): { get(): Promise<{ exists: boolean; data(): unknown }>; set(data: unknown): Promise<unknown>; delete(): Promise<unknown> };
  where(field: string, op: string, value: unknown): FirestoreQuery;
  orderBy(field: string, dir?: "asc" | "desc"): FirestoreQuery;
};
type FirestoreQuery = {
  where(field: string, op: string, value: unknown): FirestoreQuery;
  orderBy(field: string, dir?: "asc" | "desc"): FirestoreQuery;
  limit(n: number): FirestoreQuery;
  get(): Promise<{ docs: { data(): unknown }[] }>;
};

/** `col` da la colección de esta persona: raíz para Juan (como workouts), users/{id}/... para los demás. */
export function createFirestoreStore(col: (name: string) => CollectionLike): NutritionStore {
  const get = async <T>(name: string, id: string) => {
    const snap = await col(name).doc(id).get();
    countReads(`comidas: ${name}`, 1);
    return snap.exists ? (snap.data() as T) : null;
  };
  return {
    async getProfile() {
      return normalizeProfile(await get<NutritionProfile>("profile", "main"));
    },
    async saveProfile(p) {
      await col("profile").doc("main").set(p);
    },
    async listMeals(from, to) {
      const snap = await col("meals").where("date", ">=", from).where("date", "<=", to).get();
      countReads("comidas: meals", snap.docs.length);
      return snap.docs.map((d) => d.data() as Meal).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    },
    async getMeal(id) {
      return get<Meal>("meals", id);
    },
    async saveMeal(m) {
      await col("meals").doc(m.id).set(m);
    },
    async deleteMeal(id) {
      await col("meals").doc(id).delete();
    },
    async getDraft(id) {
      const d = await get<MealDraft>("mealDrafts", id);
      return d && alive(d) ? d : null;
    },
    async listDrafts(threadId) {
      const snap = await col("mealDrafts").where("chatThreadId", "==", threadId).get();
      countReads("comidas: mealDrafts", snap.docs.length);
      return snap.docs
        .map((d) => d.data() as MealDraft)
        .filter(alive)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    async saveDraft(d) {
      await col("mealDrafts").doc(d.id).set(d);
    },
    async deleteDraft(id) {
      await col("mealDrafts").doc(id).delete();
    },
    async listMeasurements() {
      const snap = await col("bodyMeasurements").where("date", ">=", "0000").get();
      countReads("comidas: bodyMeasurements", snap.docs.length);
      return snap.docs.map((d) => d.data() as BodyMeasurement).sort((a, b) => a.date.localeCompare(b.date));
    },
    async saveMeasurement(m) {
      await col("bodyMeasurements").doc(m.id).set(m);
    },
    async getWater(date) {
      return (await get<{ ml: number }>("water", date))?.ml ?? 0;
    },
    async setWater(date, ml) {
      await col("water").doc(date).set({ date, ml: Math.max(0, Math.round(ml)) });
    },
    async listChats() {
      // Solo las 30 más recientes: cada conversación es una lectura.
      const snap = await col("comidasChats").orderBy("updatedAt", "desc").limit(30).get();
      countReads("comidas: comidasChats", snap.docs.length);
      return snap.docs.map((d) => d.data() as ComidasChat).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },
    async getChat(id) {
      return get<ComidasChat>("comidasChats", id);
    },
    async saveChat(c) {
      await col("comidasChats").doc(c.id).set(c);
    },
    async deleteChat(id) {
      await col("comidasChats").doc(id).delete();
    },
  };
}

/** Suma de nutrientes de una lista de comidas. */
export function sumTotals(meals: { totals: MealTotals }[]): MealTotals {
  const out: MealTotals = { kcal: 0, protein_g: 0, fat_g: 0, carb_g: 0, fiber_g: 0, alcohol_g: 0 };
  for (const m of meals) for (const k of Object.keys(out) as (keyof MealTotals)[]) out[k] += m.totals[k] ?? 0;
  for (const k of Object.keys(out) as (keyof MealTotals)[]) out[k] = k === "kcal" ? Math.round(out[k]) : Math.round(out[k] * 10) / 10;
  return out;
}
