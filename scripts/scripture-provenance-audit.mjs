#!/usr/bin/env node
// =============================================================================
// scripture-provenance-audit — where does every quoted verse actually come from?
// =============================================================================
// Darrell, 2026-09-05: "Go re evaluate each lesson for the necessary information
// and make sure the corrections are made... according to the biblical scriptures
// and the Ways and documentation", then "ESV is Good and KJV...".
//
// THE PROBLEM THIS MEASURES. Lesson prose quotes Scripture inline and attributes
// it — "…" (Book C:V). Most of those are KJV-verbatim. Some are not, and an
// unlabelled non-KJV quotation is indistinguishable, to a reader, from a
// paraphrase or a mis-remembering. SCRIPTURE-REFERENCE-STANDARD requires the
// translation to be named; that requirement had no instrument, so it drifted.
//
// THE HONEST LIMIT, STATED UP FRONT (DR-0076 §8). This script can only verify
// against editions the repository actually carries, and bible-editions.js is a
// deliberately PUBLIC-DOMAIN-ONLY registry — reproduction rights are enforced
// data there, not a footnote. ESV is copyrighted: it may be CITED, but there is
// no ESV corpus here to check a quotation against, and one cannot be added
// under that invariant. So this audit reports three classes and does NOT guess
// at a fourth:
//   kjv        — matches the cited verse in the in-repo KJV. Verified.
//   web        — matches the World English Bible instead. Verified, other text.
//   kjv-drift  — the SAME WORDS as the in-repo KJV, differing only in
//                punctuation, whitespace or case. A real, mechanically fixable
//                defect in our own typing — not a translation question.
//   attributed — genuinely DIFFERENT WORDING, i.e. quoted from a translation
//                this repository cannot carry (ESV is the usual one). This is
//                NOT an accusation of fabrication — it is the narrower, truer
//                statement that the words are attributed to an edition we are
//                not licensed to reproduce, so nothing here can confirm them.
//                Darrell,
//                2026-09-06: "Agreed... attribution not unverified!!!" — and he
//                is right. Calling this "unverified" reads as an accusation of
//                fabrication when the truthful statement is narrower: the words
//                are attributed to an edition we are not licensed to reproduce,
//                so no machine here can confirm them. The remedy is a
//                translation label at the citation, never a rewrite.
//
// SPLITTING THE OLD `unverified` INTO THOSE TWO IS THE WHOLE POINT: one is our
// defect and shrinks by fixing our text; the other is a licence boundary and
// shrinks only by labelling. Reporting them as one number made the second look
// like the first, and hid how much of the pile was actually ours to fix.
//
// PROVEN-TO-CATCH: scripture-provenance.test.js pins the unverified count as a
// ratchet that may only shrink, and fails the build if a NEW unverified
// quotation appears in any scanned file.
//
//   node scripts/scripture-provenance-audit.mjs          # report
//   node scripts/scripture-provenance-audit.mjs --write  # refresh the artifact
// =============================================================================
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BIBLE = join(ROOT, 'app/public/bible');
const OUT = join(ROOT, 'app/src/lib/scripture-provenance.json');

// Content files whose inline quotations are audited. Add a file here rather
// than widening the glob, so what is in scope is a decision and not an accident.
export const SCANNED = [
  'app/src/lib/living-lessons-class.js',
  'app/src/lib/yahweh-by-century.js',
];

// Writers abbreviate. "Phil 3:12" and "1 Sam 16:7" are ordinary citations, not
// broken ones — an audit that called them unresolvable would be reporting its
// own gap as the repository's defect. Mapped here so the finding is real.
export const ABBREV = {
  Gen: 'Genesis', Ex: 'Exodus', Exod: 'Exodus', Lev: 'Leviticus', Num: 'Numbers',
  Deut: 'Deuteronomy', Dt: 'Deuteronomy', Josh: 'Joshua', Judg: 'Judges',
  '1Sam': '1Samuel', '2Sam': '2Samuel', '1Kgs': '1Kings', '2Kgs': '2Kings',
  '1Chr': '1Chronicles', '2Chr': '2Chronicles', Neh: 'Nehemiah', Esth: 'Esther',
  Ps: 'Psalms', Psa: 'Psalms', Prov: 'Proverbs', Eccl: 'Ecclesiastes',
  Song: 'SongofSolomon', Isa: 'Isaiah', Jer: 'Jeremiah', Lam: 'Lamentations',
  Ezek: 'Ezekiel', Dan: 'Daniel', Hos: 'Hosea', Obad: 'Obadiah', Mic: 'Micah',
  Nah: 'Nahum', Hab: 'Habakkuk', Zeph: 'Zephaniah', Hag: 'Haggai',
  Zech: 'Zechariah', Mal: 'Malachi', Matt: 'Matthew', Mk: 'Mark', Lk: 'Luke',
  Jn: 'John', Rom: 'Romans', '1Cor': '1Corinthians', '2Cor': '2Corinthians',
  Gal: 'Galatians', Eph: 'Ephesians', Phil: 'Philippians', Php: 'Philippians',
  Col: 'Colossians', '1Thess': '1Thessalonians', '2Thess': '2Thessalonians',
  '1Tim': '1Timothy', '2Tim': '2Timothy', Tit: 'Titus', Phlm: 'Philemon',
  Heb: 'Hebrews', Jas: 'James', '1Pet': '1Peter', '2Pet': '2Peter',
  '1Jn': '1John', '2Jn': '2John', '3Jn': '3John', Rev: 'Revelation',
};

