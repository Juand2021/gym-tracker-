import { NextResponse } from "next/server";
import { nutritionEnabled } from "@/lib/nutrition/server";
import { profileFromCookies, unauthorized } from "@/lib/request-profile";

export async function GET() {
  const profile = await profileFromCookies();
  if (!profile) return unauthorized();
  return NextResponse.json({
    profile: { id: profile.id, displayName: profile.displayName },
    // Apps disponibles para esta persona (el menú del logo).
    apps: nutritionEnabled(profile) ? ["fuerza", "comidas"] : ["fuerza"],
  });
}
