/**
 * Sintetizador de audio Web Audio API y vibración para el cronómetro de descanso.
 * Cero dependencias externas ni archivos de audio pesados.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    void audioCtx.resume();
  }
  return audioCtx;
}

/** Tono breve de click / tick háptico al girar la rueda */
export function playTickSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.02);

    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.02);
  } catch {
    // Ignorar si el audio no está disponible
  }
}

/** Alarma enérgica de finalización con secuencia triunfal de tonos ("luces y sirena de gym") */
export function playAlarmSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Patrón de 3 ráfagas enérgicas de tonos ascendentes
    const notes = [
      { freq: 880, start: 0, duration: 0.12 },
      { freq: 1174.66, start: 0.14, duration: 0.12 },
      { freq: 1760, start: 0.28, duration: 0.35 },
      // Segunda ráfaga
      { freq: 880, start: 0.75, duration: 0.12 },
      { freq: 1174.66, start: 0.89, duration: 0.12 },
      { freq: 1760, start: 1.03, duration: 0.4 },
      // Tercera ráfaga triunfal
      { freq: 1046.5, start: 1.55, duration: 0.12 },
      { freq: 1318.51, start: 1.69, duration: 0.12 },
      { freq: 2093, start: 1.83, duration: 0.6 },
    ];

    for (const note of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(note.freq, now + note.start);

      gain.gain.setValueAtTime(0, now + note.start);
      gain.gain.linearRampToValueAtTime(0.25, now + note.start + 0.02);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        now + note.start + note.duration,
      );

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + note.start);
      osc.stop(now + note.start + note.duration);
    }
  } catch {
    // Ignorar si el navegador bloquea audio
  }
}

/** Vibración háptica intensa en dispositivos móviles compatibles */
export function triggerHapticAlarm() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      // Patrón de ráfagas intensas para notificación de fin de descanso
      navigator.vibrate([300, 100, 300, 100, 500, 150, 600]);
    } catch {
      // Ignorar si no está permitido
    }
  }
}

/** Detener cualquier vibración activa */
export function stopHapticAlarm() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(0);
    } catch {
      // Ignorar
    }
  }
}

export function triggerHapticTick() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(10);
    } catch {
      // Ignorar
    }
  }
}
