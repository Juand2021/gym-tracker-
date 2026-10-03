/**
 * Utilidades y persistencia para la personalización de las rutinas de entrenamiento.
 * Permite al usuario modificar la lista de ejercicios de cada día (Pecho, Espalda, Hombro, Pierna).
 */

import { canonicalExerciseName } from "./exercise-aliases.ts";

export type DayType = "pecho" | "espalda" | "hombro" | "pierna";
export type ArmFocus = "biceps" | "triceps";

export interface CustomRoutines {
  pecho: string[];
  espalda: string[];
  hombro_biceps: string[];
  hombro_triceps: string[];
  pierna: string[];
}

export const CUSTOM_ROUTINES_STORAGE_KEY = "fuerza_custom_routines_v1";

export const DEFAULT_PECHO: string[] = [
  "Press banca",
  "Press inclinado con mancuernas",
  "Pec deck",
  "Cruce de poleas alto",
  "Fondos",
  "Press francés con barra Z",
  "Extensión de tríceps con cuerda",
  "Extensión de tríceps trasnuca",
  "Extensión de tríceps unilateral",
  "Dragon Fly en el piso",
];

export const DEFAULT_ESPALDA: string[] = [
  "Dominadas",
  "Jalón al pecho",
  "Remo en máquina con discos",
  "Remo unilateral con agarre de polea",
  "Face pull",
  "Curl de bíceps con barra Z",
  "Curl martillo",
  "Bíceps con mancuernas",
  "Bíceps unilateral concentrado",
  "Curl de antebrazo con mancuernas",
  "Curl inverso de antebrazo con mancuernas",
  "Crunch de polea alta",
];

export const DEFAULT_HOMBRO_BICEPS: string[] = [
  "Dominadas agarre neutro",
  "Press militar con mancuernas",
  "Elevaciones unilaterales con cable",
  "Elevaciones hacia el frente unilaterales con cable",
  "Face pull",
  "Encogimiento de hombros",
  "Curl de bíceps con barra Z",
  "Curl martillo",
  "Bíceps con mancuernas",
  "Bíceps unilateral concentrado",
  "Curl de antebrazo con mancuernas",
  "Curl inverso de antebrazo con mancuernas",
];

export const DEFAULT_HOMBRO_TRICEPS: string[] = [
  "Dominadas agarre neutro",
  "Press militar con mancuernas",
  "Elevaciones unilaterales con cable",
  "Elevaciones hacia el frente unilaterales con cable",
  "Face pull",
  "Encogimiento de hombros",
  "Press francés con barra Z",
  "Extensión de tríceps con cuerda",
  "Extensión de tríceps trasnuca",
  "Extensión de tríceps unilateral",
];

export const DEFAULT_PIERNA: string[] = [
  "Sentadilla libre",
  "Peso muerto rumano",
  "Extensión de espalda",
  "Extensión de cuádriceps",
  "Prensa de pierna",
  "Extensión de gemelos",
  "Aducción de cadera",
];

/**
 * Obtiene las rutinas predeterminadas de fábrica.
 */
export function getDefaultRoutines(): CustomRoutines {
  return {
    pecho: [...DEFAULT_PECHO],
    espalda: [...DEFAULT_ESPALDA],
    hombro_biceps: [...DEFAULT_HOMBRO_BICEPS],
    hombro_triceps: [...DEFAULT_HOMBRO_TRICEPS],
    pierna: [...DEFAULT_PIERNA],
  };
}

/**
 * Carga las rutinas personalizadas desde el almacenamiento local o devuelve las por defecto.
 */
export function loadCustomRoutines(): CustomRoutines {
  if (typeof window === "undefined") {
    return getDefaultRoutines();
  }

  try {
    const raw = localStorage.getItem(CUSTOM_ROUTINES_STORAGE_KEY);
    if (!raw) return getDefaultRoutines();
    const parsed = JSON.parse(raw) as Partial<CustomRoutines>;

    const defaults = getDefaultRoutines();
    const routines: CustomRoutines = {
      pecho: Array.isArray(parsed.pecho) && parsed.pecho.length > 0 ? parsed.pecho : defaults.pecho,
      espalda: Array.isArray(parsed.espalda) && parsed.espalda.length > 0 ? parsed.espalda : defaults.espalda,
      hombro_biceps:
        Array.isArray(parsed.hombro_biceps) && parsed.hombro_biceps.length > 0
          ? parsed.hombro_biceps
          : defaults.hombro_biceps,
      hombro_triceps:
        Array.isArray(parsed.hombro_triceps) && parsed.hombro_triceps.length > 0
          ? parsed.hombro_triceps
          : defaults.hombro_triceps,
      pierna: Array.isArray(parsed.pierna) && parsed.pierna.length > 0 ? parsed.pierna : defaults.pierna,
    };
    return applyNewDefaultExercises(routines);
  } catch {
    return getDefaultRoutines();
  }
}

/** Ids de ejercicios nuevos que ya se insertaron una vez en las rutinas guardadas. */
export const ADDED_DEFAULTS_STORAGE_KEY = "fuerza_custom_routines_added_v1";

type NewDefaultExercise = {
  id: string;
  exercise: string;
  slots: Array<keyof CustomRoutines>;
  /** "add" (por defecto) inserta, "remove" retira, "rename" lo cambia por `renameTo`. */
  action?: "add" | "remove" | "rename";
  renameTo?: string;
  /** Al agregar, se inserta antes de este ejercicio; si no está, va al final. */
  before?: string;
};

