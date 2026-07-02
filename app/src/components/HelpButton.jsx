// =============================================================================
// HelpButton — the ONE discrete "?" help affordance, app-wide
// =============================================================================
// Darrell, 2026-06-29: a small "?" on every tab/tool that, when tapped, explains
// THAT surface — what it is, how to use it, why it matters — discrete but
// informative. This is the single primitive every surface uses, so help is
// consistent everywhere and no tab hand-rolls its own (DR-0079, one canonical
// primitive per axis).
//
// TWO VARIANTS, ONE COMPONENT:
//   variant="header" — the global, CONTEXT-AWARE "?" pinned in the header. It
//                      reads the live view (view / churchView / booksView) and
//                      explains whatever surface you are on. This is the
//                      "click HELP anytime and understand the current surface"
//                      affordance — present on every tab for free, no per-tab
//                      wiring. Tap it again from any surface; it follows you.
//   variant="inline" — a tiny "?" a component drops beside a section title to
//                      explain a specific TOOL within a tab. Pass `topic` (a key
//                      into lib/help-content.js).
//
// DISCRETE BY DESIGN: renders only the small "?" until tapped; the explanation
// opens in the shared accessible Modal (focus-trapped, ESC/backdrop to close)
// and never blocks the page. Short summary first; "Show me more" expands the
// deeper note only for the reader who wants it. A "How this whole area works"
// link opens the user roadmap for the section the surface belongs to.
//
// TIED TO ARI (lib/ari.js via help-content): the sheet attributes the
// explanation to Ari, the one A.I. identity, in his plain on-task voice.
//
// Accessible + legible (WCAG 2.1 AA): real <button> with an aria-label naming
// the surface, 44px tap target on the header control, focus ring, and body copy
// in the app's high-contrast tokens on the Modal's white panel.
// =============================================================================
import React, { useState, useMemo } from 'react';
import Modal from './Modal.jsx';
import {
  helpFor, ROADMAP, SECTION_TITLE, ariHelpLead, HELP_VOICE_NAME,
} from '../lib/help-content.js';
import UiIcon from './UiIcon.jsx';
import ReactionKey from './ReactionKey.jsx';
import { useReadAloud } from '../lib/use-read-aloud.js';
import { digestFromHelp } from '../lib/surface-digest.js';
import { narrateDigest } from '../lib/talk-about.js';

