#!/usr/bin/env node
// Bump all version-bearing files in the monorepo in one shot.
//
// Usage:
//   npm run bump -- 1.10.5           # keep current codename
//   npm run bump -- 1.10.5 Liftoff   # change codename
//
// Touches 15 source files, then regenerates package-lock.json and Cargo.lock.
// Patterns are anchored so dependency versions (e.g. "^1.10.3" in package.json)
// and historical references (e.g. "as of v1.10.3" in Bob prompts) stay intact.

import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const [, , newVersion, newCodenameArg] = process.argv;

if (!newVersion || !/^\d+\.\d+\.\d+$/.test(newVersion)) {
  console.error('Usage: npm run bump -- <x.y.z> [codename]');
  process.exit(1);
}

const rootPkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const oldVersion = rootPkg.version;

const footer = readFileSync(join(ROOT, 'src/app/components/app-footer.tsx'), 'utf8');
const codenameMatch = footer.match(/v\d+\.\d+\.\d+ 🔥 (\w+)/);
if (!codenameMatch) {
  console.error('Could not detect current codename from src/app/components/app-footer.tsx');
  process.exit(1);
}
const oldCodename = codenameMatch[1];
const newCodename = newCodenameArg || oldCodename;

if (oldVersion === newVersion && oldCodename === newCodename) {
  console.error(`Already at v${newVersion} "${newCodename}" — nothing to do.`);
  process.exit(1);
}

console.log(`\nBumping v${oldVersion} "${oldCodename}" → v${newVersion} "${newCodename}"\n`);

const edits = [
  // ── Package manifests (5) ──
  ['package.json',                                   `"version": "${oldVersion}"`,                              `"version": "${newVersion}"`],
  ['packages/crypto/package.json',                   `"version": "${oldVersion}"`,                              `"version": "${newVersion}"`],
  ['packages/desktop/package.json',                  `"version": "${oldVersion}"`,                              `"version": "${newVersion}"`],
  ['packages/desktop/src-tauri/Cargo.toml',          `version = "${oldVersion}"`,                               `version = "${newVersion}"`],
  ['packages/desktop/src-tauri/tauri.conf.json',     `"version": "${oldVersion}"`,                              `"version": "${newVersion}"`],

  // ── UI (footer + about, web + desktop) (4) ──
  ['src/app/components/app-footer.tsx',              `v${oldVersion} 🔥 ${oldCodename}`,                        `v${newVersion} 🔥 ${newCodename}`],
  ['packages/desktop/src/components/app-footer.tsx', `v${oldVersion} 🔥 ${oldCodename}`,                        `v${newVersion} 🔥 ${newCodename}`],
  ['src/app/about/page.tsx',                         `v${oldVersion} 🔥 ${oldCodename}`,                        `v${newVersion} 🔥 ${newCodename}`],
  ['packages/desktop/src/pages/AboutPage.tsx',       `v${oldVersion} 🔥 ${oldCodename}`,                        `v${newVersion} 🔥 ${newCodename}`],

  // ── Bob AI prompt header (2) — pattern includes " — Available" to avoid
  //    touching historical "as of vX.Y.Z" references in the same file.
  ['src/ai/flows/ask-bob-flow.ts',                   `v${oldVersion} "${oldCodename}" — Available`,             `v${newVersion} "${newCodename}" — Available`],
  ['packages/desktop/src/lib/bob-api.ts',            `v${oldVersion} "${oldCodename}" — Available`,             `v${newVersion} "${newCodename}" — Available`],

  // ── Docs (3) ──
  ['README.md',                                      `seQRets v${oldVersion} has not`,                          `seQRets v${newVersion} has not`],
  ['docs/BUILDING.md',                               `seQRets_${oldVersion}_aarch64.dmg`,                       `seQRets_${newVersion}_aarch64.dmg`],
  ['docs/SECURITY_ANALYSIS.md',                      `**App Version:** ${oldVersion}`,                          `**App Version:** ${newVersion}`],

  // ── Service worker (2 occurrences on different lines) ──
  ['public/sw.js',                                   `// seQRets Service Worker — v${oldVersion}`,              `// seQRets Service Worker — v${newVersion}`],
  ['public/sw.js',                                   `const CACHE_VERSION = 'seqrets-v${oldVersion}';`,         `const CACHE_VERSION = 'seqrets-v${newVersion}';`],
];

const failures = [];
for (const [file, from, to] of edits) {
  const path = join(ROOT, file);
  const src = readFileSync(path, 'utf8');
  if (!src.includes(from)) {
    failures.push({ file, from });
    continue;
  }
  writeFileSync(path, src.replace(from, to));
  console.log(`  ✓ ${file}`);
}

if (failures.length) {
  console.error('\n❌ Could not locate expected pattern in:');
  for (const { file, from } of failures) {
    console.error(`   - ${file}`);
    console.error(`     expected: ${from}`);
  }
  console.error('\nNo lockfile regeneration attempted. Fix the patterns (or revert edits) before re-running.');
  process.exit(1);
}

console.log('\nRegenerating package-lock.json...');
execSync('npm install --package-lock-only', { cwd: ROOT, stdio: 'inherit' });

console.log('\nRegenerating Cargo.lock...');
execSync('cargo generate-lockfile', { cwd: join(ROOT, 'packages/desktop/src-tauri'), stdio: 'inherit' });

console.log(`\n✅ Bumped to v${newVersion} "${newCodename}". Review with \`git diff\`, then commit.`);
