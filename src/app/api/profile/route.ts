import { NextRequest, NextResponse } from "next/server";
import { quotaResponse } from "@/lib/api-errors";
import { getNutritionStore } from "@/lib/nutrition/server";
import { ageOn, applyProfilePatch, todayInBogota, type ProfilePatch } from "@/lib/nutrition/profile";
import { profileFromRequest, unauthorized } from "@/lib/request-profile";

/**
 * Perfil único de la persona, compartido por Fuerza y Comidas.
 * Fuerza solo edita edad y estatura; Comidas edita todo desde su chat.
 */
export async function GET(request: NextRequest) {
  const profile = profileFromRequest(request);
  if (!profile) return unauthorized();
  try {
    const p = await getNutritionStore(profile).getProfile();
    return NextResponse.json({ profile: p, age: p?.birthDate ? ageOn(p.birthDate, todayInBogota()) : null });
  } catch (error) {
    const quota = quotaResponse(error);
    if (quota) return quota;
    const message = error instanceof Error ? error.message : "Error al leer el perfil";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Fuerza manda { age?, heightCm? }. La edad se guarda como fecha de nacimiento. */
export async function PUT(request: NextRequest) {
  const profile = profileFromRequest(request);
  if (!profile) return unauthorized();
  try {
    const body = (await request.json()) as { age?: number; heightCm?: number };
    const store = getNutritionStore(profile);
    const current = await store.getProfile();
    const today = todayInBogota();
    const patch: ProfilePatch = {};
    if (typeof body.heightCm === "number") patch.heightCm = body.heightCm;
    if (typeof body.age === "number") {
      const age = Math.round(body.age);
      if (current?.birthDate) {
        // Conserva el día y el mes; mueve el año hasta que la edad coincida.
        const shift = ageOn(current.birthDate, today) - age;
        if (shift !== 0) patch.birthDate = `${Number(current.birthDate.slice(0, 4)) + shift}${current.birthDate.slice(4)}`;
      } else {
        patch.birthDate = `${Number(today.slice(0, 4)) - age}-01-01`;
      }
    }
    if (!Object.keys(patch).length) return NextResponse.json({ profile: current });
    const { profile: next, errors } = applyProfilePatch(current, patch, today);
    if (errors.length) return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
    await store.saveProfile(next);
    return NextResponse.json({ profile: next, age: next.birthDate ? ageOn(next.birthDate, today) : null });
  } catch (error) {
    const quota = quotaResponse(error);
    if (quota) return quota;
    const message = error instanceof Error ? error.message : "Error al guardar el perfil";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
