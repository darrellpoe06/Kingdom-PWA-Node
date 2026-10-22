#!/usr/bin/env node
// =============================================================================
// ledger-names-its-thread — a lesson built from a forward records WHICH forward
// =============================================================================
// WHY, MEASURED ON A REAL NEAR-MISS, 2026-10-15. The Gmail intake surfaced
// thread `1a135f165fe391e3` as uncaptured. It was already a lesson — sov39,
// under DR-1005, built on 2026-10-13 from that same forward, the same day it
// arrived. The thread was simply never tagged.
//
// DR-0610 names the lock for this: "the `lesson-captured` tag written only
// after the push." That tag is a Gmail label — a SINGLE witness, living
// outside the repo, which can silently fail to be written. It did. And because
// DR-1005 recorded no thread id, nothing in the repo contradicted the label.
// Both witnesses were blind at once.
//
// I caught it only because the phrase "positional encoding" happened to appear
// in DR-1005's prose. With different wording the house would have shipped a
// second lesson on a teaching it had already taught — exactly what DR-0610
// exists to prevent.
//
// THE FIX IS A SECOND WITNESS THAT CANNOT GO MISSING QUIETLY. A record is
// append-only and lives in the repo. If every lesson built from a forward
// names its Gmail thread id, then `grep <thread id> docs/decisions/` is an
// exact, local, offline answer to "have we already built this?" — no label, no
// network, no guessing from a subject line. `lesson-already-built.mjs` has to
// work from subject, source and timestamp precisely because the exact
// identifier is missing; DR-1050 had to measure character distances to make
// that inexact matching safe. This removes the need for the inference.
//
// WHAT IT IS NOT. It does not read Gmail and cannot check that an id is real.
// It checks that the record NAMES one. A wrong id is a different failure from
// a missing id, and this guard is honest about only catching the second.
//
// DETECTION IS BY PROXIMITY, WHICH IS DR-1050'S LESSON APPLIED. A record
// counts as built-from-a-forward when the word "forward" appears within
// NEAR_WINDOW characters of the quoted one-word instruction ("Lesson"). A
// whole-file test for both would catch records that merely DISCUSS the lane:
// measured, the loose version flagged 40 records where the proximity version
// flags 27, and the extras included DR-0685 (Android dictation) which has
// nothing to do with an emailed teaching.
//
// THERE ARE TWO ROADS NOW, AND THE WITNESS RULE IS ABOUT THE ROAD, NOT GMAIL
// (added 2026-10-22). DR-1202 opened a second intake the same week: Darrell
// sends a link into the app's own research road and the teaching is built from
// an `agent_inbox` row, never touching email. Those lessons have no thread id
// to name — and until this change the guard IGNORED the whole class, so every
// research-road lesson arrived with NO second witness at all. That is the
// exact blindness the near-miss above is about, reopened on a new road.
//
// A research-road record names its ROW id instead. The grep that answers "have
// we built this?" is the same grep on a different identifier: a uuid.
//
// THE CLASSIFICATION TRIES THE RESEARCH ROAD FIRST, ON PURPOSE. Every intake
// record cites DR-0312 — the record that CREATED the email lane — and that
// citation puts the word "forwarded" a line away from the quoted instruction.
// Measured on DR-1205, the first research-road lesson: the email detector
// fires on its `**Principles:**` line alone, while the record plainly says the
// teaching came through the research road. The deliberate false positive
// already carried for DR-0312 in the outstanding list would otherwise have
// repeated on every record built through the new road, forever — and worse,
// it would have demanded a Gmail thread id for a teaching that has none,
// which is a gate asking to be satisfied by a fiction.
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const DECISIONS = 'docs/decisions';

/**
 * How close "forward" must sit to the quoted one-word instruction for the
 * record to be describing a teaching that ARRIVED that way. A provenance
 * sentence puts them within a line or two; 600 characters is about a
 * paragraph, and it was checked against the real ledger rather than guessed.
 */
export const NEAR_WINDOW = 600;

/** A Gmail thread id as the API returns it: 16 lowercase hex characters. */
export const THREAD_ID = /\b[0-9a-f]{16}\b/;

/**
 * An `agent_inbox` row id as the research road records it: a lowercase uuid.
 * This is that road's thread id — the exact identifier a future session greps
 * to answer "have we already built this?" for a teaching that never touched
 * email.
 */
