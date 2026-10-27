import { NextRequest, NextResponse } from "next/server";
import { weekSlotOptions } from "@/lib/nutrition/kitchen/server";
import { comidasProfile, errorResponse } from "../../guard";

/** Recetas para cambiar una comida de la semana: ?start=&date=&index= */
export async function GET(request: NextRequest) {
  const profile = comidasProfile(request);
  if (profile instanceof NextResponse) return profile;
  const q = request.nextUrl.searchParams;
  try {
    return NextResponse.json({ options: await weekSlotOptions(profile, q.get("start") ?? "", q.get("date") ?? "", Number(q.get("index") ?? 0)) });
  } catch (error) {
    return errorResponse(error, "Error al buscar opciones");
  }
}
