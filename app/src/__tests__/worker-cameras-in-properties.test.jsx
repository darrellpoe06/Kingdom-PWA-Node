// =============================================================================
// A 1099 worker is given cameras by name, and sees them in Poe Properties
// (DR-1210)
// =============================================================================
// Darrell, 2026-10-22: "Still can't give a 1099 worker more cameras... all of
// them would have cameras and they should be showing on their cameras tab
// inside the Poe Properties App... sometimes they will not have the PoeTech
// App... so they will need to see them there... make sense?"
//
// Each test below failed on the code before DR-1210 (proven-to-catch):
//   1. a gift carried no person_user_id, so 0266's read policy never handed it
//      to the worker's own session (the worker's tab could not show it);
//   2. Give access with Who empty refused at the foot of the desk, under the
//      holders list, so the press looked like nothing;
//   3. a second gift to the same person stacked a second grant; nothing was
//      ticked for them, nothing was taken back, and the worker's tab showed
//      only the newest;
//   4. the worker's Cameras tab rendered the HOUSEHOLD's door grant (a worker
//      with property.history reads the tenancy row, 0150) and kept it;
//   5. a live gift with no camera surface handed in opened nothing at all;
//   6. peopleOnDoor dropped the account id, so nobody could be picked;
//   7. the menu told the owner a 1099 worker never sees it — false.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { heldBy, giveRoleOf, signedInOnDoor, menuReach, cameraReach } from '../modules/properties/door-cameras.js';
import { peopleOnDoor } from '../modules/properties/people.js';
import { WORKER_TABS } from '../modules/properties/model.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const TOKEN = 'g.abcdefabcdef.' + '1'.repeat(32);
const OLD = 'g.0123456789ab.' + '2'.repeat(32);
const HOUSE = 'g.999999999999.' + '9'.repeat(32);
const H = vi.hoisted(() => ({
  menu: [], rows: [], minted: [], revoked: [], decided: [], given: [], saved: [],
}));
vi.mock('../modules/properties/cloud.js', () => ({
  loadCameraMenu: async () => ({ ok: true, menu: H.menu }),
  loadCameraAccess: async () => ({ ok: true, rows: H.rows }),
  saveCameraMenu: async () => ({ ok: true }),
  askForCameras: async () => ({ ok: true }),
  decideCameraAccess: async (id, patch) => { H.decided.push([id, patch]); return { ok: true }; },
  giveCameraAccess: async (row) => { H.given.push(row); return { ok: true }; },
}));
vi.mock('../lib/cameras.js', async (orig) => ({
  ...(await orig()),
  createGrant: async (args, token) => { H.minted.push({ ...args, token }); return { ok: true, id: 'abcdefabcdef', token: TOKEN }; },
  revokeGrant: async (id, token) => { H.revoked.push([id, token]); return { ok: true }; },
  saveGrantToken: (t) => { H.saved.push(t); return true; },
}));
vi.mock('../lib/nas-photos.js', () => ({ bridgeToken: () => 'fam-key' }));
vi.mock('../lib/bounded-read.js', () => ({ boundedRead: (p) => p }));

import { CameraAccessDesk, AskForCameras } from '../modules/properties/CameraAccess.jsx';
import { TenantCamerasTab } from '../modules/properties/DoorCameras.jsx';

const CAMS = [{ id: '805_porch', name: '805 Porch' }, { id: '805_hall', name: '805 Hallway' }, { id: '805_basement', name: '805 Basement' }, { id: 'kitchen', name: 'Kitchen' }];
const MIKE = { id: 'inv-1', key: '2175550100', name: 'Mike Handy', roleLabel: 'field_worker', roleName: '1099 worker', contact: { phone: '2175550100' }, joined: true, userId: 'u-mike' };
const LEASE_ONLY = { id: 'inv-2', key: 'x', name: 'Not Joined', roleLabel: 'field_worker', roleName: '1099 worker', contact: {}, joined: false, userId: null };

