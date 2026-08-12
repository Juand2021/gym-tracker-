import { createHmac, timingSafeEqual } from "crypto";
import {
  getProfileById,
  getProfiles,
  type Profile,
} from "./profiles";

const AUTH_COOKIE = "gym_auth";
const PROFILE_COOKIE = "gym_profile";

export function getAuthCookieName() {
  return AUTH_COOKIE;
}

export function getProfileCookieName() {
  return PROFILE_COOKIE;
}

function safeEqualStrings(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function createAuthTokenForPin(pin: string): string {
  return createHmac("sha256", pin).update("gym-tracker-auth").digest("hex");
}

/** @deprecated use createAuthTokenForPin with profile.pin */
export function createAuthToken(): string {
  const juan = getProfiles().find((p) => p.id === "juan");
  if (!juan) throw new Error("SITE_PIN no está configurado");
  return createAuthTokenForPin(juan.pin);
}

export function isValidAuthToken(token: string | undefined): boolean {
  if (!token) return false;
  return getProfiles().some((profile) => {
    try {
      return safeEqualStrings(token, createAuthTokenForPin(profile.pin));
    } catch {
      return false;
    }
  });
}

export function verifyPin(pin: string): Profile | null {
  const trimmed = pin.trim();
  if (!trimmed) return null;
  for (const profile of getProfiles()) {
    if (safeEqualStrings(trimmed, profile.pin)) return profile;
  }
  return null;
}

export function resolveSession(
  authToken: string | undefined,
  profileId: string | undefined,
): Profile | null {
  if (!authToken || !profileId) return null;
  const profile = getProfileById(profileId);
  if (!profile) return null;
  try {
    if (!safeEqualStrings(authToken, createAuthTokenForPin(profile.pin))) {
      return null;
    }
  } catch {
    return null;
  }
  return profile;
}

export function hasAnySitePinConfigured(): boolean {
  return getProfiles().length > 0;
}
