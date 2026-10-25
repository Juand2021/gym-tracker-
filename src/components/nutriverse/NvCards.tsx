"use client";

import type { ChatCard } from "@/lib/nutrition/cards";
import { fmt } from "./glass/motion";
import { NvMiniGauge } from "./NvGauge";
import { NvBubble, bubbleFor } from "./NvBubble";
import { NvIcon } from "./NvIcon";
import { MOMENT_LABEL, PHASE_LABEL } from "./data";

type Draft = Extract<ChatCard, { type: "draft" }>;

/**
 * Tarjeta de borrador (decisión de Juan: compacta). Lista de alimentos, total, cómo quedaría el día
 * y botones Guardar / Corregir / Descartar. Al guardarse "se sella".
 */
export function NvDraftCard({ card, latest, busy, onSave, onFix, onDiscard }: { card: Draft; latest: boolean; busy: boolean; onSave: () => void; onFix: () => void; onDiscard: () => void }) {
  const left = card.dayTarget != null ? card.dayTarget - card.dayAfter : null;
  const actionable = card.status === "pending" && latest;
  return (
    <div className={`nv-card nv-draft nv-glass is-thick is-read is-${card.status}`}>
      <div className="nv-draft-head">
        <NvBubble kind={bubbleFor(card.moment)} size={44} />
        <div className="min-w-0 flex-1">
          <p className="nv-kicker">{MOMENT_LABEL[card.moment as keyof typeof MOMENT_LABEL] ?? "Comida"} · borrador</p>
          <p className="nv-draft-total">
            <span className="nv-num">{fmt(card.kcal)}</span> kcal · <span className="nv-num">{card.protein}</span> g proteína
          </p>
        </div>
        {card.status === "saved" ? (
          <span className="nv-seal" aria-label="Guardada">
            <NvIcon name="check" size={30} />
          </span>
        ) : null}
      </div>
      <ul className="nv-draft-items">
        {card.items.map((it, i) => (
          <li key={i} className={it.unmatched ? "is-unmatched" : ""}>
            <span className="nv-draft-name">
              {it.name}
              {it.note ? <span className="nv-draft-note">{it.note}</span> : null}
            </span>
            <span className="nv-draft-g">{fmt(it.grams)} g</span>
            <span className="nv-draft-k nv-num">{fmt(it.kcal)}</span>
          </li>
        ))}
      </ul>
      {card.dayTarget != null ? (
        <div className="nv-draft-day">
          <NvMiniGauge value={card.dayAfter} target={card.dayTarget} />
          <p>
            {left! >= 0 ? (
              <>
                Si la guardas te quedarían <b className="nv-num">{fmt(left!)}</b> kcal hoy
              </>
            ) : (
              <>
                Si la guardas pasarías tu límite por <b className="nv-num">{fmt(-left!)}</b> kcal
              </>
            )}
          </p>
        </div>
      ) : null}
      {actionable ? (
        <div className="nv-draft-actions">
          <button type="button" className="nv-btn nv-glass is-green nv-press" onClick={onSave} disabled={busy}>
            <NvIcon name="check" size={18} tone="white" /> Guardar
          </button>
          <button type="button" className="nv-btn nv-glass is-thin nv-press" onClick={onFix} disabled={busy}>
            <NvIcon name="edit" size={18} /> Corregir
          </button>
          <button type="button" className="nv-btn nv-glass is-thin nv-press is-quiet" onClick={onDiscard} disabled={busy}>
            Descartar
          </button>
        </div>
      ) : card.status === "discarded" ? (
        <p className="nv-draft-state">No se guardó</p>
      ) : card.status === "saved" ? (
        <p className="nv-draft-state is-saved">Guardada en tu día</p>
      ) : null}
    </div>
  );
}

type Plan = Extract<ChatCard, { type: "plan" }>;

export function NvPlanCard({ card, onPick }: { card: Plan; onPick?: (text: string) => void }) {
  return (
    <div className="nv-card nv-glass is-read nv-plan">
      <p className="nv-kicker">Plan para lo que queda del día</p>
      <p className="nv-plan-left">
        Te quedan <b className="nv-num">{fmt(card.remainingKcal)}</b> kcal y <b className="nv-num">{fmt(card.remainingProtein)}</b> g de proteína
      </p>
      {card.meals.map((m) => (
        <div key={m.n} className="nv-plan-meal">
          <p className="nv-plan-meal-head">
            Comida {m.n} · ~{fmt(m.kcal)} kcal · {m.protein} g prot.
          </p>
          <div className="nv-plan-opts">
            {m.options.map((o, i) => {
              const text = o.foods.map((f) => `${f.name} ${fmt(f.grams)} g`).join(" + ");
              return (
                <button key={i} type="button" className="nv-plan-opt nv-glass is-thin nv-press" onClick={() => onPick?.(text)} disabled={!onPick}>
                  <span className="nv-plan-opt-foods">{text}</span>
                  <span className="nv-plan-opt-meta">
                    {fmt(o.kcal)} kcal · {o.protein} g
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

type Compare = Extract<ChatCard, { type: "compare" }>;

export function NvCompareCard({ card }: { card: Compare }) {
  return (
    <div className="nv-card nv-glass is-read nv-compare">
      <p className="nv-kicker">¿Qué pido?{card.left != null ? ` · te quedan ${fmt(card.left)} kcal` : ""}</p>
      <div className="nv-compare-grid">
        {card.options.map((o, i) => (
          <div key={i} className={`nv-compare-opt nv-glass ${i === card.best ? "is-best" : "is-thin"}`}>
            {i === card.best ? (
              <span className="nv-compare-badge">
                <NvIcon name="sparkle" size={14} tone="white" /> Mejor opción
              </span>
            ) : null}
            <p className="nv-compare-text">{o.text}</p>
            <p className="nv-compare-kcal">
              <span className="nv-num">{fmt(o.kcal)}</span> kcal
            </p>
            <p className="nv-compare-meta">{o.protein} g proteína</p>
            {o.leftAfter != null ? <p className={`nv-compare-after ${o.leftAfter < 0 ? "is-over" : ""}`}>{o.leftAfter >= 0 ? `Quedarían ${fmt(o.leftAfter)}` : `Te pasas ${fmt(-o.leftAfter)}`}</p> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

type TargetsCard = Extract<ChatCard, { type: "targets" }>;

export function NvTargetsCard({ card }: { card: TargetsCard }) {
  return (
    <div className="nv-card nv-glass is-read nv-targets">
      <p className="nv-kicker">Tus objetivos diarios{card.phase ? ` · ${PHASE_LABEL[card.phase as keyof typeof PHASE_LABEL] ?? card.phase}` : ""}</p>
      <p className="nv-targets-kcal">
        <span className="nv-num">{fmt(card.kcal)}</span> kcal
      </p>
      <div className="nv-targets-grid">
        <span>
          <b className="nv-num">{card.protein}</b> g proteína
        </span>
        <span>
          <b className="nv-num">{card.carbs}</b> g carbohidratos
        </span>
        <span>
          <b className="nv-num">{card.fat}</b> g grasa
        </span>
      </div>
      {card.maintenance ? <p className="nv-sub">Tu mantenimiento: {fmt(card.maintenance)} kcal</p> : null}
    </div>
  );
}
