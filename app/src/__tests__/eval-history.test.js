// History & Markers evaluation layer (DR-0102) — the pure core + wiring guards.
//
// Proven-to-catch (DR-0076): bucketing is exercised against fixture rows with a
// KNOWN distribution and a FIXED clock (a misbucket fails); ops rows without a
// parseable timestamp are proven to contribute NOTHING; a dateless record is
// proven to never become a marker; the honest empties (null series, null feed)
// are asserted as ok:false, never painted zeros. Wiring guards keep the layer
// mounted in the steward seat, the series RPC in the migration lane, and the
// WHY pairing resolving against the real ledger (the shared WHY loop in
// quality-throughput.test.js also covers the new `history` key).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  dayKeyUtc, windowDayKeys, normalizeUsageSeries, opsDaily, halfWindowDelta,
  buildMarkers, markersByDay, barHeight, seriesMax, fmtDay,
} from '../lib/eval-history.js';
import { WHY } from '../lib/quality-throughput.js';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
// Fixed clock: 2026-07-05T15:30Z — mid-day so UTC day math has no edge luck.
const NOW = Date.parse('2026-07-05T15:30:00Z');

describe('day math (UTC, matching the 0078 RPC)', () => {
  it('keys timestamps to their UTC day and rejects garbage', () => {
    expect(dayKeyUtc('2026-07-05T01:00:00Z')).toBe('2026-07-05');
    expect(dayKeyUtc('2026-07-04T23:59:59Z')).toBe('2026-07-04');
    expect(dayKeyUtc('not a date')).toBe(null);
    expect(dayKeyUtc('')).toBe(null);
    expect(dayKeyUtc(null)).toBe(null);
  });
  it('builds the window oldest→newest, today included, clamped to [1,365]', () => {
    const keys = windowDayKeys(7, NOW);
    expect(keys).toHaveLength(7);
    expect(keys[0]).toBe('2026-06-29');
    expect(keys[6]).toBe('2026-07-05');
    expect(windowDayKeys(0, NOW)).toHaveLength(1);
    expect(windowDayKeys(9999, NOW)).toHaveLength(365);
  });
});

describe('people lane — normalizeUsageSeries', () => {
  it('degrades to ok:false on an absent series (never a painted flat line)', () => {
    expect(normalizeUsageSeries(null).ok).toBe(false);
    expect(normalizeUsageSeries({}).ok).toBe(false);
    expect(normalizeUsageSeries({ days: 'nope' }).ok).toBe(false);
  });
  it('totals the real per-day rows and counts active days', () => {
    const s = normalizeUsageSeries({
      window_days: 3,
      days: [
        { day: '2026-07-03', views: 10, users: 2 },
        { day: '2026-07-04', views: 0, users: 0 },
        { day: '2026-07-05', views: 5, users: 1 },
        { bad: true },
      ],
    });
    expect(s.ok).toBe(true);
    expect(s.windowDays).toBe(3);
    expect(s.days).toHaveLength(3); // the junk row is filtered, not coerced
    expect(s.totalViews).toBe(15);
    expect(s.activeDays).toBe(2);
  });
});

describe('system lane — opsDaily buckets real rows only (proven-to-catch)', () => {
  const DAYS = windowDayKeys(3, NOW); // 07-03 .. 07-05
  it('a feed that never arrived is ok:false; an empty feed is a real zero', () => {
    expect(opsDaily(null, DAYS).ok).toBe(false);
    const empty = opsDaily([], DAYS);
    expect(empty.ok).toBe(true);
    expect(empty.total).toBe(0);
  });
  it('buckets by createdAt UTC day; unparseable timestamps contribute NOTHING', () => {
    const rows = [
      { createdAt: '2026-07-03T10:00:00Z', status: 'done' },
      { createdAt: '2026-07-03T11:00:00Z', status: 'error' },
      { createdAt: '2026-07-05T09:00:00Z', status: 'queued' },
      { createdAt: 'garbage', status: 'done' },        // must vanish
      { status: 'done' },                              // must vanish
      { createdAt: '2026-06-01T00:00:00Z', status: 'done' }, // outside window
    ];
    const o = opsDaily(rows, DAYS);
    expect(o.total).toBe(3);
    expect(o.failed).toBe(1);
    expect(o.days[0]).toEqual({ day: '2026-07-03', done: 1, error: 1, other: 0 });
    expect(o.days[1]).toEqual({ day: '2026-07-04', done: 0, error: 0, other: 0 });
    expect(o.days[2]).toEqual({ day: '2026-07-05', done: 0, error: 0, other: 1 });
  });
});

describe('the evaluation — halfWindowDelta', () => {
  const mk = (vals) => vals.map((v, i) => ({ day: `d${i}`, views: v }));
  it('needs at least two days', () => {
    expect(halfWindowDelta([], (d) => d.views).ok).toBe(false);
    expect(halfWindowDelta(mk([5]), (d) => d.views).ok).toBe(false);
  });
  it('compares equal-size halves and reports honest direction', () => {
    const up = halfWindowDelta(mk([1, 1, 0, 3, 3]), (d) => d.views);
    expect(up).toMatchObject({ ok: true, prev: 2, curr: 6, pct: 200, direction: 'up' });
    const down = halfWindowDelta(mk([4, 4, 2, 2]), (d) => d.views);
    expect(down).toMatchObject({ prev: 8, curr: 4, pct: -50, direction: 'down' });
  });
  it('never divides by a quiet older half — pct is null, not a fabricated %', () => {
    const d = halfWindowDelta(mk([0, 0, 5, 5]), (d2) => d2.views);
    expect(d.pct).toBe(null);
    expect(d.direction).toBe('up');
  });
});

