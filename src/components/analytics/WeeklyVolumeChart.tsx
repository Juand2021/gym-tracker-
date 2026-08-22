"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { WeeklyVolumePoint } from "@/lib/analytics";

type Props = {
  data: WeeklyVolumePoint[];
  exerciseName?: string;
};

function fmt(n: number | null | undefined, digits = 1): string {
  if (n == null || isNaN(n)) return "—";
  return Number.isInteger(n) ? String(n) : n.toFixed(digits);
}

export function WeeklyVolumeChart({ data, exerciseName }: Props) {
  const axisStyle = { fontSize: 11, fill: "#8b8b86" };

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const point: WeeklyVolumePoint = payload[0].payload;

    return (
      <div className="glass-strong rounded-xl border border-[var(--line-strong)] p-3 text-xs shadow-2xl backdrop-blur-xl">
        <p className="font-bold text-[var(--ink)]">
          Semana {point.weekLabel} ({point.weekKey})
        </p>
        <div className="mt-2 space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[var(--muted)]">Tonelaje semanal:</span>
            <span className="font-bold text-[var(--accent)]">
              {fmt(point.tonnage, 2)} t ({point.volumeKg} kg)
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-[var(--muted)]">Series trabajadas:</span>
            <span className="font-semibold text-[var(--ink)]">
              {point.setsCount} series ({point.sessionsCount} sesiones)
            </span>
          </div>
          {point.deltaPct != null ? (
            <div className="flex items-center justify-between gap-4 border-t border-[var(--line)] pt-1">
              <span className="text-[var(--muted)]">vs. Semana anterior:</span>
              <span
                className={`font-semibold ${
                  point.deltaPct >= 0
                    ? "text-[#10b981]"
                    : "text-[var(--danger)]"
                }`}
              >
                {point.deltaPct > 0 ? "+" : ""}
                {fmt(point.deltaPct)}%
              </span>
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  if (data.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center p-8 text-center">
        <p className="text-sm font-semibold text-[var(--muted)]">
          Sin datos de volumen semanal registrados en este periodo.
        </p>
      </div>
    );
  }

  const maxTonnage = Math.max(...data.map((d) => d.tonnage), 0);

  return (
    <div className="card space-y-4 p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-[#3b82f6]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--ink)]">
              Volumen de Carga Semanal
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-[var(--muted)]">
            Tonelaje acumulado por semana (Carga × Repeticiones)
          </p>
        </div>
      </div>

      <div className="h-60 w-full sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="volGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.4} />
              </linearGradient>
              <linearGradient id="volMaxGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff4d1a" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#b91c1c" stopOpacity={0.4} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
            <XAxis dataKey="weekLabel" tick={axisStyle} stroke="#333" />
            <YAxis tick={axisStyle} stroke="#333" unit="t" />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
            <Bar
              dataKey="tonnage"
              radius={[6, 6, 2, 2]}
              maxBarSize={48}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.tonnage === maxTonnage && maxTonnage > 0
                      ? "url(#volMaxGradient)"
                      : "url(#volGradient)"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--line)] pt-3 text-[11px] text-[var(--muted)]">
        <span>Semanas naturales del calendario (Lunes a Domingo)</span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-[var(--accent)]" />
          Semana de mayor tonelaje
        </span>
      </div>

      {/* Explicación y Guía de Interpretación */}
      <div className="rounded-xl border border-[var(--line)] bg-[#0a0a0a]/70 p-3.5 text-xs text-[var(--muted)] space-y-2.5">
        <div className="flex items-center gap-2 font-bold text-[var(--ink)]">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#3b82f6]" />
          <span className="uppercase tracking-wider text-[11px] text-[#3b82f6]">
            Interpretación y análisis
          </span>
        </div>
        <div className="grid gap-3 text-[11px] leading-relaxed sm:grid-cols-3">
          <div className="rounded-lg bg-black/40 p-2.5 border border-white/5">
            <p className="font-semibold text-[var(--ink)]">
              ¿Qué está midiendo?
            </p>
            <p className="mt-1 text-[var(--muted)]">
              El <strong className="text-[var(--ink)]">Volumen de Carga (Tonelaje total)</strong> movido cada semana en este ejercicio, medido en toneladas (t) o kilogramos (kg).
            </p>
          </div>
          <div className="rounded-lg bg-black/40 p-2.5 border border-white/5">
            <p className="font-semibold text-[var(--ink)]">
              ¿Cómo lo mide?
            </p>
            <p className="mt-1 text-[var(--muted)]">
              Suma el producto de cada serie: <strong className="text-[var(--ink)]">Tonelaje = Σ (Carga Efectiva × Repeticiones)</strong>, agrupado de lunes a domingo.
            </p>
          </div>
          <div className="rounded-lg bg-black/40 p-2.5 border border-white/5">
            <p className="font-semibold text-[var(--ink)]">
              Impacto en tu entreno
            </p>
            <p className="mt-1 text-[var(--muted)]">
              El volumen es el estímulo primario de la <strong className="text-[#3b82f6]">hipertrofia muscular</strong>. Una progresión gradual del tonelaje combinada con buena técnica asegura crecimiento muscular sin acumular fatiga excesiva.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
