"use client";

import type { CSSProperties } from "react";
import { useRestTimer } from "@/context/RestTimerContext";
import { formatTimerDisplay, hueForFraction } from "@/lib/rest-timer";

const RING_R = 9;
const RING_C = 2 * Math.PI * RING_R;

/** Botón del encabezado: ícono con mini anillo de progreso del color del tiempo restante. */
export function RestTimerButton() {
  const { openModal, status, remainingSeconds, runTotalSeconds, isAlarmActive } = useRestTimer();

  const isRunning = status === "running";
  const isPaused = status === "paused";
  const active = isRunning || isPaused || isAlarmActive;
  const fraction = isAlarmActive ? 0 : active ? remainingSeconds / Math.max(1, runTotalSeconds) : 1;
  const hue = isAlarmActive ? 2 : active ? hueForFraction(fraction) : 16;

  return (
    <button
      type="button"
      onClick={openModal}
      className={`hd-item hd-timer ${isRunning ? "is-running" : ""} ${isPaused ? "is-paused" : ""} ${isAlarmActive ? "is-alarm" : ""}`}
      style={{ "--hd-hue": hue } as CSSProperties}
      aria-label={active ? `Temporizador de descanso: ${formatTimerDisplay(remainingSeconds)}` : "Temporizador de descanso"}
      title="Temporizador de descanso entre series"
    >
      <span className="hd-ring" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <circle cx="12" cy="12" r={RING_R} className="hd-ring-track" />
          <circle
            cx="12"
            cy="12"
            r={RING_R}
            className="hd-ring-fill"
            strokeDasharray={RING_C}
            strokeDashoffset={RING_C * (1 - fraction)}
            transform="rotate(-90 12 12)"
          />
          <path d="M12 8.2v4l2.4 1.6" className="hd-ring-hand" />
        </svg>
      </span>
      <span className="hd-label hd-timer-label">
        {active ? formatTimerDisplay(remainingSeconds) : "Descanso"}
      </span>
    </button>
  );
}

/**
 * Mini pastilla flotante que aparece cuando el modal está cerrado
 * pero el temporizador está corriendo o la alarma está sonando.
 */
export function RestTimerFloatingWidget() {
  const { isOpen, openModal, status, remainingSeconds, isAlarmActive, dismissAlarm } =
    useRestTimer();

  // Solo mostrar si el modal grande NO está abierto y hay un timer activo
  if (isOpen || (status !== "running" && status !== "paused" && !isAlarmActive)) {
    return null;
  }

  return (
    <aside
      aria-label="Temporizador de descanso en curso"
      className="fixed bottom-[calc(4.85rem+env(safe-area-inset-bottom))] right-4 z-40 animate-fade-in"
    >
      <button
        type="button"
        onClick={isAlarmActive ? dismissAlarm : openModal}
        className={`card-interactive flex items-center gap-3 rounded-full px-4 py-2.5 shadow-2xl backdrop-blur-xl border transition-all active:scale-95 ${
          isAlarmActive
            ? "bg-red-600/90 text-white border-red-400 animate-bounce shadow-[0_0_24px_rgba(255,50,50,0.8)]"
            : status === "running"
            ? "bg-black/85 border-[var(--accent)]/60 text-[var(--ink)] shadow-[0_0_20px_rgba(255,77,26,0.45)]"
            : "bg-black/85 border-amber-500/60 text-amber-300"
        }`}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent)]/20 text-white">
          <svg
            className="h-4 w-4 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="13" r="8" />
            <path d="M12 9v4l2 2" />
            <path d="M10 2h4" />
          </svg>
        </span>
        <div className="flex flex-col text-left">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider leading-none ${
              isAlarmActive ? "text-white animate-pulse" : "text-[var(--accent)]"
            }`}
          >
            {isAlarmActive
              ? "TIEMPO CUMPLIDO · DETENER"
              : status === "running"
              ? "DESCANSO"
              : "PAUSADO"}
          </span>
          <span className="font-[family-name:var(--font-display)] text-lg tracking-wider leading-tight">
            {isAlarmActive ? "00:00" : formatTimerDisplay(remainingSeconds)}
          </span>
        </div>
        <span
          className={`text-xs pl-1 font-bold ${
            isAlarmActive ? "text-white" : "text-[var(--muted)]"
          }`}
        >
          {isAlarmActive ? "✕" : "↗"}
        </span>
      </button>
    </aside>
  );
}

