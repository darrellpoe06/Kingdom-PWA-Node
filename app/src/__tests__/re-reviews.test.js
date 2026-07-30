// Proven-to-catch tests for the re-review backlog extractor + sorter
// (lib/re-reviews.js). The backlog is only trustworthy if (a) it finds every
// real `re-review <date>` and no phantom ones, (b) urgency is computed correctly
// against a fixed clock, and (c) the sort is stable + soonest-first by default.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  extractReReviews, sortReReviews, reReviewStatus, reReviewSummary,
} from '../lib/re-reviews.js';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
// A fixed "now" so due/overdue is deterministic (never reads the clock).
const NOW = Date.parse('2026-07-06T00:00:00Z');

describe('extractReReviews — real dates only, nothing painted', () => {
  it('pulls every re-review date out of a review finding', () => {
    const reviews = { items: [{
      id: 'REV-0008', title: 'Harvest', type: 'ui-ux', status: 'logged',
      findings: 'do X (re-review 2026-07-13); do Y (re-review 2026-09-01)',
      source: 'docs/reviews/REVIEWS.md',
    }] };
    const out = extractReReviews({ reviews }, NOW);
    expect(out.map((i) => i.date).sort()).toEqual(['2026-07-13', '2026-09-01']);
    expect(out.every((i) => i.origin === 'review' && i.sourceId === 'REV-0008')).toBe(true);
  });

  it('pulls re-review dates from the DR ledger body too', () => {
    const decisions = { items: [{
      id: 'DR-0105', title: 'Evaluate model', status: 'proposed',
      decision: 'ship inactive. re-review: 2026-10-05',
    }] };
    const out = extractReReviews({ decisions }, NOW);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ date: '2026-10-05', type: 'decision', source: 'DR DR-0105' });
  });

  it('de-dups an exact (source,date) repeat but keeps two distinct dates', () => {
    const reviews = { items: [{ id: 'REV-1', findings: 're-review 2026-08-01 ... re-review 2026-08-01 ... re-review 2026-09-01' }] };
    const out = extractReReviews({ reviews }, NOW);
    expect(out.map((i) => i.date)).toEqual(['2026-08-01', '2026-09-01']);
  });

  it('invents nothing when there is no date (honest empty)', () => {
    const reviews = { items: [{ id: 'REV-2', findings: 'no dated commitment here' }] };
    expect(extractReReviews({ reviews }, NOW)).toEqual([]);
    expect(extractReReviews({}, NOW)).toEqual([]);
    expect(extractReReviews(undefined, NOW)).toEqual([]);
  });

  it('computes overdue / due-soon / future against the fixed clock', () => {
    const reviews = { items: [{ id: 'R', findings: 're-review 2026-06-01 · re-review 2026-07-10 · re-review 2026-12-01' }] };
    const byDate = Object.fromEntries(extractReReviews({ reviews }, NOW).map((i) => [i.date, i]));
    expect(byDate['2026-06-01'].overdue).toBe(true);      // 35 days past
    expect(byDate['2026-07-10'].dueSoon).toBe(true);       // 4 days out
    expect(byDate['2026-07-10'].overdue).toBe(false);
    expect(byDate['2026-12-01'].dueSoon).toBe(false);      // far future
    expect(byDate['2026-12-01'].overdue).toBe(false);
  });
});

describe('reReviewStatus — urgency maps to a valid KPI status', () => {
  it('overdue → problem, soon → attention, later → idle', () => {
    expect(reReviewStatus({ overdue: true, dueInDays: -5 }).status).toBe('problem');
    expect(reReviewStatus({ dueSoon: true, dueInDays: 3 }).status).toBe('attention');
    expect(reReviewStatus({ dueInDays: 40 }).status).toBe('idle');
    expect(reReviewStatus({ dueInDays: null }).status).toBe('idle');
  });
});

