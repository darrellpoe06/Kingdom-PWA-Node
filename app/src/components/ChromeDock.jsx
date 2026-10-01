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
import { useTextSize } from '../lib/text-size.js';
import { useComfortCollapsed, useInReader } from '../lib/comfort-bar.js';
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
  const FOCUS = 'focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]';

  // THE READER'S ONE SLIM ROW (Darrell 2026-10-01, the Fold folded, L202 at
  // A+++: "Bottom tab is too much!!!!! We needed less room undermining the
  // reader...."). Inside a lesson the header's big-text bottom block starts
  // folded (lib/comfort-bar.js) and this bar is the only bottom chrome:
  // Controls (opens the folded block, at Largest / Big Print where it is the
  // bottom block), A- / A+, Feedback and Give inline, More for the rest, and
  // the reader on the right.
  const inReader = useInReader();
  const [comfortCollapsed, setComfortCollapsed] = useComfortCollapsed();
  const [size, setSize, steps] = useTextSize();
  const sizeAt = Math.max(0, steps.findIndex((st) => st.key === size));
  const sizeNow = steps[sizeAt] || steps[0];
  const stepSize = (d) => {
    const j = Math.min(steps.length - 1, Math.max(0, sizeAt + d));
    setSize(steps[j].key);
  };

  const feedbackBtn = (
    <button
      type="button"
      onClick={() => { setMoreOpen(false); if (onFeedback) onFeedback(); }}
      aria-label="Open feedback"
      aria-pressed={feedbackOpen || undefined}
      title="Tell us what's working / not working / missing"
      data-testid="dock-feedback"
      className={`${DOCK_BTN} ${FOCUS}`}
    >
      <span aria-hidden="true" className={`text-[#B85838] ${DOCK_ICON}`}><UiIcon name="chat" /></span>
      <DockLabel>Feedback</DockLabel>
    </button>
  );
  const giveBtn = showGive ? <ChurchGiveDockButton church={church} /> : null;

  return (
    <>
      {/* The page's own room for the bar: the last line scrolls above it. */}
      <div aria-hidden="true" data-testid="chrome-dock-spacer" className="print:hidden" style={{ height: `${DOCK_HEIGHT_PX}px` }} />
      <div
        ref={barRef}
        data-testid="chrome-dock"
        data-in-reader={inReader ? 'true' : 'false'}
        data-read-skip
        data-reading-chrome
        data-read-no-expand
        role="toolbar"
        aria-label="App controls"
        className="chrome-dock fixed inset-x-0 z-[80] bg-[#FAF8F4] print:hidden"
        style={{ bottom: 'var(--ts-hatch-h, 0px)', boxShadow: '0 -1px 0 rgba(128, 128, 128, 0.6)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="chrome-dock-row flex flex-wrap items-center gap-[3px] px-[4px]" style={{ minHeight: `${DOCK_HEIGHT_PX}px` }}>
          {inReader && (
            <div className="flex items-center gap-[3px] shrink-0" data-testid="dock-reader-row" role="group" aria-label="Reading comfort">
              {/* Controls: open / fold the big-text block (account, Subscribe,
                  help, all sizes, voice, colors). Shown only where that block
                  is the bottom block (Largest, Big Print; index.css). */}
              <button
                type="button"
                data-testid="dock-controls"
                onClick={() => setComfortCollapsed(!comfortCollapsed)}
                aria-expanded={!comfortCollapsed}
                aria-label={comfortCollapsed ? 'Controls: show account, subscribe, help, every text size, voice and colors' : 'Controls: fold them away again'}
                title={comfortCollapsed ? 'Show the controls' : 'Fold the controls'}
                className={`dock-controls ${comfortCollapsed ? DOCK_BTN : DOCK_BTN_ON} ${FOCUS}`}
              >
                <span aria-hidden="true" className={DOCK_ICON}>{comfortCollapsed ? '▴' : '▾'}</span>
                <DockLabel>Controls</DockLabel>
              </button>
              <button type="button" data-testid="dock-text-smaller" onClick={() => stepSize(-1)} disabled={sizeAt === 0}
                aria-label={sizeAt === 0 ? 'Smaller text (already the smallest)' : `Smaller text size (now ${sizeNow.name})`} title="Smaller text"
                className={`${DOCK_BTN} ${FOCUS} disabled:opacity-40`}>
                <span aria-hidden="true" className="text-[0.875rem] leading-none">A−</span>
              </button>
              <button type="button" data-testid="dock-text-bigger" onClick={() => stepSize(1)} disabled={sizeAt === steps.length - 1}
                aria-label={sizeAt === steps.length - 1 ? 'Bigger text (already the biggest)' : `Bigger text size (now ${sizeNow.name})`} title="Bigger text"
                className={`${DOCK_BTN} ${FOCUS} disabled:opacity-40`}>
                <span aria-hidden="true" className="text-[1.125rem] leading-none">A+</span>
              </button>
              {feedbackBtn}
              {giveBtn}
            </div>
          )}
          <div ref={moreRef} className="dock-more-wrap relative flex items-center gap-[3px] shrink-0">
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
              className={`sm:hidden ${moreOpen ? DOCK_BTN_ON : DOCK_BTN} ${FOCUS}`}
            >
              <span aria-hidden="true" className={DOCK_ICON}>⋯</span>
              <DockLabel>More</DockLabel>
              {!netHealthy && <span aria-hidden="true" data-testid="dock-more-alert" className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#C2410C] border border-white" />}
            </button>
            {/* ONE list, two shapes: a menu above More on a phone, the bar's
                own buttons from 640px up. One NetworkStatus instance either way,
                so the connection is probed once, not twice. In the reader,
                Feedback and Give ride the slim row instead. */}
            <div
              data-testid="dock-items"
              role="group"
              aria-label="Feedback, giving and status"
              className={`${moreOpen ? 'flex' : 'hidden'} absolute bottom-full left-0 mb-[4px] flex-col items-stretch gap-[4px] p-[4px] bg-[#FAF8F4] border-2 border-[#1A1815] shadow-lg min-w-[144px] sm:static sm:flex sm:flex-row sm:items-center sm:mb-0 sm:p-0 sm:border-0 sm:shadow-none sm:min-w-0 sm:bg-transparent`}
            >
              {!inReader && feedbackBtn}
              {!inReader && giveBtn}
              <NetworkStatus variant="dock" onHealthChange={onHealthChange} />
              {/* On a phone Top also rides in the menu, so it is reachable
                  even while the reader's mini-bar fills the line. */}
              <button type="button" onClick={toTop} data-testid="dock-more-top" aria-label="Back to the top of the page" title="Back to top" className={`sm:hidden ${DOCK_BTN} ${FOCUS}`}>
                <span aria-hidden="true" className={DOCK_ICON}><UiIcon name="chevronUp" /></span>
                <DockLabel>Top</DockLabel>
              </button>
            </div>
          </div>
          {/* BACK TO TOP, in the bar (Darrell 2026-08-15: "a way to get back to
              the top"). Shown once the page is more than a screen deep, as
              before. On a phone, in the reader or while the reader's mini-bar
              or pill is in the bar, this inline copy steps aside (index.css)
              and the one in More carries it. */}
          {deep && (
            <button type="button" onClick={toTop} data-testid="dock-top" aria-label="Back to the top of the page" title="Back to top" className={`dock-top-inline shrink-0 ${DOCK_BTN} ${FOCUS}`}>
              <span aria-hidden="true" className={DOCK_ICON}><UiIcon name="chevronUp" /></span>
              <DockLabel>Top</DockLabel>
            </button>
          )}
          {/* The reader's slot. Scrolls sideways within itself if a very
              narrow screen cannot hold the pill, never pushing the page wide.
              On a phone, while the mini-bar or pill plays, it takes its own
              line directly on top of the row (index.css). */}
          <div className="chrome-dock-reader-wrap flex-1 min-w-[44px] overflow-x-auto tab-scroll">
            <div ref={slotRef} data-testid="chrome-dock-reader" className="chrome-dock-reader ml-auto w-max flex items-center gap-[3px]" />
          </div>
        </div>
      </div>
    </>
  );
}
