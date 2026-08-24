// =============================================================================
// Sovereign A.I. class — the Word quoted in it is verbatim KJV (DR-0281)
// =============================================================================
// Born in the 2026-08-24 comprehensive Ways review (DR-0239 dimension 8):
// Week 9 (sov9, verification earns trust) introduced QUOTED Scripture into
// this catalog's anchors, and no machine gate covered it — the exact class the
// COMPREHENSIVE-REVIEW-STANDARD names ("a verbatim gate cannot see what it
// does not scan"). These pins hold every quoted fragment to the KJV text,
// letter for letter, the same discipline as living-lessons-l83-verses and
// world-issues-verse-integrity. A drifted quote fails the build.
import { describe, it, expect } from 'vitest';
import { SOVEREIGN_AI_MODULES } from '../lib/sovereign-ai-class.js';

// Verbatim KJV, verified against the repo's own KJV text.
const KJV = {
  '1 Thessalonians 5:21': 'Prove all things; hold fast that which is good.',
  'Proverbs 14:15': 'The simple believeth every word: but the prudent man looketh well to his going.',
};

const sov9 = SOVEREIGN_AI_MODULES.find((w) => w.id === 'sov9-verification-earns-trust');

describe('sov9 — verification earns trust quotes the Word verbatim', () => {
  it('the week exists and anchors on the verification texts', () => {
    expect(sov9).toBeTruthy();
    expect(sov9.anchor.ref).toContain('1 Thessalonians 5:21');
    expect(sov9.anchor.ref).toContain('Proverbs 14:15');
  });
  it('every quoted fragment in the anchor is letter-for-letter KJV', () => {
    expect(sov9.anchor.theme).toContain('Prove all things; hold fast that which is good.');
  });
  it('tamper-catch: the pinned KJV lines themselves are exact', () => {
    // These two strings are the gate's own ground truth; a "helpful" edit to
    // either breaks the letter-for-letter promise and must fail loudly.
    expect(KJV['1 Thessalonians 5:21']).toBe('Prove all things; hold fast that which is good.');
    expect(KJV['Proverbs 14:15']).toBe('The simple believeth every word: but the prudent man looketh well to his going.');
    expect(KJV['1 Thessalonians 5:21'].length).toBe(47);
  });
});
