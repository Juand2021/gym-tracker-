"use client";

/**
 * Piezas visuales compartidas por todos los selectores de discos
 * (barra olímpica, máquina de remo y barra Z): discos, mangas con collarín,
 * animaciones de carga, contador animado y botonera.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  PLATE_GAP,
  PLATE_LBS,
  PLATE_THICKNESS,
  formatBarbellLbs,
  formatBarbellTriggerKg,
  plateFits,
  sleeveUsed,
} from "@/lib/barbell-plates";

type PlateLook = {
  h: number;
  top: string;
  bottom: string;
  rim: string;
  lip: string;
  text: string;
};

/** Alto y colores por disco (mismo código de color del gym). */
export const PLATE_LOOK: Record<number, PlateLook> = {
  45: { h: 96, top: "#5e5e5e", bottom: "#1b1b1b", rim: "#0d0d0d", lip: "#9a9a9a", text: "#fff" },
  25: { h: 78, top: "#5f8fc6", bottom: "#1b3352", rim: "#10203a", lip: "#a4c8f2", text: "#fff" },
  10: { h: 60, top: "#66b27c", bottom: "#1d4029", rim: "#12301d", lip: "#a6e0b7", text: "#fff" },
  5: { h: 46, top: "#dd9149", bottom: "#5e3514", rim: "#3e220a", lip: "#f7c38e", text: "#fff" },
  2.5: { h: 36, top: "#c3cbd8", bottom: "#4d5563", rim: "#2c313b", lip: "#eef2f8", text: "#151820" },
};

const ACCENT = "#ff6b00";

function plateId(lbs: number): string {
  return `pk-plate-${String(lbs).replace(".", "_")}`;
}

/** Gradientes y patrones reutilizados por todos los escenarios. */
export function PlateDefs({ children }: { children?: ReactNode }) {
  return (
    <defs>
      {PLATE_LBS.map((lbs) => (
        <linearGradient key={lbs} id={plateId(lbs)} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={PLATE_LOOK[lbs].top} />
          <stop offset="100%" stopColor={PLATE_LOOK[lbs].bottom} />
        </linearGradient>
      ))}
      {/* Volumen del canto del disco: luz a la izquierda, sombra a la derecha */}
      <linearGradient id="pk-gloss" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#fff" stopOpacity="0.32" />
        <stop offset="35%" stopColor="#fff" stopOpacity="0.06" />
        <stop offset="70%" stopColor="#000" stopOpacity="0" />
        <stop offset="100%" stopColor="#000" stopOpacity="0.4" />
      </linearGradient>
      {/* Acero cromado claro */}
      <linearGradient id="pk-steel" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#a9a9a9" />
        <stop offset="28%" stopColor="#f7f7f7" />
        <stop offset="52%" stopColor="#c9c9c9" />
        <stop offset="78%" stopColor="#8a8a8a" />
        <stop offset="100%" stopColor="#4c4c4c" />
      </linearGradient>
      <linearGradient id="pk-collar" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#ff8a3d" />
        <stop offset="55%" stopColor={ACCENT} />
        <stop offset="100%" stopColor="#c24f00" />
      </linearGradient>
      <radialGradient id="pk-floor" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0%" stopColor="#000" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#000" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="pk-sheen" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#fff" stopOpacity="0" />
        <stop offset="50%" stopColor="#fff" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
      <pattern id="pk-knurl" width="2.2" height="2.2" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="1" height="2.2" fill="#000" fillOpacity="0.45" />
      </pattern>
      {children}
    </defs>
  );
}

