// Phone media backup (2026-07-05) — the lane that makes "get a new phone, keep
// every photo and video" true. These tests pin the sovereign transport (the
// /nas-photos Python server, never /n8n), the never-a-path client sanitizers,
// the resumable chunk protocol, and the DR-0076 verified-or-not-done ledger.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  MEDIA_BASE, MEDIA_UPLOAD_URL, mediaExistsUrl, mediaStatusUrl,
  isMediaFile, sanitizeMediaName, sanitizeDeviceLabel,
  fileFingerprint, uploadId, mediaDate,
  isBackedUp, markBackedUp, backedUpCount,
  deviceLabel, setDeviceLabel,
  uploadMedia, checkMediaService,
} from '../lib/media-backup.js';
import { CHAT_BRIDGE_TOKEN_KEY } from '../lib/nas-photos.js';

// A minimal File stand-in: uploadMedia touches only name/size/lastModified and
// slice().arrayBuffer(), so tests don't depend on jsdom's Blob internals.
function fakeFile(name, size, lastModified = 1751700000000) {
  return {
    name, size, lastModified,
    slice(start, end) {
      return { arrayBuffer: async () => new ArrayBuffer(end - start) };
    },
  };
}

beforeEach(() => { localStorage.clear(); });
afterEach(() => { vi.unstubAllGlobals(); });

// Videos CANNOT ride /n8n/webhook/photo-upload (JSON/base64, 8 MB cap, image
// only) — this pins the media lane to the sovereign raw-byte server so a stray
// edit can't silently route it back through n8n.
describe('media endpoints target the sovereign /nas-photos server', () => {
  it('all three URLs ride /nas-photos, never /n8n', () => {
    const urls = [
      MEDIA_UPLOAD_URL,
      mediaExistsUrl('my-phone', 'a.mp4', 10, '2026-07-05'),
      mediaStatusUrl('my-phone-10-1-a.mp4'),
    ];
    expect(MEDIA_BASE).toBe('/nas-photos');
    for (const u of urls) {
      expect(u.startsWith('/nas-photos/')).toBe(true);
      expect(u).not.toContain('/n8n');
      expect(u).not.toContain('webhook');
    }
  });

  it('exists URL encodes device, name, size, and date', () => {
    expect(mediaExistsUrl('my phone', "a&b.mp4", 42, '2026-07-05'))
      .toBe('/nas-photos/media-exists?device=my%20phone&name=a%26b.mp4&size=42&date=2026-07-05');
  });
});

describe('isMediaFile — photos AND videos, nothing else', () => {
  it('accepts every camera photo/video family', () => {
    for (const n of ['20260705_082412.jpg', 'a.jpeg', 'b.PNG', 'c.webp', 'd.heic', 'e.heif', 'f.gif',
      'PXL_1.mp4', 'clip.MOV', 'v.m4v', 'w.webm', 'x.mkv', 'y.avi', 'z.3gp']) {
      expect(isMediaFile(n), n).toBe(true);
    }
  });
  it('rejects non-media and junk', () => {
    for (const n of ['doc.pdf', 'evil.exe', 'noext', '', null, undefined, 'archive.zip']) {
      expect(isMediaFile(n), String(n)).toBe(false);
    }
  });
});

describe('sanitizers — a filename or device label is never a path', () => {
  it('keeps clean camera names verbatim', () => {
    expect(sanitizeMediaName('20260705_082412.jpg')).toBe('20260705_082412.jpg');
    expect(sanitizeMediaName('PXL_20260101_120000.mp4')).toBe('PXL_20260101_120000.mp4');
  });
  it('strips directories and traversal to a safe basename', () => {
    expect(sanitizeMediaName('../../etc/passwd.jpg')).toBe('passwd.jpg');
    expect(sanitizeMediaName('C:\\Users\\x\\a.mp4')).toBe('a.mp4');
  });
  it('rejects unknown extensions and empties (honest scope: photos + videos)', () => {
    expect(sanitizeMediaName('evil.exe')).toBe('');
    expect(sanitizeMediaName('noext')).toBe('');
    expect(sanitizeMediaName('')).toBe('');
  });
  it('ASCII-safes unicode names (header values must be ASCII)', () => {
    expect(sanitizeMediaName("Christina's video (1).mov")).toBe('Christina_s_video__1_.mov');
  });
  it('device labels sanitize spaces, reject traversal/empty', () => {
    expect(sanitizeDeviceLabel('DP Note 20')).toBe('DP-Note-20');
    expect(sanitizeDeviceLabel('darrell-z-fold7')).toBe('darrell-z-fold7');
    expect(sanitizeDeviceLabel('../..')).toBe('');
    expect(sanitizeDeviceLabel('   ')).toBe('');
  });
  it('device label persists per device and round-trips sanitized', () => {
    expect(deviceLabel()).toBe('');
    setDeviceLabel("Darrell's Z Fold7");
    expect(deviceLabel()).toBe('Darrell-s-Z-Fold7');
    setDeviceLabel('');
    expect(deviceLabel()).toBe('');
  });
});

