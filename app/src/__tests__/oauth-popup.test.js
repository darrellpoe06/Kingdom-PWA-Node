// =============================================================================
// oauth-popup — popup Google sign-in helper (Verification Doctrine: prove the
// no-lockout fallback ACTUALLY fires, and the popup callback signals + closes).
// All injected (client + window), network-free.
// =============================================================================
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { signInWithGooglePopup, completeOAuthPopup, OAUTH_POPUP_PARAM } from '../lib/oauth-popup.js';

function makeClient(sessionAfter) {
  return {
    auth: {
      signInWithOAuth: vi.fn(async () => ({ data: { url: 'https://accounts.google.test/o/oauth2/auth' }, error: null })),
      refreshSession: vi.fn(async () => ({ data: { session: sessionAfter }, error: null })),
      getSession: vi.fn(async () => ({ data: { session: sessionAfter } })),
    },
  };
}

function makeWin({ popup, openImpl } = {}) {
  return {
    location: { origin: 'https://app.test', pathname: '/poetech-app/' },
    open: openImpl || vi.fn(() => popup),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    innerWidth: 1200,
    innerHeight: 800,
    screenX: 0,
    screenY: 0,
  };
}

describe('signInWithGooglePopup', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('opens the OAuth URL in a popup with the ?oauth_popup=1 redirect, no full-page redirect', async () => {
    const client = makeClient({ user: { id: 'u1' } });
    const popup = { closed: true, focus() {}, close: vi.fn() };
    const win = makeWin({ popup });
    const p = signInWithGooglePopup({ client, win });
    await vi.advanceTimersByTimeAsync(600);
    await p;
    expect(client.auth.signInWithOAuth).toHaveBeenCalledTimes(1);
    const arg = client.auth.signInWithOAuth.mock.calls[0][0];
    expect(arg.provider).toBe('google');
    expect(arg.options.skipBrowserRedirect).toBe(true);
    expect(arg.options.redirectTo).toContain(`${OAUTH_POPUP_PARAM}=1`);
    expect(win.open).toHaveBeenCalledTimes(1);
  });

  it('resolves { ok: true } once the popup has signed in (session present)', async () => {
    const client = makeClient({ user: { id: 'u1' } });
    const popup = { closed: true, focus() {}, close: vi.fn() };
    const p = signInWithGooglePopup({ client, win: makeWin({ popup }) });
    await vi.advanceTimersByTimeAsync(600);
    expect(await p).toEqual({ ok: true });
  });

  it('resolves { cancelled: true } when the popup closed with no session (no lockout — caller stays put)', async () => {
    const client = makeClient(null);
    const popup = { closed: true, focus() {}, close: vi.fn() };
    const p = signInWithGooglePopup({ client, win: makeWin({ popup }) });
    await vi.advanceTimersByTimeAsync(600);
    expect(await p).toEqual({ cancelled: true });
  });

  it('reports { blocked, url } when the popup is blocked — so the caller can fall back to a redirect', async () => {
    const client = makeClient(null);
    const win = makeWin({ openImpl: vi.fn(() => null) });
    const res = await signInWithGooglePopup({ client, win });
    expect(res.blocked).toBe(true);
    expect(res.url).toContain('google');
  });

  it('reports { unsupported } when window.open is unavailable', async () => {
    const res = await signInWithGooglePopup({ client: makeClient(null), win: { location: { origin: 'x', pathname: '/' } } });
    expect(res.unsupported).toBe(true);
  });

  it('reports { error } when the provider URL cannot be obtained (caller falls back)', async () => {
    const client = makeClient(null);
    client.auth.signInWithOAuth = vi.fn(async () => ({ data: null, error: { message: 'provider not enabled' } }));
    const res = await signInWithGooglePopup({ client, win: makeWin({ popup: { closed: false } }) });
    expect(res.error).toBeTruthy();
    expect(res.error.message).toMatch(/provider not enabled/);
  });
});

describe('completeOAuthPopup (runs inside the popup)', () => {
  it('signals the opener that sign-in succeeded and closes the popup', async () => {
    const client = makeClient({ user: { id: 'u1' } });
    const postMessage = vi.fn();
    const close = vi.fn();
    const win = {
      location: { origin: 'https://app.test', pathname: '/poetech-app/' },
      opener: { closed: false, postMessage },
      close,
    };
    const signedIn = await completeOAuthPopup({ client, win });
    expect(signedIn).toBe(true);
    expect(postMessage).toHaveBeenCalledWith({ type: 'poetech-oauth', ok: true }, 'https://app.test');
    expect(close).toHaveBeenCalled();
  });

  it('signals ok:false when no session landed (the opener poll still resolves cleanly)', async () => {
    const client = makeClient(null);
    const postMessage = vi.fn();
    const win = {
      location: { origin: 'https://app.test', pathname: '/poetech-app/' },
      opener: { closed: false, postMessage },
      close: vi.fn(),
    };
    expect(await completeOAuthPopup({ client, win })).toBe(false);
    expect(postMessage).toHaveBeenCalledWith({ type: 'poetech-oauth', ok: false }, 'https://app.test');
  });

  it('does not throw when there is no opener (manually opened / opener gone)', async () => {
    const client = makeClient({ user: { id: 'u1' } });
    const win = { location: { origin: 'https://app.test', pathname: '/p/' }, opener: null, close: vi.fn() };
    await expect(completeOAuthPopup({ client, win })).resolves.toBe(true);
  });
});
