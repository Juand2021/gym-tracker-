"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DAY_OPTIONS, getDayLabel } from "@/lib/routines";
import { MuscleGroupIcon } from "@/components/MuscleGroupIcon";
import { Sparkline } from "@/components/ui/Sparkline";
import { formatShortDate } from "@/lib/exercise-history";
import { dayStats, latestWorkout, weeklySets, weightTrend } from "@/lib/home-summary";
import { calculateUserStreakSummary } from "@/lib/user-streak";
import type { BodyWeightEntry, Workout } from "@/lib/types";
import { useWorkoutDraft } from "@/lib/workout-draft";

function greetingFor(date: Date): string {
  const h = date.getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

const KPI_ICONS = {
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </>
  ),
  flame: <path d="M12 22c4 0 7-3 7-7 0-4-3-6-4-10-2 2-3 4-3 6-1-1-2-2-2-4-2 2-5 5-5 8 0 4 3 7 7 7z" />,
  stack: <path d="M12 3l9 5-9 5-9-5zM3 13l9 5 9-5" />,
  dumbbell: <path d="M6 7v10M18 7v10M3 10v4M21 10v4M6 12h12" />,
};

function SectionHeader({ title, aside }: { title: string; aside?: string }) {
  return (
    <div className="hm-section-head">
      <h2>{title}</h2>
      {aside ? <span>{aside}</span> : null}
    </div>
  );
}

