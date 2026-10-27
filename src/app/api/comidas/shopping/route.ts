import { NextRequest, NextResponse } from "next/server";
import { shoppingToPantry, toggleShopping } from "@/lib/nutrition/kitchen/server";
import { comidasProfile, errorResponse } from "../guard";

/** Marcar o desmarcar algo de la lista de compras: { key, checked }. */
export async function PUT(request: NextRequest) {
  const profile = comidasProfile(request);
  if (profile instanceof NextResponse) return profile;
  try {
    const b = (await request.json()) as { key: string; checked: boolean };
    return NextResponse.json(await toggleShopping(profile, String(b.key), Boolean(b.checked)));
  } catch (error) {
    return errorResponse(error, "Error al guardar la lista");
  }
}

/** "Ya compré": lo marcado pasa a la despensa. */
export async function POST(request: NextRequest) {
  const profile = comidasProfile(request);
  if (profile instanceof NextResponse) return profile;
  try {
    return NextResponse.json(await shoppingToPantry(profile));
  } catch (error) {
    return errorResponse(error, "Error al pasar a la despensa");
  }
}
