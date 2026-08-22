"use client";

import { useMemo, useState } from "react";
import { PickerPortal } from "@/components/PickerPortal";
import { getLoadHint } from "@/lib/exercises";
import { CATALOG_EXERCISES_BY_GROUP } from "@/lib/routines";

type Props = {
  open: boolean;
  activeExercises: string[];
  onSelect: (exerciseName: string) => void;
  onClose: () => void;
};

export function CatalogExercisePicker({
  open,
  activeExercises,
  onSelect,
  onClose,
}: Props) {
  const [selectedGroup, setSelectedGroup] = useState<string>("Todos");
  const [search, setSearch] = useState<string>("");

  const groups = useMemo(() => {
    return ["Todos", ...CATALOG_EXERCISES_BY_GROUP.map((g) => g.group)];
  }, []);

  const filteredExercises = useMemo(() => {
    const query = search.trim().toLowerCase();
    const result: Array<{ name: string; group: string }> = [];

    for (const cat of CATALOG_EXERCISES_BY_GROUP) {
      if (selectedGroup !== "Todos" && cat.group !== selectedGroup) {
        continue;
      }
      for (const ex of cat.exercises) {
        if (!query || ex.toLowerCase().includes(query) || cat.group.toLowerCase().includes(query)) {
          result.push({ name: ex, group: cat.group });
        }
      }
    }
    return result;
  }, [selectedGroup, search]);

  function handleSelect(name: string) {
    if (activeExercises.includes(name)) return;
    onSelect(name);
    onClose();
  }

  return (
    <PickerPortal open={open}>
      <div
        className="stack-picker-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="Catálogo de ejercicios"
        onClick={onClose}
      >
        <div
          className="stack-picker-sheet flex max-h-[88dvh] w-full max-w-lg flex-col overflow-hidden p-0"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--glass-stroke)] px-5 py-4">
            <div>
              <p className="label mb-0 text-xs font-bold tracking-[0.14em] text-[var(--accent)]">
                Catálogo
              </p>
              <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-[0.04em]">
                Añadir Ejercicio
              </h2>
            </div>
            <button
              type="button"
              className="stack-picker-close flex h-9 w-9 items-center justify-center rounded-full text-base transition-transform active:scale-95"
              onClick={onClose}
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>

          {/* Search Bar */}
          <div className="border-b border-[var(--glass-stroke)] bg-[var(--surface)]/50 px-4 py-3">
            <div className="relative">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar ejercicio (ej. Crunch, Press, Polea…)"
                className="field h-11 w-full px-3.5 pr-8 text-sm"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--muted)] hover:text-white"
                  aria-label="Limpiar búsqueda"
                >
                  ✕
                </button>
              ) : null}
            </div>

            {/* Category Filter Chips */}
            <div className="no-scrollbar mt-3 -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1">
              {groups.map((group) => {
                const isActive = selectedGroup === group;
                return (
                  <button
                    key={group}
                    type="button"
                    onClick={() => setSelectedGroup(group)}
                    className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] transition-all active:scale-95 ${
                      isActive
                        ? "bg-[var(--accent)] text-white shadow-sm shadow-[var(--accent)]/40"
                        : "bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--ink)]"
                    }`}
                  >
                    {group}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Exercise List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {filteredExercises.length === 0 ? (
              <div className="py-12 text-center text-sm text-[var(--muted)]">
                No se encontraron ejercicios con &ldquo;{search}&rdquo;.
              </div>
            ) : (
              filteredExercises.map(({ name, group }) => {
                const isAdded = activeExercises.includes(name);
                const load = getLoadHint(name);

                return (
                  <button
                    key={name}
                    type="button"
                    disabled={isAdded}
                    onClick={() => handleSelect(name)}
                    className={`group card card-interactive flex w-full items-center justify-between gap-3 p-3.5 text-left transition-all ${
                      isAdded
                        ? "opacity-45 cursor-not-allowed border-transparent bg-transparent"
                        : "hover:border-[var(--accent)]/50 active:scale-[0.985]"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-semibold leading-snug tracking-wide text-[var(--ink)]">
                        {name}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                        <span className="rounded bg-[var(--surface-2)] px-2 py-0.5 font-medium">
                          {group}
                        </span>
                        <span>·</span>
                        <span className="text-[var(--accent)] font-medium">
                          {load.short}
                        </span>
                        <span className="hidden sm:inline text-[var(--muted)]">
                          ({load.detail})
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isAdded ? (
                        <span className="rounded-full bg-emerald-950/60 border border-emerald-500/40 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                          ✓ Añadido
                        </span>
                      ) : (
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-2)] text-base font-bold text-[var(--ink)] group-hover:bg-[var(--accent)] group-hover:text-white transition-colors">
                          +
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Actions */}
          <div className="border-t border-[var(--glass-stroke)] bg-[var(--surface)] px-4 py-3 text-center">
            <button
              type="button"
              className="btn btn-ghost w-full min-h-[2.8rem] text-xs font-bold tracking-[0.1em]"
              onClick={onClose}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </PickerPortal>
  );
}
