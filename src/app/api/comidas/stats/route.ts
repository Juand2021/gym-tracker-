import { NextRequest, NextResponse } from "next/server";
import { statsFor, type StatsRange } from "@/lib/nutrition/server";
import { comidasProfile, errorResponse } from "../guard";

/** Estadísticas: ?range=week|month|quarter&end=YYYY-MM-DD */
export async function GET(request: NextRequest) {
  const profile = comidasProfile(request);
  if (profile instanceof NextResponse) return profile;
  const range = (request.nextUrl.searchParams.get("range") ?? "week") as StatsRange;
  const end = request.nextUrl.searchParams.get("end");
  if (!["week", "month", "quarter"].includes(range)) return NextResponse.json({ error: "Rango inválido" }, { status: 400 });
  if (end && !/^\d{4}-\d{2}-\d{2}$/.test(end)) return NextResponse.json({ error: "Fecha inválida" }, { status: 400 });
  try {
    return NextResponse.json(await statsFor(profile, range, end ?? undefined));
  } catch (error) {
    return errorResponse(error, "Error al calcular las estadísticas");
  }
}
