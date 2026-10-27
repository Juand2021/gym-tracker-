"use client";

import { useMemo, useState } from "react";
import { normalize } from "@/lib/nutrition/engine/text";
import type { RecipeCard } from "@/lib/nutrition/kitchen/server";
import { RecipeAuthorSheet, RecipeTile } from "@/components/nutriverse/NvKitchen";
import { NvIcon } from "@/components/nutriverse/NvIcon";
import { NvError, NvPageHead, NvSkeleton } from "@/components/nutriverse/NvUi";
import { useNv, type RecipesData } from "@/components/nutriverse/data";

type Filter = "listas" | "favoritas" | "probadas" | "por-probar" | "desayuno" | "comida" | "snack" | "rapidas" | "airfryer" | "meal-prep" | "mias";

const FILTERS: { id: Filter; label: string; test: (r: RecipeCard) => boolean }[] = [
  { id: "listas", label: "Puedo hacerla ya", test: (r) => r.status === "ready" && !r.blocked },
  { id: "favoritas", label: "Favoritas", test: (r) => r.state.favorite },
  { id: "probadas", label: "Probadas", test: (r) => r.state.tried },
  { id: "por-probar", label: "Por probar", test: (r) => !r.state.tried },
  { id: "desayuno", label: "Desayunos", test: (r) => r.kind === "desayuno" },
  { id: "comida", label: "Almuerzo o cena", test: (r) => r.kind === "comida" },
  { id: "snack", label: "Snacks", test: (r) => r.kind === "snack" },
  { id: "rapidas", label: "≤ 15 min", test: (r) => r.minutes <= 15 },
  { id: "airfryer", label: "Air fryer", test: (r) => r.equipment.includes("airfryer") },
  { id: "meal-prep", label: "Meal prep", test: (r) => r.tags.includes("meal-prep") },
  { id: "mias", label: "Mías y de la IA", test: (r) => r.source !== "nutriverse" },
];

const STATUS_ORDER = { ready: 0, almost: 1, missing: 2 } as const;

export default function RecipesPage() {
  const { data, error, reload } = useNv<RecipesData>("/api/comidas/recipes");
  const [query, setQuery] = useState("");
  const [on, setOn] = useState<Set<Filter>>(new Set());
  const [authorOpen, setAuthorOpen] = useState(false);
  // El modo se conserva mientras la hoja se cierra (para que el título no cambie).
  const [authorMode, setAuthorMode] = useState<"read" | "propose">("read");
  const setAuthor = (m: "read" | "propose") => {
    setAuthorMode(m);
    setAuthorOpen(true);
  };

  const list = useMemo(() => {
    if (!data) return [];
    const q = normalize(query);
    const tests = FILTERS.filter((f) => on.has(f.id));
    return data.recipes
      .filter((r) => !q || normalize(`${r.name} ${r.description}`).includes(q))
      .filter((r) => tests.every((f) => f.test(r)))
      .sort((a, b) => Number(b.state.favorite) - Number(a.state.favorite) || STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.name.localeCompare(b.name));
  }, [data, query, on]);

  const toggle = (f: Filter) =>
    setOn((prev) => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f);
      else next.add(f);
      return next;
    });

  return (
    <>
      <NvPageHead kicker={data ? `${data.readyCount} listas con lo que tienes` : "Tu recetario"} title="Recetas" />

      <div className="nv-author-btns nv-rise">
        <button type="button" className="nv-btn nv-glass is-thin nv-press" onClick={() => setAuthor("read")}>
          <NvIcon name="plus" size={16} /> Mi receta
        </button>
        <button type="button" className="nv-btn nv-glass is-green nv-press" onClick={() => setAuthor("propose")}>
          <NvIcon name="sparkle" size={16} tone="white" /> Proponme una
        </button>
      </div>

      <div className="nv-field nv-glass is-thin nv-rise">
        <NvIcon name="sparkle" size={20} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar: pollo, avena, air fryer…" aria-label="Buscar recetas" />
        {query ? (
          <button type="button" className="nv-press" onClick={() => setQuery("")} aria-label="Borrar búsqueda">
            <NvIcon name="close" size={20} />
          </button>
        ) : null}
      </div>

      <div className="nv-filter-row nv-rise" role="group" aria-label="Filtros">
        {FILTERS.map((f) => (
          <button key={f.id} type="button" className={`nv-pill nv-glass is-thin nv-press ${on.has(f.id) ? "is-on" : ""}`} aria-pressed={on.has(f.id)} onClick={() => toggle(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      {!data ? (
        error ? (
          <NvError text={error} onRetry={reload} />
        ) : (
          <NvSkeleton h={420} />
        )
      ) : list.length ? (
        <div className="nv-recipes">
          {list.map((r, i) => (
            <RecipeTile key={r.id} card={r} i={Math.min(i, 8)} />
          ))}
        </div>
      ) : (
        <section className="nv-card nv-glass is-thin nv-soon">
          <NvIcon name="bowl" size={28} />
          <p className="nv-sub">Ninguna receta con esos filtros. Quita alguno o agrega cosas a tu despensa.</p>
        </section>
      )}

      <RecipeAuthorSheet open={authorOpen} onClose={() => setAuthorOpen(false)} mode={authorMode} />
    </>
  );
}
