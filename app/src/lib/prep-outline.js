// =============================================================================
// prep-outline — parse a teacher's PRE-SERVICE prep document into a clean,
// structured teaching outline: numbered POINTS + their SCRIPTURE references.
// =============================================================================
// THE AUTHORITATIVE SEED (Darrell 2026-07-02). Bishop Gwin emails Christina his
// own sermon prep document (a .docx) before each service — his numbered points
// and the scriptures under each. That document is GROUND TRUTH: his own words and
// structure, far cleaner than anything parsed from the noisy service transcript.
// This module turns that document's extracted text into the structured outline the
// message library ("The Word") and the Scripture surface read.
//
// WHY THIS IS DETERMINISTIC, NOT AN LLM (DR-0076 verification doctrine): BG's prep
// docs are ALREADY structured — numbered/roman point headers, scripture-reference
// lines with translation tags, lettered sub-points. A deterministic parser reads
// that structure exactly and is VERIFIABLE (unit-tested against his real formats).
// An LLM would add cost, latency, and a fabrication surface for zero gain here. If
// a future teacher's format is genuinely unstructured, an LLM assist can front this
// on the CUDA boxes — but the structured case (the one we have) stays deterministic.
//
// WHAT IT FIXES (the two current bugs, by construction):
//   1. Scripture refs no longer masquerade as teaching points. Points come ONLY
//      from real header lines ("1." / "I." + a title); scripture-reference lines go
//      to the scriptures list. A service that is a scripture READING with no points
//      (e.g. a Beatitudes study) yields points:[] + a real scripture list — honest.
//   2. Numbering increments. The header's own ordinal (arabic 1,2,3 OR roman
//      I,II,III normalized to 1,2,3) is the point number — never a broken "all 1.".
//
// HONESTY: every point is a real header BG wrote; every scripture literally appears
// in his document. Nothing is invented. Output is a best-effort DRAFT the church
// team edits (needs_review); an absent point/scripture stays an honest gap.
//
// Pure + dependency-free (safe in Node producer + browser + tests).
//
// CHANNEL-AGNOSTIC: no church/teacher specifics live here. The format this parses
// (numbered headers + book chapter:verse + translation tag) is the general shape of
// a teaching outline; another teacher's prep doc plugs in unchanged.
// =============================================================================

// --- Bible books, with the roman-numeral and no-space variants a prep doc uses ---
// BG writes "I Samuel" (roman) in one line and "1 Samuel" (arabic) in the next; the
// subject line uses a dot ("17.32-37") where the body uses a colon. We canonicalize
// every form to ONE spelling so the Scripture surface links them together.
const NUMBERED = {
  Samuel: 2, Kings: 2, Chronicles: 2, Corinthians: 2, Thessalonians: 2,
  Timothy: 2, Peter: 2, John: 3,
};
const SINGLE_BOOKS = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth',
  'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Psalm', 'Proverbs', 'Ecclesiastes',
  'Song of Solomon', 'Song of Songs', 'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel',
  'Daniel', 'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk',
  'Zephaniah', 'Haggai', 'Zechariah', 'Malachi', 'Matthew', 'Mark', 'Luke', 'John', 'Acts',
  'Romans', 'Galatians', 'Ephesians', 'Philippians', 'Colossians', 'Titus',
  'Philemon', 'Hebrews', 'James', 'Jude', 'Revelation',
];
const ROMAN_PREFIX = { I: 1, II: 2, III: 3 };

// Build { matchable-form -> canonical } and the alternation for the regex.
function buildBookMap() {
  const map = new Map();
  const forms = [];
  const add = (form, canon) => { const k = form.toLowerCase(); if (!map.has(k)) { map.set(k, canon); forms.push(form); } };
  for (const b of SINGLE_BOOKS) add(b, b);
  for (const [base, max] of Object.entries(NUMBERED)) {
    for (let n = 1; n <= max; n += 1) {
      const canon = `${n} ${base}`;
      add(`${n} ${base}`, canon);           // "1 Samuel"
      add(`${n}${base}`, canon);            // "1Samuel"
      const roman = Object.keys(ROMAN_PREFIX).find((r) => ROMAN_PREFIX[r] === n);
      if (roman) { add(`${roman} ${base}`, canon); add(`${roman}.${base}`, canon); } // "I Samuel"
    }
  }
  return { map, forms };
}
const { map: BOOK_CANON, forms: BOOK_FORMS } = buildBookMap();
// Longest form first so "Song of Solomon" beats "Song", "1 Samuel" beats a stray match.
const BOOK_ALT = [...BOOK_FORMS].sort((a, b) => b.length - a.length)
  .map((b) => b.replace(/[.\s]+/g, '[.\\s]+')).join('|');
