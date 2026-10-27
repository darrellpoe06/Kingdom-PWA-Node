// =============================================================================
// The cameras are on the front page (DR-1237)
// =============================================================================
// Darrell, 2026-10-27: "shouldn't we see the camera option on the front page
// inside the PoeTech App?" Pinned here: ONE predicate decides who sees the
// cameras (the nav entry, the shell gate and the tile all ask it); the tile is
// the first thing after the welcome on both homes, 44px tall, with a line read
// from the camera road and never painted; it opens view 'cameras'; a tenant
// with no grant gets no tile and no DOM.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import CamerasTile from '../components/CamerasTile.jsx';
import LifeHub from '../components/LifeHub.jsx';
import { BigPictureDashboard } from '../components/BigPictureDashboard.jsx';
import { canSeeCameras, CAMERA_GRANT_KEY, REQUIREMENTS } from '../lib/surface-access.js';
import { navItems } from '../lib/nav-items.jsx';
import { surfaceById } from '../surfaces.js';
import { CAMERAS_TILE, cameraTileLine, latestFrameAt, readCameraTile, clockOf } from '../lib/cameras-tile.js';
import { __resetHomePrefs } from '../lib/home-view-prefs.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const HOST = readFileSync(join(ROOT, 'app', 'src', 'poe-financial-mvp-v28.jsx'), 'utf8');
const NAV = readFileSync(join(ROOT, 'app', 'src', 'lib', 'nav-items.jsx'), 'utf8');
const codeOnly = (s) => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');

const GRANT = 'g.0123456789ab.0123456789abcdef0123456789abcdef';
const FAMILY = { signedIn: true, isFamilyMember: true };
const TENANT = { signedIn: true, instanceRole: 'member' };
const OWNER = { token: 'family-key', kind: 'owner' };
const NONE = { token: '', kind: 'none' };

// 14:05 local today, so the clock the tile prints is the clock this run expects.
const today = new Date(); today.setHours(14, 5, 0, 0);
const SEEN_S = Math.floor(today.getTime() / 1000);
const HH_MM = clockOf(SEEN_S * 1000);

const plan = { list: 200, cams: 3, health: 200, streams: true, throwOn: null };
const fakeFetch = async (url, opts = {}) => {
  const u = String(url);
  if (plan.throwOn && u.includes(plan.throwOn)) throw new TypeError('Failed to fetch');
  if (u.endsWith('/list')) {
    const cameras = Array.from({ length: plan.cams }, (_, i) => ({ id: `cam${i}`, name: `Camera ${i}`, kind: 'wyze' }));
    return { ok: plan.list === 200, status: plan.list, json: async () => ({ cameras, count: cameras.length, auth: (opts.headers || {}).Authorization }) };
  }
  if (u.endsWith('/streams/health')) {
    return { ok: true, status: 200, json: async () => (plan.streams
      ? { interval_s: 60, sampled_at: SEEN_S, cameras: { cam0: { last_seen: SEEN_S - 600 }, cam1: { last_seen: SEEN_S }, cam2: { last_seen: null } }, events: [] }
      : { nope: true }) };
  }
  if (u.endsWith('/health')) {
    return { ok: plan.health === 200, status: plan.health, json: async () => (plan.health === 200
      ? { ok: true, go2rtc: '1.9', streams: 5, stream_health: { interval_s: 60, last_sample_at: SEEN_S, cameras: 4, drops_1h: 0 } }
      : { ok: false, error: 'go2rtc-unreachable' }) };
  }
  return { ok: false, status: 404, json: async () => ({}) };
};

let container, root;
beforeEach(() => {
  __resetHomePrefs();
  try { localStorage.clear(); } catch { /* blocked storage */ }
  Object.assign(plan, { list: 200, cams: 3, health: 200, streams: true, throwOn: null });
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); __resetHomePrefs(); });

const render = async (el) => { await act(async () => { root.render(el); }); };
const settle = async (ms = 30) => { await act(async () => { await new Promise((r) => setTimeout(r, ms)); }); };
const tile = () => container.querySelector('[data-testid="cameras-tile"]');
const line = () => (container.querySelector('[data-testid="cameras-tile-line"]') || {}).textContent || '';

