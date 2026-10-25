import { NextRequest, NextResponse } from "next/server";
import { todayInBogota } from "@/lib/nutrition/profile";
import { getNutritionStore } from "@/lib/nutrition/server";
import { comidasProfile, errorResponse } from "../guard";

/** Suma (o resta) agua del día: { deltaMl, date? }. */
export async function POST(request: NextRequest) {
  const profile = comidasProfile(request);
  if (profile instanceof NextResponse) return profile;
  try {
    const body = (await request.json()) as { deltaMl?: number; date?: string };
    const delta = Number(body.deltaMl);
    if (!Number.isFinite(delta) || Math.abs(delta) > 3000) return NextResponse.json({ error: "Cantidad inválida" }, { status: 400 });
    const date = body.date && /^\d{4}-\d{2}-\d{2}$/.test(body.date) ? body.date : todayInBogota();
    const store = getNutritionStore(profile);
    const ml = Math.max(0, Math.min(8000, (await store.getWater(date)) + delta));
    await store.setWater(date, ml);
    return NextResponse.json({ date, water: ml });
  } catch (error) {
    return errorResponse(error, "Error al guardar el agua");
  }
}
