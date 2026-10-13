// =============================================================================
// InstallAppButton — the always-visible header "Install app" control
// =============================================================================
// Darrell 2026-07-10: "Add it to the space that is on each tab top space." The
// one-tap install must not hide behind ?join=1 or a completed update check —
// it lives in the sticky header beside Subscribe, on EVERY tab, whenever the
// app is not already installed on this device.
//
// Never a dead button: tap fires the browser's own install dialog when the
// captured beforeinstallprompt is available (install-app.js), and otherwise
// opens the exact steps for this phone (install-help.js) in a small dropdown —
// iPhone gets the Safari Share path, Android gets the menu path. Hides itself
// once the app is installed (standalone or the appinstalled event).
import React, { useEffect, useRef, useState } from 'react';
import { canPromptInstall, promptInstall } from '../lib/install-app.js';
import { detectPlatform, installSteps, isStandalone } from '../lib/install-help.js';
import UiIcon from './UiIcon.jsx';

export default function InstallAppButton({ className = '' }) {
  const [installed, setInstalled] = useState(() => isStandalone());
  const [phase, setPhase] = useState('idle'); // idle | installing | accepted
  const [stepsOpen, setStepsOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onInstalled = () => setInstalled(true);
    window.addEventListener('appinstalled', onInstalled);
    return () => window.removeEventListener('appinstalled', onInstalled);
  }, []);

  // Close the steps dropdown on any outside tap (the TierSwitcher lesson:
  // a dropdown that only closes from its own X feels broken).
  useEffect(() => {
    if (!stepsOpen || typeof document === 'undefined') return undefined;
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setStepsOpen(false);
    };
    document.addEventListener('pointerdown', onDoc);
    return () => document.removeEventListener('pointerdown', onDoc);
  }, [stepsOpen]);

  if (installed) return null;

  const tap = async () => {
    if (phase === 'installing') return;
    if (canPromptInstall()) {
      setStepsOpen(false);
      setPhase('installing');
      const outcome = await promptInstall();
      setPhase(outcome === 'accepted' ? 'accepted' : 'idle');
      return;
    }
    setStepsOpen((v) => !v);
  };

  if (phase === 'accepted') {
    return (
      <span className={`text-[0.625rem] uppercase tracking-wider px-2 py-1.5 text-[#5A6E3D] font-semibold whitespace-nowrap ${className}`} role="status" aria-live="polite">
        ✓ Installing…
      </span>
    );
  }

  const s = installSteps(detectPlatform(), false);
  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={tap}
        disabled={phase === 'installing'}
        aria-expanded={stepsOpen}
        title="Put PoeTech on this device — opens like a regular app"
        className="text-[0.625rem] uppercase tracking-wider px-2 py-1.5 border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white disabled:opacity-60 font-semibold whitespace-nowrap flex items-center gap-1 focus:outline focus:outline-2 focus:outline-[#B85838]"
      >
        <UiIcon name="phone" />
        {phase === 'installing' ? 'Opening…' : 'Install app'}
      </button>
      {stepsOpen && (
        <div className="absolute right-0 top-full mt-1 z-30 w-64 bg-white border-2 border-[#1A1815] shadow-xl p-3 text-left normal-case tracking-normal">
          <div className="text-[0.625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold mb-1">{s.title}</div>
          <ol className="list-decimal pl-4 space-y-1">
            {s.steps.map((step, i) => (
              <li key={i} className="text-xs text-[#1A1815] leading-snug" style={{ fontFamily: '"Fraunces", serif' }}>{step}</li>
            ))}
          </ol>
          <button type="button" onClick={() => setStepsOpen(false)} className="mt-2 text-[0.625rem] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815]">Close</button>
        </div>
      )}
    </div>
  );
}
