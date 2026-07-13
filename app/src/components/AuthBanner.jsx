// =============================================================================
// AuthBanner — sign-in strip above the title bar
// =============================================================================
// Renders one of two states:
//   1. Signed out:  "Sign in to sync across devices →" — opens a QUIET in-app
//                   dialog (AuthModal) over the page you're on. No full-page jump
//                   (Darrell 2026-06-17: "not messy"). Google runs in a popup so
//                   you keep your place; email + Royalty Link live in the dialog.
//   2. Signed in:   "Signed in as foo@example.com · Sign out"
//
// The dialog (AuthModal) owns all the auth UI now; this strip is just the trigger
// + signed-in readout. Session state still flows from supabase via onAuthChange,
// which the dialog updates in place (the popup signs in without leaving the page).
//
// Style matches the "Projections, not promises" strip directly above it
// (bg-[#1A1815], text-[#FAF8F4], tracking-[0.2em], uppercase 10px). Sticks at
// top:0 z-30 so it stays above the already-sticky header (z-20).
// =============================================================================

import React, { useEffect, useState } from 'react';
import { onAuthChange, signOut, isPhoneLoginSession, identityLabel, promoteEmailToLogin } from '../lib/supabase.js';
import AuthModal from './AuthModal.jsx';

export default function AuthBanner() {
  const [session, setSession] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  // Phone users adding a real login email (DR-0172 follow-up, built not deferred).
  const [addEmailOpen, setAddEmailOpen] = useState(false);
  const [addEmailValue, setAddEmailValue] = useState('');
  const [addEmailStatus, setAddEmailStatus] = useState(null); // { kind:'ok'|'err', message }
  const [addEmailBusy, setAddEmailBusy] = useState(false);

  useEffect(() => {
    // onAuthChange fires immediately with the current session, so we don't
    // need a separate getSession() call here.
    const unsubscribe = onAuthChange((s) => setSession(s));
    return unsubscribe;
  }, []);

  async function handleSignOut() {
    await signOut();
    // onAuthChange will fire with null; the strip collapses back to the prompt.
  }

  async function handleAddEmail(e) {
    e.preventDefault();
    setAddEmailBusy(true);
    setAddEmailStatus(null);
    const { error } = await promoteEmailToLogin(addEmailValue);
    setAddEmailBusy(false);
    if (error) {
      setAddEmailStatus({ kind: 'err', message: error.message || 'Could not add that email. Please try again.' });
      return;
    }
    setAddEmailStatus({ kind: 'ok', message: 'Check your inbox — tap the link we sent to confirm, then you can sign in with this email too.' });
    setAddEmailValue('');
  }

  const userEmail = session?.user?.email;
  // A phone+PIN account with no real email yet: show the number, offer to add one.
  const isPhoneUser = isPhoneLoginSession(session);
  const label = identityLabel(session) || userEmail;

  return (
    <div className="bg-[#1A1815] text-[#FAF8F4] text-[10px] uppercase tracking-[0.2em] px-3 py-1.5 print:hidden border-t border-[#3A2A24]">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 flex-wrap">
        {userEmail ? (
          <>
            <span aria-label="Sync status">
              <span className="text-[#5A6E3D]">●</span> Signed in as{' '}
              <span className="normal-case tracking-normal font-mono">{label}</span>
            </span>
            {isPhoneUser && (
              <>
                <span className="text-[#5A5751]">·</span>
                <button
                  type="button"
                  onClick={() => { setAddEmailOpen((v) => !v); setAddEmailStatus(null); }}
                  aria-expanded={addEmailOpen}
                  className="underline hover:text-[#B85838] focus:outline-none focus:text-[#B85838]"
                >
                  Add email
                </button>
              </>
            )}
            <span className="text-[#5A5751]">·</span>
            <button
              type="button"
              onClick={handleSignOut}
              className="underline hover:text-[#B85838] focus:outline-none focus:text-[#B85838]"
            >
              Sign out
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="hover:text-[#B85838] focus:outline-none focus:text-[#B85838]"
          >
            Sign in to sync across devices →
          </button>
        )}
      </div>

      {/* Phone user adding a real login email — same account, same id, no merge:
          a verified email is attached to this account (DR-0172, built now). */}
      {userEmail && isPhoneUser && addEmailOpen && (
        <div className="max-w-7xl mx-auto mt-2 px-1 normal-case tracking-normal">
          <form onSubmit={handleAddEmail} className="flex flex-wrap items-center justify-center gap-2">
            <label htmlFor="add-login-email" className="text-[#FAF8F4] text-[0.6875rem]">
              Add your email (you can then sign in with it too):
            </label>
            <input
              id="add-login-email"
              type="email"
              autoComplete="email"
              value={addEmailValue}
              onChange={(e) => setAddEmailValue(e.target.value)}
              placeholder="you@example.com"
              className="text-[0.8125rem] text-[#1A1815] bg-[#FAF8F4] px-2 py-1.5 rounded min-w-[14rem] focus:outline focus:outline-2 focus:outline-[#B85838]"
            />
            <button
              type="submit"
              disabled={addEmailBusy}
              className="text-[0.6875rem] uppercase tracking-wider bg-[#B85838] text-[#FAF8F4] px-3 py-1.5 rounded hover:bg-[#a04d30] focus:outline focus:outline-2 focus:outline-[#FAF8F4] disabled:opacity-60"
            >
              {addEmailBusy ? 'Sending…' : 'Send confirmation'}
            </button>
          </form>
          {addEmailStatus && (
            <p
              aria-live="polite"
              className={`text-center text-[0.6875rem] mt-1.5 ${addEmailStatus.kind === 'ok' ? 'text-[#5A6E3D]' : 'text-[#B85838]'}`}
            >
              {addEmailStatus.message}
            </p>
          )}
        </div>
      )}

      {/* The quiet, focus-trapped sign-in dialog. Mounted only while open so its
          effects (focus trap, scroll lock) don't run for signed-in users. */}
      {!userEmail && (
        <AuthModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSignedIn={() => setModalOpen(false)}
          mode="signup"
        />
      )}
    </div>
  );
}
