// @vitest-environment node
//
// data-integrity-audit — the summarizer behind the Data Integrity standard
// report (the painted-data audit scoreboard; distinct from the pre-existing
// data-integrity.test.js which covers data-consistency helpers). Proven-to-catch:
// coverage/clean %s must scope to AUDITED areas (pending never counts clean OR
// dirty), severities sum only over audited areas, the KPI status escalates
// correctly, and the committed ledger is well-formed (so the report can never
// paint — it only reflects real audit records).
import { describe, it, expect } from 'vitest';
import { summarizeAudit } from '../lib/data-integrity-audit.js';
import ledger from '../data/data-integrity-audit.json';

const mk = (areas, history = []) => ({ updatedAt: '2026-07-20', areas, history });

describe('data-integrity-audit — summarizeAudit', () => {
  it('coverage and clean% scope to audited areas; pending counts as neither', () => {
    const s = summarizeAudit(mk([
      { id: 'a', verdict: 'clean', high: 0, med: 0, low: 0 },
      { id: 'b', verdict: 'findings', high: 1, med: 0, low: 0 },
      { id: 'c', verdict: 'pending', high: 0, med: 0, low: 0 },
      { id: 'd', verdict: 'pending', high: 0, med: 0, low: 0 },
    ]));
    expect(s.total).toBe(4);
    expect(s.audited).toBe(2);
    expect(s.pending).toBe(2);
    expect(s.clean).toBe(1);
    expect(s.withFindings).toBe(1);
    expect(s.coveragePct).toBe(50);   // 2 of 4
    expect(s.cleanPct).toBe(50);      // 1 of 2 audited — NOT 1 of 4
  });

  it('open findings sum only over audited areas (a pending area with stale counts contributes 0)', () => {
    const s = summarizeAudit(mk([
      { id: 'a', verdict: 'findings', high: 2, med: 1, low: 3 },
      { id: 'b', verdict: 'pending', high: 9, med: 9, low: 9 }, // must NOT count
    ]));
    expect(s.openHigh).toBe(2);
    expect(s.openMed).toBe(1);
    expect(s.openLow).toBe(3);
    expect(s.openTotal).toBe(6);
  });

  it('status escalates: problem on any HIGH, attention on findings-or-pending, good only when fully audited + clean', () => {
    expect(summarizeAudit(mk([{ id: 'a', verdict: 'findings', high: 1 }])).status).toBe('problem');
    expect(summarizeAudit(mk([{ id: 'a', verdict: 'findings', low: 1 }])).status).toBe('attention');
    expect(summarizeAudit(mk([{ id: 'a', verdict: 'clean' }, { id: 'b', verdict: 'pending' }])).status).toBe('attention');
    expect(summarizeAudit(mk([{ id: 'a', verdict: 'clean' }])).status).toBe('good');
    expect(summarizeAudit(mk([])).status).toBe('idle');
  });

  it('trend is baseline with <2 history points, else deltas newest-vs-previous', () => {
    expect(summarizeAudit(mk([], [{ date: 'x', openHigh: 0, areasAudited: 4, areasClean: 3 }])).trend.baseline).toBe(true);
    const t = summarizeAudit(mk([], [
      { date: 'r1', openHigh: 3, areasAudited: 4, areasClean: 2 },
      { date: 'r2', openHigh: 1, areasAudited: 8, areasClean: 6 },
    ])).trend;
    expect(t.baseline).toBe(false);
    expect(t.highDelta).toBe(-2);      // 1 - 3 → fewer high = growth
    expect(t.coverageDelta).toBe(4);   // 8 - 4
    expect(t.cleanDelta).toBe(4);      // 6 - 2
  });

  it('empty/garbage ledger never throws and yields an idle, zeroed summary', () => {
    for (const bad of [null, undefined, {}, { areas: 'x' }, { areas: [], history: 'x' }]) {
      const s = summarizeAudit(bad);
      expect(s.total).toBe(0);
      expect(s.status).toBe('idle');
      expect(s.openTotal).toBe(0);
    }
  });
});

describe('data-integrity-audit — the committed ledger is well-formed (the report reflects real records)', () => {
  it('every area has an id, label, files[], a valid verdict, and coherent severities', () => {
    expect(Array.isArray(ledger.areas)).toBe(true);
    expect(ledger.areas.length).toBeGreaterThan(0);
    for (const a of ledger.areas) {
      expect(typeof a.id).toBe('string');
      expect(typeof a.label).toBe('string');
      expect(Array.isArray(a.files)).toBe(true);
      expect(['clean', 'findings', 'pending']).toContain(a.verdict);
      for (const k of ['high', 'med', 'low']) expect(a[k] || 0).toBeGreaterThanOrEqual(0);
      const f = (a.high || 0) + (a.med || 0) + (a.low || 0);
      if (a.verdict === 'findings') expect(f).toBeGreaterThanOrEqual(1);
      if (a.verdict === 'clean') expect(f).toBe(0);
    }
  });

  it('the summary of the real ledger is coherent (audited + pending = total)', () => {
    const s = summarizeAudit(ledger);
    expect(s.audited + s.pending).toBe(s.total);
    expect(s.clean).toBeLessThanOrEqual(s.audited);
  });
});
