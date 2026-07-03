#!/usr/bin/env node
// =============================================================================
// fetch-godhead-verses — materialize VERBATIM KJV text for the Godhead Study
// =============================================================================
// Darrell 2026-07-03: "Can you go through the entire Bible and find the
// deterministic algorithms so we can have that as a Thorough Study Of The
// Living GodHead." The catalog (lib/godhead-study.js) names only REFERENCES;
// this script fetches every named verse VERBATIM from a public-domain KJV
// source (aruljohn/Bible-kjv) and writes lib/godhead-study-verses.json — the
// ONLY place verse text comes from. No verse is ever quoted from model memory
// (DR-0076 / SCRIPTURE-REFERENCE-STANDARD).
//
// PROVEN-TO-CATCH: a catalog ref that cannot be resolved (typo'd book, chapter,
// or verse) HARD-FAILS this script, and the test suite re-verifies every ref
// has its text. Run after editing the catalog:
//   node scripts/fetch-godhead-verses.mjs
// =============================================================================
import { writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'app/src/lib/godhead-study-verses.json');
const SRC = 'https://raw.githubusercontent.com/aruljohn/Bible-kjv/master';

// The catalog imports its verses JSON with Vite's plain-JSON import, which
// plain node can't load — so the refs are read out of the SOURCE text here.
// Proven-to-catch: the entry count must match the refs count (a catalog entry
// whose refs line drifts from the `refs: ['...']` shape fails loudly).
// Both verse-bearing catalogs ride the same rail: the Godhead Study entries
// (id prefix gh-) and the 3rd-dimension witness pairs (id prefix w3p-).
const CATALOGS = [
  { file: 'app/src/lib/godhead-study.js', idRe: /^\s*id:\s*'gh-/gm, label: 'godhead entries' },
  { file: 'app/src/lib/third-witness.js', idRe: /^\s*id:\s*'w3p-/gm, label: 'witness pairs' },
];
const GODHEAD_ALGORITHMS = [];
for (const cat of CATALOGS) {
  const libSrc = readFileSync(join(ROOT, cat.file), 'utf8');
  const refLines = [...libSrc.matchAll(/refs:\s*\[([^\]]+)\]/g)];
  const idCount = (libSrc.match(cat.idRe) || []).length;
  if (refLines.length !== idCount) {
    console.error(`fetch-godhead-verses: refs lines (${refLines.length}) != ${cat.label} (${idCount}) in ${cat.file} — a refs array drifted from the expected shape.`);
    process.exit(1);
  }
  for (const m of refLines) {
    GODHEAD_ALGORITHMS.push({ refs: [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]) });
  }
}

// "1 Corinthians 15:31" -> { book:'1Corinthians', chapter:15, v1:31, v2:31 }
function parseRef(ref) {
  const m = String(ref).trim().match(/^([1-3]?\s?[A-Za-z ]+?)\s+(\d+):(\d+)(?:-(\d+))?$/);
  if (!m) throw new Error(`unparseable ref: ${ref}`);
  const book = m[1].replace(/\s+/g, '');
  return { book, chapter: +m[2], v1: +m[3], v2: m[4] ? +m[4] : +m[3] };
}

const books = new Map(); // book file cache
async function fetchBook(book) {
  if (books.has(book)) return books.get(book);
  const res = await fetch(`${SRC}/${book}.json`);
  if (!res.ok) throw new Error(`fetch failed for ${book}: HTTP ${res.status}`);
  const data = await res.json();
  books.set(book, data);
  return data;
}

async function verseText(ref) {
  const { book, chapter, v1, v2 } = parseRef(ref);
  const data = await fetchBook(book);
  const ch = (data.chapters || []).find((c) => c.chapter === String(chapter));
  if (!ch) throw new Error(`${ref}: chapter ${chapter} not found in ${book}`);
  const parts = [];
  for (let v = v1; v <= v2; v += 1) {
    const row = ch.verses.find((x) => x.verse === String(v));
    if (!row) throw new Error(`${ref}: verse ${v} not found in ${book} ${chapter}`);
    parts.push(row.text.trim());
  }
  return parts.join(' ');
}

const refs = [...new Set(GODHEAD_ALGORITHMS.flatMap((a) => a.refs))];
const out = {};
const failures = [];
for (const ref of refs) {
  try {
    out[ref] = await verseText(ref);
  } catch (e) {
    failures.push(`${ref} — ${e.message}`);
  }
}

if (failures.length) {
  console.error(`fetch-godhead-verses: ${failures.length} ref(s) FAILED:\n  ${failures.join('\n  ')}`);
  process.exit(1);
}

writeFileSync(OUT, `${JSON.stringify(out, null, 2)}\n`);
console.log(`fetch-godhead-verses: OK — ${refs.length} refs fetched verbatim (KJV, public domain) -> app/src/lib/godhead-study-verses.json`);
