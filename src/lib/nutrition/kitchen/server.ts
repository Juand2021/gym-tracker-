import { getDb, isFirebaseConfigured } from "@/lib/firebase";
import type { Profile } from "@/lib/profiles";
import { cachedRead, forgetCached } from "@/lib/server-cache";
import { getServerFoodDb } from "../db-server.ts";
import { normalize as normalizeText } from "../engine/text.ts";
import { shiftDate } from "../views.ts";
import type { KitchenChatTools } from "../chat-tools.ts";
import { EMPTY_PROFILE, timeInBogota, todayInBogota, type NutritionProfile } from "../profile.ts";
import { getNutritionStore, targetsFor } from "../server.ts";
import { newId, sumTotals, type Meal, type MealMoment, type StoredItem } from "../store.ts";
import { GROUP_LABEL, INGREDIENT_BY_KEY, INGREDIENTS, findIngredients, type PantryGroup } from "./ingredients.ts";
import { LIBRARY } from "./library.ts";
import { countReady, matchRecipe, type KitchenPrefs, type RecipeMatch } from "./match.ts";
import { formatAmount, per100gFromDb, recipeNutrition, type Per100gOf, type RecipeLine } from "./nutrition.ts";
import { parseOwnRecipe, proposeRecipe, resolveRecipe, sanitizeRecipe, toRaw } from "./authoring.ts";
import { getNutritionAiClient } from "../ai-client.ts";
import { hungrySnacks, kindForSlot, planDay, rankForSlot, remainingSlots, slotsFor, splitTargets, unassigned, type RecipePick, type PlanContext, type SlotTarget } from "./planner.ts";
import { ALL_EQUIPMENT, type Equipment, type Recipe } from "./recipes.ts";
import { scaleRecipe, type ScaledRecipe } from "./scale.ts";
import { recipeState, type KitchenState, type PlanSlotKind, type RecipeState, type WeekPlan } from "./state.ts";
import { buildWeekPlan, shoppingList, weekStartOf } from "./week.ts";

/**
 * Cocina en el servidor (Planes): despensa, biblioteca de recetas, detalle ajustado al día y registro.
 * Lecturas: `kitchen/main` (1) + recetas propias (pocas) con la caché de 60 s del servidor.
 */

export class KitchenError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

async function foodDbOrThrow() {
  const db = await getServerFoodDb(isFirebaseConfigured() ? () => getDb() as never : undefined);
  if (!db) throw new KitchenError("La base de alimentos no está disponible todavía.", 503);
  return db;
}

export function getKitchen(profile: Profile): Promise<KitchenState> {
  return cachedRead(`${profile.id}:kitchen`, () => getNutritionStore(profile).getKitchen());
}

async function saveKitchen(profile: Profile, k: KitchenState) {
  await getNutritionStore(profile).saveKitchen({ ...k, updatedAt: new Date().toISOString() });
  forgetCached(profile.id);
}

/** Biblioteca + recetas propias y de la IA. */
export async function allRecipes(profile: Profile): Promise<Recipe[]> {
  const own = await cachedRead(`${profile.id}:recipes`, () => getNutritionStore(profile).listRecipes());
  return [...own, ...LIBRARY];
}

async function findRecipe(profile: Profile, id: string): Promise<Recipe> {
  const r = (await allRecipes(profile)).find((x) => x.id === id);
  if (!r) throw new KitchenError("Receta no encontrada", 404);
  return r;
}

function prefsFor(k: KitchenState, p: NutritionProfile | null): KitchenPrefs {
  const prof = p ?? EMPTY_PROFILE;
  return { pantry: new Set(k.pantry), equipment: k.equipment, dietStyle: prof.dietStyle, avoidFoods: prof.avoidFoods };
}

/** Lo que necesitan todas las vistas: base, cocina, perfil, objetivos y lo comido hoy. */
async function context(profile: Profile) {
  const today = todayInBogota();
  const store = getNutritionStore(profile);
  const [db, kitchen, recipes, t, meals] = await Promise.all([foodDbOrThrow(), getKitchen(profile), allRecipes(profile), targetsFor(profile, today), store.listMeals(today, today)]);
  const per100gOf = per100gFromDb(db);
  const prefs = prefsFor(kitchen, t.profile);
  const eaten = sumTotals(meals);
  const left = t.ok ? { kcal: Math.max(0, t.targets.kcal - eaten.kcal), protein_g: Math.max(0, t.targets.protein_g - eaten.protein_g) } : null;
  const ctx: PlanContext = { recipes, kitchen, prefs, per100gOf, today };
  return { today, kitchen, recipes, t, meals, eaten, left, per100gOf, prefs, ctx };
}

/** Contexto liviano (biblioteca y despensa): sin objetivos ni comidas del día. */
async function lightContext(profile: Profile) {
  const [db, kitchen, recipes, nprofile] = await Promise.all([foodDbOrThrow(), getKitchen(profile), allRecipes(profile), getNutritionStore(profile).getProfile()]);
  return { kitchen, recipes, per100gOf: per100gFromDb(db), prefs: prefsFor(kitchen, nprofile) };
}

