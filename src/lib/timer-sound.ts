/**
 * Sintetizador de audio Web Audio API de alta confiabilidad para el cronómetro de descanso.
 * Optimizado específicamente para iOS Safari, altavoces de móvil y cambios de aplicación.
 */

let audioCtx: AudioContext | null = null;
let listenersAttached = false;

/**
 * Obtener o revivir el AudioContext.
 * Si el contexto fue cerrado o quedó en estado inconsistente, se recrea automáticamente.
 */
export function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;

    if (!AudioContextClass) return null;

    if (!audioCtx || audioCtx.state === "closed") {
      audioCtx = new AudioContextClass();
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const state = audioCtx.state as any;
    if (state === "suspended" || state === "interrupted") {
      void audioCtx.resume();
    }

    attachGlobalAudioKeepAlive();
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Asegurar que el contexto de audio esté activo y desbloqueado por interacción del usuario.
 */
export function unlockAudioContext() {
  if (typeof window === "undefined") return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const state = ctx.state as any;
    if (state === "suspended" || state === "interrupted") {
      void ctx.resume();
    }

    // Reproducir un buffer silencioso de 1 sample para autorizar la sesión de audio en iOS Safari
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
  } catch {
    // Ignorar si el navegador aún bloquea gestos
  }
}

/**
 * Listeners globales para revivir el AudioContext automáticamente en cualquier toque
 * o cuando el usuario regresa a Safari después de poner música en otra app.
 */
function attachGlobalAudioKeepAlive() {
  if (listenersAttached || typeof window === "undefined") return;
  listenersAttached = true;

  const wakeAudio = () => {
    try {
      if (audioCtx) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const state = audioCtx.state as any;
        if (state === "suspended" || state === "interrupted") {
          void audioCtx.resume();
        }
      }
    } catch {
      // Ignorar
    }
  };

  window.addEventListener("touchstart", wakeAudio, { passive: true });
  window.addEventListener("touchend", wakeAudio, { passive: true });
  window.addEventListener("click", wakeAudio, { passive: true });
  window.addEventListener("focus", wakeAudio);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      wakeAudio();
      unlockAudioContext();
    }
  });
}

// Inicializar listeners en el cliente
if (typeof window !== "undefined") {
  attachGlobalAudioKeepAlive();
}

/** Tono breve y sutil de click / tick al girar la rueda */
export function playTickSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const state = ctx.state as any;
    if (state === "suspended" || state === "interrupted") {
      void ctx.resume();
    }

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

/**
 * Alarma enérgica, potente y nítida de finalización de descanso.
 * Diseñada para cortar el ruido ambiente del gimnasio y ser audible en altavoces de iPhone.
 */
export function playAlarmSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const state = ctx.state as any;
    if (state === "suspended" || state === "interrupted") {
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

    // Secuencia melódica brillante en 3 ráfagas ricas en armónicos
    const notes = [
      { freq: 880, start: 0, duration: 0.12 }, // A5
      { freq: 1174.66, start: 0.14, duration: 0.12 }, // D6
      { freq: 1760, start: 0.28, duration: 0.35 }, // A6
      // Segunda ráfaga
      { freq: 880, start: 0.68, duration: 0.12 },
      { freq: 1174.66, start: 0.82, duration: 0.12 },
      { freq: 1760, start: 0.96, duration: 0.38 },
      // Tercera ráfaga triunfal
      { freq: 1046.5, start: 1.45, duration: 0.12 }, // C6
      { freq: 1318.51, start: 1.59, duration: 0.12 }, // E6
      { freq: 2093, start: 1.73, duration: 0.55 }, // C7
    ];

    for (const note of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(note.freq, now + note.start);

      gain.gain.setValueAtTime(0, now + note.start);
      gain.gain.linearRampToValueAtTime(0.7, now + note.start + 0.015);
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
    // Ignorar si el navegador bloquea audio en segundo plano
  }
}

/** Vibración háptica en dispositivos móviles compatibles */
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
