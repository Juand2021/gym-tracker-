import { NextRequest, NextResponse } from "next/server";
import { generateWeek, setWeekSlot, weekView } from "@/lib/nutrition/kitchen/server";
import { comidasProfile, errorResponse } from "../guard";

/** Plan de la semana (por lunes) con su lista de compras. */
export async function GET(request: NextRequest) {
  const profile = comidasProfile(request);
  if (profile instanceof NextResponse) return profile;
  try {
    return NextResponse.json(await weekView(profile, request.nextUrl.searchParams.get("start") ?? undefined));
  } catch (error) {
    return errorResponse(error, "Error al cargar la semana");
  }
}

/** Arma (o vuelve a armar desde hoy) la semana. */
export async function POST(request: NextRequest) {
  const profile = comidasProfile(request);
  if (profile instanceof NextResponse) return profile;
  try {
    const body = (await request.json().catch(() => ({}))) as { start?: string };
    return NextResponse.json(await generateWeek(profile, body.start));
  } catch (error) {
    return errorResponse(error, "Error al armar la semana");
  }
}

/** Cambia la receta de una comida: { start, date, index, recipeId }. */
export async function PUT(request: NextRequest) {
  const profile = comidasProfile(request);
  if (profile instanceof NextResponse) return profile;
  try {
    const b = (await request.json()) as { start: string; date: string; index: number; recipeId: string };
    return NextResponse.json(await setWeekSlot(profile, String(b.start), String(b.date), Number(b.index), String(b.recipeId)));
  } catch (error) {
    return errorResponse(error, "Error al cambiar la comida");
  }
}
