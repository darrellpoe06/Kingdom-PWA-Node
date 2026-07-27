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
import React, { useEffect, useState } from 'react';
import { RATE_STEPS } from '../lib/tts.js';
import { useReadAloud } from '../lib/use-read-aloud.js';
import { readFromPoint } from '../lib/read-from-here.js';
import UiIcon from './UiIcon.jsx';
import { helpFor } from '../lib/help-content.js';
import { buildSurfaceDigest } from '../lib/surface-digest.js';
import { talkAboutSurface } from '../lib/talk-about.js';
import { useIdleReveal } from '../lib/use-idle-reveal.js';

// Pull the visible page text: clone <main>, strip floating/hidden chrome.
function readablePageText() {
  if (typeof document === 'undefined') return '';
  const main = document.querySelector('main') || document.body;
  if (!main) return '';
  const clone = main.cloneNode(true);
  clone.querySelectorAll('.tts-controls, .feedback-modal, [aria-hidden="true"]').forEach((el) => el.remove());
  return (clone.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 32000);
}

export default function TTSControl({ isOwner = false, view, churchView, booksView }) {
  const [isOpen, setIsOpen] = useState(false);
  // "Talk about this" state: thinking, and the source of the last explanation
  // (live NAS A.I. vs on-device authored) so the user knows which they heard.
  const [talking, setTalking] = useState(false);
  const [talkSource, setTalkSource] = useState('');
  const {
    supported, isReading, isPaused, rate, read, pause, resume, stop, setRate,
    catalog, voiceId, setVoiceId, currentItem,
  } = useReadAloud({ isOwner });

  // START WHERE I TAP (DR-0144): "if Ari could start right at wherever users
  // want it to start... whatever word on the page" (Darrell, 2026-07-10). Arm a
  // one-shot capture listener; the next tap on the page becomes the reading
  // start — mapped to the exact word via lib/read-from-here, falling back to the
  // top of the page (never silence) when the device can't resolve the tap.
  const [armed, setArmed] = useState(false);
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
      const hit = readFromPoint(main, e.clientX, e.clientY);
      const text = (hit && hit.text) || readablePageText();
      if (text) read(text);
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

  const start = () => { const text = readablePageText(); if (text) read(text); };

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
    if (text) read(text);
  };

  const close = () => { stop(); setArmed(false); setIsOpen(false); };

  // Grouped voice options (System / Your voices / Voices & accents) — same global
  // preference the header picker and Voice tab write.
  const groups = catalog.reduce((acc, item) => { (acc[item.group] = acc[item.group] || []).push(item); return acc; }, {});
  const order = ['Default', 'Your voices', 'Voices & accents'].filter((g) => groups[g] && groups[g].length);
  const onVoice = (e) => { const item = catalog.find((c) => c.id === e.target.value); if (item && !item.usable) return; setVoiceId(e.target.value); };
  const statusLabel = isReading ? (isPaused ? 'Paused' : 'Reading…') : 'Ready';

  return (
    <div className="tts-controls fixed bottom-4 right-4 z-40 print:hidden">
      {isOpen ? (
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
              <div className="text-[0.625em] text-[#5A5751]" role="status" aria-live="polite" style={{ fontFamily: '"Fraunces", serif' }}>{armed ? 'Tap any word on the page — reading starts there' : (talking ? 'Ari is looking at this screen…' : (talkSource && !isReading ? talkSource : statusLabel))}</div>
            </div>
            <button type="button" onClick={close} className="text-[0.625em] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]">× Close</button>
          </div>

          <div className="grid grid-cols-3 gap-[0.25em] mb-[0.75em]">
            {!isReading ? (
              <>
                <button type="button" onClick={start} className="col-span-3 bg-[#1A1815] text-white px-[0.75em] py-[0.625em] text-[0.75em] uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]">▶ Read this page</button>
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
                <button type="button" onClick={stop} className="col-span-2 border border-[#1A1815] text-[#1A1815] px-[0.5em] py-[0.625em] text-[0.75em] uppercase tracking-wider hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]">⏹ Stop</button>
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
            Read this page recites it from the top; Start where I tap begins at the word you touch; Talk about this has Ari explain what is on it — all in your chosen voice{currentItem && currentItem.ai ? ' (AI-generated)' : ''}, on every page.
          </p>
        </div>
      ) : (
        // .ts-chrome-region caps it so it does NOT grow with the text-size
        // control — chrome, not reading text (Pattern 2b/2d). Idle-reveal dims +
        // settles it when idle, springs it back on scroll/touch.
        <button type="button" onClick={() => setIsOpen(true)} aria-label="Open read-aloud controls" title="Read aloud" className={`ts-chrome-region bg-[#1A1815] text-white w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-lg hover:bg-[#B85838] flex items-center justify-center text-xl sm:text-2xl border-2 border-[#FAF8F4] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838] transition-all duration-500 hover:opacity-100 focus:opacity-100 ${revealFab ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-2'}`}>
          🔊
        </button>
      )}
    </div>
  );
}
