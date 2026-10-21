// THE DIRECT ROAD (DR-1097, sixteenth read). Darrell, 2026-10-21: "Do we have
// to have the tellscale or nas way... why not another more permanent way."
//
// The Wyze app shows a camera by opening Wyze's own WebRTC session (Amazon
// Kinesis Video Streams) from the phone: the video never crosses a NAS or a
// tunnel. This does the same for a camera the NAS keeps on Wyze's WebRTC road
// (cam.road === 'kvs'):
//
//   1. POST {CAMS_BASE}/direct {camera} -- the NAS (cams_forwarder.py, which
//      keeps the Wyze account) asks the bridge for ONE session and hands this
//      device only a presigned wss:// URL to Amazon's signaling service, the
//      session's stun:/turn: servers and its client id. Both are short-lived
//      and good for that camera alone; the Wyze email, password and API key
//      never leave the NAS.
//   2. The browser opens that WebSocket and an RTCPeerConnection (video and
//      audio, receive only), and speaks Kinesis's signaling the way go2rtc's
//      kinesisClient does (internal/webrtc/kinesis.go): an SDP_OFFER, then
//      ICE_CANDIDATEs, each payload base64 JSON, to recipientClientId; it reads
//      SDP_ANSWER and ICE_CANDIDATE back.
//
// Anything that does not carry a picture -- a 404 (camera not on that road),
// 503 (Wyze calls it offline), a refusal, a timeout, a stall -- leaves the tile
// on the NAS road, and a camera that failed here is left on the NAS road for
// DIRECT_BACKOFF_MS before the direct road is tried again.
import { CAMS_BASE, FETCH_TIMEOUT_MS, fetchWithTimeout, authHeaders } from './cameras.js';

export const DIRECT_CONNECT_TIMEOUT_MS = 15000; // signaling + ICE + DTLS + the first track
export const DIRECT_STALL_MS = 8000;            // no new video bytes this long: the picture froze
export const DIRECT_STATS_MS = 2000;            // how often the received bytes are read
export const DIRECT_MAX_SESSIONS = 6;           // per device: a phone decodes a handful, not the whole house
export const DIRECT_BACKOFF_MS = 120000;        // a camera that failed here keeps the NAS road this long

export function directUrl() { return `${CAMS_BASE}/direct`; }

let active = 0;
const backoff = new Map();

/** Test seam: the device's open direct sessions and failure memory, cleared. */
export function resetDirectState() { active = 0; backoff.clear(); }
export function directActive() { return active; }

/** A failure here sends the camera to the NAS road for DIRECT_BACKOFF_MS. */
export function noteDirectFailure(id, now = Date.now()) { if (id) backoff.set(String(id), now + DIRECT_BACKOFF_MS); }
export function noteDirectSuccess(id) { if (id) backoff.delete(String(id)); }

/** Whether this device should try the direct road for a camera now. */
export function directWanted(cam, { now = Date.now(), PC = globalThis.RTCPeerConnection, WS = globalThis.WebSocket } = {}) {
  if (!cam || cam.road !== 'kvs' || !cam.id) return false;
  if (typeof PC !== 'function' || typeof WS !== 'function') return false;
  if (active >= DIRECT_MAX_SESSIONS) return false;
  const until = backoff.get(String(cam.id));
  return !(until && until > now);
}

function utf8ToB64(text) {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 1) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
function b64ToUtf8(b64) {
  const bin = atob(String(b64));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}
export function encodePayload(obj) { return utf8ToB64(JSON.stringify(obj)); }
export function decodePayload(b64) {
  try { const v = JSON.parse(b64ToUtf8(b64)); return v && typeof v === 'object' ? v : null; } catch { return null; }
}

/** The SDP_OFFER message Kinesis signaling reads. */
export function offerMessage(desc, clientId) {
  return JSON.stringify({ action: 'SDP_OFFER', recipientClientId: clientId, messagePayload: encodePayload({ type: 'offer', sdp: desc && desc.sdp }) });
}
/** One local ICE candidate, as Kinesis signaling reads it. */
export function candidateMessage(cand, clientId) {
  const c = cand && typeof cand.toJSON === 'function' ? cand.toJSON() : cand;
  return JSON.stringify({ action: 'ICE_CANDIDATE', recipientClientId: clientId, messagePayload: encodePayload({ candidate: c.candidate, sdpMid: c.sdpMid, sdpMLineIndex: c.sdpMLineIndex }) });
}

