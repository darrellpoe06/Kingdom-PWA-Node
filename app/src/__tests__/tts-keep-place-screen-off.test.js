// @vitest-environment node
// =============================================================================
// The reader KEEPS ITS PLACE when the phone screen goes off (DR-0285 follow-up)
// =============================================================================
// Darrell 2026-08-29, from the phone: "The lessons lose their place and start
// from the beginning if and when the cellphone screen goes off... we want this
// to work in the background if users want that... I do!!!!"
//
// Root cause, characterized: Android suspends the SPEECH ENGINE while the screen
// is off (the silent audio session keeps the PAGE alive, not the synth). The
// current segment gets dropped, and the START WATCHDOG — whose timer was frozen
// while off and fires late on screen-on — found the utterance silent and
// declared FAILURE, resetting idx to 0 (idle). That reset is the "started from
// the beginning." The fix: (1) the watchdog never fails or resets position while
// the page is hidden; (2) on the hidden->visible return, the CURRENT segment is
// re-spoken — position held, never the top.
//
// Proven-to-catch: both tests below FAIL against the pre-fix engine (the watchdog
// reset idx=0/idle while hidden, and there was no foreground-return recovery, so
// the read stayed dead after screen-on).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createBrowserTTS } from '../lib/tts.js';

class FakeUtterance {
  constructor(t) { this.text = t; this.rate = 1; this.pitch = 1; this.voice = null; }
}

// Android-like: speak() starts audio and fires onstart; cancel() is honored.
function androidSynth() {
  return {
    paused: false, speaking: false, pending: false, spoken: [],
    speak(u) { this.spoken.push(u); this._cur = u; this.speaking = true; if (u.onstart) u.onstart(); },
    cancel() { const c = this._cur; this._cur = null; this.speaking = false; if (c && c.onerror) c.onerror({ error: 'interrupted' }); },
    pause() { /* Android ignores pause() */ },
    resume() { this.paused = false; },
    getVoices() { return []; },
  };
}

// A synth SUSPENDED by the OS: it accepts speak() but never actually starts
// (no onstart, speaking stays false) — exactly what Android does to Web Speech
// while the screen is off.
function suspendedSynth() {
  return {
    paused: false, speaking: false, pending: false, spoken: [],
    speak(u) { this.spoken.push(u); this._cur = u; /* suspended: no onstart, no audio */ },
    cancel() { const c = this._cur; this._cur = null; this.speaking = false; if (c && c.onerror) c.onerror({ error: 'interrupted' }); },
    pause() {}, resume() { this.paused = false; },
    getVoices() { return []; },
  };
}

function makeDoc() {
  const listeners = {};
  return {
    hidden: false,
    addEventListener: (n, fn) => { (listeners[n] = listeners[n] || []).push(fn); },
    removeEventListener: (n, fn) => { listeners[n] = (listeners[n] || []).filter((f) => f !== fn); },
    fire: (n) => (listeners[n] || []).forEach((f) => f()),
  };
}

function engineWith(synth, doc) {
  return createBrowserTTS({ synth, Utterance: FakeUtterance, onState: () => {}, prefs: { rate: 1 }, doc });
}

describe('screen-off never loses the place', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('the start watchdog does NOT fail or reset to the top while the page is hidden', () => {
    const synth = suspendedSynth(); // the segment can never start (screen off)
    const doc = makeDoc();
    const e = engineWith(synth, doc);
    e.load('One. Two.');
    e.play();
    doc.hidden = true;
    doc.fire('visibilitychange');
    // Let the full watchdog window (and its retry cycle) elapse. Pre-fix, this is
    // exactly when idx was reset to 0 and status flipped to idle/failed.
    vi.advanceTimersByTime(5000);
    expect(e.status).toBe('playing'); // pre-fix: 'idle'
    expect(e.failed).toBe(false);     // pre-fix: true
  });

  it('coming back on-screen resumes the SAME sentence — not the beginning', () => {
    const synth = androidSynth();
    const doc = makeDoc();
    const e = engineWith(synth, doc);
    e.load('One. Two. Three.');
    e.play();
    synth.spoken[0].onend();          // advanced to sentence 2 ('Two.'), idx = 1
    expect(e.idx).toBe(1);
    // Screen goes off; the OS drops the in-flight utterance.
    synth.speaking = false; synth.pending = false;
    doc.hidden = true;
    doc.fire('visibilitychange');
    // Screen comes back on.
    doc.hidden = false;
    doc.fire('visibilitychange');
    expect(e.status).toBe('playing');
    expect(e.idx).toBe(1);            // position HELD — pre-fix it had reset to 0
    expect(synth.spoken[synth.spoken.length - 1].text).toBe('Two.'); // same sentence, not 'One.'
  });

  it('a read that survived backgrounding is NOT re-spoken on return (no double audio)', () => {
    const synth = androidSynth();
    const doc = makeDoc();
    const e = engineWith(synth, doc);
    e.load('One. Two.');
    e.play();
    doc.hidden = true; doc.fire('visibilitychange');
    const spokenWhileHidden = synth.spoken.length;
    // Audio kept going (speaking stays true) — nothing was dropped.
    doc.hidden = false; doc.fire('visibilitychange');
    expect(synth.spoken.length).toBe(spokenWhileHidden); // did not re-speak on top of live audio
  });

  it('a user-paused read is not resumed on screen-on', () => {
    const synth = androidSynth();
    const doc = makeDoc();
    const e = engineWith(synth, doc);
    e.load('One. Two.');
    e.play();
    e.pause();
    doc.hidden = true; doc.fire('visibilitychange');
    doc.hidden = false; doc.fire('visibilitychange');
    expect(e.status).toBe('paused'); // returning on-screen never un-pauses the user
  });
});
