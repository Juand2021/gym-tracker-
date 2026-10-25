"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Física de resortes propia (docs/nutricion/04-frontend.md §4.5).
 * Escribe directo en el DOM en cada cuadro (sin re-renderizar React), así la aguja,
 * el lente de pestañas y los números se mueven a 60 fps.
 */

export type SpringConfig = { stiffness?: number; damping?: number; mass?: number; precision?: number };

export const SPRINGS = {
  /** Aguja del velocímetro: rebote marcado y elegante. */
  needle: { stiffness: 90, damping: 11, mass: 1 },
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
export function useSpringEffect(target: number, cfg: SpringConfig, apply: (value: number, velocity: number) => void, initial?: number) {
  const state = useRef<{ value: number; velocity: number } | null>(null);
  const applyRef = useRef(apply);
  useEffect(() => {
    applyRef.current = apply;
  });
  useEffect(() => {
    if (!state.current) state.current = { value: initial ?? target, velocity: 0 };
    const s = state.current;
    return animateSpring(s.value, target, cfg, (x, v) => {
      s.value = x;
      s.velocity = v;
      applyRef.current(x, v);
    }, s.velocity);
    // cfg es un objeto constante de SPRINGS
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
}

/** Número que cuenta con resorte hasta su valor (escribe el texto directo en el nodo). */
export function useCountUp(value: number, format: (n: number) => string = (n) => Math.round(n).toLocaleString("es-CO"), from = 0) {
  const ref = useRef<HTMLSpanElement>(null);
  useSpringEffect(value, SPRINGS.soft, (x) => {
    if (ref.current) ref.current.textContent = format(x);
  }, from);
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
