import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "gym_auth";

export function getAuthCookieName() {
  return COOKIE_NAME;
}

function getSecret() {
  const pin = process.env.SITE_PIN;
  if (!pin) {
    throw new Error("SITE_PIN no está configurado");
  }
  return pin;
}

export function createAuthToken(): string {
  const secret = getSecret();
  return createHmac("sha256", secret).update("gym-tracker-auth").digest("hex");
}

export function isValidAuthToken(token: string | undefined): boolean {
  if (!token || !process.env.SITE_PIN) return false;
  try {
    const expected = createAuthToken();
    const a = Buffer.from(token);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function verifyPin(pin: string): boolean {
  const expected = process.env.SITE_PIN;
  if (!expected) return false;
  const a = Buffer.from(pin);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
