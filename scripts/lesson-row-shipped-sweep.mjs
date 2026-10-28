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

/** True when any id is already named in the ledger, by full id or by prefix. */
export function anyShipped(found) {
  for (const hit of found.values()) if (hit.drs.length) return true;
  return false;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const ids = process.argv.slice(2).filter(Boolean);
  if (!ids.length) {
    console.error('usage: lesson-row-shipped-sweep.mjs <row-id> [row-id...]');
    console.error('  prints SHIPPED/unknown per id; exit 1 if any is already shipped.');
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
  if (n) {
    console.error(`\n${n} of ${found.size} row(s) are ALREADY SHIPPED -- do not build them (DR-1250, DR-0610).`);
    process.exit(1);
  }
  console.error(`\nnone of ${found.size} row(s) is named in a decision record.`);
}
