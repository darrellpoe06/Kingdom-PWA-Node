#!/usr/bin/env node
// harvest-stall-guard — flag a STALLED harvest (Darrell 2026-06-29: "stuck",
// "stalled partway"). Reads the append-only coverage-snapshot log the loader
// writes (scripts/out/harvest-progress.jsonl, one JSON snapshot per line, oldest
// first) and reports whether the harvest is still climbing or has stalled with
// work outstanding.
//
// The fetcher (incremental / resumable / idempotent / bounded) is the cure; this
// is the alarm that proves it ran. Pairs with the proven-to-catch test
// app/src/__tests__/harvest-stall-guard.test.js.
//
// Usage:
//   node scripts/harvest-stall-guard.mjs            # report; exit 0 always
//   node scripts/harvest-stall-guard.mjs --strict   # exit 1 if stalled (for alerts)
// Each fetcher run appends a snapshot via scripts/harvest-from-transcripts.mjs.

import { readFileSync, existsSync } from 'node:fs';
import { detectStall } from '../app/src/lib/harvest-stall.js';

const LOG = 'scripts/out/harvest-progress.jsonl';
const strict = process.argv.includes('--strict');

if (!existsSync(LOG)) {
  console.log(`[harvest-stall] no snapshot log yet (${LOG}). Run the fetcher/loader to record one.`);
  process.exit(0);
}

const history = readFileSync(LOG, 'utf-8')
  .split('\n')
  .map((l) => l.trim())
  .filter(Boolean)
  .map((l) => { try { return JSON.parse(l); } catch { return null; } })
  .filter(Boolean);

const r = detectStall(history);
const latest = history[history.length - 1] || {};

console.log(`[harvest-stall] ${history.length} snapshot(s) · latest avg ${r.latestPct}% (was ${r.priorPct}%) · ${latest.transcribed || 0}/${latest.videos || 0} transcribed`);

if (r.stalled) {
  console.log(`\n  ⚠ STALLED: ${r.reason}`);
  console.log('  The coverage % is not advancing while harvests are still owed.');
  console.log('  Next: run the YouTube-caption fetcher (infra/nas-sme-pipeline/youtube-captions.py)');
  console.log('        then the loader (scripts/harvest-from-transcripts.mjs) to apply + advance.');
  if (strict) process.exit(1);
} else {
  const msg = {
    'no-corpus': 'no videos ingested yet',
    'warming-up': 'not enough history to judge — keep running',
    advancing: 'climbing — healthy',
    done: 'fully harvested (no orphans, above floor) — nothing owed',
  }[r.reason] || r.reason;
  console.log(`  ✓ ${msg}`);
}
