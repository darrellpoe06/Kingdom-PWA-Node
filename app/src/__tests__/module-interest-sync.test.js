// module-interest-sync — pure reduce logic for the About priority-vote rail
// (0077 module_interest). Proves "family priority votes" is a REAL cross-
// member aggregate and "mine" preserves the local render shape. No network.
import { describe, it, expect } from 'vitest';
import { reduceInterestRows } from '../lib/module-interest-sync.js';

const ROWS = [
  { module_key: 'education', priority: 'critical', signed_at: '2026-07-01T10:00:00Z', created_by: 'darrell' },
  { module_key: 'education', priority: 'important', signed_at: '2026-07-02T10:00:00Z', created_by: 'christina' },
  { module_key: 'spiritual', priority: 'nice', signed_at: '2026-07-03T10:00:00Z', created_by: 'christina' },
];

describe('reduceInterestRows', () => {
  it('mine keeps the exact local shape ({ signedAt, priority }) for MY rows only', () => {
    const { mine } = reduceInterestRows(ROWS, 'darrell');
    expect(mine).toEqual({
      education: { signedAt: '2026-07-01T10:00:00Z', priority: 'critical' },
    });
  });

  it('family aggregates votes + weighted points across ALL members', () => {
    const { family } = reduceInterestRows(ROWS, 'darrell');
    expect(family.education).toEqual({ votes: 2, points: 8, latestAt: '2026-07-02T10:00:00Z' }); // 5 + 3
    expect(family.spiritual).toEqual({ votes: 1, points: 1, latestAt: '2026-07-03T10:00:00Z' });
  });

  it('unknown priority weighs 1, malformed rows are skipped, empty input is empty', () => {
    const { family } = reduceInterestRows([
      { module_key: 'x', priority: 'whatever', created_by: 'a', signed_at: null, created_at: '2026-07-04T00:00:00Z' },
      { priority: 'critical' },
      null,
    ], null);
    expect(family.x).toEqual({ votes: 1, points: 1, latestAt: '2026-07-04T00:00:00Z' });
    expect(reduceInterestRows([], 'u')).toEqual({ mine: {}, family: {} });
  });
});
