/**
 * Nombres antiguos o duplicados → nombre canónico. Se aplica al leer los
 * entrenos: los registros guardados no se modifican, pero toda la app
 * (historial, métricas, último registro e IA) los trata como un solo ejercicio.
 */
export const EXERCISE_ALIASES: Record<string, string> = {
  "Remo unilateral (agarre al tronco)": "Remo unilateral con agarre de polea",
  "remo unilateral (agarre al tronco)": "Remo unilateral con agarre de polea",
  // Era el mismo ejercicio registrado con dos nombres (espalda y hombro)
  "Face-pull o reverse peck deck": "Face pull",
};

/** Minúsculas, sin tildes y con espacios simples, para comparar variantes escritas a mano. */
function looseKey(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Cualquier "crunch … polea" (de/en/abdominal en, con o sin "alta") es el mismo
 * ejercicio. "Crunch abdominal" sin polea es otro y no entra aquí.
 */
const CABLE_CRUNCH = /^crunch (abdominal )?((de|en) )?(la )?polea( alta)?$/;

export function canonicalExerciseName(raw: string): string {
  const name = raw.trim();
  const exact = EXERCISE_ALIASES[name];
  if (exact) return exact;
  if (CABLE_CRUNCH.test(looseKey(name))) return "Crunch de polea alta";
  return name;
}
