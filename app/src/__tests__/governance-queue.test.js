// In-app governance queue (Darrell, 2026-06-13: "built inside and outside of the
// app"). The surface reads the SAME repo file via a build-time define; this locks
// the normalizer that tolerates a missing/garbled define so the panel never crashes.
import { describe, it, expect } from 'vitest';
import { normalizeGovernanceQueue, normalizeDecisionLedger } from '../components/GovernanceQueue.jsx';

describe('normalizeGovernanceQueue', () => {
  it('keeps well-formed items and reports the count', () => {
    const out = normalizeGovernanceQueue({
      ok: true,
      items: [
        { id: 'OPEN-1', title: 'A', tier: 'C' },
        { id: 'OPEN-2', title: 'B', tier: 'B' },
      ],
    });
    expect(out.ok).toBe(true);
    expect(out.openCount).toBe(2);
    expect(out.items.map(i => i.id)).toEqual(['OPEN-1', 'OPEN-2']);
  });

  it('drops items with no id', () => {
    const out = normalizeGovernanceQueue({ ok: true, items: [{ id: 'OPEN-1' }, {}, null] });
    expect(out.openCount).toBe(1);
  });

  it('degrades safely on a missing / garbled define', () => {
    expect(normalizeGovernanceQueue(undefined)).toEqual({ ok: false, openCount: 0, items: [] });
    expect(normalizeGovernanceQueue(null)).toEqual({ ok: false, openCount: 0, items: [] });
    expect(normalizeGovernanceQueue('nonsense')).toEqual({ ok: false, openCount: 0, items: [] });
    expect(normalizeGovernanceQueue({ ok: true })).toEqual({ ok: true, openCount: 0, items: [] });
  });
});

describe('normalizeDecisionLedger', () => {
  it('keeps well-formed DR entries and reports the count', () => {
    const out = normalizeDecisionLedger({
      ok: true,
      items: [
        { id: 'DR-0065', num: 65, title: 'App is the primary artifact', date: '2026-06-13', status: 'accepted', tier: 'A', decision: 'Build in the app.', rationale: 'Context purges lose it.' },
        { id: 'DR-0015', num: 15, title: 'COLG build', status: 'superseded', supersededBy: 'DR-0016' },
      ],
    });
    expect(out.ok).toBe(true);
    expect(out.count).toBe(2);
    expect(out.items[0].id).toBe('DR-0065');
    expect(out.items[0].decision).toBe('Build in the app.');
    expect(out.items[1].supersededBy).toBe('DR-0016');
  });

  it('drops entries with no id and lowercases status', () => {
    const out = normalizeDecisionLedger({ ok: true, items: [{ id: 'DR-0001', status: 'Accepted' }, {}, null] });
    expect(out.count).toBe(1);
    expect(out.items[0].status).toBe('accepted');
  });

  it('degrades safely on a missing / garbled define', () => {
    expect(normalizeDecisionLedger(undefined)).toEqual({ ok: false, count: 0, items: [] });
    expect(normalizeDecisionLedger(null)).toEqual({ ok: false, count: 0, items: [] });
    expect(normalizeDecisionLedger('nonsense')).toEqual({ ok: false, count: 0, items: [] });
    expect(normalizeDecisionLedger({ ok: true })).toEqual({ ok: true, count: 0, items: [] });
  });
});
