// @vitest-environment node
//
// bible-xref — the whole-Bible "unions" (Darrell 2026-07-04: "I love how the
// unions connect the old and new testament"). Verifies cross-references resolve
// from the REAL shipped assets, vote-ranked, and fail soft. The fetcher points
// at the on-disk per-book files the app serves at /bible/xref/<file>.json.
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { crossRefsFor, bookHasXrefs, __setXrefFetcher, XREF_SOURCE } from '../lib/bible-xref.js';

const ASSETS = join(dirname(fileURLToPath(import.meta.url)), '../../public/bible/xref');

beforeAll(() => {
  __setXrefFetcher(async (url) => {
    const file = String(url).split('/').pop();
    try {
      const body = readFileSync(join(ASSETS, file), 'utf8');
      return { ok: true, json: async () => JSON.parse(body) };
    } catch {
      return { ok: false, json: async () => null };
    }
  });
});

describe('the unions resolve from the shipped assets', () => {
  it('Genesis 1:1 links across the testaments (John 1, Hebrews), vote-ranked', async () => {
    const xr = await crossRefsFor('Genesis 1:1');
    expect(xr.length).toBeGreaterThan(3);
    const refs = xr.map((x) => x.ref);
    expect(refs).toContain('John 1:1-3');   // the top OT->NT union
    expect(refs.some((r) => /Hebrews/.test(r))).toBe(true);
    // ranked by community votes, descending
    for (let i = 1; i < xr.length; i += 1) expect(xr[i - 1].votes).toBeGreaterThanOrEqual(xr[i].votes);
  });
  it('resolves a New Testament verse too (John 3:16)', async () => {
    const xr = await crossRefsFor('John 3:16');
    expect(xr.length).toBeGreaterThan(0);
    expect(xr.every((x) => typeof x.ref === 'string' && Number.isFinite(x.votes))).toBe(true);
  });
  it('carries its public-domain provenance', () => {
    expect(XREF_SOURCE.license).toMatch(/Public Domain|CC-BY/);
    expect(XREF_SOURCE.url).toMatch(/openbible/);
  });
});

describe('fail-soft', () => {
  it('an unparseable ref or a verse with no links returns []', async () => {
    expect(await crossRefsFor('not a ref')).toEqual([]);
    expect(await crossRefsFor('Genesis 999:99')).toEqual([]);
  });
  it('bookHasXrefs is true for a real book, false for nonsense', () => {
    expect(bookHasXrefs('Genesis 1:1')).toBe(true);
    expect(bookHasXrefs('Hezekiah 3:1')).toBe(false);
  });
  it('degrades to [] when the fetch fails', async () => {
    __setXrefFetcher(async () => ({ ok: false, json: async () => null }));
    expect(await crossRefsFor('Isaiah 53:5')).toEqual([]);
  });
});
