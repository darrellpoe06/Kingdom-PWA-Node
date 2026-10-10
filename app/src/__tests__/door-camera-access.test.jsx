// =============================================================================
// A door's cameras are asked for, and given to whoever the family chooses
// (DR-0915, migration 0266)
// =============================================================================
// Darrell, 2026-10-10: "I want the camera to be there for users needing to
// login and request for certain ones... like the porch... we can just give
// new tenants and 1099 workers.. and Airbnb guests... whoever we want to".
//
// The family offers cameras on a door, grants an ask for the days it chooses
// (the NAS mints the grant), gives a guest with no account a link to text,
// and takes any of it back. Someone on the door asks and, once given, watches
// right there. A record that fails to write never leaves a live grant behind
// on the NAS. The database half is infra/supabase/tests/0266-door-camera-access-smoke.sql.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expiresOn, accessBook, accessLine, myLiveGrant, accessText } from '../modules/properties/door-cameras.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const TOKEN = 'g.abcdefabcdef.' + '1'.repeat(32);
const H = vi.hoisted(() => ({
  menu: [], rows: [], minted: [], revoked: [], decided: [], given: [], asked: [], menus: [], saved: [],
  decideOk: true, askOk: true,
}));
vi.mock('../modules/properties/cloud.js', () => ({
  loadCameraMenu: async () => ({ ok: true, menu: H.menu }),
  loadCameraAccess: async () => ({ ok: true, rows: H.rows }),
  saveCameraMenu: async (a) => { H.menus.push(a); return { ok: true }; },
  askForCameras: async (a) => { H.asked.push(a); return H.askOk ? { ok: true } : { ok: false, reason: 'already-asked' }; },
  decideCameraAccess: async (id, patch) => { H.decided.push([id, patch]); return H.decideOk ? { ok: true } : { ok: false, reason: 'write-failed' }; },
  giveCameraAccess: async (row) => { H.given.push(row); return { ok: true }; },
}));
vi.mock('../lib/cameras.js', () => ({
  createGrant: async (args, token) => { H.minted.push({ ...args, token }); return { ok: true, id: 'abcdefabcdef', token: TOKEN }; },
  revokeGrant: async (id, token) => { H.revoked.push([id, token]); return { ok: true }; },
  saveGrantToken: (t) => { H.saved.push(t); return true; },
  grantLink: (t, origin) => `${origin}/poetech-app/?view=cameras&cams-grant=${t}`,
}));
vi.mock('../lib/bounded-read.js', () => ({ boundedRead: (p) => p }));

import { CameraAccessDesk, AskForCameras } from '../modules/properties/CameraAccess.jsx';

const CAMS = [{ id: '805_porch', name: '805 Porch' }, { id: '805_hall', name: '805 Hallway' }, { id: 'kitchen', name: 'Kitchen' }];
const ASK = { id: 'a1', kind: 'request', status: 'requested', person_user_id: 'u-t', person_role: 'tenant', person_label: 'Jordan Reed', cameras: ['805_porch'], camera_names: ['805 Porch'], reason: 'Packages go missing', created_at: '2026-10-10T18:00:00Z' };

let container; let root;
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
  Object.assign(H, { menu: [], rows: [], minted: [], revoked: [], decided: [], given: [], asked: [], menus: [], saved: [], decideOk: true, askOk: true });
});
async function mount(el) {
  container = document.createElement('div'); document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(el); });
  for (let i = 0; i < 6; i += 1) await act(async () => { await Promise.resolve(); });
}
const text = () => container.textContent || '';
const button = (re) => [...container.querySelectorAll('button, a')].find((b) => re.test((b.textContent || '').trim()));
async function tap(re) {
  const b = button(re);
  if (!b) throw new Error(`no button ${re}`);
  await act(async () => { b.click(); });
  for (let i = 0; i < 6; i += 1) await act(async () => { await Promise.resolve(); });
}
async function type(label, value) {
  const input = container.querySelector(`[aria-label="${label}"]`);
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  await act(async () => { setter.call(input, value); input.dispatchEvent(new Event('input', { bubbles: true })); });
}
async function check(label) {
  const input = container.querySelector(`[aria-label="${label}"]`);
  await act(async () => { input.click(); });
}
const desk = () => createElement(CameraAccessDesk, { instanceId: 'i1', rentalId: 'r-apt2', doorName: '805 North Prospect Avenue Apt 2', cameras: CAMS, token: 'fam-key' });

