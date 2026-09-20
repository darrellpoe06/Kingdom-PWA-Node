// @vitest-environment node
// =============================================================================
// Sign in to the television from the phone in your hand
// =============================================================================
// Darrell 2026-09-20: "I don't want to have to be fighting with the Fire Stick
// to then try to log in... I'd rather just be able to use a QR code."
//
// This gates the SECURITY CORE of that flow, because a device-login handover
// built carelessly is an account-takeover vector, not a convenience. The two
// codes carry different jobs and conflating them is the failure that matters:
// the SHORT one is shown on a screen anyone in the room can photograph, and
// the LONG one never leaves the television. Only the long one can collect a
// session. That split is what makes a photograph of the screen worthless.

import { describe, it, expect } from 'vitest';
import {
  CODE_ALPHABET, USER_CODE_LEN, DEVICE_CODE_BYTES, LINK_TTL_MS,
  newUserCode, newDeviceCode, formatUserCode, normalizeUserCode,
  qrTarget, linkState, isApprovable, shouldKeepPolling, stateMessage, STATE, LOOKALIKE,
} from '../lib/device-link.js';

const at = (ms) => new Date(ms).toISOString();

describe('the code a person reads off a television', () => {
  it('excludes every character pair that looks alike across a room', () => {
    // A code is read from a sofa and typed on a phone. O/0, I/1/L, 2/Z, 5/S
    // and 8/B are support calls waiting to happen — and worse, a person
    // retyping until something works.
    for (const bad of ['O', '0', 'I', '1', 'L', '2', 'Z', 'S', 'B']) {
      expect(CODE_ALPHABET, `alphabet contains the lookalike ${bad}`).not.toContain(bad);
    }
  });

  it('is the declared length, and drawn only from that alphabet', () => {
    for (let i = 0; i < 200; i += 1) {
      const c = newUserCode();
      expect(c).toHaveLength(USER_CODE_LEN);
      for (const ch of c) expect(CODE_ALPHABET).toContain(ch);
    }
  });

  it('is grouped for reading aloud', () => {
    expect(formatUserCode('ACDEFGHJ')).toBe('ACDE-FGHJ');
  });

  it('accepts a correct reading typed any plausible way', () => {
    // If a person reads the screen correctly and we still reject it, the bug
    // reads to them as "the code does not work".
    expect(normalizeUserCode('acde-fghj')).toBe('ACDEFGHJ');
    expect(normalizeUserCode('ACDE FGHJ')).toBe('ACDEFGHJ');
    expect(normalizeUserCode('ACDEFGHJ')).toBe('ACDEFGHJ');
  });

  it('maps a lookalike to what the reader meant, and DROPS what it cannot map', () => {
    // Mapping is a kindness; guessing is not. An unmappable character must
    // never be invented, or a typo silently addresses somebody else's link.
    expect(normalizeUserCode('OIZ000')).toBe('QJ3QQQ');
    expect(normalizeUserCode('AC!!DE')).toBe('ACDE');
    // S and B have no mapping BECAUSE 5 and 8 are not in the alphabet, so a
    // reader can never have seen one on screen to mistype.
    expect(normalizeUserCode('SB')).toBe('');
  });

  it('every lookalike maps to a character we can actually show', () => {
    // THE INVARIANT THAT CAUGHT A REAL BUG. The first version mapped S->5 and
    // B->8, and neither is in the alphabet — entries that read as handled
    // while silently dropping the character. A map whose targets are
    // unreachable is worse than no map: it looks like care.
    for (const [from, to] of Object.entries(LOOKALIKE)) {
      expect(CODE_ALPHABET, `${from} maps to ${to}, which we can never display`).toContain(to);
      expect(CODE_ALPHABET, `${from} is BOTH in the alphabet and mapped away`).not.toContain(from);
    }
  });

  it('never returns more than one code worth of characters', () => {
    expect(normalizeUserCode('ACDEFGHJACDEFGHJ')).toHaveLength(USER_CODE_LEN);
  });
});

