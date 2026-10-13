// =============================================================================
// Scripture provenance — where every quoted verse actually comes from
// =============================================================================
// Darrell, 2026-09-05: "Go re evaluate each lesson for the necessary information
// and make sure the corrections are made... according to the biblical scriptures
// and the Ways and documentation", then "ESV is Good and KJV...".
//
// WHAT THIS MEASURES, and the correction it forced. A first pass reported "811
// quotations matching neither in-repo translation", implying a large body of
// unlabelled ESV. That reading was wrong, and the instrument was wrong to
// produce it: two gaps in the audit, not in the lessons.
//   * It could not resolve ABBREVIATED book names ("Phil 3:12", "1 Sam 16:7"),
//     so 32 ordinary citations were reported as unresolvable.
//   * It did not separate a quotation that matches the cited verse EXCEPT for
//     the case of its opening letter — a writer lowercasing a verse's first word
//     to fit it mid-sentence. That turned out to be the dominant class.
//
// THE REAL, MEASURED PICTURE (re-derived on every run, never taken on trust):
//   kjv        — verbatim against the cited verse in the in-repo KJV.
//   kjv-case   — identical except for case somewhere inside. Still an alteration
//                of the text (the L126 sweep treats the same family as a real
//                defect), and each needs a person's eye, because a mid-quote
//                emphasis capital is not the same as an opening letter.
//   unverified — matches no edition this repository carries. NOT an accusation:
//                bible-editions.js is public-domain-only by design, so a
//                copyrighted translation (ESV among them) cannot be checked
//                here at all. The remedy is a translation label at the citation,
//                added by someone who can verify it against that text.
//
// 339 opening-letter cases were restored by scripts/fix-quote-case.mjs under a
// deliberately narrow rule: rewrite ONLY when flipping the FIRST character alone
// makes the quotation an exact substring of the cited verse. Nothing else was
// touched — DR-0210 forbids blind sweeps, and this is the opposite of one: it
// restores the text to what the verse says.
//
// PROVEN-TO-CATCH: each ratchet below was checked against a deliberately
// corrupted copy — a mangled quotation raises `unverified`, a lowercased verse
// opening raises `kjv-case`, and both fail this file.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SCANNED, auditSource, canonicalBook, ABBREV } from '../../../scripts/scripture-provenance-audit.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');

const rows = (() => {
  const out = [];
  for (const rel of SCANNED) {
    const path = join(ROOT, rel);
    if (!existsSync(path)) continue;
    out.push(...auditSource(readFileSync(path, 'utf8'), rel));
  }
  return out;
})();

const count = (verdict) => rows.filter((r) => r.verdict === verdict).length;

// The recorded state. These are CEILINGS: each may fall, never rise.
const CEILING = {
  // PAID DOWN 2026-09-06: 346 -> 9 -> 0. Every row was a letter-case-only
  // difference, so the fix was a case-only rewrite (same length, same
  // non-letter characters, nothing structural can break): 115 opening words,
  // ~230 emphasis capitals inside quotations ("thy faith hath made thee
  // WHOLE") and reverence capitals ("in Him") — the L127 defect class; quoted
  // Scripture stays exactly as fetched (CLAUDE.md, DR-0210 bright line).
  // THE LAST 9 WERE THE CORPUS'S OWN DEFECT, NOW CORRECTED: 8 quoted John
  // 20:28 as "My Lord and my God" where the in-repo KJV printed "My LORD" —
  // the aruljohn source mis-rendered the Name in 111 verses (LORD for Lord and
  // Lord for LORD; the case carries meaning: Yahweh vs Adonai). Verified
  // against a second public-domain KJV and the WEB's Yahweh/Lord as oracle,
  // corrected by manifest (scripts/kjv-name-case-corrections.*) and held by
  // kjv-corpus-name-case.test.js. The lessons were right; the corpus was not.
  'kjv-case': 0,
  // SPLIT 2026-09-06 (Darrell: "Agreed... attribution not unverified!!!").
  // The old single `unverified: 155` hid two different things behind one
  // number. Measuring them apart showed only 41 were ever OURS — and 29 of
  // THOSE were the instrument's: a JSON story body escapes its quotes as \",
  // and the audit did not unescape them, so a verbatim verse ended in a
  // backslash and was called drift. Instrument fixed, the rest authored:
  'kjv-drift': 0,    // OUR punctuation/whitespace/case drift from the KJV — paid down 2026-09-06
  attributed: 0,     // a quotation from an edition we cannot carry, still UNLABELLED — paid down 2026-09-06
};
// The two DECLARED classes are not ceilings. `esv-labelled` is a quotation
// that names its edition at the citation ("..." (James 1:4, ESV)) — honest
// attribution of a text this repository cannot verify, and it may grow.
// `paraphrase-declared` is our own wording that SAYS so ("..." (paraphrasing
// 1 Peter 5:7) / (cf. Ref) / (Ref, paraphrased)) — CLAUDE.md forbids a
// paraphrase that does not declare itself, and this is the declaration.

