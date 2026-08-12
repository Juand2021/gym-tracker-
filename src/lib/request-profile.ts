import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  getAuthCookieName,
  getProfileCookieName,
  resolveSession,
} from "@/lib/auth";
import type { Profile } from "@/lib/profiles";

export function profileFromRequest(request: NextRequest): Profile | null {
  return resolveSession(
    request.cookies.get(getAuthCookieName())?.value,
    request.cookies.get(getProfileCookieName())?.value,
  );
}

export async function profileFromCookies(): Promise<Profile | null> {
  const jar = await cookies();
  return resolveSession(
    jar.get(getAuthCookieName())?.value,
    jar.get(getProfileCookieName())?.value,
  );
}

export function unauthorized() {
  return NextResponse.json({ error: "No autorizado" }, { status: 401 });
}
