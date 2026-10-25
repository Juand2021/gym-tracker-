// Arranca la app para verla desde el iPhone en la misma red Wi-Fi.
//   npm run dev:iphone   → modo desarrollo: los cambios del código se ven al instante.
//   npm run iphone       → modo producción: compila primero y va tan fluida como la app real.
// Opcional: PORT=3001 npm run iphone
import { spawn, spawnSync } from "node:child_process";
import { networkInterfaces } from "node:os";

const port = process.env.PORT ?? "3000";
const prod = process.argv.includes("--prod");
const shell = process.platform === "win32";

/** IPs privadas de la red local (Wi-Fi o cable), sin las de máquinas virtuales. */
const ips = Object.entries(networkInterfaces())
  .filter(([name]) => !/^(docker|veth|br-|vbox|vmnet|utun|lo)/i.test(name))
  .flatMap(([, addrs]) => addrs ?? [])
  .filter((a) => a.family === "IPv4" && !a.internal && /^(192\.168|10|172\.(1[6-9]|2\d|3[01]))\./.test(a.address))
  .map((a) => a.address);

if (prod) {
  console.log("\n  Compilando NutriVerse (tarda un minuto)…\n");
  const build = spawnSync("npx", ["next", "build"], { stdio: "inherit", shell });
  if (build.status !== 0) process.exit(build.status ?? 1);
}

console.log(`\n  NutriVerse para iPhone · modo ${prod ? "producción (como la app real)" : "desarrollo (cambios en vivo)"}`);
console.log("  ─────────────────────────────────────────────");
if (ips.length) {
  for (const ip of ips) console.log(`  Abre en Safari del iPhone:  http://${ip}:${port}/comidas`);
} else {
  console.log("  No encontré una IP de red local. ¿El computador está conectado al Wi-Fi?");
}
console.log("  El iPhone debe estar en la misma red Wi-Fi que este computador.");
console.log("  Para verla como app: Compartir → Agregar a inicio.\n");

const child = spawn("npx", ["next", prod ? "start" : "dev", "-H", "0.0.0.0", "-p", port], { stdio: "inherit", shell });
child.on("exit", (code) => process.exit(code ?? 0));
