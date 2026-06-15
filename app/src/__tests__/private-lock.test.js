// Tests for the private-area gate decision — the NO-LOCKOUT logic is the point:
// the PIN gate is a local privacy convenience, never a wall between the
// authenticated owner and their own data. Pairs with the spec
// (2026-06-14-private-areas-pin-and-biometric-spec.md) + RELEASE-LANE.md.
import { describe, it, expect } from 'vitest';
import { privateGateState } from '../lib/private-lock.js';

const base = { pinStatusLoaded: true, hasPin: true, backendAvailable: true, unlocked: false };

describe('privateGateState (no-lockout gate)', () => {
  it('LOCKED only when a PIN exists, backend is up, and the session is not unlocked', () => {
    expect(privateGateState(base)).toBe('locked');
  });
  it('OPEN once unlocked for the session', () => {
    expect(privateGateState({ ...base, unlocked: true })).toBe('open');
  });
  it('OPEN when the user has no PIN (not gated)', () => {
    expect(privateGateState({ ...base, hasPin: false })).toBe('open');
  });
  it('OPEN when the PIN backend is unavailable (never block the owner)', () => {
    expect(privateGateState({ ...base, backendAvailable: false })).toBe('open');
  });
  it('LOADING until the PIN status is known (avoids flashing the gate)', () => {
    expect(privateGateState({ ...base, pinStatusLoaded: false })).toBe('loading');
  });
  it('unlocked wins even before the PIN status loads', () => {
    expect(privateGateState({ ...base, pinStatusLoaded: false, unlocked: true })).toBe('open');
  });
});
