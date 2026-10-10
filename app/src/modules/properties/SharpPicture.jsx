// =============================================================================
// SharpPicture — a property picture in a grid or on a door card, as sharp as
// the public listing (DR-0931)
// =============================================================================
// Darrell, 2026-10-10: "Pictures inside PoeTech App for apartment 2 are worse
// image quality than the advertising Pictures without an account... why?!!!!
// Fix it!!!!"
//
// WHY. The public listing draws each picture's full image (storage_path). The
// grids inside the app draw the THUMBNAIL (0185: the list never carries the
// bytes) — 320 px wide at 60% JPEG — stretched across a tile that, on a phone
// at 3x, needs ~900 real pixels. That is the blur.
//
// THE FIX keeps the fast list and gains the sharpness: the thumbnail is drawn
// at once; when the tile is actually on screen AND wider (in real pixels) than
// its thumbnail, the full image is fetched by id and swapped in. Full images
// are cached for the session and fetched a few at a time, so a fifty-picture
// walk-through still opens on fifty thumbnails and sharpens what is seen.
// =============================================================================
import React, { useEffect, useRef, useState } from 'react';
import { listImage } from './photo-order.js';

// One cache and one small queue for the whole app: a picture sharpened on the
// Doors board is already sharp in the Pictures tab and the viewer.
const cache = new Map();      // id -> full image (data URL) | null (no bytes)
const inflight = new Map();   // id -> Promise
const waiting = [];
let running = 0;
const MAX_AT_ONCE = 3;

function pump() {
  while (running < MAX_AT_ONCE && waiting.length) {
    const job = waiting.shift();
    running += 1;
    Promise.resolve()
      .then(job.run)
      .catch(() => null)
      .then((v) => { running -= 1; job.done(v); pump(); });
  }
}

/** The full image for a picture id, fetched once, a few at a time. */
export function sharpenOnce(id, loadImage) {
  if (cache.has(id)) return Promise.resolve(cache.get(id));
  if (inflight.has(id)) return inflight.get(id);
  const p = new Promise((resolve) => {
    waiting.push({
      run: () => loadImage(id),
      done: (v) => { const full = typeof v === 'string' && v ? v : null; cache.set(id, full); inflight.delete(id); resolve(full); },
    });
    pump();
  });
  inflight.set(id, p);
  return p;
}

/** The sharpest image already known for a picture, without fetching. */
export function sharpestKnown(photo) {
  if (!photo) return '';
  return cache.get(photo.id) || photo.storage_path || listImage(photo);
}

/** Test seam: forget what was fetched. */
export function _forgetSharpened() { cache.clear(); inflight.clear(); waiting.length = 0; running = 0; }

/** Does this tile need more pixels than the picture it is drawing holds? */
export function needsSharper(renderedCssWidth, dpr = 1, naturalWidth = 0) {
  const need = Math.round((Number(renderedCssWidth) || 0) * (Number(dpr) || 1));
  const have = Number(naturalWidth) || 0;
  // Unknown (not measured yet, or a test with no layout) never reads as
  // "sharp enough".
  if (need <= 0 || have <= 0) return true;
  return need > have;
}

export default function SharpPicture({ photo, loadImage = null, alt = '', className = '' }) {
  const ref = useRef(null);
  const [src, setSrc] = useState(() => sharpestKnown(photo));
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const id = photo ? photo.id : null;
  const hasFull = !!(photo && photo.storage_path);

  useEffect(() => { setSrc(sharpestKnown(photo)); setLoaded(false); }, [id, photo && photo.thumb_path, hasFull]); // eslint-disable-line react-hooks/exhaustive-deps

  // On screen yet? (Everything counts as on screen where there is no observer.)
  useEffect(() => {
    const el = ref.current;
    if (typeof IntersectionObserver === 'undefined' || !el) { setVisible(true); return undefined; }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { io.disconnect(); setVisible(true); }
    }, { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, [id]);

  // On screen and drawn: if the screen needs more pixels than it holds,
  // fetch the full image once and swap it in.
  useEffect(() => {
    if (!id || hasFull || !visible || !loaded || typeof loadImage !== 'function' || cache.get(id)) return undefined;
    const el = ref.current;
    const w = el && el.getBoundingClientRect ? el.getBoundingClientRect().width : 0;
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    if (!needsSharper(w, dpr, el ? el.naturalWidth : 0)) return undefined;
    let live = true;
    sharpenOnce(id, loadImage).then((full) => { if (live && full) setSrc(full); });
    return () => { live = false; };
  }, [id, hasFull, visible, loaded, loadImage]);

  if (!src) return null;
  return (
    <img ref={ref} src={src} alt={alt} loading="lazy" decoding="async" className={className}
      onLoad={() => setLoaded(true)} data-testid="sharp-picture" />
  );
}