function PlateShape({
  lbs,
  x,
  w,
  cy,
  side,
  isOuter,
}: {
  lbs: number;
  x: number;
  w: number;
  cy: number;
  side: "left" | "right";
  isOuter: boolean;
}) {
  const look = PLATE_LOOK[lbs] ?? PLATE_LOOK[45];
  const y = cy - look.h / 2;
  const cx = x + w / 2;
  return (
    <>
      <rect
        x={x}
        y={y}
        width={w}
        height={look.h}
        rx={2.6}
        fill={`url(#${plateId(lbs)})`}
        stroke={isOuter ? ACCENT : look.rim}
        strokeWidth={isOuter ? 1.8 : 1}
      />
      {/* Labio exterior en relieve */}
      <rect
        x={x + 1.4}
        y={y + 4}
        width={Math.max(1, w - 2.8)}
        height={look.h - 8}
        rx={1.6}
        fill="none"
        stroke={look.lip}
        strokeOpacity="0.5"
        strokeWidth="0.8"
      />
      <rect x={x} y={y} width={w} height={look.h} rx={2.6} fill="url(#pk-gloss)" pointerEvents="none" />
      {/* Brillo especular superior */}
      <rect x={x + 1.2} y={y + 1.2} width={Math.max(1, w * 0.35)} height={look.h * 0.32} rx={1} fill="#fff" fillOpacity="0.14" pointerEvents="none" />
      <text
        x={cx}
        y={cy + 3}
        transform={`rotate(${side === "left" ? -90 : 90} ${cx} ${cy + 3})`}
        fill={look.text}
        fontSize={w >= 10 ? 9 : 7}
        fontWeight="bold"
        fontFamily="monospace"
        textAnchor="middle"
        pointerEvents="none"
      >
        {formatBarbellLbs(lbs)}
      </text>
    </>
  );
}

/**
 * Manga con collarín y sus discos. `innerX` es la cara del collarín donde
 * empiezan los discos; la manga crece hacia afuera desde ahí.
 */
export function LoadedSleeve({
  side,
  innerX,
  barY,
  sleeveLen,
  collarW = 10,
  plates,
  leaving,
  flexDeg = 0,
  onRemoveOuter,
}: {
  side: "left" | "right";
  innerX: number;
  barY: number;
  sleeveLen: number;
  collarW?: number;
  plates: number[];
  leaving: boolean;
  flexDeg?: number;
  onRemoveOuter: () => void;
}) {
  const isLeft = side === "left";
  const sleeveX = isLeft ? innerX - sleeveLen : innerX;
  const capX = isLeft ? sleeveX : sleeveX + sleeveLen - 4;
  const collarX = isLeft ? innerX : innerX - collarW;
  const pivotX = isLeft ? innerX + collarW / 2 : innerX - collarW / 2;
  const lastIndex = plates.length - 1;

  const laidOut: Array<{ lbs: number; i: number; x: number; w: number }> = [];
  for (let i = 0, offset = 0; i < plates.length; i++) {
    const lbs = plates[i];
    const w = PLATE_THICKNESS[lbs] ?? 8;
    const x = isLeft ? innerX - PLATE_GAP - offset - w : innerX + PLATE_GAP + offset;
    offset += w + PLATE_GAP;
    laidOut.push({ lbs, i, x, w });
  }

  return (
    <g
      className="pk-side"
      style={{
        transform: `rotate(${isLeft ? -flexDeg : flexDeg}deg)`,
        transformOrigin: `${pivotX}px ${barY}px`,
      }}
    >
      <rect x={sleeveX} y={barY - 7} width={sleeveLen} height={14} rx={3} fill="url(#pk-steel)" stroke="#3c3c3c" strokeWidth="0.8" />
      <rect x={sleeveX + 2} y={barY - 5.2} width={sleeveLen - 4} height={1.4} rx={0.7} fill="#fff" fillOpacity="0.55" />
      <rect x={capX} y={barY - 8.5} width={4} height={17} rx={1.5} fill="#2a2a2a" stroke="#8a8a8a" strokeWidth="0.8" />

      {laidOut.map((p) => {
        const isOuter = p.i === lastIndex;
        return (
          <g
            key={`${side}-${p.i}-${p.lbs}`}
            className={`pk-plate pk-plate-${side}${isOuter ? " is-outer" : ""}${isOuter && leaving ? " is-leaving" : ""}`}
            onClick={isOuter ? onRemoveOuter : undefined}
          >
            <PlateShape lbs={p.lbs} x={p.x} w={p.w} cy={barY} side={side} isOuter={isOuter} />
          </g>
        );
      })}

      {/* Collarín con palanca de cierre */}
      <rect x={collarX} y={barY - 15} width={collarW} height={30} rx={2.2} fill="url(#pk-collar)" stroke="#fff" strokeOpacity="0.85" strokeWidth="0.9" />
      <rect x={collarX + collarW / 2 - 1.5} y={barY - 12} width={3} height={24} rx={1.2} fill="#8f3a00" fillOpacity="0.6" />
      <rect x={collarX + 1} y={barY - 22} width={collarW - 2} height={8} rx={2} fill="#1d1d1d" stroke={ACCENT} strokeWidth="0.9" />
    </g>
  );
}

