// =============================================================================
// One room, many pictures (DR-0949)
// =============================================================================
// Darrell, 2026-10-10, once the room picker reached the photo editor: twelve
// move-out photographs is twelve times Edit -> pick -> Save — thirty-six taps
// on a phone to say one thing. A move-out set is naturally grouped (six
// bathroom shots, then the kitchen), so the room is exactly the field worth
// setting once for several.
//
// Mounted and clicked, per the standing correction. Nothing here reads source.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('../lib/image.js', () => ({
  compressImageFile: async () => 'data:image/jpeg;base64,AAAA',
  isLikelyImageFile: () => true,
}));

const { GalleryTab } = await import('../modules/properties/DoorTabs.jsx');

const SHOTS = Array.from({ length: 6 }, (_, n) => ({
  id: `p${n}`, kind: 'move-out-condition', caption: `shot ${n}`,
  thumb_path: 'data:image/jpeg;base64,AAAA', taken_at: null,
  uploaded_at: '2026-10-10T18:45:00Z', sort_order: n, archived_at: null, room_id: null,
}));
const ROOMS = [{ id: 'r-bath', name: 'Bathroom', sort_order: 0 }, { id: 'r-bed', name: 'Bedroom', sort_order: 1 }];

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
      doorLabel: '805 North Prospect Apt 2',
      rooms: ROOMS, photos: SHOTS, canManage: true, canAdd: true,
      ...props,
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

describe('filing several pictures to one room', () => {
  it('PROVEN-TO-CATCH: four bathroom shots are filed in one go, not four edits', async () => {
    const patches = [];
    await mountGallery({ onPatch: async (id, patch) => { patches.push([id, patch]); return { ok: true }; } });

    await tap('gallery-choose-several');
    for (const n of [0, 1, 2, 3]) await check(`gallery-choose-p${n}`);
    expect(need('gallery-chosen-count').textContent).toMatch(/4 chosen/);

    await pick('gallery-bulk-room', 'r-bath');
    await tap('gallery-bulk-apply');

    expect(patches.map(([id]) => id)).toEqual(['p0', 'p1', 'p2', 'p3']);
    for (const [, patch] of patches) expect(patch.room_id).toBe('r-bath');
    expect(need('gallery-bulk-said').textContent).toMatch(/4 of 4 filed to Bathroom/);
  });

  it('all-shown chooses the whole filtered set', async () => {
    const patches = [];
    await mountGallery({ onPatch: async (id, patch) => { patches.push([id, patch]); return { ok: true }; } });
    await tap('gallery-choose-several');
    await tap('gallery-choose-all');
    expect(need('gallery-chosen-count').textContent).toMatch(/6 chosen/);
    await pick('gallery-bulk-room', 'r-bed');
    await tap('gallery-bulk-apply');
    expect(patches).toHaveLength(6);
  });

  it('clearing the room back to none is a real answer, not a no-op', async () => {
    const patches = [];
    await mountGallery({ onPatch: async (id, patch) => { patches.push([id, patch]); return { ok: true }; } });
    await tap('gallery-choose-several');
    await check('gallery-choose-p0');
    await tap('gallery-bulk-apply');
    expect(patches[0][1].room_id, 'an empty pick must send null, never an empty string').toBe(null);
    expect(need('gallery-bulk-said').textContent).toMatch(/no specific room/);
  });

  it('the grid is NOT in selection mode until asked — a tap still opens a picture', async () => {
    // A grid always in selection mode makes tapping to LOOK ambiguous, and
    // looking is what the grid is mostly for.
    await mountGallery({});
    expect(at('gallery-choose-p0'), 'checkboxes were on before anyone asked').toBeFalsy();
    await tap('gallery-choose-several');
    expect(at('gallery-choose-p0')).toBeTruthy();
  });

  it('says how many actually saved, not how many were asked', async () => {
    // A count that reports the ask rather than the outcome is the class of
    // lie DR-0907 was written about.
    let n = 0;
    await mountGallery({ onPatch: async () => { n += 1; return n > 2 ? { ok: false, reason: 'write-failed' } : { ok: true }; } });
    await tap('gallery-choose-several');
    for (const i of [0, 1, 2, 3]) await check(`gallery-choose-p${i}`);
    await pick('gallery-bulk-room', 'r-bath');
    await tap('gallery-bulk-apply');
    expect(need('gallery-bulk-said').textContent).toMatch(/2 of 4 filed/);
  });
});
