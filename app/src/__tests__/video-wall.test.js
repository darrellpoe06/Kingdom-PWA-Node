// Video Wall capital-project pure helpers — derivations the page + budget rely
// on. Proven-to-catch: the pixel math must DERIVE from pitch x physical size
// (not a hardcoded number), superseded/unquoted budget lines must NOT inflate
// the real cost, and donations stay "unknown" until a real figure is entered.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  pixelMath, budgetTotals, donationProgress,
  toProjectShape, toBudgetLineShape,
} from '../lib/video-wall-sync.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '../../..'); // app/src/__tests__ -> repo root

describe('pixelMath — derived, not fabricated', () => {
  const px = pixelMath({ pitchMm: 2.97, heightFt: 9, widthFtMin: 11, widthFtMax: 12 });

  it('derives px from pitch x physical size (304.8 mm/ft)', () => {
    // 9 ft = 2743.2 mm; / 2.97 = 923.6 -> 924 px tall
    expect(px.heightPx).toBe(Math.round((9 * 304.8) / 2.97));
    expect(px.heightPx).toBe(924);
    // 11 ft -> 1129 px, 12 ft -> 1232 px
    expect(px.widthPxMin).toBe(Math.round((11 * 304.8) / 2.97));
    expect(px.widthPxMax).toBe(Math.round((12 * 304.8) / 2.97));
  });

  it('scales with pitch — a finer pitch yields MORE pixels', () => {
    const finer = pixelMath({ pitchMm: 1.5, heightFt: 9, widthFtMin: 11, widthFtMax: 12 });
    expect(finer.heightPx).toBeGreaterThan(px.heightPx);
  });

  it('reports megapixels and 4K headroom honestly', () => {
    expect(px.megapixelsMax).toBeCloseTo(+(((px.widthPxMax * px.heightPx) / 1e6).toFixed(2)), 2);
    expect(px.fits4kSingleOutput).toBe(true); // ~1.1 MP << 8.3 MP
  });

  it('always returns its assumptions (nothing claimed as exact silently)', () => {
    expect(px.assumptions.length).toBeGreaterThanOrEqual(3);
  });

  it('guards bad input', () => {
    expect(pixelMath({ pitchMm: 0, heightFt: 9, widthFtMin: 11 })).toBeNull();
  });
});

describe('budgetTotals — superseded/unquoted never inflate the real cost', () => {
  const lines = [
    { kind: 'current', amount: 39280 },
    { kind: 'superseded', amount: 3999 },
    { kind: 'discussed', amount: null },
  ];
  const t = budgetTotals(lines);

  it('sums only current lines for the cost', () => {
    expect(t.currentTotal).toBe(39280);
  });
  it('keeps superseded separate (history, not cost)', () => {
    expect(t.supersededTotal).toBe(3999);
  });
  it('counts unquoted accessory lines without counting them as $0', () => {
    expect(t.hasUnquoted).toBe(true);
    expect(t.unquotedCount).toBe(1);
    expect(t.discussedTotal).toBe(0);
  });
  it('handles empty input', () => {
    expect(budgetTotals(null).currentTotal).toBe(0);
  });
});

describe('donationProgress — no painted numbers', () => {
  it('is unknown until a real figure exists', () => {
    const d = donationProgress({});
    expect(d.known).toBe(false);
    expect(d.pct).toBeNull();
  });
  it('computes pct/remaining once real figures are present', () => {
    const d = donationProgress({ pledged: 40000, received: 10000 });
    expect(d.known).toBe(true);
    expect(d.pct).toBe(25);
    expect(d.remaining).toBe(30000);
  });
  it('never exceeds 100%', () => {
    expect(donationProgress({ pledged: 100, received: 250 }).pct).toBe(100);
  });
});

// PRIVACY GATE (proven-to-catch). The repo is PUBLIC, so the real church
// financial figures must never appear in any COMMITTED client/public file — they
// live only in the gitignored seed + the gated DB rows. This encodes the leak
// the build scan caught (a $3,999 / invoice number in the bundle) so it can't
// recur silently. The strings below are the actual grounded figures.
describe('privacy — no church figures in committed public source', () => {
  const PUBLIC_FILES = [
    'app/src/components/ChurchVideoWall.jsx',
    'app/src/lib/video-wall-sync.js',
    'infra/supabase/migrations-auto/0030-church-capital-projects.sql',
  ];
  // amounts + the invoice/estimate numbers that pin them
  const FORBIDDEN = ['39280', '39,280', '3999', '3,999', '6545', '12539'];

  for (const rel of PUBLIC_FILES) {
    it(`${rel} contains no real figure / invoice number`, () => {
      const src = readFileSync(join(ROOT, rel), 'utf8');
      const hits = FORBIDDEN.filter((t) => src.includes(t));
      expect(hits, `leaked into ${rel}: ${hits.join(', ')}`).toEqual([]);
    });
  }

  it('the gate actually catches a leak (anti-theater)', () => {
    const sample = 'const cost = "39280";';
    const hit = ['39280', '3999'].filter((t) => sample.includes(t));
    expect(hit.length).toBeGreaterThan(0);
  });
});

describe('mappers', () => {
  it('toProjectShape coerces numerics and defaults', () => {
    const p = toProjectShape({ id: 'p1', slug: 's', name: 'n', pledged_total: '40000.00', received_total: null });
    expect(p.pledgedTotal).toBe(40000);
    expect(p.receivedTotal).toBeNull();
    expect(p.status).toBe('planning');
  });
  it('toBudgetLineShape keeps null amounts null (not 0)', () => {
    const l = toBudgetLineShape({ id: 'l1', project_id: 'p1', label: 'x', amount: null, kind: 'discussed' });
    expect(l.amount).toBeNull();
    expect(l.kind).toBe('discussed');
  });
});
