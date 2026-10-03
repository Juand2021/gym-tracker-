"use client";

import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { PickerPortal } from "@/components/PickerPortal";
import { MAX_TIMER_SECONDS, useRestTimer } from "@/context/RestTimerContext";
import { formatTimerDisplay, hueForFraction } from "@/lib/rest-timer";

/* Geometría del dial (unidades SVG) */
const SIZE = 300;
const C = SIZE / 2;
const R = 112;
const STROKE = 12;
const CIRC = 2 * Math.PI * R;
const LIQUID_R = R - STROKE / 2 - 9;
/** Tono del modo "ajustar" (naranja de la marca). */
const IDLE_HUE = 16;
const ALARM_HUE = 2;
const SNAP = 5;

/** Desplazamiento del arco y nivel del líquido para `seconds` en la escala del dial. */
function dialGeometry(seconds: number) {
  const ratio = Math.min(1, Math.max(0, seconds / MAX_TIMER_SECONDS));
  return {
    offset: CIRC * (1 - ratio),
    angle: ratio * 360,
    liquidY: C + LIQUID_R - ratio * LIQUID_R * 2,
  };
}

/** Marcas cada 5 s; mayores cada 30 s. */
const TICKS = Array.from({ length: MAX_TIMER_SECONDS / SNAP }, (_, i) => {
  const seconds = (i + 1) * SNAP;
  const rad = ((seconds / MAX_TIMER_SECONDS) * 360 - 90) * (Math.PI / 180);
  const major = seconds % 30 === 0;
  const r1 = R + STROKE / 2 + 5;
  const r2 = r1 + (major ? 7 : 3.5);
  return {
    seconds,
    major,
    x1: C + r1 * Math.cos(rad),
    y1: C + r1 * Math.sin(rad),
    x2: C + r2 * Math.cos(rad),
    y2: C + r2 * Math.sin(rad),
  };
});

/** Ola del líquido: dos periodos para poder desplazarla en bucle. */
const WAVE_W = LIQUID_R * 2;
function wavePath(amplitude: number): string {
  const x0 = C - LIQUID_R;
  const seg = WAVE_W / 2;
  let d = `M ${x0 - WAVE_W} 0`;
  for (let k = -2; k < 4; k++) {
    const xs = x0 + k * seg;
    d += ` Q ${xs + seg / 2} ${k % 2 === 0 ? -amplitude : amplitude} ${xs + seg} 0`;
  }
  return `${d} V ${LIQUID_R * 2 + 20} H ${x0 - WAVE_W} Z`;
}
const WAVE_A = wavePath(6);
const WAVE_B = wavePath(4);

