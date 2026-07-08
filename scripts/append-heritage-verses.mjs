#!/usr/bin/env node
// =============================================================================
// append-heritage-verses — add the games' Heritage foundation verses to
// lib/scripture-kjv.js
// =============================================================================
// DR-0076 Verification Doctrine: Scripture is NEVER typed from memory. Same
// mechanics as append-way-up-verses.mjs: every verse is sourced VERBATIM from
// the in-repo, public-domain KJV that fetch-full-kjv.mjs materialized under
// app/public/bible/kjv/*.json, and appended to the games' verse store if not
// already present. No network. HARD-FAILS if any reference can't be resolved.
//
// These verses anchor lib/games/heritage.js — the real family photos Darrell
// declared as the games' foundational data (2026-07-07): the Turnkey days, the
// soldiers who covered him, and the family the covering carried.
//
// Run:  node scripts/append-heritage-verses.mjs
// Idempotent: re-running is a no-op once the refs are present.
// =============================================================================
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const KJV_DIR = join(ROOT, 'app/public/bible/kjv');
const STORE = join(ROOT, 'app/src/lib/scripture-kjv.js');

const REFS = [
  'Psalm 16:6',        // "...yea, I have a goodly heritage." — the collection's banner
  'Psalm 145:4',       // one generation shall praise Thy works to another
  'Psalm 127:1',       // except the LORD build the house — the torn-down place
  'Proverbs 13:22',    // a good man leaveth an inheritance to his children's children
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
    console.log('append-heritage-verses: OK — all references already present (no-op).');
    return;
  }

  const block = [
    '',
    '  // --- Appended 2026-07-08 for the games\' Heritage foundation (lib/games/heritage.js) ---',
    '  // Sourced VERBATIM from the in-repo public-domain KJV (app/public/bible/kjv/*.json,',
    '  // materialized by scripts/fetch-full-kjv.mjs), never typed from memory (DR-0076).',
    ...lines,
    '',
  ].join('\n');

  store = store.slice(0, closeIdx) + block + store.slice(closeIdx);
  writeFileSync(STORE, store);
  console.log(`append-heritage-verses: OK — added ${added} verbatim KJV verses to lib/scripture-kjv.js`);
}

main();
