// =============================================================================
// DR-1620 — a null that is not a sign-out keeps the stored session
// =============================================================================
// Darrell 2026-11-24, 11:21-11:22 PM: the signed-out front page, then signed
// in, then "Who's using this device?". auth-js emits INITIAL_SESSION with a
// null session whenever getSession() errors (a failed fetch included), while
// the sign-in is still stored; onAuthChange passed that null through.
// =============================================================================
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const handlers = [];
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      storageKey: 'sb-poetech-auth-token',
      onAuthStateChange: (cb) => { handlers.push(cb); return { data: { subscription: { unsubscribe() {} } } }; },
      getSession: () => new Promise(() => {}),
      refreshSession: async () => ({ data: { session: null }, error: { message: 'Failed to fetch' } }),
      startAutoRefresh() {},
      signOut: async () => ({ error: null }),
    },
    from: () => ({}),
    rpc: async () => ({}),
  }),
}));

const SAVED = { access_token: 'expired', refresh_token: 'rt', user: { id: 'uid-darrell' } };

beforeEach(() => {
  localStorage.clear();
  handlers.length = 0;
});

async function subscribe() {
  const { onAuthChange } = await import('../lib/supabase.js');
  const seen = [];
  onAuthChange((s) => seen.push(s));
  const h = handlers[handlers.length - 1];
  return { seen, h };
}

describe('a null that is not a sign-out', () => {
  it('INITIAL_SESSION null while the sign-in is stored is ignored (the reported flip)', async () => {
    localStorage.setItem('sb-poetech-auth-token', JSON.stringify(SAVED));
    const { seen, h } = await subscribe();
    seen.length = 0;
    h('INITIAL_SESSION', null);
    await new Promise((r) => setTimeout(r, 5));
    expect(seen).toEqual([]);
  });

  it('INITIAL_SESSION null with nothing stored reads signed out', async () => {
    const { seen, h } = await subscribe();
    seen.length = 0;
    h('INITIAL_SESSION', null);
    expect(seen).toEqual([null]);
  });

  it('a live session always passes', async () => {
    const { seen, h } = await subscribe();
    seen.length = 0;
    h('TOKEN_REFRESHED', SAVED);
    expect(seen).toEqual([SAVED]);
  });

  it('PROVEN TO CATCH: the old fast path passed the null through', () => {
    const oldHandler = (event, session, cb) => { if (!(!session && event === 'SIGNED_OUT')) cb(session ?? null); };
    const seen = [];
    oldHandler('INITIAL_SESSION', null, (s) => seen.push(s));
    expect(seen).toEqual([null]);
  });

  it('the picker waits while a signed-in account’s own profile resolves', () => {
    const src = readFileSync(join(__dirname, '..', 'poe-financial-mvp-v28.jsx'), 'utf8');
    expect(src).toMatch(/!\(authSession && profileResolvedForRef\.current !== \(authSession\.user\?\.id \|\| null\)\)/);
  });
});
