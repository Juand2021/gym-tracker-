import { NextRequest, NextResponse } from "next/server";
import { timeInBogota, todayInBogota } from "@/lib/nutrition/profile";
import { getNutritionStore } from "@/lib/nutrition/server";
import { newId } from "@/lib/nutrition/store";
import { comidasProfile, errorResponse } from "../../../guard";

type Params = { params: Promise<{ id: string }> };

/** "Lo mismo de ayer": copia una comida a hoy. */
export async function POST(request: NextRequest, { params }: Params) {
  const profile = comidasProfile(request);
  if (profile instanceof NextResponse) return profile;
  const { id } = await params;
  try {
    const store = getNutritionStore(profile);
    const meal = await store.getMeal(id);
    if (!meal) return NextResponse.json({ error: "Comida no encontrada" }, { status: 404 });
    const now = new Date();
    const copy = { ...meal, id: newId(), date: todayInBogota(now), time: timeInBogota(now), chatThreadId: null, createdAt: now.toISOString(), updatedAt: now.toISOString() };
    await store.saveMeal(copy);
    return NextResponse.json({ meal: copy });
  } catch (error) {
    return errorResponse(error, "Error al duplicar la comida");
  }
}
