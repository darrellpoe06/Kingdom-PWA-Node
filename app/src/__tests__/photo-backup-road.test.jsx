// =============================================================================
// photo-backup-road — the app's side of the photo-backup road (DR-1120)
// =============================================================================
// The NAS end (immich_forwarder.py) proves its own door in its --selftest.
// This pins the app end: the road's state comes from its own /health and never
// a painted status, the phone steps name the forwarder's own header and the
// Funnel server URL, and the whole road is wired: Pages Function, Worker road,
// route include, transport row, watchdog mount, manifest entry (last), pinned
// compose on loopback, the installer that walks the Way, the witness, and the
// selftest that gates merge.
// =============================================================================
import { describe, it, expect, vi, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  classifyHealth, photoBackupHealth, healthUrl, PHONE_STEPS, KEY_HEADER, PHONE_SERVER_URL, LIBRARY_PATH,
} from '../lib/photo-backup.js';

vi.mock('../lib/supabase.js', () => ({ supabase: { rpc: vi.fn(async () => ({ data: null, error: null })) } }));
vi.mock('../lib/nas-photos.js', () => ({ bridgeToken: () => 'family-key', hasBridgeToken: () => true, setBridgeToken: () => {} }));
const { default: PhotoBackupStatus } = await import('../components/PhotoBackupStatus.jsx');

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const json = (status, body) => ({ status, json: async () => body });

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let host = null;
let root = null;
async function mount(el) {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => { root.render(el); });
  await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
  return host;
}
afterEach(async () => {
  if (root) await act(async () => { root.unmount(); });
  if (host) host.remove();
  root = null; host = null;
});

describe('the road’s state comes from its own /health', () => {
  it('reads live with Immich’s version and the pool, dark with the NAS’s own reason, or unreachable', () => {
    expect(classifyHealth(200, { ok: true, version: '3.3.3', free_gb: 812.4, library: LIBRARY_PATH }))
      .toEqual({ state: 'live', version: '3.3.3', freeGb: 812.4, library: LIBRARY_PATH });
    expect(classifyHealth(503, { ok: false, reason: 'The pool has 12 GB free; backups pause under 50 GB' }).state).toBe('dark');
    expect(classifyHealth(503, { ok: false, reason: 'x' }).reason).toBe('x');
    expect(classifyHealth(0, null).state).toBe('unreachable');
    expect(classifyHealth(502, { error: 'html 5xx' }).state).toBe('unreachable');
  });
  it('a 200 without ok:true is never read as live (proven-to-catch)', () => {
    expect(classifyHealth(200, { ok: false, reason: 'x' }).state).toBe('dark');
    expect(classifyHealth(200, null).state).toBe('unreachable');
  });
  it('asks /photo-backup/health without a key, and survives a thrown fetch', async () => {
    const f = vi.fn(async () => json(200, { ok: true, version: '3.3.3' }));
    expect((await photoBackupHealth({ fetchImpl: f })).state).toBe('live');
    expect(f.mock.calls[0][0]).toBe(healthUrl());
    expect(f.mock.calls[0][1].headers).toBeUndefined();
    expect((await photoBackupHealth({ fetchImpl: async () => { throw new Error('down'); } })).state).toBe('unreachable');
  });
});

describe('the phone steps say exactly what the door expects', () => {
  it('name the forwarder’s header, the Funnel server URL, and never a query string for the key', () => {
    const fwd = read('infra/nas-immich/immich_forwarder.py');
    expect(fwd).toMatch(new RegExp(`^KEY_HEADER = "${KEY_HEADER}"$`, 'm'));
    expect(fwd).toMatch(new RegExp(`^LIBRARY_DEFAULT = "${LIBRARY_PATH.replace(/\//g, '\\/')}"$`, 'm'));
    expect(PHONE_STEPS.join(' ')).toContain(KEY_HEADER);
    expect(PHONE_STEPS.join(' ')).toContain(PHONE_SERVER_URL);
    expect(PHONE_SERVER_URL).toMatch(/^https:\/\/poetech\.tail5a2f35\.ts\.net\/photo-backup$/);
    expect(PHONE_STEPS.join(' ')).not.toMatch(/\?key=|\?token=/);
  });
});

