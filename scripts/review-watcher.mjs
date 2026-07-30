#!/usr/bin/env node
// =============================================================================
// review-watcher.mjs — the review-sequences watcher's runner bridge (DR-0225)
// =============================================================================
// Runs one BRAKED pass of lib/review-watcher.js against the REAL repo ledgers:
// every docs/decisions/DR-*.md body + the docs/reviews/REVIEWS.md registry,
// scanned for literal `re-review: <date>` commitments (re-reviews.js — nothing
// invented). Prints the drive report (overdue = act now; due-soon = pull
// forward) as markdown, for a human, a job summary, or a rolling issue.
//
// Brakes on this runner:
//   · budget + wall-clock  — in-engine (runReviewWatch limits);
//   · single-instance lock — in-engine per state dir; the workflow ALSO holds
//     a GitHub concurrency group at the platform layer;
//   · kill-switch          — DURABLE + ATTRIBUTED via the repo itself: if
//     docs/reviews/WATCHER-PAUSED.md exists, the watcher is tripped — it does
//     no work and says why (the file's contents ARE the reason; git history is
//     the attribution). Reset = remove the file. Never auto-resumes (P11).
//
// State (lock/heartbeat/failure-streak) lives in a JSON file store under
// --state <dir> (default: OS tmp) — per-run ephemeral in CI until a persisted
// store rides the activation step; the durable trip is the repo file above.
//
// Exit codes: 0 ok (report printed) · 0 paused/skipped (says so — a brake
// doing its job is not a runner failure) · 1 run failed.
// =============================================================================
import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { runReviewWatch, formatWatchReport, WATCHER_NAME } from '../app/src/lib/review-watcher.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const args = process.argv.slice(2);
const argVal = (name, dflt) => { const i = args.indexOf(name); return i >= 0 && args[i + 1] ? args[i + 1] : dflt; };

// DURABLE KILL-SWITCH: the repo file. Its presence trips the watcher; its
// content is the recorded why; the commit that added it is the attribution.
const pausedFile = join(root, 'docs/reviews/WATCHER-PAUSED.md');
if (existsSync(pausedFile)) {
  const why = readFileSync(pausedFile, 'utf8').trim().split('\n')[0] || 'paused';
  console.log(`Review watcher is PAUSED (docs/reviews/WATCHER-PAUSED.md): ${why}`);
  console.log('Reset = remove the file (an attributed commit). No work was done.');
  process.exit(0);
}

// Read the REAL ledgers, raw. The engine's extractor scans prose for the
// literal `re-review: <date>` form — passing raw bodies keeps one source of
// truth for the pattern (no re-implemented parser to drift).
const decisionsDir = join(root, 'docs/decisions');
const decisions = { items: readdirSync(decisionsDir)
  .filter((f) => /^DR-\d+.*\.md$/.test(f))
  .map((f) => ({ id: f.replace(/\.md$/, '').slice(0, 7), title: f, decision: readFileSync(join(decisionsDir, f), 'utf8') })) };
const reviewsPath = join(root, 'docs/reviews/REVIEWS.md');
const reviews = { items: existsSync(reviewsPath)
  ? [{ id: 'REVIEWS.md', title: 'UI/UX & Accessibility Review Registry', findings: readFileSync(reviewsPath, 'utf8'), source: 'docs/reviews/REVIEWS.md' }]
  : [] };

// WIDENED 2026-07-30 (comprehensive review): the watcher scanned only
// DR files + REVIEWS.md — 133 of the repo's 409 dated commitments. ~147
// past-due commitments in session-notes, foundations, and INDEX.md were
// INVISIBLE to the daily drive. Same extractor, three more ledgers; every
// `re-review: <date>` in the repo's prose now reports to one instrument.
const extraLedgers = [
  { dir: 'docs/99-session-notes', label: 'session-note' },
  { dir: 'docs/00-foundations/_root', label: 'foundation' },
];
for (const { dir, label } of extraLedgers) {
  const abs = join(root, dir);
  if (!existsSync(abs)) continue;
  for (const f of readdirSync(abs).filter((n) => n.endsWith('.md'))) {
    reviews.items.push({ id: `${label}:${f}`, title: f, findings: readFileSync(join(abs, f), 'utf8'), source: `${dir}/${f}` });
  }
}
const indexPath = join(root, 'docs/decisions/INDEX.md');
if (existsSync(indexPath)) {
  reviews.items.push({ id: 'INDEX.md', title: 'Decision ledger index', findings: readFileSync(indexPath, 'utf8'), source: 'docs/decisions/INDEX.md' });
}

// File-backed store for the in-engine lock/heartbeat/failure-streak.
const stateDir = argVal('--state', join(tmpdir(), 'poetech-review-watcher'));
mkdirSync(stateDir, { recursive: true });
const stateFile = join(stateDir, 'state.json');
const load = () => { try { return JSON.parse(readFileSync(stateFile, 'utf8')); } catch { return {}; } };
const state = load();
const store = {
  getItem: (k) => (k in state ? state[k] : null),
  setItem: (k, v) => { state[k] = String(v); writeFileSync(stateFile, JSON.stringify(state, null, 2)); },
  removeItem: (k) => { delete state[k]; writeFileSync(stateFile, JSON.stringify(state, null, 2)); },
};

const result = runReviewWatch({ reviews, decisions, store, nowMs: Date.now() });

if (result.paused) { console.log(`PAUSED by the in-engine kill-switch: ${result.reason}`); process.exit(0); }
if (result.skipped) { console.log(`SKIPPED: ${result.reason}`); process.exit(0); }
if (!result.ok) { console.error(`Run FAILED (${result.consecutiveFailures} consecutive): ${result.reason}${result.tripped ? ' — kill-switch TRIPPED' : ''}`); process.exit(1); }

console.log(formatWatchReport(result.report));
console.log(`\n_${WATCHER_NAME} · scanned ${result.report.counts.scanned} commitments · budget ${result.brakes.budget.units}/${result.brakes.budget.maxUnits} units_`);
