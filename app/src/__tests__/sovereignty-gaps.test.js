// @vitest-environment node
//
// sovereignty-gaps — the vendor ledger holds its own doctrine (DR-0138): a
// vendor need without its full record (what we have locally, the vendor used
// meanwhile, the build path, the purchase path, when we needed it, a re-review
// date) is NOT permitted; a closed gap needs evidence; and the live voice path
// derives from the real endpoint config, never a re-typed claim.
import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  SOVEREIGNTY_GAPS, GAPS_RECORDED, validateGaps, liveVoicePath,
} from '../lib/sovereignty-gaps.js';

afterEach(() => vi.unstubAllEnvs());

describe('the shipped ledger passes its own gate', () => {
  it('validates clean and is dated', () => {
    const out = validateGaps();
    expect(out.errors).toEqual([]);
    expect(out.ok).toBe(true);
    expect(GAPS_RECORDED).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  it('the voice-clone gap names the build path on OUR device (no purchase needed)', () => {
    const g = SOVEREIGNTY_GAPS.find((x) => x.id === 'gap-voice-clone');
    expect(g.buildPath).toContain('voice-studio');
    expect(g.purchasePath).toContain('None');
    expect(g.status).toBe('open');
  });
});

describe('the gate CATCHES an unrecorded vendor need (proven-to-catch)', () => {
  it('fails a gap with no build path', () => {
    const out = validateGaps([{ ...SOVEREIGNTY_GAPS[0], buildPath: '' }]);
    expect(out.ok).toBe(false);
    expect(out.errors.join(' ')).toContain('buildPath');
  });
  it('fails a gap with no neededSince (WHEN is part of the record)', () => {
    const out = validateGaps([{ ...SOVEREIGNTY_GAPS[0], neededSince: '' }]);
    expect(out.ok).toBe(false);
    expect(out.errors.join(' ')).toContain('neededSince');
  });
  it('fails an undated re-review (DR-0075) and an evidence-free closed gap (DR-0076)', () => {
    expect(validateGaps([{ ...SOVEREIGNTY_GAPS[0], reReview: 'soon' }]).ok).toBe(false);
    expect(validateGaps([{ ...SOVEREIGNTY_GAPS[0], status: 'closed' }]).ok).toBe(false);
  });
});

describe('liveVoicePath derives from the real endpoint config', () => {
  it('no endpoint → the honest stand-in state', () => {
    expect(liveVoicePath().kind).toBe('stand-in');
  });
  it('sovereign studio armed → sovereign (outranks the vendor bridge)', () => {
    vi.stubEnv('VITE_VOICE_SERVICE_URL', 'http://192.168.1.75:8770');
    vi.stubEnv('VITE_VOICE_BRIDGE', '1');
    expect(liveVoicePath().kind).toBe('sovereign');
  });
  it('vendor bridge alone → vendor, labeled as a RECORDED gap', () => {
    vi.stubEnv('VITE_VOICE_BRIDGE', '1');
    const p = liveVoicePath();
    expect(p.kind).toBe('vendor');
    expect(p.label).toContain('RECORDED');
  });
});
