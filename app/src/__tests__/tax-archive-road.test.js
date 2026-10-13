// @vitest-environment node
// =============================================================================
// The tax archive road — reachable from either door, and honest when it is not
// =============================================================================
// Darrell 2026-10-06: "The upload of the taxes and the upload... should be able
// to see the documents either way... however it does not or didn't process the
// uploaded taxes Christina uploaded... why... fix it..."
//
// WHAT WAS WRONG. lib/tax-archive.js and lib/tax-upload.js build their URLs
// BASE-RELATIVE from document.baseURI. The web build is published at the SITE
// ROOT with /poetech-app/* rewritten onto it (public/_redirects) and index.html
// carries no <base href>, so the same app answers at two doors and asks for two
// different paths. Only /poetech-app/taxes/* had a Function; at the root door
// the request fell through to the single-page app, which answers 200 with HTML.
// fetchTaxArchive parsed that as JSON, threw, and returned an EMPTY archive —
// so the screen said "No returns indexed yet" when the truth was that it never
// reached the NAS, and an upload posted into the same hole was never stored and
// never ingested.
//
// PROVEN-TO-CATCH: every assertion below fails against the shipped code —
// the root Function did not exist, and fetchTaxArchive carried no reason at all.
import { describe, it, expect, afterEach } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchTaxArchive, ARCHIVE_REASON, __setTaxFetcher } from '../lib/tax-archive.js';

const APP = join(dirname(fileURLToPath(import.meta.url)), '../..');

afterEach(() => __setTaxFetcher(null));

function answers(body, { ok = true, json = true } = {}) {
  return () => Promise.resolve({
    ok,
    json: json ? () => Promise.resolve(body) : () => Promise.reject(new Error('not JSON')),
  });
}

describe('the road exists from every door the app answers at', () => {
  it('a Function fronts /taxes/* at the SITE ROOT — the door Christina used', () => {
    expect(existsSync(join(APP, 'functions/taxes/[[path]].js'))).toBe(true);
  });

  it('and still at /poetech-app/taxes/* — the other door keeps working', () => {
    expect(existsSync(join(APP, 'functions/poetech-app/taxes/[[path]].js'))).toBe(true);
  });

  it('both forward to the same upstream prefix, so one NAS answers either door', () => {
    const root = readFileSync(join(APP, 'functions/taxes/[[path]].js'), 'utf8');
    const scoped = readFileSync(join(APP, 'functions/poetech-app/taxes/[[path]].js'), 'utf8');
    for (const src of [root, scoped]) {
      expect(src).toMatch(/upstreamPrefix:\s*'\/taxes'/);
      expect(src).toMatch(/makeFunnelProxy/);
    }
  });

  it('the root Function imports the shared factory by its real relative path', () => {
    const root = readFileSync(join(APP, 'functions/taxes/[[path]].js'), 'utf8');
    const rel = (root.match(/from\s+'([^']+funnel-proxy\.js)'/) || [])[1];
    expect(rel, 'the root route must import the proxy factory').toBeTruthy();
    expect(existsSync(join(APP, 'functions/taxes', rel))).toBe(true);
  });
});

describe('an unreadable archive says so instead of claiming the NAS is empty', () => {
  it('the SPA shell answering 200 with HTML reads as NO ROAD, not as no returns', async () => {
    __setTaxFetcher(answers(null, { ok: true, json: false }));
    const a = await fetchTaxArchive();
    expect(a.documents).toEqual([]);
    expect(a.reason).toBe(ARCHIVE_REASON.NO_ROAD);
    // The distinction is the whole point: this must NOT look like a real,
    // empty answer from the NAS.
    expect(a.reason).not.toBe(ARCHIVE_REASON.OK);
  });

  it('a 200 whose JSON has no documents array is also a missing road, not an archive', async () => {
    __setTaxFetcher(answers({ hello: 'spa' }));
    expect((await fetchTaxArchive()).reason).toBe(ARCHIVE_REASON.NO_ROAD);
  });

  it('the far end not answering reads as UNREACHABLE', async () => {
    __setTaxFetcher(() => Promise.reject(new Error('offline')));
    expect((await fetchTaxArchive()).reason).toBe(ARCHIVE_REASON.UNREACHABLE);
    __setTaxFetcher(answers(null, { ok: false }));
    expect((await fetchTaxArchive()).reason).toBe(ARCHIVE_REASON.UNREACHABLE);
  });

  it('a real NAS answer reads as OK and carries its documents', async () => {
    __setTaxFetcher(answers({
      documents: [{ id: 'a', year: 2024, entityId: 'personal', kind: 'return', filename: 'r.pdf' }],
      served_at: '2026-10-06T00:00:00Z',
    }));
    const a = await fetchTaxArchive();
    expect(a.reason).toBe(ARCHIVE_REASON.OK);
    expect(a.documents).toHaveLength(1);
    expect(a.source).toBe('nas');
  });

  it('a NAS that genuinely holds nothing is OK with an empty list — not an error', async () => {
    __setTaxFetcher(answers({ documents: [], served_at: '2026-10-06T00:00:00Z' }));
    const a = await fetchTaxArchive();
    expect(a.reason).toBe(ARCHIVE_REASON.OK);
    expect(a.documents).toEqual([]);
  });
});
