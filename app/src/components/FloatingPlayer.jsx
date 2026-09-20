// =============================================================================
// FloatingPlayer — the popped-out video, mounted in the SHELL, not in a tab
// =============================================================================
// Darrell 2026-09-20: "Going away from the tab should not close the popout
// video player... fix it..." It did close, because the popped-out player was a
// CSS position on a div inside ChurchHome — and ChurchHome unmounts the moment
// you leave the Church tab. See lib/floating-player.js for why a portal would
// not have helped.
//
// This renders beside TTSControl in the app shell, which is mounted for the
// whole session. The iframe here is born once per source and never re-keyed by
// a drag, a dock toggle, or a tab change, so the stream survives all three.
import React, { useEffect, useRef, useState } from 'react';
import { getFloating, subscribeFloating, closeFloating, setFloatingPos } from '../lib/floating-player.js';

// KEEP IT REACHABLE. The version this replaces clamped the drag to the
// viewport, and losing that would have been a regression worth more than the
// bug being fixed: a player dragged off the edge cannot be grabbed back, and on
// a television there is no scrollbar, no window edge and no way to recover it
// short of reloading the page and losing your place in the sermon. 4px of
// margin keeps a grabbable sliver on screen at every edge.
export const EDGE = 4;
export function clampToViewport(pos, size, win) {
  const vw = (win && win.innerWidth) || 0;
  const vh = (win && win.innerHeight) || 0;
  if (!vw || !vh) return pos;
  return {
    x: Math.max(EDGE, Math.min(pos.x, vw - size.width - EDGE)),
    y: Math.max(EDGE, Math.min(pos.y, vh - size.height - EDGE)),
  };
}

export default function FloatingPlayer() {
  const [player, setPlayer] = useState(getFloating);
  useEffect(() => subscribeFloating(setPlayer), []);

  const dragRef = useRef(null);
  const onPointerDown = (e) => {
    const box = e.currentTarget.parentElement;
    if (!box) return;
    const r = box.getBoundingClientRect();
    dragRef.current = { dx: e.clientX - r.left, dy: e.clientY - r.top, w: r.width, h: r.height };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
  };
  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    setFloatingPos(clampToViewport(
      { x: e.clientX - d.dx, y: e.clientY - d.dy },
      { width: d.w, height: d.h },
      typeof window !== 'undefined' ? window : null,
    ));
  };
  const onPointerUp = (e) => {
    dragRef.current = null;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (_) { /* ignore */ }
  };

  if (!player.src) return null;

  return (
    <div
      data-testid="floating-player"
      className="fixed z-[60] w-[46vw] max-w-[300px] bg-[#1A1815] shadow-2xl rounded-md overflow-hidden print:hidden"
      style={player.pos
        ? { left: `${player.pos.x}px`, top: `${player.pos.y}px` }
        : { right: '0.75rem', bottom: '5rem' }}
    >
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="flex items-center justify-between gap-2 px-2 h-7 bg-[#26211d] cursor-move touch-none select-none"
      >
        <span className="text-[0.5625rem] uppercase tracking-wider text-[#CFC9BD] flex items-center gap-1 pointer-events-none" aria-hidden="true">⠿ Drag</span>
        <button
          type="button"
          onClick={closeFloating}
          aria-label="Dock the player back into the page"
          className="text-[0.5625rem] uppercase tracking-wider text-[#EBA77E] hover:text-white font-semibold px-1.5 py-0.5 focus:outline focus:outline-2 focus:outline-white"
        >
          ⤡ Dock
        </button>
      </div>
      <div className="aspect-video">
        {/* Keyed by SOURCE only. A drag, a dock toggle or a tab change must
            never change this key — each would remount the iframe and restart
            the stream, which is the very thing being fixed. */}
        <iframe
          key={player.src}
          src={player.src}
          title={player.title || 'Video player'}
          className="w-full h-full border-0"
          allow="encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      </div>
    </div>
  );
}
