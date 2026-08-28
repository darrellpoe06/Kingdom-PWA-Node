// =============================================================================
// The landlord arranges his own shelf — Darrell, 2026-08-28
// =============================================================================
// "Users should be able move the squares to fit whatever Apt or home to
// showcase those at the time because of the turnover of that property so people
// can see it first."
// =============================================================================
import { describe, it, expect } from 'vitest';
import { shelfOrder, moveDoor, showFirst, clearArrangement, STEP } from '../modules/properties/showcase.js';

const D = (id, order) => ({ id, showcase_order: order });
const apply = (rentals, patches) => rentals.map((r) => {
  const p = patches.find((x) => x.id === r.id);
  return p ? { ...r, ...p.patch } : r;
});
const ids = (rentals) => shelfOrder(rentals).map((r) => r.id);

describe('the shelf order', () => {
  it('shows placed doors first, in position', () => {
    expect(ids([D('c', 30), D('a', 10), D('b', 20)])).toEqual(['a', 'b', 'c']);
  });

  it('never lets an unplaced door jump the queue', () => {
    // Adding a property must not rearrange what he already arranged.
    expect(ids([D('new', null), D('a', 10), D('b', 20)])).toEqual(['a', 'b', 'new']);
  });

  it('keeps an unarranged portfolio exactly as it was', () => {
    const given = [D('x', null), D('y', null), D('z', null)];
    expect(ids(given)).toEqual(['x', 'y', 'z']);
  });

  it('is empty-safe and junk-safe', () => {
    for (const bad of [null, undefined, 'x', 0]) expect(() => shelfOrder(bad)).not.toThrow();
    expect(shelfOrder([])).toEqual([]);
    expect(ids([D('a', 'nonsense'), D('b', 10)])).toEqual(['b', 'a']);  // unparseable = unplaced
  });
});

describe('moving one square', () => {
  const shelf = [D('a', 10), D('b', 20), D('c', 30)];

  it('moves a door toward the front', () => {
    const { patches } = moveDoor(shelf, 'c', -1);
    expect(ids(apply(shelf, patches))).toEqual(['a', 'c', 'b']);
  });

  it('moves a door toward the back', () => {
    const { patches } = moveDoor(shelf, 'a', 1);
    expect(ids(apply(shelf, patches))).toEqual(['b', 'a', 'c']);
  });

  it('writes only the two rows that swapped', () => {
    // A dense rank would rewrite the whole shelf on every nudge — eleven writes
    // for one tap, and eleven chances for a partial failure to scramble it.
    const { patches } = moveDoor(shelf, 'c', -1);
    expect(patches).toHaveLength(2);
    expect(patches.map((p) => p.id).sort()).toEqual(['b', 'c']);
  });

  it('refuses to move past either end, without erroring', () => {
    expect(moveDoor(shelf, 'a', -1).patches).toEqual([]);
    expect(moveDoor(shelf, 'a', -1).reason).toBe('already-at-the-end');
    expect(moveDoor(shelf, 'c', 1).patches).toEqual([]);
  });

  it('numbers an unarranged shelf on the first move, once', () => {
    const bare = [D('a', null), D('b', null), D('c', null)];
    const { patches, reason } = moveDoor(bare, 'c', -1);
    expect(reason).toBe('numbered-the-shelf');
    expect(ids(apply(bare, patches))).toEqual(['a', 'c', 'b']);
    // ...and after that a move is a two-row swap again.
    const arranged = apply(bare, patches);
    expect(moveDoor(arranged, 'b', -1).patches).toHaveLength(2);
  });

  it('says so when the door is not on this shelf', () => {
    expect(moveDoor(shelf, 'nope', -1).reason).toBe('not-on-this-shelf');
  });
});

describe('show first — the turnover case, in one tap', () => {
  it('puts the unit with turnover at the front', () => {
    const shelf = [D('koehn', 10), D('hh', 20), D('apt2', 30)];
    const { patches } = showFirst(shelf, 'apt2');
    expect(ids(apply(shelf, patches))).toEqual(['apt2', 'koehn', 'hh']);
  });

  it('writes ONE row — nothing else on the shelf moves', () => {
    const shelf = [D('a', 10), D('b', 20), D('c', 30)];
    const { patches } = showFirst(shelf, 'c');
    expect(patches).toHaveLength(1);
    expect(patches[0].id).toBe('c');
    expect(patches[0].patch.showcase_order).toBe(10 - STEP);
  });

  it('is a no-op when it is already first', () => {
    const shelf = [D('a', 10), D('b', 20)];
    expect(showFirst(shelf, 'a').patches).toEqual([]);
    expect(showFirst(shelf, 'a').reason).toBe('already-first');
  });

  it('numbers an unarranged shelf with that door leading', () => {
    const bare = [D('a', null), D('b', null), D('c', null)];
    const { patches } = showFirst(bare, 'c');
    expect(ids(apply(bare, patches))).toEqual(['c', 'a', 'b']);
  });

  it('stays correct after many moves to the front', () => {
    // Repeated show-first walks the minimum downward; it must never collide.
    let shelf = [D('a', 10), D('b', 20), D('c', 30)];
    for (const id of ['c', 'b', 'a', 'c']) {
      shelf = apply(shelf, showFirst(shelf, id).patches);
    }
    expect(ids(shelf)[0]).toBe('c');
    const orders = shelf.map((r) => r.showcase_order);
    expect(new Set(orders).size).toBe(orders.length);   // no two doors share a position
  });
});

describe('undoing an arrangement', () => {
  it('returns every placed door to unplaced', () => {
    const shelf = [D('a', 10), D('b', 20), D('c', null)];
    const { patches } = clearArrangement(shelf);
    expect(patches).toHaveLength(2);                      // c was never placed
    expect(apply(shelf, patches).every((r) => r.showcase_order === null)).toBe(true);
  });
});
