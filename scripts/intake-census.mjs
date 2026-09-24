#!/usr/bin/env node
// =============================================================================
// intake-census — how many REAL intake rows land in each category (DR-0622)
// =============================================================================
// Runs on the GitHub runner inside sovereign-read's `intake` mode, over EVERY
// non-confidential row of public.feedback (and public.door_feedback when that
// table exists) in the database the app actually reads. The raw rows never
// reach the log: this prints counts per category and per basis, and for the
// two categories a person should be able to audit at a glance (low-hanging
// fruit and already-decided) a short, masked snippet beside the receipt code
// and the rule or record it matched.
//
// The categorizer is the SAME module the app runs (app/src/lib/intake-
// outcome.js) over the SAME decision ledger (scripts/lib/intake-ledger.mjs),
// so the census and the app cannot disagree about a row.
//
// Usage: node scripts/intake-census.mjs <rows.json> [--snippets N]
//   rows.json: { "feedback": [...], "door": [...] } or a bare feedback array.
// =============================================================================
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { categorizeIntake, basisLine, CATEGORY_ORDER, categoryCounts } from '../app/src/lib/intake-outcome.js';
import { receiptCode } from '../app/src/lib/feedback-receipt.js';
import { readLedger } from './lib/intake-ledger.mjs';

const here = dirname(fileURLToPath(import.meta.url));

const mask = (s) => String(s || '')
  .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '<email masked>')
  .replace(/(\+?1[ .-]?)?\(?\d{3}\)?[ .-]?\d{3}[ .-]?\d{4}/g, '<phone masked>')
  .replace(/\s+/g, ' ')
  .trim();

/** Pure: the census over rows. Exported for the test. */
export function censusOf({ feedback = [], door = [] } = {}, ledger = null, { snippets = 40 } = {}) {
  const history = feedback.map((r) => ({ ...r, triageStatus: r.triage_status, triageNotes: r.triage_notes }));
  const cats = feedback.map((r) => ({ row: r, cat: categorizeIntake({ ...r, text: r.feedback_text, hasScreenshot: r.has_screenshot, screenshotCount: r.screenshot_count }, { ledger, history }) }));
  const doorCats = door.map((r) => ({ row: r, cat: categorizeIntake({ id: r.id, text: r.body, area: 'church' }, { ledger }) }));
  const byBasis = {};
  for (const { cat } of cats) {
    const k = `${cat.category} / ${cat.basis.kind}${cat.basis.rule ? `:${cat.basis.rule}` : ''}`;
    byBasis[k] = (byBasis[k] || 0) + 1;
  }
  const audit = (key) => cats
    .filter((c) => c.cat.category === key)
    .slice(0, snippets)
    .map(({ row, cat }) => `${receiptCode(row.id)} ${String(row.submitted_at || '').slice(0, 10)} | ${basisLine(cat).slice(0, 110)} | "${mask(row.feedback_text).slice(0, 90)}"`);
  return {
    feedbackRows: feedback.length,
    doorRows: door.length,
    counts: categoryCounts(cats.map((c) => c.cat)),
    doorCounts: categoryCounts(doorCats.map((c) => c.cat)),
    byBasis: Object.fromEntries(Object.entries(byBasis).sort((a, b) => b[1] - a[1])),
    fix: audit('fix'),
    decided: audit('decided'),
  };
}

export function renderCensus(c) {
  const lines = [];
  lines.push(`feedback rows read: ${c.feedbackRows} (confidential rows are never read)`);
  lines.push(`door_feedback rows read: ${c.doorRows}`);
  lines.push('');
  lines.push('feedback by category:');
  for (const k of CATEGORY_ORDER) lines.push(`  ${k.padEnd(8)} ${c.counts[k]}`);
  if (c.doorRows) {
    lines.push('door_feedback by category:');
    for (const k of CATEGORY_ORDER) lines.push(`  ${k.padEnd(8)} ${c.doorCounts[k]}`);
  }
  lines.push('');
  lines.push('by basis:');
  for (const [k, n] of Object.entries(c.byBasis)) lines.push(`  ${String(n).padStart(4)}  ${k}`);
  lines.push('');
  lines.push(`low-hanging fruit (first ${c.fix.length}):`);
  for (const l of c.fix) lines.push(`  ${l}`);
  lines.push(`already decided (first ${c.decided.length}):`);
  for (const l of c.decided) lines.push(`  ${l}`);
  return lines.join('\n');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const file = process.argv[2];
  if (!file) { console.error('usage: intake-census.mjs <rows.json>'); process.exit(2); }
  const raw = JSON.parse(readFileSync(file, 'utf8') || '[]');
  const input = Array.isArray(raw) ? { feedback: raw, door: [] } : { feedback: raw.feedback || [], door: raw.door || [] };
  const ledger = readLedger(join(here, '..', 'docs', 'decisions'));
  console.log(renderCensus(censusOf(input, ledger)));
}
