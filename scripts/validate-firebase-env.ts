import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const envPath = resolve(".env.local");
const raw = readFileSync(envPath, "utf8");
const lines = raw.split(/\r?\n/);
const map = new Map<string, string>();
for (const line of lines) {
  if (!line || line.trim().startsWith("#")) continue;
  const i = line.indexOf("=");
  if (i < 1) continue;
  let v = line.slice(i + 1);
  if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
  map.set(line.slice(0, i), v);
}

const projectId = map.get("FIREBASE_PROJECT_ID");
const clientEmail = map.get("FIREBASE_CLIENT_EMAIL");
const privateKey = map.get("FIREBASE_PRIVATE_KEY");
if (!projectId || !clientEmail || !privateKey) throw new Error("missing firebase vars");

const fixedKey = privateKey.replace(/\\n/g, "\n");
console.log("key_ok", fixedKey.startsWith("-----BEGIN PRIVATE KEY-----") && fixedKey.includes("END PRIVATE KEY"));
console.log("newlines", (fixedKey.match(/\n/g) || []).length);

const sa = {
  type: "service_account",
  project_id: projectId,
  private_key: fixedKey,
  client_email: clientEmail,
};

const oneLine = JSON.stringify(sa);
const kept = lines.filter((l) => !l.startsWith("FIREBASE_"));
while (kept.length && kept[kept.length - 1] === "") kept.pop();
kept.push("");
kept.push("# Firebase Admin (JSON one-line)");
kept.push(`FIREBASE_SERVICE_ACCOUNT=${oneLine}`);
writeFileSync(envPath, kept.join("\n") + "\n", "utf8");
console.log("rewrote_service_account_json", true);