// ───────── Vistas ─────────

export type RecipeCard = {
  id: string;
  name: string;
  description: string;
  kind: Recipe["kind"];
  minutes: number;
  difficulty: number;
  servings: number;
  equipment: Equipment[];
  tags: Recipe["tags"];
  source: Recipe["source"];
  kcal: number;
  protein_g: number;
  status: RecipeMatch["status"];
  missing: { key: string; name: string }[];
  blocked: RecipeMatch["blocked"];
  state: RecipeState;
};

function cardFor(r: Recipe, k: KitchenState, prefs: KitchenPrefs, per100gOf: Per100gOf): RecipeCard {
  const m = matchRecipe(r, prefs);
  const n = recipeNutrition(r, per100gOf, { swaps: m.swaps, withOptional: m.optionalAvailable });
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    kind: r.kind,
    minutes: r.minutes,
    difficulty: r.difficulty,
    servings: r.servings,
    equipment: r.equipment,
    tags: r.tags,
    source: r.source,
    kcal: n.totals.kcal,
    protein_g: Math.round(n.totals.protein_g),
    status: m.status,
    missing: m.missing.map((key) => ({ key, name: INGREDIENT_BY_KEY.get(key)?.name ?? key })),
    blocked: m.blocked,
    state: recipeState(k, r.id),
  };
}

/** Biblioteca con estado de despensa, kcal por porción y si la ha probado. */
export async function recipesView(profile: Profile) {
  const c = await lightContext(profile);
  const cards = c.recipes.map((r) => cardFor(r, c.kitchen, c.prefs, c.per100gOf)).filter((x) => !x.blocked || x.blocked.reason === "equipo");
  return { recipes: cards, readyCount: cards.filter((x) => !x.blocked && x.status === "ready").length };
}

export type RecipeDetail = {
  recipe: Recipe;
  card: RecipeCard;
  match: RecipeMatch;
  /** Una porción tal como está en la receta. */
  base: { totals: ScaledRecipe["totals"]; lines: (RecipeLine & { inPantry: boolean })[] };
  /** Una porción ajustada a la siguiente comida del día (si hay objetivos). */
  fitted: (RecipePick["scaled"] & { slot: PlanSlotKind; target: SlotTarget }) | null;
  left: { kcal: number; protein_g: number } | null;
};

export async function recipeDetail(profile: Profile, id: string): Promise<RecipeDetail> {
  const c = await context(profile);
  const recipe = c.recipes.find((x) => x.id === id);
  if (!recipe) throw new KitchenError("Receta no encontrada", 404);
  const match = matchRecipe(recipe, c.prefs);
  const opts = { swaps: match.swaps, withOptional: match.optionalAvailable };
  const base = recipeNutrition(recipe, c.per100gOf, opts);
  const have = (key: string) => {
    const ing = INGREDIENT_BY_KEY.get(key);
    return Boolean(ing?.staple) || c.kitchen.pantry.includes(key) || Boolean(ing?.buyAs && c.kitchen.pantry.includes(ing.buyAs));
  };
  let fitted: RecipeDetail["fitted"] = null;
  if (c.left && c.t.ok) {
    const slots = remainingSlots(c.t.profile.mealsPerDay, c.meals.map((m) => m.moment), timeInBogota());
    const targets = splitTargets(slots, c.left.kcal, c.left.protein_g, c.t.targets);
    // Si esa comida ya pasó (un desayuno de noche), se ajusta como si fuera la única, con su tope.
    const fallbackSlot: PlanSlotKind = recipe.kind === "snack" ? "snack" : recipe.kind === "desayuno" ? "desayuno" : "almuerzo";
    const target = targets.find((x) => kindForSlot(x.slot) === recipe.kind) ?? splitTargets([fallbackSlot], c.left.kcal, c.left.protein_g, c.t.targets)[0];
    const s = scaleRecipe(recipe, c.per100gOf, target, opts);
    fitted = { ...s, slot: target.slot, target };
  }
  return {
    recipe,
    card: cardFor(recipe, c.kitchen, c.prefs, c.per100gOf),
    match,
    base: { totals: base.totals, lines: base.lines.map((l) => ({ ...l, inPantry: have(l.key) })) },
    fitted,
    left: c.left,
  };
}

