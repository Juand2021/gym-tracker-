/** Rack del gimnasio: 10–60 lb en saltos de 5. */
export const DUMBBELL_LBS: number[] = [
  10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60,
];

const LB_TO_KG = 1 / 2.2046226218;

/** Ejercicios de mancuerna (alineado con loadMode dumbbell en exercises.ts). */
const DUMBBELL_EXERCISES = new Set([
  "Press inclinado con mancuernas",
  "Curl martillo",
  "Bíceps con mancuernas",
  "Bíceps unilateral concentrado",
  "Curl de antebrazo con mancuernas",
  "Curl inverso de antebrazo con mancuernas",
  "Contracción de antebrazo",
  "Aducción de antebrazo",
  "Press militar con mancuernas",
]);

export type DumbbellOption = {
  lbs: number;
  kg: number;
};

export function lbsToKg(lbs: number): number {
  return Math.round(lbs * LB_TO_KG * 10) / 10;
}

function formatKg(kg: number): string {
  return Number.isInteger(kg) ? String(kg) : kg.toFixed(1).replace(/\.0$/, "");
}

export function buildDumbbellRack(): DumbbellOption[] {
  return DUMBBELL_LBS.map((lbs) => ({
    lbs,
    kg: lbsToKg(lbs),
  }));
}

export function formatDumbbellLbs(lbs: number): string {
  return Number.isInteger(lbs) ? String(lbs) : String(lbs);
}

/** Activa el rack en ejercicios de mancuerna (incl. nombres libres de antebrazo). */
export function hasDumbbellRackPicker(exercise: string): boolean {
  if (DUMBBELL_EXERCISES.has(exercise)) return true;
  const key = exercise
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
  if (key.includes("mancuerna")) return true;
  return (
    (key.includes("contraccion") && key.includes("antebrazo")) ||
    (key.includes("aduccion") && key.includes("antebrazo"))
  );
}

/** Lb del rack más cercano a un peso en kg; null si no hay peso útil. */
export function nearestDumbbellLbs(weightKg: number): number | null {
  if (!Number.isFinite(weightKg) || weightKg <= 0) return null;

  const rack = buildDumbbellRack();
  let best = rack[0];
  let bestDiff = Math.abs(best.kg - weightKg);
  for (let i = 1; i < rack.length; i++) {
    const diff = Math.abs(rack[i].kg - weightKg);
    if (diff < bestDiff) {
      best = rack[i];
      bestDiff = diff;
    }
  }
  return best.lbs;
}

export function formatDumbbellTriggerKg(kg: number): string {
  return formatKg(kg);
}
