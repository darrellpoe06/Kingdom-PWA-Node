#!/usr/bin/env node
// =============================================================================
// fetch-full-kjv — materialize the WHOLE public-domain KJV inside PoeTech
// =============================================================================
// Darrell 2026-07-04: "can you build a Logos type of Bible inside the PoeTech App
// so we can not need to link out to biblegateway?" The King James Version (1611)
// is PUBLIC DOMAIN, so its full text can be hosted sovereignly. This script
// fetches all 66 books VERBATIM from a public-domain KJV source (aruljohn/
// Bible-kjv) and writes them as per-book static assets under
// app/public/bible/kjv/, plus a small index.json for instant navigation.
//
// ARCHITECTURE (why per-book, not one bundle): the whole KJV is ~4.3 MB. Jamming
// it into the JS bundle would bloat every page load. Instead each book is a
// same-origin static asset the reader lazy-loads ONLY when opened — sovereign
// (no external host, works offline once cached), and cheap (you fetch Genesis
// only when you open Genesis). The index (66 books x chapter->verse-count) is
// tiny and gets imported for the picker.
//
// FORMAT (compact + verbatim): each book file is
//   { "name": "Genesis", "chapters": [ ["verse 1 text", "verse 2 text", ...], ... ] }
// Verse N of a chapter is chapters[c-1][N-1]. Text is whitespace-normalized ONLY
// (never reworded — DR-0076). The script HARD-FAILS if any chapter's verses are
// not the contiguous 1..N, so a gap can never silently ship.
//
// Run:  node scripts/fetch-full-kjv.mjs
// =============================================================================
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'app/public/bible/kjv');
const SRC = 'https://raw.githubusercontent.com/aruljohn/Bible-kjv/master';

// Source book display names -> the source filename (spaces stripped).
const fileFor = (name) => name.replace(/\s+/g, '');

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

const norm = (s) => String(s).replace(/\s+/g, ' ').trim();

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const books = await getJson(`${SRC}/Books.json`); // 66 display names, Genesis..Revelation
  if (!Array.isArray(books) || books.length !== 66) {
    throw new Error(`expected 66 books, got ${Array.isArray(books) ? books.length : typeof books}`);
  }
  const index = [];
  let totalVerses = 0;
  for (const name of books) {
    const file = fileFor(name);
    const data = await getJson(`${SRC}/${file}.json`);
    const chapters = [];
    const chapterCounts = [];
    for (const ch of data.chapters) {
      // Verify contiguous 1..N — no silent gaps (proven-to-catch).
      const verses = [];
      const rows = ch.verses.slice().sort((a, b) => Number(a.verse) - Number(b.verse));
      rows.forEach((row, i) => {
        if (Number(row.verse) !== i + 1) {
          throw new Error(`${name} ${ch.chapter}: verse ${row.verse} out of sequence at index ${i + 1}`);
        }
        verses.push(norm(row.text));
      });
      chapters.push(verses);
      chapterCounts.push(verses.length);
      totalVerses += verses.length;
    }
    writeFileSync(join(OUT_DIR, `${file}.json`), JSON.stringify({ name, chapters }));
    index.push({ name, file, chapters: chapterCounts });
    process.stdout.write(`  ${name} (${data.chapters.length} ch)\n`);
  }
  writeFileSync(join(OUT_DIR, 'index.json'), `${JSON.stringify(index, null, 0)}\n`);
  // The tiny navigation index is ALSO written into src/ so the reader can import
  // it (instant book/chapter picker) without a fetch; the heavy per-book text
  // stays in public/ and lazy-loads.
  writeFileSync(join(ROOT, 'app/src/lib/bible-kjv-index.json'), `${JSON.stringify(index, null, 0)}\n`);
  console.log(`fetch-full-kjv: OK — 66 books, ${totalVerses} verses, verbatim KJV (public domain) -> app/public/bible/kjv/ (+ src/lib/bible-kjv-index.json)`);
  if (totalVerses < 31000) throw new Error(`suspiciously low verse count ${totalVerses} (KJV has 31,102)`);
}

main().catch((e) => { console.error(`fetch-full-kjv: FAILED — ${e.message}`); process.exit(1); });
