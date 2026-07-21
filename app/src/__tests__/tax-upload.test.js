// @vitest-environment node
//
// tax-upload — in-app tax PDF upload to the NAS. Proven-to-catch (DR-0076): the
// validator must REJECT a non-PDF / missing year / missing entity / oversize
// before any network call; safeFilename must neutralize path traversal; the
// upload posts same-origin with the bearer and never throws.
import { describe, it, expect, afterEach } from 'vitest';
import { validateUpload, safeFilename, uploadTaxDoc, __setUploadFetcher } from '../lib/tax-upload.js';

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
    expect(validateUpload(req({ file: pdf({ size: 30 * 1024 * 1024 }) })).ok).toBe(false);
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
