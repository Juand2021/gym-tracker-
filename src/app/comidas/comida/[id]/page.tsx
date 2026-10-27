"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import type { Meal } from "@/lib/nutrition/store";
import { NvBubble } from "@/components/nutriverse/NvBubble";
import { NvIcon } from "@/components/nutriverse/NvIcon";
import { NvError, NvSheet, NvSkeleton } from "@/components/nutriverse/NvUi";
import { fmt } from "@/components/nutriverse/glass/motion";
import { dateLabel, invalidateNv, MOMENT_LABEL, nvSend, openChatWith, useNv } from "@/components/nutriverse/data";
import { todayInBogota } from "@/lib/nutrition/profile";

const BASIS: Record<string, string> = {
  said: "lo dijiste tú",
  template: "porción del plato",
  core: "porción típica",
  core_default: "porción típica",
  usda: "porción de referencia",
  generic: "porción típica",
  llm: "estimado",
  fallback: "estimado",
  recipe: "de la receta",
};

export default function MealDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data, error, reload } = useNv<{ meal: Meal }>(`/api/comidas/meals/${id}`);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState<"dup" | "del" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (!data) return error ? <NvError text={error} onRetry={reload} /> : <NvSkeleton h={420} />;
  const meal = data.meal;
  const t = meal.totals;

  async function duplicate() {
    setBusy("dup");
    try {
      await nvSend(`/api/comidas/meals/${id}/duplicate`, "POST");
      invalidateNv("/api/comidas/");
      setNotice("Copiada a hoy");
      window.setTimeout(() => router.push("/comidas"), 700);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "No se pudo duplicar");
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    setBusy("del");
    try {
      await nvSend(`/api/comidas/meals/${id}`, "DELETE");
      invalidateNv("/api/comidas/");
      router.push("/comidas");
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "No se pudo borrar");
      setBusy(null);
    }
  }

  return (
    <div className="nv-stack">
      <Link href="/comidas" className="nv-back nv-press">
        <NvIcon name="chevronL" size={16} /> Inicio
      </Link>

      <section className="nv-card nv-glass is-thick nv-meal-hero nv-rise">
        <NvBubble kind={meal.moment} size={96} className="nv-float" />
        <p className="nv-kicker">
          {MOMENT_LABEL[meal.moment]} · {dateLabel(meal.date, todayInBogota())} · {meal.time}
        </p>
        <p className="nv-meal-quote">“{meal.text}”</p>
        <div className="nv-meal-totals">
          <span>
            <b className="nv-num">{fmt(t.kcal)}</b> kcal
          </span>
          <span>
            <b className="nv-num">{Math.round(t.protein_g)}</b> g prot.
          </span>
          <span>
            <b className="nv-num">{Math.round(t.carb_g)}</b> g carbos
          </span>
          <span>
            <b className="nv-num">{Math.round(t.fat_g)}</b> g grasa
          </span>
        </div>
        {t.alcohol_g > 0 ? <p className="nv-chip is-party">Alcohol: {Math.round(t.alcohol_g)} g</p> : null}
      </section>

      <section className="nv-card nv-glass is-read nv-rise" style={{ ["--i" as string]: 1 }}>
        <h2 className="nv-h2">Alimentos</h2>
        <ul className="nv-meal-items">
          {meal.items.map((it, i) => (
            <li key={i}>
              <div className="min-w-0 flex-1">
                <p className="nv-meal-item-name">
                  {it.name}
                  {it.addedOil ? <span className="nv-tag">aceite de cocción</span> : null}
                </p>
                <p className="nv-meal-item-src">
                  {fmt(it.grams)} g · {BASIS[it.gramsBasis] ?? it.gramsBasis}
                  {it.assumption ? ` · ${it.assumption}` : ""}
                </p>
              </div>
              <div className="nv-meal-item-num">
                <b className="nv-num">{fmt(it.nutrients.kcal)}</b>
                <span>{Math.round(it.nutrients.protein_g)} g prot.</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="nv-actions nv-rise" style={{ ["--i" as string]: 2 }}>
        <button
          type="button"
          className="nv-btn nv-glass is-thin nv-press"
          onClick={() => {
            openChatWith(`Corrige mi ${MOMENT_LABEL[meal.moment].toLowerCase()} de las ${meal.time} ("${meal.text}"): `);
            router.push("/comidas/chat");
          }}
        >
          <NvIcon name="edit" size={18} /> Corregir
        </button>
        <button type="button" className="nv-btn nv-glass is-thin nv-press" onClick={duplicate} disabled={!!busy}>
          <NvIcon name="copy" size={18} /> {busy === "dup" ? "Copiando…" : "Duplicar hoy"}
        </button>
        <button type="button" className="nv-btn nv-glass is-thin nv-press is-danger" onClick={() => setConfirm(true)} disabled={!!busy}>
          <NvIcon name="trash" size={18} /> Borrar
        </button>
      </div>
      {notice ? (
        <p className="nv-toast nv-glass is-thick" role="status">
          {notice}
        </p>
      ) : null}

      <NvSheet
        open={confirm}
        onClose={() => setConfirm(false)}
        title="¿Borrar esta comida?"
        footer={
          <div className="nv-row">
            <button type="button" className="nv-btn nv-glass is-thin nv-press" onClick={() => setConfirm(false)}>
              No, déjala
            </button>
            <button type="button" className="nv-btn nv-glass is-danger-solid nv-press" onClick={remove} disabled={busy === "del"}>
              {busy === "del" ? "Borrando…" : "Sí, bórrala"}
            </button>
          </div>
        }
      >
        <p className="nv-sub">
          Se quitan {fmt(t.kcal)} kcal de tu {dateLabel(meal.date, todayInBogota()).toLowerCase()}. No se puede deshacer.
        </p>
      </NvSheet>
    </div>
  );
}
