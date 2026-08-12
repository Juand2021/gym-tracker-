import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { describe, it } from "node:test";
import { getProfileById, getProfiles } from "./profiles.ts";

function tokenFor(pin: string) {
  return createHmac("sha256", pin).update("gym-tracker-auth").digest("hex");
}

describe("profiles multi-pin", () => {
  it("incluye Laura con PIN 2026 por defecto y dataRoot namespaced", () => {
    const laura = getProfiles().find((p) => p.id === "laura");
    assert.ok(laura);
    assert.equal(laura!.pin, process.env.SITE_PIN_LAURA?.trim() || "2026");
    assert.equal(laura!.dataRoot, "namespaced");
    assert.equal(laura!.displayName, "Laura");
  });

  it("Juan usa legacy si SITE_PIN está definido", () => {
    if (!process.env.SITE_PIN) return;
    const juan = getProfileById("juan");
    assert.ok(juan);
    assert.equal(juan!.dataRoot, "legacy");
    assert.equal(juan!.pin, process.env.SITE_PIN.trim());
  });

  it("tokens de PIN distintos no coinciden entre perfiles", () => {
    const lauraPin = process.env.SITE_PIN_LAURA?.trim() || "2026";
    const lauraToken = tokenFor(lauraPin);
    assert.notEqual(lauraToken, tokenFor("0000"));
    if (process.env.SITE_PIN) {
      assert.notEqual(lauraToken, tokenFor(process.env.SITE_PIN.trim()));
    }
  });
});
