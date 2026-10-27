"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { readSession } from "@/lib/client-cache";
import { formatAmount } from "@/lib/nutrition/kitchen/nutrition";
import { INGREDIENT_BY_KEY } from "@/lib/nutrition/kitchen/ingredients";
import type { RecipeDetail } from "@/lib/nutrition/kitchen/server";
import { playAlarmSound, stopAlarmSound, triggerHapticAlarm, stopHapticAlarm, unlockAudioContext } from "@/lib/timer-sound";
import { NvIcon } from "@/components/nutriverse/NvIcon";
import { LogRecipeSheet, type LogPayload } from "@/components/nutriverse/NvKitchen";
import { NvError, NvSkeleton } from "@/components/nutriverse/NvUi";
import { invalidateNv, nvSend, useNv } from "@/components/nutriverse/data";

type CookLine = { name: string; amount: string; staple: boolean; optional: boolean; included: boolean };
type Remembered = { lines: CookLine[]; payload: LogPayload };

/** Mantiene la pantalla encendida mientras se cocina (si el navegador lo permite). */
function useWakeLock() {
  useEffect(() => {
    let lock: { release(): Promise<void> } | null = null;
    const nav = navigator as Navigator & { wakeLock?: { request(type: "screen"): Promise<{ release(): Promise<void> }> } };
    const ask = () => {
      if (document.visibilityState !== "visible" || !nav.wakeLock) return;
      nav.wakeLock
        .request("screen")
        .then((l) => (lock = l))
        .catch(() => undefined);
    };
    ask();
    document.addEventListener("visibilitychange", ask);
    return () => {
      document.removeEventListener("visibilitychange", ask);
      void lock?.release().catch(() => undefined);
    };
  }, []);
}

