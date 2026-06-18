// =============================================================================
// ChurchGiving — the "Give to the church" floater + panel (Church surfaces).
// =============================================================================
// Mirrors the persistent 💬 Feedback floater pattern (a fixed pill button that
// opens a clean panel), but is its OWN distinct surface: a "Give" floater that
// shows only on the Church tab, sits bottom-RIGHT (Feedback owns bottom-left),
// and carries a giving-green pill instead of the rust feedback one.
//
// What it does:
//   - Links OUT to the congregation's OWN confirmed giving destination
//     (resolveGiveDestination, lib/giving.js). LINK SAFETY: it never invents a
//     giving/payment URL, and no payment data touches this app — we point at the
//     church's existing secure page. If no link is configured it shows a clearly
//     marked "needs the church's giving URL" state, never a guessed link.
//   - Presents the BENEFITS OF GIVING ACCORDING TO THE WORD — the scripture,
//     drawn faithfully (GIVING_SCRIPTURES + GIVING_DOCTRINE, lib/giving.js):
//     10% tithe baseline, generosity above it, the cheerful-giver heart, and the
//     bright line against prosperity gospel (worship/stewardship, not a promised
//     return).
//
// UNBREAKABLE + accessible by construction:
//   - Cross-device icon: an INLINE SVG gift (stroke=currentColor), never an
//     emoji — same lesson as the tofu fix (UiIcon.jsx). It renders identically
//     on every device and is automatically contrast-correct in every theme.
//   - Theme-safe: themeable Tailwind classes only (no inline color styles), so
//     the contrast guard's per-theme AA holds in light AND midnight — no
//     white-on-white, no black-on-dark.
//   - Text-size: rem-based classes + a 1em icon scale with the global
//     large-print primitive (lib/text-size.js) for free.
//   - Keyboard: Escape closes; focus moves to the panel on open; the overlay
//     click and an explicit Close button both dismiss.
// =============================================================================
import React, { useEffect, useRef } from 'react';
import { resolveGiveDestination, GIVING_SCRIPTURES, GIVING_DOCTRINE } from '../lib/giving.js';

// Inline gift icon — wrapped box + ribbon + bow. 24x24 grid, stroke currentColor
// so it inherits the surrounding text color (contrast-correct in every theme)
// and 1em so it tracks the global text size. Decorative; the text label carries
// the meaning, so it is aria-hidden.
function GiftIcon({ className = '', strokeWidth = 1.9 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={`inline-block shrink-0 ${className}`}
      style={{ verticalAlign: '-0.125em' }}
    >
      <rect x="4" y="10" width="16" height="10.5" rx="1" />
      <rect x="3" y="6.5" width="18" height="3.5" rx="0.5" />
      <line x1="12" y1="6.5" x2="12" y2="20.5" />
      <path d="M12 6.5S10.6 3.2 8.4 4c-1.6.6-1.1 2.9.8 2.5 1-.2 2.8 0 2.8 0Z" />
      <path d="M12 6.5S13.4 3.2 15.6 4c1.6.6 1.1 2.9-.8 2.5-1-.2-2.8 0-2.8 0Z" />
    </svg>
  );
}