describe('the ledger, read plainly (pure)', () => {
  it('days become a last day; asks, holders and the past are told apart; each row is one line', () => {
    expect(expiresOn(3, new Date(2026, 9, 10))).toBe('2026-10-13');
    expect(expiresOn(0)).toBeNull();
    const rows = [ASK, { ...ASK, id: 'g1', status: 'granted', grant_token: TOKEN, expires_on: '2026-11-09' }, { ...ASK, id: 'd1', status: 'declined' }];
    const b = accessBook(rows);
    expect([b.asks.length, b.holding.length, b.past.length]).toEqual([1, 1, 1]);
    expect(accessLine(ASK)).toBe('Jordan Reed (Tenant) asks for 805 Porch: "Packages go missing"');
    expect(accessLine(rows[1])).toBe('Jordan Reed (Tenant) can see 805 Porch until 2026-11-09');
    expect(accessLine({ ...ASK, person_role: 'guest', person_label: 'Airbnb guest', status: 'revoked' })).toBe('Airbnb guest (Short-stay guest) had 805 Porch; taken back');
  });

  it('PROVEN-TO-CATCH: an expired grant is never handed to the device as live', () => {
    const g = { ...ASK, status: 'granted', grant_token: TOKEN, expires_on: '2026-10-09', decided_at: '2026-10-01' };
    expect(myLiveGrant([g], 'u-t', new Date('2026-10-10T12:00:00Z'))).toBeNull();
    expect(myLiveGrant([{ ...g, expires_on: '2026-10-10' }], 'u-t', new Date('2026-10-10T12:00:00Z'))).toBeTruthy();
    expect(myLiveGrant([{ ...g, expires_on: null }], 'someone-else', new Date('2026-10-10T12:00:00Z'))).toBeNull();
  });

  it('the guest\'s text carries the link, the cameras and the days, and asks for no password', () => {
    expect(accessText({ name: 'Ana', door: '805 Apt 2', cameras: ['805 Porch'], link: 'https://x/l', days: 3 }))
      .toBe('Hi Ana, here is your camera access at 805 Apt 2 (805 Porch) for 3 days. Open it on your phone: https://x/l . No account or password needed.');
  });
});

