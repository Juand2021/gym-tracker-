/** Barra olímpica típica en gyms con discos en lb. */
export const OLYMPIC_BAR_LBS = 45;

/** Discos disponibles por lado (lb). */
export const PLATE_LBS: number[] = [2.5, 5, 10, 25, 45];

const LB_TO_KG = 1 / 2.2046226218;
const KG_TO_LB = 2.2046226218;

const BARBELL_EXERCISES = new Set([
  "Press banca",
  "Encogimiento de hombros",
  "Sentadilla libre",
  "Peso muerto rumano",
]);

const PLATE_MACHINE_EXERCISES = new Set([
  "Remo en máquina con discos",
  "Remo con máquina de discos",
  "Remo en máquina (discos)",
  "Remo con máquina",
]);

/**
 * Grosor visual de cada disco (unidades SVG de los selectores). Sirve para
 * dibujar y para saber cuántos discos caben en cada manga.
 */
export const PLATE_THICKNESS: Record<number, number> = {
  45: 14,
  25: 12,
  10: 10,
  5: 8,
  2.5: 7,
};

/** Separación entre discos (unidades SVG). */
export const PLATE_GAP = 2;

/** Largo útil de la manga de la barra olímpica: 7 discos de 45 lb por lado. */
export const OLYMPIC_SLEEVE_CAPACITY = 112;

/** Largo útil de los tubos de carga de la máquina de remo: 5 discos de 45 lb. */
export const MACHINE_SLEEVE_CAPACITY = 80;

export type BarbellLoad = {
  barLbs: number;
  /** Discos de un lado, de dentro (cerca del collar) hacia fuera. */
  platesPerSide: number[];
  totalLbs: number;
  totalKg: number;
};

export function isPlateMachineExercise(exercise: string): boolean {
  if (PLATE_MACHINE_EXERCISES.has(exercise)) return true;
  const key = exercise
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
  return (
    key.includes("remo en maquina") ||
    key.includes("remo con maquina") ||
    key.includes("maquina con discos") ||
    key.includes("maquina de discos")
  );
}

export function lbsToKg(lbs: number): number {
  return Math.round(lbs * LB_TO_KG * 10) / 10;
}

function formatKg(kg: number): string {
  return Number.isInteger(kg) ? String(kg) : kg.toFixed(1).replace(/\.0$/, "");
}

export function formatBarbellLbs(lbs: number): string {
  return Number.isInteger(lbs) ? String(lbs) : String(lbs);
}

export function formatBarbellTriggerKg(kg: number): string {
  return formatKg(kg);
}

export function hasBarbellPlatePicker(exercise: string): boolean {
  return BARBELL_EXERCISES.has(exercise) || isPlateMachineExercise(exercise);
}

export function getBaseEquipmentLbs(exercise: string): number {
  return isPlateMachineExercise(exercise) ? 0 : OLYMPIC_BAR_LBS;
}

export function getSleeveCapacity(exercise: string): number {
  return isPlateMachineExercise(exercise)
    ? MACHINE_SLEEVE_CAPACITY
    : OLYMPIC_SLEEVE_CAPACITY;
}

export function plateFootprint(lbs: number): number {
  return (PLATE_THICKNESS[lbs] ?? 8) + PLATE_GAP;
}

/** Espacio ocupado en una manga por los discos de un lado. */
export function sleeveUsed(platesPerSide: number[]): number {
  return platesPerSide.reduce((sum, lbs) => sum + plateFootprint(lbs), 0);
}

export function plateFits(
  platesPerSide: number[],
  plateLbs: number,
  capacity: number = OLYMPIC_SLEEVE_CAPACITY,
): boolean {
  return sleeveUsed(platesPerSide) + plateFootprint(plateLbs) <= capacity;
}

/** Quita discos exteriores hasta que la carga quepa en la manga. */
export function trimToCapacity(platesPerSide: number[], capacity: number): number[] {
  const plates = [...platesPerSide];
  while (plates.length > 0 && sleeveUsed(plates) > capacity) plates.pop();
  return plates;
}

export function platesPerSideSum(platesPerSide: number[]): number {
  return platesPerSide.reduce((sum, p) => sum + p, 0);
}

export function totalLbs(barLbs: number, platesPerSide: number[]): number {
  return barLbs + 2 * platesPerSideSum(platesPerSide);
}

export function totalKg(barLbs: number, platesPerSide: number[]): number {
  return lbsToKg(totalLbs(barLbs, platesPerSide));
}

export function emptyBarbellLoad(baseLbs: number = OLYMPIC_BAR_LBS): BarbellLoad {
  return {
    barLbs: baseLbs,
    platesPerSide: [],
    totalLbs: baseLbs,
    totalKg: lbsToKg(baseLbs),
  };
}

export function buildBarbellLoad(
  platesPerSide: number[],
  baseLbs: number = OLYMPIC_BAR_LBS,
): BarbellLoad {
  const lbs = totalLbs(baseLbs, platesPerSide);
  return {
    barLbs: baseLbs,
    platesPerSide: [...platesPerSide],
    totalLbs: lbs,
    totalKg: lbsToKg(lbs),
  };
}

/**
 * Descompone un peso en kg a la carga más cercana con barra/máquina + discos
 * (greedy por lado, disco más grande primero).
 */
export function nearestPlateLoad(
  weightKg: number,
  baseLbs: number = OLYMPIC_BAR_LBS,
  capacity: number = Number.POSITIVE_INFINITY,
): BarbellLoad {
  if (!Number.isFinite(weightKg) || weightKg < 0) {
    return emptyBarbellLoad(baseLbs);
  }

  // Totales posibles son múltiplos de 5 lb (base + pares de 2.5).
  const rawLbs = weightKg * KG_TO_LB;
  const targetLbs = Math.round(rawLbs / 5) * 5;
  const sideTarget = Math.max(0, (targetLbs - baseLbs) / 2);

  const fit = (plates: number[]) =>
    buildBarbellLoad(trimToCapacity(plates, capacity), baseLbs);
  const candidates = [
    emptyBarbellLoad(baseLbs),
    fit(greedyPlates(sideTarget)),
    fit(greedyPlates(Math.max(0, sideTarget - 2.5))),
    fit(greedyPlates(sideTarget + 2.5)),
  ];

  let best = candidates[0];
  let bestDiff = Math.abs(best.totalKg - weightKg);
  for (let i = 1; i < candidates.length; i++) {
    const diff = Math.abs(candidates[i].totalKg - weightKg);
    if (diff < bestDiff) {
      best = candidates[i];
      bestDiff = diff;
    }
  }
  return best;
}

function greedyPlates(sideLbs: number): number[] {
  const platesDesc = [...PLATE_LBS].sort((a, b) => b - a);
  const result: number[] = [];
  let remaining = sideLbs;

  for (const plate of platesDesc) {
    while (remaining + 1e-9 >= plate) {
      result.push(plate);
      remaining -= plate;
    }
  }

  return result;
}

export function addPlate(
  platesPerSide: number[],
  plateLbs: number,
  capacity: number = Number.POSITIVE_INFINITY,
): number[] {
  if (!PLATE_LBS.includes(plateLbs)) return platesPerSide;
  if (!plateFits(platesPerSide, plateLbs, capacity)) return platesPerSide;
  return [...platesPerSide, plateLbs];
}

export function removeOutermostPlate(platesPerSide: number[]): number[] {
  if (platesPerSide.length === 0) return platesPerSide;
  return platesPerSide.slice(0, -1);
}
