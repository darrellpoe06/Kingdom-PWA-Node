// =============================================================================
// THE IN-REPO KJV RENDERS THE NAME CORRECTLY — LORD (Yahweh) vs Lord (Adonai)
// =============================================================================
// Found 2026-09-06: the corpus fetched verbatim from aruljohn/Bible-kjv printed
// small-caps LORD where the KJV reads Lord and Lord where it reads LORD, in
// 111 verses — and the case CARRIES MEANING: LORD is the translators' rendering
// of the Tetragrammaton, Lord is Adonai, "Lord GOD" is Adonai Yahweh. "My LORD"
// at Genesis 18:3 named the wrong Person; "the Lord talked with Moses" at
// Exodus 33:9 hid the Name; the New Testament printed LORD in 29 verses where
// the KJV prints it in five (Old Testament quotations of the Name).
//
// The correction is case-only, manifest-driven and re-applicable
// (scripts/kjv-name-case-corrections.mjs + .json), and every verse in it has
// TWO witnesses: a second public-domain KJV, and — for the Old Testament — the
// public-domain WEB on disk, which prints "Yahweh" exactly where the Hebrew has
// the Name and "Lord" for Adonai. This gate keeps all of that TRUE on the
// corpus the app serves, so a re-ingest can never silently bring the defect
// back (DR-0076: a green check must mean something).
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const KJV = join(ROOT, 'app/public/bible/kjv');
const WEB = join(ROOT, 'app/public/bible/web');
const MANIFEST = JSON.parse(readFileSync(join(ROOT, 'scripts/kjv-name-case-corrections.json'), 'utf8'));

const OT = ['Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth', '1Samuel', '2Samuel',
  '1Kings', '2Kings', '1Chronicles', '2Chronicles', 'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
  'Ecclesiastes', 'SongofSolomon', 'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
  'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi'];
const NT = ['Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1Corinthians', '2Corinthians', 'Galatians',
  'Ephesians', 'Philippians', 'Colossians', '1Thessalonians', '2Thessalonians', '1Timothy', '2Timothy', 'Titus',
  'Philemon', 'Hebrews', 'James', '1Peter', '2Peter', '1John', '2John', '3John', 'Jude', 'Revelation'];

const book = (dir, b) => JSON.parse(readFileSync(join(dir, `${b}.json`), 'utf8')).chapters;
const verse = (b, c, v) => book(KJV, b)[c - 1][v - 1];

// The Name, as a sequence: Y = the Tetragrammaton (KJV LORD / GOD; WEB Yahweh), L = Adonai / kyrios (Lord).
const KM = { LORD: 'Y', GOD: 'Y', Lord: 'L', JEHOVAH: 'Y' };
const WM = { Yahweh: 'Y', Lord: 'L', LORD: 'Y', GOD: 'Y' };
const kseq = (t) => (t.match(/\b(LORD|GOD|Lord|JEHOVAH)\b/g) || []).map((x) => KM[x]).join('');
const wseq = (t) => (t.match(/\b(Yahweh|Lord|LORD|GOD)\b/g) || []).map((x) => WM[x]).join('');

// Where the WEB words a verse so differently that the sequences cannot be
// compared, the gate says nothing. Where they CAN be compared and still differ,
// both KJV witnesses side with the corpus (measured 2026-09-06) — these five,
// and ONLY these, are allowed. A new one is a defect; a vanished one is a stale
// list. Either way the list must tell the truth.
const WEB_PHRASES_DIFFERENTLY = ['Psalms 30:8', 'Psalms 90:17', 'Psalms 94:1', 'Isaiah 10:16', 'Isaiah 38:14'];

// The five NT verses where the KJV prints LORD: Psalm 110:1 quoted four times,
// and the title written on His vesture.
const NT_LORD = ['Matthew 22:44', 'Mark 12:36', 'Luke 20:42', 'Acts 2:34', 'Revelation 19:16'];

