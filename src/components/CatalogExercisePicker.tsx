"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { PickerPortal } from "@/components/PickerPortal";
import { getExerciseImage } from "@/lib/exercise-images";
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
        className="stack-picker-overlay ct-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="Catálogo de ejercicios"
        onClick={onClose}
      >
        <div className="ct-sheet" onClick={(e) => e.stopPropagation()}>
          {/* Cabecera */}
          <div className="ct-head">
            <div>
              <p className="hm-kicker">Catálogo</p>
              <h2 className="pf-title">Añadir ejercicio</h2>
            </div>
            <button type="button" className="rt-icon-btn" onClick={onClose} aria-label="Cerrar">
              ✕
            </button>
          </div>

          {/* Búsqueda y filtros */}
          <div className="ct-tools">
            <div className="ct-search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.3-4.3" />
              </svg>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar ejercicio (press, polea, crunch…)"
                aria-label="Buscar ejercicio"
              />
              {search ? (
                <button type="button" onClick={() => setSearch("")} aria-label="Limpiar búsqueda">
                  ✕
                </button>
              ) : null}
            </div>

            <div className="pg-filters" role="tablist" aria-label="Filtrar por grupo muscular">
              {groups.map((group) => (
                <button
                  key={group}
                  type="button"
                  role="tab"
                  aria-selected={selectedGroup === group}
                  onClick={() => setSelectedGroup(group)}
                  className={`pg-filter ${selectedGroup === group ? "is-active" : ""}`}
                >
                  {group}
                </button>
              ))}
            </div>
          </div>

          {/* Lista */}
          <div className="ct-list">
            <p className="ct-count">
              {filteredExercises.length} {filteredExercises.length === 1 ? "ejercicio" : "ejercicios"}
            </p>

            {filteredExercises.length === 0 ? (
              <div className="ct-empty">
                No se encontraron ejercicios{search ? <> con &ldquo;{search}&rdquo;</> : null}.
              </div>
            ) : (
              filteredExercises.map(({ name, group }, i) => {
                const isAdded = activeExercises.includes(name);
                const load = getLoadHint(name);
                const thumb = getExerciseImage(name);

                return (
                  <button
                    key={`${group}-${name}`}
                    type="button"
                    disabled={isAdded}
                    onClick={() => handleSelect(name)}
                    className={`ct-row ${isAdded ? "is-added" : ""}`}
                    style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}
                  >
                    <span className={`ct-thumb ${thumb ? "" : "is-empty"}`}>
                      {thumb ? (
                        <Image src={thumb} alt="" fill className="object-cover" sizes="64px" />
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M6 7v10M18 7v10M3 10v4M21 10v4M6 12h12" />
                        </svg>
                      )}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="ct-name">{name}</span>
                      <span className="ct-meta">
                        <span className="hm-chip">{group}</span>
                        <span className="ct-load" title={load.detail}>
                          {load.short}
                        </span>
                      </span>
                    </span>

                    {isAdded ? (
                      <span className="ct-added">Añadido</span>
                    ) : (
                      <span className="ct-add" aria-hidden="true">
                        +
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Pie */}
          <div className="ct-foot">
            <button type="button" className="pg-pill ct-close" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </PickerPortal>
  );
}
