"use client";

import { useState } from "react";
import {
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import {
  WorkoutAnalyticsService,
  type IntensityZone,
  type ScatterSetPoint,
} from "@/lib/analytics";

type Props = {
  data: ScatterSetPoint[];
  exerciseName: string;
};

const ZONE_COLORS: Record<IntensityZone, string> = {
  fuerza: "#ff4d1a",
  hipertrofia: "#3b82f6",
  resistencia: "#10b981",
};

export function IntensityScatterChart({ data, exerciseName }: Props) {
  const [selectedZone, setSelectedZone] = useState<IntensityZone | "all">("all");

  const summary = WorkoutAnalyticsService.getIntensityZoneSummary(data);

  const filteredData =
    selectedZone === "all"
      ? data
      : data.filter((p) => p.zone === selectedZone);

  const axisStyle = { fontSize: 11, fill: "#8b8b86" };

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const point: ScatterSetPoint = payload[0].payload;

    return (
      <div className="glass-strong rounded-xl border border-[var(--line-strong)] p-3 text-xs shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <p className="font-bold text-[var(--ink)]">{point.date}</p>
          <span
            className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase"
            style={{
              backgroundColor: `${ZONE_COLORS[point.zone]}20`,
              color: ZONE_COLORS[point.zone],
            }}
          >
            {point.zone}
          </span>
        </div>
        <div className="mt-2 space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[var(--muted)]">Carga × Reps:</span>
            <span className="font-bold text-[var(--ink)]">
              {point.weightKg} kg × {point.reps} reps
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-[var(--muted)]">1RM equivalente:</span>
            <span className="font-semibold text-[var(--accent)]">
              {point.est1rm > 0 ? `${point.est1rm} kg` : "—"}
            </span>
          </div>
        </div>
      </div>
    );
  };

  if (data.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center p-8 text-center">
        <p className="text-sm font-semibold text-[var(--muted)]">
          Sin series suficientes para construir el mapa de intensidad.
        </p>
      </div>
    );
  }

  return (
    <div className="card space-y-4 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-[#10b981]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--ink)]">
              Dispersión: Repeticiones vs. Peso
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-[var(--muted)]">
            Distribución de intensidad y estímulo de cada serie realizada
          </p>
        </div>

        {/* Filtro interactivo por zona */}
        <div className="flex items-center gap-1 rounded-lg border border-[var(--line)] bg-[#0d0d0d] p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setSelectedZone("all")}
            className={`rounded-md px-2 py-1 font-semibold transition-all ${
              selectedZone === "all"
                ? "bg-white/10 text-white"
                : "text-[var(--muted)] hover:text-white"
            }`}
          >
            Todas ({data.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedZone("fuerza")}
            className={`rounded-md px-2 py-1 font-semibold transition-all ${
              selectedZone === "fuerza"
                ? "bg-[#ff4d1a] text-white"
                : "text-[#ff4d1a]/70 hover:text-[#ff4d1a]"
            }`}
          >
            Fuerza
          </button>
          <button
            type="button"
            onClick={() => setSelectedZone("hipertrofia")}
            className={`rounded-md px-2 py-1 font-semibold transition-all ${
              selectedZone === "hipertrofia"
                ? "bg-[#3b82f6] text-white"
                : "text-[#3b82f6]/70 hover:text-[#3b82f6]"
            }`}
          >
            Hipertrofia
          </button>
          <button
            type="button"
            onClick={() => setSelectedZone("resistencia")}
            className={`rounded-md px-2 py-1 font-semibold transition-all ${
              selectedZone === "resistencia"
                ? "bg-[#10b981] text-white"
                : "text-[#10b981]/70 hover:text-[#10b981]"
            }`}
          >
            Resistencia
          </button>
        </div>
      </div>

      {/* Badges de Resumen de Zonas */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-[#ff4d1a]/20 bg-[#ff4d1a]/5 p-2 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#ff4d1a]">
            Fuerza (1-5 reps)
          </p>
          <p className="mt-0.5 text-lg font-bold text-[var(--ink)]">
            {summary.fuerza.pct}%
          </p>
          <p className="text-[10px] text-[var(--muted)]">
            {summary.fuerza.count} series
          </p>
        </div>

        <div className="rounded-lg border border-[#3b82f6]/20 bg-[#3b82f6]/5 p-2 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#3b82f6]">
            Hipertrofia (6-12)
          </p>
          <p className="mt-0.5 text-lg font-bold text-[var(--ink)]">
            {summary.hipertrofia.pct}%
          </p>
          <p className="text-[10px] text-[var(--muted)]">
            {summary.hipertrofia.count} series
          </p>
        </div>

        <div className="rounded-lg border border-[#10b981]/20 bg-[#10b981]/5 p-2 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#10b981]">
            Resistencia (13+)
          </p>
          <p className="mt-0.5 text-lg font-bold text-[var(--ink)]">
            {summary.resistencia.pct}%
          </p>
          <p className="text-[10px] text-[var(--muted)]">
            {summary.resistencia.count} series
          </p>
        </div>
      </div>

      {/* Gráfico de Dispersión */}
      <div className="h-64 w-full sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#222" />
            <XAxis
              type="number"
              dataKey="reps"
              name="Repeticiones"
              tick={axisStyle}
              stroke="#333"
              domain={[0, "auto"]}
              unit=" reps"
            />
            <YAxis
              type="number"
              dataKey="weightKg"
              name="Peso"
              tick={axisStyle}
              stroke="#333"
              domain={[0, "auto"]}
              unit=" kg"
            />
            <ZAxis range={[60, 60]} />
            <Tooltip content={<CustomTooltip />} />
            <Scatter name="Series" data={filteredData}>
              {filteredData.map((entry, index) => (
                <Cell
                  key={`scatter-cell-${index}`}
                  fill={ZONE_COLORS[entry.zone]}
                  stroke="#fff"
                  strokeWidth={1}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <p className="text-center text-[11px] text-[var(--muted)]">
        Cada punto representa una serie individual registrada en tu historial.
      </p>

      {/* Explicación y Guía de Interpretación */}
      <div className="rounded-xl border border-[var(--line)] bg-[#0a0a0a]/70 p-3.5 text-xs text-[var(--muted)] space-y-2.5">
        <div className="flex items-center gap-2 font-bold text-[var(--ink)]">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#10b981]" />
          <span className="uppercase tracking-wider text-[11px] text-[#10b981]">
            Interpretación y análisis
          </span>
        </div>
        <div className="grid gap-3 text-[11px] leading-relaxed sm:grid-cols-3">
          <div className="rounded-lg bg-black/40 p-2.5 border border-white/5">
            <p className="font-semibold text-[var(--ink)]">
              ¿Qué está midiendo?
            </p>
            <p className="mt-1 text-[var(--muted)]">
              El <strong className="text-[var(--ink)]">perfil de intensidad y estímulo neuromuscular</strong> de cada serie individual según su combinación de peso y repeticiones.
            </p>
          </div>
          <div className="rounded-lg bg-black/40 p-2.5 border border-white/5">
            <p className="font-semibold text-[var(--ink)]">
              ¿Cómo lo mide?
            </p>
            <p className="mt-1 text-[var(--muted)]">
              Mapea el plano cartesiano (X: Reps, Y: Peso) y clasifica por zonas: <strong className="text-[#ff4d1a]">Fuerza (1–5)</strong>, <strong className="text-[#3b82f6]">Hipertrofia (6–12)</strong> y <strong className="text-[#10b981]">Resistencia (13+)</strong>.
            </p>
          </div>
          <div className="rounded-lg bg-black/40 p-2.5 border border-white/5">
            <p className="font-semibold text-[var(--ink)]">
              Impacto en tu entreno
            </p>
            <p className="mt-1 text-[var(--muted)]">
              Sirve para auditar tu objetivo: si buscas hipertrofia, la gran mayoría de tus series deben caer en la <strong className="text-[#3b82f6]">zona azul</strong> (6–12 reps). Si buscas fuerza máxima, debes sumar densidad en la <strong className="text-[#ff4d1a]">zona roja</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
