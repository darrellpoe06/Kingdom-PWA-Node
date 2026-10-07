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
import { pieceAt, pieceFractionAt } from './joined-clip.js';

/** Where the reading is cut (tts.js segmentText breathes at about this length). */
export const PIECE_CUT = 180;
/** The hard ceiling on what the voice is handed at once; a cut can run a word long. */
export const PIECE_MAX = 200;

/**
 * Split a reading into pieces for synthesis: ONE PIECE PER READING SEGMENT.
 *
 * WHY NOT BIGGER PIECES (Darrell 2026-09-24, on L191 in the NAS voice: "it
 * reads however it loses the words and actually degrades into undetectable
 * gibberish... after initially sounding like a man", and "its all down hill
 * after the first like 15 - 30 seconds"). The first version glued segments
 * back together into pieces of up to 600 characters. Piper splits its input
 * only at . ! ?, so a run of semicolon clauses (L191's summary sentence is 866
 * characters with no full stop) reached the model as ONE utterance, and a VITS
 * voice drifts into mush on long utterances. The first piece was short and
 * clean; every piece after it was ~570 characters. Measured on L191: 28
 * pieces, 27 of them 406–599 characters.
 *
 * segmentText already cuts where a person breathes, at about PIECE_CUT
 * characters (never past PIECE_MAX). Using its segments AS the pieces keeps every request short, and
 * makes piece i the SAME sentence as highlight segment i, so the highlight
 * follows the piece that is playing instead of a guess from the clock.
 * @returns {{text:string, len:number}[]}
 */
export function chunkForClips(text) {
  return segmentText(String(text || ''), PIECE_CUT)
    .filter((s) => s && s.trim())
    .map((t) => ({ text: t, len: t.length }));
}