export const ROW_ID = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/;

/**
 * The phrases a record uses for the research road. `agent_inbox` is the table
 * itself, so it is the strongest signal; the prose names are how the record
 * reads. Kept narrow deliberately — a loose "research" would sweep in half the
 * ledger, since nearly every record researches something.
 */
export const RESEARCH_ROAD_WORDS = ['agent_inbox', 'research road', 'research lane'];

/** The one word Darrell writes over a teaching he sends in, in record shapes. */
const INSTRUCTION = /["“*]\s*Lesson\.?\s*["”*]/g;

/**
 * Pure. Does any of `words` sit within `window` characters of the quoted
 * one-word instruction? This is the proximity rule both roads share.
 */
function nearTheInstruction(text, words, window) {
  const t = String(text || '');
  const low = t.toLowerCase();
  const at = [];
  for (const w of words) {
    for (let i = low.indexOf(w); i !== -1; i = low.indexOf(w, i + 1)) at.push(i);
  }
  if (!at.length) return false;
  // "Lesson", "Lesson.", **"Lesson."**, *"Lesson"*.
  const re = new RegExp(INSTRUCTION.source, 'g');
  let m;
  while ((m = re.exec(t)) !== null) {
    if (at.some((j) => Math.abs(m.index - j) <= window)) return true;
  }
  return false;
}

/** Pure. Does this record describe a teaching that arrived as a forward? */
export function isEmailSourced(text, window = NEAR_WINDOW) {
  return nearTheInstruction(text, ['forward'], window);
}

/** Pure. Does this record describe a teaching that arrived on the research road? */
export function isResearchSourced(text, window = NEAR_WINDOW) {
  return nearTheInstruction(text, RESEARCH_ROAD_WORDS, window);
}

/**
 * Pure. Which road did this teaching arrive on — or null for a record that is
 * not built from an intake at all. The research road is tried first; the
 * header says why.
 */
export function roadOf(text) {
  if (isResearchSourced(text)) return 'research';
  if (isEmailSourced(text)) return 'email';
  return null;
}

/** Pure. Does this record name a Gmail thread id? */
export const namesAThread = (text) => THREAD_ID.test(String(text || ''));

/** Pure. Does this record name an `agent_inbox` row id? */
export const namesARow = (text) => ROW_ID.test(String(text || ''));

/**
 * Pure. The witness this road requires, and whether the record carries it.
 * The roads are NOT interchangeable: a thread id on a research-road lesson is
 * a grep that finds nothing, which is worse than an empty provenance line.
 */
export const namesItsWitness = (text, road) => (
  road === 'research' ? namesARow(text) : namesAThread(text)
);

/**
 * Walk the real ledger. Returns every record built from an intake, which of
 * them name no witness, and the road each one arrived on. Takes its root as an
 * argument so a fixture tree can be walked instead.
 */
export function walkLedger(root = join(HERE, '..')) {
  const dir = join(root, DECISIONS);
  let names;
  try { names = readdirSync(dir); } catch { return { sourced: [], missing: [], roads: {} }; }
  const sourced = [];
  const missing = [];
  const roads = {};
  for (const n of names.filter((f) => /^DR-\d{4}-.+\.md$/.test(f)).sort()) {
    let text;
    try { text = readFileSync(join(dir, n), 'utf8'); } catch { continue; }
    const road = roadOf(text);
    if (!road) continue;
    sourced.push(n);
    roads[n] = road;
    if (!namesItsWitness(text, road)) missing.push(n);
  }
  return { sourced, missing, roads };
}

const invokedDirectly = process.argv[1] && process.argv[1].endsWith('ledger-names-its-thread.mjs');
if (invokedDirectly) {
  const { sourced, missing, roads } = walkLedger();
  const byRoad = (r) => sourced.filter((n) => roads[n] === r).length;
  console.log(`ledger-names-its-thread: ${sourced.length} record(s) built from an intake `
    + `(${byRoad('email')} forwarded, ${byRoad('research')} research road), `
    + `${missing.length} naming no witness.`);
  for (const m of missing) console.log(`  - ${m} (${roads[m]} road)`);
  if (!missing.length) console.log('  every one names the intake it was built from.');
  // A finder, not a gate. The gate lives in the test, which holds the
  // shrink-only ledger of what is still outstanding.
  process.exit(0);
}
