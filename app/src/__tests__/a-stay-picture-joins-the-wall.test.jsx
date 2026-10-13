// =============================================================================
// A stay picture joins the wall with the family's yes (DR-1010, 0289)
// =============================================================================
// The four surfaces over one table, with the database stubbed at cloud.js:
//   the poster's form signs what the database handed it (version + fingerprint,
//     the three attestations, the two sentences, the device clock) and refuses
//     to send without them; an unreached wording signs nothing;
//   the guest card road sends with the card's key and remembers the id so a
//     take-down can be asked from the same device;
//   the family's desk approves, says the wording is a draft, records counsel's
//     review, and puts a picture in the listing;
//   the public wall hangs under the shelf only for a building with a card
//     there, named "Life at 805", and opens a picture with the brand on it.
// Proven to catch each way.
// =============================================================================
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const H = vi.hoisted(() => ({
  wording: { version: 'v1', body: 'Rights assignment for a picture shared on the Life wall\n\n1. What I am giving.', body_hash: 'ab'.repeat(32), counsel_attested: false },
  wordingFails: false,
  submitted: [], guestSubmitted: [], decided: [], removed: [], asked: [], guestAsked: [], listed: [], attested: [],
  refuse: null,
  mine: [], door: [], walls: [], imageReads: [],
}));

vi.mock('../modules/properties/cloud.js', () => ({
  loadStayWallWording: async () => (H.wordingFails ? { ok: false, reason: 'read-failed' } : { ok: true, wording: H.wording }),
  submitStayPicture: async (a) => { H.submitted.push(a); return H.refuse ? { ok: false, reason: H.refuse } : { ok: true, id: `id-${H.submitted.length}` }; },
  submitStayPictureAsGuest: async (a) => { H.guestSubmitted.push(a); return H.refuse ? { ok: false, reason: H.refuse } : { ok: true, id: `g-${H.guestSubmitted.length}` }; },
  loadMyStayPictures: async () => ({ ok: true, pictures: H.mine }),
  loadDoorStayPictures: async () => ({ ok: true, pictures: H.door }),
  loadStayPictureImage: async (id) => { H.imageReads.push(id); return { ok: true, image: `data:image/jpeg;base64,FULL-${id}` }; },
  decideStayPicture: async (id, d, why) => { H.decided.push([id, d, why]); return { ok: true, status: d }; },
  removeStayPicture: async (id, why) => { H.removed.push([id, why]); return { ok: true }; },
  askStayPictureRemoval: async (id) => { H.asked.push(id); return { ok: true }; },
  askStayPictureRemovalAsGuest: async (t, id) => { H.guestAsked.push([t, id]); return { ok: true }; },
  putStayPictureInListing: async (id, on) => { H.listed.push([id, on]); return { ok: true, photoId: on ? 'photo-1' : null }; },
  attestStayWallWording: async (inst, v, note) => { H.attested.push([inst, v, note]); H.wording = { ...H.wording, counsel_attested: true }; return { ok: true }; },
  loadPublicStayWalls: async () => ({ ok: true, rows: H.walls }),
  loadPublicStayWallImage: async (id) => { H.imageReads.push(id); return { ok: true, image: `data:image/jpeg;base64,PUB-${id}` }; },
}));
vi.mock('../../lib/brand-stamp.js', () => ({ stampImage: async ({ src }) => src, stampFileName: (d, n) => `${d}-${n}.jpg`, BRAND: {} }));

const { ShareStayPicture, MyStayPictures, StayWallDesk, LifeWall } = await import('../modules/properties/StayWall.jsx');
const { STAY_WALL_ATTESTATION, ESIGN_CONSENT, GUEST_SHARED_KEY } = await import('../modules/properties/stay-wall.js');