let container; let root;
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
  Object.assign(H, { menu: [], rows: [], minted: [], revoked: [], decided: [], given: [], saved: [] });
});
async function mount(el) {
  container = document.createElement('div'); document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(el); });
  for (let i = 0; i < 8; i += 1) await act(async () => { await Promise.resolve(); });
}
const q = (id) => container.querySelector(`[data-testid="${id}"]`);
const button = (re) => [...container.querySelectorAll('button, a')].find((b) => re.test((b.textContent || '').trim()));
async function tap(re) {
  const b = button(re);
  if (!b) throw new Error(`no button ${re}`);
  await act(async () => { b.click(); });
  for (let i = 0; i < 8; i += 1) await act(async () => { await Promise.resolve(); });
}
async function check(label) {
  const input = container.querySelector(`[aria-label="${label}"]`);
  await act(async () => { input.click(); });
}
async function pick(label, value) {
  const sel = container.querySelector(`[aria-label="${label}"]`);
  await act(async () => { sel.value = value; sel.dispatchEvent(new Event('change', { bubbles: true })); });
  for (let i = 0; i < 4; i += 1) await act(async () => { await Promise.resolve(); });
}
const desk = (extra = {}) => createElement(CameraAccessDesk, { instanceId: 'i1', rentalId: 'r-apt2', doorName: '805 North Prospect Avenue Apt 2', cameras: CAMS, token: 'fam-key', people: [MIKE, LEASE_ONLY], ...extra });
const ticked = () => [...container.querySelectorAll('[data-testid="camera-give-pick"] input')].filter((i) => i.checked).length;

describe('the owner gives a signed-in 1099 worker cameras, by his account', () => {
  it('PROVEN-TO-CATCH: picking him writes his account on the row, so his own session reads it', async () => {
    await mount(desk());
    // Only the people who have signed in are offered: a name with no account cannot receive in-app.
    const opts = [...q('camera-give-person').querySelectorAll('option')].map((o) => o.textContent);
    expect(opts).toEqual(['Nobody picked: type a name below for a link', 'Mike Handy · 1099 worker']);
    await pick('Someone signed into this door', 'u-mike');
    expect(container.querySelector('[aria-label="Who it is for"]').value).toBe('Mike Handy');
    expect(container.querySelector('[aria-label="As what"]').value).toBe('worker');
    await check('Give 805 Porch'); await check('Give 805 Basement');
    await tap(/^Give access$/);
    expect(H.given).toHaveLength(1);
    expect(H.given[0]).toMatchObject({ person_user_id: 'u-mike', person_role: 'worker', person_label: 'Mike Handy', cameras: ['805_porch', '805_basement'], grant_token: TOKEN });
    expect(q('camera-give-msg').textContent).toMatch(/Cameras tab of their Poe Properties app now/);
  });

  it('a person typed by name (no account) still goes by link, and the row says no account', async () => {
    await mount(desk());
    const input = container.querySelector('[aria-label="Who it is for"]');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    await act(async () => { setter.call(input, 'Ana'); input.dispatchEvent(new Event('input', { bubbles: true })); });
    await check('Give 805 Porch');
    await tap(/^Give access$/);
    expect(H.given[0].person_user_id).toBeUndefined();
    expect(q('camera-given-link').textContent).toContain(`cams-grant=${TOKEN}`);
    expect(q('camera-give-msg').textContent).toMatch(/no account on this door, so the link below/);
  });

  it('PROVEN-TO-CATCH: Give with Who empty says why BESIDE the button, and mints nothing', async () => {
    await mount(desk());
    await check('Give 805 Porch');
    await tap(/^Give access$/);
    expect(H.minted).toEqual([]);
    expect(q('camera-give-msg').textContent).toMatch(/^Not given: pick who it is for from the people signed into this door, or type their name\.$/);
    // Beside the button: the very next element after it.
    expect(q('camera-give').nextElementSibling).toBe(q('camera-give-msg'));
  });

  it('gives as many cameras as are ticked — all of them, with no cap in the app', async () => {
    const many = Array.from({ length: 33 }, (_, i) => ({ id: `cam_${i}`, name: `Cam ${i}` }));
    await mount(desk({ cameras: many }));
    await pick('Someone signed into this door', 'u-mike');
    for (const c of many) await check(`Give ${c.name}`);
    await tap(/^Give access$/);
    expect(H.minted[0].cameras).toHaveLength(33);
    expect(H.given[0].cameras).toHaveLength(33);
  });
});

