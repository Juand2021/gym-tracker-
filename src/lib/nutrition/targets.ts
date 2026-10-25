import { ageOn, type NutritionProfile } from "./profile.ts";

/**
 * Objetivos diarios según las reglas de la Fase 1 (docs/nutricion/01-investigacion.md §"Reglas de cálculo").
 * Funciones puras: sirven para cualquier perfil completo (ver missingForTargets).
 */

export type TargetsInput = {
  profile: NutritionProfile;
  /** Último pesaje (Fuerza) o el peso declarado en el perfil. */
  weightKg: number;
  /** Fechas (YYYY-MM-DD) de sesiones de pesas en los últimos 28 días (historial de Fuerza). */
  workoutDates: string[];
  today: string;
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
  basis: {
    weightKg: number;
    age: number;
    ffmKg: number;
    sessionsPerWeek: number;
    sessionsSource: "historial" | "declarado" | "ninguno";
    trainingKcalPerDay: number;
    phaseKcal: number;
  };
  warnings: string[];
};

const KCAL_PER_KG = 7700;

/** % de grasa que se supone cuando solo hay una estimación a ojo (por sexo). */
const BF_FROM_ESTIMATE = { M: { bajo: 12, medio: 18, alto: 25 }, F: { bajo: 20, medio: 27, alto: 34 } } as const;

/** Factor del día sin contar las pesas (PAL). Si hay pasos, se usa sedentario + pasos extra. */
const PAL: Record<NonNullable<NutritionProfile["activity"]>, number> = { sedentario: 1.4, ligero: 1.5, activo: 1.6, muy_activo: 1.75 };

export function bodyFatFor(profile: NutritionProfile): number | null {
  if (profile.bodyFatPct != null) return profile.bodyFatPct;
  if (profile.bodyFatEstimate && profile.sex) return BF_FROM_ESTIMATE[profile.sex][profile.bodyFatEstimate];
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
  const phase = profile.phase;
  if (!profile.sex || !profile.birthDate || !profile.heightCm || !phase) throw new Error("Perfil incompleto: faltan datos para calcular los objetivos.");
  const age = ageOn(profile.birthDate, today);
  const warnings: string[] = [];

  // Sesiones: el historial real de Fuerza manda; si no hay, lo que declaró.
  const sessions28 = new Set(input.workoutDates).size;
  const declared = profile.trainingDaysPerWeek ?? 0;
  const sessionsSource = sessions28 > 0 ? "historial" : declared > 0 ? "declarado" : "ninguno";
  const sessionsPerWeek = sessions28 > 0 ? sessions28 / 4 : declared;
  const rmr = restingKcal(profile.sex, W, profile.heightCm, age, sessionsPerWeek >= 3);

  // TDEE por partes: base + pesas + pasos sobre 5.000.
  const minutes = Math.min(profile.sessionMinutes, 120);
  const perSession = minutes * 4.7 - (minutes * rmr) / 1440;
  const trainingKcalPerDay = (sessionsPerWeek * perSession) / 7;
  const base = profile.stepsPerDay != null ? rmr * 1.4 + Math.max(0, profile.stepsPerDay - 5000) * 0.04 * (W / 75) : rmr * PAL[profile.activity ?? "sedentario"];
  const tdee = base + trainingKcalPerDay;

  const bf = bodyFatFor(profile);
  const ffm = bf != null ? W * (1 - bf / 100) : W * 0.8;

  const rate = phase.ratePctPerWeek / 100;
  let phaseKcal = 0;
  if (phase.type === "deficit") {
    phaseKcal = -(rate * W * KCAL_PER_KG) / 7;
    if (phase.ratePctPerWeek > 1.0) warnings.push("Ritmo mayor al 1 %/semana: solo por pocas semanas.");
  } else if (phase.type === "recomposicion") {
    phaseKcal = -tdee * 0.05;
  } else if (phase.type === "volumen") {
    phaseKcal = (rate * W * KCAL_PER_KG) / 7;
    if (bf != null && bf > (profile.sex === "M" ? 20 : 30)) warnings.push("Con la grasa alta conviene primero un déficit o recomposición antes del volumen.");
  }
  let kcal = tdee + phaseKcal;

  const minKcal = Math.max(25 * ffm + trainingKcalPerDay, profile.sex === "M" ? 1500 : 1200);
  if (kcal < minKcal) {
    warnings.push("El déficit pedido queda por debajo del mínimo seguro; se usa el mínimo.");
    kcal = minKcal;
  }

  // Proteína: déficit 2,2 g/kg (2,4 si es agresivo); con grasa > 25 % (hombres) / 32 % (mujeres) se usa la masa magra.
  const highFat = bf != null && bf > (profile.sex === "M" ? 25 : 32);
  let protein: number;
  if (phase.type === "deficit") {
    protein = highFat ? 2.6 * ffm : (phase.ratePctPerWeek >= 1 ? 2.4 : 2.2) * W;
  } else if (phase.type === "volumen") {
    protein = 1.8 * W;
  } else {
    protein = highFat ? 2.4 * ffm : 2.0 * W;
  }

  // Grasa: 25 % de las kcal (30 % en volumen), con piso de max(0,6 g/kg, 20 %).
  const fatShare = phase.type === "volumen" ? 0.3 : 0.25;
  const fat = Math.max((fatShare * kcal) / 9, 0.6 * W, (0.2 * kcal) / 9);
  const carbs = Math.max(0, (kcal - protein * 4 - fat * 9) / 4);
  if (phase.type === "deficit" && carbs < 2 * W && sessionsPerWeek >= 3) warnings.push("Carbohidratos bajos (< 2 g/kg): puede afectar el rendimiento en el gym.");

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
      sessionsSource,
      trainingKcalPerDay: Math.round(trainingKcalPerDay),
      phaseKcal: Math.round(phaseKcal),
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

/** Resultado de pedir los objetivos de una persona: o hay objetivos, o faltan datos del perfil. */
export type TargetsLookup =
  | { ok: true; targets: Targets; profile: NutritionProfile }
  | { ok: false; missing: string[]; profile: NutritionProfile | null };

/** Grasa corporal estimada con cinta métrica (método de la Marina de EE. UU.), solo hombres sin cadera. */
export function navyBodyFat(sex: "M" | "F", heightCm: number, waistCm: number, neckCm: number, hipCm?: number | null): number | null {
  if (sex === "M") {
    if (waistCm - neckCm <= 0) return null;
    const bf = 495 / (1.0324 - 0.19077 * Math.log10(waistCm - neckCm) + 0.15456 * Math.log10(heightCm)) - 450;
    return Math.round(bf * 10) / 10;
  }
  if (!hipCm || waistCm + hipCm - neckCm <= 0) return null;
  const bf = 495 / (1.29579 - 0.35004 * Math.log10(waistCm + hipCm - neckCm) + 0.221 * Math.log10(heightCm)) - 450;
  return Math.round(bf * 10) / 10;
}
