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
import { doorGrantName, suggestDoorCameras, grantNote, grantIdOf, doorCameraState, setDoorCameraGrant, whoSeesDoorCameras, splitCamerasByDoor, offeredCameras } from '../modules/properties/door-cameras.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const H = vi.hoisted(() => ({ key: 'fam-key', list: [], listStatus: 200, grants: [], revoked: [], saved: [], grantOk: true, nasGrants: null, snap: null, snapAsks: [] }));
vi.mock('../lib/nas-photos.js', () => ({ bridgeToken: () => H.key }));
vi.mock('../lib/cameras.js', async (orig) => ({
  ...(await orig()),
  fetchWithTimeout: async (url, opts = {}) => {
    const u = String(url);
    if (u.endsWith('/grants') && H.nasGrants) return { status: 200, json: async () => ({ grants: H.nasGrants }) };
    if (u.includes('/snap/') && H.snap) {
      const id = decodeURIComponent(u.split('/snap/')[1].split('.jpg')[0]);
      H.snapAsks.push([id, opts.headers && opts.headers.Authorization]);
      const st = H.snap(id);
      return { status: st, json: async () => (st === 200 ? {} : { error: st === 403 ? 'not-granted' : 'wyze-offline' }), blob: async () => new Blob(['j'], { type: 'image/jpeg' }) };
    }
    return { status: H.listStatus, json: async () => ({ cameras: H.list, count: H.list.length }) };
  },
  createGrant: async (args, token) => { H.grants.push({ ...args, token }); return H.grantOk ? { ok: true, token: 'g.abcdefabcdef.' + '1'.repeat(32) } : { ok: false, reason: 'nas-refused' }; },
  revokeGrant: async (id, token) => { H.revoked.push([id, token]); return { ok: true }; },
  saveGrantToken: (t) => { H.saved.push(t); return true; },
  // fetchGrants calls cameras.js's own fetchWithTimeout, which this mock does not reach.
  fetchGrants: async () => (H.nasGrants ? { ok: true, grants: (await orig()).parseGrants({ grants: H.nasGrants }), message: '' } : { ok: false, grants: [], message: 'the camera road did not answer' }),
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
  afterEach(() => { if (root) act(() => root.unmount()); if (container) container.remove(); root = container = null; Object.assign(H, { key: 'fam-key', list: [], listStatus: 200, grants: [], revoked: [], saved: [], grantOk: true, nasGrants: null, snap: null, snapAsks: [] }); });
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
    // The door's own first, then the fold "Not at this address" (DR-1161): both grids, in order.
    const boxes = Array.from(container.querySelectorAll('[data-testid="door-cameras-pick"] input, [data-testid="door-cameras-pick-apart"] input'));
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
    const boxes = Array.from(container.querySelectorAll('[data-testid="door-cameras-pick"] input, [data-testid="door-cameras-pick-apart"] input'));
    expect(boxes).toHaveLength(4);
    expect(boxes.filter((b) => b.checked)).toHaveLength(2);
    expect(container.querySelector('[data-testid="door-cameras-count"]').textContent).toBe('4 cameras on the NAS; 2 at this door’s address; 2 ticked for this door.');
    // Nobody is on the door, and the tab says so instead of implying a household.
    expect(container.querySelector('[data-testid="door-cameras-nobody-yet"]').textContent).toContain('Nobody signs into this door yet');
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

  // Darrell, 2026-10-21: "show the allowed cameras for the tenants... and what
  // they have or dont have access to... this will show and tell us owners when
  // they do or don't have access."
  const OLD = 'g.aaaaaaaaaaaa.' + '2'.repeat(32);
  const SHARED_DOOR = { ...DOOR, camera_grant: OLD, camera_grant_note: '2 cameras: 805 Porch Cam, 805 Back Door' };
  const settle = async () => { for (let i = 0; i < 12; i += 1) await act(async () => { await new Promise((r) => setTimeout(r, 0)); }); };
  // On a loaded runner the grant read can land after a fixed number of ticks
  // (CI on 0ff33fb128): wait for what the step is about, up to 5 s, never for a failure.
  const until = async (ok) => { for (let i = 0; i < 250 && !ok(); i += 1) await act(async () => { await new Promise((r) => setTimeout(r, 20)); }); };

  it('PROVEN TO CATCH: the picker starts from what the NAS grant really opens, never from the address guess', async () => {
    H.list = CAMS;
    H.nasGrants = [{ id: 'aaaaaaaaaaaa', name: 'door', cameras: ['805_porch_cam'], created: 1, expires: 0, revoked: 0 }];
    H.snap = () => 200;
    await mount(createElement(DoorCamerasTab, { door: SHARED_DOOR, onChange: async () => ({ ok: true }) }));
    await settle();
    await until(() => /1 ticked/.test(container.querySelector('[data-testid="door-cameras-count"]')?.textContent || ''));
    const boxes = Array.from(container.querySelectorAll('[data-testid="door-cameras-pick"] input, [data-testid="door-cameras-pick-apart"] input'));
    // sorted by name: 805 Back Door, 805 Porch Cam, front yard, Kitchen 2 -- only the porch is in the grant
    expect(boxes.map((b) => b.checked)).toEqual([false, true, false, false]);
    expect(container.querySelector('[data-testid="door-cameras-count"]').textContent).toBe('4 cameras on the NAS; 2 at this door’s address; 1 ticked for this door.');
    expect(container.querySelector('[data-testid="door-cameras-pending"]')).toBeNull();
  });

  it('PROVEN TO CATCH: what the tenant sees is asked of the NAS with the door\'s own grant; a refusal says why; the rest is listed as not shared', async () => {
    H.list = CAMS;
    H.nasGrants = [{ id: 'aaaaaaaaaaaa', name: 'door', cameras: ['805_porch_cam', '805_back_door'], created: 1, expires: 0, revoked: 0 }];
    H.snap = (id) => (id === '805_porch_cam' ? 200 : 403);
    if (!URL.createObjectURL) URL.createObjectURL = () => 'blob:tenant-eye';
    if (!URL.revokeObjectURL) URL.revokeObjectURL = () => {};
    await mount(createElement(DoorCamerasTab, { door: SHARED_DOOR, onChange: async () => ({ ok: true }) }));
    await settle();
    await until(() => H.snapAsks.length >= 2 && !!container.querySelector('[data-testid="tenant-eye-805_porch_cam"] img') && !!container.querySelector('[data-testid="door-cameras-not-seen"]'));
    expect(H.snapAsks.map((a) => a[1])).toEqual([`Bearer ${OLD}`, `Bearer ${OLD}`]);
    expect(container.querySelector('[data-testid="tenant-eye-line-805_porch_cam"]').textContent).toBe('The tenant sees this, live');
    expect(container.querySelector('[data-testid="tenant-eye-805_porch_cam"] img')).toBeTruthy();
    expect(container.querySelector('[data-testid="tenant-eye-line-805_back_door"]').textContent).toMatch(/does not include this camera/);
    expect(container.querySelector('[data-testid="door-cameras-tenant-eye"]').textContent).toMatch(/1 of 2 answer the door's grant with a picture/);
    expect(container.querySelector('[data-testid="door-cameras-not-seen"]').textContent).toMatch(/\(2\)[\s\S]*front yard, Kitchen 2/);
  });

  it('a box ticked but not shared, or unticked but still shared, is named until Share; re-sharing takes the old grant back', async () => {
    H.list = CAMS;
    H.nasGrants = [{ id: 'aaaaaaaaaaaa', name: 'door', cameras: ['805_porch_cam'], created: 1, expires: 0, revoked: 0 }];
    H.snap = () => 200;
    const changes = [];
    await mount(createElement(DoorCamerasTab, { door: SHARED_DOOR, onChange: async (p) => { changes.push(p); return { ok: true }; } }));
    await settle();
    await until(() => /1 ticked/.test(container.querySelector('[data-testid="door-cameras-count"]')?.textContent || ''));
    const box = (i) => Array.from(container.querySelectorAll('[data-testid="door-cameras-pick"] input'))[i];
    await act(async () => { box(0).click(); });   // tick 805 Back Door
    await act(async () => { box(1).click(); });   // untick 805 Porch Cam
    const pending = container.querySelector('[data-testid="door-cameras-pending"]').textContent;
    expect(pending).toMatch(/Ticked, not shared yet \(1\): 805 Back Door/);
    expect(pending).toMatch(/Shared, unticked here \(1\): 805 Porch Cam\. The tenant still sees these/);
    await act(async () => { container.querySelector('[data-testid="door-cameras-share"]').click(); });
    await settle();
    await until(() => changes.length > 0 && H.revoked.length > 0);
    expect(changes[0].token).toBe(TOKEN);
    expect(H.revoked).toEqual([['aaaaaaaaaaaa', 'fam-key']]);
  });

  it('a grant the NAS no longer holds, or one that expired, says the tenant sees nothing', async () => {
    H.list = CAMS;
    H.nasGrants = [];
    await mount(createElement(DoorCamerasTab, { door: SHARED_DOOR, onChange: async () => ({ ok: true }) }));
    await settle();
    await until(() => !!container.querySelector('[data-testid="door-cameras-grant-state"]'));
    expect(container.querySelector('[data-testid="door-cameras-grant-state"]').textContent).toMatch(/no longer holds this grant, so the tenant sees no camera/);
    expect(container.querySelector('[data-testid="door-cameras-tenant-eye"]')).toBeNull();
    await act(async () => root.unmount()); root = null; container.remove();
    H.nasGrants = [{ id: 'aaaaaaaaaaaa', name: 'door', cameras: ['805_porch_cam'], created: 1, expires: 1000, revoked: 0 }];
    await mount(createElement(DoorCamerasTab, { door: SHARED_DOOR, onChange: async () => ({ ok: true }) }));
    await settle();
    await until(() => /expired/.test(container.querySelector('[data-testid="door-cameras-grant-state"]')?.textContent || ''));
    expect(container.querySelector('[data-testid="door-cameras-grant-state"]').textContent).toMatch(/is expired: the tenant sees no camera/);
    expect(container.querySelector('[data-testid="door-cameras-grant-line"]').textContent).toMatch(/expired/);
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

// Darrell, 2026-10-21, the manager's Cameras tab on 805 Apt 1 listing all 33
// cameras on the NAS, his home's among them: "my personal home cameras should
// be an option only I can give... not a property manager... camera location
// should be a significant issue... so they shouldn't be able to see my home
// cameras unless I give them that... so far only 805..." (DR-1161).
describe('a manager is offered the cameras at the door\'s address and no others; the family\'s own are the owner\'s to give (DR-1161)', () => {
  const ELSEWHERE = { id: '1003_front', name: '1003 Front' };
  const ALL = [...CAMS, ELSEWHERE];
  let container; let root;
  afterEach(() => { if (root) act(() => root.unmount()); if (container) container.remove(); root = container = null; Object.assign(H, { key: 'fam-key', list: [], listStatus: 200, grants: [], revoked: [], saved: [], grantOk: true, nasGrants: null, snap: null, snapAsks: [] }); });
  async function mount(el) {
    container = document.createElement('div'); document.body.appendChild(container);
    await act(async () => { root = createRoot(container); root.render(el); });
    for (let i = 0; i < 6; i += 1) await act(async () => { await Promise.resolve(); });
  }
  const text = () => container.textContent || '';
  const settle = async () => { for (let i = 0; i < 12; i += 1) await act(async () => { await new Promise((r) => setTimeout(r, 0)); }); };
  const until = async (ok) => { for (let i = 0; i < 250 && !ok(); i += 1) await act(async () => { await new Promise((r) => setTimeout(r, 20)); }); };

  it('sorts the NAS list by where each camera is: here, at another address, or with no address in its name', () => {
    const split = splitCamerasByDoor(ALL, DOOR);
    expect(split.here.map((c) => c.id)).toEqual(['805_porch_cam', '805_back_door']);
    expect(split.elsewhere.map((c) => c.id)).toEqual(['1003_front']);
    expect(split.unplaced.map((c) => c.id), 'the family\'s own cameras carry no house number').toEqual(['front_yard', 'kitchen_2']);
    expect(offeredCameras('manager', split).map((c) => c.id)).toEqual(['805_porch_cam', '805_back_door']);
    expect(offeredCameras('owner', split).map((c) => c.id)).toEqual(['805_porch_cam', '805_back_door', '1003_front', 'front_yard', 'kitchen_2']);
  });

  it('PROVEN TO CATCH: the manager\'s tab lists the 805 cameras only; the home\'s and another address\'s are never named', async () => {
    H.list = ALL;
    await mount(createElement(DoorCamerasTab, { door: DOOR, role: 'manager', onChange: async () => ({ ok: true }) }));
    const boxes = Array.from(container.querySelectorAll('[data-testid="door-cameras-pick"] input'));
    expect(boxes).toHaveLength(2);
    expect(boxes.every((b) => b.checked)).toBe(true);
    for (const name of ['front yard', 'Kitchen 2', '1003 Front']) expect(text(), `${name} must not appear on a manager's screen`).not.toContain(name);
    expect(container.querySelector('[data-testid="door-cameras-count"]').textContent).toBe('2 cameras at this door’s address; 2 ticked for this door.');
    expect(container.querySelector('[data-testid="door-cameras-manager-scope"]').textContent).toMatch(/owner’s to give/);
    expect(container.querySelector('[data-testid="door-cameras-apart"]')).toBeNull();
  });

  it('the owner\'s tab offers everything, the door\'s own first and the rest set apart with the warning and the count', async () => {
    H.list = ALL;
    await mount(createElement(DoorCamerasTab, { door: DOOR, role: 'owner', onChange: async () => ({ ok: true }) }));
    expect(Array.from(container.querySelectorAll('[data-testid="door-cameras-pick"] input'))).toHaveLength(2);
    const apart = container.querySelector('[data-testid="door-cameras-apart"]');
    expect(apart.querySelector('summary').textContent).toMatch(/Not at this address \(3\): 1 at another address, 2 with no address in the name/);
    expect(apart.textContent).toMatch(/or your home, with this door’s household/);
    expect(Array.from(apart.querySelectorAll('[data-testid="door-cameras-pick-apart"] input')).map((b) => b.checked)).toEqual([false, false, false]);
    expect(container.querySelector('[data-testid="door-cameras-count"]').textContent).toBe('5 cameras on the NAS; 2 at this door’s address; 2 ticked for this door.');
  });

  it('PROVEN TO CATCH: a home camera the owner shared is counted for the manager, never named, and kept through the manager\'s Share', async () => {
    H.list = ALL;
    const OLD = 'g.aaaaaaaaaaaa.' + '2'.repeat(32);
    H.nasGrants = [{ id: 'aaaaaaaaaaaa', name: 'door', cameras: ['805_porch_cam', 'kitchen_2'], created: 1, expires: 0, revoked: 0 }];
    H.snap = () => 200;
    if (!URL.createObjectURL) URL.createObjectURL = () => 'blob:tenant-eye';
    if (!URL.revokeObjectURL) URL.revokeObjectURL = () => {};
    const changes = [];
    await mount(createElement(DoorCamerasTab, { door: { ...DOOR, camera_grant: OLD, camera_grant_note: '2 cameras: 805 Porch Cam, Kitchen 2' }, role: 'manager', onChange: async (p) => { changes.push(p); return { ok: true }; } }));
    await settle();
    await until(() => !!container.querySelector('[data-testid="door-cameras-beyond"]'));
    expect(container.querySelector('[data-testid="door-cameras-beyond"]').textContent).toBe('1 more camera beyond this address is shared with this door by the owner; not shown here.');
    expect(container.querySelector('[data-testid="door-cameras-shared"]').textContent).toMatch(/Shared now: 1 camera at this door’s address, and 1 beyond it set by the owner\./);
    expect(text(), 'the owner\'s note names the kitchen; the manager never reads it').not.toContain('Kitchen 2');
    expect(container.querySelector('[data-testid="tenant-eye-kitchen_2"]')).toBeNull();
    expect(container.querySelector('[data-testid="door-cameras-not-seen"]').textContent).toMatch(/\(1\)[\s\S]*805 Back Door/);
    await act(async () => { container.querySelector('[data-testid="door-cameras-share"]').click(); });
    await settle();
    await until(() => changes.length > 0);
    expect([...H.grants[0].cameras].sort(), 'the owner\'s kitchen rides the re-minted grant untouched').toEqual(['805_porch_cam', 'kitchen_2']);
    expect(changes[0].note).toBe('1 camera: 805 Porch Cam for 365 days, and 1 beyond this address set by the owner');
  });
});