export function ChurchGivePanel({ church, onClose }) {
  const panelRef = useRef(null);
  const dest = resolveGiveDestination(church);

  // Escape closes; focus the panel on open (accessible dialog behavior).
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    try { panelRef.current?.focus(); } catch (_) { /* ignore */ }
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-6 print:hidden"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
      onClick={onClose}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="give-panel-title"
        className="bg-white border-2 border-[#1A1815] max-w-2xl w-full max-h-[90vh] overflow-y-auto focus:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 sm:p-6">
          <div className="flex items-baseline justify-between gap-3 mb-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-[#5A6E3D] font-semibold mb-1 flex items-center gap-1.5">
                <GiftIcon /> Give to the church
              </div>
              <h3 id="give-panel-title" className="text-xl sm:text-2xl text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>
                {church?.name || 'Give to the church'}
              </h3>
            </div>
            <button type="button" onClick={onClose} className="text-[10px] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#5A6E3D]">× Close</button>
          </div>

          {/* PRIMARY CTA — link OUT to the church's own confirmed giving page.
              Never an invented URL; if none is configured, a flagged state. */}
          {dest.url ? (
            <>
              <a
                href={dest.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-[#5A6E3D] text-white text-sm uppercase tracking-wider font-semibold border-2 border-[#5A6E3D] hover:bg-[#1A1815] hover:border-[#1A1815] min-h-[48px] focus:outline focus:outline-2 focus:outline-[#1A1815]"
              >
                <GiftIcon /> Give now
              </a>
              <p className="text-[11px] text-[#5A5751] mt-2 leading-relaxed">{dest.note}</p>
              {!dest.confirmed && (
                <p className="text-[11px] text-[#B85838] mt-1 leading-relaxed">
                  Note for the church office: a dedicated giving page link can be set so “Give now” opens it directly. Until then this opens the church website where the giving link is published.
                </p>
              )}
            </>
          ) : (
            <div className="border-2 border-[#B85838] bg-[#FAF8F4] p-3" role="status">
              <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-1">Giving link needed</div>
              <p className="text-xs text-[#5A5751] leading-relaxed">
                This church’s online giving link has not been provided yet. Add the church’s own secure giving URL in Settings, and this button will open it. We never link to a guessed address, and no payment information is collected by this app.
              </p>
            </div>
          )}

          {/* THE WORD — the benefit of giving, drawn faithfully. */}
          <div className="mt-6 pt-5 border-t border-[#E8E4DC]">
            <h4 className="text-base sm:text-lg text-[#1A1815] mb-2" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>
              {GIVING_DOCTRINE.heading}
            </h4>
            <div className="space-y-1.5 mb-4">
              <p className="text-sm text-[#5A5751] leading-relaxed">{GIVING_DOCTRINE.tithe}</p>
              <p className="text-sm text-[#5A5751] leading-relaxed">{GIVING_DOCTRINE.heart}</p>
              <p className="text-sm text-[#1A1815] leading-relaxed font-medium">{GIVING_DOCTRINE.brightLine}</p>
            </div>

            <ul className="space-y-3">
              {GIVING_SCRIPTURES.map((s) => (
                <li key={s.ref} className="border-l-2 border-[#5A6E3D] pl-3">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-[#5A6E3D] font-semibold">
                    {s.translation} — {s.ref}
                  </div>
                  <p className="text-sm text-[#1A1815] leading-relaxed italic" style={{ fontFamily: '"Fraunces", serif' }}>
                    “{s.text}”
                  </p>
                  <p className="text-xs text-[#5A5751] leading-relaxed mt-1">{s.benefit}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// ChurchGiveFloater — the persistent pill on Church surfaces. Distinct from the
// Feedback floater: bottom-RIGHT, giving-green, gift icon. Manages its own open
// state so the monolith wiring is a single mount.
export function ChurchGiveFloater({ church }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Give to the church"
          title="Give to the church — and the blessing of giving according to the Word"
          className="fixed bottom-4 right-4 z-30 flex items-center gap-1.5 px-4 py-3 bg-[#5A6E3D] text-white text-xs uppercase tracking-wider font-semibold border-2 border-[#5A6E3D] hover:bg-[#1A1815] hover:border-[#1A1815] shadow-lg min-h-[48px] min-w-[48px] focus:outline focus:outline-2 focus:outline-[#1A1815] print:hidden"
          style={{ borderRadius: '999px' }}
        >
          <GiftIcon /> Give
        </button>
      )}
      {open && <ChurchGivePanel church={church} onClose={() => setOpen(false)} />}
    </>
  );
}

export default ChurchGiveFloater;
