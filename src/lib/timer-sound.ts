/**
 * Sintetizador de audio Web Audio API para el cronómetro de descanso.
 * Sonido potente, brillante y nítido optimizado para altavoces de móvil.
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

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.018);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.018);
  } catch {
    // Ignorar
  }
}

/** Alarma enérgica, potente y nítida de finalización de descanso */
export function playAlarmSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      void ctx.resume();
    }

    const now = ctx.currentTime;

    // Compresor de dinámica para maximizar volumen y presencia sin saturar
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-10, now);
    compressor.knee.setValueAtTime(4, now);
    compressor.ratio.setValueAtTime(6, now);
    compressor.attack.setValueAtTime(0.003, now);
    compressor.release.setValueAtTime(0.12, now);
    compressor.connect(ctx.destination);

    // Secuencia melódica potente y brillante (onda triangle con armónicos ricos)
    const notes = [
      { freq: 880, start: 0, duration: 0.13 }, // A5
      { freq: 1174.66, start: 0.15, duration: 0.13 }, // D6
      { freq: 1760, start: 0.3, duration: 0.38 }, // A6
      // Segunda ráfaga
      { freq: 880, start: 0.75, duration: 0.13 },
      { freq: 1174.66, start: 0.9, duration: 0.13 },
      { freq: 1760, start: 1.05, duration: 0.42 },
      // Tercera ráfaga
      { freq: 1046.5, start: 1.55, duration: 0.13 }, // C6
      { freq: 1318.51, start: 1.7, duration: 0.13 }, // E6
      { freq: 2093, start: 1.85, duration: 0.6 }, // C7
    ];

    for (const note of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Forma de onda triangle: genera armónicos claros y audibles en altavoces de celular
      osc.type = "triangle";
      osc.frequency.setValueAtTime(note.freq, now + note.start);

      gain.gain.setValueAtTime(0, now + note.start);
      gain.gain.linearRampToValueAtTime(0.65, now + note.start + 0.015);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        now + note.start + note.duration,
      );

      osc.connect(gain);
      gain.connect(compressor);

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
