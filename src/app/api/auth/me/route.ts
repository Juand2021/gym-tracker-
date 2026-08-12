import { NextResponse } from "next/server";
import { profileFromCookies, unauthorized } from "@/lib/request-profile";

export async function GET() {
  const profile = await profileFromCookies();
  if (!profile) return unauthorized();
  return NextResponse.json({
    profile: { id: profile.id, displayName: profile.displayName },
  });
}
