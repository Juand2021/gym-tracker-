import { CORE_BY_KEY, CORE_FOODS, DISH_BY_KEY, DISH_TEMPLATES } from "./core-foods.ts";
import { expandDish, type CookingMethod, type MealParser, type ParsedItem } from "./pipeline.ts";
import { normalize, parseQuantity, stem } from "./text.ts";
import type { PortionUnit } from "./types.ts";

/**
 * Lector de comidas por reglas: reconoce los alimentos del núcleo y los platos por sus
 * sinónimos, y lee cantidades/unidades/gramos alrededor. No usa IA.
 * Sirve de línea base del banco de pruebas y de respaldo si la IA no está disponible.
 */

type Alias = { text: string; kind: "food" | "dish"; key: string };

const UNIT_WORDS: Record<string, PortionUnit> = {
  plato: "plato", platos: "plato", porcion: "porcion", porciones: "porcion", pedazo: "porcion", pedazos: "porcion",
  trozo: "porcion", trozos: "porcion", vaso: "vaso", vasos: "vaso", pocillo: "pocillo", pocillos: "pocillo",
  taza: "taza", tazas: "taza", cucharada: "cucharada", cucharadas: "cucharada", cucharadita: "cucharadita",
  cucharaditas: "cucharadita", cucharon: "cucharon", cucharones: "cucharon", tajada: "tajada", tajadas: "tajada",
  rebanada: "rebanada", rebanadas: "rebanada", presa: "presa", presas: "presa", lata: "lata", latas: "lata",
  botella: "botella", botellas: "botella", trago: "trago", tragos: "trago", shot: "trago", shots: "trago",
  copa: "copa", copas: "copa", scoop: "scoop", scoops: "scoop", sobre: "sobre", sobres: "sobre",
  paquete: "paquete", paquetes: "paquete", paquetico: "paquete", punado: "punado", punados: "punado",
  bola: "bola", bolas: "bola", unidad: "unidad", unidades: "unidad", media: "media", medio: "media",
};

const SIZE_WORDS: Record<string, ParsedItem["size"]> = {
  pequeno: "pequeno", pequena: "pequeno", chiquito: "pequeno", chiquita: "pequeno", pequenito: "pequeno",
  mediano: "mediano", mediana: "mediano", grande: "grande", grandote: "grande", grandota: "grande",
  poquito: "pequeno", poquita: "pequeno", poco: "pequeno", poca: "pequeno", harto: "grande", harta: "grande", bastante: "grande",
};

/** Palabras que no son alimentos: no se buscan en la base. */
const FILLER = new Set([
  "almorce", "almuerzo", "desayune", "desayuno", "cene", "comida", "comi", "tome", "unos", "unas", "todo", "toda",
  "restaurante", "casa", "despues", "final", "luego", "ayer", "noche", "tarde", "manana", "como", "menos", "rico",
  "caliente", "frio", "fria", "natural", "italiano", "italiana", "tipo", "estilo", "algo", "otra", "otro", "sobro",
  "sobras", "quedaba", "medio", "media", "mitad", "porfa", "domicilio", "pedi", "combo", "bebi", "tomamos",
]);

const METHOD_WORDS: [RegExp, CookingMethod][] = [
  [/\bapanad[oa]s?\b/, "apanado"],
  [/\bfrit[oa]s?\b/, "frito"],
  [/\bsaltead[oa]s?\b/, "salteado"],
];

function buildAliases(): Alias[] {
  const list: Alias[] = [];
  for (const f of CORE_FOODS) for (const a of [f.key.replace(/_/g, " "), ...f.aliases]) list.push({ text: normalize(a), kind: "food", key: f.key });
  for (const d of DISH_TEMPLATES) for (const a of d.aliases) list.push({ text: normalize(a), kind: "dish", key: d.key });
  // Más largo primero: "papa criolla" gana sobre "papa".
  return list.filter((a) => a.text).sort((a, b) => b.text.length - a.text.length);
}
const ALIASES = buildAliases();

type Match = { start: number; end: number; alias: Alias };