/**
 * Cambios a las rutinas de fábrica posteriores a que el usuario personalizara
 * las suyas. Se aplican una sola vez: si luego deshace el cambio, se respeta.
 */
export const NEW_DEFAULT_EXERCISES: NewDefaultExercise[] = [
  {
    id: "curl-biceps-barra-z",
    exercise: "Curl de bíceps con barra Z",
    slots: ["espalda", "hombro_biceps"],
    before: "Curl martillo",
  },
  {
    // Reemplazado por el curl con barra Z (incomodaba los antebrazos)
    id: "remove-curl-biceps-polea",
    exercise: "Curl de bíceps con polea",
    slots: ["espalda", "hombro_biceps"],
    action: "remove",
  },
  {
    // Face pull y "Face-pull o reverse peck deck" eran el mismo ejercicio
    id: "rename-face-pull",
    exercise: "Face-pull o reverse peck deck",
    slots: ["espalda", "hombro_biceps", "hombro_triceps"],
    action: "rename",
    renameTo: "Face pull",
  },
];

export function insertExerciseBefore(
  list: string[],
  exercise: string,
  before: string,
): string[] {
  if (list.includes(exercise)) return list;
  const idx = list.indexOf(before);
  if (idx === -1) return [...list, exercise];
  return [...list.slice(0, idx), exercise, ...list.slice(idx)];
}

/**
 * Pasa cada ejercicio por los alias (p. ej. variantes del crunch en polea) y
 * quita los duplicados que resulten, conservando el primero.
 */
export function canonicalizeRoutines(routines: CustomRoutines): CustomRoutines {
  const fix = (list: string[]) => [...new Set(list.map(canonicalExerciseName))];
  return {
    pecho: fix(routines.pecho),
    espalda: fix(routines.espalda),
    hombro_biceps: fix(routines.hombro_biceps),
    hombro_triceps: fix(routines.hombro_triceps),
    pierna: fix(routines.pierna),
  };
}

/** Cambia el nombre en su misma posición; si el nuevo ya estaba, quita el viejo. */
export function renameExercise(list: string[], from: string, to: string): string[] {
  if (!list.includes(from)) return list;
  if (list.includes(to)) return list.filter((name) => name !== from);
  return list.map((name) => (name === from ? to : name));
}

export function mergeNewDefaults(
  routines: CustomRoutines,
  appliedIds: string[],
): { routines: CustomRoutines; appliedIds: string[] } {
  const next = { ...routines };
  const applied = [...appliedIds];
  for (const item of NEW_DEFAULT_EXERCISES) {
    if (applied.includes(item.id)) continue;
    for (const slot of item.slots) {
      next[slot] =
        item.action === "remove"
          ? next[slot].filter((name) => name !== item.exercise)
          : item.action === "rename"
            ? renameExercise(next[slot], item.exercise, item.renameTo ?? item.exercise)
            : insertExerciseBefore(next[slot], item.exercise, item.before ?? "");
    }
    applied.push(item.id);
  }
  return { routines: next, appliedIds: applied };
}

function applyNewDefaultExercises(routines: CustomRoutines): CustomRoutines {
  let appliedIds: string[] = [];
  try {
    const raw = localStorage.getItem(ADDED_DEFAULTS_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) appliedIds = parsed.filter((v) => typeof v === "string");
  } catch {}

  const merged = mergeNewDefaults(routines, appliedIds);
  const canonical = canonicalizeRoutines(merged.routines);
  const changed = JSON.stringify(canonical) !== JSON.stringify(routines);
  if (changed || merged.appliedIds.length !== appliedIds.length) {
    try {
      localStorage.setItem(CUSTOM_ROUTINES_STORAGE_KEY, JSON.stringify(canonical));
      localStorage.setItem(ADDED_DEFAULTS_STORAGE_KEY, JSON.stringify(merged.appliedIds));
    } catch {}
  }
  return canonical;
}

/**
 * Guarda las rutinas personalizadas en el almacenamiento local.
 */
export function saveCustomRoutines(routines: CustomRoutines): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CUSTOM_ROUTINES_STORAGE_KEY, JSON.stringify(routines));
    // Lo guardado ya refleja el catálogo actual: no reinsertar lo que se quitó.
    localStorage.setItem(
      ADDED_DEFAULTS_STORAGE_KEY,
      JSON.stringify(NEW_DEFAULT_EXERCISES.map((item) => item.id)),
    );
  } catch (err) {
    console.error("Error guardando rutinas personalizadas:", err);
  }
}

/**
 * Restablece las rutinas al valor predeterminado de fábrica.
 */
export function resetCustomRoutines(): CustomRoutines {
  const defaults = getDefaultRoutines();
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(CUSTOM_ROUTINES_STORAGE_KEY);
    } catch {}
  }
  return defaults;
}

/**
 * Obtiene los ejercicios personalizados para un día y enfoque específico.
 */
export function getExercisesForDayCustom(
  day: DayType,
  armFocus?: ArmFocus | null,
  customRoutines?: CustomRoutines,
): string[] {
  const routines = customRoutines ?? loadCustomRoutines();

  switch (day) {
    case "pecho":
      return [...routines.pecho];
    case "espalda":
      return [...routines.espalda];
    case "hombro":
      if (armFocus === "triceps") return [...routines.hombro_triceps];
      if (armFocus === "biceps") return [...routines.hombro_biceps];
      return [...routines.hombro_biceps];
    case "pierna":
      return [...routines.pierna];
    default:
      return [];
  }
}
