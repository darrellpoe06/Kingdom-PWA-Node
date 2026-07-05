// completion — the App Firm-Up rollup logic (DR-0076). The hub headline is only
// trustworthy if this aggregates real state honestly: overall % across every
// board, a projected finish that moves as items close, and metrics that read the
// deterministic persistent-share JSON (not a painted number).
import { describe, it, expect } from 'vitest';
import {
  overallCompletion, projectedFinish, perBoardBreakdown, trendOf,
  persistentShare, moduleLedger,
} from '../lib/completion.js';

const T = (over = {}) => ({ slug: over.slug || Math.random().toString(36), status: 'not-started', boardSlug: 'b', boardTitle: 'B', title: 'x', ...over });

describe('overallCompletion — aggregate across all boards', () => {
  it('counts done/total regardless of which board', () => {
    const o = overallCompletion([
      T({ boardSlug: 'a', status: 'done' }),
      T({ boardSlug: 'a', status: 'not-started' }),
      T({ boardSlug: 'b', status: 'done' }),
      T({ boardSlug: 'b', status: 'blocked' }),
    ]);
    expect(o.total).toBe(4);
    expect(o.done).toBe(2);
    expect(o.pct).toBe(50);
  });
  it('null pct when there are no items — never a painted number', () => {
    expect(overallCompletion([]).pct).toBeNull();
  });
  it('moves when an item is closed (the headline follows real state)', () => {
    const before = overallCompletion([T({ status: 'in-progress' }), T({ status: 'done' })]);
    const after = overallCompletion([T({ status: 'done' }), T({ status: 'done' })]);
    expect(before.pct).toBe(50);
    expect(after.pct).toBe(100);
  });
});

describe('projectedFinish — latest open target, moves as items close', () => {
  it('returns the latest due date among OPEN items', () => {
    const f = projectedFinish([
      T({ status: 'in-progress', dueDate: '2026-08-01' }),
      T({ status: 'not-started', dueDate: '2026-09-15' }),
      T({ status: 'done', dueDate: '2027-01-01' }), // done is ignored
    ]);
    expect(f.date).toBe('2026-09-15');
    expect(f.datedOpen).toBe(2);
  });
  it('closing the latest-dated item moves the projection earlier', () => {
    const open = [T({ status: 'in-progress', dueDate: '2026-08-01' }), T({ slug: 'late', status: 'in-progress', dueDate: '2026-12-31' })];
    expect(projectedFinish(open).date).toBe('2026-12-31');
    const closed = open.map((t) => (t.slug === 'late' ? { ...t, status: 'done' } : t));
    expect(projectedFinish(closed).date).toBe('2026-08-01');
  });
  it('counts undated open items honestly and returns null when none are dated', () => {
    const f = projectedFinish([T({ status: 'in-progress' }), T({ status: 'not-started' })]);
    expect(f.date).toBeNull();
    expect(f.undatedOpen).toBe(2);
  });
});

describe('perBoardBreakdown', () => {
  it('gives each board its own roll-up', () => {
    const rows = perBoardBreakdown([
      T({ boardSlug: 'x', boardTitle: 'X', status: 'done' }),
      T({ boardSlug: 'x', boardTitle: 'X', status: 'not-started' }),
      T({ boardSlug: 'y', boardTitle: 'Y', status: 'done' }),
    ]);
    expect(rows.find((r) => r.slug === 'x').pct).toBe(50);
    expect(rows.find((r) => r.slug === 'y').pct).toBe(100);
  });
});

describe('trendOf', () => {
  it('signs the direction', () => {
    expect(trendOf(13.5, 12.6).dir).toBe('up');
    expect(trendOf(12.0, 12.6).dir).toBe('down');
    expect(trendOf(12.6, 12.6).dir).toBe('flat');
  });
  it('flat when previous is unknown', () => {
    expect(trendOf(12.6, null).dir).toBe('flat');
  });
});

describe('persistentShare + moduleLedger — read the committed measured JSON', () => {
  it('exposes the persistent-layer share with baseline + target', () => {
    const s = persistentShare();
    expect(typeof s.current).toBe('number');
    expect(s.baseline).toBe(12.6);      // Darrell's fixed baseline
    expect(s.target).toBe(20);
    // the measured current sits near the baseline today (the counter is real)
    expect(s.current).toBeGreaterThan(10);
    expect(s.current).toBeLessThan(16);
    expect(s.sub).toHaveProperty('sql');
    expect(s.sub).toHaveProperty('python');
  });
  it('exposes the module-ledger monolith line count', () => {
    const m = moduleLedger();
    expect(typeof m.monolithLines).toBe('number');
    expect(m.monolithLines).toBeGreaterThan(0);
  });
  it('carries the snapshot date so the surface dates it instead of posing as live (DR-0076 rule 8)', () => {
    // Both readouts wear the JSON's own generatedAt stamp; the tile renders it
    // ("measured YYYY-MM-DD"). If the artifact ever loses the stamp, measuredAt
    // is null and the surface must say "snapshot — regenerate" — never invent one.
    const s = persistentShare();
    const m = moduleLedger();
    expect(s.measuredAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(m.measuredAt).toBe(s.measuredAt); // same artifact, same stamp
  });
});

// FRESHNESS GATE (2026-07-04, caught live by Darrell): the committed measured
// JSON went four extractions stale (still said 8,403/8,489 while the ratchet
// held 5,869). The dashboard must read the SAME truth the guard enforces — so
// this cross-pin fails the build whenever an extraction re-freezes the budget
// without regenerating persistent-share.json (fix: python3 scripts/persistent-share.py).
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

describe('freshness gate — the dashboard number IS the ratchet number', () => {
  const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');
  it('persistent-share moduleLedger matches scripts/monolith-budget.json exactly', () => {
    const budget = JSON.parse(readFileSync(join(ROOT, 'scripts/monolith-budget.json'), 'utf8'));
    const m = moduleLedger();
    expect(m.frozenBudget).toBe(budget.budget);
    // current lines may only sit AT or UNDER the frozen budget (down-only ratchet)
    expect(m.monolithLines).toBeLessThanOrEqual(budget.budget);
  });
});
