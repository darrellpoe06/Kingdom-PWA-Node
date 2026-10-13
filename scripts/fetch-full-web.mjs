#!/usr/bin/env node
// =============================================================================
// fetch-full-web — materialize the WHOLE World English Bible inside PoeTech
// =============================================================================
// Darrell 2026-08-13: "yes ingest the WEB translation."
//
// This closes the open item the base-text research review left on 2026-06-25:
// *"Ingest the full WEB + KJV Bibles… beyond the curated 180-verse seed."* The
// KJV half shipped as fetch-full-kjv.mjs; this is the other half, and it is what
// makes a modern-English reading available for ANY verse rather than the 180
// that were seeded into lib/scripture-web.js.
//
// WHY THE WEB AND NOT THE ESV. Darrell asked for a second translation beside the
// KJV and named the ESV. The ESV cannot be reproduced — bible-editions.js lists
// it as EXCLUDED, "Copyrighted (Crossway)… never reproduce or base our text on
// it." The WEB is the answer the repo's own registry already pointed at: a
// PUBLIC DOMAIN modern-English revision of the ASV, verified 2026-06-25 against
// primary sources (docs/99-session-notes/2026-06-25-poetech-study-edition-
// base-text-license-research-review.md) as "Public Domain (explicit dedication)".
//
// THE TRADEMARK RULE, HONORED BY CONSTRUCTION. That same review records the one
// real constraint: the TEXT is public domain and modifiable, but the NAME "World
// English Bible" is a trademark — a MODIFIED text must be renamed. So this
// script reproduces the text VERBATIM (whitespace normalization only, never a
// reworded word) and labels it WEB. Verbatim + labelled is exactly what keeps
// the trademark honored; it is not a stylistic preference.
//
// SOURCE. The `world-english-bible` npm package (TehShrike), a published,
// versioned packaging of ebible.org's WEB with per-verse chapter/verse metadata.
// npm is used deliberately: registry.npmjs.org is reachable and the package is
// version-pinned + integrity-checked by npm itself, where a raw file URL is
// neither. ebible.org is NOT reachable from the build sandbox, which is why the
// licence rests on the repo's own dated primary-source review rather than on a
// fetch of the copyright page.
//
// FORMAT — identical to the KJV corpus so both editions resolve through the same
// machinery and the same reader:
//   { "name": "Genesis", "chapters": [ ["verse 1", "verse 2", ...], ... ] }
// Verse N of chapter C is chapters[C-1][N-1]. Book NAMES are taken from the KJV
// index so the two corpora cannot drift apart on naming.
//
// The script HARD-FAILS on a missing book, an empty chapter, or an implausible
// number of empty verses. It does NOT fail on a handful of empty verses, because
// those are a TEXTUAL FACT in a critical-text edition (see the note at the
// omissions check) — they are recorded in the index instead, so a real hole and
// an honest divergence can never be confused (DR-0076).
//
// Run:  node scripts/fetch-full-web.mjs
// =============================================================================
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'app/public/bible/web');
const KJV_INDEX = join(ROOT, 'app/public/bible/kjv/index.json');
const PKG = 'world-english-bible';

// The WEB package carries verse text on exactly these two entry types: prose and
// poetry. Everything else is structure ('paragraph start/end', 'line break',
// 'stanza start/end') or an editorial section heading ('header') — headings are
// NOT Scripture and must never be folded into a verse.
const TEXT_TYPES = new Set(['paragraph text', 'line text']);

const norm = (s) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();

function installPackage() {
  const dir = join(tmpdir(), 'poetech-web-ingest');
  mkdirSync(dir, { recursive: true });
  if (!existsSync(join(dir, 'node_modules', PKG))) {
    execFileSync('npm', ['init', '-y'], { cwd: dir, stdio: 'ignore' });
    execFileSync('npm', ['i', PKG, '--no-audit', '--no-fund'], { cwd: dir, stdio: 'inherit' });
  }
  return join(dir, 'node_modules', PKG);
}

