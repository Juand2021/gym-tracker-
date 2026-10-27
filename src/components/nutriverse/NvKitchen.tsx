"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { RecipeCard, RecipePreview } from "@/lib/nutrition/kitchen/server";
import type { RecipeKind } from "@/lib/nutrition/kitchen/recipes";
import type { MealMoment } from "@/lib/nutrition/store";
import { NvBubble, type BubbleKind } from "./NvBubble";
import { NvIcon } from "./NvIcon";
import { NvSegmented, NvSheet } from "./NvUi";
import { fmt } from "./glass/motion";
import { invalidateNv, MOMENT_LABEL, nvSend, type SnacksData } from "./data";

/** Pestañas internas de Planes. */
const PLAN_TABS = [
  { value: "/comidas/planes", label: "Hoy" },
  { value: "/comidas/planes/recetas", label: "Recetas" },
  { value: "/comidas/planes/despensa", label: "Despensa" },
  { value: "/comidas/planes/semana", label: "Semana" },
] as const;

export function PlanesTabs() {
  const pathname = usePathname();
  const router = useRouter();
  // En el detalle de una receta no se muestran (tiene su propio "volver").
  if (/^\/comidas\/planes\/recetas\/[^/]+/.test(pathname)) return null;
  const current = [...PLAN_TABS].reverse().find((t) => pathname === t.value || pathname.startsWith(`${t.value}/`))?.value ?? "/comidas/planes";
  return (
    <div className="nv-rise">
      <NvSegmented label="Secciones de Planes" value={current} options={[...PLAN_TABS]} onChange={(v) => router.push(v)} />
    </div>
  );
}

export const bubbleForKind = (k: RecipeKind): BubbleKind => (k === "desayuno" ? "desayuno" : k === "snack" ? "snack" : "almuerzo");

/** "Puedes hacerla" · "Te falta: tomate" · "Te faltan 4 cosas". */
export function PantryChip({ card }: { card: Pick<RecipeCard, "status" | "missing" | "blocked"> }) {
  if (card.blocked?.reason === "equipo") return <span className="nv-chip is-warn">Necesita {card.blocked.detail}</span>;
  if (card.status === "ready")
    return (
      <span className="nv-chip is-ok">
        <span className="nv-chip-dot" /> Puedes hacerla
      </span>
    );
  if (card.status === "almost")
    return (
      <span className="nv-chip is-warn">
        <span className="nv-chip-dot" /> Te falta: {card.missing.map((m) => m.name.toLowerCase()).join(", ")}
      </span>
    );
  return <span className="nv-chip">Te faltan {card.missing.length} cosas</span>;
}

/** Tarjeta de receta en la biblioteca. */
export function RecipeTile({ card, i = 0, kcal, protein, href }: { card: RecipeCard; i?: number; kcal?: number; protein?: number; href?: string }) {
  return (
    <Link href={href ?? `/comidas/planes/recetas/${card.id}`} className="nv-recipe nv-glass is-read nv-press nv-rise" style={{ ["--i" as string]: i }}>
      <NvBubble kind={bubbleForKind(card.kind)} size={58} />
      <span className="nv-recipe-main">
        <span className="nv-recipe-name">
          {card.name}
          {card.state.favorite ? <NvIcon name="heart" size={16} tone="green" /> : null}
        </span>
        <span className="nv-recipe-meta">
          <b className="nv-num">{fmt(kcal ?? card.kcal)}</b> kcal · <b className="nv-num">{protein ?? card.protein_g}</b> g prot. · {card.minutes} min
          {card.servings > 1 ? ` · rinde ${card.servings}` : ""}
        </span>
        <span className="nv-recipe-chips">
          <PantryChip card={card} />
          {card.state.tried ? (
            <span className="nv-chip is-ok">
              <NvIcon name="check" size={14} /> Probada
            </span>
          ) : null}
          {card.source !== "nutriverse" ? <span className="nv-chip">{card.source === "mia" ? "Mía" : "De la IA"}</span> : null}
        </span>
      </span>
      <NvIcon name="chevronR" size={16} />
    </Link>
  );
}

