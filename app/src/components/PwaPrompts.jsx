// =============================================================================
// PwaPrompts — the PWA lifecycle banners, extracted from the monolith shell.
// (Hybrid-modular cutover, Stage 3: peel self-contained sections into modules.)
//
// Two cohesive, self-contained widgets — zero coupling to the shell's closure or
// module-level state; they depend only on React + browser APIs (window events,
// matchMedia, localStorage, beforeinstallprompt). Moved here verbatim so behavior
// is preserved exactly (DR-0076 §5 characterize-before-change); a render test
// pins that behavior every CI run.
//
//   • UpdatePrompt  — the slim post-update confirmation toast (NOT a prompt). The
//     actionable "update available" indicator is the inline header <FreshnessDot>;
//     this is the only acknowledgement shown AFTER a successful update reload
//     (the `poetech:updated` window event). Pinned to the BOTTOM so it never
//     covers the header. Auto-dismisses. role="status" + aria-live announces it
//     to a screen reader without stealing focus (WCAG 4.1.3).
//   • InstallPrompt — PWA install nudge for iOS + Android visitors. Android
//     Chrome/Edge catches beforeinstallprompt and fires the native prompt; iOS
//     Safari shows manual "Share -> Add to Home Screen" instructions. Dismissal
//     is stored in localStorage for 30 days. Auto-hides once installed.
// =============================================================================
import React, { useState, useEffect, useMemo } from 'react';

const UPDATED_TOAST_MS = 4000;

// currentFace — which installable identity this page booted as (DR-0133 install-
// identity). PoeTech and The Love Corner are TWO installable PWAs on the SAME
// origin (poetech.us). Since DR-0258 they live under DISJOINT install scopes
// (/poetech-app/ vs /lovecorner/), each served by its OWN static HTML that
// links its OWN manifest — the DR-0227 runtime <link rel=manifest> swap is
// retired (install identity is a page-load property; mid-session swaps were
// flaky and, post-split, would have made the /poetech-app/ Church tab
// un-installable as PoeTech). The face is therefore decided by WHERE the page
// booted: the church's path (/lovecorner/…) or a church-door launch param
// (?lovecorner=1) — never the in-app ?view=church tab, which is a PoeTech page
// whose installable identity IS PoeTech.
// Everything keyed to the install prompt (the dismissal flag, the banner
// label) stays per-face. THE 2026-07-30 BUG this preserves the fix for
// ("I can't download the PoeTech App when I already have the Love Corner
// App"): a single per-ORIGIN 'pwa-install-dismissed' flag let one face's
// dismissal suppress the other's banner for 30 days. Per-face keys keep the
// two independent.
export function currentFace(search, pathname) {
  try {
    const path = pathname !== undefined ? pathname
      : (typeof window !== 'undefined' && window.location ? window.location.pathname : '');
    if (typeof path === 'string' && path.startsWith('/lovecorner/')) {
      return { key: 'lovecorner', label: 'The Love Corner' };
    }
    if (new URLSearchParams(search || '').get('lovecorner') === '1') {
      return { key: 'lovecorner', label: 'The Love Corner' };
    }
  } catch { /* fall through to default */ }
  return { key: 'poetech', label: 'PoeTech' };
}
const DISMISS_KEY = (face) => `pwa-install-dismissed:${face.key}`;

export function UpdatePrompt() {
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    let confirmTimer = null;
    const onUpdated = () => {
      setConfirmed(true);
      if (confirmTimer) clearTimeout(confirmTimer);
      confirmTimer = setTimeout(() => setConfirmed(false), UPDATED_TOAST_MS);
    };
    window.addEventListener('poetech:updated', onUpdated);
    return () => {
      window.removeEventListener('poetech:updated', onUpdated);
      if (confirmTimer) clearTimeout(confirmTimer);
    };
  }, []);

  if (!confirmed) return null;

  return (
    <div className="update-confirm fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-sm px-2 print:hidden" role="status" aria-live="polite">
      <div className="bg-[#1A1815] text-white border-2 border-[#1A1815] shadow-xl px-4 py-2.5 flex items-center gap-2">
        <span aria-hidden="true">✓</span>
        <span className="text-xs" style={{ fontFamily: '"Fraunces", serif' }}>Updated to the latest version.</span>
      </div>
    </div>
  );
}

export function InstallPrompt() {
  const [deferredEvt, setDeferredEvt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(true); // assume dismissed until we check storage
  // Install identity is a page-load property — read the launch URL once (stable).
  const face = useMemo(() => (typeof window !== 'undefined' ? currentFace(window.location.search) : { key: 'poetech', label: 'PoeTech' }), []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Check whether already running in standalone (installed) mode
    const standalone =
      window.matchMedia && window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    if (standalone) { setInstalled(true); return; }

    // iOS detection - Safari doesn't fire beforeinstallprompt
    const ua = window.navigator.userAgent || '';
    const ios = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    setIsIOS(ios);

    // Read dismissal flag — PER FACE, so installing/declining one app on this
    // origin never suppresses the other's install prompt (the 2026-07-30 bug).
    try {
      const stamp = window.localStorage.getItem(DISMISS_KEY(face));
      if (stamp) {
        const days = (Date.now() - parseInt(stamp, 10)) / 86400000;
        if (days < 30) { setDismissed(true); return; }
      }
      setDismissed(false);
    } catch (e) {
      setDismissed(false);
    }

    const onPrompt = (e) => {
      e.preventDefault();
      setDeferredEvt(e);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', () => { setInstalled(true); setDeferredEvt(null); });
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, [face]);

  const dismiss = () => {
    try { window.localStorage.setItem(DISMISS_KEY(face), String(Date.now())); } catch (e) {}
    setDismissed(true);
  };

  const installAndroid = async () => {
    const evt = deferredEvt;
    // Hide the banner the instant it's clicked, no matter what the native
    // prompt does next. beforeinstallprompt.prompt() can only be called once
    // and throws otherwise; keeping the hide here (not after it) means a throw
    // can never leave the banner stuck on screen.
    setDeferredEvt(null);
    if (evt) {
      try { evt.prompt(); await evt.userChoice; } catch (e) {}
    }
    // Persist so it doesn't reappear on the next visit whether they installed
    // or declined the native dialog.
    dismiss();
  };

  if (installed || dismissed) return null;
  if (!deferredEvt && !isIOS) return null;

  return (
    <div className="install-prompt fixed bottom-4 left-4 right-20 sm:right-auto z-[60] max-w-xs print:hidden">
      <div className="bg-white border-2 border-[#1A1815] shadow-lg p-3">
        <div className="flex items-baseline justify-between gap-2 mb-2">
          <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold">📲 Install {face.label}</div>
          <button type="button" onClick={dismiss} aria-label="Dismiss install prompt" className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815]">×</button>
        </div>
        {deferredEvt ? (
          <>
            <p className="text-xs leading-snug mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
              Add {face.label} to your home screen so you can open it like a regular app — works offline, no browser bar, faster launch.
            </p>
            <button type="button" onClick={installAndroid} className="w-full bg-[#1A1815] text-white px-3 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838]">
              Install on this device
            </button>
          </>
        ) : isIOS ? (
          <>
            <p className="text-xs leading-snug mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
              On iPhone or iPad: tap the <strong>Share</strong> button at the bottom of Safari, then choose <strong>Add to Home Screen</strong>.
            </p>
            <p className="text-[0.625rem] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
              Once added, {face.label} opens like a regular app — works offline, no browser bar.
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}
