// @vitest-environment node
// =============================================================================
// THE CLIPS ARE LIGHTER: OPUS FROM THE NAS, DECODED FOR THE ONE-FILE JOIN (DR-0747)
// =============================================================================
// Darrell 2026-10-02, "Download every lesson" reading 31.3 GB with the voice:
// "Huge amount of data to download... can we make them lighter?"
//
// A Piper clip is PCM WAV at 44,100 bytes a second; Opus at 24 kbit/s is
// 3,000. A device that can play and decode Opus asks the NAS for it, the NAS
// (with ffmpeg) answers Ogg Opus, the clip is kept as it came, and the one
// file a saved reading plays as (DR-0718) is made by decoding each Opus piece
// back to PCM at the NAS voice's rate and joining it like any WAV piece.
//
// PROVEN-TO-CATCH: the join case fails against the old join, which returned
// null for any piece that was not a WAV; the size case fails if the estimate
// stops reading the format; the request case fails if the format is not sent.
import { describe, it, expect } from 'vitest';
import { preferredClipFormat, formatOfType, isWavBytes, OPUS_MIME } from '../lib/clip-format.js';
import { synthesizeLite } from '../lib/voice-service.js';
import { joinClipBlobs, joinWavs, pcmToWav, parseWav, PIPER_RATE } from '../lib/joined-clip.js';
import { pieceBytes, VOICE_BYTES_PER_CHAR, VOICE_BYTES_PER_CHAR_BY_FORMAT, VOICE_BYTES_PER_PIECE } from '../lib/lesson-downloads.js';

const audioThatPlays = (answer) => ({ canPlayType: (t) => (t === OPUS_MIME ? answer : '') });

describe('which shape this device asks for', () => {
  it('opus when it can play AND decode it; wav otherwise', () => {
    expect(preferredClipFormat({ audio: audioThatPlays('probably'), canDecode: true })).toBe('opus');
    expect(preferredClipFormat({ audio: audioThatPlays('maybe'), canDecode: true })).toBe('opus');
    expect(preferredClipFormat({ audio: audioThatPlays(''), canDecode: true })).toBe('wav');
    expect(preferredClipFormat({ audio: audioThatPlays('probably'), canDecode: false })).toBe('wav');
    expect(preferredClipFormat({ audio: null, canDecode: true })).toBe('wav');
  });
  it('the shape a Content-Type names', () => {
    expect(formatOfType('audio/ogg; codecs=opus')).toBe('opus');
    expect(formatOfType('audio/webm')).toBe('opus');
    expect(formatOfType('audio/wav')).toBe('wav');
    expect(formatOfType('')).toBe('wav');
  });
  it('a RIFF header is known by its bytes', () => {
    expect(isWavBytes(pcmToWav({ sampleRate: PIPER_RATE, samples: new Float32Array(10) }))).toBe(true);
    expect(isWavBytes(new Uint8Array([0x4f, 0x67, 0x67, 0x53, 0, 0, 0, 0, 0, 0, 0, 0]))).toBe(false);
    expect(isWavBytes(null)).toBe(false);
  });
});

describe('the NAS is asked for the shape, and says which came', () => {
  const fetchOk = (ctype, bytes) => async (url, init) => ({
    ok: true, status: 200,
    headers: { get: (k) => (k === 'Content-Type' ? ctype : null) },
    blob: async () => ({ size: bytes.length, type: ctype, arrayBuffer: async () => bytes.buffer, _init: init }),
  });
  it('sends format: opus and reads an Ogg Opus answer as opus', async () => {
    globalThis.URL = globalThis.URL || {};
    const made = [];
    const old = globalThis.URL.createObjectURL;
    globalThis.URL.createObjectURL = (b) => { made.push(b); return 'blob:x'; };
    try {
      let sent = null;
      const f = async (url, init) => { sent = JSON.parse(init.body); return fetchOk('audio/ogg; codecs=opus', new Uint8Array([0x4f, 0x67, 0x67, 0x53]))(url, init); };
      const out = await synthesizeLite({ text: 'Lighter please.', voice: 'male', format: 'opus', fetchImpl: f, origin: 'https://poetech.us' });
      expect(sent).toEqual({ text: 'Lighter please.', voice: 'male', format: 'opus' });
      expect(out.format).toBe('opus');
      expect(out.blob.size).toBe(4);
    } finally { globalThis.URL.createObjectURL = old; }
  });
  it('a NAS without ffmpeg answers WAV to the same ask, and the clip says wav', async () => {
    const old = globalThis.URL.createObjectURL;
    globalThis.URL.createObjectURL = () => 'blob:y';
    try {
      const out = await synthesizeLite({ text: 'Lighter please.', format: 'opus', fetchImpl: fetchOk('audio/wav', new Uint8Array(50)), origin: '' });
      expect(out.format).toBe('wav');
    } finally { globalThis.URL.createObjectURL = old; }
  });
  it('an unknown format asks for what this device prefers, never garbage', async () => {
    const old = globalThis.URL.createObjectURL;
    globalThis.URL.createObjectURL = () => 'blob:z';
    try {
      let sent = null;
      const f = async (url, init) => { sent = JSON.parse(init.body); return fetchOk('audio/wav', new Uint8Array(50))(url, init); };
      await synthesizeLite({ text: 'Hello.', format: 'mp3', fetchImpl: f, origin: '' });
      expect(['wav', 'opus']).toContain(sent.format);
    } finally { globalThis.URL.createObjectURL = old; }
  });
});

