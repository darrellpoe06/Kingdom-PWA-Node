#!/usr/bin/env node
// =============================================================================
// kjv-name-case-corrections — restore LORD / Lord / GOD where the in-repo KJV
// mis-renders the Name (case-only, manifest-driven, re-applicable)
// =============================================================================
// FOUND 2026-09-06 while paying down the lessons' case-only quotations: the
// in-repo KJV (aruljohn/Bible-kjv, fetched verbatim by fetch-full-kjv.mjs)
// prints small-caps LORD where the KJV reads Lord, and Lord where it reads
// LORD, in dozens of verses — and the capitalisation CARRIES MEANING: LORD is
// the translators' rendering of the Tetragrammaton (Yahweh); Lord is Adonai;
// "Lord GOD" is Adonai Yahweh. "My LORD" at Genesis 18:3 and "the Lord talked
// with Moses" at Exodus 33:9 name the wrong Person. Readers see this text in
// the in-app Bible.
//
// VERIFIED, NOT REMEMBERED (DR-0076): two independent witnesses agree against
// our corpus and never with it.
//   1. A second public-domain KJV (thiagobodruk/bible, en_kjv.json) — the
//      corrected token sequence for every verse below is ITS sequence.
//   2. The public-domain WEB already on disk (app/public/bible/web) prints
//      "Yahweh" exactly where the Hebrew has the Name and "Lord" for Adonai —
//      a deterministic oracle for the Old Testament. Of 59 disputed OT verses
//      it vindicated the second source in 51 and ours in 0; the 8 it could not
//      decide (the WEB phrases them differently) are NOT corrected and are
//      listed in the manifest as `undecided`.
//   In the New Testament the KJV prints LORD only inside Old Testament
//   quotations of the Name (Psalm 110:1 at Matthew 22:44 / Mark 12:36 / Luke
//   20:42 / Acts 2:34, and Revelation 19:16's title); the second source prints
//   exactly those five and ours printed 29. The 24 strays are corrected and
//   Acts 2:34 restored.
//
// WHAT THIS IS NOT: not a re-ingest (the second source is a different edition
// with its own wording/verse-join differences and italics markers, so it cannot
// replace the corpus); not a wording change (letters and punctuation are
// untouched, only the case of the tokens LORD/Lord/GOD/God); and not the
// adversary-name lowercasing of #1397, which is Darrell's directive and stands.
//
// The manifest (scripts/kjv-name-case-corrections.json) records every verse's
// text before and after, so the correction is a readable diff and can be
// re-applied after any re-ingest:   node scripts/kjv-name-case-corrections.mjs
// Idempotent: a verse already carrying its `after` text is skipped.
// =============================================================================
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const KJV = join(ROOT, 'app/public/bible/kjv');
const MANIFEST = join(ROOT, 'scripts/kjv-name-case-corrections.json');

export function applyCorrections({ write = true } = {}) {
  const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  const byBook = new Map();
  let applied = 0; let already = 0; const mismatched = [];
  for (const c of manifest.corrections) {
    const [book, cv] = c.ref.split(' ');
    const [ch, v] = cv.split(':').map(Number);
    if (!byBook.has(book)) byBook.set(book, JSON.parse(readFileSync(join(KJV, `${book}.json`), 'utf8')));
    const j = byBook.get(book);
    const cur = j.chapters[ch - 1][v - 1];
    if (cur === c.after) { already += 1; continue; }
    if (cur !== c.before) { mismatched.push({ ref: c.ref, cur }); continue; }
    j.chapters[ch - 1][v - 1] = c.after;
    applied += 1;
  }
  if (write) for (const [book, j] of byBook) writeFileSync(join(KJV, `${book}.json`), `${JSON.stringify(j)}\n`);
  return { applied, already, mismatched, total: manifest.corrections.length };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const r = applyCorrections({ write: !process.argv.includes('--dry') });
  console.log(`corrections: ${r.total}; applied ${r.applied}; already in place ${r.already}; mismatched ${r.mismatched.length}`);
  for (const m of r.mismatched) console.log(`  MISMATCH ${m.ref}: ${m.cur.slice(0, 80)}`);
  if (r.mismatched.length) process.exit(1);
}