function findMatches(text: string): Match[] {
  const taken = new Array(text.length).fill(false);
  const matches: Match[] = [];
  for (const alias of ALIASES) {
    let from = 0;
    while (true) {
      const i = text.indexOf(alias.text, from);
      if (i < 0) break;
      from = i + 1;
      const j = i + alias.text.length;
      const okLeft = i === 0 || !/[a-z0-9]/.test(text[i - 1]);
      // Permite plurales simples: "arepa" encaja en "arepas".
      let end = j;
      if (text.slice(j, j + 2) === "es" && !/[a-z]/.test(text[j + 2] ?? " ")) end = j + 2;
      else if (text[j] === "s" && !/[a-z]/.test(text[j + 1] ?? " ")) end = j + 1;
      const okRight = end >= text.length || !/[a-z0-9]/.test(text[end]);
      if (!okLeft || !okRight) continue;
      if (taken.slice(i, end).some(Boolean)) continue;
      for (let k = i; k < end; k++) taken[k] = true;
      matches.push({ start: i, end, alias });
    }
  }
  matches.sort((a, b) => a.start - b.start);
  // "2 tajadas de queso": "tajadas" es la unidad del siguiente alimento, no plátano maduro.
  const filtered = matches.filter((m, i) => {
    const next = matches[i + 1];
    return !(next && m.alias.text in UNIT_WORDS && /^\s+de\s+$/.test(text.slice(m.end, next.start)));
  });
  // "yogurt alpina": dos sinónimos seguidos del mismo alimento son un solo ítem.
  const merged: Match[] = [];
  for (const m of filtered) {
    const prev = merged[merged.length - 1];
    if (prev && prev.alias.key === m.alias.key && /^\s*(?:tipo|estilo|marca|de)?\s*$/.test(text.slice(prev.end, m.start))) prev.end = m.end;
    else merged.push({ ...m });
  }
  return merged;
}

const SEPARATORS = /[,;.+:()\n]| y | con | mas | sin /;

/** Trozos del texto sin ningún alimento reconocido: se buscan en la base completa. */
function unmatchedSegments(text: string, matches: Match[]): ParsedItem[] {
  const covered = new Array(text.length).fill(false);
  for (const m of matches) for (let k = m.start; k < m.end; k++) covered[k] = true;
  const out: ParsedItem[] = [];
  let pos = 0;
  for (const seg of text.split(SEPARATORS)) {
    const start = text.indexOf(seg, pos);
    pos = start + seg.length;
    if (!seg.trim() || covered.slice(start, start + seg.length).some(Boolean)) continue;
    const words = seg
      .replace(/\d+(?:[.,]\d+)?\s*(?:g|gr|grs|gramos|ml|cc|kg|l)\b/g, " ")
      .split(" ")
      .filter((w) => w.length >= 4 && !/\d/.test(w) && !(w in UNIT_WORDS) && !(w in SIZE_WORDS) && !FILLER.has(w) && parseQuantity(w) === null);
    if (!words.length) continue;
    out.push({ name: words.join(" "), core_key: null, ...readBefore(seg.replace(words.join(" "), "")), grams: gramsIn(seg), confidence: 0.4 });
  }
  return out;
}

const GRAMS_RE = /(\d+(?:[.,]\d+)?)\s*(?:g|gr|grs|gramos|ml|mililitros|cc)\b/;
const LITERS_RE = /(\d+(?:[.,]\d+)?|medio|un)\s*(?:l|lt|litros?)\b/;

function gramsIn(s: string): number | null {
  const g = s.match(GRAMS_RE);
  if (g) return Number(g[1].replace(",", "."));
  const l = s.match(LITERS_RE);
  if (l) return (l[1] === "medio" ? 0.5 : l[1] === "un" ? 1 : Number(l[1].replace(",", "."))) * 1000;
  return null;
}

/** Lee cantidad, unidad y tamaño en las últimas palabras antes del alimento. */
function readBefore(window: string): Pick<ParsedItem, "quantity" | "unit" | "size" | "grams"> {
  const out: Pick<ParsedItem, "quantity" | "unit" | "size" | "grams"> = {};
  const tail = window.split(/[,;.+]| y | con | mas /).pop() ?? "";
  const grams = gramsIn(tail);
  if (grams) out.grams = grams;
  const words = tail.trim().split(" ").filter(Boolean).slice(-5);
  for (const w of words) {
    if (w in UNIT_WORDS && !out.unit) {
      out.unit = UNIT_WORDS[w];
      continue;
    }
    if (w in SIZE_WORDS) out.size = SIZE_WORDS[w];
    const q = parseQuantity(w);
    if (q !== null && out.quantity == null) out.quantity = q;
  }
  // "media" como cantidad delante de una unidad ("media taza") en vez de unidad.
  if (out.unit === "media" && words.some((w) => w in UNIT_WORDS && UNIT_WORDS[w] !== "media")) {
    out.quantity = 0.5;
    out.unit = UNIT_WORDS[words.filter((w) => w in UNIT_WORDS && UNIT_WORDS[w] !== "media").pop()!];
  }
  if (out.grams) {
    delete out.quantity;
    delete out.unit;
  }
  return out;
}

