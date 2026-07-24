// =============================================================================
// Lightbox — full-screen photo viewer: zoom + pan + browse a whole set
// =============================================================================
// ONE lightbox, used everywhere a photo grid lives (Property Photos from Chat,
// the Big Picture / Life Gallery, room galleries, the shared family gallery).
// Click any photo to open it big; move through the set; zoom in like a normal
// photo app. Consolidate-don't-duplicate: a single component so every grid
// feels the same.
//
//   - Browse:  ‹ / › buttons, ArrowLeft / ArrowRight keys, or swipe on touch.
//   - Zoom:    scroll wheel or + / − (desktop), pinch (touch), double-click /
//              double-tap to toggle. Drag to pan once zoomed.
//   - Close:   ×, tap the backdrop, or Esc.
//
// Two call shapes, both supported (backward compatible):
//   <Lightbox src={url} alt="…" onClose={fn} />              // single photo
//   <Lightbox items={[{src,alt,caption,date}]} index={n} onClose={fn} />  // a set
//
// Presentational + self-contained: the photo bytes are whatever src is handed
// in (a data URL or a NAS thumbnail). It NEVER fetches or sends anything.
// UNBREAKABLE: a photo that fails to load shows an honest "couldn't load" tile —
// the overlay still navigates and still closes; a broken image never traps you.
import React, { useState, useEffect, useRef, useCallback } from 'react';

const MIN_SCALE = 1;
const MAX_SCALE = 6;
const SWIPE_PX = 48; // horizontal travel that counts as a next/prev swipe

