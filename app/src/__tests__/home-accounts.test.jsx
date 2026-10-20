// =============================================================================
// home-accounts — your logins on the home servers, made for you (DR-1121)
// =============================================================================
// Pins the app end of the end-to-end workflow: a signed-in family member sees
// each home server's own health and their own login made by the NAS (never a
// painted status, never a login without its row), copies the first password
// once and clears it with "I have it", and the whole road is wired: the
// migration with its RLS and its household-scoped roster, the loop and its
// selftest in CI, the libraries road (function, routes, worker, transport row,
// watchdog, manifest, pinned compose on loopback with read-only shelves,
// installer order, witness), and the panel on the Big Picture.
// =============================================================================
import { describe, it, expect, vi, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  HOME_SERVICES, classifyLibraries, homeServersHealth, fetchHomeAccounts, markSeen, accountFor, librariesHealthUrl,
} from '../lib/home-accounts.js';
import { healthUrl as photoBackupHealthUrl } from '../lib/photo-backup.js';

vi.mock('../lib/supabase.js', () => ({ supabase: { rpc: vi.fn(async () => ({ data: null, error: null })) } }));
vi.mock('../lib/nas-photos.js', () => ({ bridgeToken: () => 'family-key', hasBridgeToken: () => true, setBridgeToken: () => {} }));
vi.mock('../lib/bridge-provision.js', () => ({ provisionBridgeToken: async () => 'present' }));
const { default: HomeAccounts } = await import('../components/HomeAccounts.jsx');

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
  await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
  return host;
}
afterEach(async () => {
  if (root) await act(async () => { root.unmount(); });
  if (host) host.remove();
  root = null; host = null;
});

const ROWS = [
  { service: 'immich', login: 'darrell@example.org', initial_password: 'first-pw-immich', server_url: 'https://poetech.tail5a2f35.ts.net/photo-backup', header_name: 'X-Family-Key', ready_at: '2026-10-19T00:00:00Z', seen_at: null },
  { service: 'jellyfin', login: 'darrell', initial_password: null, server_url: 'https://poetech.tail5a2f35.ts.net:8096', header_name: null, ready_at: '2026-10-19T00:00:00Z', seen_at: '2026-10-19T01:00:00Z' },
];
function fakeClient({ session = { user: { id: 'u1' } }, rows = ROWS, seen = true } = {}) {
  const rpc = vi.fn(async (name) => ({ data: name === 'home_account_seen' ? seen : null, error: null }));
  return {
    rpc,
    auth: { getSession: async () => ({ data: { session } }) },
    from: vi.fn(() => ({ select: () => ({ order: async () => ({ data: rows, error: null }) }) })),
  };
}
const healthFetch = (immich = { ok: true, version: '3.3.3', free_gb: 800 }, libs = { ok: true, jellyfin: { ok: true, version: '12.2.0' }, audiobookshelf: { ok: false, reason: 'Audiobookshelf is not answering on loopback' }, shelves: { ok: true } }) =>
  vi.fn(async (url) => (url === photoBackupHealthUrl() ? json(immich.ok ? 200 : 503, immich) : json(libs.ok ? 200 : 503, libs)));

describe('the roads’ state comes from their own /health', () => {
  it('reads each server live, dark with its own reason, or unreachable', () => {
    const c = classifyLibraries(503, { ok: false, jellyfin: { ok: true, version: '12.2.0', note: 'first start' }, audiobookshelf: { ok: false, reason: 'down' }, shelves: { ok: true } });
    expect(c.jellyfin).toEqual({ state: 'live', version: '12.2.0', note: 'first start' });
    expect(c.audiobookshelf).toEqual({ state: 'dark', reason: 'down' });
    expect(classifyLibraries(0, null).jellyfin.state).toBe('unreachable');
    expect(classifyLibraries(200, { ok: true }).jellyfin.state).toBe('unreachable');
  });
  it('asks both doors without a key', async () => {
    const f = healthFetch();
    const h = await homeServersHealth({ fetchImpl: f });
    expect(h.immich.state).toBe('live');
    expect(h.jellyfin.state).toBe('live');
    expect(h.audiobookshelf.state).toBe('dark');
    expect(f.mock.calls.map(([u]) => u).sort()).toEqual([librariesHealthUrl(), photoBackupHealthUrl()].sort());
    for (const [, opts] of f.mock.calls) expect(opts.headers).toBeUndefined();
  });
});

describe('the rows', () => {
  it('are read from home_accounts and never thrown on', async () => {
    const c = fakeClient();
    expect(await fetchHomeAccounts(c)).toHaveLength(2);
    expect(c.from).toHaveBeenCalledWith('home_accounts');
    expect(await fetchHomeAccounts(null)).toEqual([]);
    expect(await fetchHomeAccounts({ from: () => { throw new Error('x'); } })).toEqual([]);
    expect(accountFor(ROWS, 'audiobookshelf')).toBe(null);
  });
  it('"I have it" calls the RPC and is true only when the server says so', async () => {
    const c = fakeClient();
    expect(await markSeen(c, 'immich')).toBe(true);
    expect(c.rpc).toHaveBeenCalledWith('home_account_seen', { p_service: 'immich' });
    expect(await markSeen(fakeClient({ seen: false }), 'immich')).toBe(false);
  });
});

