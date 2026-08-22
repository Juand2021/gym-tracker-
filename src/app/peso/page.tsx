"use client";

import { FormEvent, useEffect, useState } from "react";
import { isValidWeight, parseDecimal } from "@/lib/numbers";
import type { BodyWeightEntry } from "@/lib/types";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
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

  return (
    <div className="space-y-5">
      <div>
        <p className="page-kicker">Cuerpo</p>
        <h1 className="page-title mt-1">Peso</h1>
        <p className="mt-2 text-[var(--muted)]">
          Registra tu peso para ver la tendencia junto a la fuerza.
        </p>
      </div>

      <form onSubmit={onSubmit} className="card space-y-3 p-4">
        <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
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
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              required
            />
          </div>
        </div>
        <button className="btn btn-primary w-full" type="submit" disabled={saving}>
          {saving ? "Guardando…" : "Guardar peso"}
        </button>
      </form>

      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      {loading ? <p className="text-[var(--muted)]">Cargando…</p> : null}

      <div className="space-y-2">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="card flex items-center justify-between gap-3 p-4"
          >
            <div>
              <p className="font-[family-name:var(--font-display)] text-2xl tracking-[0.03em]">
                {entry.weightKg} kg
              </p>
              <p className="text-sm text-[var(--muted)]">{entry.date}</p>
            </div>
            <button
              type="button"
              className="text-sm text-[var(--danger)]"
              onClick={() => onDelete(entry.id)}
            >
              Borrar
            </button>
          </div>
        ))}
        {!loading && entries.length === 0 ? (
          <p className="text-[var(--muted)]">Sin registros todavía.</p>
        ) : null}
      </div>
    </div>
  );
}
