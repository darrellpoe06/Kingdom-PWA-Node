// In-app governance queue (Darrell, 2026-06-13: "built inside and outside of the
// app"). The surface reads the SAME repo file via a build-time define; this locks
// the normalizer that tolerates a missing/garbled define so the panel never crashes.
import { describe, it, expect } from 'vitest';
import { normalizeGovernanceQueue } from '../components/GovernanceQueue.jsx';

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
