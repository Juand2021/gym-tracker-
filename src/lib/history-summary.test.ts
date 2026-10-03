import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { dateParts, groupByMonth, weightStats } from "./history-summary.ts";

describe("history-summary", () => {
  it("descompone fechas sin depender de la zona horaria", () => {
    // 3 de octubre de 2026 es sábado
    assert.deepEqual(dateParts("2026-10-03"), {
      day: 3,
      monthAbbr: "oct",
      weekday: "sáb",
      monthKey: "2026-10",
      monthLabel: "Octubre 2026",
    });
    assert.equal(dateParts("no-es-fecha"), null);
  });

  it("agrupa por mes del más reciente al más antiguo", () => {
    const groups = groupByMonth([
      { date: "2026-09-10" },
      { date: "2026-10-02" },
      { date: "2026-09-28" },
    ]);
    assert.deepEqual(groups.map((g) => [g.label, g.items.map((i) => i.date)]), [
      ["Octubre 2026", ["2026-10-02"]],
      ["Septiembre 2026", ["2026-09-28", "2026-09-10"]],
    ]);
  });

  it("calcula estadísticas y variación del peso", () => {
    const stats = weightStats([
      { id: "b", date: "2026-09-15", weightKg: 73.6 },
      { id: "a", date: "2026-09-01", weightKg: 74 },
      { id: "c", date: "2026-10-01", weightKg: 73.2 },
    ]);
    assert.equal(stats.min, 73.2);
    assert.equal(stats.max, 74);
    assert.equal(stats.avg, 73.6);
    assert.equal(stats.totalChange, -0.8);
    assert.deepEqual(stats.series, [74, 73.6, 73.2]);
    assert.deepEqual(stats.rows.map((r) => [r.date, r.delta]), [
      ["2026-10-01", -0.4],
      ["2026-09-15", -0.4],
      ["2026-09-01", null],
    ]);
    assert.equal(weightStats([]).min, null);
  });
});
