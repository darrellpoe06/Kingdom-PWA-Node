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
  validateWyzeSetup, classifySetupResult, setupWyze,
  serviceCodeState, classifyRestartResult, restartService, restartUrl,
  WYZE_DRAFT_KEY, loadWyzeDraft, saveWyzeDraft, clearWyzeDraft,
  humanizeCameraError, classifySnapError, explainWhy, fetchWhy, whyUrl, skipFailedFrame, runLimited,
  WALL_KEY, loadWall, saveWall, wallLimit, WALL_MAX_DEFAULT, SNAP_CONCURRENCY, LIVE_RECONNECT_MAX,
  recordingUrl, recListUrl, recClipUrl, fetchRecording, saveRecording, fetchClips, clipParts, groupClipsByDay, diskForecast, RETENTION_CHOICES, CLIP_TICKET_TTL,
  LIVE_TILES_KEY, loadLiveTiles, saveLiveTiles, liveTileBudget, liveTrafficLine,
  streamNameFor, parseDevices, classifyDevicesResult, classifyActionResult, fetchDevices, runDeviceAction, setupWyzeAgain, garagesFor, wyzeKept,
  GRANT_KEY, GRANT_DAYS_CHOICES, adoptGrantFromUrl, grantToken, saveGrantToken, cameraCredential, parseGrants, grantState, grantLine, grantLink, fetchGrants, createGrant, revokeGrant,
  normalizePairCode, readPairParam, pairLink, startPairing, pollPairing, approvePairing, PAIR_POLL_MS,
  LIVE_ROADS, loadLiveRoad, saveLiveRoad, loadRoadStats, recordRoadResult, roadScore, chooseLiveRoad, roadLine, LIVE_ROAD_KEY,
  VIEWS_KEY, VIEW_LAYOUTS, loadViews, saveViews, activeView, addToView, removeFromView, moveInView, setViewLayout, renameView, addView, deleteView, viewCols, viewGridClass, indexAtPoint,
  fitGrid, clampScale, setViewScale, VIEW_SCALE_MIN, VIEW_SCALE_MAX, VIEW_SCALE_STEP,
  toggleFocus, focusIn, shownCount,
  CLIP_SIZE_TIERS, recClipSizesUrl, recClipDownloadUrl, clipDownloadName, clipTierLine, fetchClipSizes, waitForClipSize,
  streamHealthUrl, fetchStreamHealth, deviceCanPlayHevc, liveStreamId, twinOf, streamHealthLine, dropKindText, dropLines,
  sdOf, wantsSd, liveEdge, liveEdgeDecision, freezeStep, tendLiveVideo, FREEZE_SECONDS, LIVE_LAG_SEEK_S, LIVE_LAG_RATE_S, LIVE_CATCHUP_RATE, LIVE_EDGE_MARGIN_S,
  recClipPlayUrl, humanizeFetchError, clipTicket, CLIP_TICKET_TIMEOUT_MS,
  ADD_KINDS, GOOGLE_SIGN_IN_NOTE, streamIdFrom, buildSourceUrl, sourceProblem, maskSource, probeLine, addStream, testStream, removeStream, setupRing, streamsUrl, streamTestUrl, streamRemoveUrl, ringSetupUrl,
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

