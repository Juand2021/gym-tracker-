"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { RestTimerButton } from "@/components/RestTimerButton";

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
            className="font-[family-name:var(--font-display)] text-2xl tracking-[0.08em] text-[var(--ink)]"
          >
            FUERZA
            <span className="text-[var(--accent)]">.</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <RestTimerButton />
            {displayName ? (
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                {displayName}
              </span>
            ) : null}
            <button
              type="button"
              onClick={logout}
              className="min-h-10 px-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)] hover:text-white"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

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
