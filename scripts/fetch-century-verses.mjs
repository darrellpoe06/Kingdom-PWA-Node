#!/usr/bin/env node
// =============================================================================
// fetch-century-verses — materialize VERBATIM KJV text for yahweh-by-century
// =============================================================================
// The catalog (app/src/lib/yahweh-by-century.js) names REFERENCES only. This
// script resolves every one of them against the in-repo KJV corpus
// (app/public/bible/kjv) and writes app/src/lib/yahweh-by-century-verses.json —
// the ONLY place verse text for that module comes from. No verse is ever
// produced from model memory (DR-0076 / SCRIPTURE-REFERENCE-STANDARD).
//
// PROVEN-TO-CATCH: a ref that cannot be resolved — a typo'd book, a chapter or
// verse that does not exist, a range that runs off the end — HARD-FAILS this
// script with the offending ref named, and yahweh-by-century.test.js re-derives
// every entry independently so a hand-edited JSON cannot survive CI.
//
//   node scripts/fetch-century-verses.mjs
// =============================================================================
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const KJV_DIR = join(ROOT, 'app/public/bible/kjv');
const CATALOG = join(ROOT, 'app/src/lib/yahweh-by-century.js');
const OUT = join(ROOT, 'app/src/lib/yahweh-by-century-verses.json');

// Display book name -> corpus file name. The corpus drops spaces ("1 Kings" ->
// "1Kings.json") and uses the plural "Psalms" where references say "Psalm".
const FILES = new Set(readdirSync(KJV_DIR).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)));
export function bookFile(book) {
  const squashed = book.replace(/\s+/g, '');
  if (FILES.has(squashed)) return squashed;
  if (squashed === 'Psalm') return 'Psalms';
  if (squashed === 'SongofSongs' || squashed === 'Canticles') return 'SongofSolomon';
  return null;
}

const cache = new Map();
function chapters(file) {
  if (!cache.has(file)) cache.set(file, JSON.parse(readFileSync(join(KJV_DIR, `${file}.json`), 'utf8')).chapters);
  return cache.get(file);
}

// "1 Kings 6:1" | "Genesis 3:15" | "Deuteronomy 8:2" -> { book, ch, v }
// Ranges are NOT accepted: every ref in the catalog is a single verse, so a
// range in the catalog is a mistake this script must surface, not paper over.
export function parseRef(ref) {
  const m = /^((?:[123]\s)?[A-Za-z][A-Za-z ]*?)\s+(\d+):(\d+)$/.exec(String(ref).trim());
  if (!m) return null;
  return { book: m[1].trim(), ch: Number(m[2]), v: Number(m[3]) };
}

export function resolve(ref) {
  const p = parseRef(ref);
  if (!p) throw new Error(`unparseable reference: "${ref}" (single verses only, e.g. "1 Kings 6:1")`);
  const file = bookFile(p.book);
  if (!file) throw new Error(`unknown book in reference "${ref}": no ${p.book}.json in the corpus`);
  const chs = chapters(file);
  const chapter = chs[p.ch - 1];
  if (!chapter) throw new Error(`no chapter ${p.ch} in ${p.book} (reference "${ref}")`);
  const text = chapter[p.v - 1];
  if (typeof text !== 'string') throw new Error(`no verse ${p.v} in ${p.book} ${p.ch} (reference "${ref}")`);
  return text;
}

// Pull every quoted string that looks like a reference out of the catalog
// source. Reading the SOURCE rather than importing it keeps this script able to
// run before the JSON it generates exists (the module imports that JSON).
export function refsFromSource(src) {
  const out = new Set();
  for (const m of src.matchAll(/'((?:[123] )?[A-Za-z][A-Za-z ]*? \d+:\d+)'/g)) out.add(m[1]);
  return [...out];
}

const src = readFileSync(CATALOG, 'utf8');
const refs = refsFromSource(src);
if (refs.length < 100) throw new Error(`only ${refs.length} references found in the catalog — the extractor is not matching`);

const verses = {};
const failures = [];
for (const ref of refs.sort()) {
  try { verses[ref] = resolve(ref); } catch (e) { failures.push(e.message); }
}
if (failures.length) {
  console.error(`\nyahweh-by-century: ${failures.length} reference(s) could not be resolved:\n`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

writeFileSync(OUT, `${JSON.stringify(verses, null, 2)}\n`);
console.log(`yahweh-by-century-verses.json written — ${Object.keys(verses).length} verses, all verbatim from the in-repo KJV corpus.`);