describe('the panel', () => {
  it('renders nothing when nobody is signed in', async () => {
    const el = await mount(createElement(HomeAccounts, { client: fakeClient({ session: null }), fetchImpl: healthFetch(), clipboard: null }));
    expect(el.textContent).toBe('');
  });
  it('shows each server’s own state, the person’s own logins, and "being made" where no row exists yet', async () => {
    const el = await mount(createElement(HomeAccounts, { client: fakeClient(), fetchImpl: healthFetch(), clipboard: null }));
    const t = el.textContent;
    expect(t).toMatch(/Your home servers: your logins, ready/);
    expect(t).toMatch(/Live on the NAS · v3\.3\.3/);
    expect(t).toMatch(/Live on the NAS · v12\.2\.0/);
    expect(t).toMatch(/Not ready: Audiobookshelf is not answering on loopback/);
    expect(t).toContain('darrell@example.org');
    expect(t).toContain('first-pw-immich');
    expect(t).toContain('X-Family-Key');
    expect(t).toMatch(/noted, no longer shown/);
    expect(t).toMatch(/being made on the NAS/);
    expect([...el.querySelectorAll('li[aria-label]')].length).toBe(HOME_SERVICES.length);
    for (const s of HOME_SERVICES) expect(el.querySelector(`a[href="${s.getApp}"]`) || s.id === 'audiobookshelf').toBeTruthy();
  });
  it('copies the first password and the family key, and "I have it" clears the password from the screen', async () => {
    const written = [];
    const clipboard = { writeText: async (s) => { written.push(s); } };
    const client = fakeClient();
    const el = await mount(createElement(HomeAccounts, { client, fetchImpl: healthFetch(), clipboard }));
    const immich = el.querySelector('li[aria-label^="Photos"]');
    const buttons = [...immich.querySelectorAll('button')];
    await act(async () => { buttons.find((b) => /Copy the family key/.test(b.textContent)).click(); });
    const pwCopy = buttons.filter((b) => b.textContent === 'Copy')[1];
    await act(async () => { pwCopy.click(); });
    expect(written).toEqual(['family-key', 'first-pw-immich']);
    await act(async () => { buttons.find((b) => /I have it/.test(b.textContent)).click(); });
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
    expect(client.rpc).toHaveBeenCalledWith('home_account_seen', { p_service: 'immich' });
    expect(el.textContent).not.toContain('first-pw-immich');
    expect(el.textContent).toMatch(/no longer shown/);
    // The key itself is never printed.
    expect(el.textContent).not.toContain('family-key');
  });
  it('is on the Big Picture', () => {
    expect(read('app/src/components/BigPictureDashboard.jsx')).toMatch(/<HomeAccounts \/>/);
  });
});

