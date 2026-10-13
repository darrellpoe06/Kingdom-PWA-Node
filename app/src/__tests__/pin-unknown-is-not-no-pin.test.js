// =============================================================================
// pin-unknown-is-not-no-pin — a failed PIN read never opens the SET-PIN gate
// =============================================================================
// 2026-09-07 17:04 CDT, Darrell's tablet: "Secure your space" (SET-PIN) on
// every tab, "keeps signing me in on every tab", while the sovereign box held
// his PIN row and has_user_pin() measured TRUE for his door as PostgREST
// evaluates it (nas-health run 34166201488). The function was fine. The CALL
// was failing above postgres — the shape of a tab whose access token expired
// during a cross-tab refresh (401) — and lib/pin.js mapped that error to
// hasPin:false with backendAvailable:true, which decideAccess reads as "never
// set a PIN" and answers with the SET gate. Every tab. Chrome then offered his
// saved phone password over the New PIN box.
//
// The rule this pins: a read that ERRORS is UNKNOWN, and unknown degrades the
// same way a timeout already does — backendAvailable:false, identity keeps
// the door open (no-lockout). Only a real true/false may steer the gate.
// PROVEN-TO-CATCH: the first assertion fails on the shipped pin.js (hasPin
// false + backendAvailable true on a 401), verified before the change.
import { describe, it, expect, vi, beforeEach } from 'vitest';

const rpc = vi.fn();
vi.mock('../lib/supabase.js', () => ({ default: { rpc: (...a) => rpc(...a) } }));

const { hasUserPin } = await import('../lib/pin.js');
const { decideAccess, NEXT_STEP } = await import('../lib/multi-point-auth.js');

beforeEach(() => { rpc.mockReset(); vi.spyOn(console, 'warn').mockImplementation(() => {}); });

describe('hasUserPin: an error is unknown, not "no PIN"', () => {
  it('a 401 (expired token on this tab) degrades to backendAvailable:false', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: '401', message: 'JWT expired' } });
    const r = await hasUserPin();
    expect(r.hasPin).toBe(false);
    expect(r.backendAvailable).toBe(false);
    expect(r.error).toBeTruthy();
  });

  it('a 5xx or proxy error degrades the same way', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: '502', message: 'upstream unreachable' } });
    expect((await hasUserPin()).backendAvailable).toBe(false);
  });

  it('a REAL answer still steers the gate: true is true, false is false', async () => {
    rpc.mockResolvedValue({ data: true, error: null });
    expect(await hasUserPin()).toEqual({ hasPin: true, backendAvailable: true });
    rpc.mockResolvedValue({ data: false, error: null });
    expect(await hasUserPin()).toEqual({ hasPin: false, backendAvailable: true });
  });
});

describe('the gate decision on a failed read', () => {
  it('a signed-in person whose PIN read failed is NOT sent to SET-PIN', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: '401', message: 'JWT expired' } });
    const h = await hasUserPin();
    const d = decideAccess({ identityPresent: true, hasPin: h.hasPin, backendAvailable: h.backendAvailable });
    expect(d.nextStep).not.toBe(NEXT_STEP.SET_PIN);
    expect(d.granted).toBe(true);
    expect(d.degraded).toBe(true);
  });

  it('the old mapping (error -> hasPin:false, backend up) DID send them to SET-PIN — the defect, pinned', () => {
    const d = decideAccess({ identityPresent: true, hasPin: false, backendAvailable: true });
    expect(d.nextStep).toBe(NEXT_STEP.SET_PIN);
  });
});
