"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { normalize } from "@/lib/nutrition/engine/text";
import { ALL_EQUIPMENT, EQUIPMENT_LABEL, type Equipment } from "@/lib/nutrition/kitchen/recipes";
import { NvIcon } from "@/components/nutriverse/NvIcon";
import { NvError, NvPageHead, NvSkeleton } from "@/components/nutriverse/NvUi";
import { invalidateNv, nvSend, useNv, type PantryData } from "@/components/nutriverse/data";

export default function PantryPage() {
  const { data, error, reload, setData } = useNv<PantryData>("/api/comidas/pantry");
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [fail, setFail] = useState<string | null>(null);
  // Los toques seguidos se juntan en un solo guardado (menos escrituras en la base).
  const pending = useRef<{ add: Set<string>; remove: Set<string>; equipment: Equipment[] | null }>({ add: new Set(), remove: new Set(), equipment: null });
  const timer = useRef<number | null>(null);

  const flush = () => {
    const p = pending.current;
    pending.current = { add: new Set(), remove: new Set(), equipment: null };
    timer.current = null;
    if (!p.add.size && !p.remove.size && !p.equipment) return;
    setSaving(true);
    nvSend<PantryData>("/api/comidas/pantry", "PUT", { add: [...p.add], remove: [...p.remove], ...(p.equipment ? { equipment: p.equipment } : {}) })
      .then((fresh) => {
        setData(fresh);
        setFail(null);
        invalidateNv("/api/comidas/recipes");
        invalidateNv("/api/comidas/plan");
      })
      .catch((e) => setFail(e instanceof Error ? e.message : "No se pudo guardar"))
      .finally(() => setSaving(false));
  };
  // Si sale de la pantalla antes del guardado, se guarda igual.
  const flushRef = useRef(flush);
  useEffect(() => {
    flushRef.current = flush;
  });
  useEffect(
    () => () => {
      if (timer.current) {
        window.clearTimeout(timer.current);
        flushRef.current();
      }
    },
    [],
  );

  const schedule = () => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(flush, 700);
  };

  const toggle = (key: string, have: boolean) => {
    setData((d) => (d ? { ...d, groups: d.groups.map((g) => ({ ...g, items: g.items.map((it) => (it.key === key ? { ...it, have: !have } : it)) })) } : d));
    const p = pending.current;
    if (have) {
      p.add.delete(key);
      p.remove.add(key);
    } else {
      p.remove.delete(key);
      p.add.add(key);
    }
    schedule();
  };

  const toggleEquip = (e: Equipment) => {
    if (!data) return;
    const next = data.equipment.includes(e) ? data.equipment.filter((x) => x !== e) : [...data.equipment, e];
    setData({ ...data, equipment: next });
    pending.current.equipment = next;
    schedule();
  };

  const groups = useMemo(() => {
    if (!data) return [];
    const q = normalize(query);
    return data.groups
      .map((g) => ({ ...g, items: q ? g.items.filter((i) => normalize(i.name).includes(q)) : g.items }))
      .filter((g) => g.items.length && (q || g.group !== "basicos"));
  }, [data, query]);

  const haveCount = data?.groups.reduce((n, g) => n + g.items.filter((i) => i.have && !i.staple).length, 0) ?? 0;

  return (
    <>
      <NvPageHead kicker="Lo que hay en casa" title="Despensa" />

      {!data ? (
        error ? (
          <NvError text={error} onRetry={reload} />
        ) : (
          <NvSkeleton h={460} />
        )
      ) : (
        <>
          <Link href="/comidas/planes/recetas" className="nv-card nv-glass is-thick nv-pantry-hero nv-press nv-rise">
            <span className="nv-pantry-count nv-num">{data.readyCount}</span>
            <span className="nv-pantry-text">
              <b>recetas que puedes hacer ya</b>
              <span className="nv-sub">
                {haveCount} ingredientes marcados · {saving ? "guardando…" : "sal, aceite y especias ya cuentan"}
              </span>
            </span>
            <NvIcon name="chevronR" size={18} />
          </Link>

          <section className="nv-card nv-glass is-read nv-rise" style={{ ["--i" as string]: 1 }}>
            <h2 className="nv-h2">Con qué cocinas</h2>
            <div className="nv-pills nv-mt">
              {ALL_EQUIPMENT.map((e) => (
                <button key={e} type="button" className={`nv-pill nv-glass is-thin nv-press ${data.equipment.includes(e) ? "is-on" : ""}`} aria-pressed={data.equipment.includes(e)} onClick={() => toggleEquip(e)}>
                  {EQUIPMENT_LABEL[e]}
                </button>
              ))}
            </div>
          </section>

          <div className="nv-field nv-glass is-thin nv-rise" style={{ ["--i" as string]: 2 }}>
            <NvIcon name="sparkle" size={20} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar ingrediente" aria-label="Buscar ingrediente" />
            {query ? (
              <button type="button" className="nv-press" onClick={() => setQuery("")} aria-label="Borrar búsqueda">
                <NvIcon name="close" size={20} />
              </button>
            ) : null}
          </div>
          <p className="nv-sub nv-pad">También puedes decirle al chat: «compré pollo, huevos y avena».</p>

          {groups.map((g, gi) => (
            <section key={g.group} className="nv-card nv-glass is-read nv-rise" style={{ ["--i" as string]: Math.min(gi + 3, 8) }}>
              <h2 className="nv-h2">{g.label}</h2>
              <div className="nv-pantry-grid">
                {g.items.map((it) => (
                  <button
                    key={it.key}
                    type="button"
                    disabled={it.staple}
                    className={`nv-pantry-item nv-glass is-thin nv-press ${it.have ? "is-on" : ""}`}
                    aria-pressed={it.have}
                    onClick={() => toggle(it.key, it.have)}
                  >
                    <span className={`nv-ing-check ${it.have ? "is-have" : ""}`}>{it.have ? <NvIcon name="check" size={12} tone="white" /> : null}</span>
                    {it.name}
                  </button>
                ))}
              </div>
            </section>
          ))}
          {fail ? <p className="nv-chat-error">{fail}</p> : null}
        </>
      )}
    </>
  );
}
