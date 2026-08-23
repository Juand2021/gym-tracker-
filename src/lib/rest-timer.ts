/** Constantes y utilidades para el temporizador de descanso */
export const MAX_TIMER_SECONDS = 180; // 3 minutos máximo

export function formatTimerDisplay(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function snapTimerSeconds(rawSeconds: number, step = 5): number {
  const snapped = Math.round(rawSeconds / step) * step;
  return Math.min(MAX_TIMER_SECONDS, Math.max(step, snapped));
}

export function calculateSecondsFromDialAngle(
  clientX: number,
  clientY: number,
  centerX: number,
  centerY: number,
): number {
  const dx = clientX - centerX;
  const dy = clientY - centerY;

  let angleRad = Math.atan2(dy, dx);
  let angleDeg = (angleRad * 180) / Math.PI + 90;
  if (angleDeg < 0) angleDeg += 360;

  const rawSec = (angleDeg / 360) * MAX_TIMER_SECONDS;
  return snapTimerSeconds(rawSec);
}
