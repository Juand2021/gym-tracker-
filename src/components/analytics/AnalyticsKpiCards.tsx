"use client";

import type { ReactNode } from "react";
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

/** Tarjeta de indicador: rótulo, cifra grande y hasta dos líneas de detalle (una debajo de otra). */
function KpiCard({
  label,
  value,
  unit,
  tone = "ink",
  primary,
  secondary,
}: {
  label: string;
  value: string;
  unit?: string;
  tone?: "ink" | "accent" | "up" | "down" | "muted";
  primary?: ReactNode;
  secondary?: ReactNode;
}) {
  return (
    <div className="card mt-kpi">
      <p className="mt-kpi-label">{label}</p>
      <p className={`mt-kpi-value is-${tone}`}>
        {value}
        {unit ? <small>{unit}</small> : null}
      </p>
      <div className="mt-kpi-foot">
        {primary ? <span>{primary}</span> : null}
        {secondary ? <span>{secondary}</span> : null}
      </div>
    </div>
  );
}

export function AnalyticsKpiCards({ kpi }: Props) {
  const hasProgression = kpi.progressionPct != null;
  const isPositive = (kpi.progressionPct ?? 0) >= 0;
  const atRecord = Boolean(kpi.allTimeMax1rm && kpi.current1rm && kpi.current1rm >= kpi.allTimeMax1rm);

  return (
    <section className="mt-kpis">
      <KpiCard
        label="1RM actual"
        value={kpi.current1rm ? fmt(kpi.current1rm) : "—"}
        unit={kpi.current1rm ? "kg" : undefined}
        primary={kpi.current1rmDate ? formatShortDate(kpi.current1rmDate) : "Última sesión"}
        secondary={
          atRecord ? (
            <b className="text-[#ff8a55]">Es tu récord</b>
          ) : kpi.allTimeMax1rm && kpi.current1rm ? (
            `A ${fmt(kpi.allTimeMax1rm - kpi.current1rm)} kg del PR`
          ) : null
        }
      />

      <KpiCard
        label="Récord (PR)"
        tone="accent"
        value={kpi.allTimeMax1rm ? fmt(kpi.allTimeMax1rm) : "—"}
        unit={kpi.allTimeMax1rm ? "kg" : undefined}
        primary={kpi.allTimeMax1rmDate ? formatShortDate(kpi.allTimeMax1rmDate) : "Histórico completo"}
        secondary={
          kpi.allTimeMaxSet ? `${kpi.allTimeMaxSet.weightKg} kg × ${kpi.allTimeMaxSet.reps}` : null
        }
      />

      <KpiCard
        label="Progresión"
        tone={hasProgression ? (isPositive ? "up" : "down") : "muted"}
        value={hasProgression ? `${isPositive ? "+" : ""}${fmt(kpi.progressionPct)}%` : "—"}
        primary={kpi.firstWindowAvg1rm && kpi.lastWindowAvg1rm ? "En el periodo" : "Requiere ≥ 2 sesiones"}
        secondary={
          kpi.firstWindowAvg1rm && kpi.lastWindowAvg1rm
            ? `${fmt(kpi.firstWindowAvg1rm)} → ${fmt(kpi.lastWindowAvg1rm)} kg`
            : null
        }
      />

      <KpiCard
        label="Tonelaje"
        value={kpi.totalTonnageTon >= 1 ? fmt(kpi.totalTonnageTon) : String(kpi.totalTonnageKg)}
        unit={kpi.totalTonnageTon >= 1 ? "t" : "kg"}
        primary={`${kpi.totalSets} series`}
        secondary={
          kpi.weeklyAvgTonnageTon > 0
            ? `~${fmt(kpi.weeklyAvgTonnageTon)} t por semana`
            : `${kpi.totalSessions} sesiones`
        }
      />
    </section>
  );
}
