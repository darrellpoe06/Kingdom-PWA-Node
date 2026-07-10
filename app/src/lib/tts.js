// =============================================================================
// tts — one reusable READ-ALOUD (text-to-speech) primitive for the whole app
// =============================================================================
// The HEAR half of the see/hear accessibility pair (its sibling is the
// large-print primitive in lib/text-size.js — some members need to SEE bigger
// text, some need to HEAR it; both ship, neither replaces the other). Built for
// The Church of the Living God — the largest African American community in
// Champaign-Urbana, with elderly, tech-novice members (COMMUNITY-FIRST-MISSION)
// — so anyone can conduct business even without reading the screen.
//
// Provider: the browser Web Speech API (free, built-in, no per-character cost),
// wrapped behind a small engine so a premium/sovereign provider can be swapped in
// later without touching feature code (UX-PATTERNS Pattern 2 / ITTSProvider).
//
// -----------------------------------------------------------------------------
// WHY THIS REPLACES THE OLD INLINE TTS — the speed bug, root-caused
// -----------------------------------------------------------------------------
// The Web Speech API binds utterance.rate when the utterance STARTS; mutating it
// mid-speech does nothing. The old control tried to work around that by
// cancelling + restarting on a speed change, BUT it called a stale closure that
// still held the OLD rate (setRate is async; the captured restart fn read the
// previous render's `rate`). So playback restarted at the SAME speed while the
// button highlight moved — "adjusting speed seems like the same speed."
//
// The structural fix: SEGMENT the text (one short utterance per sentence) and
// keep the live rate in the engine (a ref, not a render closure). A rate change
// re-speaks the CURRENT segment at the new rate — so the change is AUDIBLE
// immediately and resumes from where the listener was, not from the top.
// Segmenting also sidesteps two real cross-browser bugs for free:
//   • Chrome's ~15s / ~200-word silent cutoff on long utterances.
//   • iOS Safari truncating long utterances.
// Short utterances chained via onend keep all browsers (Chrome, Samsung
// Internet, iOS Safari) playing reliably and make pause/stop dependable.
//
// Persistence is PER DEVICE in localStorage (process-don't-store default), like
// text size, so a member sets speed + voice ONCE on their own phone. Unsupported
// environments degrade gracefully — every public function is null-safe and the
// hook reports `supported: false` rather than throwing (unbreakable).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const STORAGE_KEY = 'poe-tts-prefs';

export const MIN_RATE = 0.5;
export const MAX_RATE = 3.0;
export const DEFAULT_RATE = 1.0;
export const DEFAULT_PITCH = 1.0;

// Sentinel voiceURI meaning "DON'T pick a specific voice — use the phone/OS default
// TTS voice." On Android the web Speech API often exposes only a limited (female)
// voice set, but the system default (which the user CAN set to male in Android
// Settings → Text-to-speech) comes through when we leave utterance.voice unset. So
// this option exists to STOP us overriding the OS default. (speechSynthesis has no
// real voice with this URI, so it resolves to the OS default either way; the named
// constant makes the intent explicit instead of relying on "unfindable → default".)
export const PHONE_DEFAULT_VOICE = '__phone_default__';

// How long to wait for speech to ACTUALLY start before treating the tap as a
// silent miss. Mobile browsers (iOS Safari, Chrome/Android) can accept a speak()
// and then never start it — the synth was suspended, voices weren't ready, or the
// user-gesture window was lost. We give it a beat, kick it once, and if it is still
// silent we surface an honest failure instead of leaving a dead, quiet button.
const START_WATCHDOG_MS = 1400;

// Big, plain-language speed steps for non-technical readers — a SLOWER option
// (the old control had none) plus normal and faster. Slider-free on purpose:
// large tap targets beat a fiddly 0.1x slider for an elderly reader.
export const RATE_STEPS = [
  { value: 0.7, label: '0.7×', name: 'Slower' },
  { value: 1.0, label: '1×',   name: 'Normal' },
  { value: 1.5, label: '1.5×', name: 'Faster' },
  { value: 2.0, label: '2×',   name: 'Fast' },
  { value: 2.5, label: '2.5×', name: 'Fastest' },
];