describe('the family\'s desk', () => {
  it('offers the porch and hallway as askable, by name', async () => {
    await mount(desk());
    await check('Offer 805 Porch'); await check('Offer 805 Hallway');
    await tap(/^Save what can be asked for$/);
    expect(H.menus).toEqual([{ instanceId: 'i1', rentalId: 'r-apt2', cameras: [{ id: '805_porch', name: '805 Porch' }, { id: '805_hall', name: '805 Hallway' }] }]);
  });

  it('gives a tenant\'s ask for the days chosen: the NAS mints it, the row records it', async () => {
    H.rows = [ASK];
    await mount(desk());
    expect(text()).toContain('Jordan Reed (Tenant) asks for 805 Porch');
    await tap(/^Give it$/);
    expect(H.minted).toEqual([{ name: 'Jordan Reed · 805 North Prospect Avenue Apt 2', cameras: ['805_porch'], days: 30, actions: false, token: 'fam-key' }]);
    expect(H.decided[0][0]).toBe('a1');
    expect(H.decided[0][1]).toMatchObject({ status: 'granted', grant_token: TOKEN, grant_id: 'abcdefabcdef', days: 30 });
    expect(H.decided[0][1].expires_on).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('PROVEN-TO-CATCH: when the record cannot be written, the grant just minted is taken back on the NAS', async () => {
    H.rows = [ASK]; H.decideOk = false;
    await mount(desk());
    await tap(/^Give it$/);
    expect(H.revoked).toEqual([['abcdefabcdef', 'fam-key']]);
    expect(text()).toContain('The grant was taken back on the NAS');
  });

  it('declines an ask', async () => {
    H.rows = [ASK];
    await mount(desk());
    await tap(/^Decline$/);
    expect(H.decided).toEqual([['a1', { status: 'declined' }]]);
  });

  it('gives an Airbnb guest the porch by link, ready to text', async () => {
    await mount(desk());
    await type('Who it is for', 'Ana (Airbnb, Oct 12 to 15)');
    await type('Their cell', '(217) 555-0100');
    await check('Give 805 Porch');
    await tap(/^Give access$/);
    expect(H.minted[0]).toMatchObject({ name: 'Ana (Airbnb, Oct 12 to 15) · 805 North Prospect Avenue Apt 2', cameras: ['805_porch'], days: 3 });
    expect(H.given[0]).toMatchObject({ instance_id: 'i1', rental_id: 'r-apt2', person_role: 'guest', person_label: 'Ana (Airbnb, Oct 12 to 15)', cameras: ['805_porch'], camera_names: ['805 Porch'], grant_token: TOKEN, days: 3 });
    const shown = container.querySelector('[data-testid="camera-given-link"]').textContent;
    expect(shown).toContain(`cams-grant=${TOKEN}`);
    const sms = button(/^Text it$/).getAttribute('href');
    expect(sms).toMatch(/^sms:2175550100\?&body=/);
    expect(decodeURIComponent(sms)).toContain('No account or password needed');
  });

  it('takes access back: the NAS grant dies and the row says so', async () => {
    H.rows = [{ ...ASK, status: 'granted', grant_token: TOKEN, grant_id: 'abcdefabcdef', expires_on: '2026-11-09' }];
    await mount(desk());
    expect(text()).toContain('can see 805 Porch until 2026-11-09');
    await tap(/^Take back$/);
    expect(H.revoked).toEqual([['abcdefabcdef', 'fam-key']]);
    expect(H.decided).toEqual([['a1', { status: 'revoked' }]]);
  });
});

describe('someone on the door asks, and watches once given', () => {
  const ask = (extra = {}) => createElement(AskForCameras, { instanceId: 'i1', rentalId: 'r-apt2', me: 'u-w', myName: '', renderCameras: (t) => createElement('div', { 'data-testid': 'live-tiles' }, t), ...extra });

  it('sees only the names offered, and asks with a reason', async () => {
    H.menu = [{ camera_id: '805_porch', camera_name: '805 Porch' }];
    await mount(ask());
    expect(text()).toContain('805 Porch');
    expect(text()).not.toContain('Kitchen');
    await check('Ask for 805 Porch');
    await type('Your name', 'Mike Handy');
    await type('Why you need it', 'Watching for the delivery');
    await tap(/^Ask$/);
    expect(H.asked).toEqual([{ instanceId: 'i1', rentalId: 'r-apt2', cameras: ['805_porch'], reason: 'Watching for the delivery', label: 'Mike Handy' }]);
  });

  it('once given, the cameras open right there on that grant, and the device keeps it', async () => {
    H.menu = [{ camera_id: '805_porch', camera_name: '805 Porch' }];
    H.rows = [{ ...ASK, person_user_id: 'u-w', status: 'granted', grant_token: TOKEN, expires_on: null, decided_at: '2026-10-10T19:00:00Z' }];
    await mount(ask());
    expect(container.querySelector('[data-testid="live-tiles"]').textContent).toBe(TOKEN);
    expect(H.saved).toEqual([TOKEN]);
    expect(text()).toContain('Given to you: 805 Porch, until taken back');
  });

  it('says plainly when nothing is offered, and when an ask is already waiting', async () => {
    await mount(ask());
    expect(text()).toContain('has not offered any camera at this door yet');
    await act(async () => root.unmount()); root = null; container.remove();
    H.menu = [{ camera_id: '805_porch', camera_name: '805 Porch' }];
    H.rows = [{ ...ASK, person_user_id: 'u-w' }];
    await mount(ask());
    expect(container.querySelector('[data-testid="ask-for-cameras-waiting"]').textContent).toContain('Waiting on the owner');
  });
});
