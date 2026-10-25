import type { PhaseType } from "./profile.ts";
import { PARTY_ETHANOL_G } from "./targets.ts";
import type { Meal } from "./store.ts";

/**
 * Cálculos de las pantallas de NutriVerse (funciones puras, con pruebas en views.test.ts):
 * velocímetro, estadísticas por rango y nivel/puntos/logros.
 */

// ───────── Velocímetro ─────────

export type GaugeZone = { from: number; to: number; tone: "ok" | "warn" | "over" };
export type Gauge = {
  /** "under" = no pasar el límite (déficit); "over" = superar el mínimo (volumen); "band" = mantenerse cerca. */
  mode: "under" | "over" | "band";
  max: number;
  target: number;
  zones: GaugeZone[];
  limitLabel: string;
  ticks: number[];
};

export function gaugeFor(phase: PhaseType, target: number): Gauge {
  const max = Math.ceil((target * 1.5) / 250) * 250;
  const step = max > 3000 ? 500 : 250;
  const ticks = Array.from({ length: Math.floor(max / step) + 1 }, (_, i) => i * step);
  if (phase === "deficit") {
    return {
      mode: "under",
      max,
      target,
      zones: [
        { from: 0, to: target * 0.9, tone: "ok" },
        { from: target * 0.9, to: target, tone: "warn" },
        { from: target, to: max, tone: "over" },
      ],
      limitLabel: "Límite del déficit",
      ticks,
    };
  }
  if (phase === "volumen") {
    return {
      mode: "over",
      max,
      target,
      zones: [
        { from: 0, to: target * 0.9, tone: "over" },
        { from: target * 0.9, to: target, tone: "warn" },
        { from: target, to: Math.min(max, target * 1.1), tone: "ok" },
        { from: Math.min(max, target * 1.1), to: max, tone: "warn" },
      ],
      limitLabel: "Mínimo del volumen",
      ticks,
    };
  }
  return {
    mode: "band",
    max,
    target,
    zones: [
      { from: 0, to: target * 0.9, tone: "warn" },
      { from: target * 0.9, to: target * 1.05, tone: "ok" },
      { from: target * 1.05, to: max, tone: "over" },
    ],
    limitLabel: phase === "recomposicion" ? "Meta de recomposición" : "Mantenimiento",
    ticks,
  };
}

/** Frase y tono del estado del día para el chip del velocímetro. */
export function gaugeStatus(g: Gauge, kcal: number): { tone: GaugeZone["tone"]; text: string; left: number; leftText: string } {
  const diff = Math.round(g.target - kcal);
  const fmt = (n: number) => Math.abs(n).toLocaleString("es-CO");
  if (g.mode === "under") {
    if (kcal > g.target) return { tone: "over", text: `Te pasaste ${fmt(diff)} kcal`, left: diff, leftText: `${fmt(diff)} kcal sobre tu límite` };
    if (kcal >= g.target * 0.9) return { tone: "warn", text: "Cerca del límite", left: diff, leftText: `Faltan ${fmt(diff)} kcal para tu límite` };
    return { tone: "ok", text: "Déficit activo · ¡vas por buen camino!", left: diff, leftText: `Faltan ${fmt(diff)} kcal para tu límite` };
  }
  if (g.mode === "over") {
    if (kcal >= g.target) return { tone: "ok", text: "¡Mínimo del volumen cumplido!", left: diff, leftText: kcal > g.target * 1.1 ? `${fmt(diff)} kcal sobre tu mínimo` : "Mínimo cumplido" };
    return { tone: kcal >= g.target * 0.9 ? "warn" : "over", text: `Te faltan ${fmt(diff)} kcal para tu mínimo`, left: diff, leftText: `Faltan ${fmt(diff)} kcal para tu mínimo` };
  }
  if (Math.abs(diff) <= g.target * 0.05) return { tone: "ok", text: "En tu meta de hoy", left: diff, leftText: "Dentro de tu meta" };
  if (diff > 0) return { tone: "warn", text: `Te faltan ${fmt(diff)} kcal`, left: diff, leftText: `Faltan ${fmt(diff)} kcal para tu meta` };
  return { tone: "over", text: `Te pasaste ${fmt(diff)} kcal`, left: diff, leftText: `${fmt(diff)} kcal sobre tu meta` };
}

/** ¿El día quedó "en meta"? (para estadísticas y puntos) */
export function dayInZone(phase: PhaseType, kcal: number, target: number): boolean {
  if (kcal <= 0) return false;
  if (phase === "deficit") return kcal <= target && kcal >= target * 0.7;
  if (phase === "volumen") return kcal >= target && kcal <= target * 1.15;
  return Math.abs(kcal - target) <= target * 0.07;
}

// ───────── Estadísticas ─────────

export type DayTotals = { date: string; kcal: number; protein: number; fat: number; carbs: number; alcohol: number; meals: number; party: boolean; inZone: boolean; proteinMet: boolean };

export function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function dailyTotals(meals: Meal[], from: string, to: string, phase: PhaseType, kcalTarget: number, proteinTarget: number): DayTotals[] {
  const out: DayTotals[] = [];
  for (let d = from; d <= to; d = shiftDate(d, 1)) {
    const ms = meals.filter((m) => m.date === d);
    const kcal = Math.round(ms.reduce((a, m) => a + m.totals.kcal, 0));
    const protein = Math.round(ms.reduce((a, m) => a + m.totals.protein_g, 0));
    const alcohol = Math.round(ms.reduce((a, m) => a + (m.totals.alcohol_g ?? 0), 0));
    out.push({
      date: d,
      kcal,
      protein,
      fat: Math.round(ms.reduce((a, m) => a + m.totals.fat_g, 0)),
      carbs: Math.round(ms.reduce((a, m) => a + m.totals.carb_g, 0)),
      alcohol,
      meals: ms.length,
      party: alcohol > PARTY_ETHANOL_G,
      inZone: dayInZone(phase, kcal, kcalTarget),
      proteinMet: protein >= proteinTarget * 0.9,
    });
  }
  return out;
}

