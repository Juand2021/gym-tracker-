"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LiquidTabBar } from "@/components/LiquidTabBar";
import { RestTimerButton } from "@/components/RestTimerButton";
import { UserProfileDrawer } from "@/components/UserProfileDrawer";

const links = [
  { href: "/", label: "Inicio", short: "Inicio" },
  { href: "/entreno", label: "Entreno", short: "Entreno" },
  { href: "/historial", label: "Historial", short: "Historial" },
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
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-2.5">
          <Link href="/" className="hd-logo" aria-label="Fuerza, inicio">
            FUERZA
            <span className="hd-logo-dot">.</span>
          </Link>

          {/* Cápsula de vidrio con descanso, perfil y salida */}
          <div className="hd-cluster">
            <RestTimerButton />
            {displayName ? (
              <>
                <span className="hd-divider" aria-hidden="true" />
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(true)}
                  className="hd-item hd-profile"
                  aria-label={`Perfil de ${displayName}: racha y ajustes`}
                  title="Ver perfil, racha y configuraciones"
                >
                  <span className="hd-avatar" aria-hidden="true">
                    {displayName.trim().charAt(0).toUpperCase()}
                  </span>
                  <span className="hd-label">{displayName}</span>
                </button>
              </>
            ) : null}
            <span className="hd-divider" aria-hidden="true" />
            <button
              type="button"
              onClick={logout}
              className="hd-item hd-icon"
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              <svg
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

      <LiquidTabBar links={links} />
    </>
  );
}