/** Sombra de piso que se ensancha con la carga. */
export function FloorShadow({ cx, cy, sideLbs, baseRx }: { cx: number; cy: number; sideLbs: number; baseRx: number }) {
  return (
    <>
      <ellipse className="pk-floor" cx={cx} cy={cy} rx={baseRx + Math.min(60, sideLbs / 3)} ry={9} fill="url(#pk-floor)" />
      <line x1="16" y1={cy + 8} x2="404" y2={cy + 8} stroke={ACCENT} strokeOpacity="0.16" strokeWidth="1" />
    </>
  );
}

export type FloatTag = { id: number; text: string };

export function FloatTags({ tag, leftX, rightX, y }: { tag: FloatTag | null; leftX: number; rightX: number; y: number }) {
  if (!tag) return null;
  return (
    <g key={tag.id} className="pk-float">
      {[leftX, rightX].map((x) => (
        <text key={x} x={x} y={y} fill={ACCENT} fontSize="13" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
          {tag.text}
        </text>
      ))}
    </g>
  );
}

export function PlateStage({
  pulse,
  viewBox,
  className = "",
  children,
}: {
  pulse: boolean;
  viewBox: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`pk-stage ${pulse ? "is-pulse" : ""} ${className}`}>
      <svg viewBox={viewBox} className="w-full max-h-[210px] select-none" fill="none">
        {children}
      </svg>
    </div>
  );
}

/** Flexión de la barra según la carga por lado (grados). */
export function flexForLoad(sideLbs: number, maxDeg: number, fullAtLbs: number): number {
  return Math.min(maxDeg, (sideLbs / fullAtLbs) * maxDeg);
}

/** Estado de carga: discos, animación de salida, rebote y etiquetas flotantes. */
export function usePlateLoader(capacity: number) {
  const [plates, setPlates] = useState<number[]>([]);
  const [leaving, setLeaving] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [floatTag, setFloatTag] = useState<FloatTag | null>(null);
  const timers = useRef<number[]>([]);
  const floatId = useRef(0);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((t) => window.clearTimeout(t));
  }, []);

  function later(fn: () => void, ms: number) {
    timers.current.push(window.setTimeout(fn, ms));
  }

  function bump(text: string) {
    setPulse(true);
    later(() => setPulse(false), 300);
    const id = ++floatId.current;
    setFloatTag({ id, text });
    later(() => setFloatTag((cur) => (cur?.id === id ? null : cur)), 760);
    if (
      typeof navigator !== "undefined" &&
      "vibrate" in navigator &&
      navigator.userActivation?.hasBeenActive !== false
    ) {
      try {
        navigator.vibrate(8);
      } catch {}
    }
  }

  function reset(initial: number[]) {
    setPlates(initial);
    setLeaving(false);
    setPulse(false);
    setFloatTag(null);
  }

  function add(lbs: number) {
    if (leaving || !plateFits(plates, lbs, capacity)) return;
    setPlates((prev) => (plateFits(prev, lbs, capacity) ? [...prev, lbs] : prev));
    bump(`+${formatBarbellLbs(lbs)}`);
  }

  function removeOuter() {
    if (leaving || plates.length === 0) return;
    const removed = plates[plates.length - 1];
    setLeaving(true);
    later(() => {
      setPlates((prev) => prev.slice(0, -1));
      setLeaving(false);
      bump(`−${formatBarbellLbs(removed)}`);
    }, 190);
  }

  const used = sleeveUsed(plates);
  return {
    plates,
    leaving,
    pulse,
    floatTag,
    add,
    removeOuter,
    reset,
    canAdd: (lbs: number) => !leaving && plateFits(plates, lbs, capacity),
    fillPct: Math.min(100, Math.round((used / capacity) * 100)),
    full: !plateFits(plates, Math.min(...PLATE_LBS), capacity),
    sideLbs: plates.reduce((s, p) => s + p, 0),
  };
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/** Número que se desliza suavemente hacia el nuevo valor. */
export function useTweenedNumber(target: number, durationMs = 340): number {
  const [shown, setShown] = useState(target);
  const fromRef = useRef(target);

  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return;
    if (prefersReducedMotion()) {
      fromRef.current = target;
      const raf = requestAnimationFrame(() => setShown(target));
      return () => cancelAnimationFrame(raf);
    }
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = from + (target - from) * eased;
      fromRef.current = value;
      setShown(value);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    // Si el navegador pausa rAF (pestaña oculta), igual aterriza en el valor real.
    const settle = window.setTimeout(() => {
      cancelAnimationFrame(raf);
      fromRef.current = target;
      setShown(target);
    }, durationMs + 60);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(settle);
    };
  }, [target, durationMs]);

  return shown;
}