describe('file identity — deterministic so interrupted uploads resume', () => {
  it('fingerprint and uploadId are stable for the same file', () => {
    const f = fakeFile('IMG_0001.jpg', 4200);
    expect(fileFingerprint(f)).toBe(fileFingerprint(fakeFile('IMG_0001.jpg', 4200)));
    expect(uploadId('dev', f)).toBe(uploadId('dev', fakeFile('IMG_0001.jpg', 4200)));
  });
  it('uploadId is header-safe (matches the server SAFE_UPLOAD_ID shape)', () => {
    const id = uploadId('my-phone', fakeFile("Christina's video (1).mov", 999));
    expect(/^[A-Za-z0-9._-]{8,120}$/.test(id)).toBe(true);
  });
  it('mediaDate reads the file capture date (lastModified)', () => {
    expect(mediaDate(fakeFile('a.jpg', 1, Date.UTC(2026, 6, 5, 12)))).toBe('2026-07-05');
  });
});

describe('ledger — remembers only what the NAS VERIFIED', () => {
  it('round-trips backed-up state per exact file', () => {
    const f = fakeFile('IMG_0001.jpg', 4200);
    expect(isBackedUp(f)).toBe(false);
    markBackedUp(f);
    expect(isBackedUp(f)).toBe(true);
    expect(backedUpCount()).toBe(1);
    // An EDITED file (new size/mtime) is a different file — must re-upload.
    expect(isBackedUp(fakeFile('IMG_0001.jpg', 4201))).toBe(false);
  });
});

