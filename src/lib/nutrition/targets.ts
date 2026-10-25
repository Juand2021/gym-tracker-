import { ageOn, type NutritionProfile } from "./profile.ts";

/**
 * Objetivos diarios según las reglas de la Fase 1 (docs/nutricion/01-investigacion.md §"Reglas de cálculo").
 * Funciones puras: reciben el perfil, el peso y los entrenos, y devuelven números redondeados.
 */

export type TargetsInput = {
  profile: NutritionProfile;
  /** Último peso registrado (o el de respaldo del perfil). */
  weightKg: number;
  /** Fechas (YYYY-MM-DD) de sesiones de pesas en los últimos 28 días. */
  workoutDates: string[];
  today: string;
  /** ¿Hoy hay entreno? Suma agua. */
  trainingToday?: boolean;
};

export type Targets = {
  rmr: number;
  tdee: number;
  kcal: number;
  minKcal: number;
  protein_g: number;
  fat_g: number;
  carb_g: number;
  fiber_g: number;
  water_l: number;
  /** Datos del cálculo para explicar al usuario. */
  basis: { weightKg: number; age: number; ffmKg: number; sessionsPerWeek: number; trainingKcalPerDay: number; deficitKcal: number };
  warnings: string[];
};

const KCAL_PER_KG = 7700;

/** % de grasa que se supone cuando solo hay una estimación a ojo. */
const BF_FROM_ESTIMATE = { bajo: 12, medio: 18, alto: 25 } as const;

export function bodyFatFor(profile: NutritionProfile): number | null {
  if (profile.bodyFatPct != null) return profile.bodyFatPct;
  if (profile.bodyFatEstimate) return BF_FROM_ESTIMATE[profile.bodyFatEstimate];
  return null;
}

/** Gasto en reposo: Mifflin; si entrena fuerza ≥3 días/semana, promedio con Tinsley (peso). */
export function restingKcal(sex: "M" | "F", weightKg: number, heightCm: number, age: number, liftsOften: boolean): number {
  const mifflin = 10 * weightKg + 6.25 * heightCm - 5 * age + (sex === "M" ? 5 : -161);
  if (!liftsOften) return mifflin;
  const tinsley = 24.8 * weightKg + 10;
  return (mifflin + tinsley) / 2;
}

export function computeTargets(input: TargetsInput): Targets {
  const { profile, weightKg: W, today } = input;
  const age = ageOn(profile.birthDate, today);
  const warnings: string[] = [];

  const sessions28 = new Set(input.workoutDates).size;
  const sessionsPerWeek = sessions28 / 4;
  const rmr = restingKcal(profile.sex, W, profile.heightCm, age, sessionsPerWeek >= 3);

  // TDEE por partes: base sedentaria + entreno real + pasos sobre 5.000.
  const minutes = Math.min(profile.sessionMinutes, 120);
  const perSession = minutes * 4.7 - (minutes * rmr) / 1440;
  const trainingKcalPerDay = (sessions28 * perSession) / 28;
  const extraSteps = Math.max(0, profile.stepsPerDay - 5000) * 0.04 * (W / 75);
  const tdee = rmr * 1.4 + trainingKcalPerDay + extraSteps;

  const bf = bodyFatFor(profile);
  const ffm = bf != null ? W * (1 - bf / 100) : W * 0.8;

  // Calorías según la fase.
  const rate = profile.phase.ratePctPerWeek / 100;
  let deficitKcal = 0;
  let kcal = tdee;
  if (profile.phase.type === "deficit") {
    deficitKcal = (rate * W * KCAL_PER_KG) / 7;
    kcal = tdee - deficitKcal;
    if (profile.phase.ratePctPerWeek > 1.0) warnings.push("Ritmo mayor al 1 %/semana: solo por pocas semanas.");
  } else if (profile.phase.type === "recomposicion") {
    kcal = tdee * 0.95;
  } else if (profile.phase.type === "volumen") {
    kcal = tdee + (rate * W * KCAL_PER_KG) / 7;
  }

  const minKcal = Math.max(25 * ffm + trainingKcalPerDay, profile.sex === "M" ? 1500 : 1200);
  if (kcal < minKcal) {
    warnings.push("El déficit pedido queda por debajo del mínimo seguro; se usa el mínimo.");
    kcal = minKcal;
  }

  // Proteína: déficit 2,2 g/kg (2,4 si es agresivo); con grasa > 25 % se usa la masa magra.
  let protein: number;
  if (profile.phase.type === "deficit") {
    const perKg = profile.phase.ratePctPerWeek >= 1 ? 2.4 : 2.2;
    protein = bf != null && bf > 25 ? 2.6 * ffm : perKg * W;
  } else if (profile.phase.type === "volumen") {
    protein = 1.8 * W;
  } else {
    protein = 2.0 * W;
  }

  // Grasa: 25 % de las kcal, con piso de max(0,6 g/kg, 20 %).
  const fat = Math.max(0.25 * kcal / 9, 0.6 * W, (0.2 * kcal) / 9);
  const carbs = Math.max(0, (kcal - protein * 4 - fat * 9) / 4);
  if (profile.phase.type === "deficit" && carbs < 2 * W) warnings.push("Carbohidratos bajos (< 2 g/kg): puede afectar el rendimiento.");

  const fiber = Math.max(25, (14 * kcal) / 1000);
  const water = (profile.sex === "M" ? 2.0 : 1.6) + (input.trainingToday ? (minutes / 60) * 0.75 : 0);

  return {
    rmr: Math.round(rmr),
    tdee: Math.round(tdee),
    kcal: Math.round(kcal / 10) * 10,
    minKcal: Math.round(minKcal),
    protein_g: Math.round(protein),
    fat_g: Math.round(fat),
    carb_g: Math.round(carbs),
    fiber_g: Math.round(fiber),
    water_l: Math.round(water * 10) / 10,
    basis: {
      weightKg: W,
      age,
      ffmKg: Math.round(ffm * 10) / 10,
      sessionsPerWeek: Math.round(sessionsPerWeek * 10) / 10,
      trainingKcalPerDay: Math.round(trainingKcalPerDay),
      deficitKcal: Math.round(deficitKcal),
    },
    warnings,
  };
}

/** Gramos de etanol a partir de ml y graduación (Fase 1 §5). */
export function ethanolGrams(ml: number, abvPct: number): number {
  return ml * (abvPct / 100) * 0.789;
}

/** Un día con más de 60 g de etanol se marca como fiesta. */
export const PARTY_ETHANOL_G = 60;