describe('historical markers — dated records only, pinned to the window', () => {
  const DAYS = windowDayKeys(7, NOW); // 06-29 .. 07-05
  const LEDGER = {
    ok: true,
    items: [
      { id: 'DR-0101', title: 'In window', date: '2026-07-05' },
      { id: 'DR-0100', title: 'Also in window', date: '2026-07-04' },
      { id: 'DR-0050', title: 'Out of window', date: '2026-06-01' },
      { id: 'DR-0099', title: 'DATELESS — must be skipped, never guessed', date: '' },
    ],
  };
  const LESSONS = {
    ok: true,
    principles: [],
    incidents: [
      { date: '2026-07-04', title: 'An incident in window' },
      { date: '2026-05-01', title: 'Old incident' },
      { date: 'nonsense', title: 'Bad date — skipped' },
    ],
  };
  it('keeps only dated, in-window records; DRs sort before incidents within a day', () => {
    const m = buildMarkers(LEDGER, LESSONS, DAYS);
    expect(m.map((x) => `${x.day}:${x.kind}:${x.id}`)).toEqual([
      '2026-07-04:dr:DR-0100',
      '2026-07-04:incident:2026-07-04',
      '2026-07-05:dr:DR-0101',
    ]);
  });
  it('degrades to empty on absent inputs', () => {
    expect(buildMarkers(null, null, DAYS)).toEqual([]);
  });
  it('groups by day for the rail', () => {
    const by = markersByDay(buildMarkers(LEDGER, LESSONS, DAYS));
    expect(by['2026-07-04']).toHaveLength(2);
    expect(by['2026-07-05']).toHaveLength(1);
    expect(by['2026-07-03']).toBeUndefined();
  });
});

describe('chart geometry never lies about scale', () => {
  it('zero is a true zero; any real event is visible (1px floor); max fills the lane', () => {
    expect(barHeight(0, 100, 40)).toBe(0);
    expect(barHeight(1, 1000, 40)).toBe(1);
    expect(barHeight(100, 100, 40)).toBe(40);
    expect(barHeight(50, 100, 40)).toBe(20);
    expect(barHeight(5, 0, 40)).toBe(0); // no max → nothing to scale against
  });
  it('seriesMax and fmtDay behave over real shapes', () => {
    expect(seriesMax([{ v: 2 }, { v: 9 }, { v: 4 }], (d) => d.v)).toBe(9);
    expect(seriesMax([], (d) => d.v)).toBe(0);
    expect(fmtDay('2026-07-05')).toBe('Jul 5');
    expect(fmtDay('bad')).toBe('');
  });
});

describe('cross-seam guards — the layer stays wired', () => {
  it('the WHY registry pairs the history metric with its records', () => {
    expect(WHY.history).toBeTruthy();
    expect(WHY.history.drs).toContain('DR-0102');
    expect(WHY.history.drs).toContain('DR-0091');
  });
  it('the layer is mounted in the steward seat (C2S See faculty)', () => {
    const center = readFileSync(join(REPO_ROOT, 'app/src/components/CommandServeCenter.jsx'), 'utf8');
    expect(center).toContain("import EvalHistory from './EvalHistory.jsx'");
    expect(center).toContain('<EvalHistory />');
  });
  it('the layer reads its live sources (the interconnect loop tokens hold)', () => {
    const src = readFileSync(join(REPO_ROOT, 'app/src/components/EvalHistory.jsx'), 'utf8');
    for (const token of ['fetchUsageSeries', 'fetchCommands', 'buildMarkers']) {
      expect(src, `EvalHistory lost its live source: ${token}`).toContain(token);
    }
  });
  it('the series RPC rides the migration lane with the poe-family gate + full-window zeros', () => {
    const sql = readFileSync(join(REPO_ROOT, 'infra/supabase/migrations-auto/0078-usage-flow-series.sql'), 'utf8');
    expect(sql).toContain('usage_flow_series');
    expect(sql).toContain("i.slug = 'poe-family'");
    expect(sql).toContain('generate_series'); // zero days are measured, not invented client-side
    expect(sql).toContain('SECURITY DEFINER');
  });
  it('the ledger parser carries dates for bullet-style DRs (the marker rail depends on it)', () => {
    const cfg = readFileSync(join(REPO_ROOT, 'app/vite.config.js'), 'utf8');
    expect(cfg).toContain('bulletDate');
    // Proven against a real bullet-style record: DR-0091 has no YAML block.
    const dr91 = readFileSync(join(REPO_ROOT, 'docs/decisions/DR-0091-quality-throughput-board.md'), 'utf8');
    expect(/^---/.test(dr91)).toBe(false);
    expect(dr91).toMatch(/^- \*\*Date:\*\* \d{4}-\d{2}-\d{2}/m);
  });
});
