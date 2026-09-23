// decision-chain — a decision record read as Concern → Evidence → Impact →
// Decision → Outcome (DR-0588). Three things are pinned: the mapper reads a
// record's OWN sections and never fills a missing step; the real ledger's
// debt is a measured, shrink-only baseline; and every record from DR-0588 on
// carries all five, so the chain Darrell asked for is enforced by machinery,
// not by memory.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { chainOf, chainCoverage, sectionsOf, reReviewOf, CHAIN_SLOTS } from '../lib/decision-chain.js';
import baseline from '../lib/decision-chain-baseline.json';

const DIR = join(__dirname, '..', '..', '..', 'docs', 'decisions');
const FIRST_RECORD_UNDER_THE_RULE = 588;

const FULL = `# DR-9001 — a record that answers all five
- **Status:** accepted
- **Date:** 2026-09-23

## Context
The site read stale for nine hours.

## What was measured
Deploy run 1 head_sha did not match main.

## Impact
The family and COLG saw an old build.

## Decision
Prove the deploy after every merge.

## Verification after merge
Run 2 matched main. re-review: 2026-10-01
`;

describe('chainOf — reads the five steps from the record\'s own sections', () => {
  it('maps a full record to all five slots, in the record\'s own words, and finds the re-review date', () => {
    const c = chainOf(FULL);
    expect(c.complete).toBe(true);
    expect(c.missing).toEqual([]);
    expect(c.concern.text).toBe('The site read stale for nine hours.');
    expect(c.evidence.heading).toBe('What was measured');
    expect(c.impact.text).toMatch(/old build/);
    expect(c.decision.text).toMatch(/Prove the deploy/);
    expect(c.outcome.heading).toBe('Verification after merge');
    expect(c.reReview).toBe('2026-10-01');
  });

  it('PROVEN-TO-CATCH: a missing step is named missing, never filled from another step', () => {
    const noEvidence = FULL.replace(/## What was measured[\s\S]*?\n\n/, '');
    const c = chainOf(noEvidence);
    expect(c.complete).toBe(false);
    expect(c.missing).toEqual(['evidence']);
    expect(c.evidence).toBeNull();
    // The other slots are untouched — nothing was borrowed to fill the gap.
    expect(c.concern.text).toBe('The site read stale for nine hours.');
    expect(c.decision.text).toMatch(/Prove the deploy/);
  });

  it('reads the list-style header: a "Grounds:" bullet is the concern when no concern section exists, and "Directive" is the decision when nothing else is', () => {
    const listStyle = `# DR-9002 — list style
- **Grounds:** nas-health run 1; Darrell 2026-09-23 "why not?"

## What was measured
Three policies.

## Consequences
Parity cannot say GO.

## Directive
Drop them.

## Proven-to-catch
The guard names them.
`;
    const c = chainOf(listStyle);
    expect(c.complete).toBe(true);
    expect(c.concern.heading).toBe('Grounds');
    expect(c.concern.text).toMatch(/nas-health run 1/);
    expect(c.decision.heading).toBe('Directive');
  });

  it('with a separate decision section, "Directive" becomes the concern instead', () => {
    const both = `## Directive\nDarrell said build it.\n\n## Decision\nWe build it.\n`;
    const c = chainOf(both);
    expect(c.decision.text).toBe('We build it.');
    expect(c.concern.text).toBe('Darrell said build it.');
  });

  it('withText:false keeps the shape (which steps exist) and drops the words', () => {
    const c = chainOf(FULL, { withText: false });
    expect(c.complete).toBe(true);
    expect(c.concern).toEqual({ heading: 'Context' });
    expect(c.evidence.text).toBeUndefined();
  });

  it('bounds each slot to max and keeps bullets and newlines', () => {
    const long = `## Decision\n- one\n- two\n${'x'.repeat(2000)}\n`;
    const c = chainOf(long, { max: 100 });
    expect(c.decision.text.length).toBe(100);
    expect(c.decision.text.startsWith('- one\n- two')).toBe(true);
  });

  it('sectionsOf and reReviewOf are plain and total', () => {
    expect(sectionsOf('')).toEqual([]);
    expect(sectionsOf('## A\nx\n### B\ny\n').map((s) => [s.heading, s.level, s.body])).toEqual([['A', 2, 'x'], ['B', 3, 'y']]);
    expect(reReviewOf('re-review: 2026-09-30 and later `re-review: 2026-10-14`')).toBe('2026-10-14');
    expect(reReviewOf('none')).toBe('');
    expect(chainOf(null).missing).toEqual(CHAIN_SLOTS);
  });

  it('chainCoverage counts what it is given, never estimates', () => {
    const cov = chainCoverage([{ chain: chainOf(FULL) }, { chain: chainOf('## Decision\nx\n') }, { chain: null }]);
    expect(cov).toEqual({ total: 3, complete: 1, incomplete: 2, missingBySlot: { concern: 2, evidence: 2, impact: 2, decision: 1, outcome: 2 } });
  });
});

describe('the real ledger — measured debt, shrink-only, and the rule for new records', () => {
  const files = readdirSync(DIR).filter((f) => /^DR-\d{4}-.+\.md$/.test(f)).sort();
  const items = files.map((f) => ({ id: f.slice(0, 7), num: parseInt(f.slice(3, 7), 10), chain: chainOf(readFileSync(join(DIR, f), 'utf8'), { withText: false }) }));
  const cov = chainCoverage(items);

  it('the walk covers the real ledger', () => {
    expect(items.length).toBeGreaterThan(500);
  });

  it('the committed baseline is the REAL debt at the moment it was measured (re-measure deliberately, never by hand)', () => {
    const older = items.filter((i) => i.num < FIRST_RECORD_UNDER_THE_RULE);
    const oc = chainCoverage(older);
    expect(oc.total, 'record count before the rule moved — re-measure the baseline').toBe(baseline.measuredRecords);
    expect(oc.incomplete, 'incomplete count moved — re-measure the baseline').toBeLessThanOrEqual(baseline.incomplete);
    for (const k of CHAIN_SLOTS) {
      expect(oc.missingBySlot[k], `records missing ${k} grew — a record lost a step`).toBeLessThanOrEqual(baseline.missingBySlot[k]);
    }
  });

  it('the ratchet turns one way: no record that carried a step may lose it', () => {
    const older = items.filter((i) => i.num < FIRST_RECORD_UNDER_THE_RULE);
    expect(chainCoverage(older).incomplete).toBeLessThanOrEqual(baseline.incomplete);
  });

  it(`every record from DR-${String(FIRST_RECORD_UNDER_THE_RULE).padStart(4, '0')} on carries all five steps`, () => {
    const ruled = items.filter((i) => i.num >= FIRST_RECORD_UNDER_THE_RULE);
    expect(ruled.length).toBeGreaterThanOrEqual(1);
    const bad = ruled.filter((i) => !i.chain.complete).map((i) => `${i.id} missing ${i.chain.missing.join(', ')}`);
    expect(bad, 'a new decision record does not answer all five: add the missing heading(s) — Context / What was measured / Impact / Decision / Verification').toEqual([]);
  });

  it('the coverage read the app shows is the same measurement', () => {
    expect(cov.total).toBe(items.length);
    expect(cov.complete + cov.incomplete).toBe(cov.total);
  });
});