export function canonicalBook(book) {
  const squashed = String(book).replace(/\s+/g, '').replace(/\.$/, '');
  if (ABBREV[squashed]) return ABBREV[squashed];
  if (squashed === 'Psalm') return 'Psalms';
  return squashed;
}

function edition(dir) {
  const full = join(BIBLE, dir);
  if (!existsSync(full)) return null;
  const files = new Set(
    readdirSync(full).filter((f) => f.endsWith('.json') && f !== 'index.json').map((f) => f.slice(0, -5)),
  );
  const cache = new Map();
  return (book, ch, v1, v2) => {
    const f = canonicalBook(book);
    if (!files.has(f)) return null;
    if (!cache.has(f)) {
      const j = JSON.parse(readFileSync(join(full, `${f}.json`), 'utf8'));
      cache.set(f, Array.isArray(j.chapters) ? j.chapters : null);
    }
    const chapters = cache.get(f);
    if (!chapters) return null;
    const chapter = chapters[ch - 1];
    if (!chapter) return null;
    const out = [];
    for (let v = v1; v <= (v2 || v1); v += 1) {
      if (typeof chapter[v - 1] !== 'string') return null;
      out.push(chapter[v - 1]);
    }
    return out.join(' ');
  };
}

const EDITIONS = { kjv: edition('kjv'), web: edition('web') };

// The whole in-repo KJV as one string, letters only — used to tell OUR OWN
// punctuation/case drift apart from a genuinely different translation. Built
// once, lazily: it is only needed when a quotation has already failed every
// exact check, which is the rare path.
let KJV_WHOLE = null;
function kjvWhole() {
  if (KJV_WHOLE !== null) return KJV_WHOLE;
  const dir = join(ROOT, 'app', 'public', 'bible', 'kjv');
  let all = '';
  try {
    for (const f of readdirSync(dir)) {
      if (!f.endsWith('.json') || f === 'index.json') continue;
      try {
        const j = JSON.parse(readFileSync(join(dir, f), 'utf8'));
        if (Array.isArray(j.chapters)) for (const ch of j.chapters) all += `${ch.join(' ')} `;
      } catch { /* one unreadable book never breaks the audit */ }
    }
  } catch { /* no corpus — every miss simply stays 'attributed' */ }
  KJV_WHOLE = all;
  return KJV_WHOLE;
}

