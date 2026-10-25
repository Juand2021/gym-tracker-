import { listBodyWeight, listWorkouts } from "@/lib/data";
import { getDb, isFirebaseConfigured } from "@/lib/firebase";
import type { Profile } from "@/lib/profiles";
import { getNutritionAiClient } from "./ai-client.ts";
import type { ToolContext } from "./chat-tools.ts";
import { getServerFoodDb } from "./db-server.ts";
import { makeLlmParser } from "./engine/parse.ts";
import { analyzeMeal } from "./engine/pipeline.ts";
import { makeLlmReranker } from "./engine/rerank.ts";
import { todayInBogota } from "./profile.ts";
import { createFirestoreStore, createLocalStore, sumTotals, type NutritionStore } from "./store.ts";
import { computeTargets, type Targets } from "./targets.ts";

/** Comidas solo está activo para Juan (decisión del 2026-10-25). */
export function nutritionEnabled(profile: Profile): boolean {
  return profile.id === "juan";
}

let store: NutritionStore | null = null;
export function getNutritionStore(): NutritionStore {
  if (!store) store = isFirebaseConfigured() ? createFirestoreStore(getDb() as never) : createLocalStore();
  return store;
}

const shiftDate = (date: string, days: number) => {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

/** Objetivos del día con el último peso registrado y los entrenos de los 28 días previos. */
export async function targetsFor(profile: Profile, date: string): Promise<Targets> {
  const [nprofile, weights, workouts] = await Promise.all([getNutritionStore().getProfile(), listBodyWeight(profile, 30), listWorkouts(profile, 60)]);
  const latest = weights.filter((w) => w.date <= date).sort((a, b) => b.date.localeCompare(a.date))[0];
  const from = shiftDate(date, -28);
  const dates = workouts.map((w) => w.date.slice(0, 10)).filter((d) => d > from && d <= date);
  return computeTargets({
    profile: nprofile,
    weightKg: latest?.weightKg ?? nprofile.fallbackWeightKg,
    workoutDates: dates,
    today: date,
    trainingToday: dates.includes(date),
  });
}

/** Contexto de las herramientas del chat. Devuelve null si falta la IA o la base de alimentos. */
export async function makeToolContext(profile: Profile, threadId: string | null, turnId: string): Promise<ToolContext | null> {
  const ai = getNutritionAiClient();
  const foodDb = await getServerFoodDb(isFirebaseConfigured() ? () => getDb() as never : undefined);
  if (!ai || !foodDb) return null;
  const parser = makeLlmParser(ai);
  const reranker = makeLlmReranker(ai);
  return {
    store: getNutritionStore(),
    analyze: (text) => analyzeMeal(text, { db: foodDb, parser, reranker }),
    targetsFor: (date) => targetsFor(profile, date),
    threadId,
    turnId,
  };
}

/** Resumen de hoy para la línea de arriba del chat. */
export async function todaySummary(profile: Profile) {
  const date = todayInBogota();
  const [meals, t] = await Promise.all([getNutritionStore().listMeals(date, date), targetsFor(profile, date)]);
  const eaten = sumTotals(meals);
  return {
    date,
    kcal: eaten.kcal,
    kcalTarget: t.kcal,
    protein: Math.round(eaten.protein_g),
    proteinTarget: t.protein_g,
    alcohol: eaten.alcohol_g,
    meals: meals.length,
  };
}
