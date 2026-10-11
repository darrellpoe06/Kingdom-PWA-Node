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

// TWO CACHES, ONE QUEUE (DR-0955). A thumbnail and a full image are both "the
// bytes for this id" — fetched the same careful way, at the same small
// concurrency, differing only in size and in which column answers. They are
// cached once for the whole app: a picture fetched on the Doors board is
// already there in the Pictures tab and the viewer.
const cache = new Map();      // id -> full image (data URL) | null (no bytes)
const thumbs = new Map();     // id -> thumbnail (data URL)  | null (none exists)
const inflight = new Map();   // id -> Promise  (full)
const thumbWait = new Map();  // id -> Promise  (thumbnail)
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

/** The bytes for one id from one column, fetched once, a few at a time. */
function fetchOnce(store, pending, id, load) {
  if (store.has(id)) return Promise.resolve(store.get(id));
  if (pending.has(id)) return pending.get(id);
  const p = new Promise((resolve) => {
    waiting.push({
      run: () => load(id),
      done: (v) => {
        const bytes = typeof v === 'string' && v ? v : null;
        store.set(id, bytes); pending.delete(id); resolve(bytes);
      },
    });
    pump();
  });
  pending.set(id, p);
  return p;
}

/** The full image for a picture id, fetched once, a few at a time. */
export function sharpenOnce(id, loadImage) { return fetchOnce(cache, inflight, id, loadImage); }

/** The thumbnail for a picture id, fetched once, a few at a time. */
export function thumbOnce(id, loadThumb) { return fetchOnce(thumbs, thumbWait, id, loadThumb); }

/**
 * The sharpest image already known for a picture, without fetching.
 *
 * The first three are bytes already in hand: a full image fetched earlier,
 * one the caller hydrated onto the row, or one a just-finished upload put
 * there locally (DoorTabs / SystemPictures write thumb_path beside a new
 * picture so it appears without a round trip). A fetched thumbnail comes last
 * because it is the smallest of them, not because it matters least.
 */
export function sharpestKnown(photo) {
  if (!photo) return '';
  return cache.get(photo.id) || photo.storage_path || listImage(photo) || thumbs.get(photo.id) || '';
}

/** Test seam: forget what was fetched. */
export function _forgetSharpened() {
  cache.clear(); inflight.clear(); thumbs.clear(); thumbWait.clear();
  waiting.length = 0; running = 0;
}

/** Does this tile need more pixels than the picture it is drawing holds? */
export function needsSharper(renderedCssWidth, dpr = 1, naturalWidth = 0) {
  const need = Math.round((Number(renderedCssWidth) || 0) * (Number(dpr) || 1));
  const have = Number(naturalWidth) || 0;
  // Unknown (not measured yet, or a test with no layout) never reads as
  // "sharp enough".
  if (need <= 0 || have <= 0) return true;
  return need > have;
}

export default function SharpPicture({ photo, loadImage = null, loadThumb = null, alt = '', className = '' }) {
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

  // ON SCREEN WITH NOTHING TO DRAW: ask for this picture's own thumbnail
  // (DR-0955). The list no longer carries one, because carrying 67 of them at
  // boot is what froze the tab. One tile asking for one thumbnail when it
  // comes into view is ~55 KB on a road that can carry that.
  //
  // A row that has NO thumbnail — written before 0185 added the column —
  // asks for its full image instead. That is what hydrateLegacyImages used to
  // do for the whole list at boot, now done by the one tile that needs it.
  // Either way the tile ends up with a picture; a grey box forever is not an
  // answer.
  useEffect(() => {
    if (!id || src || !visible) return undefined;
    const haveThumb = typeof loadThumb === 'function';
    const haveFull = typeof loadImage === 'function';
    if (!haveThumb && !haveFull) return undefined;
    let live = true;
    const first = haveThumb ? thumbOnce(id, loadThumb) : Promise.resolve(null);
    first
      .then((t) => (t || !haveFull ? t : sharpenOnce(id, loadImage)))
      .then((bytes) => { if (live && bytes) setSrc(bytes); })
      .catch(() => null);
    return () => { live = false; };
  }, [id, src, visible, loadThumb, loadImage]);

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

  // A WAITING TILE HOLDS ITS PLACE (DR-0955). This used to `return null`, which
  // was harmless only while the list already carried a thumbnail. Now that a
  // tile starts with nothing, returning null would be two defects at once:
  // the element the IntersectionObserver watches would never exist, so nothing
  // would ever be asked for and the box would stay empty forever; and the grid
  // would reflow under the reader's thumb as each picture landed.
  //
  // No text, so there is nothing for a reader to fail to read; the box carries
  // the tile's own classes so it occupies exactly the space the picture will.
  if (!src) {
    return (
      <div ref={ref} className={`${className} bg-[#E8E4DC]`} data-testid="sharp-picture-waiting"
        role="img" aria-label={alt ? `${alt} — loading` : 'Picture loading'} />
    );
  }
  return (
    <img ref={ref} src={src} alt={alt} loading="lazy" decoding="async" className={className}
      onLoad={() => setLoaded(true)} data-testid="sharp-picture" />
  );
}
