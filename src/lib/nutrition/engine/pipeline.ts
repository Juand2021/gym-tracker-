import { CORE_BY_KEY, DISH_BY_KEY } from "./core-foods.ts";
import { ZERO, round, scale, sum, validateItem, type Warning } from "./compute.ts";
import type { FoodDb } from "./db.ts";
import { resolveGrams, type GramsBasis } from "./portions.ts";
import { searchFoods, type SearchHit } from "./search.ts";
import type { CoreFood, FoodRecord, Nutrients, PortionUnit } from "./types.ts";

/** Un ítem tal como lo entiende el lector (LLM o reglas), antes de buscarlo en la base. */
export type ParsedItem = {
  /** Cómo lo dijo la persona, en español. */
  name: string;
  /** Nombre estilo USDA en inglés, ayuda a la búsqueda. */
  name_en?: string | null;
  /** Clave del núcleo si el lector la reconoció. */
  core_key?: string | null;
  quantity?: number | null;
  unit?: PortionUnit | null;
  grams?: number | null;
  /** "template" cuando los gramos vienen de la plantilla del plato y no de la persona. */
  grams_from?: "said" | "template" | null;
  size?: "pequeno" | "mediano" | "grande" | null;
  state?: "crudo" | "cocido" | null;
  method?: CookingMethod | null;
  /** Plato del que sale este componente (corrientazo, bandeja paisa…). */
  from_dish?: string | null;
  /** 0–1: qué tan seguro está el lector. */
  confidence?: number;
  /** Supuesto hecho, en lenguaje simple ("supuse arroz blanco"). */
  assumption?: string | null;
  /** Gramos que estimó el LLM si no hay otra fuente. */
  llm_grams?: number | null;
};

export type CookingMethod = "frito" | "apanado" | "salteado" | "asado" | "plancha" | "sudado" | "guisado" | "hervido" | "horneado" | "crudo";

export type MealParser = (text: string) => Promise<ParsedItem[]>;

/** Elige el mejor candidato de la búsqueda (LLM). Devuelve un id o null si ninguno sirve. */
export type Reranker = (item: ParsedItem, candidates: FoodRecord[]) => Promise<string | null>;

export type MealItemResult = {
  name: string;
  recordId: string | null;
  recordName: string;
  coreKey: string | null;
  grams: number;
  gramsBasis: GramsBasis;
  gramsNote: string;
  nutrients: Nutrients;
  confidence: number;
  assumption: string | null;
  fromDish: string | null;
  /** Aceite de cocción agregado por el motor (los LLM suelen olvidarlo). */
  addedOil: boolean;
  warnings: Warning[];
};

export type MealResult = {
  items: MealItemResult[];
  totals: Nutrients;
  /** Como máximo una pregunta: la del ítem con más kcal en juego. */
  question: string | null;
};

/** Gramos de aceite que absorbe cada 100 g de alimento según el método (si el valor no lo trae ya). */
const OIL_PER_100G: Partial<Record<CookingMethod, number>> = { frito: 8, apanado: 12, salteado: 4 };
const OIL_CATEGORIES = new Set(["carne", "pollo", "pescado", "huevo", "verdura", "tuberculo", "platano"]);

export function oilFor(method: CookingMethod | null | undefined, core: CoreFood | undefined, grams: number): number {
  if (!method || !core || core.fatIncluded || !OIL_CATEGORIES.has(core.category)) return 0;
  return Math.round(((OIL_PER_100G[method] ?? 0) * grams) / 100);
}

export type PipelineDeps = {
  db: FoodDb;
  parser: MealParser;
  reranker?: Reranker;
  /** Búsqueda alternativa/híbrida; por defecto BM25. */
  search?: (query: string, limit: number) => SearchHit[] | Promise<SearchHit[]>;
};

async function matchRecord(item: ParsedItem, deps: PipelineDeps): Promise<{ record: FoodRecord | null; core?: CoreFood }> {
  const { db } = deps;
  if (item.core_key && CORE_BY_KEY.has(item.core_key)) {
    const record = db.resolveCore(item.core_key) ?? null;
    return { record, core: CORE_BY_KEY.get(item.core_key) };
  }
  const query = [item.name, item.name_en ?? ""].join(" ");
  const hits = deps.search ? await deps.search(query, 25) : searchFoods(db, query, 25);
  const candidates = hits.map((h) => db.byId.get(h.id)).filter((r): r is FoodRecord => !!r);
  if (!candidates.length) return { record: null };
  let chosen: FoodRecord | null = candidates[0];
  if (deps.reranker) {
    const id = await deps.reranker(item, candidates);
    chosen = id ? (db.byId.get(id) ?? null) : null;
  }
  return { record: chosen, core: chosen ? db.coreOf(chosen.id) : undefined };
}

