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
  localUpdateWorkout,
} from "@/lib/local-store";
import {
  DAY_OPTIONS,
  getExercisesForDay,
  type ArmFocus,
  type DayType,
} from "@/lib/routines";
import type {
  BodyWeightEntry,
  CreateBodyWeightInput,
  CreateWorkoutInput,
  UpdateWorkoutInput,
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
  const orderRaw = data.orderIndex;
  const orderIndex =
    typeof orderRaw === "number" && Number.isFinite(orderRaw)
      ? orderRaw
      : undefined;
  return {
    id,
    exercise: String(data.exercise ?? ""),
    weightKg: Number(data.weightKg ?? 0),
    reps: Number(data.reps ?? 0),
    setNumber: Number(data.setNumber ?? 0),
    orderIndex,
  };
}

/** Orden de ejecución: orderIndex → plantilla del día → setNumber. */
export function sortSetsBySessionOrder(
  sets: WorkoutSet[],
  dayType?: DayType | null,
  armFocus?: ArmFocus | null,
): WorkoutSet[] {
  const template = dayType ? getExercisesForDay(dayType, armFocus) : [];
  const templateIndex = new Map(template.map((name, i) => [name, i]));
  const firstSeen = new Map<string, number>();
  sets.forEach((set, i) => {
    if (!firstSeen.has(set.exercise)) firstSeen.set(set.exercise, i);
  });

  const hasOrderIndex = sets.some((s) => typeof s.orderIndex === "number");

  return [...sets].sort((a, b) => {
    if (hasOrderIndex) {
      const ao = a.orderIndex ?? Number.POSITIVE_INFINITY;
      const bo = b.orderIndex ?? Number.POSITIVE_INFINITY;
      if (ao !== bo) return ao - bo;
    }

    const ae = templateIndex.has(a.exercise)
      ? templateIndex.get(a.exercise)!
      : 1000 + (firstSeen.get(a.exercise) ?? 0);
    const be = templateIndex.has(b.exercise)
      ? templateIndex.get(b.exercise)!
      : 1000 + (firstSeen.get(b.exercise) ?? 0);
    if (ae !== be) return ae - be;

    return a.setNumber - b.setNumber;
  });
}

async function loadSets(
  workoutId: string,
  dayType?: DayType | null,
  armFocus?: ArmFocus | null,
): Promise<WorkoutSet[]> {
  const snap = await getDb()
    .collection("workouts")
    .doc(workoutId)
    .collection("sets")
    .get();

  const sets = snap.docs.map((doc) =>
    mapSet(doc.id, doc.data() as Record<string, unknown>),
  );
  return sortSetsBySessionOrder(sets, dayType, armFocus);
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
          const dayType = asDayType(data.dayType);
          const armFocus = asArmFocus(data.armFocus);
          return {
            id: doc.id,
            date: String(data.date ?? ""),
            notes: String(data.notes ?? ""),
            createdAt: String(data.createdAt ?? ""),
            dayType,
            armFocus,
            sets: await loadSets(doc.id, dayType, armFocus),
          } satisfies Workout;
        }),
      );

  return mergeWithDemoWorkouts(real, limit).map((workout) => ({
    ...workout,
    sets: sortSetsBySessionOrder(
      workout.sets,
      workout.dayType,
      workout.armFocus,
    ),
  }));
}