/** Plan del día con recetas. */
export async function recipePlan(profile: Profile) {
  const c = await context(profile);
  if (!c.t.ok || !c.left) return { ok: false as const, missing: c.t.ok ? [] : c.t.missing };
  const slots = remainingSlots(c.t.profile.mealsPerDay, c.meals.map((m) => m.moment), timeInBogota());
  const targets = splitTargets(slots, c.left.kcal, c.left.protein_g, c.t.targets);
  const plan = planDay(c.ctx, targets);
  const extra = unassigned(targets, c.left.kcal, c.left.protein_g);
  const view = (p: RecipePick) => ({
    card: cardFor(p.recipe, c.kitchen, c.prefs, c.per100gOf),
    kcal: p.scaled.totals.kcal,
    protein_g: Math.round(p.scaled.totals.protein_g),
    gramsPerServing: p.scaled.gramsPerServing,
    swaps: p.match.swaps,
    lines: p.scaled.lines.filter((l) => l.included && !l.staple).map((l) => ({ name: l.name, amount: l.amount })),
  });
  return {
    ok: true as const,
    left: c.left,
    target: { kcal: c.t.targets.kcal, protein_g: c.t.targets.protein_g },
    phase: c.t.profile.phase,
    /** Lo que sobra después de las comidas (topes): se sugiere un snack. */
    extra,
    slots: plan.map((s) => ({ slot: s.slot, kcal: s.kcal, protein_g: s.protein_g, pick: s.pick ? view(s.pick) : null, alternatives: s.alternatives.map(view) })),
  };
}

/** "Tengo hambre": 3 snacks que caben en lo que queda. */
export async function snackSuggestions(profile: Profile) {
  const c = await context(profile);
  const left = c.left ?? { kcal: 250, protein_g: 20 };
  const picks = hungrySnacks(c.ctx, left.kcal, left.protein_g);
  return {
    left: c.left,
    snacks: picks.map((p) => ({
      card: cardFor(p.recipe, c.kitchen, c.prefs, c.per100gOf),
      kcal: p.scaled.totals.kcal,
      protein_g: Math.round(p.scaled.totals.protein_g),
      gramsPerServing: p.scaled.gramsPerServing,
      swaps: p.match.swaps,
      lines: p.scaled.lines.filter((l) => l.included && !l.staple).map((l) => ({ name: l.name, amount: l.amount })),
    })),
    tip:
      c.left && c.left.kcal < 150
        ? "Ya casi llegas a tu límite: agua, un tinto o algo con mucha proteína y pocas kcal es lo mejor ahora."
        : "Primero un vaso de agua: a veces la sed se confunde con hambre.",
  };
}

// ───────── Despensa ─────────

export async function pantryView(profile: Profile) {
  const c = await lightContext(profile);
  const have = new Set(c.kitchen.pantry);
  const groups = (Object.keys(GROUP_LABEL) as PantryGroup[]).map((g) => ({
    group: g,
    label: GROUP_LABEL[g],
    // Las claras salen de los huevos: no se marcan aparte.
    items: INGREDIENTS.filter((i) => i.group === g && !i.buyAs).map((i) => ({ key: i.key, name: i.name, have: Boolean(i.staple) || have.has(i.key), staple: Boolean(i.staple) })),
  }));
  return { groups, equipment: c.kitchen.equipment, readyCount: countReady(c.recipes, c.prefs), total: c.recipes.length };
}

export type PantryPatch = { add?: string[]; remove?: string[]; set?: string[]; text?: string; equipment?: Equipment[] };

export async function updatePantry(profile: Profile, patch: PantryPatch) {
  const k = await getNutritionStore(profile).getKitchen();
  const valid = (keys: string[] | undefined) => (keys ?? []).filter((key) => INGREDIENT_BY_KEY.has(key) && !INGREDIENT_BY_KEY.get(key)!.staple);
  let pantry = patch.set ? valid(patch.set) : [...k.pantry];
  const fromText = patch.text ? findIngredients(patch.text).filter((i) => !i.staple).map((i) => i.key) : [];
  for (const key of [...valid(patch.add), ...fromText]) if (!pantry.includes(key)) pantry.push(key);
  const remove = new Set(valid(patch.remove));
  pantry = pantry.filter((key) => !remove.has(key));
  const equipment = patch.equipment ? patch.equipment.filter((e) => ALL_EQUIPMENT.includes(e)) : k.equipment;
  await saveKitchen(profile, { ...k, pantry, equipment, shoppingChecked: k.shoppingChecked.filter((x) => !pantry.includes(x)) });
  return { pantry, equipment, added: fromText };
}

// ───────── Estado de recetas y registro ─────────

export async function updateRecipeState(profile: Profile, id: string, patch: Partial<Pick<RecipeState, "tried" | "liked" | "favorite">>) {
  await findRecipe(profile, id);
  const k = await getNutritionStore(profile).getKitchen();
  const cur = recipeState(k, id);
  const next: RecipeState = {
    ...cur,
    ...(typeof patch.tried === "boolean" ? { tried: patch.tried } : {}),
    ...(patch.liked === -1 || patch.liked === 0 || patch.liked === 1 ? { liked: patch.liked, tried: true } : {}),
    ...(typeof patch.favorite === "boolean" ? { favorite: patch.favorite } : {}),
  };
  await saveKitchen(profile, { ...k, recipes: { ...k.recipes, [id]: next } });
  return next;
}

