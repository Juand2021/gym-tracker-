"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { NvGauge } from "@/components/nutriverse/NvGauge";
import { NvTube, NvWater } from "@/components/nutriverse/NvCharts";
import { NvIcon } from "@/components/nutriverse/NvIcon";
import { NvBubble } from "@/components/nutriverse/NvBubble";
import { LogRecipeSheet, bubbleForKind } from "@/components/nutriverse/NvKitchen";
import { NvCapsule, NvError, NvSkeleton } from "@/components/nutriverse/NvUi";
import { fmt, useCountUp } from "@/components/nutriverse/glass/motion";
import { dateLabel, MOMENT_LABEL, nvSend, openChatWith, useNv, type DayData, type DayMeal } from "@/components/nutriverse/data";
import { shiftDate } from "@/lib/nutrition/views";
import type { MealMoment } from "@/lib/nutrition/store";

const WELCOMED = "nv:welcomed";
const MAIN_MOMENTS = ["desayuno", "almuerzo", "cena"] as const;
const ADD_TEXT: Record<string, string> = { desayuno: "Desayuné ", almuerzo: "Almorcé ", cena: "Cené " };

function greeting(name: string) {
  const h = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Bogota", hour: "numeric", hour12: false }).format(new Date()));
  const first = name.split(" ")[0];
  return `${h < 12 ? "Buenos días" : h < 19 ? "¡Hola" : "Buenas noches"}${first ? `, ${first}` : ""}${h >= 12 && h < 19 ? "!" : ""}`;
}

