// =============================================================================
// ChurchMembers — the Love Corner door governs itself, rendered (DR-0347)
// =============================================================================
// Mounts the real tab with the server's answers stubbed at the sync seams
// (list_my_admin_instances, list_instance_members, list_member_capabilities,
// instance_invites, list_pending_claims, get_profile) and proves, on the DOM:
// signed out → a sign-in note; a signed-in member → the way in without
// numbers and no People/Invite; an owner → live counts beside each step,
// people grouped top-down with pictures, a standing control that calls
// set_member_role, may / may-not lists, an extra-right box that calls
// set_member_capability, an invite that calls invite_to_church, and a claim
// that confirms.
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

let session = null;
let spaces = [];
const calls = { setRole: [], setCap: [], invite: [], confirm: [], remove: [] };
let grants = [];

vi.mock('../lib/supabase.js', () => ({
  onAuthChange: (cb) => { cb(session); return () => {}; },
  supabase: {
    from: () => ({ select: () => ({ eq: async () => ({ data: [
      { id: 'inv1', email: 'new@colg.org', role: 'member', accepted_at: null, expires_at: '2999-01-01T00:00:00Z' },
      { id: 'inv2', email: 'old@colg.org', role: 'member', accepted_at: '2026-01-01T00:00:00Z', expires_at: '2999-01-01T00:00:00Z' },
    ], error: null }) }) }),
    rpc: async () => ({ data: null, error: null }),
  },
}));
vi.mock('../lib/member-roles.js', async (orig) => ({
  ...(await orig()),
  listMyAdminInstances: async () => spaces,
  listInstanceMembersStrict: async () => [
    { userId: 'me', displayName: 'Darrell', email: 'darrell@x', role: 'owner' },
    { userId: 'u-ann', displayName: 'Sister Ann', email: 'ann@x', role: 'member' },
    { userId: 'u-bo', displayName: 'Brother Bo', email: 'bo@x', role: 'admin' },
    { userId: 'u-vi', displayName: 'Vi', email: 'vi@x', role: 'viewer' },
  ],
  listMemberCapabilities: async () => grants,
  setMemberRole: async (inst, user, role) => { calls.setRole.push([inst, user, role]); return { status: 'changed', role }; },
  setMemberCapability: async (inst, user, cap, on) => { calls.setCap.push([inst, user, cap, on]); grants = on ? [...grants, { userId: user, capability: cap }] : grants.filter((g) => !(g.userId === user && g.capability === cap)); return { status: on ? 'granted' : 'revoked' }; },
  inviteToSpace: async (type, email, role, inst) => { calls.invite.push([type, email, role, inst]); return { ok: true, kind: 'church', email, role }; },
  removeInstanceMember: async (inst, user) => { calls.remove.push([inst, user]); return { status: 'removed' }; },
}));
vi.mock('../lib/family-invite.js', async (orig) => ({
  ...(await orig()),
  listPendingClaims: async () => ({ ok: true, claims: [{ invite_id: 'cl1', email: 'kid@x', claimed_email: 'kid@x', role: 'member' }] }),
  confirmInvite: async (id) => { calls.confirm.push(id); return { ok: true, instanceId: 'c1' }; },
}));
vi.mock('../lib/profiles-sync.js', async (orig) => ({
  ...(await orig()),
  loadProfile: async (id) => (id === 'u-ann' ? { userId: 'u-ann', displayName: 'Ann of the Choir', photoThumb: 'data:image/jpeg;base64,/9j/4AAQ' } : null),
}));

import ChurchMembers from '../components/ChurchMembers.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let container, root;
async function mount() {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(createElement(ChurchMembers)); });
  await settle();
}
const settle = () => act(async () => { for (let i = 0; i < 6; i += 1) await Promise.resolve(); });
const click = (el) => act(async () => { el.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); });
const chip = (label) => [...container.querySelectorAll('[role="tab"]')].find((b) => (b.textContent || '').includes(label));

beforeEach(() => { calls.setRole = []; calls.setCap = []; calls.invite = []; calls.confirm = []; calls.remove = []; grants = [{ userId: 'u-ann', capability: 'write:choir' }]; });
afterEach(async () => { if (root) await act(async () => root.unmount()); if (container) container.remove(); root = null; container = null; });

describe('ChurchMembers — signed out and a plain member', () => {
  it('signed out: a sign-in note, no records read', async () => {
    session = null; spaces = [];
    await mount();
    expect(container.textContent).toMatch(/Sign in to see it/);
    expect(container.querySelector('[data-way-in]')).toBeNull();
  });
  it('a signed-in member sees the way in without numbers, and no People or Invite', async () => {
    session = { user: { id: 'u-ann' } }; spaces = [{ instanceType: 'church', instanceId: 'c1', role: 'member' }];
    await mount();
    expect(container.querySelector('[data-not-governor]')).not.toBeNull();
    const steps = [...container.querySelectorAll('[data-step]')].map((li) => li.getAttribute('data-step'));
    expect(steps).toEqual(['leader', 'invite', 'signin', 'claim', 'govern']);
    expect(container.querySelector('[data-step-count]')).toBeNull();
    expect(chip('People')).toBeUndefined();
    expect(chip('Invite')).toBeUndefined();
  });
});

