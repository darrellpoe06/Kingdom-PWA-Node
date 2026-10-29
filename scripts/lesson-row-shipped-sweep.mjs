#!/usr/bin/env node
// lesson-row-shipped-sweep.mjs -- is this inbox row already a shipped lesson?
// =============================================================================
// WHY (DR-1250, 2026-10-27): the bell reported twelve teachings "waiting" and
// FOUR of them were already built, merged, deployed and readable in the app.
// The NAS builder re-claimed each one every hour, one on attempt 4, spending a
// model call to rebuild a lesson the congregation could already read. DR-1250's
// closing finding was that the sweep which caught it was run "four times, by
// hand, in one session -- a check run four times by hand is a check that
// belongs in the instrument." This is that instrument.
//
// WHY AGAIN, AND WORSE (2026-10-28): the intake Routine permits the hosted
// Supabase connector as an alternative road when the NAS road is closed. It is
// NOT the same database. Measured today, while the runner's tailnet key was
// refused (DR-1269): that project lists 22 rows as waiting and **20 of them are
// named in shipped decision records** -- including three shipped hours earlier
// the same night. A session with only the connector available sees a twenty-deep
// backlog that does not exist, and building it produces the duplicate DR-0610
// forbids. The tags cannot answer this question, because the tags are exactly
// what is missing or divergent in both failures. The LEDGER can: a shipped
// lesson has a decision record, and that record names the row it came from.
//
// WHAT IT DOES: for each row id, searches docs/decisions/*.md for that id and
// reports the records that name it. Exit 1 if ANY id is already shipped, so a
// caller can refuse to build. Read-only; never touches a body or the database.
//
// DELIBERATELY NOT tag-based. `lesson-captured` is the builder's lock and it is
// trustworthy only when it was written to the database the reader is reading.
// This check asks the repository instead, which is the one witness both roads
// share.
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const DECISIONS = join(HERE, '..', 'docs', 'decisions');

// An id must be at least this long to be looked for. A short prefix matches by
// accident -- '7a74' appears inside unrelated hashes, build-group ids and SHAs
// all over the ledger -- and a false SHIPPED is worse than no check, because it
// would silently refuse to build a teaching nobody has built.
export const MIN_ID = 8;

const DR_IN_NAME = /^(DR-\d{4})/;

/** Every decision record, as { dr, file, text }. Read once per sweep. */
export function readLedger(dir = DECISIONS) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (!name.endsWith('.md')) continue;
    const m = DR_IN_NAME.exec(name);
    if (!m) continue; // INDEX.md, PRINCIPLES.md, README.md
    out.push({ dr: m[1], file: name, text: readFileSync(join(dir, name), 'utf8') });
  }
  return out;
}

/**
 * Which records name each id. Returns a Map id -> { drs, exact } where `drs` is
 * sorted DR ids (empty = unknown) and `exact` says whether any match cited the
 * WHOLE id rather than only its prefix.
 * Throws on an id shorter than MIN_ID rather than returning a guess.
 *
 * BOTH FORMS ARE SEARCHED, and the first version of this tool got it wrong in
 * the dangerous direction. It searched the full uuid only, and the ledger
 * conventionally cites a row by its first eight characters -- so `c3285321`
 * (DR-0771) and `7ce13700` (DR-0768) came back UNKNOWN though both were long
 * since handled. A false unknown here is the failure that lets a live lesson be
 * rebuilt, which is the whole harm DR-1250 recorded. A false SHIPPED only
 * stops a build until someone reads the record named, so the bias belongs on
 * this side -- but the two are reported apart so nobody has to guess which
 * they are looking at.
 */
export function sweep(ids, ledger = readLedger()) {
  const out = new Map();
  for (const raw of ids) {
    const id = String(raw || '').trim().toLowerCase();
    if (id.length < MIN_ID) throw new Error(`id too short to search safely (min ${MIN_ID}): ${raw}`);
    if (!/^[0-9a-f-]+$/.test(id)) throw new Error(`not a row id (hex and dashes only): ${raw}`);
    // The prefix must stand alone, not sit inside a longer hex run. Without
    // this the fabricated id 00000000-... matched DR-1235, whose text carries
    // the epoch 1761500000000 -- a false SHIPPED, which would block a teaching
    // nobody has built. The ledger's real citation form is a backticked
    // standalone prefix (`c3285321`), and a backtick is not a hex character.
    const prefix = new RegExp(`(?<![0-9a-f])${id.slice(0, MIN_ID)}(?![0-9a-f])`);
    const hits = new Set();
    let exact = false;
    for (const rec of ledger) {
      const text = rec.text.toLowerCase();
      if (text.includes(id)) { hits.add(rec.dr); exact = true; continue; }
      if (prefix.test(text)) hits.add(rec.dr);
    }
    out.set(id, { drs: [...hits].sort(), exact });
  }
  return out;
}