/** Clamp any rate into the supported range. Non-numbers fall back to Normal. */
export function clampRate(r) {
  const n = Number(r);
  if (!Number.isFinite(n)) return DEFAULT_RATE;
  return Math.min(MAX_RATE, Math.max(MIN_RATE, n));
}

/** True only when this environment can actually speak. Never throws. */
export function isTTSSupported(win = (typeof window !== 'undefined' ? window : undefined)) {
  return !!(win && typeof win.speechSynthesis !== 'undefined'
    && typeof win.SpeechSynthesisUtterance === 'function');
}

/**
 * Wait (briefly) for the device voice list to populate. Mobile engines fill
 * getVoices() a beat after load — a read started inside that window resolves NO
 * voice and falls to the raw OS default (a top "my voice never worked" cause,
 * DR-0138). Resolves with the voices found, or [] at the timeout — the caller
 * proceeds either way, so this can only help, never hang a read. Pure enough to
 * test with a mock synth.
 */
export function waitForVoices(synth, { timeoutMs = 1200, stepMs = 100 } = {}) {
  return new Promise((resolve) => {
    let got;
    try { got = synth.getVoices() || []; } catch (_) { got = []; }
    if (got.length) { resolve(got); return; }
    let waited = 0;
    const timer = setInterval(() => {
      waited += stepMs;
      let v;
      try { v = synth.getVoices() || []; } catch (_) { v = []; }
      if (v.length || waited >= timeoutMs) { clearInterval(timer); resolve(v); }
    }, stepMs);
  });
}

/**
 * Split text into short, sentence-sized segments. Pure + unit-tested. Each
 * segment becomes its own utterance so (a) a rate change can restart the CURRENT
 * segment at the new speed, and (b) we avoid Chrome's long-utterance cutoff and
 * iOS truncation. Sentences over `maxLen` are word-wrapped so no single utterance
 * is too long. Whitespace is collapsed; empties dropped.
 */
export function segmentText(text, maxLen = 180) {
  if (text == null) return [];
  const clean = String(text).replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  // Sentence enders kept with their sentence; fall back to the whole string.
  const sentences = clean.match(/[^.!?]+[.!?]*/g) || [clean];
  const out = [];
  for (const raw of sentences) {
    const s = raw.trim();
    if (!s) continue;
    if (s.length <= maxLen) { out.push(s); continue; }
    // Long sentence — wrap on word boundaries so no utterance exceeds maxLen.
    let buf = '';
    for (const w of s.split(' ')) {
      if (buf && buf.length + 1 + w.length > maxLen) { out.push(buf); buf = w; }
      else buf = buf ? `${buf} ${w}` : w;
    }
    if (buf) out.push(buf);
  }
  return out;
}

/**
 * Pick the most NATURAL-sounding English voice available on this device. Honors
 * a saved choice first; otherwise ranks known high-quality engines (Natural /
 * Neural / Online / Google / Siri / Enhanced / Premium), then a local en-US
 * voice, then any English voice, then the first voice. Returns a voice object or
 * null when none exist. Pure + testable.
 */
export function pickDefaultVoice(voices, savedURI) {
  const list = Array.isArray(voices) ? voices : [];
  if (!list.length) return null;
  if (savedURI) {
    const saved = list.find((v) => v && v.voiceURI === savedURI);
    if (saved) return saved;
  }
  const en = list.filter((v) => v && typeof v.lang === 'string' && /^en/i.test(v.lang));
  const pool = en.length ? en : list;
  const NATURAL = /natural|neural|online|google|siri|enhanced|premium|wavenet/i;
  const score = (v) => {
    let s = 0;
    if (NATURAL.test(v.name || '') || NATURAL.test(v.voiceURI || '')) s += 4;
    if (/^en[-_]?US/i.test(v.lang || '')) s += 2;
    if (v.localService) s += 1; // local = no network, more reliable
    return s;
  };
  return [...pool].sort((a, b) => score(b) - score(a))[0] || null;
}

