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
export function scoreFile(text, { dates = [], day = null, source = null, terms = [] }) {
  const hay = text;
  const low = hay.toLowerCase();
  const dateHit = dates.find((d) => hay.includes(d)) || null;
  const dayHit = day && hay.includes(day) ? day : null;
  const sourceHit = source && low.includes(source.toLowerCase()) ? source : null;
  const termHits = terms.filter((t) => low.includes(t));
  if (!dateHit && !sourceHit && !termHits.length) return null;
  // A bare day proves nothing by itself; paired with the source it is strong.
  const strength = dateHit
    ? 'timestamp'
    : (sourceHit && dayHit ? 'source+day' : (sourceHit ? 'source' : 'terms'));
  return { strength, dateHit, dayHit, sourceHit, termHits };
}

/** Pull the id of any lesson named in a file, so the report can name it. */
export function lessonIdsIn(text) {
  return [...new Set((text.match(/\b(?:ll|sov|lil|bands?)[a-z]*\d+-[a-z0-9-]+/g) || []))];
}

export function findAlreadyBuilt(root, { subject = '', source = null, forwardedAt = null } = {}) {
  const dates = forwardedAt ? dateForms(forwardedAt) : [];
  const day = forwardedAt ? bareDay(forwardedAt) : null;
  const terms = distinctiveTerms(subject);
  const files = [
    ...readAll(root, DECISIONS, ['.md']),
    ...readAll(root, CATALOG_DIR, ['-class.js']),
  ];
  const hits = [];
  for (const [rel, text] of files) {
    const s = scoreFile(text, { dates, day, source, terms });
    if (!s) continue;
    hits.push({ file: rel, ...s, lessons: lessonIdsIn(text).slice(0, 4) });
  }
  const rank = { timestamp: 0, 'source+day': 1, source: 2, terms: 3 };
  hits.sort((a, b) => rank[a.strength] - rank[b.strength] || b.termHits.length - a.termHits.length);
  const verdict = hits.some((h) => h.strength === 'timestamp')
    ? 'ALREADY BUILT'
    : (hits.some((h) => h.strength === 'source+day')
      ? 'LIKELY ALREADY BUILT — the source on that day'
      : (hits.some((h) => h.strength === 'source') ? 'MAYBE — a source match only' : (hits.length ? 'WEAK — terms only' : 'NOTHING FOUND')));
  return { verdict, dates, day, terms, hits };
}

const invokedDirectly = process.argv[1] && process.argv[1].endsWith('lesson-already-built.mjs');
if (invokedDirectly) {
  const args = process.argv.slice(2);
  const get = (flag) => { const i = args.indexOf(flag); return i === -1 ? null : args[i + 1] || null; };
  const subject = get('--subject') || '';
  const source = get('--source');
  const at = get('--at');
  if (!subject && !source && !at) {
    console.error('usage: lesson-already-built.mjs [--subject "..."] [--source NAME] [--at ISO]');
    console.error('  reports whether a forwarded teaching is already a lesson; writes nothing');
    process.exit(2);
  }
  const r = findAlreadyBuilt(join(HERE, '..'), { subject, source, forwardedAt: at });
  console.log(`verdict: ${r.verdict}`);
  if (r.dates.length) console.log(`  looked for the forward as: ${r.dates.join(' | ')}`);
  if (r.terms.length) console.log(`  distinctive terms: ${r.terms.slice(0, 8).join(', ')}`);
  for (const h of r.hits.slice(0, 8)) {
    const why = h.dateHit
      ? `timestamp "${h.dateHit}"`
      : (h.sourceHit && h.dayHit
        ? `source "${h.sourceHit}" on ${h.dayHit}`
        : (h.sourceHit ? `source "${h.sourceHit}"` : `${h.termHits.length} term(s): ${h.termHits.slice(0, 5).join(', ')}`));
    console.log(`  [${h.strength}] ${h.file} — ${why}${h.lessons.length ? ` — names ${h.lessons.join(', ')}` : ''}`);
  }
  if (r.verdict === 'NOTHING FOUND') console.log('  nothing matched; this looks unbuilt, and DR-0610 still asks you to read before building.');
  // A finder never fails a build.
  process.exit(0);
}
