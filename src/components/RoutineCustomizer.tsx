"use client";

import { useState } from "react";
import {
  type CustomRoutines,
  getDefaultRoutines,
  loadCustomRoutines,
  saveCustomRoutines,
  resetCustomRoutines,
} from "@/lib/custom-routines";
import { CatalogExercisePicker } from "@/components/CatalogExercisePicker";
import { MuscleGroupIcon } from "@/components/MuscleGroupIcon";
import { getLoadHint } from "@/lib/exercises";

interface RoutineCustomizerProps {
  onBack: () => void;
  onSaved?: () => void;
}

type RoutineDayKey = keyof CustomRoutines;

const DAY_TABS: Array<{ key: RoutineDayKey; label: string; sub: string }> = [
  { key: "pecho", label: "Pecho", sub: "Tríceps y Core" },
  { key: "espalda", label: "Espalda", sub: "Bíceps y Core" },
  { key: "hombro_biceps", label: "Hombro (Bíceps)", sub: "Con brazos" },
  { key: "hombro_triceps", label: "Hombro (Tríceps)", sub: "Con brazos" },
  { key: "pierna", label: "Pierna", sub: "Sin brazos" },
];

export function RoutineCustomizer({ onBack, onSaved }: RoutineCustomizerProps) {
  const [routines, setRoutines] = useState<CustomRoutines>(() => loadCustomRoutines());
  const [activeTab, setActiveTab] = useState<RoutineDayKey>("pecho");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [customInputOpen, setCustomInputOpen] = useState(false);
  const [customInputText, setCustomInputText] = useState("");
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);

  const currentExercises = routines[activeTab] || [];

  function handleMove(fromIdx: number, toIdx: number) {
    if (toIdx < 0 || toIdx >= currentExercises.length) return;
    const list = [...currentExercises];
    const [item] = list.splice(fromIdx, 1);
    if (!item) return;
    list.splice(toIdx, 0, item);
    setRoutines((prev) => ({
      ...prev,
      [activeTab]: list,
    }));
  }

  function handleRemove(exerciseName: string) {
    setRoutines((prev) => ({
      ...prev,
      [activeTab]: (prev[activeTab] || []).filter((e) => e !== exerciseName),
    }));
  }

  function handleAddExercise(name: string) {
    const trimmed = name.trim();
    if (!trimmed || currentExercises.includes(trimmed)) return;
    setRoutines((prev) => ({
      ...prev,
      [activeTab]: [...(prev[activeTab] || []), trimmed],
    }));
  }

  function handleAddCustomSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customInputText.trim()) return;
    handleAddExercise(customInputText.trim());
    setCustomInputText("");
    setCustomInputOpen(false);
  }

  function handleSave() {
    saveCustomRoutines(routines);
    setShowSavedFeedback(true);
    setTimeout(() => {
      setShowSavedFeedback(false);
      onSaved?.();
      onBack();
    }, 800);
  }

  function handleReset() {
    const ok = window.confirm(
      "¿Restablecer todas las rutinas a los ejercicios predeterminados de fábrica?",
    );
    if (!ok) return;
    const defaults = resetCustomRoutines();
    setRoutines(defaults);
  }

  return (
    <div className="space-y-6 pb-24 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="card-interactive inline-flex items-center gap-1.5 rounded-full bg-[var(--surface-2)]/90 border border-[var(--glass-stroke)] px-3 py-1.5 min-h-[2.35rem] text-xs font-bold uppercase tracking-[0.08em] text-[var(--muted)] hover:text-white transition-all active:scale-95 shadow-sm"
        >
          <svg
            className="h-3.5 w-3.5 text-white flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span className="font-[family-name:var(--font-display)] text-base tracking-[0.06em] leading-none pt-0.5">
            Volver
          </span>
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--danger)] transition-colors"
          title="Restablecer todas las rutinas a la configuración inicial"
        >
          Restablecer de fábrica
        </button>
      </div>

      <div>
        <p className="page-kicker">Personalización</p>
        <h1 className="page-title mt-1">Ajustar Rutinas</h1>
        <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
          Modifica el orden, agrega o quita ejercicios de cada día para tus futuros entrenamientos.
        </p>
      </div>

      {/* Selector de Pestañas de Días */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {DAY_TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const count = (routines[tab.key] || []).length;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`card card-interactive p-3 text-left transition-all rounded-xl ${
                isActive
                  ? "border-[var(--accent)] bg-[var(--accent)]/10 shadow-[0_0_16px_rgba(255,77,26,0.25)]"
                  : "border-[var(--glass-stroke)] bg-[var(--surface-2)]/60 hover:border-[var(--glass-stroke-strong)]"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="font-[family-name:var(--font-display)] text-lg tracking-[0.04em] text-white">
                  {tab.label}
                </p>
                <span
                  className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${
                    isActive
                      ? "bg-[var(--accent)] text-white"
                      : "bg-[var(--surface)] text-[var(--muted)]"
                  }`}
                >
                  {count}
                </span>
              </div>
              <p className="text-[11px] text-[var(--muted)] mt-0.5 truncate">
                {tab.sub}
              </p>
            </button>
          );
        })}
      </div>

      {/* Lista de Ejercicios del Día Seleccionado */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <MuscleGroupIcon
              group={activeTab.startsWith("hombro") ? "hombro" : activeTab}
              className="h-5 w-5"
            />
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              Ejercicios del día ({currentExercises.length})
            </p>
          </div>
          <span className="text-[11px] text-[var(--muted)]">
            Usa las flechas para ordenar
          </span>
        </div>

        {currentExercises.length === 0 ? (
          <div className="card p-6 text-center text-[var(--muted)]">
            <p className="text-sm">No hay ejercicios en esta rutina.</p>
            <p className="text-xs mt-1">
              Añade ejercicios usando el botón de abajo.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {currentExercises.map((exerciseName, idx) => {
              const hint = getLoadHint(exerciseName);
              const isFirst = idx === 0;
              const isLast = idx === currentExercises.length - 1;

              return (
                <div
                  key={`${exerciseName}-${idx}`}
                  className="card flex items-center justify-between gap-3 p-3.5 border border-[var(--glass-stroke)] bg-[var(--surface-2)]/70 hover:border-[var(--glass-stroke-strong)] transition-all rounded-xl"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--muted)] w-6 text-center flex-shrink-0">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-white truncate">
                        {exerciseName}
                      </p>
                      <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider mt-0.5">
                        {hint.short} · {hint.detail}
                      </p>
                    </div>
                  </div>

                  {/* Controles de orden y eliminación */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      disabled={isFirst}
                      onClick={() => handleMove(idx, idx - 1)}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--glass-stroke)] text-white transition-all ${
                        isFirst
                          ? "opacity-25 cursor-not-allowed bg-[var(--surface)]"
                          : "bg-[var(--surface-2)] hover:bg-[var(--surface-raised)] active:scale-95"
                      }`}
                      aria-label="Mover arriba"
                      title="Mover arriba"
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="18 15 12 9 6 15" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      disabled={isLast}
                      onClick={() => handleMove(idx, idx + 1)}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--glass-stroke)] text-white transition-all ${
                        isLast
                          ? "opacity-25 cursor-not-allowed bg-[var(--surface)]"
                          : "bg-[var(--surface-2)] hover:bg-[var(--surface-raised)] active:scale-95"
                      }`}
                      aria-label="Mover abajo"
                      title="Mover abajo"
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemove(exerciseName)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-900/40 bg-red-950/20 text-red-400 hover:bg-red-900/40 hover:text-red-300 transition-all active:scale-95 ml-1"
                      aria-label={`Quitar ${exerciseName}`}
                      title="Quitar ejercicio"
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Botones para agregar ejercicio */}
        <div className="pt-2 space-y-2">
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="btn btn-secondary w-full min-h-[3rem] text-xs font-bold uppercase tracking-[0.1em] flex items-center justify-center gap-2 border-dashed border-[var(--accent)]/40 hover:border-[var(--accent)]"
          >
            <svg
              className="h-4 w-4 text-[var(--accent)]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Añadir Ejercicio desde el Catálogo</span>
          </button>

          {customInputOpen ? (
            <form
              onSubmit={handleAddCustomSubmit}
              className="card p-3 flex gap-2 border border-[var(--accent)]/50"
            >
              <input
                type="text"
                placeholder="Nombre del nuevo ejercicio..."
                value={customInputText}
                onChange={(e) => setCustomInputText(e.target.value)}
                className="input flex-1 text-xs"
                autoFocus
              />
              <button
                type="submit"
                className="btn btn-primary px-4 text-xs font-bold uppercase"
              >
                Añadir
              </button>
              <button
                type="button"
                onClick={() => {
                  setCustomInputText("");
                  setCustomInputOpen(false);
                }}
                className="btn btn-ghost px-2 text-xs"
              >
                ✕
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setCustomInputOpen(true)}
              className="text-[11px] font-semibold text-[var(--muted)] hover:text-white transition-colors block text-center w-full pt-1"
            >
              o escribe un ejercicio personalizado
            </button>
          )}
        </div>
      </div>

      {/* Modal de Catálogo */}
      <CatalogExercisePicker
        open={pickerOpen}
        activeExercises={currentExercises}
        onSelect={handleAddExercise}
        onClose={() => setPickerOpen(false)}
      />

      {/* Barra Inferior Fija para Guardar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-[var(--glass-stroke)] bg-[var(--surface)]/95 p-4 backdrop-blur-xl">
        <div className="mx-auto max-w-lg flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="btn btn-ghost min-h-[3.2rem] px-4 text-xs font-bold uppercase tracking-[0.1em] text-[var(--muted)]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className={`btn btn-primary flex-1 min-h-[3.2rem] text-sm font-bold uppercase tracking-[0.1em] shadow-[0_0_20px_rgba(255,77,26,0.4)] flex items-center justify-center gap-2 transition-all ${
              showSavedFeedback ? "bg-emerald-600 border-emerald-400" : ""
            }`}
          >
            {showSavedFeedback ? (
              <>
                <svg
                  className="h-4 w-4 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>¡Rutinas Guardadas!</span>
              </>
            ) : (
              <>
                <svg
                  className="h-4 w-4 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                <span>Guardar Cambios</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