describe('the audit instrument itself is sound before its numbers are trusted', () => {
  it('resolves abbreviated book names, so an ordinary citation is not called broken', () => {
    expect(canonicalBook('Phil')).toBe('Philippians');
    expect(canonicalBook('1 Sam')).toBe('1Samuel');
    expect(canonicalBook('Ps')).toBe('Psalms');
    expect(canonicalBook('Psalm')).toBe('Psalms');
    expect(canonicalBook('Song')).toBe('SongofSolomon');
    expect(Object.keys(ABBREV).length).toBeGreaterThan(50);
  });

  it('every abbreviation maps to a book the corpus actually has', () => {
    const missing = Object.values(ABBREV).filter(
      (b) => !existsSync(join(ROOT, 'app/public/bible/kjv', `${b}.json`)),
    );
    expect(missing, `abbreviation maps to a book with no corpus file: ${missing.join(', ')}`).toEqual([]);
  });

  it('no citation in the scanned files is unresolvable', () => {
    const bad = rows.filter((r) => r.verdict === 'unresolvable-reference');
    expect(
      [...new Set(bad.map((r) => r.ref))],
      'a reference that points at no real book/chapter/verse is a citation error',
    ).toEqual([]);
  });

  it('is actually reading a large body of quotations, not silently matching none', () => {
    expect(rows.length).toBeGreaterThan(9300);
    expect(count('kjv')).toBeGreaterThan(8800);
  });

  it('sees TYPOGRAPHIC quote marks, not only straight ones', () => {
    // Found the hard way. Two lesson bodies authored with curly quotes went past
    // the matcher entirely, and widening it surfaced 77 quotations that had never
    // been audited at all — 16 more case alterations and 2 more unverified among
    // them. A quotation the instrument cannot see is a quotation with no gate on
    // it, so this is asserted rather than left to the next author's keyboard.
    const found = auditSource('x "For God hath not given us the spirit of fear" (2 Timothy 1:7) y', 'probe');
    const curly = auditSource('x \u201cFor God hath not given us the spirit of fear\u201d (2 Timothy 1:7) y', 'probe');
    expect(found.length, 'straight quotes must be seen').toBe(1);
    expect(curly.length, 'typographic quotes must be seen too').toBe(1);
    expect(curly[0].verdict).toBe('kjv');
  });
});

