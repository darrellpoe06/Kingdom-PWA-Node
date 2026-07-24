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
import React, { useState, useEffect } from 'react';
import { INSTALL_MANIFEST } from '../lib/church-own-door.js';

const UPDATED_TOAST_MS = 4000;

// applyBootBrandManifest — page-load install identity (DR-0227). Moore and TLC
// swap their brand manifest inside their door components, but a church boot
// (?view=church, or a church-alias deep link) kept the DEFAULT PoeTech
// manifest — so Chrome's install sheet said "This app is already installed"
// (the PoeTech id) instead of offering The Love Corner (Darrell's 2026-07-23
// screenshot). Read the LAUNCH URL once at boot — install identity is a
// page-load property (Chrome computes installability from the manifest present
// at load; mid-session SPA swaps are flaky) — and link the church manifest
// when the page booted as the church. Exported for the render test.
const CHURCH_BOOT_VIEWS = ['church', 'engagement', 'choir', 'pulpit', 'learn', 'events'];
export function applyBootBrandManifest(search, doc) {
  try {
    const v = (new URLSearchParams(search || '').get('view') || '').toLowerCase().trim();
    if (!CHURCH_BOOT_VIEWS.includes(v)) return false;
    let link = doc.querySelector('link[rel="manifest"]');
    if (!link) {
      link = doc.createElement('link');
      link.rel = 'manifest';
      doc.head.appendChild(link);
    }
    link.href = INSTALL_MANIFEST;
    return true;
  } catch { return false; }
}

export function UpdatePrompt() {
  const [confirmed, setConfirmed] = useState(false);

  // Boot-time brand-manifest swap rides the always-mounted PWA-chrome widget
  // (no shell coupling — reads the launch URL only, once).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    applyBootBrandManifest(window.location.search, document);
  }, []);

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

    // Read dismissal flag
    try {
      const stamp = window.localStorage.getItem('pwa-install-dismissed');
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
  }, []);

  const dismiss = () => {
    try { window.localStorage.setItem('pwa-install-dismissed', String(Date.now())); } catch (e) {}
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
          <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold">📲 Install PoeTech</div>
          <button type="button" onClick={dismiss} aria-label="Dismiss install prompt" className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815]">×</button>
        </div>
        {deferredEvt ? (
          <>
            <p className="text-xs leading-snug mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
              Add PoeTech to your home screen so you can open it like a regular app — works offline, no browser bar, faster launch.
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
              Once added, PoeTech opens like a regular app — works offline, no browser bar.
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}