describe('sortReReviews — stable, soonest-first, nulls sink', () => {
  const items = [
    { date: '2026-09-01', title: 'b' },
    { date: '2026-07-01', title: 'a' },
    { date: '', title: 'z' },        // undated → sinks
    { date: '2026-07-01', title: 'a2' },
  ];
  it('date asc = soonest first, undated last, ties stable', () => {
    const out = sortReReviews(items, 'date', 'asc');
    expect(out.map((i) => i.title)).toEqual(['a', 'a2', 'b', 'z']);
  });
  it('date desc keeps undated last (nulls sink regardless of dir)', () => {
    const out = sortReReviews(items, 'date', 'desc');
    expect(out[out.length - 1].title).toBe('z');
    expect(out[0].title).toBe('b');
  });
  it('title sort is case-insensitive alpha', () => {
    const out = sortReReviews(items, 'title', 'asc');
    expect(out.map((i) => i.title)).toEqual(['a', 'a2', 'b', 'z']);
  });
});

describe('reReviewSummary — the overdue count never hides', () => {
  it('counts overdue and due-soon', () => {
    const items = extractReReviews({ reviews: { items: [{ id: 'R', findings: 're-review 2026-06-01 · re-review 2026-07-10 · re-review 2026-12-01' }] } }, NOW);
    const s = reReviewSummary(items);
    expect(s).toMatchObject({ total: 3, overdue: 1, soon: 1 });
  });
});

describe('proven-to-catch on the REAL registry', () => {
  it('finds real re-review commitments in docs/reviews/REVIEWS.md', () => {
    const raw = readFileSync(join(REPO_ROOT, 'docs/reviews/REVIEWS.md'), 'utf8');
    const section = (raw.split(/^##\s+Records\b.*$/m)[1] || raw);
    const blocks = section.split(/^###\s+/m).slice(1);
    const field = (b, l) => { const m = b.match(new RegExp(`\\*\\*${l}:\\*\\*\\s*([^\\n]+)`, 'i')); return m ? m[1].trim() : ''; };
    const items = blocks.map((b) => {
      const id = ((b.split('\n')[0] || '').split('·')[0] || '').trim();
      return { id, findings: field(b, 'Findings') };
    }).filter((it) => /^REV-\d+/.test(it.id));
    const out = extractReReviews({ reviews: { items } }, NOW);
    // REV-0007 + REV-0008 both carry multiple dated commitments; the extractor
    // must surface them (if this returns 0, the regex or the field parse broke).
    expect(out.length).toBeGreaterThanOrEqual(5);
    expect(out.map((i) => i.date)).toContain('2026-07-13');
  });
});

describe('re-review DONE-marker — closed commitments stop counting (2026-07-30 drive dry-run F1)', () => {
  const NOW2 = Date.parse('2026-07-30T00:00:00Z');
  it('EXCLUDES a re-review immediately followed by a DONE marker; KEEPS the bare one on the same line', () => {
    const items = [{ id: 'REV-9001', findings: 'build X — re-review: 2026-08-01; build Y — re-review: 2026-08-01 [DONE abc123]' }];
    const out = extractReReviews({ reviews: { items } }, NOW2);
    expect(out.length).toBe(1);
    expect(out[0].date).toBe('2026-08-01');
  });
  it('honors the marker variants (✓DONE, — RESOLVED, (CLOSED)) but NOT lowercase prose "done"', () => {
    const closed = [{ id: 'REV-9002', findings: 'a — re-review: 2026-08-02 ✓DONE; b — re-review: 2026-08-03 — RESOLVED; c — re-review: 2026-08-04 (CLOSED)' }];
    expect(extractReReviews({ reviews: { items: closed } }, NOW2).length).toBe(0);
    const prose = [{ id: 'REV-9003', findings: 'the work is done and shipped — re-review: 2026-08-05' }];
    expect(extractReReviews({ reviews: { items: prose } }, NOW2).length).toBe(1); // lowercase "done" in prose does not close it
  });
});
