// @vitest-environment jsdom
// =============================================================================
// AN APPLICANT CAN SEE EVERY PHOTO, FULL SCREEN
// =============================================================================
// Darrell, 2026-10-10, on the public Poe Properties listing:
//   "Applications can't review the pictures of the place... just a placeholder
//    for one image... can't click to see all images of the apartment... fix it
//    so they can see what they are going to receive."
//   "Have to push the small circles... image doesn't get bigger... fix it so
//    it's intuitive."
//   "I want it to be able to be full screen photos... functional tool."
//
// WHAT WAS TRUE, MEASURED IN THE SOURCE. VacancyCard rendered:
//   * a plain <img> with no click handler — the picture could not be opened;
//   * `shots.slice(0, 6)` dots — so a door with TEN listing photographs showed
//     six circles and four pictures NO APPLICANT COULD EVER REACH;
//   * each dot a 2.5 x 2.5 (10px) target, where the house minimum is 44px.
//
// And the viewer that answers all three ALREADY EXISTED: components/Lightbox
// — full screen (fixed inset-0), pinch-zoom, pan, swipe, arrow keys, Esc —
// used by the owner-side photo grids and the Life Gallery, and never called
// by the one card a renter actually sees. The capability was built; the
// public surface did not use it. Same shape as the missing Google door.
//
// THIS PINS: every photo reachable, the picture opens full screen, and the
// controls are thumb-sized.
// =============================================================================
import { describe, it, expect, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const HERE = dirname(fileURLToPath(import.meta.url));
// The pins below are about CODE, not prose — the house codeOnly shape, so a
// comment that QUOTES the old defect (this file's own does) cannot keep a
// gate red or, worse, keep it green.
const codeOnly = (src) => String(src).replace(/\/\*[\s\S]*?\*\//g, ' ').split('\n').map((l) => l.replace(/\/\/.*$/, '')).join('\n');
const SRC = codeOnly(readFileSync(join(HERE, '..', 'modules', 'properties', 'Storefront.jsx'), 'utf8'));

// Ten photographs — the real shape of 805 North Prospect Apt 2, which is the
// door whose four unreachable pictures started this.
const TEN = Array.from({ length: 10 }, (_, n) => ({
  id: `p${n}`, storage_path: `https://example.invalid/${n}.jpg`, caption: `Room ${n + 1}`,
}));
const UNIT = { rentalId: 'r1', label: '805 North Prospect Avenue Apt 2', unit: 'Apt 2', where: 'Champaign, Illinois' };

vi.mock('../modules/properties/cloud.js', () => ({
  loadVacancyPhotos: async () => ({ ok: true, photos: TEN }),
}));

let container, root;
afterEach(() => {
  try { act(() => root && root.unmount()); } catch { /* noop */ }
  if (container) container.remove();
  container = null; root = null;
});

async function mountCard() {
  const { VacancyCard } = await import('../modules/properties/Storefront.jsx');
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => { root.render(createElement(VacancyCard, { unit: UNIT })); });
  await act(async () => { await Promise.resolve(); });
  return container;
}
const at = (sel) => document.querySelector(`[data-testid="${sel}"]`);

describe('every photograph is reachable', () => {
  it('PROVEN-TO-CATCH: the set is never capped at six', () => {
    // The literal defect: four of ten pictures were unreachable.
    expect(SRC).not.toContain('shots.slice(0, 6)');
  });

  it('the control says how many there really are, and offers all of them', async () => {
    await mountCard();
    const seeAll = at('vacancy-photo-seeall');
    expect(seeAll, 'no way to reach the whole set').toBeTruthy();
    expect(seeAll.textContent).toContain('See all 10 photos');
    expect(seeAll.textContent).toContain('1 of 10');
  });

  it('next and previous walk the WHOLE set, including the tenth', async () => {
    await mountCard();
    for (let n = 0; n < 9; n += 1) {
      await act(async () => { at('vacancy-photo-next').click(); });
    }
    expect(at('vacancy-photo-seeall').textContent).toContain('10 of 10');
    // and it wraps rather than dead-ending
    await act(async () => { at('vacancy-photo-next').click(); });
    expect(at('vacancy-photo-seeall').textContent).toContain('1 of 10');
    await act(async () => { at('vacancy-photo-prev').click(); });
    expect(at('vacancy-photo-seeall').textContent).toContain('10 of 10');
  });
});

describe('the picture opens full screen', () => {
  it('PROVEN-TO-CATCH: tapping the photo opens the viewer', async () => {
    await mountCard();
    const photo = at('vacancy-photo-open');
    expect(photo, 'the picture itself must be tappable').toBeTruthy();
    expect(photo.getAttribute('aria-label')).toContain('larger');
    await act(async () => { photo.click(); });
    const overlay = document.querySelector('.fixed.inset-0');
    expect(overlay, 'no full-screen viewer opened').toBeTruthy();
  });

  it('"See all" opens the same viewer', async () => {
    await mountCard();
    await act(async () => { at('vacancy-photo-seeall').click(); });
    expect(document.querySelector('.fixed.inset-0')).toBeTruthy();
  });

  it('it is the ONE Lightbox the rest of the app already uses, not a second one', () => {
    expect(SRC).toContain("import Lightbox from '../../components/Lightbox.jsx'");
    const lb = readFileSync(join(HERE, '..', 'components', 'Lightbox.jsx'), 'utf8');
    // full screen, and a real tool: zoom, pan, swipe, keys, Esc.
    expect(lb).toContain('fixed inset-0');
    expect(lb).toMatch(/ArrowRight/);
    expect(lb).toMatch(/Escape/);
  });
});

describe('a thumb can hit the controls', () => {
  it('PROVEN-TO-CATCH: no ten-pixel dots remain; every control is 44px', () => {
    expect(SRC).not.toContain('w-2.5 h-2.5 rounded-full');
    for (const id of ['vacancy-photo-prev', 'vacancy-photo-next']) {
      const re = new RegExp(`data-testid="${id}"[\\s\\S]{0,240}?min-w-\\[44px\\][\\s\\S]{0,80}?min-h-\\[44px\\]`);
      expect(re.test(SRC), `${id} is not a 44px target`).toBe(true);
    }
    expect(SRC).toMatch(/data-testid="vacancy-photo-seeall"[\s\S]{0,240}?min-h-\[44px\]/);
  });
});
