"use client";

import { useEffect, useState } from "react";

export type ComidasToday = {
  date: string;
  /** false si al perfil le faltan datos: no hay objetivos todavía. */
  profileComplete: boolean;
  missing: string[];
  kcal: number;
  kcalTarget: number | null;
  protein: number;
  proteinTarget: number | null;
  fat: number;
  fatTarget: number | null;
  carbs: number;
  carbsTarget: number | null;
  alcohol: number;
  phase: { type: string; start: string; end: string | null; ratePctPerWeek: number; objective: string } | null;
  meals: { id: string; time: string; moment: string; text: string; kcal: number; protein: number; items: { name: string; grams: number; kcal: number }[] }[];
};

export const fmt = (n: number) => n.toLocaleString("es-CO", { maximumFractionDigits: 0 });

/** Carga el resumen de hoy; se vuelve a pedir cuando cambia refreshKey. */
export function useComidasToday(refreshKey = 0) {
  const [data, setData] = useState<ComidasToday | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    fetch("/api/comidas/today")
      .then(async (r) => {
        const body = (await r.json()) as ComidasToday & { error?: string };
        if (!alive) return;
        if (!r.ok) setError(body.error ?? "No se pudo cargar el día");
        else {
          setData(body);
          setError(null);
        }
      })
      .catch(() => alive && setError("No se pudo cargar el día"));
    return () => {
      alive = false;
    };
  }, [refreshKey]);
  return { data, error };
}

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

/** Tarjeta "Hoy": kcal y proteína (y grasa/carbohidratos si `full`). */
export function TodaySummary({ data, full = false }: { data: ComidasToday; full?: boolean }) {
  if (data.kcalTarget == null || data.proteinTarget == null) return null;
  const left = data.kcalTarget - data.kcal;
  return (
    <section className="ia-glass nt-strip" aria-label="Resumen de hoy">
      <div className="nt-head">
        <p className="ia-kicker">Hoy</p>
        <p className="nt-left">
          {left >= 0 ? `Te quedan ${fmt(left)} kcal` : `Te pasaste ${fmt(-left)} kcal`}
          {data.alcohol ? ` · ${fmt(data.alcohol)} g alcohol` : ""}
        </p>
      </div>
      <Bar label="Calorías" value={data.kcal} target={data.kcalTarget} unit="kcal" />
      <Bar label="Proteína" value={data.protein} target={data.proteinTarget} unit="g" />
      {full ? (
        <>
          <Bar label="Grasa" value={data.fat} target={data.fatTarget ?? 0} unit="g" />
          <Bar label="Carbohidratos" value={data.carbs} target={data.carbsTarget ?? 0} unit="g" />
        </>
      ) : null}
    </section>
  );
}
