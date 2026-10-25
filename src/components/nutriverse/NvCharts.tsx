"use client";

import { useId, useRef } from "react";
import { fmt, SPRINGS, useCountUp, useSpringEffect } from "./glass/motion";
import { NvIcon, type IconName } from "./NvIcon";

const uid = (raw: string) => raw.replace(/[^a-zA-Z0-9_-]/g, "");

/** Tubo de vidrio con líquido que sube con resorte y una ola en la superficie (macros). */
export function NvTube({ label, value, target, unit = "g", color, icon }: { label: string; value: number; target: number | null; unit?: string; color: "green" | "amber" | "sky"; icon: IconName }) {
  const liquid = useRef<HTMLSpanElement>(null);
  const pct = target ? value / target : 0;
  const count = useCountUp(value);
  useSpringEffect(Math.min(1.08, pct), SPRINGS.soft, (p) => {
    if (liquid.current) liquid.current.style.transform = `translate3d(0, ${(1 - Math.min(1, p)) * 100}%, 0)`;
  }, 0);
  return (
    <div className={`nv-tube is-${color}`}>
      <div className="nv-tube-glass nv-glass is-thin">
        <span ref={liquid} className="nv-tube-liquid">
          <span className="nv-tube-wave" />
        </span>
        <span className="nv-tube-shine" />
        <span className="nv-tube-ico">
          <NvIcon name={icon} size={22} />
        </span>
      </div>
      <p className="nv-tube-label">{label}</p>
      <p className="nv-tube-val">
        <span ref={count} className="nv-num">0</span>
        <span className="nv-tube-of">
          {target ? ` / ${fmt(target)}` : ""} {unit}
        </span>
      </p>
    </div>
  );
}

/** Barra de agua: vidrio con líquido que se mueve; tocar suma un vaso (250 ml). */
export function NvWater({ ml, target, onAdd, onRemove, busy }: { ml: number; target: number; onAdd: () => void; onRemove: () => void; busy?: boolean }) {
  const liquid = useRef<HTMLSpanElement>(null);
  const count = useCountUp(ml / 1000, (n) => n.toLocaleString("es-CO", { minimumFractionDigits: 1, maximumFractionDigits: 1 }));
  useSpringEffect(Math.min(1, ml / Math.max(1, target)), SPRINGS.soft, (p) => {
    if (liquid.current) liquid.current.style.transform = `translate3d(${(p - 1) * 100}%, 0, 0)`;
  }, 0);
  const glasses = Math.round(ml / 250);
  return (
    <div className="nv-water nv-glass">
      <span className="nv-water-ico">
        <NvIcon name="water" size={28} />
      </span>
      <div className="nv-water-main">
        <p className="nv-water-top">
          <span>Agua</span>
          <span>
            <span ref={count} className="nv-num">0</span> / {(target / 1000).toLocaleString("es-CO", { maximumFractionDigits: 1 })} L
          </span>
        </p>
        <button type="button" className="nv-water-bar nv-press" onClick={onAdd} disabled={busy} aria-label={`Agua: ${glasses} vasos. Sumar un vaso`}>
          <span ref={liquid} className="nv-water-liquid">
            <span className="nv-water-wave" />
          </span>
          <span className="nv-water-marks" aria-hidden="true">
            {Array.from({ length: Math.max(1, Math.round(target / 250)) - 1 }, (_, i) => (
              <span key={i} />
            ))}
          </span>
        </button>
      </div>
      <div className="nv-water-btns">
        <button type="button" className="nv-round nv-glass is-thin nv-press" onClick={onRemove} disabled={busy || ml <= 0} aria-label="Quitar un vaso">
          −
        </button>
        <button type="button" className="nv-round nv-glass is-green nv-press" onClick={onAdd} disabled={busy} aria-label="Sumar un vaso de agua">
          +
        </button>
      </div>
    </div>
  );
}

