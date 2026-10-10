// =============================================================================
// A door shares its cameras with its household (DR-0841)
// =============================================================================
// Darrell 2026-10-09: "add the Wyze cameras for 805 Prospect Ave Champaign
// Illinois apartments cameras specifically... porch etc... available when we
// want the tenants to have access to the cameras."
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { doorGrantName, suggestDoorCameras, grantNote, grantIdOf, doorCameraState, setDoorCameraGrant, whoSeesDoorCameras } from '../modules/properties/door-cameras.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const H = vi.hoisted(() => ({ key: 'fam-key', list: [], listStatus: 200, grants: [], revoked: [], saved: [], grantOk: true }));
vi.mock('../lib/nas-photos.js', () => ({ bridgeToken: () => H.key }));
vi.mock('../lib/cameras.js', async (orig) => ({
  ...(await orig()),
  fetchWithTimeout: async () => ({ status: H.listStatus, json: async () => ({ cameras: H.list, count: H.list.length }) }),
  createGrant: async (args, token) => { H.grants.push({ ...args, token }); return H.grantOk ? { ok: true, token: 'g.abcdefabcdef.' + '1'.repeat(32) } : { ok: false, reason: 'nas-refused' }; },
  revokeGrant: async (id, token) => { H.revoked.push([id, token]); return { ok: true }; },
  saveGrantToken: (t) => { H.saved.push(t); return true; },
}));
vi.mock('../lib/supabase.js', () => ({
  default: { from: () => ({ update: () => ({ eq: async () => ({ error: null }) }) }), auth: { getSession: async () => ({ data: { session: null } }) } },
  phoneLoginEmail: () => '',
  normalizePhone: (p) => String(p || '').replace(/\D+/g, ''),
}));

import { DoorCamerasTab, TenantCamerasTab } from '../modules/properties/DoorCameras.jsx';

const DOOR = { id: 't1', instance_id: 'i1', property_label: '805 North Prospect Avenue', unit_label: 'Apt 4', camera_grant: null, camera_grant_note: null };
const TOKEN = 'g.abcdefabcdef.' + '1'.repeat(32);
const CAMS = [{ id: '805_porch_cam', name: '805 Porch Cam' }, { id: '805_back_door', name: '805 Back Door' }, { id: 'front_yard', name: 'front yard' }, { id: 'kitchen_2', name: 'Kitchen 2' }];

describe('what a door suggests, how its grant is named, what it says (pure)', () => {
  it('names the grant for the door, suggests the cameras carrying its address, writes the note', () => {
    expect(doorGrantName(DOOR)).toBe('805 North Prospect Avenue · Apt 4');
    expect(doorGrantName({})).toBe('a door');
    expect(suggestDoorCameras(CAMS, DOOR)).toEqual(['805_porch_cam', '805_back_door']);
    expect(suggestDoorCameras(CAMS, { property_label: '1003 Koehn Dr' })).toEqual([]);
    expect(suggestDoorCameras(CAMS, { property_label: 'Kitchen House' })).toEqual(['kitchen_2']);
    expect(grantNote(CAMS, ['805_porch_cam', '805_back_door'], { days: 365 })).toBe('2 cameras: 805 Porch Cam, 805 Back Door for 365 days');
    expect(grantNote(CAMS, ['front_yard'], { days: 0 })).toBe('1 camera: front yard, until taken back');
  });
  it('reads the grant id from a token and the door\'s state from its row', () => {
    expect(grantIdOf(TOKEN)).toBe('abcdefabcdef');
    expect(grantIdOf('not-a-token')).toBe('');
    expect(doorCameraState(DOOR)).toEqual({ state: 'none', token: '', note: '' });
    expect(doorCameraState({ ...DOOR, camera_grant: TOKEN, camera_grant_note: '2 cameras' })).toEqual({ state: 'shared', token: TOKEN, note: '2 cameras' });
    expect(doorCameraState({ ...DOOR, camera_grant: 'garbage' }).state).toBe('none');
  });
  it('writes the grant and the note onto the tenancy row, and clears both', async () => {
    const calls = [];
    const client = { from: (t) => ({ update: (patch) => ({ eq: async (col, v) => { calls.push([t, patch, col, v]); return { error: null }; } }) }) };
    expect(await setDoorCameraGrant('t1', { token: TOKEN, note: 'n' }, client)).toEqual({ ok: true });
    expect(await setDoorCameraGrant('t1', {}, client)).toEqual({ ok: true });
    expect(calls).toEqual([['rental_tenancies', { camera_grant: TOKEN, camera_grant_note: 'n' }, 'id', 't1'], ['rental_tenancies', { camera_grant: null, camera_grant_note: null }, 'id', 't1']]);
  });
});

