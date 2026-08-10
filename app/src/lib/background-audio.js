// =============================================================================
// background-audio — the Word keeps reading when the app is not on screen
// =============================================================================
// Darrell 2026-08-10, from the phone: "let the reader continue after leaving the
// app... let it run in the background while I work on other apps etc... so I can
// hear the Word."
//
// WHY THIS EXISTS (the real mechanism, not a wish):
// A mobile browser suspends a backgrounded page unless that page is PLAYING
// MEDIA. Web Speech (speechSynthesis) is not media playback — it holds no audio
// element — so the moment the user switches apps the page is frozen and the
// voice stops mid-sentence. The standing fix, used by every background-audio web
// app: keep ONE real, silent, looping <audio> element playing for as long as the
// reader is reading. The page then counts as an audio session, stays alive in the
// background, and the OS gives it lock-screen / notification controls through the
// Media Session API — which we wire to the SAME pause/resume/stop the panel uses,
// so the phone's own controls really control the reader.
//
// HONEST LIMITS (DR-0076 — say what is not proven):
//   • Android / Chromium (Darrell's device, Samsung Internet, Chrome): this is
//     the path that works — audio session + media notification.
//   • iOS Safari suspends Web Speech when the tab leaves the foreground even
//     with an audio element playing. A CLONED-voice read (a real audio clip)
//     does continue there; a device-voice read on iOS may not. Not claimed.
//   • Nothing here can survive the tab being CLOSED — background means
//     backgrounded, not terminated.
//
// Everything is null-safe and injectable (win / makeAudio), so it unit-tests in
// plain Node with no browser at all.
// =============================================================================

/** base64 for a byte array, in either a browser (btoa) or Node (Buffer). */
function toBase64(bytes) {
  if (typeof btoa === 'function') {
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }
  if (typeof Buffer !== 'undefined') return Buffer.from(bytes).toString('base64');
  return '';
}

/**
 * A valid, genuinely SILENT looping WAV as a data: URI — no network fetch, no
 * asset to deploy, no cache to miss. 8-bit unsigned PCM silence is the value
 * 128, so the file is silence by construction, not by volume.
 */
export function silentWavDataUri(seconds = 0.5, sampleRate = 8000) {
  const frames = Math.max(1, Math.round(seconds * sampleRate));
  const bytes = new Uint8Array(44 + frames);
  const ascii = (at, s) => { for (let i = 0; i < s.length; i++) bytes[at + i] = s.charCodeAt(i); };
  const u32 = (at, n) => { bytes[at] = n & 255; bytes[at + 1] = (n >> 8) & 255; bytes[at + 2] = (n >> 16) & 255; bytes[at + 3] = (n >> 24) & 255; };
  const u16 = (at, n) => { bytes[at] = n & 255; bytes[at + 1] = (n >> 8) & 255; };
  ascii(0, 'RIFF'); u32(4, 36 + frames); ascii(8, 'WAVE');
  ascii(12, 'fmt '); u32(16, 16); u16(20, 1); u16(22, 1);
  u32(24, sampleRate); u32(28, sampleRate); u16(32, 1); u16(34, 8);
  ascii(36, 'data'); u32(40, frames);
  bytes.fill(128, 44); // 8-bit unsigned silence
  return `data:audio/wav;base64,${toBase64(bytes)}`;
}

/**
 * The background-audio session for one reader.
 *
 * start()   — begin (or keep) the silent loop. MUST be called inside the user's
 *             tap, like any other play(): autoplay policy blocks it otherwise.
 * stop()    — release the session (reading ended / was stopped).
 * describe()— what the phone's lock screen shows for this reading.
 * onControl()— wire the OS media buttons to the reader's own controls.
 * setState()— tell the OS whether we are playing or paused.
 *
 * @param {object} [opts]
 * @param {Window} [opts.win]        injected for tests
 * @param {Function} [opts.makeAudio] injected element factory for tests
 */
export function createBackgroundAudio({ win, makeAudio, uri } = {}) {
  const w = win || (typeof window !== 'undefined' ? window : null);
  const src = uri || silentWavDataUri();
  let el = null;
  let handlers = {};

  const mediaSession = () => {
    try {
      const nav = w && w.navigator;
      return nav && nav.mediaSession ? nav.mediaSession : null;
    } catch (_) { return null; }
  };

  const build = () => {
    if (el) return el;
    try {
      el = makeAudio ? makeAudio(src) : (w && typeof w.Audio === 'function' ? new w.Audio(src) : null);
    } catch (_) { el = null; }
    if (!el) return null;
    el.loop = true;
    // A silent file needs no volume ducking; leaving it at 1 keeps the audio
    // session unambiguous to the OS (a muted element can be treated as silent
    // and dropped). The FILE is the silence.
    try { el.setAttribute && el.setAttribute('playsinline', ''); } catch (_) { /* not fatal */ }
    return el;
  };

  const api = {
    /** True while the keep-alive session is held. */
    get active() { return !!el && el.paused === false; },

    start() {
      const a = build();
      if (!a) return false;
      try {
        const p = a.play();
        // A rejected play() means the tap window was lost — the read still
        // happens, it just won't survive backgrounding. Never throw into a read.
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } catch (_) { return false; }
      return true;
    },

    stop() {
      if (el) { try { el.pause(); } catch (_) { /* ignore */ } }
      const ms = mediaSession();
      if (ms) {
        try { ms.playbackState = 'none'; } catch (_) { /* ignore */ }
        try { ms.metadata = null; } catch (_) { /* ignore */ }
      }
      return true;
    },

    /** What the lock screen / notification says is playing. */
    describe({ title, artist = 'PoeTech · Read Aloud', album = '' } = {}) {
      const ms = mediaSession();
      if (!ms || !w || typeof w.MediaMetadata !== 'function') return false;
      try {
        ms.metadata = new w.MediaMetadata({ title: String(title || 'Reading'), artist, album });
        return true;
      } catch (_) { return false; }
    },

    /** Wire the OS transport buttons to the reader's real controls. */
    onControl({ onPlay, onPause, onStop } = {}) {
      handlers = { onPlay, onPause, onStop };
      const ms = mediaSession();
      if (!ms || typeof ms.setActionHandler !== 'function') return false;
      const safe = (fn) => (typeof fn === 'function' ? () => { try { fn(); } catch (_) { /* a handler error never kills the session */ } } : null);
      try {
        ms.setActionHandler('play', safe(handlers.onPlay));
        ms.setActionHandler('pause', safe(handlers.onPause));
        ms.setActionHandler('stop', safe(handlers.onStop));
      } catch (_) { return false; }
      return true;
    },

    /** 'playing' | 'paused' | 'none' — keeps the OS control in step with ours. */
    setState(state) {
      const ms = mediaSession();
      if (!ms) return false;
      try { ms.playbackState = state; return true; } catch (_) { return false; }
    },
  };
  return api;
}