/** Read saved per-device prefs. voiceURI === null means "not chosen yet". Never throws. */
export function loadTTSPrefs(store = (typeof localStorage !== 'undefined' ? localStorage : undefined)) {
  const fallback = { rate: DEFAULT_RATE, pitch: DEFAULT_PITCH, voiceURI: null };
  try {
    const raw = store && store.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const p = JSON.parse(raw);
    return {
      rate: clampRate(p && p.rate),
      pitch: Number.isFinite(Number(p && p.pitch)) ? Number(p.pitch) : DEFAULT_PITCH,
      voiceURI: p && typeof p.voiceURI === 'string' ? p.voiceURI : null,
    };
  } catch (e) {
    return fallback; // bad JSON / private mode — fall back, never crash
  }
}

/** Persist per-device prefs. Never throws. */
export function saveTTSPrefs(prefs, store = (typeof localStorage !== 'undefined' ? localStorage : undefined)) {
  try {
    if (store) store.setItem(STORAGE_KEY, JSON.stringify({
      rate: clampRate(prefs && prefs.rate),
      pitch: Number.isFinite(Number(prefs && prefs.pitch)) ? Number(prefs.pitch) : DEFAULT_PITCH,
      voiceURI: prefs && typeof prefs.voiceURI === 'string' ? prefs.voiceURI : null,
    }));
  } catch (e) { /* private mode / quota — non-fatal, prefs still apply this session */ }
}

/**
 * The browser TTS engine. Speaks segmented text via a chained sequence of short
 * utterances and keeps live rate/pitch/voice so a change applies to the CURRENT
 * segment immediately. Globals are injected so it is fully unit-testable with a
 * fake synth. `onState` fires whenever observable state changes.
 *
 * A monotonic generation token guards every utterance callback: cancelling or
 * restarting bumps the token, so the synth's interrupt-driven onend/onerror for
 * a superseded utterance can never auto-advance or double-speak.
 */
