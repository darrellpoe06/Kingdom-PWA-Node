// =============================================================================
// RealEstateDoor — the first thing the Real Estate tab says
// =============================================================================
// Darrell, 2026-10-21 at 01:35, on his phone: "real estate needs a makeover
// too... it looks bland... boring..." — then, settling it himself, "Maybe
// makeover Real Estate tab and the we keep it."
//
// Measured before anything was drawn (a real Chromium on the built dist at
// 360px): the door opened on a 10px grey "PROPERTIES · N" label and a stack of
// near-identical white cards, with not one figure about the portfolio on the
// first screen. The state WAS there — one tab over, in Portfolio & payoff, or
// derivable from rows already loaded. This band brings it to the door.
//
// Pure display. Every number is handed in from lib/real-estate-door.js, which
// derives it from the real rows (the `rentals` table, the `leases` +
// `rent_payments` ledger, the incident list). Nothing here invents a figure,
// and a month the ledger cannot speak for says so in words instead of drawing
// an empty bar (DR-0076 §8). Standalone-mountable on purpose, so the feature
// gate can walk its controls (DR-0726).
//
// Colors come from the app's existing tokens as CLASSES, never inline, so each
// theme remaps them (contrast-guard). True red appears nowhere: the Blood is
// the only thing it marks (DR-0099). The rust here is the brand's #B85838 on
// the WHITE card, where it measures 4.68:1 — AA — rather than on the cream
// base where the same token is a known sub-AA warning.
//
// Recorded as DR-1163.
// =============================================================================
import React from 'react';
import { PaidBar } from './RentLedger.jsx';

const fmt = (n) => (n == null || !isFinite(n) ? '—' : `${n < 0 ? '-' : ''}$${Math.abs(Math.round(n)).toLocaleString()}`);
const SERIF = { fontFamily: '"Fraunces", serif' };
const MONO = { fontFamily: '"JetBrains Mono", monospace' };

// Tone → the themeable text class. ONLY the three accent tokens the contrast
// guard tracks and every theme remaps are used, because an untracked literal
// cannot be remapped and would render dark-on-dark in midnight. The urgency
// amber (#D97706) that the incident band in Rentals.jsx uses was measured here
// first and REFUSED: 3.08-3.19:1 on the card across ten of eleven themes, well
// under AA. 'watch' is the tracked blue instead (DR-0076 §4 — measured, never
// claimed). Nothing here is true red; the Blood keeps that color (DR-0099).
const TONE_TEXT = {
  green: 'text-[#5A6E3D]',
  rust: 'text-[#B85838]',
  watch: 'text-[#2A5A8E]',
  muted: 'text-[#5A5751]',
  ink: 'text-[#1A1815]',
};
const TONE_EDGE = {
  green: 'border-[#5A6E3D]',
  rust: 'border-[#B85838]',
  watch: 'border-[#2A5A8E]',
  muted: 'border-[#E8E4DC]',
  ink: 'border-[#1A1815]',
};

/**
 * @param {object} props
 * @param {object} props.state   the value of lib/real-estate-door.js doorState()
 * @param {string|null} props.focus  the attention band the list is filtered to
 * @param {(key: string|null) => void} props.onFocus  focus that band, or clear it
 */
