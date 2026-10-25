import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { gunzipSync } from "node:zlib";
import { makeFoodDb, type FoodDb } from "./engine/db.ts";
import type { FoodRecord } from "./engine/types.ts";

/**
 * Base de alimentos en el servidor (docs/nutricion/03-arquitectura.md §3.5 y §4.1).
 * Orden: archivo local .data/nutrition/foods.json (desarrollo) → Firestore `nutritionDb/current`.
 * Se carga una vez por servidor y queda en memoria.
 */

export const NUTRITION_DB_DOC = "nutritionDb";

type ChunkedDb = {
  collection(name: string): {
    doc(id: string): {
      get(): Promise<{ exists: boolean; data(): unknown }>;
      collection(name: string): { doc(id: string): { get(): Promise<{ exists: boolean; data(): unknown }> } };
    };
  };
};

let cached: Promise<FoodDb | null> | null = null;

export function decodeChunks(chunks: string[]): FoodRecord[] {
  const buf = gunzipSync(Buffer.concat(chunks.map((c) => Buffer.from(c, "base64"))));
  return JSON.parse(buf.toString("utf8")) as FoodRecord[];
}

async function loadFromFirestore(db: ChunkedDb): Promise<FoodDb | null> {
  const meta = await db.collection(NUTRITION_DB_DOC).doc("current").get();
  if (!meta.exists) return null;
  const { chunks } = meta.data() as { chunks: number };
  const parts = await Promise.all(
    Array.from({ length: chunks }, async (_, i) => {
      const snap = await db.collection(NUTRITION_DB_DOC).doc("current").collection("chunks").doc(String(i)).get();
      return (snap.data() as { data: string }).data;
    }),
  );
  return makeFoodDb(decodeChunks(parts));
}

/** Devuelve la base o null si no hay ninguna disponible (Comidas queda apagado con un aviso). */
export function getServerFoodDb(getFirestore?: () => ChunkedDb): Promise<FoodDb | null> {
  if (!cached) {
    cached = (async () => {
      const local = path.join(process.cwd(), ".data", "nutrition", "foods.json");
      if (existsSync(local)) return makeFoodDb(JSON.parse(readFileSync(local, "utf8")) as FoodRecord[]);
      if (getFirestore) return loadFromFirestore(getFirestore());
      return null;
    })().catch((err) => {
      cached = null;
      throw err;
    });
  }
  return cached;
}
