/** Miniaturas locales con estilo unificado para la rutina. */
export const EXERCISE_IMAGES: Record<string, string> = {
  "Press banca": "/exercises/press-banca.png",
  "Press inclinado con mancuernas": "/exercises/press-inclinado-mancuernas.png",
  "Pec deck": "/exercises/pec-deck.png",
  "Cruce de poleas alto": "/exercises/cruce-poleas-alto.png",
  Fondos: "/exercises/fondos.png",
  "Press francés con barra Z": "/exercises/press-frances-barra-z.png",
  "Extensión de tríceps con cuerda": "/exercises/extension-triceps-cuerda.png",
  "Extensión de tríceps trasnuca": "/exercises/extension-triceps-trasnuca.png",
  "Extensión de tríceps unilateral": "/exercises/extension-triceps-unilateral.png",
  Dominadas: "/exercises/dominadas.png",
  "Jalón al pecho": "/exercises/jalon-pecho.png",
  "Remo con máquina": "/exercises/remo-maquina.png",
  "Remo unilateral con agarre de polea": "/exercises/remo-unilateral.png",
  "Remo unilateral (agarre al tronco)": "/exercises/remo-unilateral.png",
  "Face pull": "/exercises/face-pull.png",
  "Curl martillo": "/exercises/curl-martillo.png",
  "Bíceps con mancuernas": "/exercises/biceps-mancuernas.png",
  "Bíceps unilateral concentrado": "/exercises/biceps-concentrado.png",
  "Curl de bíceps con polea": "/exercises/curl-biceps-polea.png",
  "Bíceps con polea": "/exercises/curl-biceps-polea.png",
  "Bíceps polea": "/exercises/curl-biceps-polea.png",
  "Curl bíceps polea": "/exercises/curl-biceps-polea.png",
  "Bíceps barra Z": "/exercises/biceps-barra-z.png",
  "Curl de antebrazo con mancuernas": "/exercises/curl-antebrazo-mancuernas.png",
  "Curl inverso de antebrazo con mancuernas":
    "/exercises/curl-inverso-antebrazo-mancuernas.png",
  // Nombres libres usados al registrar la sesión
  "Contracción de antebrazo": "/exercises/contraccion-antebrazo.png",
  "Contraccion de antebrazo": "/exercises/contraccion-antebrazo.png",
  "Contracción Antebrazo": "/exercises/contraccion-antebrazo.png",
  "Contraccion Antebrazo": "/exercises/contraccion-antebrazo.png",
  "Aducción de antebrazo": "/exercises/aduccion-antebrazo.png",
  "Aduccion de antebrazo": "/exercises/aduccion-antebrazo.png",
  "Aducción Antebrazo": "/exercises/aduccion-antebrazo.png",
  "Aduccion Antebrazo": "/exercises/aduccion-antebrazo.png",
  "Dominadas agarre neutro": "/exercises/dominadas-neutro.png",
  "Press militar con mancuernas": "/exercises/press-militar-mancuernas.png",
  "Elevaciones unilaterales con cable": "/exercises/elevaciones-laterales-cable.png",
  "Elevaciones hacia el frente unilaterales con cable":
    "/exercises/elevaciones-frente-cable.png",
  "Face-pull o reverse peck deck": "/exercises/reverse-peck-deck.png",
  "Encogimiento de hombros": "/exercises/encogimiento-hombros.png",
  "Sentadilla libre": "/exercises/sentadilla-libre.png",
  "Peso muerto rumano": "/exercises/peso-muerto-rumano.png",
  "Extensión de espalda": "/exercises/extension-espalda.png",
  "Extensión de cuádriceps": "/exercises/extension-cuadriceps.png",
  "Prensa de pierna": "/exercises/prensa-pierna.png",
  "Extensión de gemelos": "/exercises/extension-gemelos.png",
  "Aducción de cadera": "/exercises/aduccion-cadera.png",
};

function normalizeExerciseKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

const IMAGE_BY_NORMALIZED = new Map(
  Object.entries(EXERCISE_IMAGES).map(([name, src]) => [
    normalizeExerciseKey(name),
    src,
  ]),
);

/** Alias de nombres libres → imagen canónica. */
const IMAGE_ALIASES: Record<string, string> = {
  "contraccion de antebrazo": "/exercises/contraccion-antebrazo.png",
  "contraccion del antebrazo": "/exercises/contraccion-antebrazo.png",
  "contraccion antebrazo": "/exercises/contraccion-antebrazo.png",
  "aduccion de antebrazo": "/exercises/aduccion-antebrazo.png",
  "aduccion del antebrazo": "/exercises/aduccion-antebrazo.png",
  "aduccion antebrazo": "/exercises/aduccion-antebrazo.png",
  "elevacion de antebrazo": "/exercises/aduccion-antebrazo.png",
  "elevacion de mancuernas antebrazo": "/exercises/aduccion-antebrazo.png",
  "curl de antebrazo": "/exercises/curl-antebrazo-mancuernas.png",
  "curl de antebrazo con mancuernas": "/exercises/curl-antebrazo-mancuernas.png",
  "curl inverso de antebrazo": "/exercises/curl-inverso-antebrazo-mancuernas.png",
  "curl inverso de antebrazo con mancuernas":
    "/exercises/curl-inverso-antebrazo-mancuernas.png",
};

export function getExerciseImage(exercise: string): string | null {
  if (!exercise) return null;
  const direct = EXERCISE_IMAGES[exercise];
  if (direct) return direct;

  const key = normalizeExerciseKey(exercise);
  return IMAGE_ALIASES[key] ?? IMAGE_BY_NORMALIZED.get(key) ?? null;
}
