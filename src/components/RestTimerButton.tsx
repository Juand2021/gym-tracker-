"use client";

import { useRestTimer } from "@/context/RestTimerContext";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function RestTimerButton() {
  const { openModal, status, remainingSeconds, isAlarmActive } = useRestTimer();

  const isRunning = status === "running";
  const isPaused = status === "paused";

  return (
    <button
      type="button"
      onClick={openModal}
      className={`card-interactive group relative flex items-center gap-1.5 rounded-full px-3 py-1.5 min-h-[2.35rem] transition-all active:scale-95 shadow-sm ${
        isAlarmActive
          ? "bg-red-600 text-white animate-bounce shadow-[0_0_16px_rgba(255,50,50,0.8)] border border-red-400"
          : isRunning
          ? "bg-[var(--surface-2)] text-[var(--accent)] border border-[var(--accent)]/60 shadow-[0_0_12px_rgba(255,77,26,0.35)]"
          : isPaused
          ? "bg-[var(--surface-2)] text-amber-400 border border-amber-500/60"
          : "bg-[var(--surface-2)]/90 text-[var(--ink)] border border-[var(--glass-stroke)] hover:border-[var(--accent)]/50 hover:text-white"
      }`}
      aria-label="Temporizador de descanso"
      title="Temporizador de descanso entre series"
    >
      {/* Icono de cronómetro en vector blanco puro */}
      <svg
        className="h-3.5 w-3.5 text-white flex-shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="13" r="8" />
        <path d="M12 9v4l2 2" />
        <path d="M10 2h4" />
      </svg>

      {/* Texto con tipografía unificada Bebas Neue */}
      <span className="font-[family-name:var(--font-display)] text-base tracking-[0.06em] leading-none pt-0.5">
        {isRunning || isPaused || isAlarmActive
          ? formatTime(remainingSeconds)
          : "Descanso"}
      </span>

      {/* Punto pulsante en estado activo */}
      {isRunning && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent)]" />
        </span>
      )}
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
      className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 z-40 animate-fade-in"
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
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)] leading-none">
            {isAlarmActive
              ? "TIEMPO CUMPLIDO"
              : status === "running"
              ? "DESCANSO"
              : "PAUSADO"}
          </span>
          <span className="font-[family-name:var(--font-display)] text-lg tracking-wider leading-tight">
            {formatTime(remainingSeconds)}
          </span>
        </div>
        <span className="text-xs text-[var(--muted)] pl-1">
          {isAlarmActive ? "✕" : "↗"}
        </span>
      </button>
    </aside>
  );
}
