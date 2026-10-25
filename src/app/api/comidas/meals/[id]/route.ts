import { NextRequest, NextResponse } from "next/server";
import { getNutritionStore } from "@/lib/nutrition/server";
import { comidasProfile, errorResponse } from "../../guard";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const profile = comidasProfile(request);
  if (profile instanceof NextResponse) return profile;
  const { id } = await params;
  try {
    const meal = await getNutritionStore(profile).getMeal(id);
    if (!meal) return NextResponse.json({ error: "Comida no encontrada" }, { status: 404 });
    return NextResponse.json({ meal });
  } catch (error) {
    return errorResponse(error, "Error al leer la comida");
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const profile = comidasProfile(request);
  if (profile instanceof NextResponse) return profile;
  const { id } = await params;
  try {
    await getNutritionStore(profile).deleteMeal(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error, "Error al borrar la comida");
  }
}
