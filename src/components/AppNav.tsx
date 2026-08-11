"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

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

  if (pathname === "/login") return null;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--bg)]/90 backdrop-blur-md pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-3">
          <Link
            href="/"
            className="font-[family-name:var(--font-display)] text-2xl tracking-[0.08em] text-[var(--ink)]"
          >
            FUERZA
            <span className="text-[var(--accent)]">.</span>
          </Link>
          <button
            type="button"
            onClick={logout}
            className="min-h-10 px-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]"
          >
            Salir
          </button>
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--line)] bg-[var(--bg-elevated)]/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
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
                className={`flex min-h-12 flex-col items-center justify-center rounded-md px-1 text-[0.65rem] font-bold uppercase tracking-[0.04em] transition ${
                  active
                    ? isEntreno
                      ? "bg-[var(--accent)] text-[#120800]"
                      : "bg-[var(--surface-2)] text-[var(--ink)] shadow-[inset_0_-2px_0_var(--accent)]"
                    : "text-[var(--muted)] active:bg-[var(--surface)]"
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
