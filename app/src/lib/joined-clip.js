// =============================================================================
// joined-clip — a whole reading as ONE audio file (DR-0718)
// =============================================================================
// Darrell 2026-10-01, Galaxy Fold 7, installed app: "shouldn't I be able to
// continue to hear my lessons after I start them even if I go to another
// app... it stops each time on the downloaded version?!"
//
// A reading in the NAS voice arrives as one short WAV per sentence (DR-0653).
// Played one after another, the phone sees a NEW short media file every few
// seconds, with a gap at each 'ended' while the next one is swapped in. A
// backgrounded page lives only as long as the phone believes it is playing
// media, and every one of those gaps is a moment it is not.
//
// When every piece of a reading is on the device (saved for listening
// offline, or fetched ahead while the first pieces played), the pieces are
// joined here into ONE WAV: one file, one length, one continuous play from
// the first word to the last, with nothing for JavaScript to do between
// sentences. Where each piece starts (in seconds) is kept, so the follow-along
// highlight and the lock-screen position still know which sentence is heard.
//
// The NAS voice (infra/nas-voice-lite, Piper) answers plain PCM WAV, the same
// format for every piece of one voice. A piece in any other shape, or pieces
// that disagree on format, return null and the reading plays piece by piece
// exactly as before: a join that cannot be made is never a reading lost.
// Pure functions on bytes, so it is tested in plain Node.
// =============================================================================

import { isWavBytes } from './clip-format.js';

const ascii = (b, at, n) => String.fromCharCode(...b.subarray(at, at + n));
const u32 = (b, at) => (b[at] | (b[at + 1] << 8) | (b[at + 2] << 16) | (b[at + 3] << 24)) >>> 0;
const u16 = (b, at) => b[at] | (b[at + 1] << 8);

/**
 * Read a RIFF/WAVE file: its fmt chunk and its PCM data.
 * @param {Uint8Array} bytes
 * @returns {{fmt:Uint8Array, data:Uint8Array, byteRate:number, format:number, channels:number, sampleRate:number, bits:number}|null}
 */
export function parseWav(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : null;
  if (!b || b.length < 12 || ascii(b, 0, 4) !== 'RIFF' || ascii(b, 8, 4) !== 'WAVE') return null;
  let at = 12;
  let fmt = null;
  let data = null;
  while (at + 8 <= b.length) {
    const id = ascii(b, at, 4);
    let size = u32(b, at + 4);
    const body = at + 8;
    // A streamed writer can leave the data size as 0 or 0xFFFFFFFF: the data
    // then runs to the end of the file.
    if (id === 'data' && (size === 0 || body + size > b.length)) size = b.length - body;
    if (id === 'fmt ') fmt = b.subarray(body, Math.min(b.length, body + size));
    else if (id === 'data') { data = b.subarray(body, body + size); break; }
    at = body + size + (size & 1);
  }
  if (!fmt || fmt.length < 16 || !data) return null;
  const format = u16(fmt, 0);
  const channels = u16(fmt, 2);
  const sampleRate = u32(fmt, 4);
  const byteRate = u32(fmt, 8);
  const bits = u16(fmt, 14);
  if (format !== 1 || !channels || !sampleRate || !byteRate) return null; // PCM only
  return { fmt, data, byteRate, format, channels, sampleRate, bits };
}

const sameFormat = (a, b) => a.format === b.format && a.channels === b.channels
  && a.sampleRate === b.sampleRate && a.bits === b.bits && a.byteRate === b.byteRate;

/**
 * Join WAV pieces into one WAV.
 * @param {Uint8Array[]} pieces
 * @returns {{bytes:Uint8Array, offsets:number[], duration:number}|null}
 *   offsets[i] = the second piece i starts at; offsets has one entry per piece.
 */
export function joinWavs(pieces) {
  if (!Array.isArray(pieces) || !pieces.length) return null;
  const parsed = pieces.map(parseWav);
  if (parsed.some((p) => !p)) return null;
  const first = parsed[0];
  if (parsed.some((p) => !sameFormat(p, first))) return null;
  const block = Math.max(1, (first.channels * first.bits) / 8);
  const offsets = [];
  let dataLen = 0;
  for (const p of parsed) {
    offsets.push(dataLen / first.byteRate);
    // Whole sample frames only, so a piece never shifts the next by half a sample.
    dataLen += p.data.length - (p.data.length % block);
  }
  const fmtLen = 16;
  const out = new Uint8Array(12 + 8 + fmtLen + 8 + dataLen);
  const w32 = (at, n) => { out[at] = n & 255; out[at + 1] = (n >>> 8) & 255; out[at + 2] = (n >>> 16) & 255; out[at + 3] = (n >>> 24) & 255; };
  const wStr = (at, s) => { for (let i = 0; i < s.length; i++) out[at + i] = s.charCodeAt(i); };
  wStr(0, 'RIFF'); w32(4, out.length - 8); wStr(8, 'WAVE');
  wStr(12, 'fmt '); w32(16, fmtLen); out.set(first.fmt.subarray(0, fmtLen), 20);
  wStr(36, 'data'); w32(40, dataLen);
  let at = 44;
  for (const p of parsed) {
    const n = p.data.length - (p.data.length % block);
    out.set(p.data.subarray(0, n), at);
    at += n;
  }
  return { bytes: out, offsets, duration: dataLen / first.byteRate };
}

