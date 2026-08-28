// =============================================================================
// The landlord arranges a door's pictures, and picks the cover — Darrell 2026-08-28
// =============================================================================
// "no way to reorder the images? does work..." — the doors board arranges the
// shelf; the pictures on a door had no such control. Same model as showcase.js,
// keyed on property_photos.sort_order, so the FIRST picture is the cover and both
// the gallery and the public listing read the order he set.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { photoOrder, coverPhoto, movePhoto, makeCover, PHOTO_STEP } from '../modules/properties/photo-order.js';

// Anchored to THIS file, not process.cwd(): another test file in the same run
// can chdir, and cwd-relative reads then open the wrong path (they passed alone
// and failed batched). HERE is app/src/__tests__.
const HERE = dirname(fileURLToPath(import.meta.url));

const P = (id, order, extra = {}) => ({ id, sort_order: order, ...extra });
const apply = (photos, patches) => photos.map((p) => {
  const x = patches.find((q) => q.id === p.id);
  return x ? { ...p, ...x.patch } : p;
});
const ids = (photos) => photoOrder(photos).map((p) => p.id);

describe('the gallery order', () => {
  it('shows placed pictures first, in position', () => {
    expect(ids([P('c', 30), P('a', 10), P('b', 20)])).toEqual(['a', 'b', 'c']);
  });

  it('leaves an unarranged gallery in the order it came (newest-first from the loader)', () => {
    expect(ids([P('new1', null), P('new2', null), P('new3', null)])).toEqual(['new1', 'new2', 'new3']);
  });

  it('never lets an unplaced picture jump ahead of a placed one', () => {
    expect(ids([P('fresh', null), P('a', 10), P('b', 20)])).toEqual(['a', 'b', 'fresh']);
  });

  it('is empty-safe and junk-safe', () => {
    for (const bad of [null, undefined, 'x', 0]) expect(() => photoOrder(bad)).not.toThrow();
    expect(photoOrder([])).toEqual([]);
    expect(coverPhoto([])).toBe(null);
    expect(ids([P('a', 'nonsense'), P('b', 10)])).toEqual(['b', 'a']);  // unparseable = unplaced
  });

  it('the cover is the first picture in the arranged order', () => {
    expect(coverPhoto([P('c', 30), P('a', 10), P('b', 20)]).id).toBe('a');
    // Unarranged: the first as given (newest-first from the loader).
    expect(coverPhoto([P('newest', null), P('older', null)]).id).toBe('newest');
  });
});

describe('moving one picture', () => {
  const g = [P('a', 10), P('b', 20), P('c', 30)];

  it('moves earlier and later', () => {
    expect(ids(apply(g, movePhoto(g, 'c', -1).patches))).toEqual(['a', 'c', 'b']);
    expect(ids(apply(g, movePhoto(g, 'a', 1).patches))).toEqual(['b', 'a', 'c']);
  });

  it('writes only the two rows that swapped', () => {
    const { patches } = movePhoto(g, 'c', -1);
    expect(patches).toHaveLength(2);
    expect(patches.map((p) => p.id).sort()).toEqual(['b', 'c']);
  });

  it('refuses to move past either end without erroring', () => {
    expect(movePhoto(g, 'a', -1).patches).toEqual([]);
    expect(movePhoto(g, 'a', -1).reason).toBe('already-at-the-end');
    expect(movePhoto(g, 'c', 1).patches).toEqual([]);
  });

  it('numbers an unarranged gallery on the first move, once', () => {
    const bare = [P('a', null), P('b', null), P('c', null)];
    const { patches, reason } = movePhoto(bare, 'c', -1);
    expect(reason).toBe('numbered-the-gallery');
    expect(ids(apply(bare, patches))).toEqual(['a', 'c', 'b']);
    expect(movePhoto(apply(bare, patches), 'b', -1).patches).toHaveLength(2);
  });

  it('says so when the picture is not in this gallery', () => {
    expect(movePhoto(g, 'nope', -1).reason).toBe('not-in-this-gallery');
  });
});

describe('make cover — one tap to the front', () => {
  it('puts the chosen picture first', () => {
    const g = [P('a', 10), P('b', 20), P('c', 30)];
    expect(ids(apply(g, makeCover(g, 'c').patches))).toEqual(['c', 'a', 'b']);
  });

  it('writes ONE row and nothing else moves', () => {
    const g = [P('a', 10), P('b', 20), P('c', 30)];
    const { patches } = makeCover(g, 'c');
    expect(patches).toHaveLength(1);
    expect(patches[0].id).toBe('c');
    expect(patches[0].patch.sort_order).toBe(10 - PHOTO_STEP);
  });

  it('is a no-op when it is already the cover', () => {
    const g = [P('a', 10), P('b', 20)];
    expect(makeCover(g, 'a').patches).toEqual([]);
    expect(makeCover(g, 'a').reason).toBe('already-cover');
  });

  it('numbers an unarranged gallery with that picture leading', () => {
    const bare = [P('a', null), P('b', null), P('c', null)];
    expect(ids(apply(bare, makeCover(bare, 'c').patches))).toEqual(['c', 'a', 'b']);
  });

  it('stays collision-free after repeated make-cover', () => {
    let g = [P('a', 10), P('b', 20), P('c', 30)];
    for (const id of ['c', 'b', 'a', 'c']) g = apply(g, makeCover(g, id).patches);
    expect(ids(g)[0]).toBe('c');
    const orders = g.map((p) => p.sort_order);
    expect(new Set(orders).size).toBe(orders.length);
  });
});

// =============================================================================
// The capability is actually reachable and persisted — not a pure model alone
// =============================================================================
const read = (f) => readFileSync(join(HERE, '..', f), 'utf8');

describe('the gallery, the loaders, and the database all honour the order', () => {
  it('the gallery renders in arranged order and wires Cover / move controls', () => {
    const s = read('modules/properties/DoorTabs.jsx');
    expect(s).toMatch(/photoOrder\(photos\.filter/);
    expect(s).toMatch(/makeCover\(shown, intent\.cover\)/);
    expect(s).toMatch(/movePhoto\(shown, intent\.move, intent\.dir\)/);
    expect(s).toMatch(/arrange\(\{ cover: p\.id \}\)/);
    // The cover is badged so he can see which one a renter meets first.
    expect(s).toMatch(/>Cover</);
  });

  it('the cover picker honours sort_order, not merely the newest', () => {
    // coverByRental must prefer a placed picture over an unplaced one.
    expect(read('modules/properties/DoorTabs.jsx')).toMatch(/ps !== null && cs === null/);
  });

  it('both photo loaders order by sort_order so a reload cannot un-arrange it', () => {
    const s = read('modules/properties/cloud.js');
    const loadDoor = s.slice(s.indexOf('export async function loadDoorPhotos'), s.indexOf('export async function loadAllPhotos'));
    expect(loadDoor).toMatch(/\.order\('sort_order'/);
    const loadAll = s.slice(s.indexOf('export async function loadAllPhotos'));
    expect(loadAll.slice(0, 600)).toMatch(/sort_order/);
  });

  it('the migration adds the column, grants UPDATE on it, and the public gallery orders by it', () => {
    const m = read('../../infra/supabase/migrations-auto/0161-the-landlord-orders-a-doors-pictures.sql');
    expect(m).toMatch(/ADD COLUMN IF NOT EXISTS sort_order integer/);
    expect(m).toMatch(/GRANT UPDATE \(sort_order\) ON public\.property_photos TO authenticated/);
    expect(m).toMatch(/ORDER BY ph\.sort_order ASC NULLS LAST/);
  });
});