describe('the manifest of corrections is applied to the served corpus, and is case-only', () => {
  it('every correction is in place, and changed only letter case', () => {
    expect(MANIFEST.corrections.length).toBeGreaterThan(100);
    for (const c of MANIFEST.corrections) {
      const [b, cv] = c.ref.split(' ');
      const [ch, v] = cv.split(':').map(Number);
      expect(verse(b, ch, v), `${c.ref} must carry the corrected text`).toBe(c.after);
      expect(c.before).not.toBe(c.after);
      expect(c.before.toLowerCase(), `${c.ref}: a correction may change case, never words`).toBe(c.after.toLowerCase());
    }
  });

  it('the corrections it names are the ones the Name is about', () => {
    for (const c of MANIFEST.corrections) {
      expect(/\b(LORD|GOD|Lord|God)\b/.test(c.before) || /^A GOOD name/.test(c.before), c.ref).toBe(true);
    }
  });
});

describe('the New Testament prints LORD only where the KJV does', () => {
  it('exactly the five verses — Psalm 110:1 quoted, and the title on His vesture', () => {
    const found = [];
    for (const b of NT) {
      book(KJV, b).forEach((ch, ci) => ch.forEach((v, vi) => { if (/\bLORD\b/.test(v)) found.push(`${b} ${ci + 1}:${vi + 1}`); }));
    }
    expect(found).toEqual(NT_LORD);
  });

  it('the strays are gone: Thomas says "My Lord and my God"; the grace of "the Lord Jesus Christ"', () => {
    expect(verse('John', 20, 28)).toBe('And Thomas answered and said unto him, My Lord and my God.');
    expect(verse('Acts', 15, 11)).toMatch(/the grace of the Lord Jesus Christ/);
    expect(verse('Acts', 2, 34), 'Psalm 110:1 quoted keeps the Name').toMatch(/The LORD said unto my Lord/);
  });
});

describe('the Old Testament agrees with the WEB oracle on the Name, verse by verse', () => {
  it('Yahweh ↔ LORD/GOD and Lord ↔ Lord, wherever the two can be compared', () => {
    const disagreeing = [];
    let comparable = 0;
    for (const b of OT) {
      const k = book(KJV, b); const w = book(WEB, b);
      k.forEach((ch, ci) => ch.forEach((v, vi) => {
        const wv = (w[ci] || [])[vi];
        if (typeof wv !== 'string') return;
        const ks = kseq(v); const ws = wseq(wv);
        if (!ks || ks.length !== ws.length) return;
        comparable += 1;
        if (ks !== ws) disagreeing.push(`${b} ${ci + 1}:${vi + 1}`);
      }));
    }
    expect(comparable).toBeGreaterThan(5000);
    expect(disagreeing).toEqual(WEB_PHRASES_DIFFERENTLY);
  });

  it('the meaning-bearing cases read right: Abraham pleads with "the Lord"; "the LORD talked with Moses"; "Lord GOD"', () => {
    // Genesis 18:3 / 19:18 ("My Lord" / "my Lord" — Abraham and Lot addressing
    // the visitors) stay UNDECIDED: the two KJV witnesses differ and the WEB
    // renders them as "my lord", so it cannot arbitrate. They are listed in
    // the manifest as such and are not corrected.
    expect(verse('Genesis', 18, 30)).toMatch(/Oh let not the Lord be angry/);
    expect(verse('Exodus', 33, 9)).toMatch(/the LORD talked with Moses/);
    expect(verse('Genesis', 15, 2)).toMatch(/Lord GOD, what wilt thou give me/);
    expect(verse('Psalms', 3, 1)).toMatch(/^LORD, how are they increased/);
  });

  it('PROVEN-TO-CATCH — the pre-correction text of a corrected verse disagrees with the oracle', () => {
    const c = MANIFEST.corrections.find((x) => x.ref === 'Exodus 33:9');
    expect(c, 'Exodus 33:9 is in the manifest').toBeTruthy();
    const webVerse = book(WEB, 'Exodus')[32][8];
    expect(kseq(c.before)).not.toBe(wseq(webVerse));
    expect(kseq(c.after)).toBe(wseq(webVerse));
  });
});

describe("the adversary's names stay low in the corpus — Darrell's directive (#1397), not a defect", () => {
  it('Job 1:6 and Matthew 4:10 keep "satan" lowercase; no correction touches them', () => {
    expect(verse('Job', 1, 6)).toMatch(/and satan came also/);
    expect(verse('Matthew', 4, 10)).toMatch(/Get thee hence, satan/);
    expect(MANIFEST.corrections.some((c) => /satan|baal|belial|beelzebub|devil/i.test(c.before) && c.before.toLowerCase() !== c.after.toLowerCase())).toBe(false);
  });
});