describe('pickLiveMode: MP4 everywhere, HLS only where MP4 live cannot play (Apple engines)', () => {
  const yesHls = (t) => (t === 'application/vnd.apple.mpegurl' ? 'probably' : '');
  const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
  const IPAD = 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/118.0 Mobile/15E148 Safari/604.1';
  const MAC_SAFARI = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
  const MAC_CHROME = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0 Safari/537.36';
  const SAMSUNG = 'Mozilla/5.0 (Linux; Android 14; SAMSUNG SM-X910) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/24.0 Chrome/117.0 Mobile Safari/537.36';
  const ANDROID_CHROME = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36';
  const FIRE_TV = 'Mozilla/5.0 (Linux; Android 9; AFTKA) AppleWebKit/537.36 (KHTML, like Gecko) Silk/120 like Chrome/120 Safari/537.36';
  it('Apple engines get HLS when their <video> says it can play it', () => {
    expect(pickLiveMode(yesHls, IPHONE)).toBe('hls');
    expect(pickLiveMode(yesHls, IPAD)).toBe('hls');
    expect(pickLiveMode(yesHls, MAC_SAFARI)).toBe('hls');
    expect(pickLiveMode(() => '', IPHONE)).toBe('mp4');
  });
  it('everyone else gets MP4 even when the device claims HLS (Samsung Internet ended HLS views at 6 s and 28 s, 2026-10-07)', () => {
    expect(pickLiveMode(yesHls, SAMSUNG)).toBe('mp4');
    expect(pickLiveMode(() => 'maybe', ANDROID_CHROME)).toBe('mp4');
    expect(pickLiveMode(yesHls, MAC_CHROME)).toBe('mp4');
    expect(pickLiveMode(yesHls, FIRE_TV)).toBe('mp4');
    expect(pickLiveMode(() => '', '')).toBe('mp4');
    expect(pickLiveMode(null, SAMSUNG)).toBe('mp4');
    expect(pickLiveMode(() => { throw new Error('no video'); }, IPHONE)).toBe('mp4');
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

// WYZE SIGN-IN FROM THE APP (2026-10-07): the form is checked before anything
// is sent, and the NAS's every answer becomes one honest sentence.
describe('validateWyzeSetup', () => {
  it('names the missing fields, refuses a non-email, accepts a full form', () => {
    expect(validateWyzeSetup({}).missing).toEqual(['email', 'password', 'api_id', 'api_key']);
    expect(validateWyzeSetup({ email: 'd@x.org', password: 'p', api_id: 'a' }).message).toBe('Fill in API Key.');
    expect(validateWyzeSetup({ email: 'nope', password: 'p', api_id: 'a', api_key: 'k' }).message).toMatch(/email address/);
    expect(validateWyzeSetup({ email: ' d@x.org ', password: 'p', api_id: 'a', api_key: 'k' }).ok).toBe(true);
  });
});

describe('classifySetupResult', () => {
  it('a good sign-in counts added and already-here, and names units the restreamer cannot stream yet', () => {
    const r = classifySetupResult({ status: 200, body: { ok: true, added: 1, cameras: [
      { id: 'front_yard', name: 'Front Yard', model: 'HL_CAM4', dtls: true, registered: true, existing: true },
      { id: 'garage_cam', name: 'Garage Cam', model: 'WYZEC1-JZ', dtls: false, registered: true, existing: false },
    ] } });
    expect(r.kind).toBe('ok');
    expect(r.message).toBe('Signed in. 1 camera added, 1 already here.');
    expect(r.unsupported).toEqual(['Garage Cam']);
  });
  it('an account with no cameras is a signed-in zero, with the NAS\'s note', () => {
    const r = classifySetupResult({ status: 200, body: { ok: true, added: 0, cameras: [], note: 'signed in; this Wyze account lists no cameras' } });
    expect(r.kind).toBe('ok');
    expect(r.message).toMatch(/lists no cameras/);
  });
  it('Wyze refusing, the family key refused, busy, a dark restreamer and a network failure each say what happened', () => {
    expect(classifySetupResult({ status: 401, body: { error: 'wyze-sign-in-refused' } }).kind).toBe('refused');
    expect(classifySetupResult({ status: 401, body: { error: 'unauthorized' } }).kind).toBe('unauthorized');
    expect(classifySetupResult({ status: 409, body: { error: 'setup-in-progress' } }).kind).toBe('busy');
    expect(classifySetupResult({ status: 502, body: { error: 'go2rtc-unreachable' } }).message).toMatch(/restreamer on the NAS is dark/);
    expect(classifySetupResult({ status: 400, body: { error: 'missing-field', field: 'api_key' } }).message).toMatch(/api key is missing/);
    expect(classifySetupResult({ networkError: true }).kind).toBe('unreachable');
  });
});

describe('setupWyze', () => {
  it('posts the four values with the family bearer to /cams/setup/wyze and never throws', async () => {
    const calls = [];
    const fetchImpl = async (url, opts) => { calls.push({ url, opts }); return { status: 200, json: async () => ({ ok: true, added: 2, cameras: [] }) }; };
    const r = await setupWyze({ email: ' d@x.org ', password: 'pw', api_id: ' id ', api_key: ' key ' }, 'tok', fetchImpl);
    expect(r.kind).toBe('ok');
    expect(calls[0].url).toBe('/cams/setup/wyze');
    expect(calls[0].opts.method).toBe('POST');
    expect(calls[0].opts.headers.Authorization).toBe('Bearer tok');
    expect(JSON.parse(calls[0].opts.body)).toEqual({ email: 'd@x.org', password: 'pw', api_id: 'id', api_key: 'key' });
    expect((await setupWyze({ email: 'd@x.org', password: 'pw', api_id: 'id', api_key: 'key' }, 'tok', async () => { throw new TypeError('Failed to fetch'); })).kind).toBe('unreachable');
    expect((await setupWyze({ email: '' }, 'tok', fetchImpl)).kind).toBe('invalid');
  });
});

// DR-0772: the service names the code it runs; the app says when it is behind and restarts it from here.
describe('serviceCodeState', () => {
  it('equal shas are current, different are behind, a forwarder that cannot say is unknown (never a guess)', () => {
    expect(serviceCodeState({ forwarder: 'abc', on_disk: 'abc' })).toBe('current');
    expect(serviceCodeState({ forwarder: 'abc', on_disk: 'def' })).toBe('behind');
    expect(serviceCodeState({ forwarder: 'abc' })).toBe('unknown');
    expect(serviceCodeState(null)).toBe('unknown');
  });
});

describe('classifyRestartResult + restartService', () => {
  it('names each outcome: restarting (on newer code or not), too soon, key refused, an old service, a dark road', () => {
    expect(classifyRestartResult({ status: 200, body: { ok: true, changed: true } })).toMatchObject({ kind: 'ok', changed: true });
    expect(classifyRestartResult({ status: 200, body: { ok: true, changed: true } }).message).toMatch(/newer code/);
    expect(classifyRestartResult({ status: 200, body: { ok: true, changed: false } }).message).not.toMatch(/newer code/);
    expect(classifyRestartResult({ status: 429, body: { error: 'restart-too-soon', retry_in: 41 } })).toMatchObject({ kind: 'too-soon' });
    expect(classifyRestartResult({ status: 429, body: { error: 'restart-too-soon', retry_in: 41 } }).message).toMatch(/41 seconds/);
    expect(classifyRestartResult({ status: 401, body: { error: 'unauthorized' } }).kind).toBe('unauthorized');
    expect(classifyRestartResult({ status: 404, body: { error: 'not-found' } })).toMatchObject({ kind: 'old-service' });
    expect(classifyRestartResult({ status: 404, body: { error: 'not-found' } }).message).toMatch(/15 minutes/);
    expect(classifyRestartResult({ networkError: true }).kind).toBe('unreachable');
    expect(classifyRestartResult({ status: 500, body: { error: 'x' } }).kind).toBe('error');
  });
  it('POSTs to /cams/restart with the family bearer and never throws', async () => {
    const calls = [];
    const r = await restartService('tok', async (url, opts) => { calls.push({ url, opts }); return { status: 200, json: async () => ({ ok: true, restarting: true, changed: false }) }; });
    expect(r.kind).toBe('ok');
    expect(calls[0].url).toBe(restartUrl());
    expect(calls[0].url).toBe(`${CAMS_BASE}/restart`);
    expect(calls[0].opts.method).toBe('POST');
    expect(calls[0].opts.headers.Authorization).toBe('Bearer tok');
    expect((await restartService('tok', async () => { throw new TypeError('Failed to fetch'); })).kind).toBe('unreachable');
  });
});

// 2026-10-07, Darrell after a redeploy wiped four typed values: "Why am I needing to redo this?!"
describe('the Wyze draft survives a reload', () => {
  const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), size: () => m.size }; };
  it('saves what is typed, loads it back, clears on demand, and an all-empty draft removes the key', () => {
    const st = mem();
    expect(loadWyzeDraft(st)).toEqual({ email: '', password: '', api_id: '', api_key: '' });
    expect(saveWyzeDraft({ email: 'd@x.org', password: 'pw', api_id: 'id', api_key: 'k' }, st)).toBe(true);
    expect(JSON.parse(st.getItem(WYZE_DRAFT_KEY))).toEqual({ email: 'd@x.org', password: 'pw', api_id: 'id', api_key: 'k' });
    expect(loadWyzeDraft(st)).toEqual({ email: 'd@x.org', password: 'pw', api_id: 'id', api_key: 'k' });
    saveWyzeDraft({ email: '', password: '', api_id: '', api_key: '' }, st);
    expect(st.size()).toBe(0);
    saveWyzeDraft({ email: 'd@x.org' }, st);
    clearWyzeDraft(st);
    expect(st.size()).toBe(0);
  });
  it('a corrupt or foreign value never breaks the form', () => {
    const st = mem();
    st.setItem(WYZE_DRAFT_KEY, '{not json');
    expect(loadWyzeDraft(st)).toEqual({ email: '', password: '', api_id: '', api_key: '' });
    st.setItem(WYZE_DRAFT_KEY, JSON.stringify({ email: 5, api_id: 'ok', bogus: 'x' }));
    expect(loadWyzeDraft(st)).toEqual({ email: '', password: '', api_id: 'ok', api_key: '' });
    const broken = { getItem: () => { throw new Error('no storage'); }, setItem: () => { throw new Error('no'); }, removeItem: () => { throw new Error('no'); } };
    expect(loadWyzeDraft(broken)).toEqual({ email: '', password: '', api_id: '', api_key: '' });
    expect(saveWyzeDraft({ email: 'a' }, broken)).toBe(false);
    expect(() => clearWyzeDraft(broken)).not.toThrow();
  });
});

// DR-0774: sight, not a status. A blank tile names its real cause; the NAS explains on request.
describe('humanizeCameraError + classifySnapError', () => {
  it('classes go2rtc\'s own error text into plain words, with the host the NAS tried', () => {
    const t = humanizeCameraError('wyze: connect failed: dial udp 192.168.1.77:0: i/o timeout', '192.168.1.77');
    expect(t.kind).toBe('other-network');
    expect(t.text).toMatch(/cannot reach this camera on its own network \(the NAS tried 192\.168\.1\.77\)/);
    expect(t.text).toMatch(/other house/);
    expect(humanizeCameraError('wyze: only DTLS cameras are supported').kind).toBe('firmware');
    expect(humanizeCameraError('wyze: av login failed: bad enr').kind).toBe('auth');
    expect(humanizeCameraError('no sources').kind).toBe('missing');
    expect(humanizeCameraError('no answer in 12 s').kind).toBe('asleep');
    expect(humanizeCameraError('').kind).toBe('unknown');
    expect(humanizeCameraError('wyze: something odd').text).toBe('something odd');
  });
  it('a failed frame is a short true reason on the tile, never a bare 502', () => {
    expect(classifySnapError({ status: 504, body: { error: 'frame-timeout', after_s: 12 } })).toBe('no answer in 12 s');
    expect(classifySnapError({ status: 500, body: { error: 'no-frame', detail: 'wyze: connect failed: dial udp 192.168.1.77:0: i/o timeout' } })).toBe('NAS cannot reach it on its network');
    expect(classifySnapError({ status: 500, body: { error: 'no-frame', detail: 'wyze: only DTLS cameras are supported' } })).toBe('firmware has no DTLS');
    expect(classifySnapError({ status: 500, body: { error: 'no-frame', detail: 'wyze: K10002 failed' } })).toBe('camera refused the sign-in');
    expect(classifySnapError({ status: 503, body: { error: 'busy' } })).toBe('NAS busy, next sweep');
    expect(classifySnapError({ status: 503, body: { error: 'resting', retry_in: 290, detail: 'wyze: connect failed: discovery timeout' } })).toBe('resting 5 min after repeated misses (NAS cannot reach it on its network)');
    expect(classifySnapError({ status: 503, body: { error: 'resting', retry_in: 60, detail: 'wyze: only DTLS cameras are supported' } })).toBe('resting 1 min after repeated misses (only DTLS cameras are supported)');
    expect(classifySnapError({ status: 502, body: { error: 'go2rtc-unreachable' } })).toBe('restreamer dark');
    expect(classifySnapError({ status: 401, body: { error: 'unauthorized' } })).toBe('family key refused');
    expect(classifySnapError({ status: 500, body: { error: 'no-frame', detail: 'wyze: strange' } })).toBe('wyze: strange');
    expect(classifySnapError({ status: 418, body: null })).toBe('HTTP 418');
  });
});

describe('explainWhy + fetchWhy', () => {
  it('reads the NAS\'s /why answer into a headline, lines and the raw log', () => {
    const ex = explainWhy({ id: 'x', producers: [{ kind: 'wyze', host: '192.168.1.77', state: 'connecting' }], probe: { status: 500, ok: false, error: 'wyze: connect failed: dial udp 192.168.1.77:0: i/o timeout', ms: 1200 }, log: ['06:40 warn connect failed'] });
    expect(ex.kind).toBe('other-network');
    expect(ex.headline).toMatch(/the NAS tried 192\.168\.1\.77/);
    expect(ex.lines[0]).toMatch(/Camera address the NAS uses: 192\.168\.1\.77 · restreamer state: connecting/);
    expect(ex.lines[1]).toMatch(/The restreamer said: wyze: connect failed/);
    expect(ex.log).toEqual(['06:40 warn connect failed']);
    const ok = explainWhy({ id: 'y', producers: [{ kind: 'wyze', host: '192.168.1.50', state: 'playing' }], probe: { status: 200, ok: true, ms: 800 }, log: [] });
    expect(ok.kind).toBe('ok');
    expect(ok.headline).toMatch(/answers now/);
    const t = explainWhy({ id: 'z', producers: [], probe: { status: 0, ok: false, timeout: true, error: 'no answer in 12 s', ms: 12000 }, log: [] });
    expect(t.kind).toBe('asleep');
    expect(t.lines[0]).toMatch(/heard nothing for 12 s/);
    expect(explainWhy(null).kind).toBe('unknown');
  });
  it('fetchWhy asks /cams/why/<id> with the bearer and names an older service (404) or a dark road', async () => {
    const calls = [];
    const r = await fetchWhy('front_yard', 'tok', async (url, opts) => { calls.push({ url, opts }); return { status: 200, json: async () => ({ id: 'front_yard', producers: [], probe: { ok: true, status: 200, ms: 5 }, log: [] }) }; });
    expect(calls[0].url).toBe(whyUrl('front_yard'));
    expect(calls[0].url).toBe('/cams/why/front_yard');
    expect(calls[0].opts.headers.Authorization).toBe('Bearer tok');
    expect(r.ok).toBe(true);
    expect(r.explanation.kind).toBe('ok');
    const old = await fetchWhy('x', 'tok', async () => ({ status: 404, json: async () => ({ error: 'not-found' }) }));
    expect(old.ok).toBe(false);
    expect(old.explanation.headline).toMatch(/older camera service/);
    const dark = await fetchWhy('x', 'tok', async () => { throw new TypeError('Failed to fetch'); });
    expect(dark.explanation.headline).toMatch(/did not answer/);
  });
});

describe('the sweep: several at once, a failed camera rested', () => {
  it('skipFailedFrame rests a camera that failed inside the window and not after it', () => {
    const now = 1_000_000;
    expect(skipFailedFrame({ error: 'x', errorAt: now - 1000 }, now)).toBe(true);
    expect(skipFailedFrame({ error: 'x', errorAt: now - 40000 }, now)).toBe(false);
    expect(skipFailedFrame({ url: 'blob:', error: '' }, now)).toBe(false);
    expect(skipFailedFrame(undefined, now)).toBe(false);
  });
  it('runLimited keeps at most `limit` in flight and finishes every item', async () => {
    let inflight = 0; let peak = 0; const done = [];
    await runLimited([1, 2, 3, 4, 5, 6, 7], 3, async (n) => {
      inflight += 1; peak = Math.max(peak, inflight);
      await new Promise((r) => setTimeout(r, 5));
      inflight -= 1; done.push(n);
    });
    expect(peak).toBe(3);
    expect(done.sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(SNAP_CONCURRENCY).toBeGreaterThan(1);
    expect(LIVE_RECONNECT_MAX).toBeGreaterThan(0);
  });
});

describe('the wall: which cameras to watch together, kept per device', () => {
  const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), size: () => m.size }; };
  it('saves and loads ids, drops junk, and the empty wall removes the key', () => {
    const st = mem();
    expect(loadWall(st)).toEqual([]);
    saveWall(['front_yard', 'garage'], st);
    expect(JSON.parse(st.getItem(WALL_KEY))).toEqual(['front_yard', 'garage']);
    st.setItem(WALL_KEY, JSON.stringify(['ok_cam', 'bad id/with slash', 7]));
    expect(loadWall(st)).toEqual(['ok_cam']);
    saveWall([], st);
    expect(st.size()).toBe(0);
  });
  it('the wall\'s size follows the NAS\'s live cap, never above 12, and has a default when the NAS does not say', () => {
    expect(wallLimit({ max_live: 12 })).toBe(12);
    expect(wallLimit({ max_live: 40 })).toBe(12);
    expect(wallLimit({ max_live: 2 })).toBe(2);
    expect(wallLimit(null)).toBe(WALL_MAX_DEFAULT);
  });
});