// book  chap (:|.) verse [letter]  optional (- verse [letter]) — colon OR dot separator,
// tolerant of a verse-letter suffix ("17:37 B") and en-dash/hyphen ranges.
const REF_RE = new RegExp(
  `\\b(${BOOK_ALT})\\s+(\\d{1,3})\\s*[:.]\\s*(\\d{1,3})\\s*[A-D]?(?:\\s*[-–—]\\s*(\\d{1,3})\\s*[A-D]?)?`,
  'gi',
);

function canonBook(rawBook) {
  const key = rawBook.toLowerCase().replace(/[.\s]+/g, ' ').trim();
  if (BOOK_CANON.has(key)) return BOOK_CANON.get(key);
  const compact = key.replace(/\s+/g, '');
  if (BOOK_CANON.has(compact)) return BOOK_CANON.get(compact);
  return rawBook.replace(/[.\s]+/g, ' ').trim();
}

// Every scripture reference in a blob of text, canonicalized, range preserved.
// Order-preserving + de-duped. This is the BG-tuned matcher (roman books, dotted
// separators, verse letters, ranges) — kept LOCAL so the shared extractScriptureRefs
// and its pinned coverage guards are untouched.
export function extractRefs(text) {
  const out = [];
  const seen = new Set();
  const s = String(text || '');
  let m;
  REF_RE.lastIndex = 0;
  while ((m = REF_RE.exec(s)) !== null) {
    const book = canonBook(m[1]);
    const ref = m[4] ? `${book} ${m[2]}:${m[3]}-${m[4]}` : `${book} ${m[2]}:${m[3]}`;
    const key = ref.toLowerCase();
    if (!seen.has(key)) { seen.add(key); out.push(ref); }
  }
  return out;
}

// A line whose FIRST non-space content is a scripture reference — i.e. a citation
// line, not a teaching-point header. Used to keep a ref line from being mistaken
// for a point (belt-and-suspenders; headers are matched first anyway).
function startsWithRef(text) {
  const t = String(text || '').trim();
  if (!t) return false;
  const refs = extractRefs(t);
  if (!refs.length) return false;
  REF_RE.lastIndex = 0;
  const m = REF_RE.exec(t);
  return !!m && m.index <= 2;
}

// --- Header (point / sub-point) detection ------------------------------------
const ROMAN_VAL = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10, xi: 11, xii: 12 };
const ARABIC_HEAD = /^\s*(\d{1,2})[.)]\s+(\S.*)$/;
const ROMAN_HEAD = /^\s*([ivxIVX]{1,4})[.)]\s+(\S.*)$/;
const SUB_HEAD = /^\s*([A-H])[.)]\s+(\S.*)$/; // A-H: BG's lettered sub-points (never a roman point value)

function romanValue(s) { return ROMAN_VAL[String(s).toLowerCase()] || null; }

// The numeric value of a line IF it opens a point header (arabic "1." OR roman
// "I."), else null. BG mixes the two styles in one document (e.g. a roman "I." for
// point 1 then arabic "2." "3." for the rest), so we read the VALUE, not the style,
// and the caller accepts it only when it's the next expected number in sequence.
function headerValue(line) {
  const a = line.match(ARABIC_HEAD);
  if (a) return { val: +a[1], text: a[2] };
  const r = line.match(ROMAN_HEAD);
  if (r) { const v = romanValue(r[1]); if (v) return { val: v, text: r[2] }; }
  return null;
}

function tidy(s) {
  return String(s || '').replace(/\s+/g, ' ').replace(/[\s.:;,–—-]+$/, '').trim();
}

const BOILERPLATE = /^(praise god|blessings|thank you|please check|god bless|amen)\b/i;