export async function getWorkout(id: string): Promise<Workout | null> {
  const demo = getDemoWorkoutById(id);
  if (demo) {
    return {
      ...demo,
      sets: sortSetsBySessionOrder(demo.sets, demo.dayType, demo.armFocus),
    };
  }

  if (!isFirebaseConfigured()) {
    const local = localGetWorkout(id);
    if (!local) return null;
    return {
      ...local,
      sets: sortSetsBySessionOrder(local.sets, local.dayType, local.armFocus),
    };
  }

  const doc = await getDb().collection("workouts").doc(id).get();
  if (!doc.exists) return null;
  const data = doc.data()!;
  const dayType = asDayType(data.dayType);
  const armFocus = asArmFocus(data.armFocus);
  return {
    id: doc.id,
    date: String(data.date ?? ""),
    notes: String(data.notes ?? ""),
    createdAt: String(data.createdAt ?? ""),
    dayType,
    armFocus,
    sets: await loadSets(doc.id, dayType, armFocus),
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

  input.sets.forEach((set, index) => {
    const setRef = ref.collection("sets").doc();
    batch.set(setRef, {
      exercise: set.exercise,
      weightKg: set.weightKg,
      reps: set.reps,
      setNumber: set.setNumber,
      orderIndex: set.orderIndex ?? index,
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
      orderIndex: set.orderIndex ?? index,
    })),
  };
}

export async function deleteWorkout(id: string): Promise<void> {
  if (id.startsWith("demo-")) {
    throw new Error("No se pueden borrar sesiones de demostración");
  }

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

export async function updateWorkout(
  id: string,
  input: UpdateWorkoutInput,
): Promise<Workout> {
  if (id.startsWith("demo-")) {
    throw new Error("No se pueden editar sesiones de demostración");
  }

  if (!isFirebaseConfigured()) {
    const updated = localUpdateWorkout(id, input);
    if (!updated) throw new Error("No encontrado");
    return updated;
  }

  const ref = getDb().collection("workouts").doc(id);
  const existing = await ref.get();
  if (!existing.exists) throw new Error("No encontrado");

  const previous = existing.data()!;
  const batch = getDb().batch();
  batch.update(ref, {
    date: input.date,
    notes: input.notes ?? "",
    dayType: input.dayType ?? null,
    armFocus: input.armFocus ?? null,
  });

  const oldSets = await ref.collection("sets").get();
  oldSets.docs.forEach((doc) => batch.delete(doc.ref));

  input.sets.forEach((set, index) => {
    const setRef = ref.collection("sets").doc();
    batch.set(setRef, {
      exercise: set.exercise,
      weightKg: set.weightKg,
      reps: set.reps,
      setNumber: set.setNumber,
      orderIndex: set.orderIndex ?? index,
    });
  });

  await batch.commit();

  return {
    id,
    date: input.date,
    notes: input.notes ?? "",
    createdAt: String(previous.createdAt ?? ""),
    dayType: input.dayType ?? null,
    armFocus: input.armFocus ?? null,
    sets: input.sets.map((set, index) => ({
      id: `temp-${index}`,
      ...set,
      orderIndex: set.orderIndex ?? index,
    })),
  };
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

function formatSessionForAi(workout: Workout): string {
  const ordered = sortSetsBySessionOrder(
    workout.sets,
    workout.dayType,
    workout.armFocus,
  );

  const exerciseOrder: string[] = [];
  const setsByExercise = new Map<string, WorkoutSet[]>();
  for (const set of ordered) {
    if (!setsByExercise.has(set.exercise)) {
      setsByExercise.set(set.exercise, []);
      exerciseOrder.push(set.exercise);
    }
    setsByExercise.get(set.exercise)!.push(set);
  }

  const day = workout.dayType
    ? ` [${workout.dayType}${workout.armFocus ? `/${workout.armFocus}` : ""}]`
    : "";
  const header = `Sesión ${workout.date}${day}${
    workout.notes ? ` — ${workout.notes}` : ""
  }`;

  if (exerciseOrder.length === 0) {
    return `${header}\n  (sin series)`;
  }

  const orderLine = `Orden de ejecución (1 = primero del día; el usuario registra en este mismo orden): ${exerciseOrder
    .map((name, i) => `${i + 1}) ${name}`)
    .join(" → ")}`;

  const body = exerciseOrder
    .map((exercise, index) => {
      const sets = setsByExercise.get(exercise)!;
      const setLines = sets
        .map((s) => `     serie ${s.setNumber}: ${s.weightKg}kg x ${s.reps}`)
        .join("\n");
      return `  ${index + 1}. ${exercise}\n${setLines}`;
    })
    .join("\n");

  return `${header}\n${orderLine}\n${body}`;
}

function formatRoutineTemplates(): string {
  const blocks = DAY_OPTIONS.map((day) => {
    if (day.id === "hombro") {
      const base = getExercisesForDay("hombro");
      const withBiceps = getExercisesForDay("hombro", "biceps");
      const withTriceps = getExercisesForDay("hombro", "triceps");
      return [
        `Plantilla ${day.label}:`,
        `  Base: ${base.map((e, i) => `${i + 1}. ${e}`).join(" | ")}`,
        `  + Bíceps: ${withBiceps.map((e, i) => `${i + 1}. ${e}`).join(" | ")}`,
        `  + Tríceps: ${withTriceps.map((e, i) => `${i + 1}. ${e}`).join(" | ")}`,
      ].join("\n");
    }

    const exercises = getExercisesForDay(day.id);
    return `Plantilla ${day.label}: ${exercises
      .map((e, i) => `${i + 1}. ${e}`)
      .join(" | ")}`;
  });

  return blocks.join("\n");
}

export async function buildAiContext(): Promise<string> {
  const [workouts, bodyWeight] = await Promise.all([
    listWorkouts(80),
    listBodyWeight(40),
  ]);

  const workoutLines = workouts.map(formatSessionForAi);
  const weightLines = bodyWeight.map((b) => `${b.date}: ${b.weightKg} kg`);

  return [
    "Convención de pesos del usuario:",
    "- Barra: peso total (barra + discos).",
    "- Mancuernas: peso de UNA sola mancuerna (no la suma de ambas).",
    "- Unilateral/cable: peso de un solo lado.",
    "- Máquina: lo que marca el pin/stack.",
    "- Dominadas/fondos: lastre añadido (0 = solo peso corporal).",
    "",
    "Orden de la rutina:",
    "- El usuario entrena en el mismo orden en que aparecen los ejercicios al registrar la sesión.",
    "- El primer ejercicio listado es el primero que hizo; el último listado es el cierre (p. ej. bíceps/antebrazo al final del día de espalda).",
    "- NO inviertas el orden ni asumas que empezó por brazos si aparecen al final.",
    "",
    "Plantillas de rutina (orden previsto por día):",
    formatRoutineTemplates(),
    "",
    "Historial de entrenamientos (sesiones más recientes primero; dentro de cada sesión, orden de ejecución real):",
    workoutLines.join("\n\n") || "(sin entrenamientos)",
    "",
    "Historial de peso corporal:",
    weightLines.join("\n") || "(sin registros)",
  ].join("\n");
}
