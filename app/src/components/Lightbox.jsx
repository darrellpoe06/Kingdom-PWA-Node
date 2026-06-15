// =============================================================================
// Lightbox — full-screen photo viewer with zoom + pan
// =============================================================================
// Click any photo to open it big; zoom and move around like a normal photo app.
//   - Desktop: scroll wheel or +/- to zoom, drag to pan, double-click to toggle.
//   - Touch:   double-tap to zoom, then drag to pan (one finger).
//   - Close:   ×, tap the backdrop, or Esc.
// Self-contained + presentational; the photo bytes are whatever src is handed in
// (a data URL or a NAS thumbnail) — it never fetches or sends anything.
import React, { useState, useEffect, useRef } from 'react';

export default function Lightbox({ src, alt = 'Photo', onClose }) {
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef(null);

  // Reset zoom/pan whenever a different photo opens.
  useEffect(() => { setScale(1); setPan({ x: 0, y: 0 }); }, [src]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose && onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!src) return null;

  const clamp = (s) => Math.min(6, Math.max(1, s));
  const zoomBy = (d) => setScale((s) => { const ns = clamp(s + d); if (ns === 1) setPan({ x: 0, y: 0 }); return ns; });
  const toggleZoom = () => setScale((s) => { if (s > 1) { setPan({ x: 0, y: 0 }); return 1; } return 2.5; });

  const onPointerDown = (e) => { if (scale <= 1) return; drag.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }; };
  const onPointerMove = (e) => { if (!drag.current) return; setPan({ x: e.clientX - drag.current.x, y: e.clientY - drag.current.y }); };
  const endDrag = () => { drag.current = null; };
  const onWheel = (e) => { e.preventDefault(); zoomBy(e.deltaY < 0 ? 0.3 : -0.3); };

  return (
    <div role="dialog" aria-modal="true" onClick={onClose}
      className="fixed inset-0 z-[120] bg-black/90 flex items-center justify-center select-none" style={{ touchAction: 'none' }}>
      <button type="button" aria-label="Close" onClick={onClose}
        className="absolute top-2 right-3 text-white/90 hover:text-white text-3xl leading-none z-10 focus:outline focus:outline-2 focus:outline-white">×</button>
      <img
        src={src}
        alt={alt}
        draggable={false}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => { e.stopPropagation(); toggleZoom(); }}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          transition: drag.current ? 'none' : 'transform 0.12s ease-out',
          maxWidth: '96vw', maxHeight: '88vh', objectFit: 'contain',
          cursor: scale > 1 ? 'grab' : 'zoom-in', touchAction: 'none',
        }}
      />
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10" onClick={(e) => e.stopPropagation()}>
        <button type="button" aria-label="Zoom out" onClick={() => zoomBy(-0.5)} className="w-11 h-11 min-h-[44px] rounded-full bg-white/15 hover:bg-white/30 text-white text-2xl leading-none focus:outline focus:outline-2 focus:outline-white">−</button>
        <span className="text-white/80 text-xs w-12 text-center" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{Math.round(scale * 100)}%</span>
        <button type="button" aria-label="Zoom in" onClick={() => zoomBy(0.5)} className="w-11 h-11 min-h-[44px] rounded-full bg-white/15 hover:bg-white/30 text-white text-2xl leading-none focus:outline focus:outline-2 focus:outline-white">+</button>
        <a href={src} download onClick={(e) => e.stopPropagation()} className="ml-3 text-white/70 hover:text-white text-[10px] uppercase tracking-wider focus:outline focus:outline-2 focus:outline-white">⬇ Save</a>
      </div>
    </div>
  );
}