describe('the secret the television keeps', () => {
  it('is long, hex, and never the short code', () => {
    const d = newDeviceCode();
    expect(d).toHaveLength(DEVICE_CODE_BYTES * 2);
    expect(d).toMatch(/^[0-9a-f]+$/);
  });

  it('does not repeat', () => {
    const seen = new Set();
    for (let i = 0; i < 300; i += 1) seen.add(newDeviceCode());
    expect(seen.size).toBe(300);
  });

  it('REFUSES to generate without real randomness, rather than weakening', () => {
    // The one failure that would turn this whole flow into a guessable session
    // handover. Falling back to Math.random here would be catastrophic and
    // completely invisible, so it throws instead.
    expect(() => newDeviceCode({})).toThrow(/secure randomness/);
    expect(() => newUserCode({})).toThrow(/secure randomness/);
  });
});

describe('the state machine decides once, for everybody', () => {
  const now = 1_000_000;
  const live = { expires_at: at(now + LINK_TTL_MS) };

  it('a fresh row is pending and approvable', () => {
    expect(linkState(live, now)).toBe(STATE.PENDING);
    expect(isApprovable(live, now)).toBe(true);
    expect(shouldKeepPolling(STATE.PENDING)).toBe(true);
  });

  it('approved needs BOTH a timestamp and a user', () => {
    // An approved_at with no user_id is a half-written row, and treating it as
    // approved would hand a session to nobody in particular.
    expect(linkState({ ...live, approved_at: at(now) }, now)).toBe(STATE.PENDING);
    expect(linkState({ ...live, approved_at: at(now), user_id: 'u1' }, now)).toBe(STATE.APPROVED);
  });

  it('CONSUMED outranks approved — a one-time code stays one-time', () => {
    // The ordering that stops a used code handing out a second session.
    const row = { ...live, approved_at: at(now), user_id: 'u1', consumed_at: at(now) };
    expect(linkState(row, now)).toBe(STATE.CONSUMED);
    expect(isApprovable(row, now)).toBe(false);
    expect(shouldKeepPolling(STATE.CONSUMED)).toBe(false);
  });

  it('EXPIRED outranks approved — a late approval is not an approval', () => {
    const row = { expires_at: at(now), approved_at: at(now + 1), user_id: 'u1' };
    expect(linkState(row, now + 5000)).toBe(STATE.EXPIRED);
    expect(isApprovable(row, now + 5000)).toBe(false);
  });

  it('expiry is exact at the boundary, not a second either side', () => {
    expect(linkState({ expires_at: at(now) }, now - 1)).toBe(STATE.PENDING);
    expect(linkState({ expires_at: at(now) }, now)).toBe(STATE.EXPIRED);
  });

  it('a denial stops the television asking', () => {
    const row = { ...live, denied_at: at(now) };
    expect(linkState(row, now)).toBe(STATE.DENIED);
    expect(shouldKeepPolling(STATE.DENIED)).toBe(false);
  });

  it('garbage, a missing row and an unparseable date are never approved', () => {
    expect(linkState(null, now)).toBe(STATE.UNKNOWN);
    expect(linkState('nope', now)).toBe(STATE.UNKNOWN);
    // An unreadable expiry must not read as "never expires" AND must not read
    // as approved on its own.
    expect(linkState({ expires_at: 'not-a-date' }, now)).toBe(STATE.PENDING);
  });

  it('every state has a sentence a person on a sofa can act on', () => {
    for (const s of Object.values(STATE)) {
      const m = stateMessage(s);
      expect(m.length, `no message for ${s}`).toBeGreaterThan(10);
      expect(m, `${s} message leaks jargon`).not.toMatch(/null|undefined|error code/i);
    }
  });
});

describe('the QR points where the phone can finish the job', () => {
  it('targets the link page with the readable code', () => {
    expect(qrTarget('https://poetech.us', 'ACDEFGHJ')).toBe('https://poetech.us/link?c=ACDE-FGHJ');
  });

  it('tolerates a trailing slash on the origin', () => {
    expect(qrTarget('https://poetech.us/', 'ACDEFGHJ')).toBe('https://poetech.us/link?c=ACDE-FGHJ');
  });

  it('carries ONLY the short code — never the secret', () => {
    // The QR is photographable by anyone in the room. If the device_code ever
    // rode in it, the whole two-secret design would collapse.
    const url = qrTarget('https://poetech.us', 'ACDEFGHJ');
    expect(url).not.toMatch(/[0-9a-f]{32,}/);
    expect(url.length).toBeLessThan(80);
  });
});
