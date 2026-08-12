/** Parse weights/reps that may use a comma decimal (e.g. "4,5" → 4.5). */
export function parseDecimal(value: unknown): number {
  if (typeof value === "number") return value;
  if (value == null) return NaN;

  const raw = String(value).trim().replace(/\s/g, "");
  if (!raw) return NaN;

  // "4,5" or "4.5"; if both separators appear, treat the last as decimal.
  let normalized = raw;
  const lastComma = raw.lastIndexOf(",");
  const lastDot = raw.lastIndexOf(".");
  if (lastComma >= 0 && lastDot >= 0) {
    if (lastComma > lastDot) {
      normalized = raw.replace(/\./g, "").replace(",", ".");
    } else {
      normalized = raw.replace(/,/g, "");
    }
  } else if (lastComma >= 0) {
    normalized = raw.replace(",", ".");
  }

  return Number(normalized);
}

export function isValidWeight(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

export function isValidReps(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}
