// @vitest-environment node
// =============================================================================
// Our voice spells it "color" — and the KJV is never touched
// =============================================================================
// Darrell 2026-09-20, reading a lesson on the television: "Never use colours...
// it looks bad from where I'm from looks like spelling errors.... fix it... its
// on the reader... spell it as color...." Then, narrowing it himself: "Let KJV
// be... just the text of the surface of the app and in the tts player..."
//
// THE NARROWING IS THE WHOLE POINT, and it is the reason this is a gate rather
// than a one-off edit. A scan of the repo found 1,954 British spellings in
// authored prose across 236 files — honour, neighbour, Saviour, labour — and
// sweeping all of them would have been exactly the move CLAUDE.md forbids: "a
// blind sweep of 471 authored prose strings... would corrupt good writing at
// scale to satisfy a counter." Most of those sit in Scripture-adjacent prose
// where the King James spelling is the point. So the COLOUR family — the word
// he actually named — is enforced at zero, and the rest is recorded below as
// measured debt with a date, not swept.
//
// AND THE BRIGHT LINE. The KJV is full of these words. "he made him a coat of
// many colours" is Genesis 37:3, verbatim, in this corpus four times. A
// find-and-replace would have rewritten Scripture to tidy our own prose — the
// same failure DR-0210 and DR-0530 each forbid in their own domain. The fix
// reads OUR PROSE ONLY: double-quoted spans are removed before scanning, the
// same register the reading-level and full-levels gates measure (DR-0332).

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve, extname } from 'node:path';
import { ourProse, matchCase, toAmerican, findBritish } from '../../../scripts/american-spelling.mjs';

const repoRoot = resolve(__dirname, '../../..');
const COLOUR = /\b(colour|colours|coloured|colouring|colourless|colourful|colourway)\b/gi;

const walk = (dir, out = []) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) { if (!/node_modules|dist/.test(p)) walk(p, out); }
    else if (['.js', '.jsx', '.css', '.html'].includes(extname(e.name))) out.push(p);
  }
  return out;
};

describe('the colour family is gone from our own voice', () => {
  it('no British colour spelling survives anywhere in app/src prose', () => {
    const offenders = [];
    for (const f of walk(join(repoRoot, 'app/src'))) {
      // THIS FILE IS EXEMPT, and only this one. A gate that forbids a word has
      // to contain that word to test for it — the alternative is assembling it
      // from fragments to sneak past our own check, which makes the gate
      // unreadable to defeat itself. Named explicitly so the exemption is one
      // file, not a pattern anyone can hide behind.
      if (f.endsWith('american-spelling.test.js')) continue;
      const prose = ourProse(readFileSync(f, 'utf8'));
      COLOUR.lastIndex = 0;
      const hits = prose.match(COLOUR);
      if (hits) offenders.push(`${f.replace(repoRoot + '/', '')}: ${[...new Set(hits)].join(', ')}`);
    }
    expect(offenders, `British colour spellings in our voice:\n${offenders.join('\n')}`).toEqual([]);
  });

  it('PROVEN-TO-CATCH: the same scan fires on a sentence that uses it', () => {
    expect(ourProse('every colour alike').match(COLOUR)).not.toBeNull();
  });
});

describe('the Word was not touched, and cannot be', () => {
  const corpus = readFileSync(join(repoRoot, 'app/src/lib/living-lessons-class.js'), 'utf8');

  it('Genesis 37:3 still reads "a coat of many colours", verbatim', () => {
    // The single most load-bearing assertion here. If a future sweep is less
    // careful than this one, this is what stops it reaching the reader.
    expect(corpus).toMatch(/a coat of many colours/);
    expect((corpus.match(/coat of many colours/g) || []).length).toBeGreaterThan(0);
  });

  it('the corrector splices around quotations by construction', () => {
    const line = 'He made him a "coat of many colours" (Genesis 37:3), and no colour ranks above another.';
    const fixed = toAmerican(line);
    expect(fixed, 'the quotation was rewritten').toContain('"coat of many colours"');
    expect(fixed, 'our own prose was left British').toContain('no color ranks above');
  });

  it('a quoted span is invisible to the scan, wherever it sits', () => {
    expect(findBritish('"many colours"')).toEqual([]);
    expect(findBritish('start "many colours" end')).toEqual([]);
    expect(findBritish('a colour "many colours" a colour')).toHaveLength(2);
  });

  it('quote-stripping preserves indices, so a report never points at the wrong place', () => {
    const src = 'ab "cd" ef';
    expect(ourProse(src)).toHaveLength(src.length);
    expect(ourProse(src)).toBe('ab      ef');
  });
});

describe('capitalisation survives the swap', () => {
  it('keeps sentence case, ALL CAPS and lower case', () => {
    expect(matchCase('Colour', 'color')).toBe('Color');
    expect(matchCase('COLOUR', 'color')).toBe('COLOR');
    expect(matchCase('colour', 'color')).toBe('color');
  });

  it('a one-letter word is not mistaken for ALL CAPS', () => {
    // 'I'.toUpperCase() === 'I', which would wrongly upper-case the whole word.
    expect(matchCase('A', 'a')).toBe('A');
  });
});

describe('what was NOT swept, recorded rather than hidden', () => {
  it('the wider -our debt is real, and is deliberately left standing', () => {
    // MEASURED 2026-09-20: 1,954 hits across 236 files, dominated by honour,
    // neighbour, labour and Saviour in Scripture-adjacent prose. Americanising
    // those is a judgement call per sentence — "Honour thy father" unquoted is
    // our rendering of a commandment, not a typo — so it is not swept by a
    // counter. The map exists for when someone works through it by hand.
    // re-review: 2026-10-20.
    const lib = readFileSync(join(repoRoot, 'scripts/american-spelling.mjs'), 'utf8');
    expect(lib).toMatch(/honour: 'honor'/);
    expect(lib).toMatch(/saviour: 'savior'/);
    expect(lib, 'the KJV bright line is no longer stated').toMatch(/never touches a quote|never quoted Scripture|Genesis 37:3/);
  });
});
