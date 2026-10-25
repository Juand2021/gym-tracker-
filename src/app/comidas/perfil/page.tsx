"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { clearSession } from "@/lib/client-cache";
import { PHASE_RATES, type NutritionProfile, type PhaseType, type ProfilePatch } from "@/lib/nutrition/profile";
import type { Achievement } from "@/lib/nutrition/views";
import { NvProgress } from "@/components/nutriverse/NvCharts";
import { NvIcon, type IconName } from "@/components/nutriverse/NvIcon";
import { NvLeaves } from "@/components/nutriverse/NvLogo";
import { NvError, NvSegmented, NvSheet, NvSkeleton } from "@/components/nutriverse/NvUi";
import { fmt } from "@/components/nutriverse/glass/motion";
import { CALM_KEY, invalidateNv, nvSend, PHASE_LABEL, useNv, type ProfileData } from "@/components/nutriverse/data";

type Section = "datos" | "preferencias" | "objetivo" | "config" | null;

const ACH_ICON: Record<Achievement["id"], IconName> = { racha: "streak", comidas: "bowl", metas: "target", mejora: "scale" };
const ACTIVITY: { value: NonNullable<NutritionProfile["activity"]>; label: string }[] = [
  { value: "sedentario", label: "Sedentario" },
  { value: "ligero", label: "Ligero" },
  { value: "activo", label: "Activo" },
  { value: "muy_activo", label: "Muy activo" },
];
const DIET: { value: NutritionProfile["dietStyle"]; label: string }[] = [
  { value: "omnivoro", label: "Omnívoro" },
  { value: "pescetariano", label: "Pescetariano" },
  { value: "vegetariano", label: "Vegetariano" },
  { value: "vegano", label: "Vegano" },
];

