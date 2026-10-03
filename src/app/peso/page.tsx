"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { PageHero } from "@/components/ui/PageHero";
import { Sparkline } from "@/components/ui/Sparkline";
import { dateParts, weightStats } from "@/lib/history-summary";
import { isValidWeight, parseDecimal } from "@/lib/numbers";
import type { BodyWeightEntry } from "@/lib/types";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

/** Pasos del ajuste rápido (kg). */
const NUDGES = [-0.5, -0.1, 0.1, 0.5];

function DeltaChip({ delta }: { delta: number | null }) {
  if (delta == null) return <span className="hm-delta">Primer registro</span>;
  return (
    <span className={`hm-delta ${delta > 0 ? "is-up" : delta < 0 ? "is-down" : ""}`}>
      {delta > 0 ? "▲" : delta < 0 ? "▼" : "="} {Math.abs(delta)} kg
    </span>
  );
}

export default function PesoPage() {
  const [entries, setEntries] = useState<BodyWeightEntry[]>([]);
  const [date, setDate] = useState(todayIso);
  const [weightKg, setWeightKg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch("/api/body-weight");
        const data = (await res.json()) as {
          entries?: BodyWeightEntry[];
          error?: string;
        };
        if (!active) return;
        if (!res.ok) throw new Error(data.error || "Error");
        setEntries(data.entries ?? []);
        setError("");
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Error");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [version]);

  const stats = useMemo(() => weightStats(entries), [entries]);
  const latest = stats.rows[0] ?? null;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const parsed = parseDecimal(weightKg);
      if (!isValidWeight(parsed) || parsed <= 0) {
        throw new Error("Peso inválido. Usa decimales con punto o coma (ej. 72,5).");
      }
      const res = await fetch("/api/body-weight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, weightKg: parsed }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "No se pudo guardar");
      setWeightKg("");
      setVersion((v) => v + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("¿Borrar este registro?")) return;
    try {
      const res = await fetch(`/api/body-weight?id=${id}`, { method: "DELETE" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "No se pudo borrar");
      setVersion((v) => v + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  /** Suma al valor escrito o, si está vacío, parte del último registro. */
  function nudge(step: number) {
    const current = parseDecimal(weightKg);
    const base = isValidWeight(current) && current > 0 ? current : (latest?.weightKg ?? 0);
    if (base <= 0) return;
    setWeightKg(String(Math.round((base + step) * 10) / 10));
  }

  return (
    <div className="pg">
      <PageHero
        kicker="Cuerpo"
        title="Peso"
        description="Registra tu peso para ver la tendencia junto a la fuerza."
      >
        {latest ? (
          <>
            <div className="pw-current">
              <div>
                <p className="pw-value">
                  {latest.weightKg}
                  <small> kg</small>
                </p>
                <p className="hm-weight-meta">
                  <DeltaChip delta={latest.delta} />
                  <span>
                    {dateParts(latest.date)?.day} {dateParts(latest.date)?.monthAbbr}
                  </span>
                </p>
              </div>
              <Sparkline values={stats.series.slice(-12)} width={160} height={56} className="pw-chart" />
            </div>
            <div className="pg-hero-stats" style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
              {[
                { label: "Mínimo", value: stats.min },
                { label: "Máximo", value: stats.max },
                { label: "Promedio", value: stats.avg },
                {
                  label: "Cambio",
                  value:
                    stats.totalChange == null
                      ? "–"
                      : `${stats.totalChange > 0 ? "+" : ""}${stats.totalChange}`,
                },
              ].map((s) => (
                <div key={s.label} className="pg-stat">
                  <span className="pg-stat-value">{s.value}</span>
                  <span className="pg-stat-label">{s.label}</span>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </PageHero>

      <form onSubmit={onSubmit} className="glass-panel pw-form">
        <div className="hm-card-head">
          <span>Nuevo registro</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="field-wrap">
            <label className="label" htmlFor="date">
              Fecha
            </label>
            <input
              id="date"
              type="date"
              className="field"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="field-wrap">
            <label className="label" htmlFor="weight">
              Peso (kg)
            </label>
            <input
              id="weight"
              className="field text-center text-xl font-semibold tabular-nums"
              inputMode="decimal"
              placeholder={latest ? String(latest.weightKg) : "72,5"}
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              required
            />
          </div>
        </div>

        {latest ? (
          <div className="pw-nudges" aria-label="Ajuste rápido desde tu último peso">
            {NUDGES.map((step) => (
              <button key={step} type="button" className="rt-chip" onClick={() => nudge(step)}>
                {step > 0 ? "+" : "−"}
                {Math.abs(step)}
              </button>
            ))}
          </div>
        ) : null}

        <button className="btn btn-primary w-full" type="submit" disabled={saving}>
          {saving ? "Guardando…" : "Guardar peso"}
        </button>
      </form>

      {error ? <div className="glass-panel hm-note is-error">{error}</div> : null}
      {loading ? <div className="glass-panel hm-note">Cargando…</div> : null}

      {stats.rows.length > 0 ? (
        <div className="hm-section-head">
          <h2>Registros</h2>
          <span>{stats.rows.length} en total</span>
        </div>
      ) : null}

      {stats.rows.map((entry, i) => {
        const parts = dateParts(entry.date);
        return (
          <div
            key={entry.id}
            className="glass-panel pw-row"
            style={{ animationDelay: `${Math.min(i, 6) * 45}ms` }}
          >
            <span className="hs-date">
              <span className="hs-date-weekday">{parts?.weekday ?? ""}</span>
              <span className="hs-date-day">{parts?.day ?? "–"}</span>
              <span className="hs-date-month">{parts?.monthAbbr ?? ""}</span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="pw-row-value">
                {entry.weightKg}
                <small> kg</small>
              </p>
              <DeltaChip delta={entry.delta} />
            </div>
            <button
              type="button"
              className="ia-thread-delete"
              onClick={() => onDelete(entry.id)}
              aria-label={`Borrar el registro del ${parts?.day ?? ""} ${parts?.monthAbbr ?? ""}`}
              title="Borrar registro"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />
              </svg>
            </button>
          </div>
        );
      })}

      {!loading && entries.length === 0 ? (
        <div className="glass-panel hm-note">Sin registros todavía. Guarda tu primer peso arriba.</div>
      ) : null}
    </div>
  );
}
