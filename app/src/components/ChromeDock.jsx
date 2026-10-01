// =============================================================================
// ChromeDock — the app's bottom bar; nothing floats over the Word (DR-0716)
// =============================================================================
// Darrell 2026-09-30, a screenshot of the L202 lesson reader on his Galaxy
// Fold 7 (open, ~900 CSS px, dark, A44), with five things floating over the
// lesson words: "Put the feedback and other floating options on the task bars
// somewhere they make sense... they can still do what they do however it will
// make the reader better and less blocked... make sense?" And, minutes later:
// "Like the text size etc..."
//
// So they live here, in one full-width bar pinned to the bottom of the screen,
// each a square bordered button with a short word under its icon, the same
// family as the A / A+ / A++ / A+++ / A44 chips:
//
//   left   Feedback · Give (Church only) · network status · Top
//          (below 640px these fold into one "More" button, so a 360px phone
//          keeps the read-aloud controls on one line beside it)
//   right  the read-aloud controls: TTSControl portals its speaker button,
//          its mini-bar or its reading pill into the slot this bar registers
//          (lib/chrome-dock.js). The open panel is still a panel above the bar.
//
// Every control keeps doing exactly what it did: Feedback calls the same
// onFeedback, Give opens the same ChurchGivePanel, the dot is the same
// NetworkStatus, Top is the same scroll, the reader is the same reader.
//
// It is a BAR, not a floater: a solid background, full width, and a spacer
// of the same height at the end of the page, so the last line of a lesson
// scrolls up above it rather than living under it. At Largest and Big Print
// the text-size row is itself a fixed bottom bar (index.css .ts-escape-hatch),
// so this bar stands on top of it (--ts-hatch-h) and the two read as one.
// Its height goes out as --chrome-dock-h so the reader's panel and the app's
// passing prompts stand above it too.
//
// The bar is laid out in px and is NOT a .ts-chrome-region (the reader's own
// controls carry their own cap; a zoomed bar around them would shrink them
// twice). Each BUTTON is its own chrome region, in rem, like the text-size
// chips, so the bar is the same 48px at Normal and at A44.
// =============================================================================
import React, { useCallback, useEffect, useRef, useState } from 'react';
import NetworkStatus from './NetworkStatus.jsx';
import { ChurchGiveDockButton } from './ChurchGiving.jsx';
import UiIcon from './UiIcon.jsx';
import {
  DOCK_BTN, DOCK_BTN_ON, DOCK_HEIGHT_PX, DOCK_ICON, DOCK_LABEL,
  scrollPageToTop, setDockSlot, useScrolledDeep,
} from '../lib/chrome-dock.js';

export function DockLabel({ children }) {
  return <span className={DOCK_LABEL}>{children}</span>;
}

