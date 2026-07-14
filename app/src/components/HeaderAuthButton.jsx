// =============================================================================
// HeaderAuthButton — the obvious top-right Log in / Log out box, on every app.
// =============================================================================
// Darrell 2026-07-14 (with the TLC screenshot, "like this" + "for all apps" +
// "not at the top on the top right like the image in tlc!!!"): the way in/out
// must be an OBVIOUS bordered button in the header's top-right cluster — the same
// spot TLC's door puts its "LOG OUT" box — NOT a faint centered link. It toggles
// by state: signed IN -> "Log out"; signed OUT -> "Log in" (opens the quiet
// AuthModal over the page you're on, same as AuthBanner — no full-page jump).
//
// Self-contained (its own session state via onAuthChange + its own AuthModal) so
// the frozen monolith adds ONE line to mount it. Style matches the sibling header
// buttons (Subscribe / profile switcher): 10px uppercase, bordered, invert on
// hover — so it themes identically across every app's header.
// =============================================================================
import React, { useEffect, useState } from 'react';
import { onAuthChange, signOut } from '../lib/supabase.js';
import AuthModal from './AuthModal.jsx';

const BTN =
  'text-[0.625rem] uppercase tracking-wider px-2 py-1.5 border border-[#1A1815] text-[#1A1815] ' +
  'hover:bg-[#1A1815] hover:text-white font-semibold whitespace-nowrap ' +
  'focus:outline focus:outline-2 focus:outline-[#B85838]';

export default function HeaderAuthButton() {
  const [session, setSession] = useState(null);
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => onAuthChange((s) => setSession(s)), []);

  const signedIn = !!session?.user;

  if (signedIn) {
    return (
      <button type="button" onClick={() => { try { signOut(); } catch (_) { /* ignore */ } }} className={BTN}>
        Log out
      </button>
    );
  }
  return (
    <>
      <button type="button" onClick={() => setLoginOpen(true)} className={BTN}>
        Log in
      </button>
      <AuthModal open={loginOpen} onClose={() => setLoginOpen(false)} onSignedIn={() => setLoginOpen(false)} mode="signup" />
    </>
  );
}
