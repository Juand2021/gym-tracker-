"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { PickerPortal } from "@/components/PickerPortal";
import { MAX_TIMER_SECONDS, useRestTimer } from "@/context/RestTimerContext";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const PRESETS = [
  { label: "30s", seconds: 30 },
  { label: "45s", seconds: 45 },
  { label: "1:00", seconds: 60 },
  { label: "1:30", seconds: 90 },
  { label: "2:00", seconds: 120 },
  { label: "2:30", seconds: 150 },
  { label: "3:00", seconds: 180 },
];

export function RestTimerModal() {
  const {
    isOpen,
    closeModal,
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
  } = useRestTimer();

  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const lastEmittedRef = useRef<number>(targetSeconds);

  // Radio y centros del dial circular
  const size = 280;
  const center = size / 2;
  const radius = 108;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;

  // Valor a graficar en el dial: durante la cuenta regresiva muestra el remanente; en idle/pause muestra el target
  const displaySeconds =
    status === "running" || status === "completed"
      ? remainingSeconds
      : targetSeconds;

  const currentSecondsForDial = isAlarmActive ? 0 : displaySeconds;
  const progressRatio = Math.min(1, Math.max(0, currentSecondsForDial / MAX_TIMER_SECONDS));
  const strokeDashoffset = circumference - progressRatio * circumference;

  // Ángulo del puntero/manecilla en grados (0° arriba a las 12)
  const knobAngleDeg = progressRatio * 360 - 90;
  const knobAngleRad = (knobAngleDeg * Math.PI) / 180;
  const knobX = center + radius * Math.cos(knobAngleRad);
  const knobY = center + radius * Math.sin(knobAngleRad);

  const calculateSecondsFromPointer = useCallback(
    (clientX: number, clientY: number): number => {
      const svg = svgRef.current;
      if (!svg) return targetSeconds;
      const rect = svg.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const dx = clientX - cx;
      const dy = clientY - cy;

      let angleRad = Math.atan2(dy, dx);
      let angleDeg = (angleRad * 180) / Math.PI + 90;
      if (angleDeg < 0) angleDeg += 360;

      // Calcular segundos redondeando a múltiplos de 5 segundos
      const rawSec = (angleDeg / 360) * MAX_TIMER_SECONDS;
      const snappedSec = Math.round(rawSec / 5) * 5;
      return Math.min(MAX_TIMER_SECONDS, Math.max(5, snappedSec));
    },
    [targetSeconds],
  );

  const handlePointerDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (isAlarmActive) return;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    const newSec = calculateSecondsFromPointer(e.clientX, e.clientY);
    lastEmittedRef.current = newSec;
    setDuration(newSec, false);
    if (status === "running") {
      start(newSec);
    }
  };

  const handlePointerMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (!isDragging || isAlarmActive) return;
    const newSec = calculateSecondsFromPointer(e.clientX, e.clientY);
    if (newSec !== lastEmittedRef.current) {
      lastEmittedRef.current = newSec;
      setDuration(newSec, false);
      if (status === "running") {
        start(newSec);
      }
    }
  };

  const handlePointerUp = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Ignorar
      }
    }
  };

  // Generar marcas radiales para el termómetro / dial (cada 15s)
  const ticks = PRESETS.map((p) => {
    const ratio = p.seconds / MAX_TIMER_SECONDS;
    const deg = ratio * 360 - 90;
    const rad = (deg * Math.PI) / 180;
    const innerR = radius - 16;
    const outerR = radius - 6;
    const x1 = center + innerR * Math.cos(rad);
    const y1 = center + innerR * Math.sin(rad);
    const x2 = center + outerR * Math.cos(rad);
    const y2 = center + outerR * Math.sin(rad);
    return {
      label: p.label,
      seconds: p.seconds,
      x1,
      y1,
      x2,
      y2,
      active: p.seconds <= currentSecondsForDial,
    };
  });

  return (
    <PickerPortal open={isOpen}>
      <div
        className={`stack-picker-overlay rest-timer-overlay ${
          isAlarmActive ? "is-alarm-strobe" : ""
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Temporizador de descanso entre series"
        onClick={closeModal}
      >
        <div
          className={`rest-timer-sheet ${
            isAlarmActive ? "is-alarm-active" : ""
          } flex max-h-[92dvh] w-full max-w-sm flex-col overflow-hidden p-0`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Luces estrambóticas de fondo cuando termina el tiempo */}
          {isAlarmActive && (
            <div className="rest-timer-strobe-bg" aria-hidden="true">
              <div className="strobe-ring strobe-ring-1" />
              <div className="strobe-ring strobe-ring-2" />
              <div className="strobe-ring strobe-ring-3" />
              <div className="strobe-flash-overlay" />
            </div>
          )}

          {/* Header */}
          <div className="relative z-10 flex items-center justify-between border-b border-[var(--glass-stroke)] px-5 py-3.5">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)]/15 text-[var(--accent)] text-lg shadow-[0_0_12px_rgba(255,77,26,0.35)]">
                ⏱
              </span>
              <div>
                <p className="label mb-0 text-[10px] font-bold tracking-[0.14em] text-[var(--accent)]">
                  ENTRE SERIES
                </p>
                <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-[0.04em] text-[var(--ink)]">
                  Cronómetro
                </h2>
              </div>
            </div>

            <button
              type="button"
              className="stack-picker-close flex h-8 w-8 items-center justify-center rounded-full text-sm transition-transform active:scale-95"
              onClick={closeModal}
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>

          {/* Banner de alarma de descanso terminado */}
          {isAlarmActive && (
            <div className="relative z-10 animate-bounce bg-gradient-to-r from-red-600 via-amber-500 to-orange-500 px-4 py-2.5 text-center text-white shadow-lg">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] drop-shadow-md">
                TIEMPO CUMPLIDO
              </p>
              <p className="text-sm font-extrabold tracking-wide drop-shadow">
                INICIAR SIGUIENTE SERIE
              </p>
            </div>
          )}

          {/* Contenedor central con la rueda interactiva */}
          <div className="relative z-10 flex flex-1 flex-col items-center justify-center p-4">
            <div className="relative flex items-center justify-center">
              {/* Dial SVG interactivo */}
              <svg
                ref={svgRef}
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className="cursor-pointer touch-none select-none transition-transform active:scale-[0.99]"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              >
                <defs>
                  {/* Gradiente de arco activo */}
                  <linearGradient
                    id="timerArcGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#ff7b39" />
                    <stop offset="50%" stopColor="#ff4d1a" />
                    <stop offset="100%" stopColor="#ff2200" />
                  </linearGradient>

                  {/* Gradiente de brillo del knob */}
                  <radialGradient id="knobGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="40%" stopColor="#ff7b39" />
                    <stop offset="100%" stopColor="#ff4d1a" />
                  </radialGradient>

                  {/* Filtro de resplandor neón */}
                  <filter id="neonGlow" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Círculo base de cristal */}
                <circle
                  cx={center}
                  cy={center}
                  r={radius + 18}
                  fill="rgba(255, 255, 255, 0.02)"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="1"
                />

                {/* Pista de fondo del dial */}
                <circle
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                />

                {/* Marcas radiales tipo termómetro */}
                {ticks.map((t, idx) => (
                  <line
                    key={idx}
                    x1={t.x1}
                    y1={t.y1}
                    x2={t.x2}
                    y2={t.y2}
                    stroke={
                      t.active
                        ? "rgba(255, 77, 26, 0.85)"
                        : "rgba(255, 255, 255, 0.18)"
                    }
                    strokeWidth={t.active ? 2.5 : 1.5}
                    strokeLinecap="round"
                  />
                ))}

                {/* Arco de progreso activo */}
                <circle
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke="url(#timerArcGradient)"
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${center} ${center})`}
                  filter="url(#neonGlow)"
                  className="transition-[stroke-dashoffset] duration-100 ease-linear"
                />

                {/* Puntero / Manecilla interactiva (Knob) */}
                {!isAlarmActive && (
                  <g
                    transform={`translate(${knobX}, ${knobY})`}
                    className="transition-transform duration-75"
                  >
                    <circle
                      r={strokeWidth / 2 + 5}
                      fill="rgba(255, 77, 26, 0.35)"
                      className="animate-ping opacity-60"
                    />
                    <circle
                      r={strokeWidth / 2 + 3}
                      fill="#121212"
                      stroke="url(#timerArcGradient)"
                      strokeWidth="2.5"
                    />
                    <circle r={strokeWidth / 2 - 2} fill="url(#knobGlow)" />
                  </g>
                )}
              </svg>

              {/* Display Digital Central */}
              <div className="pointer-events-none absolute flex flex-col items-center justify-center text-center">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${
                    isAlarmActive
                      ? "bg-red-500 text-white animate-pulse"
                      : status === "running"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      : status === "paused"
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                      : "bg-white/10 text-[var(--muted)]"
                  }`}
                >
                  {isAlarmActive
                    ? "¡LISTO!"
                    : status === "running"
                    ? "DESCANSO"
                    : status === "paused"
                    ? "PAUSA"
                    : "AJUSTAR"}
                </span>

                <span
                  className={`font-[family-name:var(--font-display)] text-5xl tracking-[0.03em] leading-none my-1.5 ${
                    isAlarmActive
                      ? "text-red-400 animate-pulse drop-shadow-[0_0_16px_rgba(255,50,50,0.8)]"
                      : status === "running"
                      ? "text-[var(--ink)] drop-shadow-[0_0_12px_rgba(255,77,26,0.5)]"
                      : "text-[var(--ink)]"
                  }`}
                >
                  {formatTime(displaySeconds)}
                </span>

                <span className="text-xs font-semibold text-[var(--muted)]">
                  {displaySeconds} seg {displaySeconds > 0 ? `(máx 3m)` : ""}
                </span>
              </div>
            </div>

            {/* Ajustes rápidos de suma/resta */}
            <div className="mt-1 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => addTime(-15)}
                disabled={isAlarmActive || displaySeconds <= 5}
                className="btn btn-ghost h-8 min-h-0 px-3 text-xs font-bold text-[var(--muted)] hover:text-white active:scale-95 disabled:opacity-40"
              >
                -15s
              </button>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--muted)]/60">
                Gira la rueda o pulsa
              </span>
              <button
                type="button"
                onClick={() => addTime(15)}
                disabled={isAlarmActive || displaySeconds >= MAX_TIMER_SECONDS}
                className="btn btn-ghost h-8 min-h-0 px-3 text-xs font-bold text-[var(--accent)] hover:text-white active:scale-95 disabled:opacity-40"
              >
                +15s
              </button>
            </div>

            {/* Chips de tiempos predeterminados */}
            <div className="no-scrollbar mt-3 flex w-full max-w-xs gap-1.5 overflow-x-auto px-1 py-1">
              {PRESETS.map((preset) => {
                const isSelected = targetSeconds === preset.seconds;
                return (
                  <button
                    key={preset.seconds}
                    type="button"
                    onClick={() => {
                      setDuration(preset.seconds, false);
                      if (status === "running") {
                        start(preset.seconds);
                      }
                    }}
                    className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold transition-all active:scale-95 ${
                      isSelected
                        ? "bg-[var(--accent)] text-white shadow-[0_0_10px_rgba(255,77,26,0.5)] scale-105"
                        : "bg-[var(--surface-2)] text-[var(--muted)] hover:text-white"
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Botones de acción principales */}
          <div className="border-t border-[var(--glass-stroke)] bg-[var(--surface)]/90 p-4 space-y-2">
            {isAlarmActive ? (
              <button
                type="button"
                onClick={dismissAlarm}
                className="btn w-full min-h-[3.4rem] bg-red-600 hover:bg-red-500 text-white text-sm font-black uppercase tracking-[0.1em] border border-red-400 shadow-[0_0_24px_rgba(255,50,50,0.85)] animate-pulse active:scale-[0.98]"
              >
                DETENER ALARMA Y CONTINUAR
              </button>
            ) : status === "running" ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={pause}
                  className="btn btn-ghost w-full min-h-[3rem] text-xs font-bold uppercase tracking-[0.1em]"
                >
                  Pausar
                </button>
                <button
                  type="button"
                  onClick={reset}
                  className="btn btn-ghost w-full min-h-[3rem] text-xs font-bold uppercase tracking-[0.1em] text-red-400 hover:text-red-300"
                >
                  Reiniciar
                </button>
              </div>
            ) : status === "paused" ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={resume}
                  className="btn btn-primary w-full min-h-[3rem] text-sm font-bold uppercase tracking-[0.1em]"
                >
                  Reanudar
                </button>
                <button
                  type="button"
                  onClick={reset}
                  className="btn btn-ghost w-full min-h-[3rem] text-xs font-bold uppercase tracking-[0.1em]"
                >
                  Reiniciar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => start(targetSeconds)}
                className="btn btn-primary w-full min-h-[3.2rem] text-base font-bold uppercase tracking-[0.1em] shadow-[0_0_18px_rgba(255,77,26,0.4)]"
              >
                ⏱ Iniciar Descanso ({formatTime(targetSeconds)})
              </button>
            )}

            {!isAlarmActive && (
              <button
                type="button"
                className="btn btn-ghost w-full min-h-[2.4rem] text-[11px] font-semibold text-[var(--muted)] hover:text-white"
                onClick={closeModal}
              >
                {status === "running" ? "Minimizar (Sigue corriendo)" : "Cerrar"}
              </button>
            )}
          </div>
        </div>
      </div>
    </PickerPortal>
  );
}