export function createBrowserTTS({ synth, Utterance, onState, prefs } = {}) {
  const p = prefs || {};
  const engine = {
    synth,
    Utterance,
    onState: typeof onState === 'function' ? onState : () => {},
    segments: [],
    idx: 0,
    rate: clampRate(p.rate),
    pitch: Number.isFinite(Number(p.pitch)) ? Number(p.pitch) : DEFAULT_PITCH,
    voice: null,
    status: 'idle', // 'idle' | 'playing' | 'paused'
    failed: false,  // last play() produced no audio at all (surfaced to the UI)
    _gen: 0,
    _dirty: false, // a rate/voice change happened while paused → re-speak on resume
    _started: false, // the current segment's onstart fired (real audio began)
    _retried: false, // we've already kicked-and-retried a silent start this playback
    _watch: null,    // start-watchdog timer id

    _clearWatch() {
      if (this._watch != null && typeof clearTimeout === 'function') {
        try { clearTimeout(this._watch); } catch (_) { /* ignore */ }
      }
      this._watch = null;
    },

    _emit() {
      this.onState({
        status: this.status,
        rate: this.rate,
        pitch: this.pitch,
        voiceURI: this.voice ? this.voice.voiceURI : null,
        segmentIndex: this.idx,
        segmentCount: this.segments.length,
        failed: this.failed,
      });
    },

    _speakSegment() {
      const gen = ++this._gen;
      this._clearWatch();
      const seg = this.segments[this.idx];
      if (seg == null) { this._finish(); return; }
      const u = new this.Utterance(seg);
      u.rate = clampRate(this.rate);
      u.pitch = this.pitch;
      if (this.voice) u.voice = this.voice;
      this._started = false;
      u.onstart = () => {
        if (gen !== this._gen) return;
        this._started = true;       // real audio began — the watchdog can stand down
        this.failed = false;
        this._clearWatch();
      };
      u.onend = () => {
        if (gen !== this._gen) return;            // superseded — ignore
        this._clearWatch();
        this.idx += 1;
        if (this.status === 'playing' && this.idx < this.segments.length) this._speakSegment();
        else if (this.idx >= this.segments.length) this._finish();
      };
      u.onerror = (e) => {
        if (gen !== this._gen) return;
        // interrupted/canceled are the NORMAL result of our own cancel() — ignore.
        const err = e && e.error;
        if (err === 'interrupted' || err === 'canceled') return;
        this._clearWatch();
        this._finish();
      };
      // Retain the live utterance on the engine. Chrome/Android garbage-collect an
      // utterance that has no JS reference WHILE it is speaking, which silently cuts
      // playback off (or never starts it) — a real "the button does nothing" cause.
      this._u = u;
      try { this.synth.speak(u); } catch (_) { this._finish(); return; }
      // Chrome can start the synth in a PAUSED state (and pauses it when the tab is
      // backgrounded); a resume() kick shortly after speak un-sticks it without any
      // audible stutter. No-op when already actively playing. Guarded for the fake
      // synth used in unit tests.
      if (typeof this.synth.resume === 'function' && typeof setTimeout === 'function') {
        setTimeout(() => { try { if (this.status === 'playing') this.synth.resume(); } catch (_) { /* ignore */ } }, 120);
      }
      // START WATCHDOG (the "never a silent button" guarantee). If onstart has not
      // fired AND the synth is not actually speaking after a beat, the tap produced
      // no audio (mobile suspended-synth / voices-not-ready / lost gesture). Kick
      // once via resume()+re-speak; if it is STILL silent, surface a real failure so
      // the UI can tell the user instead of sitting quiet. Gated on a synth that
      // exposes `speaking` so the simple unit-test fakes are unaffected.
      if (typeof setTimeout === 'function' && this.synth && ('speaking' in this.synth)) {
        this._watch = setTimeout(() => {
          if (gen !== this._gen || this.status !== 'playing' || this._started) return;
          let isSpeaking = false;
          try { isSpeaking = !!this.synth.speaking; } catch (_) { /* ignore */ }
          if (isSpeaking) return; // it did start; we just never got an onstart event
          if (!this._retried) {
            this._retried = true;
            try { if (typeof this.synth.resume === 'function') this.synth.resume(); } catch (_) { /* ignore */ }
            this._restartCurrent();
            return;
          }
          // Truly silent after a retry — report it. Never a dead, silent button.
          this._clearWatch();
          this.failed = true;
          this.status = 'idle';
          this.idx = 0;
          this._emit();
        }, START_WATCHDOG_MS);
      }
      this._emit();
    },

    _restartCurrent() {
      // Apply a live rate/voice change: drop the in-flight utterance and re-speak
      // the CURRENT segment (not the top) at the new settings.
      try { this.synth.cancel(); } catch (_) { /* ignore */ }
      this._speakSegment();
    },

    _finish() {
      this._clearWatch();
      this.status = 'idle';
      this.idx = 0;
      this._dirty = false;
      this._emit();
    },

    /** Load text to read; resets position. Does not start playback. */
    load(text) {
      this.segments = segmentText(text);
      this.idx = 0;
      return this.segments.length;
    },

    /** Speak the loaded text from the start. */
    play() {
      if (!this.segments.length) return;
      // Only cancel when the synth is actually busy. A bare cancel() immediately
      // before the FIRST speak() is swallowed by Chrome (cancel is async and races
      // the speak) — the classic "tap Read, nothing happens." Guarding the cancel
      // lets a fresh start speak immediately.
      try {
        if (this.synth.speaking || this.synth.pending || this.synth.paused) this.synth.cancel();
      } catch (_) { /* ignore */ }
      // IN THE GESTURE: iOS/Android can hold the synth suspended after page load or a
      // backgrounding; a resume()+voices touch here (while we still have the user's
      // tap) is what makes the FIRST speak actually start. No-op when already active.
      try { if (typeof this.synth.resume === 'function') this.synth.resume(); } catch (_) { /* ignore */ }
      try { if (typeof this.synth.getVoices === 'function') this.synth.getVoices(); } catch (_) { /* ignore */ }
      this.idx = 0;
      this.status = 'playing';
      this._dirty = false;
      this.failed = false;
      this._retried = false;
      this._speakSegment();
    },

    pause() {
      if (this.status !== 'playing') return;
      this._clearWatch();
      try { this.synth.pause(); } catch (_) { /* ignore */ }
      this.status = 'paused';
      this._emit();
    },

    resume() {
      if (this.status !== 'paused') return;
      this.status = 'playing';
      if (this._dirty) {
        // A rate/voice change landed while paused — re-speak the current segment
        // so the new setting is heard (native resume can't change rate, and mobile
        // resume is unreliable anyway).
        this._dirty = false;
        this._restartCurrent();
      } else {
        try { this.synth.resume(); } catch (_) { /* ignore */ }
        this._emit();
      }
    },

    stop() {
      try { this.synth.cancel(); } catch (_) { /* ignore */ }
      this._gen += 1; // invalidate any pending callbacks
      this._finish();
    },

    setRate(r) {
      this.rate = clampRate(r);
      if (this.status === 'playing') this._restartCurrent();
      else { if (this.status === 'paused') this._dirty = true; this._emit(); }
    },

    setPitch(pitch) {
      const n = Number(pitch);
      this.pitch = Number.isFinite(n) ? n : DEFAULT_PITCH;
      if (this.status === 'playing') this._restartCurrent();
      else { if (this.status === 'paused') this._dirty = true; this._emit(); }
    },

    setVoice(voice) {
      this.voice = voice || null;
      if (this.status === 'playing') this._restartCurrent();
      else { if (this.status === 'paused') this._dirty = true; this._emit(); }
    },
  };
  return engine;
}

