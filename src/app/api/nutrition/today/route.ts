import { NextRequest, NextResponse } from "next/server";
import { nutritionEnabled, todaySummary } from "@/lib/nutrition/server";
import { profileFromRequest, unauthorized } from "@/lib/request-profile";

/** Lo consumido hoy vs objetivos, para la franja "Hoy" del chat. */
export async function GET(request: NextRequest) {
  const profile = profileFromRequest(request);
  if (!profile) return unauthorized();
  if (!nutritionEnabled(profile)) return NextResponse.json({ enabled: false });

  try {
    return NextResponse.json({ enabled: true, ...(await todaySummary(profile)) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al calcular el día";
    return NextResponse.json({ enabled: true, error: message }, { status: 500 });
  }
}
