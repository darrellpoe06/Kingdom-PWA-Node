// preview-isolation.test.js — a preview build can never reach the family's real data.
// Measured 2026-10-28: a signed-in family member on the Vercel branch preview was in
// production (real obligations rendered inside the "sample"; a test debt was written
// to the live accounts table). These pin the rule that closes it.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { isPreviewHost, resolveSupabaseConfig, previewSamplePersona, PREVIEW_STUB_URL, PREVIEW_STUB_KEY, PRODUCTION_HOSTS } from '../lib/preview-isolation.js';

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

describe('a preview is ALWAYS the sample, and offers no sign-in', () => {
  it('previewSamplePersona forces the family sample on a preview and passes the URL through elsewhere', () => {
    expect(previewSamplePersona('x.vercel.app', null)).toBe('family-of-4');
    expect(previewSamplePersona('x.vercel.app', 'landlord')).toBe('landlord');
    expect(previewSamplePersona('poetech.us', null)).toBeNull();
    expect(previewSamplePersona('localhost', 'family-of-4')).toBe('family-of-4');
  });
  it('the shell boots its persona through previewSamplePersona, hides the header sign-in on an isolated preview, and passes sample mode to the four self-fetching tabs', () => {
    const shell = read('src/poe-financial-mvp-v28.jsx');
    expect(shell).toContain("if (!sp.has('demo')) return previewSamplePersona(window.location.hostname, null)");
    expect(shell).toContain('{!isIsolatedPreview() && <HeaderAuthButton />}');
    for (const tag of ['<Obligations demo={isAnyDemoMode || reviewerMode} />', '<FamilyPlan demo={isAnyDemoMode || reviewerMode} />', '<BooksTaxes entities={data.entities || []} demo={isAnyDemoMode || reviewerMode} />', '<Contractors1099 demo={isAnyDemoMode || reviewerMode}']) {
      expect(shell, tag).toContain(tag);
    }
  });
});