// DR-0775: recorded loops to the NAS, read from the recorder's own status.
describe('recorded loops: urls, clips, grouping, the measured forecast', () => {
  it('urls stay under /cams and carry the ticket on a clip', () => {
    expect(recordingUrl()).toBe('/cams/recording');
    expect(recListUrl('front_yard')).toBe('/cams/rec/front_yard');
    expect(recClipUrl('front_yard', '2026-10-07T06-40-00.mp4', '1.ab')).toBe('/cams/rec/front_yard/2026-10-07T06-40-00.mp4?t=1.ab');
    expect(RETENTION_CHOICES).toContain(14);
    expect(CLIP_TICKET_TTL).toBe(3600);
  });
  it('clipParts and groupClipsByDay: a clip name is its day and time; days newest first, clips newest first', () => {
    expect(clipParts('2026-10-07T06-40-00.mp4')).toEqual({ day: '2026-10-07', time: '06:40', seconds: '06:40:00' });
    expect(clipParts('junk').day).toBe('');
    const days = groupClipsByDay([
      { name: '2026-10-06T23-50-00.mp4', bytes: 10, start: 100 },
      { name: '2026-10-07T06-40-00.mp4', bytes: 20, start: 300 },
      { name: '2026-10-07T06-50-00.mp4', bytes: 30, start: 400 },
      { name: 'bad.mp4', bytes: 1, start: 1 },
    ]);
    expect(days.map((d) => d.day)).toEqual(['2026-10-07', '2026-10-06']);
    expect(days[0].clips.map((c) => c.name)).toEqual(['2026-10-07T06-50-00.mp4', '2026-10-07T06-40-00.mp4']);
    expect(days[0].bytes).toBe(50);
  });
  it('diskForecast measures the rate from real clips and says when it cannot', () => {
    const now = 1_800_000_000;
    const f = diskForecast({ disk_budget_gb: 100, total_bytes: 5e9, disk_free_bytes: 900e9, cameras: {
      front: { recording: true, bytes: 8.64e9, oldest: now - 86400, newest: now },  // 8.64 GB over a day = 100 kB/s
      yard: { recording: true, bytes: 1e6, oldest: now - 600, newest: now },         // under an hour: not measured
      garage: { recording: false, bytes: 5e8, oldest: now - 86400, newest: now - 1000 },
    } });
    expect(f.recording).toBe(2);
    expect(f.measured).toBe(1);
    expect(Math.round(f.bytesPerDay)).toBe(8.64e9);
    expect(Math.round(f.daysAtBudget)).toBe(12);
    expect(f.line).toMatch(/2 recording · about [\d.]+ [MG]B a day \(measured on 1\) · the 100 GB budget holds about 12 days/);
    expect(diskForecast({ disk_budget_gb: 50, total_bytes: 0, cameras: {} }).line).toBe('No camera is recording.');
    expect(diskForecast({ disk_budget_gb: 50, total_bytes: 0, cameras: { a: { recording: true, bytes: 10, oldest: now - 10, newest: now } } }).line).toMatch(/not measured yet/);
    expect(diskForecast(null)).toBeNull();
  });
  it('fetchRecording / saveRecording / fetchClips speak to the forwarder with the bearer and name every failure', async () => {
    const calls = [];
    const ok = await fetchRecording('tok', async (url, opts) => { calls.push({ url, opts }); return { status: 200, json: async () => ({ config: { disk_budget_gb: 50, cameras: {} }, status: { total_bytes: 1 }, root: '/r' }) }; });
    expect(calls[0].url).toBe('/cams/recording');
    expect(calls[0].opts.headers.Authorization).toBe('Bearer tok');
    expect(ok.ok).toBe(true);
    expect(ok.config.disk_budget_gb).toBe(50);
    expect((await fetchRecording('tok', async () => ({ status: 404, json: async () => ({}) }))).message).toMatch(/older camera service/);
    const put = await saveRecording({ disk_budget_gb: 50, cameras: { a: { enabled: true, retention_days: 7 } } }, 'tok', async (url, opts) => { calls.push({ url, opts }); return { status: 200, json: async () => ({ ok: true, config: { disk_budget_gb: 50, cameras: { a: { enabled: true, retention_days: 7 } } } }) }; });
    expect(put.ok).toBe(true);
    expect(calls[1].opts.method).toBe('PUT');
    expect(JSON.parse(calls[1].opts.body).cameras.a.enabled).toBe(true);
    expect((await saveRecording({}, 'tok', async () => ({ status: 400, json: async () => ({ error: 'unknown-camera', cameras: ['ghost'] }) }))).message).toMatch(/no camera named ghost/);
    expect((await saveRecording({}, 'tok', async () => { throw new TypeError('x'); })).message).toMatch(/did not answer/);
    const clips = await fetchClips('a', 'tok', async () => ({ status: 200, json: async () => ({ clips: [{ name: '2026-10-07T06-40-00.mp4', bytes: 5, start: 1 }, { name: 'evil/../x.mp4', bytes: 1, start: 2 }] }) }));
    expect(clips.ok).toBe(true);
    expect(clips.clips.map((c) => c.name)).toEqual(['2026-10-07T06-40-00.mp4']);
  });
});

// DR-0776: live in every tile, the link measured.
describe('live tiles: the default, the device choice, the budget and the traffic line', () => {
  const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
  it('defaults to on, remembers off, and tolerates a broken store', () => {
    const st = mem();
    expect(loadLiveTiles(st)).toBe(true);
    saveLiveTiles(false, st);
    expect(st.getItem(LIVE_TILES_KEY)).toBe('0');
    expect(loadLiveTiles(st)).toBe(false);
    saveLiveTiles(true, st);
    expect(loadLiveTiles(st)).toBe(true);
    const broken = { getItem: () => { throw new Error('no'); }, setItem: () => { throw new Error('no'); } };
    expect(loadLiveTiles(broken)).toBe(true);
    expect(saveLiveTiles(true, broken)).toBe(false);
  });
  it('the live-tile budget is the NAS cap minus the wall, never negative, 32 when the NAS does not say', () => {
    expect(liveTileBudget({ max_live: 32 }, 4)).toBe(28);
    expect(liveTileBudget({ max_live: 2 }, 5)).toBe(0);
    expect(liveTileBudget(null, 0)).toBe(32);
  });
  it('the traffic line is the measured number, in the unit that reads', () => {
    expect(liveTrafficLine({ live_open: 1, live_bytes_per_s: 125000 })).toBe('1 live stream · 1.0 Mbit/s through the Funnel');
    expect(liveTrafficLine({ live_open: 3, live_bytes_per_s: 5000 })).toBe('3 live streams · 40 kbit/s through the Funnel');
    expect(liveTrafficLine({ live_open: 0, live_bytes_per_s: 0 })).toBe('0 live streams · 0 bit/s through the Funnel');
    expect(liveTrafficLine({ ok: true })).toBe('');
  });
});

