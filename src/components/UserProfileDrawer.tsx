"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSettings } from "@/context/AppSettingsContext";
import {
  calculateUserStreakSummary,
  type UserStreakSummary,
  type BadgeIconType,
} from "@/lib/user-streak";
import type { BodyWeightEntry, Workout } from "@/lib/types";

interface UserProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  displayName: string | null;
}

/** Renderizador de insignias vectoriales SVG de alta precisión */
function renderBadgeIcon(type: BadgeIconType) {
  switch (type) {
    case "bolt":
      return (
        <svg
          className="h-3.5 w-3.5 text-[var(--accent)]"
          viewBox="0 0 24 24"
          fill="currentColor"
          stroke="none"
        >
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );
    case "shield":
      return (
        <svg
          className="h-3.5 w-3.5 text-[var(--accent)]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    case "swords":
      return (
        <svg
          className="h-3.5 w-3.5 text-[var(--accent)]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
          <line x1="13" y1="19" x2="19" y2="13" />
          <line x1="16" y1="16" x2="20" y2="20" />
          <line x1="19" y1="21" x2="21" y2="19" />
          <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5" />
        </svg>
      );
    case "crown":
      return (
        <svg
          className="h-3.5 w-3.5 text-[var(--accent)]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
        </svg>
      );
    case "trophy":
      return (
        <svg
          className="h-3.5 w-3.5 text-[var(--accent)]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.45 1-1 1H8v4h8v-4h-1c-.55 0-1-.45-1-1v-2.34" />
          <path d="M6 4h12v7a6 6 0 0 1-12 0V4z" />
        </svg>
      );
  }
}

export function UserProfileDrawer({
  isOpen,
  onClose,
  displayName,
}: UserProfileDrawerProps) {
  const router = useRouter();
  const {
    soundEnabled,
    hapticsEnabled,
    wakeLockEnabled,
    userAge,
    defaultRestSeconds,
    toggleSound,
    toggleHaptics,
    toggleWakeLock,
    setUserAge,
    setDefaultRestSeconds,
  } = useAppSettings();

  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [latestWeight, setLatestWeight] = useState<number | null>(null);
  const [latestWeightDate, setLatestWeightDate] = useState<string | null>(null);
  const [isEditingAge, setIsEditingAge] = useState(false);
  const [tempAge, setTempAge] = useState(String(userAge));

  // Cargar entrenamientos y peso corporal para el cálculo de estadísticas y racha
  useEffect(() => {
    if (!isOpen) return;

    let active = true;

    Promise.all([
      fetch("/api/workouts")
        .then((res) => (res.ok ? res.json() : { workouts: [] }))
        .then((data) => (data.workouts ?? []) as Workout[])
        .catch(() => [] as Workout[]),
      fetch("/api/body-weight")
        .then((res) => (res.ok ? res.json() : { entries: [] }))
        .then((data) => (data.entries ?? []) as BodyWeightEntry[])
        .catch(() => [] as BodyWeightEntry[]),
    ])
      .then(([loadedWorkouts, weightEntries]) => {
        if (!active) return;
        setWorkouts(loadedWorkouts);
        if (weightEntries.length > 0) {
          const sorted = [...weightEntries].sort((a, b) =>
            b.date.localeCompare(a.date),
          );
          setLatestWeight(sorted[0]?.weightKg ?? null);
          setLatestWeightDate(sorted[0]?.date ?? null);
        }
      })
      .finally(() => {});

    return () => {
      active = false;
    };
  }, [isOpen]);

  const streakSummary: UserStreakSummary = calculateUserStreakSummary(
    workouts,
    new Date(),
    4,
  );

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    onClose();
    router.push("/login");
    router.refresh();
  }

  if (!isOpen) return null;

  const goalPct = Math.min(1, streakSummary.currentWeekCount / streakSummary.weeklyGoal);
  const RING = 2 * Math.PI * 26;

  const settings = [
    {
      title: "Mantener pantalla activa",
      text: "Evita que el celular se suspenda en los descansos",
      enabled: wakeLockEnabled,
      toggle: toggleWakeLock,
      icon: (
        <>
          <rect width="18" height="12" x="3" y="4" rx="2" />
          <line x1="2" x2="22" y1="20" y2="20" />
        </>
      ),
    },
    {
      title: "Sonido del cronómetro",
      text: "Alarma melódica y clics de la rueda",
      enabled: soundEnabled,
      toggle: toggleSound,
      icon: (
        <>
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </>
      ),
    },
    {
      title: "Vibración háptica",
      text: "Solo en Android: iPhone no permite vibrar desde la web",
      enabled: hapticsEnabled,
      toggle: toggleHaptics,
      icon: (
        <>
          <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
          <path d="M12 18h.01" />
          <path d="M1 9l2 3-2 3" />
          <path d="M23 9l-2 3 2 3" />
        </>
      ),
    },
  ];

  return (
    <div className="pf-overlay" onClick={onClose}>
      <div
        className="pf-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Perfil y configuraciones"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera fija (respeta la isla dinámica) */}
        <div className="pf-head">
          <div>
            <p className="hm-kicker">Mi cuenta</p>
            <h2 className="pf-title">Perfil y ajustes</h2>
          </div>
          <button type="button" onClick={onClose} className="rt-icon-btn" aria-label="Cerrar perfil">
            ✕
          </button>
        </div>

        <div className="pg pf-body">
          {/* Identidad y datos generales */}
          <section className="glass-panel pg-hero">
            <span className="pg-hero-glow" aria-hidden="true" />
            <div className="pf-id">
              <span className="hd-avatar pf-avatar" aria-hidden="true">
                {displayName ? displayName.charAt(0).toUpperCase() : "U"}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="pf-name">{displayName || "Usuario"}</h3>
                <p className="pf-role">
                  Atleta de fuerza <span className="pf-active">Activo</span>
                </p>
              </div>
            </div>

            <div className="pg-hero-stats" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
              <div className="pg-stat">
                <span className="pg-stat-value">{latestWeight ?? "—"}</span>
                <span className="pg-stat-label">Peso (kg)</span>
                <span className="pg-stat-hint">{latestWeightDate ? latestWeightDate.slice(5) : "Sin registro"}</span>
              </div>

              <div
                className="pg-stat pf-age"
                role="button"
                tabIndex={0}
                onClick={() => setIsEditingAge(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setIsEditingAge(true);
                }}
                title="Toca para cambiar la edad"
              >
                {isEditingAge ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const num = Number(tempAge);
                      if (num > 0 && num < 120) setUserAge(num);
                      setIsEditingAge(false);
                    }}
                  >
                    <input
                      type="number"
                      inputMode="numeric"
                      value={tempAge}
                      onChange={(e) => setTempAge(e.target.value)}
                      onBlur={() => {
                        const num = Number(tempAge);
                        if (num > 0 && num < 120) setUserAge(num);
                        setIsEditingAge(false);
                      }}
                      className="pf-age-input"
                      aria-label="Edad"
                      autoFocus
                    />
                  </form>
                ) : (
                  <span className="pg-stat-value">{userAge}</span>
                )}
                <span className="pg-stat-label">Edad</span>
                <span className="pg-stat-hint pf-edit">Editar</span>
              </div>

              <div className="pg-stat">
                <span className="pg-stat-value">{workouts.length}</span>
                <span className="pg-stat-label">Sesiones</span>
                <span className="pg-stat-hint">Histórico</span>
              </div>
            </div>
          </section>

          {/* Racha */}
          <section className="glass-panel pf-card">
            <div className="hm-card-head">
              <span>Racha de gimnasio</span>
              <span className="pf-badge">
                {renderBadgeIcon(streakSummary.badge.iconType)}
                {streakSummary.badge.title}
              </span>
            </div>

            <div className="pf-streak">
              <div className="min-w-0">
                <p className="pf-streak-value">
                  {streakSummary.consecutiveWeeks}
                  <small>{streakSummary.consecutiveWeeks === 1 ? " semana activa" : " semanas activas"}</small>
                </p>
                <p className="pf-streak-meta">Meta: {streakSummary.weeklyGoal} entrenos por semana</p>
              </div>
              <div
                className="hm-goal"
                aria-label={`${streakSummary.currentWeekCount} de ${streakSummary.weeklyGoal} días esta semana`}
              >
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
                  {streakSummary.currentWeekCount}
                  <small>/{streakSummary.weeklyGoal}</small>
                </span>
                <span className="hm-goal-label">semana</span>
              </div>
            </div>

            <div className="hm-week" role="list" aria-label="Días entrenados esta semana">
              {streakSummary.daysOfWeek.map((day) => (
                <span
                  key={day.dateIso}
                  role="listitem"
                  className={`hm-week-day ${day.isTrained ? "is-trained" : ""} ${day.isToday ? "is-today" : ""}`}
                  title={`${day.dayName}${day.isTrained ? ": entrenado" : ""}`}
                >
                  {day.dayLetter}
                  <i aria-hidden="true" />
                </span>
              ))}
            </div>

            <p className="hm-motiv">{streakSummary.motivationalMessage}</p>
          </section>

          {/* Ajustes de la app */}
          <section className="glass-panel pf-card">
            <div className="hm-card-head">
              <span>Ajustes de la app</span>
            </div>

            {settings.map((item) => (
              <div key={item.title} className="pf-row">
                <span className="pf-row-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {item.icon}
                  </svg>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="pf-row-title">{item.title}</p>
                  <p className="pf-row-text">{item.text}</p>
                </div>
                <button
                  type="button"
                  onClick={item.toggle}
                  className={`pf-switch ${item.enabled ? "is-on" : ""}`}
                  role="switch"
                  aria-checked={item.enabled}
                  aria-label={item.title}
                >
                  <span />
                </button>
              </div>
            ))}

            <div className="pf-rest">
              <div className="pf-row">
                <span className="pf-row-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="13" r="8" />
                    <path d="M12 9v4l2 2" />
                    <path d="M10 2h4" />
                  </svg>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="pf-row-title">Descanso predeterminado</p>
                  <p className="pf-row-text">Tiempo sugerido al abrir el cronómetro</p>
                </div>
              </div>
              <div className="mt-range">
                {[45, 60, 90, 120, 180].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setDefaultRestSeconds(sec)}
                    className={`mt-range-btn ${defaultRestSeconds === sec ? "is-active" : ""}`}
                  >
                    {sec < 60 ? `${sec}s` : `${sec / 60}m`}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Pie con cerrar sesión */}
        <div className="pf-foot">
          <button type="button" onClick={handleLogout} className="pg-pill is-danger pf-logout">
            Cerrar sesión
          </button>
          <p className="pf-version">Fuerza Gym Tracker · v1.3.0</p>
        </div>
      </div>
    </div>
  );
}
