// THE DIRECT ROAD (DR-1097, sixteenth read) — proven-to-catch. The phone
// speaks Wyze's Kinesis signaling itself, the way go2rtc's kinesisClient does,
// and anything that does not carry a picture leaves the tile on the NAS road.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  directUrl, encodePayload, decodePayload, offerMessage, candidateMessage, readSignal,
  askDirect, connectDirect, tryDirectRoad, directWanted, noteDirectFailure, resetDirectState, directActive,
  DIRECT_MAX_SESSIONS, DIRECT_BACKOFF_MS,
} from '../lib/camera-direct.js';
import { CAMS_BASE } from '../lib/cameras.js';

const SESSION = { signaling_url: 'wss://v-1.kinesisvideo.us-east-1.amazonaws.com/?X-Amz-Signature=s', ice_servers: [{ urls: ['turn:1.2.3.4:443'], username: 'u', credential: 'c' }], client_id: 'viewer-7' };

class FakeWS {
  constructor(url) { this.url = url; this.sent = []; this.closed = false; FakeWS.last = this; }
  send(t) { this.sent.push(JSON.parse(t)); }
  close() { this.closed = true; }
  push(obj) { return this.onmessage({ data: JSON.stringify(obj) }); }
}
class FakePC {
  constructor(cfg) { this.cfg = cfg; this.tx = []; this.remote = null; this.cands = []; this.closed = false; this.bytes = 0; this.connectionState = 'new'; FakePC.last = this; }
  addTransceiver(kind, o) { this.tx.push([kind, o.direction]); }
  async createOffer() { return { type: 'offer', sdp: 'v=0 offer' }; }
  async setLocalDescription(d) { this.localDescription = d; }
  async setRemoteDescription(d) { this.remote = d; }
  async addIceCandidate(c) { this.cands.push(c); }
  async getStats() { return new Map([['v', { type: 'inbound-rtp', kind: 'video', bytesReceived: this.bytes }]]); }
  close() { this.closed = true; }
}
const flush = async () => { for (let i = 0; i < 8; i += 1) await Promise.resolve(); };
const fromKvs = (type, payload) => ({ messageType: type, messagePayload: encodePayload(payload) });

beforeEach(() => resetDirectState());
afterEach(() => { vi.useRealTimers(); resetDirectState(); });

describe('Kinesis signaling, spoken as go2rtc speaks it', () => {
  it('the NAS route is /direct on the cams road', () => {
    expect(directUrl()).toBe(`${CAMS_BASE}/direct`);
  });
  it('payloads are base64 JSON, any text round-trips', () => {
    const p = { sdp: 'v=0 é ✓' };
    expect(decodePayload(encodePayload(p))).toEqual(p);
    expect(decodePayload('not base64 json')).toBe(null);
  });
  it('an offer and a candidate name the recipient client', () => {
    const o = JSON.parse(offerMessage({ sdp: 'v=0 x' }, 'c1'));
    expect(o.action).toBe('SDP_OFFER');
    expect(o.recipientClientId).toBe('c1');
    expect(decodePayload(o.messagePayload)).toEqual({ type: 'offer', sdp: 'v=0 x' });
    const c = JSON.parse(candidateMessage({ toJSON: () => ({ candidate: 'candidate:1', sdpMid: '0', sdpMLineIndex: 0 }) }, 'c1'));
    expect(c.action).toBe('ICE_CANDIDATE');
    expect(decodePayload(c.messagePayload)).toEqual({ candidate: 'candidate:1', sdpMid: '0', sdpMLineIndex: 0 });
  });
  it('reads an answer, a candidate, a refusal, and ignores the rest', () => {
    expect(readSignal(JSON.stringify(fromKvs('SDP_ANSWER', { type: 'answer', sdp: 'v=0 a' })))).toEqual({ kind: 'answer', sdp: 'v=0 a' });
    expect(readSignal(JSON.stringify(fromKvs('ICE_CANDIDATE', { candidate: 'candidate:9', sdpMid: '1', sdpMLineIndex: 1 })))).toEqual({ kind: 'candidate', candidate: { candidate: 'candidate:9', sdpMid: '1', sdpMLineIndex: 1 } });
    const st = readSignal(JSON.stringify({ statusResponse: { statusCode: '403', description: 'expired' } }));
    expect(st).toEqual({ kind: 'status', ok: false, detail: 'expired' });
    expect(readSignal('')).toEqual({ kind: 'other' });
    expect(readSignal('{"messageType":"SDP_ANSWER","messagePayload":"!!"}')).toEqual({ kind: 'other' });
  });
});