describe('giving MORE to the same worker replaces his grant, stated plainly', () => {
  const HELD = { id: 'row-old', kind: 'given', status: 'granted', person_user_id: 'u-mike', person_role: 'worker', person_label: 'Mike Handy', cameras: ['805_porch', '805_hall'], camera_names: ['805 Porch', '805 Hallway'], grant_token: OLD, grant_id: '0123456789ab', expires_on: null, created_at: '2026-10-21T10:00:00Z' };

  it('PROVEN-TO-CATCH: his current cameras are ticked, the new grant holds them all, and the old one is taken back', async () => {
    H.rows = [HELD];
    await mount(desk());
    expect(q('camera-holder').textContent).toMatch(/Mike Handy \(1099 worker\) can see 805 Porch, 805 Hallway, until taken back · in their Poe Properties app/);
    await pick('Someone signed into this door', 'u-mike');
    expect(ticked()).toBe(2);
    expect(q('camera-give-replaces').textContent).toMatch(/already holds 2 cameras here: 805 Porch, 805 Hallway\. Giving again REPLACES/);
    await check('Give 805 Basement');
    await tap(/^Give access$/);
    expect(H.minted[0].cameras).toEqual(['805_porch', '805_hall', '805_basement']);
    expect(H.given[0]).toMatchObject({ person_user_id: 'u-mike', cameras: ['805_porch', '805_hall', '805_basement'] });
    expect(H.revoked).toEqual([['0123456789ab', 'fam-key']]);
    expect(H.decided).toEqual([['row-old', { status: 'revoked' }]]);
    expect(q('camera-give-msg').textContent).toMatch(/REPLACES the access they held before \(one grant, taken back\)/);
  });

  it('an expired grant is not "held": nothing is ticked for it and nothing is taken back', async () => {
    H.rows = [{ ...HELD, expires_on: '2020-01-01' }];
    await mount(desk());
    await pick('Someone signed into this door', 'u-mike');
    expect(ticked()).toBe(0);
    expect(q('camera-give-replaces')).toBeNull();
  });
});

describe('the worker\'s own Cameras tab in Poe Properties', () => {
  const GIFT = { id: 'g1', kind: 'given', status: 'granted', person_user_id: 'u-mike', person_role: 'worker', person_label: 'Mike Handy', cameras: ['805_porch', '805_basement'], camera_names: ['805 Porch', '805 Basement'], grant_token: TOKEN, expires_on: null, decided_at: '2026-10-22T12:00:00Z' };
  const DOOR = { id: 't1', instance_id: 'i1', property_label: '805 North Prospect Avenue', unit_label: 'Apt 2', camera_grant: HOUSE, camera_grant_note: '2 cameras: the household\'s' };

  it('PROVEN-TO-CATCH: a worker never sees, opens or keeps the household\'s door grant; he sees only what was given to him', async () => {
    H.rows = [GIFT];
    const rendered = [];
    await mount(createElement(TenantCamerasTab, { door: DOOR, role: 'field_worker', rentalId: 'r-apt2', instanceId: 'i1', me: 'u-mike', renderCameras: (t) => { rendered.push(t); return createElement('div', { 'data-testid': 'live-tiles' }, t); } }));
    expect(rendered).toEqual([TOKEN]);
    expect(rendered).not.toContain(HOUSE);
    expect(H.saved).toEqual([TOKEN]);
    expect(container.textContent).not.toContain('the household');
    expect(container.textContent).not.toContain('has not shared any camera with this door');
    expect(q('door-cameras-given').textContent).toMatch(/no PoeTech app needed/);
    expect(q('ask-for-cameras-live').textContent).toContain('Given to you: 805 Porch, 805 Basement, until taken back');
  });

  it('the tenant face still opens the door\'s grant, unchanged', async () => {
    const rendered = [];
    await mount(createElement(TenantCamerasTab, { door: DOOR, role: 'tenant', renderCameras: (t) => { rendered.push(t); return null; } }));
    expect(rendered).toEqual([HOUSE]);
  });

  it('PROVEN-TO-CATCH: a live gift with no camera surface handed in still opens, by its link', async () => {
    H.rows = [GIFT];
    await mount(createElement(AskForCameras, { instanceId: 'i1', rentalId: 'r-apt2', me: 'u-mike', renderCameras: null }));
    expect(q('ask-for-cameras-open').getAttribute('href')).toContain(`cams-grant=${encodeURIComponent(TOKEN)}`);
  });

  it('another worker\'s gift is not his', async () => {
    H.rows = [{ ...GIFT, person_user_id: 'u-someone-else' }];
    await mount(createElement(TenantCamerasTab, { door: DOOR, role: 'field_worker', rentalId: 'r-apt2', instanceId: 'i1', me: 'u-mike', renderCameras: (t) => createElement('div', { 'data-testid': 'live-tiles' }, t) }));
    expect(q('live-tiles')).toBeNull();
    expect(H.saved).toEqual([]);
  });
});

