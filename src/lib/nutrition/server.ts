import path from "node:path";
import { createBodyWeight, listBodyWeight, listWorkouts } from "@/lib/data";
import { getDb, isFirebaseConfigured } from "@/lib/firebase";
import type { Profile } from "@/lib/profiles";
import { getNutritionAiClient } from "./ai-client.ts";
import type { ToolContext } from "./chat-tools.ts";
import { getServerFoodDb } from "./db-server.ts";
import { makeLlmParser } from "./engine/parse.ts";
import { analyzeMeal } from "./engine/pipeline.ts";
import { makeLlmReranker } from "./engine/rerank.ts";
import { missingForTargets, todayInBogota } from "./profile.ts";
import { createFirestoreStore, createLocalStore, sumTotals, type CollectionLike, type NutritionStore } from "./store.ts";
import { computeTargets, type TargetsLookup } from "./targets.ts";

/**
 * Perfiles con acceso a la app Comidas. Por defecto solo Juan; para abrirla a otros:
 * COMIDAS_PROFILES=juan,laura (la misma variable la lee el middleware).
 */
export function comidasProfiles(): string[] {
  return (process.env.COMIDAS_PROFILES ?? "juan")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function nutritionEnabled(profile: Profile): boolean {
  return comidasProfiles().includes(profile.id);
}

const stores = new Map<string, NutritionStore>();

/** Almacén de una persona: raíz para Juan (como workouts), users/{id}/... para los demás. */
export function getNutritionStore(profile: Profile): NutritionStore {
  let store = stores.get(profile.id);
  if (!store) {
    if (isFirebaseConfigured()) {
      const db = getDb();
      const col = (name: string) =>
        (profile.dataRoot === "legacy" ? db.collection(name) : db.collection("users").doc(profile.id).collection(name)) as unknown as CollectionLike;
      store = createFirestoreStore(col);
    } else {
      const file = profile.id === "juan" ? "nutrition-store.json" : `nutrition-store-${profile.id}.json`;
      store = createLocalStore(path.join(process.cwd(), ".data", file));
    }
    stores.set(profile.id, store);
  }
  return store;
}

const shiftDate = (date: string, days: number) => {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

/** Objetivos del día con el último pesaje (Fuerza) o el peso declarado, y los entrenos de los 28 días previos. */
export async function targetsFor(profile: Profile, date: string): Promise<TargetsLookup> {
  const [nprofile, weights, workouts] = await Promise.all([getNutritionStore(profile).getProfile(), listBodyWeight(profile, 30), listWorkouts(profile, 60)]);
  // Los datos de demostración de Fuerza (ids "demo-…") nunca cuentan.
  const latest = weights.filter((w) => !w.id.startsWith("demo-") && w.date <= date).sort((a, b) => b.date.localeCompare(a.date))[0];
  const missing = missingForTargets(nprofile, !!latest);
  if (missing.length || !nprofile) return { ok: false, missing, profile: nprofile };
  const from = shiftDate(date, -28);
  const dates = workouts
    .filter((w) => !w.id.startsWith("demo-"))
    .map((w) => w.date.slice(0, 10))
    .filter((d) => d > from && d <= date);
  const targets = computeTargets({
    profile: nprofile,
    weightKg: latest?.weightKg ?? nprofile.weightKg!,
    workoutDates: dates,
    today: date,
    trainingToday: dates.includes(date),
  });
  return { ok: true, targets, profile: nprofile };
}

/** Contexto de las herramientas del chat. Devuelve null si falta la IA o la base de alimentos. */
export async function makeToolContext(profile: Profile, threadId: string | null, turnId: string): Promise<ToolContext | null> {
  const ai = getNutritionAiClient();
  const foodDb = await getServerFoodDb(isFirebaseConfigured() ? () => getDb() as never : undefined);
  if (!ai || !foodDb) return null;
  const parser = makeLlmParser(ai);
  const reranker = makeLlmReranker(ai);
  return {
    store: getNutritionStore(profile),
    analyze: (text) => analyzeMeal(text, { db: foodDb, parser, reranker }),
    targetsFor: (date) => targetsFor(profile, date),
    nutrientsOf: (key) => foodDb.resolveCore(key)?.per100g,
    logWeight: async (date, weightKg) => {
      await createBodyWeight(profile, { date, weightKg });
    },
    threadId,
    turnId,
  };
}

/** Resumen de hoy para la pantalla "Hoy". */
export async function todaySummary(profile: Profile) {
  const date = todayInBogota();
  const store = getNutritionStore(profile);
  const [meals, t] = await Promise.all([store.listMeals(date, date), targetsFor(profile, date)]);
  const eaten = sumTotals(meals);
  return {
    date,
    profileComplete: t.ok,
    missing: t.ok ? [] : t.missing,
    kcal: eaten.kcal,
    kcalTarget: t.ok ? t.targets.kcal : null,
    protein: Math.round(eaten.protein_g),
    proteinTarget: t.ok ? t.targets.protein_g : null,
    alcohol: eaten.alcohol_g,
    fat: Math.round(eaten.fat_g),
    fatTarget: t.ok ? t.targets.fat_g : null,
    carbs: Math.round(eaten.carb_g),
    carbsTarget: t.ok ? t.targets.carb_g : null,
    phase: t.profile?.phase ?? null,
    meals: meals.map((m) => ({
      id: m.id,
      time: m.time,
      moment: m.moment,
      text: m.text,
      kcal: m.totals.kcal,
      protein: Math.round(m.totals.protein_g),
      items: m.items.map((i) => ({ name: i.name, grams: i.grams, kcal: i.nutrients.kcal })),
    })),
  };
}
