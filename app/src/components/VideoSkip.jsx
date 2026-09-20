// =============================================================================
// VideoSkip — the fast-forward a television actually has hands for
// =============================================================================
// Darrell 2026-09-20: "Need a way to fast forward videos.... can't"
//
// YouTube's own scrub bar is inside the iframe, so on a TV it is a four-pixel
// line you are meant to hit by pushing a cursor with a D-pad. These are real
// buttons in our DOM instead — big, focusable, walked by the remote navigation
// and outlined by the focus ring.
//
// It takes a ref to the iframe rather than rendering one, so the SAME control
// serves the docked player and the popped-out one without either of them
// re-mounting the frame and restarting the video.
import React, { useEffect, useRef, useState } from 'react';
import {
  YT_ORIGIN, isYouTubeEmbed, listenCommand, command, readPlayerInfo, nextSeek, SKIPS,
} from '../lib/youtube-embed-control.js';

export default function VideoSkip({ frameRef, src, className = '' }) {
  const timeRef = useRef(0);
  const durationRef = useRef(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isYouTubeEmbed(src)) return undefined;
    const onMessage = (e) => {
      if (e.origin !== YT_ORIGIN) return; // never trust a message from anywhere else
      const info = readPlayerInfo(e.data);
      if (!info) return;
      if (typeof info.currentTime === 'number') timeRef.current = info.currentTime;
      if (typeof info.duration === 'number') durationRef.current = info.duration;
      if (!ready) setReady(true);
    };
    window.addEventListener('message', onMessage);
    // Ask the embed to start reporting. It may not be loaded yet, so ask again
    // briefly — a single shot at mount races the iframe and usually loses.
    const ask = () => {
      const w = frameRef && frameRef.current && frameRef.current.contentWindow;
      if (w) { try { w.postMessage(listenCommand(), YT_ORIGIN); } catch (_) { /* ignore */ } }
    };
    ask();
    const t = setInterval(ask, 1000);
    const stop = setTimeout(() => clearInterval(t), 8000);
    return () => { window.removeEventListener('message', onMessage); clearInterval(t); clearTimeout(stop); };
  }, [src, frameRef, ready]);

  if (!isYouTubeEmbed(src)) return null;

  const skip = (delta) => {
    const w = frameRef && frameRef.current && frameRef.current.contentWindow;
    if (!w) return;
    const to = nextSeek(timeRef.current, delta, durationRef.current);
    try {
      w.postMessage(command('seekTo', [to, true]), YT_ORIGIN);
      w.postMessage(command('playVideo'), YT_ORIGIN);
    } catch (_) { /* a refused postMessage is a dead button, never a crash */ }
    timeRef.current = to;
  };

  return (
    <div className={`flex items-center gap-2 mt-2 ${className}`} data-testid="video-skip">
      {SKIPS.map((s) => (
        <button
          key={s.delta}
          type="button"
          onClick={() => skip(s.delta)}
          aria-label={`Skip ${s.label}`}
          className="px-3 py-2 min-h-[44px] min-w-[72px] border-2 border-[#CFC9BD] text-[#1A1815] bg-white font-semibold text-sm hover:border-[#B85838] hover:text-[#B85838] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
        >
          {s.glyph}
        </button>
      ))}
    </div>
  );
}
