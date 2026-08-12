export type ProfileId = "juan" | "laura";

export type Profile = {
  id: ProfileId;
  displayName: string;
  pin: string;
  /**
   * legacy = colecciones raíz actuales (workouts, bodyWeight) — Juan, sin migración.
   * namespaced = users/{id}/workouts|bodyWeight — perfiles nuevos.
   */
  dataRoot: "legacy" | "namespaced";
};

/** Perfiles activos según env. SITE_PIN = Juan; SITE_PIN_LAURA (default 2026) = Laura. */
export function getProfiles(): Profile[] {
  const profiles: Profile[] = [];
  const juanPin = process.env.SITE_PIN?.trim();
  if (juanPin) {
    profiles.push({
      id: "juan",
      displayName: "Juan",
      pin: juanPin,
      dataRoot: "legacy",
    });
  }

  const lauraPin = (process.env.SITE_PIN_LAURA ?? "2026").trim();
  if (lauraPin) {
    profiles.push({
      id: "laura",
      displayName: "Laura",
      pin: lauraPin,
      dataRoot: "namespaced",
    });
  }

  return profiles;
}

export function getProfileById(id: string | undefined): Profile | null {
  if (!id) return null;
  return getProfiles().find((p) => p.id === id) ?? null;
}

export function isValidProfileId(value: string): value is ProfileId {
  return value === "juan" || value === "laura";
}
