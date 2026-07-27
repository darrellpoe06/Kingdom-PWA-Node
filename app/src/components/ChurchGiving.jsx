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
import React, { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { resolveGiveDestination, GIVING_CHANNELS, GIVING_SCRIPTURES, GIVING_DOCTRINE } from '../lib/giving.js';
import { useIdleReveal } from '../lib/use-idle-reveal.js';
import { callToGiveCoverage, TRANSCRIPT_PIPELINE_NOTE, LINKED_SERVICE_VIDEO } from '../lib/call-to-give.js';
import { fetchCallToGiveArchive } from '../lib/call-to-give-sync.js';

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

// CallToGiveArchive — the church's own Call to Give, sourced from OUR services
// (DR-0134). Derived live: the same choir_sermons corpus + the same
// video_transcripts rows the sermon library reads; detected segments always
// carry needs-review until the church confirms them. Signed-out visitors (RLS)
// get the honest signed-in note, never a painted archive.
export function CallToGiveArchive() {
  const [state, setState] = useState({ loading: true, archive: [], error: false });
  const load = React.useCallback(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: false }));
    fetchCallToGiveArchive()
      .then(({ archive }) => { if (alive) setState({ loading: false, archive, error: false }); })
      // A real fetch/RLS FAILURE is NOT the same as "no rows" — don't tell a
      // signed-in member to "sign in" when the read errored (DR-0076 honest states).
      .catch(() => { if (alive) setState({ loading: false, archive: [], error: true }); });
    return () => { alive = false; };
  }, []);
  useEffect(() => load(), [load]);

  const cov = callToGiveCoverage(state.archive);
  const detected = state.archive.filter((r) => r.segment).slice(0, 5);

  return (
    <div className="mt-6 pt-5 border-t border-[#E8E4DC]">
      <h4 className="text-base sm:text-lg text-[#1A1815] mb-1" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>
        The Call to Give — from our own services
      </h4>
      <p className="text-xs text-[#5A5751] leading-relaxed mb-2">
        Sourced from the same service videos and transcripts the sermon library reads — measured, never assumed.
        {' '}{TRANSCRIPT_PIPELINE_NOTE.answer}
      </p>

      {state.loading ? (
        <p className="text-xs text-[#5A5751]" role="status">Reading the service archive…</p>
      ) : state.error ? (
        <div className="border border-[#B85838] bg-[#FAF8F4] p-3" role="alert">
          <p className="text-xs text-[#1A1815] leading-relaxed">
            Couldn&rsquo;t load the service archive just now — this is a connection hiccup, not a sign-in problem.{' '}
            <button type="button" onClick={load} className="underline underline-offset-2 text-[#B85838] hover:text-[#1A1815]">Try again</button>.
          </p>
        </div>
      ) : state.archive.length === 0 ? (
        <div className="border border-[#E8E4DC] bg-[#FAF8F4] p-3" role="status">
          <p className="text-xs text-[#5A5751] leading-relaxed">
            No service rows are readable from here — sign in as a church member to see the archive. Nothing is shown that isn&rsquo;t real.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="px-2 py-0.5 text-[0.6875rem] border border-[#C9C2B6] bg-[#FAF8F4] text-[#1A1815]">{cov.corpus} service videos</span>
            <span className="px-2 py-0.5 text-[0.6875rem] border border-[#C9C2B6] bg-[#FAF8F4] text-[#1A1815]">{cov.withTranscript} transcribed</span>
            <span className="px-2 py-0.5 text-[0.6875rem] border border-[#C9C2B6] bg-[#FAF8F4] text-[#1A1815]">{cov.detected} Call-to-Give segments found</span>
            <span className="px-2 py-0.5 text-[0.6875rem] border border-[#C9C2B6] bg-[#FAF8F4] text-[#5A5751]">{cov.awaiting} awaiting transcript (NAS trickle loader)</span>
          </div>
          {detected.length === 0 ? (
            <p className="text-xs text-[#5A5751] leading-relaxed">
              No giving-appeal segments detected in the transcribed services yet — detection only runs where a real transcript exists, and it proposes; the church confirms.
            </p>
          ) : (
            <ul className="space-y-3">
              {detected.map((r) => (
                <li key={r.videoId} className="border-l-2 border-[#5A6E3D] pl-3">
                  <div className="text-[0.625rem] uppercase tracking-[0.2em] text-[#5A6E3D] font-semibold">
                    {r.serviceDate || 'undated'}{r.title ? ` — ${r.title}` : ''}
                  </div>
                  <p className="text-sm text-[#1A1815] leading-relaxed italic" style={{ fontFamily: '"Fraunces", serif' }}>
                    “{r.segment.excerpt}”
                  </p>
                  <p className="text-[0.6875rem] text-[#5A5751] mt-1">
                    confidence: {r.segment.confidence} · needs church review ·{' '}
                    <a href={r.youtubeUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-[#1A1815]">watch the service</a>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <p className="text-[0.6875rem] text-[#5A5751] mt-3 leading-relaxed">
        Latest linked service:{' '}
        <a href={LINKED_SERVICE_VIDEO.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-[#1A1815]">
          youtube.com/live/{LINKED_SERVICE_VIDEO.videoId}
        </a>
        {' '}— {LINKED_SERVICE_VIDEO.provenance}.
      </p>
    </div>
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
              <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#5A6E3D] font-semibold mb-1 flex items-center gap-1.5">
                <GiftIcon /> Give to the church
              </div>
              <h3 id="give-panel-title" className="text-xl sm:text-2xl text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>
                {church?.name || 'Give to the church'}
              </h3>
            </div>
            <button type="button" onClick={onClose} className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#5A6E3D]">× Close</button>
          </div>

          {/* THE WORD FIRST (Darrell 2026-07-27): the popup gives priority to
              the Word of Yahweh — the teaching leads, the channels follow. */}
          <div className="mb-4 border-l-2 border-[#5A6E3D] pl-3">
            <h4 className="text-base sm:text-lg text-[#1A1815] mb-1.5" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>
              {GIVING_DOCTRINE.heading}
            </h4>
            <div className="space-y-1.5">
              <p className="text-sm text-[#5A5751] leading-relaxed">{GIVING_DOCTRINE.tithe}</p>
              <p className="text-sm text-[#5A5751] leading-relaxed">{GIVING_DOCTRINE.heart}</p>
              <p className="text-sm text-[#1A1815] leading-relaxed font-medium">{GIVING_DOCTRINE.brightLine}</p>
            </div>
          </div>

          {/* THE CHURCH'S OWN GIVING CHANNELS (DR-0136) — decoded verbatim from
              the church's GIVE ONLINE slide. One tap on a phone opens the
              channel; the QR is there for a second device to scan. Slide order
              kept: Zelle, Cash App, Givelify, PayPal. */}
          <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A6E3D] font-semibold mb-2">Where to give</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
            {GIVING_CHANNELS.map((ch) => (
              <a
                key={ch.id}
                href={ch.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 border-2 border-[#5A6E3D] bg-[#FAF8F4] p-3 min-h-[64px] hover:bg-white focus:outline focus:outline-2 focus:outline-[#1A1815]"
              >
                <span className="shrink-0 bg-white p-1 border border-[#E8E4DC]" aria-hidden="true">
                  <QRCodeSVG value={ch.url} size={52} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-[#1A1815]">{ch.label}</span>
                  <span className="block text-[0.6875rem] text-[#5A6E3D] truncate">{ch.display}</span>
                  <span className="block text-[0.6875rem] text-[#5A5751] leading-snug">{ch.how}</span>
                </span>
              </a>
            ))}
          </div>
          <p className="text-[0.6875rem] text-[#5A5751] mb-3 leading-relaxed">
            These are the church&rsquo;s own published channels, taken exactly from its GIVE ONLINE slide.
            The app only opens them — no payment information is collected here.
          </p>

          {/* SECONDARY — the church's website, where giving is also published.
              Never an invented URL; if none is configured, a flagged state. */}
          {dest.url ? (
            <>
              <a
                href={dest.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-[#5A6E3D] text-white text-sm uppercase tracking-wider font-semibold border-2 border-[#5A6E3D] hover:bg-[#1A1815] hover:border-[#1A1815] min-h-[48px] focus:outline focus:outline-2 focus:outline-[#1A1815]"
              >
                <GiftIcon /> More ways to give — church website
              </a>
              <p className="text-[0.6875rem] text-[#5A5751] mt-2 leading-relaxed">{dest.note}</p>
              {!dest.confirmed && (
                <p className="text-[0.6875rem] text-[#B85838] mt-1 leading-relaxed">
                  Note for the church office: a dedicated giving page link can be set so “Give now” opens it directly. Until then this opens the church website where the giving link is published.
                </p>
              )}
            </>
          ) : (
            <div className="border-2 border-[#B85838] bg-[#FAF8F4] p-3" role="status">
              <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-1">Giving link needed</div>
              <p className="text-xs text-[#5A5751] leading-relaxed">
                This church’s online giving link has not been provided yet. Add the church’s own secure giving URL in Settings, and this button will open it. We never link to a guessed address, and no payment information is collected by this app.
              </p>
            </div>
          )}

          {/* THE WORD — the anchor scriptures, drawn faithfully. (The doctrine
              summary leads the panel above; the full witnesses live here.) */}
          <div className="mt-6 pt-5 border-t border-[#E8E4DC]">
            <h4 className="text-base sm:text-lg text-[#1A1815] mb-2" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>
              The anchor scriptures
            </h4>
            <ul className="space-y-3">
              {GIVING_SCRIPTURES.map((s) => (
                <li key={s.ref} className="border-l-2 border-[#5A6E3D] pl-3">
                  <div className="text-[0.625rem] uppercase tracking-[0.2em] text-[#5A6E3D] font-semibold">
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

          {/* The Call to Give, sourced from our own services (DR-0134) */}
          <CallToGiveArchive />
        </div>
      </div>
    </div>
  );
}

// ChurchGiveFloater — the persistent pill on Church surfaces. Distinct from the
// Give floater: bottom-RIGHT, stacked ABOVE the TTS floater (bottom-20 vs the
// TTS bar's bottom-4) so the two never pile on one corner — giving-green, gift
// icon. Manages its own open state so the monolith wiring is a single mount.
//
// THE WORD GETS PRIORITY (Darrell 2026-07-27, from live screenshots of L58: the
// pill sat on top of the lesson text). This floater now conforms to the standing
// floater Way — Darrell 2026-07-14 ("move out the way after a certain amount of
// time and come up when the users move the screen as gentle reminders") +
// REV-0174 compact-when-idle, the exact behavior the Feedback pill already has:
// at rest it settles to a dim 48px icon-only circle so it stops occluding the
// Word beneath; any scroll/touch re-reveals the full labeled pill as the gentle
// "you know where to give" reminder. Same idle hook, same motion, same tap
// target minimums — one Way, every floater.
export function ChurchGiveFloater({ church }) {
  const [open, setOpen] = React.useState(false);
  const reveal = useIdleReveal(); // idle-dim + reveal-on-scroll (Pattern 2d)
  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Give to the church"
          title="Give to the church — and the blessing of giving according to the Word"
          className={`ts-chrome-region fixed bottom-20 right-4 z-30 inline-flex items-center justify-center gap-1.5 bg-[#5A6E3D] text-white text-xs uppercase tracking-wider font-semibold border-2 border-[#5A6E3D] hover:bg-[#1A1815] hover:border-[#1A1815] shadow-lg min-h-[48px] min-w-[48px] focus:outline focus:outline-2 focus:outline-[#1A1815] print:hidden transition-all duration-500 hover:opacity-100 focus:opacity-100 ${reveal ? 'px-4 py-3 opacity-100 translate-y-0' : 'p-0 w-12 h-12 opacity-40 translate-y-1'}`}
          style={{ borderRadius: '999px' }}
        >
          <GiftIcon />{reveal ? <span>Give</span> : null}
        </button>
      )}
      {open && <ChurchGivePanel church={church} onClose={() => setOpen(false)} />}
    </>
  );
}

export default ChurchGiveFloater;
