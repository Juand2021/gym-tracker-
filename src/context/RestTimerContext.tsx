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
  playAlarmSound,
  playTickSound,
  triggerHapticAlarm,
  triggerHapticTick,
} from "@/lib/timer-sound";
import { MAX_TIMER_SECONDS } from "@/lib/rest-timer";

export type TimerStatus = "idle" | "running" | "paused" | "completed";

interface RestTimerContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  targetSeconds: number;
  remainingSeconds: number;
  status: TimerStatus;
  isAlarmActive: boolean;
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
  const [isOpen, setIsOpen] = useState(false);
  const [targetSeconds, setTargetSecondsState] = useState<number>(90); // 1:30 por defecto
  const [remainingSeconds, setRemainingSeconds] = useState<number>(90);
  const [status, setStatus] = useState<TimerStatus>("idle");
  const [isAlarmActive, setIsAlarmActive] = useState(false);

  const endTimeRef = useRef<number | null>(null);
  const remainingAtPauseRef = useRef<number>(90);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const alarmIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  const clearTimerInterval = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  const stopAlarm = useCallback(() => {
    setIsAlarmActive(false);
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
  }, []);

  const triggerAlarm = useCallback(() => {
    setStatus("completed");
    setIsAlarmActive(true);
    setRemainingSeconds(0);
    clearTimerInterval();

    // Reproducir sonido y vibración inmediatamente
    playAlarmSound();
    triggerHapticAlarm();

    // Ráfagas repetidas cada 2.5s mientras la alarma esté activa (máx 10 seg)
    let repeats = 0;
    if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);
    alarmIntervalRef.current = setInterval(() => {
      repeats++;
      if (repeats >= 3) {
        if (alarmIntervalRef.current) {
          clearInterval(alarmIntervalRef.current);
          alarmIntervalRef.current = null;
        }
      } else {
        playAlarmSound();
        triggerHapticAlarm();
      }
    }, 2400);
  }, [clearTimerInterval]);

  const start = useCallback(
    (seconds?: number) => {
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

      const now = Date.now();
      endTimeRef.current = now + duration * 1000;

      timerIntervalRef.current = setInterval(() => {
        if (!endTimeRef.current) return;
        const diffMs = endTimeRef.current - Date.now();
        const rem = Math.max(0, Math.ceil(diffMs / 1000));
        setRemainingSeconds(rem);

        if (rem <= 0) {
          triggerAlarm();
        }
      }, 100);
    },
    [targetSeconds, clearTimerInterval, stopAlarm, triggerAlarm],
  );

  const pause = useCallback(() => {
    if (status !== "running") return;
    clearTimerInterval();
    remainingAtPauseRef.current = remainingSeconds;
    setStatus("paused");
  }, [status, remainingSeconds, clearTimerInterval]);

  const resume = useCallback(() => {
    if (status !== "paused" || remainingAtPauseRef.current <= 0) return;
    setStatus("running");
    const now = Date.now();
    endTimeRef.current = now + remainingAtPauseRef.current * 1000;

    timerIntervalRef.current = setInterval(() => {
      if (!endTimeRef.current) return;
      const diffMs = endTimeRef.current - Date.now();
      const rem = Math.max(0, Math.ceil(diffMs / 1000));
      setRemainingSeconds(rem);

      if (rem <= 0) {
        triggerAlarm();
      }
    }, 100);
  }, [status, clearTimerInterval, triggerAlarm]);

  const reset = useCallback(() => {
    stopAlarm();
    clearTimerInterval();
    setStatus("idle");
    setRemainingSeconds(targetSeconds);
    remainingAtPauseRef.current = targetSeconds;
    endTimeRef.current = null;
  }, [targetSeconds, clearTimerInterval, stopAlarm]);

  const setDuration = useCallback(
    (seconds: number, silent = false) => {
      const clamped = Math.min(MAX_TIMER_SECONDS, Math.max(0, Math.round(seconds)));
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
        playTickSound();
        triggerHapticTick();
      }
    },
    [status],
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
        const rem = Math.max(0, Math.ceil((newEnd - Date.now()) / 1000));
        setRemainingSeconds(rem);
      } else {
        const next = Math.min(
          MAX_TIMER_SECONDS,
          Math.max(5, targetSeconds + deltaSeconds),
        );
        setDuration(next, false);
      }
    },
    [status, targetSeconds, setDuration],
  );

  const dismissAlarm = useCallback(() => {
    stopAlarm();
    reset();
  }, [stopAlarm, reset]);

  const openModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Limpiar timers al desmontar
  useEffect(() => {
    return () => {
      clearTimerInterval();
      if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);
    };
  }, [clearTimerInterval]);

  return (
    <RestTimerContext.Provider
      value={{
        isOpen,
        setIsOpen,
        targetSeconds,
        remainingSeconds,
        status,
        isAlarmActive,
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
