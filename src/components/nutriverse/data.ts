"use client";

import { useCallback, useEffect, useState } from "react";
import { readSession, writeSession } from "@/lib/client-cache";
import type { Gauge, GaugeZone, Gamification, DayTotals, StatsSummary } from "@/lib/nutrition/views";
import type { NutritionProfile, Phase } from "@/lib/nutrition/profile";
import type { Targets } from "@/lib/nutrition/targets";
import type { MealMoment } from "@/lib/nutrition/store";

/** Formas de las respuestas de /api/comidas/* (espejo de src/lib/nutrition/server.ts). */

export type DayMeal = { id: string; time: string; moment: MealMoment; text: string; kcal: number; protein: number; items: { name: string; grams: number; kcal: number }[] };

export type DayData = {
  date: string;
  today: string;
  name: string;
  profileComplete: boolean;
  missing: string[];
  kcal: number;
  kcalTarget: number | null;
  protein: number;
  proteinTarget: number | null;
  fat: number;
  fatTarget: number | null;
  carbs: number;
  carbsTarget: number | null;
  alcohol: number;
  water: number;
  waterTarget: number;
  phase: Phase | null;
  gauge: Gauge | null;
  status: { tone: GaugeZone["tone"]; text: string; left: number; leftText: string } | null;
  suggestion: { kcal: number; protein: number; foods: { name: string; grams: number }[] } | null;
  meals: DayMeal[];
};

export type StatsData = {
  range: "week" | "month" | "quarter";
  from: string;
  end: string;
  phase: Phase["type"];
  kcalTarget: number | null;
  proteinTarget: number | null;
  days: DayTotals[];
  summary: StatsSummary;
  weight: { points: { date: string; kg: number }[]; current: number | null; currentDate: string | null; change: number | null };
  water: { avg: number; target: number };
};

export type PlanOption = { kcal: number; proteina_g: number; alimentos: { alimento: string; gramos: number; kcal: number; proteina_g?: number }[] };
export type PlanData =
  | { ok: false; missing: string[] }
  | { ok: true; phase: Phase | null; plan: { restante_kcal: number; restante_proteina_g: number; comidas: { comida: number; kcal_objetivo: number; proteina_objetivo_g: number; opciones: PlanOption[] }[] } };

export type ProfileData = {
  name: string;
  profile: NutritionProfile | null;
  age: number | null;
  complete: boolean;
  missing: string[];
  targets: Targets | null;
  health: { weight: number | null; bmi: number | null; bodyFat: number | null; bodyFatMeasured: boolean; leanMass: number | null };
  game: Gamification;
};

const CACHE = "nv:";

/**
 * Lee una ruta de la API: pinta al instante lo que había en la sesión y actualiza en segundo plano.
 * `key` cambia para forzar una recarga (por ejemplo, después de guardar).
 */
export function useNv<T>(url: string | null, key: unknown = 0) {
  // Vacío en el primer render (igual que en el servidor); la caché se pinta justo después.
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    try {
      const res = await fetch(url);
      const body = (await res.json()) as T & { error?: string };
      if (!res.ok) throw new Error(body.error ?? "No se pudo cargar");
      writeSession(CACHE + url, body);
      setData(body);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar");
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    if (!url) return;
    const cached = readSession<T>(CACHE + url);
    const t = window.setTimeout(() => {
      if (cached) setData(cached);
      void load();
    }, 0);
    return () => window.clearTimeout(t);
  }, [url, key, load]);

  return { data, error, loading, reload: load, setData };
}

export async function nvSend<T>(url: string, method: "POST" | "PUT" | "DELETE", body?: unknown): Promise<T> {
  const res = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error ?? "Algo salió mal");
  return data;
}

/** Borra la caché de un día (para que el Inicio refleje lo que se guardó en el chat). */
export function invalidateNv(prefix = "") {
  if (typeof window === "undefined") return;
  try {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const k = sessionStorage.key(i);
      if (k && k.includes(CACHE + prefix)) sessionStorage.removeItem(k);
    }
  } catch {
    // sin almacenamiento
  }
}

/** Mensaje que el chat debe escribir al abrir (lo dejan otras pantallas). */
export const CHAT_PREFILL = "nv:prefill";
/** Mensaje que el chat envía apenas abre. */
export const CHAT_AUTOSEND = "nv:autosend";

export function openChatWith(text: string, autoSend = false) {
  writeSession(autoSend ? CHAT_AUTOSEND : CHAT_PREFILL, text);
}

export const MOMENT_LABEL: Record<MealMoment, string> = {
  desayuno: "Desayuno",
  almuerzo: "Almuerzo",
  cena: "Cena",
  snack: "Snack",
  fiesta: "Fiesta",
};

export const PHASE_LABEL: Record<Phase["type"], string> = {
  deficit: "Déficit",
  mantenimiento: "Mantenimiento",
  recomposicion: "Recomposición",
  volumen: "Volumen",
};

export function dateLabel(date: string, today: string): string {
  if (date === today) return "Hoy";
  const d = new Date(`${date}T12:00:00Z`);
  const t = new Date(`${today}T12:00:00Z`);
  const diff = Math.round((t.getTime() - d.getTime()) / 86400000);
  if (diff === 1) return "Ayer";
  if (diff === -1) return "Mañana";
  return d.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "short", timeZone: "UTC" });
}

/** Preferencia de la app "Reducir movimiento" (además de la del sistema). */
export const CALM_KEY = "nv:calm";
