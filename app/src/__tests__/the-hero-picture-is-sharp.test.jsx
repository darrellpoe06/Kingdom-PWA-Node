// =============================================================================
// THE HERO PICTURE IS SHARP (DR-1533)
// =============================================================================
// Darrell, 2026-11-18: "Pictures on the main page is not clear... they are
// pixelated... Poe Properties". The front page's big rotating picture drew the
// 640 px thumbnail across the widest frame in the app. Now the thumbnail shows
// at once and the slide ON SCREEN swaps to its full image; the next slide stays
// a thumbnail, so only one full image is asked for at a time (DR-1016).
// =============================================================================
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const H = vi.hoisted(() => ({ asked: [] }));
vi.mock('../modules/properties/cloud.js', () => ({
  loadVacancyPicture: async (rentalId, id, size) => {
    H.asked.push(`${id}:${size}`);
    return { ok: true, src: `data:image/jpeg;base64,${size.toUpperCase()}-${id}` };
  },
}));
import HeroCarousel from '../components/HeroCarousel.jsx';

const slides = ['a', 'b', 'c'].map((id) => ({ key: `r1:${id}`, rentalId: 'r1', photoId: id, alt: `Room ${id}` }));

let host;
let root;
afterEach(() => {
  act(() => root.unmount());
  document.body.removeChild(host);
  H.asked = [];
});
async function mount() {
  host = document.createElement('div');
  document.body.appendChild(host);
  await act(async () => {
    root = createRoot(host);
    root.render(createElement(HeroCarousel, { slides, autoplay: false }));
  });
  for (let k = 0; k < 6; k += 1)
    await act(async () => {
      await Promise.resolve();
    });
}

describe('the hero picture is sharp', () => {
  it('PROVEN-TO-CATCH: the slide on screen ends on its full image, never the 640 px thumbnail', async () => {
    await mount();
    const img = host.querySelector('[data-testid="hero-slide"]');
    expect(img.getAttribute('src')).toBe('data:image/jpeg;base64,FULL-a');
  });

  it('asks for one full image at a time: the slide shown; the next stays a thumbnail', async () => {
    await mount();
    expect(H.asked).toEqual(['a:thumb', 'b:thumb', 'a:full']);
  });
});
