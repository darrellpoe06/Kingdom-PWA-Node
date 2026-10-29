#!/usr/bin/env node
// one-thread-one-record-guard.mjs -- is any source thread claimed by two records?
// =============================================================================
// WHY (DR-1285, 2026-10-29): sov57 was briefed as "the oldest of his forwarded
// teachings still unbuilt" and that sentence was false. Gmail thread
// `1a0f23b12bf2ca45` had already been built on 2026-09-30 as sov51 (DR-1246),
// whose own title is "what a fourteen-item digest is actually one lesson about".
// Nothing stopped the second build, and the reason is worth stating exactly:
//
//   * `one-teaching-one-lesson-guard.mjs` keys on SAME COURSE + the same opening
//     three words of the title + >= MIN_SHARED_VERSES shared verses. sov51 and
//     sov57 share a course and NOTHING else it looks at -- 0 shared verses, 0
//     shared chapters, "the office that" against "the code can" -- so it passed,
//     correctly, on its own terms. It has no notion of a SOURCE THREAD.
//   * `lesson-row-shipped-sweep.mjs` DOES know: it reports this thread SHIPPED.
//     But nothing in `verify:gates` ever ran it against the thread a NEW record
//     names, so the one instrument that could answer was never asked.
//
// This guard closes exactly that gap and nothing wider. It reads the thread id
// each decision record names in its own front matter and fails when two records
// name the same one UNLESS the pair is recorded below.
//
// IT DOES NOT DECIDE WHETHER THE SECOND LESSON SHOULD EXIST. Folding two
// lessons built from one forward is an editorial call about Yahweh's Word on a
// COLG-facing surface, and that is Darrell's, not a gate's -- the same reason
// `one-teaching-one-lesson-guard.mjs` gives for not failing on its own recorded
// pair. So a recorded pair passes with its comparison cited, and an UNRECORDED
// collision fails, which is the only thing a gate can honestly assert here:
// that nobody built twice from one source without noticing.
import { readLedger, DECISIONS } from './lesson-row-shipped-sweep.mjs';
import { fileURLToPath } from 'node:url';

// A thread id as the ledger cites it in front matter: a backticked hex run of
// at least 12 characters. Backticked only, because an un-backticked hex run is
// as likely to be a commit SHA or a build-group id (the same reasoning
// lesson-row-shipped-sweep.mjs records for its own prefix matcher).
const THREAD_IN_TEXT = /`([0-9a-f]{12,})`/g;

// Records that deliberately share one source, each with the comparison that
// justifies it. Adding a pair here is a decision, not a silence: the comparison
// must exist in the later record before the pair is listed.
export const KNOWN_SHARED_THREADS = [
  {
    thread: '1a0f23b12bf2ca45',
    drs: ['DR-1246', 'DR-1285'],
    why: 'One fourteen-item TLDR digest, two teachings, measured as complementary rather than '
      + 'asserted: 0 shared anchor verses and 0 shared chapters; sov51 taught the office that does '
      + 'not transfer (who answers when work is handed over) and used this item’s sentence as the '
      + 'digest’s own statement of that seam, while sov57 teaches the asymmetry the same sentence '
      + 'reports (what can be rebuilt against what cannot) and the practice that follows. Measured '
      + 'in sov51’s whole module: record 0, register 0, rebuild 0, irreplaceable 0, archive 0. '
      + 'The full comparison is in DR-1285; whether the two should be one lesson is Darrell’s call.',
  },
];

/** thread id -> sorted DR ids naming it, for every record in the ledger. */
export function threadClaims(ledger = readLedger()) {
  const byThread = new Map();
  for (const rec of ledger) {
    // Front matter only: the thread a record claims is named where it states its
    // grounds, not wherever a hex string happens to appear in a later table.
    const head = rec.text.slice(0, 4000).toLowerCase();
    THREAD_IN_TEXT.lastIndex = 0;
    for (let m = THREAD_IN_TEXT.exec(head); m; m = THREAD_IN_TEXT.exec(head)) {
      const id = m[1];
      if (!byThread.has(id)) byThread.set(id, new Set());
      byThread.get(id).add(rec.dr);
    }
  }
  const out = new Map();
  for (const [id, drs] of byThread) out.set(id, [...drs].sort());
  return out;
}

