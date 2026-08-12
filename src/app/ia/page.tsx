"use client";

import { FormEvent, useState } from "react";
import { AiAnalysis } from "@/components/AiAnalysis";

const SUGGESTIONS = [
  "¿Cómo va mi progreso de fuerza?",
  "¿Estoy estancado en algún ejercicio?",
  "¿Debería cambiar algún ejercicio de mi rutina?",
  "¿Cómo puedo mejorar mi progresión de cargas?",
];

export default function IaPage() {
  const [question, setQuestion] = useState(SUGGESTIONS[0]);
  const [analysis, setAnalysis] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setAnalysis("");
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = (await res.json()) as { analysis?: string; error?: string };
      if (!res.ok) throw new Error(data.error || "Error al analizar");
      setAnalysis(data.analysis ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="page-kicker">Coach</p>
        <h1 className="page-title mt-1">Análisis IA</h1>
        <p className="mt-2 text-[var(--muted)]">
          Lee tu historial y te da recomendaciones concretas.
        </p>
      </div>

      <form onSubmit={onSubmit} className="card space-y-3 p-4">
        <div>
          <label className="label" htmlFor="question">
            Tu pregunta
          </label>
          <textarea
            id="question"
            className="field min-h-28"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((item) => (
            <button
              key={item}
              type="button"
              className="rounded-md border border-[var(--line-strong)] bg-[#0a0a0a] px-3 py-2 text-left text-xs text-[var(--muted)] active:border-[var(--accent)]"
              onClick={() => setQuestion(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <button className="btn btn-primary w-full" type="submit" disabled={loading}>
          {loading ? "Analizando…" : "Pedir recomendaciones"}
        </button>
      </form>

      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}

      {analysis ? (
        <article className="card space-y-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="label mb-0">Resultado</p>
            <span className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              Coach
            </span>
          </div>
          <AiAnalysis content={analysis} />
        </article>
      ) : null}
    </div>
  );
}
