#!/usr/bin/env node
// =============================================================================
// lesson-already-built — is a forwarded teaching already a lesson?
// =============================================================================
// WHY, MEASURED. DR-0610 says one teaching, one lesson, and the Gmail intake
// routine enforces it by having the agent search the catalogs and the ledger by
// hand on every firing — three firings a day, for as long as a thread sits
// unlabelled. On 2026-10-14 the same thread was checked by hand on two
// consecutive ticks (the ByteByteGo positional-encoding article, already built
// as sov39 under DR-1005): catalog grep, ledger grep, read the provenance line,
// compare the forward timestamp. Both times the answer was the same and both
// times it took the same four steps.
//
// The routine already records what that check is worth: on 2026-10-11 a broken
// `-label:Label_22` exclusion returned 12 threads that were every one of them
// already captured, and taken at face value that firing "would have built
// TWELVE DUPLICATE LESSONS". The catalog check is what stands between a stale
// label and twelve duplicates, so it should be a tool rather than a habit.
//
// WHAT IT IS NOT. It does not decide anything and it writes nothing. It reports
// what it found and where, so the agent (or a person) decides. It is a FINDER,
// deliberately biased toward reporting a weak match rather than missing a real
// one: a false "maybe this is already built" costs one read, and a missed match
// costs a duplicate lesson in the congregation's app.
//
// WHAT IT SEARCHES
//   · docs/decisions/*.md — the provenance lines, which are where a forwarded
//     source is actually named ("Darrell forwarded a ByteByteGo article on
//     2026-10-13 at 17:54 UTC with one word on it, 'Lesson'");
//   · app/src/lib/*-class.js and the course files — the lesson bodies, where a
//     source is named in the text itself.
//
// HOW A MATCH IS JUDGED, in descending strength:
//   · timestamp — the day AND THE TIME together, as a DR writes them
//     ("2026-10-13 at 17:54 UTC"). The strongest signal available, because a
//     minute is effectively unique to one forward.
//     FOUND BY USING IT: the first version accepted a BARE DAY as this
//     strongest signal, and on the real case it returned "ALREADY BUILT" on the
//     strength of `2026-10-13` appearing in dozens of unrelated records that
//     merely mention that date — while DR-1005, the one true match, did not
//     make the top eight. A right verdict from worthless evidence is the
//     failure this house calls looks-fine-but-isn't, so a bare day no longer
//     counts as a timestamp at all. It is only a signal ALONGSIDE the source
//     name, and that pair is its own strength.
//   · source+day — the source name AND the bare day, but ONLY when they are
//     NEAR EACH OTHER and the day is not a promise about the future.
//     FOUND BY USING IT, 2026-10-15, on a real forward: Darrell forwarded a
//     Morning Brew issue ("Piping hot") that was genuinely unbuilt, and this
//     finder answered "LIKELY ALREADY BUILT — the source on that day", its
//     second-strongest verdict, naming DR-0412, DR-0416 and DR-0437. Every one
//     of those three is a SEPTEMBER record about a DIFFERENT newsletter. They
//     matched because `2026-10-15` appears in them as a `re-review:` date while
//     "Morning Brew" sits thirty-odd lines away in the provenance line — two
//     unrelated facts, in one 50KB file, scored as though they were one
//     sentence. Both whole-file `includes()` calls were blind to distance.
//     THE COST RUNS THE WRONG WAY. This finder is deliberately biased toward a
//     weak false positive, because a needless read is cheaper than a duplicate
//     lesson. But `re-review:` dates are a DR-0075 INSTITUTION — every parked
//     improvement in the ledger carries one — so the ledger is densely seeded
//     with future days, and a recurring source like Morning Brew (six records
//     and counting) will collide with one on any given day. That turns the
//     verdict most likely to STOP a build into the one that fires hardest on
//     exactly the sources this house uses most. Taken at face value it would
//     have blocked World Issues 20 the day it was written.
//     So the day must now be PROVENANCE, not a promise: a `re-review:` line is
//     never the forward's day, and the source must appear within
//     SOURCE_DAY_WINDOW lines of it.
//   · source name — a publication or author ("ByteByteGo", "Morning Brew").
//     Strong, but a publication forwarded twice is two teachings, so a name
//     match alone is reported as PARTIAL and never as settled.
//   · distinctive terms — several uncommon words from the subject or body. Weak
//     on its own; reported with its hit count so the reader can weigh it.
//
// Pure where it can be: every function takes its haystack as an argument.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const DECISIONS = 'docs/decisions';
export const CATALOG_DIR = 'app/src/lib';

