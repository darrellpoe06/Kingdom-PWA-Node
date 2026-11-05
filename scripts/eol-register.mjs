#!/usr/bin/env node
// =============================================================================
// eol-register — no runtime past its end of life, and every pin has a date
// =============================================================================
// DR-1341 (DR-1330 D12). DR-1218 gated Node alone (the no-node test). This
// generalises it: scripts/eol-register.json names every runtime the repo
// pins with the date it stops being supported, read from the endoflife.date
// source at a named commit. The check:
//   1. every PINNED line whose date has passed FAILS;
//   2. a pinned line inside warnDays of its date is printed as a warning;
//   3. every pin FOUND IN THE REPO (node-version, python-version, a postgres
//      image tag) must have a line — a new runtime arrives with its date;
//   4. a line past its date must carry status retired-from-use with a why and
//      a reReview that has not passed.
// Pure functions exported for vitest; proven to catch on fixtures.
// =============================================================================
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const REGISTER = 'scripts/eol-register.json';

/** The runtime cycles a text pins: [{product, cycle}]. */
export function pinsIn(text) {
  const out = [];
  for (const m of String(text).matchAll(/node-version:\s*['"]?(\d+)/g)) out.push({ product: 'nodejs', cycle: m[1] });
  for (const m of String(text).matchAll(/python-version:\s*['"]?(\d+\.\d+)/g)) out.push({ product: 'python', cycle: m[1] });
  for (const m of String(text).matchAll(/image:\s*(?:supabase\/)?postgres:(\d+)/g)) out.push({ product: 'postgresql', cycle: m[1] });
  return out;
}

export function judge({ register, pins, today }) {
  const failures = [];
  const warnings = [];
  const lines = register.runtimes || [];
  const horizon = new Date(new Date(today).getTime() + (register.warnDays || 120) * 86400000).toISOString().slice(0, 10);
  for (const r of lines) {
    const past = r.eol && r.eol <= today;
    if (r.pinned && past) failures.push(`${r.product} ${r.cycle} is pinned (${r.where}) and reached end of life on ${r.eol}`);
    if (r.pinned && r.eol && !past && r.eol <= horizon) warnings.push(`${r.product} ${r.cycle} reaches end of life on ${r.eol} — within ${register.warnDays || 120} days; plan the move${r.next ? ` (${r.next})` : ''}`);
    if (past && !r.pinned && r.status === 'retired-from-use') {
      if (!r.why || !r.reReview) failures.push(`${r.product} ${r.cycle} is retired-from-use without a why and a reReview`);
      else if (r.reReview <= today) failures.push(`${r.product} ${r.cycle} passed its re-review date ${r.reReview}`);
    }
  }
  const seen = new Set();
  for (const p of pins) {
    const key = `${p.product} ${p.cycle}`;
    if (seen.has(key)) continue; seen.add(key);
    if (!lines.some((r) => r.product === p.product && String(r.cycle) === String(p.cycle))) failures.push(`${key} is pinned in the repo but has no line in ${REGISTER}`);
  }
  return { failures, warnings };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const register = JSON.parse(readFileSync(join(ROOT, REGISTER), 'utf8'));
  const files = [];
  for (const f of readdirSync(join(ROOT, '.github/workflows'))) if (/\.ya?ml$/.test(f)) files.push(join('.github/workflows', f));
  for (const d of readdirSync(join(ROOT, 'infra'), { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    for (const f of readdirSync(join(ROOT, 'infra', d.name))) if (/^(docker-)?compose.*\.ya?ml$/.test(f)) files.push(join('infra', d.name, f));
  }
  const pins = files.flatMap((f) => pinsIn(readFileSync(join(ROOT, f), 'utf8')));
  const { failures, warnings } = judge({ register, pins, today: new Date().toISOString().slice(0, 10) });
  for (const w of warnings) console.log(`::warning::${w}`);
  if (failures.length) { console.error(`eol-register: ${failures.length} finding(s):\n  ${failures.join('\n  ')}`); process.exit(1); }
  console.log(`eol-register: OK — ${register.runtimes.filter((r) => r.pinned).length} pinned runtimes with a date or a stated none, ${pins.length} pins read from ${files.length} files, dates from ${register.source.name} @ ${register.source.commit.slice(0, 7)}.`);
}
