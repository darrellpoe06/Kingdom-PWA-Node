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
import { readLedger, consideredNotBuilt, DECISIONS } from './lesson-row-shipped-sweep.mjs';
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
  // The three below were read on 2026-11-04, closing three of the six pairs the
  // dated baseline had carried unexamined since 2026-10-28 (re-review was
  // 2026-11-28; read early because the reading was available now, DR-0236).
  {
    thread: '1a0a5a12db9c6a62',
    drs: ['DR-0412', 'DR-0413', 'DR-0416'],
    why: 'NOT lessons at all, and not duplicates. All three are `Type: word` — World Issues '
      + 'entries 12, 13 and 16 — and one forward carried several items, each becoming its own '
      + 'entry on a wholly distinct subject: DR-0412 the EPA unwinding the power-plant carbon '
      + 'rules, DR-0413 the Supreme Court leaving the mail-in rules alone, DR-0416 the non-degree '
      + 'job market and work with your hands. One source, several teachings, which DR-0610 permits: '
      + 'its rule is one TEACHING one lesson, never one SOURCE one lesson. Read at front-matter '
      + 'and title level on 2026-11-04; the five entries\' bodies were not read, and are not '
      + 'needed to say the EPA rules and the trades hiring are not one teaching told twice.',
  },
  {
    thread: '1a0a5a4e540b4fde',
    drs: ['DR-0412', 'DR-0413', 'DR-0414', 'DR-0415'],
    why: 'Same shape as the entry above and the same forward-carries-many-items cause: `Type: word` '
      + 'World Issues entries 12, 13, 14 and 15 — the EPA carbon rules, the Supreme Court and the '
      + 'mail-in rules, the Kennedy Center and whose name goes on the house, and Evanston\'s '
      + 'reparations and the equal-protection suit. Four distinct subjects, no lesson among them. '
      + 'Read at front-matter and title level on 2026-11-04.',
  },
  {
    thread: 'a30e4942e161b7833c6cef051b8ab6fd',
    drs: ['DR-0711', 'DR-0739'],
    why: 'NOT two lessons from one source — two CORRECTIONS to one lesson, L202. DR-0711 gives the '
      + 'session its speakers (BG, DP, and the members as Bishop Gwin calls them) and honors '
      + 'Evangelist Mary E. Gwin; DR-0739 is `Type: defect` and gives Deacon Palmer his words and '
      + 'the class its true count. Two records amending a single lesson is the ledger working. Note '
      + 'also that this id is 32 hex characters — a recording row, not a Gmail thread, so the '
      + 'Gmail-lane reasoning about forwards does not even apply to it. Read 2026-11-04.',
  },
  {
    thread: '1a112049320caa4a',
    drs: ['DR-0763', 'DR-1288'],
    why: 'NOT two lessons. DR-0763 built L213 from this thread; DR-1288 cites it as the case that '
      + 'proved a hole in the shipped-sweep, because that record named its source in prose and no '
      + 'id, so an id-only search answered "unknown" for a built teaching and a second lesson was '
      + 'written before a builder\'s own anchor check caught it. DR-1288 teaches nothing and ships '
      + 'no lesson. This guard reads the first 4000 characters as front matter, which is a sound '
      + 'approximation and cannot tell PROVENANCE from CITATION when a record discusses an intake '
      + 'incident in its opening — these two entries are the first instances of that. Worth a '
      + 'sharper rule only if the pattern recurs; re-review: 2026-11-29.',
  },
  {
    thread: '1a10bf98e21775dd',
    drs: ['DR-1273', 'DR-1288'],
    why: 'NOT two lessons, same shape as above. DR-1273 built sov55 from this thread; DR-1288 cites '
      + 'it as the first of the two threads handed out as "unbuilt" in one night — the one the id '
      + 'check would have caught and was never asked. Citation, not provenance.',
  },
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
    // A thread the record DECLARES it considered and did not build is a
    // citation, never a claim (DR-1305). This is the sharper rule the
    // KNOWN_SHARED_THREADS note above asked for: the comment there says this
    // 4000-character approximation "cannot tell PROVENANCE from CITATION when a
    // record discusses an intake incident in its opening", and the declaration
    // is how a record says which it means. `consideredNotBuilt` refuses to
    // exempt an id the record's own `**Intake:**` line names, so a record can
    // never disown its own source this way.
    const declared = consideredNotBuilt(rec.text);
    THREAD_IN_TEXT.lastIndex = 0;
    for (let m = THREAD_IN_TEXT.exec(head); m; m = THREAD_IN_TEXT.exec(head)) {
      const id = m[1];
      if (declared.has(id)) continue;
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
// ALL SIX WERE READ ON 2026-11-04, twenty-four days before the date, and the
// list is now empty. What they turned out to be, because the answer was not one
// thing: THREE were never duplicates and moved up into KNOWN_SHARED_THREADS
// with their comparisons (two forwards that each carried several World Issues
// items, and two corrections to the single lesson L202). ONE healed at the
// cause: DR-1051 is `Type: orchestration`, it built a guard and no lesson, and
// it named `1a135f165fe391e3` only because it RECOVERED that id into DR-1005,
// which really built sov39 from it -- so it now carries the DR-1305
// `Considered, not built:` declaration and the pair no longer exists. And TWO
// are genuine duplicates, which is what EXAMINED_AWAITING_FOLD below holds.
export const UNEXAMINED_BASELINE = [];

/**
 * Pairs that WERE read and ARE one teaching built twice. These are not debt and
 * not false positives -- they are measured duplicates waiting on an editorial
 * decision that belongs to Darrell and never to this gate (DR-1185 folded the
 * one before these: ll235's four verses and two parables were carried into
 * ll257 before ll235 was removed, so nothing was lost).
 *
 * Measured with the catalog's OWN rule -- `sharedGround` from
 * `app/src/lib/one-teaching-one-lesson.js`, which expands verse ranges before
 * comparing, so "Psalms 39:4; Psalms 39:5" and "Psalms 39:4-5" count as the one
 * ground they are. Each pair is the same course AND the same source forward AND
 * thirteen-plus shared verses. That conjunction is the discriminator: a verse
 * measure alone cannot separate these from legitimate reuse, because dropping
 * the title clause from the shipped rule flags 146 pairs across the 712 lessons
 * while the shipped rule flags none. Sharing a source AND the ground is not a
 * theme recurring; it is one send taught twice.
 */
export const EXAMINED_AWAITING_FOLD = [
  {
    thread: '1a11668e8023cd3e',
    drs: ['DR-0793', 'DR-0863'],
    lessons: ['ll215', 'll239'],
    sharedVerses: 13,
    why: 'One forward of 2026-10-07 12:48 UTC, taught twice in Living Lessons two days apart. '
      + 'll215 "When a Land Has No Smith — Count the Cost, Prepare the Field, and Who Gives the '
      + 'Safety" (DR-0793, 2026-10-07) and ll239 "The King Sits Down First — A Shipyard, a '
      + 'Submarine Contract, and Who Gives Safety" (DR-0863, 2026-10-09) share 13 expanded anchor '
      + 'verses including the whole Luke 14:28-32 counting-the-cost core, and both titles close on '
      + 'who gives the safety. The shipped rule misses it only because the titles open differently.',
  },
  {
    thread: '1a11be8ea0e58748',
    drs: ['DR-0834', 'DR-0864'],
    lessons: ['ll223', 'll238'],
    sharedVerses: 14,
    why: 'One forward of 2026-10-08 14:26 UTC, taught twice in Living Lessons. ll223 "The Storm You '
      + 'Can See Coming, and the Court Where a Life Hangs" (DR-0834) and ll238 "Who Holds the Wind '
      + '— The Warning, the Foundation, and the Neighbour in the Storm\'s Path" (DR-0864, '
      + '2026-10-09) share 14 expanded anchor verses, among them Mark 4:37-39, Psalms 107:28-29 and '
      + 'the whole of Matthew 7:24-27.',
  },
];

/**
 * A third pair from the same 2026-10-08/09 run is NOT listed here on purpose:
 * `1a11be8188dbc2f6` (DR-0821 ll221 / DR-0860 ll236) came from one
 * utility-billing forward and shares exactly ONE verse, so "Owning the Light
 * Instead of Renting It" and "The Bill You Cannot Read" are two genuinely
 * different teachings from one source. It is the control that shows the rule
 * above does not over-flag, and it needs no fold.
 */

const key = (drs) => [...drs].sort().join('+');
// A measured duplicate awaiting Darrell's fold is RECORDED, not NEW: the pair is
// known and written down, so it must not fail every build until he decides. It
// is printed loudly on every run instead, so it cannot go quiet either.
const RECORDED = new Set([
  ...KNOWN_SHARED_THREADS.map((p) => `${p.thread}:${key(p.drs)}`),
  ...EXAMINED_AWAITING_FOLD.map((p) => `${p.thread}:${key(p.drs)}`),
]);
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
    + `${shared.length} shared (${KNOWN_SHARED_THREADS.length} examined and cleared, `
    + `${EXAMINED_AWAITING_FOLD.length} measured duplicate(s) awaiting Darrell's fold, `
    + `${UNEXAMINED_BASELINE.length} unexamined), 0 new.`);
  for (const p of KNOWN_SHARED_THREADS) console.log(`  ~ examined: ${p.thread} -> ${p.drs.join(', ')}`);
  for (const p of EXAMINED_AWAITING_FOLD) {
    console.log(`  ! DUPLICATE awaiting fold: ${p.lessons.join(' / ')} from ${p.thread} `
      + `(${p.drs.join(', ')}), ${p.sharedVerses} shared verses`);
  }
  for (const k of UNEXAMINED_BASELINE) console.log(`  ! unexamined: ${k}`);
  console.log(`  (ledger: ${DECISIONS})`);
}