describe('the instrument sees what the file actually contains (each was a real miss, 2026-09-06)', () => {
  it('a JSON story body escapes its quotes as \\" — those are quotation marks, not backslashes', () => {
    const rows = auditSource('{"body":"He said \\"faith without works is dead\\" (James 2:26) and left."}', 'probe');
    expect(rows.length).toBe(1);
    expect(rows[0].verdict, '29 verbatim verses were called drift because of this').toBe('kjv');
  });

  it('a literal \\u2019 in the source IS an apostrophe', () => {
    const rows = auditSource('x "Bear ye one another\\u2019s burdens, and so fulfil the law of Christ" (Galatians 6:2) y', 'probe');
    expect(rows[0].verdict).toBe('kjv');
  });

  it('a //-wrapped comment line is one sentence, not two', () => {
    const rows = auditSource('  // the Body -- "whether one member\n  // suffer, all the members suffer with it" (1 Cor 12:26); more', 'probe');
    expect(rows.length).toBe(1);
    expect(rows[0].verdict).toBe('kjv');
  });

  it('an edition label at the citation is honoured — and cannot launder a false KJV claim', () => {
    const esv = auditSource('x "let steadfastness have its full effect, that you may be perfect" (James 1:4, ESV) y', 'probe');
    expect(esv[0].verdict).toBe('esv-labelled');
    const kjvOk = auditSource('x "But let patience have her perfect work" (James 1:4, KJV) y', 'probe');
    expect(kjvOk[0].verdict, 'a KJV label on a verbatim KJV quotation is simply kjv').toBe('kjv');
    const kjvLie = auditSource('x "let steadfastness have its full effect, that you may be perfect" (James 1:4, KJV) y', 'probe');
    expect(kjvLie[0].verdict, 'labelling ESV words "KJV" must NOT hide them').not.toBe('kjv');
    expect(['attributed', 'kjv-drift']).toContain(kjvLie[0].verdict);
  });

  it('a declared paraphrase is counted as one, in every declared form', () => {
    for (const form of [
      '"I cast this care on You, for You care for me" (paraphrasing 1 Peter 5:7)',
      '"strong, not skinny, that is the woman of valor" (cf. Proverbs 31:25)',
      '"I cast this care on You, for You care for me" (1 Peter 5:7, paraphrased)',
    ]) {
      const rows = auditSource(`x ${form} y`, 'probe');
      expect(rows.length, form).toBe(1);
      expect(rows[0].verdict, form).toBe('paraphrase-declared');
    }
    const undeclared = auditSource('x "I cast this care on You, for You care for me" (1 Peter 5:7) y', 'probe');
    expect(undeclared[0].verdict, 'the same words WITHOUT the declaration stay open').toBe('attributed');
  });
});

describe('the provenance ratchets — these numbers may fall, never rise', () => {
  it(`quotations differing from the cited verse by case only: at most ${CEILING['kjv-case']}`, () => {
    expect(
      count('kjv-case') + count('web-case'),
      'a NEW case alteration was introduced inside a quotation. Restore the verse’s own '
      + 'capitalisation, or start the quote a word later so no letter is changed.',
    ).toBeLessThanOrEqual(CEILING['kjv-case']);
  });

  it(`OUR OWN drift from the in-repo KJV: at most ${CEILING['kjv-drift']}`, () => {
    expect(
      count('kjv-drift'),
      'a NEW quotation matches no edition this repository carries. Either quote the KJV '
      + 'verbatim, or name the translation at the citation so the reader knows which text '
      + 'it is — an unlabelled non-KJV quotation is indistinguishable from a paraphrase.',
    ).toBeLessThanOrEqual(CEILING['kjv-drift']);
  });

  it(`quotations from an edition we cannot carry that are NOT yet labelled: at most ${CEILING.attributed}`, () => {
    // Not a defect count. A quotation whose words are not the KJV's is either
    // another edition's (label it: "..." (Ref, ESV)) or our own restatement
    // (declare it: "..." (paraphrasing Ref)). Either way the reader is told
    // which it is. What is NOT allowed is a third thing: a non-KJV quotation
    // that says nothing about where its words came from.
    expect(
      count('attributed'),
      'a NEW unlabelled non-KJV quotation appeared — name its edition at the citation '
      + '("..." (Ref, ESV)), or declare the paraphrase ("..." (paraphrasing Ref))',
    ).toBeLessThanOrEqual(CEILING.attributed);
  });

  it('the declared classes are real and counted, never hidden by the label', () => {
    expect(count('esv-labelled'), 'the ESV-labelled quotations must be SEEN, not skipped').toBeGreaterThan(10);
    expect(count('paraphrase-declared'), 'declared paraphrases must be SEEN, not skipped').toBeGreaterThan(10);
  });

  it('no case row remains — the corpus question that held the last 9 is closed (kjv-corpus-name-case.test.js)', () => {
    const remaining = rows.filter((r) => r.verdict === 'kjv-case' || r.verdict === 'web-case');
    expect(remaining.map((r) => `${r.ref} — ${r.quoted}`)).toEqual([]);
  });

  it('the ceilings are not stale — if the debt has been paid down, record it', () => {
    // A ceiling far above the real number hides progress and lets a regression
    // slip in under it. Keep them within ten of the truth.
    expect(
      CEILING['kjv-drift'] - count('kjv-drift'),
      'kjv-drift ceiling is stale — lower CEILING["kjv-drift"] to the current count',
    ).toBeLessThan(10);
    expect(
      CEILING['kjv-case'] - (count('kjv-case') + count('web-case')),
      'case ceiling is stale — lower CEILING["kjv-case"] to the current count',
    ).toBeLessThan(10);
  });
});

