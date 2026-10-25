/**
 * Perfil único por persona, compartido por Fuerza y Comidas (docs/nutricion/03-arquitectura.md §3.1).
 * Sirve para cualquier usuario: un perfil nuevo empieza vacío y se completa por el chat.
 */

export type PhaseType = "deficit" | "mantenimiento" | "recomposicion" | "volumen";
export type Sex = "M" | "F";
export type BodyFatEstimate = "bajo" | "medio" | "alto";
export type ActivityLevel = "sedentario" | "ligero" | "activo" | "muy_activo";
export type DietStyle = "omnivoro" | "pescetariano" | "vegetariano" | "vegano";

export type Phase = {
  type: PhaseType;
  start: string;
  end: string | null;
  /** % del peso por semana: negativo no se usa; en déficit es lo que se baja, en volumen lo que se sube. */
  ratePctPerWeek: number;
  objective: string;
};

export type NutritionProfile = {
  sex: Sex | null;
  birthDate: string | null; // YYYY-MM-DD; la edad se calcula
  heightCm: number | null;
  /** Peso declarado; se usa solo si no hay pesajes en Fuerza. */
  weightKg: number | null;
  /** Solo si viene de una medida fiable (DXA, bioimpedancia, cinta métrica). */
  bodyFatPct: number | null;
  /** Estimación a ojo mientras no hay medida. */
  bodyFatEstimate: BodyFatEstimate | null;
  activity: ActivityLevel | null;
  /** Pasos al día si los conoce (afina el gasto). */
  stepsPerDay: number | null;
  /** Días de pesas por semana si no hay historial en Fuerza. */
  trainingDaysPerWeek: number | null;
  sessionMinutes: number;
  dietStyle: DietStyle;
  /** Alimentos que no come o no le gustan (alergias, gustos). */
  avoidFoods: string[];
  mealsPerDay: number;
  phase: Phase | null;
  updatedAt: string;
};

export const EMPTY_PROFILE: NutritionProfile = {
  sex: null,
  birthDate: null,
  heightCm: null,
  weightKg: null,
  bodyFatPct: null,
  bodyFatEstimate: null,
  activity: null,
  stepsPerDay: null,
  trainingDaysPerWeek: null,
  sessionMinutes: 60,
  dietStyle: "omnivoro",
  avoidFoods: [],
  mealsPerDay: 4,
  phase: null,
  updatedAt: "",
};

/** Datos de Juan (Fase 0, confirmados el 2026-10-25: déficit grande = 1 %/semana, grasa estimada alta). */
export const JUAN_PROFILE: NutritionProfile = {
  ...EMPTY_PROFILE,
  sex: "M",
  birthDate: "2001-10-15",
  heightCm: 179,
  weightKg: 78,
  bodyFatEstimate: "alto",
  activity: "sedentario",
  stepsPerDay: 3500,
  trainingDaysPerWeek: 4,
  sessionMinutes: 90,
  mealsPerDay: 4,
  phase: {
    type: "deficit",
    start: "2026-10-24",
    end: "2026-11-14",
    ratePctPerWeek: 1.0,
    objective: "Bajar grasa (abdomen y pecho) manteniendo la fuerza",
  },
  updatedAt: "2026-10-25T00:00:00.000Z",
};

/** Ritmos sugeridos (Fase 1 §4), en % del peso por semana. */
export const PHASE_RATES: Record<PhaseType, { default: number; min: number; max: number; options: { label: string; pct: number }[] }> = {
  deficit: {
    default: 0.7,
    min: 0.25,
    max: 1.25,
    options: [
      { label: "suave", pct: 0.5 },
      { label: "moderado", pct: 0.7 },
      { label: "grande", pct: 1.0 },
    ],
  },
  mantenimiento: { default: 0, min: 0, max: 0, options: [] },
  recomposicion: { default: 0, min: 0, max: 0, options: [] },
  volumen: {
    default: 0.25,
    min: 0.1,
    max: 0.5,
    options: [
      { label: "limpio", pct: 0.25 },
      { label: "rápido (principiante)", pct: 0.5 },
    ],
  },
};