/** Which piece is heard at second `t` of the joined file. */
export function pieceAt(offsets, t) {
  if (!Array.isArray(offsets) || !offsets.length) return 0;
  const s = Number(t) || 0;
  let lo = 0; let hi = offsets.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (offsets[mid] <= s) lo = mid; else hi = mid - 1;
  }
  return lo;
}

/** How far through piece `i` second `t` is, 0..1. */
export function pieceFractionAt(offsets, duration, i, t) {
  const start = offsets[i] || 0;
  const end = i + 1 < offsets.length ? offsets[i + 1] : duration;
  const len = end - start;
  if (!(len > 0)) return 0;
  return Math.min(1, Math.max(0, (Number(t) - start) / len));
}

/** A memory ceiling for one joined reading (about an hour of the NAS voice). */
export const JOIN_MAX_BYTES = 160 * 1024 * 1024;

// A LIGHTER PIECE IS DECODED BEFORE IT IS JOINED (DR-0747). An Opus clip is a
// fourteenth of a WAV on the device, but the one file the phone keeps playing
// off screen (DR-0718) is PCM, so each Opus piece is decoded here, at the
// NAS voice's own rate, and joined like any WAV piece. The decoder is the
// browser's own (an OfflineAudioContext at that rate resamples for free) and
// is injectable, so the join is proven in plain Node with no browser.
export const PIPER_RATE = 22050;

/** 16-bit mono PCM WAV bytes from float samples. Pure. */
export function pcmToWav({ sampleRate, samples }) {
  const n = samples ? samples.length : 0;
  const rate = Number(sampleRate) || PIPER_RATE;
  const out = new Uint8Array(44 + n * 2);
  const w32 = (at, v) => { out[at] = v & 255; out[at + 1] = (v >>> 8) & 255; out[at + 2] = (v >>> 16) & 255; out[at + 3] = (v >>> 24) & 255; };
  const w16 = (at, v) => { out[at] = v & 255; out[at + 1] = (v >>> 8) & 255; };
  const wStr = (at, s) => { for (let i = 0; i < s.length; i++) out[at + i] = s.charCodeAt(i); };
  wStr(0, 'RIFF'); w32(4, out.length - 8); wStr(8, 'WAVE');
  wStr(12, 'fmt '); w32(16, 16); w16(20, 1); w16(22, 1); w32(24, rate); w32(28, rate * 2); w16(32, 2); w16(34, 16);
  wStr(36, 'data'); w32(40, n * 2);
  let at = 44;
  for (let i = 0; i < n; i++) {
    const s = Math.max(-1, Math.min(1, samples[i] || 0));
    w16(at, s < 0 ? Math.round(s * 32768) & 0xffff : Math.round(s * 32767));
    at += 2;
  }
  return out;
}

/**
 * Decode any clip the browser can play into mono float samples at `sampleRate`.
 * Returns null where there is no decoder (plain Node, an old browser).
 */
export async function decodeToPcm(arrayBuffer, { sampleRate = PIPER_RATE, Ctx } = {}) {
  const C = Ctx || (typeof OfflineAudioContext !== 'undefined' ? OfflineAudioContext
    : (typeof globalThis !== 'undefined' && typeof globalThis.webkitOfflineAudioContext !== 'undefined' ? globalThis.webkitOfflineAudioContext : null));
  if (!C) return null;
  const ctx = new C(1, 1, sampleRate);
  const buf = await ctx.decodeAudioData(arrayBuffer.slice(0));
  if (!buf || !buf.length) return null;
  const n = buf.length;
  const channels = buf.numberOfChannels || 1;
  const samples = new Float32Array(n);
  for (let c = 0; c < channels; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < n; i++) samples[i] += d[i] / channels;
  }
  return { sampleRate: buf.sampleRate || sampleRate, samples };
}

/**
 * Join Blobs (from the device cache) into one audio/wav Blob. WAV pieces are
 * joined as they are; any other piece (Opus) is decoded to PCM first.
 * @returns {Promise<{blob:Blob, offsets:number[], duration:number}|null>}
 */
export async function joinClipBlobs(blobs, { maxBytes = JOIN_MAX_BYTES, decode = decodeToPcm } = {}) {
  try {
    if (!Array.isArray(blobs) || !blobs.length || blobs.some((b) => !b)) return null;
    const total = blobs.reduce((n, b) => n + (Number(b.size) || 0), 0);
    if (total > maxBytes) return null;
    const pieces = [];
    let decoded = 0;
    for (const b of blobs) {
      let bytes = new Uint8Array(await b.arrayBuffer());
      if (!isWavBytes(bytes)) {
        const pcm = await decode(bytes.buffer, { sampleRate: PIPER_RATE });
        if (!pcm) return null;
        bytes = pcmToWav(pcm);
      }
      decoded += bytes.length;
      if (decoded > maxBytes) return null;
      pieces.push(bytes);
    }
    const joined = joinWavs(pieces);
    if (!joined || typeof Blob === 'undefined') return null;
    return { blob: new Blob([joined.bytes], { type: 'audio/wav' }), offsets: joined.offsets, duration: joined.duration };
  } catch (_) { return null; }
}
