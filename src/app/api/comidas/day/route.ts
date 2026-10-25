import { NextRequest, NextResponse } from "next/server";
import { daySummary } from "@/lib/nutrition/server";
import { comidasProfile, errorResponse } from "../guard";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Un día (Inicio): velocímetro, macros, agua, comidas y sugerencia. ?date=YYYY-MM-DD (por defecto hoy). */
export async function GET(request: NextRequest) {
  const profile = comidasProfile(request);
  if (profile instanceof NextResponse) return profile;
  const date = request.nextUrl.searchParams.get("date");
  if (date && !DATE_RE.test(date)) return NextResponse.json({ error: "Fecha inválida" }, { status: 400 });
  try {
    return NextResponse.json(await daySummary(profile, date ?? undefined));
  } catch (error) {
    return errorResponse(error, "Error al calcular el día");
  }
}
