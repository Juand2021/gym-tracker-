// Arranca la app en este computador SIN Firebase, para probar sin tocar los datos reales ni la cuota.
//   node scripts/dev-local.mjs            → http://localhost:3100/comidas
// Todo se guarda en .data/ (ignorado por git): .data/store.json y .data/nutrition-store.json.
// La base de alimentos se lee de .data/nutrition-local/foods.json (cópiala ahí desde build_db.ts o download_db.ts).
// PIN: el de ejemplo de .env.example (1234), o LOCAL_PIN=... si quieres otro.
import { spawn } from "node:child_process";

const port = process.env.PORT ?? "3100";
const env = {
  ...process.env,
  // Vacías: Next no las reemplaza con las de .env.local, y sin credenciales se usa el almacén local.
  FIREBASE_SERVICE_ACCOUNT: "",
  FIREBASE_PROJECT_ID: "",
  FIREBASE_CLIENT_EMAIL: "",
  FIREBASE_PRIVATE_KEY: "",
  SITE_PIN: process.env.LOCAL_PIN ?? "1234",
  // Base de alimentos solo para estas pruebas (build_db.ts sin el caché de nombres: busca peor que la de Firestore).
  NUTRITION_DB_FILE: process.env.NUTRITION_DB_FILE ?? ".data/nutrition-local/foods.json",
  // Carpeta de compilación aparte: así puede convivir con otro `next dev` en el puerto 3000.
  NEXT_DIST_DIR: ".next-local",
};

console.log(`\n  App local sin Firebase · http://localhost:${port}/comidas\n`);
const child = spawn("npx", ["next", "dev", "-H", "127.0.0.1", "-p", port], { stdio: "inherit", shell: process.platform === "win32", env });
child.on("exit", (code) => process.exit(code ?? 0));
