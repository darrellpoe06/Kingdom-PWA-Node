// The capacity budget answers "is there room?" before builders launch (P65, DR-0697).
import { describe, it, expect } from 'vitest';
import { budget, readMeminfo } from '../../../scripts/capacity-budget.mjs';

describe('capacity budget', () => {
  it('reads MemTotal and MemAvailable from /proc/meminfo text', () => {
    const m = readMeminfo('MemTotal:       16480256 kB\nMemFree: 1 kB\nMemAvailable:    8388608 kB\n');
    expect(m.totalGb).toBeCloseTo(15.7, 1);
    expect(m.availGb).toBe(8);
  });
  it('says over budget when the wanted builders do not fit, and by memory or disk', () => {
    expect(budget({ availGb: 8, diskFreeGb: 20, wanted: 3 })).toMatchObject({ byMem: 2, fits: 2, ok: false });
    expect(budget({ availGb: 30, diskFreeGb: 3.5, wanted: 2 })).toMatchObject({ byDisk: 1, fits: 1, ok: false });
    expect(budget({ availGb: 8, diskFreeGb: 20, wanted: 2 }).ok).toBe(true);
  });
  it('never plans into the reserve: a nearly full machine has no room', () => {
    expect(budget({ availGb: 1.4, diskFreeGb: 50, wanted: 1 })).toMatchObject({ fits: 0, ok: false });
  });
});
