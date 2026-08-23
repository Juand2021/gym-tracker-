/**
 * Sintetizador de audio Web Audio API para el cronómetro de descanso.
 * Sonido limpio, nítido y profesional sin ruidos acústicos de baja frecuencia.
 */

let audioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext | null {
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

/** Desbloquear el contexto de audio en el primer toque del usuario (para iOS Safari) */
export function unlockAudioContext() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      void ctx.resume();
    }
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
  } catch {
    // Ignorar
  }
}

/** Tono breve de click / tick al girar la rueda */
export function playTickSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(500, now + 0.018);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.018);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.018);
  } catch {
    // Ignorar
  }
}

/** Alarma enérgica y nítida de finalización de descanso */
export function playAlarmSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      void ctx.resume();
    }

    const now = ctx.currentTime;

    // Secuencia melódica limpia y brillante de aviso (campanas de gym)
    const notes = [
      { freq: 880, start: 0, duration: 0.12 },
      { freq: 1174.66, start: 0.14, duration: 0.12 },
      { freq: 1760, start: 0.28, duration: 0.35 },
      // Segunda ráfaga
      { freq: 880, start: 0.75, duration: 0.12 },
      { freq: 1174.66, start: 0.89, duration: 0.12 },
      { freq: 1760, start: 1.03, duration: 0.4 },
      // Tercera ráfaga
      { freq: 1046.5, start: 1.55, duration: 0.12 },
      { freq: 1318.51, start: 1.69, duration: 0.12 },
      { freq: 2093, start: 1.83, duration: 0.55 },
    ];

    for (const note of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(note.freq, now + note.start);

      gain.gain.setValueAtTime(0, now + note.start);
      gain.gain.linearRampToValueAtTime(0.28, now + note.start + 0.015);
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

/** Vibración háptica en dispositivos móviles con Vibration API (Android y compatibles) */
export function triggerHapticAlarm() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate([350, 100, 350, 100, 500, 150, 600]);
    } catch {
      // Ignorar
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
