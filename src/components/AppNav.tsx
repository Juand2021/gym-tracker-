"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { RestTimerButton } from "@/components/RestTimerButton";
import { UserProfileDrawer } from "@/components/UserProfileDrawer";

const links = [
  { href: "/", label: "Inicio", short: "Inicio" },
  { href: "/entreno", label: "Entreno", short: "Entreno" },
  { href: "/historial", label: "Historial", short: "Hist." },
  { href: "/peso", label: "Peso", short: "Peso" },
  { href: "/metricas", label: "Métricas", short: "Stats" },
  { href: "/ia", label: "IA", short: "IA" },
];

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    if (pathname === "/login") return;
    let cancelled = false;
    fetch("/api/auth/me")
      .then(async (res) => {
        if (!res.ok) return null;
        return (await res.json()) as {
          profile?: { displayName?: string };
        };
      })
      .then((data) => {
        if (!cancelled) {
          setDisplayName(data?.profile?.displayName ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) setDisplayName(null);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  if (pathname === "/login") return null;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <header className="app-topbar">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-3">
          <Link
            href="/"
            className="font-[family-name:var(--font-display)] text-3xl tracking-[0.08em] text-white hover:opacity-90 transition-opacity flex items-center leading-none"
          >
            FUERZA
            <span className="text-[var(--accent)]">.</span>
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <RestTimerButton />
            {displayName ? (
              <button
                type="button"
                onClick={() => setIsProfileOpen(true)}
                className="card-interactive flex items-center gap-1.5 rounded-full bg-[var(--surface-2)]/90 border border-[var(--glass-stroke)] px-3 min-h-[2.35rem] text-[var(--ink)] hover:border-[var(--accent)]/50 hover:text-white transition-all active:scale-95 shadow-sm"
                aria-label="Abrir perfil de usuario y ajustes"
                title="Ver perfil, racha y configuraciones"
              >
                {/* Icono de usuario vectorial blanco puro (sin emoji iOS) */}
                <svg
                  className="h-3.5 w-3.5 text-white flex-shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span className="font-[family-name:var(--font-display)] text-base tracking-[0.06em] leading-none pt-0.5">
                  {displayName}
                </span>
              </button>
            ) : null}
            <button
              type="button"
              onClick={logout}
              className="card-interactive flex items-center gap-1.5 justify-center rounded-full bg-[var(--surface-2)]/90 border border-[var(--glass-stroke)] px-3 min-h-[2.35rem] text-[var(--muted)] hover:text-white hover:border-[var(--accent)]/50 transition-all active:scale-95 shadow-sm"
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              {/* Icono de salida vectorial blanco puro */}
              <svg
                className="h-3.5 w-3.5 text-white/80 flex-shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span className="font-[family-name:var(--font-display)] text-base tracking-[0.06em] leading-none pt-0.5">
                Salir
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Drawer de perfil y ajustes */}
      <UserProfileDrawer
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        displayName={displayName}
      />

      <nav className="app-tabbar">
        <div className="mx-auto grid max-w-lg grid-cols-6 gap-0.5 px-1 py-1.5">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            const isEntreno = link.href === "/entreno";
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`app-tab ${active ? "is-active" : ""} ${
                  active && isEntreno ? "is-entreno" : ""
                }`}
              >
                <span className="sm:hidden">{link.short}</span>
                <span className="hidden sm:inline">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
