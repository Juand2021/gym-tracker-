"use client";

import Link from "next/link";
import { TodaySummary, fmt, useComidasToday } from "@/components/comidas/TodaySummary";

const MOMENT_LABEL: Record<string, string> = {
  desayuno: "Desayuno",
  almuerzo: "Almuerzo",
  cena: "Cena",
  snack: "Algo entre comidas",
  fiesta: "Fiesta",
};

const PHASE_LABEL: Record<string, string> = {
  deficit: "Déficit",
  mantenimiento: "Mantenimiento",
  recomposicion: "Recomposición",
  volumen: "Volumen",
};

/** Inicio de la app de Comidas: el día de hoy y las comidas guardadas. */
export default function ComidasHoyPage() {
  const { data, error } = useComidasToday();

  return (
    <div className="ia-page">
      <header className="ia-glass ia-hero">
        <span className="as-icon is-comidas" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="13.5" cy="12.5" r="6.5" />
            <path d="M13.5 9.5c-1.7 0-3 1.3-3 3M4 3v6a2 2 0 0 0 2 2M6 3v18M8 3v6a2 2 0 0 1-2 2" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <p className="ia-kicker">{data ? `${PHASE_LABEL[data.phase.type] ?? data.phase.type} · hasta ${data.phase.end ?? "sin fecha"}` : "Comida saludable"}</p>
          <h1 className="ia-title">Tu día</h1>
        </div>
        <Link href="/comidas/chat" className="ia-pill is-primary">
          + Comida
        </Link>
      </header>

      {error ? <div className="ia-error">{error}</div> : null}
      {!data && !error ? <div className="ia-glass ia-loading">Cargando…</div> : null}

      {data ? (
        <>
          <TodaySummary data={data} full />

          <p className="ia-section-label">Comidas de hoy</p>
          {data.meals.length === 0 ? (
            <Link href="/comidas/chat" className="ia-glass cm-empty">
              <p className="cm-empty-title">Todavía no has registrado nada hoy</p>
              <p className="cm-empty-text">Cuéntale al chat qué comiste, como hablas: “almorcé un corrientazo de cerdo con jugo de mora”.</p>
            </Link>
          ) : (
            <div className="cm-list">
              {data.meals.map((m) => (
                <article key={m.id} className="ia-glass cm-meal">
                  <div className="cm-meal-head">
                    <span className="cm-moment">
                      {MOMENT_LABEL[m.moment] ?? m.moment} · {m.time}
                    </span>
                    <span className="cm-kcal">
                      {fmt(m.kcal)} kcal · {fmt(m.protein)} g prot
                    </span>
                  </div>
                  <p className="cm-text">{m.text}</p>
                  <ul className="cm-items">
                    {m.items.map((it, i) => (
                      <li key={i}>
                        <span>{it.name}</span>
                        <span className="cm-item-num">
                          {fmt(it.grams)} g · {fmt(it.kcal)} kcal
                        </span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