/** Temporizador de un paso: cuenta con la hora real (sigue bien si la app se va a segundo plano). */
function StepTimer({ minutes, stepKey }: { minutes: number; stepKey: string }) {
  const [endAt, setEndAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [ringing, setRinging] = useState(false);
  const rung = useRef(false);

  useEffect(() => {
    if (endAt === null) return;
    const t = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(t);
  }, [endAt]);

  const left = endAt === null ? minutes * 60 : Math.max(0, Math.round((endAt - now) / 1000));

  useEffect(() => {
    if (endAt !== null && left === 0 && !rung.current) {
      rung.current = true;
      const t = window.setTimeout(() => {
        setRinging(true);
        playAlarmSound();
        triggerHapticAlarm();
      }, 0);
      return () => window.clearTimeout(t);
    }
  }, [left, endAt]);

  const stop = useCallback(() => {
    stopAlarmSound();
    stopHapticAlarm();
    setRinging(false);
    setEndAt(null);
    rung.current = false;
  }, []);

  // Al cambiar de paso se apaga.
  useEffect(() => stop, [stepKey, stop]);

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  return (
    <div className={`nv-cook-timer nv-glass is-thick ${ringing ? "is-ringing" : ""}`}>
      <span className="nv-cook-timer-time nv-num" aria-live="polite">
        {mm}:{ss}
      </span>
      {ringing ? (
        <button type="button" className="nv-btn nv-glass is-green nv-press" onClick={stop}>
          ¡Listo! Apagar
        </button>
      ) : endAt === null ? (
        <button
          type="button"
          className="nv-btn nv-glass is-green nv-press"
          onClick={() => {
            unlockAudioContext();
            setNow(Date.now());
            setEndAt(Date.now() + minutes * 60 * 1000);
          }}
        >
          <NvIcon name="history" size={18} tone="white" /> Iniciar {minutes} min
        </button>
      ) : (
        <button type="button" className="nv-btn nv-glass is-thin nv-press" onClick={stop}>
          Detener
        </button>
      )}
    </div>
  );
}

export default function CookPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data, error, reload } = useNv<RecipeDetail>(`/api/comidas/recipes/${id}`);
  const [remembered] = useState(() => readSession<Remembered>(`nv:cook:${id}`) ?? null);
  // -1 = alistar ingredientes; steps.length = terminado.
  const [step, setStep] = useState(-1);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [logOpen, setLogOpen] = useState(false);
  const [rated, setRated] = useState<-1 | 1 | null>(null);
  useWakeLock();

  if (!data) return error ? <NvError text={error} onRetry={reload} /> : <NvSkeleton h={520} />;
  const { recipe } = data;
  const steps = recipe.steps;
  // Si se llegó desde el detalle se usan sus cantidades (ajustadas); si no, las de la receta.
  const lines: CookLine[] =
    remembered?.lines ??
    data.base.lines.map((l) => ({ name: l.name, amount: formatAmount(INGREDIENT_BY_KEY.get(l.key), l.grams * recipe.servings), staple: l.staple, optional: l.optional, included: l.included }));
  const payload: LogPayload = remembered?.payload ?? {
    recipeId: recipe.id,
    name: recipe.name,
    kind: recipe.kind,
    kcal: data.base.totals.kcal,
    protein_g: data.base.totals.protein_g,
    swaps: data.match.swaps,
    withOptional: data.match.optionalAvailable,
  };
  const done = step >= steps.length;
  const current = step >= 0 && !done ? steps[step] : null;

  async function rate(liked: -1 | 1) {
    setRated(liked);
    await nvSend(`/api/comidas/recipes/${recipe.id}/state`, "PUT", { liked, tried: true }).catch(() => undefined);
    invalidateNv("/api/comidas/recipes");
  }

  return (
    <div className="nv-cook">
      <header className="nv-cook-head">
        <button type="button" className="nv-icon-btn nv-glass is-thick nv-press" onClick={() => router.back()} aria-label="Salir del modo cocinar">
          <NvIcon name="close" size={26} />
        </button>
        <div className="nv-cook-title">
          <p className="nv-kicker">Modo cocinar</p>
          <p className="nv-h2">{recipe.name}</p>
        </div>
      </header>

      <div className="nv-cook-dots" aria-hidden="true">
        {[-1, ...steps.map((_, i) => i)].map((i) => (
          <span key={i} className={i === step ? "is-on" : i < step ? "is-done" : ""} />
        ))}
      </div>

      <main className="nv-cook-body">
        {step === -1 ? (
          <section key="prep" className="nv-card nv-glass is-read nv-rise">
            <p className="nv-kicker">Antes de empezar</p>
            <h2 className="nv-title">Alista todo</h2>
            <p className="nv-sub">Toca cada ingrediente cuando lo tengas a la mano.</p>
            <ul className="nv-cook-list">
              {lines
                .map((l, i) => ({ l, i }))
                .filter(({ l }) => l.included || l.optional)
                .map(({ l, i }) => (
                  <li key={i}>
                    <button
                      type="button"
                      className={`nv-cook-item nv-press ${checked.has(i) ? "is-done" : ""}`}
                      aria-pressed={checked.has(i)}
                      onClick={() =>
                        setChecked((s) => {
                          const n = new Set(s);
                          if (n.has(i)) n.delete(i);
                          else n.add(i);
                          return n;
                        })
                      }
                    >
                      <span className={`nv-ing-check ${checked.has(i) ? "is-have" : ""}`}>{checked.has(i) ? <NvIcon name="check" size={14} tone="white" /> : null}</span>
                      <span className="nv-ing-name">
                        {l.name}
                        {l.optional ? <span className="nv-tag">opcional</span> : null}
                      </span>
                      <span className="nv-ing-amount nv-num">{l.amount}</span>
                    </button>
                  </li>
                ))}
            </ul>
          </section>
        ) : current ? (
          <section key={step} className="nv-card nv-glass is-read nv-cook-step nv-rise">
            <p className="nv-kicker">
              Paso {step + 1} de {steps.length}
            </p>
            <p className="nv-cook-text">{current.text}</p>
            {current.timerMin ? <StepTimer minutes={current.timerMin} stepKey={`${recipe.id}:${step}`} /> : null}
          </section>
        ) : (
          <section key="done" className="nv-card nv-glass is-thick nv-cook-done nv-rise">
            <NvIcon name="trophy" size={64} />
            <h2 className="nv-title">¡Buen provecho!</h2>
            <p className="nv-sub">¿Qué tal te quedó?</p>
            <div className="nv-row">
              <button type="button" className={`nv-btn nv-glass is-thin nv-press ${rated === 1 ? "is-picked" : ""}`} onClick={() => rate(1)}>
                <NvIcon name="heart" size={18} /> Me gustó
              </button>
              <button type="button" className={`nv-btn nv-glass is-thin nv-press ${rated === -1 ? "is-picked" : ""}`} onClick={() => rate(-1)}>
                No es para mí
              </button>
            </div>
            <button type="button" className="nv-btn nv-glass is-green nv-press is-big nv-block" onClick={() => setLogOpen(true)}>
              <NvIcon name="check" size={20} tone="white" /> Registrar lo que comí
            </button>
            {recipe.servings > 1 ? <p className="nv-sub">Guarda las otras {recipe.servings - 1} porciones en la nevera: ya quedan listas para los próximos días.</p> : null}
          </section>
        )}
      </main>

      {!done ? (
        <footer className="nv-cook-nav">
          <button type="button" className="nv-btn nv-glass is-thin nv-press" onClick={() => setStep((s) => Math.max(-1, s - 1))} disabled={step === -1}>
            <NvIcon name="chevronL" size={18} /> Atrás
          </button>
          <button type="button" className="nv-btn nv-glass is-green nv-press is-big" onClick={() => setStep((s) => s + 1)}>
            {step === -1 ? "Empezar" : step === steps.length - 1 ? "Terminé" : "Siguiente"} <NvIcon name="chevronR" size={18} tone="white" />
          </button>
        </footer>
      ) : null}

      <LogRecipeSheet open={logOpen} onClose={() => setLogOpen(false)} payload={payload} />
    </div>
  );
}
