"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { readSession, writeSession } from "@/lib/client-cache";

/** Pantallas que siempre abren arriba (el chat de IA baja solo al último mensaje). */
const SKIP = new Set(["/ia", "/login"]);

/**
 * Recuerda hasta dónde bajaste en cada pantalla y te devuelve ahí al volver,
 * mientras la app siga abierta (se guarda en la sesión).
 */
export function ScrollMemory() {
  const pathname = usePathname();

  // Guardar la posición mientras se desplaza
  useEffect(() => {
    if (SKIP.has(pathname)) return;
    let raf = 0;
    const save = () => {
      raf = 0;
      // Con un selector abierto el body queda fijo y scrollY vale 0: no guardar eso
      if (document.body.style.position === "fixed") return;
      writeSession(`scroll:${pathname}`, Math.round(window.scrollY));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(save);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, [pathname]);

  // Restaurar al entrar: espera a que la página tenga altura suficiente (datos cargados)
  useEffect(() => {
    if (SKIP.has(pathname)) return;
    const target = readSession<number>(`scroll:${pathname}`) ?? 0;
    if (target <= 0) return;

    let raf = 0;
    const started = performance.now();
    let cancelled = false;
    const userScrolled = () => {
      cancelled = true;
    };
    window.addEventListener("touchstart", userScrolled, { passive: true, once: true });
    window.addEventListener("wheel", userScrolled, { passive: true, once: true });

    const tryRestore = () => {
      if (cancelled) return;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll >= target - 2) {
        window.scrollTo(0, target);
        return;
      }
      // Hasta 2,5 s esperando a que carguen los datos de la pantalla
      if (performance.now() - started < 2500) raf = requestAnimationFrame(tryRestore);
      else window.scrollTo(0, Math.max(0, maxScroll));
    };
    raf = requestAnimationFrame(tryRestore);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("touchstart", userScrolled);
      window.removeEventListener("wheel", userScrolled);
    };
  }, [pathname]);

  return null;
}
