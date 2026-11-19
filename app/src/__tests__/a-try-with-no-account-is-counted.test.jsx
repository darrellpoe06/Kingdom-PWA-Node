// =============================================================================
// A try with no account is counted, not kept (DR-1593)
// =============================================================================
// Darrell 2026-11-19: "how do we help people when they have onboarding
// issues?!!!!! We should be able to see these issues from our data logs!!!"
// A person who keeps signing in with an address that has no account left no
// row anywhere: the auth server says "Invalid login credentials" for both, and
// the password hook only fires for an account that exists. These pin that the
// app hands the address it tried to the counter after exactly that answer, and
// that the screen says what the counter found without ever showing an address.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { missesView, signInCoverage } from '../lib/person-onboarding.js';

const S = vi.hoisted(() => ({ answer: null, rpc: [] }));
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: vi.fn(async () => S.answer),
      getSession: vi.fn(async () => ({ data: { session: null } })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe() {} } } })),
    },
    from: vi.fn(),
    rpc: vi.fn((fn, args) => {
      S.rpc.push({ fn, args });
      return Promise.resolve({ data: null, error: null });
    }),
  }),
}));

let mod;
beforeEach(async () => {
  S.rpc = [];
  mod = await import('../lib/supabase.js');
});
const flush = async () => {
  for (let i = 0; i < 4; i += 1) await Promise.resolve();
};

describe('the app counts a try only after "Invalid login credentials"', () => {
  it('a phone + PIN try with the wrong answer hands the address it tried to the counter', async () => {
    S.answer = { data: { session: null }, error: { code: 'invalid_credentials', message: 'Invalid login credentials' } };
    await mod.signInWithPhonePin('(555) 555-0142', '123456');
    await flush();
    expect(S.rpc).toEqual([{ fn: 'note_sign_in_miss', args: { p_login: '15555550142@phone.poetech.us' } }]);
  });

  it('an email + password try with the wrong answer does the same', async () => {
    S.answer = { data: { session: null }, error: { status: 400, message: 'Invalid login credentials' } };
    await mod.signInWithPassword('Someone@Example.org', 'whatever1');
    await flush();
    expect(S.rpc.map((r) => r.fn)).toEqual(['note_sign_in_miss']);
    expect(S.rpc[0].args.p_login.toLowerCase()).toBe('someone@example.org');
  });

  it('PROVEN TO CATCH: a success, or any other failure, counts nothing', async () => {
    S.answer = { data: { session: { user: { id: 'u' } } }, error: null };
    await mod.signInWithPassword('someone@example.org', 'whatever1');
    S.answer = { data: { session: null }, error: { status: 0, message: 'Failed to fetch' } };
    await mod.signInWithPhonePin('5555550142', '123456');
    S.answer = { data: { session: null }, error: { code: 'email_not_confirmed', message: 'Email not confirmed' } };
    await mod.signInWithPassword('someone@example.org', 'whatever1');
    await flush();
    expect(S.rpc).toEqual([]);
  });

  it('the counter can never break a sign-in', () => {
    const throwing = {
      rpc: () => {
        throw new Error('down');
      },
    };
    expect(() => mod.noteSignInMiss('a@b.org', throwing)).not.toThrow();
    const rejecting = { rpc: () => Promise.reject(new Error('down')) };
    expect(() => mod.noteSignInMiss('a@b.org', rejecting)).not.toThrow();
    expect(mod.isWrongCredentials(null)).toBe(false);
  });
});

describe('what the screen says about tries with no account (pure)', () => {
  const NOW = Date.parse('2026-11-19T18:00:00Z');
  const A = (h) => new Date(NOW - h * 3600000).toISOString();

  it('each hint with its tries and time, and the invitation it matches', () => {
    const v = missesView(
      {
        enabled: true,
        meter: { dropped_24h: 0 },
        misses: [
          { hint: 'phone ending 0142', tries: 3, days: 2, last_at: A(30), invite: { display_name: 'Invited Tenant', role_label: 'tenant' } },
          { hint: 'c…@example.org', tries: 1, days: 1, last_at: A(2) },
        ],
      },
      NOW
    );
    expect(v.entries.map((e) => e.text)).toEqual([
      '3 sign-in tries with an address that has no account (last yesterday, on 2 days). It is the address Invited Tenant was invited to Poe Properties with as tenant: they are trying to sign in before making an account.',
      '1 sign-in try with an address that has no account (last today).',
    ]);
    expect(v.status).toBe('');
    // The hint is all there is: no address is ever in what the screen holds.
    expect(JSON.stringify(v)).not.toMatch(/\d{7,}/);
  });

  it('says when the counter is off, or its limit dropped tries', () => {
    expect(missesView({ enabled: false, misses: [] }, NOW).status).toBe('Counting tries with no account is switched off.');
    expect(missesView({ enabled: true, meter: { dropped_24h: 5 }, misses: [] }, NOW).status).toBe(
      'The hourly limit was reached in the last 24 hours; 5 tries were not counted.'
    );
    expect(missesView(null, NOW)).toEqual({ entries: [], status: '' });
  });

  it('the coverage note now says these tries are counted, and what still is not', () => {
    const c = signInCoverage({ gotrue_audit: 'read' });
    expect(c).toContain('Not recorded: a wrong or expired Royalty Link code.');
    expect(c).toContain('counted under a masked hint (the address itself is never kept)');
  });
});
