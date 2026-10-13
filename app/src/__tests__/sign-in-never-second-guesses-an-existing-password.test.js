// =============================================================================
// A raised password minimum must never lock out the accounts that predate it
// =============================================================================
// Christina, 2026-09-14, relayed by Darrell: "I can't get into the app on my Mac
// book." Her screen showed, under a password she was typing correctly:
//
//   Password must be at least 8 characters.
//
// Both sign-up and sign-in called validateCredentials, so the SIGNUP minimum
// decided whether an EXISTING password was allowed to be tried. Her account's
// password is six characters -- set when the minimum was lower, which the
// phone+PIN path in the same file documents ("Minimum password length must be
// <= 6 ... 6 is the Supabase default"). The check ran before the network call,
// so the server was never asked and the answer could never change. She was not
// failing to authenticate. She was being refused the attempt, by her own app,
// permanently, by a message that read as her mistake.
//
// The rule these pin: a client may judge credential STRENGTH where a credential
// is CREATED, and on sign-in may judge only whether there is something to send.
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: vi.fn(async (args) => ({ data: { session: { user: { id: 'u1' } } }, error: null, args })),
      signUp: vi.fn(async () => ({ data: { session: null }, error: null })),
      getSession: vi.fn(async () => ({ data: { session: null } })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe() {} } } })),
    },
    from: vi.fn(),
    rpc: vi.fn(),
  }),
}));

let mod;
beforeEach(async () => { mod = await import('../lib/supabase.js'); });

describe('signing in with a password shorter than the signup minimum', () => {
  it('THE REPORTED CASE: a six-character password is sent, not refused', async () => {
    const res = await mod.signInWithPassword('Mrspoe06@gmail.com', 'abc123');
    expect(res.error, 'the client refused a password it should have sent').toBeFalsy();
    expect(res.data.session).toBeTruthy();
  });

  it('validateSignIn accepts a short password and passes the address through', () => {
    const v = mod.validateSignIn('  Mrspoe06@gmail.com  ', 'abc123');
    expect(v.error).toBeUndefined();
    expect(v.email).toBe('Mrspoe06@gmail.com');
  });

  it('but still refuses an empty secret -- there is nothing to send', () => {
    expect(mod.validateSignIn('a@b.com', '').error.message).toBe('Please enter your password.');
    expect(mod.validateSignIn('a@b.com', null).error.message).toBe('Please enter your password.');
  });

  it('and still refuses a malformed address', () => {
    expect(mod.validateSignIn('not-an-address', 'abc123').error.message)
      .toBe('Please enter a valid email address.');
  });

  it('never mentions a length on the sign-in path -- a length message reads as the user\'s mistake', () => {
    for (const pw of ['a', 'abc', 'abc12', 'abc123', 'abc1234']) {
      const v = mod.validateSignIn('a@b.com', pw);
      expect(v.error, `sign-in rejected a ${pw.length}-character password`).toBeUndefined();
    }
  });
});

describe('signing UP still demands a strong credential', () => {
  it('because that is where a credential is created', () => {
    expect(mod.validateCredentials('a@b.com', 'abc123').error.message)
      .toBe('Password must be at least 8 characters.');
    expect(mod.validateCredentials('a@b.com', 'abcd1234').error).toBeUndefined();
  });

  it('and signUpWithPassword refuses the short one before the network', async () => {
    const res = await mod.signUpWithPassword('a@b.com', 'abc123', 'A Person');
    expect(res.error.message).toBe('Password must be at least 8 characters.');
  });
});

describe('the form routes each path to its own rule', () => {
  it('PasswordAuth validates sign-in with validateSignIn and sign-up with validateCredentials', async () => {
    const { readFileSync } = await import('node:fs');
    const { join, dirname } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const src = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '../components/PasswordAuth.jsx'), 'utf8');
    // Source-pinned because the two library functions are correct in isolation
    // and the defect was the FORM calling the wrong one -- the inert-but-correct
    // class. A render test here would need the whole auth provider.
    expect(src).toMatch(/isSignup\s*\n?\s*\?\s*validateCredentials\(/);
    expect(src).toMatch(/:\s*validateSignIn\(/);
  });
});

describe('PROVEN-TO-CATCH -- the shape that locked her out fails these', () => {
  const preFix = (email, password) => {
    const e = (email || '').trim();
    if (!e || !e.includes('@')) return { error: { message: 'Please enter a valid email address.' } };
    if (!password || password.length < 8) return { error: { message: 'Password must be at least 8 characters.' } };
    return { email: e };
  };

  it('the old shared validator refuses her real password, before any network call', () => {
    expect(preFix('Mrspoe06@gmail.com', 'abc123').error.message)
      .toBe('Password must be at least 8 characters.');
    expect(mod.validateSignIn('Mrspoe06@gmail.com', 'abc123').error).toBeUndefined();
  });

  it('and it locks out every account whose password predates the raised minimum', () => {
    const existing = ['abc123', '123456', 'pin999', 'short1'];
    expect(existing.every((p) => Boolean(preFix('a@b.com', p).error))).toBe(true);
    expect(existing.every((p) => !mod.validateSignIn('a@b.com', p).error)).toBe(true);
  });
});