describe('uploadMedia — the chunk protocol against a mocked server', () => {
  const TOKEN = 'test-bridge-token';
  const auth = (init) => (init && init.headers && (init.headers.authorization || init.headers.Authorization)) || '';

  function mockServer({ exists = false, startBytes = 0, staleStatus = false, finalBytes = null } = {}) {
    let stored = startBytes;
    const calls = [];
    const fetchMock = vi.fn(async (url, init = {}) => {
      calls.push({ url, init });
      expect(auth(init)).toBe(`Bearer ${TOKEN}`); // every call bearer-gated
      const json = (code, body) => ({ ok: code >= 200 && code < 300, status: code, json: async () => body });
      if (url.includes('/media-exists')) return json(200, { ok: true, exists, bytes: exists ? 14 : 0 });
      // staleStatus models the real 409 trigger: the status read under-reports
      // the part (0), so the client's first offset misses and the 409 carries
      // the part's REAL size for the client to adopt.
      if (url.includes('/media-upload-status')) return json(200, { ok: true, bytes: staleStatus ? 0 : stored });
      // POST /media-upload — mirrors the server: append only at the exact offset.
      const offset = Number(init.headers['x-media-offset']);
      const total = Number(init.headers['x-media-total']);
      const clen = init.body.byteLength;
      if (offset !== stored) return json(409, { ok: false, bytes: stored });
      stored += clen;
      const complete = stored >= total;
      return json(200, { ok: true, bytes: complete && finalBytes !== null ? finalBytes : stored, complete });
    });
    vi.stubGlobal('fetch', fetchMock);
    return { calls, fetchMock, bytes: () => stored };
  }

  beforeEach(() => { localStorage.setItem(CHAT_BRIDGE_TOKEN_KEY, TOKEN); });

  it('uploads in chunks, completes, VERIFIES bytes, and marks the ledger', async () => {
    const srv = mockServer();
    const f = fakeFile('vid.mp4', 14);
    const progress = [];
    const res = await uploadMedia(f, { device: 'test-phone', chunkBytes: 5, onProgress: (s) => progress.push(s) });
    expect(res).toEqual({ ok: true, bytes: 14, dedup: false });
    expect(srv.bytes()).toBe(14);
    expect(progress).toEqual([5, 10, 14]);
    expect(isBackedUp(f)).toBe(true);
    // 1 exists + 1 status + 3 chunks
    expect(srv.fetchMock).toHaveBeenCalledTimes(5);
  });

  it('skips with zero chunk posts when the NAS already has the file', async () => {
    const srv = mockServer({ exists: true });
    const f = fakeFile('vid.mp4', 14);
    const res = await uploadMedia(f, { device: 'test-phone', chunkBytes: 5 });
    expect(res).toEqual({ ok: true, bytes: 14, skipped: true });
    expect(isBackedUp(f)).toBe(true);
    expect(srv.fetchMock).toHaveBeenCalledTimes(1); // exists only — no bytes moved
  });

  it('resumes from the server-reported offset (interrupted upload)', async () => {
    const srv = mockServer({ startBytes: 10 });
    const res = await uploadMedia(fakeFile('vid.mp4', 14), { device: 'test-phone', chunkBytes: 5 });
    expect(res).toEqual({ ok: true, bytes: 14, dedup: false });
    // exists + status + ONE chunk (the last 4 bytes) — resume made it cheap.
    expect(srv.fetchMock).toHaveBeenCalledTimes(3);
  });

  it('adopts the offset from a 409 and still completes (idempotent replay)', async () => {
    // The part already holds 5 bytes but the status read said 0 — the first
    // POST at offset 0 must 409 with bytes:5, and the client adopts it.
    const srv = mockServer({ startBytes: 5, staleStatus: true });
    const res = await uploadMedia(fakeFile('vid.mp4', 14), { device: 'test-phone', chunkBytes: 5 });
    expect(res).toEqual({ ok: true, bytes: 14, dedup: false });
    expect(srv.bytes()).toBe(14);
  });

  it('refuses the checkmark when the NAS byte count mismatches (DR-0076)', async () => {
    mockServer({ finalBytes: 13 });
    const f = fakeFile('vid.mp4', 14);
    const res = await uploadMedia(f, { device: 'test-phone', chunkBytes: 5 });
    expect(res).toEqual({ ok: false, error: 'size-mismatch' });
    expect(isBackedUp(f)).toBe(false); // not verified → not marked safe
  });

  it('stops cleanly mid-queue when asked', async () => {
    mockServer();
    const res = await uploadMedia(fakeFile('vid.mp4', 14), { device: 'test-phone', chunkBytes: 5, shouldStop: () => true });
    expect(res).toEqual({ ok: false, stopped: true });
  });

  it('returns no-token without touching the network when the bridge is absent', async () => {
    localStorage.removeItem(CHAT_BRIDGE_TOKEN_KEY);
    const srv = mockServer();
    const res = await uploadMedia(fakeFile('vid.mp4', 14), { device: 'test-phone' });
    expect(res).toEqual({ ok: false, error: 'no-token' });
    expect(srv.fetchMock).not.toHaveBeenCalled();
  });

  it('rejects unsupported files honestly before any bytes move', async () => {
    const srv = mockServer();
    const res = await uploadMedia(fakeFile('evil.exe', 14), { device: 'test-phone' });
    expect(res).toEqual({ ok: false, error: 'unsupported' });
    expect(srv.fetchMock).not.toHaveBeenCalled();
  });
});

describe('checkMediaService — honest capability states, never a fake ✓', () => {
  it('no-token without a bridge token', async () => {
    expect(await checkMediaService()).toBe('no-token');
  });
  it('needs-update when the NAS runs the pre-media build (404)', async () => {
    localStorage.setItem(CHAT_BRIDGE_TOKEN_KEY, 't');
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404 })));
    expect(await checkMediaService()).toBe('needs-update');
  });
  it('ready when the status endpoint answers', async () => {
    localStorage.setItem(CHAT_BRIDGE_TOKEN_KEY, 't');
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ ok: true, bytes: 0 }) })));
    expect(await checkMediaService()).toBe('ready');
  });
  it('unreachable when the NAS is down', async () => {
    localStorage.setItem(CHAT_BRIDGE_TOKEN_KEY, 't');
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }));
    expect(await checkMediaService()).toBe('unreachable');
  });
});
