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
import { onAuthChange, sendRoyaltyLink, signOut } from '../lib/supabase.js';
// signInWithGoogle import temporarily removed 2026-05-23 — Google SSO is parked
// until we get a fresh OAuth client with secret captured at creation. The
// helper is still exported from lib/supabase.js, just not wired in here.

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
            {/* Google SSO button removed 2026-05-23 — parked until OAuth
                client secret can be captured at creation. Email Royalty Link
                is the supported path. */}
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
