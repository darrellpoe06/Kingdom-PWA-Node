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
//
// The install offer (Darrell 2026-07-07: the button "checks instead of
// downloading the actual app — why can't it do both … you're on the latest,
// you sure you want the download, with a yes?"): "download" means two things —
// the newest BUILD and the app ON THE DEVICE. So when a completed check lands
// on "you're on the latest" (or no-sw) and the app is NOT installed here, the
// button keeps its promise by offering the second download: one tap fires the
// browser's native install dialog (the captured beforeinstallprompt), and when
// the browser never handed one over (iOS, or already spent) it shows the exact
// platform steps instead — never a dead end.
// =============================================================================
import React, { useState } from 'react';
import { useStaleBuild, useUpdateStuck } from '../lib/freshness.js';
import { checkForLatest, applyUpdate } from '../lib/sw-update.js';
import { isStandalone, detectPlatform, installSteps } from '../lib/install-help.js';
import { canPromptInstall, promptInstall } from '../lib/install-app.js';
import UiIcon from './UiIcon.jsx';

const BUILD_SHA = typeof __BUILD_SHA__ !== 'undefined' ? __BUILD_SHA__ : '????';
const BUILD_TIME = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : '';
const MONO = { fontFamily: '"JetBrains Mono", monospace' };

export default function DownloadLatest({ className = '', reg = null, win = null }) {
  const stale = useStaleBuild();
  const stuck = useUpdateStuck();
  const [phase, setPhase] = useState('idle'); // idle | checking | applying | latest | no-sw
  const [install, setInstall] = useState('idle'); // idle | installing | accepted | steps

  const w = win || (typeof window !== 'undefined' ? window : undefined);
  const registration = reg || (w && w.__pwaReg) || null;
  const onDevice = isStandalone();

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
      {(phase === 'latest' || phase === 'no-sw') && !onDevice && install !== 'accepted' && (
        <div className="pt-1 space-y-1.5">
          <p className="text-xs text-[#1A1815]">
            The build is current — but the app itself isn&rsquo;t installed on this device yet.
          </p>
          <button
            type="button"
            onClick={async () => {
              if (install === 'installing') return;
              if (canPromptInstall(w)) {
                setInstall('installing');
                const outcome = await promptInstall(w);
                setInstall(outcome === 'accepted' ? 'accepted' : 'steps');
              } else {
                setInstall('steps');
              }
            }}
            disabled={install === 'installing'}
            className="inline-flex items-center gap-1.5 rounded-lg border-2 border-[#1A1815] bg-white text-[#1A1815] px-3 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#1A1815] hover:text-[#FAF8F4] disabled:opacity-60 focus:outline focus:outline-2 focus:outline-[#B85838]"
          >
            <UiIcon name="phone" />
            {install === 'installing' ? 'Opening the install…' : 'Yes — install the app on this device'}
          </button>
          {install === 'steps' && (() => {
            const s = installSteps(detectPlatform(), false);
            return (
              <div className="text-xs text-[#5A5751]">
                <p className="font-semibold text-[#1A1815]">{s.title}</p>
                <ol className="list-decimal ml-4 space-y-0.5">
                  {s.steps.map((step, i) => <li key={i}>{step}</li>)}
                </ol>
              </div>
            );
          })()}
        </div>
      )}
      {install === 'accepted' && (
        <p className="text-xs text-[#1A1815]" role="status">
          ✓ Installing — PoeTech is landing on your home screen.
        </p>
      )}
    </div>
  );
}
