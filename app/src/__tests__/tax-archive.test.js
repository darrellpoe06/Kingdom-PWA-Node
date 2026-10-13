// @vitest-environment node
//
// tax-archive — the same-origin reader for the sovereign tax snapshot (reuses
// the finance-ingest pattern, DR-0083). Proven-to-catch (DR-0076): it must
// return an EMPTY archive (never throw) when the snapshot is missing or bad, and
// printableUrl must resolve to the ORIGINAL PDF so a return stays printable.
import { describe, it, expect, afterEach } from 'vitest';
import { fetchTaxArchive, printableUrl, __setTaxFetcher } from '../lib/tax-archive.js';

afterEach(() => __setTaxFetcher(null));

const ok = (body) => async () => ({ ok: true, json: async () => body });

describe('fetchTaxArchive — same-origin, never throws', () => {
  it('reads the documents array from the snapshot', async () => {
    __setTaxFetcher(ok({ documents: [{ id: 'tax-1', year: 2024, entityId: 'e1', kind: 'return', filename: 'a.pdf' }], served_at: '2026-07-21T00:00:00Z' }));
    const a = await fetchTaxArchive();
    expect(a.source).toBe('nas');
    expect(a.documents.length).toBe(1);
    expect(a.documents[0].year).toBe(2024);
  });
  it('returns EMPTY (no throw) on a 404 / missing snapshot', async () => {
    __setTaxFetcher(async () => ({ ok: false }));
    const a = await fetchTaxArchive();
    expect(a.documents).toEqual([]);
    expect(a.source).toBe('none');
  });
  it('returns EMPTY (no throw) on a network error', async () => {
    __setTaxFetcher(async () => { throw new Error('offline'); });
    const a = await fetchTaxArchive();
    expect(a.documents).toEqual([]);
  });
  it('tolerates a malformed snapshot (documents not an array)', async () => {
    __setTaxFetcher(ok({ documents: 'oops' }));
    const a = await fetchTaxArchive();
    expect(a.documents).toEqual([]);
  });
});

describe('printableUrl — the original return stays printable', () => {
  it('uses an absolute storageRef as-is', () => {
    expect(printableUrl({ storageRef: 'https://poetech.tail5a2f35.ts.net/taxes/files/e1/2024/a.pdf' }))
      .toBe('https://poetech.tail5a2f35.ts.net/taxes/files/e1/2024/a.pdf');
  });
  it('uses a same-origin path storageRef as-is', () => {
    expect(printableUrl({ storageRef: '/taxes/files/e1/2024/a.pdf' })).toBe('/taxes/files/e1/2024/a.pdf');
  });
  it('builds the conventional path from entity/year/filename', () => {
    expect(printableUrl({ entityId: 'e1', year: 2024, filename: 'a.pdf' })).toMatch(/taxes\/files\/e1\/2024\/a\.pdf$/);
  });
  it('returns null when there is nothing to point at', () => {
    expect(printableUrl({})).toBe(null);
    expect(printableUrl(null)).toBe(null);
  });
});
