// The family camera road, client side (DR-0756) — proven-to-catch. These pin
// the honesty properties the Cameras surface rests on:
//   1. the player is chosen by asking the device's <video>, never a UA sniff
//   2. the list is shaped from the restreamer's answer and never invents a camera
//   3. the surface state is DERIVED from the real answer (no painted green)
//   4. the two his-hand steps are paste-ready from anywhere (cd first, ASCII)
//   5. every call carries an explicit timeout
import { describe, it, expect, vi } from 'vitest';
import {
  CAMS_BASE, SNAPSHOT_INTERVAL_MS, FETCH_TIMEOUT_MS,
  healthUrl, listUrl, ticketUrl, snapUrl, liveUrl, pickLiveMode,
  parseCameraList, kindLabel, groupByKind, KINDS, classifyServiceState,
  formatAge, formatBytes, fetchWithTimeout, authHeaders, setupCommands, isAscii,
} from '../lib/cameras.js';

describe('the road: every URL is same-origin under /cams', () => {
  it('the base and the three control calls', () => {
    expect(CAMS_BASE).toBe('/cams');
    expect(healthUrl()).toBe('/cams/health');
    expect(listUrl()).toBe('/cams/list');
    expect(ticketUrl()).toBe('/cams/ticket');
  });
  it('snapshot and live URLs encode the id and carry the ticket as t=', () => {
    expect(snapUrl('front_yard')).toBe('/cams/snap/front_yard.jpg?w=640');
    expect(snapUrl('front_yard', { w: 320, ticket: 'a.b' })).toBe('/cams/snap/front_yard.jpg?w=320&t=a.b');
    expect(snapUrl('x', { w: 99999 })).toBe('/cams/snap/x.jpg?w=1920');
    expect(liveUrl('front_yard', 'mp4', '12.ab')).toBe('/cams/live/front_yard.mp4?t=12.ab');
    expect(liveUrl('front_yard', 'hls', '12.ab')).toBe('/cams/live/front_yard/index.m3u8?t=12.ab');
    expect(liveUrl('a b', 'mp4', 'x/y')).toBe('/cams/live/a%20b.mp4?t=x%2Fy');
  });
});

describe('pickLiveMode asks the device, not the user agent', () => {
  it('HLS when the <video> says it can play it (Safari / iOS / Fire TV)', () => {
    expect(pickLiveMode((t) => (t === 'application/vnd.apple.mpegurl' ? 'probably' : ''))).toBe('hls');
    expect(pickLiveMode(() => 'maybe')).toBe('hls');
  });
  it('MP4 everywhere else, including when there is no <video> to ask', () => {
    expect(pickLiveMode(() => '')).toBe('mp4');
    expect(pickLiveMode(null)).toBe('mp4');
    expect(pickLiveMode(() => { throw new Error('no video'); })).toBe('mp4');
  });
});

describe('parseCameraList shapes the restreamer answer and never invents', () => {
  it('keeps well-formed ids, sorts by name, labels the kind', () => {
    const out = parseCameraList({ cameras: [
      { id: 'garage', name: 'garage', kind: 'rtsp' },
      { id: 'front_yard', name: 'front yard', kind: 'wyze' },
      { id: 'bad id/with slash', name: 'x', kind: 'wyze' },
      { id: '', kind: 'wyze' },
      null,
      { id: 'doorbell', kind: 'ring' },
    ] });
    expect(out.map((c) => c.id)).toEqual(['doorbell', 'front_yard', 'garage']);
    expect(out[0].name).toBe('doorbell');
    expect(out[1].kind).toBe('wyze');
  });
  it('tolerates garbage: no cameras is an empty list, never a placeholder', () => {
    expect(parseCameraList(null)).toEqual([]);
    expect(parseCameraList({})).toEqual([]);
    expect(parseCameraList({ cameras: 'nope' })).toEqual([]);
  });
  it('groups by kind in KINDS order with readable labels', () => {
    const g = groupByKind([{ id: 'a', name: 'a', kind: 'rtsp' }, { id: 'b', name: 'b', kind: 'wyze' }, { id: 'c', name: 'c', kind: 'zzz' }]);
    expect(g.map((x) => x.kind)).toEqual(['wyze', 'rtsp', 'zzz']);
    expect(g[0].label).toBe('Wyze');
    expect(kindLabel('onvif')).toBe('ONVIF');
    expect(kindLabel('nope')).toBe('Camera');
    for (const k of KINDS.filter((x) => x.how)) expect(k.how.length).toBeGreaterThan(20);
  });
});

