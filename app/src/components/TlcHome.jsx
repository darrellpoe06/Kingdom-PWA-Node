// =============================================================================
// TlcHome — the home of the TLC app, drawn the reference's way (DR-1171, DR-1197)
// =============================================================================
// Darrell, 2026-10-21, with DR-1156 and DR-1170 live on his phone: "It's better
// but it does not look like this at all" — and, with DR-1171 live: "Still does
// not look like this." The reference's home: a greeting with the person's
// picture, a quote card on a dark field, a 2x2 of quick actions with an icon
// in each, a "need to schedule?" row, a bottom bar. Every tile here opens a
// section the door already has; nothing is new. The welcome (Sign in / Create
// an account) is its own screen now (TlcWelcome.jsx), so this is the home
// for everyone past it: a guest meets "Welcome", a signed-in person their name.
// PURE presentation: the words come from tlc-practice.js and the sections
// the door passes in; the verse is the KJV line the Learn space already
// carries verbatim (PracticeLearn.jsx), never typed from memory (DR-0076).
// =============================================================================
import React from 'react';
import UiIcon from './UiIcon.jsx';
import { TLC_BRAND } from '../lib/tlc-practice.js';
import { TLC_CARD, TLC_ICON_WELL, TLC_PORTRAIT } from '../lib/tlc-ui.js';

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

/** A quiet leaf, drawn once, for the corner of the quote card (decoration only). */
function Leaf({ className = '' }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className} fill="currentColor">
      <path d="M58 6C34 6 12 22 8 50c-1 4 1 8 5 8 28-4 44-26 45-52z" opacity="0.9" />
      <path d="M12 56C24 40 36 28 54 12" stroke="#FAF8F4" strokeWidth="1.5" fill="none" opacity="0.5" />
    </svg>
  );
}

// A quick action: the icon in its well, the label, the arrow — a square-ish
// card so two sit side by side on a phone, the reference's 2x2.
function Tile({ tile }) {
  const inner = (
    <>
      <span className={TLC_ICON_WELL} aria-hidden="true"><UiIcon name={tile.icon || 'sparkle'} /></span>
      <span className="flex items-end justify-between gap-2 mt-4">
        <span className="min-w-0 text-left">
          <span className="block text-sm font-semibold text-[#1A1815] leading-snug">{tile.label}</span>
          {tile.sub ? <span className="block text-xs text-[#5A5751] mt-0.5 leading-snug">{tile.sub}</span> : null}
        </span>
        <span aria-hidden="true" className="text-[#5A5751] shrink-0 pb-0.5">→</span>
      </span>
    </>
  );
  const cls = `${TLC_CARD} flex flex-col justify-between w-full min-h-[8.5rem] hover:border-[#B85838] transition-colors ${FOCUS}`;
  if (tile.href) {
    return <a href={tile.href} target="_blank" rel="noopener noreferrer" className={cls} data-testid={`tlc-home-tile-${tile.id}`}>{inner}</a>;
  }
  return <button type="button" onClick={tile.onOpen} className={cls} data-testid={`tlc-home-tile-${tile.id}`}>{inner}</button>;
}

export default function TlcHome({
  signedIn = false,
  name = '',
  photo = '',
  tiles = [],
  hour = new Date().getHours(),
}) {
  const who = signedIn ? (name || 'Welcome') : 'Welcome';
  return (
    <div className="space-y-5 sm:space-y-6" data-testid="tlc-home">
      {/* The greeting: the person's own picture when they have one, the
          brand's heart until they do; the hour's greeting; their name. */}
      <section className="flex items-center gap-3" aria-label="Welcome">
        {photo
          ? <img src={photo} alt="" width="48" height="48" className={`${TLC_PORTRAIT} w-12 h-12`} />
          : <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#1A1815] text-white shrink-0" aria-hidden="true"><UiIcon name="heart" /></span>}
        <div className="min-w-0">
          <p className="text-sm text-[#5A5751]">{greetingFor(hour)},</p>
          <h2 className="text-2xl leading-tight truncate" style={SERIF}>{who}</h2>
          <p className="text-xs text-[#5A5751] mt-0.5">{signedIn ? TLC_BRAND.tagline : 'Sign in to keep your place in your lessons.'}</p>
        </div>
      </section>

      {/* The quote card on the dark field (the theme paints it forest), the
          Word's own line, the leaf in the corner. */}
      <section className="relative overflow-hidden rounded-3xl bg-[#1A1815] text-white p-6 sm:p-8 min-h-[9rem] flex flex-col justify-center" aria-label="A word for today">
        <Leaf className="absolute -right-3 -bottom-4 w-28 h-28 text-[#E8E4DC] opacity-30" />
        <p className="relative text-xl sm:text-2xl leading-snug sm:w-96" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>“{HOME_VERSE.replace(/\s*\(Proverbs 4:7\)\.$/, '.')}”</p>
        <p className="relative text-[0.625rem] uppercase tracking-[0.3em] mt-3 opacity-80">Proverbs 4:7 · KJV</p>
      </section>

      {tiles.length > 0 && (
        <section aria-label="Quick actions">
          <div className="ts-grid-collapse grid grid-cols-2 gap-3">
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
