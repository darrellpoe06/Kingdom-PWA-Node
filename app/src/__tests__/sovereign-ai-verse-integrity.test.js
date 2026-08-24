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

describe('sov9 postscript — the primary-source figures stay pinned (2026-08-24 verification pass)', () => {
  // Darrell: "research the same outside sources for comprehensive understanding."
  // These figures were read from / corroborated against the primary sources in
  // that session (DORA 2024+2025, METR trial + follow-up, Veracode 2025 report
  // accounts, GitClear research PDF, the 100x-provenance investigation). The
  // postscript may be reworded, but a changed NUMBER must be a deliberate
  // re-verification, never drift — so each is pinned here.
  it('carries the verified numbers, the honest provenance flag, and the fallen claim', () => {
    const p = sov9.lesson;
    for (const pin of [
      '7.2% DECREASE in delivery stability', '39.2%',            // DORA 2024
      'throughput has since flipped POSITIVE',                   // DORA 2025 nuance
      '246 real issues', '19% LONGER', '24% forecast',           // METR
      'early-2025 snapshot',                                     // METR's own caveat
      '45% of completions introduced an OWASP Top-10',           // Veracode
      'unreachable from this session',                           // honest provenance
      '0.45% (2022) to 6.66% (2024)', '24.8% to 9.5%',           // GitClear
      'no documented empirical study',                           // the 100x folklore
    ]) {
      expect(p).toContain(pin);
    }
  });
});