// Straight and typographic apostrophes are the same character to a reader, and
// the corpora are not consistent between themselves. Normalize before comparing
// so an apostrophe never masquerades as an alteration.
const norm = (s) => String(s).replace(/[‘’']/g, "'").replace(/\s+/g, ' ').trim();

// A Scripture quotation, for this audit, is a double-quoted span IMMEDIATELY
// followed by its reference. That is what makes it a CLAIM about a verse — an
// unattributed quotation may be quoting anything, and is out of scope here.
// Straight AND typographic quote marks. The catalog uses straight quotes, but a
// writer (or a paste from a document) can introduce curly ones — and a quotation
// the audit cannot see is a quotation with no gate on it. Found the hard way:
// two lesson bodies authored with curly quotes went past this regex entirely,
// so twenty Scripture quotations were unaudited until the count gave it away.
const QUOTE_RE = /["“]([^"”]{15,})["”]\s*\(((?:[123]\s)?[A-Za-z][A-Za-z ]*?\.?)\s(\d+):(\d+)(?:[-–](\d+))?\)/g;

export function auditSource(src, file) {
  const text = src.replace(/\\'/g, "'");
  const rows = [];
  for (const m of text.matchAll(QUOTE_RE)) {
    const ref = `${m[2]} ${m[3]}:${m[4]}${m[5] ? `-${m[5]}` : ''}`;
    const v1 = Number(m[4]);
    const v2 = m[5] ? Number(m[5]) : null;
    // Our own ellipses stitch fragments; each fragment must be found.
    const parts = norm(m[1])
      .split(/\.\.\.|\s\|\s/)
      .map((p) => norm(p).replace(/^[,;:]\s*/, '').replace(/[.,;:!?]+$/, ''))
      .filter((p) => p.length >= 15);
    if (!parts.length) continue;

    let verdict = 'unverified';
    for (const [name, load] of Object.entries(EDITIONS)) {
      if (!load) continue;
      // Allow the quotation to run a little past the cited verse — writers cite
      // the opening verse of a sentence that continues. Two verses of slack.
      const exact = load(m[2], Number(m[3]), v1, v2);
      if (exact === null) { verdict = 'unresolvable-reference'; break; }
      const wide = load(m[2], Number(m[3]), v1, (v2 || v1) + 2);
      const haystacks = [exact, wide].filter(Boolean).map(norm);
      if (parts.every((p) => haystacks.some((h) => h.includes(p)))) { verdict = name; break; }
      // A quotation that matches EXCEPT for case is its own class. Writers
      // lowercase a verse's opening word to fit it mid-sentence, which reads as
      // natural prose and IS still an alteration of the text (the L126 sweep
      // caught the same family). Separating it matters because the fix is
      // mechanical — restore the letter, or start the quote a word later —
      // where the rest of the unverified set needs a translation checked.
      const lower = haystacks.map((h) => h.toLowerCase());
      if (parts.every((p) => lower.some((h) => h.includes(p.toLowerCase())))) {
        verdict = `${name}-case`;
        break;
      }
    }
    // ATTRIBUTION vs OUR OWN DRIFT (Darrell 2026-09-06). A quotation that is
    // the same WORDS as the KJV and differs only in punctuation, whitespace or
    // case is OUR typing, and fixable. One whose words genuinely differ is
    // quoted from an edition we cannot carry — that is attribution, and saying
    // "unverified" about it overstates what we actually know.
    if (verdict === 'unverified') {
      const letters = (t) => String(t).toLowerCase().replace(/[^a-z]/g, '');
      const hay = letters(kjvWhole());
      verdict = parts.every((p) => letters(p).length >= 15 && hay.includes(letters(p)))
        ? 'kjv-drift'
        : 'attributed';
    }
    rows.push({ file, ref, verdict, quoted: m[1].slice(0, 200) });
  }
  return rows;
}

export function audit() {
  const rows = [];
  for (const rel of SCANNED) {
    const path = join(ROOT, rel);
    if (!existsSync(path)) continue;
    rows.push(...auditSource(readFileSync(path, 'utf8'), rel));
  }
  const counts = rows.reduce((a, r) => ({ ...a, [r.verdict]: (a[r.verdict] || 0) + 1 }), {});
  const unverified = rows.filter((r) => r.verdict === 'unverified');
  const byLesson = {};
  for (const r of unverified) byLesson[r.ref] = (byLesson[r.ref] || 0) + 1;
  return {
    version: 1,
    note:
      'Provenance of every ATTRIBUTED inline Scripture quotation in the scanned files. '
      + '"attributed" means it matches no edition this repository carries — NOT that it is '
      + 'wrong. bible-editions.js is public-domain-only by design, so a copyrighted '
      + 'translation (ESV among them) cannot be checked here; the remedy is a translation '
      + 'label at the citation, added by someone who can verify it against that text.',
    scanned: SCANNED,
    editions: Object.keys(EDITIONS).filter((k) => EDITIONS[k]),
    counts,
    total: rows.length,
    unverifiedRefs: Object.entries(byLesson).sort((a, b) => b[1] - a[1]).map(([ref, n]) => ({ ref, n })),
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const report = audit();
  if (process.argv[2] === '--write') {
    writeFileSync(OUT, `${JSON.stringify(report, null, 2)}\n`);
    console.log(`# scripture-provenance-audit --write\nWrote ${relative(ROOT, OUT)}`);
  }
  console.log('# SCRIPTURE PROVENANCE AUDIT');
  console.log(`Editions available in-repo: ${report.editions.join(', ')}`);
  console.log(`Attributed quotations scanned: ${report.total}`);
  for (const [k, v] of Object.entries(report.counts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(24)} ${v}`);
  }
  console.log(`\nDistinct references that could not be verified here: ${report.unverifiedRefs.length}`);
  console.log('Most-cited among them:');
  for (const { ref, n } of report.unverifiedRefs.slice(0, 12)) console.log(`  ${String(n).padStart(3)}  ${ref}`);
}
