// =============================================================================
// TierSwitcher — the header's tier-preview dropdown (extracted from the
// monolith shell 2026-08-04, a DR-0078 peel; behavior byte-for-byte unchanged).
// v28+ MVP v1.5 round 7: controlled dropdown that closes on outside click +
// selection, plus a 1.5s flash on the trigger when the tier changes so the
// user sees the action took effect.
// =============================================================================
import React, { useEffect, useRef, useState } from 'react';
import { TIER_ORDER, TIER_LABEL, effectiveTier } from '../lib/tiers.js';

export default function TierSwitcher({ userTier, setUserTier }) {
  const [open, setOpen] = useState(false);
  const [flash, setFlash] = useState(false);
  const wrapRef = useRef(null);
  const autoCloseRef = useRef(null);
  // Round 7 fix — auto-close after 6s of no interaction inside the dropdown.
  // Reset the timer on any pointer move or focus inside; long enough to pick
  // a tier, not so long that the panel sticks around forever.
  const armAutoClose = () => {
    clearTimeout(autoCloseRef.current);
    autoCloseRef.current = setTimeout(() => setOpen(false), 6000);
  };
  useEffect(() => {
    if (!open) { clearTimeout(autoCloseRef.current); return; }
    armAutoClose();
    const onClick = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('touchstart', onClick);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('touchstart', onClick);
      clearTimeout(autoCloseRef.current);
    };
  }, [open]);
  const pick = (t) => {
    setUserTier(t);
    setOpen(false);
    setFlash(true);
    setTimeout(() => setFlash(false), 1500);
  };
  const current = effectiveTier(userTier);
  // Round 14 fix — compact label on narrow screens (e.g., "Premium") and full
  // label with price on wide screens. Keeps the header from crowding the title.
  const fullLabel = TIER_LABEL[current] || 'Foundation (free)';
  const shortLabel = fullLabel.split(' (')[0]; // strip the "($X/mo)" suffix
  return (
    <div ref={wrapRef} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open} aria-haspopup="true" className={`text-[0.625rem] uppercase tracking-wider px-2 py-1.5 border whitespace-nowrap focus:outline focus:outline-2 focus:outline-[#B85838] transition-colors ${flash ? 'bg-[#5A6E3D] text-white border-[#5A6E3D]' : 'border-[#5A5751] text-[#5A5751] hover:border-[#1A1815] hover:text-[#1A1815]'}`} title={`Tier preview · ${fullLabel} · switch to see locked / unlocked views`}>
        {flash ? '✓ Saved · ' : ''}
        <span className="hidden lg:inline">{fullLabel}</span>
        <span className="lg:hidden">{shortLabel}</span>
        {' '}{open ? '▴' : '▾'}
      </button>
      {open && (
        <div onMouseMove={armAutoClose} onTouchStart={armAutoClose} onFocus={armAutoClose} className="absolute right-0 mt-1 bg-white border border-[#1A1815] p-2 z-30 shadow-lg" style={{ minWidth: '220px' }}>
          <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] mb-1 px-1">Preview tier (dev) · closes in 6s</div>
          <div className="flex flex-col gap-1">
            {TIER_ORDER.map(t => (
              <button key={t} type="button" onClick={() => pick(t)} className={`text-[0.625rem] uppercase tracking-wider px-2 py-2 text-left border focus:outline focus:outline-2 focus:outline-[#B85838] ${current === t ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'border-[#E8E4DC] text-[#5A5751] hover:border-[#1A1815]'}`}>{TIER_LABEL[t]}</button>
            ))}
          </div>
          <div className="text-[0.5625rem] text-[#5A5751] italic mt-2 px-1">Persisted on this device. Real billing happens through About.</div>
        </div>
      )}
    </div>
  );
}
