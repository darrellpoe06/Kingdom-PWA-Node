// @vitest-environment node
// =============================================================================
// Showcase images are served from Cloudflare, and the originals are never lost
// =============================================================================
// Darrell 2026-08-14, after the egress lockout: "resize the moore-showcase
// images and move them to cloudflare".
//
// That bucket is PUBLIC and held camera originals — 12 objects, 29.7 MB, with
// the top three alone at 24.4 MB (10.6 / 7.3 / 6.5) — served at full size to
// phones showing them a few hundred pixels wide, billed against a 5 GB monthly
// free egress quota. Free-plan projects have no image transformation, so there
// was no setting to change; the picture had to move.
//
// These pins hold the two properties that matter and are easy to break later:
// a localized copy is preferred over metered storage, and the original is still
// reachable when there is no localized copy. "Move to Cloudflare" must never
// become "the image is gone".
//
// PROVEN-TO-CATCH (DR-0076 §3): reverting showcaseImageUrl to the storage-only
// version fails 'prefers the localized copy'; removing the fallback fails
// 'falls back to the original'; deleting the manifest fails the shape case.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

const getPublicUrl = vi.fn((p) => ({ data: { publicUrl: `https://sb.example/storage/v1/object/public/moore-showcase/${p}` } }));
vi.mock('../lib/supabase.js', () => {
  const client = { storage: { from: () => ({ getPublicUrl }) } };
  return { default: client, supabase: client };
});
vi.mock('../lib/public-rpc.js', () => ({ publicRpc: vi.fn() }));

describe('showcaseImageUrl', () => {
  beforeEach(() => { vi.resetModules(); getPublicUrl.mockClear(); });

  it('prefers the localized copy, served same-origin by Cloudflare', async () => {
    vi.doMock('../lib/showcase-localized.json', () => ({
      default: { 'moore-divahs/sp-mraqpy8p-1sfd.jpeg': 'moore-divahs/sp-mraqpy8p-1sfd.jpg' },
    }));
    const { showcaseImageUrl } = await import('../lib/showcase.js?localized');
    const url = showcaseImageUrl('moore-divahs/sp-mraqpy8p-1sfd.jpeg');
    expect(url, 'a localized image must not be fetched from metered storage').toBe(
      '/showcase/moore-divahs/sp-mraqpy8p-1sfd.jpg',
    );
    expect(getPublicUrl, 'Supabase storage must not be touched for a localized image').not.toHaveBeenCalled();
  });

  it('falls back to the original when there is no localized copy', async () => {
    // "Move to Cloudflare" must never mean "the picture disappears."
    vi.doMock('../lib/showcase-localized.json', () => ({ default: {} }));
    const { showcaseImageUrl } = await import('../lib/showcase.js?empty');
    const url = showcaseImageUrl('moore-divahs/not-localized-yet.jpeg');
    expect(url).toContain('/storage/v1/object/public/moore-showcase/');
    expect(getPublicUrl).toHaveBeenCalledWith('moore-divahs/not-localized-yet.jpeg');
  });

  it('passes an absolute URL through untouched', async () => {
    vi.doMock('../lib/showcase-localized.json', () => ({ default: {} }));
    const { showcaseImageUrl } = await import('../lib/showcase.js?abs');
    expect(showcaseImageUrl('https://cdn.example/x.jpg')).toBe('https://cdn.example/x.jpg');
  });

  it('returns null for nothing, rather than a broken path', async () => {
    vi.doMock('../lib/showcase-localized.json', () => ({ default: {} }));
    const { showcaseImageUrl } = await import('../lib/showcase.js?nil');
    expect(showcaseImageUrl(null)).toBeNull();
    expect(showcaseImageUrl('')).toBeNull();
  });
});

describe('the manifest', () => {
  it('exists and is a bucket-path -> local-path map', async () => {
    const raw = JSON.parse(readFileSync(join(HERE, '../lib/showcase-localized.json'), 'utf8'));
    expect(typeof raw, 'the app imports this at build time — it must always parse').toBe('object');
    for (const [k, v] of Object.entries(raw)) {
      expect(k, 'keys are bucket object paths').toMatch(/^[\w-]+\/[\w.-]+$/);
      expect(v, 'values are repo-relative paths under app/public/showcase').toMatch(/^[\w-]+\/[\w.-]+\.(jpg|jpeg|png|webp)$/i);
    }
  });
});

describe('the localizer script', () => {
  const SRC = readFileSync(join(HERE, '../../../scripts/showcase-localize.mjs'), 'utf8');

  it('never deletes anything from the bucket', () => {
    // The bytes are Shay's business photographs and this session does not
    // delete (DR-0291 §5). The script must only ever ADD files.
    expect(SRC).not.toMatch(/\.remove\(|deleteObject|unlinkSync|rmSync/);
  });

  it('refuses to ship a "resized" file bigger than its original', () => {
    expect(SRC).toMatch(/res\.buffer\.length >= originalBytes/);
  });

  it('never upscales a small image', () => {
    expect(SRC).toMatch(/Math\.min\(1, m \/ Math\.max\(w, h\)\)/);
  });

  it('carries a selftest, so a no-op "resizer" cannot pass for one', () => {
    expect(SRC).toMatch(/THE OUTPUT IS ACTUALLY SMALLER/);
  });
});
