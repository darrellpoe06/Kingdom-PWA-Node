// =============================================================================
// NdiProgramOutput — the clean PROGRAM OUTPUT screen OBS ingests as a Browser Source
// =============================================================================
// Booted standalone by main.jsx on ?output=1. This is the NDI low-hanging-fruit: a
// fixed-frame, high-contrast program renderer that OBS picks up as a Browser Source
// and DistroAV (obs-ndi) republishes as an NDI source on the church LAN — lyrics,
// Scripture, a holding card, or a keyed lower-third onto the sanctuary screens with
// no HDMI run from the booth. See lib/ndi-output.js for the full contract + routing.
//
// It is USEFUL the moment it ships, with NO in-app sender built: the media team opens
//   ?output=1&kind=scripture&ref=John 3:16&text=For God so loved the world...
// as the Browser Source URL and it renders. A future in-app "program control" panel
// can drive it live over the PROGRAM_CHANNEL BroadcastChannel; this route listens for
// that too, so URL-seeded and live-driven both work.
//
// ?key=1 (or a lower-third payload) renders on a TRANSPARENT background so the
// switcher composites it over the live camera. OBS Browser Source must have
// "transparent" / custom CSS body{background:transparent} for the key to pass.
//
// Contrast (WCAG AA, on #14110E near-black, matching the verified AudienceWindow
// tokens): #FAF8F4 body (>16:1), #CFC9BD secondary (~9:1), #C9D9A6 green + #EBA77E
// orange accents (>=4.5:1) — all at large sizes.
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { PROGRAM_CHANNEL, parseOutputParams, wantsKey, holdProgram } from '../lib/ndi-output.js';

const BG = '#14110E';
const TEXT = '#FAF8F4';
const DIM = '#CFC9BD';
const ORANGE = '#EBA77E';
const GREEN = '#C9D9A6';