describe('the workflow is wired end to end', () => {
  it('the migration: a person reads only their own rows, nobody writes through the app, and the roster is one household’s, service role only', () => {
    const m = read('infra/supabase/migrations-auto/0303-home-accounts-ready-for-every-family-member.sql');
    expect(m).toMatch(/ALTER TABLE home_accounts ENABLE ROW LEVEL SECURITY/);
    expect(m).toMatch(/FOR SELECT\s+USING \(user_id = auth\.uid\(\)\)/);
    expect(m).not.toMatch(/CREATE POLICY \w+ ON home_accounts FOR (INSERT|UPDATE|DELETE)/);
    expect(m).toMatch(/home_accounts_roster\(p_bridge_token text\)/);
    expect(m).toMatch(/fsc\.chat_bridge_token = btrim\(p_bridge_token\)/);
    expect(m).toMatch(/REVOKE ALL ON FUNCTION public\.home_accounts_roster\(text\) FROM authenticated/);
    expect(m).toMatch(/GRANT EXECUTE ON FUNCTION public\.home_accounts_roster\(text\) TO service_role/);
    expect(m).toMatch(/home_account_seen\(p_service text\)[\s\S]*initial_password = NULL[\s\S]*user_id = auth\.uid\(\)/);
  });
  it('every shelf the compose mounts is declared as a library by the loop, by its container path, with Jellyfin’s internet providers off', () => {
    const c = read('infra/nas-libraries/docker-compose.yml');
    const l = read('infra/nas-home-accounts/home_accounts_sync.py');
    const start = l.indexOf('LIBRARIES = {');
    const libs = l.slice(start, l.indexOf('\n}\n', start));
    const mounts = [...c.matchAll(/^\s+- \/volume1\/[^:]+:(\/[^:\s]+):ro$/gm)].map((m) => m[1]);
    expect(mounts.length).toBe(6);
    for (const inside of mounts) expect(libs, `no library declared for the mount ${inside}`).toContain(`"path": "${inside}"`);
    expect(l).toMatch(/"EnableInternetProviders": False/);
    expect(l).toMatch(/ensure_libraries\(srv, entry\)\n\s+have = srv\.logins\(\)/);
  });

  it('the loop asks the roster with this NAS’s own key, never deletes, and its selftest gates merge', () => {
    const l = read('infra/nas-home-accounts/home_accounts_sync.py');
    expect(l).toMatch(/"p_bridge_token": bridge_token/);
    expect(l).toMatch(/TOKEN_FILE_DEFAULT = "\/volume1\/PoeTech\/secrets\/chat-bridge-token\.txt"/);
    expect(l).not.toMatch(/http\("DELETE"/);
    expect(l).toMatch(/shouldChangePassword": True/);
    expect(read('.github/workflows/ci.yml')).toMatch(/working-directory: infra\/nas-home-accounts\n\s+run: python3 home_accounts_sync\.py --selftest/);
    expect(read('.github/workflows/ci.yml')).toMatch(/working-directory: infra\/nas-libraries\n\s+run: python3 libraries_forwarder\.py --selftest/);
  });
  it('the libraries road has its function, worker road, route include, transport row and watchdog mount', () => {
    expect(read('app/functions/libraries/[[path]].js')).toMatch(/upstreamPrefix: '\/libraries'/);
    expect(read('infra/cf-roads-worker/worker.js')).toContain("['/libraries', '/libraries', 'libraries']");
    expect(read('infra/cf-roads-worker/wrangler.toml')).toContain('poetech.us/libraries/*');
    expect(JSON.parse(read('app/public/_routes.json')).include).toContain('/libraries/*');
    expect(read('infra/nas-transport/RECORDED-STATE.md')).toMatch(/^\| `\/libraries` \| `http:\/\/127\.0\.0\.1:8802`/m);
    expect(read('infra/nas-loops/loops/funnel_watchdog.py')).toContain('("/libraries", "http://127.0.0.1:8802")');
  });
  it('both are in the self-deploy manifest before research, with a witness that exists', () => {
    const svcs = JSON.parse(read('infra/nas-loops/services.json')).services;
    const names = svcs.map((s) => s.name);
    expect(names.slice(-4)).toEqual(['home-accounts', 'libraries', 'research', 'immich']);
    for (const n of ['home-accounts', 'libraries']) {
      const s = svcs.find((x) => x.name === n);
      expect(s.enabled).toBe(true);
      expect(s.description).toMatch(/Witness: libraries-health\.yml/);
    }
    expect(existsSync(join(ROOT, '.github/workflows/libraries-health.yml'))).toBe(true);
    expect(read('.github/workflows/libraries-health.yml')).toContain('where the install stands');
  });
  it('the compose pins both images by digest, keeps both on loopback, and mounts every shelf read-only', () => {
    const c = read('infra/nas-libraries/docker-compose.yml');
    const images = [...c.matchAll(/^\s*image:\s*(\S+)/gm)].map((m) => m[1]);
    expect(images).toHaveLength(2);
    for (const i of images) expect(i).toMatch(/@sha256:[0-9a-f]{64}$/);
    expect(c).toContain('"127.0.0.1:8096:8096"');
    expect(c).toContain('"127.0.0.1:13378:80"');
    expect(c).not.toMatch(/0\.0\.0\.0:/);
    const shelfMounts = [...c.matchAll(/^\s+- (\/volume1\/(?:PoeTech\/(?:library|lesson-voice)|docker\/ytzero)[^:]*):[^:]+(:ro)?$/gm)];
    expect(shelfMounts.length).toBeGreaterThanOrEqual(6);
    for (const m of shelfMounts) expect(m[2], m[0]).toBe(':ro');
  });
  it('the installer walks the Way: owns the files, moves the door first, serves the tailnet (never funnel) only after both servers answer', () => {
    const s = read('infra/nas-libraries/install.sh');
    expect(s).toContain('RECORDED-STATE');
    const at = (needle) => { const i = s.indexOf(needle); expect(i, needle).toBeGreaterThan(0); return i; };
    expect(at('door_follows_code() {')).toBeLessThan(at('own the files'));
    expect(at('\ndoor_follows_code\n')).toBeLessThan(at('locate docker'));
    expect(at('/System/Info/Public')).toBeLessThan(at('serve --bg --https=8096'));
    expect(at('"$HCODE" != "200"')).toBeLessThan(at('serve --bg --https=8096'));
    expect(s).not.toMatch(/funnel --bg[^\n]*(8096|13378)/);
    expect(s).toMatch(/funnel --bg --set-path \/libraries/);
  });
});
