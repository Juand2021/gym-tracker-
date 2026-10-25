"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { APPS, type AppId } from "@/components/AppSwitcher";
import { NvIcon, type IconName } from "./NvIcon";
import { NvLeaves, NvLogo } from "./NvLogo";
import { animateSpring, SPRINGS, useGlassPress, useQuietWhileBusy } from "./glass/motion";

/** Pestañas (decisión de Juan): Inicio · Estadísticas · (+) · Planes · Perfil. */
const TABS: { href: string; label: string; icon: IconName }[] = [
  { href: "/comidas", label: "Inicio", icon: "home" },
  { href: "/comidas/estadisticas", label: "Estadísticas", icon: "stats" },
  { href: "/comidas/planes", label: "Planes", icon: "plan" },
  { href: "/comidas/perfil", label: "Perfil", icon: "profile" },
];

/** Pantallas a pantalla completa (sin encabezado ni pestañas). */
const FULL = ["/comidas/chat", "/comidas/bienvenida"];

function activeTab(pathname: string): number {
  let best = -1;
  TABS.forEach((t, i) => {
    if ((pathname === t.href || pathname.startsWith(`${t.href}/`)) && (best < 0 || t.href.length > TABS[best].href.length)) best = i;
  });
  return best;
}

/** Fondo plateado provisional (el metal líquido en WebGL llega después, a pedido de Juan). */
function NvBackground() {
  return (
    <div className="nv-bg" aria-hidden="true">
      <span className="nv-bg-wave is-1" />
      <span className="nv-bg-wave is-2" />
      <span className="nv-bg-wave is-3" />
      <span className="nv-bg-drop" style={{ width: 26, height: 26, top: "14%", right: "12%" }} />
      <span className="nv-bg-drop" style={{ width: 14, height: 14, top: "19%", right: "22%", animationDelay: "-4s" }} />
      <span className="nv-bg-drop" style={{ width: 34, height: 34, top: "58%", left: "6%", animationDelay: "-7s" }} />
      <span className="nv-bg-drop" style={{ width: 12, height: 12, top: "64%", left: "16%", animationDelay: "-2s" }} />
      <span className="nv-bg-drop" style={{ width: 20, height: 20, bottom: "16%", right: "9%", animationDelay: "-9s" }} />
      <span className="nv-bg-leaf" style={{ top: "-2rem", left: "-2.6rem", transform: "rotate(-30deg)" }}>
        <NvLeaves size={144} />
      </span>
      <span className="nv-bg-leaf" style={{ bottom: "4rem", right: "-3rem", transform: "rotate(140deg)", animationDelay: "-6s" }}>
        <NvLeaves size={144} />
      </span>
      <span className="nv-bg-grain" />
    </div>
  );
}