export type LogPayload = {
  recipeId: string;
  name: string;
  kind: RecipeKind;
  /** kcal y proteína de UNA porción (ya ajustada si viene del plan). */
  kcal: number;
  protein_g: number;
  gramsPerServing?: Record<string, number>;
  swaps?: Record<string, string>;
  withOptional?: string[];
};

const MOMENTS: MealMoment[] = ["desayuno", "almuerzo", "cena", "snack"];

function defaultMoment(kind: RecipeKind): MealMoment {
  if (kind === "desayuno") return "desayuno";
  if (kind === "snack") return "snack";
  const h = new Date().getHours();
  return h < 16 ? "almuerzo" : "cena";
}

/** Hoja para registrar una receta: porciones, momento y confirmación (no pasa por la IA). */
export function LogRecipeSheet({ open, onClose, payload, onDone }: { open: boolean; onClose: () => void; payload: LogPayload | null; onDone?: () => void }) {
  const router = useRouter();
  const [servings, setServings] = useState(1);
  const [moment, setMoment] = useState<MealMoment>("almuerzo");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !payload) return;
    const t = window.setTimeout(() => {
      setServings(1);
      setMoment(defaultMoment(payload.kind));
      setError(null);
    }, 0);
    return () => window.clearTimeout(t);
  }, [open, payload]);

  if (!payload) return null;

  async function save() {
    if (!payload) return;
    setBusy(true);
    setError(null);
    try {
      await nvSend(`/api/comidas/recipes/${payload.recipeId}/log`, "POST", {
        servings,
        moment,
        gramsPerServing: payload.gramsPerServing,
        swaps: payload.swaps,
        withOptional: payload.withOptional,
      });
      invalidateNv("/api/comidas/");
      onDone?.();
      onClose();
      router.push("/comidas");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo registrar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <NvSheet
      open={open}
      onClose={onClose}
      title="Registrar comida"
      footer={
        <div className="nv-row">
          <button type="button" className="nv-btn nv-glass is-thin nv-press" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="nv-btn nv-glass is-green nv-press" onClick={save} disabled={busy}>
            {busy ? "Guardando…" : "Sí, guardar"}
          </button>
        </div>
      }
    >
      <div className="nv-form">
        <p className="nv-h2">{payload.name}</p>
        <div className="nv-log-total">
          <span>
            <b className="nv-num">{fmt(payload.kcal * servings)}</b> kcal
          </span>
          <span>
            <b className="nv-num">{Math.round(payload.protein_g * servings)}</b> g proteína
          </span>
        </div>
        <div className="nv-form-field">
          <span className="nv-form-label">Porciones que comiste</span>
          <div className="nv-stepper nv-glass is-thin">
            <button type="button" className="nv-press" onClick={() => setServings((s) => Math.max(0.5, s - 0.5))} aria-label="Menos">
              −
            </button>
            <span className="nv-num">{String(servings).replace(".", ",")}</span>
            <button type="button" className="nv-press" onClick={() => setServings((s) => Math.min(4, s + 0.5))} aria-label="Más">
              +
            </button>
          </div>
        </div>
        <div className="nv-form-field">
          <span className="nv-form-label">¿En qué comida?</span>
          <div className="nv-pills">
            {MOMENTS.map((m) => (
              <button key={m} type="button" className={`nv-pill nv-glass is-thin nv-press ${moment === m ? "is-on" : ""}`} onClick={() => setMoment(m)}>
                {MOMENT_LABEL[m]}
              </button>
            ))}
          </div>
        </div>
        <p className="nv-form-hint">Calculado con los gramos de la receta. Si cambiaste algo, después lo corriges desde el chat.</p>
        {error ? <p className="nv-chat-error">{error}</p> : null}
      </div>
    </NvSheet>
  );
}

