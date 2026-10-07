// @vitest-environment jsdom
// The Cameras surface as a family member meets it (DR-0756) — copy and
// behavior tested together (DR-0691): every state says what it sees and the
// way forward; the live view opens IN PLACE under the tapped tile and Close
// takes it down; the registry carries the surface with the family gate.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import Cameras from '../components/Cameras.jsx';
import { SURFACES, surfaceById } from '../surfaces.js';
import { CHAT_BRIDGE_TOKEN_KEY } from '../lib/nas-photos.js';
import { WYZE_DRAFT_KEY } from '../lib/cameras.js';
import { getReadTarget, subscribeRead } from '../lib/read-target.js';

const TOKEN = 'family-test-token';

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    blob: async () => new Blob(['x'], { type: 'image/jpeg' }),
  };
}

function makeFetch(plan) {
  const calls = [];
  const fetchImpl = vi.fn(async (url, opts = {}) => {
    calls.push({ url: String(url), opts });
    const u = String(url);
    if (u === '/cams/health') return jsonResponse(plan.healthStatus ?? 200, plan.health ?? { ok: true, go2rtc: '1.9.14', streams: 2, live_max_seconds: 300 });
    if (u === '/cams/list') {
      if (plan.listThrows) throw new TypeError('Failed to fetch');
      return jsonResponse(plan.listStatus ?? 200, plan.list ?? { cameras: [], count: 0 });
    }
    if (u.startsWith('/cams/snap/')) {
      return { ok: true, status: 200, blob: async () => new Blob(['jpegbytes'], { type: 'image/jpeg' }), json: async () => ({}) };
    }
    if (u === '/cams/ticket') return jsonResponse(plan.ticketStatus ?? 200, { ticket: '9999999999.abcdef', expires_in: 90, camera: JSON.parse(opts.body).camera });
    if (u === '/cams/setup/wyze') return jsonResponse(plan.setupStatus ?? 200, plan.setup ?? { ok: true, added: 1, cameras: [{ id: 'front_yard', name: 'Front Yard', model: 'HL_CAM4', dtls: true, registered: true, existing: false }] });
    if (u === '/cams/restart') return jsonResponse(plan.restartStatus ?? 200, plan.restart ?? { ok: true, restarting: true, running: 'aaaa', on_disk: 'bbbb', changed: true });
    return jsonResponse(404, { error: 'not-found' });
  });
  return { fetchImpl, calls };
}

