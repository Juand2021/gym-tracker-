import { readFileSync } from "fs";
import { resolve } from "path";
import { createBodyWeight, listBodyWeight, listWorkouts } from "../src/lib/data";
import { isFirebaseConfigured } from "../src/lib/firebase";

function loadEnvLocal() {
  const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 1) continue;
    const key = line.slice(0, i);
    let value = line.slice(i + 1);
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

async function main() {
  loadEnvLocal();
  console.log("configured", isFirebaseConfigured());
  if (!isFirebaseConfigured()) {
    process.exitCode = 1;
    return;
  }

  try {
    const before = await listBodyWeight(5);
    console.log("bodyWeight_count", before.length);

    const entry = await createBodyWeight({
      date: "2026-08-11",
      weightKg: 73.2,
    });
    console.log("wrote_to", entry.id.startsWith("demo-") ? "demo" : "firestore");

    console.log("bodyWeight_after", (await listBodyWeight(5)).length);
    console.log("workouts_count", (await listWorkouts(10)).length);
    console.log("ok");
  } catch (err) {
    const e = err as { code?: number | string; message?: string };
    console.error("error_code", e.code ?? "unknown");
    console.error("error_message", e.message ?? String(err));
    process.exitCode = 1;
  }
}

void main();
