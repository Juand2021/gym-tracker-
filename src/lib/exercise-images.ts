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
  "Remo unilateral (agarre al tronco)": "/exercises/remo-unilateral.png",
  "Face pull": "/exercises/face-pull.png",
  "Curl martillo": "/exercises/curl-martillo.png",
  "Bíceps con mancuernas": "/exercises/biceps-mancuernas.png",
  "Bíceps unilateral concentrado": "/exercises/biceps-concentrado.png",
  "Bíceps barra Z": "/exercises/biceps-barra-z.png",
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

export function getExerciseImage(exercise: string): string | null {
  return EXERCISE_IMAGES[exercise] ?? null;
}