/**
 * One message from Kinesis signaling -> {kind: 'answer', sdp} | {kind:
 * 'candidate', candidate} | {kind: 'status', ok, detail} | {kind: 'other'}.
 */
export function readSignal(text) {
  let m;
  try { m = JSON.parse(String(text || '')); } catch { return { kind: 'other' }; }
  if (!m || typeof m !== 'object') return { kind: 'other' };
  if (m.statusResponse && typeof m.statusResponse === 'object') {
    const code = Number(m.statusResponse.statusCode);
    return { kind: 'status', ok: code >= 200 && code < 300, detail: String(m.statusResponse.description || m.statusResponse.errorType || `status ${m.statusResponse.statusCode}`).slice(0, 160) };
  }
  const p = decodePayload(m.messagePayload);
  if (m.messageType === 'SDP_ANSWER' && p && typeof p.sdp === 'string') return { kind: 'answer', sdp: p.sdp };
  if (m.messageType === 'ICE_CANDIDATE' && p && typeof p.candidate === 'string') {
    return { kind: 'candidate', candidate: { candidate: p.candidate, sdpMid: p.sdpMid ?? null, sdpMLineIndex: p.sdpMLineIndex ?? null } };
  }
  return { kind: 'other' };
}

/** Ask the NAS for one session -> {ok: true, session} | {ok: false, status, error}. */
export async function askDirect(cameraId, token, { fetchImpl = globalThis.fetch, timeoutMs = FETCH_TIMEOUT_MS } = {}) {
  let r;
  try {
    r = await fetchWithTimeout(directUrl(), { method: 'POST', headers: { ...authHeaders(token), 'Content-Type': 'application/json' }, body: JSON.stringify({ camera: cameraId }) }, timeoutMs, fetchImpl);
  } catch (e) {
    return { ok: false, status: 0, error: String((e && e.message) || e) };
  }
  let body;
  try { body = await r.json(); } catch { body = null; }
  if (r.ok && body && typeof body.signaling_url === 'string' && /^wss:\/\//.test(body.signaling_url)) {
    return { ok: true, session: { signaling_url: body.signaling_url, ice_servers: Array.isArray(body.ice_servers) ? body.ice_servers : [], client_id: String(body.client_id || '') } };
  }
  return { ok: false, status: r.status, error: (body && (body.error || body.detail)) || `HTTP ${r.status}` };
}

function videoBytes(report) {
  let total = 0;
  let seen = false;
  const each = (s) => { if (s && s.type === 'inbound-rtp' && (s.kind === 'video' || s.mediaType === 'video')) { total += Number(s.bytesReceived) || 0; seen = true; } };
  if (report && typeof report.forEach === 'function') report.forEach(each);
  return seen ? total : null;
}

/**
 * Connect one session. Resolves {stream, close} once the camera's video track
 * arrives; rejects with the reason (never hangs: timeoutMs). After it resolves
 * the received bytes are watched, and onEnd(reason) is called once if the
 * connection fails or the video stops moving for stallMs.
 */
