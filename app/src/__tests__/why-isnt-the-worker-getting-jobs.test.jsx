// @vitest-environment jsdom
// =============================================================================
// "WHY ISN'T HE GETTING THEM?" — ANSWERED FROM THE ROWS (DR-1594)
// =============================================================================
// Darrell, 2026-11-19: "We add Coreyon as a 1099 worker and he is not getting
// the work orders!!!!!!!???!!! Isaiah Ramos either!!!!!!? Find and fix it!!!!!!"
// The four links a job travels (invited, signed in, permission held, job
// assigned), each read from a real row, and the one reason that stops a worker.
// =============================================================================
import { describe, it, expect, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { workerReach } from '../modules/properties/worker-reach.js';
import { loadWorkerGrants, loadWorkerReach } from '../modules/properties/worker-reach-cloud.js';
import WorkerReach from '../modules/properties/WorkerReach.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const HERE = dirname(fileURLToPath(import.meta.url));

const invite = (over = {}) => ({
  id: 'i1',
  instance_id: 'inst',
  role_label: 'field_worker',
  email: '15635550337@phone.poetech.us',
  invited_phone: '5635550337',
  display_name: 'Coreyon',
  capabilities: ['property.history', 'docs.add'],
  revoked: false,
  claimed_at: null,
  claimed_by: null,
  created_at: '2026-11-10T00:00:00Z',
  ...over,
});
const grant = (uid, capability = 'docs.add', setting = 'allow') => ({ grantee_user_id: uid, scope_ref: '*', capability, setting, role_label: 'field_worker' });
const job = (over = {}) => ({ id: 'j1', instance_id: 'inst', status: 'scheduled', assigned_to: null, assigned_to_label: null, ...over });
const one = (...a) => workerReach(...a)[0];

describe('each link, from the real rows', () => {
  it('PROVEN-TO-CATCH: an invite asking for nothing is named as the stop (the defect Coreyon met)', () => {
    const r = one([invite({ capabilities: [] })], { grants: [], jobs: [] });
    expect(r.state).toBe('blocked');
    expect(r.reason).toMatch(/grants nothing/);
  });

  it('not signed in yet: says how they sign in, and how many jobs wait on their name', () => {
    const r = one([invite()], { grants: [], jobs: [job({ assigned_to_label: ' coreyon ' }), job({ id: 'j2', assigned_to_label: 'Isaiah' })] });
    expect(r.state).toBe('waiting');
    expect(r.reason).toContain('(563) 555-0337');
    expect(r.reason).toMatch(/the job sent to their name becomes theirs then/);
    expect(r.waitingByName).toBe(1);
  });

  it('signed in with nothing held and nothing assigned is stopped', () => {
    const r = one([invite({ claimed_at: '2026-11-11T00:00:00Z', claimed_by: 'u-c' })], { grants: [grant('u-c', 'docs.add', 'deny')], jobs: [] });
    expect(r.state).toBe('blocked');
    expect(r.holds).toEqual([]);
  });

  it('signed in with permissions and no job: send one', () => {
    const r = one([invite({ claimed_at: '2026-11-11T00:00:00Z', claimed_by: 'u-c' })], { grants: [grant('u-c')], jobs: [] });
    expect(r.state).toBe('idle');
  });

  it('getting work: counts only OPEN jobs assigned to that account', () => {
    const r = one([invite({ claimed_at: '2026-11-11T00:00:00Z', claimed_by: 'u-c' })], {
      grants: [grant('u-c')],
      jobs: [job({ assigned_to: 'u-c' }), job({ id: 'j2', assigned_to: 'u-c', status: 'resolved' }), job({ id: 'j3', assigned_to: 'u-other' })],
    });
    expect(r.state).toBe('ok');
    expect(r.jobs).toBe(1);
  });

  it('a name two people share: the jobs sent to it are named as unlinked', () => {
    const rows = workerReach(
      [
        invite({ claimed_at: '2026-11-11T00:00:00Z', claimed_by: 'u-c' }),
        invite({ id: 'i2', email: 'other@x.test', invited_phone: null, display_name: 'coreyon' }),
      ],
      { grants: [grant('u-c')], jobs: [job({ assigned_to_label: 'Coreyon' })] }
    );
    const c = rows.find((r) => r.userId === 'u-c');
    expect(c.state).toBe('blocked');
    expect(c.reason).toMatch(/two people share/);
  });

  it('a shared name with nothing waiting on it stops nobody', () => {
    const rows = workerReach(
      [
        invite({ claimed_at: '2026-11-11T00:00:00Z', claimed_by: 'u-c' }),
        invite({ id: 'i2', email: 'other@x.test', invited_phone: null, display_name: 'Coreyon' }),
      ],
      { grants: [grant('u-c')], jobs: [job({ assigned_to: 'u-c' })] }
    );
    expect(rows.find((r) => r.userId === 'u-c').state).toBe('ok');
  });

  it('a read that failed is unknown, never "holds nothing"', () => {
    const r = one([invite({ claimed_at: '2026-11-11T00:00:00Z', claimed_by: 'u-c' })], { grants: null, jobs: [] });
    expect(r.state).toBe('unknown');
    expect(r.holds).toBeNull();
  });

  it('only live 1099 workers of this space, one row per person, stopped ones first', () => {
    const rows = workerReach(
      [
        invite({ id: 'a', display_name: 'Isaiah Ramos', invited_phone: '5635550338', email: '15635550338@phone.poetech.us', capabilities: [] }),
        invite({ id: 'b' }),
        invite({ id: 'b2', created_at: '2026-11-12T00:00:00Z' }),
        invite({ id: 'c', revoked: true, invited_phone: '5635550339', email: '15635550339@phone.poetech.us' }),
        invite({ id: 'd', role_label: 'tenant', invited_phone: '5635550340', email: '15635550340@phone.poetech.us' }),
        invite({ id: 'e', instance_id: 'other', invited_phone: '5635550341', email: '15635550341@phone.poetech.us' }),
      ],
      { instanceId: 'inst', grants: [], jobs: [] }
    );
    expect(rows.map((r) => r.name)).toEqual(['Isaiah Ramos', 'Coreyon']);
  });
});

describe('the reads', () => {
  it("asks for this space's worker grants only", async () => {
    const eqs = [];
    const q = {
      eq: (c, v) => {
        eqs.push([c, v]);
        return q;
      },
      then: (res) => res({ data: [grant('u')], error: null }),
    };
    const client = {
      from: (t) => {
        expect(t).toBe('delegated_capabilities');
        return { select: () => q };
      },
    };
    expect(await loadWorkerGrants('inst', client)).toEqual({ ok: true, grants: [grant('u')] });
    expect(eqs).toEqual([
      ['instance_id', 'inst'],
      ['role_label', 'field_worker'],
    ]);
  });
  it('a failed read comes back null, so the screen says unknown', async () => {
    const r = await loadWorkerReach('inst', {
      grants: async () => ({ ok: false }),
      work: async () => ({ ok: true, requests: [job(), job({ id: 'z', instance_id: 'other' })] }),
    });
    expect(r.grants).toBeNull();
    expect(r.jobs.map((j) => j.id)).toEqual(['j1']);
  });
});

describe('the panel on People', () => {
  let container, root;
  afterEach(() => {
    try {
      act(() => root && root.unmount());
    } catch {
      /* noop */
    }
    if (container) container.remove();
  });

  it('PROVEN-TO-CATCH: shows each worker, each link, and the reason, from the rows it read', async () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    const load = vi.fn(async () => ({ grants: [], jobs: [] }));
    await act(async () => {
      root.render(
        createElement(WorkerReach, {
          instanceId: 'inst',
          load,
          invites: [
            invite({ capabilities: [] }),
            invite({ id: 'i2', display_name: 'Isaiah Ramos', invited_phone: '5635550338', email: '15635550338@phone.poetech.us' }),
          ],
        })
      );
    });
    expect(load).toHaveBeenCalledWith('inst');
    const rows = container.querySelectorAll('[data-testid="worker-reach-row"]');
    expect(rows).toHaveLength(2);
    expect(rows[0].getAttribute('data-state')).toBe('blocked');
    expect(container.textContent).toContain('asked for nothing');
    expect(container.textContent).toContain('Isaiah Ramos has not signed in yet');
  });

  it('is absent when there is no 1099 worker', async () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => {
      root.render(createElement(WorkerReach, { instanceId: 'inst', load: async () => ({ grants: [], jobs: [] }), invites: [] }));
    });
    expect(container.querySelector('[data-testid="worker-reach"]')).toBeNull();
  });

  it('is wired on People for the real owner', () => {
    const src = readFileSync(join(HERE, '..', 'modules', 'properties', 'PropertiesApp.jsx'), 'utf8');
    expect(src).toMatch(/realRole === 'owner' && !previewing && <WorkerReach invites=\{invites\}/);
  });
});
