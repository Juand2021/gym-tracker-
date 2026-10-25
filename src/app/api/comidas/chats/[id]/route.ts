import { NextRequest, NextResponse } from "next/server";
import { getNutritionStore } from "@/lib/nutrition/server";
import { comidasProfile, errorResponse } from "../../guard";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const profile = comidasProfile(request);
  if (profile instanceof NextResponse) return profile;
  const { id } = await params;
  try {
    const chat = await getNutritionStore().getChat(id);
    if (!chat) return NextResponse.json({ error: "Conversación no encontrada" }, { status: 404 });
    return NextResponse.json({ chat });
  } catch (error) {
    return errorResponse(error, "Error al obtener la conversación");
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const profile = comidasProfile(request);
  if (profile instanceof NextResponse) return profile;
  const { id } = await params;
  try {
    await getNutritionStore().deleteChat(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error, "Error al borrar la conversación");
  }
}
