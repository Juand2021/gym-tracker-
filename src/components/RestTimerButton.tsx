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
      className={`group relative flex items-center gap-1.5 rounded-full px-2.5 py-1.5 transition-all active:scale-95 ${
        isAlarmActive
          ? "bg-red-600 text-white animate-bounce shadow-[0_0_16px_rgba(255,50,50,0.8)] border border-red-400"
          : isRunning
          ? "bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/50 shadow-[0_0_12px_rgba(255,77,26,0.35)]"
          : isPaused
          ? "bg-amber-500/20 text-amber-400 border border-amber-500/50"
          : "bg-[var(--surface-2)] text-[var(--ink)] hover:border-[var(--accent)]/40 border border-transparent"
      }`}
      aria-label="Temporizador de descanso"
      title="Temporizador de descanso entre series"
    >
      <span
        className={`text-sm leading-none ${
          isRunning ? "animate-pulse" : ""
        }`}
      >
        ⏱
      </span>

      {/* Tiempo visible si está corriendo, pausado o en alarma */}
      {isRunning || isPaused || isAlarmActive ? (
        <span className="font-[family-name:var(--font-display)] text-sm tracking-wider font-bold">
          {formatTime(remainingSeconds)}
        </span>
      ) : (
        <span className="hidden sm:inline text-xs font-semibold text-[var(--muted)] group-hover:text-white">
          Descanso
        </span>
      )}

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
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent)]/20 text-base">
          ⏱
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
