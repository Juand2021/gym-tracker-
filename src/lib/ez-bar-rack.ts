import {
  PLATE_LBS,
  addPlate,
  buildBarbellLoad,
  nearestPlateLoad,
  plateFits,
  type BarbellLoad,
} from "./barbell-plates.ts";

/** Discos disponibles en el gym (lb), los mismos que en press de banca. */
export const EZ_PLATE_LBS: number[] = PLATE_LBS;

/** Barra Z olímpica estándar del gym, vacía (lb). ≈ 11.3 kg. */
export const EZ_BAR_LBS = 25;

/** Largo útil de cada manga corta: caben 4 discos de 45 lb por lado. */
export const EZ_SLEEVE_CAPACITY = 64;

const EZ_BAR_EXERCISES = new Set([
  "Press francés con barra Z",
  "Curl de bíceps con barra Z",
]);

export function hasEzBarPlatePicker(exercise: string): boolean {
  if (EZ_BAR_EXERCISES.has(exercise)) return true;
  const key = exercise
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
  return key.includes("barra z") || key.includes("barra ez");
}

export function ezPlateFits(platesPerSide: number[], plateLbs: number): boolean {
  return plateFits(platesPerSide, plateLbs, EZ_SLEEVE_CAPACITY);
}

/** Agrega un disco por lado solo si cabe en la manga. */
export function addEzPlate(platesPerSide: number[], plateLbs: number): number[] {
  return addPlate(platesPerSide, plateLbs, EZ_SLEEVE_CAPACITY);
}

export function buildEzLoad(platesPerSide: number[]): BarbellLoad {
  return buildBarbellLoad(platesPerSide, EZ_BAR_LBS);
}

export function emptyEzLoad(): BarbellLoad {
  return buildEzLoad([]);
}

/** Carga más cercana a un peso en kg sin pasarse de lo que cabe en la manga. */
export function nearestEzLoad(weightKg: number): BarbellLoad {
  return nearestPlateLoad(weightKg, EZ_BAR_LBS, EZ_SLEEVE_CAPACITY);
}
