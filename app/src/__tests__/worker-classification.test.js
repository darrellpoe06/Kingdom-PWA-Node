// Tests for the 1099 worker-classification safety layer. These pin the
// VERIFIED current-year tax figures (DR-0076) and the isolation-by-default
// access rule (Darrell 2026-07-18) so a future edit can't silently drift them.
import { describe, it, expect } from 'vitest';
import {
  NEC_THRESHOLD_BY_YEAR, HOUSEHOLD_FICA_TRIGGER_2026,
  necThresholdForYear, necThresholdStatus, necThresholdLabel,
  WORKER_KINDS, WORKER_KIND_IDS, isWorkerKind,
  defaultAccessForKind, classificationAdvisory, ACCESS_MODES,
} from '../lib/worker-classification.js';

describe('NEC threshold — verified figures by year', () => {
  it('is $600 for 2025 and $2,000 for 2026 (One Big Beautiful Bill)', () => {
    expect(NEC_THRESHOLD_BY_YEAR[2025]).toBe(600);
    expect(NEC_THRESHOLD_BY_YEAR[2026]).toBe(2000);
  });

  it('resolves a known year exactly, not approximate', () => {
    expect(necThresholdForYear(2026)).toMatchObject({ amount: 2000, year: 2026, approximate: false });
  });

  it('marks an unverified FUTURE year approximate rather than inventing a figure', () => {
    const t = necThresholdForYear(2030);
    expect(t.amount).toBe(2000); // latest known
    expect(t.approximate).toBe(true);
    expect(t.year).toBe(2030);
  });
});

describe('necThresholdStatus — where a contractor sits vs. the filing line', () => {
  it('clear when well under (2026)', () => {
    expect(necThresholdStatus(500, 2026)).toMatchObject({ status: 'clear', threshold: 2000, remaining: 1500 });
  });
  it('approaching within 80% of threshold', () => {
    expect(necThresholdStatus(1700, 2026).status).toBe('approaching');
  });
  it('crossed at or above threshold', () => {
    expect(necThresholdStatus(2000, 2026).status).toBe('crossed');
    expect(necThresholdStatus(9000, 2026).status).toBe('crossed');
  });
  it('handles $0 / missing paid as clear with full remaining', () => {
    expect(necThresholdStatus(0, 2026)).toMatchObject({ status: 'clear', paid: 0, remaining: 2000 });
    expect(necThresholdStatus(undefined, 2026).status).toBe('clear');
  });
  it('the same paid amount flips status across the 2025->2026 threshold change', () => {
    // $900 paid: OVER the old $600 line (2025) but UNDER the new $2,000 line (2026)
    expect(necThresholdStatus(900, 2025).status).toBe('crossed');
    expect(necThresholdStatus(900, 2026).status).toBe('clear');
  });
});

describe('necThresholdLabel — plain language for a card', () => {
  it('says FILE when crossed and names the W-9', () => {
    const l = necThresholdLabel(5000, 2026);
    expect(l.tone).toBe('due');
    expect(l.text).toMatch(/file a 1099-NEC/i);
    expect(l.text).toMatch(/W-9/);
  });
  it('says collect the W-9 now when approaching', () => {
    expect(necThresholdLabel(1800, 2026).tone).toBe('caution');
  });
});

describe('WORKER_KINDS + isolation-by-default access', () => {
  it('includes the five relationship kinds plus the accountant exception', () => {
    expect(WORKER_KIND_IDS).toEqual(
      expect.arrayContaining(['business', 'family', 'household', 'church', 'clergy', 'accountant']),
    );
  });
  it('every kind isolates by default EXCEPT the tax accountant', () => {
    for (const k of WORKER_KINDS) {
      const expected = k.id === 'accountant' ? 'finance-read' : 'scoped';
      expect(defaultAccessForKind(k.id)).toBe(expected);
      expect(k.defaultAccess).toBe(expected);
    }
  });
  it('unknown kind falls back to the isolated default (fail safe)', () => {
    expect(defaultAccessForKind('nonsense')).toBe('scoped');
    expect(defaultAccessForKind(undefined)).toBe('scoped');
  });
  it('access modes are documented for both scoped and finance-read', () => {
    expect(ACCESS_MODES.scoped).toMatch(/walled off/i);
    expect(ACCESS_MODES['finance-read']).toMatch(/read-only/i);
  });
  it('isWorkerKind guards the vocabulary', () => {
    expect(isWorkerKind('household')).toBe(true);
    expect(isWorkerKind('employee')).toBe(false);
  });
});

describe('classificationAdvisory — the honest, tiered guidance', () => {
  it('WARNS that a household/in-home worker may be an EMPLOYEE, not a 1099', () => {
    const a = classificationAdvisory('household', { year: 2026 });
    expect(a.tone).toBe('warn');
    expect(a.verify).toBe(true);
    expect(a.headline).toMatch(/employee/i);
    expect(a.detail).toMatch(/W-2/);
    expect(a.detail).toMatch(/Schedule H|nanny tax/i);
    expect(a.detail).toContain(String(HOUSEHOLD_FICA_TRIGGER_2026.toLocaleString()));
  });
  it('WARNS clergy are dual-status, not a simple 1099', () => {
    const a = classificationAdvisory('clergy');
    expect(a.tone).toBe('warn');
    expect(a.detail).toMatch(/SECA|self-employed/i);
    expect(a.detail).toMatch(/housing allowance/i);
  });
  it('family helper is a caution to confirm contractor vs. employee', () => {
    const a = classificationAdvisory('family');
    expect(a.tone).toBe('caution');
    expect(a.verify).toBe(true);
  });
  it('church contractor: the church still files a 1099 (nonprofit is not exempt)', () => {
    const a = classificationAdvisory('church', { year: 2026 });
    expect(a.detail).toMatch(/nonprofit does not exempt/i);
    expect(a.detail).toContain('$2,000');
  });
  it('accountant is the read-the-books exception, still least-privilege', () => {
    const a = classificationAdvisory('accountant');
    expect(a.headline).toMatch(/reads the books/i);
    expect(a.detail).toMatch(/read-only/i);
    expect(a.detail).toMatch(/time-boxed|revocable/i);
    expect(a.detail).toMatch(/export/i);
  });
  it('business contractor is the standard OK case with a W-9-first reminder', () => {
    const a = classificationAdvisory('business', { year: 2026 });
    expect(a.tone).toBe('ok');
    expect(a.detail).toMatch(/W-9/);
    expect(a.detail).toContain('$2,000');
  });
  it('defaults an unknown kind to the safe business guidance without throwing', () => {
    expect(() => classificationAdvisory('mystery')).not.toThrow();
    expect(classificationAdvisory('mystery').headline).toMatch(/business contractor/i);
  });
});