export type LogRecipeInput = {
  servings?: number;
  gramsPerServing?: Record<string, number>;
  swaps?: Record<string, string>;
  withOptional?: string[];
  moment?: MealMoment;
  date?: string;
};

const MOMENTS: MealMoment[] = ["desayuno", "almuerzo", "cena", "snack"];

function momentFor(r: Recipe, now: string): MealMoment {
  if (r.kind === "desayuno") return "desayuno";
  if (r.kind === "snack") return "snack";
  return now < "16:30" ? "almuerzo" : "cena";
}

/** Cifras de un registro (para la hoja de confirmación) sin guardar nada. */
export async function previewRecipeLog(profile: Profile, id: string, input: LogRecipeInput) {
  const recipe = await findRecipe(profile, id);
  const db = await foodDbOrThrow();
  return computeLog(recipe, per100gFromDb(db), input);
}

function computeLog(recipe: Recipe, per100gOf: Per100gOf, input: LogRecipeInput) {
  const servings = Math.min(4, Math.max(0.25, Number(input.servings) || 1));
  const swaps = Object.fromEntries(Object.entries(input.swaps ?? {}).filter(([a, b]) => INGREDIENT_BY_KEY.has(b) && recipe.ingredients.some((x) => x.key === a)));
  const gramsPerServing = Object.fromEntries(
    Object.entries(input.gramsPerServing ?? {}).filter(([k, g]) => recipe.ingredients.some((x) => x.key === k) && Number.isFinite(g) && g >= 0 && g <= 1500),
  );
  return recipeNutrition(recipe, per100gOf, { servings, swaps, withOptional: input.withOptional, gramsPerServing });
}

/** Alimentos y totales de una receta comida, listos para guardar como comida (o borrador del chat). */
export async function recipeMealParts(profile: Profile, id: string, input: LogRecipeInput) {
  const recipe = await findRecipe(profile, id);
  const db = await foodDbOrThrow();
  const per100gOf = per100gFromDb(db);
  const n = computeLog(recipe, per100gOf, input);
  const items: StoredItem[] = n.lines
    .filter((l) => l.included && l.grams > 0)
    .map((l) => {
      const ing = INGREDIENT_BY_KEY.get(l.key);
      const rec = ing?.ref ? db.byId.get(ing.ref) : ing?.core ? db.resolveCore(ing.core) : undefined;
      const nutrients = rec ? scaleTotals(rec.per100g, l.grams) : scaleTotals(ing?.per100g ?? null, l.grams);
      return {
        name: l.name,
        recordId: rec?.id ?? null,
        recordName: rec?.name_es ?? l.name,
        coreKey: ing?.core ?? null,
        grams: l.grams,
        gramsBasis: "recipe",
        gramsNote: `receta: ${recipe.name}`,
        nutrients,
        confidence: 1,
        assumption: null,
        fromDish: recipe.name,
        addedOil: false,
      };
    });
  const totals = { kcal: n.totals.kcal, protein_g: n.totals.protein_g, fat_g: n.totals.fat_g, carb_g: n.totals.carb_g, fiber_g: n.totals.fiber_g, alcohol_g: 0 };
  return { recipe, items, totals, servings: n.servings, text: n.servings === 1 ? recipe.name : `${recipe.name} (${String(n.servings).replace(".", ",")} porciones)` };
}

