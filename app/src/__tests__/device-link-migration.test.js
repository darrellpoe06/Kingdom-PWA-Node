// @vitest-environment node
// =============================================================================
// The device-link table cannot leak a session
// =============================================================================
// The client half is gated in device-link.test.js. This gates the SQL, because
// every property that makes the flow safe lives in the database and a single
// loosened line would undo all of it silently:
//
//   · one SELECT policy on the table and the short code on screen becomes
//     enough to read the long secret sitting beside it
//   · an approve that does not require auth.uid() lets anyone approve anyone
//   · a claim that reads before it burns lets two racing polls both win
//
// None of that shows up in a passing app. It shows up as somebody else's
// session on your television.

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const repoRoot = resolve(__dirname, '../../..');
const DIR = join(repoRoot, 'infra/supabase/migrations-auto');
const FILE = readdirSync(DIR).find((f) => /^0222-.*device|television/i.test(f) || f.startsWith('0222-'));
const sql = readFileSync(join(DIR, FILE), 'utf8');
const fn = (name) => {
  const i = sql.indexOf(`FUNCTION public.${name}`);
  return i === -1 ? '' : sql.slice(i, sql.indexOf('$$;', i) + 3);
};

describe('the table is reachable only through the definer functions', () => {
  it('row level security is ON', () => {
    expect(sql).toMatch(/ALTER TABLE public\.device_link ENABLE ROW LEVEL SECURITY/);
  });

  it('there is NO policy — zero policies with RLS on denies everyone', () => {
    // The load-bearing assertion. A single permissive SELECT policy would make
    // the whole two-secret design collapse in one query: read the row by the
    // code on screen, take the device_hash beside it.
    expect(sql, 'a policy was added to device_link').not.toMatch(/CREATE POLICY/i);
  });

  it('the secret is stored HASHED, never in the clear', () => {
    // If the raw device_code were stored, a database read would BE a session
    // handover. The TV proves possession instead.
    expect(sql).toMatch(/device_hash\s+text NOT NULL UNIQUE/);
    expect(sql, 'a raw device_code column exists').not.toMatch(/device_code\s+text/);
  });
});

describe('approving requires a signed-in human', () => {
  const decide = fn('device_link_decide');

  it('refuses when there is no session', () => {
    // This is what makes it safe to PRINT the short code on a screen.
    expect(decide).toMatch(/auth\.uid\(\)/);
    expect(decide).toMatch(/RAISE EXCEPTION 'sign-in-required'/);
  });

  it('records the approver, so a claim knows whose session it is', () => {
    expect(decide).toMatch(/user_id = v_uid/);
  });

  it('cannot approve a consumed, denied or expired row', () => {
    const guards = decide.slice(decide.indexOf('IF p_approve'));
    for (const g of ['approved_at IS NULL', 'denied_at IS NULL', 'consumed_at IS NULL', 'expires_at > now()']) {
      expect(guards, `approve is missing the guard: ${g}`).toContain(g);
    }
  });

  it('only authenticated may execute it', () => {
    expect(sql).toMatch(/GRANT EXECUTE ON FUNCTION public\.device_link_decide\(text, boolean\)\s+TO authenticated;/);
    expect(sql, 'anon can approve a device').not.toMatch(/device_link_decide\(text, boolean\)\s+TO anon/);
  });
});

describe('claiming burns the row in the same breath it reads it', () => {
  const claim = fn('device_link_claim');

  it('is an UPDATE ... RETURNING, not a SELECT then an UPDATE', () => {
    // Two racing polls must not both come away with a session. A read followed
    // by a write has a window between them; this has none.
    expect(claim).toMatch(/UPDATE public\.device_link/);
    expect(claim).toMatch(/SET consumed_at = now\(\)/);
    expect(claim).toMatch(/RETURNING d\.user_id/);
    expect(claim, 'claim does a separate SELECT first').not.toMatch(/SELECT[\s\S]*FROM public\.device_link[\s\S]*UPDATE/);
  });

  it('will not hand over a row that is unapproved, used or stale', () => {
    for (const g of ['approved_at IS NOT NULL', 'user_id IS NOT NULL', 'consumed_at IS NULL', 'expires_at > now()']) {
      expect(claim, `claim is missing the guard: ${g}`).toContain(g);
    }
  });
});

describe('what the phone is shown carries no secret', () => {
  const describeFn = fn('device_link_describe');

  it('returns a label and a time — never a hash or a user id', () => {
    expect(describeFn).toMatch(/RETURNS TABLE \(device_label text, created_at timestamptz, approvable boolean\)/);
    expect(describeFn, 'describe leaks the secret').not.toMatch(/device_hash/);
    expect(describeFn, 'describe leaks who approved').not.toMatch(/user_id/);
  });

  it('the poll answers with a state word only', () => {
    expect(fn('device_link_poll')).toMatch(/RETURNS TABLE \(state text\)/);
  });
});

describe('a code cannot be minted to live forever', () => {
  it('the TTL is clamped at both ends', () => {
    const start = fn('device_link_start');
    expect(start).toMatch(/p_ttl_seconds < 60 OR p_ttl_seconds > 1800/);
    expect(start).toMatch(/p_ttl_seconds := 600/);
  });

  it('a too-short hash is refused rather than stored', () => {
    expect(fn('device_link_start')).toMatch(/RAISE EXCEPTION 'device-hash-too-short'/);
  });

  it('expired rows are swept so a short code is never held hostage', () => {
    expect(fn('device_link_start')).toMatch(/DELETE FROM public\.device_link WHERE expires_at </);
  });
});

describe('it re-runs safely, because the lane may replay it', () => {
  it('every object is idempotent', () => {
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS/);
    expect(sql).toMatch(/CREATE INDEX IF NOT EXISTS/);
    const creates = sql.match(/CREATE (OR REPLACE )?FUNCTION/g) || [];
    const replaces = sql.match(/CREATE OR REPLACE FUNCTION/g) || [];
    expect(replaces.length, 'a function would fail on replay').toBe(creates.length);
  });
});
