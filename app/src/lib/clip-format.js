// =============================================================================
// clip-format — which shape of clip this device asks the NAS voice for
// =============================================================================
// Darrell 2026-10-02, "Download every lesson" reading 31.3 GB with the voice:
// "Huge amount of data to download... can we make them lighter?"
//
// A Piper clip is 16-bit 22,050 Hz PCM WAV: 44,100 bytes a second. Speech in
// Opus at 24 kbit/s is 3,000 bytes a second, the same words at a fourteenth
// of the size, and a phone plays it like any music. So the device asks the
// NAS for Opus when it can both PLAY it (<audio> canPlayType) and DECODE it
// (an OfflineAudioContext, which the one-file join needs to turn the pieces
// back into PCM; lib/joined-clip.js). Where it cannot, it asks for WAV as
// before. The NAS answers in the shape it can make: a NAS without ffmpeg
// sends WAV whatever was asked, and the clip's own type says which it is.
// Pure and injectable, so it is proven in plain Node.
// =============================================================================

export const OPUS_MIME = 'audio/ogg; codecs=opus';
export const WAV_MIME = 'audio/wav';
export const CLIP_FORMATS = Object.freeze(['wav', 'opus']);

/**
 * 'opus' when this device can play AND decode Ogg Opus, else 'wav'.
 * @param {object} [o]  { audio: an <audio>-like with canPlayType, canDecode: boolean } for tests
 */
export function preferredClipFormat({ audio, canDecode } = {}) {
  let el = audio;
  if (el === undefined) {
    try { el = typeof document !== 'undefined' && document.createElement ? document.createElement('audio') : null; } catch (_) { el = null; }
  }
  let plays;
  try { plays = !!(el && typeof el.canPlayType === 'function' && /probably|maybe/.test(el.canPlayType(OPUS_MIME) || '')); } catch (_) { plays = false; }
  let decodes = canDecode;
  if (decodes === undefined) {
    decodes = typeof OfflineAudioContext !== 'undefined' || (typeof globalThis !== 'undefined' && typeof globalThis.webkitOfflineAudioContext !== 'undefined');
  }
  return plays && decodes ? 'opus' : 'wav';
}

/** The clip format a Content-Type names: ogg / opus / webm → 'opus', else 'wav'. Pure. */
export function formatOfType(contentType) {
  const t = String(contentType || '').toLowerCase();
  if (/ogg|opus|webm/.test(t)) return 'opus';
  return 'wav';
}

/** True when the first bytes are a RIFF/WAVE header. Pure. */
export function isWavBytes(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : null;
  return !!b && b.length >= 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x41 && b[10] === 0x56 && b[11] === 0x45;
}
