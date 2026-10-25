import path from "node:path";
import { createBodyWeight, listBodyWeight, listWorkoutDates } from "@/lib/data";
import { getDb, isFirebaseConfigured } from "@/lib/firebase";
import { cachedRead, forgetCached } from "@/lib/server-cache";
import type { Profile } from "@/lib/profiles";
import { getNutritionAiClient } from "./ai-client.ts";
import type { ToolContext } from "./chat-tools.ts";
import { getServerFoodDb } from "./db-server.ts";
import { makeLlmParser } from "./engine/parse.ts";
import { analyzeMeal } from "./engine/pipeline.ts";
import { makeLlmReranker } from "./engine/rerank.ts";
import { ageOn, applyProfilePatch, missingForTargets, todayInBogota, type ProfilePatch } from "./profile.ts";
import { buildMealPlan } from "./meal-plan.ts";
import { dailyTotals, gamification, gaugeFor, gaugeStatus, shiftDate, summarize } from "./views.ts";
import { createFirestoreStore, createLocalStore, sumTotals, type CollectionLike, type NutritionStore } from "./store.ts";
import { bodyFatFor, computeTargets, type TargetsLookup } from "./targets.ts";

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

/** Últimos pesajes reales (sin los de demostración de Fuerza). */
function recentWeights(profile: Profile) {
  return cachedRead(`${profile.id}:weights30`, async () => (await listBodyWeight(profile, 30)).filter((w) => !w.id.startsWith("demo-")));
}

/** Días con entreno en los 28 días previos a `date` (solo fechas: 1 lectura por entreno, sin series). */
function trainingDates(profile: Profile, date: string) {
  const from = shiftDate(date, -28);
  return cachedRead(`${profile.id}:train:${from}`, () => listWorkoutDates(profile, from));
}

/** Objetivos del día con el último pesaje (Fuerza) o el peso declarado, y los entrenos de los 28 días previos. */
export async function targetsFor(profile: Profile, date: string): Promise<TargetsLookup> {
  const [nprofile, weights, trained] = await Promise.all([getNutritionStore(profile).getProfile(), recentWeights(profile), trainingDates(profile, date)]);
  const latest = weights.filter((w) => w.date <= date).sort((a, b) => b.date.localeCompare(a.date))[0];
  const missing = missingForTargets(nprofile, !!latest);
  if (missing.length || !nprofile) return { ok: false, missing, profile: nprofile };
  const from = shiftDate(date, -28);
  const dates = trained.filter((d) => d > from && d <= date);
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
      forgetCached(profile.id);
    },
    threadId,
    turnId,
  };
}

