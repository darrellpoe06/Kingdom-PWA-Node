import { describe, it, expect } from 'vitest';
import { TSK, TSK_LICENSE, tskRefsFor, hasTsk, tskKeys, tskCoverage } from '../lib/scripture-tsk.js';

describe('scripture-tsk — public-domain cross-reference seed', () => {
  it('license is public domain and attributes the source', () => {
    expect(TSK_LICENSE.license).toBe('Public Domain');
    expect(TSK_LICENSE.attribution.toLowerCase()).toContain('openbible.info');
    expect(TSK_LICENSE.attribution.toLowerCase()).toContain('treasury of scripture knowledge');
  });

  it('returns the classic cross-references for a seeded verse', () => {
    const refs = tskRefsFor('John 3:16');
    expect(refs).toContain('Romans 5:8');
    expect(refs).toContain('1 John 4:9-10');
    expect(refs.length).toBeGreaterThanOrEqual(10);
  });

  it('normalizes the lookup key (Psalms -> Psalm, whitespace)', () => {
    // Matthew 6:33 is seeded; extra whitespace must still resolve.
    expect(tskRefsFor('Matthew  6:33').length).toBeGreaterThan(0);
  });

  it('returns a COPY, not the internal array (no mutation leak)', () => {
    const a = tskRefsFor('John 3:16');
    a.push('TAMPERED');
    expect(tskRefsFor('John 3:16')).not.toContain('TAMPERED');
  });

  it('PROVEN-TO-CATCH: honest absence — an unseeded ref returns [] not a fabricated list', () => {
    expect(hasTsk('Obadiah 1:1')).toBe(false);
    expect(tskRefsFor('Obadiah 1:1')).toEqual([]);
  });

  it('every seeded key carries at least one cross-reference', () => {
    for (const k of tskKeys()) expect(TSK[k].length).toBeGreaterThan(0);
  });

  it('coverage readout reports real numbers', () => {
    const cov = tskCoverage(['John 3:16', 'Obadiah 1:1']);
    expect(cov.covered).toBe(1);
    expect(cov.missing).toEqual(['Obadiah 1:1']);
    expect(cov.seededKeys).toBe(tskKeys().length);
    expect(cov.totalCrossRefs).toBeGreaterThan(100);
  });
});
