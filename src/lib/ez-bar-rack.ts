/** Barras Z fijas del gimnasio (kg). */
export const EZ_BAR_KG: number[] = [20, 22.5, 25, 27.5, 30, 35, 40];

const EZ_BAR_EXERCISES = new Set([
  "Press francés con barra Z",
]);

export type EzBarOption = {
  kg: number;
};

function formatKg(kg: number): string {
  return Number.isInteger(kg) ? String(kg) : kg.toFixed(1).replace(/\.0$/, "");
}

export function formatEzBarKg(kg: number): string {
  return formatKg(kg);
}

export function buildEzBarRack(): EzBarOption[] {
  return EZ_BAR_KG.map((kg) => ({ kg }));
}

export function hasEzBarRackPicker(exercise: string): boolean {
  if (EZ_BAR_EXERCISES.has(exercise)) return true;
  const key = exercise
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
  return key.includes("barra z") || key.includes("barra ez");
}

/** Kg del rack más cercano; null si no hay peso útil. */
export function nearestEzBarKg(weightKg: number): number | null {
  if (!Number.isFinite(weightKg) || weightKg <= 0) return null;

  let best = EZ_BAR_KG[0];
  let bestDiff = Math.abs(best - weightKg);
  for (let i = 1; i < EZ_BAR_KG.length; i++) {
    const diff = Math.abs(EZ_BAR_KG[i] - weightKg);
    if (diff < bestDiff) {
      best = EZ_BAR_KG[i];
      bestDiff = diff;
    }
  }
  return best;
}