// A single roadmap journey, rendered as a numbered list of clickable stops.
function RoadmapSection({ section, onNavigate }) {
  if (!section) return null;
  return (
    <div className="mt-1">
      <p className="text-sm leading-relaxed text-[#1A1815] mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
        {section.blurb}
      </p>
      <ol className="space-y-2">
        {section.steps.map((step, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => onNavigate && onNavigate(step.to)}
              className="w-full text-left flex gap-3 items-start p-2.5 border border-[#E8E4DC] hover:border-[#B85838] hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838] transition-colors"
            >
              <span
                className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-[#1A1815] text-white text-xs font-semibold"
                style={{ fontFamily: '"JetBrains Mono", monospace' }}
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
                  {step.label} <span aria-hidden="true" className="text-[#B85838]">→</span>
                </span>
                <span className="block text-xs text-[#5A5751] leading-snug mt-0.5">{step.why}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

// The full "how this works" overview — every section's journey, end to end.
// Exported so the first-run walkthrough renders the identical roadmap (DRY).
export function RoadmapOverview({ onNavigate }) {
  return (
    <div className="space-y-5">
      <p className="text-sm leading-relaxed text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
        Here is the whole experience — the major areas, where to start in each, and
        how the pieces connect. Tap any stop to go straight there.
      </p>
      {ROADMAP.map((section) => (
        <div key={section.key}>
          <h3 className="text-xs uppercase tracking-[0.2em] text-[#B85838] font-semibold mb-2">{section.title}</h3>
          <RoadmapSection section={section} onNavigate={onNavigate} />
        </div>
      ))}
    </div>
  );
}

export default function HelpButton({
  variant = 'header',
  topic = null,
  view,
  churchView,
  booksView,
  setView,
  setChurchView,
  setBooksView,
  isOwner = false,
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  // Read-aloud, so the "?" can SPEAK the explanation (ties help to the voice
  // EXPLAIN mode): Ari tells you what this surface is, in your chosen voice.
  const { supported: speakSupported, isReading, read, stop } = useReadAloud({ isOwner });
  // mode: 'topic' (explain this surface) | 'section' (this surface's journey) |
  // 'overview' (the whole roadmap)
  const [mode, setMode] = useState('topic');

  // Resolve the help entry: an explicit topic wins; otherwise the live context.
  const ctx = useMemo(() => ({ view, churchView, booksView }), [view, churchView, booksView]);
  const entry = useMemo(() => (topic ? helpFor(topic) : helpFor(ctx)), [topic, ctx]);
  const sectionKey = entry?.section || null;
  const section = useMemo(
    () => ROADMAP.find((s) => s.key === sectionKey) || null,
    [sectionKey],
  );

  const titleId = 'help-sheet-title';

  function openSheet() {
    setExpanded(false);
    setMode(entry ? 'topic' : 'overview');
    setOpen(true);
  }
  function closeSheet() { try { stop(); } catch (e) { /* ignore */ } setOpen(false); }

  // Speak the explanation of THIS surface in the chosen voice (or stop if going).
  function hearThis() {
    if (isReading) { stop(); return; }
    if (!entry) return;
    read(narrateDigest(digestFromHelp(entry)));
  }

  // Navigate the app to a roadmap step, then close the sheet.
  function navigateTo(to) {
    if (!to) return;
    if (to.view && setView) setView(to.view);
    if (to.churchView && setChurchView) setChurchView(to.churchView);
    if (to.booksView && setBooksView) setBooksView(to.booksView);
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { /* ignore */ }
    closeSheet();
  }

  // The "?" affordance. Header = a bordered round control that matches the other
  // header chrome; inline = a tiny round "?" that sits beside a section title.
  const surfaceName = entry?.title || 'this app';
  const ariaLabel = topic
    ? `Help: what is ${surfaceName}?`
    : `Help — explain ${surfaceName}`;

  const trigger =
    variant === 'inline' ? (
      <button
        type="button"
        onClick={openSheet}
        aria-label={ariaLabel}
        title={`Help: ${surfaceName}`}
        className={`inline-flex items-center justify-center w-6 h-6 rounded-full border border-[#5A5751] text-[#5A5751] hover:text-white hover:bg-[#B85838] hover:border-[#B85838] text-xs font-bold leading-none focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838] align-middle ${className}`}
      >
        ?
      </button>
    ) : (
      <button
        type="button"
        onClick={openSheet}
        aria-label={ariaLabel}
        title={`Help — ${surfaceName}`}
        className={`inline-flex items-center justify-center w-7 h-7 min-h-[28px] rounded-full border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white text-sm font-bold leading-none focus:outline focus:outline-2 focus:outline-[#B85838] ${className}`}
      >
        ?
      </button>
    );

  // The sheet header label depends on mode.
  const sheetHeading =
    mode === 'overview'
      ? 'How this app works'
      : mode === 'section'
        ? section?.title || 'How this works'
        : entry?.title || 'Help';

  return (
    <>
      {trigger}
      <Modal open={open} onClose={closeSheet} labelledBy={titleId} maxWidthClass="max-w-md">
        {/* Ari attribution — the one A.I. identity explaining the surface. */}
        <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-1 pr-8">
          {HELP_VOICE_NAME} · Help
        </div>
        <h2
          id={titleId}
          className="text-xl sm:text-2xl text-[#1A1815] leading-tight pr-6"
          style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}
        >
          {sheetHeading}
        </h2>

        {mode === 'topic' && entry && (
          <div className="mt-3">
            <div className="flex items-center justify-between gap-2 mb-3">
              <p className="text-xs text-[#5A5751] italic">{ariHelpLead()}</p>
              {speakSupported && (
                <button
                  type="button"
                  onClick={hearThis}
                  className="shrink-0 inline-flex items-center gap-1 text-[0.625rem] uppercase tracking-wider border border-[#B85838] text-[#B85838] px-2 py-1 font-semibold hover:bg-[#B85838] hover:text-white focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]"
                >
                  <UiIcon name="volume" /> {isReading ? 'Stop' : 'Hear this'}
                </button>
              )}
            </div>

            {/* WHAT */}
            <p className="text-sm leading-relaxed text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
              {entry.what}
            </p>

            {/* HOW */}
            {entry.how && entry.how.length > 0 && (
              <div className="mt-4">
                <div className="text-[0.625rem] uppercase tracking-[0.2em] text-[#5A6E3D] font-semibold mb-1.5">How to use it</div>
                <ol className="space-y-1.5">
                  {entry.how.map((step, i) => (
                    <li key={i} className="flex gap-2 text-sm text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
                      <span className="text-[#5A6E3D] font-semibold shrink-0">{i + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* WHY */}
            {entry.why && (
              <div className="mt-4 px-3 py-2 bg-[#FAF8F4] border-l-2 border-[#B85838]">
                <div className="text-[0.625rem] uppercase tracking-[0.2em] text-[#B85838] font-semibold mb-0.5">Why it matters</div>
                <p className="text-sm leading-relaxed text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>{entry.why}</p>
              </div>
            )}

            {/* LEGEND (optional) — a rich in-sheet reference rendered from its own
                single source. Today: the reaction key, straight from lib/reactions.js. */}
            {entry.legend === 'reactions' && (
              <div className="mt-5 pt-4 border-t border-[#E8E4DC]">
                <ReactionKey />
              </div>
            )}

            {/* WHEN (optional) + MORE (expandable) */}
            {expanded && (entry.when || entry.more) && (
              <div className="mt-4 space-y-3">
                {entry.when && (
                  <div>
                    <div className="text-[0.625rem] uppercase tracking-[0.2em] text-[#5A5751] font-semibold mb-0.5">When to use it</div>
                    <p className="text-sm leading-relaxed text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>{entry.when}</p>
                  </div>
                )}
                {entry.more && (
                  <p className="text-sm leading-relaxed text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>{entry.more}</p>
                )}
              </div>
            )}

            {(entry.when || entry.more) && !expanded && (
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="mt-3 text-xs uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] font-semibold focus:outline focus:outline-2 focus:outline-[#B85838]"
              >
                Show me more →
              </button>
            )}

            {/* Link into the roadmap for this surface's area. */}
            {section && (
              <div className="mt-5 pt-4 border-t border-[#E8E4DC]">
                <button
                  type="button"
                  onClick={() => setMode('section')}
                  className="text-xs uppercase tracking-wider text-[#1A1815] hover:text-[#B85838] font-semibold focus:outline focus:outline-2 focus:outline-[#B85838]"
                >
                  How {SECTION_TITLE[section.key] ? SECTION_TITLE[section.key].toLowerCase() : 'this area'} works →
                </button>
              </div>
            )}
          </div>
        )}

        {mode === 'topic' && !entry && (
          <p className="mt-3 text-sm text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
            Help for this surface is on the way. In the meantime, here is how the
            whole app fits together.
          </p>
        )}

        {mode === 'section' && (
          <div className="mt-3">
            <p className="text-xs text-[#5A5751] italic mb-3">{ariHelpLead()}</p>
            <RoadmapSection section={section} onNavigate={navigateTo} />
            <div className="mt-5 pt-4 border-t border-[#E8E4DC] flex flex-wrap gap-4">
              {entry && (
                <button
                  type="button"
                  onClick={() => setMode('topic')}
                  className="text-xs uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815] font-semibold focus:outline focus:outline-2 focus:outline-[#B85838]"
                >
                  ← Back to {entry.title}
                </button>
              )}
              <button
                type="button"
                onClick={() => setMode('overview')}
                className="text-xs uppercase tracking-wider text-[#1A1815] hover:text-[#B85838] font-semibold focus:outline focus:outline-2 focus:outline-[#B85838]"
              >
                See the whole app →
              </button>
            </div>
          </div>
        )}

        {mode === 'overview' && (
          <div className="mt-3">
            <p className="text-xs text-[#5A5751] italic mb-3">{ariHelpLead()}</p>
            <RoadmapOverview onNavigate={navigateTo} />
            {entry && (
              <div className="mt-5 pt-4 border-t border-[#E8E4DC]">
                <button
                  type="button"
                  onClick={() => setMode('topic')}
                  className="text-xs uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815] font-semibold focus:outline focus:outline-2 focus:outline-[#B85838]"
                >
                  ← Back to {entry.title}
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
