"use client";

import { memo, useId, useRef, useState } from "react";
import type { Gauge, GaugeZone } from "@/lib/nutrition/views";
import { fmt, lastShownValue, rememberShown, SPRINGS, useCountUp, useSpringEffect } from "./glass/motion";

/**
 * Velocímetro de calorías (§5.1). 220° de recorrido pasando por arriba.
 * Va en capas para que se mueva a 60 fps:
 *  - el dial (bisel, zonas con resplandor, escala) es un SVG fijo que no se vuelve a pintar;
 *  - la aguja es una capa HTML que gira con `transform` (la mueve la tarjeta gráfica);
 *  - el brillo de progreso es un SVG pequeño aparte, sin filtros.
 */

const CX = 160;
const CY = 168;
const START = 160;
const SWEEP = 220;

const rad = (deg: number) => (deg * Math.PI) / 180;
export const polar = (r: number, deg: number, cx = CX, cy = CY) => [cx + r * Math.cos(rad(deg)), cy + r * Math.sin(rad(deg))] as const;

export function arcPath(r: number, a0: number, a1: number, cx = CX, cy = CY) {
  const [x0, y0] = polar(r, a0, cx, cy);
  const [x1, y1] = polar(r, a1, cx, cy);
  return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

export const TONE_COLOR: Record<GaugeZone["tone"], [string, string]> = {
  ok: ["#6fe39c", "#2e9e5b"],
  warn: ["#f3cf73", "#e0a43a"],
  over: ["#f59a86", "#e0573f"],
};

const angleFor = (v: number, max: number) => START + SWEEP * Math.max(0, Math.min(1.015, v / max));

/** Clave para recordar dónde quedó la aguja al salir del Inicio. */
const NEEDLE_KEY = "gauge:kcal";

export function NvGauge({ gauge, kcal, alcoholKcal = 0, status }: { gauge: Gauge; kcal: number; alcoholKcal?: number; status: { tone: GaugeZone["tone"]; text: string } | null }) {
  const id = `nvg${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const needleRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<SVGPathElement>(null);
  // Primera vez: sube desde 0 tras un instante (deja entrar las tarjetas). Al volver: sigue desde donde quedó.
  const [from] = useState(() => lastShownValue(NEEDLE_KEY, 0));
  const delay = from === 0 ? 160 : 0;
  const kcalRef = useCountUp(kcal, undefined, from, delay);
  const angleOf = (v: number) => angleFor(v, gauge.max);

  useSpringEffect(
    kcal,
    SPRINGS.needle,
    (v) => {
      rememberShown(NEEDLE_KEY, v);
      if (needleRef.current) needleRef.current.style.transform = `rotate(${angleOf(v).toFixed(2)}deg)`;
      if (fillRef.current) fillRef.current.style.strokeDashoffset = (1000 * (1 - Math.max(0, Math.min(1, v / gauge.max)))).toFixed(1);
    },
    from,
    delay,
  );

  const toneLabel = status?.tone === "ok" ? "dentro de la meta" : status?.tone === "warn" ? "cerca del límite" : "fuera de la meta";

  return (
    <div className="nv-gauge" role="img" aria-label={`${fmt(kcal)} de ${fmt(gauge.target)} kcal, ${toneLabel}`}>
      <div className="nv-gauge-dial">
        <GaugeDial gauge={gauge} id={id} />

        <svg viewBox="0 0 320 226" className="nv-gauge-layer" aria-hidden="true">
          <path ref={fillRef} d={arcPath(118, START, START + SWEEP)} pathLength={1000} fill="none" stroke="rgba(255,255,255,.62)" strokeWidth="5" strokeLinecap="round" strokeDasharray="1000" style={{ strokeDashoffset: 1000 }} />
          {/* Alcohol del día: franja violeta antes de la aguja */}
          {alcoholKcal > 0 ? <path d={arcPath(104, angleOf(Math.max(0, kcal - alcoholKcal)), angleOf(kcal))} fill="none" stroke="#a796ec" strokeWidth="6" strokeLinecap="round" opacity="0.9" /> : null}
        </svg>

        {/* Aguja de vidrio dibujada apuntando a 0°; la capa entera gira alrededor del centro del dial */}
        <div ref={needleRef} className="nv-gauge-needle" style={{ transform: `rotate(${angleOf(from).toFixed(2)}deg)` }} aria-hidden="true">
          <svg viewBox="0 0 320 226" className="nv-gauge-layer">
            <defs>
              <linearGradient id={`${id}needle`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#ffffff" />
                <stop offset="0.5" stopColor="#dfe5ea" />
                <stop offset="1" stopColor="#9aa3ad" />
              </linearGradient>
              <radialGradient id={`${id}tip`}>
                <stop offset="0" stopColor="#fff" stopOpacity="1" />
                <stop offset="0.5" stopColor="#fff" stopOpacity="0.6" />
                <stop offset="1" stopColor="#fff" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx={CX + 118} cy={CY} r="16" fill={`url(#${id}tip)`} />
            <path d={`M${CX + 90} ${CY - 2.2} L${CX + 120} ${CY - 5.2} Q${CX + 127} ${CY} ${CX + 120} ${CY + 5.2} L${CX + 90} ${CY + 2.2} Q${CX + 86} ${CY} ${CX + 90} ${CY - 2.2}Z`} fill={`url(#${id}needle)`} stroke="rgba(70,80,92,.55)" strokeWidth="0.8" />
            <path d={`M${CX + 94} ${CY - 1.2} L${CX + 118} ${CY - 3}`} stroke="#fff" strokeWidth="1.3" strokeLinecap="round" />
            <circle cx={CX + 118} cy={CY} r="3" fill="#2e9e5b" stroke="#fff" strokeWidth="1" />
          </svg>
        </div>
      </div>

      <div className="nv-gauge-center">
        <p className="nv-gauge-kcal">
          <span ref={kcalRef} className="nv-num">
            {fmt(from)}
          </span>
        </p>
        <p className="nv-gauge-of">/ {fmt(gauge.target)} kcal</p>
      </div>
      <p className="nv-gauge-limitlabel">
        <span className={`nv-dot is-${gauge.mode === "over" ? "warn" : "ink"}`} /> {gauge.limitLabel} · {fmt(gauge.target)} kcal
      </p>
      {status ? (
        <p className={`nv-chip is-${status.tone}`}>
          <span className="nv-chip-dot" />
          {status.text}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Dial fijo: bisel, zonas con resplandor, escala y límite. Solo se vuelve a dibujar si cambian
 * las zonas o el objetivo, nunca mientras se mueve la aguja.
 */
const GaugeDial = memo(
  function GaugeDial({ gauge, id }: { gauge: Gauge; id: string }) {
    const angleOf = (v: number) => angleFor(v, gauge.max);
    const labelEvery = gauge.max > 3000 ? 1000 : 500;
    const [lx, ly] = polar(150, angleOf(gauge.target));
    const [tx1, ty1] = polar(140, angleOf(gauge.target));
    const [tx0, ty0] = polar(96, angleOf(gauge.target));
    const limitRight = lx > CX;
    return (
      <svg viewBox="0 0 320 226" className="nv-gauge-svg" aria-hidden="true">
        <defs>
          <linearGradient id={`${id}bezel`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.45" stopColor="#e6eaee" />
            <stop offset="0.7" stopColor="#c3cad2" />
            <stop offset="1" stopColor="#f4f6f8" />
          </linearGradient>
          <linearGradient id={`${id}face`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="1" stopColor="#e9edf0" stopOpacity="0.55" />
          </linearGradient>
          {gauge.zones.map((z, i) => (
            <linearGradient key={i} id={`${id}z${i}`} gradientUnits="userSpaceOnUse" x1={polar(118, angleOf(z.from))[0]} y1={polar(118, angleOf(z.from))[1]} x2={polar(118, angleOf(z.to))[0]} y2={polar(118, angleOf(z.to))[1]}>
              <stop offset="0" stopColor={TONE_COLOR[z.tone][0]} />
              <stop offset="1" stopColor={TONE_COLOR[z.tone][1]} />
            </linearGradient>
          ))}
          <filter id={`${id}glow`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>

        {/* Cristal del dial */}
        <path d={arcPath(146, START, START + SWEEP)} fill="none" stroke={`url(#${id}bezel)`} strokeWidth="26" strokeLinecap="round" />
        <path d={arcPath(157.5, START + 2, START + SWEEP - 2)} fill="none" stroke="rgba(255,255,255,.95)" strokeWidth="1.6" strokeLinecap="round" />
        <path d={arcPath(134.5, START + 2, START + SWEEP - 2)} fill="none" stroke="rgba(110,122,136,.28)" strokeWidth="1.2" strokeLinecap="round" />
        <path d={`${arcPath(124, START, START + SWEEP)} L${CX} ${CY}Z`} fill={`url(#${id}face)`} opacity="0.75" />

        {/* Zonas (verde / ámbar / rojo) con resplandor */}
        <g filter={`url(#${id}glow)`} opacity="0.55">
          {gauge.zones.map((z, i) => (
            <path key={i} d={arcPath(118, angleOf(z.from), angleOf(z.to))} fill="none" stroke={TONE_COLOR[z.tone][1]} strokeWidth="14" />
          ))}
        </g>
        {gauge.zones.map((z, i) => (
          <path key={i} d={arcPath(118, angleOf(z.from) + (i ? 0.6 : 0), angleOf(z.to) - (i < gauge.zones.length - 1 ? 0.6 : 0))} fill="none" stroke={`url(#${id}z${i})`} strokeWidth="12" strokeLinecap={i === 0 || i === gauge.zones.length - 1 ? "round" : "butt"} />
        ))}
        <path d={arcPath(122.5, START + 1, START + SWEEP - 1)} fill="none" stroke="rgba(255,255,255,.8)" strokeWidth="1.4" />

        {/* Escala */}
        {gauge.ticks.map((t) => {
          const a = angleOf(t);
          const major = t % labelEvery === 0;
          const [x0, y0] = polar(major ? 96 : 100, a);
          const [x1, y1] = polar(108, a);
          const [tx, ty] = polar(82, a);
          return (
            <g key={t}>
              <line x1={x0} y1={y0} x2={x1} y2={y1} stroke={major ? "#5d6670" : "#9aa1ab"} strokeWidth={major ? 2 : 1.2} strokeLinecap="round" />
              {major ? (
                <text x={tx} y={ty + 3.5} textAnchor="middle" className="nv-gauge-tick">
                  {t >= 1000 ? `${t / 1000}k` : t}
                </text>
              ) : null}
            </g>
          );
        })}

        {/* Límite / mínimo */}
        <line x1={tx0} y1={ty0} x2={tx1} y2={ty1} stroke="#1f2428" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="3 3" />
        <g transform={`translate(${limitRight ? lx + 4 : lx - 4} ${ly - 10})`}>
          <text textAnchor={limitRight ? "start" : "end"} className="nv-gauge-limit">
            {fmt(gauge.target)}
          </text>
        </g>
      </svg>
    );
  },
  (a, b) => a.id === b.id && JSON.stringify(a.gauge) === JSON.stringify(b.gauge),
);

/** Mini velocímetro para la tarjeta de borrador del chat: dónde quedaría el día si se guarda. */
export function NvMiniGauge({ value, target, mode = "under" }: { value: number; target: number; mode?: Gauge["mode"] }) {
  const max = Math.max(target * 1.5, value * 1.05, 1);
  const a = (v: number) => 180 + 180 * Math.min(1, v / max);
  const needle = useRef<SVGLineElement>(null);
  useSpringEffect(value, SPRINGS.needle, (v) => {
    const [x, y] = polar(30, a(v), 40, 42);
    needle.current?.setAttribute("x2", x.toFixed(2));
    needle.current?.setAttribute("y2", y.toFixed(2));
  }, 0);
  const tone: GaugeZone["tone"] = mode === "under" ? (value > target ? "over" : value >= target * 0.9 ? "warn" : "ok") : mode === "over" ? (value >= target ? "ok" : "warn") : Math.abs(value - target) <= target * 0.05 ? "ok" : "warn";
  return (
    <svg viewBox="0 0 80 48" width="80" height="48" className="nv-mini-gauge" aria-hidden="true">
      <path d={arcPath(32, 180, 360, 40, 42)} fill="none" stroke="rgba(150,160,170,.35)" strokeWidth="7" strokeLinecap="round" />
      <path d={arcPath(32, 180, a(target), 40, 42)} fill="none" stroke={mode === "over" ? TONE_COLOR.warn[1] : TONE_COLOR.ok[1]} strokeWidth="7" strokeLinecap="round" opacity="0.85" />
      <path d={arcPath(32, a(target), 360, 40, 42)} fill="none" stroke={mode === "over" ? TONE_COLOR.ok[1] : TONE_COLOR.over[1]} strokeWidth="7" strokeLinecap="round" opacity="0.85" />
      <line ref={needle} x1="40" y1="42" x2="10" y2="42" stroke={TONE_COLOR[tone][1]} strokeWidth="3" strokeLinecap="round" />
      <circle cx="40" cy="42" r="4.5" fill="#fff" stroke="rgba(70,80,92,.4)" />
    </svg>
  );
}
