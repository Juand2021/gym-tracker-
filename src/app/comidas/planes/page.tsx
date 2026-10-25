"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cardFromTool, type ChatCard } from "@/lib/nutrition/cards";
import { NvCompareCard } from "@/components/nutriverse/NvCards";
import { NvBubble } from "@/components/nutriverse/NvBubble";
import { NvIcon } from "@/components/nutriverse/NvIcon";
import { NvError, NvPageHead, NvSkeleton } from "@/components/nutriverse/NvUi";
import { fmt } from "@/components/nutriverse/glass/motion";
import { nvSend, openChatWith, useNv, type PlanData } from "@/components/nutriverse/data";

const MEAL_KIND = ["desayuno", "almuerzo", "cena", "snack"] as const;

export default function NutriVersePlans() {
  const router = useRouter();
  const { data, error, reload } = useNv<PlanData>("/api/comidas/plan");

  return (
    <div className="nv-stack">
      <NvPageHead kicker="Qué y cuánto comer" title="Planes" />

      {!data ? (
        error ? (
          <NvError text={error} onRetry={reload} />
        ) : (
          <NvSkeleton h={320} />
        )
      ) : !data.ok ? (
        <section className="nv-card nv-glass is-thick nv-setup nv-rise">
          <NvIcon name="plan" size={44} />
          <h2 className="nv-h2">Primero tu perfil</h2>
          <p className="nv-sub">Para armar tu plan me faltan: {data.missing.join(", ")}.</p>
        </section>
      ) : (
        <>
          <section className="nv-card nv-glass is-thick nv-plan-hero nv-rise" style={{ ["--i" as string]: 1 }}>
            <p className="nv-kicker">Plan del día</p>
            {data.plan.restante_kcal > 0 ? (
              <p className="nv-plan-hero-text">
                Te quedan <b className="nv-num">{fmt(data.plan.restante_kcal)}</b> kcal y <b className="nv-num">{fmt(data.plan.restante_proteina_g)}</b> g de proteína
              </p>
            ) : (
              <p className="nv-plan-hero-text">Ya cubriste tus calorías de hoy. Si te da hambre, prefiere algo con mucha proteína y pocas kcal.</p>
            )}
          </section>
          {data.plan.comidas.map((c, ci) => (
            <section key={c.comida} className="nv-card nv-glass is-read nv-rise" style={{ ["--i" as string]: ci + 2 }}>
              <div className="nv-section-head">
                <h2 className="nv-h2">Comida {c.comida}</h2>
                <span className="nv-sub">
                  ~{fmt(c.kcal_objetivo)} kcal · {c.proteina_objetivo_g} g prot.
                </span>
              </div>
              <div className="nv-options">
                {c.opciones.map((o, i) => {
                  const text = o.alimentos.map((a) => `${a.alimento} ${fmt(a.gramos)} g`).join(", ");
                  return (
                    <div key={i} className="nv-option nv-glass is-thin">
                      <NvBubble kind={MEAL_KIND[(ci + i) % MEAL_KIND.length]} size={46} />
                      <div className="min-w-0 flex-1">
                        <ul className="nv-option-foods">
                          {o.alimentos.map((a) => (
                            <li key={a.alimento}>
                              <span>{a.alimento}</span>
                              <span className="nv-num">{fmt(a.gramos)} g</span>
                            </li>
                          ))}
                        </ul>
                        <p className="nv-option-meta">
                          {fmt(o.kcal)} kcal · {o.proteina_g} g proteína
                        </p>
                      </div>
                      <button
                        type="button"
                        className="nv-btn nv-glass is-green nv-press is-small"
                        onClick={() => {
                          openChatWith(`Comí ${text}`);
                          router.push("/comidas/chat");
                        }}
                        aria-label={`Elegir: ${text}`}
                      >
                        Elegir
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </>
      )}

      <WhatToOrder />

      <section className="nv-card nv-glass is-thin nv-soon nv-rise">
        <NvIcon name="calendar" size={28} />
        <p className="nv-sub">Próximamente: plan de la semana y lista de compras.</p>
      </section>
    </div>
  );
}

/** "¿Qué pido?": compara de 2 a 4 opciones de un menú sin guardar nada. */
function WhatToOrder() {
  const [opts, setOpts] = useState(["", ""]);
  const [busy, setBusy] = useState(false);
  const [card, setCard] = useState<Extract<ChatCard, { type: "compare" }> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const filled = opts.map((o) => o.trim()).filter(Boolean);

  async function compare() {
    setBusy(true);
    setError(null);
    setCard(null);
    try {
      const result = await nvSend<Record<string, unknown>>("/api/comidas/compare", "POST", { options: filled });
      const c = cardFromTool("consultar_opciones", result);
      if (!c || c.type !== "compare") throw new Error(String(result.error ?? "No pude comparar esas opciones"));
      setCard(c);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pude comparar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="nv-card nv-glass is-read nv-order nv-rise">
      <div className="nv-section-head">
        <h2 className="nv-h2">¿Qué pido?</h2>
        <NvIcon name="sparkle" size={24} />
      </div>
      <p className="nv-sub">Escribe las opciones del menú y te digo cuál te conviene hoy.</p>
      <div className="nv-order-inputs">
        {opts.map((o, i) => (
          <div key={i} className="nv-field nv-glass is-thin">
            <span className="nv-field-n">{i + 1}</span>
            <input value={o} onChange={(e) => setOpts((p) => p.map((x, j) => (j === i ? e.target.value : x)))} placeholder={i === 0 ? "Ej.: hamburguesa doble con papas" : "Ej.: wrap de pollo y ensalada"} aria-label={`Opción ${i + 1}`} />
            {opts.length > 2 ? (
              <button type="button" className="nv-press" onClick={() => setOpts((p) => p.filter((_, j) => j !== i))} aria-label={`Quitar opción ${i + 1}`}>
                <NvIcon name="close" size={20} />
              </button>
            ) : null}
          </div>
        ))}
      </div>
      <div className="nv-row">
        {opts.length < 4 ? (
          <button type="button" className="nv-btn nv-glass is-thin nv-press" onClick={() => setOpts((p) => [...p, ""])}>
            <NvIcon name="plus" size={16} /> Otra opción
          </button>
        ) : null}
        <button type="button" className="nv-btn nv-glass is-green nv-press" onClick={compare} disabled={busy || filled.length < 2}>
          {busy ? "Comparando…" : "Comparar"}
        </button>
      </div>
      {busy ? (
        <div className="nv-thinking nv-glass is-thin" role="status">
          <span className="nv-thinking-orb" />
          <span className="nv-thinking-text">Calculando cada opción…</span>
        </div>
      ) : null}
      {error ? <p className="nv-chat-error">{error}</p> : null}
      {card ? <NvCompareCard card={card} /> : null}
    </section>
  );
}
