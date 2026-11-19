// @vitest-environment jsdom
// =============================================================================
// A 1099 WORKER GETS THE JOB SENT TO THEM (DR-1594)
// =============================================================================
// Darrell, 2026-11-19: "We add Coreyon as a 1099 worker and he is not getting
// the work orders!!!!!!!???!!! Isaiah Ramos either!!!!!!? Find and fix it!!!!!!"
//
// Traced: the door's invite form started with both capability boxes
// unchecked, so an invite sent as it stood carried nothing and the worker was
// granted nothing; dispatching a job set assigned_to, and no policy read it; a
// job sent by name before the worker signed in never got their account. This
// file pins the app half. The database half is
// infra/supabase/tests/0337-worker-assigned-jobs-smoke.sql, and the test at the
// bottom pins what that migration must keep saying.
// =============================================================================
import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ROLE_CEILING, DEFAULT_INVITE_CAPS, defaultInviteCapabilities, inviteGrantsNothing,
} from '../modules/properties/model.js';
import { whyNotReady } from '../modules/properties/people.js';
import { inviteToProperties, loadMyGrants } from '../modules/properties/cloud.js';
import { PROPERTY_PLACEMENTS } from '../lib/people-placement.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const HERE = dirname(fileURLToPath(import.meta.url));
const read = (...p) => readFileSync(join(HERE, '..', '..', '..', ...p), 'utf8');

// ── 1. WHAT THE FORM STARTS WITH ────────────────────────────────────────────
describe('an invitation starts with the boxes a worker needs', () => {
  it('PROVEN-TO-CATCH: a 1099 worker starts with the field worker\'s whole ceiling', () => {
    expect(defaultInviteCapabilities('field_worker').sort()).toEqual([...ROLE_CEILING.field_worker].sort());
    expect(defaultInviteCapabilities('field_worker')).toHaveLength(2);
  });

  it('a manager starts with what PoeTech\'s own "People you know" already sends', () => {
    const fromPeople = PROPERTY_PLACEMENTS.find((p) => p.roleLabel === 'manager').capabilities;
    expect(defaultInviteCapabilities('manager').sort()).toEqual([...fromPeople].sort());
    expect(defaultInviteCapabilities('manager')).not.toContain('rent.adjust');
  });

  it('the two doors into one table agree on the 1099 worker', () => {
    const fromPeople = PROPERTY_PLACEMENTS.find((p) => p.roleLabel === 'field_worker').capabilities;
    expect([...DEFAULT_INVITE_CAPS.field_worker].sort()).toEqual([...fromPeople].sort());
  });

  it('tenants and household members hold no grant (their reach is their tenancy)', () => {
    expect(defaultInviteCapabilities('tenant')).toEqual([]);
    expect(defaultInviteCapabilities('household')).toEqual([]);
  });

  it('every default sits inside the role\'s ceiling', () => {
    for (const [role, caps] of Object.entries(DEFAULT_INVITE_CAPS)) {
      for (const c of caps) expect(ROLE_CEILING[role]).toContain(c);
    }
  });
});

