"use client";

import { useEffect } from "react";

function isEditable(el: Element | null): boolean {
  if (!el) return false;
  if (el instanceof HTMLTextAreaElement) return true;
  if (el instanceof HTMLInputElement) {
    return !["checkbox", "radio", "button", "submit", "range", "color", "file"].includes(el.type);
  }
  return (el as HTMLElement).isContentEditable === true;
}

/**
 * Mantiene la barra de pestañas pegada a la parte VISIBLE de la pantalla.
 *
 * En iOS (sobre todo en la app instalada en la pantalla de inicio), al cerrar
 * el teclado o al volver a la app, el "viewport de diseño" a veces queda
 * desplazado y todo lo que está fijo abajo flota a media pantalla. Aquí se
 * mide dónde quedó la barra respecto al viewport visual y se corrige con una
 * variable CSS (--vv-shift). Con el teclado abierto la barra se oculta.
 */
export function ViewportGuard() {
  useEffect(() => {
    const vv = window.visualViewport;
    const root = document.documentElement;
    let raf = 0;
    const timers: number[] = [];

    const update = () => {
      raf = 0;
      const nav = document.querySelector<HTMLElement>(".app-tabbar");
      if (!vv || !nav) return;

      const keyboardOpen = isEditable(document.activeElement) && vv.height < window.innerHeight * 0.8;
      root.classList.toggle("kb-open", keyboardOpen);
      if (keyboardOpen) return;

      // Distancia al borde que pide el CSS (incluye el área segura)
      const gap = parseFloat(getComputedStyle(nav).bottom) || 0;
      const rect = nav.getBoundingClientRect();
      const visualBottom = rect.bottom - vv.offsetTop;
      const delta = vv.height - gap - visualBottom;
      if (Math.abs(delta) < 1) return;
      // Partir del desplazamiento realmente aplicado
      const current = parseFloat(root.style.getPropertyValue("--vv-shift")) || 0;
      let shift = Math.round(current + delta);
      // Un desplazamiento enorme indica una lectura transitoria: se descarta
      if (Math.abs(shift) > window.innerHeight * 0.6) shift = 0;
      root.style.setProperty("--vv-shift", `${shift}px`);
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    // Al cerrar el teclado, iOS a veces no devuelve el viewport a su lugar:
    // un scrollTo mínimo lo obliga a reacomodarse.
    const onFocusOut = () => {
      for (const ms of [60, 250, 600]) {
        timers.push(
          window.setTimeout(() => {
            if (!isEditable(document.activeElement)) {
              window.scrollTo(window.scrollX, window.scrollY);
            }
            schedule();
          }, ms),
        );
      }
    };

    vv?.addEventListener("resize", schedule);
    vv?.addEventListener("scroll", schedule);
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("orientationchange", schedule);
    window.addEventListener("pageshow", schedule);
    document.addEventListener("visibilitychange", schedule);
    document.addEventListener("focusin", schedule);
    document.addEventListener("focusout", onFocusOut);
    schedule();
    timers.push(window.setTimeout(schedule, 800));

    return () => {
      cancelAnimationFrame(raf);
      timers.forEach((t) => window.clearTimeout(t));
      vv?.removeEventListener("resize", schedule);
      vv?.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("orientationchange", schedule);
      window.removeEventListener("pageshow", schedule);
      document.removeEventListener("visibilitychange", schedule);
      document.removeEventListener("focusin", schedule);
      document.removeEventListener("focusout", onFocusOut);
      root.classList.remove("kb-open");
      root.style.removeProperty("--vv-shift");
    };
  }, []);

  return null;
}
