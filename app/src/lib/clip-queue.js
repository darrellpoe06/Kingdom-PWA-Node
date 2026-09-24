// =============================================================================
// clip-queue — a reading played as REAL AUDIO, paragraph clip after clip
// =============================================================================
// Darrell 2026-09-24, Android phone, lesson reading aloud: "Why doesn't the
// player remain playing in the background when I switch between apps?!!? Fix it."
//
// The phone's own speech engine (Web Speech) is not media, and Android stops it
// when the app leaves the screen. A clip in an <audio> element IS media, and the
// phone keeps it playing like music. So when the GPU studio is dark, the reader
// now asks the NAS's own voice (infra/nas-voice-lite, Piper) for the reading a
// piece at a time and plays the pieces back to back through ONE audio element:
//   • the first piece is short, so the voice starts quickly;
//   • the next piece is fetched while the current one plays (prefetch);
//   • ONE element, its src swapped per piece, so the phone sees one continuous
//     media session rather than a new player per paragraph;
//   • the speed is the element's playbackRate, re-applied on every piece (a new
//     src resets it);
//   • progress is reported as a fraction of the WHOLE reading, so the
//     follow-along highlight keeps moving across pieces.
// A piece that cannot be fetched hands the REST of the text back to the caller
// (onFallback) so the reading continues in the device voice rather than going
// silent. Everything is injectable, so it is tested without a browser.
// =============================================================================
import { segmentText } from './tts.js';

/**
 * Split a reading into pieces for synthesis: whole sentences, the first piece
 * short (fast start), the rest up to `max` characters.
 * @returns {{text:string, len:number}[]}
 */
export function chunkForClips(text, { firstMax = 220, max = 600 } = {}) {
  const sentences = segmentText(String(text || ''), 180).filter((s) => s && s.trim());
  const out = [];
  let cur = '';
  for (const s of sentences) {
    const limit = out.length === 0 ? firstMax : max;
    if (cur && (cur.length + 1 + s.length) > limit) { out.push(cur); cur = s; } else cur = cur ? `${cur} ${s}` : s;
  }
  if (cur) out.push(cur);
  return out.map((t) => ({ text: t, len: t.length }));
}

/** 0..1 through the whole reading, from the piece index and the piece's own fraction. */
export function overallFraction(chunks, index, pieceFraction) {
  const total = chunks.reduce((n, c) => n + c.len, 0) || 1;
  let before = 0;
  for (let i = 0; i < index && i < chunks.length; i++) before += chunks[i].len;
  const cur = chunks[index] ? chunks[index].len : 0;
  const f = Math.min(1, Math.max(0, Number(pieceFraction) || 0));
  return Math.min(1, (before + f * cur) / total);
}

/**
 * @param {object} o
 * @param {{text:string,len:number}[]} o.chunks
 * @param {Function} o.fetchClip   async (text) => ({url} | {error})
 * @param {object}   o.audio       ONE audio element (or a fake with the same shape)
 * @param {number}   [o.rate]
 * @param {Function} [o.onProgress] (fraction of the whole reading)
 * @param {Function} [o.onPiece]    (index) when a piece starts playing
 * @param {Function} [o.onEnd]      () when the last piece finished
 * @param {Function} [o.onFallback] (restText, index) a piece could not be had
 * @param {Function} [o.revoke]     (url) release an object URL
 */
export function createClipQueue({ chunks, fetchClip, audio, rate = 1, onProgress, onPiece, onEnd, onFallback, revoke }) {
  const urls = new Map();       // index -> Promise<{url}|{error}>
  let index = -1;
  let stopped = false;
  let speed = rate;

  const want = (i) => {
    if (i < 0 || i >= chunks.length) return null;
    if (!urls.has(i)) urls.set(i, Promise.resolve().then(() => fetchClip(chunks[i].text)).catch((e) => ({ error: (e && e.message) || 'fetch-failed' })));
    return urls.get(i);
  };

  const applyRate = () => {
    try { audio.defaultPlaybackRate = speed; } catch (_) { /* a device fact */ }
    try { audio.playbackRate = speed; } catch (_) { /* a device fact */ }
    for (const key of ['preservesPitch', 'mozPreservesPitch', 'webkitPreservesPitch']) {
      try { if (key in audio) audio[key] = true; } catch (_) { /* a device fact */ }
    }
  };

  const release = (i) => {
    const p = urls.get(i);
    if (!p) return;
    urls.delete(i);
    p.then((r) => { if (r && r.url && revoke) { try { revoke(r.url); } catch (_) { /* ignore */ } } });
  };

  const playAt = async (i) => {
    if (stopped) return false;
    if (i >= chunks.length) { if (onEnd) onEnd(); return true; }
    const got = await want(i);
    if (stopped) return false;
    if (!got || got.error || !got.url) {
      const rest = chunks.slice(i).map((c) => c.text).join(' ');
      if (onFallback) onFallback(rest, i, got && got.error);
      return false;
    }
    index = i;
    if (i > 0) release(i - 1);
    want(i + 1); // prefetch while this one plays
    try { audio.src = got.url; } catch (_) { /* fake */ }
    applyRate();
    if (onPiece) onPiece(i);
    if (onProgress) onProgress(overallFraction(chunks, i, 0));
    try { const p = audio.play(); if (p && typeof p.catch === 'function') await p; } catch (e) {
      const rest = chunks.slice(i).map((c) => c.text).join(' ');
      if (onFallback) onFallback(rest, i, (e && e.name) || 'play-refused');
      return false;
    }
    return true;
  };

  audio.onended = () => { if (!stopped) playAt(index + 1); };
  audio.ontimeupdate = () => {
    if (stopped || index < 0 || !onProgress) return;
    const d = Number(audio.duration);
    const t = Number(audio.currentTime);
    if (Number.isFinite(d) && d > 0 && Number.isFinite(t)) onProgress(overallFraction(chunks, index, t / d));
  };

  return {
    /** Start from piece 0. Resolves true when the first piece is playing. */
    start() { want(0); want(1); return playAt(0); },
    stop() {
      stopped = true;
      try { audio.pause(); } catch (_) { /* ignore */ }
      for (const i of [...urls.keys()]) release(i);
    },
    setRate(r) { speed = r; applyRate(); },
    get index() { return index; },
    get stopped() { return stopped; },
  };
}