export default function NdiProgramOutput() {
  const params = useMemo(
    () => (typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams()),
    []
  );
  const keyOverride = params.get('key') === '1';
  const seeded = useMemo(() => parseOutputParams(params), [params]);

  const [payload, setPayload] = useState(seeded);
  const [canFs, setCanFs] = useState(false);
  const [isFs, setIsFs] = useState(false);

  useEffect(() => {
    let ch;
    try {
      ch = new BroadcastChannel(PROGRAM_CHANNEL);
    } catch (e) {
      return; // very old browser — still renders the seeded/hold state
    }
    const onMsg = (ev) => {
      const m = ev?.data;
      if (!m || typeof m !== 'object' || !m.kind) return;
      setPayload(m);
    };
    ch.addEventListener('message', onMsg);
    try { ch.postMessage({ type: 'ready' }); } catch (e) { /* non-fatal */ }
    setCanFs(typeof document !== 'undefined' && !!document.documentElement.requestFullscreen);
    const onFs = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => {
      try { ch.removeEventListener('message', onMsg); ch.close(); } catch (e) {}
      document.removeEventListener('fullscreenchange', onFs);
    };
  }, []);

  const keyed = wantsKey(payload, keyOverride);

  // For a keyed lower-third the page background must be transparent end-to-end so OBS
  // passes the key; set it on the document too (the root div alone isn't enough).
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const prevBody = document.body.style.background;
    const prevHtml = document.documentElement.style.background;
    if (keyed) {
      document.body.style.background = 'transparent';
      document.documentElement.style.background = 'transparent';
    }
    return () => { document.body.style.background = prevBody; document.documentElement.style.background = prevHtml; };
  }, [keyed]);

  const goFullscreen = useCallback(() => {
    try { document.documentElement.requestFullscreen?.(); } catch (e) { /* user can press F11 */ }
  }, []);

  const p = payload || holdProgram();
  const showFsBtn = canFs && !isFs && !keyed;

  // --- keyed lower-third: a single bar pinned low, transparent everywhere else -----
  if (keyed && p.kind === 'lower-third') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'flex-end', background: 'transparent', fontFamily: '"Fraunces", Georgia, serif' }}>
        <div style={{ margin: 'clamp(24px, 6vh, 80px)', padding: 'clamp(14px, 1.6vw, 26px) clamp(20px, 2.4vw, 40px)', background: 'rgba(20,17,14,0.86)', borderLeft: `6px solid ${ORANGE}`, maxWidth: '70%' }}>
          <div style={{ fontSize: 'clamp(26px, 3.6vw, 56px)', fontWeight: 600, color: TEXT, lineHeight: 1.05 }}>
            {p.name || ' '}
          </div>
          {p.role && (
            <div style={{ fontSize: 'clamp(15px, 1.7vw, 26px)', color: GREEN, letterSpacing: '0.04em', marginTop: 8 }}>
              {p.role}
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- full-bleed IMAGE (sermon graphic / worship background) ----------------------
  // Edge-to-edge at native quality for the 1.9 mm wall (NovaStar VX1000, ~1920x1440).
  // fit='contain' shows the whole image (no crop); 'cover' fills (may crop). Authoring
  // rule: feed a high-res source — never upscale a small asset onto the wall.
  if (p.kind === 'image' && p.src) {
    return (
      <div style={{ minHeight: '100vh', width: '100%', background: '#000', position: 'relative', display: 'flex', overflow: 'hidden' }}>
        <img
          src={p.src}
          alt={p.alt || ''}
          style={{ width: '100%', height: '100vh', objectFit: p.fit === 'cover' ? 'cover' : 'contain', display: 'block' }}
        />
        {p.caption && (
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 'clamp(16px, 3vh, 48px)', background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)', color: TEXT, fontFamily: '"Fraunces", Georgia, serif', fontSize: 'clamp(20px, 2.6vw, 44px)', textAlign: 'center' }}>
            {p.caption}
          </div>
        )}
      </div>
    );
  }

  // --- full-frame program (hold / scripture / lyric / slide) -----------------------
  return (
    <div
      style={{
        minHeight: '100vh', background: BG, color: TEXT,
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: 'clamp(24px, 5vw, 80px)', fontFamily: '"Fraunces", Georgia, serif',
        cursor: isFs ? 'none' : 'default',
      }}
    >
      {showFsBtn && (
        <button
          type="button"
          onClick={goFullscreen}
          style={{
            position: 'fixed', top: 16, right: 16, cursor: 'pointer',
            fontSize: 12, letterSpacing: '0.15em', textTransform: 'uppercase',
            color: DIM, background: 'transparent', border: '1px solid #4A453D',
            padding: '8px 14px', fontFamily: '"JetBrains Mono", monospace',
          }}
        >
          Full screen
        </button>
      )}

      <div style={{ maxWidth: 1500, margin: '0 auto', width: '100%' }}>
        {p.kind === 'scripture' && (
          <>
            {p.ref && (
              <div style={{ fontSize: 'clamp(15px, 1.8vw, 26px)', letterSpacing: '0.3em', textTransform: 'uppercase', color: ORANGE, marginBottom: 'clamp(18px, 2.6vw, 36px)' }}>
                {p.ref}{p.translation ? `  ·  ${p.translation}` : ''}
              </div>
            )}
            <p style={{ fontSize: 'clamp(28px, 4vw, 72px)', lineHeight: 1.22, fontWeight: 500, margin: 0 }}>
              {p.text || '…'}
            </p>
          </>
        )}

        {p.kind === 'lyric' && (
          <>
            {p.title && (
              <div style={{ fontSize: 'clamp(14px, 1.6vw, 22px)', letterSpacing: '0.3em', textTransform: 'uppercase', color: ORANGE, marginBottom: 'clamp(16px, 2.2vw, 30px)' }}>
                {p.title}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(6px, 1vw, 16px)' }}>
              {(p.lines && p.lines.length ? p.lines : ['…']).slice(0, 6).map((line, i) => (
                <p key={i} style={{ fontSize: 'clamp(28px, 4.4vw, 76px)', lineHeight: 1.16, fontWeight: 600, margin: 0 }}>{line}</p>
              ))}
            </div>
            {p.ref && (
              <p style={{ fontSize: 'clamp(14px, 1.5vw, 22px)', color: DIM, marginTop: 'clamp(20px, 3vw, 40px)', fontFamily: '"JetBrains Mono", monospace' }}>{p.ref}</p>
            )}
          </>
        )}

        {p.kind === 'slide' && (
          <>
            {p.eyebrow && (
              <div style={{ fontSize: 'clamp(14px, 1.6vw, 22px)', letterSpacing: '0.3em', textTransform: 'uppercase', color: ORANGE, marginBottom: 'clamp(16px, 2.2vw, 30px)' }}>
                {p.eyebrow}
              </div>
            )}
            {p.title && (
              <h1 style={{ fontSize: 'clamp(36px, 6vw, 96px)', fontWeight: 600, lineHeight: 1.04, letterSpacing: '-0.02em', margin: 0 }}>{p.title}</h1>
            )}
            {p.body && (
              <p style={{ fontSize: 'clamp(20px, 2.8vw, 42px)', lineHeight: 1.3, marginTop: 'clamp(20px, 3vw, 40px)', marginBottom: 0 }}>{p.body}</p>
            )}
            {p.ref && (
              <p style={{ fontSize: 'clamp(15px, 1.8vw, 26px)', color: GREEN, marginTop: 'clamp(20px, 3vw, 40px)' }}><strong>{p.ref}</strong></p>
            )}
          </>
        )}

        {(p.kind === 'hold' || (!['scripture', 'lyric', 'slide'].includes(p.kind))) && (
          <div style={{ textAlign: 'center', margin: 'auto' }}>
            <div style={{ fontSize: 'clamp(13px, 1.4vw, 18px)', letterSpacing: '0.35em', textTransform: 'uppercase', color: ORANGE, marginBottom: 24 }}>
              Program
            </div>
            <h1 style={{ fontSize: 'clamp(40px, 7vw, 104px)', fontWeight: 600, lineHeight: 1.04, letterSpacing: '-0.02em', margin: 0 }}>
              {p.title || 'The Church of the Living God'}
            </h1>
          </div>
        )}
      </div>
    </div>
  );
}
