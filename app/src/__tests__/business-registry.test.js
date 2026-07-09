// @vitest-environment node
// business-registry (cf-registry, DR-0114) — pinned: a client door is a DATA
// row; ?biz=<slug> resolves it; Moore Divahs is row #1 with ?moore=1 as her
// permanent alias; an unknown slug resolves to NOTHING (the honest card),
// never a fallback door wearing the wrong brand.
import { describe, it, expect } from 'vitest';
import { BUSINESS_REGISTRY, getBusiness, resolveBusinessSlug } from '../lib/business-registry.js';

const params = (q) => new URLSearchParams(q);

describe('resolution — ?biz first, legacy alias second, nothing else', () => {
  it('?biz=moore-divahs resolves the row', () => {
    expect(resolveBusinessSlug(params('?biz=moore-divahs'))).toBe('moore-divahs');
  });
  it('?moore=1 stays as her alias — printed QRs never break', () => {
    expect(resolveBusinessSlug(params('?moore=1'))).toBe('moore-divahs');
  });
  it('an unknown slug resolves to null — never a wrong-brand fallback', () => {
    expect(resolveBusinessSlug(params('?biz=not-a-business'))).toBeNull();
    expect(resolveBusinessSlug(params('?other=1'))).toBeNull();
    expect(getBusiness('not-a-business')).toBeNull();
  });
});

describe('the Moore row — the first registry client, faithful to what shipped', () => {
  const row = getBusiness('moore-divahs');
  it('carries her brand with NO email field (sign-in only, #675)', () => {
    expect(row.brand.label).toBe('Moore Divahs');
    expect(row.brand.email).toBeUndefined();
  });
  it('names the real seams: steward instance, door data home, capture lane', () => {
    expect(row.instanceSlug).toBe('moore-divahs');       // role check, showcase, messages
    expect(row.doorDataInstanceSlug).toBe('poe-family'); // legacy class rows (re-point pending)
    expect(row.capturePipeline).toBe('moore-orders');
    expect(row.captureSource).toBe('moore-divahs-app');
    expect(row.manifest).toBe('/manifest-moore.webmanifest');
  });
  it('her door leads with her name — Moore first in the tabs', () => {
    expect(row.tabs[0].id).toBe('moore');
    expect(row.tabs.map((t) => t.id)).toContain('poetech');
  });
  it('every registry row carries the fields the door engine reads', () => {
    for (const b of Object.values(BUSINESS_REGISTRY)) {
      for (const k of ['slug', 'brand', 'policies', 'tabs', 'instanceSlug', 'doorDataInstanceSlug', 'capturePipeline', 'captureInstanceSlug', 'captureSource', 'manifest']) {
        expect(b[k], `${b.slug}.${k}`).toBeTruthy();
      }
    }
  });
});