// ── 2. AN INVITE THAT GRANTS NOTHING IS REFUSED ─────────────────────────────
describe('a worker invited with nothing checked is refused before it is written', () => {
  it('PROVEN-TO-CATCH: a field worker with no capability grants nothing', () => {
    expect(inviteGrantsNothing('field_worker', [])).toBe(true);
    expect(inviteGrantsNothing('field_worker', ['rent.adjust'])).toBe(true); // outside the ceiling counts as none
    expect(inviteGrantsNothing('field_worker', ['docs.add'])).toBe(false);
    expect(inviteGrantsNothing('manager', [])).toBe(true);
    expect(inviteGrantsNothing('tenant', [])).toBe(false);
  });

  it('the dead button says why, in words', () => {
    expect(whyNotReady({ name: 'Coreyon', identified: true, by: 'phone', door: true, role: 'field_worker', caps: [] }))
      .toMatch(/Check at least one thing they may do/);
    expect(whyNotReady({ name: 'Coreyon', identified: true, by: 'phone', door: true, role: 'field_worker', caps: ['docs.add'] }))
      .toBeNull();
    expect(whyNotReady({ name: 'Tina', identified: true, by: 'phone', door: true, role: 'tenant', caps: [] })).toBeNull();
  });

  it('PROVEN-TO-CATCH: the writer refuses it and never touches the table', async () => {
    let inserted = 0;
    const client = {
      auth: { getUser: async () => ({ data: { user: { id: 'owner' } } }) },
      from: () => ({ insert: () => { inserted += 1; return { select: () => ({ single: async () => ({ data: { id: 'x' }, error: null }) }) }; } }),
    };
    const bad = await inviteToProperties({ instanceId: 'i', phone: '5635550337', roleLabel: 'field_worker', capabilities: [] }, client);
    expect(bad).toMatchObject({ ok: false, reason: 'no-capabilities' });
    expect(inserted).toBe(0);
    const good = await inviteToProperties({ instanceId: 'i', phone: '5635550337', roleLabel: 'field_worker', capabilities: ['property.history', 'docs.add'] }, client);
    expect(good.ok).toBe(true);
    expect(inserted).toBe(1);
    const tenant = await inviteToProperties({ instanceId: 'i', phone: '5635550338', roleLabel: 'tenant', capabilities: [] }, client);
    expect(tenant.ok).toBe(true);
  });
});

// ── 2b. THE OWNER STAYS THE OWNER ───────────────────────────────────────────
describe('a worker\'s grants never make the landlord a worker', () => {
  // 0075 lets an owner read EVERY grant in his instance. The role is read
  // grants-first, so before this a landlord whose workers held grants met
  // the worker's face in his own app. The backfill in 0337 creates exactly
  // those rows, so the read is narrowed to the signed-in person's own.
  const fake = (rows, uid) => {
    const calls = [];
    return {
      calls,
      auth: { getUser: async () => ({ data: { user: uid ? { id: uid } : null } }) },
      from: () => ({ select: () => ({ eq: async (col, v) => { calls.push([col, v]); return { data: rows.filter((r) => r[col] === v), error: null }; } }) }),
    };
  };
  const rows = [
    { grantee_user_id: 'worker', scope_ref: '*', capability: 'docs.add', setting: 'allow', role_label: 'field_worker' },
    { grantee_user_id: 'worker', scope_ref: '*', capability: 'property.history', setting: 'allow', role_label: 'field_worker' },
  ];

  it('PROVEN-TO-CATCH: the owner reads no grant of his own, though he can read his workers\'', async () => {
    const c = fake(rows, 'owner');
    const r = await loadMyGrants(c);
    expect(c.calls).toEqual([['grantee_user_id', 'owner']]);
    expect(r).toMatchObject({ ok: true, grants: [] });
  });

  it('the worker reads his own', async () => {
    const r = await loadMyGrants(fake(rows, 'worker'));
    expect(r.grants.sort()).toEqual(['docs.add', 'property.history']);
    expect(r.roleLabel).toBe('field_worker');
  });

  it('signed out reads nothing, and is not a failed read', async () => {
    const c = fake(rows, null);
    expect(await loadMyGrants(c)).toMatchObject({ ok: true, grants: [] });
    expect(c.calls).toEqual([]);
  });
});