// =============================================================================
// THE SECOND QUESTION (2026-10-29, DR-1288)
// =============================================================================
// WHY, MEASURED TWICE IN ONE NIGHT. The id check above asks the ledger ONE
// question: does any record name this row id. A record that names its source in
// PROSE is invisible to it, and two threads were handed to builders as "unbuilt"
// on the strength of that single question:
//
//   1a10bf98e21775dd -> built as sov55 (DR-1273). The id check DID catch this
//                       one; it was never run.
//   1a112049320caa4a -> built as L213 (DR-0763), which names its source as
//                       "a Big Think piece by Dirk Schulze-Makuch and Tony
//                       Reichhardt, 'The leading theory of how life began just
//                       hit a snag'" and writes the thread id NOWHERE. Measured:
//                       `grep -c 1a112049320caa4a` on that record is 0. The id
//                       check reported `unknown` and was right about the id and
//                       wrong about the teaching. A builder wrote the whole
//                       lesson before its own anchor check found L213.
//
// So the id is necessary and not sufficient, and a second question costs almost
// nothing: does any record talk about THIS SUBJECT.
//
// WHY IT SCORES RARITY RATHER THAN MATCHING WORDS. A naive word match is
// useless and worse than useless: measured on this ledger, "Monolith" appears in
// 79 records and "Uber" in 6, so a hit on a common word would stop every build
// and train a caller to ignore the check -- the crying-wolf failure DR-0975
// records. A word is only evidence if FEW records carry it. So each content word
// is scored by how many records contain it, the counts are PRINTED so a human
// can see why a record was named, and a record is surfaced only when it shares
// enough rare words to be worth reading.
//
// IT IS A WEAKER SIGNAL AND SAYS SO. An id match means SHIPPED. A subject match
// means READ THIS RECORD BEFORE BUILDING -- it may be the same teaching, or a
// record that merely discusses the same field. It is reported under its own
// label and never as SHIPPED, because conflating them would make the strong
// signal untrustworthy. The exit code still stops the caller, per this file's
// own stated bias: a false stop costs one read, a false clear costs a duplicate
// lesson on a COLG-facing surface.

// Words that carry no signal in a newsletter subject line. Deliberately short:
// the rarity score does the real work, and a long hand-made list is a thing to
// maintain and get wrong.
export const SUBJECT_STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'of', 'in', 'on', 'at', 'to', 'for', 'from',
  'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'it', 'its', 'this', 'that',
  'these', 'those', 'how', 'why', 'what', 'when', 'where', 'who', 'which', 'you',
  'your', 'we', 'our', 'they', 'their', 'just', 'new', 'now', 'can', 'will', 'has',
  'have', 'not', 'all', 'more', 'most', 'about', 'into', 'out', 'up', 'down', 'fw',
  'fwd', 're', 'lessons', 'lesson',
]);

// A word in more than this share of the ledger is treated as common and scored
// zero, however long it is. 0.05 of ~1180 records is ~59, which puts "Monolith"
// (79) out and keeps "snag" in.
export const COMMON_SHARE = 0.05;

// RARITY IS WEIGHTED, NOT COUNTED, and the first version of this probe counted.
// MEASURED on the real case: counting words at >= 2 surfaced DR-0763 correctly
// AND six unrelated records, because "leading" (36 records) and "theory" (18)
// both sat under the common ceiling and any two of them qualified a record. A
// probe that names seven records every time is the crying-wolf failure this
// file's own comment warns about -- the caller learns to skip it, and then the
// one real hit is skipped with the rest.
//
// So each shared word is worth 1/records: a word in 2 records is worth 0.50, one
// in 36 is worth 0.03. A record is worth reading when its weights sum past the
// bar, which means ONE genuinely rare word qualifies it and a handful of
// mid-frequency words do not. The weights are printed beside the counts so a
// reader can see exactly why a record was named or passed over.
export const RARITY_BAR = 0.2;

