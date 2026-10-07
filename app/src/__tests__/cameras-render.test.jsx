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
import { WYZE_DRAFT_KEY, WALL_KEY, LIVE_RECONNECT_MAX, LIVE_RECONNECT_DELAY_MS, formatBytes, LIVE_TILES_KEY, GRANT_KEY, PAIR_TIMING, VIEWS_KEY } from '../lib/cameras.js';
import { CAMS_TAB_KEY } from '../components/Cameras.jsx';
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
    if (u === '/cams/streams/health') return jsonResponse(plan.streamHealthStatus ?? 200, plan.streamHealth ?? { sampled_at: 1700000000, interval_s: 15, cameras: {}, events: [] });
    if (u === '/cams/streams' && opts.method === 'POST') { const b = JSON.parse(opts.body); plan.added = [...(plan.added || []), b]; return jsonResponse(plan.addStatus ?? 200, plan.add ?? { ok: true, id: b.name, kind: b.url.split(':')[0], registered: true, persisted: true, detail: '', probe: { ok: true, status: 200, ms: 1200, bytes: 48000 } }); }
    if (/^\/cams\/streams\/[^/]+\/test$/.test(u)) return jsonResponse(200, { id: 'x', probe: plan.testProbe ?? { ok: false, status: 500, error: 'streams: connect failed', ms: 300, bytes: 0 } });
    if (/^\/cams\/streams\/[^/]+$/.test(u) && opts.method === 'DELETE') { plan.removed = [...(plan.removed || []), u.split('/').pop()]; return jsonResponse(200, { ok: true, removed: [u.split('/').pop()] }); }
    if (u === '/cams/setup/ring') { const b = JSON.parse(opts.body); plan.ring = [...(plan.ring || []), b]; return b.code ? jsonResponse(200, { ok: true, added: 1, cameras: [{ id: 'front_door', name: 'Front Door', registered: true }] }) : jsonResponse(409, { error: 'needs-2fa', prompt: 'Please enter the code sent to +1 (***) ***-1234' }); }
    if (/^\/cams\/rec\/[^/]+\/[^/?]+\?/.test(u)) {
      const q = new URLSearchParams(u.split('?')[1]);
      if (q.get('sizes') === '1') return jsonResponse(200, plan.clipSizes ?? { original: 1000, seconds: 600, tiers: { small: { label: 'Small (480p)', height: 480, estimate: 700, state: 'absent' }, medium: { label: 'Medium (720p)', height: 720, estimate: 900, state: 'absent' }, large: { label: 'Large (1080p)', height: 1080, estimate: 1000, state: 'absent' } }, download_name: 'front_yard-2026-10-07T06-40-00-original.mp4' });
      if (q.get('size')) {
        plan.sizeAsks = (plan.sizeAsks || 0) + 1;
        if (plan.sizeAsks < (plan.sizeReadyAt ?? 2)) return jsonResponse(202, { status: plan.sizeAsks === 1 ? 'queued' : 'making', size: q.get('size'), position: plan.sizeAsks === 1 ? 1 : 0, retry_in: 0.001 });
        return { ok: true, status: 206, json: async () => ({}), blob: async () => new Blob(['mp4']), headers: { get: () => null } };
      }
      return { ok: true, status: 200, json: async () => ({}), blob: async () => new Blob(['mp4']), headers: { get: () => null } };
    }
    if (u.startsWith('/cams/rec/') && u.split('/').length === 4) return jsonResponse(200, plan.clips ?? { camera: 'front_yard', clips: [{ name: '2026-10-07T06-40-00.mp4', bytes: 1000, start: 1 }, { name: '2026-10-07T06-50-00.mp4', bytes: 2000, start: 2 }], count: 2 });
    if (u.startsWith('/cams/why/')) return jsonResponse(plan.whyStatus ?? 200, plan.why ?? { id: 'x', producers: [{ kind: 'wyze', host: '192.168.1.77', state: 'connecting' }], probe: { status: 500, ok: false, error: 'wyze: connect failed: dial udp 192.168.1.77:0: i/o timeout', ms: 900 }, log: ['06:40 warn [wyze] connect failed: i/o timeout'] });
    if (u === '/cams/ticket') return jsonResponse(plan.ticketStatus ?? 200, { ticket: '9999999999.abcdef', expires_in: 90, camera: JSON.parse(opts.body).camera });
    if (u === '/cams/setup/wyze') return jsonResponse(plan.setupStatus ?? 200, plan.setup ?? { ok: true, added: 1, cameras: [{ id: 'front_yard', name: 'Front Yard', model: 'HL_CAM4', dtls: true, registered: true, existing: false }] });
    if (u === '/cams/restart') return jsonResponse(plan.restartStatus ?? 200, plan.restart ?? { ok: true, restarting: true, running: 'aaaa', on_disk: 'bbbb', changed: true });
    if (u === '/cams/devices') return jsonResponse(plan.devicesStatus ?? 200, plan.devices ?? { devices: [], count: 0, garages: 0 });
    if (u === '/cams/action') { const b = JSON.parse(opts.body); return jsonResponse(plan.actionStatus ?? 200, plan.action ?? { ok: true, mac: b.mac, nickname: 'Garage Doors', action: b.action, action_key: 'garage_door_trigger' }); }
    if (u === '/cams/setup/wyze/again') return jsonResponse(plan.againStatus ?? 200, plan.again ?? { ok: true, added: 2, again: true, cameras: [{ id: 'front_yard', name: 'Front Yard', registered: true, existing: false }, { id: 'garage_doors', name: 'Garage Doors', registered: true, existing: true }] });
    if (u === '/cams/grants' && (opts.method || 'GET') === 'GET') return jsonResponse(plan.grantsStatus ?? 200, plan.grants ?? { grants: [], link_path: '/poetech-app/?view=cameras&cams-grant=' });
    if (u === '/cams/grants' && opts.method === 'POST') { const b = JSON.parse(opts.body); return jsonResponse(200, { ok: true, id: 'abcdefabcdef', token: 'g.abcdefabcdef.' + '1'.repeat(32), link_path: '/poetech-app/?view=cameras&cams-grant=', grant: { id: 'abcdefabcdef', name: b.name, cameras: b.cameras, actions: b.actions, created: 1, expires: 0, revoked: 0, last_used: 0 } }); }
    if (/^\/cams\/grants\/[a-f0-9]{12}\/revoke$/.test(u)) return jsonResponse(200, { ok: true });
    if (u === '/cams/pair' && opts.method === 'POST') return jsonResponse(plan.pairStatus ?? 200, plan.pair ?? { code: 'ABC234', watch: 'w'.repeat(32), expires_in: 600, link_path: '/poetech-app/?view=cameras&cams-pair=' });
    if (/^\/cams\/pair\/[A-Z2-9]{6}\?w=/.test(u)) { plan.polls = (plan.polls || 0) + 1; return plan.pairApproved && plan.polls >= plan.pairApproved ? jsonResponse(200, { status: 'approved', token: 'g.abcdefabcdef.' + '4'.repeat(32) }) : jsonResponse(200, { status: 'waiting' }); }
    if (/^\/cams\/pair\/[A-Z2-9]{6}\/approve$/.test(u)) { plan.approved = JSON.parse(opts.body); return jsonResponse(plan.approveStatus ?? 200, plan.approve ?? { ok: true, grant: { id: 'abcdefabcdef', name: JSON.parse(opts.body).name } }); }
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
    try { localStorage.removeItem(CHAT_BRIDGE_TOKEN_KEY); localStorage.removeItem(WYZE_DRAFT_KEY); localStorage.removeItem(WALL_KEY); localStorage.removeItem(LIVE_TILES_KEY); localStorage.removeItem(VIEWS_KEY); localStorage.removeItem(CAMS_TAB_KEY); } catch { /* fine */ }
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

  it('recorded loops (DR-0775, DR-0783): Record and keep sit on the camera\'s tile; the budget and the clips live on the Recordings tab; a clip plays through a long ticket', async () => {
    const now = Math.floor(Date.now() / 1000);
    const { fetchImpl, calls } = makeFetch({
      list: { cameras: [{ id: 'front_yard', name: 'front yard', kind: 'wyze' }], count: 1 },
      recordingStatus: 200,
      recording: { config: { disk_budget_gb: 100, cameras: {} }, status: { ok: true, at: now, disk_budget_gb: 100, total_bytes: 3000, disk_free_bytes: 500e9, cameras: { front_yard: { enabled: false, recording: false, clips: 2, bytes: 3000, oldest: now - 600, newest: now } } } },
    });
    vi.stubGlobal('fetch', fetchImpl);
    await mount();
    await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
    // Live tab: the tile carries Record and the clip count; nothing of the recorder is below the cameras
    expect(container.querySelector('[data-testid="recording-panel"]')).toBeNull();
    expect(container.querySelector('[data-testid="tile-record-front_yard"]').textContent).toMatch(/Record/);
    await click(buttons().find((b) => b.getAttribute('aria-label') === 'Record front yard'));
    await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
    const put = calls.find((c) => c.url === '/cams/recording' && c.opts.method === 'PUT');
    expect(put.opts.headers.Authorization).toBe(`Bearer ${TOKEN}`);
    expect(JSON.parse(put.opts.body)).toEqual({ disk_budget_gb: 100, cameras: { front_yard: { enabled: true, retention_days: 14 } } });
    const keep = container.querySelector('[data-testid="keep-front_yard"]');
    expect(keep.value).toBe('14');
    const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
    await act(async () => { setter.call(keep, '30'); keep.dispatchEvent(new Event('change', { bubbles: true })); await new Promise((r) => setTimeout(r, 20)); });
    const puts = calls.filter((c) => c.url === '/cams/recording' && c.opts.method === 'PUT');
    expect(JSON.parse(puts[puts.length - 1].opts.body).cameras.front_yard.retention_days).toBe(30);
    // Recordings tab: the disk line, the budget, the note
    await click(container.querySelector('[data-testid="cams-tab-recordings"]'));
    const panel = container.querySelector('[data-testid="recording-panel"]');
    expect(panel.textContent).toContain(`On disk: ${formatBytes(3000)} of a 100 GB budget`);
    expect(container.querySelector('[data-testid="recording-note"]').textContent).toMatch(/Saved/);
    const budgetInput = panel.querySelector('input[type="number"]');
    const iset = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    await act(async () => { iset.call(budgetInput, '250'); budgetInput.dispatchEvent(new Event('input', { bubbles: true })); });
    await click(buttons().find((b) => b.textContent === 'Save budget'));
    await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
    const puts2 = calls.filter((c) => c.url === '/cams/recording' && c.opts.method === 'PUT');
    expect(JSON.parse(puts2[puts2.length - 1].opts.body).disk_budget_gb).toBe(250);
    // back on Live, the tile's clip count opens the clips on the Recordings tab
    await click(container.querySelector('[data-testid="cams-tab-live"]'));
    await click(buttons().find((b) => b.getAttribute('aria-label') === 'Show clips of front yard'));
    await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
    expect(container.querySelector('[data-testid="cams-tab-recordings"]').getAttribute('aria-selected')).toBe('true');
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
    await click(container.querySelector('[data-testid="cams-tab-recordings"]'));
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
    // off (the switch lives on Setup): tiles go back to frames every 5 s and the choice is kept on the device
    await click(container.querySelector('[data-testid="cams-tab-setup"]'));
    expect(container.textContent).toMatch(/Live in every tile · on/);
    await click(container.querySelector('[data-testid="live-tiles-toggle"]'));
    await click(container.querySelector('[data-testid="cams-tab-live"]'));
    await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
    expect(container.querySelector('[data-testid="tile-live-front_yard"]')).toBeNull();
    expect(calls.filter((c) => c.url.startsWith('/cams/snap/')).length).toBeGreaterThanOrEqual(2);
    expect(localStorage.getItem(LIVE_TILES_KEY)).toBe('0');
    await click(container.querySelector('[data-testid="cams-tab-setup"]'));
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
    const liveBtn = buttons().find((b) => b.textContent === 'Big');
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
    expect(container.textContent).toMatch(/Auto chose MP4/);
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
      await click(buttons().find((b) => b.textContent === 'Big'));
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

  it('views (DR-0783): + View adds a camera to the active view, the view streams them live, arrows reorder while they stream, the layout is chosen, a second view is its own, Remove and Clear take them down', async () => {
    const { fetchImpl, calls } = makeFetch({ list: { cameras: [
      { id: 'front_yard', name: 'front yard', kind: 'wyze' },
      { id: 'garage', name: 'garage', kind: 'rtsp' },
    ], count: 2 } });
    vi.stubGlobal('fetch', fetchImpl);
    await mount();
    await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
    const views = container.querySelector('[data-testid="camera-views"]');
    expect(views.textContent).toMatch(/My view · 0/);
    expect(views.textContent).toMatch(/Press \+ View on any camera/);
    await click(buttons().find((b) => b.getAttribute('aria-label') === 'Add front yard to the view'));
    await click(buttons().find((b) => b.getAttribute('aria-label') === 'Add garage to the view'));
    await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
    expect(container.querySelector('[data-testid="wall-front_yard"] video')).toBeTruthy();
    expect(container.querySelector('[data-testid="wall-garage"] video')).toBeTruthy();
    const tickets = calls.filter((c) => c.url === '/cams/ticket').map((c) => JSON.parse(c.opts.body).camera);
    expect(tickets).toEqual(['front_yard', 'garage']);
    const saved = JSON.parse(localStorage.getItem(VIEWS_KEY));
    expect(saved.views[0].cameras).toEqual(['front_yard', 'garage']);
    expect(views.textContent).toMatch(/My view · 2/);
    // a camera in the view is not also polled for a snapshot (the live view IS the frame)
    const snapsBefore = calls.filter((c) => c.url.startsWith('/cams/snap/')).length;
    await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
    expect(calls.filter((c) => c.url.startsWith('/cams/snap/')).length).toBe(snapsBefore);
    // reorder while streaming: the same two <video> elements, in the new order, no new ticket
    const grid = container.querySelector('[data-testid^="view-v"]');
    const order = () => [...grid.querySelectorAll('[data-view-cam]')].map((el) => el.getAttribute('data-view-cam'));
    expect(order()).toEqual(['front_yard', 'garage']);
    const vidBefore = container.querySelector('[data-testid="wall-garage"] video');
    await click(container.querySelector('[data-testid="view-left-garage"]'));
    expect(order()).toEqual(['garage', 'front_yard']);
    expect(container.querySelector('[data-testid="wall-garage"] video')).toBe(vidBefore);
    expect(calls.filter((c) => c.url === '/cams/ticket')).toHaveLength(2);
    expect(JSON.parse(localStorage.getItem(VIEWS_KEY)).views[0].cameras).toEqual(['garage', 'front_yard']);
    // layout: auto fits two across; 1 across is one column
    expect(grid.getAttribute('data-cols')).toBe('2');
    const layout = container.querySelector('[data-testid="view-layout"]');
    const sset = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
    await act(async () => { sset.call(layout, '1'); layout.dispatchEvent(new Event('change', { bubbles: true })); });
    expect(container.querySelector('[data-testid^="view-v"]').getAttribute('data-cols')).toBe('1');
    // a second view starts empty and is the active one; the first keeps its cameras
    await click(container.querySelector('[data-testid="view-new"]'));
    expect(container.querySelector('[data-testid="camera-views"]').textContent).toMatch(/View 2 · 0/);
    expect(container.querySelector('[data-testid="wall-garage"]')).toBeNull();
    const tabs = [...container.querySelectorAll('[data-testid^="view-tab-"]')];
    expect(tabs).toHaveLength(2);
    await click(tabs[0]);
    await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
    expect(container.querySelector('[data-testid="wall-garage"] video')).toBeTruthy();
    // remove one, clear the rest
    await click(buttons().find((b) => b.textContent === 'Remove'));
    expect([...container.querySelectorAll('[data-view-cam]')]).toHaveLength(1);
    // Clear asks first (a destroying button never acts on one tap)
    vi.stubGlobal('confirm', vi.fn(() => false));
    await click(buttons().find((b) => b.textContent === 'Clear'));
    expect([...container.querySelectorAll('[data-view-cam]')]).toHaveLength(1);
    vi.stubGlobal('confirm', vi.fn(() => true));
    await click(buttons().find((b) => b.textContent === 'Clear'));
    expect(container.querySelector('[data-testid="wall-front_yard"]')).toBeNull();
    expect(container.querySelector('[data-testid="wall-garage"]')).toBeNull();
  });

  it('the full-size window (DR-0788): the view\'s cameras fill the screen in the fitted grid, Smaller leaves a margin and is kept with the view, Esc closes, and each camera holds one slot', async () => {
    const { fetchImpl, calls } = makeFetch({ list: { cameras: [
      { id: 'front_yard', name: 'front yard', kind: 'wyze' },
      { id: 'garage', name: 'garage', kind: 'rtsp' },
    ], count: 2 } });
    vi.stubGlobal('fetch', fetchImpl);
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 768 });
    await mount();
    await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
    expect(container.querySelector('[data-testid="view-window-open"]'), 'no window button on an empty view').toBeNull();
    await click(buttons().find((b) => b.getAttribute('aria-label') === 'Add front yard to the view'));
    await click(buttons().find((b) => b.getAttribute('aria-label') === 'Add garage to the view'));
    await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
    const ticketsBefore = calls.filter((c) => c.url === '/cams/ticket').length;
    await click(container.querySelector('[data-testid="view-window-open"]'));
    await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
    const win = container.querySelector('[data-testid="view-window"]');
    expect(win, 'the window').toBeTruthy();
    // 1024×768 less the bar and gaps, two 16:9 tiles: one column of two is the larger tile.
    expect(win.getAttribute('data-cols')).toBe('1');
    expect(win.getAttribute('data-scale')).toBe('100');
    expect([...win.querySelectorAll('[data-window-cam]')].map((el) => el.getAttribute('data-window-cam'))).toEqual(['front_yard', 'garage']);
    expect(win.querySelector('[data-testid="window-front_yard"] video')).toBeTruthy();
    expect(win.querySelector('[data-testid="window-garage"] video')).toBeTruthy();
    // The in-page grid steps aside, so each camera holds ONE live slot (two new tickets, not four tiles).
    expect(container.querySelector('[data-testid^="view-v"]')).toBeNull();
    expect(calls.filter((c) => c.url === '/cams/ticket').length).toBe(ticketsBefore + 2);
    const grid = win.querySelector('[data-testid="view-window-grid"]');
    const widthBefore = grid.style.gridTemplateColumns;
    await click(container.querySelector('[data-testid="view-window-smaller"]'));
    expect(container.querySelector('[data-testid="view-window"]').getAttribute('data-scale')).toBe('95');
    expect(container.querySelector('[data-testid="view-window-grid"]').style.gridTemplateColumns).not.toBe(widthBefore);
    expect(JSON.parse(localStorage.getItem(VIEWS_KEY)).views[0].scale).toBe(0.95);
    expect(container.querySelector('[data-testid="view-window-size"]').textContent).toMatch(/2 cameras · 1 across · 95%/);
    await click(container.querySelector('[data-testid="view-window-fit"]'));
    expect(container.querySelector('[data-testid="view-window"]').getAttribute('data-scale')).toBe('100');
    await act(async () => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); });
    expect(container.querySelector('[data-testid="view-window"]')).toBeNull();
    expect(container.querySelector('[data-testid^="view-v"]'), 'the in-page grid is back').toBeTruthy();
  });

  it('a click on a picture makes that camera the largest and a second click puts it back, in the view and in the window (DR-0796)', async () => {
    const { fetchImpl, calls } = makeFetch({ list: { cameras: [
      { id: 'front_yard', name: 'front yard', kind: 'wyze' },
      { id: 'garage', name: 'garage', kind: 'rtsp' },
    ], count: 2 } });
    vi.stubGlobal('fetch', fetchImpl);
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 768 });
    await mount();
    await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
    await click(buttons().find((b) => b.getAttribute('aria-label') === 'Add front yard to the view'));
    await click(buttons().find((b) => b.getAttribute('aria-label') === 'Add garage to the view'));
    await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
    // THE VIEW. Two across; a click on the garage picture: one column, garage marked, front yard hidden but still mounted (same <video>).
    const grid = () => container.querySelector('[data-testid^="view-v"]');
    expect(grid().getAttribute('data-cols')).toBe('2');
    const frontVideo = container.querySelector('[data-testid="wall-front_yard"] video');
    const garagePicture = container.querySelector('[data-testid="wall-garage-picture"]');
    expect(garagePicture.getAttribute('role')).toBe('button');
    expect(garagePicture.getAttribute('title')).toMatch(/make this camera the largest/);
    const ticketsBefore = calls.filter((c) => c.url === '/cams/ticket').length;
    await click(garagePicture);
    expect(grid().getAttribute('data-cols')).toBe('1');
    expect(grid().getAttribute('data-focused')).toBe('garage');
    expect(container.querySelector('[data-view-cam="garage"]').getAttribute('data-focused')).toBe('true');
    expect(container.querySelector('[data-view-cam="front_yard"]').className).toMatch(/\bhidden\b/);
    // the hidden tile gives its stream back (DR-0799): no <video>, its status says why, the same ticket count
    expect(container.querySelector('[data-testid="wall-front_yard"] video'), 'a hidden tile holds no stream').toBeNull();
    expect(container.querySelector('[data-testid="wall-front_yard-status"]').textContent).toBe('Paused while another camera is the largest.');
    expect(frontVideo.getAttribute('src')).toBeNull();
    expect(calls.filter((c) => c.url === '/cams/ticket').length).toBe(ticketsBefore);
    expect(container.querySelector('[data-testid="wall-garage-picture"]').getAttribute('aria-pressed')).toBe('true');
    // the second click: back to two across, nothing hidden, the hidden tile re-opens in its place (one new ticket, for it)
    await click(container.querySelector('[data-testid="wall-garage-picture"]'));
    await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
    expect(grid().getAttribute('data-cols')).toBe('2');
    expect(grid().getAttribute('data-focused')).toBeNull();
    expect(container.querySelector('[data-view-cam="front_yard"]').className).not.toMatch(/\bhidden\b/);
    expect([...container.querySelectorAll('[data-view-cam]')].map((el) => el.getAttribute('data-view-cam'))).toEqual(['front_yard', 'garage']);
    expect(container.querySelector('[data-testid="wall-front_yard"] video')).toBeTruthy();
    const reopened = calls.filter((c) => c.url === '/cams/ticket').slice(ticketsBefore).map((c) => JSON.parse(c.opts.body).camera);
    expect(reopened).toEqual(['front_yard']);
    // Enter from a remote does the same as a click
    await act(async () => { container.querySelector('[data-testid="wall-front_yard-picture"]').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); });
    expect(grid().getAttribute('data-focused')).toBe('front_yard');
    await act(async () => { container.querySelector('[data-testid="wall-front_yard-picture"]').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); });
    await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
    expect(grid().getAttribute('data-focused')).toBeNull();
    // THE WINDOW. The same gesture on a window tile: one tile fills the fitted area, the bar says so, the other tile is hidden and kept.
    await click(container.querySelector('[data-testid="view-window-open"]'));
    await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
    const win = () => container.querySelector('[data-testid="view-window"]');
    expect(win().getAttribute('data-cols')).toBe('1');
    expect(win().querySelector('[data-testid="window-garage"] video')).toBeTruthy();
    const rowsBefore = win().querySelector('[data-testid="view-window-grid"]').style.gridAutoRows;
    await click(win().querySelector('[data-testid="window-front_yard"]'));
    expect(win().getAttribute('data-focused')).toBe('front_yard');
    expect(win().querySelector('[data-window-cam="front_yard"]').getAttribute('data-focused')).toBe('true');
    expect(win().querySelector('[data-window-cam="garage"]').className).toMatch(/\bhidden\b/);
    expect(win().querySelector('[data-testid="window-garage"] video'), 'the hidden window tile gives its stream back').toBeNull();
    expect(win().querySelector('[data-testid="view-window-grid"]').style.gridAutoRows, 'one tile is fitted larger than two were').not.toBe(rowsBefore);
    expect(container.querySelector('[data-testid="view-window-size"]').textContent).toMatch(/front yard · largest · click it again to put it back/);
    await click(win().querySelector('[data-testid="window-front_yard"]'));
    await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
    expect(win().getAttribute('data-focused')).toBeNull();
    expect(win().querySelector('[data-window-cam="garage"]').className).not.toMatch(/\bhidden\b/);
    expect(win().querySelector('[data-testid="window-garage"] video'), 'it re-opens in its place').toBeTruthy();
    expect(win().querySelector('[data-testid="view-window-grid"]').style.gridAutoRows).toBe(rowsBefore);
    expect(container.querySelector('[data-testid="view-window-size"]').textContent).toMatch(/2 cameras · 1 across · 100%/);
    await act(async () => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); });
  });

  it('the stream health log on the tile and in Why? (DR-0798): the hour\'s line under a camera, Why? on a camera that dropped, the drops in words', async () => {
    const { fetchImpl, calls } = makeFetch({
      list: { cameras: [{ id: 'front_yard', name: 'front yard', kind: 'wyze' }, { id: 'garage', name: 'garage', kind: 'rtsp' }], count: 2 },
      streamHealth: { sampled_at: 1700000030, interval_s: 15, cameras: {
        front_yard: { kbps: 1200, kbps_avg: 1100, up_pct: 97, drops_1h: 2, drop_kinds: ['bytes-frozen', 'producer-gone'], codecs: ['H264', 'PCMU'], hevc_only: false, twin: null, present: true, watchers: 1 },
        garage: { kbps: 640, kbps_avg: 640, up_pct: 100, drops_1h: 0, drop_kinds: [], codecs: ['H265'], hevc_only: true, twin: 'garage_h264', present: true, watchers: 0 },
      }, events: [{ at: 1700000000, camera: 'front_yard', kind: 'bytes-frozen' }, { at: 1700000015, camera: 'front_yard', kind: 'producer-gone' }] },
    });
    vi.stubGlobal('fetch', fetchImpl);
    await mount();
    await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
    expect(calls.find((c) => c.url === '/cams/streams/health').opts.headers.Authorization).toBe(`Bearer ${TOKEN}`);
    expect(container.querySelector('[data-testid="stream-health-front_yard"]').textContent).toBe('1.2 Mb/s · H264+PCMU · up 97% · 2 drops this hour');
    expect(container.querySelector('[data-testid="stream-health-garage"]').textContent).toBe('640 kb/s · H265 · H264 twin · up 100% · no drops this hour');
    // Why? stands on the camera that dropped (its frame is fine, so DR-0774 alone would not show it)
    const why = buttons().find((b) => b.getAttribute('aria-label') === 'Why does front yard drop?');
    expect(why, 'Why? on a camera that dropped').toBeTruthy();
    expect(buttons().find((b) => b.getAttribute('aria-label') === 'Why does garage drop?')).toBeUndefined();
    await click(why);
    await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
    const h = container.querySelector('[data-testid="why-health-front_yard"]');
    expect(h.textContent).toContain('The last hour: 1.2 Mb/s · H264+PCMU · up 97% · 2 drops this hour');
    const items = [...h.querySelectorAll('li')].map((li) => li.textContent);
    expect(items).toHaveLength(2);
    expect(items[0]).toMatch(/connection to the NAS dropped while someone watched/);
    expect(items[1]).toMatch(/sent nothing for a whole sample/);
  });

  it('a camera that sends only H.265 plays its H.264 twin on a device whose <video> cannot decode H.265, and its own stream where it can (DR-0798)', async () => {
    try { localStorage.removeItem(LIVE_TILES_KEY); } catch { /* fine */ }
    const { fetchImpl, calls } = makeFetch({
      list: { cameras: [{ id: 'garage', name: 'garage', kind: 'wyze', h264: true }], count: 1 },
      health: { ok: true, go2rtc: '1.9.14', streams: 2, live_max_seconds: 0, max_live: 32, live_open: 0, live_bytes_per_s: 0 },
    });
    vi.stubGlobal('fetch', fetchImpl);
    const orig = window.HTMLMediaElement.prototype.canPlayType;
    window.HTMLMediaElement.prototype.canPlayType = function canPlayType(t) { return /hvc1|hev1/.test(String(t)) ? '' : 'maybe'; };
    try {
      await mount();
      await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
      const tickets = calls.filter((c) => c.url === '/cams/ticket').map((c) => JSON.parse(c.opts.body).camera);
      expect(tickets).toEqual(['garage_h264']);
      expect(container.querySelector('[data-testid="tile-live-garage"] video').getAttribute('src')).toMatch(/\/cams\/live\/garage_h264/);
    } finally {
      window.HTMLMediaElement.prototype.canPlayType = orig;
    }
    await act(() => root.unmount());
    container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
    calls.length = 0;
    window.HTMLMediaElement.prototype.canPlayType = function canPlayType() { return 'probably'; };
    try {
      await mount();
      await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
      expect(calls.filter((c) => c.url === '/cams/ticket').map((c) => JSON.parse(c.opts.body).camera)).toEqual(['garage']);
      expect(container.querySelector('[data-testid="tile-live-garage"] video').getAttribute('src')).toMatch(/\/cams\/live\/garage[./]/);
    } finally {
      window.HTMLMediaElement.prototype.canPlayType = orig;
    }
  });

  it('a clip downloads at the size you choose (DR-0797): the menu names every tier with its size, the NAS makes it (its place in line shown), and the file saves with its name', async () => {
    const now = Math.floor(Date.now() / 1000);
    const plan = {
      list: { cameras: [{ id: 'front_yard', name: 'front yard', kind: 'wyze' }], count: 1 },
      recordingStatus: 200,
      recording: { config: { disk_budget_gb: 100, cameras: {} }, status: { ok: true, at: now, disk_budget_gb: 100, total_bytes: 3000, disk_free_bytes: 500e9, cameras: { front_yard: { enabled: false, recording: false, clips: 2, bytes: 3000, oldest: now - 600, newest: now } } }, root: '/volume1/PoeTech/cameras/recordings' },
      sizeReadyAt: 3,
    };
    const { fetchImpl, calls } = makeFetch(plan);
    vi.stubGlobal('fetch', fetchImpl);
    const clicked = [];
    const origClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function click() { clicked.push({ href: this.getAttribute('href'), download: this.getAttribute('download') }); };
    try {
      await mount();
      await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
      await click(buttons().find((b) => b.getAttribute('aria-label') === 'Show clips of front yard'));
      await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
      const dl = container.querySelector('[data-testid="clip-download-2026-10-07T06-40-00.mp4"]');
      expect(dl, 'the ↓ beside the clip').toBeTruthy();
      await click(dl);
      await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
      const ticket = calls.filter((c) => c.url === '/cams/ticket').pop();
      expect(JSON.parse(ticket.opts.body)).toEqual({ camera: 'front_yard', ttl: 3600 });
      expect(calls.find((c) => c.url === '/cams/rec/front_yard/2026-10-07T06-40-00.mp4?t=9999999999.abcdef&sizes=1'), 'the sizes are read with the ticket').toBeTruthy();
      const menu = container.querySelector('[data-testid="clip-download-menu"]');
      expect(menu.textContent).toContain('Record keeps clips on the NAS only');
      expect(container.querySelector('[data-testid="clip-tier-original"]').textContent).toBe(`Original · ${formatBytes(1000)}`);
      expect(container.querySelector('[data-testid="clip-tier-small"]').textContent).toBe(`Small (480p) · about ${formatBytes(700)}`);
      expect(container.querySelector('[data-testid="clip-tier-large"]').textContent).toBe(`Large (1080p) · about ${formatBytes(1000)}`);
      await click(container.querySelector('[data-testid="clip-get-small"]'));
      for (let i = 0; i < 40 && !clicked.length; i += 1) await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
      const asks = calls.filter((c) => /size=small/.test(c.url));
      expect(asks.length).toBe(3);
      expect(asks[0].url).toBe('/cams/rec/front_yard/2026-10-07T06-40-00.mp4?t=9999999999.abcdef&size=small&dl=1');
      expect(asks[0].opts.headers.Range).toBe('bytes=0-0');
      expect(clicked).toEqual([{ href: '/cams/rec/front_yard/2026-10-07T06-40-00.mp4?t=9999999999.abcdef&size=small&dl=1', download: 'front_yard-2026-10-07T06-40-00-small.mp4' }]);
      await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
      expect(container.querySelector('[data-testid="recording-note"]').textContent).toMatch(/Saving front_yard-2026-10-07T06-40-00-small\.mp4/);
      // the original needs no making: one ask, one save
      clicked.length = 0;
      await click(container.querySelector('[data-testid="clip-get-original"]'));
      for (let i = 0; i < 40 && !clicked.length; i += 1) await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
      expect(clicked).toEqual([{ href: '/cams/rec/front_yard/2026-10-07T06-40-00.mp4?t=9999999999.abcdef&dl=1', download: 'front_yard-2026-10-07T06-40-00-original.mp4' }]);
    } finally {
      HTMLAnchorElement.prototype.click = origClick;
    }
  });

  it('a live tile stays live (DR-0799): a grid asks for the SD twin and the one made largest asks for HD; a frozen picture reconnects after 6 s', async () => {
    try { localStorage.removeItem(LIVE_TILES_KEY); } catch { /* fine */ }
    const { fetchImpl, calls } = makeFetch({
      list: { cameras: [{ id: 'front_yard', name: 'front yard', kind: 'wyze', sd: true }, { id: 'garage', name: 'garage', kind: 'wyze', sd: true }], count: 2 },
      health: { ok: true, go2rtc: '1.9.14', streams: 2, live_max_seconds: 0, max_live: 32, live_open: 0, live_bytes_per_s: 0 },
    });
    vi.stubGlobal('fetch', fetchImpl);
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 768 });
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      await mount();
      await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
      // the all-cameras tiles (two of them) ask for the SD twins
      const tiles = calls.filter((c) => c.url === '/cams/ticket').map((c) => JSON.parse(c.opts.body).camera).sort();
      expect(tiles).toEqual(['front_yard_sd', 'garage_sd']);
      // the window: both tiles SD; the one made largest re-opens as HD; put back, SD again
      await click(buttons().find((b) => b.getAttribute('aria-label') === 'Add front yard to the view'));
      await click(buttons().find((b) => b.getAttribute('aria-label') === 'Add garage to the view'));
      await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
      await click(container.querySelector('[data-testid="view-window-open"]'));
      await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
      const win = () => container.querySelector('[data-testid="view-window"]');
      expect(win().querySelector('[data-testid="window-front_yard"] video').getAttribute('src')).toMatch(/\/cams\/live\/front_yard_sd/);
      const before = calls.filter((c) => c.url === '/cams/ticket').length;
      await click(win().querySelector('[data-testid="window-front_yard"]'));
      await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
      expect(win().querySelector('[data-testid="window-front_yard"] video').getAttribute('src')).toMatch(/\/cams\/live\/front_yard[./]/);
      expect(calls.filter((c) => c.url === '/cams/ticket').slice(before).map((c) => JSON.parse(c.opts.body).camera)).toEqual(['front_yard']);
      await click(win().querySelector('[data-testid="window-front_yard"]'));
      await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
      expect(win().querySelector('[data-testid="window-front_yard"] video').getAttribute('src')).toMatch(/\/cams\/live\/front_yard_sd/);
      expect(win().querySelector('[data-testid="window-garage"] video').getAttribute('src')).toMatch(/\/cams\/live\/garage_sd/);
      // a frozen picture: currentTime stops moving for 6 s -> the tile reconnects with a new ticket and says why
      const v = win().querySelector('[data-testid="window-garage"] video');
      Object.defineProperty(v, 'currentTime', { configurable: true, writable: true, value: 10 });
      Object.defineProperty(v, 'paused', { configurable: true, get: () => false });
      Object.defineProperty(v, 'readyState', { configurable: true, get: () => 4 });
      const ticketsBeforeFreeze = calls.filter((c) => c.url === '/cams/ticket').length;
      await act(async () => { vi.advanceTimersByTime(2100); });
      await act(async () => { vi.advanceTimersByTime(2100); });
      await act(async () => { vi.advanceTimersByTime(2100); });
      await act(async () => { vi.advanceTimersByTime(2100); });
      await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
      await act(async () => { vi.advanceTimersByTime(LIVE_RECONNECT_DELAY_MS + 50); });
      await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
      const after = calls.filter((c) => c.url === '/cams/ticket').slice(ticketsBeforeFreeze).map((c) => JSON.parse(c.opts.body).camera);
      expect(after, 'the frozen tile asked for a new ticket').toEqual(['garage_sd']);
      expect(win().querySelector('[data-testid="window-garage"]').textContent).toMatch(/reconnected 1×/);
      await act(async () => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); });
    } finally {
      vi.useRealTimers();
    }
  });

  it('a recording is watched in place at any size (DR-0802): Watch plays the tier from the NAS once made, nothing is saved, one ticket serves the clip, and a slow ticket is said in words', async () => {
    const now = Math.floor(Date.now() / 1000);
    const plan = {
      list: { cameras: [{ id: 'front_yard', name: 'front yard', kind: 'wyze' }], count: 1 },
      recordingStatus: 200,
      recording: { config: { disk_budget_gb: 100, cameras: {} }, status: { ok: true, at: now, disk_budget_gb: 100, total_bytes: 3000, disk_free_bytes: 500e9, cameras: { front_yard: { enabled: false, recording: false, clips: 2, bytes: 3000, oldest: now - 600, newest: now } } }, root: '/volume1/PoeTech/cameras/recordings' },
      sizeReadyAt: 2,
    };
    const { fetchImpl, calls } = makeFetch(plan);
    vi.stubGlobal('fetch', fetchImpl);
    const clicked = [];
    const origClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function click() { clicked.push(this.getAttribute('href')); };
    try {
      await mount();
      await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
      await click(buttons().find((b) => b.getAttribute('aria-label') === 'Show clips of front yard'));
      await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
      // a tap on the clip plays the original at once, and says it is from the NAS
      await click([...container.querySelectorAll('button')].find((b) => /Play the clip from 06:40/.test(b.getAttribute('aria-label') || '')));
      await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
      const player = () => container.querySelector('[data-testid="clip-player"]');
      expect(player().getAttribute('data-size')).toBe('original');
      expect(player().querySelector('video').getAttribute('src')).toBe('/cams/rec/front_yard/2026-10-07T06-40-00.mp4?t=9999999999.abcdef');
      expect(player().textContent).toMatch(/Playing 06:40 · Original · from the NAS, nothing saved here/);
      // the sizes menu: Watch on Small plays the small file in place once the NAS has made it; no download, no second ticket
      const ticketsBefore = calls.filter((c) => c.url === '/cams/ticket').length;
      await click(container.querySelector('[data-testid="clip-download-2026-10-07T06-40-00.mp4"]'));
      await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
      expect(container.querySelector('[data-testid="clip-watch-small"]')).toBeTruthy();
      await click(container.querySelector('[data-testid="clip-watch-small"]'));
      for (let i = 0; i < 40 && player().getAttribute('data-size') !== 'small'; i += 1) await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
      expect(player().getAttribute('data-size')).toBe('small');
      expect(player().querySelector('video').getAttribute('src')).toBe('/cams/rec/front_yard/2026-10-07T06-40-00.mp4?t=9999999999.abcdef&size=small');
      expect(player().textContent).toMatch(/Small \(480p\)/);
      expect(clicked, 'Watch never saves a file').toEqual([]);
      expect(calls.filter((c) => c.url === '/cams/ticket').length, 'the clip\'s one ticket is reused').toBe(ticketsBefore);
      expect(calls.filter((c) => /size=small/.test(c.url)).every((c) => !/dl=1/.test(c.url))).toBe(true);
    } finally {
      HTMLAnchorElement.prototype.click = origClick;
    }
    // a ticket the NAS does not answer in time is said in words, not as "signal is aborted without reason"
    await act(() => root.unmount());
    container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
    const slow = vi.fn(async (url, opts = {}) => {
      if (String(url) === '/cams/ticket') throw Object.assign(new Error('signal is aborted without reason'), { name: 'AbortError' });
      return fetchImpl(url, opts);
    });
    vi.stubGlobal('fetch', slow);
    await mount();
    await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
    await click(buttons().find((b) => b.getAttribute('aria-label') === 'Show clips of front yard'));
    await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
    await click([...container.querySelectorAll('button')].find((b) => /Play the clip from 06:40/.test(b.getAttribute('aria-label') || '')));
    await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
    expect(container.querySelector('[data-testid="recording-note"]').textContent).toBe('Could not open the clip: Could not get a playback ticket: the NAS did not answer in 15 s (the link is busy or the camera service is down).');
  });

  it('any camera from the app, tested on the spot (DR-0803): the boxes build the line, the NAS adds and probes it, Test and Remove work, and Ring signs in with its code', async () => {
    const plan = { list: { cameras: [{ id: 'front_yard', name: 'front yard', kind: 'wyze' }], count: 1 } };
    const { fetchImpl } = makeFetch(plan);
    vi.stubGlobal('fetch', fetchImpl);
    await mount();
    await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
    await click(container.querySelector('[data-testid="cams-tab-setup"]'));
    await click(buttons().find((b) => b.textContent === 'Add a system you own'));
    const form = container.querySelector('[data-testid="add-camera"]');
    expect(form, 'the add form').toBeTruthy();
    expect(container.querySelector('[data-testid="google-sign-in-note"]').textContent, 'the Google note stands on the Wyze form').toContain('Signed up with Google or Apple?');
    const type = async (sel, value) => { const el = container.querySelector(sel); const setter = Object.getOwnPropertyDescriptor(el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype, 'value').set; await act(async () => { setter.call(el, value); el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); }); };
    await type('[data-testid="add-name"]', 'Garage Door');
    await type('[data-testid="add-host"]', '192.168.1.60');
    await type('[data-testid="add-user"]', 'admin');
    await type('[data-testid="add-password"]', 'secret');
    await type('[data-testid="add-path"]', 'live');
    expect(container.querySelector('[data-testid="add-preview"]').textContent).toBe('garage_door: rtsp://admin:***@192.168.1.60/live');
    await click(container.querySelector('[data-testid="add-submit"]'));
    await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
    expect(plan.added).toEqual([{ name: 'garage_door', url: 'rtsp://admin:secret@192.168.1.60/live', replace: false }]);
    expect(container.querySelector('[data-testid="add-result"]').textContent).toBe(`garage_door added · works: a ${formatBytes(48000)} picture in 1.2 s`);
    expect(container.querySelector('[data-testid="added-list"]').textContent).toContain('garage_door · rtsp · works');
    // a forbidden line never leaves the device
    await click(container.querySelector('[data-testid="add-kind-url"]'));
    await type('[data-testid="add-name"]', 'evil');
    await type('[data-testid="add-url"]', 'exec:touch /tmp/x');
    expect(container.querySelector('[data-testid="add-problem"]').textContent).toMatch(/not allowed/);
    expect(container.querySelector('[data-testid="add-submit"]').disabled).toBe(true);
    // Test probes again and shows go2rtc's reason; Remove asks first, then takes it out
    await click(container.querySelector('[data-testid="added-test-garage_door"]'));
    await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
    expect(container.querySelector('[data-testid="added-list"]').textContent).toContain('no picture: streams: connect failed');
    vi.stubGlobal('confirm', vi.fn(() => true));
    await click(container.querySelector('[data-testid="added-remove-garage_door"]'));
    await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
    expect(plan.removed).toEqual(['garage_door']);
    expect(container.querySelector('[data-testid="added-list"]')).toBeNull();
    // Ring: the first press asks for the code, the second adds the camera; the Google note is on the form
    const ring = container.querySelector('[data-testid="ring-setup"]');
    expect(ring.textContent).toContain('Signed up with Google or Apple?');
    await type('[data-testid="ring-email"]', 'me@example.com');
    await type('[data-testid="ring-password"]', 'pw');
    await click(container.querySelector('[data-testid="ring-submit"]'));
    await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
    expect(container.querySelector('[data-testid="ring-result"]').textContent).toBe('Ring asks for its code: Please enter the code sent to +1 (***) ***-1234');
    expect(container.querySelector('[data-testid="ring-submit"]').textContent).toBe('Send the code and add my cameras');
    await type('[data-testid="ring-code"]', '123456');
    await click(container.querySelector('[data-testid="ring-submit"]'));
    await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
    expect(plan.ring).toEqual([{ email: 'me@example.com', password: 'pw', code: '' }, { email: 'me@example.com', password: 'pw', code: '123456' }]);
    expect(container.querySelector('[data-testid="ring-result"]').textContent).toBe('1 Ring camera added: Front Door.');
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

  it('who can see the cameras (DR-0778): the owner lists who has access, makes a link shown once with Copy, and takes access back', async () => {
    const { fetchImpl, calls } = makeFetch({
      list: { cameras: [{ id: 'front_yard', name: 'front yard', kind: 'wyze' }], count: 1 },
      grants: { grants: [{ id: '111111111111', name: 'Christina', cameras: '*', actions: true, created: 1, expires: 0, revoked: 0, last_used: 0 }], link_path: '/poetech-app/?view=cameras&cams-grant=' },
    });
    vi.stubGlobal('fetch', fetchImpl);
    await mount();
    await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
    await click(container.querySelector('[data-testid="cams-tab-access"]'));
    const panel = container.querySelector('[data-testid="access-panel"]');
    expect(panel).toBeTruthy();
    expect(panel.textContent).toMatch(/1 with access/);
    expect(container.querySelector('[data-testid="grant-row-111111111111"]').textContent).toMatch(/Christina.*every camera · until taken back · doors too · never used yet/);
    await click(container.querySelector('[data-testid="access-give-toggle"]'));
    const nameEl = container.querySelector('[data-testid="grant-name"]');
    await act(async () => { const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; setter.call(nameEl, 'Neighbor'); nameEl.dispatchEvent(new Event('input', { bubbles: true })); });
    await act(async () => { container.querySelector('[data-testid="grant-doors"]').click(); });
    await act(async () => { container.querySelector('[data-testid="access-form"]').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
    await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
    const made = calls.filter((c) => c.url === '/cams/grants' && c.opts.method === 'POST');
    expect(made).toHaveLength(1);
    expect(JSON.parse(made[0].opts.body)).toEqual({ name: 'Neighbor', cameras: '*', days: 0, actions: true });
    expect(made[0].opts.headers.Authorization).toBe(`Bearer ${TOKEN}`);
    const link = container.querySelector('[data-testid="grant-link"]');
    expect(link.textContent).toMatch(/\/poetech-app\/\?view=cameras&cams-grant=g\.abcdefabcdef\.1{32}$/);
    expect(container.querySelector('[data-testid="grant-copy"]')).toBeTruthy();
    await click(container.querySelector('[data-testid="grant-revoke-111111111111"]'));
    await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
    expect(calls.filter((c) => c.url === '/cams/grants/111111111111/revoke' && c.opts.method === 'POST')).toHaveLength(1);
    expect(container.querySelector('[data-testid="access-note"]').textContent).toMatch(/Taken back/);
  });

  it('a device the owner handed a link to opens the tab with the grant as its bearer, sees whose access it is, and none of the owner\'s controls', async () => {
    const GRANT = 'g.abcdefabcdef.' + '2'.repeat(32);
    try { localStorage.removeItem(CHAT_BRIDGE_TOKEN_KEY); localStorage.setItem(GRANT_KEY, GRANT); } catch { /* fine */ }
    const { fetchImpl, calls } = makeFetch({
      list: { cameras: [{ id: 'front_yard', name: 'front yard', kind: 'wyze' }], count: 1, access: { name: 'Christina', expires: 0, actions: false } },
      devicesStatus: 403, devices: { error: 'no-actions' },
    });
    vi.stubGlobal('fetch', fetchImpl);
    await mount();
    await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
    const list = calls.find((c) => c.url === '/cams/list');
    expect(list.opts.headers.Authorization).toBe(`Bearer ${GRANT}`);
    expect(container.querySelector('[data-testid="access-chip"]').textContent).toMatch(/Access given to Christina · until the owner takes it back/);
    expect(container.textContent).toMatch(/front yard/);
    expect(container.querySelector('[data-testid="access-panel"]')).toBeNull();
    expect(container.querySelector('[data-testid="doors"]')).toBeNull();
    expect(container.textContent).not.toMatch(/Recorded loops|Restart the camera service|Add a system you own/);
    expect(calls.filter((c) => c.url === '/cams/grants')).toHaveLength(0);
    try { localStorage.removeItem(GRANT_KEY); } catch { /* fine */ }
  });

  it('an ended grant says so on the holder\'s device and offers to remove itself', async () => {
    const GRANT = 'g.abcdefabcdef.' + '3'.repeat(32);
    try { localStorage.removeItem(CHAT_BRIDGE_TOKEN_KEY); localStorage.setItem(GRANT_KEY, GRANT); } catch { /* fine */ }
    const { fetchImpl } = makeFetch({ listStatus: 401, list: { error: 'unauthorized' } });
    vi.stubGlobal('fetch', fetchImpl);
    await mount();
    await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
    expect(container.querySelector('[data-testid="grant-ended"]').textContent).toMatch(/This access has ended/);
    try { localStorage.removeItem(GRANT_KEY); } catch { /* fine */ }
  });

  it('a screen with no key shows a six-letter code and a QR, polls the NAS, and opens the cameras when the owner lets it in (DR-0778, the Firestick)', async () => {
    try { localStorage.removeItem(CHAT_BRIDGE_TOKEN_KEY); localStorage.removeItem(GRANT_KEY); } catch { /* fine */ }
    const plan = { pairApproved: 2, list: { cameras: [{ id: 'front_yard', name: 'front yard', kind: 'wyze' }], count: 1, access: { name: 'TV', expires: 0, actions: false } } };
    const { fetchImpl, calls } = makeFetch(plan);
    vi.stubGlobal('fetch', fetchImpl);
    PAIR_TIMING.pollMs = 25;
    try {
      await mount();
      await act(async () => { await new Promise((r) => setTimeout(r, 15)); });
      expect(container.textContent).toMatch(/This device has no family key yet/);
      expect(container.querySelector('[data-testid="pair-code"]').textContent).toBe('ABC234');
      expect(container.querySelector('[data-testid="pair-screen"] svg')).toBeTruthy();
      expect(container.textContent).toMatch(/\/poetech-app\/\?view=cameras&cams-pair=ABC234/);
      expect(calls.filter((c) => c.url === '/cams/pair' && c.opts.method === 'POST')).toHaveLength(1);
      expect(calls.filter((c) => c.url.startsWith('/cams/snap/') || c.url === '/cams/list')).toHaveLength(0);
      await act(async () => { await new Promise((r) => setTimeout(r, 120)); });
      expect(plan.polls).toBeGreaterThanOrEqual(2);
      expect(localStorage.getItem(GRANT_KEY)).toBe('g.abcdefabcdef.' + '4'.repeat(32));
      await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
      const list = calls.find((c) => c.url === '/cams/list');
      expect(list && list.opts.headers.Authorization).toBe('Bearer g.abcdefabcdef.' + '4'.repeat(32));
      expect(container.querySelector('[data-testid="pair-screen"]')).toBeNull();
    } finally {
      PAIR_TIMING.pollMs = 3000;
      try { localStorage.removeItem(GRANT_KEY); } catch { /* fine */ }
    }
  });

  it('the owner\'s phone opens the screen\'s QR link (?cams-pair=) and lets it in as a grant; a code can also be typed under Who can see the cameras', async () => {
    const plan = { list: { cameras: [{ id: 'front_yard', name: 'front yard', kind: 'wyze' }], count: 1 } };
    const { fetchImpl, calls } = makeFetch(plan);
    vi.stubGlobal('fetch', fetchImpl);
    window.history.replaceState(null, '', '/poetech-app/?view=cameras&cams-pair=abc234');
    try {
      await mount();
      await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
      const form = container.querySelector('[data-testid="approve-pairing"]');
      expect(form).toBeTruthy();
      expect(form.textContent).toMatch(/code ABC234/);
      await act(async () => { container.querySelector('[data-testid="approve-doors"]').click(); });
      await act(async () => { form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
      await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
      const approve = calls.find((c) => /\/cams\/pair\/ABC234\/approve$/.test(c.url));
      expect(approve).toBeTruthy();
      expect(approve.opts.headers.Authorization).toBe(`Bearer ${TOKEN}`);
      expect(plan.approved).toEqual({ name: 'TV', cameras: '*', days: 0, actions: true });
      expect(container.querySelector('[data-testid="approve-result"]').textContent).toMatch(/Done\. The screen has its access as TV/);
      expect(window.location.search).not.toMatch(/cams-pair/);
      // typing a code by eye, on the Who can see tab; the approval lands back on Live
      await click(container.querySelector('[data-testid="cams-tab-access"]'));
      const input = container.querySelector('[data-testid="pair-code-input"]');
      await act(async () => { const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; setter.call(input, 'xyz789'); input.dispatchEvent(new Event('input', { bubbles: true })); });
      await act(async () => { container.querySelector('[data-testid="pair-code-form"]').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
      await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
      expect([...container.querySelectorAll('[data-testid="approve-pairing"]')].some((f) => /code XYZ789/.test(f.textContent))).toBe(true);
    } finally {
      window.history.replaceState(null, '', '/');
    }
  });

  it('is registered as a family-only, hidden-when-denied top-level surface', () => {
    const s = surfaceById['cameras'];
    expect(s).toBeTruthy();
    expect(s.nav).toBe('top');
    expect(s.view).toBe('cameras');
    expect(s.requires).toBe('cameras'); // DR-0778: the family, or a grant the owner gave this device
    expect(s.whenDenied).toBe('hide');
    expect(SURFACES.filter((x) => x.view === 'cameras')).toHaveLength(1);
  });
});
