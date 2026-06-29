// @vitest-environment node
//
// loop-health — the app's self-review of stagnant loops (Darrell 2026-06-15:
// "if anything begins to not loop or is stagnant, it asks if we should keep it").
// Proven-to-catch: a loop whose real freshness signal is old is flagged 'stale';
// a recent one is 'fresh'; a loop with NO real update signal is 'never' (a dead/
// painted loop — retire candidate). Pure logic in lib/loop-health.js.
import { describe, it, expect } from 'vitest';
import { assessLoops, stagnantLoops, daysSince, toMs } from '../lib/loop-health.js';

const NOW = Date.parse('2026-06-15T00:00:00Z');
const iso = (d) => new Date(d).toISOString();

describe('loop-health helpers', () => {
  it('toMs parses ISO, rejects junk', () => {
    expect(toMs('2026-06-01')).toBe(Date.parse('2026-06-01'));
    expect(toMs(null)).toBe(null);
    expect(toMs('not-a-date')).toBe(null);
  });
  it('daysSince computes whole days', () => {
    expect(daysSince(Date.parse('2026-06-05T00:00:00Z'), NOW)).toBe(10);
    expect(daysSince(null, NOW)).toBe(null);
  });
});

describe('assessLoops — fresh / stale / never', () => {
  it('flags a financial loop that has not updated past its threshold as STALE', () => {
    const data = { meta: { lastUpdated: '2026-04-01' } }; // ~75 days stale (> 35)
    const fin = assessLoops(data, NOW).find((l) => l.key === 'financial');
    expect(fin.status).toBe('stale');
    expect(fin.daysSince).toBeGreaterThan(fin.staleDays);
  });
  it('keeps a recently-updated loop FRESH', () => {
    const data = { meta: { lastUpdated: iso(NOW - 3 * 86400000) } }; // 3 days
    const fin = assessLoops(data, NOW).find((l) => l.key === 'financial');
    expect(fin.status).toBe('fresh');
  });
  it('an arriving financial DOCUMENT makes the financial loop fresh, even with a stale manual stamp', () => {
    // manual stamp is 75 days stale, but a Chase document arrived 2 days ago.
    const data = { meta: { lastUpdated: '2026-04-01' } };
    const fin = assessLoops(data, NOW, { financialDocAt: iso(NOW - 2 * 86400000) }).find((l) => l.key === 'financial');
    expect(fin.status).toBe('fresh'); // driven by real document arrival, not the old stamp
    expect(fin.daysSince).toBe(2);
  });
  it('marks a loop with NO real update signal as NEVER (retire candidate)', () => {
    const ledger = assessLoops({}, NOW).find((l) => l.key === 'ledger'); // no transactions
    expect(ledger.status).toBe('never');
    expect(ledger.lastUpdate).toBe(null);
  });
  it('catches the hardcoded-trivia fake loop via env.triviaDate', () => {
    const stale = assessLoops({}, NOW, { triviaDate: '2026-05-01' }).find((l) => l.key === 'engagement');
    expect(stale.status).toBe('stale'); // > 10 days old
  });
  it('marks the trivia loop AWAITING (not a dead NEVER) and names its REAL source', () => {
    // No triviaDate flowing AND the loop declares a real-but-unconnected source:
    // Bishop Gwin's Wednesday 1PM YouTube message (Darrell 2026-06-23). Pin the
    // naming so the status can never regress to "no source / never".
    const eng = assessLoops({}, NOW).find((l) => l.key === 'engagement');
    expect(eng.status).toBe('awaiting');          // honest "in-progress", not a red NEVER
    expect(eng.lastUpdate).toBe(null);
    expect(typeof eng.awaitingSource).toBe('string');
    expect(eng.awaitingSource).toMatch(/wednesday/i);
    expect(eng.awaitingSource).toMatch(/youtube/i);
  });
  it('self-heals: the trivia loop goes fresh the moment a real active-question date flows', () => {
    const eng = assessLoops({}, NOW, { triviaDate: iso(NOW - 1 * 86400000) }).find((l) => l.key === 'engagement');
    expect(eng.status).toBe('fresh'); // real data present -> no longer awaiting
  });
  it('a loop with NO declared source stays NEVER, not awaiting (the awaiting flag is opt-in)', () => {
    const ledger = assessLoops({}, NOW).find((l) => l.key === 'ledger');
    expect(ledger.status).toBe('never');
    expect(ledger.awaitingSource).toBe(null);
  });
  it('uses the latest transaction date for the ledger loop', () => {
    const data = { transactions: [{ date: '2026-01-01' }, { date: iso(NOW - 2 * 86400000) }] };
    const ledger = assessLoops(data, NOW).find((l) => l.key === 'ledger');
    expect(ledger.status).toBe('fresh'); // newest tx is 2 days old
  });
});

describe('stagnantLoops — what the Governor reviews', () => {
  it('returns only the non-fresh loops', () => {
    const data = { meta: { lastUpdated: iso(NOW - 1 * 86400000) } }; // financial fresh
    const flagged = stagnantLoops(data, NOW);
    expect(flagged.every((l) => l.status !== 'fresh')).toBe(true);
    expect(flagged.find((l) => l.key === 'financial')).toBeUndefined();
  });
});
