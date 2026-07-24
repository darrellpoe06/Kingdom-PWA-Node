// =============================================================================
// AudienceWindow — the screen the STUDENTS see (projected behind Darrell)
// =============================================================================
// Booted standalone by main.jsx when the URL carries ?audience=1. It is opened by
// the presenter (TeachMode) via window.open onto the second display, holds NO
// curriculum knowledge of its own, and simply renders whatever slide the presenter
// broadcasts over the BroadcastChannel. Dark, huge, high-contrast for a projector;
// no controls a student could trip over.
//
// Handshake: on mount it posts {type:'ready'} so the presenter re-sends the current
// slide (covers the case where the audience window opens after the presenter has
// already advanced). It then listens for {type:'slide'|'hold'} messages.
//
// Contrast (WCAG AA, on #14110E near-black): #FAF8F4 body (>16:1), #CFC9BD
// secondary (~9:1), #C9D9A6 green + #EBA77E orange accents (>=4.5:1) — all verified
// against the rendered tokens, all at large sizes.
import React, { useEffect, useState, useCallback } from 'react';
import { TEACH_CHANNEL } from '../lib/teach-present.js';
import AudienceSlide from './AudienceSlide.jsx';

export default function AudienceWindow() {
  const [slide, setSlide] = useState(null);
  const [hold, setHold] = useState(null);
  const [canFs, setCanFs] = useState(false);
  const [isFs, setIsFs] = useState(false);

  useEffect(() => {
    let ch;
    try {
      ch = new BroadcastChannel(TEACH_CHANNEL);
    } catch (e) {
      return; // very old browser — page still renders the waiting state
    }
    const onMsg = (ev) => {
      const m = ev?.data;
      if (!m || typeof m !== 'object') return;
      if (m.type === 'slide') { setHold(null); setSlide(m); }
      else if (m.type === 'hold') { setHold(m); }
    };
    ch.addEventListener('message', onMsg);
    // tell the presenter we are here so it (re)sends the current slide
    try { ch.postMessage({ type: 'ready' }); } catch (e) { /* non-fatal */ }
    setCanFs(typeof document !== 'undefined' && !!document.documentElement.requestFullscreen);
    const onFs = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => { try { ch.removeEventListener('message', onMsg); ch.close(); } catch (e) {} document.removeEventListener('fullscreenchange', onFs); };
  }, []);

  const goFullscreen = useCallback(() => {
    try { document.documentElement.requestFullscreen?.(); } catch (e) { /* user can press F11 */ }
  }, []);

  const showHold = !!hold || !slide;

  return (
    <div
      style={{
        minHeight: '100vh', background: '#14110E', color: '#FAF8F4',
        // Top-aligned on purpose: on an LED wall the speaker stands BELOW the words,
        // so the slide sits at the TOP and the black fills the bottom — the speaker
        // never blocks the text (Darrell 2026-07-19, Love Corner).
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-start',
        padding: 'clamp(24px, 5vw, 72px)', fontFamily: '"Fraunces", Georgia, serif',
        cursor: (!showHold && isFs) ? 'none' : 'default', // only hide the pointer once projected fullscreen
      }}
    >
      {canFs && !isFs && (
        <button
          type="button"
          onClick={goFullscreen}
          style={{
            position: 'fixed', top: 16, right: 16, cursor: 'pointer',
            fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase',
            color: '#CFC9BD', background: 'transparent', border: '1px solid #4A453D',
            padding: '8px 14px', fontFamily: '"JetBrains Mono", monospace',
          }}
        >
          Full screen
        </button>
      )}

      <AudienceSlide slide={showHold ? null : slide} hold={hold} />
    </div>
  );
}
