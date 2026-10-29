// preview-isolation.test.js — a preview build can never reach the family's real data.
// Measured 2026-10-28: a signed-in family member on the Vercel branch preview was in
// production (real obligations rendered inside the "sample"; a test debt was written
// to the live accounts table). These pin the rule that closes it.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { isPreviewHost, resolveSupabaseConfig, previewSamplePersona, previewStorageKey, purgePreviewForeignState, purgePreviewSnapshots, PREVIEW_STUB_URL, PREVIEW_STUB_KEY, PRODUCTION_HOSTS, PREVIEW_STORAGE_KEY, PREVIEW_TEST_OWNER, PREVIEW_REAL_SNAPSHOT_KEYS } from '../lib/preview-isolation.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

describe('which hosts are previews', () => {
  it('every Vercel host and every Pages BRANCH alias is a preview', () => {
    for (const h of ['kingdom-pwa-node-git-money-phase-7b032e-darrellpoe06s-projects.vercel.app', 'kingdom-pwa-node.vercel.app', 'anything.vercel.app', 'money-phase-2.poetech-app.pages.dev', 'abc123.poetech-app.pages.dev']) {
      expect(isPreviewHost(h), h).toBe(true);
    }
  });
  it('production and the family\'s private hosts are NOT previews', () => {
    for (const h of [...PRODUCTION_HOSTS, 'localhost', '127.0.0.1', '192.168.1.26', '10.0.0.5', '100.64.1.2', 'poetech.tail5a2f35.ts.net', 'nas.local', '']) {
      expect(isPreviewHost(h), h || '(empty)').toBe(false);
    }
  });
});