describe('ChurchMembers — an owner governs from the door', () => {
  beforeEach(() => { session = { user: { id: 'me' } }; spaces = [{ instanceType: 'family', instanceId: 'f1', role: 'owner' }, { instanceType: 'church', instanceId: 'c1', role: 'owner', displayName: 'Love Corner' }]; });

  it('the way in carries live counts from the rows: 2 leaders, 1 open invite, 4 people, 1 claim, 2 adjustable', async () => {
    await mount();
    expect(container.textContent).toMatch(/You govern this door as Owner/);
    const count = (id) => container.querySelector(`[data-step-count="${id}"] span`).textContent;
    expect(count('leader')).toBe('2');
    expect(count('invite')).toBe('1');   // inv2 is accepted → not open
    expect(count('signin')).toBe('4');
    expect(count('claim')).toBe('1');
    expect(count('govern')).toBe('2');
    expect(container.querySelector('[data-count-role="owner"]').textContent).toMatch(/1 Owner/);
  });

  it('People: grouped top-down with pictures, a standing control, and may / may-not per person', async () => {
    await mount();
    await click(chip('People'));
    await settle();
    const groups = [...container.querySelectorAll('[data-role-group]')].map((g) => g.getAttribute('data-role-group'));
    expect(groups).toEqual(['owner', 'admin', 'member', 'viewer']);
    const ann = container.querySelector('[data-person="u-ann"]');
    expect(ann.querySelector('img[src^="data:image/jpeg"]')).not.toBeNull();   // her picture
    expect(ann.textContent).toMatch(/Ann of the Choir/);                        // her chosen name
    // an owner cannot change themselves; the owner CAN change a member
    expect(container.querySelector('[data-person="me"] select')).toBeNull();
    const sel = ann.querySelector('select');
    expect(sel).not.toBeNull();
    await act(async () => { sel.value = 'viewer'; sel.dispatchEvent(new window.Event('change', { bubbles: true })); });
    expect(calls.setRole).toEqual([['c1', 'u-ann', 'viewer']]);
    // rights: choir is an extra right she holds; bus she may not
    await click([...ann.querySelectorAll('button')].find((b) => b.textContent === 'Rights'));
    expect(ann.querySelector('[data-may]').textContent).toMatch(/Choir — edit \(extra right\)/);
    expect(ann.querySelector('[data-may-not]').textContent).toMatch(/Bus ministry — edit/);
    // an extra-right box calls the guarded RPC and the box follows the re-read grants
    const box = ann.querySelector('input[data-right="write:bus"]');
    expect(box.checked).toBe(false);
    await act(async () => { box.click(); });
    await settle();
    expect(calls.setCap).toEqual([['c1', 'u-ann', 'write:bus', true]]);
    expect(container.querySelector('[data-person="u-ann"] input[data-right="write:bus"]').checked).toBe(true);
  });

  it('Remove: two taps, never on an owner or yourself; the RPC is called with the church id', async () => {
    await mount();
    await click(chip('People'));
    await settle();
    // the owner's own row and the owner never carry Remove
    await click([...container.querySelectorAll('[data-person="me"] button')].find((b) => b.textContent === 'Rights'));
    expect(container.querySelector('[data-person="me"] [data-remove]')).toBeNull();
    const ann = container.querySelector('[data-person="u-ann"]');
    await click([...ann.querySelectorAll('button')].find((b) => b.textContent === 'Rights'));
    const btn = ann.querySelector('[data-remove-button]');
    expect(btn.textContent).toBe('Remove');
    await click(btn);
    expect(calls.remove).toEqual([]);                          // the first tap only asks
    expect(ann.textContent).toMatch(/Remove Ann of the Choir from this door\?/);
    await click([...ann.querySelectorAll('button')].find((b) => b.textContent === 'Keep'));
    expect(ann.querySelector('[data-remove-button]').textContent).toBe('Remove');
    await click(ann.querySelector('[data-remove-button]'));
    await click(ann.querySelector('[data-remove-button]'));
    await settle();
    expect(calls.remove).toEqual([['c1', 'u-ann']]);
  });

  it('Invite: email + standing → invite_to_church on this door; open invites and a claim to confirm', async () => {
    await mount();
    await click(chip('Invite'));
    await settle();
    expect(container.querySelector('[data-open-invites]').textContent).toMatch(/new@colg.org/);
    expect(container.querySelector('[data-open-invites]').textContent).not.toMatch(/old@colg.org/);
    const input = container.querySelector('#cm-invite-email');
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, 'pastor@colg.org');
      input.dispatchEvent(new window.Event('input', { bubbles: true }));
    });
    const btn = [...container.querySelectorAll('button:not([role="tab"])')].find((b) => b.textContent === 'Invite');
    expect(btn.disabled).toBe(false);
    await click(btn);
    await settle();
    expect(calls.invite).toEqual([['church', 'pastor@colg.org', 'member', 'c1']]);
    expect(container.querySelector('[data-invite-note]').textContent).toMatch(/Invited pastor@colg.org as Member/);
    const confirm = container.querySelector('[data-claims] button');
    await click(confirm);
    expect(calls.confirm).toEqual(['cl1']);
  });
});
