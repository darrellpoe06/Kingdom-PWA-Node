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
import { onAuthChange, signOut, saveDisplayName, resolveUserName } from '../lib/supabase.js';
import AuthModal from './AuthModal.jsx';

export default function AuthBanner() {
  const [session, setSession] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  // Inline "pick your name" editor (DP 2026-07-12: people choose their own name
  // so the family recognizes who is who). Held here so the always-visible strip
  // is where a name is set — no hunting through Settings.
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState('');

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

  const user = session?.user || null;
  const userEmail = user?.email;
  const shownName = resolveUserName(user);
  // Has the person CHOSEN a name, or are we falling back to the email local part?
  const hasChosenName = !!((user?.user_metadata?.display_name || user?.user_metadata?.name || user?.user_metadata?.full_name || '').trim());

  function openEditor() {
    setDraft((user?.user_metadata?.display_name || '').trim());
    setNameError('');
    setEditing(true);
  }

  async function handleSaveName(e) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setNameError('');
    const { data, error } = await saveDisplayName(draft);
    setSaving(false);
    if (error) { setNameError(error.message || 'Could not save your name.'); return; }
    // updateUser emits USER_UPDATED (onAuthChange catches it); set eagerly too.
    if (data?.user) setSession((s) => (s ? { ...s, user: data.user } : s));
    setEditing(false);
  }

  return (
    <div className="bg-[#1A1815] text-[#FAF8F4] text-[10px] uppercase tracking-[0.2em] px-3 py-1.5 print:hidden border-t border-[#3A2A24]">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 flex-wrap">
        {userEmail ? (
          editing ? (
            <form onSubmit={handleSaveName} className="flex items-center justify-center gap-2 flex-wrap normal-case tracking-normal">
              <label htmlFor="pick-name" className="text-[10px] uppercase tracking-[0.2em]">Your name</label>
              <input
                id="pick-name"
                type="text"
                value={draft}
                onChange={(ev) => setDraft(ev.target.value)}
                maxLength={40}
                autoFocus
                placeholder="e.g. DP"
                aria-label="Choose the name the church family sees"
                className="min-w-[8rem] px-2 py-1 text-xs bg-[#FAF8F4] text-[#1A1815] border border-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]"
              />
              <button type="submit" disabled={saving} className="underline hover:text-[#B85838] focus:outline-none focus:text-[#B85838] disabled:opacity-60">{saving ? 'Saving…' : 'Save'}</button>
              <button type="button" onClick={() => setEditing(false)} className="text-[#5A5751] hover:text-[#FAF8F4] focus:outline-none">Cancel</button>
              {nameError && <span className="normal-case tracking-normal text-[#E4A28C]">{nameError}</span>}
            </form>
          ) : (
            <>
              <span aria-label="Sync status">
                <span className="text-[#5A6E3D]">●</span> Signed in as{' '}
                <span className="normal-case tracking-normal font-semibold">{shownName}</span>
              </span>
              <button
                type="button"
                onClick={openEditor}
                className="underline hover:text-[#B85838] focus:outline-none focus:text-[#B85838]"
              >
                {hasChosenName ? 'Change name' : 'Pick a name'}
              </button>
              <span className="text-[#5A5751]">·</span>
              <button
                type="button"
                onClick={handleSignOut}
                className="underline hover:text-[#B85838] focus:outline-none focus:text-[#B85838]"
              >
                Sign out
              </button>
            </>
          )
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
