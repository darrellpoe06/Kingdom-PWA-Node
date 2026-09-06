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
  'kjv-case': 348,   // identical but for case — each needs an eye, not a script
  // SPLIT 2026-09-06 (Darrell: "Agreed... attribution not unverified!!!").
  // The old single `unverified: 155` hid two different things behind one
  // number. Measuring them apart showed only 41 were ever OURS:
  'kjv-drift': 41,   // OUR punctuation/whitespace/case drift from the KJV — fixable by script
  attributed: 82,    // quoted from an edition we are not licensed to carry (ESV) — label it, never rewrite it
};

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

describe('the provenance ratchets — these numbers may fall, never rise', () => {
  it(`quotations differing from the cited verse by case only: at most ${CEILING['kjv-case']}`, () => {
    expect(
      count('kjv-case') + count('web-case'),
      'a NEW case alteration was introduced inside a quotation. Restore the verse’s own '
      + 'capitalisation, or start the quote a word later so no letter is changed.',
    ).toBeLessThanOrEqual(CEILING['kjv-case'] + 1);
  });

  it(`OUR OWN drift from the in-repo KJV: at most ${CEILING['kjv-drift']}`, () => {
    expect(
      count('kjv-drift'),
      'a NEW quotation matches no edition this repository carries. Either quote the KJV '
      + 'verbatim, or name the translation at the citation so the reader knows which text '
      + 'it is — an unlabelled non-KJV quotation is indistinguishable from a paraphrase.',
    ).toBeLessThanOrEqual(CEILING['kjv-drift']);
  });

  it(`quotations ATTRIBUTED to an edition we cannot carry: at most ${CEILING.attributed}`, () => {
    // This number is not a defect count and must never be read as one. It is
    // how many quotations come from a translation (ESV) that bible-editions.js
    // deliberately refuses to reproduce. It falls by LABELLING the citation,
    // never by rewriting someone else's translation into ours.
    expect(
      count('attributed'),
      'a NEW attributed quotation appeared — label its translation at the citation',
    ).toBeLessThanOrEqual(CEILING.attributed);
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
