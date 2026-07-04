#!/usr/bin/env node
// =============================================================================
// fetch-cross-references — the WHOLE-Bible "unions" (OT <-> NT), hosted in-app
// =============================================================================
// Darrell 2026-07-04: "I love how the unions connect the old and new testament
// so I can see the patterns across all timelines." The openbible.info cross-
// reference set (derived from the public-domain Treasury of Scripture Knowledge)
// is ~344,799 links, community-vote-ranked. This script fetches it and writes
// per-book static assets under app/public/bible/xref/<File>.json so the reader
// lazy-loads a book's cross-references only when opened — sovereign, offline
// once cached, out of the JS bundle (same play as the full KJV).
//
// FORMAT: each from-book file is
//   { "book": "Genesis", "refs": { "1:1": [["Revelation 21:6", 45], ...], ... } }
// i.e. from chapter:verse -> [ [toDisplayRef, votes], ... ] sorted by votes desc,
// capped per verse. Display refs use the app's canonical book names.
//
// LICENSE: openbible.info cross-references are public domain / CC-BY (TSK-derived).
// Attribution lives in the in-app cross-reference panel.
//
// Run:  node scripts/fetch-cross-references.mjs
// =============================================================================
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'app/public/bible/xref');
const SRC = 'https://raw.githubusercontent.com/shandran/openbible/main/cross_references_expanded.csv';
const CAP_PER_VERSE = 40; // top-N cross-references per verse, by community votes

// OSIS-style abbreviation -> the app's canonical book name (matches bible-kjv-index).
const OSIS = {
  Gen: 'Genesis', Exod: 'Exodus', Lev: 'Leviticus', Num: 'Numbers', Deut: 'Deuteronomy',
  Josh: 'Joshua', Judg: 'Judges', Ruth: 'Ruth', '1Sam': '1 Samuel', '2Sam': '2 Samuel',
  '1Kgs': '1 Kings', '2Kgs': '2 Kings', '1Chr': '1 Chronicles', '2Chr': '2 Chronicles',
  Ezra: 'Ezra', Neh: 'Nehemiah', Esth: 'Esther', Job: 'Job', Ps: 'Psalms', Prov: 'Proverbs',
  Eccl: 'Ecclesiastes', Song: 'Song of Solomon', Isa: 'Isaiah', Jer: 'Jeremiah', Lam: 'Lamentations',
  Ezek: 'Ezekiel', Dan: 'Daniel', Hos: 'Hosea', Joel: 'Joel', Amos: 'Amos', Obad: 'Obadiah',
  Jonah: 'Jonah', Mic: 'Micah', Nah: 'Nahum', Hab: 'Habakkuk', Zeph: 'Zephaniah', Hag: 'Haggai',
  Zech: 'Zechariah', Mal: 'Malachi', Matt: 'Matthew', Mark: 'Mark', Luke: 'Luke', John: 'John',
  Acts: 'Acts', Rom: 'Romans', '1Cor': '1 Corinthians', '2Cor': '2 Corinthians', Gal: 'Galatians',
  Eph: 'Ephesians', Phil: 'Philippians', Col: 'Colossians', '1Thess': '1 Thessalonians',
  '2Thess': '2 Thessalonians', '1Tim': '1 Timothy', '2Tim': '2 Timothy', Titus: 'Titus',
  Phlm: 'Philemon', Heb: 'Hebrews', Jas: 'James', '1Pet': '1 Peter', '2Pet': '2 Peter',
  '1John': '1 John', '2John': '2 John', '3John': '3 John', Jude: 'Jude', Rev: 'Revelation',
};

const NAME_TO_FILE = (() => {
  const idx = JSON.parse(readFileSync(join(ROOT, 'app/src/lib/bible-kjv-index.json'), 'utf8'));
  const m = {};
  for (const b of idx) m[b.name] = b.file;
  return m;
})();

// "Gen.1.1" -> { name:'Genesis', chapter:1, verse:1 } (null if unmappable)
function parseOsis(token) {
  const m = String(token).split('.');
  if (m.length < 3) return null;
  const name = OSIS[m[0]];
  if (!name) return null;
  return { name, chapter: +m[1], verse: +m[2] };
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const res = await fetch(SRC, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for the cross-reference source`);
  const csv = await res.text();
  const lines = csv.split('\n');
  const header = lines[0];
  if (!/From Verse/.test(header)) throw new Error('unexpected CSV header — source format changed');

  // from-file -> { "ch:v": [ [toDisplayRef, votes], ... ] }
  const byBook = new Map();
  let linkCount = 0;
  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line) continue;
    const c = line.split(',');
    const from = parseOsis(c[0]);           // From Verse
    const toStart = parseOsis(c[6]);        // To Verse start
    if (!from || !toStart) continue;
    const votes = Number(c[2]) || 0;
    const endNum = c[7] ? String(c[7]).split('.').pop() : '';
    const toRef = endNum && +endNum !== toStart.verse
      ? `${toStart.name} ${toStart.chapter}:${toStart.verse}-${+endNum}`
      : `${toStart.name} ${toStart.chapter}:${toStart.verse}`;
    const file = NAME_TO_FILE[from.name];
    if (!file) continue;
    if (!byBook.has(file)) byBook.set(file, { book: from.name, refs: {} });
    const key = `${from.chapter}:${from.verse}`;
    const bucket = byBook.get(file).refs;
    (bucket[key] ||= []).push([toRef, votes]);
    linkCount += 1;
  }

  let kept = 0;
  const index = [];
  for (const [file, data] of byBook) {
    for (const key of Object.keys(data.refs)) {
      const sorted = data.refs[key].sort((a, b) => b[1] - a[1]).slice(0, CAP_PER_VERSE);
      data.refs[key] = sorted;
      kept += sorted.length;
    }
    writeFileSync(join(OUT_DIR, `${file}.json`), JSON.stringify(data));
    index.push({ file, book: data.book, verses: Object.keys(data.refs).length });
  }
  writeFileSync(join(OUT_DIR, 'index.json'), `${JSON.stringify(index, null, 0)}\n`);
  console.log(`fetch-cross-references: OK — ${linkCount} links parsed, ${kept} kept (cap ${CAP_PER_VERSE}/verse) across ${byBook.size} books -> app/public/bible/xref/`);
  if (byBook.size < 60) throw new Error(`only ${byBook.size} books got cross-references (expected ~66) — mapping problem`);
}

main().catch((e) => { console.error(`fetch-cross-references: FAILED — ${e.message}`); process.exit(1); });
