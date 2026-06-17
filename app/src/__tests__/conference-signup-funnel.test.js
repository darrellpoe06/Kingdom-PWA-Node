// =============================================================================
// conference signup FUNNEL — open registration + OPTIONAL account on-ramp
// =============================================================================
// Proves the funnel contract (Darrell 2026-06-17) against a faithful model of the
// 0027 + 0031 RLS/RPC behavior (NOT a live cloud round-trip — that needs a
// service-role key; the live closed-loop is verified separately and reported):
//
//   1. OPEN register WITHOUT an account works — and returns a row id to link with.
//   2. OPT-IN account LINKS the registration: claim sets linked_user_id to the
//      caller, the member's get_my returns it, the organizer sees it linked.
//   3. SKIP account — the registrant is STILL fully registered (no lockout).
//   4. NO-LEAK / NO-HIJACK: anon can't read the roll; claim can't steal a row
//      already linked to someone else; claim needs a session.
//   5. The pending-link store survives the OAuth redirect and resolves on return.
//
// Plus the structural link-safety guard (conference-link-guard) with its
// proven-to-catch cases (DR-0060), so a leak shape FAILS the build.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { scanConferenceLink } from '../../../scripts/conference-link-guard.mjs';

// --- faithful in-memory model of the table + auth + the two RPCs --------------
const h = vi.hoisted(() => ({
  state: { store: [], role: 'organizer', uid: null, insertError: null, authCb: null },
}));

vi.mock('../lib/supabase.js', () => {
  const order = () => Promise.resolve({
    // RLS: SELECT (the roll) is organizer-only. Anyone else reads nothing.
    data: h.state.role === 'organizer' ? [...h.state.store].slice().reverse() : [],
    error: null,
  });
  const from = () => ({
    insert: (row) => {
      if (h.state.insertError) return Promise.resolve({ error: h.state.insertError });
      const rows = Array.isArray(row) ? row : [row];
      rows.forEach((r) => h.state.store.push({
        id: r.id || `id-${h.state.store.length + 1}`,   // honor the client-supplied id
        instance_id: 'colg-instance',                    // trigger forces the instance
        linked_user_id: null,
        created_at: `2026-06-17T0${h.state.store.length}:00:00Z`,
        ...r,
      }));
      return Promise.resolve({ error: null });
    },
    select: function select() { return this; },
    order,
  });
  // The SECURITY DEFINER RPCs, modeled to their exact contract.
  const rpc = (name, args = {}) => {
    if (name === 'claim_conference_registration') {
      if (!h.state.uid) return Promise.resolve({ data: false, error: null }); // not signed in
      const row = h.state.store.find((r) => r.id === args.p_reg_id);
      if (!row || row.linked_user_id != null) return Promise.resolve({ data: false, error: null }); // unclaimed-only
      row.linked_user_id = h.state.uid;                  // set to the CALLER only
      return Promise.resolve({ data: true, error: null });
    }
    if (name === 'get_my_conference_registrations') {
      const rows = h.state.uid ? h.state.store.filter((r) => r.linked_user_id === h.state.uid) : [];
      return Promise.resolve({ data: rows, error: null });
    }
    return Promise.resolve({ data: null, error: { message: `unknown rpc ${name}` } });
  };
  const auth = {
    getSession: () => Promise.resolve({ data: { session: h.state.uid ? { user: { id: h.state.uid } } : null } }),
    onAuthStateChange: (cb) => { h.state.authCb = cb; return { data: { subscription: { unsubscribe: () => { h.state.authCb = null; } } } }; },
  };
  const supabase = {
    from, rpc, auth,
    channel: () => ({ on: () => ({ subscribe: () => ({}) }) }),
    removeChannel: () => {},
  };
  return { default: supabase, supabase };
});

