// =============================================================================
// TlcWelcome — the TLC app's first screen: the brand alone, Sign In, Create
// Account, and a way past (the reference's welcome; DR-1180)
// =============================================================================
// Darrell, 2026-10-21, with DR-1171 live on his phone: "Still does not look
// like this." The reference's welcome is a SCREEN, not a card in a page: no
// bar above it, no tagline repeated above it, no control row, nothing under
// it. This stands in FRONT of the door (fixed, above the floaters) while
// tlc-welcome.js says it should — a guest on a fresh open — and the whole
// door stays mounted beneath, untouched: every section, the header with its
// Book / Sign in / hideaway, the reader. Three ways off it, every one a thing
// the door already does: Sign in and Create an account open the door's own
// entry (PasswordAuth) in the bar; Continue without an account lowers the
// screen onto the home. No width cap (consistency-guard, DR-0246): the
// column is the screen's own width on a phone and a fixed 24rem measure
// from `sm` up. Pure presentation; the words are tlc-practice.js's.
// =============================================================================
import React, { useEffect } from 'react';
import UiIcon from './UiIcon.jsx';
import { TLC_BRAND } from '../lib/tlc-practice.js';
import { TLC_BTN_PRIMARY, TLC_BTN_SECONDARY } from '../lib/tlc-ui.js';

const SERIF = { fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' };
const FOCUS = 'focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]';

export default function TlcWelcome({ onSignIn = () => {}, onCreateAccount = () => {}, onContinue = () => {} }) {
  // The door beneath does not scroll while the welcome stands in front of it.
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Welcome to ${TLC_BRAND.name}`}
      data-testid="tlc-welcome"
      className="fixed inset-0 z-[90] overflow-y-auto bg-[#FAF8F4] text-[#1A1815]"
    >
      <div className="min-h-full flex flex-col items-center justify-between px-6 pt-16 pb-10 sm:pb-16 text-center">
        <div className="flex-1 flex flex-col items-center justify-center">
          {/* The mark: the brand's heart in the forest well, large. */}
          <span className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#1A1815] text-white mb-5" aria-hidden="true"><UiIcon name="heart" className="text-3xl" /></span>
          <div className="text-5xl leading-none" style={SERIF}>TLC</div>
          <div className="mt-2 text-xs uppercase tracking-[0.35em] text-[#1A1815]">Therapy Solutions</div>
          <span className="block w-10 border-t border-[#B85838] my-6" aria-hidden="true" />
          <h1 className="text-4xl sm:text-5xl leading-tight mb-3" style={SERIF}>{TLC_BRAND.tagline}</h1>
          <p className="text-base text-[#5A5751] sm:w-96 mx-auto">{TLC_BRAND.blurb}</p>
        </div>
        <div className="w-full sm:w-96 flex flex-col gap-3 mt-10">
          <button type="button" onClick={onSignIn} className={`${TLC_BTN_PRIMARY} w-full min-h-[3.25rem] text-base`}>Sign in</button>
          <button type="button" onClick={onCreateAccount} className={`${TLC_BTN_SECONDARY} w-full min-h-[3.25rem] text-base`}>Create an account</button>
          <button type="button" onClick={onContinue} className={`mt-2 text-sm underline underline-offset-4 text-[#5A5751] hover:text-[#1A1815] py-2 ${FOCUS}`}>Continue without an account</button>
        </div>
      </div>
    </div>
  );
}
