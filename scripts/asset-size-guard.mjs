#!/usr/bin/env node
// =============================================================================
// asset-size-guard — no built file may approach Cloudflare Pages' 25 MiB cap
// =============================================================================
// WHY THIS EXISTS (2026-09-23, post-incident, DR-0595). The #1756 merge built
// clean, CI was green, and the deploy failed at the last step:
//   "Error: Pages only supports files up to 25 MiB in size
//    assets/poe-financial-mvp-v28-Deo4BFVC.js is 26.1 MiB in size"
// The site served the previous build until the entry chunk was split. Nothing
// before the deploy measured a built file's size, so the first witness was the
// failed deploy (LESSONS P25: CI-green is not deployed). This guard runs on
// the real dist in ci.yml (before a merge) and in the deploy workflow (before
// wrangler), and fails when ANY file is within 1 MiB of the cap — the
// headroom is the point: a course or a lesson lands every day, and the next
// one must not be the one that takes the site stale.
//
// Usage:
//   node scripts/asset-size-guard.mjs [distDir]      (default app/dist)
//   node scripts/asset-size-guard.mjs --selftest     (must be able to fail)
// =============================================================================
import { readdirSync, statSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

export const PAGES_CAP_BYTES = 25 * 1024 * 1024;
export const HEADROOM_BYTES = 1 * 1024 * 1024;
export const LIMIT_BYTES = PAGES_CAP_BYTES - HEADROOM_BYTES;

const mib = (n) => `${(n / 1048576).toFixed(2)} MiB`;

export function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else out.push({ path: p, bytes: st.size });
  }
  return out;
}

/** Every file in `dir` at or over the limit, largest first; [] means pass. */
export function oversized(dir, limit = LIMIT_BYTES) {
  return walk(dir).filter((f) => f.bytes >= limit).sort((a, b) => b.bytes - a.bytes);
}

function report(dir, limit) {
  const files = walk(dir);
  if (files.length === 0) { console.error(`asset-size-guard: ${dir} holds no files — was the build run?`); return 2; }
  const largest = [...files].sort((a, b) => b.bytes - a.bytes).slice(0, 5);
  console.log(`asset-size-guard: ${files.length} files in ${dir}; cap ${mib(PAGES_CAP_BYTES)}; limit with headroom ${mib(limit)}`);
  for (const f of largest) console.log(`  ${mib(f.bytes).padStart(10)}  ${f.path}`);
  const bad = oversized(dir, limit);
  if (bad.length) {
    for (const f of bad) console.error(`::error::${f.path} is ${mib(f.bytes)} — at or over the ${mib(limit)} limit (Cloudflare Pages refuses files over ${mib(PAGES_CAP_BYTES)}). Split it: see manualChunks in app/vite.config.js (DR-0595).`);
    return 1;
  }
  console.log('asset-size-guard: PASS — every built file is under the limit');
  return 0;
}

function selftest() {
  const dir = mkdtempSync(join(tmpdir(), 'asset-size-guard-'));
  try {
    writeFileSync(join(dir, 'small.js'), 'ok');
    if (oversized(dir).length !== 0) { console.error('selftest: a small file was refused'); return 1; }
    // A file exactly at the limit must be refused (>=), one byte under must pass.
    writeFileSync(join(dir, 'at-limit.js'), Buffer.alloc(LIMIT_BYTES));
    const atLimit = oversized(dir);
    if (atLimit.length !== 1 || !atLimit[0].path.endsWith('at-limit.js')) { console.error('selftest: the guard did NOT catch a file at the limit'); return 1; }
    writeFileSync(join(dir, 'at-limit.js'), Buffer.alloc(LIMIT_BYTES - 1));
    if (oversized(dir).length !== 0) { console.error('selftest: a file one byte under the limit was refused'); return 1; }
    // The incident file: 26.1 MiB, over the cap itself.
    writeFileSync(join(dir, 'incident.js'), Buffer.alloc(Math.round(26.1 * 1048576)));
    const incident = oversized(dir);
    if (incident.length !== 1 || !incident[0].path.endsWith('incident.js')) { console.error('selftest: the guard did NOT catch the incident size'); return 1; }
    console.log('asset-size-guard selftest: PASS — refuses a file at the limit and the 26.1 MiB incident file; passes one byte under');
    return 0;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const isMain = process.argv[1] && /asset-size-guard\.mjs$/.test(process.argv[1]);
if (isMain) {
  if (process.argv.includes('--selftest')) process.exit(selftest());
  const dir = process.argv.slice(2).find((a) => !a.startsWith('--')) || join(process.cwd(), process.cwd().endsWith('/app') ? 'dist' : 'app/dist');
  process.exit(report(dir, LIMIT_BYTES));
}