export default function Lightbox({ items, index = 0, src, alt = 'Photo', onClose }) {
  // Normalize both call shapes to one list. Single-src callers keep working.
  const list = Array.isArray(items) && items.length
    ? items
    : (src ? [{ src, alt }] : []);

  // Clamp into range up front so the very first paint is always a real photo —
  // never a blank frame waiting on an effect (matters for out-of-range callers
  // and server render alike).
  const clampIndex = (i, n) => (n ? Math.min(Math.max(0, i | 0), n - 1) : 0);
  const [cur, setCur] = useState(() => clampIndex(index, list.length));
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [broken, setBroken] = useState(false);
  const drag = useRef(null);
  const pointers = useRef(new Map()); // pointerId -> {x,y} for pinch/swipe
  const pinch = useRef(null);         // {dist, scale} at gesture start
  const swipe = useRef(null);         // {x, y} at single-pointer start

  // Clamp the incoming index into range and reset view when the parent opens a
  // new photo (or a different set). Keyed on index + set size so reopening at a
  // different photo always lands where asked.
  useEffect(() => {
    setCur(clampIndex(index, list.length));
  }, [index, list.length]);

  // Reset zoom/pan/broken whenever the shown photo changes.
  const curSrc = list[cur] ? list[cur].src : null;
  useEffect(() => { setScale(1); setPan({ x: 0, y: 0 }); setBroken(false); }, [cur, curSrc]);

  const go = useCallback((delta) => {
    setCur((c) => {
      const n = list.length;
      if (!n) return 0;
      return Math.min(Math.max(0, c + delta), n - 1);
    });
  }, [list.length]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { onClose && onClose(); return; }
      if (e.key === 'ArrowRight') { go(1); }
      else if (e.key === 'ArrowLeft') { go(-1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, go]);

  if (!list.length || !curSrc) return null;

  const photo = list[cur];
  const hasPrev = cur > 0;
  const hasNext = cur < list.length - 1;
  const multi = list.length > 1;

  const clamp = (s) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));
  const setZoom = (s) => setScale(() => { const ns = clamp(s); if (ns === 1) setPan({ x: 0, y: 0 }); return ns; });
  const zoomBy = (d) => setScale((s) => { const ns = clamp(s + d); if (ns === 1) setPan({ x: 0, y: 0 }); return ns; });
  const toggleZoom = () => setScale((s) => { if (s > 1) { setPan({ x: 0, y: 0 }); return 1; } return 2.5; });
  const onWheel = (e) => { e.preventDefault(); zoomBy(e.deltaY < 0 ? 0.3 : -0.3); };

  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  const onPointerDown = (e) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    if (pts.length === 2) {
      // Two fingers down -> start a pinch from the current distance + scale.
      pinch.current = { dist: dist(pts[0], pts[1]), scale };
      swipe.current = null;
      drag.current = null;
    } else if (pts.length === 1) {
      if (scale > 1) drag.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      else swipe.current = { x: e.clientX, y: e.clientY }; // not zoomed -> candidate swipe
    }
  };

  const onPointerMove = (e) => {
    if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    if (pts.length === 2 && pinch.current) {
      const ratio = dist(pts[0], pts[1]) / (pinch.current.dist || 1);
      setZoom(pinch.current.scale * ratio);
      return;
    }
    if (drag.current) { setPan({ x: e.clientX - drag.current.x, y: e.clientY - drag.current.y }); }
  };

  const onPointerUp = (e) => {
    // Swipe to navigate — only when not zoomed and it was a single-pointer drag.
    if (swipe.current && scale === 1 && pointers.current.size === 1) {
      const dx = e.clientX - swipe.current.x;
      const dy = e.clientY - swipe.current.y;
      if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
    }
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 0) { drag.current = null; swipe.current = null; }
  };

  const stop = (e) => e.stopPropagation();
  // Close only when the backdrop ITSELF is clicked — not when a click bubbles up
  // from the ✕, an arrow, or the controls (which would fire onClose twice).
  const onBackdrop = (e) => { if (e.target === e.currentTarget) onClose && onClose(); };

  return (
    <div role="dialog" aria-modal="true" aria-label={photo.alt || 'Photo viewer'} onClick={onBackdrop}
      className="fixed inset-0 z-[120] bg-black/90 flex items-center justify-center select-none" style={{ touchAction: 'none' }}>

      <button type="button" aria-label="Close" onClick={onClose}
        className="absolute top-2 right-3 text-white/90 hover:text-white text-3xl leading-none z-20 w-11 h-11 min-h-[44px] flex items-center justify-center focus:outline focus:outline-2 focus:outline-white">×</button>

      {multi && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 text-white/80 text-xs z-20" style={{ fontFamily: '"JetBrains Mono", monospace' }} onClick={stop}>
          {cur + 1} / {list.length}
        </div>
      )}

      {multi && hasPrev && (
        <button type="button" aria-label="Previous photo" onClick={(e) => { stop(e); go(-1); }}
          className="absolute left-1 sm:left-3 top-1/2 -translate-y-1/2 z-20 w-12 h-12 min-h-[44px] rounded-full bg-white/15 hover:bg-white/30 text-white text-3xl leading-none flex items-center justify-center focus:outline focus:outline-2 focus:outline-white">‹</button>
      )}
      {multi && hasNext && (
        <button type="button" aria-label="Next photo" onClick={(e) => { stop(e); go(1); }}
          className="absolute right-1 sm:right-3 top-1/2 -translate-y-1/2 z-20 w-12 h-12 min-h-[44px] rounded-full bg-white/15 hover:bg-white/30 text-white text-3xl leading-none flex items-center justify-center focus:outline focus:outline-2 focus:outline-white">›</button>
      )}

      {broken ? (
        <div onClick={stop} className="text-center text-white/80 px-6">
          <div className="text-4xl mb-2" aria-hidden="true">🖼️</div>
          <div className="text-sm" style={{ fontFamily: '"Fraunces", serif' }}>This photo couldn&apos;t be loaded.</div>
          {photo.caption ? <div className="text-xs text-white/60 mt-1">{photo.caption}</div> : null}
        </div>
      ) : (
        <img
          src={curSrc}
          alt={photo.alt || photo.caption || 'Photo'}
          draggable={false}
          onClick={stop}
          onError={() => setBroken(true)}
          onDoubleClick={(e) => { stop(e); toggleZoom(); }}
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onPointerLeave={(e) => { if (pointers.current.size <= 1) onPointerUp(e); }}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transition: (drag.current || pinch.current) ? 'none' : 'transform 0.12s ease-out',
            maxWidth: '96vw', maxHeight: '84vh', objectFit: 'contain',
            cursor: scale > 1 ? 'grab' : 'zoom-in', touchAction: 'none',
          }}
        />
      )}

      {/* Caption / date — scales with the app text size (rem-based). */}
      {(photo.caption || photo.date) && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 max-w-[92vw] text-center z-10 px-3" onClick={stop}>
          {photo.caption && <div className="text-white/90 text-sm" style={{ fontFamily: '"Fraunces", serif' }}>{photo.caption}</div>}
          {photo.date && <div className="text-white/60 text-[0.6875rem] mt-0.5" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{photo.date}</div>}
        </div>
      )}

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20" onClick={stop}>
        <button type="button" aria-label="Zoom out" onClick={() => zoomBy(-0.5)} className="w-11 h-11 min-h-[44px] rounded-full bg-white/15 hover:bg-white/30 text-white text-2xl leading-none focus:outline focus:outline-2 focus:outline-white">−</button>
        <span className="text-white/80 text-xs w-12 text-center" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{Math.round(scale * 100)}%</span>
        <button type="button" aria-label="Zoom in" onClick={() => zoomBy(0.5)} className="w-11 h-11 min-h-[44px] rounded-full bg-white/15 hover:bg-white/30 text-white text-2xl leading-none focus:outline focus:outline-2 focus:outline-white">+</button>
        <a href={curSrc} download onClick={stop} className="ml-3 text-white/70 hover:text-white text-[0.625rem] uppercase tracking-wider focus:outline focus:outline-2 focus:outline-white">⬇ Save</a>
      </div>
    </div>
  );
}
