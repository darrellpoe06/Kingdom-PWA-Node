// @vitest-environment node
//
// tts — the shared read-aloud primitive (lib/tts.js). Proven-to-catch (DR-0076):
// the headline test reproduces the EXACT shipped bug ("adjusting speed seems like
// the same speed") and asserts the fix — a speed change re-speaks the CURRENT
// segment at the NEW rate. It fails against the old stale-closure/old-rate
// behavior. Also locks segmentation, voice picking, prefs persistence, clamping,
// and graceful no-throw behavior.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  segmentText, clampRate, pickDefaultVoice, isTTSSupported,
  loadTTSPrefs, saveTTSPrefs, createBrowserTTS,
  RATE_STEPS, MIN_RATE, MAX_RATE, DEFAULT_RATE,
} from '../lib/tts.js';

// In-memory localStorage stand-in (Node test env has no DOM storage).
function makeStore() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), _map: m };
}

// Fake Web Speech globals so the engine is fully testable.
class FakeUtterance {
  constructor(t) { this.text = t; this.rate = 1; this.pitch = 1; this.voice = null; this.onend = null; this.onerror = null; }
}
function makeSynth() {
  const spoken = [];
  return {
    paused: false,
    spoken,
    speak(u) { spoken.push(u); this._cur = u; },
    cancel() { const c = this._cur; this._cur = null; if (c && c.onerror) c.onerror({ error: 'interrupted' }); },
    pause() { this.paused = true; },
    resume() { this.paused = false; },
    getVoices() { return []; },
  };
}
function makeEngine(prefs) {
  const synth = makeSynth();
  const engine = createBrowserTTS({ synth, Utterance: FakeUtterance, onState: () => {}, prefs });
  return { synth, engine };
}

describe('segmentText', () => {
  it('splits into sentence-sized segments and collapses whitespace', () => {
    expect(segmentText('First sentence here. Second sentence here.')).toEqual([
      'First sentence here.', 'Second sentence here.',
    ]);
    expect(segmentText('  lots   of\n\n  space  ')).toEqual(['lots of space']);
  });
  it('word-wraps an over-long sentence so no segment exceeds maxLen', () => {
    const long = Array.from({ length: 60 }, (_, i) => `word${i}`).join(' ') + '.';
    const segs = segmentText(long, 80);
    expect(segs.length).toBeGreaterThan(1);
    for (const s of segs) expect(s.length).toBeLessThanOrEqual(80);
    // Reassembling restores the words (the period rides the last word).
    expect(segs.join(' ').replace(/\./g, '')).toBe(long.replace(/\./g, ''));
  });
  it('is empty/safe for empty or null input', () => {
    expect(segmentText('')).toEqual([]);
    expect(segmentText(null)).toEqual([]);
    expect(segmentText('   ')).toEqual([]);
  });
});

describe('clampRate', () => {
  it('keeps in-range values and clamps out-of-range', () => {
    expect(clampRate(1.5)).toBe(1.5);
    expect(clampRate(99)).toBe(MAX_RATE);
    expect(clampRate(0.01)).toBe(MIN_RATE);
  });
  it('falls back to Normal for non-numbers', () => {
    expect(clampRate('abc')).toBe(DEFAULT_RATE);
    expect(clampRate(undefined)).toBe(DEFAULT_RATE);
  });
});

describe('RATE_STEPS', () => {
  it('offers a SLOWER option (the old control had none) plus normal and faster', () => {
    const values = RATE_STEPS.map((s) => s.value);
    expect(Math.min(...values)).toBeLessThan(1); // slower exists
    expect(values).toContain(1.0);               // normal exists
    expect(Math.max(...values)).toBeGreaterThan(1); // faster exists
  });
});