describe('the size is said by the shape', () => {
  it('an opus piece is about a fourteenth of a wav piece', () => {
    const spoken = 'x'.repeat(100);
    expect(pieceBytes(spoken)).toBe(100 * VOICE_BYTES_PER_CHAR + VOICE_BYTES_PER_PIECE);
    expect(pieceBytes(spoken, 'wav')).toBe(pieceBytes(spoken));
    expect(pieceBytes(spoken, 'opus')).toBe(100 * VOICE_BYTES_PER_CHAR_BY_FORMAT.opus + VOICE_BYTES_PER_PIECE);
    expect(VOICE_BYTES_PER_CHAR / VOICE_BYTES_PER_CHAR_BY_FORMAT.opus).toBeGreaterThan(13);
    expect(VOICE_BYTES_PER_CHAR_BY_FORMAT.opus).toBe(Math.round(VOICE_BYTES_PER_CHAR * 3000 / 44100 * 1.035));
    expect(pieceBytes(spoken, 'nope')).toBe(pieceBytes(spoken, 'wav'));
  });
});

describe('the one-file join takes Opus pieces too', () => {
  const tone = (n, v) => { const s = new Float32Array(n); s.fill(v); return s; };
  const wavBlob = (samples) => { const bytes = pcmToWav({ sampleRate: PIPER_RATE, samples }); return { size: bytes.length, type: 'audio/wav', arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) }; };
  // A stand-in Opus piece: not a WAV; the injected decoder knows its samples.
  const opusBlob = (samples) => { const bytes = new Uint8Array([0x4f, 0x67, 0x67, 0x53, samples.length & 255]); return { size: bytes.length, type: 'audio/ogg; codecs=opus', arrayBuffer: async () => bytes.buffer, _samples: samples }; };
  const decoderFor = (map) => async (buf, { sampleRate }) => {
    const n = new Uint8Array(buf)[4];
    return { sampleRate, samples: map[n] };
  };

  it('PROVEN-TO-CATCH: a saved reading of Opus pieces joins into one WAV at the NAS voice rate, with the offsets right', async () => {
    const a = tone(2205, 0.5); const b = tone(4410, -0.25); const c = tone(1102, 0.1);
    const decode = decoderFor({ [2205 & 255]: a, [4410 & 255]: b, [1102 & 255]: c });
    const j = await joinClipBlobs([opusBlob(a), opusBlob(b), opusBlob(c)], { decode });
    expect(j).toBeTruthy();
    expect(j.blob.type).toBe('audio/wav');
    expect(j.offsets).toEqual([0, 0.1, 0.3]);
    expect(j.duration).toBeCloseTo((2205 + 4410 + 1102) / PIPER_RATE, 6);
    const parsed = parseWav(new Uint8Array(await j.blob.arrayBuffer()));
    expect(parsed.sampleRate).toBe(PIPER_RATE);
    expect(parsed.data.length).toBe((2205 + 4410 + 1102) * 2);
  });
  it('WAV and Opus pieces mix in one reading (a clip kept before the change beside one kept after)', async () => {
    const a = tone(2205, 0.5); const b = tone(2205, -0.5);
    const j = await joinClipBlobs([wavBlob(a), opusBlob(b)], { decode: decoderFor({ [2205 & 255]: b }) });
    expect(j).toBeTruthy();
    expect(j.offsets).toEqual([0, 0.1]);
  });
  it('with no decoder an Opus piece cannot be joined, and the reading plays piece by piece as before (null, never a throw)', async () => {
    const j = await joinClipBlobs([opusBlob(tone(10, 0))], { decode: async () => null });
    expect(j).toBeNull();
  });
  it('the decoded size is held under the ceiling, not the packed size', async () => {
    const big = tone(60000, 0.1);
    const j = await joinClipBlobs([opusBlob(big)], { decode: decoderFor({ [60000 & 255]: big }), maxBytes: 1000 });
    expect(j).toBeNull();
  });
  it('a WAV-only reading joins exactly as it did (the old path, untouched)', () => {
    const a = pcmToWav({ sampleRate: PIPER_RATE, samples: tone(2205, 0.5) });
    const b = pcmToWav({ sampleRate: PIPER_RATE, samples: tone(2205, 0.5) });
    const j = joinWavs([a, b]);
    expect(j.offsets).toEqual([0, 0.1]);
    expect(j.duration).toBeCloseTo(0.2, 6);
  });
  it('pcmToWav writes a real 16-bit mono file', () => {
    const bytes = pcmToWav({ sampleRate: 8000, samples: new Float32Array([0, 1, -1, 0.5]) });
    const p = parseWav(bytes);
    expect(p).toMatchObject({ channels: 1, sampleRate: 8000, bits: 16, byteRate: 16000 });
    expect(Array.from(p.data)).toEqual([0, 0, 0xff, 0x7f, 0x00, 0x80, 0x00, 0x40]); // 0, +32767, -32768, +16384
  });
});