export function RestTimerModal() {
  const {
    isOpen,
    closeModal,
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
  } = useRestTimer();

  const svgRef = useRef<SVGSVGElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const arcRef = useRef<SVGCircleElement>(null);
  const glowRef = useRef<SVGCircleElement>(null);
  const knobRef = useRef<SVGGElement>(null);
  const liquidRef = useRef<SVGGElement>(null);
  const lastEmittedRef = useRef<number>(targetSeconds);
  const [isDragging, setIsDragging] = useState(false);
  /** Ref además del estado: los eventos llegan antes de que React re-renderice. */
  const draggingRef = useRef(false);

  const live = status === "running" && endsAt != null && !isAlarmActive;
  const displaySeconds = isAlarmActive
    ? 0
    : status === "running" || status === "completed" || status === "paused"
      ? remainingSeconds
      : targetSeconds;
  const isFinal = live && remainingSeconds <= 5 && remainingSeconds > 0;

  // Valores estáticos (ajustar / pausa / alarma). Mientras corre, los escribe el bucle rAF.
  const staticGeo = dialGeometry(displaySeconds);
  const staticHue = isAlarmActive
    ? ALARM_HUE
    : status === "paused"
      ? hueForFraction(remainingSeconds / Math.max(1, runTotalSeconds))
      : IDLE_HUE;

  // Bucle de animación: actualiza arco, perilla, líquido y color a 60 fps sin re-renderizar React.
  useLayoutEffect(() => {
    if (!isOpen || !live || endsAt == null) return;
    let raf = 0;
    const frame = () => {
      const secs = Math.max(0, (endsAt - Date.now()) / 1000);
      const geo = dialGeometry(secs);
      arcRef.current?.setAttribute("stroke-dashoffset", String(geo.offset));
      glowRef.current?.setAttribute("stroke-dashoffset", String(geo.offset));
      knobRef.current?.setAttribute("transform", `rotate(${geo.angle} ${C} ${C})`);
      liquidRef.current?.setAttribute("transform", `translate(0 ${geo.liquidY})`);
      sheetRef.current?.style.setProperty(
        "--rt-hue",
        String(hueForFraction(secs / Math.max(1, runTotalSeconds))),
      );
      if (secs > 0) raf = requestAnimationFrame(frame);
    };
    frame();
    return () => cancelAnimationFrame(raf);
    // remainingSeconds: re-sincroniza cada segundo aunque el navegador frene rAF
  }, [isOpen, live, endsAt, runTotalSeconds, remainingSeconds]);

  const secondsFromPointer = useCallback((clientX: number, clientY: number, guardWrap: boolean): number => {
    const svg = svgRef.current;
    if (!svg) return lastEmittedRef.current;
    const rect = svg.getBoundingClientRect();
    const dx = clientX - (rect.left + rect.width / 2);
    const dy = clientY - (rect.top + rect.height / 2);
    let deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    if (deg < 0) deg += 360;
    let sec = Math.round(((deg / 360) * MAX_TIMER_SECONDS) / SNAP) * SNAP;

    // Evitar el salto 3:00 → 0:05 (y viceversa) al cruzar las 12 en punto
    if (guardWrap) {
      const prev = lastEmittedRef.current;
      if (prev >= MAX_TIMER_SECONDS - 30 && sec <= 30) sec = MAX_TIMER_SECONDS;
      else if (prev <= 30 && sec >= MAX_TIMER_SECONDS - 30) sec = SNAP;
    }
    return Math.min(MAX_TIMER_SECONDS, Math.max(SNAP, sec));
  }, []);

  function applySeconds(sec: number) {
    if (sec === lastEmittedRef.current) return;
    lastEmittedRef.current = sec;
    setDuration(sec, false);
    if (status === "running") start(sec);
  }

  const onPointerDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (isAlarmActive) return;
    draggingRef.current = true;
    setIsDragging(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    lastEmittedRef.current = displaySeconds;
    // Un toque salta directo al punto tocado; el arrastre luego protege el cruce de las 12.
    applySeconds(secondsFromPointer(e.clientX, e.clientY, false));
  };

  const onPointerMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (!draggingRef.current || isAlarmActive) return;
    applySeconds(secondsFromPointer(e.clientX, e.clientY, true));
  };

  const onPointerUp = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  const statusLabel = isAlarmActive
    ? "¡Listo!"
    : status === "running"
      ? "Descanso"
      : status === "paused"
        ? "Pausa"
        : "Desliza para ajustar";
  const timeText = formatTimerDisplay(displaySeconds);

  return (
    <PickerPortal open={isOpen}>
      <div
        className={`stack-picker-overlay rt-overlay ${isAlarmActive ? "is-alarm" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Temporizador de descanso entre series"
        onClick={closeModal}
      >
        <div
          ref={sheetRef}
          className={`rt-sheet ${isAlarmActive ? "is-alarm" : ""} ${isFinal ? "is-final" : ""} ${isDragging ? "is-dragging" : ""}`}
          style={live ? undefined : ({ "--rt-hue": staticHue } as CSSProperties)}
          onClick={(e) => e.stopPropagation()}
        >
          <span className="rt-aura" aria-hidden />

          {/* Encabezado */}
          <div className="rt-head">
            <div>
              <p className="rt-kicker">Entre series</p>
              <h2 className="rt-title">Cronómetro</h2>
            </div>
            <button type="button" className="rt-icon-btn" onClick={closeModal} aria-label="Cerrar">
              ✕
            </button>
          </div>

          {isAlarmActive ? (
            <div className="rt-banner" role="status">
              <span>Tiempo cumplido</span>
              <strong>¡A la siguiente serie!</strong>
            </div>
          ) : null}

          {/* Dial */}
          <div className="rt-dial-wrap">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${SIZE} ${SIZE}`}
              className="rt-dial"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              role="slider"
              aria-label="Duración del descanso"
              aria-valuemin={SNAP}
              aria-valuemax={MAX_TIMER_SECONDS}
              aria-valuenow={displaySeconds}
              aria-valuetext={timeText}
            >
              <defs>
                <linearGradient id="rt-arc" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" className="rt-stop-a" />
                  <stop offset="100%" className="rt-stop-b" />
                </linearGradient>
                <radialGradient id="rt-face" cx="0.5" cy="0.3" r="0.75">
                  <stop offset="0%" stopColor="#fff" stopOpacity="0.1" />
                  <stop offset="60%" stopColor="#fff" stopOpacity="0.025" />
                  <stop offset="100%" stopColor="#000" stopOpacity="0.25" />
                </radialGradient>
                <linearGradient id="rt-bezel" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#fff" stopOpacity="0.55" />
                  <stop offset="35%" stopColor="#fff" stopOpacity="0.06" />
                  <stop offset="70%" stopColor="#fff" stopOpacity="0.03" />
                  <stop offset="100%" stopColor="#fff" stopOpacity="0.35" />
                </linearGradient>
                <clipPath id="rt-liquid-clip">
                  <circle cx={C} cy={C} r={LIQUID_R} />
                </clipPath>
              </defs>

              {/* Cara de vidrio */}
              <circle cx={C} cy={C} r={R + STROKE / 2 + 16} fill="url(#rt-face)" />
              <circle cx={C} cy={C} r={R + STROKE / 2 + 16} fill="none" stroke="url(#rt-bezel)" strokeWidth="1.2" />

              {/* Marcas cada 5 s */}
              {TICKS.map((t) => (
                <line
                  key={t.seconds}
                  x1={t.x1}
                  y1={t.y1}
                  x2={t.x2}
                  y2={t.y2}
                  className={`rt-tick ${t.major ? "is-major" : ""} ${t.seconds <= displaySeconds ? "is-on" : ""}`}
                />
              ))}

              {/* Líquido que baja con el tiempo */}
              <g clipPath="url(#rt-liquid-clip)">
                <circle cx={C} cy={C} r={LIQUID_R} className="rt-liquid-bg" />
                <g ref={liquidRef} className="rt-liquid" transform={live ? undefined : `translate(0 ${staticGeo.liquidY})`}>
                  <path d={WAVE_B} className="rt-wave rt-wave-b" />
                  <path d={WAVE_A} className="rt-wave rt-wave-a" />
                </g>
                <circle cx={C} cy={C} r={LIQUID_R} fill="none" stroke="#fff" strokeOpacity="0.12" strokeWidth="1" />
              </g>
              {/* Reflejo curvo del vidrio sobre el líquido */}
              <path
                d={`M ${C - LIQUID_R * 0.72} ${C - LIQUID_R * 0.45} A ${LIQUID_R * 0.85} ${LIQUID_R * 0.85} 0 0 1 ${C + LIQUID_R * 0.2} ${C - LIQUID_R * 0.83}`}
                className="rt-glare"
              />

              {/* Pista y arco */}
              <circle cx={C} cy={C} r={R} fill="none" className="rt-track" strokeWidth={STROKE} />
              <circle
                ref={glowRef}
                cx={C}
                cy={C}
                r={R}
                fill="none"
                stroke="url(#rt-arc)"
                strokeWidth={STROKE + 12}
                strokeLinecap="round"
                strokeDasharray={CIRC}
                strokeDashoffset={live ? undefined : staticGeo.offset}
                transform={`rotate(-90 ${C} ${C})`}
                className={live ? "rt-arc-glow" : "rt-arc-glow is-static"}
              />
              <circle
                ref={arcRef}
                cx={C}
                cy={C}
                r={R}
                fill="none"
                stroke="url(#rt-arc)"
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={CIRC}
                strokeDashoffset={live ? undefined : staticGeo.offset}
                transform={`rotate(-90 ${C} ${C})`}
                className={live ? "rt-arc" : "rt-arc is-static"}
              />

              {/* Onda expansiva en los últimos segundos y en la alarma */}
              {isFinal ? <circle key={remainingSeconds} cx={C} cy={C} r={R} className="rt-ripple" /> : null}
              {isAlarmActive ? (
                <>
                  <circle cx={C} cy={C} r={R} className="rt-ripple is-loop" />
                  <circle cx={C} cy={C} r={R} className="rt-ripple is-loop is-delay" />
                </>
              ) : null}

              {/* Perilla de vidrio */}
              {!isAlarmActive ? (
                <g
                  ref={knobRef}
                  transform={live ? undefined : `rotate(${staticGeo.angle} ${C} ${C})`}
                  className={live ? "rt-knob-rot" : "rt-knob-rot is-static"}
                >
                  <g className="rt-knob" style={{ transformOrigin: `${C}px ${C - R}px` }}>
                    <circle cx={C} cy={C - R} r={15} className="rt-knob-halo" />
                    <circle cx={C} cy={C - R} r={11} className="rt-knob-glass" />
                    <circle cx={C} cy={C - R} r={5} className="rt-knob-core" />
                    <ellipse cx={C - 3} cy={C - R - 4.5} rx={4.5} ry={2.2} fill="#fff" fillOpacity="0.7" />
                  </g>
                </g>
              ) : null}
            </svg>

            {/* Lectura central */}
            <div className="rt-readout" aria-live="polite">
              <span className="rt-status">{statusLabel}</span>
              <span className={`rt-time ${isFinal ? "is-beat" : ""}`} key={isFinal ? remainingSeconds : "t"}>
                {timeText.split("").map((ch, i) => (
                  <span key={`${i}-${ch}`} className={ch === ":" ? "rt-colon" : "rt-digit"}>
                    {ch}
                  </span>
                ))}
              </span>
              <span className="rt-sub">
                {status === "idle" ? "máx 3:00" : `de ${formatTimerDisplay(status === "completed" ? targetSeconds : runTotalSeconds)}`}
              </span>
            </div>
          </div>

          {/* Ajuste fino */}
          <div className="rt-fine">
            <button
              type="button"
              className="rt-chip"
              onClick={() => addTime(-15)}
              disabled={isAlarmActive || displaySeconds <= SNAP}
            >
              −15 s
            </button>
            <button
              type="button"
              className="rt-chip"
              onClick={() => addTime(15)}
              disabled={isAlarmActive || displaySeconds >= MAX_TIMER_SECONDS}
            >
              +15 s
            </button>
          </div>

          {/* Acciones */}
          <div className="rt-actions">
            {isAlarmActive ? (
              <button type="button" onClick={dismissAlarm} className="rt-btn rt-btn-primary rt-btn-alarm">
                Detener alarma y continuar
              </button>
            ) : status === "running" ? (
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={pause} className="rt-btn">
                  Pausar
                </button>
                <button type="button" onClick={reset} className="rt-btn rt-btn-danger">
                  Reiniciar
                </button>
              </div>
            ) : status === "paused" ? (
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={resume} className="rt-btn rt-btn-primary">
                  Reanudar
                </button>
                <button type="button" onClick={reset} className="rt-btn">
                  Reiniciar
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => start(targetSeconds)} className="rt-btn rt-btn-primary">
                Iniciar descanso · {formatTimerDisplay(targetSeconds)}
              </button>
            )}

            {!isAlarmActive ? (
              <button type="button" className="rt-link" onClick={closeModal}>
                {status === "running" ? "Minimizar (sigue corriendo)" : "Cerrar"}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </PickerPortal>
  );
}
