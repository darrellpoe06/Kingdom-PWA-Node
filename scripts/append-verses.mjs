#!/usr/bin/env node
// =============================================================================
// append-verses — the ONE verbatim-KJV appender for the games' verse store
// =============================================================================
// DR-0076 Verification Doctrine: Scripture is NEVER typed from memory. This
// single script sources every verse VERBATIM from the in-repo, public-domain KJV
// under app/public/bible/kjv/*.json and appends the ones the games reference
// (that aren't already present) to lib/scripture-kjv.js. No network. HARD-FAILS if
// any reference can't be resolved verbatim, so a typo'd/nonexistent ref can never
// silently ship.
//
// WHY ONE SCRIPT (continuous-efficiency pass, DR-0109): this replaces three
// near-identical one-off scripts (append-way-up-verses / append-stewardship-verses
// / append-pride-verses) that were sed-copied 100+ lines at a time. Adding a new
// batch of verses is now ONE entry in BATCHES below — not a new copied file.
//
// Run:  node scripts/append-verses.mjs            (all batches)
//       node scripts/append-verses.mjs <batch>    (one named batch)
// Idempotent: re-running is a no-op once the refs are present.
// =============================================================================
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const KJV_DIR = join(ROOT, 'app/public/bible/kjv');
const STORE = join(ROOT, 'app/src/lib/scripture-kjv.js');

// Every batch of verses the games reference, keyed by the feature that added it.
// Keys use the store's convention ("Psalm", singular). To add verses for a new
// teaching/game, add ONE entry here — no new script file.
const BATCHES = {
  // "The Way Up" game (the wilderness -> the table)
  'way-up': [
    'Deuteronomy 8:2', 'Deuteronomy 8:3', 'Deuteronomy 8:18',
    'Genesis 39:2', 'Genesis 39:9',
    'James 4:10', '1 Peter 5:6', 'Matthew 23:12',
    'Proverbs 22:7', 'Proverbs 21:20',
    '3 John 1:2', 'Joshua 1:8', 'Psalm 1:3',
    'Deuteronomy 28:1', 'Deuteronomy 28:10', 'Deuteronomy 28:13',
    'Psalm 23:5', 'Psalm 110:1', 'Matthew 5:5', 'Genesis 50:20',
    'Job 42:10', 'Job 42:12', '2 Timothy 1:7', 'Romans 8:37', 'Revelation 3:21',
    'Luke 6:38', 'Romans 8:15',
  ],
  // Generations "Stewardship & Legacy" deck
  stewardship: [
    'Genesis 1:11', 'Proverbs 27:18',
    'Proverbs 24:27', 'Luke 14:28',
    '2 Kings 4:7', 'Romans 13:8',
    'Proverbs 13:22',
    'Deuteronomy 8:17', 'Isaiah 42:8', 'Psalm 115:1', '1 Corinthians 4:7',
  ],
  // Generations "Pride & the Increase" deck
  pride: [
    'Proverbs 16:18', 'Daniel 4:37',
    '1 Corinthians 3:7', 'Psalm 127:1',
  ],
};

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
  const only = process.argv[2] || null;
  if (only && !BATCHES[only]) {
    throw new Error(`unknown batch "${only}" — known: ${Object.keys(BATCHES).join(', ')}`);
  }
  const refs = only ? BATCHES[only] : Object.values(BATCHES).flat();
  const seen = new Set();

  let store = readFileSync(STORE, 'utf8');
  const closeIdx = store.lastIndexOf('};');
  if (closeIdx < 0) throw new Error('could not find the closing "};" of the KJV object');

  const lines = [];
  let added = 0;
  for (const ref of refs) {
    if (seen.has(ref)) continue; // batches may overlap; add each ref once
    seen.add(ref);
    if (store.includes(`"${ref}":`)) continue; // already present — idempotent
    const text = verbatim(ref); // throws if unresolvable
    const escaped = text.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    lines.push(`  "${ref}": "${escaped}",`);
    added++;
  }

  if (added === 0) {
    console.log(`append-verses: OK — all ${only ? `"${only}" ` : ''}references already present (no-op).`);
    return;
  }

  const block = [
    '',
    `  // --- Appended by scripts/append-verses.mjs${only ? ` (batch: ${only})` : ''} ---`,
    '  // Sourced VERBATIM from the in-repo public-domain KJV (app/public/bible/kjv/*.json),',
    '  // never typed from memory (DR-0076).',
    ...lines,
    '',
  ].join('\n');

  store = store.slice(0, closeIdx) + block + store.slice(closeIdx);
  writeFileSync(STORE, store);
  console.log(`append-verses: OK — added ${added} verbatim KJV verses to lib/scripture-kjv.js`);
}

main();
