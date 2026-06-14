// =============================================================================
// AuthBanner — sign-in strip above the title bar
// =============================================================================
// Renders one of three states:
//   1. Signed out, collapsed:  "Sign in to sync across devices →"
//   2. Signed out, expanded:   inline email input + "Send magic link" button
//   3. Signed in:              "Signed in as foo@example.com · Sign out"
//
// Uses the auth helpers from app/src/lib/supabase.js. Persists no state
// itself — the supabase client persists the session in localStorage, and
// onAuthChange feeds session updates back here.
//
// Style matches the existing app's "Projections, not promises" strip
// directly above it (bg-[#1A1815], text-[#FAF8F4], tracking-[0.2em],
// uppercase 10px copy). Sticks at top:0 z-30 so it stays above the
// already-sticky header (which is z-20).
// =============================================================================

import React, { useEffect, useState } from 'react';
import { onAuthChange, sendRoyaltyLink, signOut, signInWithGoogle, signInWithApple } from '../lib/supabase.js';
// 2026-06-14 (multi-point auth P1): Google + Apple SSO buttons surfaced again.
// Both providers require one-time dashboard/Apple-Developer config; until that
// lands they return a "provider not enabled" error which we show inline. The
// email Royalty Link path always works, so there is no sign-in lockout.

export default function AuthBanner() {
  const [session, setSession] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'sending' | 'sent' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // onAuthChange fires immediately with the current session, so we don't
    // need a separate getSession() call here.
    const unsubscribe = onAuthChange((s) => setSession(s));
    return unsubscribe;
  }, []);

  async function handleSend(e) {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');
    const { error } = await sendRoyaltyLink(email);
    if (error) {
      setStatus('error');
      setErrorMsg(error.message || 'Could not send the link. Try again in a minute.');
    } else {
      setStatus('sent');
    }
  }

  async function handleOAuth(provider) {
    setErrorMsg('');
    const fn = provider === 'apple' ? signInWithApple : signInWithGoogle;
    const { error } = await fn();
    if (error) {
      setStatus('error');
      setErrorMsg(error.message || `${provider === 'apple' ? 'Apple' : 'Google'} sign-in isn’t available right now — try the email link.`);
    }
  }

  async function handleSignOut() {
    await signOut();
    // onAuthChange will fire with null; resetting local UI here so the
    // banner collapses back to the "Sign in" prompt immediately.
    setExpanded(false);
    setEmail('');
    setStatus('idle');
    setErrorMsg('');
  }

  const userEmail = session?.user?.email;

  return (
    <div className="bg-[#1A1815] text-[#FAF8F4] text-[10px] uppercase tracking-[0.2em] px-3 py-1.5 print:hidden border-t border-[#3A2A24]">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 flex-wrap">
        {/* SIGNED-IN STATE ------------------------------------------------- */}
        {userEmail && (
          <>
            <span aria-label="Sync status">
              <span className="text-[#5A6E3D]">●</span> Signed in as{' '}
              <span className="normal-case tracking-normal font-mono">{userEmail}</span>
            </span>
            <span className="text-[#5A5751]">·</span>
            <button
              type="button"
              onClick={handleSignOut}
              className="underline hover:text-[#B85838] focus:outline-none focus:text-[#B85838]"
            >
              Sign out
            </button>
          </>
        )}

        {/* SIGNED-OUT, COLLAPSED ------------------------------------------ */}
        {!userEmail && !expanded && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="hover:text-[#B85838] focus:outline-none focus:text-[#B85838]"
          >
            Sign in to sync across devices →
          </button>
        )}

        {/* SIGNED-OUT, EXPANDED ------------------------------------------- */}
        {!userEmail && expanded && status !== 'sent' && (
          <form
            onSubmit={handleSend}
            className="flex items-center gap-2 flex-wrap justify-center w-full max-w-2xl"
          >
            {/* P1 identity providers — Google + Apple SSO (2026-06-14). Sit
                alongside the email Royalty Link; account-linking on matching
                verified email keeps one person = one account. */}
            <button
              type="button"
              onClick={() => handleOAuth('google')}
              disabled={status === 'sending'}
              className="normal-case tracking-normal bg-[#FAF8F4] text-[#1A1815] border border-[#3A3A3A] px-3 py-1 hover:bg-white focus:outline focus:outline-2 focus:outline-[#B85838] disabled:opacity-50 font-semibold">
              Continue with Google
            </button>
            <button
              type="button"
              onClick={() => handleOAuth('apple')}
              disabled={status === 'sending'}
              className="normal-case tracking-normal bg-[#000] text-[#FAF8F4] border border-[#000] px-3 py-1 hover:bg-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838] disabled:opacity-50 font-semibold">
              Continue with Apple
            </button>
            <span className="text-[#5A5751] normal-case tracking-normal hidden sm:inline">or</span>
            <label htmlFor="auth-email" className="sr-only">Email address</label>
            <input
              id="auth-email"
              type="email"
              required
              autoFocus
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === 'sending'}
              className="normal-case tracking-normal bg-[#0A0A0A] text-[#FAF8F4] placeholder-[#666] border border-[#3A3A3A] px-2 py-1 text-xs flex-grow min-w-[200px] max-w-[320px] focus:outline-none focus:border-[#B85838]"
            />
            <button
              type="submit"
              disabled={status === 'sending'}
              className="bg-[#B85838] text-[#FAF8F4] px-3 py-1 hover:bg-[#FAF8F4] hover:text-[#1A1815] disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {status === 'sending' ? 'Sending…' : 'Send Royalty Link'}
            </button>
            <button
              type="button"
              onClick={() => { setExpanded(false); setStatus('idle'); setErrorMsg(''); }}
              disabled={status === 'sending'}
              className="text-[#5A5751] hover:text-[#FAF8F4] focus:outline-none focus:text-[#FAF8F4]"
            >
              Cancel
            </button>
            {status === 'error' && (
              <span
                role="alert"
                className="text-[#FB923C] normal-case tracking-normal w-full text-center"
              >
                {errorMsg}
              </span>
            )}
          </form>
        )}

        {/* SIGNED-OUT, MAGIC LINK SENT ------------------------------------ */}
        {!userEmail && expanded && status === 'sent' && (
          <>
            <span className="text-[#5A6E3D]">●</span>
            <span>
              Royalty Link sent to{' '}
              <span className="normal-case tracking-normal font-mono">{email}</span>
              {' · '}check your inbox
            </span>
            <button
              type="button"
              onClick={() => { setExpanded(false); setStatus('idle'); setEmail(''); }}
              className="underline hover:text-[#B85838] focus:outline-none focus:text-[#B85838]"
            >
              Use a different email
            </button>
          </>
        )}
      </div>
    </div>
  );
}
