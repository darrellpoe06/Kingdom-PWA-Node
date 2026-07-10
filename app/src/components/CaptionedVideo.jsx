// =============================================================================
// CaptionedVideo — a YouTube sermon embed with OUR OWN synchronized captions.
// =============================================================================
// WHY (Darrell 2026-07-09): YouTube's captions live only on YouTube's player. We
// want captions we own, on our surfaces. You CANNOT attach a <track> to a YouTube
// iframe, so the sovereign on-demand caption is a synchronized FOLLOW-ALONG panel:
// the timestamped cues (from video_transcripts.vtt, migration 0095) render beside
// the video, the current line highlights + auto-scrolls as it plays, every line is
// clickable to seek, and the whole message is searchable (tap a hit -> the video
// jumps there). It is captions + a searchable transcript in one, and it works for
// deaf/HOH viewers regardless of what YouTube does (accessibility, WCAG).
//
// GRACEFUL / UNBREAKABLE:
//   * No caption track for this video -> renders exactly the bare iframe it
//     replaced (zero visual change; the feature simply isn't offered).
//   * The YouTube IFrame API loads lazily and is optional. If it is blocked (CSP,
//     offline) the panel still lists/searches every cue; a click seeks by
//     reloading the embed at &start=<sec> instead of the smooth in-player seek.
//   * Auto-follow only turns on once the API reports a real currentTime; unknown
//     time never fakes a highlight (DR-0076).
// =============================================================================
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  parseVtt, activeCueIndex, searchCues, formatClock, captionSourceLabel, hasCaptions,
} from '../lib/captions.js';

// --- YouTube IFrame API singleton loader -------------------------------------
// Load https://www.youtube.com/iframe_api at most once; resolve to window.YT.
// Optional by design: a rejection (blocked/offline) is caught by the caller and
// the panel degrades to reload-based seeking.
let _ytApiPromise = null;
function loadYouTubeIframeApi() {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (_ytApiPromise) return _ytApiPromise;
  _ytApiPromise = new Promise((resolve, reject) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof prev === 'function') { try { prev(); } catch { /* ignore */ } }
      resolve(window.YT);
    };
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.async = true;
    tag.onerror = () => reject(new Error('iframe_api blocked'));
    document.head.appendChild(tag);
    // Safety timeout so a silently-blocked script doesn't hang the promise.
    setTimeout(() => { if (!(window.YT && window.YT.Player)) reject(new Error('iframe_api timeout')); }, 8000);
  });
  return _ytApiPromise;
}

// Ensure the embed URL carries enablejsapi=1 (+ origin) so YT.Player can drive it.
function withJsApi(embed) {
  try {
    const u = new URL(embed, typeof window !== 'undefined' ? window.location.origin : 'https://poetech.us');
    u.searchParams.set('enablejsapi', '1');
    if (typeof window !== 'undefined') u.searchParams.set('origin', window.location.origin);
    return u.toString();
  } catch {
    return embed;
  }
}

