// =============================================================================
// A LISTING LOADS ONE PICTURE AT A TIME (DR-1016; 0290)
// =============================================================================
// Darrell, 2026-10-14: "It takes about 10 - 20 seconds to populate... can we
// fix that?" The public picture road handed every card every picture's whole
// bytes -- 37 full images for the bed at 805 -- before the first could show.
// Now the list carries no bytes; the card asks for the picture on it (and the
// next), thumbnail first, and for the full image only when one is opened.
// =============================================================================
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const H = vi.hoisted(() => ({ asked: [], list: [] }));
vi.mock('../modules/properties/cloud.js', () => ({
  loadVacancyPhotos: async () => ({ ok: true, photos: H.list }),
  loadVacancyPicture: async (rentalId, id, size) => {
    H.asked.push(`${rentalId}:${id}:${size}`);
    return { ok: true, src: `data:image/jpeg;base64,${size.toUpperCase()}-${id}` };
  },
}));
import { VacancyCard } from '../modules/properties/Storefront.jsx';

const UNIT = { rentalId: 'r1', label: 'Bed in a shared multi-family in Champaign, Illinois', unit: '', where: 'Champaign, Illinois', offering: 'long-term', rent: 750, addressShown: false, area: null, nearby: [] };
const list = (n) => Array.from({ length: n }, (_, k) => ({ id: `p${k}`, caption: `Room ${k + 1}`, taken_at: null, from_sibling: false, has_thumb: k % 2 === 0 }));

let container; let root;
afterEach(() => { if (root) act(() => root.unmount()); if (container) container.remove(); root = container = null; H.asked = []; H.list = []; });
async function mount(el) {
  container = document.createElement('div'); document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(el); });
  for (let i = 0; i < 6; i += 1) await act(async () => { await Promise.resolve(); });
}
async function tap(el) { await act(async () => { el.click(); }); for (let i = 0; i < 6; i += 1) await act(async () => { await Promise.resolve(); }); }
const at = (id) => container.querySelector(`[data-testid="${id}"]`);

describe('a listing loads one picture at a time', () => {
  it('37 pictures: the list carries no bytes, and the card asks for the first (and the next) thumbnail only', async () => {
    H.list = list(37);
    await mount(createElement(VacancyCard, { unit: UNIT }));
    expect(container.textContent).toContain('See all 37 photos — 1 of 37');
    // Two small reads, not thirty-seven big ones.
    expect(H.asked).toEqual(['r1:p0:thumb', 'r1:p1:thumb']);
    expect(container.querySelector('img').getAttribute('src')).toBe('data:image/jpeg;base64,THUMB-p0');
    // The next picture: already here, and the one after it is asked for.
    await tap(at('vacancy-photo-next'));
    expect(container.querySelector('img').getAttribute('src')).toBe('data:image/jpeg;base64,THUMB-p1');
    expect(H.asked).toEqual(['r1:p0:thumb', 'r1:p1:thumb', 'r1:p2:thumb']);
    // Back again: nothing asked twice.
    await tap(at('vacancy-photo-prev'));
    expect(H.asked).toHaveLength(3);
  });

  it('opening a picture large asks for its full image first, then the rest in order; the strip stays on thumbnails', async () => {
    H.list = list(4);
    await mount(createElement(VacancyCard, { unit: UNIT }));
    await tap(at('vacancy-photo-next'));
    expect(H.asked).toEqual(['r1:p0:thumb', 'r1:p1:thumb', 'r1:p2:thumb']);
    await tap(at('vacancy-photo-open'));
    expect(H.asked.slice(3)).toEqual(['r1:p1:full', 'r1:p2:full', 'r1:p3:full', 'r1:p0:full']);
    expect(container.innerHTML).toContain('data:image/jpeg;base64,FULL-p1');
  });

  it('PROVEN-TO-CATCH: a row that already carries its bytes is used as it is and never asked for', async () => {
    H.list = [{ id: 'q1', caption: 'old', storage_path: 'https://example.invalid/old.jpg' }, { id: 'q2', caption: 'new' }];
    await mount(createElement(VacancyCard, { unit: UNIT }));
    expect(container.querySelector('img').getAttribute('src')).toBe('https://example.invalid/old.jpg');
    expect(H.asked).toEqual(['r1:q2:thumb']);
  });

  it('while a picture is on its way the card says so, and a unit with no pictures still says "Photographs coming"', async () => {
    H.list = [];
    await mount(createElement(VacancyCard, { unit: UNIT }));
    expect(container.textContent).toContain('Photographs coming');
    expect(H.asked).toEqual([]);
  });
});
