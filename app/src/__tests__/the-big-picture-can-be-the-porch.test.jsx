// =============================================================================
// The front door's big picture can be the real porch, and it promotes (DR-1176)
// =============================================================================
// Darrell, 2026-10-21: "If a tenant or owner has access to the cameras make the
// big image have the option to open with the porch Floodlight cam... instead of
// the hero image make it a hero stream of the porch... make sense?"
// Then: "The camera stream shows how access works... If a potential tenant uses
// the app they will be able to see the level of services that were provided by
// us." And: "Also... tenants and 1099 workers... so it promotes."
// And the question this suite had to answer with a measurement rather than a
// recollection: "Tenants only get their door right?"
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { porchCamera, heroOffer, offerWords, ACCESS_STORY, storyHeading, PORCH_PREFERENCE } from '../modules/properties/porch-hero.js';
import { suggestDoorCameras, unitOf, doorUnit } from '../modules/properties/door-cameras.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const H = vi.hoisted(() => ({ key: '', list: [], status: 200, tickets: [] }));
vi.mock('../lib/nas-photos.js', async (orig) => ({ ...(await orig()), bridgeToken: () => H.key }));
vi.mock('../lib/supabase.js', () => ({
  default: { from: () => ({ update: () => ({ eq: async () => ({ error: null }) }) }), auth: { getSession: async () => ({ data: { session: null } }) } },
  phoneLoginEmail: () => '',
  normalizePhone: (p) => String(p || '').replace(/\D+/g, ''),
}));

const CAMS = [
  { id: '805_porch_floodlight_east', name: '805 porch floodlight cam east' },
  { id: '805_back_door', name: '805 back door' },
  { id: '805_lot', name: '805 parking lot' },
];

const PHOTO = createElement('img', { src: '/properties/welcome-entry.jpg', alt: 'the entry' });
let host = null;
let root = null;
const render = async (el) => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => { root.render(el); });
  return host;
};
afterEach(() => {
  if (root) act(() => root.unmount());
  if (host && host.parentNode) host.parentNode.removeChild(host);
  root = null; host = null;
  H.key = ''; H.list = []; H.status = 200; H.tickets = [];
  vi.restoreAllMocks();
});

const fakeFetch = () => async (url) => {
  const u = String(url);
  if (u.includes('/list')) return { status: H.status, json: async () => ({ cameras: H.list, count: H.list.length }) };
  if (u.includes('/ticket')) { H.tickets.push(u); return { ok: true, status: 200, json: async () => ({ ticket: 'tkt' }) }; }
  return { status: 404, json: async () => ({}) };
};

describe('which camera stands in for the entryway photograph', () => {
  it('prefers the porch floodlight Darrell named, over every other camera at the address', () => {
    expect(porchCamera(CAMS).id).toBe('805_porch_floodlight_east');
  });

  it('REFUSES a back door, a lot or a hallway in the hero frame — the photograph is a FRONT entry', () => {
    // The whole reason PORCH_PREFERENCE is an allow-list and not a "first
    // camera we find". A back-alley view in the frame that promotes the
    // property is not the same promise as a lit front entry.
    expect(porchCamera([{ id: '805_back_door', name: '805 back door' }, { id: '805_lot', name: 'parking lot' }, { id: 'apt2_hallway', name: 'apt 2 hallway' }])).toBe(null);
    expect(porchCamera([{ id: 'bedroom_cam', name: 'bedroom' }])).toBe(null);
  });

  it('falls through its tiers in order: front door, then doorbell, then entry, then front', () => {
    expect(porchCamera([{ id: 'x', name: 'front door east' }, { id: 'y', name: 'doorbell' }]).id).toBe('x');
    expect(porchCamera([{ id: 'y', name: 'doorbell' }, { id: 'z', name: 'front yard' }]).id).toBe('y');
    expect(porchCamera([{ id: 'z', name: 'front yard' }]).id).toBe('z');
    expect(PORCH_PREFERENCE[0]).toEqual(['porch', 'floodlight']);
  });

  it('matches on the id as well as the name, since a camera may carry only one', () => {
    expect(porchCamera([{ id: '805_porch_floodlight_east', name: '' }]).id).toBe('805_porch_floodlight_east');
  });
});

