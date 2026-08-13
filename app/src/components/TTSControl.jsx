// =============================================================================
// TTSControl — the floating READ-ALOUD control (the HEAR half of see/hear a11y)
// =============================================================================
// "Read anywhere": this floating control is on every page, and it reads in the
// user's ONE chosen reading voice (lib/reading-voice via use-read-aloud). Pick a
// voice once (here, in the header, or in the Voice tab) and every page reads in
// it — no re-picking. Big, obvious controls for a non-technical, elderly reader:
// a play button, then a Pause/Stop pair, plain speed steps (incl. SLOWER), and the
// same global voice picker. Reads the visible page so anyone can conduct business
// without reading the screen (COMMUNITY-FIRST-MISSION).
//
// On a device without speech support the hook reports supported:false and this
// renders nothing — no crash (unbreakable). Status is announced for screen
// readers; every control is keyboard reachable; the panel is a high-contrast
// (WCAG AA) white card regardless of app theme.
import React, { useEffect, useRef, useState } from 'react';
import { RATE_STEPS } from '../lib/tts.js';
import { useReadAloud } from '../lib/use-read-aloud.js';
import {
  buildFollowMap, wordRange, highlightSegment, highlightWord,
  clearReadingHighlights, followRange, rangeFor,
  segmentIndexAtDomPoint, alignSegments, segmentIndexAtFraction,
} from '../lib/read-follow.js';
import { segmentText } from '../lib/tts.js';
import { readFromPoint } from '../lib/read-from-here.js';
import { getReadTarget, subscribeReadTarget } from '../lib/read-target.js';
import { subscribeReadRequest } from '../lib/read-request.js';
import { revealForReading, settled, afterRender } from '../lib/read-reveal.js';
import UiIcon from './UiIcon.jsx';
import { helpFor } from '../lib/help-content.js';
import { buildSurfaceDigest } from '../lib/surface-digest.js';
import { talkAboutSurface } from '../lib/talk-about.js';
import { useIdleReveal } from '../lib/use-idle-reveal.js';

// CONTROLS ARE NOT CONTENT — the reader must not read the buttons.
//
// Darrell 2026-08-13, listening on the Scripture tab: "The reader reads the
// Highlight Up Arrow... etc... I want the content."
//
// This is the page-read FALLBACK, used on any surface that has not registered a
// read target (lib/read-target.js). Scripture is one of those surfaces, so its
// reading was the whole of <main>.innerText — and innerText includes every
// control label. A listener heard "↑ HIDE OTHER TRANSLATIONS · ESV · NIV · NKJV
// · AMP · CLEAR HIGHLIGHT · GIVE · FEEDBACK · × HIDE" threaded through the Word.
// On a platform whose point is hearing Scripture, that is the reading itself
// being corrupted by furniture.
//
// So the fallback now strips the interactive layer: navigation, menus, tab
// strips, dialogs, form controls, and buttons. A surface that genuinely renders
// reading material inside a control can opt that node back in with
// `data-read-keep`, and anything can opt out with `data-read-skip` — but the
// DEFAULT is that chrome is silent, because the default was the bug.
//
// This is a fallback, not the destination: the real fix for a surface is to
// register its own reading, which also gets follow-along highlighting and
// hands-free continuation. Stripping here is what makes the fallback honest in
// the meantime.
const CHROME_SELECTOR = [
  '.tts-controls', '.feedback-modal', '[aria-hidden="true"]', '[data-read-skip]',
  'nav', 'button', 'select', 'input', 'textarea',
  '[role="menu"]', '[role="menubar"]', '[role="tablist"]', '[role="dialog"]',
  '[role="listbox"]', '[role="toolbar"]', '[role="navigation"]',
].join(', ');

function readablePageText() {
  if (typeof document === 'undefined') return '';
  const main = document.querySelector('main') || document.body;
  if (!main) return '';
  const clone = main.cloneNode(true);
  clone.querySelectorAll(CHROME_SELECTOR).forEach((el) => {
    // An explicit opt-in wins, so a surface that really does render its reading
    // inside a control is not silently truncated by this rule.
    try { if (el.matches && el.matches('[data-read-keep]')) return; } catch (_) { /* fall through to remove */ }
    el.remove();
  });
  return (clone.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 32000);
}

