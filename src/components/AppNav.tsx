"use client";

import { clearSession } from "@/lib/client-cache";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppSwitcher, appFromPath, type AppId } from "@/components/AppSwitcher";
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

/** Pestañas de la app de Comidas (la Fase de frontend dedicada las ampliará). */
const comidasLinks = [
  { href: "/comidas", label: "Hoy", short: "Hoy" },
  { href: "/comidas/chat", label: "Chat", short: "Chat" },
];

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    if (pathname === "/login") return;
    let cancelled = false;
    fetch("/api/auth/me")
      .then(async (res) => {
        if (!res.ok) return null;
        return (await res.json()) as {
          profile?: { id?: string; displayName?: string };
        };
      })
      .then((data) => {
        if (!cancelled) {
          setDisplayName(data?.profile?.displayName ?? null);
          setProfileId(data?.profile?.id ?? null);
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

  const currentApp = appFromPath(pathname);
  // Comidas solo existe para Juan por ahora.
  const availableApps: AppId[] = profileId === "juan" ? ["fuerza", "comidas"] : ["fuerza"];

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    clearSession();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <header className="app-topbar">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-2.5">
          <AppSwitcher current={currentApp} available={availableApps} />

          {/* Cápsula de vidrio con descanso, perfil y salida */}
          <div className="hd-cluster">
            {currentApp === "fuerza" ? <RestTimerButton /> : null}
            {displayName ? (
              <>
                {currentApp === "fuerza" ? <span className="hd-divider" aria-hidden="true" /> : null}
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

      <LiquidTabBar links={currentApp === "comidas" ? comidasLinks : links} />
    </>
  );
}