// DR-0777: the door opens with no video in the way; the sign-in is never typed twice.
describe('doors: devices, the garage action, the kept sign-in', () => {
  it('a nickname maps to the same stream id the NAS gives it', () => {
    expect(streamNameFor('Garage Doors')).toBe('garage_doors');
    expect(streamNameFor('  Front Yard! ')).toBe('front_yard');
    expect(streamNameFor('')).toBe('camera');
    expect(streamNameFor('x'.repeat(80))).toHaveLength(48);
  });
  it('parseDevices keeps only well-formed records and pairs by stream', () => {
    const d = parseDevices({ devices: [
      { mac: 'GD1', nickname: 'Garage Doors', model: 'WYZE_CAKP2JFUS', online: true, garage: true, stream: 'garage_doors', actions: ['garage', 'siren_on'] },
      { mac: 'FY1', nickname: 'Front Yard', online: false, garage: false },
      { nickname: 'no mac' }, 'junk',
    ] });
    expect(d.map((x) => x.mac)).toEqual(['GD1', 'FY1']);
    expect(d[0].garage).toBe(true);
    expect(d[1].stream).toBe('front_yard');
    expect(d[1].actions).toEqual([]);
    expect(parseDevices(null)).toEqual([]);
  });
  it('classifyDevicesResult says each state plainly', () => {
    expect(classifyDevicesResult({ status: 200, body: { devices: [{ mac: 'a', nickname: 'A', garage: true }] } }).devices).toHaveLength(1);
    expect(classifyDevicesResult({ status: 503, body: { error: 'no-credentials' } }).kind).toBe('no-credentials');
    expect(classifyDevicesResult({ status: 401, body: { error: 'wyze-sign-in-refused' } }).kind).toBe('refused');
    expect(classifyDevicesResult({ status: 401, body: {} }).kind).toBe('unauthorized');
    expect(classifyDevicesResult({ status: 404 }).kind).toBe('old-service');
    expect(classifyDevicesResult({ status: 403, body: { error: 'no-actions' } }).kind).toBe('no-actions');
    expect(classifyDevicesResult({ status: 502, body: { error: 'unreachable' } }).message).toMatch(/Wyze's cloud did not answer/);
    expect(classifyDevicesResult({ networkError: true }).kind).toBe('unreachable');
  });
  it('classifyActionResult: accepted, too soon, offline, no controller, refused, old service', () => {
    expect(classifyActionResult({ status: 200, body: { ok: true, nickname: 'Garage Doors' } })).toEqual({ kind: 'ok', message: 'The door was told to move. Wyze accepted it for Garage Doors.' });
    expect(classifyActionResult({ status: 429, body: { error: 'too-soon', retry_in: 2 } }).message).toMatch(/never told twice.*2 s/);
    expect(classifyActionResult({ status: 409, body: { error: 'device-offline' } }).kind).toBe('offline');
    expect(classifyActionResult({ status: 400, body: { error: 'no-garage-controller' } }).kind).toBe('no-controller');
    expect(classifyActionResult({ status: 401, body: { error: 'wyze-sign-in-refused' } }).kind).toBe('refused');
    expect(classifyActionResult({ status: 503, body: { error: 'no-credentials' } }).kind).toBe('no-credentials');
    expect(classifyActionResult({ status: 404 }).kind).toBe('old-service');
    expect(classifyActionResult({ status: 500, body: { error: 'wyze-code-9' } }).message).toMatch(/HTTP 500 \(wyze-code-9\)/);
    expect(classifyActionResult({ networkError: true }).message).toMatch(/Nothing was sent/);
    expect(classifyActionResult({ status: 200, body: { ok: true } }, 'siren_on').message).toMatch(/^Sent: siren on/);
  });
  it('fetchDevices / runDeviceAction / setupWyzeAgain speak to the forwarder with the bearer; no ticket, no stream', async () => {
    const calls = [];
    const f = async (url, opts = {}) => { calls.push({ url, opts }); return { status: 200, json: async () => (url === '/cams/action' ? { ok: true, nickname: 'G' } : url === '/cams/devices' ? { devices: [{ mac: 'GD1', nickname: 'G', garage: true }] } : { ok: true, added: 2, cameras: [{ id: 'a', name: 'A', registered: true }, { id: 'b', name: 'B', existing: true }], again: true }) }; };
    const d = await fetchDevices('tok', f);
    expect(d.kind).toBe('ok');
    expect(calls[0].url).toBe('/cams/devices');
    expect(calls[0].opts.headers.Authorization).toBe('Bearer tok');
    const a = await runDeviceAction('GD1', 'garage', 'tok', f);
    expect(a.kind).toBe('ok');
    expect(calls[1].url).toBe('/cams/action');
    expect(calls[1].opts.method).toBe('POST');
    expect(JSON.parse(calls[1].opts.body)).toEqual({ mac: 'GD1', action: 'garage' });
    const again = await setupWyzeAgain('tok', f);
    expect(again.kind).toBe('ok');
    expect(calls[2].url).toBe('/cams/setup/wyze/again');
    expect(calls.some((c) => c.url === '/cams/ticket' || c.url.startsWith('/cams/live/'))).toBe(false);
    expect((await setupWyzeAgain('tok', async () => ({ status: 503, json: async () => ({ error: 'no-credentials' }) }))).kind).toBe('no-credentials');
    expect((await setupWyzeAgain('tok', async () => ({ status: 404, json: async () => ({}) }))).kind).toBe('old-service');
  });
  it('garagesFor pairs each garage device with its tile when the tile exists; wyzeKept reads /health', () => {
    const g = garagesFor([{ mac: 'GD1', garage: true, stream: 'garage_doors' }, { mac: 'X', garage: true, stream: 'other_house' }, { mac: 'FY', garage: false, stream: 'front_yard' }], [{ id: 'garage_doors' }, { id: 'front_yard' }]);
    expect(g.map((x) => [x.mac, x.cameraId])).toEqual([['GD1', 'garage_doors'], ['X', '']]);
    expect(garagesFor(null, null)).toEqual([]);
    expect(wyzeKept({ wyze_cloud: 'ready' })).toBe(true);
    expect(wyzeKept({ wyze_cloud: 'no-credentials' })).toBe(false);
    expect(wyzeKept({ ok: true })).toBe(false);
  });
});

// DR-0778: access is given and taken back, never a password.
describe('access grants: the link on the device, the credential, the owner\'s list', () => {
  const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
  const TOK = 'g.0123456789ab.' + 'f'.repeat(32);
  it('a grant link is adopted on boot: stored on the device, taken out of the address; junk is ignored', () => {
    const st = mem();
    const replaced = [];
    const history = { replaceState: (_s, _t, url) => replaced.push(url) };
    expect(adoptGrantFromUrl({ href: `https://poetech.us/poetech-app/?view=cameras&cams-grant=${TOK}#x` }, st, history)).toBe(TOK);
    expect(st.getItem(GRANT_KEY)).toBe(TOK);
    expect(replaced).toEqual(['/poetech-app/?view=cameras#x']);
    expect(adoptGrantFromUrl({ href: 'https://poetech.us/poetech-app/?cams-grant=not-a-token' }, mem(), history)).toBe('');
    expect(adoptGrantFromUrl({ href: 'https://poetech.us/poetech-app/?view=cameras' }, mem(), history)).toBe('');
    expect(grantToken(st)).toBe(TOK);
    expect(saveGrantToken('', st)).toBe(true);
    expect(grantToken(st)).toBe('');
    expect(saveGrantToken('garbage', st)).toBe(false);
  });
  it('the credential is the family bearer first, the grant second, nothing third', () => {
    const st = mem();
    expect(cameraCredential({ bridge: 'fam', storage: st })).toEqual({ token: 'fam', kind: 'owner' });
    saveGrantToken(TOK, st);
    expect(cameraCredential({ bridge: '', storage: st })).toEqual({ token: TOK, kind: 'grant' });
    expect(cameraCredential({ bridge: '', storage: mem() })).toEqual({ token: '', kind: 'none' });
  });
  it('parseGrants / grantState / grantLine / grantLink read the owner\'s list in plain words', () => {
    const now = 1_800_000_000_000;
    const gs = parseGrants({ grants: [
      { id: 'a', name: 'Christina', cameras: '*', actions: true, created: 1, expires: 0, revoked: 0, last_used: now / 1000 - 60 },
      { id: 'b', name: 'Neighbor', cameras: ['front_yard'], actions: false, created: 2, expires: now / 1000 - 10, revoked: 0, last_used: 0 },
      { id: 'c', name: 'Old', cameras: ['x', 'y'], created: 3, revoked: 5 },
      { nope: true },
    ] });
    expect(gs.map((g) => g.id)).toEqual(['a', 'b', 'c']);
    expect(grantState(gs[0], now)).toBe('live');
    expect(grantState(gs[1], now)).toBe('expired');
    expect(grantState(gs[2], now)).toBe('revoked');
    expect(grantLine(gs[0], now)).toBe('every camera · until taken back · doors too · last used 1 m ago');
    expect(grantLine(gs[1], now)).toMatch(/^1 camera · until .* · expired$/);
    expect(grantLine(gs[2], now)).toBe('2 cameras · until taken back · revoked');
    expect(grantLink(TOK, 'https://poetech.us')).toBe(`https://poetech.us/poetech-app/?view=cameras&cams-grant=${TOK}`);
    expect(GRANT_DAYS_CHOICES).toEqual([0, 1, 7, 30, 365]);
  });
  it('fetchGrants / createGrant / revokeGrant speak to the forwarder with the owner\'s bearer and say every failure', async () => {
    const calls = [];
    const f = async (url, opts = {}) => {
      calls.push({ url, opts });
      if (url === '/cams/grants' && (opts.method || 'GET') === 'GET') return { status: 200, json: async () => ({ grants: [{ id: 'a', name: 'C', cameras: '*' }], link_path: '/poetech-app/?view=cameras&cams-grant=' }) };
      if (url === '/cams/grants') return { status: 200, json: async () => ({ ok: true, id: 'a', token: TOK, link_path: '/poetech-app/?view=cameras&cams-grant=' }) };
      return { status: 200, json: async () => ({ ok: true }) };
    };
    const l = await fetchGrants('tok', f);
    expect(l.ok).toBe(true); expect(l.grants).toHaveLength(1); expect(calls[0].opts.headers.Authorization).toBe('Bearer tok');
    const c = await createGrant({ name: 'Christina', cameras: '*', days: 0, actions: true }, 'tok', f);
    expect(c.ok).toBe(true); expect(c.token).toBe(TOK);
    expect(JSON.parse(calls[1].opts.body)).toEqual({ name: 'Christina', cameras: '*', days: 0, actions: true });
    const r = await revokeGrant('a', 'tok', f);
    expect(r.ok).toBe(true); expect(calls[2].url).toBe('/cams/grants/a/revoke'); expect(calls[2].opts.method).toBe('POST');
    expect((await fetchGrants('tok', async () => ({ status: 404, json: async () => ({}) }))).message).toMatch(/older camera service/);
    expect((await createGrant({ name: '' }, 'tok', async () => ({ status: 400, json: async () => ({ error: 'missing-name' }) }))).message).toMatch(/Give the access a name/);
    expect((await createGrant({ name: 'x' }, 'tok', async () => ({ status: 401, json: async () => ({}) }))).message).toMatch(/Only the owner/);
    expect((await revokeGrant('zz', 'tok', async () => ({ status: 404, json: async () => ({}) }))).message).toMatch(/not found/);
    expect((await revokeGrant('a', 'tok', async () => { throw new TypeError('x'); })).message).toMatch(/did not answer/);
  });
});

// DR-0778: a screen pairs with the owner's phone by a code.
describe('screen pairing: the code, the QR link, the poll, the approval', () => {
  it('normalizes a code read off a TV: case, spaces, and the letters the alphabet left out', () => {
    expect(normalizePairCode(' abc 234 ')).toBe('ABC234');
    expect(normalizePairCode('abc2340')).toBe('');
    expect(normalizePairCode('ab')).toBe('');
    expect(readPairParam({ href: 'https://poetech.us/poetech-app/?view=cameras&cams-pair=xyz789' })).toBe('XYZ789');
    expect(readPairParam({ href: 'https://poetech.us/poetech-app/?view=cameras' })).toBe('');
    expect(pairLink('ABC234', 'https://poetech.us')).toBe('https://poetech.us/poetech-app/?view=cameras&cams-pair=ABC234');
    expect(PAIR_POLL_MS).toBe(3000);
  });
  it('startPairing / pollPairing / approvePairing speak to the forwarder and say every state', async () => {
    const calls = [];
    const f = async (url, opts = {}) => {
      calls.push({ url, opts });
      if (url === '/cams/pair') return { status: 200, json: async () => ({ code: 'ABC234', watch: 'w'.repeat(32), expires_in: 600, link_path: '/poetech-app/?view=cameras&cams-pair=' }) };
      if (url.startsWith('/cams/pair/ABC234?w=')) return { status: 200, json: async () => ({ status: 'approved', token: 'g.abcdefabcdef.' + '5'.repeat(32) }) };
      if (url === '/cams/pair/ABC234/approve') return { status: 200, json: async () => ({ ok: true, grant: { id: 'x', name: 'TV' } }) };
      return { status: 404, json: async () => ({}) };
    };
    const st = await startPairing(f);
    expect(st).toMatchObject({ ok: true, code: 'ABC234', expiresIn: 600 });
    expect(calls[0].opts.method).toBe('POST');
    expect(calls[0].opts.headers).toBeUndefined(); // no key on the screen
    const pl = await pollPairing('ABC234', 'w'.repeat(32), f);
    expect(pl).toEqual({ status: 'approved', token: 'g.abcdefabcdef.' + '5'.repeat(32) });
    const ap = await approvePairing('ABC234', { name: 'TV', actions: true }, 'tok', f);
    expect(ap.ok).toBe(true);
    expect(JSON.parse(calls[2].opts.body)).toEqual({ name: 'TV', cameras: '*', days: 0, actions: true });
    expect(calls[2].opts.headers.Authorization).toBe('Bearer tok');
    expect((await startPairing(async () => ({ status: 429, json: async () => ({ error: 'pair-too-soon' }) }))).retry).toBe(true);
    expect((await startPairing(async () => ({ status: 404, json: async () => ({}) }))).message).toMatch(/older camera service/);
    expect((await pollPairing('ABC234', 'w', async () => ({ status: 404, json: async () => ({ status: 'expired' }) }))).status).toBe('expired');
    expect((await pollPairing('ABC234', 'w', async () => ({ status: 200, json: async () => ({ status: 'waiting' }) }))).status).toBe('waiting');
    expect((await approvePairing('ABC234', { name: 'TV' }, 'tok', async () => ({ status: 404, json: async () => ({ error: 'no-such-code' }) }))).message).toMatch(/not waiting/);
    expect((await approvePairing('ABC234', { name: 'TV' }, 'tok', async () => { throw new TypeError('x'); })).message).toMatch(/Nothing was approved/);
  });
});

// DR-0782: the live road is chosen from what worked on this device.
describe('the live road: Auto from the record, a pin honoured, a failed road swapped', () => {
  const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
  const chromeUA = 'Mozilla/5.0 (Linux; Android 14; SM-X900) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36';
  const iosUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
  it('the preference is remembered on the device and junk reads as Auto', () => {
    const st = mem();
    expect(loadLiveRoad(st)).toBe('auto');
    expect(saveLiveRoad('hls', st)).toBe(true);
    expect(st.getItem(LIVE_ROAD_KEY)).toBe('hls');
    expect(loadLiveRoad(st)).toBe('hls');
    expect(saveLiveRoad('rtsp', st)).toBe(false);
    expect(LIVE_ROADS).toEqual(['auto', 'mp4', 'hls']);
  });
  it('a pinned road is itself; Auto with nothing measured is the device default (MP4 everywhere but Apple)', () => {
    expect(chooseLiveRoad({ pref: 'hls', userAgent: chromeUA })).toBe('hls');
    expect(chooseLiveRoad({ pref: 'mp4', userAgent: iosUA })).toBe('mp4');
    expect(chooseLiveRoad({ pref: 'auto', userAgent: chromeUA })).toBe('mp4');
    expect(chooseLiveRoad({ pref: 'auto', userAgent: iosUA, canPlayType: () => 'maybe' })).toBe('hls');
  });
  it('the record is written per road and Auto reads it: a road that keeps failing loses to one that opened', () => {
    const st = mem();
    recordRoadResult('mp4', { ok: false }, st);
    recordRoadResult('mp4', { ok: false }, st);
    recordRoadResult('mp4', { ok: false }, st);
    recordRoadResult('hls', { ok: true, firstFrameMs: 1800, stalls: 1 }, st);
    const stats = loadRoadStats(st);
    expect(stats.mp4.tries).toBe(3); expect(stats.mp4.failed).toBe(3);
    expect(stats.hls.ok).toBe(1); expect(stats.hls.firstFrameMs).toEqual([1800]);
    expect(roadScore(stats.mp4)).toBeLessThan(roadScore(stats.hls));
    expect(chooseLiveRoad({ pref: 'auto', stats, userAgent: chromeUA })).toBe('hls');
    expect(roadLine(stats, 'hls')).toBe('HLS · 1 of 1 opened · first picture 1.8 s · 1 stall');
    expect(roadLine(stats, 'mp4')).toBe('MP4 · 0 of 3 opened');
    expect(roadLine({}, 'mp4')).toBe('MP4 · not tried here yet');
    expect(recordRoadResult('rtsp', { ok: true }, st)).toBeNull();
  });
  it('under Auto, the road that just failed is swapped for the other on the reconnect', () => {
    expect(chooseLiveRoad({ pref: 'auto', userAgent: chromeUA, avoid: 'mp4' })).toBe('hls');
    expect(chooseLiveRoad({ pref: 'auto', userAgent: chromeUA, avoid: 'hls' })).toBe('mp4');
    expect(chooseLiveRoad({ pref: 'mp4', userAgent: chromeUA, avoid: 'mp4' })).toBe('mp4'); // a pin is a pin
  });
  it('a good measured default keeps its place; the other road must be clearly better to win', () => {
    const st = mem();
    recordRoadResult('mp4', { ok: true, firstFrameMs: 900 }, st);
    recordRoadResult('hls', { ok: true, firstFrameMs: 1000 }, st);
    expect(chooseLiveRoad({ pref: 'auto', stats: loadRoadStats(st), userAgent: chromeUA })).toBe('mp4');
  });
});

// DR-0783: views, several, ordered, laid out; the wall becomes the first view.
describe('views: the cameras you want, in the order you want, as many views as you want', () => {
  const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
  it('with nothing saved, the old wall becomes "My view" so nobody loses what they had', () => {
    const st = mem();
    saveWall(['front_yard', 'garage'], st);
    const s = loadViews(st);
    expect(s.views).toHaveLength(1);
    expect(s.views[0].name).toBe('My view');
    expect(s.views[0].cameras).toEqual(['front_yard', 'garage']);
    expect(s.views[0].layout).toBe('auto');
    expect(s.active).toBe(s.views[0].id);
    expect(loadViews(mem()).views[0].cameras).toEqual([]);
  });
  it('add, move (live reorder), remove, layout, rename, new view, delete view; saved and read back; junk dropped', () => {
    const st = mem();
    let s = loadViews(st);
    const id = s.active;
    s = addToView(s, id, 'a'); s = addToView(s, id, 'b'); s = addToView(s, id, 'c'); s = addToView(s, id, 'b');
    expect(activeView(s).cameras).toEqual(['a', 'b', 'c']);
    s = moveInView(s, id, 'c', 0);
    expect(activeView(s).cameras).toEqual(['c', 'a', 'b']);
    s = moveInView(s, id, 'c', 99);
    expect(activeView(s).cameras).toEqual(['a', 'b', 'c']);
    s = moveInView(s, id, 'zzz', 0);
    expect(activeView(s).cameras).toEqual(['a', 'b', 'c']);
    s = removeFromView(s, id, 'b');
    expect(activeView(s).cameras).toEqual(['a', 'c']);
    s = setViewLayout(s, id, 3);
    expect(activeView(s).layout).toBe(3);
    s = setViewLayout(s, id, 'bogus');
    expect(activeView(s).layout).toBe('auto');
    s = renameView(s, id, '  Front of the house  ');
    expect(activeView(s).name).toBe('Front of the house');
    s = addView(s, 'Back');
    expect(s.views).toHaveLength(2);
    expect(activeView(s).name).toBe('Back');
    expect(activeView(s).cameras).toEqual([]);
    saveViews(s, st);
    const back = loadViews(st);
    expect(back.views.map((v) => v.name)).toEqual(['Front of the house', 'Back']);
    expect(back.active).toBe(s.active);
    s = deleteView(s, s.active);
    expect(s.views).toHaveLength(1);
    expect(activeView(s).name).toBe('Front of the house');
    s = deleteView(s, s.active);
    expect(s.views).toHaveLength(1);
    expect(activeView(s).name).toBe('My view');
    st.setItem(VIEWS_KEY, JSON.stringify({ views: [{ id: 'x', name: 'Odd', cameras: ['ok', '../bad', 7], layout: '2' }, 'junk'], active: 'nope' }));
    const odd = loadViews(st);
    expect(odd.views).toHaveLength(1);
    expect(odd.views[0].cameras).toEqual(['ok']);
    expect(odd.views[0].layout).toBe(2);
    expect(odd.active).toBe('x');
  });
  it('auto layout fits the count; a chosen layout is itself; the pointer finds the tile it is over', () => {
    expect(viewCols('auto', 1)).toBe(1);
    expect(viewCols('auto', 4)).toBe(2);
    expect(viewCols('auto', 6)).toBe(3);
    expect(viewCols('auto', 12)).toBe(4);
    expect(viewCols(1, 9)).toBe(1);
    expect(viewCols(4, 2)).toBe(4);
    expect(viewGridClass(3)).toMatch(/xl:grid-cols-3/);
    expect(VIEW_LAYOUTS).toEqual(['auto', 1, 2, 3, 4]);
    const boxes = [{ id: 'a', left: 0, top: 0, right: 100, bottom: 100 }, { id: 'b', left: 110, top: 0, right: 210, bottom: 100 }];
    expect(indexAtPoint(boxes, 50, 50)).toBe(0);
    expect(indexAtPoint(boxes, 150, 20)).toBe(1);
    expect(indexAtPoint(boxes, 500, 500)).toBe(-1);
  });
});


describe('the full-size window (DR-0788): the grid that gives every tile the most area, and a size kept with the view', () => {
  const memoryStorage = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
  it('fits by area on real screens', () => {
    expect(fitGrid({ count: 6, width: 1920, height: 1080 })).toEqual({ cols: 3, rows: 2, tileW: 640, tileH: 360 });
    expect(fitGrid({ count: 4, width: 1920, height: 1080 })).toEqual({ cols: 2, rows: 2, tileW: 960, tileH: 540 });
    expect(fitGrid({ count: 1, width: 1920, height: 1080 })).toEqual({ cols: 1, rows: 1, tileW: 1920, tileH: 1080 });
    expect(fitGrid({ count: 2, width: 1920, height: 1080 })).toEqual({ cols: 2, rows: 1, tileW: 960, tileH: 540 });
    // A Firestick's 960×540 Silk viewport with five cameras: three across, two down.
    expect(fitGrid({ count: 5, width: 960, height: 540 })).toEqual({ cols: 3, rows: 2, tileW: 320, tileH: 180 });
    // A phone held upright with seven: two across wins over one tall column.
    expect(fitGrid({ count: 7, width: 1080, height: 1920 })).toMatchObject({ cols: 2, rows: 4 });
    // The gap is taken out of the room.
    expect(fitGrid({ count: 2, width: 1000, height: 1000, gap: 10 })).toEqual({ cols: 1, rows: 2, tileW: 880, tileH: 495 });
    expect(fitGrid({ count: 0, width: 0, height: 0 })).toEqual({ cols: 1, rows: 1, tileW: 0, tileH: 0 });
  });

  it('the size is clamped to a sane range and kept with the view', () => {
    expect(clampScale(undefined)).toBe(1);
    expect(clampScale(2)).toBe(VIEW_SCALE_MAX);
    expect(clampScale(0.1)).toBe(VIEW_SCALE_MIN);
    expect(clampScale(0.949)).toBe(0.95);
    expect(VIEW_SCALE_STEP).toBe(0.05);
    const st = addView(loadViews(memoryStorage()));
    const id = st.active;
    const next = setViewScale(st, id, 0.9);
    expect(activeView(next).scale).toBe(0.9);
    // A kept state with no scale (every view saved before this) reads as the fit.
    const mem = memoryStorage();
    mem.setItem(VIEWS_KEY, JSON.stringify({ ...next, views: next.views.map((v) => { const { scale, ...rest } = v; return rest; }) }));
    expect(activeView(loadViews(mem)).scale).toBe(1);
  });
});

describe('one camera largest on a click, back on the second (DR-0796)', () => {
  const cams = [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }, { id: 'c', name: 'C' }];
  it('toggleFocus: a click focuses, the same click again clears, a different camera moves the focus', () => {
    expect(toggleFocus('', 'a')).toBe('a');
    expect(toggleFocus('a', 'a')).toBe('');
    expect(toggleFocus('a', 'b')).toBe('b');
    expect(toggleFocus('', null)).toBe('');
  });
  it('focusIn: a focus that names no camera in the view is nothing (a removed camera never leaves the view stuck on one tile)', () => {
    expect(focusIn(cams, 'b')).toBe('b');
    expect(focusIn(cams, 'zzz')).toBe('');
    expect(focusIn(cams, '')).toBe('');
    expect(focusIn([], 'a')).toBe('');
    expect(focusIn(null, 'a')).toBe('');
  });
  it('shownCount: one tile is laid out when a camera is focused, else all of them; fitGrid for one tile is one column', () => {
    expect(shownCount(cams, '')).toBe(3);
    expect(shownCount(cams, 'c')).toBe(1);
    expect(shownCount(cams, 'nope')).toBe(3);
    const one = fitGrid({ count: shownCount(cams, 'c'), width: 1920, height: 1000, gap: 6 });
    const three = fitGrid({ count: shownCount(cams, ''), width: 1920, height: 1000, gap: 6 });
    expect(one.cols).toBe(1);
    expect(one.tileW * one.tileH).toBeGreaterThan(three.tileW * three.tileH);
  });
});

