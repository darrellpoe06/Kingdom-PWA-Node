// =============================================================================
// SharePoster — a full-screen "scan to get the app" poster for a room
// =============================================================================
// The project-it-on-the-wall companion to AppShareQR. A steward opens this on a
// screen or projector (?share=1) and a whole room scans one big code to reach
// the platform-aware install page — the fastest way to onboard a congregation
// or a family gathering without anyone typing a URL (COMMUNITY-FIRST-MISSION;
// same friction install-help fights, solved for many people at once).
//
// Dark, huge, high-contrast (mirrors AudienceWindow): the QR is on a white card
// with a wide quiet zone so phone cameras lock on from across a room. No account,
// no data, no auth — it only DISPLAYS the canonical public join URL. Showing it
// never grants access; that stays a deliberate steward action.
import React, { useCallback, useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { appJoinUrl, appJoinUrlDisplay } from '../lib/app-share.js';

const INK = '#1A1815';
const CREAM = '#FAF8F4';
// Lightened coral (vs the #B85838 brand accent) so the eyebrow clears WCAG AA
// (>=4.5:1) on the dark poster — the legibility guard measures inline text
// colors against the dark card surface. Coral/orange, not true red (DR-0099).
const CORAL = '#D57A55';
const MUTE = '#B8B2A6';

export default function SharePoster() {
  const url = appJoinUrl();
  const shown = appJoinUrlDisplay();
  const [full, setFull] = useState(false);

  const toggleFull = useCallback(() => {
    try {
      if (!document.fullscreenElement) { document.documentElement.requestFullscreen?.(); }
      else { document.exitFullscreen?.(); }
    } catch (e) { /* fullscreen is best-effort */ }
  }, []);

  useEffect(() => {
    const onChange = () => setFull(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center px-6 py-10 text-center select-none"
      style={{ background: INK, color: CREAM }}
    >
      <div className="text-sm sm:text-base uppercase tracking-[0.35em] font-semibold" style={{ color: CORAL }}>
        PoeTech · Life, Soul &amp; Money
      </div>
      <h1
        className="mt-3 text-3xl sm:text-5xl font-bold"
        style={{ fontFamily: '"Fraunces", Georgia, serif', letterSpacing: '-0.02em' }}
      >
        Scan to get the app
      </h1>

      <div className="mt-8 sm:mt-10 bg-white rounded-2xl p-5 sm:p-7 shadow-xl">
        <QRCodeSVG
          value={url}
          size={320}
          level="M"
          includeMargin={false}
          role="img"
          aria-label="QR code to install the PoeTech app"
          className="w-[62vw] max-w-[420px] h-auto"
        />
      </div>

      <p className="mt-7 text-lg sm:text-2xl" style={{ color: CREAM }}>
        Point your phone camera at the code
      </p>
      <p className="mt-2 text-base sm:text-lg" style={{ color: MUTE }}>
        or open <span className="font-mono" style={{ color: '#f4b740' }}>{shown}</span>
      </p>

      <button
        type="button"
        onClick={toggleFull}
        className="mt-9 text-xs uppercase tracking-[0.2em] px-5 py-3 min-h-[44px] rounded-full border"
        style={{ borderColor: MUTE, color: CREAM }}
      >
        {full ? 'Exit full screen' : 'Full screen'}
      </button>

      <p className="mt-6 text-[0.7rem] italic" style={{ color: MUTE }}>
        Showing this code shares the way in — it doesn't grant access on its own.
      </p>
    </div>
  );
}