describe('the data client on a preview reaches nothing', () => {
  it('a preview host gets the stub; production and localhost get the real values', () => {
    const real = { url: 'https://poetech.us/sb', key: 'anon-xyz' };
    const prev = resolveSupabaseConfig({ hostname: 'x-git-y.vercel.app', ...real });
    expect(prev).toMatchObject({ url: PREVIEW_STUB_URL, key: PREVIEW_STUB_KEY, isolated: true });
    expect(prev.url).not.toContain('poetech');
    expect(resolveSupabaseConfig({ hostname: 'poetech.us', ...real })).toMatchObject({ url: real.url, key: real.key, isolated: false });
    expect(resolveSupabaseConfig({ hostname: 'localhost', ...real })).toMatchObject({ url: real.url, isolated: false });
  });
  it('every module that builds a connection from the environment goes through the resolver', () => {
    for (const f of ['src/lib/supabase.js', 'src/lib/public-rpc.js', 'src/lib/auth-providers.js']) {
      const src = read(f);
      expect(src, f).toContain('resolveSupabaseConfig(');
      // the raw env values never reach createClient / fetch directly
      // the raw env value is read at most once, as the resolver's input (auth-providers reads it through its ENV alias)
      expect((src.match(/import\.meta\.env\.VITE_SUPABASE_URL/g) || []).length, f).toBeLessThanOrEqual(1);
      expect(src, f).not.toMatch(/createClient\(\s*import\.meta\.env/);
    }
  });
});

describe('a preview is the TEST HOUSEHOLD: fictional, device-only, no sign-in', () => {
  it('previewSamplePersona passes the URL persona through and otherwise boots the app path (null)', () => {
    expect(previewSamplePersona('x.vercel.app', null)).toBeNull();
    expect(previewSamplePersona('x.vercel.app', 'landlord')).toBe('landlord');
    expect(previewSamplePersona('poetech.us', null)).toBeNull();
    expect(previewSamplePersona('localhost', 'family-of-4')).toBe('family-of-4');
  });
  it('a preview saves under its OWN key; production and private hosts keep the real key', () => {
    expect(previewStorageKey('x.vercel.app')).toBe(PREVIEW_STORAGE_KEY);
    expect(PREVIEW_STORAGE_KEY).not.toBe('poe-financial-v28');
    expect(PREVIEW_REAL_SNAPSHOT_KEYS).not.toContain(PREVIEW_STORAGE_KEY);
    expect(previewStorageKey('poetech.us')).toBe('poe-financial-v28');
    expect(previewStorageKey('localhost')).toBe('poe-financial-v28');
    expect(PREVIEW_TEST_OWNER).toBe('preview-test-household');
  });
  it('the shell boots its persona through previewSamplePersona, hides the header sign-in on an isolated preview, opens the gate for the test household, saves under the preview key, purges real snapshots first, and passes the four self-fetching tabs their mode', () => {
    const shell = read('src/poe-financial-mvp-v28.jsx');
    expect(shell).toContain("if (!sp.has('demo')) return previewSamplePersona(window.location.hostname, null)");
    expect(shell).toContain('{!isIsolatedPreview() && <HeaderAuthButton />}');
    expect(shell).toContain("if (isAnyDemoMode || isIsolatedPreview()) return 'family';");
    expect(shell).toContain('if (isIsolatedPreview() && !reviewerMode) { (async () => { await purgePreviewSnapshots(window.storage); await loadSavedSnapshot(); setLoaded(true); })(); return; }');
    // the public-host / reviewer boot line is pinned word-for-word by reviewer-mode.test.js; the preview branch sits ABOVE it, so it never runs on a preview
    expect(shell.indexOf('if (isIsolatedPreview() && !reviewerMode) {')).toBeLessThan(shell.indexOf('if (isPublicHost() || reviewerMode) {'));
    expect(shell).toContain('let saved = await window.storage.get(previewStorageKey(window.location.hostname));');
    expect(shell).toContain("for (const k of (isIsolatedPreview() ? [] : ['poe-financial-v27',");
    expect(shell).toContain('if (isPublicHost() && !isIsolatedPreview() && !(authSession && authHydrated)) return;');
    expect(shell).toContain('owner: authSession?.user?.id || (isIsolatedPreview() ? PREVIEW_TEST_OWNER : undefined),');
    expect(shell).toContain("persistSnapshot((k, v) => window.storage.set(k, v), previewStorageKey(window.location.hostname), envelope, data)");
    expect(shell).toContain('isPublicHostVal: isPublicHost() && !isIsolatedPreview(), authChecked, authSession });');
    for (const tag of ['<Obligations demo={isAnyDemoMode || reviewerMode || isIsolatedPreview()} />', '<FamilyPlan demo={isAnyDemoMode || reviewerMode || isIsolatedPreview()} />', '<BooksTaxes entities={data.entities || []} demo={isAnyDemoMode || reviewerMode || isIsolatedPreview()} />', '<Contractors1099 demo={isAnyDemoMode || reviewerMode || isIsolatedPreview()}']) {
      expect(shell, tag).toContain(tag);
    }
    // the real key is read and written in exactly one place each, both through previewStorageKey
    expect((shell.match(/window\.storage\.get\('poe-financial-v28'\)/g) || []).length).toBe(0);
    expect((shell.match(/'poe-financial-v28', envelope/g) || []).length).toBe(0);
  });
  it('the data client module purges foreign state before the client is built', () => {
    const src = read('src/lib/supabase.js');
    expect(src.indexOf('purgePreviewForeignState(')).toBeGreaterThan(0);
    expect(src.indexOf('purgePreviewForeignState(')).toBeLessThan(src.indexOf('createClient(SUPABASE_URL'));
  });
});

describe('the purges: every leftover of an earlier sign-in is removed, nothing else is', () => {
  function fakeLocalStorage(init) {
    const m = new Map(Object.entries(init));
    return { get length() { return m.size; }, key: (i) => [...m.keys()][i] ?? null, getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), _keys: () => [...m.keys()] };
  }
  it('purgePreviewForeignState removes session tokens (any ref), the bridge token, the profile and the marker; keeps the rest', () => {
    const ls = fakeLocalStorage({ 'sb-mjjlevhdufpaplypnqrv-auth-token': '{}', 'sb-poetech-auth-token': '{}', 'poetech-chat-bridge-token': 'x', 'poe-current-profile': 'darrell', 'poe-snapshot-marker': '2026', 'poe-landing-seen': '1', 'poetech.help.tour.v1': '1', 'poe-money-rail-collapsed': '0' });
    const gone = purgePreviewForeignState(ls);
    expect(gone.sort()).toEqual(['poe-current-profile', 'poe-snapshot-marker', 'poetech-chat-bridge-token', 'sb-mjjlevhdufpaplypnqrv-auth-token', 'sb-poetech-auth-token']);
    expect(ls._keys().sort()).toEqual(['poe-landing-seen', 'poe-money-rail-collapsed', 'poetech.help.tour.v1']);
    expect(purgePreviewForeignState(null)).toEqual([]);
    expect(purgePreviewForeignState({ get length() { throw new Error('blocked'); } })).toEqual([]);
  });
  it('purgePreviewSnapshots removes every REAL snapshot key the loader could fall back to, never the test key', async () => {
    const store = new Map([['poe-financial-v28', '{"owner":"u1"}'], ['poe-financial-v25', '{}'], [PREVIEW_STORAGE_KEY, '{"owner":"preview-test-household"}'], ['other', 'x']]);
    const shim = { get: async (k) => (store.has(k) ? { value: store.get(k) } : null), set: async () => {}, remove: async (k) => { store.delete(k); } };
    const removed = await purgePreviewSnapshots(shim);
    expect(removed).toEqual(['poe-financial-v28', 'poe-financial-v25']);
    expect([...store.keys()]).toEqual([PREVIEW_STORAGE_KEY, 'other']);
    expect(await purgePreviewSnapshots(null)).toEqual([]);
    expect(await purgePreviewSnapshots({ get: async () => null, set: async () => {} })).toEqual([]); // a shim without remove() purges nothing, and never throws
  });
});
