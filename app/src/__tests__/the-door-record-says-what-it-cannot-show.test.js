// =============================================================================
// THE DOOR RECORD SAYS WHAT IT CANNOT SHOW
// =============================================================================
// Darrell, 2026-10-10, on what this record is for:
//
//   "Messages to the 1099 workers or just historical notes for when things are
//    being done... a place to make sure we have all-in-one information about
//    this place... Messages in-between tenants go to the historical events and
//    timelines for project work for users and management and workers to see...
//    less questions for owners... workers can deduce things from historical
//    data"
//
// and then the standard, twice: "End to end.... historical accuracy and
// events... make sense?"
//
// WHAT WAS TRUE. loadDoorRecord fired five reads and threw every error away —
// `msg.data || []`, five times — and returned ok() regardless. So three
// completely different situations produced one identical answer:
//
//   * the read FAILED (network, permission, a bad column), and
//   * the reader is NOT PERMITTED to see that part, and
//   * nothing has ever happened on this door
//
// all rendered as an empty list, under a heading that reads "Everything that
// has happened on this door, in order." A person deducing "nothing was ever
// said here" could have been deducing it from a dropped request.
//
// The quieter half is worse, because no error exists to report: row-level
// security does not fail a query, it FILTERS the rows and returns an empty
// set. A manager without "Message tenants" and a brand-new door look exactly
// alike. That one cannot be fixed by checking errors — it is answered from
// the face, which is what unseenByThisFace is for.
//
// This is the difference between a record that is incomplete and a record
// that LIES BY OMISSION, and it matters most for the exact use Darrell named:
// a worker arriving later and deducing from the history instead of asking.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { loadDoorRecord } from '../modules/properties/cloud.js';
import { unseenByThisFace, unreadNote } from '../modules/properties/model.js';

// A stub Supabase whose per-table answers we choose.
function clientWith(answers) {
  const chain = (table) => {
    const res = answers[table] || { data: [], error: null };
    const self = {
      select: () => self,
      eq: () => self,
      in: () => self,
      // 0260 / DR-0897: a door's rows are scoped with .or() when both a
      // tenancy and a rental are known, so the stub has to answer it too.
      or: () => self,
      order: () => Promise.resolve(res),
    };
    return self;
  };
  return { from: (t) => chain(t) };
}

const EVERY_TABLE = {
  tenant_maintenance_requests: { data: [{ id: 'r1' }], error: null },
  tenant_messages: { data: [{ id: 'm1' }], error: null },
  tenancy_notes: { data: [], error: null },
  rent_records: { data: [], error: null },
  tenant_notices: { data: [], error: null },
  request_documentation: { data: [], error: null },
};

describe('a record that could not be read is not an empty record', () => {
  it('PROVEN-TO-CATCH: a failed message read is reported, not silently emptied', async () => {
    const res = await loadDoorRecord('door-1', {}, clientWith({
      ...EVERY_TABLE,
      tenant_messages: { data: null, error: { message: 'permission denied' } },
    }));
    expect(res.ok).toBe(true);
    expect(res.messages).toEqual([]);          // nothing to show, as before…
    expect(res.unreadable).toContain('messages'); // …but it SAYS why
  });

  it('reports every part that failed, not just the first', async () => {
    const res = await loadDoorRecord('door-1', {}, clientWith({
      ...EVERY_TABLE,
      tenant_messages: { data: null, error: { message: 'boom' } },
      rent_records: { data: null, error: { message: 'boom' } },
      tenant_notices: { data: null, error: { message: 'boom' } },
    }));
    expect(res.unreadable).toEqual(expect.arrayContaining(['messages', 'payments', 'notices']));
  });

  it('a door where nothing happened is NOT reported as unreadable', async () => {
    // The distinction the whole change exists to make.
    const res = await loadDoorRecord('door-1', {}, clientWith({
      tenant_maintenance_requests: { data: [], error: null },
      tenant_messages: { data: [], error: null },
      tenancy_notes: { data: [], error: null },
      rent_records: { data: [], error: null },
      tenant_notices: { data: [], error: null },
    }));
    expect(res.messages).toEqual([]);
    expect(res.unreadable).toEqual([]);
  });

  it('still returns everything it COULD read when one part fails', async () => {
    const res = await loadDoorRecord('door-1', {}, clientWith({
      ...EVERY_TABLE,
      tenant_messages: { data: null, error: { message: 'boom' } },
    }));
    expect(res.requests).toHaveLength(1);
  });

  it('a door with no tenancy answers empty and unreadable-empty, never undefined', async () => {
    const res = await loadDoorRecord(null, {}, clientWith(EVERY_TABLE));
    expect(res.unreadable).toEqual([]);
  });
});

describe('the sentence a partial record carries', () => {
  it('names the one part that failed', () => {
    expect(unreadNote(['messages'])).toContain('the messages could not be read');
  });

  it('names several in plain English', () => {
    const n = unreadNote(['messages', 'payments', 'notices']);
    expect(n).toContain('messages, payments and notices');
  });

  it('says the missing part is UNKNOWN, not absent', () => {
    // The whole point: do not let a reader conclude "nothing happened".
    expect(unreadNote(['messages'])).toMatch(/unknown rather than absent/);
  });

  it('is null when the whole record was read', () => {
    expect(unreadNote([])).toBeNull();
    expect(unreadNote()).toBeNull();
  });
});

describe('what a given face is never shown — the gap RLS reports as nothing', () => {
  it('PROVEN-TO-CATCH: a manager without "Message tenants" is told, not left guessing', () => {
    const gaps = unseenByThisFace('manager', ['request.manage']);
    expect(gaps.join(' ')).toMatch(/Messages are not part of the history you are shown/);
  });

  it('a manager who HAS it is not told messages are missing', () => {
    const gaps = unseenByThisFace('manager', ['request.manage', 'message.tenant', 'rentroll.view']);
    expect(gaps.join(' ')).not.toMatch(/Messages are not part/);
    expect(gaps.join(' ')).not.toMatch(/Payments are not part/);
  });

  it('a worker is told the thread he sees is the job thread, not the tenancy', () => {
    const gaps = unseenByThisFace('field_worker', ['property.history', 'docs.add']);
    expect(gaps.join(' ')).toMatch(/job threads your landlord opened to you/);
    expect(gaps.join(' ')).toMatch(/never part of a worker/);
  });

  it('a tenant is told the landlord keeps private notes they do not see', () => {
    expect(unseenByThisFace('tenant').join(' ')).toMatch(/private notes/);
  });

  it('the owner sees the whole record and is told nothing', () => {
    expect(unseenByThisFace('owner', [])).toEqual([]);
  });
});

describe('the surfaces that carry it', () => {
  it('History and Messages both show the unread warning', async () => {
    const { readFileSync } = await import('node:fs');
    const { dirname, join } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const src = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '..', 'modules', 'properties', 'PropertiesApp.jsx'),
      'utf8',
    );
    expect(src).toContain('data-testid="history-unread"');
    expect(src).toContain('data-testid="history-unseen"');
    expect(src).toContain('data-testid="thread-unread"');
    // One module, mounted by BOTH apps — so PoeTech and the Poe Properties
    // door cannot tell different stories about the same door.
    expect(src).toContain('unseenByThisFace(role, grants)');
  });
});