/** "Tengo hambre": 3 snacks que caben en lo que queda, los que más llenan primero. */
export function HungrySheet({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (p: LogPayload) => void }) {
  const [data, setData] = useState<SnacksData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch("/api/comidas/snacks")
      .then(async (r) => {
        const body = (await r.json()) as SnacksData & { error?: string };
        if (!r.ok) throw new Error(body.error ?? "No pude buscar snacks");
        if (!cancelled) {
          setData(body);
          setError(null);
        }
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : "No pude buscar snacks"));
    return () => {
      cancelled = true;
    };
  }, [open]);

  return (
    <NvSheet open={open} onClose={onClose} title="Tengo hambre">
      {!data ? (
        error ? (
          <p className="nv-chat-error">{error}</p>
        ) : (
          <div className="nv-thinking nv-glass is-thin" role="status">
            <span className="nv-thinking-orb" />
            <span className="nv-thinking-text">Buscando qué te llena más…</span>
          </div>
        )
      ) : (
        <div className="nv-form">
          <p className="nv-sub">
            {data.left ? `Te quedan ${fmt(data.left.kcal)} kcal. ` : ""}
            {data.tip}
          </p>
          {data.snacks.map((s) => (
            <div key={s.card.id} className="nv-snack nv-glass is-thin">
              <Link href={`/comidas/planes/recetas/${s.card.id}`} className="nv-plan-recipe-top nv-press" onClick={onClose}>
                <NvBubble kind="snack" size={46} />
                <span className="nv-recipe-main">
                  <span className="nv-recipe-name">{s.card.name}</span>
                  <span className="nv-recipe-meta">
                    <b className="nv-num">{fmt(s.kcal)}</b> kcal · <b className="nv-num">{s.protein_g}</b> g prot. · {s.card.minutes} min
                  </span>
                  <span className="nv-recipe-chips">
                    <PantryChip card={s.card} />
                  </span>
                </span>
              </Link>
              <p className="nv-snack-lines">{s.lines.map((l) => `${l.name}: ${l.amount}`).join(" · ")}</p>
              <button
                type="button"
                className="nv-btn nv-glass is-green nv-press is-small"
                onClick={() => {
                  onClose();
                  onPick({ recipeId: s.card.id, name: s.card.name, kind: s.card.kind, kcal: s.kcal, protein_g: s.protein_g, gramsPerServing: s.gramsPerServing, swaps: s.swaps });
                }}
              >
                Ya me lo comí
              </button>
            </div>
          ))}
          {!data.snacks.length ? <p className="nv-sub">No encontré snacks con tu despensa. Agrega yogur, huevos o fruta.</p> : null}
        </div>
      )}
    </NvSheet>
  );
}

type AuthorKind = "desayuno" | "comida" | "snack" | "";

const AUTHOR_KINDS: [AuthorKind, string][] = [
  ["", "Sorpréndeme"],
  ["desayuno", "Desayuno"],
  ["comida", "Almuerzo o cena"],
  ["snack", "Snack"],
];

/**
 * Crear receta: "read" = la persona la escribe y la IA la ordena; "propose" = la IA propone una con la despensa.
 * Siempre se ve antes de guardar (kcal calculadas con la base, no por la IA).
 */
