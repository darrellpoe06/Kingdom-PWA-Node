// @vitest-environment node
//
// tax-upload — in-app tax PDF upload to the NAS. Proven-to-catch (DR-0076): the
// validator must REJECT a non-PDF / missing year / missing entity / oversize
// before any network call; safeFilename must neutralize path traversal; the
// upload posts same-origin with the bearer and never throws.
import { describe, it, expect, afterEach } from 'vitest';
import { validateUpload, safeFilename, uploadTaxDoc, uploadTaxDocWithFreshKey, uploadFailureMessage, __setUploadFetcher } from '../lib/tax-upload.js';

afterEach(() => __setUploadFetcher(null));

const pdf = (over = {}) => ({ name: '2024-1040.pdf', size: 1024, type: 'application/pdf', ...over });
const req = (over = {}) => ({ file: pdf(), entityId: 'e1', year: 2024, kind: 'return', ...over });

// A minimal FormData stand-in for the node env (records appends).
class FakeFD { constructor() { this.parts = []; } append(k, v, n) { this.parts.push([k, v, n]); } }

describe('validateUpload — proven-to-catch', () => {
  it('accepts a well-formed request', () => {
    expect(validateUpload(req()).ok).toBe(true);
  });
  it('REJECTS a non-PDF', () => {
    const v = validateUpload(req({ file: pdf({ name: 'return.jpg', type: 'image/jpeg' }) }));
    expect(v.ok).toBe(false);
    expect(v.errors.join(' ')).toMatch(/must be a PDF/i);
  });
  it('REJECTS a missing/blank year and a missing entity', () => {
    expect(validateUpload(req({ year: null })).ok).toBe(false);
    expect(validateUpload(req({ entityId: '' })).ok).toBe(false);
  });
  it('REJECTS an oversize or empty file', () => {
    expect(validateUpload(req({ file: pdf({ size: 61 * 1024 * 1024 }) })).ok).toBe(false);
    expect(validateUpload(req({ file: pdf({ size: 61 * 1024 * 1024 }) })).errors.join(' ')).toMatch(/61 MB; one upload can carry up to 60 MB/);
    expect(validateUpload(req({ file: pdf({ size: 0 }) })).ok).toBe(false);
  });
  it('REJECTS an unknown kind', () => {
    expect(validateUpload(req({ kind: 'bogus' })).ok).toBe(false);
  });
});

describe('safeFilename — no traversal, pdf-suffixed', () => {
  it('strips paths and unsafe chars', () => {
    expect(safeFilename('../../etc/passwd.pdf')).toBe('passwd.pdf');
    expect(safeFilename('my return 2024.pdf')).toBe('my-return-2024.pdf');
    expect(safeFilename('noext')).toBe('noext.pdf');
  });
});

describe('uploadTaxDoc — same-origin POST, never throws', () => {
  it('does not call the network when invalid', async () => {
    let called = false;
    __setUploadFetcher(async () => { called = true; return { ok: true, json: async () => ({}) }; });
    const res = await uploadTaxDoc(req({ file: pdf({ name: 'x.txt', type: 'text/plain' }) }), { formData: new FakeFD() });
    expect(res.ok).toBe(false);
    expect(res.skipped).toBe('invalid');
    expect(called).toBe(false);
  });
  it('posts multipart with the bearer and returns the fresh archive', async () => {
    let seen = null;
    __setUploadFetcher(async (url, init) => { seen = { url, init }; return { ok: true, json: async () => ({ archive: { documents: [{ id: 't1' }] } }) }; });
    const fd = new FakeFD();
    const res = await uploadTaxDoc(req(), { token: 'abc', formData: fd });
    expect(res.ok).toBe(true);
    expect(res.archive.documents.length).toBe(1);
    expect(seen.url).toMatch(/taxes\/upload$/);
    expect(seen.init.method).toBe('POST');
    expect(seen.init.headers.authorization).toBe('Bearer abc');
    expect(fd.parts.map((p) => p[0])).toEqual(['file', 'entityId', 'year', 'kind']);
  });
  it('returns ok:false (no throw) on a server error', async () => {
    __setUploadFetcher(async () => ({ ok: false, status: 500 }));
    const res = await uploadTaxDoc(req(), { formData: new FakeFD() });
    expect(res.ok).toBe(false);
    expect(res.skipped).toBe('upload-error');
  });
  it('returns ok:false (no throw) on a network error', async () => {
    __setUploadFetcher(async () => { throw new Error('offline'); });
    const res = await uploadTaxDoc(req(), { formData: new FakeFD() });
    expect(res.ok).toBe(false);
    expect(res.skipped).toBe('network-error');
  });
});

// DR-0708 (2026-09-30): a full scanned return runs past the old 25 MB cap, and
// a device can hold a family key the NAS no longer accepts.
describe('the 60 MB cap and the one fresh-key retry', () => {
  it('ACCEPTS a 31 MB return (refused under the old 25 MB cap)', () => {
    expect(validateUpload(req({ file: pdf({ size: 31 * 1024 * 1024 }) })).ok).toBe(true);
  });
  it('a 401 fetches the key once and retries once with it', async () => {
    const seen = [];
    __setUploadFetcher(async (url, init) => { seen.push(init.headers.authorization); return seen.length === 1 ? { ok: false, status: 401, json: async () => ({ error: 'unauthorized' }) } : { ok: true, json: async () => ({ archive: { documents: [] } }) }; });
    let asked = 0;
    const res = await uploadTaxDocWithFreshKey(req(), { token: 'old', refreshToken: async () => { asked += 1; return 'new'; }, formData: new FakeFD(), retryFormData: new FakeFD() });
    expect(res.ok).toBe(true);
    expect(res.keyRefreshed).toBe(true);
    expect(asked).toBe(1);
    expect(seen).toEqual(['Bearer old', 'Bearer new']);
  });
  it('never retries a refusal that is not about the key', async () => {
    let n = 0;
    __setUploadFetcher(async () => { n += 1; return { ok: false, status: 400, json: async () => ({ error: 'bad-entity-or-year' }) }; });
    const res = await uploadTaxDocWithFreshKey(req(), { token: 't', refreshToken: async () => 'x', formData: new FakeFD() });
    expect(n).toBe(1);
    expect(res.error).toBe('bad-entity-or-year');
    expect(uploadFailureMessage(res)).toMatch(/refused the entity or the year/);
  });
  it('with no fresh key to be had, it stops after one post and says the key is the problem', async () => {
    let n = 0;
    __setUploadFetcher(async () => { n += 1; return { ok: false, status: 401, json: async () => ({}) }; });
    const res = await uploadTaxDocWithFreshKey(req(), { token: 't', refreshToken: async () => '', formData: new FakeFD() });
    expect(n).toBe(1);
    expect(uploadFailureMessage(res)).toMatch(/unauthorized/i);
  });
});