describe('the pure half', () => {
  it('PROVEN-TO-CATCH: peopleOnDoor carries the account a person signed in with', () => {
    const { people } = peopleOnDoor([{ id: 'i-1', instance_id: 'i1', tenancy_id: 't1', role_label: 'field_worker', display_name: 'Mike Handy', phone: '2175550100', claimed_at: '2026-10-20T00:00:00Z', claimed_by: 'u-mike' }], { instanceId: 'i1', tenancyId: 't1' });
    expect(people[0].userId).toBe('u-mike');
    expect(signedInOnDoor(people).map((p) => p.userId)).toEqual(['u-mike']);
    expect(signedInOnDoor([{ ...people[0], joined: false }])).toEqual([]);
  });

  it('a person on the door is written as their ledger role', () => {
    expect(['field_worker', 'tenant', 'household', 'manager', 'applicant'].map(giveRoleOf)).toEqual(['worker', 'tenant', 'household', 'manager', 'other']);
  });

  it('what a person holds: by account, else by the name on a by-link row; never another person\'s, never an expired one', () => {
    const today = new Date('2026-10-22T12:00:00Z');
    const rows = [
      { id: 'a', status: 'granted', grant_token: TOKEN, person_user_id: 'u-mike', person_label: 'Mike Handy', expires_on: null },
      { id: 'b', status: 'granted', grant_token: TOKEN, person_user_id: null, person_label: 'Ana', expires_on: '2026-10-25' },
      { id: 'c', status: 'granted', grant_token: TOKEN, person_user_id: null, person_label: 'Ana', expires_on: '2026-10-01' },
      { id: 'd', status: 'revoked', grant_token: null, person_user_id: 'u-mike', person_label: 'Mike Handy' },
    ];
    expect(heldBy(rows, { userId: 'u-mike' }, today).map((r) => r.id)).toEqual(['a']);
    expect(heldBy(rows, { name: ' ana ' }, today).map((r) => r.id)).toEqual(['b']);
    expect(heldBy(rows, { name: 'Mike Handy' }, today)).toEqual([]);
    expect(heldBy(rows, {}, today)).toEqual([]);
  });

  it('PROVEN-TO-CATCH: the menu no longer tells the owner a 1099 worker never sees it — WORKER_TABS has a Cameras tab', () => {
    expect(WORKER_TABS.map((t) => t.id)).toContain('cameras');
    for (const saved of [0, 3]) {
      const w = menuReach({ saved }).words;
      expect(w).not.toMatch(/1099 worker[^.]*(never see|cannot see)/);
      expect(w).toMatch(/a 1099 worker on it/);
      expect(w).toMatch(/short-stay guest (never sees|cannot see) this list/);
    }
    expect(cameraReach('worker').words).toMatch(/Cameras tab of their Poe Properties app/);
  });
});
