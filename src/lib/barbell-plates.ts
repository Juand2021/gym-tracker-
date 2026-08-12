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

export type BarbellLoad = {
  barLbs: number;
  /** Discos de un lado, de dentro (cerca del collar) hacia fuera. */
  platesPerSide: number[];
  totalLbs: number;
  totalKg: number;
};

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
  return BARBELL_EXERCISES.has(exercise);
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

export function emptyBarbellLoad(): BarbellLoad {
  return {
    barLbs: OLYMPIC_BAR_LBS,
    platesPerSide: [],
    totalLbs: OLYMPIC_BAR_LBS,
    totalKg: lbsToKg(OLYMPIC_BAR_LBS),
  };
}

export function buildBarbellLoad(platesPerSide: number[]): BarbellLoad {
  const barLbs = OLYMPIC_BAR_LBS;
  const lbs = totalLbs(barLbs, platesPerSide);
  return {
    barLbs,
    platesPerSide: [...platesPerSide],
    totalLbs: lbs,
    totalKg: lbsToKg(lbs),
  };
}

/** Clase visual por tamaño de disco. */
export function plateSizeClass(lbs: number): string {
  if (lbs >= 45) return "plate-45";
  if (lbs >= 25) return "plate-25";
  if (lbs >= 10) return "plate-10";
  if (lbs >= 5) return "plate-5";
  return "plate-2";
}

/**
 * Descompone un peso en kg a la carga más cercana con barra + discos
 * (greedy por lado, disco más grande primero).
 */
export function nearestPlateLoad(weightKg: number): BarbellLoad {
  if (!Number.isFinite(weightKg) || weightKg <= 0) {
    return emptyBarbellLoad();
  }

  // Totales posibles son múltiplos de 5 lb (barra 45 + pares de 2.5).
  const rawLbs = weightKg * KG_TO_LB;
  const targetLbs = Math.round(rawLbs / 5) * 5;
  const sideTarget = Math.max(0, (targetLbs - OLYMPIC_BAR_LBS) / 2);

  const candidates = [
    emptyBarbellLoad(),
    buildBarbellLoad(greedyPlates(sideTarget)),
    buildBarbellLoad(greedyPlates(Math.max(0, sideTarget - 2.5))),
    buildBarbellLoad(greedyPlates(sideTarget + 2.5)),
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

  // Tolerancia pequeña por flotantes.
  for (const plate of platesDesc) {
    while (remaining + 1e-9 >= plate) {
      result.push(plate);
      remaining -= plate;
    }
  }

  // Orden visual: grande primero cerca del collar suele verse bien;
  // mantenemos el orden de colocación greedy (grandes adentro).
  return result;
}

export function addPlate(
  platesPerSide: number[],
  plateLbs: number,
): number[] {
  if (!PLATE_LBS.includes(plateLbs)) return platesPerSide;
  return [...platesPerSide, plateLbs];
}

export function removeOutermostPlate(platesPerSide: number[]): number[] {
  if (platesPerSide.length === 0) return platesPerSide;
  return platesPerSide.slice(0, -1);
}