describe('the honest limit is stated, not papered over (DR-0076 §8)', () => {
  it('the audit names which editions it can and cannot check against', () => {
    const src = readFileSync(join(ROOT, 'scripts/scripture-provenance-audit.mjs'), 'utf8');
    expect(src, 'the public-domain-only constraint must be stated').toMatch(/PUBLIC-DOMAIN-ONLY/);
    expect(src, 'and what it means for a copyrighted translation').toMatch(/ESV is copyrighted/);
    expect(src, 'attribution must not be presented as fabrication').toMatch(/NOT an accusation/);
    expect(src, 'the two classes must stay named apart').toMatch(/kjv-drift/);
    expect(src, 'attribution is a licence boundary, not a defect').toMatch(/attributed/);
  });

  it('the new century spine carries no unverified quotation of its own', () => {
    const spine = rows.filter((r) => r.file.endsWith('yahweh-by-century.js'));
    expect(spine.length).toBeGreaterThan(0);
    expect(
      spine.filter((r) => r.verdict !== 'kjv').map((r) => r.ref),
      'the spine is generated from the corpus and must be 100% KJV-verbatim',
    ).toEqual([]);
  });
});

// =============================================================================
// THE CORPUS QUESTION, CLOSED THE SAME DAY. Found while paying down kjv-case:
// the in-repo KJV printed small-caps LORD in 29 NT verses where the KJV prints
// it in five (Psalm 110:1 quoted, and Revelation 19:16), and mis-cased the Name
// in dozens of OT verses. Settled with FETCHED witnesses, never memory: a second
// public-domain KJV and the WEB's Yahweh/Lord as the Tetragrammaton oracle.
// The full gate lives in kjv-corpus-name-case.test.js; this keeps the one pin
// the LESSONS depend on.
// =============================================================================
describe('the lessons quote John 20:28 as the KJV reads it, and the corpus now agrees', () => {
  it('"My Lord and my God" — in the lessons AND in the served corpus', () => {
    const lessons = readFileSync(join(ROOT, 'app/src/lib/living-lessons-class.js'), 'utf8');
    expect(lessons).not.toMatch(/My LORD and my God/);
    expect(lessons).toMatch(/My Lord and my God/);
    const john = JSON.parse(readFileSync(join(ROOT, 'app/public/bible/kjv/John.json'), 'utf8'));
    expect(john.chapters[19][27]).toBe('And Thomas answered and said unto him, My Lord and my God.');
  });
});
