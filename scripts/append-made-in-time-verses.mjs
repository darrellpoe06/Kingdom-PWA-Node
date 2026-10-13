#!/usr/bin/env node
// =============================================================================
// append-made-in-time-verses — add the "Made in Time" course anchor Scriptures
// to lib/scripture-kjv.js so the presenter can show the FULL verse in
// parentheses (not just the location) for the minister to recall the Word.
// =============================================================================
// DR-0076 Verification Doctrine: Scripture is NEVER typed from memory. Every
// verse is sourced VERBATIM from the in-repo, public-domain KJV that
// fetch-full-kjv.mjs materialized under app/public/bible/kjv/*.json — no
// network. HARD-FAILS if a reference can't be resolved (so a typo is caught,
// never silently painted). Idempotent: re-running is a no-op once present.
//
// Reference set: every `anchor.ref` on the course modules (split on ';'),
// deduped. Darrell 2026-07-16: "add full scriptures in parentheses instead of
// just the location in case the minister or whomever want to recall the Word."
//
// Run:  node scripts/append-made-in-time-verses.mjs
// =============================================================================
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const KJV_DIR = join(ROOT, 'app/public/bible/kjv');
const STORE = join(ROOT, 'app/src/lib/scripture-kjv.js');
const COURSE = join(ROOT, 'app/src/lib/made-in-time-course.js');

// Pull the anchor refs straight from the course source (no import — keep this a
// plain text scan so the script never pulls React/app deps). Each module authors
// `anchor: { ref: '...', ... }`; a ref may be compound ("A 1:2; B 3:4").
function collectRefs() {
  const src = readFileSync(COURSE, 'utf8');
  const refs = new Set();
  const re = /anchor:\s*\{\s*ref:\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    for (const part of m[1].split(';')) {
      const ref = part.trim();
      if (ref) refs.add(ref);
    }
  }
  return [...refs];
}

function fileForBook(book) {
  const b = book === 'Psalm' ? 'Psalms' : book;
  return b.replace(/\s+/g, '');
}

function parseRef(ref) {
  const m = String(ref).match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/);
  if (!m) return null; // a non-verse anchor (e.g. a themed phrase) — skip, don't fail
  return { book: m[1], chap: Number(m[2]), v1: Number(m[3]), v2: m[4] ? Number(m[4]) : Number(m[3]) };
}

const bookCache = new Map();
function loadBook(file) {
  if (!bookCache.has(file)) {
    bookCache.set(file, JSON.parse(readFileSync(join(KJV_DIR, `${file}.json`), 'utf8')));
  }
  return bookCache.get(file);
}

function verbatim(parsed, ref) {
  const { book, chap, v1, v2 } = parsed;
  const data = loadBook(fileForBook(book));
  const chapter = data.chapters[chap - 1];
  if (!Array.isArray(chapter)) throw new Error(`${ref}: chapter ${chap} not found in ${data.name}`);
  const parts = [];
  for (let v = v1; v <= v2; v += 1) {
    const text = chapter[v - 1];
    if (typeof text !== 'string' || !text.trim()) throw new Error(`${ref}: verse ${v} not found`);
    parts.push(text.trim());
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

function main() {
  let store = readFileSync(STORE, 'utf8');
  const closeIdx = store.lastIndexOf('};');
  if (closeIdx < 0) throw new Error('could not find the closing "};" of the KJV object');

  const lines = [];
  let added = 0;
  let skipped = 0;
  for (const ref of collectRefs()) {
    if (store.includes(`"${ref}":`)) continue; // already present — idempotent
    const parsed = parseRef(ref);
    if (!parsed) { skipped += 1; continue; } // themed/non-verse anchor phrase
    const text = verbatim(parsed, ref); // throws if a real ref can't be resolved
    const escaped = text.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    lines.push(`  "${ref}": "${escaped}",`);
    added += 1;
  }

  if (added === 0) {
    console.log(`append-made-in-time-verses: OK — all references already present (no-op). skipped ${skipped} non-verse anchor(s).`);
    return;
  }

  const block = [
    '',
    "  // --- Appended for the \"Made in Time\" course anchors (lib/made-in-time-course.js) ---",
    '  // Sourced VERBATIM from the in-repo public-domain KJV (app/public/bible/kjv/*.json,',
    '  // materialized by scripts/fetch-full-kjv.mjs), never typed from memory (DR-0076).',
    ...lines,
    '',
  ].join('\n');

  store = store.slice(0, closeIdx) + block + store.slice(closeIdx);
  writeFileSync(STORE, store);
  console.log(`append-made-in-time-verses: OK — added ${added} verbatim KJV verses to lib/scripture-kjv.js (skipped ${skipped} non-verse anchor phrase(s)).`);
}

main();