/** The content words of a subject line, lowercased, de-duplicated, in order. */
export function subjectWords(subject) {
  const seen = new Set();
  const out = [];
  for (const raw of String(subject || '').toLowerCase().split(/[^a-z0-9']+/)) {
    const w = raw.replace(/^'+|'+$/g, '');
    if (w.length < 4) continue;              // "AI", "of", "hit" carry nothing alone
    if (SUBJECT_STOPWORDS.has(w)) continue;
    if (seen.has(w)) continue;
    seen.add(w);
    out.push(w);
  }
  return out;
}

/**
 * Which records talk about this subject, and why. Returns
 * { words: [{ word, records }], hits: [{ dr, file, words }] } where `records` is
 * how many records carry that word (the rarity score, printed for the reader)
 * and `hits` is sorted by how many distinctive words each record shares.
 */
export function sweepSubject(subject, ledger = readLedger(), opts = {}) {
  const bar = opts.rarityBar ?? RARITY_BAR;
  const commonShare = opts.commonShare ?? COMMON_SHARE;
  const words = subjectWords(subject);
  const ceiling = Math.max(1, Math.floor(ledger.length * commonShare));
  const lower = ledger.map((r) => ({ ...r, lc: r.text.toLowerCase() }));

  const scored = words.map((word) => {
    const carriers = lower.filter((r) => r.lc.includes(word));
    return { word, records: carriers.length, carriers, distinctive: carriers.length > 0 && carriers.length <= ceiling };
  });

  const per = new Map();
  for (const { word, distinctive, carriers, records } of scored) {
    if (!distinctive) continue;
    for (const r of carriers) {
      if (!per.has(r.dr)) per.set(r.dr, { dr: r.dr, file: r.file, words: [], weight: 0 });
      const e = per.get(r.dr);
      e.words.push(word);
      e.weight += 1 / records;
    }
  }
  const hits = [...per.values()]
    .map((h) => ({ ...h, weight: Math.round(h.weight * 1000) / 1000 }))
    .filter((h) => h.weight >= bar)
    .sort((a, b) => b.weight - a.weight || a.dr.localeCompare(b.dr));

  const scoredWords = scored.map(({ word, records, distinctive }) => ({
    word, records, distinctive, weight: distinctive ? Math.round((1 / records) * 1000) / 1000 : 0,
  }));
  return { words: scoredWords, hits, ceiling, bar };
}

/** True when any id is already named in the ledger, by full id or by prefix. */
export function anyShipped(found) {
  for (const hit of found.values()) if (hit.drs.length) return true;
  return false;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const argv = process.argv.slice(2).filter(Boolean);
  const si = argv.indexOf('--subject');
  const subject = si >= 0 ? argv[si + 1] : '';
  const ids = (si >= 0 ? [...argv.slice(0, si), ...argv.slice(si + 2)] : argv);
  if (!ids.length && !subject) {
    console.error('usage: lesson-row-shipped-sweep.mjs <row-id> [row-id...] [--subject "<subject line>"]');
    console.error('  prints SHIPPED/unknown per id; exit 1 if any is already shipped.');
    console.error('  --subject also asks whether any record TALKS ABOUT this subject,');
    console.error('  which catches a record that names its source in prose and no id (DR-1288).');
    process.exit(2);
  }
  let found;
  try {
    found = sweep(ids);
  } catch (err) {
    console.error(`REFUSED: ${err.message}`);
    process.exit(2);
  }
  for (const [id, { drs, exact }] of found) {
    if (drs.length && exact) console.log(`SHIPPED   ${id}  ->  ${drs.join(', ')}`);
    else if (drs.length) console.log(`SHIPPED?  ${id}  ->  ${drs.join(', ')}  (cited by prefix only -- read the record)`);
    else console.log(`unknown   ${id}  ->  no decision record names it`);
  }
  const n = [...found.values()].filter((h) => h.drs.length).length;

  let subjectHits = 0;
  if (subject) {
    const { words, hits, ceiling, bar } = sweepSubject(subject);
    console.log('');
    console.log(`subject probe: "${subject}"`);
    if (!words.length) {
      console.log('  no content words in that subject -- the id check above is all this run measured');
    } else {
      console.log(`  words, with how many records carry each and what that is worth (a word in more than ${ceiling} is common and worth 0):`);
      for (const w of words) console.log(`    ${w.distinctive ? '*' : ' '} ${w.word} -> ${w.records} record(s), worth ${w.weight}`);
      console.log(`  a record is worth reading at ${bar} or more`);
    }
    for (const h of hits) {
      console.log(`  READ FIRST  ${h.dr}  weight ${h.weight} from ${h.words.join(', ')}  (${h.file})`);
    }
    subjectHits = hits.length;
    if (!subjectHits) console.log('  no record shares enough distinctive words with this subject');
  }

  if (n) {
    console.error(`\n${n} of ${found.size} row(s) are ALREADY SHIPPED -- do not build them (DR-1250, DR-0610).`);
    process.exit(1);
  }
  if (subjectHits) {
    console.error(`\nNo id is named, but ${subjectHits} record(s) talk about this subject. READ THEM before building:`);
    console.error('a record may name its source in prose and never write the row id -- DR-0763 does exactly');
    console.error('that, and a whole lesson was written against it before anything noticed (DR-1288).');
    process.exit(1);
  }
  if (ids.length) console.error(`\nnone of ${found.size} row(s) is named in a decision record.`);
}