let container; let root;
const settle = async (n = 8) => { for (let i = 0; i < n; i += 1) await act(async () => { await Promise.resolve(); }); };
async function mount(el) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(el); });
  await settle();
}
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
});
beforeEach(() => {
  Object.assign(H, { wordingFails: false, submitted: [], guestSubmitted: [], decided: [], removed: [], asked: [], guestAsked: [], listed: [], attested: [], refuse: null, mine: [], door: [], walls: [], imageReads: [] });
  H.wording = { version: 'v1', body: 'Rights assignment for a picture shared on the Life wall\n\n1. What I am giving.', body_hash: 'ab'.repeat(32), counsel_attested: false };
  try { localStorage.removeItem(GUEST_SHARED_KEY); } catch { /* none */ }
});
const at = (id) => container.querySelector(`[data-testid="${id}"]`);
const byLabel = (label) => container.querySelector(`[aria-label="${label}"]`);
const click = async (el) => { await act(async () => { el.click(); }); await settle(); };
const type = async (el, value) => {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  await act(async () => { setter.call(el, value); el.dispatchEvent(new Event('input', { bubbles: true })); });
};
const tick = async (el) => { if (!el.checked) await click(el); };
const shrink = async (file) => ({ image: `data:image/jpeg;base64,IMG-${file.name}`, thumb: `data:image/jpeg;base64,TH-${file.name}`, name: file.name });
async function choose(names) {
  const input = byLabel('Choose pictures');
  const files = names.map((n) => new File(['x'], n, { type: 'image/jpeg' }));
  Object.defineProperty(input, 'files', { value: files, configurable: true });
  await act(async () => { input.dispatchEvent(new Event('change', { bubbles: true })); });
  await settle();
}
async function fillAndSign(name = 'Tess Tenant') {
  await choose(['porch.jpg']);
  await type(byLabel('A few words about it'), 'Sunday pancakes');
  await tick(byLabel('These are my own pictures, or I hold the rights to them.'));
  await tick(byLabel('Everyone who can be recognized in them agreed to be shown.'));
  await tick(byLabel('No one under eighteen is in them, or a parent or guardian agreed.'));
  await tick(byLabel('I have read it'));
  await tick(byLabel('I agree to sign electronically'));
  await type(byLabel('Your full legal name'), name);
}