/** Anillo de vidrio (kcal promedio vs objetivo). */
export function NvRing({ value, target, size = 150, label, sub }: { value: number; target: number; size?: number; label: string; sub: string }) {
  const id = `nvr${uid(useId())}`;
  const arc = useRef<SVGCircleElement>(null);
  const r = 54;
  const c = 2 * Math.PI * r;
  const pct = target ? value / target : 0;
  const over = pct > 1;
  useSpringEffect(Math.min(1, pct), SPRINGS.soft, (p) => {
    arc.current?.setAttribute("stroke-dashoffset", String(c * (1 - p)));
  }, 0);
  const count = useCountUp(value);
  return (
    <div className="nv-ring" style={{ width: size, height: size }}>
      <svg viewBox="0 0 140 140" width={size} height={size} aria-hidden="true">
        <defs>
          <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={over ? "#f59a86" : "#8ff0b4"} />
            <stop offset="1" stopColor={over ? "#e0573f" : "#2e9e5b"} />
          </linearGradient>
          <radialGradient id={`${id}f`} cx="0.35" cy="0.3" r="0.8">
            <stop offset="0" stopColor="#fff" stopOpacity="0.95" />
            <stop offset="1" stopColor="#e3e8ec" stopOpacity="0.6" />
          </radialGradient>
        </defs>
        <circle cx="70" cy="70" r="66" fill="none" stroke="rgba(255,255,255,.9)" strokeWidth="1.5" />
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(160,170,180,.28)" strokeWidth="15" />
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,.7)" strokeWidth="15" strokeDasharray="1 7" />
        <circle ref={arc} cx="70" cy="70" r={r} fill="none" stroke={`url(#${id}g)`} strokeWidth="15" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c} transform="rotate(-90 70 70)" />
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="3" strokeDasharray={`${c * 0.18} ${c}`} transform="rotate(-120 70 70)" strokeLinecap="round" />
        <circle cx="70" cy="70" r="44" fill={`url(#${id}f)`} stroke="rgba(255,255,255,.95)" strokeWidth="1.2" />
        <path d="M40 58a32 32 0 0 1 22-22" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
      </svg>
      <div className="nv-ring-center">
        <span ref={count} className="nv-num nv-ring-val">0</span>
        <span className="nv-ring-label">{label}</span>
        <span className="nv-ring-sub">{sub}</span>
      </div>
    </div>
  );
}

/** Barras por día con la línea del límite y los días de fiesta marcados. */
export function NvBars({ days, target, mode, today }: { days: { date: string; kcal: number; party: boolean; inZone: boolean }[]; target: number | null; mode: "under" | "over" | "band"; today: string }) {
  const id = `nvbar${uid(useId())}`;
  const max = Math.max(target ? target * 1.35 : 0, ...days.map((d) => d.kcal), 500);
  const H = 132;
  const n = days.length;
  const gap = n > 40 ? 1.2 : n > 10 ? 2.4 : 8;
  const w = (300 - gap * (n - 1)) / n;
  const y = (v: number) => H - (v / max) * H;
  const showLabels = n <= 7;
  return (
    <svg viewBox={`0 0 300 ${H + (showLabels ? 22 : 6)}`} className="nv-bars" role="img" aria-label="Calorías por día">
      <defs>
        <linearGradient id={`${id}ok`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8ff0b4" />
          <stop offset="1" stopColor="#2e9e5b" />
        </linearGradient>
        <linearGradient id={`${id}over`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6b3a4" />
          <stop offset="1" stopColor="#e0573f" />
        </linearGradient>
        <linearGradient id={`${id}warn`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6dc95" />
          <stop offset="1" stopColor="#e0a43a" />
        </linearGradient>
      </defs>
      {days.map((d, i) => {
        const x = i * (w + gap);
        const h = Math.max(d.kcal > 0 ? 4 : 0, H - y(d.kcal));
        const tone = d.kcal === 0 ? null : d.inZone ? "ok" : target && ((mode === "under" && d.kcal > target) || (mode === "over" && d.kcal < target * 0.9)) ? "over" : "warn";
        const dt = new Date(`${d.date}T12:00:00Z`);
        return (
          <g key={d.date} className="nv-bar" style={{ ["--i" as string]: i }}>
            <rect x={x} y={0} width={w} height={H} rx={Math.min(6, w / 2)} fill="rgba(255,255,255,.35)" />
            {tone ? (
              <>
                <rect x={x} y={H - h} width={w} height={h} rx={Math.min(6, w / 2)} fill={`url(#${id}${tone})`} className="nv-bar-fill" />
                {w > 6 ? <rect x={x + w * 0.18} y={H - h + 3} width={Math.max(1.5, w * 0.16)} height={Math.max(0, h - 8)} rx="1" fill="rgba(255,255,255,.55)" className="nv-bar-fill" /> : null}
              </>
            ) : null}
            {d.party ? <circle cx={x + w / 2} cy={Math.max(6, H - h - 7)} r={Math.min(4, w / 2 + 0.5)} fill="#a796ec" stroke="#fff" strokeWidth="1" /> : null}
            {showLabels ? (
              <text x={x + w / 2} y={H + 16} textAnchor="middle" className={`nv-bars-label ${d.date === today ? "is-today" : ""}`}>
                {dt.toLocaleDateString("es-CO", { weekday: "short", timeZone: "UTC" }).replace(".", "").slice(0, 3)}
              </text>
            ) : null}
          </g>
        );
      })}
      {target ? (
        <g>
          <line x1="0" x2="300" y1={y(target)} y2={y(target)} stroke="#1f2428" strokeWidth="1.4" strokeDasharray="4 4" opacity="0.7" />
          <text x="298" y={y(target) - 4} textAnchor="end" className="nv-bars-limit">
            {mode === "over" ? "mínimo" : "límite"} {fmt(target)}
          </text>
        </g>
      ) : null}
    </svg>
  );
}

/** Línea de peso con área de vidrio y tendencia. */
export function NvLine({ points }: { points: { date: string; kg: number }[] }) {
  const id = `nvl${uid(useId())}`;
  if (points.length < 2) return <p className="nv-sub nv-line-empty">{points.length ? `Un pesaje: ${points[0].kg} kg. Con dos o más se ve la línea.` : "Sin pesajes en este rango. Se registran en Fuerza o por el chat."}</p>;
  const W = 300;
  const H = 110;
  const xs = points.map((p) => new Date(`${p.date}T12:00:00Z`).getTime());
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const lo = Math.min(...points.map((p) => p.kg)) - 0.4;
  const hi = Math.max(...points.map((p) => p.kg)) + 0.4;
  const X = (t: number) => 8 + ((t - x0) / Math.max(1, x1 - x0)) * (W - 16);
  const Y = (kg: number) => 10 + (1 - (kg - lo) / Math.max(0.1, hi - lo)) * (H - 24);
  const pts = points.map((p, i) => [X(xs[i]), Y(p.kg)] as const);
  // Curva suave (Catmull-Rom → Bézier)
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    d += ` C${p1[0] + (p2[0] - p0[0]) / 6} ${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6} ${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]} ${p2[1]}`;
  }
  // Tendencia (mínimos cuadrados)
  const n = pts.length;
  const mx = pts.reduce((a, p) => a + p[0], 0) / n;
  const my = pts.reduce((a, p) => a + p[1], 0) / n;
  const slope = pts.reduce((a, p) => a + (p[0] - mx) * (p[1] - my), 0) / Math.max(1e-6, pts.reduce((a, p) => a + (p[0] - mx) ** 2, 0));
  const last = pts[n - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="nv-line" role="img" aria-label={`Peso de ${points[0].kg} a ${points[n - 1].kg} kg`}>
      <defs>
        <linearGradient id={`${id}a`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5bd68a" stopOpacity="0.45" />
          <stop offset="1" stopColor="#5bd68a" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} stroke="rgba(120,130,140,.18)" strokeDasharray="2 5" />
      ))}
      <path d={`${d} L${last[0]} ${H} L${pts[0][0]} ${H}Z`} fill={`url(#${id}a)`} />
      <line x1={pts[0][0]} y1={my + slope * (pts[0][0] - mx)} x2={last[0]} y2={my + slope * (last[0] - mx)} stroke="#9aa1ab" strokeWidth="1.2" strokeDasharray="5 4" />
      <path d={d} fill="none" stroke="#2e9e5b" strokeWidth="5" strokeLinecap="round" opacity="0.25" />
      <path d={d} fill="none" stroke="#2e9e5b" strokeWidth="2.6" strokeLinecap="round" className="nv-line-path" pathLength={1} />
      <path d={d} fill="none" stroke="rgba(255,255,255,.85)" strokeWidth="0.9" strokeLinecap="round" transform="translate(0 -1)" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === n - 1 ? 5 : 2.6} fill="#fff" stroke="#2e9e5b" strokeWidth={i === n - 1 ? 2.4 : 1.4} />
      ))}
    </svg>
  );
}

