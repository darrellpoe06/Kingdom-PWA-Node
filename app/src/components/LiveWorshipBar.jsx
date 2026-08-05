// =============================================================================
// LiveWorshipBar — the app-wide pinned LIVE service player (2026-07-05, Darrell).
// =============================================================================
// THE ASK (Darrell, with mockups): "I want the app to look like this during
// livestreams... not just down." Today the church's live service is embedded
// only inside Church → Worship, so the moment you navigate away it unmounts and
// the stream stops — and outside a service window that buried slot is where the
// "This video is unavailable" dead frame shows. Darrell's mockups pin the LIVE
// service to the TOP of the whole app, playing while he scrolls Church, Eternal
// Algorithms, every tab.
//
// WHAT THIS IS: a single, persistent live player mounted ONCE at the shell level
// (above the view switch), so switching tabs never unmounts the iframe — the
// broadcast keeps playing continuously. It is fixed to the top of the viewport,
// full-width, collapsible to a thin strip, and dismissible for the session.
//
// HONEST BY CONSTRUCTION (Reality-Trace P15 / DR-0076): the bar only appears
// INSIDE a real published service window (lib/church-live.js liveStatus — the
// same no-API-key gate the Church tab uses). It never paints a 24/7 video bar
// and never fabricates a "LIVE" state the client can't truthfully detect — the
// window IS the honest signal, drawn from the church's own real schedule. The
// same lib/resolve-church.js record feeds both this bar and the in-page player,
// so they embed the same channel gated by the same schedule (no drift).
//
// DE-DUP / AUDIO: the live embed autoplays MUTED (the only autoplay browsers
// allow), so navigating in never blasts sound; the viewer unmutes via the
// player's own controls. The Church tab's in-page player requires a click, so
// the two never auto-play sound over each other.
//
// LAYOUT: the bar is `fixed` at top; it publishes its height to the CSS var
// `--lwb-h` on <html>, which the shell root reads as padding-top and the sticky
// header reads as its sticky `top` — so the pinned nav sits just under the bar
// instead of behind it. When the bar is hidden the var is 0 and nothing shifts.
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { liveStatus, worshipPlayerSrc } from '../lib/church-live.js';
import { resolveChurch } from '../lib/resolve-church.js';

const DISMISS_KEY = 'poe.liveWorshipBar.dismissedSession';

