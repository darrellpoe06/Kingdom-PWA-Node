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

export default function AudienceWindow() {
  const [slide, setSlide] = useState(null);
  const [hold, setHold] = useState(null);
  const [canFs, setCanFs] = useState(false);

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
    return () => { try { ch.removeEventListener('message', onMsg); ch.close(); } catch (e) {} };
  }, []);

  const goFullscreen = useCallback(() => {
    try { document.documentElement.requestFullscreen?.(); } catch (e) { /* user can press F11 */ }
  }, []);

  const showHold = !!hold || !slide;

  return (
    <div
      style={{
        minHeight: '100vh', background: '#14110E', color: '#FAF8F4',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: 'clamp(24px, 5vw, 72px)', fontFamily: '"Fraunces", Georgia, serif',
        cursor: showHold ? 'default' : 'none',
      }}
    >
      {canFs && (
        <button
          type="button"
          onClick={goFullscreen}
          style={{
            position: 'fixed', top: 16, right: 16, cursor: 'pointer',
            fontSize: 12, letterSpacing: '0.15em', textTransform: 'uppercase',
            color: '#CFC9BD', background: 'transparent', border: '1px solid #4A453D',
            padding: '8px 14px', fontFamily: '"JetBrains Mono", monospace',
          }}
        >
          Full screen
        </button>
      )}

      {showHold ? (
        <div style={{ textAlign: 'center', margin: 'auto' }}>
          <div style={{ fontSize: 'clamp(13px, 1.4vw, 18px)', letterSpacing: '0.35em', textTransform: 'uppercase', color: '#EBA77E', marginBottom: 24 }}>
            The Church of the Living God
          </div>
          <h1 style={{ fontSize: 'clamp(40px, 7vw, 104px)', fontWeight: 600, lineHeight: 1.04, letterSpacing: '-0.02em', margin: 0 }}>
            {hold?.title || 'Learning A.I. The Way'}
          </h1>
          <p style={{ fontSize: 'clamp(16px, 1.8vw, 24px)', color: '#CFC9BD', marginTop: 28 }}>
            {slide ? 'Ready when you are.' : 'Waiting for the teacher to begin…'}
          </p>
        </div>
      ) : (
        <div style={{ maxWidth: 1400, margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 'clamp(16px, 2vw, 28px)' }}>
            <span style={{ fontSize: 'clamp(13px, 1.4vw, 18px)', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#EBA77E' }}>
              Week {slide.week} of {slide.total}
            </span>
            {slide.dateLabel && (
              <span style={{ fontSize: 'clamp(12px, 1.2vw, 16px)', color: '#CFC9BD', fontFamily: '"JetBrains Mono", monospace' }}>
                {slide.dateLabel}
              </span>
            )}
          </div>

          <h1 style={{ fontSize: 'clamp(36px, 6vw, 96px)', fontWeight: 600, lineHeight: 1.03, letterSpacing: '-0.02em', margin: 0 }}>
            {slide.title}
          </h1>

          <p style={{ fontSize: 'clamp(20px, 2.8vw, 42px)', lineHeight: 1.3, marginTop: 'clamp(20px, 3vw, 40px)', marginBottom: 0 }}>
            {slide.bigIdea}
          </p>

          {slide.inApp && (
            <p style={{ fontSize: 'clamp(16px, 2vw, 30px)', lineHeight: 1.35, marginTop: 'clamp(18px, 2.4vw, 32px)', color: '#CFC9BD' }}>
              <span style={{ color: '#C9D9A6', fontWeight: 600 }}>In the app: </span>{slide.inApp}
            </p>
          )}

          {slide.anchorRef && (
            <p style={{ fontSize: 'clamp(15px, 1.8vw, 26px)', lineHeight: 1.35, marginTop: 'clamp(20px, 3vw, 40px)', color: '#C9D9A6' }}>
              <strong>{slide.anchorRef}</strong>{slide.anchorTheme ? ` — ${slide.anchorTheme}` : ''}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
