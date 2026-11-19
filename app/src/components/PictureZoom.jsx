// =============================================================================
// PictureZoom — the visible Larger / Smaller for a picture or a page (DR-1575)
// =============================================================================
// Three small pieces every picture and document viewer shares:
//   usePictureZoom()  the rung, opened at the reader's own text-size step
//   <ZoomControls>    Smaller · 150% · Larger, 44px, fixed-size chrome
//   <ZoomPane>        a box that scrolls BOTH ways around content drawn at
//                     zoom x its width
// The ladder and its rules are lib/picture-zoom.js. Pinch still works where
// the browser offers it; these buttons are for the reader who does not pinch.
import React, { useCallback, useState } from 'react';
import { useTextSize } from '../lib/text-size.js';
import { ZOOM_STEPS, zoomIndexForTextSize, stepZoomIndex, zoomAt, zoomLabel } from '../lib/picture-zoom.js';

/** { index, zoom, label, larger, smaller, atMin, atMax }: opens at the reader's text-size step. */
export function usePictureZoom() {
  const [size] = useTextSize();
  const [index, setIndex] = useState(() => zoomIndexForTextSize(size));
  const larger = useCallback(() => setIndex((i) => stepZoomIndex(i, 1)), []);
  const smaller = useCallback(() => setIndex((i) => stepZoomIndex(i, -1)), []);
  return { index, zoom: zoomAt(index), label: zoomLabel(index), larger, smaller, atMin: index <= 0, atMax: index >= ZOOM_STEPS.length - 1 };
}

/** Smaller · the size now · Larger. `tone="dark"` for a viewer on a dark backdrop. */
export function ZoomControls({ z, tone = 'light', what = 'picture', className = '' }) {
  // The ring a keyboard or a remote sees: the app's own on a light page, gold on the dark viewer.
  const ring = `focus:outline focus:outline-2 focus:outline-offset-2 ${tone === 'dark' ? 'focus:outline-[#CFA63C]' : 'focus:outline-[#B85838]'}`;
  return (
    <div role="group" aria-label={`Size of the ${what}`} className={`pz-bar pz-bar-${tone} ${className}`} data-testid="picture-zoom" data-zoom={z.label}>
      <button
        type="button"
        className={`pz-btn ${ring}`}
        onClick={z.smaller}
        disabled={z.atMin}
        aria-label={z.atMin ? `Smaller ${what} (already fits the screen)` : `Smaller ${what}`}
        data-testid="picture-zoom-smaller"
      >
        <span aria-hidden="true">−</span> Smaller
      </button>
      <span className="pz-now" aria-live="polite" data-testid="picture-zoom-now">
        {z.label}
      </span>
      <button
        type="button"
        className={`pz-btn ${ring}`}
        onClick={z.larger}
        disabled={z.atMax}
        aria-label={z.atMax ? `Larger ${what} (already the largest)` : `Larger ${what}`}
        data-testid="picture-zoom-larger"
      >
        <span aria-hidden="true">+</span> Larger
      </button>
    </div>
  );
}

/** A two-way scroll box; its content is laid out at zoom x the box's width. */
export function ZoomPane({ zoom = 1, label = 'Picture', className = '', children }) {
  return (
    <div
      className={`pz-pane focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838] ${className}`}
      role="group"
      aria-label={label}
      tabIndex={zoom > 1 ? 0 : undefined}
      data-testid="picture-zoom-pane"
    >
      <div className="pz-sheet" style={{ width: `${Math.round(zoom * 100)}%` }}>
        {children}
      </div>
    </div>
  );
}
