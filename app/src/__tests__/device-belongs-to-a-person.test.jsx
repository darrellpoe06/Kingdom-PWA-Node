// @vitest-environment jsdom
// =============================================================================
// The device register's editor assigns a device to a person (DR-0830), on the
// real DeviceInventory surface in jsdom.
// =============================================================================
// A governor opens Edit on a device: Belongs to lists the space's roster with
// Nobody assigned first; picking a member and saving sends ownerUserId on the
// device; the row's owner_user_id then feeds the person's record.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

const saved = [];
vi.mock('../lib/church-devices-sync.js', async (orig) => ({
  ...(await orig()),
  getDeviceAccess: async () => ({ signedIn: true, canSee: true, canEdit: true, tenantId: 'i-colg', role: 'owner' }),
  subscribeDevices: (cb) => { cb([]); return () => {}; },
  saveDevice: async (device) => { saved.push(device); return { updated: true }; },
}));
vi.mock('../lib/member-roles.js', async (orig) => ({
  ...(await orig()),
  listInstanceMembersStrict: async () => [
    { userId: 'u-ann', displayName: 'Sister Ann', email: 'ann@x', role: 'member' },
    { userId: 'u-bo', displayName: '', email: 'bo@x', role: 'admin' },
  ],
}));
vi.mock('../lib/supabase.js', () => {
  const stub = {
    auth: { getSession: async () => ({ data: { session: { user: { id: 'me' } } } }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }) },
    rpc: async () => ({ data: 'owner', error: null }),
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }), order: async () => ({ data: [], error: null }) }) }) }),
    channel: () => ({ on() { return this; }, subscribe() { return this; } }),
    removeChannel: () => {},
  };
  return { default: stub, supabase: stub, onAuthChange: (cb) => { cb({ user: { id: 'me' } }); return () => {}; } };
});

import DeviceInventory from '../components/DeviceInventory.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let container, root;
const settle = () => act(async () => { for (let i = 0; i < 8; i += 1) await Promise.resolve(); });
async function mount() {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(createElement(DeviceInventory)); });
  await settle();
  return container;
}
afterEach(async () => { if (root) await act(async () => root.unmount()); container?.remove(); root = null; saved.length = 0; });

describe('Belongs to, on the device editor', () => {
  it('lists the roster, nobody first; a pick is saved as ownerUserId', async () => {
    const el = await mount();
    const edit = Array.from(el.querySelectorAll('button')).find((b) => /^edit$/i.test((b.textContent || '').trim()));
    expect(edit, 'an Edit control on a device card').toBeTruthy();
    await act(async () => { edit.click(); });
    await settle();
    const owner = el.querySelector('[data-testid="dev-ed-owner"]');
    expect(owner, 'the Belongs to select renders').toBeTruthy();
    expect(Array.from(owner.options).map((o) => o.textContent)).toEqual(['Nobody assigned', 'Sister Ann', 'bo@x']);
    expect(owner.value).toBe('');
    await act(async () => { owner.value = 'u-ann'; owner.dispatchEvent(new Event('change', { bubbles: true })); });
    const save = Array.from(el.querySelectorAll('button')).find((b) => /^save/i.test((b.textContent || '').trim()));
    expect(save, 'a Save control').toBeTruthy();
    await act(async () => { save.click(); });
    await settle();
    expect(saved).toHaveLength(1);
    expect(saved[0].ownerUserId).toBe('u-ann');
  });
});
