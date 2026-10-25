"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { animateSpring, fmt, SPRINGS } from "./glass/motion";
import { NvBubble, type BubbleKind } from "./NvBubble";
import { nvFont } from "./font";
import { NvIcon } from "./NvIcon";

/**
 * Hoja de vidrio que sube desde abajo. Se cierra tocando fuera, con Escape o arrastrándola hacia abajo.
 */
export function NvSheet({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }) {
  const [mounted, setMounted] = useState(open);
  const panel = useRef<HTMLDivElement>(null);
  const shade = useRef<HTMLDivElement>(null);
  const y = useRef(0);
  const cancel = useRef<() => void>(() => undefined);
  const drag = useRef<{ start: number; last: number; t: number; v: number } | null>(null);

  const paint = (v: number) => {
    if (panel.current) panel.current.style.transform = `translate3d(0, ${v}px, 0)`;
    if (shade.current) shade.current.style.opacity = String(Math.max(0, 1 - v / 500));
  };

  useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => setMounted(true), 0);
      return () => window.clearTimeout(t);
    }
    if (!mounted) return;
    cancel.current();
    const h = panel.current?.offsetHeight ?? 600;
    cancel.current = animateSpring(y.current, h + 40, SPRINGS.sheet, (v) => {
      y.current = v;
      paint(v);
    }, 0, () => setMounted(false));
  }, [open, mounted]);

  useLayoutEffect(() => {
    if (!mounted || !open) return;
    const h = panel.current?.offsetHeight ?? 600;
    y.current = h;
    paint(h);
    cancel.current();
    cancel.current = animateSpring(h, 0, SPRINGS.sheet, (v) => {
      y.current = v;
      paint(v);
    });
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    document.documentElement.classList.add("nv-sheet-open");
    return () => {
      document.removeEventListener("keydown", esc);
      document.documentElement.classList.remove("nv-sheet-open");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, open]);

  if (!mounted || typeof document === "undefined") return null;

  const onDown = (e: React.PointerEvent) => {
    drag.current = { start: e.clientY - y.current, last: e.clientY, t: performance.now(), v: 0 };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    cancel.current();
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const now = performance.now();
    d.v = ((e.clientY - d.last) / Math.max(1, now - d.t)) * 1000;
    d.last = e.clientY;
    d.t = now;
    const raw = e.clientY - d.start;
    y.current = raw < 0 ? raw / 4 : raw;
    paint(y.current);
  };
  const onUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (y.current > 120 || d.v > 700) onClose();
    else
      cancel.current = animateSpring(y.current, 0, SPRINGS.sheet, (v) => {
        y.current = v;
        paint(v);
      }, d.v);
  };

  return createPortal(
    <div className={`nv-root nv-sheet-wrap ${nvFont.variable}`} role="dialog" aria-modal="true" aria-label={title}>
      <div ref={shade} className="nv-sheet-shade" onClick={onClose} />
      <div ref={panel} className="nv-sheet nv-glass is-thick is-read">
        <div className="nv-sheet-grab" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
          <span />
        </div>
        <div className="nv-sheet-head">
          <h2 className="nv-h2">{title}</h2>
          <button type="button" className="nv-icon-btn nv-press" onClick={onClose} aria-label="Cerrar">
            <NvIcon name="close" size={28} />
          </button>
        </div>
        <div className="nv-sheet-body">{children}</div>
        {footer ? <div className="nv-sheet-foot">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}

/** Selector segmentado de vidrio con píldora que se desliza con resorte. */
export function NvSegmented<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const pill = useRef<HTMLSpanElement>(null);
  const state = useRef<{ x: number; w: number; cancel: () => void } | null>(null);
  const index = options.findIndex((o) => o.value === value);

  useLayoutEffect(() => {
    const btn = wrap.current?.querySelectorAll<HTMLButtonElement>("button")[index];
    if (!btn || !pill.current) return;
    const x = btn.offsetLeft;
    const w = btn.offsetWidth;
    const p = pill.current;
    if (!state.current) {
      state.current = { x, w, cancel: () => undefined };
      p.style.width = `${w}px`;
      p.style.transform = `translate3d(${x}px,0,0)`;
      return;
    }
    const s = state.current;
    s.cancel();
    p.style.width = `${w}px`;
    s.cancel = animateSpring(s.x, x, SPRINGS.lens, (nx, v) => {
      s.x = nx;
      const k = Math.min(0.2, Math.abs(v) / 5000);
      p.style.transform = `translate3d(${nx}px,0,0) scale(${1 + k}, ${1 - k * 0.5})`;
    });
  }, [index]);

  return (
    <div ref={wrap} className="nv-seg nv-glass is-thin" role="tablist" aria-label={label}>
      <span ref={pill} className="nv-seg-pill" aria-hidden="true" />
      {options.map((o) => (
        <button key={o.value} type="button" role="tab" aria-selected={o.value === value} className={`nv-seg-btn ${o.value === value ? "is-on" : ""}`} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Cápsula de una comida del día (burbuja + momento + kcal). */
export function NvCapsule({ href, kind, title, sub, kcal, i = 0 }: { href: string; kind: BubbleKind; title: string; sub: string; kcal: number | null; i?: number }) {
  return (
    <Link href={href} className="nv-capsule nv-glass nv-press nv-rise" style={{ ["--i" as string]: i }}>
      <NvBubble kind={kind} size={50} />
      <span className="nv-capsule-text">
        <span className="nv-capsule-title">{title}</span>
        <span className="nv-capsule-sub">{sub}</span>
      </span>
      {kcal != null ? (
        <span className="nv-capsule-kcal">
          <span className="nv-num">{fmt(kcal)}</span> kcal
        </span>
      ) : (
        <span className="nv-capsule-add nv-glass is-green">
          <NvIcon name="plus" size={18} tone="white" />
        </span>
      )}
    </Link>
  );
}

/** Estado de carga con brillo que recorre el vidrio. */
export function NvSkeleton({ h = 120 }: { h?: number }) {
  return <div className="nv-glass nv-skeleton" style={{ height: h }} aria-hidden="true" />;
}

export function NvError({ text, onRetry }: { text: string; onRetry?: () => void }) {
  return (
    <div className="nv-glass nv-card nv-error" role="alert">
      <NvIcon name="info" size={26} />
      <p>{text}</p>
      {onRetry ? (
        <button type="button" className="nv-btn nv-glass is-thin nv-press" onClick={onRetry}>
          Reintentar
        </button>
      ) : null}
    </div>
  );
}

/** Encabezado de pantalla (kicker + título + acción). */
export function NvPageHead({ kicker, title, action }: { kicker: string; title: string; action?: ReactNode }) {
  return (
    <div className="nv-pagehead nv-rise">
      <div>
        <p className="nv-kicker">{kicker}</p>
        <h1 className="nv-title">{title}</h1>
      </div>
      {action}
    </div>
  );
}
