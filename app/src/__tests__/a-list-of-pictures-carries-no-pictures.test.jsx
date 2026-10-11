// =============================================================================
// A LIST OF PICTURES CARRIES NO PICTURES (DR-0955)
// =============================================================================
// Darrell, 2026-10-11: "Are images stored on/in the nas?" — they are, but
// INSIDE the Postgres row as a base64 data URL rather than as files. Then,
// when I said the thumbnails in the list were the weight that froze the tab:
// "Can we fix it?!!!!!"
//
// WHAT WAS MEASURED, encoding photographic content at the app's own thumbnail
// settings (640 px, 75% JPEG): 47 KB of base64 for a smooth interior, 60 KB
// for an ordinary detailed one. loadAllPhotos reads every unarchived picture
// across every door on every boot of the tab — 67 rows on his board today,
// ~3.6 MB in one answer, growing by ~55 KB with every photograph he takes.
// One door's gallery is the same shape: Bed A's 39 pictures, ~2.1 MB.
//
// 0185 took storage_path out of the lists and put thumb_path in, and
// property-photos-list-carries-no-bytes PINNED that trade — `toContain
// ('thumb_path')` — so a gate was holding half a fix in place while the tab
// froze. This suite covers the behaviour the column change needs to be real:
// a tile that asks for its own thumbnail, falls through to the full image when
// no thumbnail exists, and HOLDS ITS PLACE while it waits.
//
// PROVEN-TO-CATCH (DR-0076 section 3), each at the source of a distinct defect:
//   • restoring `if (!src) return null` → "the waiting tile" cases fail, because
//     the observed element never exists and nothing is ever asked for;
//   • dropping the no-thumbnail fall-through → "a row from before 0185" fails;
//   • letting the thumb fetch run before the tile is on screen → "nothing is
//     asked for off screen" fails.
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import SharpPicture, { thumbOnce, sharpestKnown, _forgetSharpened } from '../modules/properties/SharpPicture.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const THUMB = 'data:image/jpeg;base64,THUMBNAIL';
const FULL = 'data:image/jpeg;base64,FULLIMAGEFULLIMAGE';

let container; let root;
let observed;      // every element an observer was put on
let fireVisible;   // make everything observed intersect

/** A controllable IntersectionObserver: nothing is on screen until told. */
function installObserver() {
  observed = [];
  const live = [];
  globalThis.IntersectionObserver = class {
    constructor(cb) { this.cb = cb; live.push(this); }
    observe(el) { observed.push(el); this.el = el; }
    disconnect() { this.dead = true; }
  };
  fireVisible = async () => {
    for (const io of live.slice()) {
      if (!io.dead && io.el) await act(async () => { io.cb([{ isIntersecting: true, target: io.el }]); });
    }
    await flush();
  };
}

async function flush() { for (let i = 0; i < 8; i += 1) await act(async () => { await Promise.resolve(); }); }

/** A gallery row exactly as the list now delivers it: metadata, no bytes. */
const listRow = (id = 'p1') => ({ id, kind: 'listing', caption: 'the kitchen' });

async function mount(props) {
  container = document.createElement('div'); document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(SharpPicture, { alt: 'Kitchen', className: 'aspect-square w-full', ...props }));
  });
  await flush();
}

beforeEach(() => { installObserver(); });
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
  delete globalThis.IntersectionObserver;
  _forgetSharpened();
});