export const parseWithRules: MealParser = async (raw) => {
  const text = normalize(raw);
  const matches = findMatches(text);
  const items: ParsedItem[] = [];
  let dish: { key: string; overrides: Record<string, string>; omit: string[]; grams: Record<string, number>; factor: number; extras: ParsedItem[] } | null = null;
  let cursor = 0;

  const flushDish = () => {
    if (!dish) return;
    items.push(...expandDish(dish.key, dish), ...dish.extras);
    dish = null;
  };

  // En Colombia "papas" junto a comida rápida son papas fritas.
  const fastFood = matches.some((m) => {
    const c = m.alias.kind === "food" ? CORE_BY_KEY.get(m.alias.key) : undefined;
    return c?.category === "rapida" || m.alias.key === "pollo_frito" || m.alias.key === "alitas" || m.alias.key === "salchipapa";
  });
  for (const m of matches) {
    if (fastFood && m.alias.key === "papa_cocida" && /^papa/.test(m.alias.text)) m.alias = { ...m.alias, key: "papas_fritas" };
  }

  matches.forEach((m, idx) => {
    const next = matches[idx + 1];
    const before = text.slice(cursor, m.start);
    const afterFull = text.slice(m.end, next ? next.start : text.length);
    // Gramos escritos después del alimento: "arroz (200 g)" o "arroz 200 g".
    const afterGrams = afterFull.match(/^\s*\(?\s*(de\s+)?(\d+(?:[.,]\d+)?\s*(?:g|gr|grs|gramos|ml|cc)\b)/);
    cursor = afterGrams ? m.end + afterGrams[0].length : m.end;

    // "sin azúcar", "sin sopa": negación.
    const negated = /\bsin\s*$/.test(before);
    const ctx = readBefore(before);
    if (afterGrams) {
      // "6 cervezas de 330 ml" = 6 × 330; "arroz (200 g)" = 200.
      const each = gramsIn(afterGrams[2]) ?? 0;
      ctx.grams = afterGrams[1] && ctx.quantity && ctx.quantity > 1 ? each * ctx.quantity : each;
      delete ctx.quantity;
      delete ctx.unit;
    }
    const methodText = text.slice(m.start, Math.min(text.length, m.end + 14));
    // Tamaño dicho después: "una pechuga frita grande".
    const sizeAfter = afterFull.split(/[,;.+]| y | con /)[0].split(" ").find((w) => w in SIZE_WORDS);
    if (sizeAfter && !ctx.size) ctx.size = SIZE_WORDS[sizeAfter];
    const method = METHOD_WORDS.find(([re]) => re.test(methodText))?.[1] ?? null;
    // "con patacones" (plural, sin cantidad) = una porción, no una unidad.
    const plural = /s$/.test(text.slice(m.start, m.end));
    if (plural && ctx.quantity == null && !ctx.unit && !ctx.grams && m.alias.kind === "food") {
      const core = CORE_BY_KEY.get(m.alias.key);
      if (core?.portions.some((p) => p.unit === "porcion")) ctx.unit = "porcion";
    }

    if (m.alias.kind === "dish") {
      flushDish();
      if (negated) return;
      dish = { key: m.alias.key, overrides: {}, omit: [], grams: {}, factor: ctx.quantity && !ctx.unit ? ctx.quantity : 1, extras: [] };
      return;
    }

    const key = m.alias.key;
    if (dish) {
      const d = DISH_BY_KEY.get(dish.key)!;
      const slot = d.components.find((c) => c.coreKey === key || c.alternatives?.includes(key) || dish!.overrides[c.slot] === key);
      // "salchipapa: papas 250 g, queso 30 g": una palabra genérica que forma parte del nombre
      // de un componente se refiere a ese componente (papas → papas fritas, queso → mozzarella).
      const generic = slot
        ? undefined
        : d.components.find((c) => {
            const current = CORE_BY_KEY.get(dish!.overrides[c.slot] ?? c.coreKey);
            const word = stem(m.alias.text);
            return current?.aliases.some((a) => normalize(a) !== m.alias.text && normalize(a).split(" ").some((w) => stem(w) === word));
          });
      if (generic) {
        if (negated) dish.omit.push(generic.slot);
        else if (ctx.grams) dish.grams[generic.slot] = ctx.grams;
        return;
      }
      if (slot) {
        if (negated) dish.omit.push(slot.slot);
        else {
          dish.overrides[slot.slot] = key;
          if (ctx.grams) dish.grams[slot.slot] = ctx.grams;
        }
        return;
      }
      if (negated) return;
      dish.extras.push({ name: m.alias.text, core_key: key, ...ctx, method, confidence: 0.6 });
      return;
    }
    if (negated) return;
    items.push({ name: m.alias.text, core_key: key, ...ctx, method, confidence: ctx.grams ? 0.9 : 0.6 });
  });
  flushDish();

  items.push(...unmatchedSegments(text, matches));
  return items;
};
