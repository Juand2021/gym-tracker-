import type { FoodDb } from "./db.ts";
import { tokenize } from "./text.ts";

/**
 * Búsqueda por palabras clave (BM25) sobre nombres y sinónimos en español e inglés.
 * Los alimentos del núcleo y la TCAC pesan un poco más: son lo que Juan come.
 * Más adelante se combina con embeddings locales (fusión RRF).
 */

export type SearchHit = { id: string; score: number };

type Index = {
  ids: string[];
  lengths: number[];
  avgLen: number;
  postings: Map<string, { doc: number; tf: number }[]>;
  boost: number[];
  notReady: Set<number>;
};

/** Nombres de marca/cadena en mayúsculas del USDA ("TACO BELL, Taco Salad"). */
const BRANDED = /\b[A-Z][A-Z'&.]{2,}\b/;
/** Alimentos que no están listos para comer; la gente describe lo que se comió. */
const NOT_READY = /\b(raw|dry|mix|powder|unprepared|frozen|uncooked|crud[oa]s?|mezcla|harina|en polvo|deshidratad[oa]s?)\b/i;
const NOT_READY_QUERY = /\b(crud[oa]|mezcla|harina|polvo|deshidratad[oa]|congelad[oa]|raw|dry|mix|powder)/i;

const K1 = 1.2;
const B = 0.6;

function buildIndex(db: FoodDb): Index {
  const ids: string[] = [];
  const lengths: number[] = [];
  const boost: number[] = [];
  const postings = new Map<string, { doc: number; tf: number }[]>();
  const notReady = new Set<number>();
  for (const rec of db.records) {
    const core = db.coreOf(rec.id);
    const text = [rec.name_es, rec.name_en ?? "", ...rec.aliases, core?.name ?? "", ...(core?.aliases ?? [])].join(" ");
    const tokens = tokenize(text);
    if (!tokens.length) continue;
    const doc = ids.length;
    ids.push(rec.id);
    lengths.push(tokens.length);
    boost.push((core ? 1.5 : rec.source === "TCAC-2015" ? 1.15 : 1) * (BRANDED.test(rec.name_en ?? "") ? 0.7 : 1));
    if (!core && NOT_READY.test(text)) notReady.add(doc);
    const tf = new Map<string, number>();
    for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
    for (const [t, n] of tf) {
      let list = postings.get(t);
      if (!list) postings.set(t, (list = []));
      list.push({ doc, tf: n });
    }
  }
  const avgLen = lengths.reduce((a, b) => a + b, 0) / Math.max(1, lengths.length);
  return { ids, lengths, avgLen, postings, boost, notReady };
}

const indexes = new WeakMap<FoodDb, Index>();

function getIndex(db: FoodDb): Index {
  let idx = indexes.get(db);
  if (!idx) indexes.set(db, (idx = buildIndex(db)));
  return idx;
}

export function searchFoods(db: FoodDb, query: string, limit = 25): SearchHit[] {
  const idx = getIndex(db);
  const N = idx.ids.length;
  const scores = new Map<number, number>();
  for (const t of new Set(tokenize(query))) {
    const list = idx.postings.get(t);
    if (!list) continue;
    const idf = Math.log(1 + (N - list.length + 0.5) / (list.length + 0.5));
    for (const { doc, tf } of list) {
      const norm = tf + K1 * (1 - B + (B * idx.lengths[doc]) / idx.avgLen);
      scores.set(doc, (scores.get(doc) ?? 0) + (idf * tf * (K1 + 1)) / norm);
    }
  }
  const wantsRaw = NOT_READY_QUERY.test(query);
  return [...scores.entries()]
    .map(([doc, s]) => ({ id: idx.ids[doc], score: s * idx.boost[doc] * (!wantsRaw && idx.notReady.has(doc) ? 0.75 : 1) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/** Fusión de rankings (Reciprocal Rank Fusion, k = 60) para combinar BM25 y embeddings. */
export function fuseRankings(rankings: SearchHit[][], limit = 25, k = 60): SearchHit[] {
  const scores = new Map<string, number>();
  for (const ranking of rankings) ranking.forEach((h, i) => scores.set(h.id, (scores.get(h.id) ?? 0) + 1 / (k + i + 1)));
  return [...scores.entries()]
    .map(([id, score]) => ({ id, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
