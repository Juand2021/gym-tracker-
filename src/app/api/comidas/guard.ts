import { NextRequest, NextResponse } from "next/server";
import { quotaResponse } from "@/lib/api-errors";
import { nutritionEnabled } from "@/lib/nutrition/server";
import type { Profile } from "@/lib/profiles";
import { profileFromRequest, unauthorized } from "@/lib/request-profile";

/** Solo los perfiles con acceso a Comidas (COMIDAS_PROFILES). */
export function comidasProfile(request: NextRequest): Profile | NextResponse {
  const profile = profileFromRequest(request);
  if (!profile) return unauthorized();
  if (!nutritionEnabled(profile)) return NextResponse.json({ error: "Comidas no está disponible para este perfil" }, { status: 403 });
  return profile;
}

export function errorResponse(error: unknown, fallback: string, status = 500) {
  const quota = quotaResponse(error);
  if (quota) return quota;
  const message = error instanceof Error ? error.message : fallback;
  const code = typeof (error as { status?: unknown })?.status === "number" ? (error as { status: number }).status : status;
  return NextResponse.json({ error: message }, { status: code });
}
