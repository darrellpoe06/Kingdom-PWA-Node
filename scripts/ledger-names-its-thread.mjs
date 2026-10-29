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
 * The research road's identifiers, as its records write them: a lowercase uuid
 * carrying the LABEL of what it names. This is that road's thread id — the
 * exact identifier a future session greps to answer "have we already built
 * this?" for a teaching that never touched email.
 *
 * THE LABEL IS REQUIRED, and that is not fussiness. A bare uuid appears in
 * this ledger for plenty of things that are not an intake — a migration, a
 * bucket, a Supabase project. Accepting any uuid would let a record look
 * witnessed while naming something unrelated, which is the theatre DR-0076 §3
 * forbids. `research item <uuid>` is the form a research-road record already
 * uses; the `agent_inbox` row is the same teaching's row in the same lane, and
 * either answers the grep.
 *
 * THE LABEL MAY BE CAPITALISED; THE ID MAY NOT. A record can open a sentence
 * with "Research item ...", so the label allows a capital. The uuid does not:
 * it is matched exactly as the API returns it, lowercase, for the same reason
 * `namesAThread` refuses `1A135F...` — an id in the wrong case is an id the
 * grep will not find, which is the whole promise of naming it. (A case-blind
 * flag over the whole pattern let `D5480D79-...` through; caught by the test
 * below before this merged.)
 */
const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
export const RESEARCH_ITEM = new RegExp(`\\b[Rr]esearch item \`?${UUID}\\b`);
export const INBOX_ROW = new RegExp(`\\bagent_inbox\`? row \`?${UUID}\\b`);
export const ROW_ID = new RegExp(`\\b${UUID}\\b`);

/**
 * The phrases a record uses for the research road. `agent_inbox` is the table
 * itself, so it is the strongest signal; the prose names are how the record
 * reads. Kept narrow deliberately — a loose "research" would sweep in half the
 * ledger, since nearly every record researches something.
 */
export const RESEARCH_ROAD_WORDS = ['agent_inbox', 'research road', 'research lane'];

/** The one word Darrell writes over a teaching he sends in, in record shapes. */
// WIDENED 2026-10-29 (DR-1288) to the UNQUOTED form after a colon, because a
// record that wrote the instruction bare fell OUTSIDE the population this rule
// governs, so nothing ever asked it for a thread id.
//
// WHAT IT COST. DR-0763 wrote "wrote one word above it: Lesson." with no quotes
// anywhere in the file. It was never classified as intake-built, its provenance
// stayed prose-only, and `lesson-row-shipped-sweep` -- which searches for the
// ID -- answered `unknown` for a thread that was built. A second lesson was
// written from that same thread before the builder's own anchor check caught it.
//
// MEASURED BEFORE THIS COMMIT'S EDITS: the quoted-only pattern classified 37
// records; the widened one 42. Of the 5 it added, THREE already named a thread
// id and were simply never asked (DR-0860, DR-0863, DR-0864), and TWO named
// none -- DR-0759 and DR-0763.
//
// BOTH IDS WERE RECOVERED IN THIS SAME COMMIT, each confirmed twice rather than
// matched once: by Gmail subject and date, and by DR-1288's subject probe naming
// that record alone (DR-0759 at weight 1.167, "innovation" appearing in exactly
// one record). So the outstanding list does not grow -- this is the shrink-only
// rule honoured as it is written, "recovering an id means deleting its entry in
// the same commit", rather than a detector left blind to keep a count small.
//
// MEASURED AFTER: tight 38, wide 42, and every one of the 4 the widening adds
// now names an id. Tight rose by one because DR-0763's recovered provenance also
// quotes the instruction, which brings it into the population under the original
// pattern too -- belt and braces on the one record that proved the hole.
// `ledger-names-its-thread` reports 47 intake records and the same 3 naming no
// witness: the two permanent road-founding false positives and DR-0505, whose
// provenance line names no publication to match a thread on.
const INSTRUCTION = /(["“*]\s*Lesson\.?\s*["”*])|(:\s*Lesson\b)/g;

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

/** Pure. Does this record name its research item or its `agent_inbox` row? */
export const namesARow = (text) => {
  const t = String(text || '');
  return RESEARCH_ITEM.test(t) || INBOX_ROW.test(t);
};

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
