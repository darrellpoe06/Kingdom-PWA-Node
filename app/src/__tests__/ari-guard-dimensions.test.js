// The comprehensive-review standard, the guard that enforces it, and Layer 0's
// sentence about it must name the SAME dimensions (DR-0239; lesson-pipeline
// governance review, 2026-09-29). Measured that day: the standard carried ten,
// the ari-guard's REVIEW_DIMENSIONS nine (dimension 9, the hollow surface of
// DR-0381, was never added), and CLAUDE.md said "eight". A guard that counts
// fewer dimensions than the standard certifies a review the standard would
// fail. Proven to catch: drop the hollow-surface row, or put CLAUDE.md back to
// "eight", and this file fails.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { REVIEW_DIMENSIONS, comprehensiveReviewConformance } from '../lib/ari-integrity-guard.js';

const read = (rel) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8');
const STANDARD = read('../../../docs/00-foundations/_root/COMPREHENSIVE-REVIEW-STANDARD.md');
const LAYER0 = read('../../../CLAUDE.md');
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];

// The standard's own numbered dimensions: lines "N. **TITLE…".
// Read only the "## The … dimensions" section (the file also numbers the three
// miss classes that founded it, above that section).
function standardDimensions(text) {
  const start = text.search(/^## The [a-z]+ dimensions/m);
  const body = start === -1 ? '' : text.slice(start).split(/^## (?!The [a-z]+ dimensions)/m)[0];
  return body.split('\n').filter((l) => /^\d{1,2}\.\s+\*\*/.test(l)).map((l) => Number(l.match(/^(\d+)/)[1]));
}

describe('the comprehensive-review dimensions stay in step (DR-0239)', () => {
  it('reads the standard non-vacuously: dimensions numbered 1..N with no gap', () => {
    const nums = standardDimensions(STANDARD);
    expect(nums.length).toBeGreaterThanOrEqual(8);
    expect(nums).toEqual(nums.map((_, i) => i + 1));
  });

  it('the guard carries one entry per dimension the standard defines', () => {
    expect(REVIEW_DIMENSIONS.length).toBe(standardDimensions(STANDARD).length);
    expect(new Set(REVIEW_DIMENSIONS.map((d) => d.id)).size).toBe(REVIEW_DIMENSIONS.length);
  });

  it('the standard says in words the count it numbers', () => {
    const n = standardDimensions(STANDARD).length;
    expect(STANDARD).toMatch(new RegExp(`all \\*\\*${WORDS[n]}\\*\\* dimensions`));
  });

  it('Layer 0 (CLAUDE.md) names the same count as the standard', () => {
    const n = standardDimensions(STANDARD).length;
    expect(LAYER0).toMatch(new RegExp(`all ${WORDS[n]} dimensions of \`docs/00-foundations/_root/COMPREHENSIVE-REVIEW-STANDARD.md\``));
    expect(LAYER0).toMatch(new RegExp(`"Comprehensive" Is Defined — ${WORDS[n][0].toUpperCase()}${WORDS[n].slice(1)} Dimensions`));
  });

  it('dimension 9 (the hollow surface, DR-0381) is recognised when a review shows it', () => {
    const hollow = REVIEW_DIMENSIONS.find((d) => d.id === 'hollow-surface');
    expect(hollow).toBeTruthy();
    expect(hollow.re.test('the authored asset arrives on the real corpus')).toBe(true);
    expect(hollow.re.test('Fixed the header and pushed.')).toBe(false);
    const r = comprehensiveReviewConformance('Comprehensive review: hollow surface checked (DR-0381), journey walks run, SHOULD/ARE traced, surface-says-truth read.');
    expect(r.shown).toContain('hollow-surface');
  });
});
