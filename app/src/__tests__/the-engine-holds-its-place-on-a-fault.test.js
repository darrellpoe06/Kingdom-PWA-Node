// =============================================================================
// The device voice holds its place on a fault — it does not end the lesson
// =============================================================================
// Darrell 2026-10-27: "Not one stone lesson will not play all the way through
// the lesson!!! the tts or reader is worse than ever!!! Fix it so it actually
// works great!!!" Measured in lib/tts.js: an utterance error other than
// interrupted/canceled called _finish() — status idle, position back to 0 —
// the very state change a lesson read to its end makes. The control took it
// as "the piece ended on its own" and moved to the next piece. One
// 'synthesis-failed' at sentence 80 of 266 and the rest was never heard.
//
// Now a faulted sentence is spoken again once (ERROR_RETRY_MS later); a
// second fault HOLDS the reading on that sentence: status idle, position
// kept, `heldAt` and `heldWhy` reported, so the control neither moves on nor
// calls the lesson finished, and the next play goes on from the bookmark.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createBrowserTTS, ERROR_RETRY_MS } from '../lib/tts.js';

class FakeUtterance {
  constructor(t) { this.text = t; this.rate = 1; this.pitch = 1; this.voice = null; this.onstart = null; this.onend = null; this.onerror = null; }
}
function makeSynth() {
  const spoken = [];
  return {
    paused: false, speaking: false, pending: false, spoken,
    speak(u) { spoken.push(u); this._cur = u; this.speaking = true; if (u.onstart) u.onstart(); },
    cancel() { const c = this._cur; this._cur = null; this.speaking = false; if (c && c.onerror) c.onerror({ error: 'interrupted' }); },
    pause() { this.paused = true; },
    resume() { this.paused = false; },
    getVoices() { return []; },
  };
}
const TEXT = 'First sentence here. Second sentence here. Third sentence here. Fourth sentence here.';

describe('the device voice holds its place on a fault', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('a faulted sentence is spoken again once; a second fault holds the reading there, position kept, and says so', () => {
    const synth = makeSynth();
    const states = [];
    const engine = createBrowserTTS({ synth, Utterance: FakeUtterance, onState: (s) => states.push(s), prefs: {}, doc: null });
    engine.load(TEXT);
    engine.play();
    expect(synth.spoken.length).toBe(1);
    synth.spoken[0].onend();                       // sentence 1 ends cleanly
    expect(engine.status).toBe('playing');
    const at = engine.idx;
    expect(at).toBeGreaterThan(0);
    const second = synth.spoken[synth.spoken.length - 1];
    second.onerror({ error: 'synthesis-failed' }); // the engine hiccups mid-lesson
    expect(engine.status, 'a fault is not the end').toBe('playing');
    vi.advanceTimersByTime(ERROR_RETRY_MS + 1);
    const again = synth.spoken[synth.spoken.length - 1];
    expect(again, 'the same sentence is spoken again').not.toBe(second);
    expect(again.text).toBe(second.text);
    expect(engine.idx).toBe(at);
    again.onerror({ error: 'synthesis-failed' }); // and fails again
    expect(engine.status).toBe('idle');
    expect(engine.idx, 'the position is HELD, never reset to the top (proven-to-catch: _finish() set it to 0)').toBe(at);
    expect(engine.heldAt).toBe(at);
    expect(engine.heldWhy).toBe('synthesis-failed');
    const last = states[states.length - 1];
    expect(last.status).toBe('idle');
    expect(last.heldAt).toBe(at);
    expect(last.heldWhy).toBe('synthesis-failed');
    expect(last.segmentIndex).toBe(at);
    // Play again clears the hold.
    engine.play();
    expect(engine.heldAt).toBe(null);
    expect(engine.status).toBe('playing');
  });

  it('interrupted and canceled are still our own cancel, not faults', () => {
    const synth = makeSynth();
    const engine = createBrowserTTS({ synth, Utterance: FakeUtterance, onState: () => {}, prefs: {}, doc: null });
    engine.load(TEXT);
    engine.play();
    synth.spoken[0].onerror({ error: 'interrupted' });
    expect(engine.status).toBe('playing');
    expect(engine.heldAt).toBe(null);
    synth.spoken[0].onerror({ error: 'canceled' });
    expect(engine.status).toBe('playing');
  });

  it('a clean end gives the next fault its own retry; a reading that ends normally reports no hold', () => {
    const synth = makeSynth();
    const engine = createBrowserTTS({ synth, Utterance: FakeUtterance, onState: () => {}, prefs: {}, doc: null });
    engine.load(TEXT);
    engine.play();
    synth.spoken[synth.spoken.length - 1].onerror({ error: 'audio-busy' });
    vi.advanceTimersByTime(ERROR_RETRY_MS + 1);
    synth.spoken[synth.spoken.length - 1].onend();          // the retry succeeded and ended cleanly
    expect(engine.status).toBe('playing');
    synth.spoken[synth.spoken.length - 1].onerror({ error: 'audio-busy' }); // a later sentence faults
    vi.advanceTimersByTime(ERROR_RETRY_MS + 1);
    expect(engine.status, 'retried again, not held at once').toBe('playing');
    // Read the rest to the end.
    for (let guard = 0; guard < 20 && engine.status === 'playing'; guard += 1) synth.spoken[synth.spoken.length - 1].onend();
    expect(engine.status).toBe('idle');
    expect(engine.heldAt).toBe(null);
    expect(engine.idx).toBe(0);
  });
});