/** Campos sin los cuales no se pueden calcular objetivos. */
export function missingForTargets(p: NutritionProfile | null, hasWeighIn: boolean): string[] {
  if (!p) return ["sexo", "fecha de nacimiento", "estatura", "peso", "nivel de actividad", "objetivo"];
  const missing: string[] = [];
  if (!p.sex) missing.push("sexo");
  if (!p.birthDate) missing.push("fecha de nacimiento");
  if (!p.heightCm) missing.push("estatura");
  if (!p.weightKg && !hasWeighIn) missing.push("peso");
  if (!p.activity && p.stepsPerDay == null) missing.push("nivel de actividad");
  if (!p.phase) missing.push("objetivo");
  return missing;
}

/** Cambios que el chat o la pantalla quieren aplicar (todo opcional). */
export type ProfilePatch = Partial<Omit<NutritionProfile, "phase" | "updatedAt">> & { phase?: Partial<Phase> | null };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Valida y aplica cambios al perfil. Devuelve el perfil nuevo o los errores en español simple. */
export function applyProfilePatch(current: NutritionProfile | null, patch: ProfilePatch, today: string): { profile: NutritionProfile; errors: string[] } {
  const p: NutritionProfile = { ...EMPTY_PROFILE, ...(current ?? {}) };
  const errors: string[] = [];
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

  if (patch.sex !== undefined) {
    if (patch.sex === "M" || patch.sex === "F" || patch.sex === null) p.sex = patch.sex;
    else errors.push("El sexo debe ser M o F (se usa solo para la fórmula del gasto).");
  }
  if (patch.birthDate !== undefined) {
    const b = patch.birthDate;
    if (b === null) p.birthDate = null;
    else if (typeof b !== "string" || !DATE_RE.test(b)) errors.push("La fecha de nacimiento debe ser AAAA-MM-DD.");
    else {
      const age = ageOn(b, today);
      if (age < 16 || age > 90) errors.push("La app está pensada para personas de 16 a 90 años.");
      else p.birthDate = b;
    }
  }
  if (patch.heightCm !== undefined) {
    const h = num(patch.heightCm);
    if (patch.heightCm === null) p.heightCm = null;
    else if (h == null || h < 120 || h > 230) errors.push("La estatura debe estar entre 120 y 230 cm.");
    else p.heightCm = Math.round(h);
  }
  if (patch.weightKg !== undefined) {
    const w = num(patch.weightKg);
    if (patch.weightKg === null) p.weightKg = null;
    else if (w == null || w < 35 || w > 250) errors.push("El peso debe estar entre 35 y 250 kg.");
    else p.weightKg = Math.round(w * 10) / 10;
  }
  if (patch.bodyFatPct !== undefined) {
    const bf = num(patch.bodyFatPct);
    if (patch.bodyFatPct === null) p.bodyFatPct = null;
    else if (bf == null || bf < 3 || bf > 60) errors.push("El % de grasa debe estar entre 3 y 60.");
    else p.bodyFatPct = Math.round(bf * 10) / 10;
  }
  if (patch.bodyFatEstimate !== undefined) {
    if (patch.bodyFatEstimate === null || ["bajo", "medio", "alto"].includes(patch.bodyFatEstimate)) p.bodyFatEstimate = patch.bodyFatEstimate;
    else errors.push("La grasa estimada debe ser bajo, medio o alto.");
  }
  if (patch.activity !== undefined) {
    if (patch.activity === null || ["sedentario", "ligero", "activo", "muy_activo"].includes(patch.activity)) p.activity = patch.activity;
    else errors.push("La actividad debe ser sedentario, ligero, activo o muy_activo.");
  }
  if (patch.stepsPerDay !== undefined) {
    const s = num(patch.stepsPerDay);
    if (patch.stepsPerDay === null) p.stepsPerDay = null;
    else if (s == null || s < 0 || s > 60000) errors.push("Los pasos al día deben estar entre 0 y 60.000.");
    else p.stepsPerDay = Math.round(s);
  }
  if (patch.trainingDaysPerWeek !== undefined) {
    const d = num(patch.trainingDaysPerWeek);
    if (patch.trainingDaysPerWeek === null) p.trainingDaysPerWeek = null;
    else if (d == null || d < 0 || d > 7) errors.push("Los días de entreno deben estar entre 0 y 7.");
    else p.trainingDaysPerWeek = Math.round(d);
  }
  if (patch.sessionMinutes !== undefined) {
    const m = num(patch.sessionMinutes);
    if (m == null || m < 10 || m > 240) errors.push("La duración del entreno debe estar entre 10 y 240 minutos.");
    else p.sessionMinutes = Math.round(m);
  }
  if (patch.dietStyle !== undefined) {
    if (["omnivoro", "pescetariano", "vegetariano", "vegano"].includes(patch.dietStyle)) p.dietStyle = patch.dietStyle;
    else errors.push("El estilo debe ser omnivoro, pescetariano, vegetariano o vegano.");
  }
  if (patch.avoidFoods !== undefined) {
    if (Array.isArray(patch.avoidFoods)) p.avoidFoods = patch.avoidFoods.map((f) => String(f).trim()).filter(Boolean).slice(0, 30);
    else errors.push("Los alimentos a evitar deben ser una lista.");
  }
  if (patch.mealsPerDay !== undefined) {
    const n = num(patch.mealsPerDay);
    if (n == null || n < 1 || n > 7) errors.push("Las comidas al día deben estar entre 1 y 7.");
    else p.mealsPerDay = Math.round(n);
  }
  if (patch.phase !== undefined) {
    if (patch.phase === null) p.phase = null;
    else {
      const type = patch.phase.type ?? p.phase?.type;
      if (!type || !PHASE_RATES[type]) errors.push("El objetivo debe ser deficit, mantenimiento, recomposicion o volumen.");
      else {
        const limits = PHASE_RATES[type];
        const changedType = type !== p.phase?.type;
        let rate = patch.phase.ratePctPerWeek ?? (changedType ? limits.default : (p.phase?.ratePctPerWeek ?? limits.default));
        if (limits.max === 0) rate = 0;
        if (rate < limits.min || rate > limits.max) errors.push(`Para ${type} el ritmo debe estar entre ${limits.min} y ${limits.max} % del peso por semana.`);
        const start = patch.phase.start ?? (changedType ? today : (p.phase?.start ?? today));
        const end = patch.phase.end !== undefined ? patch.phase.end : changedType ? null : (p.phase?.end ?? null);
        if (!DATE_RE.test(start) || (end !== null && (!DATE_RE.test(end) || end <= start))) errors.push("Las fechas del objetivo deben ser AAAA-MM-DD y el fin después del inicio.");
        if (!errors.length) p.phase = { type, start, end, ratePctPerWeek: rate, objective: patch.phase.objective ?? (changedType ? "" : (p.phase?.objective ?? "")) };
      }
    }
  }
  return { profile: { ...p, updatedAt: new Date().toISOString() }, errors };
}

export function ageOn(birthDate: string, today: string): number {
  const [by, bm, bd] = birthDate.split("-").map(Number);
  const [ty, tm, td] = today.split("-").map(Number);
  let age = ty - by;
  if (tm < bm || (tm === bm && td < bd)) age--;
  return age;
}

/** Fecha de hoy en Colombia (YYYY-MM-DD). */
export function todayInBogota(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** Hora actual en Colombia (HH:MM). */
export function timeInBogota(now = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "America/Bogota", hour: "2-digit", minute: "2-digit", hour12: false }).format(now);
}
