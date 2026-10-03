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
      flushPendingAlarm();
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

/* ------------------------------------------------------------------ */
/* Alarma de fin de descanso                                           */
/* ------------------------------------------------------------------ */

/** Secuencia de una ráfaga (segundos relativos al inicio de la ráfaga). */
const ALARM_NOTES = [
  { freq: 880, start: 0, duration: 0.12 }, // A5
  { freq: 1174.66, start: 0.14, duration: 0.12 }, // D6
  { freq: 1760, start: 0.28, duration: 0.35 }, // A6
  { freq: 880, start: 0.68, duration: 0.12 },
  { freq: 1174.66, start: 0.82, duration: 0.12 },
  { freq: 1760, start: 0.96, duration: 0.38 },
  { freq: 1046.5, start: 1.45, duration: 0.12 }, // C6
  { freq: 1318.51, start: 1.59, duration: 0.12 }, // E6
  { freq: 2093, start: 1.73, duration: 0.55 }, // C7
];

/** Ráfagas que suena la alarma y separación entre ellas (≈ 10 s en total). */
export const ALARM_BURSTS = 4;
export const ALARM_BURST_GAP_SECONDS = 2.4;

/** Tolerancia para considerar que la alarma pre-programada ya está sonando a tiempo. */
const ON_TIME_TOLERANCE_SECONDS = 0.6;

type ScheduledAlarm = {
  /** Instante en el reloj de audio (ctx.currentTime) en que arranca la alarma. */
  at: number;
  nodes: AudioScheduledSourceNode[];
};

let scheduledAlarm: ScheduledAlarm | null = null;
/** La alarma debía sonar pero iOS no dejó reactivar el audio: suena en el próximo toque. */
let pendingAlarm = false;
/** Fin del descanso (Date.now()) para re-programar si el reloj de audio se desfasó. */
let pendingScheduleWallMs: number | null = null;

function isRunning(ctx: AudioContext): boolean {
  return ctx.state === "running";
}

function stopNodes(nodes: AudioScheduledSourceNode[]) {
  for (const node of nodes) {
    try {
      node.stop();
    } catch {
      // Ya detenido
    }
    try {
      node.disconnect();
    } catch {
      // Ignorar
    }
  }
}

/** Programa las ráfagas de alarma en el reloj de audio a partir de `at`. */
function scheduleAlarmBursts(ctx: AudioContext, at: number): ScheduledAlarm {
  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.setValueAtTime(-10, at);
  compressor.knee.setValueAtTime(4, at);
  compressor.ratio.setValueAtTime(6, at);
  compressor.attack.setValueAtTime(0.003, at);
  compressor.release.setValueAtTime(0.12, at);
  compressor.connect(ctx.destination);

  const nodes: AudioScheduledSourceNode[] = [];
  for (let burst = 0; burst < ALARM_BURSTS; burst++) {
    const burstAt = at + burst * ALARM_BURST_GAP_SECONDS;
    for (const note of ALARM_NOTES) {
      const t0 = burstAt + note.start;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(note.freq, t0);
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(0.7, t0 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + note.duration);

      osc.connect(gain);
      gain.connect(compressor);
      osc.start(t0);
      osc.stop(t0 + note.duration);
      nodes.push(osc);
    }
  }

  // Liberar el compresor cuando termina la última nota
  nodes[nodes.length - 1].onended = () => {
    try {
      compressor.disconnect();
    } catch {
      // Ignorar
    }
  };

  return { at, nodes };
}

/** Cancela la alarma pre-programada (pausa, reinicio o cambio de tiempo). */
export function cancelScheduledAlarm() {
  pendingScheduleWallMs = null;
  if (!scheduledAlarm) return;
  stopNodes(scheduledAlarm.nodes);
  scheduledAlarm = null;
}

/**
 * Pre-programa la alarma para que suene exactamente cuando el descanso
 * termine (`endWallMs`, en Date.now()). Al vivir en el reloj de audio, suena a
 * tiempo aunque el navegador frene los temporizadores de JavaScript.
 * Llamar desde un gesto del usuario (Iniciar / Reanudar / +tiempo).
 */
export function scheduleAlarmAt(endWallMs: number) {
  cancelScheduledAlarm();
  pendingScheduleWallMs = endWallMs;

  const ctx = getAudioContext();
  if (!ctx) return;

  const schedule = () => {
    if (pendingScheduleWallMs !== endWallMs) return; // Cancelada o reemplazada
    const secondsLeft = (endWallMs - Date.now()) / 1000;
    if (secondsLeft <= 0) return; // El respaldo por JS se encarga
    scheduledAlarm = scheduleAlarmBursts(ctx, ctx.currentTime + secondsLeft);
  };

  if (isRunning(ctx)) {
    schedule();
  } else {
    ctx.resume().then(schedule).catch(() => {});
  }
}

/**
 * Re-sincroniza la alarma pre-programada con el reloj real. Necesario al
 * volver a la app: si iOS suspendió el audio, el reloj de audio quedó atrasado.
 */
export function resyncScheduledAlarm() {
  if (pendingScheduleWallMs != null && pendingScheduleWallMs > Date.now()) {
    scheduleAlarmAt(pendingScheduleWallMs);
  }
}

function playAlarmNowOn(ctx: AudioContext) {
  pendingAlarm = false;
  if (scheduledAlarm) stopNodes(scheduledAlarm.nodes);
  scheduledAlarm = scheduleAlarmBursts(ctx, ctx.currentTime + 0.03);
}

/**
 * Garantiza que la alarma suene ahora. Si la versión pre-programada ya está
 * sonando a tiempo no la duplica; si el audio está bloqueado, queda pendiente
 * y suena con el siguiente toque en pantalla.
 */
export function playAlarmSound() {
  pendingScheduleWallMs = null;
  const ctx = getAudioContext();
  if (!ctx) return;

  if (isRunning(ctx)) {
    // El reloj de audio solo avanza mientras suena: si ya pasó `at`, la alarma
    // pre-programada sonó (o está sonando). Si quedó en el futuro, el audio
    // estuvo suspendido (pantalla bloqueada) y hay que sonar ya.
    if (scheduledAlarm && ctx.currentTime >= scheduledAlarm.at - ON_TIME_TOLERANCE_SECONDS) return;
    playAlarmNowOn(ctx);
    return;
  }

  pendingAlarm = true;
  ctx
    .resume()
    .then(() => {
      if (pendingAlarm && isRunning(ctx)) playAlarmNowOn(ctx);
    })
    .catch(() => {});
}

/** Detiene de inmediato cualquier alarma sonando, programada o pendiente. */
export function stopAlarmSound() {
  pendingAlarm = false;
  cancelScheduledAlarm();
}

/** Usado por los listeners de toque: si la alarma quedó bloqueada, suena ahora. */
function flushPendingAlarm() {
  if (!pendingAlarm || !audioCtx) return;
  const ctx = audioCtx;
  if (isRunning(ctx)) {
    playAlarmNowOn(ctx);
  } else {
    ctx
      .resume()
      .then(() => {
        if (pendingAlarm && isRunning(ctx)) playAlarmNowOn(ctx);
      })
      .catch(() => {});
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
