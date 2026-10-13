// =============================================================================
// The auth-lock acquire window must fit inside a read's budget — 2026-09-03
// =============================================================================
// Darrell, signed in, NAS healthy, PostgREST serving with its schema cache
// loaded, the database answering real row counts: Properties showed four
// identical `not-reached` lines. The same URL loaded perfectly in an incognito
// window with no sibling tab. One frozen poetech.us tab — of ~35 open across
// three doors on this one origin — was holding the cross-tab Web Lock that
// every PostgREST call serialises on via getSession().
//
// THE ARITHMETIC IS THE BUG, and it is why this is a test and not a comment.
// auth-js already steals an orphaned lock after its acquire window (see
// supabase/supabase#42505), so the wedge does clear itself — but the DEFAULT
// window is 5000ms while bounded-read.js gives a whole read 6000ms. A contended
// read therefore spends ~83% of its budget waiting to even start, and reports
// 'not-reached' having never been given a chance to answer. Two constants in
// two files, in two different packages' worth of reasoning, that must agree.
//
// A COMMENT CANNOT HOLD THIS. Either number can move independently: someone
// tightens READ_TIMEOUT_MS for snappier failure, or a supabase-js bump changes
// the default, or a future session "restores the vendor default" not knowing
// why it was lowered. This test reads BOTH real values and fails on the
// relationship, which is the only thing that actually matters.
//
// PROVEN-TO-CATCH (DR-0076 §3), each observed failing before this shipped:
//   - removing the `lockAcquireTimeout` line          -> 'sets it explicitly' fails
//   - restoring the 5000 default                      -> 'fits inside a read' fails
//   - setting 0 ("fail immediately on contention")    -> 'is a real wait' fails
//   - setting -1 ("wait forever", the original hang)  -> 'is a real wait' fails
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { READ_TIMEOUT_MS } from '../lib/bounded-read.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const SUPABASE_SRC = readFileSync(join(HERE, '../lib/supabase.js'), 'utf8');

/** The configured value, read from the real client config. */
function configuredWindow() {
  const m = SUPABASE_SRC.match(/lockAcquireTimeout:\s*(-?\d+)/);
  return m ? Number(m[1]) : null;
}

describe('the cross-tab auth lock window', () => {
  it('sets it explicitly — the vendor default is not fit for this app', () => {
    // Not "is a number somewhere": the client config must carry it, because
    // inheriting 5000 is the defect.
    expect(SUPABASE_SRC).toMatch(/lockAcquireTimeout:\s*-?\d+/);
    expect(configuredWindow()).not.toBeNull();
  });

  it('is a real wait — never 0 (fail on any contention) and never negative (wait forever)', () => {
    const ms = configuredWindow();
    // 0 makes every live-tab contention an immediate failure; a negative value
    // is the permanent deadlock the vendor's own docs warn about, and is the
    // behaviour that produced this incident.
    expect(ms).toBeGreaterThan(0);
  });

  it('fits inside a read\'s budget, with room for the read itself to answer', () => {
    const ms = configuredWindow();
    // THE INVARIANT. An acquire window at or above the read budget guarantees
    // 'not-reached' on every contended read — the card Darrell was shown.
    expect(ms).toBeLessThan(READ_TIMEOUT_MS);
    // And not merely under it: a read that waits most of its budget to start
    // is still a read that fails. Half leaves the round trip real room.
    expect(ms).toBeLessThanOrEqual(READ_TIMEOUT_MS / 2);
  });

  it('is long enough for a genuine refresh round trip, so live tabs still serialise', () => {
    // Measured against the NAS at ~100-300ms. Anything under ~500ms would start
    // stealing locks from tabs that are legitimately mid-refresh, which is the
    // token-rotation race the lock exists to prevent — a worse failure than the
    // one being fixed. This is the floor that keeps the fix from overshooting.
    expect(configuredWindow()).toBeGreaterThanOrEqual(500);
  });

  it('records WHY, so the next session does not "restore the default"', () => {
    // The reasoning is load-bearing here: without it this reads as an arbitrary
    // magic number and gets reverted by someone tidying up.
    const near = SUPABASE_SRC.slice(
      Math.max(0, SUPABASE_SRC.indexOf('lockAcquireTimeout') - 1800),
      SUPABASE_SRC.indexOf('lockAcquireTimeout'),
    );
    expect(near).toMatch(/steal/i);          // names the vendor's own recovery
    expect(near).toMatch(/bounded-read/);    // names the constant it must fit inside
    expect(near).toMatch(/froze|frozen/i);   // names the real-world cause
  });
});

describe('bounded-read stays the backstop, not the fix', () => {
  it('still bounds reads, so a stuck read fails honestly rather than hanging', () => {
    // The bound is what kept the page renderable through this incident and must
    // not be removed now that the cause is addressed: it covers every OTHER way
    // a read can fail to settle.
    expect(READ_TIMEOUT_MS).toBeGreaterThan(0);
    expect(READ_TIMEOUT_MS).toBeLessThanOrEqual(10000);
  });
});