describe('clip downloads by size (DR-0797)', () => {
  const json = (status, body, headers = {}) => ({ ok: status >= 200 && status < 300, status, json: async () => body, headers: { get: (k) => headers[k.toLowerCase()] || null } });
  it('the tiers: original, large 1080p, medium 720p, small 480p; the URLs carry the ticket, the size, dl=1 and retry=1 only when asked', () => {
    expect(CLIP_SIZE_TIERS.map((t) => t.key)).toEqual(['original', 'uhd', 'xlarge', 'large', 'medium', 'small']);
    expect(CLIP_SIZE_TIERS.map((t) => t.height)).toEqual([null, 2160, 1440, 1080, 720, 480]);
    expect(recClipSizesUrl('front_yard', '2026-10-07T06-40-00.mp4', 'T')).toBe('/cams/rec/front_yard/2026-10-07T06-40-00.mp4?t=T&sizes=1');
    expect(recClipDownloadUrl('front_yard', '2026-10-07T06-40-00.mp4', 'T', 'small')).toBe('/cams/rec/front_yard/2026-10-07T06-40-00.mp4?t=T&size=small&dl=1');
    expect(recClipDownloadUrl('front_yard', '2026-10-07T06-40-00.mp4', 'T', 'original')).toBe('/cams/rec/front_yard/2026-10-07T06-40-00.mp4?t=T&dl=1');
    expect(recClipDownloadUrl('front_yard', '2026-10-07T06-40-00.mp4', 'T', 'medium', { retry: true })).toBe('/cams/rec/front_yard/2026-10-07T06-40-00.mp4?t=T&size=medium&dl=1&retry=1');
    expect(clipDownloadName('front_yard', '2026-10-07T06-40-00.mp4', 'small')).toBe('front_yard-2026-10-07T06-40-00-small.mp4');
    expect(clipDownloadName('front_yard', '2026-10-07T06-40-00.mp4', 'original')).toBe('front_yard-2026-10-07T06-40-00-original.mp4');
  });
  it('a tier line says the measured size when made, the estimate before, and the place in line or the failure', () => {
    const sizes = { original: 60 * 1024 * 1024, tiers: { small: { estimate: 45000000, state: 'absent' }, medium: { estimate: 60 * 1024 * 1024, state: 'queued', position: 2 }, large: { estimate: 1, state: 'ready', bytes: 50 * 1024 * 1024 } } };
    const tier = (k) => CLIP_SIZE_TIERS.find((t) => t.key === k);
    expect(clipTierLine(tier('original'), sizes)).toBe('Original · 60.0 MB');
    expect(clipTierLine(tier('small'), sizes)).toMatch(/^Small \(480p\) · about 42\.9 MB$/);
    expect(clipTierLine(tier('medium'), sizes)).toMatch(/in line \(2\)$/);
    expect(clipTierLine(tier('large'), sizes)).toBe('Large (1080p) · 50.0 MB · ready');
    expect(clipTierLine(tier('small'), { tiers: { small: { state: 'failed', error: 'ffmpeg: Invalid data' } } })).toBe('Small (480p) · could not be made: ffmpeg: Invalid data');
    expect(clipTierLine(tier('small'), null)).toBe('Small (480p)');
    expect(clipTierLine(tier('original'), null)).toBe('Original · as recorded');
  });
  it('fetchClipSizes reads the NAS\'s answer; a miss is ok:false', async () => {
    const f = vi.fn(async () => json(200, { original: 10240, seconds: 600, tiers: { small: { estimate: 10240, state: 'absent' } }, download_name: 'front_yard-2026-10-07T06-40-00-original.mp4' }));
    const r = await fetchClipSizes('front_yard', '2026-10-07T06-40-00.mp4', 'T', f);
    expect(r).toMatchObject({ ok: true, original: 10240, seconds: 600, downloadName: 'front_yard-2026-10-07T06-40-00-original.mp4' });
    expect(r.tiers.small.state).toBe('absent');
    expect(f.mock.calls[0][0]).toBe('/cams/rec/front_yard/2026-10-07T06-40-00.mp4?t=T&sizes=1');
    expect((await fetchClipSizes('front_yard', 'x.mp4', 'T', vi.fn(async () => json(404, { error: 'not-found' })))).ok).toBe(false);
  });
  it('waitForClipSize asks once, waits while the NAS makes the file (202, its place reported), and resolves with the URL when it is 200; retry rides only the first ask', async () => {
    const answers = [json(202, { status: 'queued', position: 1, retry_in: 3 }), json(202, { status: 'making', position: 0, retry_in: 3 }), json(206, null)];
    const f = vi.fn(async () => answers.shift());
    const seen = [];
    const slept = [];
    const r = await waitForClipSize('front_yard', '2026-10-07T06-40-00.mp4', 'T', 'small', { fetchImpl: f, retry: true, onProgress: (p) => seen.push(p), pollMs: 50, sleep: async (ms) => { slept.push(ms); } });
    expect(r).toEqual({ ok: true, url: '/cams/rec/front_yard/2026-10-07T06-40-00.mp4?t=T&size=small&dl=1' });
    expect(f.mock.calls.map((c) => c[0])).toEqual([
      '/cams/rec/front_yard/2026-10-07T06-40-00.mp4?t=T&size=small&dl=1&retry=1',
      '/cams/rec/front_yard/2026-10-07T06-40-00.mp4?t=T&size=small&dl=1',
      '/cams/rec/front_yard/2026-10-07T06-40-00.mp4?t=T&size=small&dl=1',
    ]);
    expect(f.mock.calls[0][1].headers.Range).toBe('bytes=0-0');
    expect(seen).toEqual([{ state: 'queued', position: 1 }, { state: 'making', position: 0 }]);
    expect(slept).toEqual([50, 50]);
  });
  it('waitForClipSize names a failure in the NAS\'s words, a run-out ticket, a gone clip, and gives up after the wait', async () => {
    const fail = await waitForClipSize('c', '2026-10-07T06-40-00.mp4', 'T', 'small', { fetchImpl: vi.fn(async () => json(500, { error: 'transcode-failed', detail: 'ffmpeg: Invalid data' })) });
    expect(fail).toMatchObject({ ok: false, failed: true });
    expect(fail.message).toMatch(/could not make that size: ffmpeg: Invalid data/);
    expect((await waitForClipSize('c', '2026-10-07T06-40-00.mp4', 'T', 'small', { fetchImpl: vi.fn(async () => json(401, {})) })).message).toMatch(/ticket ran out/);
    expect((await waitForClipSize('c', '2026-10-07T06-40-00.mp4', 'T', 'small', { fetchImpl: vi.fn(async () => json(404, {})) })).message).toMatch(/no longer on the NAS/);
    const forever = vi.fn(async () => json(202, { status: 'making', retry_in: 3 }));
    const r = await waitForClipSize('c', '2026-10-07T06-40-00.mp4', 'T', 'small', { fetchImpl: forever, maxWaitMs: -1, sleep: async () => {} });
    expect(r.ok).toBe(false);
    expect(r.message).toMatch(/still making/);
  });
});

