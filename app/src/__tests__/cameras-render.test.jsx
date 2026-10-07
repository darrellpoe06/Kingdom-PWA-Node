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
import { WYZE_DRAFT_KEY, WALL_KEY, LIVE_RECONNECT_MAX, LIVE_RECONNECT_DELAY_MS, formatBytes, LIVE_TILES_KEY } from '../lib/cameras.js';
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
    if (u === '/cams/health') return jsonResponse(plan.healthStatus ?? 200, plan.health ?? { ok: true, go2rtc: '1.9.14', streams: 2, live_max_seconds: 0, max_live: 12 });
    if (u === '/cams/list') {
      if (plan.listThrows) throw new TypeError('Failed to fetch');
      return jsonResponse(plan.listStatus ?? 200, plan.list ?? { cameras: [], count: 0 });
    }
    if (u.startsWith('/cams/snap/')) {
      const id = decodeURIComponent(u.slice('/cams/snap/'.length).split('.jpg')[0]);
      const fail = plan.snapFail && plan.snapFail[id];
      if (fail) return jsonResponse(fail.status, fail.body);
      return { ok: true, status: 200, blob: async () => new Blob(['jpegbytes'], { type: 'image/jpeg' }), json: async () => ({}) };
    }
    if (u === '/cams/recording' && (opts.method || 'GET') === 'GET') return jsonResponse(plan.recordingStatus ?? 404, plan.recording ?? { error: 'not-found' });
    if (u === '/cams/recording' && opts.method === 'PUT') { const cfg = JSON.parse(opts.body); return jsonResponse(200, { ok: true, config: cfg }); }
    if (u.startsWith('/cams/rec/') && u.split('/').length === 4) return jsonResponse(200, plan.clips ?? { camera: 'front_yard', clips: [{ name: '2026-10-07T06-40-00.mp4', bytes: 1000, start: 1 }, { name: '2026-10-07T06-50-00.mp4', bytes: 2000, start: 2 }], count: 2 });
    if (u.startsWith('/cams/why/')) return jsonResponse(plan.whyStatus ?? 200, plan.why ?? { id: 'x', producers: [{ kind: 'wyze', host: '192.168.1.77', state: 'connecting' }], probe: { status: 500, ok: false, error: 'wyze: connect failed: dial udp 192.168.1.77:0: i/o timeout', ms: 900 }, log: ['06:40 warn [wyze] connect failed: i/o timeout'] });
    if (u === '/cams/ticket') return jsonResponse(plan.ticketStatus ?? 200, { ticket: '9999999999.abcdef', expires_in: 90, camera: JSON.parse(opts.body).camera });
    if (u === '/cams/setup/wyze') return jsonResponse(plan.setupStatus ?? 200, plan.setup ?? { ok: true, added: 1, cameras: [{ id: 'front_yard', name: 'Front Yard', model: 'HL_CAM4', dtls: true, registered: true, existing: false }] });
    if (u === '/cams/restart') return jsonResponse(plan.restartStatus ?? 200, plan.restart ?? { ok: true, restarting: true, running: 'aaaa', on_disk: 'bbbb', changed: true });
    if (u === '/cams/devices') return jsonResponse(plan.devicesStatus ?? 200, plan.devices ?? { devices: [], count: 0, garages: 0 });
    if (u === '/cams/action') { const b = JSON.parse(opts.body); return jsonResponse(plan.actionStatus ?? 200, plan.action ?? { ok: true, mac: b.mac, nickname: 'Garage Doors', action: b.action, action_key: 'garage_door_trigger' }); }
    if (u === '/cams/setup/wyze/again') return jsonResponse(plan.againStatus ?? 200, plan.again ?? { ok: true, added: 2, again: true, cameras: [{ id: 'front_yard', name: 'Front Yard', registered: true, existing: false }, { id: 'garage_doors', name: 'Garage Doors', registered: true, existing: true }] });
    return jsonResponse(404, { error: 'not-found' });
  });
  return { fetchImpl, calls };
}