// ── 3. THE SCREEN ───────────────────────────────────────────────────────────
describe('the door\'s invite form as the landlord meets it', () => {
  let container, root;
  afterEach(() => {
    try { act(() => root && root.unmount()); } catch { /* noop */ }
    if (container) container.remove();
    container = null; root = null;
  });
  const door = { id: 'door-1', instance_id: 'inst', rental_ref: 'slug-1', property_label: '805 N Prospect' };
  const setValue = (el, v) => {
    const proto = el.tagName === 'SELECT' ? window.HTMLSelectElement.prototype : window.HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
    el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
  };

  async function mount(onInvite) {
    const mod = await import('../modules/properties/PropertiesApp.jsx');
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => { root.render(createElement(mod.__PeopleTab, { door, place: door, invites: [], onInvite, onRevoke: () => {} })); });
  }

  it('PROVEN-TO-CATCH: choosing "1099 worker" shows both boxes CHECKED, and the invite carries both', async () => {
    let sent = null;
    await mount((p) => { sent = p; });
    await act(async () => { setValue(container.querySelector('select[aria-label="What they are"]'), 'field_worker'); });
    const history = container.querySelector('[data-testid="invite-cap-property.history"]');
    const docs = container.querySelector('[data-testid="invite-cap-docs.add"]');
    expect(history.checked, 'property history starts checked').toBe(true);
    expect(docs.checked, 'job documentation starts checked').toBe(true);
    await act(async () => { setValue(container.querySelector('[data-testid="invite-name"]'), 'Coreyon'); });
    await act(async () => { setValue(container.querySelector('input[type="tel"]'), '5635550337'); });
    const write = [...container.querySelectorAll('button')].find((b) => /write the invitation/i.test(b.textContent));
    expect(write.disabled).toBe(false);
    await act(async () => { write.click(); });
    expect(sent.roleLabel).toBe('field_worker');
    expect([...sent.capabilities].sort()).toEqual(['docs.add', 'property.history']);
  }, 30000); // the first test to import the whole module pays its load

  it('unchecking every box kills the button and says why', async () => {
    await mount(() => {});
    await act(async () => { setValue(container.querySelector('select[aria-label="What they are"]'), 'field_worker'); });
    await act(async () => { setValue(container.querySelector('[data-testid="invite-name"]'), 'Isaiah'); });
    await act(async () => { setValue(container.querySelector('input[type="tel"]'), '5635550338'); });
    await act(async () => { container.querySelector('[data-testid="invite-cap-property.history"]').click(); });
    await act(async () => { container.querySelector('[data-testid="invite-cap-docs.add"]').click(); });
    const write = [...container.querySelectorAll('button')].find((b) => /write the invitation/i.test(b.textContent));
    expect(write.disabled).toBe(true);
    expect(container.querySelector('[data-testid="invite-blocked"]').textContent).toMatch(/Check at least one thing/);
  });
});

// ── 4. THE DATABASE HALF STAYS WHAT IT SAYS ─────────────────────────────────
describe('migration 0337 keeps its walls', () => {
  const sql = read('infra', 'supabase', 'migrations-auto', '0337-a-worker-reads-the-job-sent-to-them.sql');
  const smoke = read('infra', 'supabase', 'tests', '0337-worker-assigned-jobs-smoke.sql');

  it('the assigned worker reads by assigned_to = auth.uid() and nothing wider', () => {
    expect(sql).toMatch(/tenant_maintenance_requests_assigned_read[\s\S]*?USING \(assigned_to IS NOT NULL AND assigned_to = auth\.uid\(\)\)/);
    expect(sql).toMatch(/request_documentation_assigned_insert[\s\S]*?author_user_id = auth\.uid\(\)/);
    expect(sql).not.toMatch(/CREATE POLICY \w+ ON public\.tenant_maintenance_requests\s+FOR UPDATE/);
  });

  it('the backfill touches only live field_worker invites with no capability, and keeps a deny', () => {
    expect(sql).toMatch(/role_label = 'field_worker'\s+AND revoked = false\s+AND coalesce\(cardinality\(capabilities\), 0\) = 0/);
    expect(sql).toMatch(/ON CONFLICT \(instance_id, grantee_user_id, scope_ref, capability\) DO NOTHING/);
  });

  it('a name shared by two people is never guessed', () => {
    expect(sql).toMatch(/IF same <> 1 THEN RETURN 0; END IF;/);
  });

  it('the smoke asserts each wall and prints its PASS line', () => {
    for (const wall of ['W2 (no grant) reads his job on door H', "W1 reads W2's job",'N reads W1', 'an ambiguous name was matched', 'a deliberate deny was overwritten']) {
      expect(smoke.replace(/''/g, "'")).toContain(wall);
    }
    expect(smoke).toContain("RAISE NOTICE 'WORKER ASSIGNED JOBS SMOKE: PASS'");
  });
});