export default function CaptionedVideo({ embed, title, videoId, captionTrack }) {
  const cues = useMemo(() => (captionTrack && captionTrack.vtt ? parseVtt(captionTrack.vtt) : []), [captionTrack]);
  const captionsAvailable = hasCaptions(cues);

  const [showCaptions, setShowCaptions] = useState(false);
  const [currentTime, setCurrentTime] = useState(-1); // -1 = unknown (no auto-follow yet)
  const [query, setQuery] = useState('');
  const [seekBust, setSeekBust] = useState(0);        // fallback: reload embed at a start time
  const [startAt, setStartAt] = useState(null);

  const iframeId = useMemo(() => `yt-${videoId || Math.abs(hashStr(String(embed || '')))}`, [videoId, embed]);
  const playerRef = useRef(null);
  const pollRef = useRef(null);
  const activeCueRef = useRef(null);
  const panelRef = useRef(null);

  // Attach the YouTube IFrame API player once captions are shown (opt-in, so we
  // never load YouTube's script for a viewer who never opens captions).
  useEffect(() => {
    if (!showCaptions || !captionsAvailable) return undefined;
    let cancelled = false;
    loadYouTubeIframeApi()
      .then((YT) => {
        if (cancelled || !YT || !YT.Player) return;
        playerRef.current = new YT.Player(iframeId, {
          events: {
            onReady: () => startPolling(),
            onStateChange: () => startPolling(),
          },
        });
      })
      .catch(() => { /* API blocked — panel still works via reload seeking */ });

    function startPolling() {
      if (pollRef.current) return;
      pollRef.current = setInterval(() => {
        const p = playerRef.current;
        if (p && typeof p.getCurrentTime === 'function') {
          const t = p.getCurrentTime();
          if (Number.isFinite(t)) setCurrentTime(t);
        }
      }, 300);
    }
    return () => {
      cancelled = true;
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      const p = playerRef.current;
      if (p && typeof p.destroy === 'function') { try { p.destroy(); } catch { /* ignore */ } }
      playerRef.current = null;
      setCurrentTime(-1);
    };
  }, [showCaptions, captionsAvailable, iframeId]);

  const activeIndex = currentTime >= 0 ? activeCueIndex(cues, currentTime) : -1;

  // Auto-scroll the active line into view within the panel (not the page).
  useEffect(() => {
    if (activeIndex < 0 || !activeCueRef.current || !panelRef.current) return;
    const el = activeCueRef.current;
    const panel = panelRef.current;
    const top = el.offsetTop - panel.offsetTop;
    if (top < panel.scrollTop || top > panel.scrollTop + panel.clientHeight - el.clientHeight) {
      panel.scrollTo({ top: top - panel.clientHeight / 2, behavior: 'smooth' });
    }
  }, [activeIndex]);

  // Seek: smooth in-player when the API is live, else reload the embed at &start=.
  function seekTo(sec) {
    const p = playerRef.current;
    if (p && typeof p.seekTo === 'function') {
      p.seekTo(Math.max(0, Math.floor(sec)), true);
      if (typeof p.playVideo === 'function') p.playVideo();
    } else {
      setStartAt(Math.max(0, Math.floor(sec)));
      setSeekBust((n) => n + 1);
    }
  }

  const hits = useMemo(() => searchCues(cues, query), [cues, query]);

  // Build the iframe src: enablejsapi when captions are on; &start on fallback seek.
  const src = useMemo(() => {
    let base = showCaptions && captionsAvailable ? withJsApi(embed) : embed;
    if (startAt != null && !(playerRef.current && playerRef.current.seekTo)) {
      try {
        const u = new URL(base, typeof window !== 'undefined' ? window.location.origin : 'https://poetech.us');
        u.searchParams.set('start', String(startAt));
        u.searchParams.set('autoplay', '1');
        base = u.toString();
      } catch { /* keep base */ }
    }
    return base;
    // seekBust forces a remount of the iframe for the fallback-seek path.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [embed, showCaptions, captionsAvailable, startAt, seekBust]);

  return (
    <div className="mt-2">
      <div className="aspect-video">
        <iframe
          id={iframeId}
          key={`${iframeId}-${seekBust}`}
          src={src}
          title={title}
          className="w-full h-full border border-[#1A1815]"
          allow="encrypted-media; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>

      {captionsAvailable && (
        <div className="mt-1">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowCaptions((v) => !v)}
              aria-pressed={showCaptions}
              className="text-[0.7rem] px-2 py-0.5 border border-[#1A1815] rounded-sm font-semibold"
              style={{
                fontFamily: '"Fraunces", serif',
                color: showCaptions ? '#F4EDE2' : '#1A1815',
                background: showCaptions ? '#1A1815' : 'transparent',
              }}
            >
              {showCaptions ? '✓ Captions on' : 'CC  Captions & transcript'}
            </button>
            <span className="text-[0.625rem] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
              {cues.length} lines · {captionSourceLabel(captionTrack.source)}
            </span>
          </div>

          {showCaptions && (
            <div className="mt-1 border border-[#C9BBA4] rounded-sm bg-[#F4EDE2]">
              <div className="p-2 border-b border-[#C9BBA4]">
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search this message…"
                  aria-label="Search the message captions"
                  className="w-full text-[0.75rem] px-2 py-1 border border-[#C9BBA4] rounded-sm bg-white text-[#1A1815]"
                  style={{ fontFamily: '"Fraunces", serif' }}
                />
                {query.trim().length >= 2 && (
                  <div className="text-[0.625rem] text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
                    {hits.length} {hits.length === 1 ? 'match' : 'matches'} — tap a line to jump
                  </div>
                )}
              </div>

              <div
                ref={panelRef}
                className="max-h-64 overflow-y-auto p-2 space-y-0.5"
                role="log"
                aria-label="Message captions"
              >
                {(query.trim().length >= 2 ? hits.map((h) => h.index) : cues.map((_, i) => i)).map((i) => {
                  const cue = cues[i];
                  if (!cue) return null;
                  const isActive = i === activeIndex;
                  return (
                    <button
                      type="button"
                      key={i}
                      ref={isActive ? activeCueRef : null}
                      onClick={() => seekTo(cue.start)}
                      className="w-full text-left flex gap-2 px-1.5 py-1 rounded-sm"
                      style={{
                        fontFamily: '"Fraunces", serif',
                        fontSize: '0.8125rem',
                        lineHeight: 1.4,
                        color: isActive ? '#1A1815' : '#3A3833',
                        background: isActive ? '#EAD9B8' : 'transparent',
                        fontWeight: isActive ? 600 : 400,
                      }}
                      aria-current={isActive ? 'true' : undefined}
                    >
                      <span className="tabular-nums text-[0.6875rem] text-[#8A6D3B] shrink-0 pt-0.5" style={{ minWidth: '2.75rem' }}>
                        {formatClock(cue.start)}
                      </span>
                      <span>{cue.text}</span>
                    </button>
                  );
                })}
              </div>

              <div className="px-2 py-1 border-t border-[#C9BBA4] text-[0.625rem] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
                Captions: {captionSourceLabel(captionTrack.source)} · sovereign, served by PoeTech
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Small deterministic string hash for a stable iframe id when there's no videoId.
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0; }
  return h;
}
