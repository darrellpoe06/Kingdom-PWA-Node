// @vitest-environment node
// =============================================================================
// No NEW unbounded select('*') — the DR-0303 ratchet
// =============================================================================
// The 2026-08-14 lockout of all four apps was ONE query: `.select('*')` with no
// limit against `feedback`, a table that had grown base64 screenshot columns.
// 6.2 MB pulled on every sign-in, for every user, plus a full re-pull on every
// realtime insert — until the project hit its egress quota and Supabase 402'd
// every request for over a day.
//
// The class is not carelessness. A query written when a table was small stays
// written after the table grows a blob column, and the cost only appears as a
// bill. A bare `*` is a standing promise to transfer every column that table
// will ever have.
//
// This mirrors the repo's two existing ratchets (monolith-budget,
// lessons-gate-coverage): today's 36 call sites are grandfathered, a NEW one
// fails the build, and fixing an old one shrinks the baseline.
//
// PROVEN-TO-CATCH (DR-0076 §3): adding an unbounded select to app/src makes the
// guard exit 1 and name the file — verified against a probe file before this
// test was written.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findUnbounded } from '../../../scripts/unbounded-select-guard.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const BASELINE = join(HERE, '../../../scripts/unbounded-select-baseline.json');

describe('the unbounded-select ratchet', () => {
  it('has a real, frozen baseline', () => {
    expect(existsSync(BASELINE), 'the baseline file must exist or the ratchet is vacuous').toBe(true);
    const b = JSON.parse(readFileSync(BASELINE, 'utf8'));
    expect(Array.isArray(b)).toBe(true);
    expect(b.length, 'an empty baseline would mean the scanner found nothing — suspicious').toBeGreaterThan(0);
  });

  it('introduces no NEW unbounded select beyond the baseline', () => {
    const baseline = new Set(JSON.parse(readFileSync(BASELINE, 'utf8')));
    const keys = [...new Set(findUnbounded().map((h) => h.key))];
    const fresh = keys.filter((k) => !baseline.has(k));
    expect(fresh, `add .limit(...) or name the columns:\n${fresh.join('\n')}`).toEqual([]);
  });

  it('counts a query as BOUND when it limits, ranges, or takes a single row', () => {
    // The scanner must not flag a query that already has a predictable size,
    // or the ratchet becomes noise and gets ignored.
    const src = readFileSync(join(HERE, '../../../scripts/unbounded-select-guard.mjs'), 'utf8');
    expect(src).toMatch(/\\.limit\\\(\|\\\.range\\\(\|\\\.single\\\(\\\)\|\\\.maybeSingle\\\(\\\)/);
  });

  it('does not measure prose — comments are stripped before scanning', () => {
    // feedback-sync.js documents the old `.select('*')` in a comment; counting
    // that would be measuring prose as code, which has bitten twice this week.
    const src = readFileSync(join(HERE, '../../../scripts/unbounded-select-guard.mjs'), 'utf8');
    expect(src).toMatch(/function stripComments/);
    const keys = [...new Set(findUnbounded().map((h) => h.key))];
    expect(keys.some((k) => k.startsWith('app/src/lib/feedback-sync.js')),
      'feedback-sync is fixed — only its comment mentions the old query').toBe(false);
  });
});
