/**
 * Forma de las series de un entreno en Firestore.
 *
 * Antes cada serie era un documento aparte (workouts/{id}/sets/{setId}) y leer un entreno costaba
 * 1 lectura + 1 por serie. Ahora las series también van dentro del entreno (campo `sets`) y
 * se leen con 1 sola lectura. Durante la transición se escriben ambas copias con los mismos ids.
 */
import { canonicalExerciseName } from "./exercise-aliases.ts";
import type { CreateWorkoutInput, WorkoutSet } from "./types.ts";

export function mapSet(id: string, data: Record<string, unknown>): WorkoutSet {
  const orderRaw = data.orderIndex;
  const orderIndex =
    typeof orderRaw === "number" && Number.isFinite(orderRaw)
      ? orderRaw
      : undefined;
  return {
    id,
    exercise: canonicalExerciseName(String(data.exercise ?? "")),
    weightKg: Number(data.weightKg ?? 0),
    reps: Number(data.reps ?? 0),
    setNumber: Number(data.setNumber ?? 0),
    orderIndex,
  };
}

/**
 * Series guardadas dentro del documento del entreno (campo `sets`). Si el entreno es antiguo y aún
 * no las tiene, devuelve null y se leen de la subcolección `sets` como antes.
 */
export function embeddedSets(data: Record<string, unknown>): WorkoutSet[] | null {
  const raw = data.sets;
  if (!Array.isArray(raw)) return null;
  return raw.map((item, i) => {
    const d = (item ?? {}) as Record<string, unknown>;
    return mapSet(typeof d.id === "string" && d.id ? d.id : `s${i}`, d);
  });
}

/**
 * Forma en que se guardan las series dentro del entreno. Cada una lleva el mismo id que su copia en la
 * subcolección: así editar o borrar no necesita leer la subcolección para encontrarlas.
 */
export function setsForDoc(sets: CreateWorkoutInput["sets"], ids: string[]) {
  return sets.map((set, index) => ({
    id: ids[index],
    exercise: set.exercise,
    weightKg: set.weightKg,
    reps: set.reps,
    setNumber: set.setNumber,
    orderIndex: set.orderIndex ?? index,
  }));
}

/** Copia de una serie para la subcolección (igual que antes: sin el id, que es el del documento). */
export function subcollectionSet(set: ReturnType<typeof setsForDoc>[number]) {
  return { exercise: set.exercise, weightKg: set.weightKg, reps: set.reps, setNumber: set.setNumber, orderIndex: set.orderIndex };
}
