"use client";

import Link from "next/link";
import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import { usePathname, useRouter } from "next/navigation";

export type TabLink = { href: string; label: string; short: string };

/** Distancia (px) que separa un toque de un arrastre de la lente. */
const DRAG_THRESHOLD = 8;
/** La lente nunca es más angosta que esto: en "IA" sería más alta que ancha. */
const MIN_LENS_WIDTH = 54;

/** Posición y ancho de cada pestaña dentro de la barra (px). */
type Slot = { left: number; width: number };

function activeIndexFor(pathname: string, links: TabLink[]): number {
  return links.findIndex((link) =>
    link.href === "/" ? pathname === "/" : pathname.startsWith(link.href),
  );
}

function slotIndexAt(slots: Slot[], x: number): number {
  for (let i = 0; i < slots.length; i++) {
    if (x < slots[i].left + slots[i].width) return i;
  }
  return slots.length - 1;
}

/**
 * Barra de pestañas estilo Liquid Glass: cápsula flotante de vidrio con una
 * lente que se desliza a la pestaña activa y se puede arrastrar con el dedo.
 * Cada pestaña ocupa el ancho de su palabra, así "Historial" cabe completo.
 */
export function LiquidTabBar({ links }: { links: TabLink[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const barRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const gesture = useRef<{ startX: number; pointerId: number; dragging: boolean } | null>(null);
  const suppressClick = useRef(false);
  const lastHoverIndex = useRef<number | null>(null);

  // Índice elegido por el usuario mientras la navegación termina de cargar.
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);
  const [lastPath, setLastPath] = useState(pathname);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [barWidth, setBarWidth] = useState(0);
  /** Centro de la lente (px) mientras se arrastra. */
  const [dragX, setDragX] = useState<number | null>(null);

  if (pathname !== lastPath) {
    setLastPath(pathname);
    setPendingIndex(null);
  }

  // Medir las pestañas (y re-medir si cambia el ancho o cargan las fuentes).
  useLayoutEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const measure = () => {
      setBarWidth(bar.clientWidth);
      setSlots(
        tabRefs.current.map((tab) =>
          tab ? { left: tab.offsetLeft, width: tab.offsetWidth } : { left: 0, width: 0 },
        ),
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(bar);
    tabRefs.current.forEach((tab) => tab && ro.observe(tab));
    return () => ro.disconnect();
  }, [links.length]);

  const routeIndex = activeIndexFor(pathname, links);
  const lensIndex = pendingIndex ?? routeIndex;
  const measured = slots.length === links.length && slots.every((s) => s.width > 0);

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
    const bar = barRef.current;
    if (!g || !bar || !measured) return;

    if (!g.dragging) {
      if (Math.abs(e.clientX - g.startX) < DRAG_THRESHOLD) return;
      g.dragging = true;
      try {
        // Seguir recibiendo el movimiento aunque el dedo salga de la barra
        bar.setPointerCapture(g.pointerId);
      } catch {}
    }

    const first = slots[0];
    const last = slots[slots.length - 1];
    const x = Math.min(
      last.left + last.width / 2,
      Math.max(first.left + first.width / 2, e.clientX - bar.getBoundingClientRect().left),
    );
    setDragX(x);

    // Pequeño "clic" háptico al cruzar de pestaña (solo Android)
    const idx = slotIndexAt(slots, x);
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
    if (commit && dragX != null && measured) {
      const idx = slotIndexAt(slots, dragX);
      setPendingIndex(idx);
      if (idx !== routeIndex) router.push(links[idx].href);
    }
    setDragX(null);
  }

  // Cercanía de cada pestaña a la lente (0–1): agranda e ilumina la etiqueta.
  function proximity(i: number): number {
    if (dragX == null || !measured) return i === lensIndex ? 1 : 0;
    const s = slots[i];
    return Math.max(0, 1 - Math.abs(s.left + s.width / 2 - dragX) / s.width);
  }

  const dragging = dragX != null;
  let lensStyle: CSSProperties | undefined;
  if (measured && lensIndex >= 0) {
    // Al arrastrar, la lente toma el ancho de la pestaña que tiene debajo.
    const slot = dragging ? slots[slotIndexAt(slots, dragX)] : slots[lensIndex];
    const width = Math.max(slot.width, MIN_LENS_WIDTH);
    const center = dragging ? dragX : slot.left + slot.width / 2;
    const inset = slots[0].left; // padding interno de la barra
    const left = Math.min(Math.max(center - width / 2, inset), barWidth - inset - width);
    lensStyle = { transform: `translateX(${left}px)`, width: `${width}px` };
  }

  return (
    <nav className="app-tabbar" aria-label="Navegación principal">
      <div
        ref={barRef}
        className={`lg-bar ${dragging ? "is-dragging" : ""}`}
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
        {lensStyle ? (
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
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
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
