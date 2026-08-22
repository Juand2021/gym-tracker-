export type DayType = "pecho" | "espalda" | "hombro" | "pierna";
export type ArmFocus = "biceps" | "triceps";

export const DAY_OPTIONS: Array<{
  id: DayType;
  label: string;
  subtitle: string;
}> = [
  {
    id: "pecho",
    label: "Pecho",
    subtitle: "Tríceps obligatorio",
  },
  {
    id: "espalda",
    label: "Espalda",
    subtitle: "Bíceps obligatorio",
  },
  {
    id: "hombro",
    label: "Hombro",
    subtitle: "Eliges bíceps o tríceps",
  },
  {
    id: "pierna",
    label: "Pierna",
    subtitle: "Sin brazos",
  },
];

const CHEST: string[] = [
  "Press banca",
  "Press inclinado con mancuernas",
  "Pec deck",
  "Cruce de poleas alto",
  "Fondos",
];

const TRICEPS: string[] = [
  "Press francés con barra Z",
  "Extensión de tríceps con cuerda",
  "Extensión de tríceps trasnuca",
  "Extensión de tríceps unilateral",
];

const BACK: string[] = [
  "Dominadas",
  "Jalón al pecho",
  "Remo con máquina",
  "Remo unilateral con agarre de polea",
  "Face pull",
];

const BICEPS: string[] = [
  "Curl martillo",
  "Bíceps con mancuernas",
  "Bíceps unilateral concentrado",
  "Bíceps barra Z",
];

/** Antebrazo: suele ir al final del trabajo de bíceps. */
const FOREARMS: string[] = [
  "Curl de antebrazo con mancuernas",
  "Curl inverso de antebrazo con mancuernas",
];

const SHOULDERS: string[] = [
  "Dominadas agarre neutro",
  "Press militar con mancuernas",
  "Elevaciones unilaterales con cable",
  "Elevaciones hacia el frente unilaterales con cable",
  "Face-pull o reverse peck deck",
  "Encogimiento de hombros",
];

const LEGS: string[] = [
  "Sentadilla libre",
  "Peso muerto rumano",
  "Extensión de espalda",
  "Extensión de cuádriceps",
  "Prensa de pierna",
  "Extensión de gemelos",
  "Aducción de cadera",
];

const ABS_CORE: string[] = [
  "Crunch abdominal en polea",
  "Elevación de piernas",
  "Rueda abdominal",
  "Plancha abdominal",
  "Crunch abdominal",
  "Oblicuos en polea",
];

export const CATALOG_EXERCISES_BY_GROUP: Array<{
  group: string;
  exercises: string[];
}> = [
  { group: "Abdomen y Core", exercises: ABS_CORE },
  { group: "Pecho", exercises: CHEST },
  { group: "Espalda", exercises: BACK },
  { group: "Hombro", exercises: SHOULDERS },
  { group: "Pierna", exercises: LEGS },
  { group: "Bíceps", exercises: BICEPS },
  { group: "Tríceps", exercises: TRICEPS },
  { group: "Antebrazo", exercises: FOREARMS },
];

export function getDayLabel(day: DayType): string {
  return DAY_OPTIONS.find((d) => d.id === day)?.label ?? day;
}

export function getExercisesForDay(
  day: DayType,
  armFocus?: ArmFocus | null,
): string[] {
  switch (day) {
    case "pecho":
      return [...CHEST, ...TRICEPS];
    case "espalda":
      return [...BACK, ...BICEPS, ...FOREARMS];
    case "hombro":
      if (armFocus === "triceps") return [...SHOULDERS, ...TRICEPS];
      if (armFocus === "biceps") return [...SHOULDERS, ...BICEPS, ...FOREARMS];
      return [...SHOULDERS];
    case "pierna":
      return [...LEGS];
    default:
      return [];
  }
}

export const ALL_ROUTINE_EXERCISES: string[] = [
  ...new Set([
    ...CHEST,
    ...TRICEPS,
    ...BACK,
    ...BICEPS,
    ...FOREARMS,
    ...SHOULDERS,
    ...LEGS,
    ...ABS_CORE,
  ]),
];
