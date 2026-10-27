"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cardFromTool, type ChatCard } from "@/lib/nutrition/cards";
import { SLOT_LABEL } from "@/lib/nutrition/kitchen/state";
import { NvCompareCard } from "@/components/nutriverse/NvCards";
import { NvBubble } from "@/components/nutriverse/NvBubble";
import { NvIcon } from "@/components/nutriverse/NvIcon";
import { HungrySheet, LogRecipeSheet, PantryChip, bubbleForKind, type LogPayload } from "@/components/nutriverse/NvKitchen";
import { NvError, NvPageHead, NvSkeleton } from "@/components/nutriverse/NvUi";
import { fmt } from "@/components/nutriverse/glass/motion";
import { nvSend, openChatWith, useNv, type FoodPlan, type PlanData, type PlannedRecipe } from "@/components/nutriverse/data";

type Slot = Extract<PlanData, { ok: true }>["slots"][number];

export default function PlanesToday() {
  const { data, error, reload } = useNv<PlanData>("/api/comidas/plan");
  const [hungry, setHungry] = useState(false);
  const [log, setLog] = useState<LogPayload | null>(null);

  return (
    <>
      <NvPageHead
        kicker="Qué y cuánto comer"
        title="Hoy"
        action={
          <button type="button" className="nv-btn nv-glass is-green nv-press is-small" onClick={() => setHungry(true)}>
            <NvIcon name="flame" size={16} tone="white" /> Tengo hambre
          </button>
        }
      />

      {!data ? (
        error ? (
          <NvError text={error} onRetry={reload} />
        ) : (
          <NvSkeleton h={360} />
        )
      ) : !data.ok ? (
        <section className="nv-card nv-glass is-thick nv-setup nv-rise">
          <NvIcon name="plan" size={44} />
          <h2 className="nv-h2">Primero tu perfil</h2>
          <p className="nv-sub">Para armar tu plan me faltan: {data.missing.join(", ")}.</p>
          <Link href="/comidas/perfil" className="nv-btn nv-glass is-green nv-press">
            Completar perfil
          </Link>
        </section>
      ) : (
        <>
          <section className="nv-card nv-glass is-thick nv-plan-hero nv-rise" style={{ ["--i" as string]: 1 }}>
            <p className="nv-kicker">Lo que queda de tu día</p>
            {data.left.kcal > 120 ? (
              <p className="nv-plan-hero-text">
                Te quedan <b className="nv-num">{fmt(data.left.kcal)}</b> kcal y <b className="nv-num">{fmt(data.left.protein_g)}</b> g de proteína
              </p>
            ) : (
              <p className="nv-plan-hero-text">Ya cubriste tus calorías de hoy. Si te da hambre, algo con mucha proteína y pocas kcal.</p>
            )}
            <p className="nv-sub">Las recetas se ajustan solas: más proteína o menos arroz según lo que te falte.</p>
          </section>

          {data.slots.map((s, i) => (
            <SlotCard key={`${s.slot}-${i}`} slot={s} i={i + 2} onLog={setLog} />
          ))}

          {data.extra.kcal >= 150 ? (
            <section className="nv-card nv-glass is-thin nv-soon nv-rise">
              <NvIcon name="sparkle" size={28} />
              <p className="nv-sub">
                Después de esto te quedan ~{fmt(data.extra.kcal)} kcal
                {data.extra.protein_g >= 10 ? ` y ${fmt(data.extra.protein_g)} g de proteína` : ""}.{" "}
                {data.phase?.type === "deficit" ? "En déficit no tienes que comértelas todas" : "Puedes sumar algo más"}
                {data.extra.protein_g >= 15 ? ", pero procura llegar a la proteína. " : ". "}
                <button type="button" className="nv-link nv-press" onClick={() => setHungry(true)}>
                  Ver snacks
                </button>
              </p>
            </section>
          ) : null}

          {data.fallback ? <FoodOptions plan={data.fallback} /> : null}

          {data.slots.length && data.slots.every((s) => !s.pick) ? (
            <section className="nv-card nv-glass is-thin nv-soon nv-rise">
              <NvIcon name="bowl" size={28} />
              <p className="nv-sub">
                No encontré recetas que vayan con tu dieta y tu equipo. <Link href="/comidas/planes/despensa">Revisa tu despensa</Link>.
              </p>
            </section>
          ) : null}
        </>
      )}

      <WhatToOrder />

      <HungrySheet open={hungry} onClose={() => setHungry(false)} onPick={(p) => setLog(p)} />
      <LogRecipeSheet open={log !== null} onClose={() => setLog(null)} payload={log} />
    </>
  );
}

