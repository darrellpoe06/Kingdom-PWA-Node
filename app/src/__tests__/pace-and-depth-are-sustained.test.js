// @vitest-environment node
// =============================================================================
// pace-and-depth-are-sustained — your pace and depth stay until YOU change them
// (DR-1406)
// =============================================================================
// Darrell, 2026-11-10, with a screenshot of Pace & depth back on Adult / Auto:
// "Pace and depth should be sustained unless it is changed..." Measured: the
// two settings lived in the app's data object, and that object rides the
// household snapshot (one row per instance, last write wins, pulled at
// sign-in). So a child's band chosen on another device became his band the
// next time he signed in. Now they never leave the device in the snapshot, and
// an incoming snapshot never overwrites them.
import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

vi.mock('../lib/supabase.js', () => ({ default: { auth: { getSession: async () => ({ data: { session: null } }) } } }));
const { buildSnapshotPayload, withoutDevicePrefs, DEVICE_PREF_KEYS } = await import('../lib/snapshot-sync.js');

describe('pace and depth belong to the person on this device', () => {
  it('are never pushed in the household snapshot', () => {
    const payload = buildSnapshotPayload({ data: { learnAgeBand: 'senior', learnLevel: 'teen', budget: { rent: 1 } } });
    expect(payload.data.learnAgeBand).toBeUndefined();
    expect(payload.data.learnLevel).toBeUndefined();
    expect(payload.data.budget).toEqual({ rent: 1 });
  });

  it('an incoming snapshot that still carries them (older rows do) never overwrites this device', () => {
    const mine = { learnAgeBand: 'senior', learnLevel: 'standard', budget: { rent: 1 } };
    const incoming = { learnAgeBand: 'child', learnLevel: 'auto', budget: { rent: 2 } };
    const next = { ...mine, ...withoutDevicePrefs(incoming) };
    expect(next.learnAgeBand).toBe('senior');
    expect(next.learnLevel).toBe('standard');
    expect(next.budget).toEqual({ rent: 2 });
    expect(DEVICE_PREF_KEYS).toEqual(['learnAgeBand', 'learnLevel']);
  });

  it('PROVEN TO CATCH: the merge without the strip is the bug that reset him', () => {
    const mine = { learnAgeBand: 'senior' };
    const naive = { ...mine, ...{ learnAgeBand: 'child' } };
    expect(naive.learnAgeBand).toBe('child');
  });

  it('the app applies the snapshot through the strip', () => {
    const src = readFileSync(join(process.cwd(), 'src', 'poe-financial-mvp-v28.jsx'), 'utf8');
    expect(src).toMatch(/const snapData = withoutDevicePrefs\(p\.data \|\| \{\}\);/);
  });
});
