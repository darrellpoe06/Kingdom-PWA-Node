// =============================================================================
// AuthModal — sign in / create a profile, QUIETLY, in place
// =============================================================================
// Darrell 2026-06-17: sign-in must open as a tidy in-app dialog over the page the
// user is on — never a full-page jump, never clutter. This is that surface:
//
//   - Google FIRST, in a POPUP (lib/oauth-popup.js) so they keep their place. If
//     the popup is blocked, we fall back to the classic full-page redirect — so
//     Google always works and no one is stranded.
//   - Email + password (+ the Royalty Link "trouble?" fallback) via the existing
//     PasswordAuth, embedded so this dialog owns the heading.
//
// Calm + minimal (anxiety-clarity): one obvious primary action, generous spacing,
// few words. Accessible: the focus-trapped Modal shell (role=dialog, ESC/backdrop
// close, restored focus), labelled controls, >=44px targets, aria-live status,
// WCAG 2.1 AA colors on the white panel (terracotta eyebrow #B85838 = 4.56:1 on
// white; it falls below AA on cream, hence the white card). Unbreakable: a
// popup/redirect error
// degrades to a readable message, never a dead end.
// =============================================================================
import React, { useState, useRef } from 'react';
import Modal from './Modal.jsx';
import PasswordAuth from './PasswordAuth.jsx';
import { signInWithGoogle } from '../lib/supabase.js';
import { signInWithGooglePopup } from '../lib/oauth-popup.js';

export default function AuthModal({ open, onClose, onSignedIn = null, mode = 'signup' }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const googleRef = useRef(null);

  const handleSignedIn = (session) => {
    if (onSignedIn) onSignedIn(session);
    if (onClose) onClose();
  };

  const handleGoogle = async () => {
    setError('');
    setBusy(true);
    let res;
    try {
      res = await signInWithGooglePopup();
    } catch (e) {
      res = { error: { message: (e && e.message) || 'Google sign-in could not start.' } };
    }
    if (res && res.ok) { setBusy(false); handleSignedIn(null); return; }
    // Popup blocked / unsupported / failed to start → fall back to the classic
    // full-page redirect so Google still works. (Cancelled = user closed it; just
    // re-enable the button.)
    if (res && (res.blocked || res.unsupported || res.error)) {
      const fb = await signInWithGoogle();
      if (fb && fb.error) {
        setBusy(false);
        setError(fb.error.message || 'Google sign-in isn’t available right now — use email below.');
      }
      // On a successful redirect start the page navigates away; nothing more to do.
      return;
    }
    setBusy(false); // cancelled
  };

  return (
    <Modal open={open} onClose={onClose} labelledBy="auth-modal-h" maxWidthClass="max-w-sm" closeLabel="Close sign-in" initialFocusRef={googleRef}>
      <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold">PoeTech · Welcome</div>
      <h2
        id="auth-modal-h"
        className="text-2xl mt-1 mb-1"
        style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}
      >
        Sign in or create your profile
      </h2>
      <p className="text-sm text-[#5A5751] mb-4" style={{ fontFamily: '"Fraunces", serif' }}>
        Sign in to sync across your devices. It’s free, built for our community, and never sold.
      </p>

      {error && <p className="text-xs text-[#7A1F1F] mb-3" role="alert" aria-live="assertive">{error}</p>}

      {/* PRIMARY: Google, in a popup so you keep your place. */}
      <button
        ref={googleRef}
        type="button"
        onClick={handleGoogle}
        disabled={busy}
        className="w-full inline-flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider px-4 py-3 min-h-[48px] border-2 border-[#1A1815] text-[#1A1815] bg-white hover:bg-[#FAF8F4] disabled:opacity-50 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
      >
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62z"/><path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.35 0-4.34-1.59-5.05-3.71H.96v2.33A9 9 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.95 10.71a5.4 5.4 0 0 1 0-3.42V4.96H.96a9 9 0 0 0 0 8.08l2.99-2.33z"/><path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l2.99 2.33C4.66 5.17 6.65 3.58 9 3.58z"/></svg>
        {busy ? 'Opening Google…' : 'Continue with Google'}
      </button>

      <div className="flex items-center gap-3 my-4" aria-hidden="true">
        <span className="h-px flex-grow bg-[#E8E4DC]" />
        <span className="text-[0.6875rem] uppercase tracking-wider text-[#5A5751]">or</span>
        <span className="h-px flex-grow bg-[#E8E4DC]" />
      </div>

      {/* SECONDARY: email + password, with the Royalty Link fallback inside. */}
      <PasswordAuth mode={mode} embedded onSignedIn={handleSignedIn} />
    </Modal>
  );
}