/** Words too common to identify a teaching. */
const STOP = new Set([
  'the', 'a', 'an', 'and', 'of', 'in', 'to', 'is', 'it', 'for', 'on', 'that',
  'how', 'why', 'what', 'with', 'from', 'this', 'are', 'was', 'were', 'has',
  'have', 'they', 'them', 'their', 'when', 'which', 'used', 'using', 'help',
  'helps', 'understand', 'understands', 'about', 'into', 'more', 'than', 'its',
]);

export const normalise = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9: -]+/g, ' ').replace(/\s+/g, ' ').trim();

/** The uncommon words of a subject line, longest first. */
export function distinctiveTerms(subject, { min = 4 } = {}) {
  return [...new Set(normalise(subject).split(' '))]
    .filter((w) => w.length >= min && !STOP.has(w))
    .sort((a, b) => b.length - a.length);
}

/**
 * Every way a date can be written in a provenance line, from one ISO instant.
 * A DR writes "2026-10-13 at 17:54 UTC", "2026-10-13T17:54", or just the day,
 * so all three are looked for.
 */
export function dateForms(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return [];
  const day = d.toISOString().slice(0, 10);
  const hhmm = d.toISOString().slice(11, 16);
  // Time-bearing forms ONLY. A bare day is returned separately, because on its
  // own it matches any record that happens to mention that date.
  return [...new Set([`${day}T${hhmm}`, `${day} at ${hhmm}`, `${day} ${hhmm}`])];
}

