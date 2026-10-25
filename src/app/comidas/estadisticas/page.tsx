"use client";

import { useState } from "react";
import { NvBars, NvDonut, NvLine, NvRing } from "@/components/nutriverse/NvCharts";
import { NvIcon } from "@/components/nutriverse/NvIcon";
import { NvError, NvPageHead, NvSegmented, NvSkeleton } from "@/components/nutriverse/NvUi";
import { fmt } from "@/components/nutriverse/glass/motion";
import { PHASE_LABEL, useNv, type StatsData } from "@/components/nutriverse/data";
import { shiftDate } from "@/lib/nutrition/views";
import { todayInBogota } from "@/lib/nutrition/profile";

type Range = StatsData["range"];
const LEN: Record<Range, number> = { week: 7, month: 30, quarter: 90 };

const shortDate = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("es-CO", { day: "numeric", month: "short", timeZone: "UTC" });

export default function NutriVerseStats() {
  const [range, setRange] = useState<Range>("week");
  const [end, setEnd] = useState<string | null>(null);
  const { data, error, reload } = useNv<StatsData>(`/api/comidas/stats?range=${range}${end ? `&end=${end}` : ""}`);

  const shift = (dir: -1 | 1) => {
    if (!data) return;
    const next = shiftDate(data.end, dir * LEN[range]);
    setEnd(next >= todayInBogota() ? null : next);
  };

  return (
    <div className="nv-stack">
      <NvPageHead kicker={data ? PHASE_LABEL[data.phase] : "Progreso"} title="Tus estadísticas" />
      <div className="nv-rise" style={{ ["--i" as string]: 1 }}>
        <NvSegmented
          label="Rango"
          value={range}
          onChange={(r) => {
            setRange(r);
            setEnd(null);
          }}
          options={[
            { value: "week", label: "Semana" },
            { value: "month", label: "Mes" },
            { value: "quarter", label: "Trimestre" },
          ]}
        />
      </div>

      {!data ? (
        error ? (
          <NvError text={error} onRetry={reload} />
        ) : (
          <>
            <NvSkeleton h={200} />
            <NvSkeleton h={180} />
          </>
        )
      ) : (
        <StatsBody data={data} onShift={shift} isLatest={!end} />
      )}
    </div>
  );
}