export default function NutriVerseProfile() {
  const { data, error, reload, setData } = useNv<ProfileData>("/api/comidas/profile");
  const [open, setOpen] = useState<Section>(null);

  if (!data) return error ? <NvError text={error} onRetry={reload} /> : <ProfileSkeleton />;
  const p = data.profile;
  const g = data.game;
  const save = async (patch: ProfilePatch) => {
    const next = await nvSend<ProfileData>("/api/comidas/profile", "PUT", patch);
    setData(next);
    invalidateNv("/api/comidas/");
    setOpen(null);
  };

  return (
    <div className="nv-stack">
      <section className="nv-card nv-glass is-thick nv-me nv-rise">
        <span className="nv-me-avatar nv-glass is-thick">
          <span>{data.name.trim().charAt(0).toUpperCase()}</span>
          <span className="nv-me-leaf">
            <NvLeaves size={26} />
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="nv-title">{data.name}</h1>
          <p className="nv-sub">Constancia · Disciplina · Resultados</p>
          {p?.phase ? <p className="nv-chip is-ok">{PHASE_LABEL[p.phase.type]}{p.phase.objective ? ` · ${p.phase.objective}` : ""}</p> : null}
        </div>
      </section>

      <section className="nv-card nv-glass nv-level nv-rise" style={{ ["--i" as string]: 1 }}>
        <div className="nv-level-head">
          <span className="nv-level-badge nv-glass is-green">
            <span className="nv-num">{g.level}</span>
          </span>
          <div className="min-w-0 flex-1">
            <p className="nv-h2">Nivel {g.level}</p>
            <p className="nv-sub">
              {fmt(g.points)} puntos · faltan {fmt(g.levelEnd - g.points)} para el nivel {g.level + 1}
            </p>
          </div>
        </div>
        <NvProgress value={(g.points - g.levelStart) / (g.levelEnd - g.levelStart)} />
        <div className="nv-achievements">
          {g.achievements.map((a, i) => (
            <div key={a.id} className={`nv-ach nv-rise ${a.unlocked ? "is-on" : ""}`} style={{ ["--i" as string]: i + 2 }}>
              <span className="nv-ach-bubble">
                <NvIcon name={ACH_ICON[a.id]} size={30} tone={a.unlocked ? "green" : "silver"} />
              </span>
              <span className="nv-ach-title">{a.title}</span>
              <span className="nv-ach-label">{a.label}</span>
            </div>
          ))}
        </div>
        <p className="nv-sub nv-level-note">Ganas puntos por registrar comidas, cerrar días en meta y cumplir la proteína. Nunca se pierden.</p>
      </section>

      <section className="nv-section nv-rise" style={{ ["--i" as string]: 2 }}>
        <h2 className="nv-h2 nv-section-title">Mi perfil</h2>
        <div className="nv-menu nv-glass is-read">
          <MenuRow icon="profile" title="Datos personales" sub={p ? [data.age != null ? `${data.age} años` : null, p.heightCm ? `${p.heightCm} cm` : null, data.health.weight ? `${data.health.weight} kg` : null].filter(Boolean).join(" · ") || "Sin completar" : "Sin completar"} onClick={() => setOpen("datos")} />
          <MenuRow icon="leaf" title="Preferencias alimentarias" sub={p ? `${DIET.find((d) => d.value === p.dietStyle)?.label} · ${p.mealsPerDay} comidas/día${p.avoidFoods.length ? ` · sin ${p.avoidFoods.slice(0, 2).join(", ")}` : ""}` : "—"} onClick={() => setOpen("preferencias")} />
          <MenuRow icon="target" title="Objetivos" sub={data.targets ? `${fmt(data.targets.kcal)} kcal · ${data.targets.protein_g} g proteína` : `Faltan: ${data.missing.join(", ")}`} onClick={() => setOpen("objetivo")} />
          <MenuRow icon="settings" title="Configuración" sub="Movimiento, privacidad y sesión" onClick={() => setOpen("config")} />
        </div>
      </section>

      <section className="nv-card nv-glass is-read nv-rise" style={{ ["--i" as string]: 3 }}>
        <div className="nv-section-head">
          <h2 className="nv-h2">Resumen de mi salud</h2>
          <NvIcon name="heart" size={26} />
        </div>
        <div className="nv-health">
          <HealthItem label="IMC" value={data.health.bmi != null ? data.health.bmi.toLocaleString("es-CO") : "—"} sub={bmiText(data.health.bmi)} />
          <HealthItem label="Grasa corporal" value={data.health.bodyFat != null ? `${data.health.bodyFat.toLocaleString("es-CO")} %` : "—"} sub={data.health.bodyFatMeasured ? "medida" : "estimada"} />
          <HealthItem label="Masa magra" value={data.health.leanMass != null ? `${data.health.leanMass.toLocaleString("es-CO")} kg` : "—"} sub="sin grasa" />
        </div>
        {data.targets ? (
          <p className="nv-sub nv-health-note">
            Tu cuerpo gasta unas {fmt(data.targets.tdee)} kcal al día (en reposo {fmt(data.targets.rmr)}). Agua: {data.targets.water_l.toLocaleString("es-CO")} L.
          </p>
        ) : null}
      </section>

      <section className="nv-card nv-glass is-thick nv-quote nv-rise" style={{ ["--i" as string]: 4 }}>
        <NvLeaves size={34} />
        <p>“No es una dieta, es un estilo de vida.”</p>
      </section>

      <DatosSheet open={open === "datos"} profile={p} onClose={() => setOpen(null)} onSave={save} />
      <PrefsSheet open={open === "preferencias"} profile={p} onClose={() => setOpen(null)} onSave={save} />
      <GoalSheet open={open === "objetivo"} data={data} onClose={() => setOpen(null)} onSave={save} />
      <ConfigSheet open={open === "config"} onClose={() => setOpen(null)} />
    </div>
  );
}

function bmiText(bmi: number | null) {
  if (bmi == null) return "";
  if (bmi < 18.5) return "bajo";
  if (bmi < 25) return "normal";
  if (bmi < 30) return "alto (con músculo puede engañar)";
  return "muy alto";
}

