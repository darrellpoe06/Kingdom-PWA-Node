// =============================================================================
// The Life Hub's live camera, and the painted home that says what it is (DR-1181)
// =============================================================================
// Darrell, 2026-10-21, circling the space beside the Life Hub's title: "a live
// stream of the camera chosen by the user... With a connect a camera feed or
// even a ability to see smaller ones and click on one to stay there
// consistently... it should be a picture of their home or a home and the text
// explains the function of the space." And: "advertising that surveillance is
// also available."
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import HubCamera from '../components/HubCamera.jsx';
import {
  HUB_CAMERA_KEY, HUB_THUMBS_MAX, HUB_CAMERA_WORDS, loadHubCamera, saveHubCamera,
  pickHubCamera, hubThumbs, hubCameraState,
} from '../lib/hub-camera.js';
import { resetDirectState } from '../lib/camera-direct.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const CAMS = [
  { id: 'back_yard', name: 'Back Yard', kind: 'wyze', sd: true },
  { id: 'front_porch', name: 'Front Porch', kind: 'wyze', sd: true },
  { id: 'garage', name: 'Garage', kind: 'rtsp' },
  { id: 'kitchen', name: 'Kitchen', kind: 'wyze' },
  { id: 'lot', name: 'Lot', kind: 'rtsp' },
  { id: 'nursery', name: 'Nursery', kind: 'wyze' },
];
const OWNER = { token: 'family-key', kind: 'owner' };

const memStore = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), m };
};

const plan = { status: 200, list: CAMS, calls: [] };
const fakeFetch = async (url, opts = {}) => {
  const u = String(url);
  plan.calls.push({ url: u, auth: (opts.headers || {}).Authorization || '' });
  if (u.endsWith('/list')) return { ok: plan.status === 200, status: plan.status, json: async () => ({ cameras: plan.list, count: plan.list.length }) };
  if (u.includes('/snap/')) return { ok: true, status: 200, blob: async () => new Blob(['jpeg'], { type: 'image/jpeg' }) };
  if (u.endsWith('/ticket')) return { ok: true, status: 200, json: async () => ({ ticket: 'tkt' }) };
  return { ok: false, status: 404, json: async () => ({}) };
};

let host = null;
let root = null;
const render = async (el) => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => { root.render(el); });
  return host;
};
const settle = async (ms = 60) => { await act(async () => { await new Promise((r) => setTimeout(r, ms)); }); };
// The player is the Cameras tab's own TileLive, fetched lazily and asking its
// ticket with the page's fetch: wait for it rather than guess a delay.
const until = async (ok, ms = 4000) => {
  const end = Date.now() + ms;
  while (!ok() && Date.now() < end) await settle(25);
  return ok();
};
beforeEach(() => { vi.stubGlobal('fetch', fakeFetch); });
afterEach(() => {
  if (root) act(() => root.unmount());
  if (host && host.parentNode) host.parentNode.removeChild(host);
  root = null; host = null;
  plan.status = 200; plan.list = CAMS; plan.calls = [];
  resetDirectState();
  vi.unstubAllGlobals();
});

describe('lib/hub-camera', () => {
  it('keeps the choice on this device, and plays it only while the credential still opens it', () => {
    const s = memStore();
    expect(loadHubCamera(s)).toBe('');
    saveHubCamera('garage', s);
    expect(s.getItem(HUB_CAMERA_KEY)).toBe('garage');
    expect(pickHubCamera(CAMS, loadHubCamera(s)).id).toBe('garage');
    expect(pickHubCamera(CAMS, 'a_camera_the_grant_no_longer_opens').id).toBe('back_yard');
    expect(pickHubCamera([], 'garage')).toBe(null);
  });

  it('the small frames are the OTHER cameras, at most four', () => {
    const t = hubThumbs(CAMS, CAMS[1]);
    expect(t.map((c) => c.id)).toEqual(['back_yard', 'garage', 'kitchen', 'lot']);
    expect(t.length).toBe(HUB_THUMBS_MAX);
    expect(hubThumbs([CAMS[0]], CAMS[0])).toEqual([]);
  });

  it('a road that did not answer is never "no cameras" (DR-0076)', () => {
    expect(hubCameraState({ token: '' })).toBe('advert');
    expect(hubCameraState({ token: 'k', status: 'loading' })).toBe('reading');
    expect(hubCameraState({ token: 'k', status: 'http-503' })).toBe('no-answer');
    expect(hubCameraState({ token: 'k', status: 'unreachable' })).toBe('no-answer');
    expect(hubCameraState({ token: 'k', status: 'ready', cameras: [] })).toBe('connect');
    expect(hubCameraState({ token: 'k', status: 'ready', cameras: CAMS })).toBe('live');
  });
});

