#!/usr/bin/env node
// =============================================================================
// append-way-up-verses — add "The Way Up" game's verses to lib/scripture-kjv.js
// =============================================================================
// DR-0076 Verification Doctrine: Scripture is NEVER typed from memory. This
// script sources every verse VERBATIM from the in-repo, public-domain KJV that
// fetch-full-kjv.mjs already materialized under app/public/bible/kjv/*.json, and
// appends the ones the game references (that aren't already present) to the
// games' verse store (lib/scripture-kjv.js). No network — the text is pulled
// from the sovereign local KJV assets. HARD-FAILS if any reference can't be
// resolved verbatim, so a typo'd/nonexistent ref can never silently ship.
//
// Run:  node scripts/append-way-up-verses.mjs
// Idempotent: re-running is a no-op once the refs are present.
// =============================================================================
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const KJV_DIR = join(ROOT, 'app/public/bible/kjv');
const STORE = join(ROOT, 'app/src/lib/scripture-kjv.js');

// The verses "The Way Up" references that are NOT already in the store. Keys use
// the store's convention ("Psalm", singular). Order = the game's ascent.
const REFS = [
  // The Wilderness — humbled, tested, to know the heart
  'Deuteronomy 8:2', 'Deuteronomy 8:3', 'Deuteronomy 8:18',
  // The Testing — resist the devil; Joseph flees; the mind kept
  'Genesis 39:2', 'Genesis 39:9',
  // The Turning — humble, then lifted
  'James 4:10', '1 Peter 5:6', 'Matthew 23:12',
  // The Rising — diligence; the debt-trap; the wise store
  'Proverbs 22:7', 'Proverbs 21:20',
  // The Prospering — even as the soul prospers; the tree by the water
  '3 John 1:2', 'Joshua 1:8', 'Psalm 1:3',
  // The Head — head not tail; the name upon you
  'Deuteronomy 28:1', 'Deuteronomy 28:10', 'Deuteronomy 28:13',
  // The Table — the table set; enemies a footstool; the meek inherit; Joseph's word
  'Psalm 23:5', 'Psalm 110:1', 'Matthew 5:5', 'Genesis 50:20',
  // Restored double; overcomer seated; sound mind; more than conquerors; give
  'Job 42:10', 'Job 42:12', '2 Timothy 1:7', 'Romans 8:37', 'Revelation 3:21',
  'Luke 6:38',
  // Added 2026-07-06 for Generations "Darrell's Journey" — the Spirit of
  // adoption (Christina taking K'Shawna as her own; grace made her wholly theirs).
  'Romans 8:15',
];

// Book display-name -> source filename. fetch-full-kjv strips spaces; the only
// alias we need is Psalm (store convention) -> Psalms (the source book).
function fileForBook(book) {
  const b = book === 'Psalm' ? 'Psalms' : book;
  return b.replace(/\s+/g, '');
}

// "Genesis 50:20" / "Deuteronomy 8:2-3" / "3 John 1:2" -> { book, chap, v1, v2 }
function parseRef(ref) {
  const m = String(ref).match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/);
  if (!m) throw new Error(`unparseable reference: "${ref}"`);
  return { book: m[1], chap: Number(m[2]), v1: Number(m[3]), v2: m[4] ? Number(m[4]) : Number(m[3]) };
}

const bookCache = new Map();
function loadBook(file) {
  if (!bookCache.has(file)) {
    bookCache.set(file, JSON.parse(readFileSync(join(KJV_DIR, `${file}.json`), 'utf8')));
  }
  return bookCache.get(file);
}

function verbatim(ref) {
  const { book, chap, v1, v2 } = parseRef(ref);
  const data = loadBook(fileForBook(book));
  const chapter = data.chapters[chap - 1];
  if (!Array.isArray(chapter)) throw new Error(`${ref}: chapter ${chap} not found in ${data.name}`);
  const parts = [];
  for (let v = v1; v <= v2; v++) {
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
  for (const ref of REFS) {
    if (store.includes(`"${ref}":`)) continue; // already present — idempotent
    const text = verbatim(ref); // throws if unresolvable
    const escaped = text.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    lines.push(`  "${ref}": "${escaped}",`);
    added++;
  }

  if (added === 0) {
    console.log('append-way-up-verses: OK — all references already present (no-op).');
    return;
  }

  const block = [
    '',
    '  // --- Appended 2026-07-06 for "The Way Up" game (wilderness -> the table) ---',
    '  // Sourced VERBATIM from the in-repo public-domain KJV (app/public/bible/kjv/*.json,',
    '  // materialized by scripts/fetch-full-kjv.mjs), never typed from memory (DR-0076).',
    ...lines,
    '',
  ].join('\n');

  store = store.slice(0, closeIdx) + block + store.slice(closeIdx);
  writeFileSync(STORE, store);
  console.log(`append-way-up-verses: OK — added ${added} verbatim KJV verses to lib/scripture-kjv.js`);
}

main();