export default function TTSControl({ isOwner = false, view, churchView, booksView }) {
  const [isOpen, setIsOpen] = useState(false);
  // WHILE READING, THE PANEL GETS OUT OF THE WAY (Darrell 2026-08-03: "the
  // read along blocks the readers page with the data being read"): once
  // reading starts, the full card collapses to a slim pill (pause/stop/
  // expand) so the page — and its moving highlight — stays visible. Expanding
  // re-opens the full card; stopping restores it.
  const [minimized, setMinimized] = useState(false);
  // "Talk about this" state: thinking, and the source of the last explanation
  // (live NAS A.I. vs on-device authored) so the user knows which they heard.
  const [talking, setTalking] = useState(false);
  const [talkSource, setTalkSource] = useState('');
  const {
    supported, isReading, isPaused, rate, read, pause, resume, stop, setRate,
    catalog, voiceId, setVoiceId, currentItem,
    segmentIndex, setBoundaryHandler, deviceRead, cloudProgress,
  } = useReadAloud({ isOwner });

  // FOLLOW-ALONG (DR-0264, Darrell 2026-08-03: readers "could be 6 or 60 years
  // old... highlighted as it reads so users can see their place and the screen
  // should move with the location of the words"). When Play starts from the
  // visible page, the SAME normalized text handed to the engine is mapped to
  // live DOM ranges (read-follow.js — alignment by construction). The engine's
  // segmentIndex then drives a sentence highlight + centered auto-scroll, and
  // word boundaries (where the device fires them) drive the word highlight.
  // followRef holds { ranges (Range|null per SPOKEN segment), lens (spoken
  // segment char lengths — cloud fraction mapping), follow + base (word-level
  // mapping where the mode supports it), wordable }.
  const followRef = useRef(null);
  const lastCloudIdxRef = useRef(-1);
  useEffect(() => {
    if (!isReading || !deviceRead || !followRef.current) {
      if (!isReading) { clearReadingHighlights(); highlightWord(null); lastCloudIdxRef.current = -1; }
      return;
    }
    const r = followRef.current.ranges[segmentIndex] || null;
    highlightSegment(r);
    highlightWord(null); // a new sentence clears the previous word
    followRange(r);
  }, [segmentIndex, isReading, deviceRead]);
  // CLOUD (cloned-voice) sentence-follow (DR-0265): the clip has no word
  // timings, but playback fraction → character position → sentence works at
  // sentence granularity. Only re-highlights when the sentence changes.
  useEffect(() => {
    if (!isReading || deviceRead || !followRef.current) return;
    const idx = segmentIndexAtFraction(followRef.current.lens, cloudProgress);
    if (idx < 0 || idx === lastCloudIdxRef.current) return;
    lastCloudIdxRef.current = idx;
    const r = followRef.current.ranges[idx] || null;
    highlightSegment(r);
    followRange(r);
  }, [cloudProgress, isReading, deviceRead]);
  // Reading over (or never started) → the full card comes back next open.
  useEffect(() => { if (!isReading) setMinimized(false); }, [isReading]);
  useEffect(() => {
    if (!setBoundaryHandler) return undefined;
    setBoundaryHandler((segIdx, charIndex) => {
      const f = followRef.current;
      if (!f || !f.wordable) return;
      const r = wordRange(f.follow, f.base + segIdx, charIndex);
      if (r) highlightWord(r);
    });
    return () => setBoundaryHandler(null);
  }, [setBoundaryHandler]);

  // Builders for the three followable read modes (DR-0264/DR-0265).
  const pageFollowState = (follow, base = 0) => ({
    follow,
    base,
    ranges: follow.segments.slice(base).map((s) => (s ? rangeFor(follow, s.start, s.end) : null)),
    lens: follow.segments.slice(base).map((s) => (s ? s.text.length : 0)),
    wordable: true,
  });

  // START WHERE I TAP (DR-0144): "if Ari could start right at wherever users
  // want it to start... whatever word on the page" (Darrell, 2026-07-10). Arm a
  // one-shot capture listener; the next tap on the page becomes the reading
  // start — mapped to the exact word via lib/read-from-here, falling back to the
  // top of the page (never silence) when the device can't resolve the tap.
  const [armed, setArmed] = useState(false);
  // READ ONE FULL PIECE (Darrell 2026-07-30: "The reader reads different
  // lessons not one full one... Just the pages showing"): when a surface
  // registers its primary reading (e.g. the open Learn lesson, complete —
  // lib/read-target.js), reading THAT start-to-finish is the primary action;
  // whole-page reading stays as the fallback below it.
  const [target, setTarget] = useState(() => getReadTarget());
  useEffect(() => subscribeReadTarget(setTarget), []);
  // ONE-BUTTON PLAY FROM ANY SURFACE (Darrell 2026-08-10: "speakers are
  // supposed to be able to push play for reading whatever"). A surface asks
  // (lib/read-request) and the reader answers with its full behavior — the
  // registered piece start to finish, the follow-along, and the hands-free run
  // to the next piece. No panel to find, no three taps.
  useEffect(() => subscribeReadRequest(() => {
    const t = getReadTarget();
    if (t && readTargetRef.current) { readTargetRef.current(t); return; }
    if (startRef.current) startRef.current();
  }), []);
  const startRef = useRef(null);
  // The target we asked to render in full (read-this-piece), so its paced view
  // can be restored when the reading ends. Declared with the other hooks —
  // above the unsupported-device early return — so hook order never varies.
  const preparedRef = useRef(null);
  // HANDS-FREE RUN (Darrell 2026-08-10: "can't read the whole lesson... without
  // a human turning the page!!! users should be able to listen to the whole
  // thing without needing to intervene"). While a target read is running, this
  // holds the piece being read; when it finishes on its own the reader asks the
  // surface for the NEXT piece, waits for it to register, and keeps reading.
  // Stop clears it — that is the difference between "it ended" and "you ended
  // it", and it is the only thing that ends the run.
  const runRef = useRef(null);
  const [runInfo, setRunInfo] = useState(null); // { label } while a run is live
  // readTargetNow is defined below the unsupported-device early return; the run
  // loop reaches it through this ref so the effect never depends on definition
  // order.
  const readTargetRef = useRef(null);
  // When the reading ends (finished or stopped), give the surface its paced
  // view back — the expansion belongs to the reading, not to the learner's
  // place. Only ever restores a target THIS control expanded.
  useEffect(() => {
    if (isReading) return;
    const prepared = preparedRef.current;
    // A run that is still live means the piece ENDED on its own (Stop clears
    // the run). Ask the surface for the next piece and keep reading.
    const run = runRef.current;
    if (run && run.next) {
      let advanced;
      try { advanced = !!run.next(); } catch (_) { advanced = false; }
      if (advanced) {
        // The next piece registers its own target; wait for it, then read it.
        // Bounded — a surface that advances without registering ends the run
        // quietly rather than hanging on a promise that never settles.
        const from = run.owner;
        (async () => {
          for (let i = 0; i < 12; i++) {
            await afterRender();
            const t = getReadTarget();
            if (t && t.owner !== from) {
              if (prepared && prepared !== t) { try { prepared.prepare(false); } catch (_) { /* best-effort */ } }
              preparedRef.current = null;
              if (readTargetRef.current) readTargetRef.current(t, { continuing: true });
              return;
            }
          }
          runRef.current = null;
          setRunInfo(null);
        })();
        return;
      }
    }
    // No next piece (the end of the series) or no run at all: the reading is
    // over — put the surface's paced view back.
    runRef.current = null;
    setRunInfo(null);
    if (!prepared) return;
    preparedRef.current = null;
    try { prepared.prepare(false); } catch (_) { /* restoring is best-effort */ }
  }, [isReading]);
  // The collapsed read-aloud button is a gentle reminder: it dims + settles when
  // idle and re-reveals on scroll/touch. Declared before the early return below
  // so the hook order is stable (rules-of-hooks). Applies to the collapsed button
  // only — an OPEN panel is in active use and must never fade.
  const revealFab = useIdleReveal();
  useEffect(() => {
    if (!armed || typeof document === 'undefined') return undefined;
    const main = document.querySelector('main') || document.body;
    const onTap = (e) => {
      const inControls = e.target && e.target.closest && e.target.closest('.tts-controls');
      if (inControls) return; // panel taps (incl. Cancel) keep working normally
      e.preventDefault();
      e.stopPropagation();
      setArmed(false);
      // START-AT-TAP now FOLLOWS too (DR-0265): resolve the tapped character,
      // find its sentence in the page map, and read from that sentence with the
      // highlight tracking from there. Falls back to the unmapped legacy path
      // when the device can't resolve the tap into the map.
      const follow = buildFollowMap(main);
      let caret = null;
      try {
        if (document.caretRangeFromPoint) {
          const r = document.caretRangeFromPoint(e.clientX, e.clientY);
          if (r) caret = { node: r.startContainer, offset: r.startOffset };
        } else if (document.caretPositionFromPoint) {
          const p = document.caretPositionFromPoint(e.clientX, e.clientY);
          if (p) caret = { node: p.offsetNode, offset: p.offset };
        }
      } catch (_) { caret = null; }
      const segIdx = follow && caret ? segmentIndexAtDomPoint(follow, caret.node, caret.offset) : -1;
      if (follow && segIdx >= 0) {
        followRef.current = pageFollowState(follow, segIdx);
        // Same law as Read-this-page: a tap-started read follows and highlights,
        // so the card must collapse to the pill or it covers the very words it
        // just lit up (reported 2026-08-06 — the panel sat over the read text).
        setMinimized(true);
        read(follow.text.slice(follow.segments[segIdx].start));
        return;
      }
      const hit = readFromPoint(main, e.clientX, e.clientY);
      const text = (hit && hit.text) || readablePageText();
      followRef.current = null; // unresolvable tap reads unmapped — no stale highlight
      if (text) { setMinimized(true); read(text); }
    };
    const onKey = (e) => { if (e.key === 'Escape') setArmed(false); };
    document.addEventListener('click', onTap, true);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('click', onTap, true);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [armed, read]);

  if (!supported) return null; // graceful: device can't speak — show nothing

  const start = async () => {
    // OPEN WHAT IS CLOSED FIRST (Darrell 2026-08-10: "deeper doesn't get read at
    // all" / "dropdown information need to be understood.... too"). This app's
    // disclosures are conditionally rendered, so a collapsed "About this" panel
    // has no text in the document — it could not be read because it was not
    // there. Reveal, let it paint, THEN map: what is heard is what is shown.
    const main = (typeof document !== 'undefined' && document.querySelector('main')) || null;
    if (main) { revealForReading(main); await settled(main); }
    // Build the follow map from the LIVE page and speak its exact normalized
    // text, so the engine's sentence N and the on-screen range N are the same
    // sentence by construction. Falls back to the plain extractor when the map
    // can't be built (empty page) — reading always still works.
    const follow = main ? buildFollowMap(main) : null;
    if (follow && follow.text) {
      followRef.current = pageFollowState(follow);
      setMinimized(true);
      read(follow.text);
      return;
    }
    followRef.current = null;
    const text = readablePageText();
    if (text) { setMinimized(true); read(text); }
  };

  // READ-THIS-PIECE — now ALIGNED BY CONSTRUCTION (2026-08-10, DR-0285).
  //
  // What was wrong: this mode spoke the surface's COMPOSED text and tried to
  // find each spoken sentence back in the DOM (alignSegments). On a Learn
  // lesson almost nothing matched — the composed text carries connective
  // sentences that are not on screen ("Anchor scripture — …", "Questions to
  // think about:"), and the lesson renders ONE stage at a time, so four of five
  // stages were not in the document at all. Result, exactly as reported: the
  // Learn read highlighted NOTHING (while Eternal Algorithms, which has no
  // registered target and therefore maps the page itself, highlighted fine),
  // and the unrendered stages were never read.
  //
  // The fix is the same law the page read has always obeyed: make the DOM the
  // source of the spoken text. `prepare(true)` asks the surface to render the
  // WHOLE piece (every stage), collapsed disclosures inside it are opened, and
  // then the element is mapped and its own text is spoken — so every sentence
  // spoken has a range, word-level follow works again, and nothing deeper is
  // skipped. The composed text remains the honest fallback for a surface that
  // registers no element (or one that isn't in the DOM).
  const readTargetNow = async (t, { continuing = false } = {}) => {
    if (!t) return;
    // A target read is always a RUN: it keeps going to the next piece unless
    // the listener stops it.
    runRef.current = t;
    if (!continuing) setRunInfo({ label: t.label });
    let el = null;
    if (typeof document !== 'undefined') {
      el = t.elementId ? document.getElementById(t.elementId) : null;
      if (!el && t.owner) el = document.getElementById(`learn-lesson-${t.owner}`);
      if (t.prepare) {
        try { t.prepare(true); preparedRef.current = t; } catch (_) { /* never blocks the read */ }
        // requireChange: we just asked for more of the piece — do not accept
        // "nothing has happened yet" as "it is done".
        await settled(el, { requireChange: true }); // the whole piece is rendered before anything is mapped
      }
      if (el) { revealForReading(el); await settled(el); }
    }
    const follow = el ? buildFollowMap(el) : null;
    if (follow && follow.text) {
      followRef.current = pageFollowState(follow);
      setMinimized(true);
      read(follow.text);
      return;
    }
    // No element to map: speak the registered text and align what we can find
    // on screen (sentence-level, unrendered passages carry no highlight).
    const spoken = segmentText(t.text);
    const pageFollow = (typeof document !== 'undefined' && document.querySelector('main'))
      ? buildFollowMap(document.querySelector('main')) : null;
    followRef.current = pageFollow ? {
      follow: pageFollow,
      base: 0,
      ranges: alignSegments(pageFollow, spoken),
      lens: spoken.map((s) => s.length),
      wordable: false,
    } : null;
    setMinimized(true);
    read(t.text);
  };

  readTargetRef.current = readTargetNow;
  startRef.current = start;

  // TALK ABOUT THIS: build a grounded digest of the CURRENT surface (real
  // on-screen numbers via data-talk markers, else the surface's "?" help), have
  // Ari explain it (live NAS model when reachable, deterministic on-device
  // otherwise — never fabricated), then speak it in the chosen reading voice.
  const talkAbout = async () => {
    setTalking(true);
    setTalkSource('');
    const main = (typeof document !== 'undefined' && document.querySelector('main')) || null;
    const helpEntry = helpFor({ view, churchView, booksView });
    const digest = buildSurfaceDigest({ root: main, helpEntry, title: helpEntry && helpEntry.title });
    const { text, source } = await talkAboutSurface(digest);
    setTalking(false);
    setTalkSource(source === 'live' ? 'Ari, live' : 'Ari, on-device');
    followRef.current = null; // Ari's explanation isn't on-screen text — no highlight map
    if (text) read(text);
  };

  // CLOSING IS NOT SILENCING (Darrell 2026-08-10: "The reader can't be closed
  // after opening to change speed of the reader... we need that"). Closing used
  // to call stop(), so the only way out of the panel after adjusting the speed
  // was to kill the reading — the listener had to choose between the controls
  // and the Word. Now there is ONE thing that stops the voice: Stop. Close puts
  // the panel away; while reading, the collapsed button stays visibly in the
  // reading state so Stop is always one tap away.
  // The ONE thing that ends a hands-free run. Every Stop control routes here so
  // "it ended" and "you ended it" can never be confused.
  const stopAll = () => {
    runRef.current = null;
    setRunInfo(null);
    stop();
  };

  const close = () => {
    if (!isReading) stopAll(); // idle: also stands down an armed tap-to-start
    setArmed(false);
    setIsOpen(false);
  };

  // Grouped voice options (System / Your voices / Voices & accents) — same global
  // preference the header picker and Voice tab write.
  const groups = catalog.reduce((acc, item) => { (acc[item.group] = acc[item.group] || []).push(item); return acc; }, {});
  const order = ['Default', 'Your voices', 'Voices & accents'].filter((g) => groups[g] && groups[g].length);
  const onVoice = (e) => { const item = catalog.find((c) => c.id === e.target.value); if (item && !item.usable) return; setVoiceId(e.target.value); };
  const statusLabel = isReading ? (isPaused ? 'Paused' : 'Reading…') : 'Ready';

  return (
    <div className="tts-controls fixed bottom-4 right-4 z-40 print:hidden">
      {isOpen && minimized && isReading ? (
        /* THE READING PILL (DR-0265): while the voice is reading, the full card
           would sit on top of the very words being read + highlighted — so it
           collapses to this slim pill. Pause/resume, stop, and expand only;
           everything else waits behind the ⌃. */
        <div
          className="bg-white border-2 border-[#1A1815] shadow-lg px-[0.5em] py-[0.375em] flex items-center gap-[0.375em]"
          style={{ fontSize: 'calc(1rem * var(--ts-chrome-scale, 1))' }}
          role="region"
          aria-label="Reading controls (minimized)"
        >
          <span className="text-[0.6875em] uppercase tracking-wider text-[#B85838] font-semibold" aria-live="polite">{isPaused ? 'Paused' : 'Reading…'}{runInfo ? ' · keeps going' : ''}</span>
          <button type="button" onClick={isPaused ? resume : pause} className="px-[0.625em] py-[0.375em] text-[0.75em] uppercase tracking-wider border-2 border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white font-semibold focus:outline focus:outline-2 focus:outline-[#B85838]">
            {isPaused ? '▶' : '⏸'}
          </button>
          <button type="button" onClick={stopAll} aria-label="Stop reading" className="px-[0.625em] py-[0.375em] text-[0.75em] uppercase tracking-wider border-2 border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white font-semibold focus:outline focus:outline-2 focus:outline-[#B85838]">
            ⏹
          </button>
          <button type="button" onClick={() => setMinimized(false)} aria-label="Expand reading controls" className="px-[0.5em] py-[0.375em] text-[0.75em] border-2 border-[#E8E4DC] text-[#5A5751] hover:border-[#1A1815] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]">
            ⌃
          </button>
          {/* Put the pill away without silencing the Word — the button it
              collapses into keeps reading and keeps Stop one tap away. */}
          <button type="button" onClick={close} aria-label="Hide reading controls — keeps reading" className="px-[0.5em] py-[0.375em] text-[0.75em] border-2 border-[#E8E4DC] text-[#5A5751] hover:border-[#1A1815] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]">
            ×
          </button>
        </div>
      ) : isOpen ? (
        /* THE PANEL IS CHROME, NOT READING TEXT (Pattern 2b; Darrell 2026-07-27:
           "The sizes of text makes the talk section not useful" — at A+++/A44
           the rem-based labels ballooned inside the fixed 260px box: buttons
           wrapped to three lines, the five speed chips crushed together, and
           the panel clipped off-screen). Fix, same law as the collapsed FAB's
           ts-chrome-region: the panel's font-size is the CAPPED chrome size
           (1rem × --ts-chrome-scale = the capped chrome multiplier — ~1.1x at
           A+++, ~1.4x at A44, exactly 1x at Normal), and EVERYTHING inside is
           sized in em so text, padding, and the box grow together, bounded.
           Width is em too (16.25em = 260px at Normal) so the panel widens in
           step with its own capped text; max-h + scroll keep it on-screen at
           any size instead of clipping controls off the top. */
        <div
          className="bg-white border-2 border-[#1A1815] p-[0.75em] shadow-lg w-[16.25em] max-w-[calc(100vw-2rem)] max-h-[calc(100dvh-7rem)] overflow-y-auto"
          style={{ fontSize: 'calc(1rem * var(--ts-chrome-scale, 1))' }}
        >
          <div className="flex items-baseline justify-between mb-[0.75em]">
            <div>
              <div className="text-[0.5625em] uppercase tracking-[0.25em] text-[#B85838] font-semibold">🔊 Read Aloud</div>
              <div className="text-[0.625em] text-[#5A5751]" role="status" aria-live="polite" style={{ fontFamily: '"Fraunces", serif' }}>{armed ? 'Tap any word on the page — reading starts there' : (talking ? 'Ari is looking at this screen…' : (talkSource && !isReading ? talkSource : (isReading && runInfo ? `${statusLabel} — keeps going to the next one` : statusLabel)))}</div>
            </div>
            <div className="flex items-center gap-[0.375em]">
              {isReading && (
                <button type="button" onClick={() => setMinimized(true)} aria-label="Collapse to the reading pill — keeps reading" className="text-[0.625em] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]">⌄ Smaller</button>
              )}
              <button type="button" onClick={close} title={isReading ? 'Closes the panel — the reading keeps going' : 'Close'} className="text-[0.625em] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]">× Close</button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-[0.25em] mb-[0.75em]">
            {!isReading ? (
              <>
                {/* One full piece, start to finish — primary when a surface has
                    registered its reading (the open lesson). Never the page mix. */}
                {target && (
                  <button type="button" onClick={() => readTargetNow(target)} className="col-span-3 bg-[#5A6E3D] text-white px-[0.75em] py-[0.625em] text-[0.75em] uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]">▶ Read {target.label} — start to finish</button>
                )}
                <button type="button" onClick={start} className={`col-span-3 px-[0.75em] py-[0.625em] text-[0.75em] uppercase tracking-wider font-semibold focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838] ${target ? 'border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white' : 'bg-[#1A1815] text-white hover:bg-[#B85838]'}`}>▶ Read this page</button>
                {/* START WHERE I TAP — arm, then the next tap on the page picks
                    the word reading begins from (Esc or Cancel to stand down). */}
                {!armed ? (
                  <button type="button" onClick={() => setArmed(true)} className="col-span-3 flex items-center justify-center gap-[0.375em] border border-[#1A1815] text-[#1A1815] px-[0.75em] py-[0.625em] text-[0.75em] uppercase tracking-wider font-semibold hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]"><UiIcon name="pin" /> Start where I tap</button>
                ) : (
                  <button type="button" onClick={() => setArmed(false)} className="col-span-3 bg-[#B85838] text-white px-[0.75em] py-[0.625em] text-[0.75em] uppercase tracking-wider font-semibold focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#1A1815]">Now tap the word to start from — or Cancel</button>
                )}
                {/* TALK ABOUT THIS — Ari explains the current screen (its real
                    numbers, or what the tab is), spoken in the chosen voice. */}
                <button type="button" onClick={talkAbout} disabled={talking} className="col-span-3 flex items-center justify-center gap-[0.375em] border border-[#B85838] text-[#B85838] px-[0.75em] py-[0.625em] text-[0.75em] uppercase tracking-wider font-semibold hover:bg-[#B85838] hover:text-white disabled:opacity-50 focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]"><UiIcon name="volume" /> {talking ? 'Thinking…' : 'Talk about this'}</button>
              </>
            ) : (
              <>
                <button type="button" onClick={isPaused ? resume : pause} className="bg-[#1A1815] text-white px-[0.5em] py-[0.625em] text-[0.75em] uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]">{isPaused ? '▶ Resume' : '⏸ Pause'}</button>
                <button type="button" onClick={stopAll} className="col-span-2 border border-[#1A1815] text-[#1A1815] px-[0.5em] py-[0.625em] text-[0.75em] uppercase tracking-wider hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]">⏹ Stop</button>
              </>
            )}
          </div>

          <div className="mb-[0.5em]">
            <div className="text-[0.5625em] uppercase tracking-wider text-[#5A5751] mb-[0.25em]">Speed: {rate.toFixed(1)}×</div>
            <div className="grid grid-cols-5 gap-[0.25em]" role="group" aria-label="Reading speed">
              {RATE_STEPS.map((s) => {
                const selected = Math.abs(rate - s.value) < 0.001;
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setRate(s.value)}
                    aria-pressed={selected}
                    aria-label={`${s.name} (${s.label})${selected ? ' — current' : ''}`}
                    title={s.name}
                    className={`px-[0.25em] py-[0.5em] text-[0.625em] uppercase tracking-wider border min-h-[2.25em] focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838] ${selected ? 'border-[#1A1815] bg-[#1A1815] text-white' : 'border-[#E8E4DC] text-[#5A5751] hover:border-[#1A1815]'}`}
                  >{s.label}</button>
                );
              })}
            </div>
          </div>

          {catalog.length > 1 ? (
            <div className="mb-[0.5em]">
              <label htmlFor="tts-voice" className="block text-[0.5625em] uppercase tracking-wider text-[#5A5751] mb-[0.25em]">Voice (used everywhere)</label>
              <select
                id="tts-voice"
                value={voiceId}
                onChange={onVoice}
                className="w-full text-[0.6875em] border border-[#E8E4DC] bg-white text-[#1A1815] px-[0.5em] py-[0.5em] focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]"
              >
                {order.map((g) => (
                  <optgroup key={g} label={g}>
                    {groups[g].map((item) => (
                      <option key={item.id} value={item.id} disabled={!item.usable}>
                        {item.label}{item.ai ? ' · AI' : ''}{item.standIn ? ' (stand-in)' : ''}{!item.usable ? ' — subscriber' : ''}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          ) : null}

          <p className="text-[0.5625em] text-[#5A5751] leading-snug" style={{ fontFamily: '"Fraunces", serif' }}>
            {target ? `Read ${target.label} opens every part of that one piece and reads it start to finish — nothing else on the page mixed in. ` : ''}Read this page opens what is collapsed on it and recites it from the top; Start where I tap begins at the word you touch; Talk about this has Ari explain what is on it — all in your chosen voice{currentItem && currentItem.ai ? ' (AI-generated)' : ''}, on every page.
          </p>
          <p className="text-[0.5625em] text-[#5A5751] leading-snug mt-[0.375em]" style={{ fontFamily: '"Fraunces", serif' }}>
            Only <strong>Stop</strong> stops the voice. Close puts this panel away and keeps reading, and the reading carries on when you leave the app — your phone’s own play/pause controls it.
          </p>
        </div>
      ) : (
        // .ts-chrome-region caps it so it does NOT grow with the text-size
        // control — chrome, not reading text (Pattern 2b/2d). Idle-reveal dims +
        // settles it when idle, springs it back on scroll/touch.
        // While reading it never dims and never hides: it wears the reading
        // state (a live badge + an honest label) so a closed panel still shows
        // the Word is playing and Stop is one tap away — including after the
        // user has left the app and come back (background playback).
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label={isReading ? (isPaused ? 'Reading paused — open read-aloud controls' : 'Reading aloud — open read-aloud controls') : 'Open read-aloud controls'}
          title={isReading ? 'Reading aloud — tap for pause, speed and stop' : 'Read aloud'}
          className={`ts-chrome-region relative ${isReading ? 'bg-[#B85838]' : 'bg-[#1A1815]'} text-white w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-lg hover:bg-[#B85838] flex items-center justify-center text-xl sm:text-2xl border-2 border-[#FAF8F4] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838] transition-all duration-500 hover:opacity-100 focus:opacity-100 ${(revealFab || isReading) ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-2'}`}
        >
          🔊
          {isReading && (
            <span aria-hidden="true" className="absolute -top-1 -right-1 bg-[#1A1815] text-white text-[0.5rem] leading-none px-1.5 py-1 rounded-full border border-[#FAF8F4]">
              {isPaused ? '❚❚' : '▶'}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
