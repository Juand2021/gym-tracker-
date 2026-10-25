import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Meal } from "./store.ts";
import { dailyTotals, dayInZone, gamification, gaugeFor, gaugeStatus, shiftDate, streakDays, summarize } from "./views.ts";

const meal = (date: string, kcal: number, protein = 40, alcohol = 0): Meal => ({
  id: `${date}-${kcal}`,
  date,
  time: "13:00",
  moment: "almuerzo",
  text: "",
  items: [],
  totals: { kcal, protein_g: protein, fat_g: 20, carb_g: 50, fiber_g: 5, alcohol_g: alcohol },
  engineVersion: "t",
  chatThreadId: null,
  createdAt: "",
  updatedAt: "",
});

describe("velocímetro", () => {
  it("déficit: verde hasta el límite, rojo después", () => {
    const g = gaugeFor("deficit", 1880);
    assert.equal(g.mode, "under");
    assert.equal(g.zones.at(-1)?.tone, "over");
    assert.equal(g.zones.at(-1)?.from, 1880);
    assert.ok(g.max >= 1880 * 1.5);
    assert.equal(g.ticks[0], 0);
  });
  it("déficit: estados del chip", () => {
    const g = gaugeFor("deficit", 2000);
    assert.equal(gaugeStatus(g, 1450).tone, "ok");
    assert.equal(gaugeStatus(g, 1450).leftText, "Faltan 550 kcal para tu límite");
    assert.equal(gaugeStatus(g, 1950).tone, "warn");
    assert.equal(gaugeStatus(g, 2200).tone, "over");
  });
  it("volumen: hay que pasar el mínimo", () => {
    const g = gaugeFor("volumen", 3000);
    assert.equal(g.mode, "over");
    assert.equal(g.zones[0].tone, "over");
    assert.equal(gaugeStatus(g, 3100).tone, "ok");
    assert.equal(gaugeStatus(g, 2000).tone, "over");
  });
  it("mantenimiento: banda alrededor de la meta", () => {
    const g = gaugeFor("mantenimiento", 2500);
    assert.equal(g.mode, "band");
    assert.equal(gaugeStatus(g, 2450).tone, "ok");
  });
});

describe("estadísticas", () => {
  const meals = [meal("2026-10-20", 1700, 180), meal("2026-10-21", 2600, 120, 90), meal("2026-10-23", 1800, 170)];
  const days = dailyTotals(meals, "2026-10-19", "2026-10-25", "deficit", 1880, 183);
  it("un día por fecha del rango", () => {
    assert.equal(days.length, 7);
    assert.equal(days[0].date, "2026-10-19");
    assert.equal(days[0].meals, 0);
  });
  it("marca fiesta y días en meta", () => {
    assert.equal(days.find((d) => d.date === "2026-10-21")?.party, true);
    assert.equal(days.find((d) => d.date === "2026-10-20")?.inZone, true);
    assert.equal(days.find((d) => d.date === "2026-10-21")?.inZone, false);
  });
  it("resumen y balance de la fiesta", () => {
    const s = summarize(days, "deficit", 1880);
    assert.equal(s.loggedDays, 3);
    assert.equal(s.daysInZone, 2);
    assert.equal(s.partyDays.length, 1);
    assert.equal(s.balance, 1700 + 2600 + 1800 - 3 * 1880);
    assert.match(s.balanceText, /fiestas sumaron/);
    const pct = s.macroPct;
    assert.ok(Math.abs(pct.protein + pct.carbs + pct.fat + pct.alcohol - 100) <= 2);
  });
  it("comer muy poco no cuenta como día en meta", () => {
    assert.equal(dayInZone("deficit", 900, 1880), false);
  });
});

describe("nivel, puntos y logros", () => {
  it("racha de días seguidos", () => {
    const meals = ["2026-10-22", "2026-10-23", "2026-10-24"].map((d) => meal(d, 1800, 180));
    const days = dailyTotals(meals, "2026-10-01", "2026-10-25", "deficit", 1880, 183);
    assert.equal(streakDays(days, "2026-10-25"), 3);
    assert.equal(streakDays(days, "2026-10-24"), 3);
  });
  it("puntos y nivel", () => {
    const meals = Array.from({ length: 10 }, (_, i) => meal(shiftDate("2026-10-10", i), 1800, 180));
    const days = dailyTotals(meals, "2026-10-01", "2026-10-25", "deficit", 1880, 183);
    const g = gamification(days, "2026-10-25", 2);
    assert.equal(g.points, 10 * (10 + 30 + 20));
    assert.equal(g.level, 2);
    assert.equal(g.levelStart, 500);
    assert.equal(g.achievements.find((a) => a.id === "comidas")?.unlocked, true);
    assert.equal(g.achievements.find((a) => a.id === "mejora")?.unlocked, false);
  });
});