describe('classifyServiceState is derived from the real answer', () => {
  it.each([
    [{ tokenPresent: false, status: 200, count: 3 }, 'no-token'],
    [{ tokenPresent: true, networkError: true }, 'unreachable'],
    [{ tokenPresent: true, status: 401 }, 'unauthorized'],
    [{ tokenPresent: true, status: 403 }, 'unauthorized'],
    [{ tokenPresent: true, status: 502 }, 'unreachable'],
    [{ tokenPresent: true, status: 503 }, 'unreachable'],
    [{ tokenPresent: true, status: 200, count: 0 }, 'empty'],
    [{ tokenPresent: true, status: 200, count: 2 }, 'ready'],
    [{ tokenPresent: true, status: 418 }, 'error'],
    [{ tokenPresent: true, status: 0 }, 'error'],
  ])('%j -> %s', (input, expected) => {
    expect(classifyServiceState(input)).toBe(expected);
  });
});

describe('measured numbers read honestly', () => {
  it('formatAge', () => {
    expect(formatAge(200)).toBe('just now');
    expect(formatAge(4000)).toBe('4 s ago');
    expect(formatAge(125000)).toBe('2 m ago');
    expect(formatAge(2 * 3600 * 1000)).toBe('2 h ago');
    expect(formatAge(-1)).toBe('');
    expect(formatAge(NaN)).toBe('');
  });
  it('formatBytes', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(48 * 1024)).toBe('48 KB');
    expect(formatBytes(2.5 * 1024 * 1024)).toBe('2.5 MB');
    expect(formatBytes(-1)).toBe('');
  });
});

describe('every call has a ceiling (DoD: explicit timeout + fallback)', () => {
  it('fetchWithTimeout aborts a call that outlives its ceiling', async () => {
    vi.useFakeTimers();
    const fetchImpl = vi.fn((url, opts) => new Promise((_resolve, reject) => {
      opts.signal.addEventListener('abort', () => reject(new Error('aborted')));
    }));
    const p = fetchWithTimeout('/cams/list', {}, 50, fetchImpl);
    const settled = p.then(() => 'resolved', (e) => e.message);
    await vi.advanceTimersByTimeAsync(60);
    expect(await settled).toBe('aborted');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
  it('a prompt answer passes through and clears the timer', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, status: 200 }));
    const r = await fetchWithTimeout('/cams/health', {}, 1000, fetchImpl);
    expect(r.status).toBe(200);
  });
  it('the constants are the brakes the surface documents', () => {
    expect(SNAPSHOT_INTERVAL_MS).toBe(5000);
    expect(FETCH_TIMEOUT_MS).toBe(12000);
  });
  it('authHeaders carries the bearer only when there is one', () => {
    expect(authHeaders('abc')).toEqual({ Authorization: 'Bearer abc' });
    expect(authHeaders('')).toEqual({});
  });
});

describe('the two his-hand steps are paste-ready from anywhere (CLAUDE.md law)', () => {
  const s = setupCommands();
  it('each block starts with the cd into the repo, on its own line', () => {
    for (const k of ['place', 'tunnel']) {
      expect(s[k].text.split('\n')[0]).toBe('cd C:\\Users\\dpoe\\Kingdom-PWA-Node');
    }
  });
  it('ASCII only, no && or || outside quotes, no placeholders for values the repo knows', () => {
    for (const k of ['place', 'tunnel']) {
      expect(isAscii(s[k].text)).toBe(true);
      expect(s[k].text).not.toMatch(/<your-ip>|<user>/);
      expect(s[k].text).toContain('dpoe@192.168.1.26');
      // the only && is none; a ; joins steps inside the quoted remote command
      expect(s[k].text.replace(/"[^"]*"/g, '')).not.toMatch(/&&|\|\|/);
    }
  });
  it('the only values left to him are the four Wyze secrets, named in the quotes', () => {
    expect(s.place.text).toContain("'YOUR-WYZE-EMAIL' 'YOUR-WYZE-PASSWORD' 'YOUR-API-ID' 'YOUR-API-KEY'");
    expect(s.place.text).toContain('/volume1/PoeTech/secrets/wyze.env');
    expect(s.place.text).toContain('chmod 600');
    expect(s.tunnel.text).toContain('ssh -L 1984:127.0.0.1:1984');
    expect(s.tunnel.note).toContain('http://localhost:1984');
  });
  it('isAscii tells a smart quote from a plain one', () => {
    expect(isAscii('plain "ascii" text\n')).toBe(true);
    expect(isAscii('an em\u2014dash')).toBe(false);
  });
});
