"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MuscleGroupIcon } from "@/components/MuscleGroupIcon";
import { PageHero } from "@/components/ui/PageHero";
import { dateParts, groupByMonth } from "@/lib/history-summary";
import { DAY_OPTIONS, getDayLabel, type DayType } from "@/lib/routines";
import type { Workout } from "@/lib/types";

type Filter = "todos" | DayType;

export default function HistorialPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [filter, setFilter] = useState<Filter>("todos");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/workouts");
        const data = (await res.json()) as {
          workouts?: Workout[];
          error?: string;
        };
        if (!res.ok) throw new Error(data.error || "Error");
        setWorkouts(data.workouts ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const totalSets = useMemo(() => workouts.reduce((sum, w) => sum + w.sets.length, 0), [workouts]);
  const visible = useMemo(
    () => (filter === "todos" ? workouts : workouts.filter((w) => w.dayType === filter)),
    [workouts, filter],
  );
  const groups = useMemo(() => groupByMonth(visible), [visible]);
  const months = useMemo(() => groupByMonth(workouts).length, [workouts]);

  return (
    <div className="pg">
      <PageHero
        kicker="Registro"
        title="Historial"
        description="Todas tus sesiones guardadas, de la más reciente a la más antigua."
        stats={
          loading || error
            ? undefined
            : [
                { label: "Sesiones", value: workouts.length },
                { label: "Series", value: totalSets },
                { label: months === 1 ? "Mes" : "Meses", value: months },
              ]
        }
      />

      {/* Filtro por día */}
      <div className="pg-filters" role="tablist" aria-label="Filtrar por día">
        {([{ id: "todos", label: "Todos" }, ...DAY_OPTIONS] as Array<{ id: Filter; label: string }>).map((opt) => (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={filter === opt.id}
            className={`pg-filter ${filter === opt.id ? "is-active" : ""}`}
            onClick={() => setFilter(opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? <div className="glass-panel hm-note">Cargando…</div> : null}
      {error ? <div className="glass-panel hm-note is-error">{error}</div> : null}

      {groups.map((group) => (
        <section key={group.key} className="pg-group">
          <div className="hm-section-head">
            <h2>{group.label}</h2>
            <span>
              {group.items.length} {group.items.length === 1 ? "sesión" : "sesiones"}
            </span>
          </div>

          {group.items.map((workout, i) => {
            const exercises = [...new Set(workout.sets.map((s) => s.exercise))];
            const parts = dateParts(workout.date);
            const isDemo = workout.notes === "demo";
            return (
              <Link
                key={workout.id}
                href={`/historial/${workout.id}`}
                className="glass-panel hs-card"
                style={{ animationDelay: `${Math.min(i, 6) * 45}ms` }}
              >
                <span className="hs-date">
                  <span className="hs-date-weekday">{parts?.weekday ?? ""}</span>
                  <span className="hs-date-day">{parts?.day ?? "–"}</span>
                  <span className="hs-date-month">{parts?.monthAbbr ?? ""}</span>
                </span>

                <span className="hs-body">
                  <span className="hs-top">
                    <span className="hs-day">
                      {workout.dayType ? getDayLabel(workout.dayType) : "Sesión"}
                      {workout.armFocus ? (
                        <small> · {workout.armFocus === "biceps" ? "Bíceps" : "Tríceps"}</small>
                      ) : null}
                    </span>
                    {workout.dayType ? (
                      <span className="hs-icon" aria-hidden="true">
                        <MuscleGroupIcon group={workout.dayType} className="h-9 w-9" />
                      </span>
                    ) : null}
                  </span>

                  <span className="hs-meta">
                    <b>{workout.sets.length}</b> series · <b>{exercises.length}</b>{" "}
                    {exercises.length === 1 ? "ejercicio" : "ejercicios"}
                    {isDemo ? <span className="hs-demo">Demo</span> : null}
                  </span>

                  <span className="hm-chip-row">
                    {exercises.slice(0, 3).map((ex) => (
                      <span key={ex} className="hm-chip">
                        {ex}
                      </span>
                    ))}
                    {exercises.length > 3 ? <span className="hm-chip is-more">+{exercises.length - 3}</span> : null}
                  </span>

                  {workout.notes && !isDemo ? <span className="hs-notes">“{workout.notes}”</span> : null}
                </span>

                <span className="hs-arrow" aria-hidden="true">
                  →
                </span>
              </Link>
            );
          })}
        </section>
      ))}

      {!loading && !error && visible.length === 0 ? (
        <div className="glass-panel hm-note">
          {workouts.length === 0
            ? "Aún no hay entrenamientos. Tu primera sesión aparecerá aquí."
            : "No hay sesiones de ese día todavía."}
        </div>
      ) : null}
    </div>
  );
}