function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  // Canonical book names + order come from the KJV index, so the two editions
  // can never disagree about what a book is called.
  const kjvIndex = JSON.parse(readFileSync(KJV_INDEX, 'utf8'));
  if (!Array.isArray(kjvIndex) || kjvIndex.length !== 66) {
    throw new Error(`expected 66 books in the KJV index, got ${kjvIndex.length}`);
  }

  const src = installPackage();
  const index = [];
  const omissions = [];
  let totalVerses = 0;

  for (const book of kjvIndex) {
    const file = `${book.name.toLowerCase().replace(/\s+/g, '')}.json`;
    const path = join(src, 'json', file);
    if (!existsSync(path)) throw new Error(`WEB source missing ${file} for ${book.name}`);
    const entries = JSON.parse(readFileSync(path, 'utf8'));
    if (!Array.isArray(entries)) throw new Error(`${file}: expected an array`);

    // Poetry splits ONE verse across several 'line text' entries, so text is
    // appended per (chapter, verse) rather than assigned — dropping the repeat
    // would silently truncate every poetic verse in the Psalms.
    const chapters = [];
    for (const e of entries) {
      if (!e || !TEXT_TYPES.has(e.type)) continue;
      const c = Number(e.chapterNumber);
      const v = Number(e.verseNumber);
      if (!Number.isInteger(c) || !Number.isInteger(v) || c < 1 || v < 1) continue;
      while (chapters.length < c) chapters.push([]);
      const ch = chapters[c - 1];
      while (ch.length < v) ch.push('');
      ch[v - 1] = ch[v - 1] ? `${ch[v - 1]} ${norm(e.value)}` : norm(e.value);
    }

    // AN EMPTY SLOT IS EITHER A TEXTUAL FACT OR A PARSER BUG, AND THE DIFFERENCE
    // MATTERS. The first run of this script hard-failed on Luke 17:36 — which is
    // not a hole, it is one of the verses the critical text omits and the KJV
    // (Textus Receptus) carries. Failing on those would make it impossible to
    // ingest an honest critical-text edition at all; ignoring them would let a
    // real parse regression ship as "a textual difference".
    //
    // So an empty slot is RECORDED, not fatal, and the total is bounded: 5 across
    // 31,103 verses is a textual difference, hundreds would be a broken parse.
    // Measured on the 2026-08-13 ingest — Luke 17:36, Acts 8:37, Acts 15:34,
    // Acts 24:7 (all TR-only), and Romans 16:25, which is NOT an omission at all
    // but a VERSIFICATION difference: the WEB places that doxology at Romans
    // 14:24, verified by finding "able to establish you" there. That is exactly
    // the KJV/WEB divergence the base-text review wanted shown to the reader
    // rather than hidden, alongside the Comma Johanneum at 1 John 5:7.
    chapters.forEach((ch, ci) => {
      ch.forEach((t, vi) => {
        if (!norm(t)) omissions.push(`${book.name} ${ci + 1}:${vi + 1}`);
      });
      if (ch.length === 0) throw new Error(`${book.name} chapter ${ci + 1} has no verses`);
    });
    if (chapters.length === 0) throw new Error(`${book.name} produced no chapters`);

    const cleaned = chapters.map((ch) => ch.map(norm));
    writeFileSync(join(OUT_DIR, `${book.file}.json`), JSON.stringify({ name: book.name, chapters: cleaned }));
    index.push({ name: book.name, file: book.file, chapters: cleaned.map((c) => c.length) });
    totalVerses += cleaned.reduce((n, c) => n + c.length, 0);
  }

  // A parse regression would empty verses by the hundred; a real edition differs
  // by a handful. The bound is what separates the two, and it is checked, not
  // trusted.
  const MAX_OMISSIONS = 40;
  if (omissions.length > MAX_OMISSIONS) {
    throw new Error(`${omissions.length} empty verses (> ${MAX_OMISSIONS}) — that is a broken parse, not a textual difference:\n  ${omissions.slice(0, 20).join('\n  ')}`);
  }

  // The omissions ride IN the index so the app can say "not present at this
  // reference in the WEB" honestly, instead of rendering a blank the reader
  // reads as a bug. No REASON is invented per verse — the fact is recorded, the
  // explanation belongs to the textual note beside it.
  writeFileSync(join(OUT_DIR, 'index.json'), JSON.stringify({ books: index, omissions }));
  console.log(`WEB: ${index.length} books, ${totalVerses} verses -> ${OUT_DIR}`);
  console.log(`  ${omissions.length} reference(s) with no WEB text: ${omissions.join(', ') || 'none'}`);

  // Spot-checks the research review itself named as the honest-text proofs.
  const john = JSON.parse(readFileSync(join(OUT_DIR, 'John.json'), 'utf8'));
  const j316 = john.chapters[2][15];
  console.log(`  John 3:16 — ${j316.slice(0, 90)}…`);
  if (!/one and only/i.test(j316)) console.warn('  ! John 3:16 does not read "one and only" — verify the source');
  const oneJohn = JSON.parse(readFileSync(join(OUT_DIR, '1John.json'), 'utf8'));
  const c57 = oneJohn.chapters[4][6];
  console.log(`  1 John 5:7 — ${c57.slice(0, 90)}…`);
  if (/Father, the Word, and the Holy (Ghost|Spirit)/i.test(c57)) {
    throw new Error('1 John 5:7 carries the Comma Johanneum — that is the KJV reading, not the WEB. Wrong source.');
  }
}

main();