export default function ChromeDock({ onFeedback, feedbackOpen = false, church = null, showGive = false }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [netHealthy, setNetHealthy] = useState(true);
  const deep = useScrolledDeep();
  const barRef = useRef(null);
  const moreRef = useRef(null);

  // The reader's slot: TTSControl portals into it while it is mounted.
  const slotRef = useCallback((el) => { setDockSlot(el); }, []);
  useEffect(() => () => setDockSlot(null), []);

  // Publish the bar's real height so the reader's panel and the app's passing
  // prompts stand above it (index.css), and clear it when the bar leaves.
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const doc = document.documentElement;
    const el = barRef.current;
    const publish = () => {
      const h = el ? Math.round(el.getBoundingClientRect().height) : 0;
      doc.style.setProperty('--chrome-dock-h', `${h || DOCK_HEIGHT_PX}px`);
    };
    publish();
    let ro = null;
    if (el && typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(publish); ro.observe(el); }
    return () => { if (ro) ro.disconnect(); doc.style.setProperty('--chrome-dock-h', '0px'); };
  }, []);

  // The More menu closes on a tap outside it and on Escape.
  useEffect(() => {
    if (!moreOpen || typeof document === 'undefined') return undefined;
    const onDown = (e) => { if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setMoreOpen(false); };
    document.addEventListener('pointerdown', onDown, true);
    document.addEventListener('keydown', onKey, true);
    return () => { document.removeEventListener('pointerdown', onDown, true); document.removeEventListener('keydown', onKey, true); };
  }, [moreOpen]);

  const onHealthChange = useCallback((h) => setNetHealthy(!!h), []);
  const toTop = () => { setMoreOpen(false); scrollPageToTop(); };

  return (
    <>
      {/* The page's own room for the bar: the last line scrolls above it. */}
      <div aria-hidden="true" data-testid="chrome-dock-spacer" className="print:hidden" style={{ height: `${DOCK_HEIGHT_PX}px` }} />
      <div
        ref={barRef}
        data-testid="chrome-dock"
        data-read-skip
        data-reading-chrome
        data-read-no-expand
        role="toolbar"
        aria-label="App controls"
        className="chrome-dock fixed inset-x-0 z-[80] bg-[#FAF8F4] print:hidden"
        style={{ bottom: 'var(--ts-hatch-h, 0px)', boxShadow: '0 -1px 0 rgba(128, 128, 128, 0.6)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-center gap-[4px] px-[6px] py-[2px]" style={{ minHeight: `${DOCK_HEIGHT_PX}px` }}>
          <div ref={moreRef} className="relative flex items-center gap-[4px] shrink-0">
            {/* Below 640px: ONE button holds the rest, so a 360px phone keeps
                the read-aloud mini-bar on the same line. A mark on it when the
                network status folded inside is not healthy. */}
            <button
              type="button"
              data-testid="dock-more"
              onClick={() => setMoreOpen((o) => !o)}
              aria-expanded={moreOpen}
              aria-haspopup="true"
              aria-label={netHealthy ? 'More: Feedback, Give, network status, back to top' : 'More: Feedback, Give, network status (a connection check is failing), back to top'}
              title="More"
              className={`sm:hidden ${moreOpen ? DOCK_BTN_ON : DOCK_BTN} focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]`}
            >
              <span aria-hidden="true" className={DOCK_ICON}>⋯</span>
              <DockLabel>More</DockLabel>
              {!netHealthy && <span aria-hidden="true" data-testid="dock-more-alert" className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#C2410C] border border-white" />}
            </button>
            {/* ONE list, two shapes: a menu above More on a phone, the bar's
                own buttons from 640px up. One NetworkStatus instance either way,
                so the connection is probed once, not twice. */}
            <div
              data-testid="dock-items"
              role="group"
              aria-label="Feedback, giving and status"
              className={`${moreOpen ? 'flex' : 'hidden'} absolute bottom-full left-0 mb-[4px] flex-col items-stretch gap-[4px] p-[4px] bg-[#FAF8F4] border-2 border-[#1A1815] shadow-lg min-w-[144px] sm:static sm:flex sm:flex-row sm:items-center sm:mb-0 sm:p-0 sm:border-0 sm:shadow-none sm:min-w-0 sm:bg-transparent`}
            >
              <button
                type="button"
                onClick={() => { setMoreOpen(false); if (onFeedback) onFeedback(); }}
                aria-label="Open feedback"
                aria-pressed={feedbackOpen || undefined}
                title="Tell us what's working / not working / missing"
                data-testid="dock-feedback"
                className={`${DOCK_BTN} focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]`}
              >
                <span aria-hidden="true" className={`text-[#B85838] ${DOCK_ICON}`}><UiIcon name="chat" /></span>
                <DockLabel>Feedback</DockLabel>
              </button>
              {showGive && <ChurchGiveDockButton church={church} />}
              <NetworkStatus variant="dock" onHealthChange={onHealthChange} />
              {/* On a phone Top also rides in the menu, so it is reachable
                  even while the reader's mini-bar fills the line. */}
              <button type="button" onClick={toTop} data-testid="dock-more-top" aria-label="Back to the top of the page" title="Back to top" className={`sm:hidden ${DOCK_BTN} focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]`}>
                <span aria-hidden="true" className={DOCK_ICON}><UiIcon name="chevronUp" /></span>
                <DockLabel>Top</DockLabel>
              </button>
            </div>
          </div>
          {/* BACK TO TOP, in the bar (Darrell 2026-08-15: "a way to get back to
              the top"). Shown once the page is more than a screen deep, as
              before. On a phone, while the reader's mini-bar or pill is in
              the bar, this inline copy steps aside (index.css) and the one in
              More carries it. */}
          {deep && (
            <button type="button" onClick={toTop} data-testid="dock-top" aria-label="Back to the top of the page" title="Back to top" className={`dock-top-inline shrink-0 ${DOCK_BTN} focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]`}>
              <span aria-hidden="true" className={DOCK_ICON}><UiIcon name="chevronUp" /></span>
              <DockLabel>Top</DockLabel>
            </button>
          )}
          {/* The reader's slot. Scrolls sideways within itself if a very
              narrow screen cannot hold the pill, never pushing the page wide. */}
          <div className="flex-1 min-w-0 overflow-x-auto tab-scroll">
            <div ref={slotRef} data-testid="chrome-dock-reader" className="chrome-dock-reader ml-auto w-max flex items-center gap-[4px]" />
          </div>
        </div>
      </div>
    </>
  );
}