describe('one predicate decides who sees the cameras (DR-1237; DR-0778)', () => {
  it('the family sees them; a tenant with no grant does not; a device holding a grant does; reviewer mode is never a key', () => {
    expect(canSeeCameras(FAMILY)).toBe(true);
    expect(canSeeCameras(TENANT)).toBe(false);
    expect(canSeeCameras({})).toBe(false);
    expect(canSeeCameras({ ...TENANT, hasCameraGrant: true })).toBe(true);
    expect(canSeeCameras({ ...FAMILY, reviewerMode: true })).toBe(false);
    expect(canSeeCameras({ ...TENANT, hasCameraGrant: true, reviewerMode: true })).toBe(false);
    // The grant on THIS device, read from storage when nothing is handed in.
    localStorage.setItem(CAMERA_GRANT_KEY, GRANT);
    expect(canSeeCameras(TENANT)).toBe(true);
    expect(canSeeCameras({ ...TENANT, reviewerMode: true })).toBe(false);
    localStorage.removeItem(CAMERA_GRANT_KEY);
    expect(canSeeCameras(TENANT)).toBe(false);
    // It IS the registry's own rule for the Cameras surface, not a second one.
    expect(surfaceById.cameras.requires).toBe('cameras');
    expect(REQUIREMENTS.cameras.holds({ isFamilyMember: true })).toBe(true);
  });

  it('the nav entry and the shell gate ask the same predicate, so a worker holding a grant reaches Cameras in PoeTech', () => {
    const ids = (v) => navItems(v).map(([id]) => id);
    expect(ids({ isFamilyMember: true, authSession: { user: { email: 'a@b' } } })).toContain('cameras');
    expect(ids({ isFamilyMember: false, authSession: { user: { email: 'w@b' } } })).not.toContain('cameras');
    localStorage.setItem(CAMERA_GRANT_KEY, GRANT);
    expect(ids({ isFamilyMember: false, authSession: { user: { email: 'w@b' } } })).toContain('cameras');
    expect(ids({ isFamilyMember: false, reviewerMode: true, authSession: { user: { email: 'w@b' } } })).not.toContain('cameras');
    // The source, not a memory of it: the nav's gate and the shell's render gate.
    expect(codeOnly(NAV)).toMatch(/canSeeCameras\(\{ isFamilyMember, reviewerMode \}\) \? \[\['cameras'/);
    expect(codeOnly(HOST)).toMatch(/view === 'cameras' && canSeeCameras\(surfaceViewer\) &&/);
    expect(codeOnly(HOST)).not.toMatch(/view === 'cameras' && isFamilyMember/);
  });
});

describe('the Cameras tile on the front page', () => {
  it('renders for a family member with a line read from the road: the credential\'s count and the newest frame', async () => {
    const calls = [];
    const f = async (u, o) => { calls.push(String(u)); return fakeFetch(u, o); };
    const seen = [];
    await render(createElement(CamerasTile, { viewer: FAMILY, setView: (v) => seen.push(v), credential: OWNER, fetchImpl: f }));
    expect(tile()).toBeTruthy();
    await settle();
    expect(tile().getAttribute('data-state')).toBe('ready');
    expect(line()).toBe(`3 cameras · last frame ${HH_MM}`);
    expect(calls.some((u) => u.endsWith('/cams/list'))).toBe(true);
    expect(calls.some((u) => u.endsWith('/cams/streams/health'))).toBe(true);
    // 44px: declared on the control itself.
    expect(tile().className).toMatch(/min-h-\[44px\]/);
    expect(tile().tagName).toBe('BUTTON');
    // A tap opens the view, the registry's own view for the surface.
    await act(async () => { tile().click(); });
    expect(seen).toEqual(['cameras']);
    expect(CAMERAS_TILE.view).toBe(surfaceById.cameras.view);
  });

  it('is absent, DOM and all, for a tenant with no grant; present on that device once a grant is held', async () => {
    await render(createElement(CamerasTile, { viewer: TENANT, setView: () => {}, credential: NONE, fetchImpl: fakeFetch }));
    await settle();
    expect(tile()).toBeNull();
    expect(container.innerHTML).toBe('');
    localStorage.setItem(CAMERA_GRANT_KEY, GRANT);
    await render(createElement(CamerasTile, { viewer: TENANT, setView: () => {}, credential: { token: GRANT, kind: 'grant' }, fetchImpl: fakeFetch }));
    await settle();
    expect(tile()).toBeTruthy();
    expect(line()).toBe(`3 cameras · last frame ${HH_MM}`);
  });

  it('says the road is not reachable when it does not answer, never a painted number', async () => {
    plan.throwOn = '/cams/list';
    await render(createElement(CamerasTile, { viewer: FAMILY, setView: () => {}, credential: OWNER, fetchImpl: fakeFetch }));
    await settle();
    expect(tile().getAttribute('data-state')).toBe('unreachable');
    expect(line()).toBe('cameras not reachable from here');
    expect(line()).not.toMatch(/\d+ camera/);
  });

  it('a family device with no key yet reads the unauthenticated /health and says so', async () => {
    await render(createElement(CamerasTile, { viewer: FAMILY, setView: () => {}, credential: NONE, fetchImpl: fakeFetch }));
    await settle();
    expect(tile().getAttribute('data-state')).toBe('no-key');
    expect(line()).toBe(`4 cameras on the NAS · checked ${HH_MM} · this device has no key yet`);
  });

  it('is the first thing after the welcome on the Life Hub, and on the Current View', async () => {
    const world = { debts: [], accounts: [], transactions: [], inflows: { rentals: [] }, projects: [], dailyFocus: [], goals: [] };
    await render(createElement(LifeHub, { data: world, setData: () => {}, setView: () => {}, surfaces: surfaceById, viewer: FAMILY, welcomeName: 'Darrell' }));
    await settle();
    const hub = tile();
    expect(hub).toBeTruthy();
    // Right after the welcome hero: the previous element sibling is the hero.
    expect(hub.previousElementSibling).toBeTruthy();
    expect(hub.previousElementSibling.textContent).toMatch(/Darrell/);
    // Before the six tiles.
    const sixTiles = container.querySelector('nav[aria-label="Life Hub"]');
    expect(hub.compareDocumentPosition(sixTiles) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    act(() => root.unmount());
    container.remove();
    container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
    // A tenant: the hub stands, the tile is absent.
    await render(createElement(LifeHub, { data: world, setData: () => {}, setView: () => {}, surfaces: surfaceById, viewer: TENANT, welcomeName: 'Guest' }));
    await settle();
    expect(container.querySelector('nav[aria-label="Life Hub"]')).toBeTruthy();
    expect(tile()).toBeNull();
    act(() => root.unmount());
    container.remove();
    container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
    const noop = () => {};
    const props = {
      data: world, totals: { netCashFlow: 1, totalDebt: 0, collectionRate: 1, monthlyIn: 1, monthlyOut: 0 }, pressure: 3, setPressure: noop,
      pressureCalc: { extraToDebt: 0 }, projection: { debtFreeDate: 'Mar 2029', debtFreeYears: 2, interestSaved: 0, monthsSaved: 0 },
      rentalSnowball: { allClearedDate: 'Jun 2033', allClearedYears: 7, order: [] }, flaggedRentals: [], flaggedOpportunities: [], entityRollups: [],
      reserves: { recurringMonthly: 0, taxMonthly: 0, incidentMonthly: 0, totalMonthly: 0 }, upcomingEvents: [], welcomeDismissed: false, dismissWelcome: noop,
      setView: noop, setFeedbackOpen: noop, viewer: FAMILY,
    };
    await render(createElement(BigPictureDashboard, props));
    await settle();
    const cur = tile();
    expect(cur).toBeTruthy();
    expect(cur.previousElementSibling.textContent).toMatch(/Welcome to Your PoeTech Family OS/);
  });
});

describe('the line, from the road (pure)', () => {
  it('names each state in words, and the newest frame across the cameras', () => {
    expect(latestFrameAt({ a: { last_seen: 10 }, b: { last_seen: 20 }, c: { last_seen: null } })).toBe(20000);
    expect(latestFrameAt({})).toBeNull();
    expect(cameraTileLine({ state: 'ready', count: 1, lastFrameAt: null })).toBe('1 camera · no frame seen yet');
    expect(cameraTileLine({ state: 'ready', count: 2, lastFrameAt: SEEN_S * 1000 })).toBe(`2 cameras · last frame ${HH_MM}`);
    expect(cameraTileLine({ state: 'unreachable' })).toBe('cameras not reachable from here');
    expect(cameraTileLine({ state: 'refused' })).toMatch(/refused/);
    expect(cameraTileLine({ state: 'empty' })).toMatch(/no cameras yet/);
    expect(cameraTileLine({ state: 'no-key', count: 0, checkedAt: null })).toBe('the NAS answers · this device has no key yet');
    expect(cameraTileLine({ state: 'reading' })).toBe('reading the cameras…');
    expect(cameraTileLine({})).toBe('cameras not reachable from here');
  });

  it('readCameraTile: refused key, empty NAS, dark road, and a stream-health answer that is not the forwarder\'s', async () => {
    plan.list = 401;
    expect((await readCameraTile({ token: 'k', fetchImpl: fakeFetch })).state).toBe('refused');
    plan.list = 200; plan.cams = 0;
    expect((await readCameraTile({ token: 'k', fetchImpl: fakeFetch })).state).toBe('empty');
    plan.cams = 2; plan.streams = false;
    expect(await readCameraTile({ token: 'k', fetchImpl: fakeFetch })).toEqual({ state: 'ready', count: 2, lastFrameAt: null });
    plan.list = 502;
    expect((await readCameraTile({ token: 'k', fetchImpl: fakeFetch })).state).toBe('unreachable');
    plan.health = 502;
    expect((await readCameraTile({ token: '', fetchImpl: fakeFetch })).state).toBe('unreachable');
    plan.health = 200; plan.throwOn = '/cams/health';
    expect((await readCameraTile({ token: '', fetchImpl: fakeFetch })).state).toBe('unreachable');
  });
});
