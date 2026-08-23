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

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop con desenfoque líquido */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel lateral / Sheet */}
      <div
        className="relative z-10 flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-[var(--glass-stroke)] bg-[var(--surface)] text-[var(--ink)] shadow-2xl backdrop-blur-2xl animate-slide-in-right"
        role="dialog"
        aria-modal="true"
        aria-label="Perfil y configuraciones"
      >
        {/* Header del Panel */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[var(--glass-stroke)] bg-[var(--surface)]/95 px-5 py-4 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white border border-white/20 shadow-sm">
              <svg
                className="h-4 w-4 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            <div>
              <p className="label mb-0 text-[10px] font-bold tracking-[0.14em] text-[var(--accent)]">
                MI CUENTA
              </p>
              <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-[0.04em]">
                Perfil y Ajustes
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="stack-picker-close flex h-8 w-8 items-center justify-center rounded-full text-sm transition-transform active:scale-95"
            aria-label="Cerrar perfil"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-5 p-5">
          {/* Tarjeta de Identidad y Datos Generales */}
          <div className="card card-glow relative overflow-hidden p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-[var(--accent)] to-[#ff7b39] text-2xl font-black text-white shadow-[0_0_20px_rgba(255,77,26,0.45)] border border-white/20">
                {displayName ? displayName.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-[family-name:var(--font-display)] text-3xl tracking-[0.04em] text-white truncate">
                    {displayName || "Usuario"}
                  </h3>
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                    Activo
                  </span>
                </div>
                <p className="text-xs text-[var(--muted)]">
                  Atleta de Fuerza
                </p>
              </div>
            </div>

            {/* Grid de Métricas Personales */}
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[var(--glass-stroke)] pt-4">
              {/* Peso */}
              <div className="rounded-xl bg-[var(--surface-2)]/60 p-2.5 text-center">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                  Peso Actual
                </span>
                <p className="font-[family-name:var(--font-display)] text-xl font-bold tracking-wide text-white mt-0.5">
                  {latestWeight ? `${latestWeight} kg` : "—"}
                </p>
                <span className="text-[9px] text-[var(--muted)] block truncate">
                  {latestWeightDate ? latestWeightDate.slice(5) : "Sin registro"}
                </span>
              </div>

              {/* Edad */}
              <div
                className="rounded-xl bg-[var(--surface-2)]/60 p-2.5 text-center cursor-pointer hover:border-[var(--accent)]/40 border border-transparent transition-colors"
                onClick={() => setIsEditingAge(true)}
                title="Toca para cambiar edad"
              >
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                  Edad
                </span>
                {isEditingAge ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const num = Number(tempAge);
                      if (num > 0 && num < 120) setUserAge(num);
                      setIsEditingAge(false);
                    }}
                    className="mt-1"
                  >
                    <input
                      type="number"
                      value={tempAge}
                      onChange={(e) => setTempAge(e.target.value)}
                      onBlur={() => {
                        const num = Number(tempAge);
                        if (num > 0 && num < 120) setUserAge(num);
                        setIsEditingAge(false);
                      }}
                      className="w-full bg-[var(--surface)] text-center text-xs font-bold py-0.5 rounded border border-[var(--accent)] text-white focus:outline-none"
                      autoFocus
                    />
                  </form>
                ) : (
                  <p className="font-[family-name:var(--font-display)] text-xl font-bold tracking-wide text-white mt-0.5">
                    {userAge} <span className="text-xs font-sans text-[var(--muted)]">años</span>
                  </p>
                )}
                <span className="text-[9px] text-[var(--accent)] block font-semibold">
                  Editar
                </span>
              </div>

              {/* Sesiones */}
              <div className="rounded-xl bg-[var(--surface-2)]/60 p-2.5 text-center">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                  Sesiones
                </span>
                <p className="font-[family-name:var(--font-display)] text-xl font-bold tracking-wide text-white mt-0.5">
                  {workouts.length}
                </p>
                <span className="text-[9px] text-[var(--muted)] block truncate">
                  Histórico
                </span>
              </div>
            </div>
          </div>

          {/* Sección de Racha estilo Duolingo */}
          <div className="card relative overflow-hidden border border-[var(--glass-stroke)] bg-gradient-to-b from-[var(--surface-2)]/80 to-[var(--surface)] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[var(--accent)]/20 text-[var(--accent)]">
                  <svg
                    className="h-3.5 w-3.5 text-[var(--accent)]"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    stroke="none"
                  >
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </span>
                <span className="text-xs font-black uppercase tracking-[0.14em] text-[var(--accent)]">
                  Racha de Gimnasio
                </span>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)]/15 px-2.5 py-0.5 text-[11px] font-black text-[var(--accent)] border border-[var(--accent)]/30">
                {renderBadgeIcon(streakSummary.badge.iconType)}
                <span>{streakSummary.badge.title}</span>
              </span>
            </div>

            {/* Contador Principal de Racha */}
            <div className="flex items-baseline justify-between rounded-2xl bg-black/40 p-4 border border-[var(--glass-stroke)]">
              <div>
                <p className="font-[family-name:var(--font-display)] text-4xl tracking-tight text-white font-extrabold leading-none">
                  {streakSummary.consecutiveWeeks}{" "}
                  <span className="text-xl font-medium tracking-normal text-[var(--accent)]">
                    {streakSummary.consecutiveWeeks === 1
                      ? "SEMANA ACTIVA"
                      : "SEMANAS ACTIVAS"}
                  </span>
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Meta: {streakSummary.weeklyGoal} entrenos por semana
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-white">
                  {streakSummary.currentWeekCount}/{streakSummary.weeklyGoal}
                </span>
                <span className="block text-[10px] text-[var(--muted)] uppercase font-semibold">
                  Esta semana
                </span>
              </div>
            </div>

            {/* Visualizador Semanal L M M J V S D */}
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                Días de la semana actual
              </p>
              <div className="grid grid-cols-7 gap-1.5">
                {streakSummary.daysOfWeek.map((day) => (
                  <div
                    key={day.dateIso}
                    className={`flex flex-col items-center justify-center rounded-xl py-2 px-1 text-center transition-all ${
                      day.isTrained
                        ? "bg-[var(--accent)] text-white shadow-[0_0_14px_rgba(255,77,26,0.45)] scale-105"
                        : day.isToday
                        ? "bg-[var(--surface-2)] text-[var(--accent)] border border-[var(--accent)]/60"
                        : "bg-[var(--surface-2)]/40 text-[var(--muted)]"
                    }`}
                  >
                    <span className="text-[10px] font-extrabold">
                      {day.dayLetter}
                    </span>
                    <span className="mt-1 text-xs font-bold leading-none">
                      {day.isTrained ? "✓" : "·"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mensaje Motivacional */}
            <div className="rounded-xl bg-[var(--accent)]/10 p-3 border border-[var(--accent)]/20 text-center">
              <p className="text-xs font-semibold text-[var(--ink)] leading-relaxed">
                {streakSummary.motivationalMessage}
              </p>
            </div>
          </div>

          {/* Centro de Configuraciones de la App */}
          <div className="card p-5 space-y-4">
            <h4 className="font-[family-name:var(--font-display)] text-xl tracking-[0.04em] text-white">
              Configuraciones de la App
            </h4>

            <div className="divide-y divide-[var(--glass-stroke)] space-y-3">
              {/* Pantalla Encendida (Wake Lock) */}
              <div className="flex items-center justify-between pt-3 first:pt-0">
                <div className="pr-3 flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white flex-shrink-0">
                    <svg
                      className="h-4 w-4 text-white"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect width="18" height="12" x="3" y="4" rx="2" />
                      <line x1="2" x2="22" y1="20" y2="20" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-sm font-bold text-white">
                      Mantener pantalla activa
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      Evita que el celular se suspenda en descansos
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={toggleWakeLock}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    wakeLockEnabled ? "bg-[var(--accent)]" : "bg-[var(--surface-2)]"
                  }`}
                  role="switch"
                  aria-checked={wakeLockEnabled}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      wakeLockEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Sonido de Alarma */}
              <div className="flex items-center justify-between pt-3">
                <div className="pr-3 flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white flex-shrink-0">
                    <svg
                      className="h-4 w-4 text-white"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-sm font-bold text-white">
                      Sonido del cronómetro
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      Alarma melódica y clics de la rueda
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={toggleSound}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    soundEnabled ? "bg-[var(--accent)]" : "bg-[var(--surface-2)]"
                  }`}
                  role="switch"
                  aria-checked={soundEnabled}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      soundEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Vibración Háptica */}
              <div className="flex items-center justify-between pt-3">
                <div className="pr-3 flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white flex-shrink-0">
                    <svg
                      className="h-4 w-4 text-white"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
                      <path d="M12 18h.01" />
                      <path d="M1 9l2 3-2 3" />
                      <path d="M23 9l-2 3 2 3" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-sm font-bold text-white">
                      Vibración háptica
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      Notificación háptica en dispositivos móviles
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={toggleHaptics}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    hapticsEnabled ? "bg-[var(--accent)]" : "bg-[var(--surface-2)]"
                  }`}
                  role="switch"
                  aria-checked={hapticsEnabled}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      hapticsEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Descanso Predeterminado Favorito */}
              <div className="pt-3">
                <div className="mb-2 flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white flex-shrink-0">
                    <svg
                      className="h-4 w-4 text-white"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="13" r="8" />
                      <path d="M12 9v4l2 2" />
                      <path d="M10 2h4" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-sm font-bold text-white">
                      Descanso predeterminado
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      Tiempo de descanso sugerido al iniciar
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-1.5 pt-1">
                  {[45, 60, 90, 120, 180].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setDefaultRestSeconds(sec)}
                      className={`rounded-lg py-1.5 text-xs font-bold transition-all ${
                        defaultRestSeconds === sec
                          ? "bg-[var(--accent)] text-white shadow-[0_0_10px_rgba(255,77,26,0.4)]"
                          : "bg-[var(--surface-2)] text-[var(--muted)] hover:text-white"
                      }`}
                    >
                      {sec < 60 ? `${sec}s` : `${sec / 60}m`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer con Cerrar Sesión */}
        <div className="sticky bottom-0 border-t border-[var(--glass-stroke)] bg-[var(--surface)]/95 p-4 backdrop-blur-md">
          <button
            type="button"
            onClick={handleLogout}
            className="btn btn-ghost w-full min-h-[3rem] text-sm font-bold uppercase tracking-[0.1em] text-red-400 hover:bg-red-950/30 hover:text-red-300 border border-red-900/40"
          >
            Cerrar Sesión
          </button>
          <p className="mt-2 text-center text-[10px] text-[var(--muted)]/60">
            Fuerza Gym Tracker · v1.3.0
          </p>
        </div>
      </div>
    </div>
  );
}
