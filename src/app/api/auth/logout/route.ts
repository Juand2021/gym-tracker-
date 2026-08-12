import { NextResponse } from "next/server";
import { getAuthCookieName, getProfileCookieName } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  const clear = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  };
  response.cookies.set({ name: getAuthCookieName(), value: "", ...clear });
  response.cookies.set({ name: getProfileCookieName(), value: "", ...clear });
  return response;
}
