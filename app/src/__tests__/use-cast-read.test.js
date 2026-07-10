// @vitest-environment node
//
// use-cast-read — the dramatized-reading PLAYER (Darrell 2026-07-04; hardened
// per DR-0138). Proves the injectable engine speaks SEQUENTIALLY (one utterance
// in flight, the next from onend — never bulk-queued, which iOS truncates),
// segments long lines, casts each speaker's voice, cancels only when the synth
// is actually busy (the "tap Read, nothing happens" race fix), survives a bad
// line via onerror, and supersedes cleanly on stop()/a new play(). The synth +
// Utterance are mocked so all of it verifies without a browser.
import { describe, it, expect } from 'vitest';
import { createCastPlayer } from '../lib/use-cast-read.js';
import { buildCast, castVoiceURI } from '../lib/scripture-voice-cast.js';

// A mock speech engine that records utterances and fires onend synchronously,
// so the whole chain "plays" instantly. `speaking` is settable to simulate a
// busy synth for the cancel-guard assertions.
function mockSynth() {
  const spoken = [];
  let canceled = 0;
  return {
    spoken,
    speaking: false,
    pending: false,
    canceledCount: () => canceled,
    cancel() { canceled += 1; },
    resume() { /* the Chrome paused-start kick — a no-op here */ },
    speak(u) { spoken.push(u); if (typeof u.onend === 'function') u.onend(); },
  };
}
class MockUtterance {
  constructor(text) { this.text = text; this.voice = null; this.onend = null; this.onerror = null; }
}

const DEVICE = [
  { name: 'Daniel', voiceURI: 'd', lang: 'en-GB' },
  { name: 'Alex', voiceURI: 'a', lang: 'en-US' },
  { name: 'Samantha', voiceURI: 's', lang: 'en-US' },
  { name: 'Google US English', voiceURI: 'g', lang: 'en-US' },
];
const assignments = buildCast(DEVICE);
const voiceForKey = (key) => {
  const uri = castVoiceURI(assignments, key);
  return uri ? DEVICE.find((v) => v.voiceURI === uri) || null : null;
};

describe('the dramatized player speaks each line in its speaker voice, sequentially', () => {
  it('speaks every line in order (trimmed), casting characters and leaving narrator default', () => {
    const synth = mockSynth();
    const player = createCastPlayer({ synth, Utterance: MockUtterance });
    let done = false;
    const script = [
      { ref: 'Matthew 4:3', voice: 'narrator', text: 'And when the tempter came to him, he said, ' },
      { ref: 'Matthew 4:3', voice: 'adversary', text: 'If thou be the Son of God, command that these stones be made bread.' },
      { ref: 'Matthew 4:4', voice: 'jesus', text: 'It is written, Man shall not live by bread alone...' },
    ];
    player.play(script, voiceForKey, () => { done = true; });
    expect(synth.spoken.map((u) => u.text)).toEqual(script.map((l) => l.text.trim()));
    expect(synth.spoken[0].voice).toBeNull();            // narrator: reader's default
    expect(synth.spoken[1].voice).toBeTruthy();          // the adversary is cast
    expect(synth.spoken[2].voice).toBeTruthy();          // Jesus is cast
    expect(synth.spoken[2].voice.voiceURI).not.toBe(synth.spoken[1].voice.voiceURI);
    expect(done).toBe(true);
    expect(player.isPlaying()).toBe(false);
  });

  it('the WOMEN are cast to female voices, distinct from the men (DR-0138)', () => {
    const synth = mockSynth();
    const player = createCastPlayer({ synth, Utterance: MockUtterance });
    player.play([
      { ref: 'Luke 1:38', voice: 'mary', text: 'Behold the handmaid of the Lord; be it unto me according to thy word.' },
      { ref: 'John 14:6', voice: 'jesus', text: 'I am the way, the truth, and the life.' },
    ], voiceForKey);
    expect(synth.spoken[0].voice).toBeTruthy();          // Mary is cast, not default
    expect(synth.spoken[0].voice.voiceURI).not.toBe(synth.spoken[1].voice.voiceURI); // she differs from Jesus
  });

  it('segments a long line so no single utterance exceeds the engine cutoff, all in the same voice', () => {
    const synth = mockSynth();
    const player = createCastPlayer({ synth, Utterance: MockUtterance });
    const long = Array.from({ length: 40 }, () => 'and the word continued without a sentence break').join(' ');
    player.play([{ voice: 'jesus', text: long }], voiceForKey);
    expect(synth.spoken.length).toBeGreaterThan(1);       // segmented, never one giant utterance
    for (const u of synth.spoken) {
      expect(u.text.length).toBeLessThanOrEqual(180);
      expect(u.voice && u.voice.voiceURI).toBe(synth.spoken[0].voice.voiceURI); // voice held across segments
    }
  });

  it('cancels ONLY when the synth is busy — never a bare pre-cancel (the tap race fix)', () => {
    const synth = mockSynth();
    const player = createCastPlayer({ synth, Utterance: MockUtterance });
    player.play([{ voice: 'jesus', text: 'I am the way' }], voiceForKey);
    expect(synth.canceledCount()).toBe(0);                // idle synth: no swallowed first speak
    synth.speaking = true;                                // now simulate a busy synth
    player.play([{ voice: 'jesus', text: 'the truth' }], voiceForKey);
    expect(synth.canceledCount()).toBe(1);                // busy: the prior read is cancelled
  });

  it('a line whose speak() throws advances to the next line instead of dying silently', () => {
    const synth = mockSynth();
    let first = true;
    const throwingSpeak = synth.speak.bind(synth);
    synth.speak = (u) => { if (first) { first = false; throw new Error('engine hiccup'); } throwingSpeak(u); };
    const player = createCastPlayer({ synth, Utterance: MockUtterance });
    let done = false;
    player.play([{ voice: 'jesus', text: 'line one' }, { voice: 'jesus', text: 'line two' }], voiceForKey, () => { done = true; });
    expect(synth.spoken.map((u) => u.text)).toEqual(['line two']); // the reading survived
    expect(done).toBe(true);
  });

  it('an empty script finishes immediately; stop() halts and cancels', () => {
    const synth = mockSynth();
    const player = createCastPlayer({ synth, Utterance: MockUtterance });
    let done = false;
    player.play([], voiceForKey, () => { done = true; });
    expect(done).toBe(true);
    player.stop();
    expect(synth.canceledCount()).toBe(1);
    expect(player.isPlaying()).toBe(false);
  });
});

