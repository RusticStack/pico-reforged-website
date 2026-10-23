// Moves the site to another release of @rusticstack/pico-reforged.
// Usage: node scripts/bump-library.mjs <version> [--dry-run]
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PKG = "@rusticstack/pico-reforged";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const version = args.find((a) => !a.startsWith("--"));

function fail(message) {
  console.error(`error: ${message}`);
  process.exit(1);
}

if (args.some((a) => a.startsWith("--") && a !== "--dry-run")) {
  fail("unknown option. Usage: node scripts/bump-library.mjs <version> [--dry-run]");
}
if (!version || !/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(version)) {
  fail("give an exact version such as 2.0.2. Usage: node scripts/bump-library.mjs <version> [--dry-run]");
}

// 1. The version must exist on npm.
const view = spawnSync(`npm view ${PKG}@${version} version`, {
  encoding: "utf8",
  shell: true,
});
if (view.status !== 0 || view.stdout.trim() !== version) {
  fail(`${PKG}@${version} was not found on npm.\n${(view.stderr || view.stdout).trim()}`);
}
console.log(`${PKG}@${version} exists on npm.`);

// 2. package.json pin and pnpm-workspace.yaml release-age exception.
const files = [
  {
    path: "package.json",
    // Only the dependency pin, so other fields are untouched.
    pattern: new RegExp(String.raw`("${PKG}"\s*:\s*")[^"]+(")`),
    replace: `$1${version}$2`,
  },
  {
    path: "pnpm-workspace.yaml",
    // The minimumReleaseAgeExclude entry, with or without quotes.
    pattern: new RegExp(String.raw`^(\s*-\s*"?)${PKG}@[^"\s]+("?)\s*$`, "m"),
    replace: `$1${PKG}@${version}$2`,
  },
];

const updates = [];
for (const file of files) {
  const full = join(root, file.path);
  const before = readFileSync(full, "utf8");
  if (!file.pattern.test(before)) fail(`could not find the ${PKG} entry in ${file.path}.`);
  const after = before.replace(file.pattern, file.replace);
  const line = (text) => text.match(file.pattern)[0].trim();
  updates.push({ ...file, full, before, after, from: line(before), to: line(after) });
}

for (const u of updates) {
  if (u.before === u.after) console.log(`${u.path}: already ${u.to}`);
  else console.log(`${u.path}: ${u.from}  ->  ${u.to}`);
}

if (dryRun) {
  console.log("\nDry run: nothing was written and pnpm install was not run.");
  process.exit(0);
}

for (const u of updates) {
  if (u.before !== u.after) writeFileSync(u.full, u.after);
}

// 3. Update the lockfile.
console.log("\nRunning pnpm install ...");
const install = spawnSync("pnpm install", {
  cwd: root,
  stdio: "inherit",
  shell: true,
});
if (install.status !== 0) fail("pnpm install failed. The edited files were left in place.");

console.log(`
Next steps:
  1. pnpm build
  2. Compare the CSS: check the changes in public/css against the previous release
     (for example with the library CHANGELOG, and by looking at the site with pnpm preview).
  3. Update examples/ if the library copies changed.
  4. Open a pull request with package.json, pnpm-workspace.yaml and pnpm-lock.yaml.`);
