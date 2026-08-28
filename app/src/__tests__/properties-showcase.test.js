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

// =============================================================================
// The controls exist on the board — the gap in my own delivery
// =============================================================================
// I shipped showcase.js, migration 0157 and these tests, told Darrell "you order
// the shelf", and never wired a single button into DoorsBoard. The model was
// right and there was no way to reach it. A capability with no control is not a
// capability, and no test I had written would have noticed.
import { readFileSync as _rf } from 'node:fs';
import { join as _join } from 'node:path';

const board = () => _rf(_join(process.cwd(), 'src/modules/properties/DoorTabs.jsx'), 'utf8');
const appjs = () => _rf(_join(process.cwd(), 'src/modules/properties/PropertiesApp.jsx'), 'utf8');

describe('the landlord can actually reach the arrangement', () => {
  it('sorts the board by his arrangement, not by insertion order', () => {
    expect(board()).toMatch(/shelfOrder\(rentals\)/);
  });

  it('renders move controls from ONE component, so grid and list cannot drift', () => {
    const s = board();
    expect(s).toMatch(/function ArrangeControls/);
    // Used twice: once in the grid, once in the list.
    expect((s.match(/<ArrangeControls/g) || []).length).toBe(2);
  });

  it('offers show-first, not just one-step nudges', () => {
    // Turnover wants the unit at the front now, not after six taps.
    expect(board()).toMatch(/onArrange\(dir === 0 \? \{ first: id \}/);
  });

  it('hides the controls when there is nothing to arrange', () => {
    expect(board()).toMatch(/total < 2\) return null/);
  });

  it('is wired to a handler that writes only the patches the model returned', () => {
    const s = appjs();
    expect(s).toMatch(/const arrangeDoor = async/);
    expect(s).toMatch(/showFirst\(rentals, intent\.first\)/);
    expect(s).toMatch(/moveDoor\(rentals, intent\?\.move, intent\?\.dir\)/);
    expect(s).toMatch(/onArrange=\{arrangeDoor\}/);
  });

  it('reordering writes NO audit note — the order lives in showcase_order, not the notes', () => {
    // The bug Darrell caught 2026-08-28: every nudge appended a dated
    // "Edited — showcase order" line, stacking junk on the door's notes.
    const s = appjs();
    expect(s).not.toMatch(/summary: 'showcase order'/);
    expect(s).toMatch(/for \(const p of patches\) await updateRental\(p\.id, p\.patch\);/);
  });
});

// =============================================================================
// updateRental never stacks the same edit twice — the note-pollution fix
// =============================================================================
import { updateRental } from '../modules/properties/cloud.js';

// A minimal chainable stand-in for the supabase client: it hands back the
// stored notes on select, and captures the body written on update.
function fakeClient(currentNotes) {
  const captured = {};
  const client = {
    from() { return client; },
    select() { return client; },
    eq() { return client; },
    update(body) { captured.body = body; return client; },
    single() {
      // The select() path resolves to the current notes; the update() path
      // resolves to the written row. We distinguish by whether a body was set.
      return Promise.resolve(
        captured.body
          ? { data: { id: 'x', notes: captured.body.notes }, error: null }
          : { data: { notes: currentNotes }, error: null },
      );
    },
  };
  return { client, captured };
}

describe('updateRental — the audit note does not stack', () => {
  it('appends a summary line the first time', async () => {
    const { client, captured } = fakeClient('Sourced from chat.');
    await updateRental('x', { monthly_rent: 900 }, { summary: 'advertised' }, client);
    expect(captured.body.notes).toContain('Sourced from chat.');
    expect(captured.body.notes).toContain('Edited — advertised');
  });

  it('does NOT append again when the tail already carries the same-day, same-summary line', async () => {
    const stamp = new Date().toISOString().slice(0, 10);
    const already = `Sourced from chat.\n[${stamp}] Edited — showcase order`;
    const { client, captured } = fakeClient(already);
    await updateRental('x', { showcase_order: 5 }, { summary: 'showcase order' }, client);
    // The notes are unchanged — one line, not two.
    const occurrences = (captured.body.notes.match(/Edited — showcase order/g) || []).length;
    expect(occurrences).toBe(1);
    expect(captured.body.notes).toBe(already.trimEnd());
  });

  it('writes no note at all when no summary is given (a plain reorder patch)', async () => {
    const { client, captured } = fakeClient('Sourced from chat.');
    await updateRental('x', { showcase_order: 5 }, {}, client);
    expect(captured.body).not.toHaveProperty('notes');
  });
});

describe('the door editor carries the controls he asked for', () => {
  it('lets him change what a door is CALLED', () => {
    // "change name and what the words say" — the name is his, not a label
    // derived from the street.
    expect(board()).toMatch(/key: 'display_name', label: 'Name'/);
  });

  it('lets him set who may see the street, per door', () => {
    const s = board();
    expect(s).toMatch(/key: 'address_visibility'/);
    expect(s).toMatch(/Shared when someone applies/);
    expect(s).toMatch(/Shown to anyone browsing/);
  });

  it('defaults an unset door to WITHHELD in the form too', () => {
    // The form must not display "public" for a door whose column is NULL — the
    // database treats NULL as after-application, and the editor has to agree or
    // saving without touching it would flip the door open.
    expect(board()).toMatch(/rental\.address_visibility \|\| 'after-application'/);
  });
});
