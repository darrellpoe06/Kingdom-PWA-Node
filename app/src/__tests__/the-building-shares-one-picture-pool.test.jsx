// =============================================================================
// The building shares one picture pool (DR-1290)
// =============================================================================
// Darrell, 2026-10-29, on the Listing pictures of a door at 805:
//
//   "Need to be able to show images of the entry on all doors in 805!!!!! All
//    pictures for any apartment should be available from the same images
//    pool... we can add which apt... however we should be able to use
//    anything it's the same building!!!!! Fix it!!!"
//
// Before this, a door reached only its own APARTMENT's pictures (DR-0963),
// so the entry filed on one apartment's door could never be used on Apt 2.
// These cases pin the read (which doors are the building), the card (every
// picture says which apartment holds it), and the two moves (use, stop).
// The database half -- the trigger that refuses anything outside the
// building, and the open shelf -- is held by 0314's smoke.
//
// Mounted and clicked, per the standing correction.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { loadBuildingPool } from '../modules/properties/cloud.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('../lib/image.js', () => ({
  compressImageFile: async () => 'data:image/jpeg;base64,AAAA',
  isLikelyImageFile: () => true,
}));

const { GalleryTab } = await import('../modules/properties/DoorTabs.jsx');

// His doors, as they are typed: the unit inside the address on one door and
// not another.
const APT2 = { id: 'uuid-apt-2', slug: 'apt-2', display_name: '805 North Prospect Avenue Apt 2', instance_id: 'inst-1', address: '805 North Prospect Avenue', unit: 'Apt 2' };
const BED_A = { id: 'uuid-bed-a', slug: 'bed-a', display_name: '805 North Prospect Avenue Room 1 - Bed A', instance_id: 'inst-1', address: '805 North Prospect Avenue Apt 4', unit: 'Apt 4' };
const BED_B = { id: 'uuid-bed-b', slug: 'bed-b', display_name: '805 North Prospect Avenue Room 1 - Bed B', instance_id: 'inst-1', address: '805 North Prospect Avenue Apt 4', unit: 'Apt 4' };
const APT1 = { id: 'uuid-apt-1', slug: 'apt-1', display_name: '805 North Prospect Avenue Apt 1', instance_id: 'inst-1', address: '805 North Prospect Avenue', unit: 'Apt 1' };
const ELSEWHERE = { id: 'uuid-709', slug: 'c-709', display_name: '709 Commercial St', instance_id: 'inst-1', address: '709 Commercial St', unit: 'Apt 1' };
const OTHER_FAMILY = { id: 'uuid-other', slug: 'other', display_name: 'Someone else', instance_id: 'inst-2', address: '805 North Prospect Avenue', unit: 'Apt 9' };

function stubClient({ me, rentals, photos = [], orderRows = [], failRentals = false }) {
  const asked = { photoRefs: null, orderFor: null };
  const photoBuilder = {
    select: () => photoBuilder,
    in: (col, vals) => { if (col === 'rental_ref') asked.photoRefs = vals; return photoBuilder; },
    is: () => photoBuilder,
    order: () => photoBuilder,
    then: (res) => res({ data: photos.filter((p) => !asked.photoRefs || asked.photoRefs.includes(p.rental_ref)), error: null }),
  };
  const orderBuilder = {
    select: () => orderBuilder,
    eq: (col, val) => { if (col === 'rental_id') asked.orderFor = val; return orderBuilder; },
    then: (res) => res({ data: orderRows, error: null }),
  };
  const client = {
    from: (table) => {
      if (table === 'property_photos') return photoBuilder;
      if (table === 'door_photo_order') return orderBuilder;
      const b = {
        select: () => b,
        eq: () => b,
        single: () => Promise.resolve({ data: me, error: null }),
        then: (res) => res(failRentals ? { data: null, error: { message: 'down' } } : { data: rentals, error: null }),
      };
      return b;
    },
  };
  return { client, asked };
}

