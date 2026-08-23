export type StackPlate = {
  index: number;
  size: "small" | "large";
  plateKg: number;
  /** Peso acumulado si el pin está en esta placa (esta + todas las de arriba). */
  cumulativeKg: number;
};

export type MachineStackConfig = {
  exercise: string;
  smallKg: number;
  smallCount: number;
  largeKg: number;
  largeCount: number;
};

/** Stack compartido del parque de cables/poleas (espalda, pecho, hombro, tríceps). */
const CABLE_STACK = {
  smallKg: 2.5,
  smallCount: 5,
  largeKg: 5,
  largeCount: 8,
} as const;

/** Stacks con selector visual. Whitelist por ejercicio. */
export const MACHINE_STACKS: MachineStackConfig[] = [
  { exercise: "Jalón al pecho", ...CABLE_STACK },
  { exercise: "Remo unilateral con agarre de polea", ...CABLE_STACK },
  { exercise: "Remo unilateral (agarre al tronco)", ...CABLE_STACK },
  { exercise: "Face pull", ...CABLE_STACK },
  { exercise: "Cruce de poleas alto", ...CABLE_STACK },
  { exercise: "Extensión de tríceps con cuerda", ...CABLE_STACK },
  { exercise: "Extensión de tríceps trasnuca", ...CABLE_STACK },
  { exercise: "Extensión de tríceps unilateral", ...CABLE_STACK },
  { exercise: "Curl de bíceps con polea", ...CABLE_STACK },
  { exercise: "Bíceps con polea", ...CABLE_STACK },
  { exercise: "Elevaciones unilaterales con cable", ...CABLE_STACK },
  {
    exercise: "Elevaciones hacia el frente unilaterales con cable",
    ...CABLE_STACK,
  },
  { exercise: "Face-pull o reverse peck deck", ...CABLE_STACK },
  { exercise: "Extensión de cuádriceps", ...CABLE_STACK },
  { exercise: "Aducción de cadera", ...CABLE_STACK },
  { exercise: "Crunch de polea alta", ...CABLE_STACK },
  { exercise: "Crunch en polea alta", ...CABLE_STACK },
  { exercise: "Crunch abdominal en polea", ...CABLE_STACK },
  { exercise: "Oblicuos en polea", ...CABLE_STACK },
];

function normalizeStackKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

export function getMachineStack(exercise: string): MachineStackConfig | null {
  if (!exercise) return null;
  const direct = MACHINE_STACKS.find((s) => s.exercise === exercise);
  if (direct) return direct;
  const key = normalizeStackKey(exercise);
  return (
    MACHINE_STACKS.find((s) => normalizeStackKey(s.exercise) === key) ?? null
  );
}

export function hasMachineStackPicker(exercise: string): boolean {
  return getMachineStack(exercise) != null;
}

/** Placas de arriba → abajo: pequeñas primero, luego grandes. */
export function buildStackPlates(config: MachineStackConfig): StackPlate[] {
  const plates: StackPlate[] = [];
  let cumulative = 0;

  for (let i = 0; i < config.smallCount; i++) {
    cumulative += config.smallKg;
    plates.push({
      index: plates.length,
      size: "small",
      plateKg: config.smallKg,
      cumulativeKg: cumulative,
    });
  }

  for (let i = 0; i < config.largeCount; i++) {
    cumulative += config.largeKg;
    plates.push({
      index: plates.length,
      size: "large",
      plateKg: config.largeKg,
      cumulativeKg: cumulative,
    });
  }

  return plates;
}

export function formatStackKg(kg: number): string {
  return Number.isInteger(kg) ? String(kg) : kg.toFixed(1).replace(/\.0$/, "");
}

const KG_TO_LB = 2.2046226218;

/** Conversión solo visual; la app sigue guardando kilogramos. */
export function kgToLbs(kg: number): number {
  return kg * KG_TO_LB;
}

export function formatStackLbs(kg: number): string {
  const lbs = kgToLbs(kg);
  const rounded = Math.round(lbs * 10) / 10;
  return Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toFixed(1).replace(/\.0$/, "");
}

/** Índice de placa más cercano al peso, o -1 para 0 kg. */
export function nearestPlateIndex(
  plates: StackPlate[],
  weightKg: number,
): number {
  if (!Number.isFinite(weightKg) || weightKg <= 0) return -1;

  let best = 0;
  let bestDiff = Math.abs(plates[0].cumulativeKg - weightKg);
  for (let i = 1; i < plates.length; i++) {
    const diff = Math.abs(plates[i].cumulativeKg - weightKg);
    if (diff < bestDiff) {
      best = i;
      bestDiff = diff;
    }
  }
  return best;
}