describe('the stream health log (DR-0798)', () => {
  it('the road and the reader: /cams/streams/health with the bearer; a dark road is ok:false with nothing invented', async () => {
    expect(streamHealthUrl()).toBe('/cams/streams/health');
    const f = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ sampled_at: 1700000000, interval_s: 15, cameras: { front_yard: { kbps: 1200 } }, events: [{ at: 1, camera: 'front_yard', kind: 'bytes-frozen' }] }) }));
    const r = await fetchStreamHealth('tok', f);
    expect(r.ok).toBe(true); expect(r.cameras.front_yard.kbps).toBe(1200); expect(r.events).toHaveLength(1); expect(r.intervalS).toBe(15);
    expect(f.mock.calls[0][1].headers.Authorization).toBe('Bearer tok');
    const dark = await fetchStreamHealth('tok', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
    expect(dark).toMatchObject({ ok: false, cameras: {}, events: [] });
  });
  it('H.265 is asked of the <video>, never guessed: a camera with a twin plays the twin only where the device cannot decode H.265', () => {
    expect(deviceCanPlayHevc(() => '')).toBe(false);
    expect(deviceCanPlayHevc((t) => (/hvc1/.test(t) ? 'probably' : ''))).toBe(true);
    expect(deviceCanPlayHevc(null)).toBe(true);
    expect(twinOf('front_yard')).toBe('front_yard_h264');
    expect(liveStreamId({ id: 'front_yard', h264: true }, () => '')).toBe('front_yard_h264');
    expect(liveStreamId({ id: 'front_yard', h264: true }, () => 'probably')).toBe('front_yard');
    expect(liveStreamId({ id: 'front_yard', h264: false }, () => '')).toBe('front_yard');
    expect(liveStreamId({ id: 'front_yard' }, null)).toBe('front_yard');
    expect(liveStreamId(null, null)).toBe('');
  });
  it('the tile line says the rate, the codecs, up% and the drops; nothing measured is an empty line', () => {
    expect(streamHealthLine({ kbps: 1200, codecs: ['H264', 'PCMU'], up_pct: 97, drops_1h: 2, hevc_only: false })).toBe('1.2 Mb/s · H264+PCMU · up 97% · 2 drops this hour');
    expect(streamHealthLine({ kbps: 640, codecs: ['H265'], up_pct: 100, drops_1h: 0, hevc_only: true, twin: 'cam_h264' })).toBe('640 kb/s · H265 · H264 twin · up 100% · no drops this hour');
    expect(streamHealthLine({ kbps: null, codecs: ['H265'], up_pct: null, drops_1h: 0, hevc_only: true, twin: null })).toBe('H265 · H265 only · no drops this hour');
    expect(streamHealthLine({ kbps: null, codecs: [], up_pct: null })).toBe('');
    expect(streamHealthLine(null)).toBe('');
  });
  it('drops are said in words, newest first, for one camera only', () => {
    expect(dropKindText('producer-gone')).toMatch(/connection to the NAS dropped/);
    expect(dropKindText('bytes-frozen')).toMatch(/sent nothing/);
    expect(dropKindText('producer-restarted')).toMatch(/reconnected/);
    const events = [{ at: 1700000000, camera: 'a', kind: 'bytes-frozen' }, { at: 1700000015, camera: 'b', kind: 'producer-gone' }, { at: 1700000030, camera: 'a', kind: 'producer-restarted' }];
    const lines = dropLines(events, 'a');
    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatch(/reconnected/);
    expect(lines[1]).toMatch(/sent nothing/);
    expect(dropLines(events, 'zzz')).toEqual([]);
    expect(dropLines(null, 'a')).toEqual([]);
  });
});