describe('the landlord shares and takes back; the household watches', () => {
  let container; let root;
  afterEach(() => { if (root) act(() => root.unmount()); if (container) container.remove(); root = container = null; Object.assign(H, { key: 'fam-key', list: [], listStatus: 200, grants: [], revoked: [], saved: [], grantOk: true }); });
  async function mount(el) {
    container = document.createElement('div'); document.body.appendChild(container);
    await act(async () => { root = createRoot(container); root.render(el); });
    for (let i = 0; i < 6; i += 1) await act(async () => { await Promise.resolve(); });
  }
  const text = () => container.textContent || '';

  it('the landlord sees the NAS list with the door\'s cameras ticked, shares them, and the door keeps the grant and the note', async () => {
    H.list = CAMS;
    const changes = [];
    await mount(createElement(DoorCamerasTab, { door: DOOR, onChange: async (p) => { changes.push(p); return { ok: true }; } }));
    const boxes = Array.from(container.querySelectorAll('[data-testid="door-cameras-pick"] input'));
    expect(boxes.map((b) => b.checked)).toEqual([true, true, false, false]);
    expect(container.querySelector('[data-testid="door-cameras-share"]').textContent).toBe('Share 2 with this door');
    await act(async () => { container.querySelector('[data-testid="door-cameras-share"]').click(); });
    for (let i = 0; i < 6; i += 1) await act(async () => { await Promise.resolve(); });
    // the NAS list comes back sorted by name, so Back Door precedes Porch Cam
    expect(H.grants).toEqual([{ name: '805 North Prospect Avenue · Apt 4', cameras: ['805_back_door', '805_porch_cam'], days: 365, actions: false, token: 'fam-key' }]);
    expect(changes).toEqual([{ token: TOKEN, note: '2 cameras: 805 Back Door, 805 Porch Cam for 365 days' }]);
    expect(container.querySelector('[data-testid="door-cameras-msg"]').textContent).toContain('Shared with this door: 2 cameras');
  });

  it('a door already sharing shows what, and Take back revokes the grant on the NAS and clears the row', async () => {
    H.list = CAMS;
    const changes = [];
    await mount(createElement(DoorCamerasTab, { door: { ...DOOR, camera_grant: TOKEN, camera_grant_note: '2 cameras: 805 Porch Cam, 805 Back Door for 365 days' }, onChange: async (p) => { changes.push(p); return { ok: true }; } }));
    expect(container.querySelector('[data-testid="door-cameras-shared"]').textContent).toContain('Shared now: 2 cameras');
    await act(async () => { container.querySelector('[data-testid="door-cameras-take-back"]').click(); });
    for (let i = 0; i < 6; i += 1) await act(async () => { await Promise.resolve(); });
    expect(H.revoked).toEqual([['abcdefabcdef', 'fam-key']]);
    expect(changes).toEqual([{ token: null, note: null }]);
    expect(text()).toContain('Taken back');
  });

  it('without a family key on this device, or a NAS that does not answer, the landlord is told and nothing is minted', async () => {
    H.key = '';
    await mount(createElement(DoorCamerasTab, { door: DOOR, onChange: async () => ({ ok: true }) }));
    expect(text()).toContain('holds no family camera key');
    expect(container.querySelector('[data-testid="door-cameras-share"]')).toBeNull();
    await act(async () => root.unmount()); root = null; container.remove();
    H.key = 'fam-key'; H.listStatus = 503;
    await mount(createElement(DoorCamerasTab, { door: DOOR, onChange: async () => ({ ok: true }) }));
    expect(text()).toContain('did not answer the camera list (http-503)');
    expect(H.grants).toEqual([]);
  });

  // Darrell, 2026-10-10: "Cameras tab shows no Cameras!!!!!! It allows giving
  // access to who?!!!!!!!!" The unit had no tenancy record, so the list was
  // never read and the tab said the NAS "did not answer (no-door)" while the
  // NAS was listing 31 cameras; and nothing said who would see them.
  it('PROVEN-TO-CATCH: an empty unit (no tenancy record) still reads the NAS list and suggests its cameras', async () => {
    H.list = CAMS;
    const APT2 = { id: 'r-apt2', instance_id: 'i1', display_name: '805 North Prospect Avenue Apt 2', address: '805 North Prospect Avenue', unit: 'Apt 2' };
    await mount(createElement(DoorCamerasTab, { door: null, place: APT2, onChange: async () => ({ ok: true }) }));
    expect(text()).not.toContain('no-door');
    const boxes = Array.from(container.querySelectorAll('[data-testid="door-cameras-pick"] input'));
    expect(boxes).toHaveLength(4);
    expect(boxes.filter((b) => b.checked)).toHaveLength(2);
    expect(container.querySelector('[data-testid="door-cameras-count"]').textContent).toBe('4 cameras on the NAS; 2 ticked for this door.');
    // Nobody is on the door, and the tab says so instead of implying a household.
    expect(container.querySelector('[data-testid="door-cameras-nobody"]').textContent).toContain('Nobody signs into this door yet');
  });

  it('names exactly who will see them: the tenant and household on this door, never a worker', async () => {
    H.list = CAMS;
    const people = [
      { name: 'Jordan Reed', roleLabel: 'tenant', roleName: 'Tenant', joined: true },
      { name: 'Sam Reed', roleLabel: 'household', roleName: 'Household member', joined: false },
      { name: 'Mike Handy', roleLabel: 'field_worker', roleName: '1099 worker', joined: true },
    ];
    await mount(createElement(DoorCamerasTab, { door: DOOR, people, onChange: async () => ({ ok: true }) }));
    const who = Array.from(container.querySelectorAll('[data-testid="door-cameras-viewer"]')).map((n) => n.textContent);
    expect(who).toEqual(['Jordan Reed · Tenant · signed in', 'Sam Reed · Household member · has not signed in yet']);
    expect(container.querySelector('[data-testid="door-cameras-who"]').textContent).toContain('A 1099 worker, a guest and an applicant never do');
  });

  it('the tenant on the record counts even before an invite, once; an empty NAS list is said, not drawn blank', async () => {
    expect(whoSeesDoorCameras({ door: { tenant_name: 'A. Tenant' }, people: [] })).toEqual([{ name: 'A. Tenant', role: 'Tenant on the record', joined: false }]);
    expect(whoSeesDoorCameras({ door: { tenant_name: 'Jordan Reed' }, people: [{ name: 'Jordan Reed', roleLabel: 'tenant', roleName: 'Tenant', joined: true }] })).toHaveLength(1);
    expect(doorGrantName({ display_name: '805 North Prospect Avenue Apt 2', unit: 'Apt 2' })).toBe('805 North Prospect Avenue Apt 2');
    H.list = [];
    await mount(createElement(DoorCamerasTab, { door: DOOR, onChange: async () => ({ ok: true }) }));
    expect(container.querySelector('[data-testid="door-cameras-none"]').textContent).toContain('lists no cameras');
  });

  it('the household sees the cameras surface on the door\'s grant alone, and is told when none is shared', async () => {
    const rendered = [];
    await mount(createElement(TenantCamerasTab, { door: { ...DOOR, camera_grant: TOKEN, camera_grant_note: '2 cameras: 805 Porch Cam, 805 Back Door for 365 days' }, renderCameras: (t) => { rendered.push(t); return createElement('div', { 'data-testid': 'fake-cameras' }, 'live tiles'); } }));
    expect(H.saved).toEqual([TOKEN]);
    expect(rendered).toEqual([TOKEN]);
    expect(container.querySelector('[data-testid="door-cameras-surface"] [data-testid="fake-cameras"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="door-cameras-tenant-note"]').textContent).toContain('805 Porch Cam');
    await act(async () => root.unmount()); root = null; container.remove();
    await mount(createElement(TenantCamerasTab, { door: { ...DOOR, camera_grant: TOKEN }, renderCameras: null }));
    expect(container.querySelector('[data-testid="door-cameras-open"]').getAttribute('href')).toContain(`cams-grant=${TOKEN}`);
    await act(async () => root.unmount()); root = null; container.remove();
    H.saved = [];
    await mount(createElement(TenantCamerasTab, { door: DOOR }));
    expect(text()).toContain('has not shared any camera with this door yet');
    expect(H.saved).toEqual([]);
  });
});