const toPayload = (p: PlannedRecipe): LogPayload => ({
  recipeId: p.card.id,
  name: p.card.name,
  kind: p.card.kind,
  kcal: p.kcal,
  protein_g: p.protein_g,
  gramsPerServing: p.gramsPerServing,
  swaps: p.swaps,
});

/** Una comida del plan: la receta elegida y "Cambiar" para ver las otras. */
function SlotCard({ slot, i, onLog }: { slot: Slot; i: number; onLog: (p: LogPayload) => void }) {
  const options = slot.pick ? [slot.pick, ...slot.alternatives] : [];
  const [k, setK] = useState(0);
  const cur = options[k % Math.max(1, options.length)];

  return (
    <section className="nv-card nv-glass is-read nv-rise" style={{ ["--i" as string]: Math.min(i, 8) }}>
      <div className="nv-section-head">
        <h2 className="nv-h2">{SLOT_LABEL[slot.slot]}</h2>
        <span className="nv-sub">
          meta ~{fmt(slot.kcal)} kcal · {slot.protein_g} g prot.
        </span>
      </div>
      {!cur ? (
        <p className="nv-sub">No hay recetas para esta comida con tu despensa y tu equipo.</p>
      ) : (
        <div className="nv-plan-recipe">
          <Link href={`/comidas/planes/recetas/${cur.card.id}`} className="nv-plan-recipe-top nv-press">
            <NvBubble kind={bubbleForKind(cur.card.kind)} size={54} />
            <span className="nv-recipe-main">
              <span className="nv-recipe-name">{cur.card.name}</span>
              <span className="nv-recipe-meta">
                <b className="nv-num">{fmt(cur.kcal)}</b> kcal · <b className="nv-num">{cur.protein_g}</b> g prot. · {cur.card.minutes} min
              </span>
              <span className="nv-recipe-chips">
                <PantryChip card={cur.card} />
                {cur.card.state.favorite ? <span className="nv-chip is-ok">Favorita</span> : null}
              </span>
            </span>
            <NvIcon name="chevronR" size={16} />
          </Link>
          <ul className="nv-option-foods">
            {cur.lines.map((l) => (
              <li key={l.name}>
                <span>{l.name}</span>
                <span className="nv-num">{l.amount}</span>
              </li>
            ))}
          </ul>
          <div className="nv-row">
            {options.length > 1 ? (
              <button type="button" className="nv-btn nv-glass is-thin nv-press is-small" onClick={() => setK((x) => x + 1)}>
                <NvIcon name="history" size={16} /> Cambiar ({(k % options.length) + 1}/{options.length})
              </button>
            ) : null}
            <button type="button" className="nv-btn nv-glass is-green nv-press is-small" onClick={() => onLog(toPayload(cur))}>
              Ya me lo comí
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

/** Respaldo: opciones de alimentos sueltos (el plan de antes). */
function FoodOptions({ plan }: { plan: FoodPlan }) {
  const router = useRouter();
  return (
    <>
      {plan.comidas.map((c, ci) => (
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
      <p className="nv-sub">¿Comes fuera? Escribe las opciones del menú y te digo cuál te conviene hoy.</p>
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
