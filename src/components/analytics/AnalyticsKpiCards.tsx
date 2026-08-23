"use client";

import type { AnalyticsKpiSummary } from "@/lib/analytics";
import { formatShortDate } from "@/lib/exercise-history";

type Props = {
  kpi: AnalyticsKpiSummary;
  exerciseName?: string;
};

function fmt(n: number | null | undefined, digits = 1): string {
  if (n == null || isNaN(n)) return "—";
  return Number.isInteger(n) ? String(n) : n.toFixed(digits);
}

export function AnalyticsKpiCards({ kpi }: Props) {
  const hasProgression = kpi.progressionPct != null;
  const isPositive = (kpi.progressionPct ?? 0) >= 0;

  return (
    <section className="grid grid-cols-2 gap-2 sm:gap-2.5 sm:grid-cols-4">
      {/* 1RM Actual */}
      <div className="card relative flex flex-col justify-between overflow-hidden p-3 sm:p-4">
        <div>
          <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
            1RM Actual
          </p>

          <div className="mt-1 flex items-baseline gap-1">
            <span className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl tracking-tight text-[var(--ink)] tabular-nums">
              {kpi.current1rm ? fmt(kpi.current1rm) : "—"}
            </span>
            {kpi.current1rm ? (
              <span className="text-xs font-normal text-[var(--muted)]">kg</span>
            ) : null}
          </div>
        </div>

        <div className="mt-2 text-[10px] sm:text-[11px] leading-tight text-[var(--muted)]">
          {kpi.current1rmDate ? (
            <div className="flex items-center justify-between gap-1 text-[10px]">
              <span>{formatShortDate(kpi.current1rmDate)}</span>
              {kpi.allTimeMax1rm && kpi.current1rm && kpi.current1rm >= kpi.allTimeMax1rm ? (
                <span className="font-semibold text-[var(--accent)]">Récord</span>
              ) : kpi.allTimeMax1rm && kpi.current1rm ? (
                <span>{fmt(kpi.allTimeMax1rm - kpi.current1rm)} kg de PR</span>
              ) : null}
            </div>
          ) : (
            <span>Última sesión</span>
          )}
        </div>
        <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full bg-[var(--accent)]/10 blur-xl" />
      </div>

      {/* Récord 1RM Histórico */}
      <div className="card relative flex flex-col justify-between overflow-hidden p-3 sm:p-4">
        <div>
          <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
            Récord (PR)
          </p>

          <div className="mt-1 flex items-baseline gap-1">
            <span className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl tracking-tight text-[var(--accent)] tabular-nums">
              {kpi.allTimeMax1rm ? fmt(kpi.allTimeMax1rm) : "—"}
            </span>
            {kpi.allTimeMax1rm ? (
              <span className="text-xs font-normal text-[var(--muted)]">kg</span>
            ) : null}
          </div>
        </div>

        <div className="mt-2 text-[10px] sm:text-[11px] leading-tight text-[var(--muted)]">
          {kpi.allTimeMax1rmDate ? (
            <div className="flex items-center justify-between gap-1 text-[10px]">
              <span>{formatShortDate(kpi.allTimeMax1rmDate)}</span>
              {kpi.allTimeMaxSet ? (
                <span>{kpi.allTimeMaxSet.weightKg}k × {kpi.allTimeMaxSet.reps}</span>
              ) : null}
            </div>
          ) : (
            <span>Histórico completo</span>
          )}
        </div>
      </div>

      {/* Progresión de Fuerza % */}
      <div className="card relative flex flex-col justify-between overflow-hidden p-3 sm:p-4">
        <div>
          <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
            Progresión
          </p>

          <div className="mt-1 flex items-baseline gap-1">
            {hasProgression ? (
              <span
                className={`font-[family-name:var(--font-display)] text-2xl sm:text-3xl tracking-tight tabular-nums ${
                  isPositive ? "text-[#10b981]" : "text-[var(--danger)]"
                }`}
              >
                {isPositive ? "+" : ""}
                {fmt(kpi.progressionPct)}%
              </span>
            ) : (
              <span className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl tracking-tight text-[var(--muted)]">
                —
              </span>
            )}
          </div>
        </div>

        <div className="mt-2 text-[10px] sm:text-[11px] leading-tight text-[var(--muted)]">
          {kpi.firstWindowAvg1rm && kpi.lastWindowAvg1rm ? (
            <div className="flex items-center justify-between gap-1 text-[10px]">
              <span>Periodo</span>
              <span>{fmt(kpi.firstWindowAvg1rm)} → {fmt(kpi.lastWindowAvg1rm)} kg</span>
            </div>
          ) : (
            <span>Requiere ≥ 2 sesiones</span>
          )}
        </div>
      </div>

      {/* Tonelaje Acumulado */}
      <div className="card relative flex flex-col justify-between overflow-hidden p-3 sm:p-4">
        <div>
          <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
            Tonelaje
          </p>

          <div className="mt-1 flex items-baseline gap-1">
            <span className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl tracking-tight text-[var(--ink)] tabular-nums">
              {kpi.totalTonnageTon >= 1
                ? `${fmt(kpi.totalTonnageTon)}t`
                : `${kpi.totalTonnageKg}kg`}
            </span>
          </div>
        </div>

        <div className="mt-2 text-[10px] sm:text-[11px] leading-tight text-[var(--muted)]">
          <div className="flex items-center justify-between gap-1 text-[10px]">
            <span>{kpi.totalSets} series</span>
            {kpi.weeklyAvgTonnageTon > 0 ? (
              <span>~{fmt(kpi.weeklyAvgTonnageTon)}t / sem</span>
            ) : (
              <span>{kpi.totalSessions} ses.</span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