/** The bare day, which is a weak signal and never a timestamp match. */
export function bareDay(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

function readAll(root, rel, exts) {
  const abs = join(root, rel);
  if (!existsSync(abs)) return [];
  const out = [];
  for (const f of readdirSync(abs)) {
    if (!exts.some((e) => f.endsWith(e))) continue;
    try { out.push([join(rel, f), readFileSync(join(abs, f), 'utf8')]); } catch { /* unreadable */ }
  }
  return out;
}

/**
 * Score one file against the teaching. Returns null for no signal at all.
 * `strength` is 'timestamp' | 'source' | 'terms', in descending confidence.
 */
/**
 * How many CHARACTERS may sit between the source name and the day for the pair
 * to still read as one provenance statement.
 *
 * MEASURED, not chosen by taste. Against the real ledger on 2026-10-15:
 *   true provenance pairs  — DR-1005/ByteByteGo 22 chars, DR-0416/Morning Brew
 *                            26, DR-0791/Morning Brew 107.
 *   the false positives    — DR-0412 2,859, DR-0437 5,918, DR-0412 9,324,
 *                            DR-0416 9,792, INDEX.md 2,859.
 * A 27x gap separates the widest true pair from the narrowest false one, so 400
 * sits about 4x above every true pair and about 7x below every false one.
 *
 * CHARACTERS AND NOT LINES, and that is the whole point. The first attempt at
 * this fix used a three-LINE window and the false positive survived it:
 * `docs/decisions/INDEX.md` is one row per record, each row a whole paragraph
 * on a single line of 1,600 to 3,200 characters, so "within three lines" there
 * spans three entire records. Line distance is not distance in this ledger.
 */
export const SOURCE_DAY_WINDOW = 400;

/**
 * A line that only PROMISES something about a date — a `re-review:` marker — is
 * not a record of when a teaching arrived. DR-0075 puts one of these on every
 * parked improvement, so they are the single most common way a future day
 * appears in the ledger, and counting them as provenance is what produced the
 * measured false positive.
 */
export const isPromiseLine = (line) => /re-?review\s*:/i.test(String(line || ''));

/** The line containing a character offset, for the promise check. */
function lineAt(text, offset) {
  const from = text.lastIndexOf('\n', offset) + 1;
  const to = text.indexOf('\n', offset);
  return text.slice(from, to === -1 ? text.length : to);
}

/**
 * The bare day, but only where it reads as PROVENANCE: within
 * SOURCE_DAY_WINDOW characters of the source name, and not on a `re-review:`
 * line. Returns the day, or null.
 *
 * Pure — takes its haystack as an argument.
 */
export function provenanceDayHit(text, day, source, window = SOURCE_DAY_WINDOW) {
  if (!day || !source) return null;
  const hay = String(text || '');
  const low = hay.toLowerCase();
  const needle = String(source).toLowerCase();
  if (!needle) return null;
  // Every offset at which the source is named, once.
  const sourceAt = [];
  for (let j = low.indexOf(needle); j !== -1; j = low.indexOf(needle, j + 1)) sourceAt.push(j);
  if (!sourceAt.length) return null;
  for (let i = hay.indexOf(day); i !== -1; i = hay.indexOf(day, i + 1)) {
    // A promise about a future date is not a record of when a teaching came.
    if (isPromiseLine(lineAt(hay, i))) continue;
    if (sourceAt.some((j) => Math.abs(i - j) <= window)) return day;
  }
  return null;
}

export const THREAD_ID = /^[0-9a-f]{16}$/;

/**
 * A Gmail thread id is PROOF, where a timestamp is inference: the id belongs to
 * exactly one forward and the ledger-names-its-thread rule (DR-0076 §8) puts it
 * in the record of every lesson built from one. Added 2026-11-10 after ll300:
 * its `Lesson-Captured` label could not be written (the write needed an
 * approval this session could not grant), so the Gmail-side lock was absent
 * while the lesson was already built and merged. The lane's own instruction
 * checks the LABEL, and this finder keyed on subject/source/timestamp, so
 * nothing machine-checkable stood between a missing label and a duplicate
 * build. The repo was a witness nobody had taught this tool to read.
 */
export function scoreFile(text, { dates = [], day = null, source = null, terms = [], thread = null }) {
  const hay = text;
  const low = hay.toLowerCase();
  const threadHit = thread && THREAD_ID.test(thread) && hay.includes(thread) ? thread : null;
  const dateHit = dates.find((d) => hay.includes(d)) || null;
  // The day is only a signal where it reads as provenance: near the source
  // name, and not on a `re-review:` line. A whole-file `includes` here scored
  // a September record's re-review date as "the source on that day".
  const dayHit = provenanceDayHit(hay, day, source);
  const sourceHit = source && low.includes(source.toLowerCase()) ? source : null;
  const termHits = terms.filter((t) => low.includes(t));
  if (!threadHit && !dateHit && !sourceHit && !termHits.length) return null;
  // A bare day proves nothing by itself; paired with the source IN ONE PLACE it
  // is strong.
  const strength = threadHit
    ? 'thread'
    : (dateHit
      ? 'timestamp'
      : (sourceHit && dayHit ? 'source+day' : (sourceHit ? 'source' : 'terms')));
  return { strength, threadHit, dateHit, dayHit, sourceHit, termHits };
}

/** Pull the id of any lesson named in a file, so the report can name it. */
export function lessonIdsIn(text) {
  return [...new Set((text.match(/\b(?:ll|sov|lil|bands?)[a-z]*\d+-[a-z0-9-]+/g) || []))];
}

export function findAlreadyBuilt(root, { subject = '', source = null, forwardedAt = null, thread = null } = {}) {
  const dates = forwardedAt ? dateForms(forwardedAt) : [];
  const day = forwardedAt ? bareDay(forwardedAt) : null;
  const terms = distinctiveTerms(subject);
  const files = [
    ...readAll(root, DECISIONS, ['.md']),
    ...readAll(root, CATALOG_DIR, ['-class.js']),
  ];
  const hits = [];
  for (const [rel, text] of files) {
    const s = scoreFile(text, { dates, day, source, terms, thread });
    if (!s) continue;
    hits.push({ file: rel, ...s, lessons: lessonIdsIn(text).slice(0, 4) });
  }
  const rank = { thread: 0, timestamp: 1, 'source+day': 2, source: 3, terms: 4 };
  hits.sort((a, b) => rank[a.strength] - rank[b.strength] || b.termHits.length - a.termHits.length);
  const verdict = hits.some((h) => h.strength === 'thread')
    ? 'ALREADY BUILT — the thread is named in the ledger'
    : (hits.some((h) => h.strength === 'timestamp')
    ? 'ALREADY BUILT'
    : (hits.some((h) => h.strength === 'source+day')
      ? 'LIKELY ALREADY BUILT — the source on that day'
      : (hits.some((h) => h.strength === 'source') ? 'MAYBE — a source match only' : (hits.length ? 'WEAK — terms only' : 'NOTHING FOUND'))));
  return { verdict, dates, day, terms, thread, hits };
}

const invokedDirectly = process.argv[1] && process.argv[1].endsWith('lesson-already-built.mjs');
if (invokedDirectly) {
  const args = process.argv.slice(2);
  const get = (flag) => { const i = args.indexOf(flag); return i === -1 ? null : args[i + 1] || null; };
  const subject = get('--subject') || '';
  const source = get('--source');
  const at = get('--at');
  const thread = get('--thread');
  if (!subject && !source && !at && !thread) {
    console.error('usage: lesson-already-built.mjs [--thread <16 hex>] [--subject "..."] [--source NAME] [--at ISO]');
    console.error('  reports whether a forwarded teaching is already a lesson; writes nothing');
    console.error('  --thread is the strongest check: the Gmail thread id, which one forward owns');
    process.exit(2);
  }
  // A malformed id would match nothing and read as NOTHING FOUND, which is the
  // one wrong answer this finder must never give by accident.
  if (thread && !THREAD_ID.test(thread)) {
    console.error(`--thread ${thread} is not a Gmail thread id (16 lowercase hex characters)`);
    process.exit(2);
  }
  const r = findAlreadyBuilt(join(HERE, '..'), { subject, source, forwardedAt: at, thread });
  console.log(`verdict: ${r.verdict}`);
  if (r.dates.length) console.log(`  looked for the forward as: ${r.dates.join(' | ')}`);
  if (r.terms.length) console.log(`  distinctive terms: ${r.terms.slice(0, 8).join(', ')}`);
  for (const h of r.hits.slice(0, 8)) {
    const why = h.threadHit
      ? `thread ${h.threadHit}`
      : (h.dateHit
      ? `timestamp "${h.dateHit}"`
      : (h.sourceHit && h.dayHit
        ? `source "${h.sourceHit}" on ${h.dayHit}`
        : (h.sourceHit ? `source "${h.sourceHit}"` : `${h.termHits.length} term(s): ${h.termHits.slice(0, 5).join(', ')}`)));
    console.log(`  [${h.strength}] ${h.file} — ${why}${h.lessons.length ? ` — names ${h.lessons.join(', ')}` : ''}`);
  }
  if (r.verdict === 'NOTHING FOUND') console.log('  nothing matched; this looks unbuilt, and DR-0610 still asks you to read before building.');
  // A finder never fails a build.
  process.exit(0);
}
