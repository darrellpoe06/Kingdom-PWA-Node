// @vitest-environment jsdom
// =============================================================================
// either-sign-in-sees-the-same-house — one person, one Big Picture (DR-1407)
// =============================================================================
// Darrell 2026-11-10: "Why don't Christina see the same page on the Big
// Picture!!!" Two causes, each pinned here:
//   1. A person's sign-ins held different seats, so the household a sign-in
//      opened on differed. 0319 brings them level; the app asks for that
//      BEFORE it resolves the household, in both resolvers (table-sync and the
//      snapshot the Big Picture is built from). Postgres proof:
//      infra/supabase/tests/0319-one-person-one-house-smoke.sql in CI.
//   2. Poe Properties' work orders read EMPTY, not as an error, for a sign-in
//      without a seat, and the card still said "every work order in the
//      system". It now names the reader and says what it cannot read.
// =============================================================================
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readerReach } from '../lib/work-order-triage.js';
import { shareHouseholdsOnce, resetSharedHouseholds } from '../lib/one-person-sign-ins.js';
import { loadReaderReach } from '../lib/reader-reach.js';
import WorkOrderTriage from '../components/WorkOrderTriage.jsx';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
});
async function mount(props) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(WorkOrderTriage, props));
  });
  for (let i = 0; i < 4; i += 1)
    await act(async () => {
      await Promise.resolve();
    });
}
const one = (id) => container.querySelector(`[data-testid="${id}"]`);
const base = { incidents: [], load: async () => ({ ok: true, requests: [] }), photoOps: null };

describe('the card says who is reading and what it can read', () => {
  it('a confirmed seat names the reader and may say every work order in the system', () => {
    const r = readerReach({ state: 'read', email: 'reader@example.com', seat: { role: 'admin' } });
    expect(r).toEqual({ tone: 'ok', complete: true, text: 'Read as reader@example.com · Poe Properties: admin' });
  });
  it('no seat names the sign-in and says its work orders are not in the list', () => {
    const r = readerReach({ state: 'read', email: 'other@example.com', seat: null });
    expect(r.tone).toBe('missing');
    expect(r.complete).toBe(false);
    expect(r.text).toContain('Signed in as other@example.com');
    expect(r.text).toContain("Poe Properties' work orders are not in this list");
  });
  it('a failed check is unknown, never complete (DR-0076)', () => {
    expect(readerReach({ state: 'failed' })).toMatchObject({ tone: 'unknown', complete: false });
  });
  it('while loading it says nothing rather than guessing', () => {
    expect(readerReach({ state: 'loading' })).toBeNull();
    expect(readerReach(undefined)).toBeNull();
  });

  it('ON SCREEN: a sign-in with no seat is told so, and the card stops claiming the whole system', async () => {
    await mount({ ...base, reachOp: async () => ({ ok: true, email: 'other@example.com', seat: null }) });
    expect(one('work-order-reach').getAttribute('data-reach')).toBe('missing');
    expect(one('work-order-reach').textContent).toContain('Signed in as other@example.com');
    expect(one('work-order-summary').textContent).toContain('every work order this sign-in can read');
    expect(one('work-order-summary').textContent).not.toContain('every work order in the system');
  });
  it('ON SCREEN: a seat reads as the whole system, with the reader named', async () => {
    await mount({ ...base, reachOp: async () => ({ ok: true, email: 'reader@example.com', seat: { role: 'owner' } }) });
    expect(one('work-order-reach').textContent).toBe('Read as reader@example.com · Poe Properties: owner');
    expect(one('work-order-summary').textContent).toContain('every work order in the system');
  });
  it('ON SCREEN: a check that throws reads as unknown, not as complete', async () => {
    await mount({
      ...base,
      reachOp: async () => {
        throw new Error('offline');
      },
    });
    expect(one('work-order-reach').getAttribute('data-reach')).toBe('unknown');
    expect(one('work-order-summary').textContent).toContain('every work order this sign-in can read');
  });
  it('PROVEN TO CATCH: the old card, which never asked, claimed the whole system to a reader with no seat', async () => {
    await mount({ ...base, reachOp: null });
    expect(one('work-order-reach')).toBeNull();
    expect(one('work-order-summary').textContent).toContain('every work order in the system');
  });

  it('loadReaderReach reads the email and the landlord seat, and a refused read is not a "no seat"', async () => {
    const client = (rpc) => ({ auth: { getSession: async () => ({ data: { session: { user: { email: 'reader@example.com' } } } }) }, rpc: async () => rpc });
    expect(await loadReaderReach(client({ data: { instance_id: 'x', role: 'admin', instance_slug: 'poe-properties' } }))).toEqual({
      ok: true,
      email: 'reader@example.com',
      seat: { role: 'admin', slug: 'poe-properties' },
    });
    expect(await loadReaderReach(client({ data: null }))).toEqual({ ok: true, email: 'reader@example.com', seat: null });
    expect((await loadReaderReach(client({ error: { message: 'refused' } }))).ok).toBe(false);
  });
});

describe('both of a person’s sign-ins are brought level before the household is chosen', () => {
  beforeEach(() => resetSharedHouseholds());
  const fake = (uid, rpcImpl) => {
    const calls = [];
    return {
      calls,
      auth: { getSession: async () => ({ data: { session: uid ? { user: { id: uid } } : null } }) },
      rpc: async (name) => {
        calls.push(name);
        return rpcImpl ? rpcImpl(name) : { data: 0 };
      },
    };
  };
  it('asks once per account per page load', async () => {
    const c = fake('u1');
    await shareHouseholdsOnce(c);
    await shareHouseholdsOnce(c);
    expect(c.calls).toEqual(['share_my_households_across_my_sign_ins']);
  });
  it('never asks for nobody, and a database without 0319 never breaks sign-in', async () => {
    const none = fake(null);
    await shareHouseholdsOnce(none);
    expect(none.calls).toEqual([]);
    const old = fake('u2', () => {
      throw new Error('function does not exist');
    });
    await expect(shareHouseholdsOnce(old)).resolves.toBeUndefined();
  });
  it('both resolvers ask BEFORE join_default_instance picks the house', () => {
    for (const f of ['app/src/lib/table-sync.js', 'app/src/lib/snapshot-sync.js']) {
      const src = read(f);
      const body = src.slice(src.indexOf('async function getTenantId()'));
      const ask = body.indexOf('await shareHouseholdsOnce(supabase)');
      const join = body.indexOf("rpc('join_default_instance'");
      expect(ask, f).toBeGreaterThan(-1);
      expect(ask, f).toBeLessThan(join);
    }
  });
  it('the migration never lowers, carries only the owner/admin/member ladder, and only the signed-in may call it', () => {
    const sql = read('infra/supabase/migrations-auto/0319-one-person-sees-one-house-from-either-sign-in.sql');
    expect(sql).toContain("f.role IN ('owner', 'admin', 'member')");
    expect(sql).toContain('ON CONFLICT (instance_id, user_id) DO NOTHING');
    expect(sql).toMatch(/REVOKE ALL ON FUNCTION public\.share_my_households_across_my_sign_ins\(\) FROM PUBLIC, anon;/);
    expect(sql).toMatch(/REVOKE ALL ON FUNCTION public\.mirror_sign_in_seats\(uuid, uuid\) FROM PUBLIC, anon, authenticated;/);
    expect(sql).not.toMatch(/DELETE\s+FROM/i);
    const ci = read('.github/workflows/ci.yml');
    expect(ci).toContain('infra/supabase/tests/0319-one-person-one-house-smoke.sql');
  });
});
