// =============================================================================
// DownloadLatest — the "Download the latest" button (Darrell, 2026-07-07:
// "We need a download the latest button inside the PoeTech App.")
// =============================================================================
// The active counterpart to the quiet FreshnessDot: instead of waiting for the
// browser's own update cycle, one tap CHECKS the server right now and then
// either downloads + applies the newer build (the proven unbreakable path —
// applyUpdate → SKIP_WAITING → single guarded reload) or says, honestly, that
// this device is already on the latest deployed build (named by SHA + date —
// a measured statement, never a guess; DR-0076).
//
// States (every one visible text, never color-only):
//   idle      → [⟳ Download the latest]
//   stale     → [⟳ Download the update] (a newer worker is already waiting)
//   checking  → "Checking for a newer build…" (≤ ~4s)
//   applying  → "Downloading the update — the app will refresh itself…"
//   latest    → "✓ You're on the latest — build <SHA> · <date>"
//   no-sw     → honest note that updates arrive with the site (no dead button)
//   stuck     → the close-&-reopen hint (a reload has PROVEN not to stick here)
// =============================================================================
import React, { useState } from 'react';
import { useStaleBuild, useUpdateStuck } from '../lib/freshness.js';
import { checkForLatest, applyUpdate } from '../lib/sw-update.js';

const BUILD_SHA = typeof __BUILD_SHA__ !== 'undefined' ? __BUILD_SHA__ : '????';
const BUILD_TIME = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : '';
const MONO = { fontFamily: '"JetBrains Mono", monospace' };

export default function DownloadLatest({ className = '', reg = null, win = null }) {
  const stale = useStaleBuild();
  const stuck = useUpdateStuck();
  const [phase, setPhase] = useState('idle'); // idle | checking | applying | latest | no-sw

  const w = win || (typeof window !== 'undefined' ? window : undefined);
  const registration = reg || (w && w.__pwaReg) || null;

  // A reload has proven not to stick on this device — the only honest control
  // is the relaunch hint; a button that spins the device is worse than none.
  if (stuck) {
    return (
      <p className={`text-xs text-[#B85838] ${className}`}>
        ▲ A newer build is ready but needs a fresh start: fully close the app
        (swipe it away / quit the tab) and reopen — it opens on the latest.
      </p>
    );
  }

  const run = async () => {
    if (phase === 'checking' || phase === 'applying') return;
    // A newer worker is already waiting — apply it straight away.
    if (stale) {
      setPhase('applying');
      try { applyUpdate(registration, w); } catch (_) { /* the SW flow owns it */ }
      return;
    }
    setPhase('checking');
    const { result, pending } = await checkForLatest(registration);
    if (result === 'update-found') {
      setPhase('applying');
      try { applyUpdate(registration, w, {}); } catch (_) { /* noop */ }
      // applyUpdate reloads the page (controllerchange or its timed fallback);
      // if we're somehow still here, the pending worker is mid-install — the
      // seamless wiring finishes it.
      void pending;
    } else {
      setPhase(result === 'no-sw' ? 'no-sw' : 'latest');
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      <button
        type="button"
        onClick={run}
        disabled={phase === 'checking' || phase === 'applying'}
        className="inline-flex items-center gap-1.5 rounded-lg bg-[#1A1815] text-[#FAF8F4] px-3 py-2.5 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] disabled:opacity-60 focus:outline focus:outline-2 focus:outline-[#B85838]"
      >
        <span aria-hidden="true">⟳</span>
        {phase === 'checking' ? 'Checking…'
          : phase === 'applying' ? 'Downloading…'
          : stale ? 'Download the update'
          : 'Download the latest'}
      </button>
      <p className="text-[0.6875rem] text-[#5A5751]" role="status" style={MONO}>
        {phase === 'checking' && 'Checking for a newer build…'}
        {phase === 'applying' && 'Downloading the update — the app will refresh itself.'}
        {phase === 'latest' && `✓ You're on the latest — build ${BUILD_SHA}${BUILD_TIME ? ` · ${String(BUILD_TIME).slice(0, 10)}` : ''}`}
        {phase === 'no-sw' && `Updates arrive with the site here — you're on build ${BUILD_SHA}.`}
        {phase === 'idle' && !stale && `Running build ${BUILD_SHA}${BUILD_TIME ? ` · ${String(BUILD_TIME).slice(0, 10)}` : ''} — tap to check for newer.`}
        {phase === 'idle' && stale && 'A newer build is ready — tap to download and refresh.'}
      </p>
    </div>
  );
}