import { submitRegistration, fetchRegistrations } from '../lib/conference-register.js';
import {
  setPendingConferenceLink, getPendingConferenceLink, clearPendingConferenceLink,
  claimConferenceRegistration, resolvePendingConferenceLink, fetchMyConferenceRegistrations,
} from '../lib/conference-link.js';

beforeEach(() => {
  h.state.store = [];
  h.state.role = 'organizer';
  h.state.uid = null;
  h.state.insertError = null;
  h.state.authCb = null;
  try { window.localStorage.clear(); } catch { /* noop */ }
});

describe('funnel step 1 — open registration works WITHOUT an account', () => {
  it('a public submission persists and returns a row id (the link handle)', async () => {
    const res = await submitRegistration({ name: 'Naomi', mealType: 'Vegan', source: 'public-link' });
    expect(res.ok).toBe(true);
    expect(typeof res.id).toBe('string');
    expect(res.id.length).toBeGreaterThan(10);          // a real uuid, not empty
    expect(h.state.store).toHaveLength(1);
    expect(h.state.store[0]).toMatchObject({ name: 'Naomi', id: res.id, linked_user_id: null });
  });
});

describe('funnel step 2 — opt-in account LINKS the registration', () => {
  it('claim sets linked_user_id to the caller; get_my returns it; organizer sees it linked', async () => {
    const reg = await submitRegistration({ name: 'Adam', source: 'public-link' });
    // The person creates an account -> a session appears.
    h.state.uid = 'user-adam';
    const claim = await claimConferenceRegistration(reg.id);
    expect(claim.ok).toBe(true);
    expect(claim.linked).toBe(true);

    // The member now sees their OWN registration (self-scoped get_my, not the roll).
    const mine = await fetchMyConferenceRegistrations();
    expect(mine.ok).toBe(true);
    expect(mine.rows.map((r) => r.id)).toEqual([reg.id]);

    // The organizer roll shows the link landed on the real row.
    h.state.role = 'organizer';
    const { rows } = await fetchRegistrations();
    const row = h.state.store.find((r) => r.id === reg.id);
    expect(row.linked_user_id).toBe('user-adam');
    expect(rows.find((r) => r.name === 'Adam')).toBeTruthy();
  });
});

describe('funnel step 3 — SKIP account: still fully registered, no lockout', () => {
  it('a registration with no claim stays a real, unlinked row the organizer sees', async () => {
    const reg = await submitRegistration({ name: 'Mara', mealType: 'Regular', source: 'public-link' });
    expect(reg.ok).toBe(true);
    // No account created -> nothing pending, nothing claimed.
    const resolved = await resolvePendingConferenceLink();
    expect(resolved.claimed).toBe(false);
    const row = h.state.store.find((r) => r.id === reg.id);
    expect(row.linked_user_id).toBeNull();              // unlinked
    h.state.role = 'organizer';
    const { rows } = await fetchRegistrations();
    expect(rows.find((r) => r.name === 'Mara')).toBeTruthy(); // still registered + visible
  });
});

describe('funnel step 4 — no-leak / no-hijack', () => {
  it('an anon viewer cannot read the roll (unchanged from 0027)', async () => {
    await submitRegistration({ name: 'Naomi' });
    h.state.role = 'anon';
    const { rows } = await fetchRegistrations();
    expect(rows).toEqual([]);
  });

  it('claim needs a session (signed-out claim links nothing)', async () => {
    const reg = await submitRegistration({ name: 'Naomi' });
    h.state.uid = null;
    const claim = await claimConferenceRegistration(reg.id);
    expect(claim.linked).toBe(false);
    expect(h.state.store[0].linked_user_id).toBeNull();
  });

  it('claim cannot HIJACK a row already linked to someone else', async () => {
    const reg = await submitRegistration({ name: 'Naomi' });
    h.state.uid = 'user-naomi';
    await claimConferenceRegistration(reg.id);          // Naomi claims it
    h.state.uid = 'attacker';
    const steal = await claimConferenceRegistration(reg.id); // attacker tries the same id
    expect(steal.linked).toBe(false);
    expect(h.state.store[0].linked_user_id).toBe('user-naomi'); // untouched
  });

  it('a member only ever sees their OWN linked registration via get_my', async () => {
    const a = await submitRegistration({ name: 'Adam' });
    const b = await submitRegistration({ name: 'Naomi' });
    h.state.uid = 'user-adam';   await claimConferenceRegistration(a.id);
    h.state.uid = 'user-naomi';  await claimConferenceRegistration(b.id);
    // Adam's view contains only Adam's row.
    h.state.uid = 'user-adam';
    const mine = await fetchMyConferenceRegistrations();
    expect(mine.rows.map((r) => r.name)).toEqual(['Adam']);
  });
});