export function RecipeAuthorSheet({ open, onClose, mode }: { open: boolean; onClose: () => void; mode: "read" | "propose" }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [kind, setKind] = useState<AuthorKind>("");
  const [wish, setWish] = useState("");
  const [busy, setBusy] = useState<"read" | "save" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RecipePreview | null>(null);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      setResult(null);
      setError(null);
    }, 0);
    return () => window.clearTimeout(t);
  }, [open, mode]);

  async function run() {
    setBusy("read");
    setError(null);
    setResult(null);
    try {
      const body = mode === "read" ? { action: "read", text } : { action: "propose", kind: kind || null, wish: wish || null };
      setResult(await nvSend<RecipePreview>("/api/comidas/recipes", "POST", body));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pude con la receta");
    } finally {
      setBusy(null);
    }
  }

  async function save() {
    if (!result) return;
    setBusy("save");
    try {
      const { recipe } = await nvSend<{ recipe: { id: string } }>("/api/comidas/recipes", "POST", { action: "save", recipe: result.recipe });
      invalidateNv("/api/comidas/");
      onClose();
      router.push(`/comidas/planes/recetas/${recipe.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setBusy(null);
    }
  }

  const title = mode === "read" ? "Agregar mi receta" : "Proponme una receta";
  const footer = result ? (
    <div className="nv-row">
      <button type="button" className="nv-btn nv-glass is-thin nv-press" onClick={mode === "read" ? () => setResult(null) : run} disabled={!!busy}>
        {mode === "read" ? "Editar texto" : busy === "read" ? "Pensando…" : "Otra idea"}
      </button>
      <button type="button" className="nv-btn nv-glass is-green nv-press" onClick={save} disabled={!!busy}>
        {busy === "save" ? "Guardando…" : "Guardar en mi recetario"}
      </button>
    </div>
  ) : (
    <button type="button" className="nv-btn nv-glass is-green nv-press nv-block" onClick={run} disabled={!!busy || (mode === "read" && text.trim().length < 15)}>
      {busy ? "Pensando… (unos segundos)" : mode === "read" ? "Leer receta" : "Proponer con lo que tengo"}
    </button>
  );

  return (
    <NvSheet open={open} onClose={onClose} title={title} footer={footer}>
      {result ? (
        <div className="nv-form">
          <div>
            <p className="nv-h2">{result.recipe.name}</p>
            {result.recipe.description ? <p className="nv-sub">{result.recipe.description}</p> : null}
          </div>
          <div className="nv-log-total">
            <span>
              <b className="nv-num">{fmt(result.card.kcal)}</b> kcal por porción
            </span>
            <span>
              <b className="nv-num">{result.card.protein_g}</b> g proteína
            </span>
          </div>
          <span className="nv-recipe-chips">
            <PantryChip card={result.card} />
            <span className="nv-chip">{result.recipe.minutes} min</span>
            {result.recipe.servings > 1 ? <span className="nv-chip">Rinde {result.recipe.servings}</span> : null}
          </span>
          {result.warnings.length ? (
            <div className="nv-tips">
              {result.warnings.map((w) => (
                <p key={w}>
                  <NvIcon name="info" size={16} /> {w}
                </p>
              ))}
            </div>
          ) : null}
          <ul className="nv-ingredients">
            {result.lines.map((l) => (
              <li key={l.name} className={l.optional ? "is-optional" : ""}>
                <span className="nv-ing-name">
                  {l.name}
                  {l.optional ? <span className="nv-tag">opcional</span> : null}
                  {l.staple ? <span className="nv-tag is-quiet">básico</span> : null}
                </span>
                <span className="nv-ing-amount nv-num">{l.amount}</span>
              </li>
            ))}
          </ul>
          <ol className="nv-steps">
            {result.recipe.steps.map((s, i) => (
              <li key={i}>
                <span className="nv-step-n">{i + 1}</span>
                <span className="nv-step-text">{s.text}</span>
              </li>
            ))}
          </ol>
          {error ? <p className="nv-chat-error">{error}</p> : null}
        </div>
      ) : mode === "read" ? (
        <div className="nv-form">
          <p className="nv-sub">Escríbela como se la contarías a alguien: ingredientes con cantidades y cómo la haces. Yo la ordeno y calculo sus calorías.</p>
          <textarea
            className="nv-textarea nv-glass is-thin"
            rows={8}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"Ej.: Pollo al curry\n200 g de pechuga, media cebolla, 1 cucharadita de curry, media taza de leche, media taza de arroz.\nSofrío la cebolla, agrego el pollo en cubos…"}
            aria-label="Tu receta"
          />
          {error ? <p className="nv-chat-error">{error}</p> : null}
        </div>
      ) : (
        <div className="nv-form">
          <p className="nv-sub">Uso lo que marcaste en tu despensa y tu equipo de cocina. Fácil, rápida y alta en proteína.</p>
          <div className="nv-pills">
            {AUTHOR_KINDS.map(([k, label]) => (
              <button key={label} type="button" className={`nv-pill nv-glass is-thin nv-press ${kind === k ? "is-on" : ""}`} onClick={() => setKind(k)}>
                {label}
              </button>
            ))}
          </div>
          <input className="nv-input nv-glass is-thin" value={wish} onChange={(e) => setWish(e.target.value)} placeholder="Algo en especial (opcional): con pollo, sin estufa…" aria-label="Algo en especial" />
          {error ? <p className="nv-chat-error">{error}</p> : null}
        </div>
      )}
    </NvSheet>
  );
}