function MenuRow({ icon, title, sub, onClick }: { icon: IconName; title: string; sub: string; onClick: () => void }) {
  return (
    <button type="button" className="nv-menu-row nv-press" onClick={onClick}>
      <span className="nv-menu-ico nv-glass is-thin">
        <NvIcon name={icon} size={24} />
      </span>
      <span className="nv-menu-text">
        <span className="nv-menu-title">{title}</span>
        <span className="nv-menu-sub">{sub}</span>
      </span>
      <NvIcon name="chevronR" size={16} />
    </button>
  );
}

function HealthItem({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="nv-health-item nv-glass is-thin">
      <span className="nv-tile-label">{label}</span>
      <span className="nv-tile-val nv-num">{value}</span>
      <span className="nv-tile-sub">{sub}</span>
    </div>
  );
}

/** Pie de las hojas de edición: guardar con el error del servidor si lo hay. */
function useSaver(onSave: (patch: ProfilePatch) => Promise<void>) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async (patch: ProfilePatch) => {
    setBusy(true);
    setError(null);
    try {
      await onSave(patch);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, run };
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="nv-form-field">
      <span className="nv-form-label">{label}</span>
      {children}
      {hint ? <span className="nv-form-hint">{hint}</span> : null}
    </label>
  );
}

const numOrNull = (s: string) => (s.trim() === "" ? null : Number(s.replace(",", ".")));

function DatosSheet({ open, profile, onClose, onSave }: { open: boolean; profile: NutritionProfile | null; onClose: () => void; onSave: (p: ProfilePatch) => Promise<void> }) {
  const [f, setF] = useState(() => formFrom(profile));
  const { busy, error, run } = useSaver(onSave);
  useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => setF(formFrom(profile)), 0);
      return () => window.clearTimeout(t);
    }
  }, [open, profile]);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <NvSheet
      open={open}
      onClose={onClose}
      title="Datos personales"
      footer={
        <>
          {error ? <p className="nv-chat-error">{error}</p> : null}
          <button
            type="button"
            className="nv-btn nv-glass is-green nv-press nv-block"
            disabled={busy}
            onClick={() =>
              run({
                sex: f.sex,
                birthDate: f.birthDate || null,
                heightCm: numOrNull(f.heightCm),
                weightKg: numOrNull(f.weightKg),
                bodyFatPct: numOrNull(f.bodyFatPct),
                bodyFatEstimate: f.bodyFatEstimate,
                activity: f.activity,
                stepsPerDay: numOrNull(f.stepsPerDay),
                trainingDaysPerWeek: numOrNull(f.trainingDaysPerWeek),
                ...(f.sessionMinutes ? { sessionMinutes: Number(f.sessionMinutes) } : {}),
              })
            }
          >
            {busy ? "Guardando…" : "Guardar"}
          </button>
        </>
      }
    >
      <div className="nv-form">
        <Field label="Sexo" hint="Solo para la fórmula del gasto.">
          <NvSegmented label="Sexo" value={f.sex ?? ("" as never)} onChange={(v) => setF({ ...f, sex: v as "M" | "F" })} options={[{ value: "M", label: "Hombre" }, { value: "F", label: "Mujer" }]} />
        </Field>
        <Field label="Fecha de nacimiento">
          <input className="nv-input nv-glass is-thin" type="date" value={f.birthDate} onChange={set("birthDate")} />
        </Field>
        <div className="nv-form-row">
          <Field label="Estatura (cm)">
            <input className="nv-input nv-glass is-thin" inputMode="numeric" value={f.heightCm} onChange={set("heightCm")} />
          </Field>
          <Field label="Peso (kg)" hint="Si te pesas en Fuerza, se usa ese.">
            <input className="nv-input nv-glass is-thin" inputMode="decimal" value={f.weightKg} onChange={set("weightKg")} />
          </Field>
        </div>
        <Field label="Grasa corporal medida (%)" hint="Déjalo vacío si no te la has medido.">
          <input className="nv-input nv-glass is-thin" inputMode="decimal" value={f.bodyFatPct} onChange={set("bodyFatPct")} />
        </Field>
        <Field label="Grasa a ojo">
          <NvSegmented label="Grasa estimada" value={f.bodyFatEstimate ?? ("" as never)} onChange={(v) => setF({ ...f, bodyFatEstimate: v as "bajo" | "medio" | "alto" })} options={[{ value: "bajo", label: "Baja" }, { value: "medio", label: "Media" }, { value: "alto", label: "Alta" }]} />
        </Field>
        <Field label="Actividad fuera del gym">
          <div className="nv-pills">
            {ACTIVITY.map((a) => (
              <button key={a.value} type="button" className={`nv-pill nv-glass is-thin nv-press ${f.activity === a.value ? "is-on" : ""}`} onClick={() => setF({ ...f, activity: a.value })}>
                {a.label}
              </button>
            ))}
          </div>
        </Field>
        <div className="nv-form-row">
          <Field label="Pasos al día">
            <input className="nv-input nv-glass is-thin" inputMode="numeric" value={f.stepsPerDay} onChange={set("stepsPerDay")} />
          </Field>
          <Field label="Días de pesas">
            <input className="nv-input nv-glass is-thin" inputMode="numeric" value={f.trainingDaysPerWeek} onChange={set("trainingDaysPerWeek")} />
          </Field>
        </div>
        <Field label="Minutos por sesión">
          <input className="nv-input nv-glass is-thin" inputMode="numeric" value={f.sessionMinutes} onChange={set("sessionMinutes")} />
        </Field>
      </div>
    </NvSheet>
  );
}