describe('pickDefaultVoice', () => {
  const voices = [
    { name: 'Old eSpeak', lang: 'en-GB', voiceURI: 'espeak', localService: true },
    { name: 'Google US English Natural', lang: 'en-US', voiceURI: 'google-natural', localService: false },
    { name: 'Spanish Voice', lang: 'es-ES', voiceURI: 'es', localService: true },
  ];
  it('prefers a natural-sounding English voice', () => {
    expect(pickDefaultVoice(voices, null).voiceURI).toBe('google-natural');
  });
  it('honors a valid saved choice over the heuristic', () => {
    expect(pickDefaultVoice(voices, 'espeak').voiceURI).toBe('espeak');
  });
  it('returns null when there are no voices', () => {
    expect(pickDefaultVoice([], null)).toBe(null);
  });
});

describe('prefs persistence', () => {
  let store;
  beforeEach(() => { store = makeStore(); });
  it('round-trips rate and voice', () => {
    saveTTSPrefs({ rate: 1.5, voiceURI: 'abc' }, store);
    const p = loadTTSPrefs(store);
    expect(p.rate).toBe(1.5);
    expect(p.voiceURI).toBe('abc');
  });
  it('defaults voiceURI to null (not chosen) when nothing saved', () => {
    expect(loadTTSPrefs(store).voiceURI).toBe(null);
    expect(loadTTSPrefs(store).rate).toBe(DEFAULT_RATE);
  });
  it('never throws on corrupt JSON or hostile storage', () => {
    store.setItem('poe-tts-prefs', '{not json');
    expect(() => loadTTSPrefs(store)).not.toThrow();
    expect(loadTTSPrefs(store).rate).toBe(DEFAULT_RATE);
    const hostile = { getItem: () => { throw new Error('x'); }, setItem: () => { throw new Error('x'); } };
    expect(() => saveTTSPrefs({ rate: 1 }, hostile)).not.toThrow();
    expect(loadTTSPrefs(hostile).rate).toBe(DEFAULT_RATE);
  });
});

describe('engine — live rate change (THE bug fix, proven-to-catch)', () => {
  it('re-speaks the CURRENT segment at the NEW rate while playing', () => {
    const { synth, engine } = makeEngine({ rate: 1.0 });
    engine.load('First sentence here. Second sentence here.');
    engine.play();
    expect(synth.spoken[0].text).toBe('First sentence here.');
    expect(synth.spoken[0].rate).toBe(1.0);

    // Advance to the SECOND segment (listener is partway through the page).
    synth.spoken[0].onend();
    expect(synth.spoken[1].text).toBe('Second sentence here.');
    expect(synth.spoken[1].rate).toBe(1.0);

    // User bumps speed mid-read. The fix: the change is heard immediately, on the
    // CURRENT segment, at the NEW rate — not silently kept at the old rate, and
    // not restarted from the top.
    engine.setRate(2.0);
    const last = synth.spoken[synth.spoken.length - 1];
    expect(last.rate).toBe(2.0);                       // NEW rate is applied (bug: stayed 1.0)
    expect(last.text).toBe('Second sentence here.');   // from current position, not the top
  });

  it('a stale utterance callback (post-cancel) never auto-advances', () => {
    const { synth, engine } = makeEngine({ rate: 1.0 });
    engine.load('A. B. C.');
    engine.play();
    const first = synth.spoken[0];
    engine.stop();                       // cancels; bumps generation
    const before = synth.spoken.length;
    first.onend && first.onend();        // late callback from the cancelled utterance
    expect(synth.spoken.length).toBe(before); // ignored — no extra speech
    expect(engine.status).toBe('idle');
  });

  it('chains segments to completion, then returns to idle', () => {
    const { synth, engine } = makeEngine({ rate: 1.0 });
    engine.load('One. Two.');
    engine.play();
    synth.spoken[0].onend();
    expect(engine.status).toBe('playing');
    synth.spoken[1].onend(); // last segment ends
    expect(engine.status).toBe('idle');
  });

  it('pause/resume changes status without throwing', () => {
    const { engine } = makeEngine({ rate: 1.0 });
    engine.load('One. Two.');
    engine.play();
    engine.pause();
    expect(engine.status).toBe('paused');
    engine.resume();
    expect(engine.status).toBe('playing');
  });

  it('setRate while idle stores the rate without speaking', () => {
    const { synth, engine } = makeEngine({ rate: 1.0 });
    engine.setRate(1.5);
    expect(engine.rate).toBe(1.5);
    expect(synth.spoken.length).toBe(0);
  });

  it('speaks each utterance in the assigned voice (the gendered stand-in override)', () => {
    // The fix for "every option sounds like the same default voice": the play path
    // sets a specific device voice per selection, and the engine must put THAT voice
    // on every spoken utterance. A male stand-in (e.g. Microsoft Mark) must reach the
    // utterance — not be dropped back to the default.
    const { synth, engine } = makeEngine({ rate: 1.0 });
    const male = { name: 'Microsoft Mark', voiceURI: 'mark', lang: 'en-US' };
    engine.setVoice(male);
    engine.load('First one. Second one.');
    engine.play();
    expect(synth.spoken[0].voice).toBe(male);
    synth.spoken[0].onend();                 // advance to the next segment
    expect(synth.spoken[1].voice).toBe(male); // every segment keeps the assigned voice
  });
});

