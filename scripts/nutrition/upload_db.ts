/**
 * Sube .data/nutrition/foods.json a Firestore (privado: las reglas bloquean el acceso del navegador).
 * Queda en nutritionDb/current + nutritionDb/current/chunks/{i}, comprimido y en trozos < 900 KB.
 *
 * Uso: node --env-file=.env.local --experimental-strip-types scripts/nutrition/upload_db.ts
 * Requiere FIREBASE_SERVICE_ACCOUNT (o FIREBASE_PROJECT_ID / CLIENT_EMAIL / PRIVATE_KEY).
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { getDb, isFirebaseConfigured } from "../../src/lib/firebase.ts";
import { decodeChunks, NUTRITION_DB_DOC } from "../../src/lib/nutrition/db-server.ts";

const CHUNK_CHARS = 900_000;

if (!isFirebaseConfigured()) {
  console.error("Firebase no está configurado (falta FIREBASE_SERVICE_ACCOUNT).");
  process.exit(1);
}

const raw = readFileSync(".data/nutrition/foods.json");
const records = (JSON.parse(raw.toString("utf8")) as unknown[]).length;
const b64 = gzipSync(raw, { level: 9 }).toString("base64");
const chunks: string[] = [];
for (let i = 0; i < b64.length; i += CHUNK_CHARS) chunks.push(b64.slice(i, i + CHUNK_CHARS));

// Comprobación antes de subir: los trozos deben reconstruir la base exacta.
if (decodeChunks(chunks).length !== records) throw new Error("Los trozos no reconstruyen la base");

const db = getDb();
const ref = db.collection(NUTRITION_DB_DOC).doc("current");
for (let i = 0; i < chunks.length; i++) await ref.collection("chunks").doc(String(i)).set({ data: chunks[i] });
await ref.set({
  createdAt: new Date().toISOString(),
  records,
  chunks: chunks.length,
  sha256: createHash("sha256").update(raw).digest("hex"),
});
console.log(`Subida: ${records} alimentos en ${chunks.length} trozos (${Math.round(b64.length / 1024)} KB).`);
