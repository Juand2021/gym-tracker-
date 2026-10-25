"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

export type AppId = "fuerza" | "comidas";

export const APPS: Record<AppId, { name: string; home: string; tagline: string }> = {
  fuerza: { name: "FUERZA", home: "/", tagline: "Entreno y progreso" },
  comidas: { name: "NutriVerse", home: "/comidas", tagline: "Nutrición y comidas" },
};

export function appFromPath(pathname: string): AppId {
  return pathname === "/comidas" || pathname.startsWith("/comidas/") ? "comidas" : "fuerza";
}

/** Ícono de cada app (mismo lenguaje que el resto: línea, sin emojis). */
function AppIcon({ app }: { app: AppId }) {
  const paths: Record<AppId, ReactNode> = {
    fuerza: <path d="M6 7v10M18 7v10M3 9v6M21 9v6M6 12h12" />,
    comidas: (
      <>
        <circle cx="13.5" cy="12.5" r="6.5" />
        <path d="M13.5 9.5c-1.7 0-3 1.3-3 3M4 3v6a2 2 0 0 0 2 2M6 3v18M8 3v6a2 2 0 0 1-2 2" />
      </>
    ),
  };
  return (
    <span className={`as-icon is-${app}`} aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {paths[app]}
      </svg>
    </span>
  );
}

/**
 * Logo de la app actual. Si el perfil tiene más de una app, al tocarlo se abre
 * un menú para cambiar entre Fuerza y NutriVerse (apps distintas que comparten sesión).
 */
export function AppSwitcher({ current, available }: { current: AppId; available: AppId[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const app = APPS[current];

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const logo = (
    <>
      {app.name}
      <span className="hd-logo-dot">.</span>
    </>
  );

  // Una sola app: el logo sigue llevando al inicio, como siempre.
  if (available.length < 2) {
    return (
      <Link href={app.home} className="hd-logo" aria-label={`${app.name}, inicio`}>
        {logo}
      </Link>
    );
  }

  return (
    <div className="as-wrap" ref={ref}>
      <button
        type="button"
        className="hd-logo as-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${app.name}: cambiar de app`}
        onClick={() => setOpen((o) => !o)}
      >
        {logo}
        <svg className={`as-chevron ${open ? "is-open" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open ? (
        <div className="as-menu ia-glass" role="menu" aria-label="Cambiar de app">
          <p className="ia-kicker as-menu-title">Tus apps</p>
          {available.map((id) => {
            const a = APPS[id];
            const active = id === current;
            return (
              <button
                key={id}
                type="button"
                role="menuitem"
                className={`as-item ${active ? "is-active" : ""}`}
                onClick={() => {
                  setOpen(false);
                  if (!active) router.push(a.home);
                }}
              >
                <AppIcon app={id} />
                <span className="as-item-text">
                  <span className="as-item-name">{a.name}</span>
                  <span className="as-item-tag">{a.tagline}</span>
                </span>
                {active ? <span className="as-here">Aquí</span> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
