import { ALL_ROUTINE_EXERCISES } from "./routines.ts";

export const DEFAULT_EXERCISES: string[] = ALL_ROUTINE_EXERCISES;

/**
 * Convención de carga (siempre lo que ves/agarras, no sumas mentales):
 * - barra: peso total (barra + discos)
 * - mancuerna: peso de UNA mancuerna
 * - lado: peso de un solo lado (cable/unilateral)
 * - máquina: lo que marca el pin/stack o la carga de la máquina
 * - corporal: lastre añadido (0 si vas a peso corporal)
 */
export type LoadMode = "bar" | "dumbbell" | "side" | "machine" | "bodyweight";

const LOAD_BY_EXERCISE: Record<string, LoadMode> = {
  "Press banca": "bar",
  "Press inclinado con mancuernas": "dumbbell",
  "Pec deck": "machine",
  "Cruce de poleas alto": "side",
  Fondos: "bodyweight",
  "Press francés con barra Z": "bar",
  "Extensión de tríceps con cuerda": "machine",
  "Extensión de tríceps trasnuca": "machine",
  "Extensión de tríceps unilateral": "side",
  Dominadas: "bodyweight",
  "Jalón al pecho": "machine",
  "Remo con máquina": "machine",
  "Remo unilateral con agarre de polea": "side",
  "Remo unilateral (agarre al tronco)": "side",
  "Face pull": "machine",
  "Curl martillo": "dumbbell",
  "Bíceps con mancuernas": "dumbbell",
  "Bíceps unilateral concentrado": "dumbbell",
  "Bíceps barra Z": "bar",
  "Curl de antebrazo con mancuernas": "dumbbell",
  "Curl inverso de antebrazo con mancuernas": "dumbbell",
  "Contracción de antebrazo": "dumbbell",
  "Aducción de antebrazo": "dumbbell",
  "Dominadas agarre neutro": "bodyweight",
  "Press militar con mancuernas": "dumbbell",
  "Elevaciones unilaterales con cable": "side",
  "Elevaciones hacia el frente unilaterales con cable": "side",
  "Face-pull o reverse peck deck": "machine",
  "Encogimiento de hombros": "bar",
  "Sentadilla libre": "bar",
  "Peso muerto rumano": "bar",
  "Extensión de espalda": "machine",
  "Extensión de cuádriceps": "machine",
  "Prensa de pierna": "machine",
  "Extensión de gemelos": "machine",
  "Aducción de cadera": "machine",
  "Crunch abdominal en polea": "machine",
  "Elevación de piernas": "bodyweight",
  "Rueda abdominal": "bodyweight",
  "Plancha abdominal": "bodyweight",
  "Crunch abdominal": "bodyweight",
  "Oblicuos en polea": "side",
};

const LOAD_HINT: Record<LoadMode, { short: string; detail: string }> = {
  bar: {
    short: "total",
    detail: "Peso total de la barra",
  },
  dumbbell: {
    short: "1 manc.",
    detail: "Peso de una sola mancuerna (no sumes las dos)",
  },
  side: {
    short: "1 lado",
    detail: "Peso de un solo lado",
  },
  machine: {
    short: "máquina",
    detail: "Lo que marca la máquina / stack",
  },
  bodyweight: {
    short: "lastre",
    detail: "Lastre añadido (0 si vas a peso corporal)",
  },
};

function inferLoadMode(exercise: string): LoadMode {
  const name = exercise.toLowerCase();
  if (name.includes("mancuerna")) return "dumbbell";
  if (name.includes("unilateral") || name.includes("por lado")) return "side";
  if (
    name.includes("dominada") ||
    name.includes("fondo") ||
    name.includes("fondos")
  ) {
    return "bodyweight";
  }
  if (
    name.includes("barra") ||
    name.includes("sentadilla") ||
    name.includes("peso muerto") ||
    name.includes("press banca")
  ) {
    return "bar";
  }
  if (
    name.includes("máquina") ||
    name.includes("polea") ||
    name.includes("jalón") ||
    name.includes("prensa") ||
    name.includes("peck") ||
    name.includes("deck") ||
    name.includes("cuerda") ||
    name.includes("cable")
  ) {
    return "machine";
  }
  return "machine";
}

export function getLoadMode(exercise: string): LoadMode {
  return LOAD_BY_EXERCISE[exercise] ?? inferLoadMode(exercise);
}

export function getLoadHint(exercise: string): {
  mode: LoadMode;
  short: string;
  detail: string;
} {
  const mode = getLoadMode(exercise);
  return { mode, ...LOAD_HINT[mode] };
}

export const LOAD_CONVENTION_NOTE =
  "Convención: barra = peso total; mancuernas = una sola; unilateral/cable = un lado; máquina = lo del pin; dominadas/fondos = lastre (0 si no hay).";

export function epleyOneRm(weightKg: number, reps: number): number {
  if (reps <= 0) return 0;
  if (reps === 1) return weightKg;
  return weightKg * (1 + reps / 30);
}