const pic = (id, ref, kind, caption) => ({ id, rental_ref: ref, kind, caption, thumb_path: 'data:image/jpeg;base64,AAAA', taken_at: null, uploaded_at: '2026-10-28T12:00:00Z', sort_order: 10, archived_at: null, room_id: null });
const ENTRY = pic('p-entry', 'uuid-bed-a', 'listing', 'Entry 1 - pass the washer & dryer in the hallway');
const KITCHEN = pic('p-kitchen', 'uuid-bed-a', 'listing', 'Kitchen');
const APT1_BATH = pic('p-bath-1', 'uuid-apt-1', 'move-in-condition', 'Apt 1 bathroom');

describe('the pool is every OTHER apartment of the building, never further', () => {
  it('PROVEN-TO-CATCH: Apt 2 reaches Apartment 4’s entry and Apartment 1’s pictures', async () => {
    const { client, asked } = stubClient({ me: APT2, rentals: [APT2, BED_A, BED_B, APT1, ELSEWHERE, OTHER_FAMILY], photos: [ENTRY, KITCHEN, APT1_BATH] });
    const r = await loadBuildingPool('uuid-apt-2', client);
    expect(r.ok).toBe(true);
    expect(new Set(r.doors.map((d) => d.id))).toEqual(new Set(['uuid-bed-a', 'uuid-bed-b', 'uuid-apt-1']));
    expect(asked.photoRefs.sort()).toEqual(['uuid-apt-1', 'uuid-bed-a', 'uuid-bed-b']);
    expect(r.photos.map((p) => p.id).sort()).toEqual(['p-bath-1', 'p-entry', 'p-kitchen']);
  });
  it('another building, another family and the door itself are never in it', async () => {
    const { client, asked } = stubClient({ me: APT2, rentals: [APT2, ELSEWHERE, OTHER_FAMILY] });
    const r = await loadBuildingPool('uuid-apt-2', client);
    expect(r.ok).toBe(true);
    expect(r.doors).toEqual([]);
    expect(asked.photoRefs, 'it asked for pictures with no building door').toBeNull();
  });
  it('its own apartment is not the pool: that stays the automatic shared card', async () => {
    const { client } = stubClient({ me: BED_B, rentals: [BED_A, BED_B, APT2] });
    const r = await loadBuildingPool('uuid-bed-b', client);
    expect(r.doors.map((d) => d.id)).toEqual(['uuid-apt-2']);
  });
  it('a door with no usable address has no building and never asks', async () => {
    const { client, asked } = stubClient({ me: { ...APT2, address: '', unit: '' }, rentals: [APT2, BED_A] });
    const r = await loadBuildingPool('uuid-apt-2', client);
    expect(r).toMatchObject({ ok: true, photos: [], doors: [] });
    expect(asked.photoRefs).toBeNull();
  });
  it('which pictures this door uses comes from its own placements, only for pool pictures', async () => {
    const { client, asked } = stubClient({
      me: APT2, rentals: [APT2, BED_A], photos: [ENTRY, KITCHEN],
      orderRows: [{ photo_id: 'p-entry', position: 40 }, { photo_id: 'not-in-the-pool', position: 50 }],
    });
    const r = await loadBuildingPool('uuid-apt-2', client);
    expect(asked.orderFor).toBe('uuid-apt-2');
    expect(r.placed).toEqual({ 'p-entry': 40 });
  });
  it('a failed read is a failure, never an empty building (DR-0946)', async () => {
    const { client } = stubClient({ me: APT2, rentals: [], failRentals: true });
    const r = await loadBuildingPool('uuid-apt-2', client);
    expect(r.ok).toBe(false);
  });
});

