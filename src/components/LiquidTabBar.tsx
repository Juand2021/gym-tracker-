"use client";

import Link from "next/link";
import { useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { usePathname, useRouter } from "next/navigation";

export type TabLink = { href: string; label: string; short: string };

/** Distancia (px) que separa un toque de un arrastre de la lente. */
const DRAG_THRESHOLD = 8;

function activeIndexFor(pathname: string, links: TabLink[]): number {
  return links.findIndex((link) =>
    link.href === "/" ? pathname === "/" : pathname.startsWith(link.href),
  );
}

/**
 * Barra de pestañas estilo Liquid Glass: cápsula flotante de vidrio con una
 * lente que se desliza a la pestaña activa y se puede arrastrar con el dedo.
 */
export function LiquidTabBar({ links }: { links: TabLink[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const barRef = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ startX: number; pointerId: number; dragging: boolean } | null>(null);
  const suppressClick = useRef(false);
  const lastHoverIndex = useRef<number | null>(null);

  // Índice elegido por el usuario mientras la navegación termina de cargar.
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);
  const [lastPath, setLastPath] = useState(pathname);
  /** Centro de la lente (px) y ancho de cada pestaña mientras se arrastra. */
  const [drag, setDrag] = useState<{ x: number; slot: number } | null>(null);

  if (pathname !== lastPath) {
    setLastPath(pathname);
    setPendingIndex(null);
  }

  const routeIndex = activeIndexFor(pathname, links);
  const lensIndex = pendingIndex ?? routeIndex;
  const count = links.length;

  function metrics() {
    const bar = barRef.current;
    if (!bar) return null;
    const rect = bar.getBoundingClientRect();
    const pad = parseFloat(getComputedStyle(bar).paddingLeft) || 0;
    const slot = (rect.width - pad * 2) / count;
    return { rect, pad, slot };
  }

  function indexAt(centerX: number, slot: number): number {
    return Math.min(count - 1, Math.max(0, Math.floor(centerX / slot)));
  }

  function setGlow(e: PointerEvent<HTMLDivElement>, on: boolean) {
    const bar = barRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    bar.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    bar.style.setProperty("--glow", on ? "1" : "0");
  }

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    gesture.current = { startX: e.clientX, pointerId: e.pointerId, dragging: false };
    setGlow(e, true);
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    setGlow(e, e.pointerType === "mouse" || gesture.current != null);
    const g = gesture.current;
    if (!g) return;
    const m = metrics();
    if (!m) return;

    if (!g.dragging) {
      if (Math.abs(e.clientX - g.startX) < DRAG_THRESHOLD) return;
      g.dragging = true;
      try {
        // Seguir recibiendo el movimiento aunque el dedo salga de la barra
        barRef.current?.setPointerCapture(g.pointerId);
      } catch {}
    }

    const half = m.slot / 2;
    const x = Math.min(m.slot * count - half, Math.max(half, e.clientX - m.rect.left - m.pad));
    setDrag({ x, slot: m.slot });

    // Pequeño "clic" háptico al cruzar de pestaña (solo Android)
    const idx = indexAt(x, m.slot);
    if (idx !== lastHoverIndex.current) {
      lastHoverIndex.current = idx;
      try {
        if (navigator.userActivation?.hasBeenActive) navigator.vibrate?.(6);
      } catch {}
    }
  }

  function endGesture(e: PointerEvent<HTMLDivElement>, commit: boolean) {
    const g = gesture.current;
    gesture.current = null;
    lastHoverIndex.current = null;
    setGlow(e, e.pointerType === "mouse");
    if (!g?.dragging) return;

    suppressClick.current = true;
    if (commit && drag) {
      const idx = indexAt(drag.x, drag.slot);
      setPendingIndex(idx);
      if (idx !== routeIndex) router.push(links[idx].href);
    }
    setDrag(null);
  }

  // Cercanía de cada pestaña a la lente (0–1): agranda e ilumina la etiqueta.
  function proximity(i: number): number {
    if (!drag) return i === lensIndex ? 1 : 0;
    const center = drag.slot * i + drag.slot / 2;
    return Math.max(0, 1 - Math.abs(center - drag.x) / drag.slot);
  }

  const dragging = drag != null;
  const lensStyle: CSSProperties | undefined = drag
    ? { transform: `translateX(${drag.x - drag.slot / 2}px)` }
    : undefined;

  return (
    <nav className="app-tabbar" aria-label="Navegación principal">
      <div
        ref={barRef}
        className={`lg-bar ${dragging ? "is-dragging" : ""}`}
        style={{ "--count": count, "--i": Math.max(0, lensIndex) } as CSSProperties}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(e) => endGesture(e, true)}
        onPointerCancel={(e) => endGesture(e, false)}
        onPointerLeave={(e) => {
          if (!gesture.current) setGlow(e, false);
        }}
        onClickCapture={(e) => {
          if (suppressClick.current) {
            suppressClick.current = false;
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        <span className="lg-sheen" aria-hidden />
        {lensIndex >= 0 ? (
          <span
            className={`lg-lens ${links[lensIndex]?.href === "/entreno" && !dragging ? "is-entreno" : ""}`}
            style={lensStyle}
            aria-hidden
          >
            {/* key: re-dispara la deformación líquida en cada cambio de pestaña */}
            <span key={lensIndex} className="lg-lens-core" />
          </span>
        ) : null}

        {links.map((link, i) => {
          const active = i === routeIndex;
          return (
            <Link
              key={link.href}
              href={link.href}
              draggable={false}
              aria-current={active ? "page" : undefined}
              className={`lg-tab ${i === lensIndex && !dragging ? "is-active" : ""}`}
              style={{ "--prox": proximity(i) } as CSSProperties}
              onClick={() => {
                if (!suppressClick.current) setPendingIndex(i);
              }}
            >
              <span className="sm:hidden">{link.short}</span>
              <span className="hidden sm:inline">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