export default function HomePage() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [weights, setWeights] = useState<BodyWeightEntry[]>([]);
  const [name, setName] = useState<string | null>(null);
  const [now, setNow] = useState<Date | null>(null);
  const draft = useWorkoutDraft();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [wRes, bRes, meRes] = await Promise.all([
          fetch("/api/workouts"),
          fetch("/api/body-weight"),
          fetch("/api/auth/me"),
        ]);
        const wData = (await wRes.json()) as { workouts?: Workout[]; error?: string };
        const bData = (await bRes.json()) as { entries?: BodyWeightEntry[]; error?: string };
        const me = meRes.ok
          ? ((await meRes.json()) as { profile?: { displayName?: string } })
          : null;
        if (!active) return;
        if (!wRes.ok) throw new Error(wData.error || "Error al cargar entrenos");
        if (!bRes.ok) throw new Error(bData.error || "Error al cargar peso");
        setWorkouts(wData.workouts ?? []);
        setWeights(bData.entries ?? []);
        setName(me?.profile?.displayName ?? null);
        setNow(new Date());
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Error");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  const streak = calculateUserStreakSummary(workouts, now ?? undefined);
  const perDay = dayStats(workouts);
  const lastWorkout = latestWorkout(workouts);
  const weekly = weeklySets(workouts, now ?? undefined, 6);
  const weeklyMax = Math.max(1, ...weekly);
  const trend = weightTrend(weights);
  const uniqueExercises = new Set(workouts.flatMap((w) => w.sets.map((s) => s.exercise))).size;
  const goalPct = Math.min(1, streak.currentWeekCount / streak.weeklyGoal);
  const RING = 2 * Math.PI * 26;
  const hasDraft = Boolean(draft && (draft.dayType || (draft.sets && draft.sets.length > 0)));

  return (
    <div className="hm">
      {/* Portada */}
      <section className="glass-panel hm-hero">
        <span className="hm-hero-glow" aria-hidden="true" />
        <div className="hm-hero-top">
          <div className="min-w-0">
            <p className="hm-kicker">
              {now ? greetingFor(now) : "Hoy"}
              {name ? `, ${name}` : ""}
            </p>
            <h1 className="page-title mt-1">
              A entrenar<span className="text-[var(--accent)]">.</span>
            </h1>
          </div>

          <div className="hm-goal" aria-label={`${streak.currentWeekCount} de ${streak.weeklyGoal} días esta semana`}>
            <svg viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="26" className="hm-goal-track" />
              <circle
                cx="32"
                cy="32"
                r="26"
                className="hm-goal-fill"
                strokeDasharray={RING}
                strokeDashoffset={RING * (1 - goalPct)}
                transform="rotate(-90 32 32)"
              />
            </svg>
            <span className="hm-goal-value">
              {streak.currentWeekCount}
              <small>/{streak.weeklyGoal}</small>
            </span>
            <span className="hm-goal-label">semana</span>
          </div>
        </div>

        <div className="hm-week" role="list" aria-label="Días entrenados esta semana">
          {(now ? streak.daysOfWeek : []).map((d) => (
            <span
              key={d.dateIso}
              role="listitem"
              className={`hm-week-day ${d.isTrained ? "is-trained" : ""} ${d.isToday ? "is-today" : ""}`}
              title={`${d.dayName}${d.isTrained ? ": entrenado" : ""}`}
            >
              {d.dayLetter}
              <i aria-hidden="true" />
            </span>
          ))}
        </div>

        {now ? <p className="hm-motiv">{streak.motivationalMessage}</p> : null}
      </section>

      {hasDraft && draft ? (
        <Link href="/entreno" className="glass-panel hm-draft">
          <span className="hm-live-dot" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="hm-draft-kicker">Entreno en curso</span>
            <span className="hm-draft-title">
              {draft.dayType ? getDayLabel(draft.dayType) : "Sesión"}
              {draft.armFocus ? ` · ${draft.armFocus === "biceps" ? "Bíceps" : "Tríceps"}` : ""}
            </span>
            <span className="hm-draft-meta">{draft.sets?.length ?? 0} series en tu borrador</span>
          </span>
          <span className="hm-draft-go">Continuar →</span>
        </Link>
      ) : null}

      {/* Días */}
      <SectionHeader title="Elige tu día" />
      <section className="hm-days">
        {DAY_OPTIONS.map((day, i) => {
          const stat = perDay[day.id];
          return (
            <Link
              key={day.id}
              href={`/entreno?day=${day.id}`}
              className="glass-panel hm-day"
              style={{ animationDelay: `${i * 55}ms` }}
            >
              <span className="hm-day-glow" aria-hidden="true" />
              <span className="hm-day-top">
                <span className="hm-day-icon">
                  <MuscleGroupIcon group={day.id} className="h-[4.1rem] w-[4.1rem]" />
                </span>
              </span>
              <span className="hm-day-label">{day.label}</span>
              <span className="hm-day-sub">{day.subtitle}</span>
              <span className="hm-day-meta">
                <span>
                  <b>{stat.sessions}</b> {stat.sessions === 1 ? "sesión" : "sesiones"}
                </span>
                <span>{stat.lastDate ? formatShortDate(stat.lastDate) : "Sin registros"}</span>
              </span>
            </Link>
          );
        })}
      </section>

      {loading ? <div className="glass-panel hm-note">Cargando resumen…</div> : null}
      {error ? <div className="glass-panel hm-note is-error">{error}</div> : null}

      {!loading && !error ? (
        <>
          <SectionHeader title="Tu progreso" />
          <section className="hm-kpis">
            {(
              [
                { label: "Sesiones", value: workouts.length, hint: "en total", icon: "calendar" },
                { label: "Racha", value: streak.consecutiveWeeks, hint: streak.consecutiveWeeks === 1 ? "semana" : "semanas", icon: "flame" },
                { label: "Series", value: weekly[weekly.length - 1], hint: "esta semana", icon: "stack" },
                { label: "Ejercicios", value: uniqueExercises, hint: "distintos", icon: "dumbbell" },
              ] as const
            ).map((k) => (
              <div key={k.label} className="glass-panel hm-kpi">
                <span className="hm-kpi-top">
                  <span className="hm-kpi-label">{k.label}</span>
                  <span className="hm-kpi-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {KPI_ICONS[k.icon]}
                    </svg>
                  </span>
                </span>
                <span className="hm-kpi-value">{k.value}</span>
                <span className="hm-kpi-hint">{k.hint}</span>
              </div>
            ))}
          </section>

          <section className="glass-panel hm-volume">
            <div className="hm-card-head">
              <span>Series por semana</span>
              <span className="hm-card-aside">últimas 6</span>
            </div>
            {weekly.every((v) => v === 0) ? (
              <p className="hm-bars-empty">Sin series en las últimas 6 semanas. ¡Hoy es buen día para empezar!</p>
            ) : null}
            <div className="hm-bars">
              {weekly.map((v, i) => (
                <div key={i} className={`hm-bar ${i === weekly.length - 1 ? "is-current" : ""}`}>
                  <span className="hm-bar-value">{v || ""}</span>
                  <span className="hm-bar-track">
                    <span className="hm-bar-fill" style={{ height: `${(v / weeklyMax) * 100}%` }} />
                  </span>
                  <span className="hm-bar-label">{i === weekly.length - 1 ? "Esta" : `-${weekly.length - 1 - i}`}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="glass-panel hm-last">
            <div className="hm-card-head">
              <span>Último entreno</span>
              {lastWorkout ? (
                <Link href={`/historial/${lastWorkout.id}`} className="hm-card-link">
                  Ver →
                </Link>
              ) : null}
            </div>
            {lastWorkout ? (
              <>
                <div className="hm-last-row">
                  {lastWorkout.dayType ? (
                    <span className="hm-chip is-day">{getDayLabel(lastWorkout.dayType)}</span>
                  ) : null}
                  <span className="hm-last-date">{formatShortDate(lastWorkout.date)}</span>
                  <span className="hm-last-sets">{lastWorkout.sets.length} series</span>
                </div>
                <div className="hm-chip-row">
                  {[...new Set(lastWorkout.sets.map((s) => s.exercise))].slice(0, 5).map((ex) => (
                    <span key={ex} className="hm-chip">
                      {ex}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <p className="hm-empty">Aún no hay sesiones. ¡La primera es hoy!</p>
            )}
          </section>

          <section className="glass-panel hm-weight">
            <div className="min-w-0">
              <div className="hm-card-head">
                <span>Peso corporal</span>
              </div>
              {trend.latest ? (
                <>
                  <p className="hm-weight-value">
                    {trend.latest.weightKg}
                    <small> kg</small>
                  </p>
                  <p className="hm-weight-meta">
                    {trend.delta != null ? (
                      <span className={`hm-delta ${trend.delta > 0 ? "is-up" : trend.delta < 0 ? "is-down" : ""}`}>
                        {trend.delta > 0 ? "▲" : trend.delta < 0 ? "▼" : "="} {Math.abs(trend.delta)} kg
                      </span>
                    ) : null}
                    <span>{formatShortDate(trend.latest.date)}</span>
                  </p>
                </>
              ) : (
                <p className="hm-empty">Sin registros aún.</p>
              )}
            </div>
            <Sparkline values={trend.series} />
          </section>
        </>
      ) : null}

      {/* Atajos */}
      <SectionHeader title="Atajos" />
      <section className="hm-shortcuts">
        <Link href="/ia" className="glass-panel hm-shortcut">
          <span className="ia-orb hm-shortcut-orb" aria-hidden="true" />
          <span className="hm-shortcut-title">Coach IA</span>
          <span className="hm-shortcut-text">Pregunta cómo va tu progreso y qué ajustar.</span>
        </Link>
        <Link href="/metricas" className="glass-panel hm-shortcut">
          <span className="hm-shortcut-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18" />
              <path d="M7 15l4-4 3 3 5-6" />
            </svg>
          </span>
          <span className="hm-shortcut-title">Métricas</span>
          <span className="hm-shortcut-text">Evolución de fuerza y peso corporal.</span>
        </Link>
      </section>
    </div>
  );
}
