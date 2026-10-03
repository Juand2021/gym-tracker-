import type { ReactNode } from "react";

type Stat = { label: string; value: ReactNode; hint?: string };

/**
 * Cabecera de página en vidrio: título, descripción, acciones y una fila
 * opcional de datos. Da la misma entrada visual a todos los módulos.
 */
export function PageHero({
  kicker,
  title,
  description,
  back,
  action,
  stats,
  children,
}: {
  kicker: string;
  title: ReactNode;
  description?: ReactNode;
  back?: { label: string; onClick: () => void };
  action?: ReactNode;
  stats?: Stat[];
  children?: ReactNode;
}) {
  return (
    <section className="glass-panel pg-hero">
      <span className="pg-hero-glow" aria-hidden="true" />
      {back || action ? (
        <div className="pg-hero-bar">
          {back ? (
            <button type="button" className="pg-pill" onClick={back.onClick}>
              <span aria-hidden="true">←</span> {back.label}
            </button>
          ) : (
            <span />
          )}
          {action}
        </div>
      ) : null}
      <div className="min-w-0">
        <p className="hm-kicker">{kicker}</p>
        <h1 className="page-title mt-1">{title}</h1>
        {description ? <p className="pg-hero-text">{description}</p> : null}
      </div>
      {stats && stats.length > 0 ? (
        <div className="pg-hero-stats" style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}>
          {stats.map((s) => (
            <div key={s.label} className="pg-stat">
              <span className="pg-stat-value">{s.value}</span>
              <span className="pg-stat-label">{s.label}</span>
              {s.hint ? <span className="pg-stat-hint">{s.hint}</span> : null}
            </div>
          ))}
        </div>
      ) : null}
      {children}
    </section>
  );
}