function formFrom(p: NutritionProfile | null) {
  const s = (v: number | null | undefined) => (v == null ? "" : String(v));
  return {
    sex: p?.sex ?? null,
    birthDate: p?.birthDate ?? "",
    heightCm: s(p?.heightCm),
    weightKg: s(p?.weightKg),
    bodyFatPct: s(p?.bodyFatPct),
    bodyFatEstimate: p?.bodyFatEstimate ?? null,
    activity: p?.activity ?? null,
    stepsPerDay: s(p?.stepsPerDay),
    trainingDaysPerWeek: s(p?.trainingDaysPerWeek),
    sessionMinutes: s(p?.sessionMinutes),
  };
}

function PrefsSheet({ open, profile, onClose, onSave }: { open: boolean; profile: NutritionProfile | null; onClose: () => void; onSave: (p: ProfilePatch) => Promise<void> }) {
  const [diet, setDiet] = useState<NutritionProfile["dietStyle"]>(profile?.dietStyle ?? "omnivoro");
  const [avoid, setAvoid] = useState((profile?.avoidFoods ?? []).join(", "));
  const [meals, setMeals] = useState(profile?.mealsPerDay ?? 4);
  const { busy, error, run } = useSaver(onSave);
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      setDiet(profile?.dietStyle ?? "omnivoro");
      setAvoid((profile?.avoidFoods ?? []).join(", "));
      setMeals(profile?.mealsPerDay ?? 4);
    }, 0);
    return () => window.clearTimeout(t);
  }, [open, profile]);
  return (
    <NvSheet
      open={open}
      onClose={onClose}
      title="Preferencias alimentarias"
      footer={
        <>
          {error ? <p className="nv-chat-error">{error}</p> : null}
          <button type="button" className="nv-btn nv-glass is-green nv-press nv-block" disabled={busy} onClick={() => run({ dietStyle: diet, avoidFoods: avoid.split(",").map((x) => x.trim()).filter(Boolean), mealsPerDay: meals })}>
            {busy ? "Guardando…" : "Guardar"}
          </button>
        </>
      }
    >
      <div className="nv-form">
        <Field label="Estilo">
          <div className="nv-pills">
            {DIET.map((d) => (
              <button key={d.value} type="button" className={`nv-pill nv-glass is-thin nv-press ${diet === d.value ? "is-on" : ""}`} onClick={() => setDiet(d.value)}>
                {d.label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Lo que no comes" hint="Separado por comas. Ej.: hígado, maní">
          <input className="nv-input nv-glass is-thin" value={avoid} onChange={(e) => setAvoid(e.target.value)} />
        </Field>
        <Field label="Comidas al día">
          <div className="nv-stepper nv-glass is-thin">
            <button type="button" className="nv-press" onClick={() => setMeals((m) => Math.max(1, m - 1))} aria-label="Menos">
              −
            </button>
            <span className="nv-num">{meals}</span>
            <button type="button" className="nv-press" onClick={() => setMeals((m) => Math.min(7, m + 1))} aria-label="Más">
              +
            </button>
          </div>
        </Field>
      </div>
    </NvSheet>
  );
}

/** Cambiar objetivo con vista previa en vivo (kcal, proteína y kg por semana). */
function GoalSheet({ open, data, onClose, onSave }: { open: boolean; data: ProfileData; onClose: () => void; onSave: (p: ProfilePatch) => Promise<void> }) {
  const current = data.profile?.phase;
  const [type, setType] = useState<PhaseType>(current?.type ?? "deficit");
  const [rate, setRate] = useState(current?.ratePctPerWeek ?? PHASE_RATES.deficit.default);
  const [objective, setObjective] = useState(current?.objective ?? "");
  const [preview, setPreview] = useState<{ kcal: number; protein: number; kgPerWeek: number } | { error: string } | null>(null);
  const { busy, error, run } = useSaver(onSave);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      setType(current?.type ?? "deficit");
      setRate(current?.ratePctPerWeek ?? PHASE_RATES[current?.type ?? "deficit"].default);
      setObjective(current?.objective ?? "");
    }, 0);
    return () => window.clearTimeout(t);
  }, [open, current]);

  const patch: ProfilePatch = { phase: { type, ratePctPerWeek: PHASE_RATES[type].max === 0 ? 0 : rate, objective } };
  const key = JSON.stringify(patch);
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const t = window.setTimeout(async () => {
      try {
        const r = await nvSend<{ ok: boolean; targets?: { kcal: number; protein_g: number }; kgPerWeek?: number; errors?: string[] }>("/api/comidas/profile/preview", "POST", JSON.parse(key));
        if (cancelled) return;
        setPreview(r.ok && r.targets ? { kcal: r.targets.kcal, protein: r.targets.protein_g, kgPerWeek: r.kgPerWeek ?? 0 } : { error: r.errors?.join(" ") ?? "No se pudo calcular" });
      } catch (e) {
        if (!cancelled) setPreview({ error: e instanceof Error ? e.message : "No se pudo calcular" });
      }
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [open, key]);

  const rates = PHASE_RATES[type];
  return (
    <NvSheet
      open={open}
      onClose={onClose}
      title="Tu objetivo"
      footer={
        <>
          {error ? <p className="nv-chat-error">{error}</p> : null}
          <button type="button" className="nv-btn nv-glass is-green nv-press nv-block" disabled={busy} onClick={() => run(patch)}>
            {busy ? "Guardando…" : "Guardar objetivo"}
          </button>
        </>
      }
    >
      <div className="nv-form">
        <div className="nv-goals">
          {(Object.keys(PHASE_LABEL) as PhaseType[]).map((t) => (
            <button
              key={t}
              type="button"
              className={`nv-goal nv-glass nv-press ${type === t ? "is-on" : "is-thin"}`}
              onClick={() => {
                setType(t);
                setRate(PHASE_RATES[t].default);
              }}
            >
              <NvIcon name={t === "deficit" ? "flame" : t === "volumen" ? "protein" : t === "recomposicion" ? "sparkle" : "target"} size={28} tone={type === t ? "green" : "silver"} />
              <span>{PHASE_LABEL[t]}</span>
            </button>
          ))}
        </div>
        {rates.options.length ? (
          <Field label="Ritmo">
            <div className="nv-pills">
              {rates.options.map((o) => (
                <button key={o.pct} type="button" className={`nv-pill nv-glass is-thin nv-press ${rate === o.pct ? "is-on" : ""}`} onClick={() => setRate(o.pct)}>
                  {o.label} · {o.pct.toLocaleString("es-CO")} %/sem
                </button>
              ))}
            </div>
          </Field>
        ) : null}
        <Field label="¿Para qué?" hint="Opcional. Ej.: bajar grasa del abdomen sin perder fuerza">
          <input className="nv-input nv-glass is-thin" value={objective} onChange={(e) => setObjective(e.target.value)} />
        </Field>
        <div className="nv-preview nv-glass is-thick" aria-live="polite">
          <p className="nv-kicker">Vista previa</p>
          {!preview ? (
            <p className="nv-sub">Calculando…</p>
          ) : "error" in preview ? (
            <p className="nv-sub">{preview.error}</p>
          ) : (
            <div className="nv-preview-grid">
              <span>
                <b className="nv-num">{fmt(preview.kcal)}</b>
                kcal/día
              </span>
              <span>
                <b className="nv-num">{preview.protein}</b>g proteína
              </span>
              <span>
                <b className="nv-num">{preview.kgPerWeek ? `${type === "deficit" ? "−" : "+"}${preview.kgPerWeek.toLocaleString("es-CO")}` : "0"}</b>
                kg/semana
              </span>
            </div>
          )}
        </div>
      </div>
    </NvSheet>
  );
}

function ConfigSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [calm, setCalm] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        setCalm(localStorage.getItem(CALM_KEY) === "1");
      } catch {
        // sin almacenamiento
      }
    }, 0);
    return () => window.clearTimeout(t);
  }, [open]);
  const toggle = () => {
    const next = !calm;
    setCalm(next);
    document.documentElement.classList.toggle("nv-calm", next);
    try {
      localStorage.setItem(CALM_KEY, next ? "1" : "0");
    } catch {
      // sin almacenamiento
    }
  };
  return (
    <NvSheet open={open} onClose={onClose} title="Configuración">
      <div className="nv-menu nv-glass is-thin">
        <button type="button" className="nv-menu-row nv-press" onClick={toggle} role="switch" aria-checked={calm}>
          <span className="nv-menu-text">
            <span className="nv-menu-title">Reducir movimiento</span>
            <span className="nv-menu-sub">Menos animaciones y vidrio más sólido</span>
          </span>
          <span className={`nv-switch-toggle ${calm ? "is-on" : ""}`}>
            <span />
          </span>
        </button>
        <div className="nv-menu-row">
          <span className="nv-menu-text">
            <span className="nv-menu-title">Unidades</span>
            <span className="nv-menu-sub">Kilos, centímetros, gramos y kcal</span>
          </span>
        </div>
        <div className="nv-menu-row">
          <NvIcon name="shield" size={26} />
          <span className="nv-menu-text">
            <span className="nv-menu-title">Privacidad</span>
            <span className="nv-menu-sub">Tus comidas solo se ven con tu PIN. No pedimos ubicación ni fotos.</span>
          </span>
        </div>
        <button
          type="button"
          className="nv-menu-row nv-press"
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            clearSession();
            router.push("/login");
            router.refresh();
          }}
        >
          <NvIcon name="logout" size={26} />
          <span className="nv-menu-text">
            <span className="nv-menu-title">Cerrar sesión</span>
          </span>
        </button>
      </div>
    </NvSheet>
  );
}

function ProfileSkeleton() {
  return (
    <div className="nv-stack">
      <NvSkeleton h={120} />
      <NvSkeleton h={220} />
      <NvSkeleton h={260} />
    </div>
  );
}
