import {
  getDemoWorkoutById,
  mergeWithDemoBodyWeight,
  mergeWithDemoWorkouts,
} from "@/lib/demo-seed";
import { isFirebaseConfigured, getDb } from "@/lib/firebase";
import {
  localCreateBodyWeight,
  localCreateWorkout,
  localDeleteBodyWeight,
  localDeleteWorkout,
  localGetWorkout,
  localListBodyWeight,
  localListWorkouts,
} from "@/lib/local-store";
import type { ArmFocus, DayType } from "@/lib/routines";
import type {
  BodyWeightEntry,
  CreateBodyWeightInput,
  CreateWorkoutInput,
  Workout,
  WorkoutSet,
} from "@/lib/types";

function asDayType(value: unknown): DayType | null {
  if (value === "pecho" || value === "espalda" || value === "hombro" || value === "pierna") {
    return value;
  }
  return null;
}

function asArmFocus(value: unknown): ArmFocus | null {
  if (value === "biceps" || value === "triceps") return value;
  return null;
}

function mapSet(id: string, data: Record<string, unknown>): WorkoutSet {
  return {
    id,
    exercise: String(data.exercise ?? ""),
    weightKg: Number(data.weightKg ?? 0),
    reps: Number(data.reps ?? 0),
    setNumber: Number(data.setNumber ?? 0),
  };
}

async function loadSets(workoutId: string): Promise<WorkoutSet[]> {
  const snap = await getDb()
    .collection("workouts")
    .doc(workoutId)
    .collection("sets")
    .orderBy("setNumber", "asc")
    .get();

  return snap.docs.map((doc) =>
    mapSet(doc.id, doc.data() as Record<string, unknown>),
  );
}

export async function listWorkouts(limit = 80): Promise<Workout[]> {
  const real = !isFirebaseConfigured()
    ? localListWorkouts(limit)
    : await Promise.all(
        (
          await getDb()
            .collection("workouts")
            .orderBy("date", "desc")
            .limit(limit)
            .get()
        ).docs.map(async (doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            date: String(data.date ?? ""),
            notes: String(data.notes ?? ""),
            createdAt: String(data.createdAt ?? ""),
            dayType: asDayType(data.dayType),
            armFocus: asArmFocus(data.armFocus),
            sets: await loadSets(doc.id),
          } satisfies Workout;
        }),
      );

  return mergeWithDemoWorkouts(real, limit);
}

export async function getWorkout(id: string): Promise<Workout | null> {
  const demo = getDemoWorkoutById(id);
  if (demo) return demo;

  if (!isFirebaseConfigured()) return localGetWorkout(id);

  const doc = await getDb().collection("workouts").doc(id).get();
  if (!doc.exists) return null;
  const data = doc.data()!;
  return {
    id: doc.id,
    date: String(data.date ?? ""),
    notes: String(data.notes ?? ""),
    createdAt: String(data.createdAt ?? ""),
    dayType: asDayType(data.dayType),
    armFocus: asArmFocus(data.armFocus),
    sets: await loadSets(doc.id),
  };
}

export async function createWorkout(input: CreateWorkoutInput): Promise<Workout> {
  if (!isFirebaseConfigured()) return localCreateWorkout(input);

  const ref = getDb().collection("workouts").doc();
  const createdAt = new Date().toISOString();
  const payload = {
    date: input.date,
    notes: input.notes ?? "",
    createdAt,
    dayType: input.dayType ?? null,
    armFocus: input.armFocus ?? null,
  };

  const batch = getDb().batch();
  batch.set(ref, payload);

  input.sets.forEach((set) => {
    const setRef = ref.collection("sets").doc();
    batch.set(setRef, {
      exercise: set.exercise,
      weightKg: set.weightKg,
      reps: set.reps,
      setNumber: set.setNumber,
    });
  });

  await batch.commit();

  return {
    id: ref.id,
    date: payload.date,
    notes: payload.notes,
    createdAt: payload.createdAt,
    dayType: payload.dayType,
    armFocus: payload.armFocus,
    sets: input.sets.map((set, index) => ({
      id: `temp-${index}`,
      ...set,
    })),
  };
}

export async function deleteWorkout(id: string): Promise<void> {
  if (id.startsWith("demo-")) return;

  if (!isFirebaseConfigured()) {
    localDeleteWorkout(id);
    return;
  }

  const ref = getDb().collection("workouts").doc(id);
  const sets = await ref.collection("sets").get();
  const batch = getDb().batch();
  sets.docs.forEach((doc) => batch.delete(doc.ref));
  batch.delete(ref);
  await batch.commit();
}

export async function listBodyWeight(limit = 90): Promise<BodyWeightEntry[]> {
  const real = !isFirebaseConfigured()
    ? localListBodyWeight(limit)
    : (
        await getDb()
          .collection("bodyWeight")
          .orderBy("date", "desc")
          .limit(limit)
          .get()
      ).docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          date: String(data.date ?? ""),
          weightKg: Number(data.weightKg ?? 0),
        };
      });

  return mergeWithDemoBodyWeight(real, limit);
}

export async function createBodyWeight(
  input: CreateBodyWeightInput,
): Promise<BodyWeightEntry> {
  if (!isFirebaseConfigured()) return localCreateBodyWeight(input);

  const ref = getDb().collection("bodyWeight").doc();
  const payload = {
    date: input.date,
    weightKg: input.weightKg,
  };
  await ref.set(payload);
  return { id: ref.id, ...payload };
}

export async function deleteBodyWeight(id: string): Promise<void> {
  if (id.startsWith("demo-")) return;

  if (!isFirebaseConfigured()) {
    localDeleteBodyWeight(id);
    return;
  }
  await getDb().collection("bodyWeight").doc(id).delete();
}

export async function buildAiContext(): Promise<string> {
  const [workouts, bodyWeight] = await Promise.all([
    listWorkouts(80),
    listBodyWeight(40),
  ]);

  const workoutLines = workouts.map((w) => {
    const sets = w.sets
      .map(
        (s) =>
          `  - ${s.exercise}: ${s.weightKg}kg x ${s.reps} (serie ${s.setNumber})`,
      )
      .join("\n");
    const day = w.dayType ? ` [${w.dayType}${w.armFocus ? `/${w.armFocus}` : ""}]` : "";
    return `Sesión ${w.date}${day}${w.notes ? ` — ${w.notes}` : ""}\n${sets || "  (sin series)"}`;
  });

  const weightLines = bodyWeight.map((b) => `${b.date}: ${b.weightKg} kg`);

  return [
    "Convención de pesos del usuario:",
    "- Barra: peso total (barra + discos).",
    "- Mancuernas: peso de UNA sola mancuerna (no la suma de ambas).",
    "- Unilateral/cable: peso de un solo lado.",
    "- Máquina: lo que marca el pin/stack.",
    "- Dominadas/fondos: lastre añadido (0 = solo peso corporal).",
    "",
    "Historial de entrenamientos (más recientes primero):",
    workoutLines.join("\n\n") || "(sin entrenamientos)",
    "",
    "Historial de peso corporal:",
    weightLines.join("\n") || "(sin registros)",
  ].join("\n");
}
