"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { INGREDIENT_BY_KEY } from "@/lib/nutrition/kitchen/ingredients";
import { formatAmount } from "@/lib/nutrition/kitchen/nutrition";
import { EQUIPMENT_LABEL, KIND_LABEL } from "@/lib/nutrition/kitchen/recipes";
import type { RecipeDetail } from "@/lib/nutrition/kitchen/server";
import { SLOT_LABEL } from "@/lib/nutrition/kitchen/state";
import { NvBubble } from "@/components/nutriverse/NvBubble";
import { NvIcon } from "@/components/nutriverse/NvIcon";
import { LogRecipeSheet, PantryChip, bubbleForKind, type LogPayload } from "@/components/nutriverse/NvKitchen";
import { NvError, NvSegmented, NvSheet, NvSkeleton } from "@/components/nutriverse/NvUi";
import { fmt } from "@/components/nutriverse/glass/motion";
import { invalidateNv, nvSend, useNv } from "@/components/nutriverse/data";
import { writeSession } from "@/lib/client-cache";

type Mode = "fit" | "base";

const DIFFICULTY = ["", "Fácil", "Media", "Con algo de práctica"];

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const url = `/api/comidas/recipes/${id}`;
  const { data, error, reload, setData } = useNv<RecipeDetail>(url);
  const [mode, setMode] = useState<Mode>("fit");
  const [logOpen, setLogOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const router = useRouter();
  const [notice, setNoticeRaw] = useState<string | null>(null);
  const setNotice = (text: string) => {
    setNoticeRaw(text);
    window.setTimeout(() => setNoticeRaw((cur) => (cur === text ? null : cur)), 2400);
  };

  if (!data) return error ? <NvError text={error} onRetry={reload} /> : <NvSkeleton h={520} />;
  const { recipe, card, fitted, base } = data;
  const useFit = mode === "fit" && fitted !== null;
  const portion = useFit ? fitted.totals : base.totals;
  const perServing = useFit ? fitted.gramsPerServing : null;
  const pantryOf = new Map(base.lines.map((l) => [l.key, l.inPantry]));

  // Cantidades para cocinar la receta completa (todas sus porciones).
  const lines = (useFit ? fitted.lines : base.lines).map((l) => {
    const original = l.swappedFrom ?? l.key;
    const ing = INGREDIENT_BY_KEY.get(l.key);
    // Las líneas ya vienen por porción (ajustada o no): se multiplica por las porciones de la receta.
    return { ...l, inPantry: pantryOf.get(l.key) ?? false, cook: formatAmount(ing, l.grams * recipe.servings), original };
  });

  async function setState(patch: { favorite?: boolean; liked?: -1 | 0 | 1; tried?: boolean }) {
    try {
      const res = await nvSend<{ state: RecipeDetail["card"]["state"] }>(`${url}/state`, "PUT", patch);
      setData((d) => (d ? { ...d, card: { ...d.card, state: res.state } } : d));
      invalidateNv("/api/comidas/recipes");
      if (patch.liked === 1) setNotice("¡Bien! La tendré en cuenta en tus planes");
      if (patch.liked === -1) setNotice("Entendido: no te la vuelvo a proponer");
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "No se pudo guardar");
    }
  }

  const payload: LogPayload = {
    recipeId: recipe.id,
    name: recipe.name,
    kind: recipe.kind,
    kcal: portion.kcal,
    protein_g: portion.protein_g,
    gramsPerServing: perServing ?? undefined,
    swaps: data.match.swaps,
    withOptional: data.match.optionalAvailable,
  };

  // El modo cocinar usa las mismas cantidades que se ven aquí.
  const cookHref = `/comidas/planes/recetas/${recipe.id}/cocinar`;
  const rememberFit = () => writeSession(`nv:cook:${recipe.id}`, { lines: lines.map((l) => ({ name: l.name, amount: l.cook, staple: l.staple, optional: l.optional, included: l.included })), payload });

  return (
    <div className="nv-stack">
      <Link href="/comidas/planes/recetas" className="nv-back nv-press">
        <NvIcon name="chevronL" size={16} /> Recetas
      </Link>

      <section className="nv-card nv-glass is-thick nv-recipe-hero nv-rise">
        <button type="button" className={`nv-icon-btn nv-press nv-fav ${card.state.favorite ? "is-on" : ""}`} onClick={() => setState({ favorite: !card.state.favorite })} aria-pressed={card.state.favorite} aria-label={card.state.favorite ? "Quitar de favoritas" : "Agregar a favoritas"}>
          <NvIcon name="heart" size={28} tone={card.state.favorite ? "green" : "silver"} />
        </button>
        <NvBubble kind={bubbleForKind(recipe.kind)} size={96} className="nv-float" />
        <p className="nv-kicker">
          {KIND_LABEL[recipe.kind]} · {recipe.minutes} min · {DIFFICULTY[recipe.difficulty]}
        </p>
        <h1 className="nv-title">{recipe.name}</h1>
        <p className="nv-sub">{recipe.description}</p>
        <div className="nv-recipe-chips is-center">
          <PantryChip card={card} />
          {recipe.equipment.length ? recipe.equipment.map((e) => <span key={e} className="nv-chip">{EQUIPMENT_LABEL[e]}</span>) : <span className="nv-chip">Sin cocinar</span>}
          {recipe.servings > 1 ? <span className="nv-chip">Rinde {recipe.servings} porciones</span> : null}
          {card.state.tried ? <span className="nv-chip is-ok">Probada{card.state.timesCooked ? ` · ${card.state.timesCooked}×` : ""}</span> : null}
        </div>
      </section>

      <section className="nv-card nv-glass is-read nv-rise" style={{ ["--i" as string]: 1 }}>
        {fitted ? (
          <NvSegmented
            label="Porción"
            value={mode}
            onChange={setMode}
            options={[
              { value: "fit", label: `Ajustada a tu ${SLOT_LABEL[fitted.slot].toLowerCase()}` },
              { value: "base", label: "Como la receta" },
            ]}
          />
        ) : null}
        <div className="nv-meal-totals nv-recipe-totals">
          <span>
            <b className="nv-num">{fmt(portion.kcal)}</b> kcal
          </span>
          <span>
            <b className="nv-num">{Math.round(portion.protein_g)}</b> g prot.
          </span>
          <span>
            <b className="nv-num">{Math.round(portion.carb_g)}</b> g carbos
          </span>
          <span>
            <b className="nv-num">{Math.round(portion.fat_g)}</b> g grasa
          </span>
        </div>
        <p className="nv-sub nv-center">
          Por porción.
          {useFit && fitted
            ? ` Meta de tu ${SLOT_LABEL[fitted.slot].toLowerCase()}: ~${fmt(fitted.target.kcal)} kcal y ${fitted.target.protein_g} g de proteína.`
            : data.left
              ? ` Te quedan ${fmt(data.left.kcal)} kcal hoy.`
              : ""}
        </p>
      </section>

      <section className="nv-card nv-glass is-read nv-rise" style={{ ["--i" as string]: 2 }}>
        <div className="nv-section-head">
          <h2 className="nv-h2">Ingredientes</h2>
          <span className="nv-sub">{recipe.servings > 1 ? `para ${recipe.servings} porciones` : "para 1 porción"}</span>
        </div>
        <ul className="nv-ingredients">
          {lines.map((l) => (
            <li key={l.key} className={l.included ? "" : "is-optional"}>
              <span className={`nv-ing-check ${l.inPantry ? "is-have" : ""}`} aria-label={l.inPantry ? "Lo tienes" : "No lo tienes"}>
                {l.inPantry ? <NvIcon name="check" size={14} tone="white" /> : null}
              </span>
              <span className="nv-ing-name">
                {l.name}
                {l.note ? <span className="nv-ing-note"> · {l.note}</span> : null}
                {l.optional ? <span className="nv-tag">opcional</span> : null}
                {l.swappedFrom ? <span className="nv-tag is-green">en vez de {INGREDIENT_BY_KEY.get(l.swappedFrom)?.name.toLowerCase()}</span> : null}
                {l.staple ? <span className="nv-tag is-quiet">básico</span> : null}
              </span>
              <span className="nv-ing-amount nv-num">{l.cook}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="nv-card nv-glass is-read nv-rise" style={{ ["--i" as string]: 3 }}>
        <h2 className="nv-h2">Preparación</h2>
        <ol className="nv-steps">
          {recipe.steps.map((s, i) => (
            <li key={i}>
              <span className="nv-step-n">{i + 1}</span>
              <span className="nv-step-text">
                {s.text}
                {s.timerMin ? (
                  <span className="nv-step-timer">
                    <NvIcon name="history" size={14} /> {s.timerMin} min
                  </span>
                ) : null}
              </span>
            </li>
          ))}
        </ol>
        {recipe.tips?.length ? (
          <div className="nv-tips">
            {recipe.tips.map((t) => (
              <p key={t}>
                <NvIcon name="info" size={16} /> {t}
              </p>
            ))}
          </div>
        ) : null}
      </section>

      <section className="nv-card nv-glass is-thin nv-rate nv-rise" style={{ ["--i" as string]: 4 }}>
        <p className="nv-h2">{card.state.tried ? "¿Qué tal te quedó?" : "¿Ya la probaste?"}</p>
        <div className="nv-row">
          <button type="button" className={`nv-btn nv-glass is-thin nv-press is-small ${card.state.liked === 1 ? "is-picked" : ""}`} onClick={() => setState({ liked: card.state.liked === 1 ? 0 : 1 })} aria-pressed={card.state.liked === 1}>
            <NvIcon name="heart" size={16} /> Me gustó
          </button>
          <button type="button" className={`nv-btn nv-glass is-thin nv-press is-small ${card.state.liked === -1 ? "is-picked" : ""}`} onClick={() => setState({ liked: card.state.liked === -1 ? 0 : -1 })} aria-pressed={card.state.liked === -1}>
            No es para mí
          </button>
        </div>
      </section>

      <div className="nv-cook-bar nv-rise" style={{ ["--i" as string]: 5 }}>
        <button type="button" className="nv-btn nv-glass is-thin nv-press" onClick={() => setLogOpen(true)}>
          <NvIcon name="check" size={18} /> Registrar
        </button>
        <Link href={cookHref} onClick={rememberFit} className="nv-btn nv-glass is-green nv-press is-big">
          <NvIcon name="flame" size={20} tone="white" /> Cocinar paso a paso
        </Link>
      </div>

      {notice ? (
        <p className="nv-toast nv-glass is-thick" role="status">
          {notice}
        </p>
      ) : null}

      {recipe.source !== "nutriverse" ? (
        <button type="button" className="nv-btn nv-glass is-thin nv-press is-danger" onClick={() => setConfirmDelete(true)}>
          <NvIcon name="trash" size={18} /> Borrar esta receta
        </button>
      ) : null}

      <LogRecipeSheet open={logOpen} onClose={() => setLogOpen(false)} payload={payload} />
      <NvSheet
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="¿Borrar esta receta?"
        footer={
          <div className="nv-row">
            <button type="button" className="nv-btn nv-glass is-thin nv-press" onClick={() => setConfirmDelete(false)}>
              No, déjala
            </button>
            <button
              type="button"
              className="nv-btn nv-glass is-danger-solid nv-press"
              onClick={async () => {
                try {
                  await nvSend(url, "DELETE");
                  invalidateNv("/api/comidas/");
                  router.push("/comidas/planes/recetas");
                } catch (e) {
                  setNotice(e instanceof Error ? e.message : "No se pudo borrar");
                  setConfirmDelete(false);
                }
              }}
            >
              Sí, bórrala
            </button>
          </div>
        }
      >
        <p className="nv-sub">Las comidas que ya registraste con ella no cambian. No se puede deshacer.</p>
      </NvSheet>
    </div>
  );
}