describe('the live option is offered only where it can actually open', () => {
  it('is NEVER offered to a visitor holding no credential — the applicant sees the photograph', () => {
    const o = heroOffer({ credential: { token: '', kind: 'none' }, cameras: CAMS, status: 'ready' });
    expect(o).toMatchObject({ offered: false, why: 'no-credential' });
  });

  it('is not offered while the list is still being read, and says so rather than going quiet', () => {
    const o = heroOffer({ credential: { token: 'g.x', kind: 'grant' }, cameras: [], status: 'loading' });
    expect(o.offered).toBe(false);
    expect(offerWords(o).note).toMatch(/Checking which cameras/);
  });

  it('an unanswered road is reported as unanswered, never as "no cameras" (DR-0076)', () => {
    const o = heroOffer({ credential: { token: 'g.x', kind: 'grant' }, cameras: [], status: 'http-502' });
    expect(o.why).toBe('no-answer');
    expect(offerWords(o).note).toMatch(/did not answer/);
  });

  it('a grant that opens only the lot gets the photograph AND the reason, not a lot camera', () => {
    const o = heroOffer({ credential: { token: 'g.x', kind: 'grant' }, cameras: [{ id: '805_lot', name: 'parking lot' }], status: 'ready' });
    expect(o).toMatchObject({ offered: false, why: 'no-front-camera' });
    expect(offerWords(o).note).toMatch(/none of them looks at a front entry/);
  });

  it('names whose access opens it — the owner’s own key, or what the landlord shared', () => {
    const owner = offerWords(heroOffer({ credential: { token: 'fam', kind: 'owner' }, cameras: CAMS, status: 'ready' }));
    const tenant = offerWords(heroOffer({ credential: { token: 'g.x', kind: 'grant' }, cameras: CAMS, status: 'ready' }));
    expect(owner.note).toMatch(/Your own camera key/);
    expect(tenant.note).toMatch(/your landlord shared/);
    expect(owner.button).toBe('Open the porch, live');
  });
});