// The live broadcast embed with muted autoplay — the only autoplay browsers
// permit, so the pinned player shows the service playing immediately without
// hijacking audio. Returns null when no channel resolves (bar stays hidden).
// 2026-07-28 comprehensive-review fix: this bar was still on the ABANDONED
// /embed/live_stream?channel= endpoint (church-live.js documents it renders
// "unavailable" even while the channel IS live — the 2026-07-19 outage), so it
// broke exactly when it appeared. It now rides worshipPlayerSrc, the same
// proven uploads-playlist embed the Church tab plays.
export function livePlayerSrc(channelId) {
  const base = worshipPlayerSrc(channelId);
  if (!base) return null;
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}autoplay=1&mute=1&playsinline=1&rel=0`;
}

// The display name for the church, matching the Church tab's own rule (The Love
// Corner nickname collapses to the friendly short form).
function churchDisplayName(c) {
  if (c.nickname && /love corner/i.test(c.nickname)) return 'The Love Corner';
  return c.name || 'Church';
}

export function LiveWorshipBar({ church, view, churchView, onOpenChurch, now }) {
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem(DISMISS_KEY) === '1'; } catch (_) { return false; }
  });
  // A slow clock so the bar appears/disappears as service windows open and close
  // without a manual refresh. This is a UI tick that only re-reads a pure
  // time-window function — not the timer-driven automation the three-brakes rule
  // governs (it spawns no work and no compute).
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (now) return undefined; // tests inject a fixed clock; don't tick over it
    const id = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(id);
  }, [now]);

  const barRef = useRef(null);

  const c = resolveChurch(church);
  const channelId = (c.youtubeChannelId || '').trim();
  const onlineServices = (c.services || []).filter((s) => s && s.online !== false);
  const evalNow = now || new Date();
  // `tick` is read only to re-evaluate the window on the interval above.
  void tick;
  const live = liveStatus(onlineServices, evalNow);
  const src = livePlayerSrc(channelId);
  const channelUrl =
    c.media?.youtube || (channelId ? `https://www.youtube.com/channel/${channelId}` : null);

  // Honest gate: show ONLY with a resolvable live source, inside a real service
  // window, and not dismissed for this session.
  const visible = !!src && live.live && !dismissed;

  // Publish the bar's height to `--lwb-h` so the shell offsets the sticky header
  // and pads content beneath the fixed bar. Reset to 0 whenever it is not shown.
  const publishHeight = useCallback(() => {
    if (typeof document === 'undefined') return;
    const h = visible && barRef.current ? barRef.current.offsetHeight : 0;
    document.documentElement.style.setProperty('--lwb-h', `${h}px`);
  }, [visible]);

  useEffect(() => {
    publishHeight();
    if (!visible) return undefined;
    let ro;
    if (typeof ResizeObserver !== 'undefined' && barRef.current) {
      ro = new ResizeObserver(() => publishHeight());
      ro.observe(barRef.current);
    }
    window.addEventListener('resize', publishHeight);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', publishHeight);
    };
  }, [visible, collapsed, publishHeight]);

  // On unmount, never leave a stale offset behind.
  useEffect(() => () => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--lwb-h', '0px');
    }
  }, []);

  if (!visible) return null;

  const name = churchDisplayName(c);
  const onChurchWorship = view === 'church' && (churchView === 'home' || !churchView);

  const dismiss = () => {
    setDismissed(true);
    try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch (_) { /* ignore */ }
  };

  return (
    <div
      ref={barRef}
      role="region"
      aria-label={`Live worship — ${name}`}
      className="ts-chrome-region fixed top-0 left-0 right-0 z-40 bg-[#1A1815] text-white shadow-lg print:hidden"
    >
      {/* Control strip — always visible; carries the honest LIVE label + actions. */}
      <div className="flex items-center gap-2 px-3 sm:px-4 py-2">
        <span className="inline-flex items-center gap-1.5 text-[0.625rem] sm:text-xs uppercase tracking-[0.2em] font-semibold text-white shrink-0">
          <span className="w-2 h-2 rounded-full bg-[#E86A4A] animate-pulse" aria-hidden="true" />
          Live service
        </span>
        <span className="text-[0.625rem] sm:text-xs text-white/70 truncate min-w-0" style={{ fontFamily: '"Fraunces", serif' }}>
          {name}
        </span>
        <div className="ml-auto flex items-center gap-1 shrink-0">
          {!onChurchWorship && onOpenChurch && (
            <button
              type="button"
              onClick={onOpenChurch}
              className="text-[0.625rem] sm:text-xs uppercase tracking-wider px-2.5 py-1.5 border border-white/40 text-white hover:bg-white hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-white"
            >
              Open Church
            </button>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            aria-expanded={!collapsed}
            aria-label={collapsed ? 'Expand the live service player' : 'Collapse the live service player'}
            title={collapsed ? 'Show video' : 'Hide video'}
            className="text-sm px-2.5 py-1.5 border border-white/40 text-white hover:bg-white hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-white min-w-[36px]"
          >
            {collapsed ? '▸' : '▾'}
          </button>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Close the live service player for now"
            title="Close for now"
            className="text-sm px-2.5 py-1.5 border border-white/40 text-white hover:bg-white hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-white min-w-[36px]"
          >
            ×
          </button>
        </div>
      </div>

      {/* The live broadcast — centered 16:9, height-capped so it pins to the top
          without eating the screen. Kept mounted while collapsed (display:none)
          so collapsing never interrupts playback. */}
      <div className={`bg-black flex justify-center ${collapsed ? 'hidden' : ''}`}>
        <div className="relative w-full max-w-4xl" style={{ maxHeight: '45vh', aspectRatio: '16 / 9' }}>
          <iframe
            src={src}
            title={`${name} — live worship service`}
            className="absolute inset-0 w-full h-full"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
        </div>
      </div>

      {/* Watch-out link — an escape hatch to the church's own channel. */}
      {channelUrl && !collapsed && (
        <div className="px-3 sm:px-4 py-1.5 text-right">
          <a
            href={channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[0.625rem] sm:text-xs uppercase tracking-wider text-white/70 underline hover:text-white focus:outline focus:outline-2 focus:outline-white"
          >
            Watch on YouTube
          </a>
        </div>
      )}
    </div>
  );
}

export default LiveWorshipBar;
