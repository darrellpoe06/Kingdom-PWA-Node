#!/usr/bin/env node
// =============================================================================
// append-stewardship-verses — add the "Stewardship & Legacy" cards' verses to
// lib/scripture-kjv.js (the games' verse store)
// =============================================================================
// DR-0076 Verification Doctrine: Scripture is NEVER typed from memory. This
// script sources every verse VERBATIM from the in-repo, public-domain KJV under
// app/public/bible/kjv/*.json and appends the ones the Generations "Stewardship &
// Legacy" deck cards reference (that aren't already present) to lib/scripture-kjv.js.
// No network. HARD-FAILS if any reference can't be resolved verbatim, so a
// typo'd/nonexistent ref can never silently ship.
//
// Run:  node scripts/append-stewardship-verses.mjs
// Idempotent: re-running is a no-op once the refs are present.
// =============================================================================
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const KJV_DIR = join(ROOT, 'app/public/bible/kjv');
const STORE = join(ROOT, 'app/src/lib/scripture-kjv.js');

// The Stewardship-series verses the Generations deck references that are NOT
// already in the store. Keys use the store's convention ("Psalm", singular).
const REFS = [
  // Own what produces / keep the tree
  'Genesis 1:11', 'Proverbs 27:18',
  // Buy the asset, not the spectacle / count the cost
  'Proverbs 24:27', 'Luke 14:28',
  // Pay it off (the widow's oil) / owe only love
  '2 Kings 4:7', 'Romans 13:8',
  // Inheritance to the children's children
  'Proverbs 13:22',
  // Give Yahweh the glory — He will not share it
  'Deuteronomy 8:17', 'Isaiah 42:8', 'Psalm 115:1', '1 Corinthians 4:7',
];

function fileForBook(book) {
  const b = book === 'Psalm' ? 'Psalms' : book;
  return b.replace(/\s+/g, '');
}

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
    console.log('append-stewardship-verses: OK — all references already present (no-op).');
    return;
  }

  const block = [
    '',
    '  // --- Appended 2026-07-06 for the Generations "Stewardship & Legacy" deck ---',
    '  // Sourced VERBATIM from the in-repo public-domain KJV (app/public/bible/kjv/*.json),',
    '  // never typed from memory (DR-0076).',
    ...lines,
    '',
  ].join('\n');

  store = store.slice(0, closeIdx) + block + store.slice(closeIdx);
  writeFileSync(STORE, store);
  console.log(`append-stewardship-verses: OK — added ${added} verbatim KJV verses to lib/scripture-kjv.js`);
}

main();
