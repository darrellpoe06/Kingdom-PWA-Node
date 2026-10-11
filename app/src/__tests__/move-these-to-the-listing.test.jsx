// =============================================================================
// Move these to the listing (DR-0961)
// =============================================================================
// Darrell, 2026-10-11, looking at a door holding MOVE IN CONDITION (18 of 40)
// with the bulk-move feature already shipped and already on that screen:
//
//   "Still can move multiple pictures to listing!!!!!!!!"
//   "Maybe it should say move to listing... checkmarks!!!!!!! For each photo
//    on any section... make sense... the it has a progress bar to move..."
//
// Three findings in two lines, and all three were mine:
//
//   1. The capability was hidden behind a toggle labelled "Choose several" —
//      the MECHANISM, not the OUTCOME. A person who does not already know the
//      feature exists cannot find it by reading that word.
//   2. The checkmarks only existed after arming that toggle. He wants them on
//      the pictures, in whichever kind tab he happens to be looking at.
//   3. The move itself ran a serial one-write-at-a-time loop with NO sign of
//      life — the exact thing DR-0907 fixed for the upload panel six hundred
//      lines above it ("a button that only greys out is how a person decides
//      it has hung and leaves"), never carried down to here.
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

// A door shaped like the one in his screenshot: a big pile of records and a
// handful of listing shots, so the kind tabs are real.
const SHOTS = [
  ...Array.from({ length: 4 }, (_, n) => ({ id: `in${n}`, kind: 'move-in-condition', caption: `in ${n}` })),
  ...Array.from({ length: 3 }, (_, n) => ({ id: `out${n}`, kind: 'move-out-condition', caption: `out ${n}` })),
  ...Array.from({ length: 2 }, (_, n) => ({ id: `ad${n}`, kind: 'listing', caption: `ad ${n}` })),
].map((p, n) => ({
  ...p,
  thumb_path: 'data:image/jpeg;base64,AAAA', taken_at: null,
  uploaded_at: '2026-10-10T18:45:00Z', sort_order: n, archived_at: null, room_id: null,
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
      doorLabel: '805 North Prospect Apt 2',
      rooms: [], photos: SHOTS, canManage: true, canAdd: true,
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

describe('moving ticked pictures to the listing', () => {
  it('PROVEN-TO-CATCH: the button names the move, and one tap moves every ticked picture', async () => {
    const patches = [];
    await mountGallery({ onPatch: async (id, patch) => { patches.push([id, patch]); return { ok: true }; } });

    // No arming step: tick straight from the grid.
    await check('gallery-choose-in0');
    await check('gallery-choose-in2');

    // It says what it DOES, with the count, not "choose several".
    expect(need('gallery-move-to-listing').textContent).toBe('Move 2 to listing');

    await tap('gallery-move-to-listing');

    expect(patches.map(([id]) => id)).toEqual(['in0', 'in2']);
    for (const [, patch] of patches) {
      expect(patch.kind, 'the kind was not changed').toBe('listing');
      // A MOVE, not a copy. 0154 freezes storage_path anyway, so a copy would
      // mean a re-upload — the thing he explicitly does not want to do again.
      expect(patch.storage_path, 'the bytes were touched — this must be a move').toBeUndefined();
    }
    expect(need('gallery-bulk-said').textContent).toMatch(/2 of 2 are now listing/);
  });

  it('the checkmarks are on every picture in EVERY section, not just the first tab', async () => {
    await mountGallery({});
    // Every kind (the default view).
    for (const id of ['in0', 'in1', 'out0', 'ad0']) {
      expect(at(`gallery-choose-${id}`), `no checkmark on ${id} under "every kind"`).toBeTruthy();
    }
    // Switch to a single kind tab — the checkmarks come with it. This is the
    // "for each photo on any section" half of the ask, and the half a
    // mode-gated implementation silently loses when the tab resets.
    await tap('gallery-kind-all');
    const tabs = [...container.querySelectorAll('[role="tab"]')];
    const outTab = tabs.find((t) => /move out condition/i.test(t.textContent));
    expect(outTab, 'no move-out tab to switch to').toBeTruthy();
    await act(async () => { outTab.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    await settle(6);
    for (const id of ['out0', 'out1', 'out2']) {
      expect(at(`gallery-choose-${id}`), `no checkmark on ${id} inside the move-out tab`).toBeTruthy();
    }
  });

  it('a tick in one section does not drag pictures from another along with it', async () => {
    // The move reads the ticked set against what is SHOWN. Without that, a
    // tick left behind in another tab would quietly move a picture he is not
    // even looking at — the worst possible version of this feature, because
    // the one it moves is public afterwards.
    const patches = [];
    await mountGallery({ onPatch: async (id, patch) => { patches.push([id, patch]); return { ok: true }; } });
    await check('gallery-choose-in0');
    const tabs = [...container.querySelectorAll('[role="tab"]')];
    const outTab = tabs.find((t) => /move out condition/i.test(t.textContent));
    await act(async () => { outTab.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    await settle(6);
    await check('gallery-choose-out1');
    await tap('gallery-move-to-listing');
    expect(patches.map(([id]) => id), 'a picture from another tab was moved').toEqual(['out1']);
  });

  it('PROVEN-TO-CATCH: a progress bar counts the real writes while they happen', async () => {
    // The bar must be driven by the loop's own counter, not a guess. Each
    // write is held open until the test releases it, and the bar is read in
    // between — so a bar that merely appears and fills instantly fails here.
    const gate = [];
    await mountGallery({
      onPatch: () => new Promise((resolve) => { gate.push(() => resolve({ ok: true })); }),
    });
    await check('gallery-choose-in0');
    await check('gallery-choose-in1');
    await check('gallery-choose-in2');

    await act(async () => { need('gallery-move-to-listing').dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    await settle(2);

    const bar = () => need('gallery-move-progress').querySelector('[role="progressbar"]');
    expect(bar().getAttribute('aria-valuemax'), 'the bar does not know how many there are').toBe('3');
    expect(bar().getAttribute('aria-valuenow')).toBe('0');

    await act(async () => { gate[0](); await Promise.resolve(); });
    await settle(3);
    expect(bar().getAttribute('aria-valuenow'), 'the bar did not advance after a real write landed').toBe('1');
    expect(need('gallery-move-to-listing').textContent).toMatch(/Moving 1 of 3/);

    await act(async () => { gate[1](); await Promise.resolve(); });
    await settle(3);
    expect(bar().getAttribute('aria-valuenow')).toBe('2');

    await act(async () => { gate[2](); await Promise.resolve(); });
    await settle(4);
    // Done: the bar goes, and the sentence that replaces it is the count that
    // actually SAVED (DR-0907), not the count that was asked for.
    expect(at('gallery-move-progress'), 'the bar stayed up after the move finished').toBeFalsy();
    expect(need('gallery-bulk-said').textContent).toMatch(/3 of 3 are now listing/);
  });

  it('says how many actually saved, not how many were asked', async () => {
    let n = 0;
    await mountGallery({
      onPatch: async () => { n += 1; return n === 2 ? { ok: false, reason: 'nope' } : { ok: true }; },
    });
    await check('gallery-choose-in0');
    await check('gallery-choose-in1');
    await check('gallery-choose-in2');
    await tap('gallery-move-to-listing');
    expect(need('gallery-bulk-said').textContent).toMatch(/2 of 3 are now listing/);
  });

  it('says plainly, before the tap, that this makes them public', async () => {
    await mountGallery({});
    expect(at('gallery-move-to-listing-warning'), 'warned before anything was ticked').toBeFalsy();
    await check('gallery-choose-in0');
    const w = need('gallery-move-to-listing-warning').textContent;
    expect(w).toMatch(/only kind a stranger can see/i);
    expect(w).toMatch(/not copied/i);
  });

  it('a tenant-side viewer gets no checkmarks at all', async () => {
    // The move is a management action. Read-only eyes never get the control,
    // and the database is the real wall underneath (0154 / DR-0060).
    await mountGallery({ canManage: false });
    expect(at('gallery-choose-in0'), 'a viewer was offered the move control').toBeFalsy();
    expect(at('gallery-move-to-listing')).toBeFalsy();
  });
});
