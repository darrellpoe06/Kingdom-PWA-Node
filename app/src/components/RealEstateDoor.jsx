// =============================================================================
// RealEstateDoor — the Real Estate tab wears the Poe Properties face
// =============================================================================
// Darrell, 2026-10-21 at 01:35, on his phone: "real estate needs a makeover
// too... it looks bland... boring..." — then, settling it himself, "Maybe
// makeover Real Estate tab and the we keep it." And then the shape of the
// makeover, in his own words: "Real Estate can also look like Properties...
// and have the new features we discussed earlier... the we could have the Real
// Estate features still inside the Poe Properties App."
//
// Measured before anything was drawn (a real Chromium on the built dist at
// 360px): the door opened on a 10px grey "PROPERTIES · N" label and a stack of
// near-identical white cards, with not one figure about the portfolio on the
// first screen. The state WAS there — one tab over, in Portfolio & payoff, or
// derivable from rows already loaded. This band brings it to the door.
//
// IT LOOKS LIKE PROPERTIES BY USING PROPERTIES' OWN STYLESHEET, not by copying
// its hex values. `WELCOME_CSS` (components/PoePropertiesWelcome.jsx) scopes
// the whole `--pp-*` palette to a `.pp-door` element and remaps it once for
// midnight, so a scoped island inherits the Playfair headings, the gold rule,
// the white `.pp-panel`, the auto-fit `.pp-cards` grid and the red pill button
// AND stays legible in every theme. That is exactly the pattern
// `modules/properties/PropertiesTab.jsx:79` already uses to host the front
// door inside the PoeTech shell, repeated here — one stylesheet, one palette,
// two surfaces, no fork.
//
// Pure display. Every number is handed in from lib/real-estate-door.js, which
// derives it from the real rows (the `rentals` table, the `leases` +
// `rent_payments` ledger, the incident list, the six stores a property record
// keeps). Nothing here invents a figure, and a month the ledger cannot speak
// for says so in words instead of drawing an empty bar (DR-0076 §8).
// Standalone-mountable on purpose, so the feature gate can walk its controls
// (DR-0726) and so the Poe Properties app can mount the same band.
//
// ON THE RED (DR-0099): `--pp-red` is Poe Properties' shipped brand red, and
// it is used here exactly as that door uses it — on chrome: the kicker, a
// pill, the meter fill, the button. It never marks the Scripture, which is set
// in `--pp-muted`; no color meaning is assigned to the Word on this surface.
//
// Recorded as DR-1169.
// =============================================================================
import React from 'react';
import { WELCOME_CSS } from './PoePropertiesWelcome.jsx';
import { useThemePref } from '../lib/theme-css.js';

const fmt = (n) => (n == null || !isFinite(n) ? '—' : `${n < 0 ? '-' : ''}$${Math.abs(Math.round(n)).toLocaleString()}`);

// The band's own classes, all defined in WELCOME_CSS's RealEstate block.
// `pp-good` / `pp-watch` are the two non-brand accents this surface needs —
// defined there as --pp-* tokens with a midnight remap, never as inline hex,
// because an inline color cannot be remapped and goes dark-on-dark.
const TONE_CLASS = { green: 'pp-good', rust: 'pp-red', watch: 'pp-watch', muted: 'pp-mute', ink: '' };

/**
 * @param {object} props
 * @param {object} props.state   the value of lib/real-estate-door.js doorState()
 * @param {string|null} props.focus  the attention band the list is filtered to
 * @param {(key: string|null) => void} props.onFocus  focus that band, or clear it
 * @param {boolean} props.scoped  false when the host already provides `.pp-door`
 *   (inside the Poe Properties app), so the palette and the stylesheet are not
 *   declared twice.
 */
