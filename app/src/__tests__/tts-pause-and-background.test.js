// @vitest-environment node
// =============================================================================
// The reader's PAUSE / CONTINUE and its BACKGROUND survival (DR-0285)
// =============================================================================
// Two reports from Darrell's phone, 2026-08-10:
//   • "the pause and continue doesn't work" — root cause: Android does not
//     honor speechSynthesis.pause(); the voice talks through it, and resume()
//     on a synth that was never really paused does nothing. Trusting the
//     platform WAS the bug.
//   • "let the reader continue after leaving the app" — Chrome parks the synth
//     when the document hides, so a backgrounded read goes silent.
//
// Proven-to-catch: the pause tests fail against the old implementation (which
// called synth.pause() and re-spoke nothing on resume), and the background
// tests fail against an engine with no keep-playing watchdog at all.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createBrowserTTS } from '../lib/tts.js';

class FakeUtterance {
  constructor(t) { this.text = t; this.rate = 1; this.pitch = 1; this.voice = null; }
}

// A synth that behaves like ANDROID: pause() is accepted and ignored (the real
// bug), cancel() is honored, speaking/pending are reported.
function androidSynth() {
  return {
    paused: false, speaking: false, pending: false, spoken: [],
    // A real engine reports onstart when audio begins; without it the engine's
    // silent-tap watchdog would (correctly) fire and muddy these assertions.
    speak(u) { this.spoken.push(u); this._cur = u; this.speaking = true; if (u.onstart) u.onstart(); },
    cancel() { const c = this._cur; this._cur = null; this.speaking = false; if (c && c.onerror) c.onerror({ error: 'interrupted' }); },
    pause() { /* Android: accepted, does nothing — the voice keeps talking */ },
    resume() { this.paused = false; },
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

describe('pause / continue — held by us, not by the platform', () => {
  it('PAUSE actually stops the voice on a device that ignores pause() — it cancels', () => {
    const synth = androidSynth();
    const e = engineWith(synth, makeDoc());
    e.load('One. Two. Three.');
    e.play();
    expect(synth.speaking).toBe(true);
    e.pause();
    expect(e.status).toBe('paused');
    expect(synth.speaking).toBe(false); // the whole point: the voice really stopped
  });

  it('CONTINUE speaks again from the sentence you paused in — not silence, not the top', () => {
    const synth = androidSynth();
    const e = engineWith(synth, makeDoc());
    e.load('One. Two. Three.');
    e.play();
    synth.spoken[0].onend();            // now speaking sentence 2
    expect(synth.spoken[1].text).toBe('Two.');
    e.pause();
    const beforeContinue = synth.spoken.length;
    e.resume();
    expect(e.status).toBe('playing');
    expect(synth.spoken.length).toBe(beforeContinue + 1); // it really spoke again
    expect(synth.spoken[synth.spoken.length - 1].text).toBe('Two.'); // same sentence
  });

  it('continuing un-suspends a parked synth first (Chrome’s stuck-paused state)', () => {
    const synth = androidSynth();
    synth.paused = true;
    const e = engineWith(synth, makeDoc());
    e.load('One. Two.');
    e.play();
    e.pause();
    e.resume();
    expect(synth.paused).toBe(false);
  });

  it('the cancelled utterance can never advance the reading behind our back', () => {
    const synth = androidSynth();
    const e = engineWith(synth, makeDoc());
    e.load('One. Two. Three.');
    e.play();
    const first = synth.spoken[0];
    e.pause();
    first.onend && first.onend();   // the interrupted utterance's late callback
    e.resume();
    expect(synth.spoken[synth.spoken.length - 1].text).toBe('One.'); // still sentence 1
  });

  it('a speed change made while paused is heard when you continue', () => {
    const synth = androidSynth();
    const e = engineWith(synth, makeDoc());
    e.load('One. Two.');
    e.play();
    e.pause();
    e.setRate(2.0);
    e.resume();
    expect(synth.spoken[synth.spoken.length - 1].rate).toBe(2.0);
  });

  it('pause on an idle reader, and continue on one that was never paused, do nothing', () => {
    const synth = androidSynth();
    const e = engineWith(synth, makeDoc());
    e.load('One.');
    e.resume();
    expect(synth.spoken.length).toBe(0);
    e.pause();
    expect(e.status).toBe('idle');
  });
});

describe('background — the reading survives leaving the app', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('a synth parked by the browser while the page is hidden is put back to playing', () => {
    const synth = androidSynth();
    const doc = makeDoc();
    const e = engineWith(synth, doc);
    e.load('One. Two.');
    e.play();
    doc.hidden = true;
    synth.paused = true;      // Chrome parks the synth on hide
    doc.fire('visibilitychange');
    expect(synth.paused).toBe(false);
  });

  it('a read the OS dropped entirely while hidden is re-spoken — after two silent ticks, not one', () => {
    const synth = androidSynth();
    const doc = makeDoc();
    const e = engineWith(synth, doc);
    e.load('One. Two.');
    e.play();
    const spokenAtStart = synth.spoken.length;
    doc.hidden = true;
    synth.speaking = false; synth.pending = false; // the utterance was dropped
    vi.advanceTimersByTime(2000);
    expect(synth.spoken.length).toBe(spokenAtStart); // one quiet tick is not proof
    vi.advanceTimersByTime(2000);
    expect(synth.spoken.length).toBe(spokenAtStart + 1); // two is
  });

  it('a normal gap between sentences while hidden is NOT treated as a stall', () => {
    const synth = androidSynth();
    const doc = makeDoc();
    const e = engineWith(synth, doc);
    e.load('One. Two.');
    e.play();
    doc.hidden = true;
    synth.speaking = false; synth.pending = true; // next utterance queued
    vi.advanceTimersByTime(6000);
    expect(synth.spoken.length).toBe(1);
  });

  it('a reading the USER paused is never resumed behind their back', () => {
    const synth = androidSynth();
    const doc = makeDoc();
    const e = engineWith(synth, doc);
    e.load('One. Two.');
    e.play();
    e.pause();
    doc.hidden = true;
    synth.paused = true;
    doc.fire('visibilitychange');
    vi.advanceTimersByTime(10000);
    expect(e.status).toBe('paused');
    expect(synth.paused).toBe(true); // still paused — we did not override the user
  });

  it('the watchdog is released when the reading ends — no ticker outlives the read', () => {
    const synth = androidSynth();
    const doc = makeDoc();
    const e = engineWith(synth, doc);
    e.load('One.');
    e.play();
    expect(e._bgTimer).not.toBe(null);
    synth.spoken[0].onend();  // reading completes
    expect(e.status).toBe('idle');
    expect(e._bgTimer).toBe(null);
  });

  it('never touches the synth while the page is VISIBLE', () => {
    const synth = androidSynth();
    const doc = makeDoc();
    const e = engineWith(synth, doc);
    e.load('One. Two.');
    e.play();
    synth.speaking = false; synth.pending = false; // visible: not our business
    vi.advanceTimersByTime(10000);
    expect(synth.spoken.length).toBe(1);
  });
});
