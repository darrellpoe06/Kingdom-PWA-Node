// @vitest-environment node
//
// Read-aloud playback hardening — proven-to-catch for the real-device "tap Read,
// nothing happens" failures, plus the sovereign voice-service safety default.
import { describe, it, expect, vi } from 'vitest';
import { createBrowserTTS } from '../lib/tts.js';
import { isVoiceServiceReady, synthesizeSpeech, voiceServiceUrl } from '../lib/voice-service.js';

class FakeUtterance {
  constructor(t) { this.text = t; this.rate = 1; this.pitch = 1; this.voice = null; this.onend = null; this.onerror = null; }
}

// A synth that tracks `speaking` and records whether cancel() was called, so we can
// assert the cancel-eats-the-first-speak guard.
function makeSynth({ speaking = false } = {}) {
  const calls = { cancel: 0, speak: 0 };
  return {
    speaking, pending: false, paused: false,
    spoken: [],
    speak(u) { calls.speak++; this.spoken.push(u); this.speaking = true; this._cur = u; },
    cancel() { calls.cancel++; const c = this._cur; this._cur = null; this.speaking = false; if (c && c.onerror) c.onerror({ error: 'interrupted' }); },
    pause() { this.paused = true; },
    resume() { this.paused = false; },
    getVoices() { return []; },
    _calls: calls,
  };
}

describe('play() cancel-guard — the "tap Read, nothing happens" fix', () => {
  it('does NOT cancel before the FIRST speak when the synth is idle', () => {
    const synth = makeSynth({ speaking: false });
    const eng = createBrowserTTS({ synth, Utterance: FakeUtterance, onState: () => {} });
    eng.load('Hello there. Friend.');
    eng.play();
    // The bare cancel() before a fresh speak is what Chrome swallows — guard means
    // zero cancels on a cold start, and the utterance actually gets spoken.
    expect(synth._calls.cancel).toBe(0);
    expect(synth._calls.speak).toBe(1);
    expect(synth.spoken[0].text).toBe('Hello there.');
  });

  it('DOES cancel first when the synth is already speaking (interrupt a prior read)', () => {
    const synth = makeSynth({ speaking: true });
    const eng = createBrowserTTS({ synth, Utterance: FakeUtterance, onState: () => {} });
    eng.load('New text.');
    eng.play();
    expect(synth._calls.cancel).toBe(1);
    expect(synth.spoken[synth.spoken.length - 1].text).toBe('New text.');
  });
});

describe('utterance is retained (anti garbage-collection silence)', () => {
  it('keeps a live reference to the current utterance on the engine', () => {
    const synth = makeSynth();
    const eng = createBrowserTTS({ synth, Utterance: FakeUtterance, onState: () => {} });
    eng.load('One. Two.');
    eng.play();
    expect(eng._u).toBe(synth.spoken[0]); // retained → not GC'd mid-speech
  });
});

describe('engine still reports segment position for highlight-as-it-reads', () => {
  it('emits segmentIndex/segmentCount as it advances', () => {
    const states = [];
    const synth = makeSynth();
    const eng = createBrowserTTS({ synth, Utterance: FakeUtterance, onState: (s) => states.push(s) });
    eng.load('A. B.');
    eng.play();
    expect(states[states.length - 1].segmentCount).toBe(2);
    expect(states[states.length - 1].segmentIndex).toBe(0);
    synth.spoken[0].onend();
    expect(states[states.length - 1].segmentIndex).toBe(1);
  });
});

describe('sovereign voice-service — inert and SAFE by default', () => {
  it('reports not-ready when no endpoint is configured', () => {
    expect(voiceServiceUrl()).toBe('');
    expect(isVoiceServiceReady()).toBe(false);
  });
  it('synthesizeSpeech refuses (never throws) when the studio is not configured', async () => {
    const r = await synthesizeSpeech({ text: 'hello', voiceId: 'voice-dp', personKey: 'darrell' });
    expect(r.error).toBe('voice-service-not-configured');
    expect(r.url).toBeUndefined();
  });
  it('does not fabricate audio for empty text', async () => {
    vi.stubEnv('VITE_VOICE_SERVICE_URL', 'http://localhost:9');
    const r = await synthesizeSpeech({ text: '   ' });
    expect(r.error).toBe('empty-text');
    vi.unstubAllEnvs();
  });
});