export default function RealEstateDoor({ state, focus = null, onFocus = () => {}, scoped = true }) {
  const [theme] = useThemePref('cream');
  if (!state) return null;
  const { doors, properties, label, collected, holds, attention, allClear, clear, personal, service } = state;

  const band = (
    <section data-testid="real-estate-door" aria-label="This portfolio, at a glance" className="pp-re">
      {/* The name of the thing, and how big it is — read from the rows. */}
      <div className="pp-panel pp-re-head">
        <span className="pp-kicker">Real Estate · {label}</span>
        <h2 className="pp-panel-title">
          {doors} {doors === 1 ? 'door' : 'doors'}
          {properties !== doors && <span className="pp-mute"> · {properties} {properties === 1 ? 'property' : 'properties'}</span>}
        </h2>
        <div className="pp-rule" />
        {personal > 0 && (
          <p className="pp-panel-note">
            {personal} more {personal === 1 ? 'is' : 'are'} the family&apos;s own home, counted separately.
          </p>
        )}

        {/* This month, against the lease ledger — or why it cannot say. */}
        <div className="pp-eyebrow">Rent this month</div>
        {collected.known ? (
          <div data-testid="re-door-collected">
            <div
              className="pp-meter"
              role="img"
              aria-label={`${collected.percent}% of this month's rent received`}
            >
              <span className="pp-meter-fill" style={{ width: `${Math.max(0, Math.min(100, collected.percent))}%` }} />
            </div>
            <p className="pp-re-line">
              <strong>{fmt(collected.received)}</strong> of {fmt(collected.expected)} due · {collected.doorsPaid} of {collected.doorsCounted} {collected.doorsCounted === 1 ? 'door' : 'doors'} paid
              {collected.doorsPartial > 0 && <> · {collected.doorsPartial} part-paid</>}
            </p>
            {collected.note && <p className="pp-re-note">{collected.note}</p>}
          </div>
        ) : (
          <p data-testid="re-door-collected-unknown" className="pp-re-note">{collected.note}</p>
        )}
      </div>

      {/* What it holds. Sums of figures actually on the rows; a sub-line says
          how many are entered whenever some are not. The same auto-fit grid
          the front page's portal cards ride. */}
      <ul className="pp-cards pp-re-stats">
        {holds.map((h) => (
          <li key={h.key} className="pp-panel pp-stat">
            <span className="pp-stat-label">{h.label}</span>
            <span className={`pp-stat-value ${TONE_CLASS[h.tone] || ''}`}>{fmt(h.value)}</span>
            {h.sub && <span className="pp-stat-sub">{h.sub}</span>}
          </li>
        ))}
      </ul>

      {/* What wants a person today. Each chip carries a real count and opens
          exactly those doors in the list below. */}
      <div className="pp-panel">
        <span className="pp-kicker">What wants you today</span>
        {allClear ? (
          <p data-testid="re-door-all-clear" className="pp-panel-lead pp-good">
            Every door is rented, paying, and carries its figures. Nothing is waiting on you here.
          </p>
        ) : attention.length === 0 ? (
          <p className="pp-panel-note">No property is on the books yet — add the first one above.</p>
        ) : (
          <div className="pp-re-bands">
            {attention.map((b) => (
              <button
                key={b.key}
                type="button"
                data-testid={`re-door-focus-${b.key}`}
                aria-pressed={focus === b.key}
                onClick={() => onFocus(focus === b.key ? null : b.key)}
                className={`pp-band${focus === b.key ? ' is-on' : ''}`}
              >
                <span className={`pp-band-n ${TONE_CLASS[b.tone] || ''}`}>{b.count}</span>
                <span className="pp-band-w">{b.count === 1 ? 'door' : 'doors'} {b.label}</span>
              </button>
            ))}
          </div>
        )}
        {focus && (
          <button type="button" data-testid="re-door-show-all" onClick={() => onFocus(null)} className="pp-back pp-re-back">
            ← Show every door again
          </button>
        )}
      </div>

      {/* THE LEVEL OF SERVICE, ON RECORD. Darrell 2026-10-21: "If a potential
          tenant uses the app they will be able to see the level of services
          that were provided by us." A trust figure, so every one of these is
          counted off a row that already exists — resolved incident dates, the
          open ones against their own due dates, and the six stores a property
          record keeps. The typical-days figure names how many incidents it
          could actually time; one that cannot be timed is excluded and said,
          never averaged in (DR-0076 §8). */}
      {service && service.known && (
        <div data-testid="re-door-service" className="pp-panel">
          <span className="pp-kicker">The service on record</span>
          <p className="pp-panel-lead">
            {service.answered > 0
              ? <><strong>{service.answered}</strong> {service.answered === 1 ? 'issue' : 'issues'} answered and closed</>
              : <>No issue has been closed yet</>}
            {service.typicalDays != null && (
              <>, typically in <strong>{service.typicalDays}</strong> {service.typicalDays === 1 ? 'day' : 'days'}</>
            )}
            {service.openNow > 0 && (
              <> · <strong>{service.openNow}</strong> open now
                {service.overdue != null && (service.overdue > 0
                  ? <span className="pp-red">, {service.overdue} past the day promised</span>
                  : <span className="pp-good">, all inside the day promised</span>)}
              </>
            )}.
          </p>
          {service.filed > 0 && (
            <p className="pp-re-line">
              On file: {service.photos} {service.photos === 1 ? 'photo' : 'photos'} · {service.maintenance} maintenance · {service.rooms} {service.rooms === 1 ? 'room' : 'rooms'} · {service.systems} {service.systems === 1 ? 'system' : 'systems'} · {service.notes} {service.notes === 1 ? 'note' : 'notes'}
            </p>
          )}
          {service.unmeasured > 0 && (
            <p className="pp-re-note">
              {service.measured} of {service.answered} carry both dates; the rest are counted but not timed.
            </p>
          )}
        </div>
      )}

      {/* The payoff line, off the real mortgage rows, and the one verse this
          whole tab is for. KJV, quoted exactly as it is written. */}
      <div className="pp-panel">
        {clear && (
          <p className="pp-panel-lead">
            At today&apos;s payments every note clears in <strong>{clear.years.toFixed(1)} years</strong>
            {clear.date ? <> — {clear.date}</> : null}.{' '}
            {clear.bySeven
              ? <span className="pp-good">Inside the seventh year.</span>
              : <span className="pp-watch">Past the seventh year as it stands.</span>}
          </p>
        )}
        <p className="pp-verse">
          &ldquo;Be thou diligent to know the state of thy flocks, and look well to thy herds.&rdquo;{' '}
          <span className="pp-verse-ref">KJV — Proverbs 27:23</span>
        </p>
      </div>
    </section>
  );

  // Inside the Poe Properties app the host already is a `.pp-door`, so the
  // island would declare the palette and the stylesheet twice. On the Real
  // Estate tab it is the island itself.
  if (!scoped) return band;
  return (
    <div data-theme={theme === 'cream' ? undefined : theme} className="pp-door pp-re-door" data-testid="real-estate-door-scope">
      <style>{WELCOME_CSS}</style>
      {band}
    </div>
  );
}