describe('Cameras surface', () => {
  let container; let root;
  beforeEach(() => {
    container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
    try { localStorage.setItem(CHAT_BRIDGE_TOKEN_KEY, TOKEN); } catch { /* jsdom has it */ }
    if (!URL.createObjectURL) URL.createObjectURL = () => 'blob:test';
    if (!URL.revokeObjectURL) URL.revokeObjectURL = () => {};
    // jsdom's media element has no decoder; Close calls pause()/load() on the
    // real element, so give them quiet no-ops instead of "Not implemented" noise.
    HTMLMediaElement.prototype.pause = () => {};
    HTMLMediaElement.prototype.load = () => {};
  });
  afterEach(() => {
    act(() => root.unmount()); container.remove();
    try { localStorage.removeItem(CHAT_BRIDGE_TOKEN_KEY); localStorage.removeItem(WYZE_DRAFT_KEY); } catch { /* fine */ }
    vi.unstubAllGlobals();
  });

  const mount = async () => { await act(async () => { root.render(createElement(Cameras)); }); await act(async () => { await Promise.resolve(); }); };
  const click = async (el) => { await act(async () => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); }); await act(async () => { await Promise.resolve(); }); };
  const buttons = () => [...container.querySelectorAll('button')];

  it('with no family key on the device: the honest gate, never a request for frames', async () => {
    localStorage.removeItem(CHAT_BRIDGE_TOKEN_KEY);
    const { fetchImpl, calls } = makeFetch({});
    vi.stubGlobal('fetch', fetchImpl);
    await mount();
    expect(container.textContent).toMatch(/This device has no family key yet/);
    expect(container.textContent).toMatch(/provisions the key itself/);
    expect(calls.some((c) => c.url === '/cams/list')).toBe(false);
    expect(calls.some((c) => c.url.startsWith('/cams/snap/'))).toBe(false);
  });

  it('a refused key says so (401), with the way back', async () => {
    const { fetchImpl } = makeFetch({ listStatus: 401, list: { error: 'unauthorized' } });
    vi.stubGlobal('fetch', fetchImpl);
    await mount();
    expect(container.textContent).toMatch(/family key on this device was refused/);
    expect(container.textContent).toMatch(/HTTP 401/);
  });

  it('a dark road (502) and a network failure both read as unreachable, naming the verify commands', async () => {
    const a = makeFetch({ listStatus: 502, healthStatus: 502, health: { ok: false, error: 'go2rtc-unreachable' } });
    vi.stubGlobal('fetch', a.fetchImpl);
    await mount();
    expect(container.textContent).toMatch(/camera road is not answering/);
    expect(container.textContent).toMatch(/restreamer dark/);
    expect(container.textContent).toMatch(/curl -s http:\/\/127\.0\.0\.1:8773\/health/);
    act(() => root.unmount()); container.remove();
    container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
    const b = makeFetch({ listThrows: true });
    vi.stubGlobal('fetch', b.fetchImpl);
    await mount();
    expect(container.textContent).toMatch(/could not reach poetech\.us\/cams at all/);
  });

  it('an empty restreamer shows the in-app Wyze sign-in first, the two paste-ready steps behind "Prefer a terminal?", and the honest Wyze limits', async () => {
    const { fetchImpl } = makeFetch({ list: { cameras: [], count: 0 }, health: { ok: true, go2rtc: '1.9.14', streams: 0 } });
    vi.stubGlobal('fetch', fetchImpl);
    await mount();
    expect(container.textContent).toMatch(/restreamer is up and has no cameras yet/);
    // The form is the way in: four fields, named, nothing typed into a terminal.
    const form = container.querySelector('[data-testid="wyze-setup"]');
    expect(form).not.toBeNull();
    expect([...form.querySelectorAll('input')].map((i) => i.getAttribute('aria-label'))).toEqual(['Wyze email', 'Wyze password', 'API ID', 'API Key']);
    // 2026-10-07: the key is NOT on my.wyze.com; the form links straight to Wyze's own page and says so, in steps.
    const link = form.querySelector('[data-testid="wyze-key-link"]');
    expect(link.getAttribute('href')).toBe('https://support.wyze.com/hc/en-us/articles/16129834216731');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(form.querySelectorAll('[data-testid="wyze-key-steps"] li')).toHaveLength(4);
    expect(form.textContent).toMatch(/not in the Wyze app, not on my\.wyze\.com/);
    expect(form.textContent).toMatch(/One-time step for the person who owns the Wyze account/);
    expect(container.querySelectorAll('pre')).toHaveLength(0);
    await click(buttons().find((b) => /Prefer a terminal\?/.test(b.textContent)));
    const pres = [...container.querySelectorAll('pre')].map((p) => p.textContent);
    expect(pres).toHaveLength(2);
    for (const p of pres) expect(p.startsWith('cd C:\\Users\\dpoe\\Kingdom-PWA-Node\n')).toBe(true);
    expect(pres[0]).toContain('/volume1/PoeTech/secrets/wyze.env');
    expect(pres[1]).toContain('ssh -L 1984:127.0.0.1:1984 dpoe@192.168.1.26');
    expect(container.textContent).toMatch(/Floodlight Pro\) are not yet supported/);
    // progressive disclosure: the per-kind how-to is on expand
    expect(container.textContent).not.toMatch(/onvif:\/\/user:pass/);
    await click(buttons().find((b) => /how each kind of system is added/.test(b.textContent)));
    expect(container.textContent).toMatch(/onvif:\/\/user:pass@192\.168\.1\.x/);
  });

  it('the Wyze sign-in posts the four values with the family bearer, names what was added, clears the fields, and reloads the list', async () => {
    const { fetchImpl, calls } = makeFetch({ list: { cameras: [], count: 0 }, health: { ok: true, go2rtc: '1.9.14', streams: 0 } });
    vi.stubGlobal('fetch', fetchImpl);
    await mount();
    const form = container.querySelector('[data-testid="wyze-setup"]');
    const set = (label, value) => {
      const input = form.querySelector(`input[aria-label="${label}"]`);
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(input, value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    };
    await act(async () => { set('Wyze email', 'd@example.com'); set('Wyze password', 'pw-secret'); set('API ID', 'id1'); set('API Key', 'key-secret'); });
    const listsBefore = calls.filter((c) => c.url === '/cams/list').length;
    await act(async () => { form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); await new Promise((r) => setTimeout(r, 20)); });
    const post = calls.find((c) => c.url === '/cams/setup/wyze');
    expect(post, 'nothing was sent to the NAS').toBeTruthy();
    expect(post.opts.method).toBe('POST');
    expect(post.opts.headers.Authorization).toBe(`Bearer ${TOKEN}`);
    expect(JSON.parse(post.opts.body)).toEqual({ email: 'd@example.com', password: 'pw-secret', api_id: 'id1', api_key: 'key-secret' });
    const result = container.querySelector('[data-testid="wyze-setup-result"]');
    expect(result.textContent).toMatch(/Signed in\. 1 camera added\./);
    expect(result.textContent).toMatch(/Front Yard · HL_CAM4 · added/);
    // The fields AND the device's draft are erased the moment the NAS accepts.
    expect([...form.querySelectorAll('input')].every((i) => i.value === '')).toBe(true);
    expect(localStorage.getItem(WYZE_DRAFT_KEY)).toBeNull();
    expect(calls.filter((c) => c.url === '/cams/list').length).toBeGreaterThan(listsBefore);
  });

  it('a Wyze refusal is said plainly, and nothing is cleared so the typo can be fixed', async () => {
    const { fetchImpl } = makeFetch({ list: { cameras: [], count: 0 }, health: { ok: true, go2rtc: '1.9.14', streams: 0 }, setupStatus: 401, setup: { error: 'wyze-sign-in-refused', detail: 'bad credentials' } });
    vi.stubGlobal('fetch', fetchImpl);
    await mount();
    const form = container.querySelector('[data-testid="wyze-setup"]');
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    await act(async () => {
      for (const [label, v] of [['Wyze email', 'd@example.com'], ['Wyze password', 'wrong'], ['API ID', 'id1'], ['API Key', 'k']]) {
        const input = form.querySelector(`input[aria-label="${label}"]`); setter.call(input, v); input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await act(async () => { form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); await new Promise((r) => setTimeout(r, 20)); });
    expect(container.querySelector('[data-testid="wyze-setup-result"]').textContent).toMatch(/Wyze refused the sign-in/);
    expect(form.querySelector('input[aria-label="Wyze email"]').value).toBe('d@example.com');
  });

  it('what was typed survives a reload: the draft is kept on the device until the NAS accepts it, and Clear erases it (2026-10-07 "Why am I needing to redo this?!")', async () => {
    const { fetchImpl } = makeFetch({ list: { cameras: [], count: 0 }, health: { ok: true, go2rtc: '1.9.14', streams: 0 } });
    vi.stubGlobal('fetch', fetchImpl);
    await mount();
    const form = container.querySelector('[data-testid="wyze-setup"]');
    expect(container.querySelector('[data-testid="wyze-draft-restored"]')).toBeNull();
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    await act(async () => {
      for (const [label, v] of [['Wyze email', 'd@example.com'], ['Wyze password', 'pw-secret'], ['API ID', 'id1'], ['API Key', 'key-secret']]) {
        const input = form.querySelector(`input[aria-label="${label}"]`); setter.call(input, v); input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    expect(JSON.parse(localStorage.getItem(WYZE_DRAFT_KEY))).toEqual({ email: 'd@example.com', password: 'pw-secret', api_id: 'id1', api_key: 'key-secret' });
    // The app redeploys under him: unmount, mount again (what a reload does).
    await act(async () => root.unmount());
    root = createRoot(container);
    await mount();
    const form2 = container.querySelector('[data-testid="wyze-setup"]');
    expect(form2.querySelector('input[aria-label="Wyze email"]').value).toBe('d@example.com');
    expect(form2.querySelector('input[aria-label="API Key"]').value).toBe('key-secret');
    expect(container.querySelector('[data-testid="wyze-draft-restored"]').textContent).toMatch(/earlier entries are still here/);
    await click(container.querySelector('[data-testid="wyze-clear"]'));
    expect([...form2.querySelectorAll('input')].every((i) => i.value === '')).toBe(true);
    expect(localStorage.getItem(WYZE_DRAFT_KEY)).toBeNull();
  });

  it('the Wyze steps are this screen\'s reading: registered with the form element, and Hear the steps asks the reader for them', async () => {
    const { fetchImpl } = makeFetch({ list: { cameras: [], count: 0 }, health: { ok: true, go2rtc: '1.9.14', streams: 0 } });
    vi.stubGlobal('fetch', fetchImpl);
    const wants = [];
    const off = subscribeRead((w) => wants.push(w));
    await mount();
    const t = getReadTarget();
    expect(t).not.toBeNull();
    expect(t.owner).toBe('cameras-wyze-setup');
    expect(t.elementId).toBe('wyze-setup');
    expect(document.getElementById('wyze-setup')).not.toBeNull();
    expect(t.text).toMatch(/Step 1\. Open the Wyze API key page/);
    expect(t.text).toMatch(/Step 4\. Come back here/);
    await click(container.querySelector('[data-testid="wyze-hear-steps"]'));
    expect(wants.some((w) => w && w.owner === 'cameras-wyze-setup' && w.opts && w.opts.startSentence === 0)).toBe(true);
    off();
    await act(async () => root.unmount());
    root = createRoot(container);
    expect(getReadTarget()).toBeNull();
  });

  it('the service says when it runs older code than is on disk, and one button restarts it from here (DR-0772)', async () => {
    const { fetchImpl, calls } = makeFetch({ list: { cameras: [], count: 0 }, health: { ok: true, go2rtc: '1.9.14', streams: 0, forwarder: 'aaaa', on_disk: 'bbbb' } });
    vi.stubGlobal('fetch', fetchImpl);
    await mount();
    expect(container.querySelector('[data-testid="service-behind"]').textContent).toMatch(/running aaaa · on disk bbbb/);
    const btn = container.querySelector('[data-testid="service-restart-button"]');
    expect(btn.textContent).toMatch(/Update the camera service now/);
    await click(btn);
    await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
    const post = calls.find((c) => c.url === '/cams/restart');
    expect(post.opts.method).toBe('POST');
    expect(post.opts.headers.Authorization).toBe(`Bearer ${TOKEN}`);
    expect(container.querySelector('[data-testid="service-restart-result"]').textContent).toMatch(/Restarting the camera service on the newer code/);
  });

  it('a current service shows no behind notice, and an older service that cannot restart is said plainly (404)', async () => {
    const { fetchImpl } = makeFetch({ list: { cameras: [], count: 0 }, health: { ok: true, go2rtc: '1.9.14', streams: 0, forwarder: 'aaaa', on_disk: 'aaaa' }, restartStatus: 404, restart: { error: 'not-found' } });
    vi.stubGlobal('fetch', fetchImpl);
    await mount();
    expect(container.querySelector('[data-testid="service-behind"]')).toBeNull();
    const btn = container.querySelector('[data-testid="service-restart-button"]');
    expect(btn.textContent).toMatch(/Restart the camera service/);
    await click(btn);
    await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
    expect(container.querySelector('[data-testid="service-restart-result"]').textContent).toMatch(/older camera service that cannot restart itself yet/);
  });

  it('lists the restreamer\'s cameras grouped by kind, fetches each frame with the bearer, shows measured freshness', async () => {
    const { fetchImpl, calls } = makeFetch({ list: { cameras: [
      { id: 'front_yard', name: 'front yard', kind: 'wyze' },
      { id: 'garage', name: 'garage', kind: 'rtsp' },
    ], count: 2 } });
    vi.stubGlobal('fetch', fetchImpl);
    await mount();
    await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
    expect(container.textContent).toMatch(/NAS restreamer up · go2rtc 1\.9\.14 · 2 streams/);
    expect(container.textContent).toMatch(/Wyze · 1/);
    expect(container.textContent).toMatch(/RTSP \/ RTMP · 1/);
    expect(container.textContent).toMatch(/front yard/);
    const snaps = calls.filter((c) => c.url.startsWith('/cams/snap/'));
    expect(snaps.length).toBeGreaterThanOrEqual(2);
    for (const s of snaps) expect(s.opts.headers.Authorization).toBe(`Bearer ${TOKEN}`);
    expect(snaps[0].url).toMatch(/^\/cams\/snap\/front_yard\.jpg\?w=640$/);
    const imgs = [...container.querySelectorAll('img')];
    expect(imgs.length).toBe(2);
    expect(imgs[0].getAttribute('alt')).toMatch(/latest frame/);
    expect(container.textContent).toMatch(/frame just now · \d+ ms · \d+ B/);
    // the list call carried the bearer too
    expect(calls.find((c) => c.url === '/cams/list').opts.headers.Authorization).toBe(`Bearer ${TOKEN}`);
  });

  it('Live asks for a one-camera ticket, opens a <video> IN PLACE under the tile with the ticketed URL, and Close takes it down', async () => {
    const { fetchImpl, calls } = makeFetch({ list: { cameras: [
      { id: 'front_yard', name: 'front yard', kind: 'wyze' },
      { id: 'garage', name: 'garage', kind: 'rtsp' },
    ], count: 2 } });
    vi.stubGlobal('fetch', fetchImpl);
    await mount();
    await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
    const liveBtn = buttons().find((b) => b.textContent === 'Live');
    await click(liveBtn);
    const ticketCall = calls.find((c) => c.url === '/cams/ticket');
    expect(ticketCall).toBeTruthy();
    expect(ticketCall.opts.method).toBe('POST');
    expect(ticketCall.opts.headers.Authorization).toBe(`Bearer ${TOKEN}`);
    expect(JSON.parse(ticketCall.opts.body)).toEqual({ camera: 'front_yard' });
    const video = container.querySelector('video');
    expect(video).toBeTruthy();
    // jsdom's <video> answers '' to canPlayType, so the device gets MP4 — and the URL carries the ticket as t=
    expect(video.getAttribute('src')).toBe('/cams/live/front_yard.mp4?t=9999999999.abcdef');
    expect(video.hasAttribute('playsinline')).toBe(true);
    expect(container.textContent).toMatch(/MP4 · this device plays it natively/);
    expect(container.textContent).toMatch(/waiting for the first picture/);
    // in place: the live row is the next sibling of the tapped tile, inside the same grid
    const liveRow = container.querySelector('[data-testid="live-view"]');
    expect(liveRow.previousElementSibling.textContent).toMatch(/front yard/);
    // the first picture is measured by the element's own event
    await act(async () => { video.dispatchEvent(new Event('loadeddata')); });
    expect(container.textContent).toMatch(/first picture in \d+\.\d s/);
    await click(buttons().find((b) => b.textContent === 'Close'));
    expect(container.querySelector('video')).toBeFalsy();
    expect(container.querySelector('[data-testid="live-view"]')).toBeFalsy();
  });

  it('when the NAS ends the live view, the screen says why and offers Resume', async () => {
    const { fetchImpl } = makeFetch({ list: { cameras: [{ id: 'front_yard', name: 'front yard', kind: 'wyze' }], count: 1 } });
    vi.stubGlobal('fetch', fetchImpl);
    await mount();
    await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
    await click(buttons().find((b) => b.textContent === 'Live'));
    const video = container.querySelector('video');
    await act(async () => { video.dispatchEvent(new Event('loadeddata')); });
    await act(async () => { video.dispatchEvent(new Event('ended')); });
    expect(container.textContent).toMatch(/Live view ended after \d+ s \(the NAS stops each live view at 300 s to protect the home link\)/);
    expect(buttons().some((b) => b.textContent === 'Resume')).toBe(true);
  });

  it('is registered as a family-only, hidden-when-denied top-level surface', () => {
    const s = surfaceById['cameras'];
    expect(s).toBeTruthy();
    expect(s.nav).toBe('top');
    expect(s.view).toBe('cameras');
    expect(s.requires).toBe('family');
    expect(s.whenDenied).toBe('hide');
    expect(SURFACES.filter((x) => x.view === 'cameras')).toHaveLength(1);
  });
});