describe('a live tile stays live (DR-0799)', () => {
  const ranges = (...pairs) => ({ length: pairs.length, start: (i) => pairs[i][0], end: (i) => pairs[i][1] });
  it('a grid tile wants the SD twin when the NAS keeps one; the camera made largest, or alone, wants HD', () => {
    expect(sdOf('front_yard')).toBe('front_yard_sd');
    expect(wantsSd({ shown: 4, picked: false })).toBe(true);
    expect(wantsSd({ shown: 4, picked: true })).toBe(false);
    expect(wantsSd({ shown: 1 })).toBe(false);
    expect(liveStreamId({ id: 'c', sd: true }, () => 'probably', { sd: true })).toBe('c_sd');
    expect(liveStreamId({ id: 'c', sd: false }, () => 'probably', { sd: true })).toBe('c');
    expect(liveStreamId({ id: 'c', sd: true, h264: true }, () => '', { sd: false })).toBe('c_h264');
    expect(liveStreamId({ id: 'c', sd: true, h264: true }, () => '', { sd: true })).toBe('c_sd');
  });
  it('the live edge is the end of what arrived (mp4) or what is seekable (HLS)', () => {
    expect(liveEdge({ buffered: ranges([0, 12.5]), seekable: ranges([0, 20]) }, 'mp4')).toBe(12.5);
    expect(liveEdge({ buffered: ranges([0, 12.5]), seekable: ranges([0, 20]) }, 'hls')).toBe(20);
    expect(liveEdge({ buffered: ranges(), seekable: ranges([0, 20]) }, 'mp4')).toBe(20);
    expect(liveEdge({ buffered: ranges(), seekable: ranges() }, 'mp4')).toBeNull();
    expect(liveEdge(null)).toBeNull();
  });
  it('the decision: far behind jumps to the edge, a little behind runs faster, caught up runs at 1x again', () => {
    expect(liveEdgeDecision({ currentTime: 10, edge: 10 + LIVE_LAG_SEEK_S + 1 })).toEqual({ action: 'seek', to: 10 + LIVE_LAG_SEEK_S + 1 - LIVE_EDGE_MARGIN_S, lag: LIVE_LAG_SEEK_S + 1 });
    expect(liveEdgeDecision({ currentTime: 10, edge: 10 + LIVE_LAG_RATE_S + 0.5 })).toEqual({ action: 'rate', rate: LIVE_CATCHUP_RATE, lag: LIVE_LAG_RATE_S + 0.5 });
    expect(liveEdgeDecision({ currentTime: 10, edge: 10.4, playbackRate: LIVE_CATCHUP_RATE })).toEqual({ action: 'rate', rate: 1, lag: expect.closeTo(0.4, 5) });
    expect(liveEdgeDecision({ currentTime: 10, edge: 10.4, playbackRate: 1 })).toEqual({ action: 'none', lag: expect.closeTo(0.4, 5) });
    expect(liveEdgeDecision({ currentTime: 10, edge: null })).toEqual({ action: 'none', lag: null });
    expect(liveEdgeDecision({ currentTime: 12, edge: 10 }).lag).toBe(0);
  });
  it('the freeze watch counts the seconds a position has not moved; moving, pausing or ending resets it', () => {
    let m = freezeStep(null, { currentTime: 1 }, 0);
    expect(m.frozenFor).toBe(0);
    m = freezeStep(m, { currentTime: 1 }, 2000);
    expect(m.frozenFor).toBe(2);
    m = freezeStep(m, { currentTime: 1 }, 6500);
    expect(m.frozenFor).toBe(6.5);
    m = freezeStep(m, { currentTime: 1.5 }, 8000);
    expect(m.frozenFor).toBe(0);
    m = freezeStep(m, { currentTime: 1.5, paused: true }, 20000);
    expect(m.frozenFor).toBe(0);
    m = freezeStep(freezeStep(null, { currentTime: 3 }, 0), { currentTime: 3, ended: true }, 9000);
    expect(m.frozenFor).toBe(0);
  });
  it('tendLiveVideo writes the element only as the decision says, and names a freeze at 6 s', () => {
    const el = { currentTime: 10, paused: false, ended: false, readyState: 4, playbackRate: 1, buffered: ranges([0, 15]), seekable: ranges() };
    let r = tendLiveVideo(el, null, { mode: 'mp4', nowMs: 0 });
    expect(r.action).toBe('seek'); expect(el.currentTime).toBe(14.5); expect(r.frozen).toBe(false);
    el.buffered = ranges([0, 16]);
    r = tendLiveVideo(el, r.memo, { mode: 'mp4', nowMs: 2000 });
    expect(r.action).toBe('rate'); expect(el.playbackRate).toBe(LIVE_CATCHUP_RATE);
    el.currentTime = 15.8;
    r = tendLiveVideo(el, r.memo, { mode: 'mp4', nowMs: 4000 });
    expect(r.action).toBe('rate'); expect(el.playbackRate).toBe(1);
    // the picture stops: the same currentTime for FREEZE_SECONDS
    el.playbackRate = 1;
    r = tendLiveVideo(el, r.memo, { mode: 'mp4', nowMs: 6000 });
    r = tendLiveVideo(el, r.memo, { mode: 'mp4', nowMs: 6000 + FREEZE_SECONDS * 1000 });
    expect(r.frozen).toBe(true);
    // a paused element is never frozen and never written
    const paused = { currentTime: 1, paused: true, ended: false, readyState: 4, playbackRate: 1, buffered: ranges([0, 50]), seekable: ranges() };
    r = tendLiveVideo(paused, null, { nowMs: 0 });
    r = tendLiveVideo(paused, r.memo, { nowMs: 20000 });
    expect(r.frozen).toBe(false); expect(paused.currentTime).toBe(1); expect(r.action).toBe('none');
    expect(tendLiveVideo(null, null)).toMatchObject({ frozen: false, action: 'none' });
  });
});