export async function analyzeMeal(text: string, deps: PipelineDeps): Promise<MealResult> {
  const parsed = await deps.parser(text);
  const items: MealItemResult[] = [];
  const oilRecord = deps.db.resolveCore("aceite");

  for (const it of parsed) {
    const { record, core } = await matchRecord(it, deps);
    const portion = resolveGrams(
      { grams: it.grams, gramsFrom: it.grams_from ?? "said", quantity: it.quantity, unit: it.unit, size: it.size, llmGrams: it.llm_grams },
      core,
      record ?? undefined,
    );
    const per100g = record?.per100g;
    items.push({
      name: it.name,
      recordId: record?.id ?? null,
      recordName: record ? record.name_es || record.name_en || record.id : "Sin coincidencia",
      coreKey: core?.key ?? null,
      grams: portion.grams,
      gramsBasis: portion.basis,
      gramsNote: portion.note,
      nutrients: per100g ? round(scale(per100g, portion.grams)) : { ...ZERO },
      confidence: record ? (it.confidence ?? 0.7) : 0,
      assumption: it.assumption ?? null,
      fromDish: it.from_dish ?? null,
      addedOil: false,
      warnings: per100g ? validateItem(per100g, portion.grams, core?.category === "bebida" || core?.category === "alcohol") : [],
    });

    const oil = oilFor(it.method, core, portion.grams);
    if (oil > 0 && oilRecord) {
      items.push({
        name: `Aceite de cocción (${it.name})`,
        recordId: oilRecord.id,
        recordName: oilRecord.name_es,
        coreKey: "aceite",
        grams: oil,
        gramsBasis: "generic",
        gramsNote: `Aceite que absorbe al estar ${it.method}`,
        nutrients: round(scale(oilRecord.per100g, oil)),
        confidence: 0.6,
        assumption: "Se suma el aceite que absorbe al cocinarse",
        fromDish: it.from_dish ?? null,
        addedOil: true,
        warnings: [],
      });
    }
  }

  const totals = round(sum(items.map((i) => i.nutrients)));
  return { items, totals, question: pickQuestion(items) };
}

/** Pregunta solo por el ítem dudoso con más calorías en juego (≥150 kcal). */
function pickQuestion(items: MealItemResult[]): string | null {
  const doubtful = items
    .filter((i) => !i.addedOil && (i.recordId === null || (i.gramsBasis !== "said" && i.confidence < 0.6)))
    .sort((a, b) => b.nutrients.kcal - a.nutrients.kcal)[0];
  if (!doubtful) return null;
  if (doubtful.recordId === null) return `No encontré "${doubtful.name}". ¿Qué era exactamente?`;
  if (doubtful.nutrients.kcal < 150) return null;
  return `¿Cuánto ${doubtful.name} fue más o menos? Supuse ${doubtful.grams} g.`;
}

/** Expande una plantilla de plato en sus componentes (lo usan el lector por reglas y los tests). */
export function expandDish(
  dishKey: string,
  opts: { overrides?: Record<string, string>; omit?: string[]; grams?: Record<string, number>; factor?: number } = {},
): ParsedItem[] {
  const dish = DISH_BY_KEY.get(dishKey);
  if (!dish) return [];
  const factor = opts.factor ?? 1;
  return dish.components
    .filter((c) => !opts.omit?.includes(c.slot))
    .map((c) => {
      const key = opts.overrides?.[c.slot] ?? c.coreKey;
      const core = CORE_BY_KEY.get(key);
      // Si cambió el componente (papa en vez de maduro), se usa la porción típica del nuevo alimento.
      const swapped =
        key !== c.coreKey && core
          ? (core.portions.find((p) => p.unit === "porcion") ?? core.portions.find((p) => p.unit === core.defaultUnit) ?? core.portions[0])
          : undefined;
      const baseGrams = swapped && core?.defaultUnit !== "cucharadita" ? swapped.grams : c.grams;
      return {
        name: core?.name ?? key,
        core_key: key,
        grams: opts.grams?.[c.slot] ?? Math.round(baseGrams * factor),
        grams_from: opts.grams?.[c.slot] ? ("said" as const) : ("template" as const),
        from_dish: dish.key,
        confidence: 0.7,
        assumption: opts.grams?.[c.slot] ? null : `${c.slot}: porción típica del plato`,
      };
    });
}