describe('the PROSODY diversifier — distinct speakers on a one-female-voice device (2026-07-10 Android report)', () => {
  const FEMALE_ONLY = [{ name: 'Google US English Female', voiceURI: 'gf', lang: 'en-US' }];
  it('Jesus reads LOW and Mary reads bright on the same single female voice — never the same sound', async () => {
    const { buildCast: bc, castPitch } = await import('../lib/scripture-voice-cast.js');
    const a = bc(FEMALE_ONLY);
    const jesus = castPitch(a, 'jesus');
    const mary = castPitch(a, 'mary');
    expect(jesus).toBeLessThan(0.9);        // a man is male-ified by pitch
    expect(mary).toBeGreaterThanOrEqual(1); // a woman stays bright
    expect(jesus).not.toBe(mary);
  });
  it('two MEN colliding on the one voice get distinct pitches (Jesus vs the Father)', async () => {
    const { buildCast: bc, castPitch } = await import('../lib/scripture-voice-cast.js');
    const a = bc(FEMALE_ONLY);
    expect(castPitch(a, 'jesus')).not.toBe(castPitch(a, 'father'));
  });
  it('the narrator always reads at the reader’s neutral pitch', async () => {
    const { buildCast: bc, castPitch } = await import('../lib/scripture-voice-cast.js');
    expect(castPitch(bc(FEMALE_ONLY), 'narrator')).toBe(1);
  });
  it('with a REAL male voice available, matched men stay at neutral pitch (the voice carries identity)', async () => {
    const { buildCast: bc, castPitch } = await import('../lib/scripture-voice-cast.js');
    const a = bc([
      { name: 'Daniel', voiceURI: 'd', lang: 'en-GB' },
      { name: 'Alex', voiceURI: 'a', lang: 'en-US' },
      { name: 'Samantha', voiceURI: 's', lang: 'en-US' },
    ]);
    expect(castPitch(a, 'jesus')).toBe(1); // matched male voice — no pitch shift needed
  });
  it('the player APPLIES the pitch to each utterance', () => {
    const synth = mockSynth();
    const player = createCastPlayer({ synth, Utterance: MockUtterance });
    player.play(
      [{ voice: 'jesus', text: 'I am the way' }],
      () => ({ voice: DEVICE[2], pitch: 0.7 }),
    );
    expect(synth.spoken[0].pitch).toBe(0.7);
    expect(synth.spoken[0].voice).toBe(DEVICE[2]);
  });
});