export function WeightReadout({ kg, lbs, pulse }: { kg: number; lbs: number; pulse: boolean }) {
  const shownKg = useTweenedNumber(kg);
  const shownLbs = useTweenedNumber(lbs);
  return (
    <div className={`bb-picker-weight ${pulse ? "is-pulse" : ""}`} aria-live="polite" aria-label={`${formatBarbellTriggerKg(kg)} kg, ${formatBarbellLbs(lbs)} libras`}>
      <span className="bb-picker-weight-value" aria-hidden>
        {(Math.round(shownKg * 10) / 10).toFixed(1).replace(/\.0$/, "")}
      </span>
      <span className="bb-picker-weight-unit" aria-hidden>kg</span>
      <span className="bb-picker-weight-kg" aria-hidden>
        · {Math.round(shownLbs * 2) / 2} lb
      </span>
    </div>
  );
}

export function SleeveMeter({ fillPct, full }: { fillPct: number; full: boolean }) {
  return (
    <div className="pk-meter" aria-label={`Manga ocupada al ${fillPct}%`}>
      <span>{full ? "Manga llena" : "Espacio en la manga"}</span>
      <span className="pk-meter-track">
        <span className={`pk-meter-fill ${full ? "is-full" : ""}`} style={{ transform: `scaleX(${fillPct / 100})` }} />
      </span>
      <span className="pk-meter-pct">{fillPct}%</span>
    </div>
  );
}

export function PlateButtons({
  canAdd,
  onAdd,
  onRemove,
  canRemove,
}: {
  canAdd: (lbs: number) => boolean;
  onAdd: (lbs: number) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  return (
    <div className="bb-plate-controls">
      {PLATE_LBS.map((lbs) => {
        const fits = canAdd(lbs);
        return (
          <button
            key={lbs}
            type="button"
            className="bb-add-plate"
            onClick={() => onAdd(lbs)}
            disabled={!fits}
            title={fits ? undefined : "No cabe en la manga"}
            aria-label={`Agregar ${formatBarbellLbs(lbs)} libras a cada lado`}
          >
            <span
              className="pk-chip"
              style={{
                background: `linear-gradient(180deg, ${PLATE_LOOK[lbs].top}, ${PLATE_LOOK[lbs].bottom})`,
                height: `${Math.round(PLATE_LOOK[lbs].h / 4)}px`,
              }}
              aria-hidden
            />
            +{formatBarbellLbs(lbs)}
            <span className="bb-add-plate-unit">lb</span>
          </button>
        );
      })}
      <button
        type="button"
        className="bb-add-plate bb-remove-plate"
        onClick={onRemove}
        disabled={!canRemove}
        aria-label="Quitar disco exterior de ambos lados"
      >
        − disco
      </button>
    </div>
  );
}
