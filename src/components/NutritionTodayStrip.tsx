"use client";

import { useEffect, useState } from "react";

export type NutritionToday = {
  enabled: boolean;
  date?: string;
  kcal?: number;
  kcalTarget?: number;
  protein?: number;
  proteinTarget?: number;
  alcohol?: number;
  meals?: number;
  error?: string;
};

const fmt = (n: number) => n.toLocaleString("es-CO", { maximumFractionDigits: 0 });

function Bar({ label, value, target, unit }: { label: string; value: number; target: number; unit: string }) {
  const pct = target > 0 ? value / target : 0;
  const over = pct > 1.05;
  return (
    <div className="nt-metric">
      <div className="nt-metric-head">
        <span className="nt-label">{label}</span>
        <span className={`nt-value ${over ? "is-over" : ""}`}>
          {fmt(value)}
          <span className="nt-target">
            {" "}
            / {fmt(target)} {unit}
          </span>
        </span>
      </div>
      <div className="nt-track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={target} aria-valuenow={value}>
        <span className={`nt-fill ${over ? "is-over" : ""}`} style={{ width: `${Math.min(100, pct * 100)}%` }} />
      </div>
    </div>
  );
}

/** Franja "Hoy" del módulo Comidas (solo aparece si está activo para el perfil). */
export function NutritionTodayStrip({ refreshKey, onEnabled }: { refreshKey: number; onEnabled?: (on: boolean) => void }) {
  const [data, setData] = useState<NutritionToday | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/nutrition/today")
      .then((r) => r.json() as Promise<NutritionToday>)
      .then((d) => {
        if (!alive) return;
        setData(d);
        onEnabled?.(!!d.enabled);
      })
      .catch(() => alive && setData(null));
    return () => {
      alive = false;
    };
    // onEnabled es un callback del padre; solo se recarga con refreshKey.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  if (!data?.enabled || data.error || data.kcalTarget == null) return null;
  const left = (data.kcalTarget ?? 0) - (data.kcal ?? 0);

  return (
    <section className="ia-glass nt-strip" aria-label="Comidas de hoy">
      <div className="nt-head">
        <p className="ia-kicker">Hoy</p>
        <p className="nt-left">
          {left >= 0 ? `Te quedan ${fmt(left)} kcal` : `Te pasaste ${fmt(-left)} kcal`}
          {data.alcohol ? ` · ${fmt(data.alcohol)} g alcohol` : ""}
        </p>
      </div>
      <Bar label="Calorías" value={data.kcal ?? 0} target={data.kcalTarget ?? 0} unit="kcal" />
      <Bar label="Proteína" value={data.protein ?? 0} target={data.proteinTarget ?? 0} unit="g" />
    </section>
  );
}