// SIX COLLISIONS ALREADY EXISTED when this guard was written, and they are
// recorded as DEBT rather than waved through. Measured 2026-10-29 on the whole
// ledger, before this guard was wired into anything. NOT ONE of them has been
// investigated: a record may legitimately name several threads (a batch record
// does), so some of these are probably not duplicate lessons at all -- but
// saying which would require reading six pairs of records, and asserting they
// are fine without reading them is precisely the hollowing-out this file exists
// to prevent (DR-0076 section 3).
//
// So they sit here, dated, as a SHRINK-ONLY baseline: a pair that disappears
// lowers the list, and a pair that is investigated moves UP into
// KNOWN_SHARED_THREADS with its comparison. A NEW collision fails the build,
// which is the only thing this gate needs to do to have caught sov57.
// re-review: 2026-11-28 -- read the six pairs below and move each one either
// into KNOWN_SHARED_THREADS with a comparison, or out of the ledger as a
// genuine duplicate for Darrell to fold. Lower this list as each is cleared.
export const UNEXAMINED_BASELINE = [
  '1a0a5a12db9c6a62:DR-0412+DR-0413+DR-0416',
  '1a0a5a4e540b4fde:DR-0412+DR-0413+DR-0414+DR-0415',
  '1a11668e8023cd3e:DR-0793+DR-0863',
  '1a11be8ea0e58748:DR-0834+DR-0864',
  '1a135f165fe391e3:DR-1005+DR-1051',
  'a30e4942e161b7833c6cef051b8ab6fd:DR-0711+DR-0739',
];

const key = (drs) => [...drs].sort().join('+');
const RECORDED = new Set(KNOWN_SHARED_THREADS.map((p) => `${p.thread}:${key(p.drs)}`));
const BASELINE = new Set(UNEXAMINED_BASELINE);

/**
 * Threads named by more than one record that are neither investigated above nor
 * in the dated baseline. An unexamined pair whose DR set CHANGES also lands
 * here, because a third record joining a pair is new information.
 */
export function newCollisions(claims = threadClaims()) {
  const out = [];
  for (const [thread, drs] of claims) {
    if (drs.length < 2) continue;
    const k = `${thread}:${key(drs)}`;
    if (RECORDED.has(k) || BASELINE.has(k)) continue;
    out.push({ thread, drs });
  }
  return out.sort((a, b) => a.thread.localeCompare(b.thread));
}

/** Baseline entries that no longer collide, so the list may be lowered. */
export function healedBaseline(claims = threadClaims()) {
  const live = new Set();
  for (const [thread, drs] of claims) if (drs.length > 1) live.add(`${thread}:${key(drs)}`);
  return UNEXAMINED_BASELINE.filter((k) => !live.has(k));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const claims = threadClaims();
  const shared = [...claims.entries()].filter(([, drs]) => drs.length > 1);
  const bad = newCollisions(claims);
  if (bad.length) {
    console.error('one-thread-one-record-guard: FAIL');
    for (const b of bad) {
      console.error(`  - thread ${b.thread} is named by ${b.drs.join(' and ')}`);
    }
    console.error('\nTwo records name one source thread and the ledger does not record the pair.');
    console.error('Run `node scripts/lesson-row-shipped-sweep.mjs <thread>` and read the record it');
    console.error('names. Then EITHER write the comparison into the later record and add the pair');
    console.error('to KNOWN_SHARED_THREADS, OR do not build the second lesson. Whether two lessons');
    console.error('from one forward should be folded is Darrell’s editorial call, never this gate’s.');
    process.exit(1);
  }
  const healed = healedBaseline(claims);
  if (healed.length) {
    console.error('one-thread-one-record-guard: FAIL — the unexamined baseline is stale.');
    for (const h of healed) console.error(`  - no longer collides: ${h}`);
    console.error('\nRemove each healed entry from UNEXAMINED_BASELINE; the list may only shrink.');
    process.exit(1);
  }
  console.log(`one-thread-one-record-guard: OK — ${claims.size} thread(s) named across the ledger, `
    + `${shared.length} shared (${KNOWN_SHARED_THREADS.length} examined, `
    + `${UNEXAMINED_BASELINE.length} unexamined debt, re-review 2026-11-28), 0 new.`);
  for (const p of KNOWN_SHARED_THREADS) console.log(`  ~ examined: ${p.thread} -> ${p.drs.join(', ')}`);
  for (const k of UNEXAMINED_BASELINE) console.log(`  ! unexamined: ${k}`);
  console.log(`  (ledger: ${DECISIONS})`);
}
