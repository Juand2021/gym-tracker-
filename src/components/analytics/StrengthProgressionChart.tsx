"use client";

import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { OneRmSessionPoint } from "@/lib/analytics";

type Props = {
  data: OneRmSessionPoint[];
  exerciseName: string;
};

function fmt(n: number | null | undefined, digits = 1): string {
  if (n == null || isNaN(n)) return "—";
  return Number.isInteger(n) ? String(n) : n.toFixed(digits);
}

export function StrengthProgressionChart({ data, exerciseName }: Props) {
  const [viewMode, setViewMode] = useState<"absolute" | "relative">("absolute");
  const hasRelative = data.some((p) => p.relative1rm != null);

  const axisStyle = { fontSize: 11, fill: "#8b8b86" };

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const point: OneRmSessionPoint = payload[0].payload;

    return (
      <div className="glass-strong rounded-xl border border-[var(--line-strong)] p-3 text-xs shadow-2xl backdrop-blur-xl">
        <p className="font-bold text-[var(--ink)]">{point.date}</p>
        <div className="mt-2 space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[var(--muted)]">Mejor serie:</span>
            <span className="font-semibold text-[var(--accent)]">
              {point.weightKg} kg × {point.reps} reps
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-[var(--muted)]">1RM Estimado (Epley):</span>
            <span className="font-bold text-[var(--ink)]">
              {fmt(point.est1rm)} kg
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-[var(--muted)]">Media Móvil (SMA):</span>
            <span className="font-semibold text-[#60a5fa]">
              {fmt(point.movingAvg1rm)} kg
            </span>
          </div>
          {point.relative1rm != null ? (
            <div className="flex items-center justify-between gap-4">
              <span className="text-[var(--muted)]">Fuerza Relativa:</span>
              <span className="font-semibold text-[#a855f7]">
                {fmt(point.relative1rm, 2)}× PC
                {point.bodyWeightKg ? ` (${point.bodyWeightKg}kg)` : ""}
              </span>
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-4 border-t border-[var(--line)] pt-1 text-[10px]">
            <span className="text-[var(--muted)]">Volumen sesión:</span>
            <span className="text-[var(--ink)]">
              {point.sessionVolumeKg} kg ({point.totalSets} series)
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
          Sin registros suficientes de 1RM para este ejercicio en el periodo.
        </p>
      </div>
    );
  }

  return (
    <div className="card space-y-4 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-[var(--accent)]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--ink)]">
              Progresión de Fuerza & Tendencia
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-[var(--muted)]">
            Máximo 1RM por sesión y línea suavizada de media móvil.
          </p>
        </div>

        {hasRelative ? (
          <div className="flex items-center rounded-lg border border-[var(--line)] bg-[#0d0d0d] p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("absolute")}
              className={`rounded-md px-2.5 py-1 font-semibold transition-all ${
                viewMode === "absolute"
                  ? "bg-[var(--accent)] text-white shadow"
                  : "text-[var(--muted)] hover:text-white"
              }`}
            >
              1RM (kg)
            </button>
            <button
              type="button"
              onClick={() => setViewMode("relative")}
              className={`rounded-md px-2.5 py-1 font-semibold transition-all ${
                viewMode === "relative"
                  ? "bg-[var(--accent)] text-white shadow"
                  : "text-[var(--muted)] hover:text-white"
              }`}
            >
              Fuerza Relativa (×PC)
            </button>
          </div>
        ) : null}
      </div>

      <div className="h-64 w-full sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="lineGlow" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#ff4d1a" />
                <stop offset="100%" stopColor="#ff8533" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
            <XAxis
              dataKey="date"
              tick={axisStyle}
              stroke="#333"
              tickFormatter={(val: string) => val.slice(5)}
            />
            <YAxis
              tick={axisStyle}
              stroke="#333"
              domain={["auto", "auto"]}
              unit={viewMode === "absolute" ? "kg" : "x"}
            />
            <Tooltip content={<CustomTooltip />} />

            {viewMode === "absolute" ? (
              <>
                {/* 1RM Real de la sesión */}
                <Line
                  type="monotone"
                  dataKey="est1rm"
                  name="1RM Estimado"
                  stroke="url(#lineGlow)"
                  strokeWidth={2.8}
                  dot={{
                    r: 4,
                    fill: "#ff4d1a",
                    stroke: "#fff",
                    strokeWidth: 1.5,
                  }}
                  activeDot={{
                    r: 6,
                    fill: "#ff4d1a",
                    stroke: "#fff",
                    strokeWidth: 2,
                  }}
                />

                {/* Media Móvil SMA */}
                <Line
                  type="monotone"
                  dataKey="movingAvg1rm"
                  name="Media Móvil (SMA)"
                  stroke="#60a5fa"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </>
            ) : (
              <Line
                type="monotone"
                dataKey="relative1rm"
                name="Fuerza Relativa"
                stroke="#a855f7"
                strokeWidth={2.8}
                dot={{
                  r: 4,
                  fill: "#a855f7",
                  stroke: "#fff",
                  strokeWidth: 1.5,
                }}
                activeDot={{ r: 6 }}
                connectNulls
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Leyenda y Notas */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-3 text-[11px] text-[var(--muted)]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
            1RM Máximo de sesión
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-1 w-4 rounded bg-[#60a5fa]" />
            Media móvil (SMA 3 sesiones)
          </span>
        </div>
        <span>Fórmula de Epley</span>
      </div>

      {/* Explicación y Guía de Interpretación */}
      <div className="rounded-xl border border-[var(--line)] bg-[#0a0a0a]/70 p-3.5 text-xs text-[var(--muted)] space-y-2.5">
        <div className="flex items-center gap-2 font-bold text-[var(--ink)]">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
          <span className="uppercase tracking-wider text-[11px] text-[var(--accent)]">
            Interpretación y análisis
          </span>
        </div>
        <div className="grid gap-3 text-[11px] leading-relaxed sm:grid-cols-3">
          <div className="rounded-lg bg-black/40 p-2.5 border border-white/5">
            <p className="font-semibold text-[var(--ink)]">
              ¿Qué está midiendo?
            </p>
            <p className="mt-1 text-[var(--muted)]">
              La evolución de tu <strong className="text-[var(--ink)]">fuerza máxima estimada (1RM)</strong> sesión a sesión para este ejercicio, junto con su curva de tendencia subyacente.
            </p>
          </div>
          <div className="rounded-lg bg-black/40 p-2.5 border border-white/5">
            <p className="font-semibold text-[var(--ink)]">
              ¿Cómo lo mide?
            </p>
            <p className="mt-1 text-[var(--muted)]">
              Toma la serie con mayor rendimiento de cada sesión usando la <strong className="text-[var(--ink)]">Fórmula de Epley</strong>: 1RM = Peso × (1 + Reps / 30). La <strong className="text-[#60a5fa]">Media Móvil</strong> promedia 3 sesiones para filtrar el ruido diario.
            </p>
          </div>
          <div className="rounded-lg bg-black/40 p-2.5 border border-white/5">
            <p className="font-semibold text-[var(--ink)]">
              Impacto en tu entreno
            </p>
            <p className="mt-1 text-[var(--muted)]">
              Si la <strong className="text-[#60a5fa]">línea de tendencia</strong> sube constantemente, hay sobrecarga progresiva real. Si se estanca o baja varias semanas consecutivas, indica fatiga acumulada o necesidad de una semana de descarga (<em>deload</em>).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