describe('a tile that was handed no picture', () => {
  it('HOLDS ITS PLACE instead of vanishing, and is the element the observer watches', async () => {
    await mount({ photo: listRow(), loadThumb: async () => THUMB });
    const box = container.querySelector('[data-testid="sharp-picture-waiting"]');
    expect(box).toBeTruthy();
    expect(container.querySelector('img')).toBeNull();
    // Same classes, so the grid does not reflow under his thumb when the
    // picture lands.
    expect(box.className).toContain('aspect-square');
    expect(box.className).toContain('w-full');
    // And it is what the observer was given — the whole fetch depends on this.
    expect(observed).toContain(box);
    // No text in it, so there is nothing a reader can fail to read; the
    // screen reader is told it is a picture on its way.
    expect(box.textContent).toBe('');
    expect(box.getAttribute('aria-label')).toBe('Kitchen — loading');
  });

  it('asks for NOTHING while it is off screen', async () => {
    const asked = [];
    await mount({ photo: listRow(), loadThumb: async (id) => { asked.push(id); return THUMB; } });
    expect(asked).toEqual([]);
    expect(container.querySelector('[data-testid="sharp-picture-waiting"]')).toBeTruthy();
  });

  it('fetches its own thumbnail once it comes into view, and draws it', async () => {
    const asked = [];
    await mount({ photo: listRow(), loadThumb: async (id) => { asked.push(id); return THUMB; } });
    await fireVisible();
    expect(asked).toEqual(['p1']);
    const img = container.querySelector('img');
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe(THUMB);
    expect(container.querySelector('[data-testid="sharp-picture-waiting"]')).toBeNull();
  });

  it('a row from BEFORE 0185 — no thumbnail at all — falls through to its full image', async () => {
    // This is the work hydrateLegacyImages used to do for the whole list at
    // boot, now done by the one tile that needs it. A grey box forever is not
    // an answer.
    const asked = [];
    await mount({
      photo: listRow('old'),
      loadThumb: async (id) => { asked.push(`thumb:${id}`); return null; },
      loadImage: async (id) => { asked.push(`full:${id}`); return FULL; },
    });
    await fireVisible();
    expect(asked).toEqual(['thumb:old', 'full:old']);
    expect(container.querySelector('img').getAttribute('src')).toBe(FULL);
  });

  it('stays a waiting box, never a broken image, when neither read answers', async () => {
    // The honest end state. It does not invent a source and it does not claim
    // the picture is gone (DR-0946) — it is still waiting, and says so.
    await mount({
      photo: listRow('gone'),
      loadThumb: async () => null,
      loadImage: async () => null,
    });
    await fireVisible();
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('[data-testid="sharp-picture-waiting"]')).toBeTruthy();
  });
});

describe('a tile that already has bytes', () => {
  it('a picture just uploaded draws at once, with no fetch — the row carries its own thumbnail', async () => {
    const asked = [];
    await mount({
      photo: { ...listRow(), thumb_path: THUMB },
      loadThumb: async (id) => { asked.push(id); return THUMB; },
    });
    expect(container.querySelector('img').getAttribute('src')).toBe(THUMB);
    await fireVisible();
    expect(asked).toEqual([]);
  });
});

describe('the thumbnail road is the full-image road, at a smaller size', () => {
  it('fetches one thumbnail once for the whole app, however many tiles ask', async () => {
    let n = 0;
    const load = async () => { n += 1; return THUMB; };
    await Promise.all([thumbOnce('p9', load), thumbOnce('p9', load), thumbOnce('p9', load)]);
    expect(n).toBe(1);
  });

  it('never more than three in flight at once, thumbnails included', async () => {
    let now = 0; let peak = 0;
    const release = [];
    const load = () => new Promise((resolve) => { now += 1; peak = Math.max(peak, now); release.push(() => { now -= 1; resolve(THUMB); }); });
    const all = ['a', 'b', 'c', 'd', 'e'].map((id) => thumbOnce(id, load));
    await flush();
    expect(peak).toBe(3);
    while (release.length) { release.shift()(); await flush(); }
    await Promise.all(all);
    expect(peak).toBe(3);
  });

  it('a fetched thumbnail becomes what the viewer opens with, rather than nothing', async () => {
    // sharpestKnown is what the lightbox draws first. Before this, a list row
    // with no bytes gave it '' and the viewer opened blank.
    expect(sharpestKnown(listRow('v1'))).toBe('');
    await thumbOnce('v1', async () => THUMB);
    expect(sharpestKnown(listRow('v1'))).toBe(THUMB);
  });

  it('a row that has no thumbnail is remembered as having none, and not asked twice', async () => {
    let n = 0;
    const load = async () => { n += 1; return null; };
    await thumbOnce('old', load);
    await thumbOnce('old', load);
    expect(n).toBe(1);
  });
});
