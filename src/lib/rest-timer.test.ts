import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calculateSecondsFromDialAngle,
  formatTimerDisplay,
  MAX_TIMER_SECONDS,
  snapTimerSeconds,
} from "./rest-timer.ts";

describe("RestTimer: time formatting & limits", () => {
  it("limita el tiempo máximo a 3 minutos (180 segundos)", () => {
    assert.equal(MAX_TIMER_SECONDS, 180);
  });

  it("formatea segundos a mm:ss correctamente", () => {
    assert.equal(formatTimerDisplay(0), "00:00");
    assert.equal(formatTimerDisplay(30), "00:30");
    assert.equal(formatTimerDisplay(60), "01:00");
    assert.equal(formatTimerDisplay(90), "01:30");
    assert.equal(formatTimerDisplay(120), "02:00");
    assert.equal(formatTimerDisplay(180), "03:00");
  });

  it("calcula segundos redondeados a múltiplos de 5", () => {
    assert.equal(snapTimerSeconds(2), 5);
    assert.equal(snapTimerSeconds(23), 25);
    assert.equal(snapTimerSeconds(88), 90);
    assert.equal(snapTimerSeconds(182), 180);
  });

  it("calcula segundos a partir de ángulo del dial", () => {
    // A las 12 (arriba): dx = 0, dy = -100 => 0 seg o 180 seg
    // A las 3 (derecha): dx = 100, dy = 0 => 45 seg (1/4 del círculo de 180s)
    const cx = 100;
    const cy = 100;
    const rightSec = calculateSecondsFromDialAngle(200, 100, cx, cy);
    assert.equal(rightSec, 45);

    // A las 6 (abajo): dx = 0, dy = 100 => 90 seg (1/2 del círculo de 180s)
    const bottomSec = calculateSecondsFromDialAngle(100, 200, cx, cy);
    assert.equal(bottomSec, 90);

    // A las 9 (izquierda): dx = -100, dy = 0 => 135 seg (3/4 del círculo de 180s)
    const leftSec = calculateSecondsFromDialAngle(0, 100, cx, cy);
    assert.equal(leftSec, 135);
  });
});
