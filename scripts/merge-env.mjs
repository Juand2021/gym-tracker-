// Copia a .env.local las variables que faltan o están vacías, tomándolas de otro archivo
// (por ejemplo el que baja `vercel env pull`). No imprime ningún valor.
//   node scripts/merge-env.mjs .env.vercel
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { parseEnv } from "node:util";

const source = process.argv[2];
const target = ".env.local";
const wanted = [
  "FIREBASE_SERVICE_ACCOUNT",
  "AZURE_OPENAI_ENDPOINT",
  "AZURE_OPENAI_API_KEY",
  "AZURE_OPENAI_DEPLOYMENT",
  "SITE_PIN_LAURA",
  "COMIDAS_PROFILES",
];

if (!source || !existsSync(source)) {
  console.error(`No encuentro el archivo de origen: ${source ?? "(falta el nombre)"}`);
  process.exit(1);
}

const src = parseEnv(readFileSync(source, "utf8"));
const lines = existsSync(target) ? readFileSync(target, "utf8").split(/\r?\n/) : [];
const current = parseEnv(lines.join("\n"));

for (const key of wanted) {
  let value = src[key]?.trim();
  if (!value) {
    console.log(`  ${key}: no viene en ${source} (o viene vacía)`);
    continue;
  }
  if (current[key]?.trim()) {
    console.log(`  ${key}: ya tenía valor en ${target}, no la toco`);
    continue;
  }
  // Una sola línea: los saltos reales (p. ej. en la llave privada de Firebase) quedan como \n,
  // que es lo que espera src/lib/firebase.ts.
  value = value.replace(/\r?\n/g, "\\n");
  // Comillas simples: el lector de .env no toca las barras ni las comillas dobles del JSON.
  const entry = value.includes("'") ? `${key}=${value}` : `${key}='${value}'`;
  const i = lines.findIndex((l) => new RegExp(`^\\s*${key}\\s*=`).test(l));
  if (i >= 0) lines[i] = entry;
  else lines.push(entry);
  console.log(`  ${key}: copiada ✓ (${value.length} caracteres)`);
}

writeFileSync(target, lines.join("\n").replace(/\n*$/, "\n"));
console.log(`\nListo. Borra ${source} cuando termines: tiene claves.`);