export default function RealEstateDoor({ state, focus = null, onFocus = () => {} }) {
  if (!state) return null;
  const { doors, properties, label, collected, holds, attention, allClear, clear, personal } = state;

  return (
    <section
      data-testid="real-estate-door"
      aria-label="This portfolio, at a glance"
      className="bg-white border border-[#1A1815] rounded-2xl shadow-sm overflow-hidden mb-4"
    >
      {/* The name of the thing, and how big it is — read from the rows. */}
      <div className="px-4 pt-4 pb-3 border-b border-[#E8E4DC]">
        <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold">Real Estate · {label}</div>
        <h2 className="text-2xl sm:text-3xl text-[#1A1815] leading-tight mt-1" style={{ ...SERIF, fontWeight: 600, letterSpacing: '-0.02em' }}>
          {doors} {doors === 1 ? 'door' : 'doors'}
          {properties !== doors && <span className="text-[#5A5751]"> · {properties} {properties === 1 ? 'property' : 'properties'}</span>}
        </h2>
        {personal > 0 && (
          <p className="text-[0.6875rem] text-[#5A5751] mt-1" style={SERIF}>
            {personal} more {personal === 1 ? 'is' : 'are'} the family&apos;s own home, counted separately.
          </p>
        )}
      </div>

      {/* This month, against the lease ledger — or why it cannot say. */}
      <div className="px-4 py-3 border-b border-[#E8E4DC] bg-[#FAF8F4]">
        <div className="text-[0.5625rem] uppercase tracking-[0.2em] text-[#5A5751] mb-1.5">Rent this month</div>
        {collected.known ? (
          <div data-testid="re-door-collected">
            <PaidBar received={collected.received} expected={collected.expected} />
            <p className="text-[0.6875rem] text-[#1A1815] mt-1.5" style={MONO}>
              {fmt(collected.received)} of {fmt(collected.expected)} due · {collected.doorsPaid} of {collected.doorsCounted} {collected.doorsCounted === 1 ? 'door' : 'doors'} paid
              {collected.doorsPartial > 0 && <span className="font-semibold"> · {collected.doorsPartial} part-paid</span>}
            </p>
            {collected.note && <p className="text-[0.625rem] text-[#5A5751] italic mt-1" style={SERIF}>{collected.note}</p>}
          </div>
        ) : (
          <p data-testid="re-door-collected-unknown" className="text-[0.75rem] text-[#5A5751] italic" style={SERIF}>{collected.note}</p>
        )}
      </div>

      {/* What it holds. Sums of figures actually on the rows; a sub-line says
          how many are entered whenever some are not. */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#E8E4DC]">
        {holds.map((h) => (
          <div key={h.key} className="bg-white px-3 py-2.5">
            <div className="text-[0.5625rem] uppercase tracking-[0.15em] text-[#5A5751] leading-tight">{h.label}</div>
            <div className={`text-lg sm:text-xl leading-tight ${TONE_TEXT[h.tone] || TONE_TEXT.ink}`} style={{ ...SERIF, fontWeight: 500 }}>{fmt(h.value)}</div>
            {h.sub && <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] mt-0.5 leading-tight">{h.sub}</div>}
          </div>
        ))}
      </div>

      {/* What wants a person today. Each chip carries a real count and opens
          exactly those doors in the list below. */}
      <div className="px-4 py-3 border-t border-[#E8E4DC]">
        <div className="text-[0.5625rem] uppercase tracking-[0.2em] text-[#5A5751] mb-2">What wants you today</div>
        {allClear ? (
          <p data-testid="re-door-all-clear" className="text-[0.8125rem] text-[#5A6E3D]" style={SERIF}>
            Every door is rented, paying, and carries its figures. Nothing is waiting on you here.
          </p>
        ) : attention.length === 0 ? (
          <p className="text-[0.8125rem] text-[#5A5751] italic" style={SERIF}>No property is on the books yet — add the first one above.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {attention.map((b) => (
              <button
                key={b.key}
                type="button"
                data-testid={`re-door-focus-${b.key}`}
                aria-pressed={focus === b.key}
                onClick={() => onFocus(focus === b.key ? null : b.key)}
                className={`text-left px-3 py-2 min-h-[44px] border bg-white hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838] ${focus === b.key ? 'border-[#1A1815]' : TONE_EDGE[b.tone] || TONE_EDGE.muted}`}
              >
                <span className={`text-base ${TONE_TEXT[b.tone] || TONE_TEXT.ink}`} style={{ ...SERIF, fontWeight: 600 }}>{b.count}</span>
                <span className="text-[0.6875rem] text-[#1A1815] ml-1.5" style={SERIF}>{b.count === 1 ? 'door' : 'doors'} {b.label}</span>
              </button>
            ))}
          </div>
        )}
        {focus && (
          <button
            type="button"
            data-testid="re-door-show-all"
            onClick={() => onFocus(null)}
            className="mt-2 text-[0.625rem] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] min-h-[44px] px-1 focus:outline focus:outline-2 focus:outline-[#B85838]"
          >
            ← Show every door again
          </button>
        )}
      </div>

      {/* The payoff line, off the real mortgage rows, and the one verse this
          whole tab is for. KJV, quoted exactly as it is written. */}
      <div className="px-4 py-3 border-t border-[#E8E4DC] bg-white">
        {clear && (
          <p className="text-[0.8125rem] text-[#1A1815] mb-1.5" style={SERIF}>
            At today&apos;s payments every note clears in <strong>{clear.years.toFixed(1)} years</strong>
            {clear.date ? <> — {clear.date}</> : null}.{' '}
            {clear.bySeven
              ? <span className="text-[#5A6E3D]">Inside the seventh year.</span>
              : <span className="text-[#B85838]">Past the seventh year as it stands.</span>}
          </p>
        )}
        <p className="text-[0.6875rem] text-[#5A5751] italic" style={SERIF}>
          &ldquo;Be thou diligent to know the state of thy flocks, and look well to thy herds.&rdquo; <span className="not-italic uppercase tracking-wider text-[0.5625rem]">KJV — Proverbs 27:23</span>
        </p>
      </div>
    </section>
  );
}
