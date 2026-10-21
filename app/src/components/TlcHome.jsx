// =============================================================================
// TlcHome — the first screen of the TLC app, drawn the reference's way (DR-1171)
// =============================================================================
// Darrell, 2026-10-21, with DR-1156 and DR-1170 live on his phone: "It's better
// but it does not look like this at all." The reference is a SHAPE, not only a
// palette: a welcome screen with the brand and two big buttons, a personal
// greeting, a quote card, a 2x2 of quick actions, a "need to schedule?" row,
// and a bottom bar. Every tile here opens a section the door already has;
// nothing is new. A guest meets the welcome card with Sign in / Create an
// account and may keep browsing; a signed-in person meets their name.
// PURE presentation: the words come from tlc-practice.js and the sections
// the door passes in; the verse is the KJV line the Learn space already
// carries verbatim (PracticeLearn.jsx), never typed from memory (DR-0076).
// =============================================================================
import React from 'react';
import UiIcon from './UiIcon.jsx';
import { TLC_BRAND } from '../lib/tlc-practice.js';
import { TLC_CARD, TLC_EYEBROW, TLC_ICON_WELL } from '../lib/tlc-ui.js';

const SERIF = { fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' };
const FOCUS = 'focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]';

/** The KJV line the Learn space opens with (PracticeLearn.jsx), verbatim. */
export const HOME_VERSE = 'Get wisdom, and with all thy getting get understanding (Proverbs 4:7).';

/** "Good morning" before noon, "Good afternoon" before five, "Good evening" after. */
export function greetingFor(hour) {
  const h = Number.isFinite(hour) ? hour : 12;
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function Tile({ tile }) {
  const inner = (
    <>
      <span className={TLC_ICON_WELL} aria-hidden="true"><UiIcon name={tile.icon || 'sparkle'} /></span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block text-sm font-semibold text-[#1A1815] leading-tight">{tile.label}</span>
        {tile.sub ? <span className="block text-xs text-[#5A5751] mt-0.5 leading-snug">{tile.sub}</span> : null}
      </span>
      <span aria-hidden="true" className="text-[#5A5751] shrink-0">→</span>
    </>
  );
  const cls = `${TLC_CARD} flex items-center gap-3 w-full hover:border-[#B85838] transition-colors ${FOCUS}`;
  if (tile.href) {
    return <a href={tile.href} target="_blank" rel="noopener noreferrer" className={cls} data-testid={`tlc-home-tile-${tile.id}`}>{inner}</a>;
  }
  return <button type="button" onClick={tile.onOpen} className={cls} data-testid={`tlc-home-tile-${tile.id}`}>{inner}</button>;
}

export default function TlcHome({
  signedIn = false,
  name = '',
  tiles = [],
  onSignIn = null,
  onCreateAccount = null,
  onBrowse = null,
  hour = new Date().getHours(),
}) {
  return (
    <div className="space-y-5 sm:space-y-6" data-testid="tlc-home">
      {signedIn ? (
        <section className="flex items-center gap-3" aria-label="Welcome">
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#1A1815] text-white shrink-0" aria-hidden="true"><UiIcon name="heart" /></span>
          <div className="min-w-0">
            <p className="text-sm text-[#5A5751]">{greetingFor(hour)},</p>
            <h2 className="text-2xl leading-tight truncate" style={SERIF}>{name || 'Welcome'}</h2>
            <p className="text-xs text-[#5A5751] mt-0.5">{TLC_BRAND.tagline}</p>
          </div>
        </section>
      ) : (
        <section className="rounded-3xl bg-[#1A1815] text-white p-6 sm:p-8" aria-label="Welcome">
          <div className="flex items-center gap-3 mb-5">
            <span className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-white text-[#1A1815] shrink-0" aria-hidden="true"><UiIcon name="heart" /></span>
            <div className="leading-tight">
              <div className="text-2xl" style={SERIF}>TLC</div>
              <div className="text-[0.625rem] uppercase tracking-[0.3em]">Therapy Solutions</div>
            </div>
          </div>
          <p className="text-3xl sm:text-4xl leading-tight mb-2" style={SERIF}>{TLC_BRAND.tagline}</p>
          <p className="text-sm sm:text-base opacity-90 mb-6">{TLC_BRAND.blurb}</p>
          <div className="flex flex-col gap-2.5 max-w-xs">
            <button type="button" onClick={onSignIn} className={`inline-flex items-center justify-center min-h-[3rem] px-6 rounded-full bg-white text-[#1A1815] text-sm font-semibold hover:bg-[#E8E4DC] transition-colors ${FOCUS}`}>Sign in</button>
            <button type="button" onClick={onCreateAccount} className={`inline-flex items-center justify-center min-h-[3rem] px-6 rounded-full border border-white text-white text-sm font-semibold hover:bg-white hover:text-[#1A1815] transition-colors ${FOCUS}`}>Create an account</button>
            <button type="button" onClick={onBrowse} className={`text-center text-xs underline opacity-90 py-1 ${FOCUS}`}>Continue without an account</button>
          </div>
        </section>
      )}

      <section className="rounded-3xl bg-[#E8E4DC] p-5 sm:p-6" aria-label="A word for today">
        <div className={TLC_EYEBROW}>From the Word</div>
        <p className="text-lg sm:text-xl leading-snug text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{HOME_VERSE}</p>
        <p className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] mt-2">KJV</p>
      </section>

      {tiles.length > 0 && (
        <section aria-label="Quick actions">
          <div className="ts-grid-collapse grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tiles.map((t) => <Tile key={t.id} tile={t} />)}
          </div>
        </section>
      )}

      <a href={TLC_BRAND.bookingUrl} target="_blank" rel="noopener noreferrer" className={`${TLC_CARD} flex items-center gap-3 hover:border-[#B85838] transition-colors ${FOCUS}`} data-testid="tlc-home-schedule">
        <span className={TLC_ICON_WELL} aria-hidden="true"><UiIcon name="calendar" /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-[#1A1815]">Need to schedule?</span>
          <span className="block text-xs text-[#5A5751] mt-0.5">Book an appointment online</span>
        </span>
        <span aria-hidden="true" className="text-[#5A5751]">→</span>
      </a>
    </div>
  );
}
