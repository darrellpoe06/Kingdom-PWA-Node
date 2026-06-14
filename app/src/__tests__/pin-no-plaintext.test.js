// PIN never leaves plaintext anywhere it could persist or be logged — 2026-06-14.
// The PIN is hashed SERVER-SIDE (migration 0022, pgcrypto bcrypt). The client
// may only transmit it over TLS to the RPC; it must NEVER be written to
// localStorage / sessionStorage, and NEVER passed to console. These tests lock
// that contract by spying on every storage + console sink while driving pin.js.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Intercept the supabase client so no network happens and we can observe the
// exact RPC args. Default export + named `supabase` both point at the mock.
// vi.hoisted lets the factory (which is hoisted above imports) reach rpcMock.
const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }));
vi.mock('../lib/supabase.js', () => {
  const client = { rpc: rpcMock };
  return { __esModule: true, default: client, supabase: client };
});

import {
  setUserPin, verifyUserPin, hasUserPin, isValidPinFormat,
  setPersonaPin, verifyPersonaPin,
} from '../lib/pin.js';

const SECRET_PIN = '825193';
const SECRET_PERSONA_PIN = '4471';

function storageDump() {
  const out = [];
  for (const store of [window.localStorage, window.sessionStorage]) {
    for (let i = 0; i < store.length; i++) {
      const k = store.key(i);
      out.push(k + '=' + store.getItem(k));
    }
  }
  return out.join('\n');
}

let logged = [];
let warnSpy, logSpy, errSpy, infoSpy, debugSpy;

beforeEach(() => {
  rpcMock.mockReset();
  window.localStorage.clear();
  window.sessionStorage.clear();
  logged = [];
  const sink = (...a) => { logged.push(a.map(String).join(' ')); };
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(sink);
  logSpy = vi.spyOn(console, 'log').mockImplementation(sink);
  errSpy = vi.spyOn(console, 'error').mockImplementation(sink);
  infoSpy = vi.spyOn(console, 'info').mockImplementation(sink);
  debugSpy = vi.spyOn(console, 'debug').mockImplementation(sink);
});

afterEach(() => {
  warnSpy.mockRestore(); logSpy.mockRestore(); errSpy.mockRestore();
  infoSpy.mockRestore(); debugSpy.mockRestore();
});

describe('isValidPinFormat', () => {
  it('accepts 4–8 digit PINs', () => {
    expect(isValidPinFormat('1234')).toBe(true);
    expect(isValidPinFormat('82519370')).toBe(true);
  });
  it('rejects non-digits, wrong length, and single repeated digit', () => {
    expect(isValidPinFormat('12a4')).toBe(false);
    expect(isValidPinFormat('123')).toBe(false);
    expect(isValidPinFormat('123456789')).toBe(false);
    expect(isValidPinFormat('0000')).toBe(false);
    expect(isValidPinFormat('')).toBe(false);
    expect(isValidPinFormat(null)).toBe(false);
  });
});

describe('PIN is never persisted in plaintext or logged', () => {
  it('setUserPin: PIN goes ONLY into the RPC args, never to storage or console', async () => {
    rpcMock.mockResolvedValue({ data: { ok: true }, error: null });
    const r = await setUserPin(SECRET_PIN);
    expect(r.ok).toBe(true);

    // It IS sent to the server RPC (over TLS) — that's the whole point.
    expect(rpcMock).toHaveBeenCalledWith('set_user_pin', { pin: SECRET_PIN });

    // It is NOT in any browser storage.
    expect(storageDump()).not.toContain(SECRET_PIN);
    // It is NOT in anything we logged.
    expect(logged.join('\n')).not.toContain(SECRET_PIN);
  });

  it('verifyUserPin: failure path logs NOTHING containing the PIN', async () => {
    rpcMock.mockResolvedValue({ data: { ok: false, attempts_remaining: 3 }, error: null });
    const r = await verifyUserPin(SECRET_PIN);
    expect(r.ok).toBe(false);
    expect(r.attemptsRemaining).toBe(3);
    expect(storageDump()).not.toContain(SECRET_PIN);
    expect(logged.join('\n')).not.toContain(SECRET_PIN);
  });

  it('verifyUserPin: RPC error path logs metadata only (no PIN echo)', async () => {
    rpcMock.mockResolvedValue({ data: null, error: { code: 'XX000', message: 'boom' } });
    await verifyUserPin(SECRET_PIN);
    const all = logged.join('\n');
    expect(all).not.toContain(SECRET_PIN);
  });

  it('persona PIN: same guarantee through set + verify', async () => {
    rpcMock.mockResolvedValue({ data: { ok: true }, error: null });
    await setPersonaPin('inst-1', 'darrell', SECRET_PERSONA_PIN);
    rpcMock.mockResolvedValue({ data: { ok: false, locked: true, retry_after_seconds: 30 }, error: null });
    const v = await verifyPersonaPin('inst-1', 'darrell', SECRET_PERSONA_PIN);
    expect(v.locked).toBe(true);
    expect(storageDump()).not.toContain(SECRET_PERSONA_PIN);
    expect(logged.join('\n')).not.toContain(SECRET_PERSONA_PIN);
  });

  it('format-invalid PIN never reaches the RPC at all', async () => {
    const r = await setUserPin('0000'); // single repeated digit
    expect(r.ok).toBe(false);
    expect(rpcMock).not.toHaveBeenCalled();
  });
});

describe('graceful degradation (no-lockout) on missing RPC', () => {
  it('hasUserPin reports backendAvailable:false when the function is absent', async () => {
    rpcMock.mockResolvedValue({ data: null, error: { code: 'PGRST202', message: 'Could not find the function' } });
    const r = await hasUserPin();
    expect(r.backendAvailable).toBe(false);
    expect(r.hasPin).toBe(false);
  });

  it('verifyUserPin reports backendAvailable:false when the function is absent', async () => {
    rpcMock.mockResolvedValue({ data: null, error: { code: 'PGRST202', message: 'Could not find the function set_user_pin' } });
    const r = await verifyUserPin(SECRET_PIN);
    expect(r.backendAvailable).toBe(false);
    expect(r.ok).toBe(false);
  });
});