describe('the poster\'s form', () => {
  it('shows the wording the database handed it, says it is a draft, and signs with its version and fingerprint', async () => {
    await mount(createElement(ShareStayPicture, { rentalId: 'door-a', shrink }));
    expect(at('stay-wall-wording').textContent).toMatch(/Rights assignment/);
    expect(at('share-stay-draft')).toBeTruthy();
    await fillAndSign();
    await tick(byLabel('Show my name on the wall'));
    expect(at('share-stay-ready').querySelectorAll('img')).toHaveLength(1);
    await click(at('share-stay-send'));
    expect(H.submitted).toHaveLength(1);
    const a = H.submitted[0];
    expect(a.rentalId).toBe('door-a');
    expect(a.image).toBe('data:image/jpeg;base64,IMG-porch.jpg');
    expect(a.thumb).toBe('data:image/jpeg;base64,TH-porch.jpg');
    expect(a.caption).toBe('Sunday pancakes');
    expect(a.name).toBe('Tess Tenant');
    expect(a.showName).toBe(true);
    expect([a.own, a.consent, a.minors]).toEqual([true, true, true]);
    expect(a.wordingVersion).toBe('v1');
    expect(a.wordingHash).toBe('ab'.repeat(32));
    expect(a.attestation).toBe(STAY_WALL_ATTESTATION);
    expect(a.consentText).toBe(ESIGN_CONSENT);
    expect(a.deviceAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(at('share-stay-done').textContent).toMatch(/with the family, signed/);
  });

  it('PROVEN-TO-CATCH: without the three attestations, the read, the consent and a name, nothing is sent', async () => {
    await mount(createElement(ShareStayPicture, { rentalId: 'door-a', shrink }));
    await choose(['porch.jpg']);
    await click(at('share-stay-send'));
    expect(H.submitted).toHaveLength(0);
    expect(container.textContent).toMatch(/Say this is true/);
    expect(container.textContent).toMatch(/Read the rights assignment/);
    expect(container.textContent).toMatch(/Type your full name/);
    // the name alone is not enough either
    await type(byLabel('Your full legal name'), 'Tess Tenant');
    await click(at('share-stay-send'));
    expect(H.submitted).toHaveLength(0);
  });

  it('PROVEN-TO-CATCH: a wording that could not be read signs nothing — no Send at all', async () => {
    H.wordingFails = true;
    await mount(createElement(ShareStayPicture, { rentalId: 'door-a', shrink }));
    expect(at('share-stay-unreached')).toBeTruthy();
    expect(at('share-stay-send')).toBeNull();
    expect(byLabel('Your full legal name')).toBeNull();
  });

  it('passes the database\'s refusal through in its own words', async () => {
    H.refuse = 'only someone who lives here, stays here, or the family can share a picture of this place';
    await mount(createElement(ShareStayPicture, { rentalId: 'door-a', shrink }));
    await fillAndSign();
    await click(at('share-stay-send'));
    expect(at('share-stay-said').textContent).toMatch(/only someone who lives here/);
    expect(at('share-stay-done')).toBeNull();
  });

  it('the counsel notice is gone once the family has counsel\'s attestation', async () => {
    H.wording = { ...H.wording, counsel_attested: true };
    await mount(createElement(ShareStayPicture, { rentalId: 'door-a', shrink }));
    expect(at('share-stay-draft')).toBeNull();
  });
});

describe('the guest card road', () => {
  it('sends with the card\'s key, remembers the id on this device, and can ask for a take-down from it', async () => {
    const token = 'ab'.repeat(32);
    await mount(createElement(ShareStayPicture, { token, shrink }));
    await fillAndSign('Gail Guest');
    await click(at('share-stay-send'));
    expect(H.submitted).toHaveLength(0);
    expect(H.guestSubmitted).toHaveLength(1);
    expect(H.guestSubmitted[0].token).toBe(token);
    expect(JSON.parse(localStorage.getItem(GUEST_SHARED_KEY))[token]).toEqual(['g-1']);
    act(() => root.unmount()); container.remove(); root = container = null;
    await mount(createElement(MyStayPictures, { token }));
    expect(container.querySelectorAll('[data-testid="my-stay-picture"]')).toHaveLength(1);
    await click(byLabel('Ask to take down this picture'));
    expect(H.guestAsked).toEqual([[token, 'g-1']]);
    expect(container.textContent).toMatch(/You asked for it to come down/);
  });
});

describe('what I shared, signed in', () => {
  it('lists each picture with where it stands and asks a take-down by id', async () => {
    H.mine = [
      { id: 'm1', caption: 'pancakes', thumb: 'data:image/jpeg;base64,T', status: 'approved', removal_asked_at: null, listing_photo_id: 'p' },
      { id: 'm2', caption: 'porch', thumb: null, status: 'declined', decline_reason: 'blurry' },
    ];
    await mount(createElement(MyStayPictures, {}));
    const rows = container.querySelectorAll('[data-testid="my-stay-picture"]');
    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toMatch(/On the wall and in the listing/);
    expect(rows[1].textContent).toMatch(/Not shown: blurry/);
    await click(byLabel('Ask to take down pancakes'));
    expect(H.asked).toEqual(['m1']);
  });
});

describe('the family\'s desk', () => {
  const row = (over = {}) => ({ id: 'd1', rental_id: 'door-a', submitted_role: 'tenant', poster_name: 'Tess Tenant', show_name: false, caption: 'pancakes', thumb: 'data:image/jpeg;base64,T', status: 'pending', removal_asked_at: null, listing_photo_id: null, wording_version: 'v1', signed_at: '2026-10-13T12:00:00Z', ...over });

  it('pending first; approve, decline with a reason, remove', async () => {
    H.door = [row(), row({ id: 'd2', caption: 'porch', status: 'approved' })];
    await mount(createElement(StayWallDesk, { rentalId: 'door-a', instanceId: 'inst', canAttest: true }));
    expect(container.textContent).toMatch(/Waiting for you \(1\)/);
    expect(container.textContent).toMatch(/On the wall \(1\)/);
    expect(container.querySelector('[data-testid="stay-desk-row"]').textContent).toMatch(/From a tenant \(signed Tess Tenant\)/);
    await click(byLabel('Approve pancakes'));
    expect(H.decided).toEqual([['d1', 'approved', undefined]]);
    await click(byLabel('Decline porch'));
    expect(H.decided[1]).toEqual(['d2', 'declined', '']);
    await click(byLabel('Remove porch'));
    expect(H.removed[0][0]).toBe('d2');
  });

  it('says the wording is a draft, lets the owner record counsel\'s review, then puts a picture in the listing', async () => {
    H.door = [row({ status: 'approved' })];
    await mount(createElement(StayWallDesk, { rentalId: 'door-a', instanceId: 'inst', canAttest: true }));
    expect(at('stay-wall-counsel').textContent).toMatch(/a draft until counsel reviews it/);
    await type(byLabel("Counsel's review, in a few words"), 'reviewed 2026-10-13');
    await click(at('stay-wall-attest'));
    expect(H.attested).toEqual([['inst', 'v1', 'reviewed 2026-10-13']]);
    expect(at('stay-wall-counsel').textContent).toMatch(/counsel reviewed it/);
    expect(at('stay-wall-attest')).toBeNull();
    await click(byLabel('Use in the listing: pancakes'));
    expect(H.listed).toEqual([['d1', true]]);
  });

  it('PROVEN-TO-CATCH: a member who cannot attest sees the draft notice and no button; a picture whose poster asked has no listing control', async () => {
    H.door = [row({ status: 'approved', removal_asked_at: '2026-10-13T13:00:00Z' })];
    await mount(createElement(StayWallDesk, { rentalId: 'door-a', instanceId: 'inst', canAttest: false }));
    expect(at('stay-wall-counsel').textContent).toMatch(/draft/);
    expect(at('stay-wall-attest')).toBeNull();
    expect(byLabel('Use in the listing: pancakes')).toBeNull();
    expect(at('stay-desk-status').textContent).toMatch(/the poster asked for it to come down/);
  });

  it('opens a picture larger by reading its bytes only then', async () => {
    H.door = [row()];
    await mount(createElement(StayWallDesk, { rentalId: 'door-a', instanceId: 'inst' }));
    expect(H.imageReads).toEqual([]);
    await click(byLabel('Open pancakes larger'));
    expect(H.imageReads).toEqual(['d1']);
    expect(container.querySelector('[role="dialog"]')).toBeTruthy();
  });
});

describe('the public wall', () => {
  const rows = [
    { id: 'p1', wall_key: 'k805', wall_label: 'Life at 805', door_ids: ['a', 'c'], unit: 'Apt 2', caption: 'pancakes', poster: null, thumb: 'data:image/jpeg;base64,T1' },
    { id: 'p2', wall_key: 'k805', wall_label: 'Life at 805', door_ids: ['a', 'c'], unit: 'Apt 3', caption: 'porch', poster: 'Gail Guest', thumb: 'data:image/jpeg;base64,T2' },
    { id: 'p3', wall_key: 'k9', wall_label: 'Life at this home', door_ids: ['b'], unit: null, caption: 'yard', poster: null, thumb: 'data:image/jpeg;base64,T3' },
  ];
  it('hangs under the shelf for the building with a card there, named "Life at 805", and opens a picture with its bytes read then', async () => {
    H.walls = rows;
    await mount(createElement(LifeWall, { shelfIds: ['c'] }));
    const walls = container.querySelectorAll('[data-testid="life-wall"]');
    expect(walls).toHaveLength(1);
    expect(at('life-wall-title').textContent).toBe('Life at 805');
    expect(walls[0].querySelectorAll('img')).toHaveLength(2);
    expect(walls[0].textContent).toMatch(/porch — Gail Guest/);
    expect(H.imageReads).toEqual([]);
    await click(byLabel('Open porch larger'));
    expect(H.imageReads.sort()).toEqual(['p1', 'p2']);
    expect(container.querySelector('[role="dialog"]')).toBeTruthy();
  });
  it('PROVEN-TO-CATCH: no card from that building on the shelf, no wall; no shelf, no read', async () => {
    H.walls = rows;
    await mount(createElement(LifeWall, { shelfIds: ['zzz'] }));
    expect(at('life-walls')).toBeNull();
    act(() => root.unmount()); container.remove(); root = container = null;
    await mount(createElement(LifeWall, { shelfIds: ['b'] }));
    expect(at('life-wall-title').textContent).toBe('Life at this home');
  });
});