describe('the panel', () => {
  const client = { rpc: async () => ({}) };
  it('shows the NAS’s own reason when the road is dark', async () => {
    const f = vi.fn(async () => json(503, { ok: false, reason: 'The pool has 12 GB free; backups pause under 50 GB so the NAS’s other services are never starved.' }));
    const el = await mount(createElement(PhotoBackupStatus, { fetchImpl: f, client, clipboard: null }));
    expect(el.textContent).toMatch(/Not ready: The pool has 12 GB free/);
    expect(el.textContent).toContain(LIBRARY_PATH);
  });
  it('shows a live road with Immich’s version and the pool, the phone steps, and copies the key from this device', async () => {
    const f = vi.fn(async () => json(200, { ok: true, version: '3.3.3', free_gb: 812.4, library: LIBRARY_PATH }));
    const written = [];
    const clipboard = { writeText: async (s) => { written.push(s); } };
    const el = await mount(createElement(PhotoBackupStatus, { fetchImpl: f, client, clipboard }));
    expect(el.textContent).toMatch(/Live on the NAS · Immich 3\.3\.3 · 812\.4 GB free on the pool/);
    expect(el.querySelectorAll('ol li').length).toBe(PHONE_STEPS.length);
    expect(el.textContent).toContain(PHONE_SERVER_URL);
    const btn = [...el.querySelectorAll('button')].find((b) => /Copy the family key/.test(b.textContent));
    await act(async () => { btn.click(); });
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
    expect(written).toEqual(['family-key']);
    expect(el.textContent).toMatch(/Copied\./);
    // The key itself is never printed on the page.
    expect(el.textContent).not.toContain('family-key');
  });
});

describe('the road is wired end to end', () => {
  it('has its Pages Function, Worker road, route include, transport row and watchdog mount', () => {
    expect(read('app/functions/photo-backup/[[path]].js')).toMatch(/upstreamPrefix: '\/photo-backup'/);
    expect(read('infra/cf-roads-worker/worker.js')).toContain("['/photo-backup', '/photo-backup', 'photo-backup']");
    expect(read('infra/cf-roads-worker/wrangler.toml')).toContain('poetech.us/photo-backup/*');
    expect(JSON.parse(read('app/public/_routes.json')).include).toContain('/photo-backup/*');
    expect(read('infra/nas-transport/RECORDED-STATE.md')).toMatch(/^\| `\/photo-backup` \| `http:\/\/127\.0\.0\.1:8801`/m);
    expect(read('infra/nas-loops/loops/funnel_watchdog.py')).toContain('("/photo-backup", "http://127.0.0.1:8801")');
  });
  it('is in the self-deploy manifest, last, with a witness that exists', () => {
    const svcs = JSON.parse(read('infra/nas-loops/services.json')).services;
    const r = svcs.find((s) => s.name === 'immich');
    expect(r).toMatchObject({ install: 'infra/nas-immich/install.sh', enabled: true });
    expect(svcs[svcs.length - 1].name).toBe('immich');
    expect(r.description).toMatch(/Witness: immich-health\.yml/);
    expect(existsSync(join(ROOT, '.github/workflows/immich-health.yml'))).toBe(true);
    expect(read('.github/workflows/immich-health.yml')).toContain('where the install stands');
  });
  it('pins every image by digest, keeps Immich on loopback, and publishes no other port', () => {
    const c = read('infra/nas-immich/docker-compose.yml');
    const images = [...c.matchAll(/^\s*image:\s*(\S+)/gm)].map((m) => m[1]);
    expect(images).toHaveLength(4);
    for (const i of images) expect(i).toMatch(/@sha256:[0-9a-f]{64}$/);
    expect(c).toContain('immich-server:v3.3.3@');
    expect(c).toContain('immich-machine-learning:v3.3.3@');
    expect(c).toContain('"127.0.0.1:2283:2283"');
    expect([...c.matchAll(/^\s*ports:/gm)]).toHaveLength(1);
    expect(c).not.toMatch(/0\.0\.0\.0:/);
    expect(c).toContain(`${LIBRARY_PATH}:/data`);
  });
  it('the installer walks the Way: owns the files, moves the forwarder first, measures the pool, mounts only after the whole road answers', () => {
    const s = read('infra/nas-immich/install.sh');
    expect(s).toContain('RECORDED-STATE');
    const at = (needle) => { const i = s.indexOf(needle); expect(i, needle).toBeGreaterThan(0); return i; };
    expect(at('forwarder_follows_code() {')).toBeLessThan(at('own the files'));
    expect(at('mkdir -p "$DATA" "$DATA/postgres"')).toBeLessThan(at('\nforwarder_follows_code\n'));
    expect(at('\nforwarder_follows_code\n')).toBeLessThan(at('the pool must have room'));
    expect(at('the pool must have room')).toBeLessThan(at('locate docker'));
    expect(at('/api/server/ping')).toBeLessThan(at('funnel --bg --set-path /photo-backup'));
    expect(at('"$HCODE" != "200"')).toBeLessThan(at('funnel --bg --set-path /photo-backup'));
    expect(s).toMatch(/TOKEN_FILE[\s\S]*refuses to start an unlocked door/);
    expect(s).toMatch(/if ! \$SUDO test -s "\$ENV_FILE"; then/);
  });
  it('CI runs the forwarder’s selftest', () => {
    expect(read('.github/workflows/ci.yml')).toMatch(/working-directory: infra\/nas-immich\n\s+run: python3 immich_forwarder\.py --selftest/);
  });
});
