// =============================================================================
// Move pictures between sections — no re-upload (DR-0951)
// =============================================================================
// Darrell, 2026-10-11, looking at Bed A holding MOVE IN CONDITION (39) and
// LISTING (0), with Bed B showing NO PHOTO on the Doors board:
//   "Need to be able to move pictures to the advertisement sections for
//    advertisement when necessary... make sense?"
//   "I don't want to have to re-upload when we already have them...."
//   "Just move to another section based on the needs of the situations..."
//
// MOVE, not copy. The same rows change kind; nothing is duplicated, no bytes
// are written, and on the throttled Funnel road (#2057) that distinction is
// the difference between instant and another forty-photograph upload.
//
// The bulk bar already existed for the ROOM (DR-0949). This is the same
// selection, the same serial write, the same honest count — one more field.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
vi.mock('../lib/image.js', () => ({
  compressImageFile: async () => 'data:image/jpeg;base64,AAAA',
  isLikelyImageFile: () => true,
}));

const { GalleryTab } = await import('../modules/properties/DoorTabs.jsx');

// His door: 39 move-in-condition, 0 listing.
const SHOTS = Array.from({ length: 6 }, (_, n) => ({
  id: `p${n}`, kind: 'move-in-condition', caption: `shot ${n}`,
  thumb_path: 'data:image/jpeg;base64,AAAA', taken_at: null,
  uploaded_at: '2026-10-11T00:05:00Z', sort_order: n, archived_at: null, room_id: null,
}));

let container; let root;
const settle = async (n = 8) => {
  for (let i = 0; i < n; i += 1) await act(async () => { await Promise.resolve(); });
};
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
});

async function mountGallery(props = {}) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(GalleryTab, {
      door: { id: 'door-1', instance_id: 'inst-1' },
      doorLabel: '805 North Prospect Room 1 - Bed A',
      rooms: [], photos: SHOTS, canManage: true, canAdd: true, ...props,
    }));
  });
  await settle();
}
const at = (id) => container.querySelector(`[data-testid="${id}"]`);
const need = (id) => { const e = at(id); expect(e, `no [data-testid="${id}"]`).toBeTruthy(); return e; };
const tap = async (id) => {
  const el = need(id);
  await act(async () => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
  await settle(6);
};
const check = async (id) => {
  const el = need(id);
  Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'checked').set.call(el, true);
  await act(async () => { el.dispatchEvent(new Event('click', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); });
  await settle(4);
};
const pick = async (id, value) => {
  const el = need(id);
  Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set.call(el, value);
  await act(async () => { el.dispatchEvent(new Event('change', { bubbles: true })); });
  await settle(4);
};

describe('moving pictures to the advertising section', () => {
  it('PROVEN-TO-CATCH: three records become listing shots, in place, with no re-upload', async () => {
    const patches = [];
    await mountGallery({ onPatch: async (id, patch) => { patches.push([id, patch]); return { ok: true }; } });

    await tap('gallery-choose-several');
    for (const n of [0, 1, 2]) await check(`gallery-choose-p${n}`);
    await pick('gallery-bulk-field', 'kind');
    await pick('gallery-bulk-kind', 'listing');
    await tap('gallery-bulk-apply');

    expect(patches.map(([id]) => id)).toEqual(['p0', 'p1', 'p2']);
    for (const [, patch] of patches) {
      expect(patch.kind, 'the kind was not changed').toBe('listing');
      // MOVE, not copy: nothing creates a new row, and storage_path is never
      // touched — 0154 freezes it anyway, so a copy would have to re-upload.
      expect(patch.storage_path, 'the bytes were touched — this must be a move').toBeUndefined();
    }
    expect(need('gallery-bulk-said').textContent).toMatch(/3 of 3 are now listing/);
  });

  it('says plainly that this makes them public, before the button is pressed', async () => {
    await mountGallery({ onPatch: async () => ({ ok: true }) });
    await tap('gallery-choose-several');
    await check('gallery-choose-p0');
    await pick('gallery-bulk-field', 'kind');

    // A record kind is the opening value, so no warning yet (DR-0906).
    expect(at('gallery-bulk-advertising'), 'warned about advertising while a record was chosen').toBeFalsy();

    await pick('gallery-bulk-kind', 'listing');
    expect(need('gallery-bulk-advertising').textContent).toMatch(/only kind a stranger can see/i);
    expect(need('gallery-bulk-advertising').textContent).toMatch(/not copied/i);
  });

  it('moves the other way too — advertising back to a record', async () => {
    const patches = [];
    await mountGallery({
      photos: SHOTS.map((p) => ({ ...p, kind: 'listing' })),
      onPatch: async (id, patch) => { patches.push([id, patch]); return { ok: true }; },
    });
    await tap('gallery-choose-several');
    await check('gallery-choose-p0');
    await pick('gallery-bulk-field', 'kind');
    await pick('gallery-bulk-kind', 'damage');
    await tap('gallery-bulk-apply');
    expect(patches[0][1].kind).toBe('damage');
    expect(at('gallery-bulk-advertising'), 'warned about advertising when moving AWAY from it').toBeFalsy();
  });

  it('setting the room still works — the new field did not replace it', async () => {
    const patches = [];
    await mountGallery({
      rooms: [{ id: 'r-bath', name: 'Bathroom', sort_order: 0 }],
      onPatch: async (id, patch) => { patches.push([id, patch]); return { ok: true }; },
    });
    await tap('gallery-choose-several');
    await check('gallery-choose-p0');
    await pick('gallery-bulk-room', 'r-bath');
    await tap('gallery-bulk-apply');
    expect(patches[0][1].room_id).toBe('r-bath');
    expect(patches[0][1].kind, 'setting the room should not change the kind').toBeUndefined();
  });
});