export type StatsSummary = {
  loggedDays: number;
  avgKcal: number;
  avgProtein: number;
  daysInZone: number;
  proteinDays: number;
  partyDays: string[];
  /** Suma de (kcal − objetivo) en los días registrados: negativo = por debajo. */
  balance: number;
  macroPct: { protein: number; carbs: number; fat: number; alcohol: number };
  /** Consejo del balance en español simple. */
  balanceText: string;
};

export function summarize(days: DayTotals[], phase: PhaseType, kcalTarget: number): StatsSummary {
  const logged = days.filter((d) => d.meals > 0);
  const n = Math.max(1, logged.length);
  const sum = (f: (d: DayTotals) => number) => logged.reduce((a, d) => a + f(d), 0);
  const kcalP = sum((d) => d.protein * 4);
  const kcalC = sum((d) => d.carbs * 4);
  const kcalF = sum((d) => d.fat * 9);
  const kcalA = sum((d) => d.alcohol * 7);
  const total = Math.max(1, kcalP + kcalC + kcalF + kcalA);
  const balance = Math.round(sum((d) => d.kcal - kcalTarget));
  const partyDays = logged.filter((d) => d.party).map((d) => d.date);
  let balanceText: string;
  if (!logged.length) balanceText = "Todavía no hay días registrados en este rango.";
  else if (phase === "volumen") balanceText = balance >= 0 ? `Vas ${Math.abs(balance).toLocaleString("es-CO")} kcal por encima de tu mínimo: buen ritmo de volumen.` : `Te faltaron ${Math.abs(balance).toLocaleString("es-CO")} kcal para tus mínimos.`;
  else if (balance <= 0) balanceText = `Vas ${Math.abs(balance).toLocaleString("es-CO")} kcal por debajo de tu límite en el rango. ¡Bien!`;
  else {
    const perDay = Math.round(balance / 4 / 10) * 10;
    balanceText = `${partyDays.length ? "Las fiestas sumaron" : "Te pasaste"} ${balance.toLocaleString("es-CO")} kcal en el rango: repartidas en 4 días son ~${perDay.toLocaleString("es-CO")} kcal menos por día (sin bajar la proteína).`;
  }
  return {
    loggedDays: logged.length,
    avgKcal: Math.round(sum((d) => d.kcal) / n),
    avgProtein: Math.round(sum((d) => d.protein) / n),
    daysInZone: logged.filter((d) => d.inZone).length,
    proteinDays: logged.filter((d) => d.proteinMet).length,
    partyDays,
    balance,
    macroPct: {
      protein: Math.round((kcalP / total) * 100),
      carbs: Math.round((kcalC / total) * 100),
      fat: Math.round((kcalF / total) * 100),
      alcohol: Math.round((kcalA / total) * 100),
    },
    balanceText,
  };
}

// ───────── Nivel, puntos y logros ─────────

export const POINTS = { meal: 10, dayInZone: 30, proteinDay: 20 } as const;
export const POINTS_PER_LEVEL = 500;

export type Achievement = { id: "racha" | "comidas" | "metas" | "mejora"; title: string; value: number; label: string; unlocked: boolean };
export type Gamification = { points: number; level: number; levelStart: number; levelEnd: number; streak: number; achievements: Achievement[] };

/** Días seguidos (hasta hoy o ayer) con al menos una comida registrada. */
export function streakDays(days: DayTotals[], today: string): number {
  const logged = new Set(days.filter((d) => d.meals > 0).map((d) => d.date));
  let cursor = logged.has(today) ? today : shiftDate(today, -1);
  let n = 0;
  while (logged.has(cursor)) {
    n++;
    cursor = shiftDate(cursor, -1);
  }
  return n;
}

export function gamification(days: DayTotals[], today: string, weighIns: number): Gamification {
  const meals = days.reduce((a, d) => a + d.meals, 0);
  const inZone = days.filter((d) => d.inZone).length;
  const proteinDays = days.filter((d) => d.meals > 0 && d.proteinMet).length;
  const points = meals * POINTS.meal + inZone * POINTS.dayInZone + proteinDays * POINTS.proteinDay;
  const level = Math.floor(points / POINTS_PER_LEVEL) + 1;
  const streak = streakDays(days, today);
  return {
    points,
    level,
    levelStart: (level - 1) * POINTS_PER_LEVEL,
    levelEnd: level * POINTS_PER_LEVEL,
    streak,
    achievements: [
      { id: "racha", title: "Racha", value: streak, label: `${streak} ${streak === 1 ? "día" : "días"} seguidos`, unlocked: streak >= 3 },
      { id: "comidas", title: "Registro", value: meals, label: `${meals} comidas`, unlocked: meals >= 10 },
      { id: "metas", title: "En meta", value: inZone, label: `${inZone} ${inZone === 1 ? "día" : "días"} en meta`, unlocked: inZone >= 5 },
      { id: "mejora", title: "Constancia", value: weighIns, label: `${weighIns} ${weighIns === 1 ? "pesaje" : "pesajes"}`, unlocked: weighIns >= 4 },
    ],
  };
}
