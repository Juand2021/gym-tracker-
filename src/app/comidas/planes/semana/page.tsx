"use client";

import Link from "next/link";
import { useState } from "react";
import type { WeekView } from "@/lib/nutrition/kitchen/server";
import { SLOT_LABEL } from "@/lib/nutrition/kitchen/state";
import { shiftDate } from "@/lib/nutrition/views";
import { NvIcon } from "@/components/nutriverse/NvIcon";
import { PantryChip } from "@/components/nutriverse/NvKitchen";
import { NvError, NvPageHead, NvSheet, NvSkeleton } from "@/components/nutriverse/NvUi";
import { fmt } from "@/components/nutriverse/glass/motion";
import { dateLabel, invalidateNv, nvSend, useNv, type RecipeCard } from "@/components/nutriverse/data";

const shortDate = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("es-CO", { day: "numeric", month: "short", timeZone: "UTC" });
const weekday = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("es-CO", { weekday: "long", timeZone: "UTC" });

type Change = { date: string; index: number; slotLabel: string };
type Option = { card: RecipeCard; kcal: number; protein_g: number };

export default function WeekPage() {
  const [start, setStart] = useState<string | null>(null);
  const url = start ? `/api/comidas/week?start=${start}` : "/api/comidas/week";
  const { data, error, reload, setData } = useNv<WeekView>(url);
  const [busy, setBusy] = useState(false);
  const [fail, setFail] = useState<string | null>(null);
  const [change, setChange] = useState<Change | null>(null);
  const [options, setOptions] = useState<Option[] | null>(null);

  async function generate() {
    if (!data) return;
    setBusy(true);
    setFail(null);
    try {
      setData(await nvSend<WeekView>("/api/comidas/week", "POST", { start: data.weekStart }));
    } catch (e) {
      setFail(e instanceof Error ? e.message : "No pude armar la semana");
    } finally {
      setBusy(false);
    }
  }

  async function openChange(c: Change) {
    if (!data) return;
    setChange(c);
    setOptions(null);
    try {
      const res = await fetch(`/api/comidas/week/options?start=${data.weekStart}&date=${c.date}&index=${c.index}`);
      const body = (await res.json()) as { options?: Option[]; error?: string };
      if (!res.ok) throw new Error(body.error ?? "No pude cargar opciones");
      setOptions(body.options ?? []);
    } catch (e) {
      setFail(e instanceof Error ? e.message : "No pude cargar opciones");
      setChange(null);
    }
  }

  async function pick(recipeId: string) {
    if (!data || !change) return;
    setBusy(true);
    try {
      setData(await nvSend<WeekView>("/api/comidas/week", "PUT", { start: data.weekStart, date: change.date, index: change.index, recipeId }));
      setChange(null);
    } catch (e) {
      setFail(e instanceof Error ? e.message : "No pude cambiarla");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(key: string, checked: boolean) {
    setData((d) =>
      d?.shopping
        ? {
            ...d,
            shopping: {
              ...d.shopping,
              toBuy: d.shopping.toBuy + (checked ? -1 : 1),
              groups: d.shopping.groups.map((g) => ({ ...g, items: g.items.map((i) => (i.key === key ? { ...i, checked } : i)) })),
            },
          }
        : d,
    );
    await nvSend("/api/comidas/shopping", "PUT", { key, checked }).catch(() => setFail("No se guardó la marca"));
  }

  async function toPantry() {
    setBusy(true);
    try {
      await nvSend("/api/comidas/shopping", "POST");
      invalidateNv("/api/comidas/");
      await reload();
    } catch (e) {
      setFail(e instanceof Error ? e.message : "No pude pasarlo a la despensa");
    } finally {
      setBusy(false);
    }
  }

  const checkedCount = data?.shopping?.groups.reduce((n, g) => n + g.items.filter((i) => i.checked).length, 0) ?? 0;

  return (
    <>
      <NvPageHead kicker="Plan y mercado" title="Semana" />

      {!data ? (
        error ? (
          <NvError text={error} onRetry={reload} />
        ) : (
          <NvSkeleton h={420} />
        )
      ) : (
        <>
          <div className="nv-rangenav nv-glass is-thin nv-rise" style={{ ["--i" as string]: 1 }}>
            <button type="button" className="nv-press" onClick={() => setStart(shiftDate(data.weekStart, -7))} aria-label="Semana anterior">
              <NvIcon name="chevronL" size={16} />
            </button>
            <span>
              {shortDate(data.weekStart)} – {shortDate(shiftDate(data.weekStart, 6))}
            </span>
            <button type="button" className="nv-press" onClick={() => setStart(shiftDate(data.weekStart, 7))} aria-label="Semana siguiente">
              <NvIcon name="chevronR" size={16} />
            </button>
          </div>

          {!data.plan ? (
            <section className="nv-card nv-glass is-thick nv-setup nv-rise" style={{ ["--i" as string]: 2 }}>
              <NvIcon name="calendar" size={44} />
              <h2 className="nv-h2">Arma tu semana en un toque</h2>
              <p className="nv-sub">Elijo recetas para cada comida, ajustadas a tus {data.daily.kcal ? `${fmt(data.daily.kcal)} kcal` : "calorías"}, con meal prep para cocinar menos, y te armo la lista de compras.</p>
              <button type="button" className="nv-btn nv-glass is-green nv-press is-big" onClick={generate} disabled={busy}>
                {busy ? "Armando…" : "Armar mi semana"}
              </button>
            </section>
          ) : (
            <>
              {data.plan.days.map((d, di) =>
                d.slots.length ? (
                  <section key={d.date} className={`nv-card nv-glass is-read nv-week-day nv-rise ${d.date === data.today ? "is-today" : ""} ${d.date < data.today ? "is-past" : ""}`} style={{ ["--i" as string]: Math.min(di + 2, 8) }}>
                    <div className="nv-week-head">
                      <span>
                        <span className="nv-h2">{d.date === data.today ? "Hoy" : dateLabel(d.date, data.today) === "Mañana" ? "Mañana" : weekday(d.date)}</span>
                        <span className="nv-sub"> · {shortDate(d.date)}</span>
                      </span>
                      <span className="nv-sub">
                        <b className="nv-num">{fmt(d.kcal)}</b> kcal · {d.protein_g} g
                      </span>
                    </div>
                    <ul className="nv-week-slots">
                      {d.slots.map((s, si) => (
                        <li key={si}>
                          <span className="nv-week-slot">{SLOT_LABEL[s.slot]}</span>
                          {s.recipeId ? (
                            <Link href={`/comidas/planes/recetas/${s.recipeId}`} className="nv-week-recipe nv-press">
                              <span className="nv-week-name">{s.name}</span>
                              <span className="nv-week-meta">
                                {fmt(s.kcal)} kcal · {s.protein_g} g{s.leftoverOf ? ` · sobras del ${weekday(s.leftoverOf)}` : s.servings > 1 ? ` · cocina ${s.servings} porciones` : ""}
                              </span>
                            </Link>
                          ) : (
                            <span className="nv-week-recipe nv-sub">Sin receta</span>
                          )}
                          {d.date >= data.today ? (
                            <button type="button" className="nv-icon-btn nv-press" onClick={() => openChange({ date: d.date, index: si, slotLabel: SLOT_LABEL[s.slot] })} aria-label={`Cambiar ${SLOT_LABEL[s.slot]}`}>
                              <NvIcon name="edit" size={20} />
                            </button>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null,
              )}

              <button type="button" className="nv-btn nv-glass is-thin nv-press nv-rise" onClick={generate} disabled={busy}>
                <NvIcon name="sparkle" size={18} /> {busy ? "Armando…" : "Volver a armar desde hoy"}
              </button>

              {data.shopping ? (
                <section className="nv-card nv-glass is-read nv-rise" style={{ ["--i" as string]: 8 }}>
                  <div className="nv-section-head">
                    <h2 className="nv-h2">Lista de compras</h2>
                    <span className="nv-sub">{data.shopping.toBuy ? `${data.shopping.toBuy} por comprar` : "¡Todo listo!"}</span>
                  </div>
                  <p className="nv-sub">Lo que ya tienes en la despensa aparece aparte: solo revisa que te alcance.</p>
                  {data.shopping.groups.map((g) => (
                    <div key={g.group} className="nv-shop-group">
                      <p className="nv-kicker">{g.label}</p>
                      <ul className="nv-shop">
                        {g.items.map((it) => (
                          <li key={it.key}>
                            <button type="button" className={`nv-shop-item nv-press ${it.checked ? "is-done" : ""} ${it.inPantry ? "is-have" : ""}`} aria-pressed={it.checked} onClick={() => toggle(it.key, !it.checked)}>
                              <span className={`nv-ing-check ${it.checked ? "is-have" : ""}`}>{it.checked ? <NvIcon name="check" size={12} tone="white" /> : null}</span>
                              <span className="nv-ing-name">
                                {it.name}
                                {it.inPantry ? <span className="nv-tag is-green">ya tienes</span> : null}
                                <span className="nv-shop-for">{it.usedIn.join(" · ")}</span>
                              </span>
                              <span className="nv-ing-amount">{it.amount}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  {checkedCount ? (
                    <button type="button" className="nv-btn nv-glass is-green nv-press nv-block nv-mt" onClick={toPantry} disabled={busy}>
                      <NvIcon name="check" size={18} tone="white" /> Ya compré: pasar {checkedCount} a la despensa
                    </button>
                  ) : null}
                </section>
              ) : null}
            </>
          )}
          {fail ? <p className="nv-chat-error">{fail}</p> : null}
        </>
      )}

      <NvSheet open={change !== null} onClose={() => setChange(null)} title={change ? `Cambiar ${change.slotLabel.toLowerCase()}` : "Cambiar"}>
        {!options ? (
          <NvSkeleton h={200} />
        ) : (
          <div className="nv-recipes">
            {options.map((o) => (
              <button key={o.card.id} type="button" className="nv-recipe nv-glass is-thin nv-press" onClick={() => pick(o.card.id)} disabled={busy}>
                <span className="nv-recipe-main">
                  <span className="nv-recipe-name">
                    {o.card.name}
                    {o.card.state.favorite ? <NvIcon name="heart" size={14} tone="green" /> : null}
                  </span>
                  <span className="nv-recipe-meta">
                    <b className="nv-num">{fmt(o.kcal)}</b> kcal · <b className="nv-num">{o.protein_g}</b> g prot. · {o.card.minutes} min
                  </span>
                  <span className="nv-recipe-chips">
                    <PantryChip card={o.card} />
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </NvSheet>
    </>
  );
}
