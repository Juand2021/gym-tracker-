/**
 * Utilidades y persistencia para la personalización de las rutinas de entrenamiento.
 * Permite al usuario modificar la lista de ejercicios de cada día (Pecho, Espalda, Hombro, Pierna).
 */

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
  "Curl martillo",
  "Bíceps con mancuernas",
  "Bíceps unilateral concentrado",
  "Curl de bíceps con polea",
  "Curl de antebrazo con mancuernas",
  "Curl inverso de antebrazo con mancuernas",
  "Crunch de polea alta",
];

export const DEFAULT_HOMBRO_BICEPS: string[] = [
  "Dominadas agarre neutro",
  "Press militar con mancuernas",
  "Elevaciones unilaterales con cable",
  "Elevaciones hacia el frente unilaterales con cable",
  "Face-pull o reverse peck deck",
  "Encogimiento de hombros",
  "Curl martillo",
  "Bíceps con mancuernas",
  "Bíceps unilateral concentrado",
  "Curl de bíceps con polea",
  "Curl de antebrazo con mancuernas",
  "Curl inverso de antebrazo con mancuernas",
];

export const DEFAULT_HOMBRO_TRICEPS: string[] = [
  "Dominadas agarre neutro",
  "Press militar con mancuernas",
  "Elevaciones unilaterales con cable",
  "Elevaciones hacia el frente unilaterales con cable",
  "Face-pull o reverse peck deck",
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
    return {
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
  } catch {
    return getDefaultRoutines();
  }
}

/**
 * Guarda las rutinas personalizadas en el almacenamiento local.
 */
export function saveCustomRoutines(routines: CustomRoutines): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CUSTOM_ROUTINES_STORAGE_KEY, JSON.stringify(routines));
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
