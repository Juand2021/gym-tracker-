"use client";

import type { MuscleGroupVolumePoint } from "@/lib/analytics";

type Props = {
  data: MuscleGroupVolumePoint[];
};

const GROUP_COLORS: Record<string, string> = {
  Pecho: "#ff4d1a",
  Espalda: "#3b82f6",
  Pierna: "#10b981",
  Hombro: "#f59e0b",
  Bíceps: "#8b5cf6",
  Tríceps: "#ec4899",
  Antebrazo: "#06b6d4",
  "Abdomen y Core": "#84cc16",
  Otros: "#6b7280",
};

export function MuscleGroupVolumeChart({ data }: Props) {
  if (data.length === 0) return null;

  return (
    <div className="card space-y-4 p-4 sm:p-5">
      <div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-[#f59e0b]" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--ink)]">
            Distribución por Grupo Muscular
          </h3>
        </div>
        <p className="mt-0.5 text-xs text-[var(--muted)]">
          Balance de tonelaje total movido en el periodo seleccionado
        </p>
      </div>

      {/* Barra de distribución combinada */}
      <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-[#1c1c1c]">
        {data.map((item) => (
          <div
            key={item.group}
            style={{
              width: `${item.percentage}%`,
              backgroundColor: GROUP_COLORS[item.group] ?? "#6b7280",
            }}
            className="h-full transition-all duration-500 hover:opacity-80"
            title={`${item.group}: ${item.percentage}% (${item.tonnage}t)`}
          />
        ))}
      </div>

      {/* Grid de desglose */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {data.map((item) => {
          const color = GROUP_COLORS[item.group] ?? "#6b7280";
          return (
            <div
              key={item.group}
              className="flex items-center justify-between rounded-lg border border-[var(--line)] bg-[#0d0d0d] p-2.5"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-[var(--ink)]">
                    {item.group}
                  </p>
                  <p className="text-[10px] text-[var(--muted)]">
                    {item.setsCount} series
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-[var(--ink)] tabular-nums">
                  {item.percentage}%
                </p>
                <p className="text-[10px] text-[var(--muted)] tabular-nums">
                  {item.tonnage}t
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Explicación y Guía de Interpretación */}
      <div className="rounded-xl border border-[var(--line)] bg-[#0a0a0a]/70 p-3.5 text-xs text-[var(--muted)] space-y-2.5">
        <div className="flex items-center gap-2 font-bold text-[var(--ink)]">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#f59e0b]" />
          <span className="uppercase tracking-wider text-[11px] text-[#f59e0b]">
            Interpretación y análisis
          </span>
        </div>
        <div className="grid gap-3 text-[11px] leading-relaxed sm:grid-cols-3">
          <div className="rounded-lg bg-black/40 p-2.5 border border-white/5">
            <p className="font-semibold text-[var(--ink)]">
              ¿Qué está midiendo?
            </p>
            <p className="mt-1 text-[var(--muted)]">
              La proporción y reparto del <strong className="text-[var(--ink)]">tonelaje total</strong> acumulado entre los distintos grupos musculares del cuerpo.
            </p>
          </div>
          <div className="rounded-lg bg-black/40 p-2.5 border border-white/5">
            <p className="font-semibold text-[var(--ink)]">
              ¿Cómo lo mide?
            </p>
            <p className="mt-1 text-[var(--muted)]">
              Clasifica cada ejercicio en su grupo anatómico (Pecho, Espalda, Pierna, Hombro, etc.) y calcula el porcentaje de carga relativo sobre el 100% del volumen del periodo.
            </p>
          </div>
          <div className="rounded-lg bg-black/40 p-2.5 border border-white/5">
            <p className="font-semibold text-[var(--ink)]">
              Impacto en tu entreno
            </p>
            <p className="mt-1 text-[var(--muted)]">
              Previene <strong className="text-[#f59e0b]">desbalances articulares y musculares</strong> (ej. ratio empuje vs. tracción). Te ayuda a comprobar si estás priorizando adecuadamente tus grupos débiles.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
