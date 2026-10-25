"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Física de resortes propia (docs/nutricion/04-frontend.md §4.5).
 * Escribe directo en el DOM en cada cuadro (sin re-renderizar React), así la aguja,
 * el lente de pestañas y los números se mueven a 60 fps.
 */

export type SpringConfig = { stiffness?: number; damping?: number; mass?: number; precision?: number };

export const SPRINGS = {
  /** Aguja del velocímetro: ágil, con un rebote corto que se asienta en ~0,6 s. */
  needle: { stiffness: 170, damping: 19, mass: 1, precision: 0.002 },
  /** Lente de pestañas: rápido con un leve rebote. */
  lens: { stiffness: 420, damping: 30, mass: 1 },
  /** Números y barras: sin rebote visible. */
  soft: { stiffness: 120, damping: 20, mass: 1 },
  /** Hojas que suben. */
  sheet: { stiffness: 260, damping: 28, mass: 1 },
} satisfies Record<string, SpringConfig>;

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return document.documentElement.classList.contains("nv-calm") || !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Anima un valor con un resorte. Devuelve una función para cancelar.
 * onFrame recibe el valor y la velocidad (para estirar el lente según lo rápido que va).
 */
export function animateSpring(from: number, to: number, cfg: SpringConfig, onFrame: (value: number, velocity: number) => void, initialVelocity = 0, onDone?: () => void): () => void {
  const { stiffness = 170, damping = 26, mass = 1, precision = 0.01 } = cfg;
  if (prefersReducedMotion() || from === to) {
    onFrame(to, 0);
    onDone?.();
    return () => undefined;
  }
  let x = from;
  let v = initialVelocity;
  let last = performance.now();
  let raf = 0;
  const scale = Math.max(1, Math.abs(to - from));
  const step = (now: number) => {
    // Pasos fijos de 1/120 s: estable aunque el cuadro llegue tarde.
    let dt = Math.min(0.064, (now - last) / 1000);
    last = now;
    while (dt > 0) {
      const h = Math.min(dt, 1 / 120);
      const a = (-stiffness * (x - to) - damping * v) / mass;
      v += a * h;
      x += v * h;
      dt -= h;
    }
    if (Math.abs(v) < precision * scale && Math.abs(x - to) < precision * scale) {
      onFrame(to, 0);
      onDone?.();
      return;
    }
    onFrame(x, v);
    raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
  return () => cancelAnimationFrame(raf);
}

/**
 * Sigue un objetivo con resorte y llama a apply en cada cuadro.
 * Si el objetivo cambia a mitad de camino, conserva la velocidad (movimiento continuo).
 */
export function useSpringEffect(target: number, cfg: SpringConfig, apply: (value: number, velocity: number) => void, initial?: number, delayMs = 0) {
  const state = useRef<{ value: number; velocity: number } | null>(null);
  const applyRef = useRef(apply);
  useEffect(() => {
    applyRef.current = apply;
  });
  useEffect(() => {
    const first = !state.current;
    if (!state.current) state.current = { value: initial ?? target, velocity: 0 };
    const s = state.current;
    // Pinta la posición de partida ya, para que no se vea un salto antes de arrancar.
    if (first) applyRef.current(s.value, 0);
    let cancel = () => undefined as void;
    const start = () => {
      cancel = animateSpring(s.value, target, cfg, (x, v) => {
        s.value = x;
        s.velocity = v;
        applyRef.current(x, v);
      }, s.velocity);
    };
    // La primera vez puede esperar un poco, para no competir con la entrada de las tarjetas.
    const t = first && delayMs > 0 ? window.setTimeout(start, delayMs) : (start(), 0);
    return () => {
      window.clearTimeout(t);
      cancel();
    };
    // cfg es un objeto constante de SPRINGS
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
}

/** Últimos valores mostrados (aguja, números): al volver a una pantalla, arrancan desde ahí y no desde 0. */
const lastShown = new Map<string, number>();
export function rememberShown(key: string, value: number) {
  lastShown.set(key, value);
}
export function lastShownValue(key: string, fallback = 0): number {
  return lastShown.get(key) ?? fallback;
}

/**
 * Mientras se cambia de pantalla o se hace scroll, marca <html> con `nv-busy` (la decoración se pausa
 * en CSS) y con `nv-hidden` cuando la app queda en segundo plano.
 */
export function useQuietWhileBusy(routeKey: string) {
  useEffect(() => {
    const html = document.documentElement;
    html.classList.add("nv-busy");
    const t = window.setTimeout(() => html.classList.remove("nv-busy"), 900);
    return () => window.clearTimeout(t);
  }, [routeKey]);

  useEffect(() => {
    const html = document.documentElement;
    let t = 0;
    const onScroll = () => {
      html.classList.add("nv-busy");
      window.clearTimeout(t);
      t = window.setTimeout(() => html.classList.remove("nv-busy"), 260);
    };
    const onVisibility = () => html.classList.toggle("nv-hidden", document.hidden);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      html.classList.remove("nv-busy", "nv-hidden");
    };
  }, []);
}

/** Pausa las animaciones infinitas de un elemento (olas, líquidos) cuando sale de la pantalla. */
export function usePauseOffscreen<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => el.classList.toggle("nv-off", !e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

/** Número que cuenta con resorte hasta su valor (escribe el texto directo en el nodo). */
export function useCountUp(value: number, format: (n: number) => string = (n) => Math.round(n).toLocaleString("es-CO"), from = 0, delayMs = 0) {
  const ref = useRef<HTMLSpanElement>(null);
  const last = useRef("");
  useSpringEffect(value, SPRINGS.soft, (x) => {
    // Solo toca el texto cuando cambia lo que se ve (evita recalcular el texto en cada cuadro).
    const text = format(x);
    if (ref.current && text !== last.current) {
      ref.current.textContent = text;
      last.current = text;
    }
  }, from, delayMs);
  return ref;
}

/** Preferencias del sistema: reducir movimiento y reducir transparencia. */
export function useMotionPrefs() {
  const [prefs, setPrefs] = useState({ reducedMotion: false, reducedTransparency: false });
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const t = window.matchMedia("(prefers-reduced-transparency: reduce)");
    const update = () => setPrefs({ reducedMotion: m.matches, reducedTransparency: t.matches });
    update();
    m.addEventListener?.("change", update);
    t.addEventListener?.("change", update);
    return () => {
      m.removeEventListener?.("change", update);
      t.removeEventListener?.("change", update);
    };
  }, []);
  return prefs;
}

/** Formato de números en español de Colombia (1.880). */
export const fmt = (n: number) => Math.round(n).toLocaleString("es-CO");

/**
 * Vidrio que responde al dedo (para todos los elementos que coincidan con `selector`):
 *  - la luz se mueve al punto del toque (variables CSS --px / --py y --lit);
 *  - el botón se aplasta como gelatina y vuelve con rebote (resorte, solo transform).
 * Un único escuchador en el documento: no agrega trabajo a cada botón.
 */
export function useGlassPress(selector: string) {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    // Avisa al CSS que la presión la hace el resorte (apaga la transición y el :active de respaldo).
    const html = document.documentElement;
    html.classList.add("nv-springy");
    const anims = new WeakMap<HTMLElement, { s: number; v: number; cancel: () => void }>();
    let current: HTMLElement | null = null;

    const squash = (el: HTMLElement, to: number, velocity?: number) => {
      const st = anims.get(el) ?? { s: 0, v: 0, cancel: () => undefined };
      st.cancel();
      st.cancel = animateSpring(st.s, to, to > 0 ? { stiffness: 900, damping: 38 } : { stiffness: 520, damping: 14 }, (s, v) => {
        st.s = s;
        st.v = v;
        // s = 0 → reposo; s = 1 → aplastado (más ancho y más bajo, como gelatina)
        // Propiedad `scale` aparte: no choca con las animaciones de entrada que usan `transform`.
        el.style.scale = s === 0 ? "" : `${(1 - 0.035 * s).toFixed(4)} ${(1 - 0.075 * s).toFixed(4)}`;
      }, velocity ?? st.v);
      anims.set(el, st);
    };

    const light = (el: HTMLElement, e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--px", `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
      el.style.setProperty("--py", `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
    };

    const down = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest?.(selector) as HTMLElement | null;
      if (!el || (el as HTMLButtonElement).disabled) return;
      current = el;
      light(el, e);
      el.classList.add("is-lit");
      squash(el, 1);
    };
    const move = (e: PointerEvent) => {
      if (current) light(current, e);
    };
    const up = () => {
      const el = current;
      current = null;
      if (!el) return;
      el.classList.remove("is-lit");
      squash(el, 0);
    };

    document.addEventListener("pointerdown", down, { passive: true });
    document.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerup", up, { passive: true });
    document.addEventListener("pointercancel", up, { passive: true });
    return () => {
      html.classList.remove("nv-springy");
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", up);
      document.removeEventListener("pointercancel", up);
    };
  }, [selector]);
}
