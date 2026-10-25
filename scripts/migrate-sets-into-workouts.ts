/**
 * Copia las series de cada entreno (subcolección workouts/{id}/sets) a un campo `sets` dentro del
 * mismo documento. Así leer un entreno cuesta 1 lectura en vez de 1 + una por serie.
 *
 * NO borra nada: la subcolección queda igual (la app sigue escribiendo ambas durante la transición).
 *
 * Uso (desde la raíz del proyecto):
 *   node --env-file=.env.local --experimental-strip-types scripts/migrate-sets-into-workouts.ts            # prueba: solo cuenta
 *   node --env-file=.env.local --experimental-strip-types scripts/migrate-sets-into-workouts.ts --write    # copia y verifica
 *
 * Cubre los entrenos de Juan (colección raíz `workouts`) y los de cada perfil en users/{id}/workouts.
 * Costo aproximado: 1 lectura por entreno + 1 por serie (+ 1 por entreno al verificar) y 1 escritura por entreno.
 * Correrlo con la cuota del día recién reiniciada.
 */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { initializeApp, cert } = require("firebase-admin/app") as typeof import("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore") as typeof import("firebase-admin/firestore");
type Firestore = import("firebase-admin/firestore").Firestore;
type CollectionReference = import("firebase-admin/firestore").CollectionReference;

const WRITE = process.argv.includes("--write");

type DocSet = { id: string; exercise: string; weightKg: number; reps: number; setNumber: number; orderIndex?: number };

function connect(): Firestore {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error("Falta FIREBASE_SERVICE_ACCOUNT en .env.local");
  const sa = JSON.parse(raw) as { project_id: string; client_email: string; private_key: string };
  initializeApp({ credential: cert({ projectId: sa.project_id, clientEmail: sa.client_email, privateKey: sa.private_key.replace(/\\n/g, "\n") }) });
  return getFirestore();
}

function toDocSet(id: string, d: Record<string, unknown>): DocSet {
  const out: DocSet = {
    id,
    exercise: String(d.exercise ?? ""),
    weightKg: Number(d.weightKg ?? 0),
    reps: Number(d.reps ?? 0),
    setNumber: Number(d.setNumber ?? 0),
  };
  // Firestore no acepta `undefined`: orderIndex solo si existe (igual que en la subcolección).
  if (typeof d.orderIndex === "number" && Number.isFinite(d.orderIndex)) out.orderIndex = d.orderIndex;
  return out;
}

const key = (s: DocSet) => JSON.stringify([s.id, s.exercise, s.weightKg, s.reps, s.setNumber, s.orderIndex ?? null]);
const sameSets = (a: DocSet[], b: DocSet[]) => a.length === b.length && a.map(key).sort().join("|") === b.map(key).sort().join("|");

async function migrate(label: string, col: CollectionReference) {
  const stats = { workouts: 0, alreadyEmbedded: 0, migrated: 0, sets: 0, verified: 0, mismatches: 0, reads: 0, writes: 0 };
  const snap = await col.get();
  stats.reads += Math.max(1, snap.size);
  for (const doc of snap.docs) {
    stats.workouts++;
    const data = doc.data();
    const sub = await doc.ref.collection("sets").get();
    stats.reads += Math.max(1, sub.size);
    const sets = sub.docs.map((s) => toDocSet(s.id, s.data()));
    stats.sets += sets.length;
    if (Array.isArray(data.sets)) {
      stats.alreadyEmbedded++;
      const embedded = (data.sets as Record<string, unknown>[]).map((s) => toDocSet(String(s.id ?? ""), s));
      if (!sameSets(embedded, sets)) {
        stats.mismatches++;
        console.warn(`  ⚠ ${label}/${doc.id} (${String(data.date)}): el campo sets no coincide con la subcolección (${embedded.length} vs ${sets.length})`);
      }
      continue;
    }
    if (!WRITE) continue;
    await doc.ref.update({ sets });
    stats.writes++;
    stats.migrated++;
    // Verificación: se vuelve a leer y se compara con la subcolección.
    const again = await doc.ref.get();
    stats.reads++;
    const embedded = ((again.data()?.sets ?? []) as Record<string, unknown>[]).map((s) => toDocSet(String(s.id ?? ""), s));
    if (sameSets(embedded, sets)) stats.verified++;
    else {
      stats.mismatches++;
      console.warn(`  ⚠ ${label}/${doc.id}: la copia no coincide tras escribir`);
    }
  }
  return stats;
}

async function main() {
  const db = connect();
  console.log(WRITE ? "\nMigración REAL: copia las series dentro de cada entreno (no borra nada)\n" : "\nModo de prueba: solo cuenta (agrega --write para copiar)\n");
  const targets: { label: string; col: CollectionReference }[] = [{ label: "workouts (Juan)", col: db.collection("workouts") }];
  for (const user of await db.collection("users").listDocuments()) {
    targets.push({ label: `users/${user.id}/workouts`, col: user.collection("workouts") });
  }
  let totalReads = 0;
  let totalMismatch = 0;
  for (const t of targets) {
    const s = await migrate(t.label, t.col);
    totalReads += s.reads;
    totalMismatch += s.mismatches;
    console.log(
      `${t.label}: ${s.workouts} entrenos, ${s.sets} series · ya migrados ${s.alreadyEmbedded} · ` +
        (WRITE ? `copiados ${s.migrated} (verificados ${s.verified})` : `por copiar ${s.workouts - s.alreadyEmbedded}`) +
        ` · lecturas ${s.reads}, escrituras ${s.writes}`,
    );
  }
  console.log(`\nTotal de lecturas de esta corrida: ${totalReads}. Diferencias: ${totalMismatch}.`);
  if (totalMismatch) process.exitCode = 1;
}

main().catch((err) => {
  console.error("Error:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