describe('a recording is watched, not downloaded (DR-0804)', () => {
  const json = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body, headers: { get: () => null } });
  it('the play URL carries the size and no download header; waitForClipSize can ask without dl', async () => {
    expect(recClipPlayUrl('c', '2026-10-07T06-40-00.mp4', 'T', 'small')).toBe('/cams/rec/c/2026-10-07T06-40-00.mp4?t=T&size=small');
    expect(recClipPlayUrl('c', '2026-10-07T06-40-00.mp4', 'T', 'original')).toBe('/cams/rec/c/2026-10-07T06-40-00.mp4?t=T');
    const f = vi.fn(async () => ({ ok: true, status: 206, json: async () => ({}), headers: { get: () => null } }));
    const r = await waitForClipSize('c', '2026-10-07T06-40-00.mp4', 'T', 'medium', { fetchImpl: f, dl: false });
    expect(r).toEqual({ ok: true, url: '/cams/rec/c/2026-10-07T06-40-00.mp4?t=T&size=medium' });
    expect(f.mock.calls[0][0]).toBe('/cams/rec/c/2026-10-07T06-40-00.mp4?t=T&size=medium');
  });
  it('a timed-out fetch is said in words with the seconds, never "signal is aborted without reason"', () => {
    const abort = Object.assign(new Error('signal is aborted without reason'), { name: 'AbortError' });
    expect(humanizeFetchError(abort, 15000)).toBe('the NAS did not answer in 15 s (the link is busy or the camera service is down)');
    expect(humanizeFetchError(new TypeError('Failed to fetch'))).toBe('the camera road did not answer');
    expect(humanizeFetchError(new Error('ticket HTTP 500'))).toBe('ticket HTTP 500');
  });
  it('clipTicket waits longer than a frame fetch, tries once more after a timeout, and names a refusal plainly', async () => {
    expect(CLIP_TICKET_TIMEOUT_MS).toBeGreaterThan(FETCH_TIMEOUT_MS);
    let n = 0;
    const flaky = vi.fn(async () => { n += 1; if (n === 1) throw Object.assign(new Error('signal is aborted without reason'), { name: 'AbortError' }); return json(200, { ticket: 'tk', expires_in: 3600 }); });
    const r = await clipTicket('front_yard', 'tok', { fetchImpl: flaky });
    expect(r).toEqual({ ok: true, ticket: 'tk' });
    expect(flaky).toHaveBeenCalledTimes(2);
    expect(JSON.parse(flaky.mock.calls[0][1].body)).toEqual({ camera: 'front_yard', ttl: 3600 });
    const dead = await clipTicket('front_yard', 'tok', { fetchImpl: vi.fn(async () => { throw Object.assign(new Error('signal is aborted without reason'), { name: 'AbortError' }); }), timeoutMs: 15000 });
    expect(dead.ok).toBe(false);
    expect(dead.message).toBe('Could not get a playback ticket: the NAS did not answer in 15 s (the link is busy or the camera service is down).');
    expect((await clipTicket('c', 'tok', { fetchImpl: vi.fn(async () => json(401, {})) })).message).toMatch(/family key.*refused/);
    expect((await clipTicket('c', 'tok', { fetchImpl: vi.fn(async () => json(503, {})) })).message).toMatch(/live slots/);
    const once = vi.fn(async () => json(500, {}));
    expect((await clipTicket('c', 'tok', { fetchImpl: once })).message).toBe('The camera road answered HTTP 500.');
    expect(once).toHaveBeenCalledTimes(1);
  });
});

describe('any camera from the app, tested on the spot (DR-0805)', () => {
  const json = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body, headers: { get: () => null } });
  it('the kinds and their boxes; a name becomes the NAS\'s stream id', () => {
    expect(ADD_KINDS.map((k) => k.id)).toEqual(['rtsp', 'onvif', 'http', 'url']);
    expect(ADD_KINDS[0].fields).toEqual(['name', 'host', 'port', 'user', 'password', 'path']);
    expect(streamIdFrom('Garage Door (east)')).toBe('garage_door_east');
    expect(streamIdFrom('  Front  ')).toBe('front');
    expect(streamIdFrom('!!!')).toBe('');
    expect(GOOGLE_SIGN_IN_NOTE).toMatch(/Google or Apple.*own email and password.*Set a password/);
  });
  it('the source line is built from the boxes; the password is hidden in the preview; a forbidden source is named', () => {
    expect(buildSourceUrl('rtsp', { host: '192.168.1.60', user: 'admin', password: 'p@ss w', path: 'live' })).toBe('rtsp://admin:p%40ss%20w@192.168.1.60/live');
    expect(buildSourceUrl('rtsp', { host: '192.168.1.60', port: '7447', scheme: 'rtsps', path: '/abc' })).toBe('rtsps://192.168.1.60:7447/abc');
    expect(buildSourceUrl('rtsp', { host: '' })).toBe('');
    expect(buildSourceUrl('onvif', { host: '192.168.1.5', port: '2020', user: 'u', password: 'p' })).toBe('onvif://u:p@192.168.1.5:2020');
    expect(buildSourceUrl('http', { url: ' http://u:p@192.168.1.9/snap.jpg ' })).toBe('http://u:p@192.168.1.9/snap.jpg');
    expect(buildSourceUrl('url', { url: 'tapo://admin:pw@192.168.1.7' })).toBe('tapo://admin:pw@192.168.1.7');
    expect(maskSource('rtsp://admin:secret@192.168.1.60/live')).toBe('rtsp://admin:***@192.168.1.60/live');
    expect(maskSource('wyze://192.168.1.50?uid=ABC&enr=SECRET&dtls=true')).toBe('wyze://192.168.1.50?uid=ABC&enr=***&dtls=true');
    expect(sourceProblem('rtsp://x')).toBe('');
    expect(sourceProblem('exec:rm -rf /')).toMatch(/not allowed/);
    expect(sourceProblem('ffmpeg:cam#raw=-i x')).toMatch(/not allowed/);
    expect(sourceProblem('file:///etc/passwd')).toBe('the NAS does not speak file://');
    expect(sourceProblem('')).toBe('empty');
  });
  it('the probe in words', () => {
    expect(probeLine({ ok: true, bytes: 48 * 1024, ms: 1234 })).toBe(`works: a ${formatBytes(48 * 1024)} picture in 1.2 s`);
    expect(probeLine({ ok: false, status: 500, error: 'streams: wyze: connect failed: discovery timeout' })).toBe('no picture: streams: wyze: connect failed: discovery timeout');
    expect(probeLine({ ok: false, timeout: true, error: 'no frame in 15 s' })).toBe('no picture: no frame in 15 s');
    expect(probeLine(null)).toBe('not tested yet');
  });
  it('addStream posts name and source with the bearer and reads the probe; refusals are said plainly', async () => {
    expect(streamsUrl()).toBe('/cams/streams'); expect(streamTestUrl('a b')).toBe('/cams/streams/a%20b/test'); expect(streamRemoveUrl('x')).toBe('/cams/streams/x'); expect(ringSetupUrl()).toBe('/cams/setup/ring');
    const f = vi.fn(async () => json(200, { ok: true, id: 'garage', kind: 'rtsp', registered: true, persisted: true, detail: '', probe: { ok: true, status: 200, ms: 900, bytes: 40000 } }));
    const r = await addStream({ name: 'garage', url: 'rtsp://admin:pw@192.168.1.60/live' }, 'tok', f);
    expect(r).toMatchObject({ ok: true, id: 'garage', kind: 'rtsp', registered: true, persisted: true });
    expect(r.probe.ok).toBe(true);
    expect(f.mock.calls[0][0]).toBe('/cams/streams');
    expect(f.mock.calls[0][1].headers.Authorization).toBe('Bearer tok');
    expect(JSON.parse(f.mock.calls[0][1].body)).toEqual({ name: 'garage', url: 'rtsp://admin:pw@192.168.1.60/live', replace: false });
    expect((await addStream({ name: 'g', url: 'exec:x' }, 'tok', vi.fn(async () => json(400, { error: 'scheme-not-allowed' })))).message).toMatch(/not allowed/);
    const taken = await addStream({ name: 'front_yard', url: 'rtsp://x' }, 'tok', vi.fn(async () => json(409, { error: 'name-taken', id: 'front_yard' })));
    expect(taken.taken).toBe(true); expect(taken.message).toMatch(/already there/);
    expect((await addStream({ name: 'g', url: 'rtsp://x' }, 'tok', vi.fn(async () => json(404, {})))).message).toMatch(/older camera service/);
    expect((await testStream('garage', 'tok', vi.fn(async () => json(200, { id: 'garage', probe: { ok: false, status: 500, error: 'x' } })))).probe.ok).toBe(false);
    const del = vi.fn(async () => json(200, { ok: true, removed: ['garage', 'garage_sd'] }));
    expect((await removeStream('garage', 'tok', del)).removed).toEqual(['garage', 'garage_sd']);
    expect(del.mock.calls[0][1].method).toBe('DELETE');
  });
  it('Ring: the first try asks for the code, the code adds the cameras, a refusal carries the Google note', async () => {
    const f = vi.fn(async (url, opts) => { const b = JSON.parse(opts.body); return b.code ? json(200, { ok: true, added: 2, cameras: [{ id: 'front_door', name: 'Front Door' }, { id: 'driveway', name: 'Driveway' }] }) : json(409, { error: 'needs-2fa', prompt: 'Please enter the code sent to +1 (***) ***-1234' }); });
    const first = await setupRing({ email: 'me@example.com', password: 'pw' }, 'tok', f);
    expect(first).toEqual({ kind: 'needs-code', prompt: 'Please enter the code sent to +1 (***) ***-1234' });
    expect(JSON.parse(f.mock.calls[0][1].body)).toEqual({ email: 'me@example.com', password: 'pw', code: '' });
    const second = await setupRing({ email: 'me@example.com', password: 'pw', code: '123456' }, 'tok', f);
    expect(second.kind).toBe('ok'); expect(second.added).toBe(2); expect(second.cameras.map((c) => c.name)).toEqual(['Front Door', 'Driveway']);
    const refused = await setupRing({ email: 'me@example.com', password: 'bad', code: '1' }, 'tok', vi.fn(async () => json(401, { error: 'ring-sign-in-refused', detail: 'authentication failed' })));
    expect(refused.kind).toBe('refused'); expect(refused.message).toMatch(/Ring refused the sign-in: authentication failed/); expect(refused.message).toContain(GOOGLE_SIGN_IN_NOTE);
    expect((await setupRing({ email: 'a@b.c', password: 'p' }, 'tok', vi.fn(async () => json(404, {})))).message).toMatch(/older camera service/);
  });
});
