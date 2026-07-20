// @vitest-environment node
//
// pin.js callRpc deadline (Darrell 2026-07-19 blank-Books root cause). The shared
// supabase client awaits getSession() before every call, which waits on a
// cross-tab navigator lock; a wedged PoeTech tab holds it and supabase.rpc never
// settles. A PIN check that never settles blanks the whole private area
// (PrivateGate renders null while "loading"). callRpc now caps every PIN RPC so a
// hang degrades to backendAvailable:false (no-lockout), never an infinite hang.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const rpc = vi.fn();
vi.mock('../lib/supabase.js', () => ({ default: { rpc: (...a) => rpc(...a) } }));

import { hasUserPin } from '../lib/pin.js';

describe('pin callRpc — a hung RPC degrades to no-lockout, never hangs forever', () => {
  beforeEach(() => { vi.useFakeTimers(); rpc.mockReset(); });
  afterEach(() => vi.useRealTimers());

  it('hasUserPin resolves backendAvailable:false when the RPC never settles', async () => {
    rpc.mockReturnValue(new Promise(() => {})); // wedged auth lock: never settles
    const p = hasUserPin();
    await vi.advanceTimersByTimeAsync(8001);
    await expect(p).resolves.toEqual({ hasPin: false, backendAvailable: false });
  });

  it('a normal fast response is unaffected (real hasPin still reported)', async () => {
    rpc.mockResolvedValue({ data: true, error: null });
    await expect(hasUserPin()).resolves.toEqual({ hasPin: true, backendAvailable: true });
  });
});