/**
 * React glue. Returns the live state + plain controls. The engine lives in a ref
 * (created once) so callbacks never go stale. Voices load async — the hook wires
 * `voiceschanged` and resolves the saved/most-natural default once they arrive.
 * On an unsupported device it returns `supported: false` and no-op controls, so a
 * caller can render nothing (or a quiet note) without any guard of its own.
 */
export function useTextToSpeech() {
  const supported = useMemo(() => isTTSSupported(), []);
  const [prefs, setPrefs] = useState(() => loadTTSPrefs());
  const [voices, setVoices] = useState([]);
  const [state, setState] = useState({ status: 'idle', rate: prefs.rate, pitch: prefs.pitch, voiceURI: prefs.voiceURI, segmentIndex: 0, segmentCount: 0, failed: false });
  const engineRef = useRef(null);

  // Create the engine once, on a supported device.
  if (supported && !engineRef.current && typeof window !== 'undefined') {
    engineRef.current = createBrowserTTS({
      synth: window.speechSynthesis,
      Utterance: window.SpeechSynthesisUtterance,
      onState: setState,
      prefs,
    });
  }

  // Enumerate voices (async on most browsers) and keep them fresh.
  useEffect(() => {
    if (!supported) return undefined;
    const synth = window.speechSynthesis;
    const refresh = () => setVoices(synth.getVoices() || []);
    refresh();
    if ('onvoiceschanged' in synth) synth.onvoiceschanged = refresh;
    synth.addEventListener && synth.addEventListener('voiceschanged', refresh);
    // Some mobile engines (Android Chrome, iOS Safari) populate getVoices() a beat
    // AFTER load WITHOUT firing voiceschanged — so a one-shot read leaves the list
    // empty and a male/female pick can't resolve (falls back to the default voice).
    // Poll briefly until voices appear so the assignment + picker have the FULL list.
    let tries = 0;
    let poll = null;
    if (typeof setInterval === 'function' && !(synth.getVoices() || []).length) {
      poll = setInterval(() => {
        tries += 1;
        const v = synth.getVoices() || [];
        if (v.length) { setVoices(v); if (poll) { clearInterval(poll); poll = null; } }
        else if (tries >= 12 && poll) { clearInterval(poll); poll = null; }
      }, 250);
    }
    return () => {
      if (poll) clearInterval(poll);
      synth.removeEventListener && synth.removeEventListener('voiceschanged', refresh);
      if (synth.onvoiceschanged === refresh) synth.onvoiceschanged = null;
    };
  }, [supported]);

  // Once voices exist, resolve the active voice: saved choice, else most natural.
  // Persist a first-run natural pick so the choice is stable across sessions.
  useEffect(() => {
    if (!supported || !engineRef.current || !voices.length) return;
    const chosen = pickDefaultVoice(voices, prefs.voiceURI);
    engineRef.current.setVoice(chosen);
    if (prefs.voiceURI == null && chosen) {
      const next = { ...prefs, voiceURI: chosen.voiceURI };
      saveTTSPrefs(next);
      setPrefs(next);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supported, voices]);

  // Cancel any speech if the component using the hook unmounts.
  useEffect(() => {
    return () => { if (supported && engineRef.current) engineRef.current.stop(); };
  }, [supported]);

  // speak(text) uses the engine's current voice. speak(text, voiceURI) speaks THIS
  // utterance in a specific device voice WITHOUT persisting it as the saved default —
  // this is how a gendered stand-in (a male system voice for a male person, a
  // different voice per person) is honored per-play without clobbering the user's
  // chosen browser-voice pref. Passing voiceURI null/'' forces the device default.
  // speak(text, voiceURI, pitch) additionally speaks at a per-read PITCH — the
  // prosody diversifier for devices whose voice list is one-female-voice-only
  // (DR-0143 follow-through: a man reads low, two people read distinct, on ANY
  // device). Transient: the next pitch-less speak reverts to the saved pref.
  const speak = useCallback((text, voiceURI, pitch) => {
    const eng = engineRef.current;
    if (!eng) return;
    if (voiceURI !== undefined) {
      // null / '' / the phone-default sentinel → leave utterance.voice unset so the
      // browser uses the OS default voice (the Android male path). Otherwise resolve
      // the specific device voice by URI.
      const useDefault = !voiceURI || voiceURI === PHONE_DEFAULT_VOICE;
      const v = useDefault
        ? null
        : ((window.speechSynthesis.getVoices() || []).find((x) => x.voiceURI === voiceURI) || null);
      eng.setVoice(v); // transient — does not touch saved prefs
    }
    eng.pitch = Number.isFinite(Number(pitch))
      ? Number(pitch)
      : (Number.isFinite(Number(prefs.pitch)) ? Number(prefs.pitch) : DEFAULT_PITCH);
    eng.load(text);
    eng.play();
  }, [prefs.pitch]);

  const pause = useCallback(() => { engineRef.current && engineRef.current.pause(); }, []);
  const resume = useCallback(() => { engineRef.current && engineRef.current.resume(); }, []);
  const stop = useCallback(() => { engineRef.current && engineRef.current.stop(); }, []);

  const setRate = useCallback((r) => {
    const eng = engineRef.current;
    if (!eng) return;
    eng.setRate(r);
    setPrefs((prev) => { const next = { ...prev, rate: clampRate(r) }; saveTTSPrefs(next); return next; });
  }, []);

  const setVoiceURI = useCallback((uri) => {
    const eng = engineRef.current;
    if (!eng) return;
    const v = (window.speechSynthesis.getVoices() || []).find((x) => x.voiceURI === uri) || null;
    eng.setVoice(v);
    setPrefs((prev) => { const next = { ...prev, voiceURI: v ? v.voiceURI : '' }; saveTTSPrefs(next); return next; });
  }, []);

  return {
    supported,
    status: state.status,
    isReading: state.status !== 'idle',
    isPaused: state.status === 'paused',
    // True when the last Read produced no audio at all (mobile blocked/suspended) —
    // the caller shows an honest retry hint instead of a dead, silent button.
    failed: !!state.failed,
    rate: prefs.rate,
    voices,
    voiceURI: state.voiceURI != null ? state.voiceURI : prefs.voiceURI,
    // Which sentence is being spoken right now — lets a caller highlight-as-it-reads
    // (the segments are deterministic via segmentText, so the caller can map index
    // -> sentence without the engine handing back the text).
    segmentIndex: state.segmentIndex || 0,
    segmentCount: state.segmentCount || 0,
    speak, pause, resume, stop, setRate, setVoiceURI,
  };
}
