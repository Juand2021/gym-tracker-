"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ALARM_BURSTS,
  ALARM_BURST_GAP_SECONDS,
  cancelScheduledAlarm,
  playAlarmSound,
  playTickSound,
  resyncScheduledAlarm,
  scheduleAlarmAt,
  stopAlarmSound,
  stopHapticAlarm,
  triggerHapticAlarm,
  triggerHapticTick,
  unlockAudioContext,
} from "@/lib/timer-sound";
import { MAX_TIMER_SECONDS } from "@/lib/rest-timer";
import { useAppSettings } from "@/context/AppSettingsContext";

export type TimerStatus = "idle" | "running" | "paused" | "completed";

interface RestTimerContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  targetSeconds: number;
  remainingSeconds: number;
  status: TimerStatus;
  isAlarmActive: boolean;
  /** Date.now() en que termina el descanso en curso (null si no corre). */
  endsAt: number | null;
  /** Duración total del descanso en curso (s), para la fracción restante. */
  runTotalSeconds: number;
  start: (seconds?: number) => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  setDuration: (seconds: number, silent?: boolean) => void;
  addTime: (seconds: number) => void;
  dismissAlarm: () => void;
  openModal: () => void;
  closeModal: () => void;
}

const RestTimerContext = createContext<RestTimerContextType | null>(null);

const STORAGE_DURATION_KEY = "fuerza_rest_timer_target_seconds";
export { MAX_TIMER_SECONDS };

