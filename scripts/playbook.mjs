/**
 * Playbook de humo: stack + mancuernas + olímpica + barra Z.
 * Uso: npm run playbook
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const results = [];

function runShell(command) {
  const res = spawnSync(command, {
    cwd: root,
    encoding: "utf8",
    shell: true,
  });
  if (res.status !== 0) {
    const out = `${res.stdout || ""}\n${res.stderr || ""}`.trim();
    throw new Error(out || `exit ${res.status}`);
  }
  return res;
}

function step(name, fn) {
  try {
    fn();
    results.push({ name, ok: true });
    console.log(`PASS  ${name}`);
  } catch (err) {
    results.push({ name, ok: false });
    console.error(`FAIL  ${name}`);
    console.error(`      ${err instanceof Error ? err.message : err}`);
  }
}

console.log("\n=== Playbook gym-tracker (experiment/visual-redesign) ===\n");

step("Archivos del experimento existen", () => {
  for (const file of [
    "src/lib/machine-stacks.ts",
    "src/lib/machine-stacks.test.ts",
    "src/lib/dumbbell-rack.ts",
    "src/lib/dumbbell-rack.test.ts",
    "src/lib/barbell-plates.ts",
    "src/lib/barbell-plates.test.ts",
    "src/lib/ez-bar-rack.ts",
    "src/lib/ez-bar-rack.test.ts",
    "src/lib/profiles.ts",
    "src/lib/profiles.test.ts",
    "src/components/MachineStackPicker.tsx",
    "src/components/DumbbellRackPicker.tsx",
    "src/components/BarbellPlatePicker.tsx",
    "src/components/EzBarRackPicker.tsx",
    "src/components/PickerPortal.tsx",
    "src/app/entreno/page.tsx",
    "src/lib/numbers.ts",
    "src/app/historial/[id]/page.tsx",
  ]) {
    assert.ok(fs.existsSync(path.join(root, file)), `falta ${file}`);
  }
});

step("Unit tests stacks + racks + numbers", () => {
  runShell("npm run test");
});

step("TypeScript (tsc --noEmit)", () => {
  runShell("node node_modules/typescript/bin/tsc --noEmit");
});

step("ESLint archivos tocados", () => {
  runShell(
    "npx eslint src/lib/machine-stacks.ts src/lib/dumbbell-rack.ts src/lib/barbell-plates.ts src/lib/ez-bar-rack.ts src/lib/profiles.ts src/lib/auth.ts src/lib/data.ts src/middleware.ts src/components/MachineStackPicker.tsx src/components/DumbbellRackPicker.tsx src/components/BarbellPlatePicker.tsx src/components/EzBarRackPicker.tsx src/components/PickerPortal.tsx src/app/entreno/page.tsx src/lib/numbers.ts",
  );
});

step("Perfiles multi-PIN aislan datos", () => {
  const profiles = fs.readFileSync(
    path.join(root, "src/lib/profiles.ts"),
    "utf8",
  );
  assert.match(profiles, /SITE_PIN_LAURA/);
  assert.match(profiles, /dataRoot:\s*"legacy"/);
  assert.match(profiles, /dataRoot:\s*"namespaced"/);
  assert.match(profiles, /displayName:\s*"Laura"/);

  const data = fs.readFileSync(path.join(root, "src/lib/data.ts"), "utf8");
  assert.match(data, /users.*doc\(profile\.id\)/);
  assert.match(data, /bodyWeightCollection/);

  const authLogin = fs.readFileSync(
    path.join(root, "src/app/api/auth/login/route.ts"),
    "utf8",
  );
  assert.match(authLogin, /getProfileCookieName/);
  assert.match(authLogin, /verifyPin/);

  const envExample = fs.readFileSync(path.join(root, ".env.example"), "utf8");
  assert.match(envExample, /SITE_PIN_LAURA=2026/);
});

step("Entreno integra stack, racks, barra, portal y bullet", () => {
  const entreno = fs.readFileSync(
    path.join(root, "src/app/entreno/page.tsx"),
    "utf8",
  );
  assert.match(entreno, /hasMachineStackPicker/);
  assert.match(entreno, /MachineStackPicker/);
  assert.match(entreno, /hasDumbbellRackPicker/);
  assert.match(entreno, /DumbbellRackPicker/);
  assert.match(entreno, /hasBarbellPlatePicker/);
  assert.match(entreno, /BarbellPlatePicker/);
  assert.match(entreno, /hasEzBarRackPicker/);
  assert.match(entreno, /EzBarRackPicker/);
  assert.match(entreno, /set-bullet/);
  assert.match(entreno, /kg · \{load\.short\}/);
  assert.doesNotMatch(entreno, /lb · 1 manc/);
  assert.doesNotMatch(entreno, /formatDumbbellTriggerLbsFromKg/);
  assert.doesNotMatch(entreno, /\{index \+ 1\}\.\s*\{set\.weightKg\}/);

  const portal = fs.readFileSync(
    path.join(root, "src/components/PickerPortal.tsx"),
    "utf8",
  );
  assert.match(portal, /createPortal/);
  assert.match(portal, /document\.body/);

  for (const file of [
    "src/components/BarbellPlatePicker.tsx",
    "src/components/DumbbellRackPicker.tsx",
    "src/components/EzBarRackPicker.tsx",
    "src/components/MachineStackPicker.tsx",
  ]) {
    const src = fs.readFileSync(path.join(root, file), "utf8");
    assert.match(src, /PickerPortal/, `${file} debe usar PickerPortal`);
  }
});

step("Historial usa bullet de serie", () => {
  const historial = fs.readFileSync(
    path.join(root, "src/app/historial/[id]/page.tsx"),
    "utf8",
  );
  assert.match(historial, /set-bullet/);
});

step("CSS de stack, racks, barra y bullet presentes", () => {
  const css = fs.readFileSync(path.join(root, "src/app/globals.css"), "utf8");
  assert.match(css, /\.stack-plate-small/);
  assert.match(css, /\.stack-pin/);
  assert.match(css, /\.db-rack/);
  assert.match(css, /\.db-bell/);
  assert.match(css, /\.bb-bar/);
  assert.match(css, /\.bb-plate/);
  assert.match(css, /\.ez-rack/);
  assert.match(css, /\.ez-bar-card/);
  assert.match(css, /\.set-bullet/);
  assert.match(css, /width:\s*72%/);
});

step("Dev server responde (si está arriba)", () => {
  const res = spawnSync(
    process.execPath,
    [
      "-e",
      "fetch('http://localhost:3000/login').then(r=>{console.log(r.status);process.exit(r.ok||r.status===307||r.status===302?0:2)}).catch(()=>process.exit(3))",
    ],
    { cwd: root, encoding: "utf8" },
  );
  if (res.status === 3) {
    console.log("      (omitido: dev server no está corriendo)");
    return;
  }
  if (res.status !== 0) {
    throw new Error(res.stderr || res.stdout || `exit ${res.status}`);
  }
});

const failed = results.filter((r) => !r.ok).length;
const passed = results.length - failed;
console.log(`\n=== Resultado: ${passed}/${results.length} OK ===\n`);
process.exit(failed ? 1 : 0);