describe('engine — start watchdog (silent tap, proven-to-catch)', () => {
  // Reproduces the mobile failure Darrell hit: the browser accepts speak() but never
  // actually starts audio (suspended synth / voices not ready / lost gesture). The
  // engine must KICK once and, if still silent, surface a failure — never a dead,
  // quiet button. These fakes expose `speaking` so the watchdog arms (it is gated on
  // a real-looking synth; the simpler fakes above are intentionally unaffected).
  it('kicks once then reports failure when no audio ever starts', () => {
    vi.useFakeTimers();
    const states = [];
    const synth = {
      speaking: false, pending: false, paused: false, _n: 0,
      speak() { this._n += 1; },          // accepts the utterance but never fires onstart
      cancel() {}, pause() {}, resume() {}, getVoices() { return []; },
    };
    const engine = createBrowserTTS({ synth, Utterance: FakeUtterance, onState: (s) => states.push(s), prefs: { rate: 1 } });
    engine.load('Hello there friend.');
    engine.play();
    expect(synth._n).toBe(1);             // first attempt
    vi.advanceTimersByTime(1500);         // watchdog #1 → resume()+re-speak the segment
    expect(synth._n).toBe(2);             // it retried rather than giving up immediately
    vi.advanceTimersByTime(1500);         // watchdog #2 → still silent → surface failure
    expect(engine.failed).toBe(true);
    expect(engine.status).toBe('idle');
    expect(states.some((s) => s.failed === true)).toBe(true);
    vi.clearAllTimers(); vi.useRealTimers();
  });

  it('does NOT report failure when the synth actually starts speaking', () => {
    vi.useFakeTimers();
    const states = [];
    const synth = {
      speaking: false, pending: false, paused: false,
      speak(u) { this.speaking = true; this._cur = u; }, // real start
      cancel() { this.speaking = false; }, pause() {}, resume() {}, getVoices() { return []; },
    };
    const engine = createBrowserTTS({ synth, Utterance: FakeUtterance, onState: (s) => states.push(s), prefs: { rate: 1 } });
    engine.load('Hello there friend.');
    engine.play();
    vi.advanceTimersByTime(3000);
    expect(engine.failed).toBe(false);
    expect(states.some((s) => s.failed === true)).toBe(false);
    vi.clearAllTimers(); vi.useRealTimers();
  });
});

describe('isTTSSupported', () => {
  it('false when speech APIs are absent, true when present', () => {
    expect(isTTSSupported({})).toBe(false);
    expect(isTTSSupported({ speechSynthesis: {}, SpeechSynthesisUtterance: function () {} })).toBe(true);
    expect(isTTSSupported(undefined)).toBe(false);
  });
});