describe('connectDirect', () => {
  it('PROVEN TO CATCH: offer first, candidates after it, Wyze\'s early candidates held until the answer, then the video track', async () => {
    const p = connectDirect(SESSION, { WS: FakeWS, PC: FakePC });
    const ws = FakeWS.last; const pc = FakePC.last;
    expect(ws.url).toBe(SESSION.signaling_url);
    expect(pc.cfg.iceServers).toEqual(SESSION.ice_servers);
    expect(pc.tx).toEqual([['video', 'recvonly'], ['audio', 'recvonly']]);
    pc.onicecandidate({ candidate: { candidate: 'candidate:early', sdpMid: '0', sdpMLineIndex: 0 } });
    expect(ws.sent).toEqual([]);
    await ws.onopen();
    expect(ws.sent.map((m) => m.action)).toEqual(['SDP_OFFER', 'ICE_CANDIDATE']);
    expect(ws.sent.every((m) => m.recipientClientId === 'viewer-7')).toBe(true);
    await ws.push(fromKvs('ICE_CANDIDATE', { candidate: 'candidate:cam1', sdpMid: '0', sdpMLineIndex: 0 }));
    expect(pc.cands).toEqual([]);
    await ws.push(fromKvs('SDP_ANSWER', { type: 'answer', sdp: 'v=0 answer' }));
    expect(pc.remote).toEqual({ type: 'answer', sdp: 'v=0 answer' });
    expect(pc.cands.map((c) => c.candidate)).toEqual(['candidate:cam1']);
    await ws.push(fromKvs('ICE_CANDIDATE', { candidate: 'candidate:cam2', sdpMid: '0', sdpMLineIndex: 0 }));
    expect(pc.cands.map((c) => c.candidate)).toEqual(['candidate:cam1', 'candidate:cam2']);
    const stream = { id: 's1' };
    pc.ontrack({ track: { kind: 'audio' }, streams: [stream] });
    pc.ontrack({ track: { kind: 'video' }, streams: [stream] });
    const got = await p;
    expect(got.stream).toBe(stream);
    expect(directActive()).toBe(1);
    got.close();
    expect(pc.closed && ws.closed).toBe(true);
    expect(directActive()).toBe(0);
  });
  it('PROVEN TO CATCH: never hangs — no track by the timeout rejects and closes everything', async () => {
    vi.useFakeTimers();
    const p = connectDirect(SESSION, { WS: FakeWS, PC: FakePC, timeoutMs: 15000 });
    const caught = p.catch((e) => e);
    vi.advanceTimersByTime(15000);
    const e = await caught;
    expect(String(e.message)).toMatch(/no picture from Wyze's WebRTC in 15 s/);
    expect(FakePC.last.closed && FakeWS.last.closed).toBe(true);
    expect(directActive()).toBe(0);
  });
  it('a refusal from Kinesis, or a socket that closes before an answer, rejects with the reason', async () => {
    let p = connectDirect(SESSION, { WS: FakeWS, PC: FakePC });
    await FakeWS.last.push({ statusResponse: { statusCode: 403, description: 'The security token included in the request is expired' } });
    await expect(p).rejects.toThrow(/refused: The security token/);
    p = connectDirect(SESSION, { WS: FakeWS, PC: FakePC });
    FakeWS.last.onclose();
    await expect(p).rejects.toThrow(/closed before it answered/);
    await expect(connectDirect({ signaling_url: 'https://x' }, { WS: FakeWS, PC: FakePC })).rejects.toThrow(/no signaling address/);
    expect(directActive()).toBe(0);
  });
  it('PROVEN TO CATCH: a picture that stops moving ends the session once, with the reason', async () => {
    vi.useFakeTimers();
    let now = 0;
    const onEnd = vi.fn();
    const p = connectDirect(SESSION, { WS: FakeWS, PC: FakePC, stallMs: 8000, statsMs: 2000, onEnd, clock: () => now });
    const pc = FakePC.last;
    pc.ontrack({ track: { kind: 'video' }, streams: [{ id: 's' }] });
    await p;
    for (let i = 0; i < 3; i += 1) { pc.bytes += 5000; now += 2000; vi.advanceTimersByTime(2000); await flush(); }
    expect(onEnd).not.toHaveBeenCalled();
    for (let i = 0; i < 5; i += 1) { now += 2000; vi.advanceTimersByTime(2000); await flush(); }
    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(onEnd.mock.calls[0][0]).toMatch(/froze for 8 s/);
    expect(pc.closed).toBe(true);
  });
  it('a failed connection after the picture arrived ends it', async () => {
    const onEnd = vi.fn();
    const p = connectDirect(SESSION, { WS: FakeWS, PC: FakePC, onEnd });
    const pc = FakePC.last;
    pc.ontrack({ track: { kind: 'video' }, streams: [{ id: 's' }] });
    const got = await p;
    pc.connectionState = 'failed';
    pc.onconnectionstatechange();
    expect(onEnd).toHaveBeenCalledWith('the WebRTC connection failed');
    got.close();
    expect(directActive()).toBe(0);
  });
});

describe('askDirect + tryDirectRoad', () => {
  const resp = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
  it('asks the NAS with the viewer\'s credential and takes only a wss session', async () => {
    const fetchImpl = vi.fn(async () => resp(200, { ...SESSION, camera: 'porch' }));
    const a = await askDirect('porch', 'tok', { fetchImpl });
    expect(a).toEqual({ ok: true, session: SESSION });
    const [url, opts] = fetchImpl.mock.calls[0];
    expect(url).toBe(directUrl());
    expect(opts.method).toBe('POST');
    expect(opts.headers.Authorization).toBe('Bearer tok');
    expect(JSON.parse(opts.body)).toEqual({ camera: 'porch' });
    expect((await askDirect('porch', 'tok', { fetchImpl: async () => resp(200, { signaling_url: 'http://x' }) })).ok).toBe(false);
    expect(await askDirect('porch', 'tok', { fetchImpl: async () => resp(503, { error: 'wyze-offline' }) })).toEqual({ ok: false, status: 503, error: 'wyze-offline' });
    expect((await askDirect('porch', 'tok', { fetchImpl: async () => { throw new Error('offline'); } })).status).toBe(0);
  });
  const kvs = { id: 'porch', road: 'kvs' };
  const env = { PC: FakePC, WS: FakeWS };
  it('a camera not on Wyze\'s WebRTC road, or a device without WebRTC, is never tried', async () => {
    const ask = vi.fn();
    expect(await tryDirectRoad({ id: 'garage', road: 'direct' }, 't', { ask, ...env })).toMatchObject({ ok: false, skipped: true });
    expect(await tryDirectRoad(kvs, 't', { ask, PC: undefined, WS: FakeWS, now: 0 })).toMatchObject({ ok: false });
    expect(directWanted(kvs, { PC: null, WS: FakeWS })).toBe(false);
    expect(ask).not.toHaveBeenCalled();
  });
  it('PROVEN TO CATCH: a camera that failed here keeps the NAS road for the back-off, then is tried again', async () => {
    const ask = vi.fn(async () => ({ ok: false, status: 502, error: 'wyze-refused' }));
    expect(await tryDirectRoad(kvs, 't', { ask, now: 1000, ...env })).toMatchObject({ ok: false, skipped: false, reason: 'wyze-refused' });
    expect(await tryDirectRoad(kvs, 't', { ask, now: 1000 + DIRECT_BACKOFF_MS - 1, ...env })).toMatchObject({ skipped: true });
    expect(ask).toHaveBeenCalledTimes(1);
    expect(await tryDirectRoad(kvs, 't', { ask, now: 1000 + DIRECT_BACKOFF_MS + 1, ...env })).toMatchObject({ skipped: false });
    expect(ask).toHaveBeenCalledTimes(2);
  });
  it('a 429 (someone else asked the same camera a moment ago) is not remembered as a failure', async () => {
    const ask = vi.fn(async () => ({ ok: false, status: 429, error: 'too-soon' }));
    await tryDirectRoad(kvs, 't', { ask, now: 5, ...env });
    expect(directWanted(kvs, { now: 6, ...env })).toBe(true);
  });
  it('a connect that fails is remembered; one that carries video clears the memory', async () => {
    const ask = async () => ({ ok: true, session: SESSION });
    const bad = await tryDirectRoad(kvs, 't', { ask, connect: async () => { throw new Error('ice failed'); }, now: 10, ...env });
    expect(bad).toMatchObject({ ok: false, reason: 'ice failed' });
    expect(directWanted(kvs, { now: 11, ...env })).toBe(false);
    resetDirectState();
    const close = vi.fn();
    const good = await tryDirectRoad(kvs, 't', { ask, connect: async () => ({ stream: { id: 's' }, close }), now: 10, ...env });
    expect(good).toMatchObject({ ok: true, stream: { id: 's' } });
    noteDirectFailure('porch', 10);
    expect(directWanted(kvs, { now: 11, ...env })).toBe(false);
  });
  it('a device opens at most DIRECT_MAX_SESSIONS direct sessions; the rest take the NAS road', async () => {
    const sessions = [];
    for (let i = 0; i < DIRECT_MAX_SESSIONS; i += 1) { sessions.push(connectDirect(SESSION, env).catch(() => {})); }
    expect(directWanted(kvs, env)).toBe(false);
    resetDirectState();
    expect(directWanted(kvs, env)).toBe(true);
  });
});