export function connectDirect(session, {
  WS = globalThis.WebSocket, PC = globalThis.RTCPeerConnection,
  timeoutMs = DIRECT_CONNECT_TIMEOUT_MS, stallMs = DIRECT_STALL_MS, statsMs = DIRECT_STATS_MS,
  onEnd = () => {}, clock = () => Date.now(),
} = {}) {
  return new Promise((resolve, reject) => {
    let settled = false;
    let closed = false;
    let ws = null;
    let pc = null;
    let answered = false;
    let offerSent = false;
    let statsTimer = null;
    const localQueue = [];
    const remoteQueue = [];
    const clientId = (session && session.client_id) || '';
    active += 1;
    const close = () => {
      if (closed) return;
      closed = true;
      active = Math.max(0, active - 1);
      clearTimeout(timer);
      clearInterval(statsTimer);
      try { if (ws) ws.close(); } catch { /* gone */ }
      try { if (pc) pc.close(); } catch { /* gone */ }
    };
    const fail = (why) => {
      if (!settled) { settled = true; close(); reject(new Error(why)); return; }
      if (!closed) { close(); onEnd(why); }
    };
    const timer = setTimeout(() => fail(`no picture from Wyze's WebRTC in ${Math.round(timeoutMs / 1000)} s`), timeoutMs);
    const send = (text) => { try { ws.send(text); } catch { fail("Wyze's signaling closed"); } };
    const watch = () => {
      let last = null;
      let movedAt = clock();
      statsTimer = setInterval(async () => {
        if (closed) return;
        let n;
        try { n = videoBytes(await pc.getStats()); } catch { n = null; }
        if (n != null && n !== last) { last = n; movedAt = clock(); return; }
        if (clock() - movedAt >= stallMs) fail(`the picture froze for ${Math.round(stallMs / 1000)} s`);
      }, statsMs);
    };
    try {
      if (!session || !/^wss:\/\//.test(String(session.signaling_url || ''))) throw new Error('the NAS named no signaling address');
      pc = new PC({ iceServers: Array.isArray(session.ice_servers) ? session.ice_servers : [] });
      pc.addTransceiver('video', { direction: 'recvonly' });
      pc.addTransceiver('audio', { direction: 'recvonly' });
      ws = new WS(session.signaling_url);
    } catch (e) {
      fail(String((e && e.message) || e));
      return;
    }
    pc.onicecandidate = (ev) => {
      if (!ev || !ev.candidate || closed) return;
      if (offerSent) send(candidateMessage(ev.candidate, clientId));
      else localQueue.push(ev.candidate);
    };
    pc.ontrack = (ev) => {
      if (settled || closed || !ev || !ev.track || ev.track.kind !== 'video') return;
      const stream = (ev.streams && ev.streams[0]) || null;
      if (!stream) return;
      settled = true;
      clearTimeout(timer);
      watch();
      resolve({ stream, close });
    };
    pc.onconnectionstatechange = () => {
      if (pc && (pc.connectionState === 'failed' || pc.connectionState === 'closed')) fail(`the WebRTC connection ${pc.connectionState}`);
    };
    ws.onopen = async () => {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        if (closed) return;
        send(offerMessage(pc.localDescription || offer, clientId));
        offerSent = true;
        localQueue.splice(0).forEach((c) => send(candidateMessage(c, clientId)));
      } catch (e) {
        fail(`the offer could not be made: ${String((e && e.message) || e)}`);
      }
    };
    ws.onmessage = async (ev) => {
      if (closed) return;
      const m = readSignal(ev && ev.data);
      try {
        if (m.kind === 'answer' && !answered) {
          await pc.setRemoteDescription({ type: 'answer', sdp: m.sdp });
          answered = true;
          for (const c of remoteQueue.splice(0)) await pc.addIceCandidate(c);
        } else if (m.kind === 'candidate') {
          if (answered) await pc.addIceCandidate(m.candidate);
          else remoteQueue.push(m.candidate);
        } else if (m.kind === 'status' && !m.ok) {
          fail(`Wyze's signaling refused: ${m.detail}`);
        }
      } catch (e) {
        fail(`Wyze's answer could not be used: ${String((e && e.message) || e)}`);
      }
    };
    ws.onerror = () => { if (!answered) fail("Wyze's signaling refused the connection"); };
    ws.onclose = () => { if (!answered) fail("Wyze's signaling closed before it answered"); };
  });
}

/**
 * The whole direct road for one camera -> {ok: true, stream, close} or
 * {ok: false, skipped, reason}. skipped means it was not tried (not on that
 * road, no WebRTC here, the device's cap, the back-off), so the caller simply
 * takes the NAS road; a tried failure is remembered for DIRECT_BACKOFF_MS.
 */
export async function tryDirectRoad(cam, token, { onEnd = () => {}, ask = askDirect, connect = connectDirect, now = Date.now(), PC, WS } = {}) {
  const env = {};
  if (PC !== undefined) env.PC = PC;
  if (WS !== undefined) env.WS = WS;
  if (!directWanted(cam, { now, ...env })) return { ok: false, skipped: true, reason: 'not tried' };
  const a = await ask(cam.id, token);
  if (!a.ok) {
    // 429 is another viewer asking the same camera a moment ago: no memory of a failure.
    if (a.status !== 429) noteDirectFailure(cam.id, now);
    return { ok: false, skipped: false, reason: a.error };
  }
  try {
    const c = await connect(a.session, { onEnd, ...env });
    noteDirectSuccess(cam.id);
    return { ok: true, stream: c.stream, close: c.close };
  } catch (e) {
    noteDirectFailure(cam.id, now);
    return { ok: false, skipped: false, reason: String((e && e.message) || e) };
  }
}
