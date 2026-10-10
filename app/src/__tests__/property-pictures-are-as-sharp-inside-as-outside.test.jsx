// =============================================================================
// PROPERTY PICTURES ARE AS SHARP INSIDE THE APP AS ON THE PUBLIC LISTING
// (DR-0908)
// =============================================================================
// Darrell, 2026-10-10: "Pictures inside PoeTech App for apartment 2 are worse
// image quality than the advertising Pictures without an account... why?!!!!
// Fix it!!!!" — the listing drew the full image; the app's grids drew the
// 320 px / 60% thumbnail stretched over a phone-width tile.
import { describe, it, expect, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import SharpPicture, { needsSharper, sharpenOnce, sharpestKnown, _forgetSharpened } from '../modules/properties/SharpPicture.jsx';
import { THUMB_MAX_WIDTH, THUMB_QUALITY } from '../modules/properties/DoorTabs.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const THUMB = 'data:image/jpeg;base64,THUMB';
const FULL = 'data:image/jpeg;base64,FULLFULL';
let container; let root;
afterEach(() => { if (root) act(() => root.unmount()); if (container) container.remove(); root = container = null; _forgetSharpened(); });
async function flush() { for (let i = 0; i < 8; i += 1) await act(async () => { await Promise.resolve(); }); }

async function mountTile({ cssWidth, naturalWidth, dpr = 3, loadImage }) {
  Object.defineProperty(window, 'devicePixelRatio', { value: dpr, configurable: true });
  container = document.createElement('div'); document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(createElement(SharpPicture, { photo: { id: 'p1', thumb_path: THUMB }, loadImage, alt: 'Kitchen' })); });
  const img = container.querySelector('img');
  img.getBoundingClientRect = () => ({ width: cssWidth, height: cssWidth });
  Object.defineProperty(img, 'naturalWidth', { value: naturalWidth, configurable: true });
  await act(async () => { img.dispatchEvent(new Event('load')); });
  await flush();
  return container.querySelector('img');
}

describe('why the inside looked worse, and the fix', () => {
  it('PROVEN-TO-CATCH: a 320 px thumbnail on a 300 CSS px tile at 3x needs the full image', () => {
    expect(needsSharper(300, 3, 320)).toBe(true);
    expect(needsSharper(80, 3, 320)).toBe(false);
    expect(needsSharper(0, 3, 320)).toBe(true);   // unmeasured never reads as sharp enough
  });

  it('the phone-width tile swaps the thumbnail for the full image', async () => {
    const asked = [];
    const img = await mountTile({ cssWidth: 300, naturalWidth: 320, loadImage: async (id) => { asked.push(id); return FULL; } });
    expect(asked).toEqual(['p1']);
    expect(img.getAttribute('src')).toBe(FULL);
  });

  it('a small tile the thumbnail already covers fetches nothing', async () => {
    const asked = [];
    const img = await mountTile({ cssWidth: 80, naturalWidth: 640, dpr: 2, loadImage: async (id) => { asked.push(id); return FULL; } });
    expect(asked).toEqual([]);
    expect(img.getAttribute('src')).toBe(THUMB);
  });

  it('a picture is fetched once for the whole app, and the viewer reuses it', async () => {
    let n = 0;
    const load = async () => { n += 1; return FULL; };
    await Promise.all([sharpenOnce('p9', load), sharpenOnce('p9', load), sharpenOnce('p9', load)]);
    expect(n).toBe(1);
    expect(sharpestKnown({ id: 'p9', thumb_path: THUMB })).toBe(FULL);
  });

  it('never more than three full images in flight at once', async () => {
    let now = 0; let peak = 0;
    const release = [];
    const load = () => new Promise((resolve) => { now += 1; peak = Math.max(peak, now); release.push(() => { now -= 1; resolve(FULL); }); });
    const all = ['a', 'b', 'c', 'd', 'e'].map((id) => sharpenOnce(id, load));
    await flush();
    expect(peak).toBe(3);
    while (release.length) { release.shift()(); await flush(); }
    await Promise.all(all);
    expect(peak).toBe(3);
  });

  it('new thumbnails are made sharper: 640 px at 75%', () => {
    expect(THUMB_MAX_WIDTH).toBe(640);
    expect(THUMB_QUALITY).toBe(0.75);
  });
});