let container; let root;
const settle = async (n = 8) => { for (let i = 0; i < n; i += 1) await act(async () => { await Promise.resolve(); }); };
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
});
async function mountApt2(props = {}) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(GalleryTab, {
      door: { id: 'uuid-apt-2', instance_id: 'inst-1' },
      doorLabel: '805 North Prospect Avenue Apt 2',
      rooms: [], photos: [], canManage: true, canAdd: true,
      buildingPhotos: [ENTRY, KITCHEN, APT1_BATH],
      buildingDoors: [BED_A, APT1],
      ...props,
    }));
  });
  await settle();
}
const at = (id) => container.querySelector(`[data-testid="${id}"]`);
const need = (id) => { const e = at(id); expect(e, `no [data-testid="${id}"]`).toBeTruthy(); return e; };
const buttonIn = (id, label) => Array.from(need(id).querySelectorAll('button')).find((b) => b.textContent.includes(label));

describe('Apt 2’s gallery offers the whole building', () => {
  it('every building picture is offered, each saying which apartment holds it', async () => {
    await mountApt2();
    for (const p of [ENTRY, KITCHEN, APT1_BATH]) need(`building-pool-${p.id}`);
    expect(need('building-pool-from-p-entry').textContent).toContain('from 805 North Prospect Avenue Room 1 - Bed A');
    expect(need('building-pool-from-p-bath-1').textContent).toContain('from 805 North Prospect Avenue Apt 1');
    expect(need('building-pool-note').textContent).toMatch(/shared spaces/);
    expect(need('building-pool-p-bath-1').textContent).toMatch(/never the listing/);
  });
  it('“Use on this door” places it, after what this door already shows', async () => {
    const onPlace = vi.fn(async () => ({ ok: true }));
    await mountApt2({ onPlaceBuilding: onPlace });
    await act(async () => { buttonIn('building-pool-p-entry', 'Use on this door').click(); });
    await settle();
    expect(onPlace).toHaveBeenCalledWith('p-entry', expect.any(Number));
    expect(need('building-pool-said').textContent).toMatch(/on this door now/);
  });
  it('a placed picture joins this door’s shared card, says where it is from, and can be taken off', async () => {
    const onUnplace = vi.fn(async () => ({ ok: true }));
    await mountApt2({ buildingPlaced: { 'p-entry': 20 }, onUnplaceBuilding: onUnplace });
    expect(container.textContent).toMatch(/Shared with this door \(1\)/);
    need('gallery-shared-p-entry');
    expect(need('gallery-shared-building-note').textContent).toMatch(/1 is from elsewhere in the building/);
    expect(need('building-pool-p-entry').dataset.used).toBe('true');
    expect(need('building-pool-in-use').textContent).toBe('1 in use on this door');
    await act(async () => { buttonIn('building-pool-p-entry', 'Stop using').click(); });
    await settle();
    expect(onUnplace).toHaveBeenCalledWith('p-entry');
  });
  it('the apartment’s own shared card is unchanged when nothing from the building is placed', async () => {
    await mountApt2({
      sharedPhotos: [pic('a-kitchen', 'uuid-bed-a', 'listing', 'the kitchen')],
      sharedDoors: [BED_A],
    });
    expect(container.textContent).toMatch(/Shared with this apartment \(1\)/);
    expect(at('gallery-shared-building-note')).toBeNull();
  });
  it('one apartment at a time, and a long pool pages instead of drawing hundreds', async () => {
    const many = Array.from({ length: 30 }, (_, i) => pic(`m-${i}`, 'uuid-apt-1', 'listing', `pic ${i}`));
    await mountApt2({ buildingPhotos: [ENTRY, ...many] });
    expect(container.querySelectorAll('[data-testid^="building-pool-m-"], [data-testid="building-pool-p-entry"]').length).toBe(24);
    const sel = need('building-pool-door');
    await act(async () => {
      Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set.call(sel, 'uuid-bed-a');
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await settle();
    expect(at('building-pool-p-entry')).toBeTruthy();
    expect(at('building-pool-m-0')).toBeNull();
  });
  it('a pool that could not be read says so, never that there are none', async () => {
    await mountApt2({ buildingPhotos: [], buildingUnread: true });
    expect(need('building-pool-unreadable').textContent).toMatch(/not the same as there being none/);
  });
});