export function RestTimerProvider({ children }: { children: ReactNode }) {
  const { soundEnabled, hapticsEnabled, wakeLockEnabled, defaultRestSeconds } =
    useAppSettings();

  const [isOpen, setIsOpen] = useState(false);
  const [targetSeconds, setTargetSecondsState] = useState<number>(() => defaultRestSeconds || 90);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => defaultRestSeconds || 90);
  const [status, setStatus] = useState<TimerStatus>("idle");
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [runTotalSeconds, setRunTotalSeconds] = useState<number>(() => defaultRestSeconds || 90);

  const endTimeRef = useRef<number | null>(null);
  const remainingAtPauseRef = useRef<number>(defaultRestSeconds || 90);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const alarmIntervalRef = useRef<NodeJS.Timeout | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wakeLockRef = useRef<any>(null);
  /** endTime para el que ya sonó la alarma: evita dispararla dos veces. */
  const firedForEndRef = useRef<number | null>(null);
  // Ajustes en refs: los intervalos siempre leen el valor actual.
  const soundRef = useRef(soundEnabled);
  const hapticsRef = useRef(hapticsEnabled);

  useEffect(() => {
    soundRef.current = soundEnabled;
    hapticsRef.current = hapticsEnabled;
    if (!soundEnabled) cancelScheduledAlarm();
  }, [soundEnabled, hapticsEnabled]);

  /** Pre-programa el sonido en el reloj de audio para el fin del descanso. */
  const armAlarm = useCallback((endMs: number) => {
    if (!soundRef.current) return;
    try {
      scheduleAlarmAt(endMs);
    } catch {
      // Si falla, el respaldo por JS hace sonar la alarma
    }
  }, []);

  // Cargar duración preferida guardada
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_DURATION_KEY);
      if (saved) {
        const val = Number(saved);
        if (Number.isFinite(val) && val > 0 && val <= MAX_TIMER_SECONDS) {
          setTargetSecondsState(val);
          setRemainingSeconds(val);
          remainingAtPauseRef.current = val;
        }
      }
    } catch {
      // Ignorar si localStorage no está disponible
    }
  }, []);

  // Control de Screen Wake Lock para mantener la pantalla encendida mientras corre el descanso
  const requestWakeLock = useCallback(async () => {
    if (!wakeLockEnabled) return;
    if (typeof navigator !== "undefined" && "wakeLock" in navigator) {
      try {
        if (!wakeLockRef.current || wakeLockRef.current.released) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          wakeLockRef.current = await (navigator as any).wakeLock.request(
            "screen",
          );
        }
      } catch {
        // Ignorar si el navegador rechaza o suspende el lock
      }
    }
  }, [wakeLockEnabled]);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current && !wakeLockRef.current.released) {
      try {
        await wakeLockRef.current.release();
      } catch {
        // Ignorar
      }
      wakeLockRef.current = null;
    }
  }, []);

  const clearTimerInterval = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  const stopAlarm = useCallback(() => {
    setIsAlarmActive(false);
    stopAlarmSound();
    stopHapticAlarm();
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
  }, []);

  const triggerAlarm = useCallback(() => {
    clearTimerInterval();
    // El intervalo, visibilitychange y focus pueden llegar a la vez: sonar una sola vez.
    const endKey = endTimeRef.current ?? -1;
    if (firedForEndRef.current === endKey) return;
    firedForEndRef.current = endKey;

    setStatus("completed");
    setIsAlarmActive(true);
    setRemainingSeconds(0);
    setEndsAt(null);

    // El sonido ya va pre-programado; esto lo garantiza si se perdió o se desfasó.
    if (soundRef.current) {
      try {
        playAlarmSound();
      } catch {
        // Ignorar
      }
    }

    // Vibración (solo Android: iOS Safari no la permite) en las mismas ráfagas que el sonido
    if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);
    alarmIntervalRef.current = null;
    if (hapticsRef.current) {
      triggerHapticAlarm();
      let repeats = 1;
      alarmIntervalRef.current = setInterval(() => {
        if (repeats >= ALARM_BURSTS || !hapticsRef.current) {
          if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);
          alarmIntervalRef.current = null;
          return;
        }
        repeats++;
        triggerHapticAlarm();
      }, ALARM_BURST_GAP_SECONDS * 1000);
    }
  }, [clearTimerInterval]);

  /** Revisa el reloj real; dispara la alarma al llegar a cero. */
  const tick = useCallback(() => {
    if (!endTimeRef.current) return;
    const rem = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
    setRemainingSeconds(rem);
    if (rem <= 0) triggerAlarm();
  }, [triggerAlarm]);

  const startTicking = useCallback(() => {
    clearTimerInterval();
    timerIntervalRef.current = setInterval(tick, 200);
  }, [clearTimerInterval, tick]);

  // Activar o desactivar Wake Lock según estado y configuración
  useEffect(() => {
    if (wakeLockEnabled && (status === "running" || isAlarmActive)) {
      void requestWakeLock();
    } else {
      void releaseWakeLock();
    }
  }, [status, isAlarmActive, wakeLockEnabled, requestWakeLock, releaseWakeLock]);

  // Si la pestaña vuelve a ser visible en el celular (o tras cambiar de app para música), re-adquirir Wake Lock, sincronizar tiempo y reanudar audio
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        unlockAudioContext();

        if (wakeLockEnabled && (status === "running" || isAlarmActive)) {
          void requestWakeLock();
        }

        // Si el temporizador estaba corriendo mientras el usuario estaba en otra app (ej. Spotify),
        // calcular el tiempo real transcurrido y re-sincronizar el sonido programado
        if (status === "running" && endTimeRef.current) {
          if (endTimeRef.current > Date.now() && soundRef.current) resyncScheduledAlarm();
          tick();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);
    };
  }, [status, isAlarmActive, wakeLockEnabled, requestWakeLock, tick]);

  const start = useCallback(
    (seconds?: number) => {
      unlockAudioContext();
      stopAlarm();
      clearTimerInterval();

      const duration = Math.min(
        MAX_TIMER_SECONDS,
        Math.max(5, seconds ?? targetSeconds),
      );

      setTargetSecondsState(duration);
      setRemainingSeconds(duration);
      remainingAtPauseRef.current = duration;
      setStatus("running");

      const endMs = Date.now() + duration * 1000;
      endTimeRef.current = endMs;
      firedForEndRef.current = null;
      setEndsAt(endMs);
      setRunTotalSeconds(duration);
      armAlarm(endMs);
      startTicking();
    },
    [targetSeconds, clearTimerInterval, stopAlarm, armAlarm, startTicking],
  );

  const pause = useCallback(() => {
    if (status !== "running") return;
    clearTimerInterval();
    cancelScheduledAlarm();
    setEndsAt(null);
    remainingAtPauseRef.current = endTimeRef.current
      ? Math.max(1, Math.ceil((endTimeRef.current - Date.now()) / 1000))
      : remainingSeconds;
    setRemainingSeconds(remainingAtPauseRef.current);
    setStatus("paused");
  }, [status, remainingSeconds, clearTimerInterval]);

  const resume = useCallback(() => {
    if (status !== "paused" || remainingAtPauseRef.current <= 0) return;
    unlockAudioContext();
    setStatus("running");
    const endMs = Date.now() + remainingAtPauseRef.current * 1000;
    endTimeRef.current = endMs;
    firedForEndRef.current = null;
    setEndsAt(endMs);
    armAlarm(endMs);
    startTicking();
  }, [status, armAlarm, startTicking]);

  const reset = useCallback(() => {
    stopAlarm();
    clearTimerInterval();
    setStatus("idle");
    setRemainingSeconds(targetSeconds);
    remainingAtPauseRef.current = targetSeconds;
    endTimeRef.current = null;
    setEndsAt(null);
  }, [targetSeconds, clearTimerInterval, stopAlarm]);

  const setDuration = useCallback(
    (seconds: number, silent = false) => {
      unlockAudioContext();
      const clamped = Math.min(
        MAX_TIMER_SECONDS,
        Math.max(0, Math.round(seconds)),
      );
      setTargetSecondsState(clamped);
      try {
        localStorage.setItem(STORAGE_DURATION_KEY, String(clamped));
      } catch {
        // Ignorar
      }

      if (status === "idle" || status === "completed") {
        setRemainingSeconds(clamped);
        remainingAtPauseRef.current = clamped;
      }

      if (!silent) {
        if (soundEnabled) playTickSound();
        if (hapticsEnabled) triggerHapticTick();
      }
    },
    [status, soundEnabled, hapticsEnabled],
  );

  const addTime = useCallback(
    (deltaSeconds: number) => {
      if (status === "running") {
        if (!endTimeRef.current) return;
        const newEnd = Math.min(
          Date.now() + MAX_TIMER_SECONDS * 1000,
          endTimeRef.current + deltaSeconds * 1000,
        );
        endTimeRef.current = newEnd;
        setEndsAt(newEnd);
        armAlarm(newEnd);
        const rem = Math.max(0, Math.ceil((newEnd - Date.now()) / 1000));
        setRemainingSeconds(rem);
        setRunTotalSeconds((total) => Math.max(total, rem));
      } else {
        const next = Math.min(
          MAX_TIMER_SECONDS,
          Math.max(5, targetSeconds + deltaSeconds),
        );
        setDuration(next, false);
      }
    },
    [status, targetSeconds, setDuration, armAlarm],
  );

  const dismissAlarm = useCallback(() => {
    stopAlarm();
    reset();
  }, [stopAlarm, reset]);

  const openModal = useCallback(() => {
    unlockAudioContext();
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Limpiar timers y wake lock al desmontar
  useEffect(() => {
    return () => {
      clearTimerInterval();
      stopHapticAlarm();
      if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);
      void releaseWakeLock();
    };
  }, [clearTimerInterval, releaseWakeLock]);

  return (
    <RestTimerContext.Provider
      value={{
        isOpen,
        setIsOpen,
        targetSeconds,
        remainingSeconds,
        status,
        isAlarmActive,
        endsAt,
        runTotalSeconds,
        start,
        pause,
        resume,
        reset,
        setDuration,
        addTime,
        dismissAlarm,
        openModal,
        closeModal,
      }}
    >
      {children}
    </RestTimerContext.Provider>
  );
}

export function useRestTimer(): RestTimerContextType {
  const context = useContext(RestTimerContext);
  if (!context) {
    throw new Error("useRestTimer must be used within a RestTimerProvider");
  }
  return context;
}
