import { NextRequest, NextResponse } from "next/server";
import { getNutritionStore } from "@/lib/nutrition/server";
import { comidasProfile, errorResponse } from "../guard";

export async function GET(request: NextRequest) {
  const profile = comidasProfile(request);
  if (profile instanceof NextResponse) return profile;
  try {
    const chats = await getNutritionStore().listChats();
    return NextResponse.json({
      chats: chats.map((c) => ({
        id: c.id,
        title: c.title,
        updatedAt: c.updatedAt,
        messageCount: c.messages.length,
        lastMessageSnippet: c.messages[c.messages.length - 1]?.content.slice(0, 90) ?? "",
      })),
    });
  } catch (error) {
    return errorResponse(error, "Error al listar conversaciones");
  }
}
