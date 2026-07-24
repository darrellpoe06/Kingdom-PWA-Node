// =============================================================================
// AuthBanner — the signed-in "sync status" strip above the title bar
// =============================================================================
// ONE login/logout control, app-wide (Darrell 2026-07-15, with two screenshots:
// "Logout button is too big" + "Should only have one login"). The single, obvious
// Log in / Log out box is HeaderAuthButton, in the header's top-right cluster
// (next to Subscribe / Install app) -- the spot Darrell asked for on 2026-07-14.
// This strip therefore NO LONGER renders its own (oversized, duplicate) auth
// button; it is purely the signed-in readout:
//
//   • Signed in:  "● Signed in as foo@example.com"  (+ "Add email" for phone
//                 accounts adding a real login email, DR-0172).
//   • Signed out: renders NOTHING -- HeaderAuthButton owns the way in.
//
// Style matches the "Projections, not promises" strip directly above it
// (bg-[#1A1815], text-[#FAF8F4], tracking-[0.2em], uppercase 10px). Sticks at
// top:0 z-30 so it stays above the already-sticky header (z-20).
// =============================================================================

import React, { useEffect, useState } from 'react';
import { onAuthChange, isPhoneLoginSession, identityLabel, promoteEmailToLogin } from '../lib/supabase.js';

export default function AuthBanner() {
  const [session, setSession] = useState(null);
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

  // Signed OUT: render nothing. The ONE way in is HeaderAuthButton's "Log in" box
  // in the header cluster — no duplicate login here (Darrell 2026-07-15).
  if (!userEmail) return null;

  return (
    <div className="bg-[#1A1815] text-[#FAF8F4] text-[0.625rem] uppercase tracking-[0.2em] px-3 py-1.5 print:hidden border-t border-[#3A2A24]">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 flex-wrap">
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
      </div>

      {/* Phone user adding a real login email — same account, same id, no merge:
          a verified email is attached to this account (DR-0172, built now). */}
      {isPhoneUser && addEmailOpen && (
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
    </div>
  );
}
