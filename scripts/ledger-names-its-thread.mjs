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

/** Pure. Does this record describe a teaching that arrived as a forward? */
export function isEmailSourced(text, window = NEAR_WINDOW) {
  return nearTheOneWord(text, 'forward', window);
}

/** Pure. Does `word` sit within `window` characters of the quoted one-word instruction? */
function nearTheOneWord(text, word, window) {
  const t = String(text || '');
  const low = t.toLowerCase();
  const fwd = [];
  for (let i = low.indexOf(word); i !== -1; i = low.indexOf(word, i + 1)) fwd.push(i);
  if (!fwd.length) return false;
  // The one word Darrell writes over a forward, in the shapes records use:
  // "Lesson", "Lesson.", **"Lesson."**, *"Lesson"*.
  const re = /["“*]\s*Lesson\.?\s*["”*]/g;
  let m;
  while ((m = re.exec(t)) !== null) {
    if (fwd.some((j) => Math.abs(m.index - j) <= window)) return true;
  }
  return false;
}

/** Pure. Does this record name a Gmail thread id? */
export const namesAThread = (text) => THREAD_ID.test(String(text || ''));

// THE RESEARCH ROAD HAS ITS OWN WITNESS (DR-1202, measured 2026-10-22 on
// DR-1205). A lesson can now arrive through the app's research road instead of
// Gmail: a link sent with one word on it ("Lesson"), looked into on the NAS,
// filed as a `lesson` row tagged `research-source:<item uuid>`. There is no
// Gmail thread to name. Its exact identifier is the research item's uuid, and
// `grep <uuid> docs/decisions/` answers "have we built this?" for that road
// the same way a thread id does for a forward. DR-1205 was the first such
// record; it named its item and was still refused, because the detector saw
// "forwarded" in its Principles line and asked for a thread that cannot exist.
export const RESEARCH_ITEM = /\bresearch item `?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i;

/**
 * Pure. Does this record describe a teaching that arrived through the research
 * road? Proximity again (DR-1050): "research road" within NEAR_WINDOW of the
 * quoted one word, so the records that BUILT the road (DR-1101, DR-1172,
 * DR-1200...) are not mistaken for lessons that came down it.
 */
export const isResearchSourced = (text, window = NEAR_WINDOW) => nearTheOneWord(text, 'research road', window);

/** Pure. Does this record name the exact witness of the road it arrived by? */
export const namesItsWitness = (text) => namesAThread(text) || RESEARCH_ITEM.test(String(text || ''));

/**
 * Walk the real ledger. Returns every email-sourced record and which of them
 * name no thread. Takes its root as an argument so a fixture tree can be
 * walked instead.
 */
export function walkLedger(root = join(HERE, '..')) {
  const dir = join(root, DECISIONS);
  let names;
  try { names = readdirSync(dir); } catch { return { sourced: [], missing: [] }; }
  const sourced = [];
  const missing = [];
  for (const n of names.filter((f) => /^DR-\d{4}-.+\.md$/.test(f)).sort()) {
    let text;
    try { text = readFileSync(join(dir, n), 'utf8'); } catch { continue; }
    const research = isResearchSourced(text);
    if (!isEmailSourced(text) && !research) continue;
    sourced.push(n);
    // A research-road record is held to its own witness; a forward to its thread.
    if (!(research ? namesItsWitness(text) : namesAThread(text))) missing.push(n);
  }
  return { sourced, missing };
}

const invokedDirectly = process.argv[1] && process.argv[1].endsWith('ledger-names-its-thread.mjs');
if (invokedDirectly) {
  const { sourced, missing } = walkLedger();
  console.log(`ledger-names-its-thread: ${sourced.length} record(s) built from a forward, ${missing.length} naming no thread id.`);
  for (const m of missing) console.log(`  - ${m}`);
  if (!missing.length) console.log('  every one names the thread it was built from.');
  // A finder, not a gate. The gate lives in the test, which holds the
  // shrink-only ledger of what is still outstanding.
  process.exit(0);
}