describe('Cameras surface', () => {
  let container; let root;
  beforeEach(() => {
    container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
    try { localStorage.setItem(CHAT_BRIDGE_TOKEN_KEY, TOKEN); } catch { /* jsdom has it */ }
    // Most cases below exercise the snapshot road, the in-place live view and the
    // wall; live-in-every-tile (DR-0776, the default) has its own case and is
    // switched off here so each road is tested on its own.
    try { localStorage.setItem(LIVE_TILES_KEY, '0'); } catch { /* fine */ }
    if (!URL.createObjectURL) URL.createObjectURL = () => 'blob:test';
    if (!URL.revokeObjectURL) URL.revokeObjectURL = () => {};
    // jsdom's media element has no decoder; Close calls pause()/load() on the
    // real element, so give them quiet no-ops instead of "Not implemented" noise.
    HTMLMediaElement.prototype.pause = () => {};
    HTMLMediaElement.prototype.load = () => {};
  });
  afterEach(() => {
    act(() => root.unmount()); container.remove();
    try { localStorage.removeItem(CHAT_BRIDGE_TOKEN_KEY); localStorage.removeItem(WYZE_DRAFT_KEY); localStorage.removeItem(WALL_KEY); localStorage.removeItem(LIVE_TILES_KEY); } catch { /* fine */ }
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

  it('recorded loops: Record switches a camera on with a retention, the budget saves, clips list by day and play through a long ticket (DR-0775)', async () => {
    const now = Math.floor(Date.now() / 1000);
    const { fetchImpl, calls } = makeFetch({
      list: { cameras: [{ id: 'front_yard', name: 'front yard', kind: 'wyze' }], count: 1 },
      recordingStatus: 200,
      recording: { config: { disk_budget_gb: 100, cameras: {} }, status: { ok: true, at: now, disk_budget_gb: 100, total_bytes: 3000, disk_free_bytes: 500e9, cameras: { front_yard: { enabled: false, recording: false, clips: 2, bytes: 3000, oldest: now - 1200, newest: now - 600, restarts: 0, last_exit: null } } }, root: '/volume1/PoeTech/cameras/recordings' },
    });
    vi.stubGlobal('fetch', fetchImpl);
    await mount();
    await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
    const panel = container.querySelector('[data-testid="recording-panel"]');
    expect(panel.textContent).toMatch(/No camera is recording\./);
    expect(panel.textContent).toContain(`On disk: ${formatBytes(3000)} of a 100 GB budget`);
    expect(panel.textContent).toContain(`2 clips · ${formatBytes(3000)}`);
    // switch Record on: a PUT with the camera enabled and the default 14 days
    await click(buttons().find((b) => b.getAttribute('aria-label') === 'Record front yard'));
    await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
    const put = calls.find((c) => c.url === '/cams/recording' && c.opts.method === 'PUT');
    expect(put.opts.headers.Authorization).toBe(`Bearer ${TOKEN}`);
    expect(JSON.parse(put.opts.body)).toEqual({ disk_budget_gb: 100, cameras: { front_yard: { enabled: true, retention_days: 14 } } });
    expect(container.querySelector('[data-testid="recording-note"]').textContent).toMatch(/Saved/);
    const sel = panel.querySelector('select');
    expect(sel.value).toBe('14');
    // the retention select sends the chosen days
    const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
    await act(async () => { setter.call(sel, '30'); sel.dispatchEvent(new Event('change', { bubbles: true })); await new Promise((r) => setTimeout(r, 20)); });
    const puts = calls.filter((c) => c.url === '/cams/recording' && c.opts.method === 'PUT');
    expect(JSON.parse(puts[puts.length - 1].opts.body).cameras.front_yard.retention_days).toBe(30);
    // the budget
    const budgetInput = panel.querySelector('input[type="number"]');
    const iset = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    await act(async () => { iset.call(budgetInput, '250'); budgetInput.dispatchEvent(new Event('input', { bubbles: true })); });
    await click(buttons().find((b) => b.textContent === 'Save budget'));
    await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
    const puts2 = calls.filter((c) => c.url === '/cams/recording' && c.opts.method === 'PUT');
    expect(JSON.parse(puts2[puts2.length - 1].opts.body).disk_budget_gb).toBe(250);
    // clips: listed by day, newest first; a tap mints an hour ticket and plays through /rec
    await click(buttons().find((b) => b.getAttribute('aria-label') === 'Show clips of front yard'));
    await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
    expect(calls.find((c) => c.url === '/cams/rec/front_yard').opts.headers.Authorization).toBe(`Bearer ${TOKEN}`);
    const clipsBox = container.querySelector('[data-testid="clips"]');
    expect(clipsBox.textContent).toContain(`2026-10-07 · 2 clips · ${formatBytes(3000)}`);
    const clipBtns = [...clipsBox.querySelectorAll('button')].filter((b) => /Play the clip/.test(b.getAttribute('aria-label') || ''));
    expect(clipBtns.map((b) => b.textContent)).toEqual([`06:50 · ${formatBytes(2000)}`, `06:40 · ${formatBytes(1000)}`]);
    await click(clipBtns[1]);
    await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
    const ticket = calls.filter((c) => c.url === '/cams/ticket').pop();
    expect(JSON.parse(ticket.opts.body)).toEqual({ camera: 'front_yard', ttl: 3600 });
    const player = container.querySelector('[data-testid="clip-player"] video');
    expect(player.getAttribute('src')).toBe('/cams/rec/front_yard/2026-10-07T06-40-00.mp4?t=9999999999.abcdef');
  });

  it('an older NAS without the recorder is said plainly, nothing painted', async () => {
    const { fetchImpl } = makeFetch({ list: { cameras: [{ id: 'front_yard', name: 'front yard', kind: 'wyze' }], count: 1 } });
    vi.stubGlobal('fetch', fetchImpl);
    await mount();
    await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
    expect(container.querySelector('[data-testid="recording-panel"]').textContent).toMatch(/older camera service without the recorder yet/);
    expect(container.querySelector('[data-testid="recording-cameras"]')).toBeNull();
  });

  it('live in every tile is the default (DR-0776): each camera tile is a live player with its own ticket, no snapshots are polled for them, the toggle falls back to frames, and the header shows the measured Funnel traffic', async () => {
    try { localStorage.removeItem(LIVE_TILES_KEY); } catch { /* fine */ }
    const { fetchImpl, calls } = makeFetch({
      list: { cameras: [{ id: 'front_yard', name: 'front yard', kind: 'wyze' }, { id: 'garage', name: 'garage', kind: 'rtsp' }], count: 2 },
      health: { ok: true, go2rtc: '1.9.14', streams: 2, live_max_seconds: 0, max_live: 32, live_open: 2, live_bytes_per_s: 250000 },
    });
    vi.stubGlobal('fetch', fetchImpl);
    await mount();
    await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
    expect(container.querySelector('[data-testid="tile-live-front_yard"] video')).toBeTruthy();
    expect(container.querySelector('[data-testid="tile-live-garage"] video')).toBeTruthy();
    const tickets = calls.filter((c) => c.url === '/cams/ticket').map((c) => JSON.parse(c.opts.body).camera).sort();
    expect(tickets).toEqual(['front_yard', 'garage']);
    expect(calls.filter((c) => c.url.startsWith('/cams/snap/')).length).toBe(0);
    expect(container.querySelector('[data-testid="live-traffic"]').textContent).toBe('2 live streams · 2.0 Mbit/s through the Funnel');
    expect(container.textContent).toMatch(/Live in every tile · on/);
    // off: tiles go back to frames every 5 s and the choice is kept on the device
    await click(container.querySelector('[data-testid="live-tiles-toggle"]'));
    await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
    expect(container.querySelector('[data-testid="tile-live-front_yard"]')).toBeNull();
    expect(calls.filter((c) => c.url.startsWith('/cams/snap/')).length).toBeGreaterThanOrEqual(2);
    expect(localStorage.getItem(LIVE_TILES_KEY)).toBe('0');
    expect(container.textContent).toMatch(/Live in every tile · off/);
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

  it('a live view that ends on its own reconnects itself (a new ticket, the count shown) and offers Resume only after the last try (DR-0774)', async () => {
    const { fetchImpl, calls } = makeFetch({ list: { cameras: [{ id: 'front_yard', name: 'front yard', kind: 'wyze' }], count: 1 } });
    vi.stubGlobal('fetch', fetchImpl);
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      await mount();
      await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
      await click(buttons().find((b) => b.textContent === 'Live'));
      let video = container.querySelector('video');
      await act(async () => { video.dispatchEvent(new Event('loadeddata')); });
      const ticketsBefore = calls.filter((c) => c.url === '/cams/ticket').length;
      await act(async () => { video.dispatchEvent(new Event('ended')); });
      expect(container.querySelector('[data-testid="live-view-status"]').textContent).toMatch(/Reconnecting \(the stream ended on its own\)/);
      expect(buttons().some((b) => b.textContent === 'Resume')).toBe(false);
      await act(async () => { await vi.advanceTimersByTimeAsync(LIVE_RECONNECT_DELAY_MS + 50); });
      expect(calls.filter((c) => c.url === '/cams/ticket').length).toBe(ticketsBefore + 1);
      video = container.querySelector('video');
      expect(video).toBeTruthy();
      expect(container.querySelector('[data-testid="live-view-reconnects"]').textContent).toBe('reconnected 1×');
      // and it never says the NAS stopped it at a clock the NAS does not run (live_max_seconds 0)
      expect(container.textContent).not.toMatch(/stops each live view at/);
      for (let i = 1; i < LIVE_RECONNECT_MAX; i += 1) {
        await act(async () => { container.querySelector('video').dispatchEvent(new Event('error')); });
        await act(async () => { await vi.advanceTimersByTimeAsync(LIVE_RECONNECT_DELAY_MS + 50); });
      }
      await act(async () => { container.querySelector('video').dispatchEvent(new Event('error')); });
      expect(container.querySelector('[data-testid="live-view-status"]').textContent).toMatch(new RegExp(`Stopped after ${LIVE_RECONNECT_MAX} reconnects`));
      expect(buttons().some((b) => b.textContent === 'Resume')).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('the wall shows several cameras live together, each with its own ticket, and Remove / Clear take them down (DR-0774)', async () => {
    const { fetchImpl, calls } = makeFetch({ list: { cameras: [
      { id: 'front_yard', name: 'front yard', kind: 'wyze' },
      { id: 'garage', name: 'garage', kind: 'rtsp' },
    ], count: 2 } });
    vi.stubGlobal('fetch', fetchImpl);
    await mount();
    await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
    expect(container.querySelector('[data-testid="camera-wall"]').textContent).toMatch(/Watch together · 0 of 12/);
    await click(buttons().find((b) => b.getAttribute('aria-label') === 'Add front yard to the wall'));
    await click(buttons().find((b) => b.getAttribute('aria-label') === 'Add garage to the wall'));
    await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
    expect(container.querySelector('[data-testid="wall-front_yard"] video')).toBeTruthy();
    expect(container.querySelector('[data-testid="wall-garage"] video')).toBeTruthy();
    const tickets = calls.filter((c) => c.url === '/cams/ticket').map((c) => JSON.parse(c.opts.body).camera);
    expect(tickets).toEqual(['front_yard', 'garage']);
    expect(JSON.parse(localStorage.getItem(WALL_KEY))).toEqual(['front_yard', 'garage']);
    expect(container.querySelector('[data-testid="camera-wall"]').textContent).toMatch(/Watch together · 2 of 12/);
    // a camera on the wall is not also polled for a snapshot (the live view IS the frame)
    const snapsBefore = calls.filter((c) => c.url.startsWith('/cams/snap/')).length;
    await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
    expect(calls.filter((c) => c.url.startsWith('/cams/snap/')).length).toBe(snapsBefore);
    await click(buttons().find((b) => b.getAttribute('aria-label') === 'Remove garage from the wall'));
    expect(container.querySelector('[data-testid="wall-garage"]')).toBeNull();
    await click(buttons().find((b) => b.textContent === 'Clear the wall'));
    expect(container.querySelector('[data-testid="wall-front_yard"]')).toBeNull();
    expect(localStorage.getItem(WALL_KEY)).toBeNull();
  });

  it('a blank tile names its real cause and Why? brings the NAS\'s explanation in plain words (DR-0774)', async () => {
    const { fetchImpl, calls } = makeFetch({
      list: { cameras: [{ id: 'east_north_cam', name: 'east north cam', kind: 'wyze' }], count: 1 },
      snapFail: { east_north_cam: { status: 504, body: { error: 'frame-timeout', after_s: 12 } } },
    });
    vi.stubGlobal('fetch', fetchImpl);
    await mount();
    await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
    expect(container.querySelector('[data-testid="reason-east_north_cam"]').textContent).toMatch(/no answer in 12 s/);
    expect(container.textContent).not.toMatch(/HTTP 502/);
    await click(buttons().find((b) => b.textContent === 'Why?'));
    await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
    const why = calls.find((c) => c.url === '/cams/why/east_north_cam');
    expect(why.opts.headers.Authorization).toBe(`Bearer ${TOKEN}`);
    const panel = container.querySelector('[data-testid="why-panel"]');
    expect(panel.textContent).toMatch(/cannot reach this camera on its own network \(the NAS tried 192\.168\.1\.77\)/);
    expect(panel.textContent).toMatch(/other house/);
    expect(panel.textContent).toMatch(/connect failed: i\/o timeout/);
    await click(buttons().find((b) => b.textContent === 'Hide'));
    expect(container.querySelector('[data-testid="why-panel"]')).toBeNull();
  });

  it('the garage opens with no video in the way (DR-0777): the Doors strip stands when the restreamer is dark, one tap is one POST /cams/action, the answer is said, the button rests', async () => {
    const { fetchImpl, calls } = makeFetch({
      healthStatus: 502, health: { ok: false, error: 'go2rtc-unreachable' },
      listStatus: 502, list: { error: 'go2rtc-unreachable' },
      devices: { devices: [
        { mac: 'GD1', nickname: 'Garage Doors', model: 'WYZE_CAKP2JFUS', online: true, garage: true, stream: 'garage_doors', actions: ['garage', 'siren_on', 'siren_off'] },
        { mac: 'FY1', nickname: 'Front Yard', model: 'HL_CAM4', online: true, garage: false, stream: 'front_yard', actions: ['siren_on', 'siren_off'] },
      ], count: 2, garages: 1 },
    });
    vi.stubGlobal('fetch', fetchImpl);
    await mount();
    await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
    expect(container.textContent).toMatch(/The camera road is not answering/);
    const doors = container.querySelector('[data-testid="doors"]');
    expect(doors).toBeTruthy();
    expect(doors.textContent).toMatch(/Doors · 1/);
    expect(container.querySelector('[data-testid="garage-button-FY1"]')).toBeNull();
    const btn = container.querySelector('[data-testid="garage-button-GD1"]');
    expect(btn.textContent).toBe('Garage · Garage Doors');
    await click(btn);
    await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
    const action = calls.filter((c) => c.url === '/cams/action');
    expect(action).toHaveLength(1);
    expect(JSON.parse(action[0].opts.body)).toEqual({ mac: 'GD1', action: 'garage' });
    expect(action[0].opts.headers.Authorization).toBe(`Bearer ${TOKEN}`);
    expect(calls.filter((c) => c.url === '/cams/ticket' || c.url.startsWith('/cams/live/') || c.url.startsWith('/cams/snap/'))).toHaveLength(0);
    expect(container.querySelector('[data-testid="garage-result-GD1"]').textContent).toBe('The door was told to move. Wyze accepted it for Garage Doors.');
    expect(btn.disabled).toBe(true);
    expect(btn.textContent).toBe('Sent');
    await click(btn);
    expect(calls.filter((c) => c.url === '/cams/action')).toHaveLength(1);
  });

  it('a garage camera\'s own tile carries the Garage button beside Why?, and a Wyze refusal is said on it', async () => {
    const { fetchImpl } = makeFetch({
      list: { cameras: [{ id: 'garage_doors', name: 'garage doors', kind: 'wyze' }, { id: 'front_yard', name: 'front yard', kind: 'wyze' }], count: 2 },
      devices: { devices: [{ mac: 'GD1', nickname: 'Garage Doors', online: false, garage: true, stream: 'garage_doors', actions: ['garage'] }], count: 1, garages: 1 },
      actionStatus: 409, action: { error: 'device-offline', detail: 'device offline' },
    });
    vi.stubGlobal('fetch', fetchImpl);
    await mount();
    await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
    const compact = [...container.querySelectorAll('[data-testid="garage-button-GD1"]')];
    expect(compact).toHaveLength(2); // the strip and the tile
    const onTile = compact.find((b) => b.textContent === 'Garage');
    expect(onTile).toBeTruthy();
    await click(onTile);
    await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
    const results = [...container.querySelectorAll('[data-testid="garage-result-GD1"]')].map((e) => e.textContent);
    expect(results).toContain('Wyze says this camera is offline, so its door cannot be reached right now.');
  });

  it('nobody types the sign-in twice: an empty restreamer with the sign-in kept on the NAS offers Add my cameras again first, one press re-adds and reloads (2026-10-07 "I better not need to resign in!")', async () => {
    const { fetchImpl, calls } = makeFetch({
      health: { ok: true, go2rtc: '1.9.14', streams: 0, live_max_seconds: 0, max_live: 32, wyze_cloud: 'ready' },
      list: { cameras: [], count: 0 },
    });
    vi.stubGlobal('fetch', fetchImpl);
    await mount();
    await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
    expect(container.textContent).toMatch(/your Wyze sign-in is already here\. Nothing to type/);
    const again = container.querySelector('[data-testid="wyze-add-again-button"]');
    expect(again).toBeTruthy();
    expect(container.querySelector('[data-testid="wyze-setup"]')).toBeTruthy(); // a different account is still possible
    const listsBefore = calls.filter((c) => c.url === '/cams/list').length;
    await click(again);
    await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
    const posted = calls.filter((c) => c.url === '/cams/setup/wyze/again');
    expect(posted).toHaveLength(1);
    expect(posted[0].opts.method).toBe('POST');
    expect(posted[0].opts.body).toBeUndefined();
    expect(container.querySelector('[data-testid="wyze-add-again-result"]').textContent).toMatch(/2/);
    expect(calls.filter((c) => c.url === '/cams/list').length).toBe(listsBefore + 1);
  });

  it('an empty restreamer on a NAS with NO kept sign-in shows the form only, as before', async () => {
    const { fetchImpl } = makeFetch({ health: { ok: true, go2rtc: '1.9.14', streams: 0, wyze_cloud: 'no-credentials' }, list: { cameras: [], count: 0 }, devicesStatus: 503, devices: { error: 'no-credentials' } });
    vi.stubGlobal('fetch', fetchImpl);
    await mount();
    await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
    expect(container.querySelector('[data-testid="wyze-add-again"]')).toBeNull();
    expect(container.querySelector('[data-testid="doors"]')).toBeNull();
    expect(container.textContent).toMatch(/you never type it again/);
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