/** How many pieces ahead are fetched while one plays (the NAS takes 2 at once). */
export const PREFETCH_AHEAD = 2;

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
 * @param {Function} [o.onPiece]    (index, {waitMs, inHand}) when a piece starts playing: how long the
 *                                  listener waited for it after the last one ended, and whether it was
 *                                  already in hand (else fetched/read while they waited)
 * @param {Function} [o.onEnd]      () when the last piece finished
 * @param {Function} [o.onFallback] (restText, index) a piece could not be had
 * @param {Function} [o.onPosition] ({duration, position, playbackRate}) while a joined reading plays
 * @param {Function} [o.revoke]     (url) release an object URL
 *
 * NOTHING WAITS BETWEEN PIECES (DR-0718; Darrell 2026-10-01: "it stops each
 * time on the downloaded version"). A screen that is off or an app in front
 * leaves this page running only while the phone thinks media is playing. The
 * 'ended' handler used to `await` the next piece before swapping it in, so
 * every sentence boundary was a stretch of no media at all. Now each piece is
 * remembered the moment it arrives, and 'ended' swaps the next one in
 * SYNCHRONOUSLY, inside the event, with no timer and no visibility check. Only
 * a piece that has not arrived yet is waited for.
 *
 * ONE FILE WHEN THE WHOLE READING IS HERE (join): once every piece is on the
 * device, the pieces are joined into one WAV (lib/joined-clip.js) and the
 * element plays THAT from the next piece boundary to the end, so the phone
 * holds one long, continuous play with nothing between sentences at all.
 */
export function createClipQueue({ chunks, fetchClip, audio, rate = 1, onProgress, onPiece, onEnd, onFallback, onPosition, onPace, paceFor, revoke, now = () => Date.now() }) {
  const urls = new Map();       // index -> Promise<{url}|{error}>
  // THE VOICE IS ASKED AGAIN AT THE NEW PACE (2026-10-07, DR-0791; Darrell:
  // "Why does the male voice sound like it's slowing down while it's
  // talking? Not able to correctly enunciate words"). A reading pinned its
  // pace once; a speed change mid-reading then left the ELEMENT to stretch
  // every later piece — and a stretch below 1x (1.5x pieces at a 1x rate =
  // 0.667) is a drawl that smears the words. Now `paceFor(rate)` names the
  // pace the voice should speak at, the pieces not yet playing are asked for
  // again at that pace, and the element stretches only the piece already on
  // it. `fetchClip(text, i, pace)` receives the pace to ask for.
  let pace = typeof paceFor === 'function' ? paceFor(rate) : null;
  // THE PAUSE IS MEASURED (2026-10-07, DR-0786; Darrell: "longer pauses...
  // over time... why?"). From the moment one piece ends (or play is asked)
  // to the moment the next is on the element: that is the silence the
  // listener hears, and whether the piece was in hand says where it came from.
  let waitFrom = null;
  const ready = new Map();      // index -> the settled answer, for a swap with no await
  let index = -1;
  let stopped = false;
  let finished = false;
  let speed = rate;
  // THE VOICE MAY HAVE SPOKEN THE PIECE FASTER ALREADY (2026-10-07). A piece
  // answers {url, speed}: the pace the NAS voice spoke it at (1 when it did
  // not say). The element then stretches only the remainder — rate / that
  // pace — so a 2x reading spoken at 2x plays at 1x, words intact, while a
  // saved 1x piece is stretched exactly as before.
  let pieceSpeed = 1;
  let joined = null;            // { url, offsets, duration } now playing
  let pendingJoin = null;       // takes over at the next piece boundary
  // THE PACE IS MEASURED (DR-0791): for every piece, how long the clip was,
  // how long the device took to play it, and what the element was set to.
  // The trip turns these into one line, so "it slows down" is a number.
  let playFrom = null;          // when the piece on the element started playing
  let pausedOnce = false;       // a pause inside the piece: its wall time is not a measure
  const listening = [];
  const listen = (ev, fn) => {
    try {
      if (typeof audio.addEventListener === 'function') { audio.addEventListener(ev, fn); listening.push([ev, fn]); }
    } catch (_) { /* a fake */ }
  };
  // The end of a clip fires 'pause' too (paused goes true before 'ended'):
  // that is not a pause the listener made, and `ended` says so.
  listen('pause', () => { if (!stopped && playFrom != null && !audio.ended) pausedOnce = true; });
  const reportPace = (i, clipS, from) => {
    if (!onPace || i < 0 || i >= chunks.length) return;
    const wallMs = from != null ? Math.max(0, now() - from) : null;
    let rateNow = speed;
    try { const got = Number(audio.playbackRate); if (Number.isFinite(got) && got > 0) rateNow = got; } catch (_) { /* a fake */ }
    onPace({ i, chars: String(chunks[i].text || '').length, clipS: Number.isFinite(clipS) && clipS > 0 ? clipS : null, wallMs, paused: pausedOnce, playbackRate: rateNow, pieceSpeed });
  };

  const want = (i) => {
    if (i < 0 || i >= chunks.length) return null;
    if (!urls.has(i)) {
      const p = Promise.resolve().then(() => fetchClip(chunks[i].text, i, pace))
        .catch((e) => ({ error: (e && e.message) || 'fetch-failed' }))
        .then((r) => { if (urls.get(i) === p) ready.set(i, r); return r; });
      urls.set(i, p);
    }
    return urls.get(i);
  };

  const applyRate = () => {
    const sp = Number.isFinite(pieceSpeed) && pieceSpeed > 0 ? pieceSpeed : 1;
    const want = Math.round((speed / sp) * 1000) / 1000;
    try { audio.defaultPlaybackRate = want; } catch (_) { /* a device fact */ }
    try { audio.playbackRate = want; } catch (_) { /* a device fact */ }
    for (const key of ['preservesPitch', 'mozPreservesPitch', 'webkitPreservesPitch']) {
      try { if (key in audio) audio[key] = true; } catch (_) { /* a device fact */ }
    }
  };

  const release = (i) => {
    const p = urls.get(i);
    if (!p) return;
    urls.delete(i);
    ready.delete(i);
    p.then((r) => { if (r && r.url && revoke) { try { revoke(r.url); } catch (_) { /* ignore */ } } });
  };
  const releaseJoin = (j) => { if (j && j.url && revoke) { try { revoke(j.url); } catch (_) { /* ignore */ } } };

  const fallBack = (i, reason) => {
    const rest = chunks.slice(i).map((c) => c.text).join(' ');
    if (onFallback) onFallback(rest, i, reason);
    return false;
  };

  const finish = () => {
    if (finished) return true;
    finished = true;
    if (onEnd) onEnd();
    return true;
  };

  // play() on the same element; a refusal hands the rest back.
  const playNow = (i) => {
    try {
      const p = audio.play();
      if (p && typeof p.then === 'function') {
        return p.then(() => true, (e) => (stopped ? false : fallBack(i, (e && e.name) || 'play-refused')));
      }
    } catch (e) { return Promise.resolve(fallBack(i, (e && e.name) || 'play-refused')); }
    return Promise.resolve(true);
  };

  // Swap a piece in. SYNCHRONOUS up to play(): called from 'ended' with the
  // answer already in hand, the next sentence is on the element before the
  // event returns.
  const startPiece = (i, got, inHand = false) => {
    if (!got || got.error || !got.url) return Promise.resolve(fallBack(i, got && got.error));
    const waitMs = waitFrom != null ? Math.max(0, now() - waitFrom) : 0;
    waitFrom = null;
    index = i;
    pieceSpeed = Number(got.speed) > 0 ? Number(got.speed) : 1;
    if (i > 0) release(i - 1);
    for (let k = 1; k <= PREFETCH_AHEAD; k++) want(i + k); // prefetch while this one plays
    try { audio.src = got.url; } catch (_) { /* fake */ }
    applyRate();
    playFrom = null; pausedOnce = false;
    if (onPiece) onPiece(i, { waitMs, inHand });
    if (onProgress) onProgress(overallFraction(chunks, i, 0));
    return playNow(i).then((ok) => { if (ok && index === i && playFrom == null) playFrom = now(); return ok; });
  };

  // The joined file takes over from piece i to the end.
  const startJoined = (i) => {
    joined = pendingJoin; pendingJoin = null;
    for (const k of [...urls.keys()]) release(k);
    index = i;
    pieceSpeed = joined.speed; // the pace the joined pieces were spoken at (1 for a saved 1x reading)
    const at = joined.offsets[i] || 0;
    try { audio.src = joined.url; } catch (_) { /* fake */ }
    try { audio.currentTime = at; } catch (_) { /* before metadata: re-applied below */ }
    // A browser that dropped the start position before the file loaded gets
    // it again once the length is known.
    try {
      if (at > 0 && typeof audio.addEventListener === 'function') {
        const j = joined;
        const again = () => {
          try { audio.removeEventListener('loadedmetadata', again); } catch (_) { /* ignore */ }
          if (joined === j && Number(audio.currentTime) + 0.25 < at) { try { audio.currentTime = at; } catch (_) { /* ignore */ } }
        };
        audio.addEventListener('loadedmetadata', again);
      }
    } catch (_) { /* ignore */ }
    applyRate();
    const joinedWait = waitFrom != null ? Math.max(0, now() - waitFrom) : 0;
    waitFrom = null;
    playFrom = null; pausedOnce = false;
    if (onPiece) onPiece(i, { waitMs: joinedWait, inHand: true });
    if (onProgress) onProgress(overallFraction(chunks, i, 0));
    return playNow(i).then((ok) => { if (ok && playFrom == null) playFrom = now(); return ok; });
  };

  const playAt = (i) => {
    if (stopped) return Promise.resolve(false);
    if (waitFrom == null) waitFrom = now();
    if (i >= chunks.length) return Promise.resolve(finish());
    if (pendingJoin) return startJoined(i);
    if (ready.has(i)) return startPiece(i, ready.get(i), true); // in hand: no await at all
    const p = want(i);
    return p.then((got) => (stopped ? false : (pendingJoin ? startJoined(i) : startPiece(i, got, false))));
  };

  // No timer and no visibility gate: the next piece goes on the element
  // inside this event whether the screen is on, off, or behind another app.
  audio.onended = () => {
    if (stopped) return;
    if (joined) {
      const start = joined.offsets[index] || 0;
      reportPace(index, joined.duration - start, playFrom);
      finish();
      return;
    }
    let clipS = null;
    try { const d = Number(audio.duration); if (Number.isFinite(d) && d > 0) clipS = d; } catch (_) { /* a fake */ }
    reportPace(index, clipS, playFrom);
    waitFrom = now();
    playAt(index + 1);
  };
  audio.ontimeupdate = () => {
    if (stopped || index < 0) return;
    const t = Number(audio.currentTime);
    if (joined) {
      if (!Number.isFinite(t)) return;
      const p = pieceAt(joined.offsets, t);
      if (p !== index) {
        // The piece just left: its length is the gap between offsets.
        if (p === index + 1) reportPace(index, (joined.offsets[p] || 0) - (joined.offsets[index] || 0), playFrom);
        playFrom = now(); pausedOnce = false;
        index = p;
        if (onPiece) onPiece(p, { waitMs: 0, inHand: true });
      }
      if (onProgress) onProgress(overallFraction(chunks, p, pieceFractionAt(joined.offsets, joined.duration, p, t)));
      if (onPosition) onPosition({ duration: joined.duration, position: t, playbackRate: speed });
      return;
    }
    if (!onProgress) return;
    const d = Number(audio.duration);
    if (Number.isFinite(d) && d > 0 && Number.isFinite(t)) onProgress(overallFraction(chunks, index, t / d));
  };

  return {
    /** Start from piece 0. Resolves true when the first piece is playing. */
    start() { if (!pendingJoin) want(0); return playAt(0); },
    stop() {
      stopped = true;
      for (const [ev, fn] of listening) { try { audio.removeEventListener(ev, fn); } catch (_) { /* ignore */ } }
      listening.length = 0;
      try { audio.pause(); } catch (_) { /* ignore */ }
      for (const i of [...urls.keys()]) release(i);
      releaseJoin(joined); releaseJoin(pendingJoin);
      joined = null; pendingJoin = null;
    },
    /**
     * Hand the queue the whole reading as one file. It takes over at the next
     * piece boundary (or from the start, if nothing has played yet).
     * `speed` is the pace its pieces were spoken at (1, a saved 1x reading,
     * when it does not say); the element stretches only the remainder.
     * @param {{url:string, offsets:number[], duration:number, speed?:number}} j
     */
    join(j) {
      if (stopped || joined || !j || !j.url || !Array.isArray(j.offsets) || j.offsets.length !== chunks.length) return false;
      releaseJoin(pendingJoin);
      pendingJoin = { url: j.url, offsets: j.offsets, duration: Number(j.duration) || 0, speed: Number(j.speed) > 0 ? Number(j.speed) : 1 };
      return true;
    },
    /**
     * A new speed. The piece on the element takes the remainder at once; when
     * the voice's pace for this speed differs from the one the pending pieces
     * were asked at, those pieces are dropped and asked for again at the new
     * pace, so from the next sentence on the element stretches nothing.
     */
    setRate(r) {
      speed = r;
      const next = typeof paceFor === 'function' ? paceFor(r) : pace;
      if (next !== pace && !joined) {
        pace = next;
        for (const k of [...urls.keys()]) { if (k > index) release(k); }
        if (index >= 0) { for (let k = 1; k <= PREFETCH_AHEAD; k++) want(index + k); }
      }
      applyRate();
    },
    /** The pace the voice is asked for now (null when the caller gave no paceFor). */
    get pace() { return pace; },
    get index() { return index; },
    get stopped() { return stopped; },
    /** True once the reading plays as one joined file. */
    get joined() { return !!joined; },
  };
}