describe('the big picture on the real front door', () => {
  it('draws the photograph and NO live option when the device holds nothing', async () => {
    const { default: PorchHero } = await import('../components/PorchHero.jsx');
    const el = await render(createElement(PorchHero, { photo: PHOTO, fetchImpl: fakeFetch() }));
    expect(el.querySelector('[data-testid="porch-hero"]').getAttribute('data-offered')).toBe('false');
    expect(el.querySelector('[data-testid="porch-hero-toggle"]')).toBe(null);
    expect(el.querySelector('img').getAttribute('src')).toBe('/properties/welcome-entry.jpg');
  });

  it('NEVER autoplays: the frame holds the photograph until the option is pressed', async () => {
    const { default: PorchHero } = await import('../components/PorchHero.jsx');
    H.list = CAMS;
    const el = await render(createElement(PorchHero, { photo: PHOTO, credential: { token: 'g.x', kind: 'grant' }, fetchImpl: fakeFetch() }));
    await act(async () => { await Promise.resolve(); });
    // The option is there...
    expect(el.querySelector('[data-testid="porch-hero-toggle"]').textContent).toBe('Open the porch, live');
    // ...and nothing was opened. No <video>, and no ticket was ever minted, so
    // the NAS spent none of its three slots on a visitor who is not watching.
    expect(el.querySelector('video')).toBe(null);
    expect(H.tickets).toEqual([]);
    expect(el.querySelector('[data-testid="porch-hero"]').getAttribute('data-live')).toBe('false');
  });

  it('opens the porch in the big frame when pressed, and goes back to the photograph', async () => {
    const { default: PorchHero } = await import('../components/PorchHero.jsx');
    H.list = CAMS;
    const el = await render(createElement(PorchHero, { photo: PHOTO, credential: { token: 'g.x', kind: 'grant' }, fetchImpl: fakeFetch() }));
    await act(async () => { await Promise.resolve(); });
    const btn = el.querySelector('[data-testid="porch-hero-toggle"]');
    await act(async () => { btn.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    expect(el.querySelector('[data-testid="porch-hero"]').getAttribute('data-live')).toBe('true');
    expect(el.querySelector('[data-testid="tile-live-805_porch_floodlight_east"]')).not.toBe(null);
    expect(el.querySelector('[data-testid="porch-hero-toggle"]').textContent).toBe('Back to the photo');
    // Back to the photograph UNMOUNTS the player, which is what gives the NAS
    // its slot back (camera-video.js dropVideo, DR-1097).
    await act(async () => { el.querySelector('[data-testid="porch-hero-toggle"]').dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    expect(el.querySelector('[data-testid="tile-live-805_porch_floodlight_east"]')).toBe(null);
    expect(el.querySelector('img').getAttribute('src')).toBe('/properties/welcome-entry.jpg');
  });

  it('asks the NAS with the VIEWER’S OWN token, so the answer is the viewer’s', async () => {
    const { default: PorchHero } = await import('../components/PorchHero.jsx');
    H.list = CAMS;
    const seen = [];
    const f = async (url, opts = {}) => { seen.push([String(url), opts.headers && opts.headers.Authorization]); return { status: 200, json: async () => ({ cameras: H.list }) }; };
    await render(createElement(PorchHero, { photo: PHOTO, credential: { token: 'g.mine', kind: 'grant' }, fetchImpl: f }));
    await act(async () => { await Promise.resolve(); });
    expect(seen.some(([u, a]) => u.includes('/list') && a === 'Bearer g.mine')).toBe(true);
  });
});

describe('it promotes: how access works, to whoever is reading', () => {
  it('tells the applicant who holds NO credential how camera access works', async () => {
    const { default: PorchHero } = await import('../components/PorchHero.jsx');
    const el = await render(createElement(PorchHero, { photo: PHOTO, fetchImpl: fakeFetch() }));
    const story = el.querySelector('[data-testid="porch-hero-story"]');
    expect(story).not.toBe(null);
    expect(story.getAttribute('data-kind')).toBe('none');
    expect(story.textContent).toMatch(/Camera access at a Poe Properties door/);
  });

  it('names BOTH audiences Darrell named — tenants and 1099 workers', () => {
    const text = ACCESS_STORY.map((s) => `${s.who} ${s.line}`).join(' ');
    expect(text).toMatch(/live here/i);
    expect(text).toMatch(/1099/);
    // ...and tells the truth about the difference between them: the door's
    // grant reaches the household; a worker is granted by name (DR-0938).
    expect(text).toMatch(/your household/);
    expect(text).toMatch(/by name/);
  });

  it('promises only what the system keeps: a chosen length, and taken back at any time', () => {
    const text = ACCESS_STORY.map((s) => s.line).join(' ');
    expect(text).toMatch(/for how long/);
    expect(text).toMatch(/take it back/);
    expect(text).toMatch(/does not name/);
  });

  it('heads the card for who is reading it', () => {
    expect(storyHeading('owner')).toMatch(/you give/);
    expect(storyHeading('grant')).toMatch(/you were given/);
    expect(storyHeading('none')).toMatch(/at a Poe Properties door/);
  });
});

// "Tenants only get their door right?" — Darrell, 2026-10-21. The mechanism
// says yes and the DEFAULT says no, and both halves are pinned here so the
// answer carries a measurement instead of a recollection.
describe('a tenant gets their own door, and only their own door', () => {
  const BUILDING = [
    { id: '805_porch_floodlight_east', name: '805 porch floodlight cam east' },
    { id: '805_apt1_hallway', name: '805 apt 1 hallway' },
    { id: '805_apt2_hallway', name: '805 apt 2 hallway' },
    { id: '805_back_door', name: '805 back door' },
    { id: '1313_porch', name: '1313 Elm porch' },
  ];

  it('never suggests another PROPERTY’S cameras: 1313 is not at 805', () => {
    const picked = suggestDoorCameras(BUILDING, { property_label: '805 Prospect Ave', unit_label: 'Apt 1' });
    expect(picked).not.toContain('1313_porch');
  });

  // WHAT WAS MEASURED BEFORE THE FIX (DR-1171), recorded so the gap is not
  // just asserted away: with suggestDoorCameras matching on the house number
  // alone and never reading doorWords().unit, this same suite ran green on
  // `expect(apt1).toEqual(apt2)` and `expect(apt1).toContain('805_apt2_hallway')`.
  // Apt 1's door and Apt 2's door arrived pre-ticked with the SAME set, the
  // neighbour's hallway among them. The NAS never leaked anything by itself —
  // what leaked was a landlord pressing Share without unticking.
  it('does NOT pre-tick another unit’s camera: Apt 1 is not offered Apt 2’s hallway', () => {
    const apt1 = suggestDoorCameras(BUILDING, { property_label: '805 Prospect Ave', unit_label: 'Apt 1' });
    const apt2 = suggestDoorCameras(BUILDING, { property_label: '805 Prospect Ave', unit_label: 'Apt 2' });
    expect(apt1).not.toContain('805_apt2_hallway');
    expect(apt2).not.toContain('805_apt1_hallway');
    expect(apt1).toContain('805_apt1_hallway');
    expect(apt1).not.toEqual(apt2);
  });

  it('still offers the COMMON cameras to every door — the porch is shared, the hallway is not', () => {
    const apt1 = suggestDoorCameras(BUILDING, { property_label: '805 Prospect Ave', unit_label: 'Apt 1' });
    expect(apt1).toContain('805_porch_floodlight_east');
    expect(apt1).toContain('805_back_door');
  });

  it('narrows NOTHING at a whole house, which has no unit to be another unit’s', () => {
    const house = suggestDoorCameras(BUILDING, { property_label: '805 Prospect Ave' });
    expect(house).toContain('805_apt1_hallway');
    expect(house).toContain('805_apt2_hallway');
  });

  it('reads a unit only where it is MARKED, so a house number is never a unit', () => {
    expect(unitOf('805 porch floodlight cam east')).toBe('');
    expect(unitOf('805 apt 2 hallway')).toBe('2');
    expect(unitOf('Unit B rear')).toBe('b');
    expect(unitOf('#3 kitchen')).toBe('3');
    expect(doorUnit({ property_label: '805 Prospect Ave', unit_label: 'Apt 4' })).toBe('4');
    expect(doorUnit({ property_label: '805 Prospect Ave', unit_label: 'B' })).toBe('b');
    expect(doorUnit({ property_label: '805 Prospect Ave' })).toBe('');
  });

  it('changes what is OFFERED, never what is ALLOWED: the landlord can still tick it by hand', () => {
    // The grant is built from `picked`, which the landlord edits freely in
    // DoorCamerasTab; the suggestion only seeds the first ticks. Pinned so a
    // later reader does not mistake this for a permission rule — the
    // permission rule is the NAS's, and it is unchanged.
    const apt1 = suggestDoorCameras(BUILDING, { property_label: '805 Prospect Ave', unit_label: 'Apt 1' });
    expect(BUILDING.map((c) => c.id)).toContain('805_apt2_hallway');
    expect(apt1.length).toBeLessThan(BUILDING.length);
  });
});