describe('HubCamera', () => {
  it('a device with no camera key sees the painted home and the words for the space, and NOTHING is asked of the NAS', async () => {
    const el = await render(createElement(HubCamera, { credential: { token: '', kind: 'none' }, fetchImpl: fakeFetch, storage: memStore() }));
    await settle();
    expect(el.querySelector('[data-testid="hub-camera"]').getAttribute('data-state')).toBe('advert');
    expect(el.textContent).toContain(HUB_CAMERA_WORDS.title);
    expect(el.querySelector('[data-testid="hub-camera-advert"]').textContent).toBe(HUB_CAMERA_WORDS.advert);
    expect(el.textContent).toMatch(/Cameras tab/);
    expect(el.querySelector('svg')).toBeTruthy();
    expect(el.querySelector('video')).toBe(null);
    expect(plan.calls).toEqual([]);
  });

  it('with a key, the chosen camera plays live with the others small beneath it, and a tap keeps one there', async () => {
    const s = memStore();
    const el = await render(createElement(HubCamera, { credential: OWNER, fetchImpl: fakeFetch, storage: s }));
    await until(() => el.querySelector('[data-testid="tile-live-back_yard"] video'));
    const live = el.querySelector('[data-testid="hub-camera-live"]');
    expect(live).toBeTruthy();
    expect(live.getAttribute('data-camera')).toBe('back_yard');
    expect(el.querySelector('[data-testid="tile-live-back_yard"] video')).toBeTruthy();
    // the SD twin, because the NAS keeps one for this camera
    expect(el.querySelector('[data-testid="tile-live-back_yard"] video').getAttribute('src')).toMatch(/back_yard_sd/);
    expect(el.querySelectorAll('[data-testid^="hub-camera-thumb-"]').length).toBe(4);
    // every NAS call carried this device's own key
    expect(plan.calls.every((c) => c.auth === 'Bearer family-key')).toBe(true);
    // small frames are stills, never more live views
    expect(plan.calls.filter((c) => c.url.includes('/snap/')).length).toBe(4);
    expect(plan.calls.filter((c) => c.url.endsWith('/ticket')).length).toBe(1);
    // a tap keeps it, on this device
    await act(async () => { el.querySelector('[data-testid="hub-camera-thumb-garage"]').click(); });
    await until(() => el.querySelector('[data-testid="tile-live-garage"] video'));
    expect(s.getItem(HUB_CAMERA_KEY)).toBe('garage');
    expect(el.querySelector('[data-testid="hub-camera-live"]').getAttribute('data-camera')).toBe('garage');
    expect(el.querySelector('[data-testid="tile-live-back_yard"]')).toBe(null);
    expect(el.querySelector('[data-testid="hub-camera-thumb-back_yard"]')).toBeTruthy();
  });

  it('the kept choice plays first next time', async () => {
    const s = memStore();
    saveHubCamera('kitchen', s);
    const el = await render(createElement(HubCamera, { credential: OWNER, fetchImpl: fakeFetch, storage: s }));
    await until(() => el.querySelector('[data-testid="hub-camera-live"]'));
    expect(el.querySelector('[data-testid="hub-camera-live"]').getAttribute('data-camera')).toBe('kitchen');
    expect(el.querySelector('[data-testid="hub-camera-thumb-kitchen"]')).toBe(null);
  });

  it('a key that opens no camera yet says so, and Cameras opens the tab to connect one', async () => {
    plan.list = [];
    const setView = vi.fn();
    const el = await render(createElement(HubCamera, { credential: OWNER, fetchImpl: fakeFetch, storage: memStore(), setView }));
    await settle();
    expect(el.querySelector('[data-testid="hub-camera"]').getAttribute('data-state')).toBe('connect');
    expect(el.querySelector('[data-testid="hub-camera-says"]').textContent).toBe(HUB_CAMERA_WORDS.connect);
    await act(async () => { el.querySelector('[data-testid="hub-camera-open"]').click(); });
    expect(setView).toHaveBeenCalledWith('cameras');
  });

  it('a road that did not answer says it did not, never "no cameras"', async () => {
    plan.status = 503;
    const el = await render(createElement(HubCamera, { credential: OWNER, fetchImpl: fakeFetch, storage: memStore() }));
    await settle();
    expect(el.querySelector('[data-testid="hub-camera"]').getAttribute('data-state')).toBe('no-answer');
    expect(el.querySelector('[data-testid="hub-camera-says"]').textContent).toBe(HUB_CAMERA_WORDS.noAnswer);
    expect(el.querySelector('video')).toBe(null);
  });

  it('leaving the Hub gives the stream back (DR-1097): the element it played has no src', async () => {
    const el = await render(createElement(HubCamera, { credential: OWNER, fetchImpl: fakeFetch, storage: memStore() }));
    await until(() => el.querySelector('[data-testid="tile-live-back_yard"] video'));
    const v = el.querySelector('[data-testid="tile-live-back_yard"] video');
    expect(v.hasAttribute('src')).toBe(true);
    act(() => root.unmount());
    root = null;
    expect(v.hasAttribute('src')).toBe(false);
  });
});