function StatsBody({ data, onShift, isLatest }: { data: StatsData; onShift: (d: -1 | 1) => void; isLatest: boolean }) {
  const s = data.summary;
  const mode = data.phase === "deficit" ? "under" : data.phase === "volumen" ? "over" : "band";
  const pct = s.macroPct;
  return (
    <>
      <div className="nv-rangenav nv-glass is-thin nv-rise" style={{ ["--i" as string]: 2 }}>
        <button type="button" className="nv-press" onClick={() => onShift(-1)} aria-label="Rango anterior">
          <NvIcon name="chevronL" size={16} />
        </button>
        <span>
          {shortDate(data.from)} – {shortDate(data.end)}
        </span>
        <button type="button" className="nv-press" onClick={() => onShift(1)} disabled={isLatest} aria-label="Rango siguiente">
          <NvIcon name="chevronR" size={16} />
        </button>
      </div>

      <section className="nv-card nv-glass is-thick nv-overview nv-rise" style={{ ["--i" as string]: 3 }}>
        <NvRing value={s.avgKcal} target={data.kcalTarget ?? s.avgKcal} label="kcal promedio" sub={data.kcalTarget ? `meta ${fmt(data.kcalTarget)}` : "sin meta"} />
        <div className="nv-overview-macros">
          <MacroBar label="Proteína" pct={pct.protein} color="var(--nv-green)" value={`${s.avgProtein} g/día`} />
          <MacroBar label="Carbohidratos" pct={pct.carbs} color="var(--nv-amber)" />
          <MacroBar label="Grasa" pct={pct.fat} color="#4aa6d9" />
          {pct.alcohol ? <MacroBar label="Alcohol" pct={pct.alcohol} color="var(--nv-violet)" /> : null}
        </div>
      </section>

      <div className="nv-tiles nv-rise" style={{ ["--i" as string]: 4 }}>
        <Tile icon="scale" label="Peso actual" value={data.weight.current != null ? `${data.weight.current.toLocaleString("es-CO")} kg` : "—"} sub={data.weight.change != null ? `${data.weight.change > 0 ? "+" : ""}${data.weight.change.toLocaleString("es-CO")} kg en el rango` : "sin cambio medido"} />
        <Tile icon="water" label="Agua" value={data.water.avg ? `${(data.water.avg / 1000).toLocaleString("es-CO", { maximumFractionDigits: 1 })} L` : "—"} sub={`meta ${(data.water.target / 1000).toLocaleString("es-CO", { maximumFractionDigits: 1 })} L/día`} />
        <Tile icon="target" label="Días en meta" value={`${s.daysInZone}/${s.loggedDays}`} sub={`${s.proteinDays} con proteína cumplida`} />
      </div>

      <section className="nv-card nv-glass is-read nv-rise" style={{ ["--i" as string]: 5 }}>
        <div className="nv-section-head">
          <h2 className="nv-h2">Calorías por día</h2>
          {s.partyDays.length ? (
            <span className="nv-legend">
              <span className="nv-dot is-party" /> fiesta
            </span>
          ) : null}
        </div>
        <NvBars days={data.days} target={data.kcalTarget} mode={mode} today={data.end} />
      </section>

      <section className={`nv-card nv-glass is-read nv-balance nv-rise ${s.balance > 0 && mode !== "over" ? "is-over" : ""}`} style={{ ["--i" as string]: 6 }}>
        <NvIcon name={s.partyDays.length ? "party" : "sparkle"} size={30} />
        <div>
          <p className="nv-kicker">Balance del rango</p>
          <p>{s.balanceText}</p>
        </div>
      </section>

      <section className="nv-card nv-glass is-read nv-rise" style={{ ["--i" as string]: 7 }}>
        <div className="nv-section-head">
          <h2 className="nv-h2">Evolución del peso</h2>
          {data.weight.change != null ? <span className={`nv-delta ${data.weight.change <= 0 ? "is-down" : "is-up"}`}>{`${data.weight.change > 0 ? "+" : ""}${data.weight.change.toLocaleString("es-CO")} kg`}</span> : null}
        </div>
        <NvLine points={data.weight.points} />
      </section>

      <section className="nv-card nv-glass is-read nv-rise" style={{ ["--i" as string]: 8 }}>
        <h2 className="nv-h2">Distribución de macros</h2>
        {s.loggedDays ? (
          <NvDonut
            parts={[
              { label: "Proteína", pct: pct.protein, color: "#2e9e5b" },
              { label: "Carbohidratos", pct: pct.carbs, color: "#e0a43a" },
              { label: "Grasa", pct: pct.fat, color: "#4aa6d9" },
              ...(pct.alcohol ? [{ label: "Alcohol", pct: pct.alcohol, color: "#a796ec" }] : []),
            ]}
          />
        ) : (
          <p className="nv-sub">Registra comidas para ver de dónde salen tus calorías.</p>
        )}
      </section>
    </>
  );
}

function MacroBar({ label, pct, color, value }: { label: string; pct: number; color: string; value?: string }) {
  return (
    <div className="nv-mbar">
      <p>
        <span>{label}</span>
        <span className="nv-num">{value ?? `${pct} %`}</span>
      </p>
      <span className="nv-mbar-track">
        <span className="nv-mbar-fill" style={{ width: `${Math.min(100, pct)}%`, background: color }} />
      </span>
    </div>
  );
}

function Tile({ icon, label, value, sub }: { icon: "scale" | "water" | "target"; label: string; value: string; sub: string }) {
  return (
    <div className="nv-tile nv-glass">
      <NvIcon name={icon} size={30} />
      <p className="nv-tile-label">{label}</p>
      <p className="nv-tile-val nv-num">{value}</p>
      <p className="nv-tile-sub">{sub}</p>
    </div>
  );
}