/** Un día para la pantalla Inicio: velocímetro, macros, agua, comidas y sugerencia de la siguiente comida. */
export async function daySummary(profile: Profile, date = todayInBogota()) {
  const store = getNutritionStore(profile);
  const [meals, t, water, foodDb] = await Promise.all([
    store.listMeals(date, date),
    targetsFor(profile, date),
    store.getWater(date),
    getServerFoodDb(isFirebaseConfigured() ? () => getDb() as never : undefined).catch(() => null),
  ]);
  const eaten = sumTotals(meals);
  const gauge = t.ok && t.profile.phase ? gaugeFor(t.profile.phase.type, t.targets.kcal) : null;
  let suggestion: { kcal: number; protein: number; foods: { name: string; grams: number }[] } | null = null;
  if (t.ok && foodDb && date === todayInBogota()) {
    const plan = buildMealPlan({
      profile: t.profile,
      targets: t.targets,
      eaten: { kcal: eaten.kcal, protein_g: eaten.protein_g },
      mealsEaten: meals.length,
      nutrientsOf: (k) => foodDb.resolveCore(k)?.per100g,
      optionsPerMeal: 1,
    });
    const opt = plan.comidas[0]?.opciones[0];
    if (opt && plan.restante_kcal >= 150) suggestion = { kcal: opt.kcal, protein: opt.proteina_g, foods: opt.alimentos.map((a) => ({ name: a.alimento, grams: a.gramos })) };
  }
  return {
    date,
    today: todayInBogota(),
    name: profile.displayName,
    profileComplete: t.ok,
    missing: t.ok ? [] : t.missing,
    kcal: eaten.kcal,
    kcalTarget: t.ok ? t.targets.kcal : null,
    protein: Math.round(eaten.protein_g),
    proteinTarget: t.ok ? t.targets.protein_g : null,
    fat: Math.round(eaten.fat_g),
    fatTarget: t.ok ? t.targets.fat_g : null,
    carbs: Math.round(eaten.carb_g),
    carbsTarget: t.ok ? t.targets.carb_g : null,
    alcohol: eaten.alcohol_g,
    water,
    waterTarget: t.ok ? Math.round(t.targets.water_l * 1000) : 2000,
    phase: t.profile?.phase ?? null,
    gauge,
    status: gauge ? gaugeStatus(gauge, eaten.kcal) : null,
    suggestion,
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

/** Alias usado por la API antigua. */
export const todaySummary = (profile: Profile) => daySummary(profile);

const RANGE_DAYS = { week: 7, month: 30, quarter: 90 } as const;
export type StatsRange = keyof typeof RANGE_DAYS;

/** Estadísticas de un rango que termina en `end`. */
export async function statsFor(profile: Profile, range: StatsRange, end = todayInBogota()) {
  const from = shiftDate(end, -(RANGE_DAYS[range] - 1));
  const store = getNutritionStore(profile);
  const [meals, t, weights] = await Promise.all([store.listMeals(from, end), targetsFor(profile, end), listBodyWeight(profile, 120)]);
  const phase = t.profile?.phase?.type ?? "mantenimiento";
  const kcalTarget = t.ok ? t.targets.kcal : 0;
  const proteinTarget = t.ok ? t.targets.protein_g : 0;
  const days = dailyTotals(meals, from, end, phase, kcalTarget, proteinTarget);
  const real = weights.filter((w) => !w.id.startsWith("demo-")).sort((a, b) => a.date.localeCompare(b.date));
  const inRange = real.filter((w) => w.date >= from && w.date <= end);
  const before = real.filter((w) => w.date < from).at(-1);
  const water = await Promise.all(days.map((d) => store.getWater(d.date)));
  const waterDays = water.filter((ml) => ml > 0);
  return {
    range,
    from,
    end,
    phase,
    kcalTarget: t.ok ? kcalTarget : null,
    proteinTarget: t.ok ? proteinTarget : null,
    days,
    summary: summarize(days, phase, kcalTarget),
    weight: {
      points: inRange.map((w) => ({ date: w.date, kg: w.weightKg })),
      current: real.at(-1)?.weightKg ?? t.profile?.weightKg ?? null,
      currentDate: real.at(-1)?.date ?? null,
      change: inRange.length && (before || inRange.length > 1) ? Math.round((inRange.at(-1)!.weightKg - (before ?? inRange[0]).weightKg) * 10) / 10 : null,
    },
    water: { avg: waterDays.length ? Math.round(waterDays.reduce((a, b) => a + b, 0) / waterDays.length) : 0, target: t.ok ? Math.round(t.targets.water_l * 1000) : 2000 },
  };
}

/** Plan del día (qué y cuánto comer en lo que queda). */
export async function planFor(profile: Profile) {
  const date = todayInBogota();
  const store = getNutritionStore(profile);
  const [meals, t, foodDb] = await Promise.all([store.listMeals(date, date), targetsFor(profile, date), getServerFoodDb(isFirebaseConfigured() ? () => getDb() as never : undefined)]);
  if (!t.ok) return { ok: false as const, missing: t.missing };
  if (!foodDb) return { ok: false as const, missing: ["base de alimentos"] };
  const eaten = sumTotals(meals);
  return {
    ok: true as const,
    phase: t.profile.phase,
    plan: buildMealPlan({
      profile: t.profile,
      targets: t.targets,
      eaten: { kcal: eaten.kcal, protein_g: eaten.protein_g },
      mealsEaten: meals.length,
      nutrientsOf: (k) => foodDb.resolveCore(k)?.per100g,
    }),
  };
}

/** Perfil completo para la pantalla Perfil: datos, objetivos explicados, salud, nivel y logros. */
export async function profileView(profile: Profile) {
  const today = todayInBogota();
  const store = getNutritionStore(profile);
  const from = shiftDate(today, -89);
  const [t, meals, weights] = await Promise.all([targetsFor(profile, today), store.listMeals(from, today), listBodyWeight(profile, 120)]);
  const realWeights = weights.filter((w) => !w.id.startsWith("demo-"));
  const p = t.profile;
  const weight = realWeights.sort((a, b) => b.date.localeCompare(a.date))[0]?.weightKg ?? p?.weightKg ?? null;
  const bf = p ? bodyFatFor(p) : null;
  const days = dailyTotals(meals, from, today, p?.phase?.type ?? "mantenimiento", t.ok ? t.targets.kcal : 0, t.ok ? t.targets.protein_g : 0);
  return {
    name: profile.displayName,
    profile: p,
    age: p?.birthDate ? ageOn(p.birthDate, today) : null,
    complete: t.ok,
    missing: t.ok ? [] : t.missing,
    targets: t.ok ? t.targets : null,
    health: {
      weight,
      bmi: weight && p?.heightCm ? Math.round((weight / (p.heightCm / 100) ** 2) * 10) / 10 : null,
      bodyFat: bf,
      bodyFatMeasured: p?.bodyFatPct != null,
      leanMass: weight && bf != null ? Math.round(weight * (1 - bf / 100) * 10) / 10 : null,
    },
    game: gamification(days, today, realWeights.length),
  };
}

/** Calcula objetivos con cambios sin guardarlos (vista previa del perfil). */
export async function previewTargets(profile: Profile, patch: ProfilePatch) {
  const today = todayInBogota();
  const current = await getNutritionStore(profile).getProfile();
  const { profile: next, errors } = applyProfilePatch(current, patch, today);
  if (errors.length) return { ok: false as const, errors };
  const weights = [...(await recentWeights(profile))].sort((a, b) => b.date.localeCompare(a.date));
  const missing = missingForTargets(next, weights.length > 0);
  if (missing.length) return { ok: false as const, errors: [`Faltan: ${missing.join(", ")}`] };
  const from = shiftDate(today, -28);
  const dates = (await trainingDates(profile, today)).filter((d) => d > from && d <= today);
  const weightKg = weights[0]?.weightKg ?? next.weightKg!;
  const targets = computeTargets({ profile: next, weightKg, workoutDates: dates, today });
  const kgPerWeek = next.phase && next.phase.type !== "mantenimiento" && next.phase.type !== "recomposicion" ? Math.round(((next.phase.ratePctPerWeek / 100) * weightKg) * 100) / 100 : 0;
  return { ok: true as const, targets, kgPerWeek };
}
