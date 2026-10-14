// =============================================================================
// The rest of the apartment (DR-0963)
// =============================================================================
// Darrell, 2026-10-11, standing on "805 North Prospect Avenue Room 1 - Bed B"
// at "805 North Prospect Avenue Apt 4, Apt 4, Champaign, Illinois", reading
// "no pictures" and "PICTURES (0) — No pictures on this property yet":
//
//   "Same options as the other co-living tenant... pictures are already
//    available for this place apartment 4... remember?"
//   "Where are the images... they should be able to be used here too!!!!!!!"
//
// I had built half of this and called it done. DR-0952 / 0273 taught the
// STRANGER'S road to borrow — `public_vacancy_photos` falls back to a sibling
// listing, so the public card for Bed B already shows the apartment. It never
// touched the LANDLORD'S gallery, which calls `loadDoorPhotos` for one door.
//
// So a stranger could see Apartment 4's kitchen and the man who owns it could
// not. That is the defect these cases pin.
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

const shot = (id, kind, caption) => ({
  id, kind, caption,
  thumb_path: 'data:image/jpeg;base64,AAAA', taken_at: null,
  uploaded_at: '2026-10-10T18:45:00Z', sort_order: 0, archived_at: null, room_id: null,
});

// Bed A's pictures of the shared apartment — the ones already on the NAS.
const APT4 = [shot('a-kitchen', 'listing', 'the kitchen'), shot('a-bath', 'listing', 'the bath'), shot('a-hall', 'move-in-condition', 'the hall')];

let container; let root;
const settle = async (n = 8) => {
  for (let i = 0; i < n; i += 1) await act(async () => { await Promise.resolve(); });
};
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
});

