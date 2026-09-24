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
//   • CORRECTED 2026-09-24. This header used to say Android / Chromium was
//     "the path that works". Darrell's own Android phone (Samsung, Chrome,
//     installed app) contradicted it: with the GPU studio offline the reader
//     used the phone's Web Speech voice, and switching apps STOPPED the
//     reading. This element keeps the PAGE alive; it does not keep Web Speech
//     speaking. What keeps playing in the background is a REAL AUDIO clip —
//     the studio's voice or the NAS's own voice (/voice-lite, lib/clip-queue.js)
//     — which the reader now prefers, and the panel says per voice which one
//     survives switching apps (TTSControl backgroundLine).
//   • iOS Safari suspends Web Speech the same way. An audio-clip read is the
//     path there too. Neither platform is claimed without a device test.
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
/** Every OS media action the reader answers, so release() can hand them all back. */
export const MEDIA_ACTIONS = ['play', 'pause', 'stop', 'nexttrack', 'previoustrack', 'seekforward', 'seekbackward'];

/** The app icon (app/public) for the car display and the lock-screen art. */
export const DEFAULT_ARTWORK = [
  { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
  { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
];

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
      // LET GO OF THE BUTTONS WHEN NOTHING IS READING (Darrell 2026-09-24:
      // "we can have it playing while others are listening to their own
      // stuff... options not locked either way"). A page that keeps its
      // media-key handlers after the reading ends can keep answering the
      // headset or the car, and the person's own music or podcast would lose
      // those buttons to a reader that is not even playing. Stop hands every
      // button back.
      api.release();
      return true;
    },

    /** Hand every OS media button back (no handler left on any action). */
    release() {
      handlers = {};
      const ms = mediaSession();
      if (!ms || typeof ms.setActionHandler !== 'function') return false;
      for (const action of MEDIA_ACTIONS) {
        try { ms.setActionHandler(action, null); } catch (_) { /* an action this browser does not know */ }
      }
      return true;
    },

    /** True while any OS button is wired to the reader. */
    get wired() { return Object.values(handlers).some((fn) => typeof fn === 'function'); },

    /**
     * What the lock screen, the notification, the headset app and the CAR'S
     * DISPLAY say is playing: title = the lesson, artist = PoeTech, album =
     * the course, artwork = the app icon.
     */
    describe({ title, artist = 'PoeTech', album = '', artwork = DEFAULT_ARTWORK } = {}) {
      const ms = mediaSession();
      if (!ms || !w || typeof w.MediaMetadata !== 'function') return false;
      try {
        ms.metadata = new w.MediaMetadata({ title: String(title || 'Reading'), artist, album: String(album || ''), artwork });
        return true;
      } catch (_) { return false; }
    },

    /**
     * Wire the OS transport buttons to the reader's real controls.
     *
     * NEXT AND PREVIOUS ARE THE CAR'S BUTTONS (Darrell 2026-09-24: "a popout
     * option for when you're driving and want to still push play pause etc").
     * Steering-wheel skip buttons (Bluetooth AVRCP) and a headset's double /
     * triple tap reach the page as 'nexttrack' / 'previoustrack'; some head
     * units send seek instead. All four go to the SAME paragraph steps as the
     * bar's forward and back buttons. Before this only play, pause and stop
     * were wired, and every skip button did nothing.
     *
     * Each action is set on its own: a browser that does not know one action
     * throws for that one only, and must not cost the others.
     */
    onControl({ onPlay, onPause, onStop, onNext, onPrev } = {}) {
      handlers = { onPlay, onPause, onStop, onNext, onPrev };
      const ms = mediaSession();
      if (!ms || typeof ms.setActionHandler !== 'function') return false;
      const safe = (fn) => (typeof fn === 'function' ? () => { try { fn(); } catch (_) { /* a handler error never kills the session */ } } : null);
      const wiring = {
        play: handlers.onPlay,
        pause: handlers.onPause,
        stop: handlers.onStop,
        nexttrack: handlers.onNext,
        previoustrack: handlers.onPrev,
        seekforward: handlers.onNext,
        seekbackward: handlers.onPrev,
      };
      let any = false;
      for (const action of MEDIA_ACTIONS) {
        try { ms.setActionHandler(action, safe(wiring[action])); any = true; } catch (_) { /* unsupported action */ }
      }
      return any;
    },

    /**
     * Where the reading is, for the progress bar on the lock screen or the
     * car display. The device voice has no clock, so the caller passes an
     * ESTIMATE; a missing or bad value clears the bar rather than painting a
     * wrong one.
     */
    setPosition({ duration, position, playbackRate = 1 } = {}) {
      const ms = mediaSession();
      if (!ms || typeof ms.setPositionState !== 'function') return false;
      try {
        const d = Number(duration);
        const p = Number(position);
        if (!(d > 0) || !(p >= 0)) { ms.setPositionState(); return false; }
        ms.setPositionState({ duration: d, position: Math.min(p, d), playbackRate: Number(playbackRate) > 0 ? Number(playbackRate) : 1 });
        return true;
      } catch (_) { return false; }
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
