/**
 * Baja la base de alimentos de Firestore (nutritionDb/current) a .data/nutrition-local/foods.json
 * (la que usa scripts/dev-local.mjs para probar sin Firebase).
 * Solo lee (1 + N trozos ≈ 3 lecturas). Sirve para trabajar en local sin regenerar la base desde los PDF.
 *
 * Uso: node --env-file=.env.local --experimental-strip-types scripts/nutrition/download_db.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { getDb, isFirebaseConfigured } from "../../src/lib/firebase.ts";
import { decodeChunks, NUTRITION_DB_DOC } from "../../src/lib/nutrition/db-server.ts";

if (!isFirebaseConfigured()) {
  console.error("Firebase no está configurado (falta FIREBASE_SERVICE_ACCOUNT).");
  process.exit(1);
}

const ref = getDb().collection(NUTRITION_DB_DOC).doc("current");
const meta = await ref.get();
if (!meta.exists) throw new Error("No existe nutritionDb/current");
const { chunks } = meta.data() as { chunks: number };
const parts: string[] = [];
for (let i = 0; i < chunks; i++) parts.push(((await ref.collection("chunks").doc(String(i)).get()).data() as { data: string }).data);
const records = decodeChunks(parts);
mkdirSync(".data/nutrition-local", { recursive: true });
writeFileSync(".data/nutrition-local/foods.json", JSON.stringify(records));
console.log(`Bajada: ${records.length} alimentos → .data/nutrition-local/foods.json`);
