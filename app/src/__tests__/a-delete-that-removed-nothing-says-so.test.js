// =============================================================================
// A delete that removed nothing says so (DR-1528)
// =============================================================================
// MEASURED 2026-11-18. Darrell on The Word: a draft, "Your Victory is
// Guaranteed", would not delete. No error, no message, no movement -- the
// button looked dead.
//
// TWO defects, and either one alone produces exactly that silence:
//
//   1. PostgREST answers a DELETE that RLS REFUSES with no error and no rows.
//      `deleteSermon` returned `{ deleted: true }` on the strength of
//      `error == null`, so the UI cleared its banner and said nothing about a
//      row that is still there. That is DR-0076 section 8 on the write side:
//      an unknown read as a yes.
//
//   2. The library renders `dedupeSermons(...).kept`, so a message with clones
//      in the table is drawn ONCE. Deleting that single id promoted a clone
//      into its place and the card never left the screen.
//
// These cases hold both closed. They do not assert which one Darrell hit --
// his database was not read -- only that neither can be silent again.
import { describe, it, expect, vi, beforeEach } from 'vitest';

const calls = [];
let response = { data: [{ id: 'a' }], error: null };

// A minimal PostgREST shape: .delete() -> .eq()/.in() -> .select() resolves.
function makeBuilder(table) {
  const b = {
    delete: () => {
      calls.push({ table, op: 'delete' });
      return b;
    },
    eq: (col, val) => {
      calls.push({ op: 'eq', col, val });
      return b;
    },
    in: (col, vals) => {
      calls.push({ op: 'in', col, vals });
      return b;
    },
    select: (cols) => {
      calls.push({ op: 'select', cols });
      return Promise.resolve(response);
    },
  };
  return b;
}

vi.mock('../lib/supabase.js', () => ({
  default: { from: (table) => makeBuilder(table) },
  supabase: { from: (table) => makeBuilder(table) },
}));

const { deleteSermon, deleteSermons, sermonDedupeKey } = await import('../lib/choir-sync.js');

beforeEach(() => {
  calls.length = 0;
  response = { data: [{ id: 'a' }], error: null };
});

describe('a delete that removed nothing says so', () => {
  it('PROVEN TO CATCH: zero rows and no error is NOT a delete', async () => {
    // The exact PostgREST answer when RLS refuses: 204, no error, no rows.
    response = { data: [], error: null };
    const r = await deleteSermon('abc');
    expect(r.deleted, 'a refused delete must never report success').toBeUndefined();
    expect(r.skipped).toBe('nothing-deleted');
  });

  it('asks PostgREST to return what it removed, or it cannot know', async () => {
    await deleteSermon('abc');
    const sel = calls.find((c) => c.op === 'select');
    expect(sel, 'without .select() the row count is invisible').toBeTruthy();
    expect(sel.cols).toBe('id');
  });

  it('a real delete still reports success, with its count', async () => {
    response = { data: [{ id: 'a' }], error: null };
    const r = await deleteSermon('a');
    expect(r).toMatchObject({ deleted: true, count: 1 });
  });

  it('a genuine error is still an error, not a silent no-op', async () => {
    response = { data: null, error: { message: 'boom' } };
    const r = await deleteSermon('a');
    expect(r.skipped).toBe('delete-error');
    expect(r.error).toBeTruthy();
  });

  it('an empty id asks the database nothing at all', async () => {
    expect((await deleteSermon(null)).skipped).toBe('no-id');
    expect((await deleteSermons([])).skipped).toBe('no-id');
    expect(calls.length, 'no request should have been made').toBe(0);
  });
});

describe('the whole duplicate group goes, not the one row the list showed', () => {
  it('deletes every id it is given, in one request', async () => {
    response = { data: [{ id: 'a' }, { id: 'b' }, { id: 'c' }], error: null };
    const r = await deleteSermons(['a', 'b', 'c']);
    expect(r).toMatchObject({ deleted: true, count: 3, asked: 3 });
    const inCall = calls.find((c) => c.op === 'in');
    expect(inCall.col).toBe('id');
    expect(inCall.vals).toEqual(['a', 'b', 'c']);
  });

  it('de-duplicates and drops empties before asking', async () => {
    response = { data: [{ id: 'a' }], error: null };
    await deleteSermons(['a', 'a', null, undefined, '']);
    expect(calls.find((c) => c.op === 'in').vals).toEqual(['a']);
  });

  it('clones share a dedupe key, which is what makes this ONE logical delete', () => {
    // Two rows, same message, no video id — the shape the harvest produces.
    const a = { id: 'a', title: 'Your Victory is Guaranteed', serviceDate: '2026-06-28', serviceType: 'sunday', serviceSlot: 'bible-study-morning' };
    const b = { id: 'b', title: 'your victory is guaranteed', serviceDate: '2026-06-28', serviceType: 'sunday', serviceSlot: 'bible-study-morning' };
    expect(sermonDedupeKey(a)).toBe(sermonDedupeKey(b));
    // A different message must NOT be swept in by the group delete.
    const other = { ...a, id: 'c', title: 'A Different Message' };
    expect(sermonDedupeKey(other)).not.toBe(sermonDedupeKey(a));
  });

  it('a group delete that removes nothing is still reported', async () => {
    response = { data: [], error: null };
    expect((await deleteSermons(['a', 'b'])).skipped).toBe('nothing-deleted');
  });
});
