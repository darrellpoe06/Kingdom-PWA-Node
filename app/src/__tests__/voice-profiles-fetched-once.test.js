// @vitest-environment node
// =============================================================================
// voice_profiles is fetched ONCE and shared — not once per component
// =============================================================================
// Measured during the 2026-08-14 egress outage: `voice_profiles` was 92 of ~120
// requests (84% of all API traffic), arriving in bursts of three inside the same
// 40ms window. It was not a retry storm and it was not the byte driver behind
// the 402 (that was `feedback` — DR-0303).
//
// It was a FAN-OUT. `useReadAloud` runs a mount effect calling
// loadVoiceProfiles(), and four components use that hook — TTSControl,
// BibleReader, HelpButton, ReadingVoiceControl — so each instance independently
// fetched the same instance-wide table, and again on every remount.
//
// These pins hold the three properties that matter, and each is behavioural:
// concurrent callers collapse to one request, a completed read is reused, and a
// FAILING backend is not hammered — while never caching the failure as a fact
// about the data (LESSONS P23).
//
// PROVEN-TO-CATCH (DR-0076 §3): removing the in-flight share fails 'four mounts
// issue ONE request'; removing the cache fails the reuse case; removing the
// cooldown fails 'a sick backend is not hammered'; caching the error as a
// verdict fails 'a failure is not permanent'; and dropping invalidation on write
// fails the stale-consent case.
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

let calls = 0;
let nextResult = { data: [], error: null };

// The module exports the client BOTH as default and as a named `supabase`;
// the mock has to supply both or the import fails at load.
const client = {
    from: () => ({
      select: () => ({
        order: () => { calls += 1; return Promise.resolve(nextResult); },
      }),
      upsert: () => ({ select: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) }),
      update: () => ({ eq: () => Promise.resolve({ error: null }) }),
    }),
};
vi.mock('../lib/supabase.js', () => ({ default: client, supabase: client }));

const ROW = {
  id: 'v1', instance_id: 'i1', created_by: 'u1', person_key: 'darrell',
  display_name: 'Darrell', consent_state: 'granted', consent_scope: 'read-aloud-narration',
  entitlement: 'subscriber', provider_hint: 'sovereign-clone', ai_label: true,
  created_at: '2026-08-14T00:00:00Z',
};

let sync;
beforeEach(async () => {
  vi.resetModules();
  calls = 0;
  nextResult = { data: [ROW], error: null };
  sync = await import('../lib/voice-sync.js');
  sync.invalidateVoiceProfiles();
});
afterEach(() => { vi.useRealTimers(); });

describe('the fan-out collapses', () => {
  it('four simultaneous mounts issue ONE request', async () => {
    // This is the measured defect: four components, four requests.
    const results = await Promise.all([
      sync.loadVoiceProfiles(),
      sync.loadVoiceProfiles(),
      sync.loadVoiceProfiles(),
      sync.loadVoiceProfiles(),
    ]);
    expect(calls, 'concurrent callers must share one in-flight request').toBe(1);
    for (const r of results) {
      expect(r.error).toBeNull();
      expect(r.profiles).toHaveLength(1);
    }
  });

  it('a completed read is reused by a later mount', async () => {
    await sync.loadVoiceProfiles();
    await sync.loadVoiceProfiles();
    await sync.loadVoiceProfiles();
    expect(calls, 'a remount inside the cache window must not re-fetch').toBe(1);
  });

  it('every caller gets the real rows, not an empty stand-in', async () => {
    const a = await sync.loadVoiceProfiles();
    const b = await sync.loadVoiceProfiles();
    expect(b.profiles).toEqual(a.profiles);
    expect(b.profiles[0].personKey).toBe('darrell');
  });
});

describe('a sick backend is not hammered', () => {
  beforeEach(() => { nextResult = { data: null, error: { message: 'exceed_egress_quota', status: 402 } }; });

  it('does not re-request on every mount while the backend is failing', async () => {
    const first = await sync.loadVoiceProfiles();
    expect(first.error).toBeTruthy();
    await sync.loadVoiceProfiles();
    await sync.loadVoiceProfiles();
    await sync.loadVoiceProfiles();
    expect(calls, 'a restricted backend must not be re-hit by every mount').toBe(1);
  });

  it('still reports the failure honestly rather than a silent empty success', async () => {
    await sync.loadVoiceProfiles();
    const during = await sync.loadVoiceProfiles();
    expect(during.error, 'a cooldown must not read as success').toBeTruthy();
  });

  it('a failure is NOT permanent — it retries after the cooldown and self-heals', async () => {
    // LESSONS P23: an environmental failure is never stored as a fact about the
    // data. The cooldown delays the retry; it must never cancel it.
    vi.useFakeTimers();
    await sync.loadVoiceProfiles();
    expect(calls).toBe(1);
    vi.advanceTimersByTime(20_000); // past the cooldown
    nextResult = { data: [ROW], error: null };
    const healed = await sync.loadVoiceProfiles();
    expect(calls, 'the retry must actually happen').toBe(2);
    expect(healed.error).toBeNull();
    expect(healed.profiles).toHaveLength(1);
  });
});

describe('a write is never served from a stale cache', () => {
  it('enrolling invalidates, so the next read sees the change', async () => {
    await sync.loadVoiceProfiles();
    expect(calls).toBe(1);
    await sync.enrollMyVoice({ instanceId: 'i1', userId: 'u1', personKey: 'darrell' });
    await sync.loadVoiceProfiles();
    expect(calls, 'consent changed — the cache must not answer').toBe(2);
  });

  it('revoking invalidates, so withdrawn consent can never be served from cache', async () => {
    await sync.loadVoiceProfiles();
    await sync.revokeMyVoice('v1');
    await sync.loadVoiceProfiles();
    expect(calls, 'withdrawn consent must never come from a cache').toBe(2);
  });

  it('an explicit fresh read bypasses the cache', async () => {
    await sync.loadVoiceProfiles();
    await sync.loadVoiceProfiles({ fresh: true });
    expect(calls).toBe(2);
  });
});