export default function NutriVerseHome() {
  const router = useRouter();
  const [date, setDate] = useState<string | null>(null);
  const url = date ? `/api/comidas/day?date=${date}` : "/api/comidas/day";
  const { data, error, reload, setData } = useNv<DayData>(url);
  const [waterBusy, setWaterBusy] = useState(false);

  // Persona nueva sin perfil: bienvenida una sola vez.
  useEffect(() => {
    if (!data || data.profileComplete) return;
    try {
      if (!localStorage.getItem(WELCOMED)) router.replace("/comidas/bienvenida");
    } catch {
      // sin almacenamiento: se queda en Inicio
    }
  }, [data, router]);

  async function water(delta: number) {
    if (!data) return;
    setWaterBusy(true);
    setData({ ...data, water: Math.max(0, data.water + delta) });
    try {
      const r = await nvSend<{ water: number }>("/api/comidas/water", "POST", { deltaMl: delta, date: data.date });
      setData((d) => (d ? { ...d, water: r.water } : d));
    } catch {
      void reload();
    } finally {
      setWaterBusy(false);
    }
  }

  if (!data) return error ? <NvError text={error} onRetry={reload} /> : <HomeSkeleton />;

  const isToday = data.date === data.today;
  // Desayuno, almuerzo y cena siempre (vacías si no hay); snacks y fiestas solo si se registraron.
  type Slot = { m: MealMoment; x: DayMeal | null };
  const capsules: Slot[] = [
    ...MAIN_MOMENTS.flatMap((m): Slot[] => {
      const list = data.meals.filter((x) => x.moment === m);
      return list.length ? list.map((x) => ({ m: x.moment, x })) : [{ m, x: null }];
    }),
    ...data.meals.filter((x) => x.moment === "snack" || x.moment === "fiesta").map((x) => ({ m: x.moment, x })),
  ];
  const go = (days: number) => {
    const next = shiftDate(data.date, days);
    setDate(next >= data.today ? null : next);
  };

  return (
    <div className="nv-stack">
      <section className="nv-hello nv-rise">
        <div className="min-w-0">
          <p className="nv-kicker">{isToday ? "Tu día" : "Historial"}</p>
          <h1 className="nv-title">{greeting(data.name)}</h1>
        </div>
        <div className="nv-daynav nv-glass is-thin">
          <button type="button" className="nv-press" onClick={() => go(-1)} aria-label="Día anterior">
            <NvIcon name="chevronL" size={16} />
          </button>
          <span className="nv-daynav-label">{dateLabel(data.date, data.today)}</span>
          <button type="button" className="nv-press" onClick={() => go(1)} disabled={isToday} aria-label="Día siguiente">
            <NvIcon name="chevronR" size={16} />
          </button>
        </div>
      </section>

      <div className="nv-rise" style={{ ["--i" as string]: 1 }}>
        <NvWater ml={data.water} target={data.waterTarget} busy={waterBusy} onAdd={() => water(250)} onRemove={() => water(-250)} />
      </div>

      {data.profileComplete && data.gauge ? (
        <section className="nv-card nv-glass is-thick nv-gauge-card nv-rise" style={{ ["--i" as string]: 2 }}>
          <NvGauge gauge={data.gauge} kcal={data.kcal} alcoholKcal={Math.round(data.alcohol * 7)} status={data.status} />
        </section>
      ) : (
        <section className="nv-card nv-glass is-thick nv-setup nv-rise" style={{ ["--i" as string]: 2 }}>
          <NvIcon name="target" size={44} />
          <h2 className="nv-h2">Configura tu perfil</h2>
          <p className="nv-sub">Para darte tu límite de calorías me faltan: {data.missing.join(", ")}.</p>
          <button
            type="button"
            className="nv-btn nv-glass is-green nv-press"
            onClick={() => {
              openChatWith("Quiero configurar mi perfil");
              router.push("/comidas/chat");
            }}
          >
            Configurar hablando
          </button>
        </section>
      )}

      {data.profileComplete && data.status ? (
        <section className="nv-macros nv-rise" style={{ ["--i" as string]: 3 }}>
          <LeftCard text={data.status.leftText} left={data.status.left} tone={data.status.tone} />
          <div className="nv-tubes nv-glass">
            <NvTube label="Proteína" value={data.protein} target={data.proteinTarget} color="green" icon="protein" />
            <NvTube label="Carbos" value={data.carbs} target={data.carbsTarget} color="amber" icon="carbs" />
            <NvTube label="Grasa" value={data.fat} target={data.fatTarget} color="sky" icon="fat" />
          </div>
        </section>
      ) : null}

      <section className="nv-section">
        <div className="nv-section-head">
          <h2 className="nv-h2">Comidas {isToday ? "de hoy" : "del día"}</h2>
          {data.meals.length ? <span className="nv-sub">{data.meals.length} registradas</span> : null}
        </div>
        <div className="nv-capsules">
          {capsules.map(({ m, x }, i) =>
            x ? (
              <NvCapsule key={x.id} i={i} href={`/comidas/comida/${x.id}`} kind={x.moment} title={`${MOMENT_LABEL[x.moment]} · ${x.time}`} sub={x.recipeId ? x.text : x.items.map((it) => it.name).join(", ") || x.text} kcal={x.kcal} />
            ) : isToday ? (
              <AddCapsule key={m} i={i} moment={m as (typeof MAIN_MOMENTS)[number]} />
            ) : null,
          )}
          {isToday ? (
            <button
              type="button"
              className="nv-capsule nv-glass nv-press nv-capsule-new nv-rise"
              style={{ ["--i" as string]: 5 }}
              onClick={() => router.push("/comidas/chat")}
            >
              <span className="nv-capsule-plus nv-glass is-green">
                <NvIcon name="plus" size={22} tone="white" />
              </span>
              <span className="nv-capsule-text">
                <span className="nv-capsule-title">Añadir comida</span>
                <span className="nv-capsule-sub">Escríbela como la dirías</span>
              </span>
            </button>
          ) : null}
        </div>
      </section>

      {isToday && data.suggestion?.recipe ? (
        <RecipeSuggestion recipe={data.suggestion.recipe} onSaved={() => void reload()} />
      ) : isToday && data.suggestion ? (
        <section className="nv-card nv-glass is-read nv-suggest nv-rise" style={{ ["--i" as string]: 6 }}>
          <div className="nv-suggest-head">
            <NvBubble kind="plato" size={52} />
            <div className="min-w-0 flex-1">
              <p className="nv-kicker">¿Qué como ahora?</p>
              <p className="nv-suggest-title">
                ~{fmt(data.suggestion.kcal)} kcal · {data.suggestion.protein} g proteína
              </p>
            </div>
          </div>
          <ul className="nv-suggest-foods">
            {data.suggestion.foods.map((f) => (
              <li key={f.name}>
                <span>{f.name}</span>
                <span className="nv-num">{fmt(f.grams)} g</span>
              </li>
            ))}
          </ul>
          <div className="nv-row">
            <Link href="/comidas/planes" className="nv-btn nv-glass is-thin nv-press">
              Ver más opciones
            </Link>
            <button
              type="button"
              className="nv-btn nv-glass is-green nv-press"
              onClick={() => {
                openChatWith(`Comí ${data.suggestion!.foods.map((f) => `${f.name} ${Math.round(f.grams)} g`).join(", ")}`);
                router.push("/comidas/chat");
              }}
            >
              Ya me lo comí
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}

/** "¿Qué como ahora?" con una receta de Planes, ya ajustada a lo que falta. */
function RecipeSuggestion({ recipe, onSaved }: { recipe: NonNullable<NonNullable<DayData["suggestion"]>["recipe"]>; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="nv-card nv-glass is-read nv-suggest nv-rise" style={{ ["--i" as string]: 6 }}>
      <div className="nv-suggest-head">
        <NvBubble kind={bubbleForKind(recipe.kind)} size={52} />
        <div className="min-w-0 flex-1">
          <p className="nv-kicker">¿Qué como ahora?</p>
          <p className="nv-suggest-title">{recipe.name}</p>
          <p className="nv-sub">
            ~{fmt(recipe.kcal)} kcal · {recipe.protein_g} g proteína · {recipe.minutes} min
            {recipe.status === "ready" ? " · tienes todo" : recipe.missing.length ? ` · falta: ${recipe.missing.join(", ").toLowerCase()}` : ""}
          </p>
        </div>
      </div>
      <ul className="nv-suggest-foods">
        {recipe.lines.map((f) => (
          <li key={f.name}>
            <span>{f.name}</span>
            <span className="nv-num">{f.amount}</span>
          </li>
        ))}
      </ul>
      <div className="nv-row">
        <Link href={`/comidas/planes/recetas/${recipe.id}`} className="nv-btn nv-glass is-thin nv-press">
          Ver receta
        </Link>
        <button type="button" className="nv-btn nv-glass is-green nv-press" onClick={() => setOpen(true)}>
          Ya me lo comí
        </button>
      </div>
      <LogRecipeSheet
        open={open}
        onClose={() => setOpen(false)}
        onDone={onSaved}
        payload={{ recipeId: recipe.id, name: recipe.name, kind: recipe.kind, kcal: recipe.kcal, protein_g: recipe.protein_g, gramsPerServing: recipe.gramsPerServing, swaps: recipe.swaps, withOptional: recipe.withOptional }}
      />
    </section>
  );
}

function LeftCard({ text, left, tone }: { text: string; left: number; tone: "ok" | "warn" | "over" }) {
  const ref = useCountUp(Math.abs(left));
  // "Faltan 550 kcal para tu límite" → "Faltan" · 550 kcal · "para tu límite"
  const m = text.match(/^(.*?)(\d[\d.]*)\s*kcal\s*(.*)$/);
  return (
    <div className={`nv-left nv-glass is-thick is-${tone}`}>
      <NvIcon name="flame" size={30} tone={tone === "ok" ? "green" : "silver"} />
      {m ? (
        <>
          {m[1] ? <p className="nv-left-text">{m[1].trim()}</p> : null}
          <p className="nv-left-num">
            <span ref={ref} className="nv-num">
              {fmt(Math.abs(left))}
            </span>
            <span> kcal</span>
          </p>
          <p className="nv-left-text">{m[3]}</p>
        </>
      ) : (
        <p className="nv-left-num is-text">{text}</p>
      )}
    </div>
  );
}

function AddCapsule({ moment, i }: { moment: (typeof MAIN_MOMENTS)[number]; i: number }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="nv-capsule nv-glass nv-press nv-rise is-empty"
      style={{ ["--i" as string]: i }}
      onClick={() => {
        openChatWith(ADD_TEXT[moment]);
        router.push("/comidas/chat");
      }}
    >
      <NvBubble kind={moment} size={50} />
      <span className="nv-capsule-text">
        <span className="nv-capsule-title">{MOMENT_LABEL[moment]}</span>
        <span className="nv-capsule-sub">Sin registrar</span>
      </span>
      <span className="nv-capsule-add nv-glass is-green">
        <NvIcon name="plus" size={18} tone="white" />
      </span>
    </button>
  );
}

function HomeSkeleton() {
  return (
    <div className="nv-stack">
      <NvSkeleton h={64} />
      <NvSkeleton h={72} />
      <NvSkeleton h={300} />
      <NvSkeleton h={150} />
    </div>
  );
}