// Bed B exactly as his screenshot shows it: zero pictures of its own.
async function mountBedB(props = {}) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(GalleryTab, {
      door: { id: 'bed-b', instance_id: 'inst-1' },
      doorLabel: '805 North Prospect Avenue Room 1 - Bed B',
      rooms: [], photos: [], canManage: true, canAdd: true,
      sharedPhotos: APT4,
      sharedDoors: [{ id: 'bed-a', slug: 'bed-a', display_name: '805 North Prospect Avenue Room 1 - Bed A' }],
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

describe('a bed in a shared apartment sees the apartment’s pictures', () => {
  it('PROVEN-TO-CATCH: Bed B shows Apartment 4’s pictures although it owns none', async () => {
    await mountBedB();
    // The screen he photographed said PICTURES (0) and stopped there.
    for (const id of ['a-kitchen', 'a-bath', 'a-hall']) {
      expect(at(`gallery-choose-${id}`), `the apartment's ${id} is not on this screen`).toBeTruthy();
    }
    expect(container.textContent).toMatch(/Shared with this apartment \(3\)/);
  });

  it('says WHOSE they are, and that they are not copied', async () => {
    // Folding them into the door's own gallery would tell Bed B it owns
    // pictures it does not — DR-0946's invented fact pointing the other way.
    await mountBedB();
    const note = need('gallery-shared-note').textContent;
    expect(note).toMatch(/These live on 805 North Prospect Avenue Room 1 - Bed A/);
    expect(note).toMatch(/no need to photograph/i);
    // THE WORDING MOVED, THE PROMISE DID NOT (DR-0971). This asserted
    // "stay where they are", which was true about which door owns the rows
    // and false as an invitation: the sentence continued "Tick any of them
    // to use the buttons above", and Darrell read that exactly as it was
    // written -- "Moving them takes them away from the other listing?!!!!
    // We're trying to get co-renters!!!!" The promise being pinned here is
    // that these are NOT COPIED into this door, and the card now says so in
    // words that cannot be read as "move them to advertise this door".
    // DR-0984. Darrell, 2026-10-12, reading the line this used to pin ("never a
    // way to give this door its own"): "This is the opposite of the required
    // specifications... I want to be able to show two different rooms in the
    // same apartment". The promise now: the ORDER and COVER here are this
    // listing's own; the pictures themselves still live on Bed A.
    expect(note).toMatch(/order and the cover here are\s+this listing.s own/i);
    expect(note).toMatch(/changes the picture itself, on both listings/i);
    expect(note).not.toMatch(/never a way to give this door its own/i);
    // And the door's own count is still honestly zero.
    expect(container.textContent).toMatch(/Pictures \(0 of this door · 3 shared with the apartment, below\)/);
  });

  it('PROVEN-TO-CATCH: the ticked apartment pictures can actually be moved', async () => {
    // The half-feature risk: a shared card with no button able to act on it.
    // Bed B owns nothing, so a control bar gated on its OWN count alone would
    // never render and the pictures would be decoration.
    const patches = [];
    await mountBedB({ onPatch: async (id, patch) => { patches.push([id, patch]); return { ok: true }; } });
    await check('gallery-choose-a-hall');
    expect(need('gallery-move-to-listing').textContent).toBe('Move 1 to listing');
    await tap('gallery-move-to-listing');
    expect(patches).toEqual([['a-hall', { kind: 'listing' }]]);
    // The row is patched in place; nothing is re-filed onto Bed B, because
    // that would take the kitchen away from Bed A.
    expect(patches[0][1].rental_ref, 'the picture was moved off the door that owns it').toBeUndefined();
    expect(patches[0][1].rental_id).toBeUndefined();
  });

  it('a whole unit with no siblings shows no shared card at all', async () => {
    await mountBedB({ sharedPhotos: [], sharedDoors: [] });
    expect(container.textContent).not.toMatch(/Shared with this apartment/);
  });

  it('a read that FAILED is not an apartment with no pictures (DR-0946)', async () => {
    await mountBedB({ sharedPhotos: [], sharedDoors: [], sharedUnread: true });
    expect(need('gallery-shared-unreadable').textContent).toMatch(/could not be read/i);
    expect(need('gallery-shared-unreadable').textContent).toMatch(/not the same as there being none/i);
  });

  it('a tenant-side viewer sees no shared card and no controls', async () => {
    // These are the landlord's management rows. A read-only eye on this door
    // has no claim on the door next to it.
    await mountBedB({ canManage: false });
    expect(container.textContent).not.toMatch(/Shared with this apartment/);
    expect(at('gallery-move-to-listing')).toBeFalsy();
  });

  it('"tick all" counts the apartment’s pictures too', async () => {
    const patches = [];
    await mountBedB({ onPatch: async (id, patch) => { patches.push([id, patch]); return { ok: true }; } });
    expect(need('gallery-choose-all').textContent).toBe('Tick all 3 shown');
    await tap('gallery-choose-all');
    expect(need('gallery-chosen-count').textContent).toBe('3 ticked');
  });
});

describe('a door with its OWN pictures keeps them separate from the shared ones', () => {
  async function mountBedA(props = {}) {
    container = document.createElement('div');
    document.body.appendChild(container);
    await act(async () => {
      root = createRoot(container);
      root.render(createElement(GalleryTab, {
        door: { id: 'bed-a', instance_id: 'inst-1' },
        doorLabel: 'Bed A',
        rooms: [], photos: [shot('own-1', 'listing', 'my own room'), shot('own-2', 'move-in-condition', 'my own corner')],
        canManage: true, canAdd: true,
        sharedPhotos: [shot('b-porch', 'listing', 'the porch')],
        sharedDoors: [{ id: 'bed-b', slug: 'bed-b', display_name: 'Bed B' }],
        ...props,
      }));
    });
    await settle();
  }

  it('its own count does not include the shared ones, and the heading says where the rest are (DR-1022)', async () => {
    // Darrell, 2026-10-14, reading "PICTURES (3)" over "Tick all 40 shown":
    // "they got rid of the ones already there... Now it wont show the 40
    // pictures only the 3!!" They were in the shared card below; the heading
    // now says so.
    await mountBedA();
    expect(container.textContent).toMatch(/Pictures \(2 of this door · 1 shared with the apartment, below\)/);
    expect(container.textContent).not.toMatch(/Pictures \(2\)/);
    expect(container.textContent).toMatch(/Shared with this apartment \(1\)/);
  });

  it('a door the apartment lends nothing to keeps the plain count', async () => {
    await mountBedA({ sharedPhotos: [], sharedDoors: [] });
    expect(container.textContent).toMatch(/Pictures \(2\)/);
    expect(container.textContent).not.toMatch(/shared with the apartment, below/);
  });

  it('PROVEN-TO-CATCH: a tick in another KIND tab is still not dragged along', async () => {
    // The shared card is visible beside whichever kind tab is open, so it
    // joins the move. A different kind tab is NOT visible and must not.
    const patches = [];
    await mountBedA({ onPatch: async (id, patch) => { patches.push([id, patch]); return { ok: true }; } });
    await check('gallery-choose-own-2');            // a move-in shot, under "every kind"
    const tabs = [...container.querySelectorAll('[role="tab"]')];
    const listingTab = tabs.find((t) => /^listing/i.test(t.textContent.trim()));
    expect(listingTab, 'no listing tab to switch to').toBeTruthy();
    await act(async () => { listingTab.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    await settle(6);
    await check('gallery-choose-b-porch');          // the shared one, still on screen
    await tap('gallery-move-to-listing');
    expect(patches.map(([id]) => id), 'a picture from a hidden kind tab was moved').toEqual(['b-porch']);
  });
});


// DR-0984: each listing its own cover of the apartment, and every shared
// picture opens large ("the apartment B picture can't be used/clicked and
// enlarged... fix all of it").
describe('Bed B arranges the apartment for its own listing', () => {
  const ROOMS = [
    { ...shot('a-kitchen', 'listing', 'the kitchen'), sort_order: 10 },
    { ...shot('a-living', 'listing', 'the living room'), sort_order: 20 },
    { ...shot('a-bedroom', 'listing', 'the bedroom'), sort_order: 30 },
  ];
  const order = () => [...container.querySelectorAll('[data-testid^="gallery-shared-open-"]')].map((b) => b.getAttribute('data-testid').replace('gallery-shared-open-', ''));

  it('starts in the owning door\'s order, and "Make this listing\'s cover" puts the bedroom first for Bed B only', async () => {
    const saved = [];
    await mountBedB({ sharedPhotos: ROOMS, sharedOrder: {}, onArrangeShared: (patches) => saved.push(patches) });
    expect(order()).toEqual(['a-kitchen', 'a-living', 'a-bedroom']);
    const coverBtn = [...need('gallery-shared-arrange-a-bedroom').querySelectorAll('button')].find((b) => /cover/i.test(b.textContent));
    await act(async () => { coverBtn.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    expect(saved).toHaveLength(1);
    const pos = Object.fromEntries(saved[0].map((x) => [x.id, x.patch.sort_order]));
    // The bedroom is placed ahead of everything else in THIS listing.
    expect(pos['a-bedroom']).toBeLessThan(Math.min(...Object.entries(pos).filter(([k]) => k !== 'a-bedroom').map(([, v]) => v)));
    // What the parent saves comes back as this door's order and is drawn so.
    act(() => root.unmount()); container.remove(); root = null;
    await mountBedB({ sharedPhotos: ROOMS, sharedOrder: pos, onArrangeShared: () => {} });
    expect(order()[0]).toBe('a-bedroom');
    expect(need('gallery-shared-a-bedroom').textContent).toMatch(/This listing.s cover/);
  });

  it('PROVEN-TO-CATCH: a shared picture opens large on tap', async () => {
    await mountBedB({ sharedPhotos: ROOMS, sharedOrder: {}, onArrangeShared: () => {} });
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    await tap('gallery-shared-open-a-living');
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog, 'tapping a shared picture opened nothing').not.toBeNull();
    expect(dialog.textContent).toContain('the living room');
  });

  it('no arrange controls without a way to save them (a tenant, or no handler)', async () => {
    await mountBedB({ sharedPhotos: ROOMS, sharedOrder: {}, onArrangeShared: null });
    expect(at('gallery-shared-arrange-a-bedroom')).toBeNull();
  });
});