describe('funnel step 5 — pending link survives the OAuth redirect round-trip', () => {
  it('parks the id, then claims + clears on the authenticated return', async () => {
    const reg = await submitRegistration({ name: 'Eli' });
    // Before redirecting to Google we park the link; the session is not yet present.
    setPendingConferenceLink(reg.id);
    expect(getPendingConferenceLink()).toBe(reg.id);
    const noSession = await resolvePendingConferenceLink();
    expect(noSession.claimed).toBe(false);               // kept pending while signed out
    expect(getPendingConferenceLink()).toBe(reg.id);

    // Back from Google -> a session exists -> the pending link resolves + clears.
    h.state.uid = 'user-eli';
    const done = await resolvePendingConferenceLink();
    expect(done.claimed).toBe(true);
    expect(getPendingConferenceLink()).toBeNull();
    expect(h.state.store[0].linked_user_id).toBe('user-eli');
  });

  it('clearPendingConferenceLink removes a parked id', () => {
    setPendingConferenceLink('id-xyz');
    clearPendingConferenceLink();
    expect(getPendingConferenceLink()).toBeNull();
  });
});

// --- the structural guard + proven-to-catch (DR-0060) ------------------------
describe('conference-link guard — link is self-scoped + leak-proof (real migrations)', () => {
  it('PASSES on the shipped 0027 + 0031 migrations', () => {
    const { ok, problems } = scanConferenceLink();
    expect(ok, problems.join('; ')).toBe(true);
  });

  it('CATCHES a claim that sets linked_user_id to a CLIENT value (not auth.uid)', () => {
    const bad = `
      ALTER TABLE conference_public_registrations ADD COLUMN IF NOT EXISTS linked_user_id uuid;
      CREATE OR REPLACE FUNCTION public.claim_conference_registration(p_reg_id uuid, p_user uuid)
      RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $fn$
        UPDATE conference_public_registrations SET linked_user_id = p_user WHERE id = p_reg_id AND linked_user_id IS NULL; SELECT true;
      $fn$;
      REVOKE ALL ON FUNCTION public.claim_conference_registration FROM PUBLIC;
      GRANT EXECUTE ON FUNCTION public.claim_conference_registration TO authenticated;
      CREATE OR REPLACE FUNCTION public.get_my_conference_registrations() RETURNS SETOF conference_public_registrations
      LANGUAGE sql SECURITY DEFINER AS $g$ SELECT * FROM conference_public_registrations WHERE linked_user_id = auth.uid(); $g$;
      REVOKE ALL ON FUNCTION public.get_my_conference_registrations() FROM PUBLIC;
      GRANT EXECUTE ON FUNCTION public.get_my_conference_registrations() TO authenticated;`;
    const { ok, problems } = scanConferenceLink(bad);
    expect(ok).toBe(false);
    expect(problems.join(' ')).toMatch(/auth\.uid|caller/i);
  });

  it('CATCHES a claim missing the unclaimed-only guard (hijack risk)', () => {
    const bad = `
      ALTER TABLE conference_public_registrations ADD COLUMN IF NOT EXISTS linked_user_id uuid;
      CREATE OR REPLACE FUNCTION public.claim_conference_registration(p_reg_id uuid)
      RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $fn$
        UPDATE conference_public_registrations SET linked_user_id = auth.uid() WHERE id = p_reg_id; SELECT true;
      $fn$;
      REVOKE ALL ON FUNCTION public.claim_conference_registration FROM PUBLIC;
      GRANT EXECUTE ON FUNCTION public.claim_conference_registration TO authenticated;
      CREATE OR REPLACE FUNCTION public.get_my_conference_registrations() RETURNS SETOF conference_public_registrations
      LANGUAGE sql SECURITY DEFINER AS $g$ SELECT * FROM conference_public_registrations WHERE linked_user_id = auth.uid(); $g$;
      REVOKE ALL ON FUNCTION public.get_my_conference_registrations() FROM PUBLIC;
      GRANT EXECUTE ON FUNCTION public.get_my_conference_registrations() TO authenticated;`;
    const { ok, problems } = scanConferenceLink(bad);
    expect(ok).toBe(false);
    expect(problems.join(' ')).toMatch(/unclaimed|IS NULL|hijack/i);
  });

  it('CATCHES the claim RPC being EXECUTE-able by anon', () => {
    const bad = `
      ALTER TABLE conference_public_registrations ADD COLUMN IF NOT EXISTS linked_user_id uuid;
      CREATE OR REPLACE FUNCTION public.claim_conference_registration(p_reg_id uuid)
      RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $fn$
        UPDATE conference_public_registrations SET linked_user_id = auth.uid() WHERE id = p_reg_id AND linked_user_id IS NULL; SELECT true;
      $fn$;
      GRANT EXECUTE ON FUNCTION public.claim_conference_registration TO anon;
      CREATE OR REPLACE FUNCTION public.get_my_conference_registrations() RETURNS SETOF conference_public_registrations
      LANGUAGE sql SECURITY DEFINER AS $g$ SELECT * FROM conference_public_registrations WHERE linked_user_id = auth.uid(); $g$;
      REVOKE ALL ON FUNCTION public.get_my_conference_registrations() FROM PUBLIC;
      GRANT EXECUTE ON FUNCTION public.get_my_conference_registrations() TO authenticated;`;
    const { ok, problems } = scanConferenceLink(bad);
    expect(ok).toBe(false);
    expect(problems.join(' ')).toMatch(/claim EXECUTE/i);
  });

  it('CATCHES a new anon SELECT policy on the roll (the read-back leak)', () => {
    const bad = `
      ALTER TABLE conference_public_registrations ADD COLUMN IF NOT EXISTS linked_user_id uuid;
      CREATE POLICY conf_pub_reg_anon_read ON conference_public_registrations FOR SELECT
        TO anon USING (true);
      CREATE OR REPLACE FUNCTION public.claim_conference_registration(p_reg_id uuid)
      RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $fn$
        UPDATE conference_public_registrations SET linked_user_id = auth.uid() WHERE id = p_reg_id AND linked_user_id IS NULL; SELECT true;
      $fn$;
      REVOKE ALL ON FUNCTION public.claim_conference_registration FROM PUBLIC;
      GRANT EXECUTE ON FUNCTION public.claim_conference_registration TO authenticated;
      CREATE OR REPLACE FUNCTION public.get_my_conference_registrations() RETURNS SETOF conference_public_registrations
      LANGUAGE sql SECURITY DEFINER AS $g$ SELECT * FROM conference_public_registrations WHERE linked_user_id = auth.uid(); $g$;
      REVOKE ALL ON FUNCTION public.get_my_conference_registrations() FROM PUBLIC;
      GRANT EXECUTE ON FUNCTION public.get_my_conference_registrations() TO authenticated;`;
    const { ok, problems } = scanConferenceLink(bad);
    expect(ok).toBe(false);
    expect(problems.join(' ')).toMatch(/anon SELECT|LEAK/i);
  });
});