/** Registra una receta como comida, calculada en código (sin IA). Juan ya confirmó en la hoja. */
export async function logRecipe(profile: Profile, id: string, input: LogRecipeInput): Promise<Meal> {
  const { recipe, items, totals, text } = await recipeMealParts(profile, id, input);
  const now = new Date();
  const time = timeInBogota(now);
  const meal: Meal = {
    id: newId(),
    date: input.date && /^\d{4}-\d{2}-\d{2}$/.test(input.date) ? input.date : todayInBogota(now),
    time,
    moment: input.moment && MOMENTS.includes(input.moment) ? input.moment : momentFor(recipe, time),
    text,
    items,
    totals,
    engineVersion: "receta-1",
    chatThreadId: null,
    recipeId: recipe.id,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
  await getNutritionStore(profile).saveMeal(meal);
  await markCooked(profile, recipe.id, meal.date);
  return meal;
}

/** Suma una vez cocinada (y la marca como probada). */
export async function markCooked(profile: Profile, recipeId: string, date: string) {
  const k = await getNutritionStore(profile).getKitchen();
  const st = recipeState(k, recipeId);
  await saveKitchen(profile, { ...k, recipes: { ...k.recipes, [recipeId]: { ...st, tried: true, timesCooked: st.timesCooked + 1, lastCooked: date } } });
}

function scaleTotals(per100g: { kcal: number; protein_g: number; fat_g: number; carb_g: number; fiber_g: number; alcohol_g: number } | null, grams: number) {
  const f = grams / 100;
  const r = (x: number) => Math.round(x * f * 10) / 10;
  if (!per100g) return { kcal: 0, protein_g: 0, fat_g: 0, carb_g: 0, fiber_g: 0, alcohol_g: 0 };
  return { kcal: Math.round(per100g.kcal * f), protein_g: r(per100g.protein_g), fat_g: r(per100g.fat_g), carb_g: r(per100g.carb_g), fiber_g: r(per100g.fiber_g), alcohol_g: r(per100g.alcohol_g) };
}

// ───────── Inicio: "¿Qué como ahora?" ─────────

export type NextRecipe = {
  id: string;
  name: string;
  kind: Recipe["kind"];
  minutes: number;
  slot: PlanSlotKind;
  status: RecipeMatch["status"];
  missing: string[];
  kcal: number;
  protein_g: number;
  gramsPerServing: Record<string, number>;
  swaps: Record<string, string>;
  withOptional: string[];
  lines: { name: string; amount: string }[];
};

/**
 * La receta para la siguiente comida, con lo que el Inicio ya leyó (objetivos y comidas de hoy):
 * solo agrega la cocina y las recetas propias, que están en la caché.
 */
export async function nextRecipeSuggestion(profile: Profile, t: Extract<Awaited<ReturnType<typeof targetsFor>>, { ok: true }>, meals: Meal[]): Promise<NextRecipe | null> {
  const db = await getServerFoodDb(isFirebaseConfigured() ? () => getDb() as never : undefined);
  if (!db) return null;
  const [kitchen, recipes] = await Promise.all([getKitchen(profile), allRecipes(profile)]);
  const eaten = sumTotals(meals);
  const left = { kcal: Math.max(0, t.targets.kcal - eaten.kcal), protein_g: Math.max(0, t.targets.protein_g - eaten.protein_g) };
  if (left.kcal < 120) return null;
  const slots = remainingSlots(t.profile.mealsPerDay, meals.map((m) => m.moment), timeInBogota());
  const target = splitTargets(slots, left.kcal, left.protein_g, t.targets)[0];
  if (!target) return null;
  const ctx: PlanContext = { recipes, kitchen, prefs: prefsFor(kitchen, t.profile), per100gOf: per100gFromDb(db), today: todayInBogota() };
  const pick = planDay(ctx, [target], 0)[0]?.pick;
  if (!pick) return null;
  return {
    id: pick.recipe.id,
    name: pick.recipe.name,
    kind: pick.recipe.kind,
    minutes: pick.recipe.minutes,
    slot: target.slot,
    status: pick.match.status,
    missing: pick.match.missing.map((k) => INGREDIENT_BY_KEY.get(k)?.name ?? k),
    kcal: pick.scaled.totals.kcal,
    protein_g: Math.round(pick.scaled.totals.protein_g),
    gramsPerServing: pick.scaled.gramsPerServing,
    swaps: pick.match.swaps,
    withOptional: pick.match.optionalAvailable,
    lines: pick.scaled.lines.filter((l) => l.included && !l.staple).map((l) => ({ name: l.name, amount: l.amount })),
  };
}

export type RecipePlanData = Awaited<ReturnType<typeof recipePlan>>;

// ───────── Herramientas del chat ─────────

/** Lo que el chat de Comidas puede hacer con la cocina (chat-tools.ts → ToolContext.kitchen). */
export function chatKitchen(profile: Profile): KitchenChatTools {
  return {
    async search(query, kind, onlyReady) {
      const { recipes } = await recipesView(profile);
      const q = query ? normalizeText(query) : "";
      return recipes
        .filter((r) => !r.blocked)
        .filter((r) => !kind || r.kind === kind)
        .filter((r) => !onlyReady || r.status === "ready")
        .filter((r) => !q || q.split(" ").every((w) => normalizeText(`${r.name} ${r.description}`).includes(w)))
        .sort((a, b) => Number(b.state.favorite) - Number(a.state.favorite) || ({ ready: 0, almost: 1, missing: 2 }[a.status] - { ready: 0, almost: 1, missing: 2 }[b.status]))
        .slice(0, 6)
        .map((r) => ({
          receta_id: r.id,
          nombre: r.name,
          tipo: r.kind,
          minutos: r.minutes,
          kcal_porcion: r.kcal,
          proteina_g_porcion: r.protein_g,
          despensa: r.status === "ready" ? "tiene todo" : `le falta: ${r.missing.map((m) => m.name).join(", ")}`,
          ...(r.state.tried ? { probada: true } : {}),
          ...(r.state.favorite ? { favorita: true } : {}),
        }));
    },
    async pantry(addText, removeText) {
      const remove = removeText ? findIngredients(removeText).map((i) => i.key) : [];
      const res = await updatePantry(profile, { text: addText ?? undefined, remove });
      const view = await pantryView(profile);
      return {
        agregados: res.added.map((k) => INGREDIENT_BY_KEY.get(k)?.name ?? k),
        quitados: remove.map((k) => INGREDIENT_BY_KEY.get(k)?.name ?? k),
        recetas_listas: view.readyCount,
      };
    },
    async snacks() {
      const s = await snackSuggestions(profile);
      return {
        restante: s.left,
        consejo: s.tip,
        snacks: s.snacks.map((x) => ({ receta_id: x.card.id, nombre: x.card.name, kcal: x.kcal, proteina_g: x.protein_g, despensa: x.card.status === "ready" ? "tiene todo" : `le falta: ${x.card.missing.map((m) => m.name).join(", ")}`, cantidades: x.lines.map((l) => `${l.name}: ${l.amount}`) })),
      };
    },
    async plan() {
      const p = await recipePlan(profile);
      if (!p.ok) return null;
      return {
        restante: p.left,
        comidas: p.slots.map((s) => ({
          comida: s.slot,
          meta_kcal: s.kcal,
          meta_proteina_g: s.protein_g,
          receta: s.pick ? { receta_id: s.pick.card.id, nombre: s.pick.card.name, kcal: s.pick.kcal, proteina_g: s.pick.protein_g, minutos: s.pick.card.minutes, despensa: s.pick.card.status === "ready" ? "tiene todo" : `le falta: ${s.pick.card.missing.map((m) => m.name).join(", ")}`, cantidades: s.pick.lines.map((l) => `${l.name}: ${l.amount}`) } : null,
          otras: s.alternatives.map((a) => a.card.name),
        })),
        sobra: p.extra,
      };
    },
    async recipeMeal(idOrName, servings, fitted) {
      const found = resolveRecipe(await allRecipes(profile), idOrName);
      if ("candidatas" in found) return found;
      const id = found.id;
      let input: LogRecipeInput = { servings };
      if (fitted) {
        const d = await recipeDetail(profile, id);
        if (d.fitted) input = { servings, gramsPerServing: d.fitted.gramsPerServing, swaps: d.match.swaps, withOptional: d.match.optionalAvailable };
        else input = { servings, swaps: d.match.swaps, withOptional: d.match.optionalAvailable };
      }
      const parts = await recipeMealParts(profile, id, input);
      return { recipeId: parts.recipe.id, kind: parts.recipe.kind, text: parts.text, items: parts.items, totals: parts.totals };
    },
    markCooked: (recipeId, date) => markCooked(profile, recipeId, date),
    async propose(kind, wish) {
      const p = await proposeRecipeFor(profile, kind, wish);
      const saved = await saveOwnRecipe(profile, p.recipe);
      return describeSaved(saved, p);
    },
    async saveText(text) {
      const p = await readOwnRecipe(profile, text);
      const saved = await saveOwnRecipe(profile, p.recipe);
      return describeSaved(saved, p);
    },
  };
}

// ───────── Semana y lista de compras ─────────

/** Lo que necesita la semana: objetivos de hoy (se usan para todos los días), cocina y recetas. */
async function weekContext(profile: Profile) {
  const c = await context(profile);
  if (!c.t.ok) throw new KitchenError(`Para armar la semana falta completar tu perfil: ${c.t.missing.join(", ")}.`, 400);
  return { ...c, profileN: c.t.profile, daily: { kcal: c.t.targets.kcal, protein_g: c.t.targets.protein_g } };
}

function weekViewOf(weekStart: string, plan: WeekPlan | null, recipes: Recipe[], kitchen: KitchenState, daily: { kcal: number; protein_g: number }, today: string) {
  const byId = new Map(recipes.map((r) => [r.id, r]));
  const shopping = plan ? shoppingList(plan, byId, new Set(kitchen.pantry), new Set(kitchen.shoppingChecked), today) : null;
  return {
    weekStart,
    today,
    daily,
    plan: plan
      ? {
          weekStart: plan.weekStart,
          updatedAt: plan.updatedAt,
          days: plan.days.map((d) => ({
            date: d.date,
            kcal: d.slots.reduce((a, s) => a + s.kcal, 0),
            protein_g: d.slots.reduce((a, s) => a + s.protein_g, 0),
            slots: d.slots.map((s) => {
              const r = s.recipeId ? byId.get(s.recipeId) : undefined;
              return { slot: s.slot, recipeId: s.recipeId, name: r?.name ?? null, kind: r?.kind ?? null, minutes: r?.minutes ?? null, kcal: s.kcal, protein_g: s.protein_g, leftoverOf: s.leftoverOf ?? null, servings: r?.servings ?? 1 };
            }),
          })),
        }
      : null,
    shopping,
  };
}

export type WeekView = ReturnType<typeof weekViewOf>;

/** El domingo se planea la semana que empieza mañana. */
function defaultWeekStart(today: string): string {
  const monday = weekStartOf(today);
  return shiftDate(today, 0) === shiftDate(monday, 6) ? shiftDate(monday, 7) : monday;
}

export async function weekView(profile: Profile, start?: string): Promise<WeekView> {
  const c = await context(profile);
  const weekStart = start && /^\d{4}-\d{2}-\d{2}$/.test(start) ? weekStartOf(start) : defaultWeekStart(c.today);
  const plan = await cachedRead(`${profile.id}:week:${weekStart}`, () => getNutritionStore(profile).getWeekPlan(weekStart));
  const daily = c.t.ok ? { kcal: c.t.targets.kcal, protein_g: c.t.targets.protein_g } : { kcal: 0, protein_g: 0 };
  return weekViewOf(weekStart, plan, c.recipes, c.kitchen, daily, c.today);
}

/** Arma (o vuelve a armar) la semana desde hoy; los días pasados quedan como estaban. */
export async function generateWeek(profile: Profile, start?: string): Promise<WeekView> {
  const c = await weekContext(profile);
  const weekStart = start && /^\d{4}-\d{2}-\d{2}$/.test(start) ? weekStartOf(start) : defaultWeekStart(c.today);
  const fresh = buildWeekPlan({ ctx: c.ctx, start: weekStart, mealsPerDay: c.profileN.mealsPerDay, daily: c.daily, fromDate: c.today });
  const old = await getNutritionStore(profile).getWeekPlan(weekStart);
  if (old) {
    fresh.createdAt = old.createdAt;
    fresh.days = fresh.days.map((d) => (d.date < c.today ? (old.days.find((o) => o.date === d.date) ?? d) : d));
  }
  await getNutritionStore(profile).saveWeekPlan(fresh);
  forgetCached(profile.id);
  return weekViewOf(weekStart, fresh, c.recipes, c.kitchen, c.daily, c.today);
}

/** Opciones para cambiar una comida de la semana (ordenadas para ese día). */
export async function weekSlotOptions(profile: Profile, start: string, date: string, index: number) {
  const c = await weekContext(profile);
  const plan = await getNutritionStore(profile).getWeekPlan(weekStartOf(start));
  const slot = plan?.days.find((d) => d.date === date)?.slots[index];
  if (!slot) throw new KitchenError("No encontré esa comida en el plan", 404);
  const target = splitTargets(slotsFor(c.profileN.mealsPerDay), c.daily.kcal, c.daily.protein_g, c.daily)[index] ?? { slot: slot.slot, kcal: slot.kcal, protein_g: slot.protein_g };
  return rankForSlot({ ...c.ctx, today: date }, target, new Set(), { shopping: true })
    .slice(0, 12)
    .map((p) => ({ card: cardFor(p.recipe, c.kitchen, c.prefs, c.per100gOf), kcal: p.scaled.totals.kcal, protein_g: Math.round(p.scaled.totals.protein_g) }));
}

/** Cambia la receta de una comida de la semana (ajustada a esa comida). */
export async function setWeekSlot(profile: Profile, start: string, date: string, index: number, recipeId: string): Promise<WeekView> {
  const c = await weekContext(profile);
  const weekStart = weekStartOf(start);
  const plan = await getNutritionStore(profile).getWeekPlan(weekStart);
  const day = plan?.days.find((d) => d.date === date);
  const slot = day?.slots[index];
  if (!plan || !day || !slot) throw new KitchenError("No encontré esa comida en el plan", 404);
  const recipe = c.recipes.find((r) => r.id === recipeId);
  if (!recipe) throw new KitchenError("Receta no encontrada", 404);
  const target = splitTargets(slotsFor(c.profileN.mealsPerDay), c.daily.kcal, c.daily.protein_g, c.daily)[index] ?? { slot: slot.slot, kcal: slot.kcal, protein_g: slot.protein_g };
  const m = matchRecipe(recipe, c.prefs);
  const s = scaleRecipe(recipe, c.per100gOf, target, { swaps: m.swaps });
  // Si cambia una comida que era meal prep, las sobras que dependían de ella se quedan sin receta.
  for (const d of plan.days) for (const x of d.slots) if (x.leftoverOf === date && x.slot === slot.slot && x.recipeId === slot.recipeId && d.date !== date) Object.assign(x, { recipeId: null, kcal: 0, protein_g: 0, leftoverOf: null });
  day.slots[index] = { slot: slot.slot, recipeId, gramsPerServing: s.gramsPerServing, swaps: m.swaps, leftoverOf: null, kcal: s.totals.kcal, protein_g: Math.round(s.totals.protein_g) };
  plan.updatedAt = new Date().toISOString();
  await getNutritionStore(profile).saveWeekPlan(plan);
  forgetCached(profile.id);
  return weekViewOf(weekStart, plan, c.recipes, c.kitchen, c.daily, c.today);
}

/** Marca o desmarca algo de la lista de compras. */
export async function toggleShopping(profile: Profile, key: string, checked: boolean) {
  if (!INGREDIENT_BY_KEY.has(key)) throw new KitchenError("Ingrediente desconocido");
  const k = await getNutritionStore(profile).getKitchen();
  const set = new Set(k.shoppingChecked);
  if (checked) set.add(key);
  else set.delete(key);
  await saveKitchen(profile, { ...k, shoppingChecked: [...set] });
  return { checked: [...set] };
}

/** "Ya compré": lo marcado pasa a la despensa. */
export async function shoppingToPantry(profile: Profile) {
  const k = await getNutritionStore(profile).getKitchen();
  const pantry = [...new Set([...k.pantry, ...k.shoppingChecked])];
  await saveKitchen(profile, { ...k, pantry, shoppingChecked: [] });
  return { added: k.shoppingChecked.length };
}

// ───────── Recetas propias y de la IA ─────────

function aiOrThrow() {
  const ai = getNutritionAiClient();
  if (!ai) throw new KitchenError("La IA no está configurada (faltan las variables de Azure OpenAI).", 503);
  return ai;
}

/** Vista previa de una receta sin guardar: nutrientes por porción y avisos. */
async function preview(profile: Profile, recipe: Recipe, warnings: string[]) {
  const c = await context(profile);
  return { recipe, card: cardFor(recipe, c.kitchen, c.prefs, c.per100gOf), lines: recipeNutrition(recipe, c.per100gOf).lines.map((l) => ({ name: l.name, amount: formatAmount(INGREDIENT_BY_KEY.get(l.key), l.grams * recipe.servings), optional: l.optional, staple: l.staple })), warnings };
}

export type RecipePreview = Awaited<ReturnType<typeof preview>>;

/** Lee una receta escrita por la persona (no guarda nada). */
export async function readOwnRecipe(profile: Profile, text: string): Promise<RecipePreview> {
  const clean = text.trim().slice(0, 4000);
  if (clean.length < 15) throw new KitchenError("Escribe la receta con sus ingredientes (y si puedes, los pasos).");
  const raw = await parseOwnRecipe(aiOrThrow(), clean);
  const { recipe, warnings } = sanitizeRecipe(raw, "mia");
  return preview(profile, recipe, warnings);
}

/** La IA propone una receta nueva con lo que hay en casa (no guarda nada). */
export async function proposeRecipeFor(profile: Profile, kind: Recipe["kind"] | null, wish: string | null): Promise<RecipePreview> {
  const c = await context(profile);
  if (c.kitchen.pantry.length < 2) throw new KitchenError("Marca primero lo que tienes en la despensa: así la receta sale con eso.");
  let target: { kcal: number; protein_g: number } | null = null;
  if (c.t.ok) {
    const slot: PlanSlotKind = kind === "desayuno" ? "desayuno" : kind === "snack" ? "snack" : "almuerzo";
    const t = splitTargets([slot], c.t.targets.kcal, c.t.targets.protein_g, c.t.targets)[0];
    target = { kcal: t.kcal, protein_g: t.protein_g };
  }
  const raw = await proposeRecipe(aiOrThrow(), {
    kind,
    wish: wish?.trim().slice(0, 200) || null,
    pantry: c.kitchen.pantry,
    equipment: c.kitchen.equipment,
    dietStyle: c.prefs.dietStyle,
    avoidFoods: c.prefs.avoidFoods,
    target,
    existing: c.recipes.map((r) => r.name),
  });
  const { recipe, warnings } = sanitizeRecipe(raw, "ia");
  return preview(profile, recipe, warnings);
}

/** Guarda una receta propia o de la IA (se vuelve a validar). */
export async function saveOwnRecipe(profile: Profile, recipe: Recipe): Promise<Recipe> {
  if (recipe.source === "nutriverse") throw new KitchenError("Las recetas de la biblioteca no se editan");
  const existing = (await allRecipes(profile)).find((r) => r.id === recipe.id);
  if (existing?.source === "nutriverse") throw new KitchenError("Ese id es de la biblioteca");
  const { recipe: clean } = sanitizeRecipe(toRaw(recipe), recipe.source === "ia" ? "ia" : "mia", existing ? recipe.id : undefined);
  if (existing?.createdAt) clean.createdAt = existing.createdAt;
  await getNutritionStore(profile).saveRecipe(clean);
  forgetCached(profile.id);
  return clean;
}

export async function deleteOwnRecipe(profile: Profile, id: string) {
  const r = await findRecipe(profile, id);
  if (r.source === "nutriverse") throw new KitchenError("Las recetas de la biblioteca no se borran; márcala 'No es para mí'.");
  await getNutritionStore(profile).deleteRecipe(id);
  forgetCached(profile.id);
}

function describeSaved(saved: Recipe, p: RecipePreview) {
  return {
    receta_id: saved.id,
    nombre: saved.name,
    minutos: saved.minutes,
    porciones: saved.servings,
    kcal_porcion: p.card.kcal,
    proteina_g_porcion: p.card.protein_g,
    despensa: p.card.status === "ready" ? "tiene todo" : `le falta: ${p.card.missing.map((m) => m.name).join(", ")}`,
    ingredientes: p.lines.filter((l) => !l.staple).map((l) => `${l.name}: ${l.amount}`),
    pasos: saved.steps.map((s) => s.text),
    ...(p.warnings.length ? { avisos: p.warnings } : {}),
  };
}

