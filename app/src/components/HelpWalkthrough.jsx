// =============================================================================
// HelpWalkthrough — the discrete, optional first-run "what is this app" tour
// =============================================================================
// Darrell, 2026-06-29: a lightweight guided understanding so a user knows the
// journey — what each area is for, where to start, how the pieces connect — so
// the user experience is knowable, not a mystery to be poked at.
//
// DISCRETE + OPTIONAL (requirement 4): on first run this shows a small card
// pinned at the bottom of the screen — it never blocks the page, never takes
// over the view. The user can open the roadmap, dismiss it for now, or check
// "Don't show this again." The choice is remembered per device in localStorage,
// so a user who does not want walkthroughs is never nagged. The "?" in the
// header is always there for anyone who wants the tour later.
//
// It renders the SAME roadmap the header "?" shows (RoadmapOverview from
// HelpButton) — one source of truth for the user journey (DR-0079).
// =============================================================================
import React, { useState, useEffect } from 'react';
import Modal from './Modal.jsx';
import { RoadmapOverview } from './HelpButton.jsx';
import { isChurchDoorContext } from '../lib/church-own-door.js';
import { motionBehavior } from '../lib/gentle-motion.js';

// Bumping this key re-offers the tour after a major experience change.
const SEEN_KEY = 'poetech.help.tour.v1';

function hasSeen() {
  try { return typeof window !== 'undefined' && !!window.localStorage.getItem(SEEN_KEY); }
  catch (e) { return false; }
}
function markSeen(value) {
  try { window.localStorage.setItem(SEEN_KEY, value); } catch (e) { /* ignore */ }
}

export default function HelpWalkthrough({ setView, setChurchView, setBooksView }) {
  // Card visibility is decided once, after mount, so SSR/first paint is clean
  // and we never flash the card for a returning user.
  const [showCard, setShowCard] = useState(false);
  const [openTour, setOpenTour] = useState(false);

  // A church-door launch (the installed Love Corner app, or /lovecorner/…)
  // NEVER gets the PoeTech quick tour — it introduced "PoeTech: money,
  // business, CRM, inventory" inside the church's own app (Darrell's
  // 2026-08-01 screenshot), surfaces a congregation member doesn't even have.
  // The church door's own welcome is a separate COLG-facing content build
  // (DR-0261 follow-up, re-review: 2026-08-07); until it lands, no tour is
  // more honest than the wrong tour.
  const churchDoor = isChurchDoorContext();

  useEffect(() => {
    if (churchDoor) return;
    if (!hasSeen()) setShowCard(true);
  }, [churchDoor]);

  if (churchDoor) return null;

  function dismissForNow() {
    // "Maybe later" — keep it out of the way this session but offer again next
    // time, since the user did not say "never."
    setShowCard(false);
  }
  function dontShowAgain() {
    markSeen('dismissed');
    setShowCard(false);
    setOpenTour(false);
  }
  function startTour() {
    setOpenTour(true);
    setShowCard(false);
    // Opening the tour counts as having seen the offer; it won't re-pop.
    markSeen('toured');
  }

  function navigateTo(to) {
    if (!to) return;
    if (to.view && setView) setView(to.view);
    if (to.churchView && setChurchView) setChurchView(to.churchView);
    if (to.booksView && setBooksView) setBooksView(to.booksView);
    try { window.scrollTo({ top: 0, behavior: motionBehavior() }); } catch (e) { /* ignore */ }
    setOpenTour(false);
  }

  return (
    <>
      {showCard && (
        <div
          role="region"
          aria-label="Welcome — take a quick tour"
          className="ts-chrome-region fixed inset-x-0 bottom-0 z-[110] flex justify-center px-3 pb-3 print:hidden pointer-events-none"
        >
          <div className="pointer-events-auto w-full max-w-md bg-white border border-[#1A1815] shadow-2xl p-4">
            <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-1">New here?</div>
            <p className="text-sm leading-relaxed text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
              Take a 30-second tour to see what each area is for and where to start.
              You can open it anytime from the <span className="font-semibold">?</span> in the header.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={startTour}
                className="text-xs uppercase tracking-wider px-4 py-2 bg-[#1A1815] text-white border border-[#1A1815] hover:bg-[#B85838] hover:border-[#B85838] font-semibold focus:outline focus:outline-2 focus:outline-[#B85838]"
              >
                Show me around →
              </button>
              <button
                type="button"
                onClick={dismissForNow}
                className="text-xs uppercase tracking-wider px-3 py-2 border border-[#5A5751] text-[#5A5751] hover:text-[#1A1815] hover:border-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]"
              >
                Maybe later
              </button>
              <button
                type="button"
                onClick={dontShowAgain}
                className="text-xs uppercase tracking-wider px-2 py-2 text-[#5A5751] hover:text-[#1A1815] underline focus:outline focus:outline-2 focus:outline-[#B85838] ml-auto"
              >
                Don't show again
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal open={openTour} onClose={() => setOpenTour(false)} labelledBy="tour-title" maxWidthClass="max-w-md">
        <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-1 pr-8">Welcome to PoeTech</div>
        <h2 id="tour-title" className="text-xl sm:text-2xl text-[#1A1815] leading-tight pr-6" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>
          The quick tour
        </h2>
        <div className="mt-3">
          <RoadmapOverview onNavigate={navigateTo} />
        </div>
        <div className="mt-5 pt-4 border-t border-[#E8E4DC]">
          <button
            type="button"
            onClick={() => setOpenTour(false)}
            className="text-xs uppercase tracking-wider px-4 py-2 border border-[#1A1815] text-[#1A1815] hover:bg-[#FAF8F4] font-semibold focus:outline focus:outline-2 focus:outline-[#B85838]"
          >
            Got it
          </button>
        </div>
      </Modal>
    </>
  );
}