function NvAppSwitcher({ apps }: { apps: AppId[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  if (apps.length < 2) {
    return (
      <Link href="/comidas" className="nv-press" aria-label="NutriVerse, inicio">
        <NvLogo />
      </Link>
    );
  }

  return (
    <div className="nv-switch" ref={ref}>
      <button type="button" className="nv-switch-btn nv-press" aria-haspopup="menu" aria-expanded={open} aria-label="NutriVerse: cambiar de app" onClick={() => setOpen((o) => !o)}>
        <NvLogo />
        <span className={`nv-switch-chev ${open ? "is-open" : ""}`}>
          <NvIcon name="chevronD" size={14} />
        </span>
      </button>
      {open ? (
        <div className="nv-switch-menu nv-glass is-thick" role="menu" aria-label="Cambiar de app">
          <p className="nv-kicker">Tus apps</p>
          {apps.map((id) => {
            const a = APPS[id];
            const here = id === "comidas";
            return (
              <button
                key={id}
                type="button"
                role="menuitem"
                className={`nv-switch-item nv-press ${here ? "is-here" : ""}`}
                onClick={() => {
                  setOpen(false);
                  if (!here) router.push(a.home);
                }}
              >
                <span className={`nv-switch-ico ${id === "fuerza" ? "is-dark" : ""}`}>
                  {id === "fuerza" ? (
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                      <path d="M6 7v10M18 7v10M3 9v6M21 9v6M6 12h12" />
                    </svg>
                  ) : (
                    <NvLeaves size={24} />
                  )}
                </span>
                <span className="nv-switch-text">
                  <span className="nv-switch-name">{id === "fuerza" ? "FUERZA" : "NutriVerse"}</span>
                  <span className="nv-switch-tag">{a.tagline}</span>
                </span>
                {here ? <span className="nv-switch-here">Aquí</span> : <NvIcon name="chevronR" size={14} />}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Barra de pestañas de vidrio con un lente que se desliza con resorte, se estira según la
 * velocidad y se puede arrastrar con el dedo (al soltar, va a la pestaña más cercana).
 */
function NvTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const active = activeTab(pathname);
  const barRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLSpanElement>(null);
  const slots = useRef<(HTMLAnchorElement | null)[]>([]);
  const pos = useRef<{ x: number; v: number; cancel: () => void }>({ x: -1, v: 0, cancel: () => undefined });
  const drag = useRef<{ startX: number; lensX: number; lastX: number; lastT: number; moved: boolean } | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const justDragged = useRef(false);

  const slotX = (i: number) => {
    const el = slots.current[i];
    const bar = barRef.current;
    if (!el || !bar) return 0;
    return el.offsetLeft + el.offsetWidth / 2 - (lensRef.current?.offsetWidth ?? 0) / 2;
  };

  const paint = (x: number, v: number) => {
    const lens = lensRef.current;
    if (!lens) return;
    // Gelatina: se estira en la dirección del movimiento y se aplasta un poco en alto.
    const stretch = Math.min(0.28, Math.abs(v) / 4200);
    lens.style.transform = `translate3d(${x}px,0,0) scale(${1 + stretch}, ${1 - stretch * 0.55})`;
  };

  const moveTo = (x: number, v = pos.current.v) => {
    pos.current.cancel();
    pos.current.cancel = animateSpring(pos.current.x, x, SPRINGS.lens, (nx, nv) => {
      pos.current.x = nx;
      pos.current.v = nv;
      paint(nx, nv);
    }, v);
  };

  useLayoutEffect(() => {
    if (active < 0) return;
    const x = slotX(active);
    if (pos.current.x < 0) {
      pos.current.x = x;
      paint(x, 0);
    } else moveTo(x);
    const onResize = () => {
      pos.current.x = slotX(active);
      paint(pos.current.x, 0);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const nearest = (x: number) => {
    let best = 0;
    let dist = Infinity;
    TABS.forEach((_, i) => {
      const d = Math.abs(slotX(i) - x);
      if (d < dist) {
        dist = d;
        best = i;
      }
    });
    return best;
  };

  const onDown = (e: React.PointerEvent) => {
    if (active < 0 || (e.target as HTMLElement).closest(".nv-fab")) return;
    drag.current = { startX: e.clientX, lensX: pos.current.x, lastX: e.clientX, lastT: performance.now(), moved: false };
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    if (!d.moved && Math.abs(dx) < 8) return;
    if (!d.moved) {
      d.moved = true;
      barRef.current?.setPointerCapture(e.pointerId);
      barRef.current?.classList.add("is-dragging");
    }
    const now = performance.now();
    const v = ((e.clientX - d.lastX) / Math.max(1, now - d.lastT)) * 1000;
    d.lastX = e.clientX;
    d.lastT = now;
    pos.current.cancel();
    const min = slotX(0);
    const max = slotX(TABS.length - 1);
    const x = Math.max(min - 12, Math.min(max + 12, d.lensX + dx));
    pos.current.x = x;
    pos.current.v = v;
    paint(x, v);
    setHover(nearest(x));
  };
  const onUp = () => {
    const d = drag.current;
    drag.current = null;
    barRef.current?.classList.remove("is-dragging");
    if (!d?.moved) return;
    justDragged.current = true;
    window.setTimeout(() => (justDragged.current = false), 60);
    const i = nearest(pos.current.x);
    setHover(null);
    moveTo(slotX(i));
    if (i !== active) router.push(TABS[i].href);
  };

  const shown = hover ?? active;

  return (
    <nav className="nv-tabbar" aria-label="Secciones de NutriVerse">
      <div ref={barRef} className="nv-tabbar-glass nv-glass is-thick" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onClickCapture={(e) => justDragged.current && e.preventDefault()}>
        {active >= 0 ? <span ref={lensRef} className="nv-tab-lens" aria-hidden="true" /> : null}
        {TABS.map((t, i) => (
          <TabSlot key={t.href} tab={t} index={i} active={shown === i} setRef={(el) => (slots.current[i] = el)} />
        )).flatMap((el, i) =>
          i === 1
            ? [
                el,
                <Link key="fab" href="/comidas/chat" className="nv-fab nv-press" aria-label="Registrar comida o hablar con NutriVerse">
                  <span className="nv-fab-ring" aria-hidden="true" />
                  <span className="nv-fab-sphere nv-glass is-green">
                    <NvIcon name="plus" size={30} tone="white" />
                  </span>
                </Link>,
              ]
            : [el],
        )}
      </div>
    </nav>
  );
}

function TabSlot({ tab, index, active, setRef }: { tab: (typeof TABS)[number]; index: number; active: boolean; setRef: (el: HTMLAnchorElement | null) => void }) {
  return (
    <Link ref={setRef} href={tab.href} className={`nv-tab ${active ? "is-active" : ""}`} aria-current={active ? "page" : undefined} data-i={index} draggable={false}>
      <span className="nv-tab-ico">
        <NvIcon name={tab.icon} size={26} tone={active ? "green" : "silver"} />
      </span>
      <span className="nv-tab-label">{tab.label}</span>
    </Link>
  );
}

export function NvShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const full = FULL.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const [me, setMe] = useState<{ name: string; apps: AppId[] }>({ name: "", apps: ["comidas"] });
  // Fondo y decoración en pausa al cambiar de pantalla o hacer scroll (el vidrio no re-desenfoca).
  useQuietWhileBusy(pathname);
  // Vidrio que responde al dedo en todos los botones (luz que sigue el toque + presión de gelatina).
  useGlassPress(".nv-press");

  useEffect(() => {
    try {
      document.documentElement.classList.toggle("nv-calm", localStorage.getItem("nv:calm") === "1");
    } catch {
      // sin almacenamiento
    }
    let cancelled = false;
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { profile?: { displayName?: string }; apps?: AppId[] } | null) => {
        if (!cancelled && d) setMe({ name: d.profile?.displayName ?? "", apps: d.apps?.length ? d.apps : ["comidas"] });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="nv-root">
      <NvBackground />
      {full ? null : (
        <header className="nv-header">
          <div className="nv-header-in">
            <NvAppSwitcher apps={me.apps} />
            <Link href="/comidas/perfil" className="nv-avatar nv-glass is-thick nv-press" aria-label={`Perfil${me.name ? ` de ${me.name}` : ""}`}>
              <span>{me.name ? me.name.trim().charAt(0).toUpperCase() : "·"}</span>
            </Link>
          </div>
        </header>
      )}
      <div key={pathname} className={`nv-page ${full ? "is-full" : ""}`}>
        {children}
      </div>
      {full ? null : <NvTabBar />}
    </div>
  );
}
