// @vitest-environment node
// =============================================================================
// A surface must not wait on a WebSocket to show its own work (DR-1058)
// =============================================================================
// Darrell, 2026-10-15, on Campus Rentals → Requests to review, with the focus
// ring still sitting on an unchecked "Setup & décor": **"Doesn't work!!!!"**
//
// TRACED, and four likely causes were ruled OUT by measurement before the real
// one was written down:
//
//   RLS            venue_bookings_admin_read and venue_bookings_admin_update
//                  carry the IDENTICAL predicate (0034). He can SEE the three
//                  requests, so the read policy passed, so the update policy
//                  passes too. Not it.
//   grants         `GRANT SELECT, INSERT, UPDATE, DELETE ON venue_bookings TO
//                  authenticated` (0034). Not it.
//   the column     `responsibilities jsonb NOT NULL DEFAULT '{}'` exists. Not it.
//   the trigger    venue_booking_force_public wipes responsibilities for an
//                  anonymous insert — but it is BEFORE INSERT only, so it
//                  cannot touch an update. Not it.
//
// WHAT IT ACTUALLY IS. `setBookings` was called from exactly ONE place: the
// realtime subscription. Every staff control wrote to the database and then
// waited for a postgres_changes event to come back and tell it what it had
// just done. When that WebSocket is not delivering — and the app currently
// reaches the NAS cross-origin over the Funnel, because every Pages Function
// is dark (#2057) — the write lands, the screen never moves, the tick springs
// back, and nothing is said.
//
// AND UNDERNEATH IT, the quietest failure in the app: a PostgREST update whose
// row is filtered out by RLS returns NO ERROR and zero rows. `{ ok: true }`
// could mean "saved" or "nothing happened" and no caller could tell.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { nextResponsibilities, responsibilityProgress } from '../lib/venue-rental.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const read = (rel) => readFileSync(join(HERE, '..', rel), 'utf8');
const LIB = read('lib/venue-rental.js');
const UI = read('components/EventManagement.jsx');
const MIG = readFileSync(join(HERE, '..', '..', '..', 'infra/supabase/migrations-auto/0034-venue-bookings.sql'), 'utf8');

describe('the write says what it actually did', () => {
  it('the update asks for its rows back, so a silent refusal is visible', () => {
    // PROVEN-TO-CATCH: the exact shape that shipped had no .select(), so zero
    // rows changed read as success.
    expect(LIB.includes(".update(row).eq('id', id);"), 'the update is back to not asking').toBe(false);
    expect(LIB).toMatch(/\.update\(row\)\.eq\('id', id\)\.select\(\)/);
    expect(LIB).toMatch(/if \(!rows\.length\) return \{ ok: false, error: 'refused' \}/);
  });

  it('the delete does the same — it has the identical trap', () => {
    expect(LIB.includes(".delete().eq('id', id);"), 'the delete is back to not asking').toBe(false);
    expect(LIB).toMatch(/\.delete\(\)\.eq\('id', id\)\.select\(\)/);
  });

  it('a successful update hands the saved row back', () => {
    expect(LIB).toMatch(/return \{ ok: true, booking: toBookingShape\(rows\[0\]\) \}/);
  });
});

describe('the surface shows its own work, without realtime', () => {
  it('every handler applies the write’s own answer', () => {
    expect(UI).toMatch(/const applySaved = \(saved\)/);
    expect(UI).toMatch(/applySaved\(res\.booking\)/);
    // The delete removes the row locally rather than waiting to be told.
    expect(UI).toMatch(/setBookings\(\(cur\) => cur\.filter\(\(b\) => b\.id !== id\)\)/);
  });

  it('the tick moves on the tap, and goes BACK if the save is refused', () => {
    // An optimistic tick that stays after a refusal would be a worse lie than
    // one that never moved.
    expect(UI).toMatch(/applySaved\(optimistic\)/);
    expect(UI).toMatch(/applySaved\(booking\);\s*\n\s*sayFailure\(res\)/);
  });

  it('a refusal is SAID, and the RLS case is named in plain words', () => {
    expect(UI).toMatch(/sayFailure/);
    expect(UI).toMatch(/role="alert"/);
    expect(UI).toMatch(/would not accept that change/);
    // Never a bare "could not save" with no reason — that is what makes a
    // person tap the same box three times.
    expect(UI).toMatch(/Nothing was saved\./);
  });

  it('realtime is still subscribed — this ADDS a path, it removes none', () => {
    expect(UI).toMatch(/subscribeBookings/);
  });
});

describe('nextResponsibilities — the optimistic tick cannot disagree with the write', () => {
  // Both the optimistic update and the persisted one are computed by this one
  // function, so a tick can never predict something the write would not do.
  it('ticking an unticked item adds it', () => {
    expect(nextResponsibilities({ responsibilities: {} }, 'setup')).toEqual({ setup: true });
  });

  it('unticking REMOVES the key rather than storing false', () => {
    // The stored shape is { key: true } only — responsibilityProgress counts
    // truthy keys, so a lingering false would be dead weight in the row.
    expect(nextResponsibilities({ responsibilities: { setup: true } }, 'setup')).toEqual({});
  });

  it('it leaves the other items exactly alone', () => {
    expect(nextResponsibilities({ responsibilities: { officiant: true } }, 'setup'))
      .toEqual({ officiant: true, setup: true });
  });

  it('a booking with no responsibilities at all does not throw', () => {
    expect(nextResponsibilities({}, 'setup')).toEqual({ setup: true });
    expect(nextResponsibilities(null, 'setup')).toEqual({ setup: true });
    expect(nextResponsibilities({ responsibilities: 'nonsense' }, 'setup')).toEqual({ setup: true });
  });

  it('it agrees with the progress readout the card prints', () => {
    // His screenshot read "1/8 ready" with officiant ticked. Tick setup and it
    // must read 2 of the same 8.
    const booking = { eventType: 'wedding', responsibilities: { officiant: true } };
    const before = responsibilityProgress(booking);
    const after = responsibilityProgress({ ...booking, responsibilities: nextResponsibilities(booking, 'setup') });
    expect(before.done).toBe(1);
    expect(after.done).toBe(2);
    expect(after.total).toBe(before.total);
  });
});

describe('the four causes that were ruled out stay ruled out', () => {
  it('read and update carry the SAME predicate, so seeing a row means you may write it', () => {
    expect(MIG).toMatch(/venue_bookings_admin_read[\s\S]{0,160}user_role_in_instance\(instance_id\) IN \('owner','admin'\)/);
    expect(MIG).toMatch(/venue_bookings_admin_update[\s\S]{0,200}user_role_in_instance\(instance_id\) IN \('owner','admin'\)/);
  });

  it('authenticated holds the UPDATE grant', () => {
    expect(MIG).toMatch(/GRANT SELECT, INSERT, UPDATE, DELETE ON venue_bookings TO authenticated/);
  });

  it('the responsibilities-wiping trigger is BEFORE INSERT only', () => {
    // If this ever becomes BEFORE INSERT OR UPDATE it would blank the checklist
    // on every save, which is a different bug wearing the same symptom.
    expect(MIG).toMatch(/CREATE TRIGGER venue_booking_force_public_t\s*\n\s*BEFORE INSERT ON venue_bookings/);
    expect(MIG.includes('BEFORE INSERT OR UPDATE ON venue_bookings')).toBe(false);
  });
});