/** Dona de vidrio de la distribución de macros (% de las kcal). */
export function NvDonut({ parts }: { parts: { label: string; pct: number; color: string }[] }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const shown = parts.filter((p) => p.pct > 0);
  const starts = shown.map((_, i) => shown.slice(0, i).reduce((a, p) => a + (p.pct / 100) * c, 0));
  return (
    <div className="nv-donut">
      <svg viewBox="0 0 120 120" width="128" height="128" aria-hidden="true">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(160,170,180,.25)" strokeWidth="18" />
        {shown.map((p, i) => {
          const len = (p.pct / 100) * c;
          return <circle key={p.label} cx="60" cy="60" r={r} fill="none" stroke={p.color} strokeWidth="18" strokeDasharray={`${Math.max(0, len - 1.5)} ${c}`} strokeDashoffset={-starts[i]} transform="rotate(-90 60 60)" className="nv-donut-seg" />;
        })}
        <circle cx="60" cy="60" r={r + 9} fill="none" stroke="rgba(255,255,255,.9)" strokeWidth="1.2" />
        <circle cx="60" cy="60" r={r - 9} fill="rgba(255,255,255,.7)" stroke="rgba(255,255,255,.95)" strokeWidth="1.2" />
        <path d="M30 44a34 34 0 0 1 16-16" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" opacity="0.85" />
      </svg>
      <ul className="nv-donut-legend">
        {parts.map((p) => (
          <li key={p.label}>
            <span className="nv-donut-dot" style={{ background: p.color }} />
            <span>{p.label}</span>
            <span className="nv-num">{p.pct} %</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Barra de progreso de vidrio (nivel). */
export function NvProgress({ value }: { value: number }) {
  const fill = useRef<HTMLSpanElement>(null);
  useSpringEffect(Math.max(0, Math.min(1, value)), SPRINGS.soft, (p) => {
    if (fill.current) fill.current.style.transform = `scaleX(${p})`;
  }, 0);
  return (
    <span className="nv-progress">
      <span ref={fill} className="nv-progress-fill" />
    </span>
  );
}