// A short, title-ish line in the preamble that reads like the message theme
// (ALL-CAPS or Title Case, not verse prose, not boilerplate). Used only as a
// supplementary theme; the sermon's own title remains authoritative for display.
function themeCandidate(line) {
  const t = tidy(line);
  if (!t || t.length < 3 || t.length > 90) return false;
  if (BOILERPLATE.test(t) || /trivia|send your answer|info@/i.test(t)) return false;
  if (extractRefs(t).length) return false;
  const words = t.split(/\s+/);
  if (words.length > 12) return false;
  const isUpper = t === t.toUpperCase() && /[A-Z]/.test(t);
  const isTitle = words.filter((w) => /^[A-Z’']/.test(w)).length >= Math.ceil(words.length * 0.6);
  return isUpper || isTitle;
}

// =============================================================================
// parsePrepOutline — the one call. Returns a well-formed outline; never throws.
//   { theme, anchor, points: [{ n, text, subpoints:[{label,text,scriptures}], scriptures }],
//     scriptures: [refs], hasPoints, version }
//   - points:   BG's numbered outline, normalized to incrementing numbers.
//   - scriptures: every distinct ref in the document (preamble anchors first),
//                 the SCRIPTURE-surface feed — separate from the point text.
//   - anchor:   the primary text (first preamble reference), for the sermon's
//               scripture_ref field so the Scripture surface lights up.
// =============================================================================
export function parsePrepOutline(rawText, { subject = '' } = {}) {
  // BG's prep docs end with a "Trivia for/of the Day!" quiz that has its OWN
  // numbered questions ("1. What king...?"). Those are NOT teaching points — cut
  // the document at the trivia heading so the quiz never contaminates the outline
  // or the scripture feed. (The quiz has no scripture refs, so nothing real is lost.)
  const allLines = String(rawText || '').replace(/\r/g, '').split('\n');
  const triviaAt = allLines.findIndex((l) => /^\s*trivia\b/i.test(l));
  const lines = triviaAt >= 0 ? allLines.slice(0, triviaAt) : allLines;

  const points = [];
  const preambleRefs = [];
  const allRefs = [];
  let theme = '';
  let cur = null;   // current point
  let sub = null;   // current sub-point
  const pushRefs = (dest, refs) => { for (const r of refs) if (!dest.some((x) => x.toLowerCase() === r.toLowerCase())) dest.push(r); };

  for (const raw of lines) {
    const line = raw.replace(/\t/g, ' ').trim();
    if (!line) continue;

    // Point header? Accept an arabic OR roman numeral header only when its value
    // is the NEXT expected point number — this reads BG's mixed roman/arabic
    // numbering as one ascending outline and ignores any out-of-sequence stray.
    const head = headerValue(line);
    if (head && head.val === points.length + 1 && !startsWithRef(head.text)) {
      cur = { n: head.val, text: tidy(head.text), subpoints: [], scriptures: [] };
      // Any refs on the header line itself belong to the point.
      const inline = extractRefs(head.text);
      if (inline.length) { pushRefs(cur.scriptures, inline); pushRefs(allRefs, inline); }
      points.push(cur);
      sub = null;
      continue;
    }

    // Sub-point header (lettered A–H) under an open point?
    if (cur) {
      const sm = line.match(SUB_HEAD);
      if (sm && !startsWithRef(sm[2])) {
        sub = { label: sm[1], text: tidy(sm[2]), scriptures: [] };
        const inline = extractRefs(sm[2]);
        if (inline.length) { pushRefs(sub.scriptures, inline); pushRefs(allRefs, inline); }
        cur.subpoints.push(sub);
        continue;
      }
    }

    // Scripture reference line (may be prefixed with prose: "The Bible says in ...").
    const refs = extractRefs(line);
    if (refs.length) {
      const dest = sub ? sub.scriptures : (cur ? cur.scriptures : preambleRefs);
      pushRefs(dest, refs);
      pushRefs(allRefs, refs);
      continue;
    }

    // Plain prose. In the preamble it may be the theme line.
    if (!cur && !theme && themeCandidate(line)) theme = tidy(line);
  }

  // Theme fallback: derive from the subject (strip date / PROCLAIM / scripture / trailing speaker).
  if (!theme && subject) theme = themeFromSubject(subject);

  // Rolled-up scripture feed: preamble anchors first (his key text), then the refs
  // under each point/sub, de-duped in first-seen order.
  const scriptures = [];
  const seen = new Set();
  const addAll = (arr) => { for (const r of arr) { const k = r.toLowerCase(); if (!seen.has(k)) { seen.add(k); scriptures.push(r); } } };
  addAll(preambleRefs);
  for (const p of points) { addAll(p.scriptures); for (const s of p.subpoints) addAll(s.scriptures); }

  return {
    theme: theme || '',
    anchor: preambleRefs[0] || scriptures[0] || null,
    points,
    scriptures,
    hasPoints: points.length > 0,
    version: 'prep-outline:v1',
  };
}

// Best-effort theme from an email subject like
// "05-17-2026 - YOU WERE BUILT TO WIN - I SAMUEL 17.32-37 NIV! PROCLAIM".
export function themeFromSubject(subject) {
  let s = String(subject || '');
  s = s.replace(/\b\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}\b/g, ' ');   // date
  s = s.replace(/\bproclaim\b/ig, ' ').replace(/scriptures?\s+and\s+points/ig, ' ');
  s = s.replace(REF_RE, ' ');                                   // scripture ref
  s = s.replace(/\b(kjv|nkjv|niv|esv|amp|nlt|nasb|msg)\b/ig, ' ');
  const parts = s.split(/\s[-–—]\s|[-–—]{2,}/).map((p) => tidy(p)).filter(Boolean);
  // Pick the longest word-y segment (the theme), ignoring a trailing speaker credit.
  parts.sort((a, b) => b.length - a.length);
  return (parts[0] || tidy(s)).slice(0, 90);
}
