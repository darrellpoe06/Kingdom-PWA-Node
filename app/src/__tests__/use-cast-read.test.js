// @vitest-environment node
//
// use-cast-read — the dramatized-reading PLAYER (Darrell 2026-07-04). Proves the
// injectable engine queues one utterance per script line, in order, each in its
// speaker's assigned voice, and that stop()/a new play() supersede cleanly. The
// synth + Utterance are mocked, so the queueing + voice assignment are verified
// without a browser.
import { describe, it, expect } from 'vitest';
import { createCastPlayer } from '../lib/use-cast-read.js';
import { buildCast, castVoiceURI } from '../lib/scripture-voice-cast.js';

// A mock speech engine that records utterances and fires onend synchronously, so
// the whole queue "plays" instantly in the test.
function mockSynth() {
  const spoken = [];
  let canceled = 0;
  return {
    spoken,
    canceledCount: () => canceled,
    cancel() { canceled += 1; },
    speak(u) { spoken.push(u); if (typeof u.onend === 'function') u.onend(); },
  };
}
class MockUtterance {
  constructor(text) { this.text = text; this.voice = null; this.onend = null; }
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

describe('the dramatized player queues each line in its speaker voice', () => {
  it('speaks every line in order, casting characters and leaving narrator default', () => {
    const synth = mockSynth();
    const player = createCastPlayer({ synth, Utterance: MockUtterance });
    let done = false;
    const script = [
      { ref: 'Matthew 4:3', voice: 'narrator', text: 'And when the tempter came to him, he said, ' },
      { ref: 'Matthew 4:3', voice: 'adversary', text: 'If thou be the Son of God, command that these stones be made bread.' },
      { ref: 'Matthew 4:4', voice: 'jesus', text: 'It is written, Man shall not live by bread alone...' },
    ];
    player.play(script, voiceForKey, () => { done = true; });
    // one utterance per line, in order
    expect(synth.spoken.map((u) => u.text)).toEqual(script.map((l) => l.text));
    // the narrator line has no forced voice; the character lines do
    expect(synth.spoken[0].voice).toBeNull();
    expect(synth.spoken[1].voice).toBeTruthy();          // the adversary is cast
    expect(synth.spoken[2].voice).toBeTruthy();          // Jesus is cast
    // Jesus (male) and the tempter get real device voices, and they differ
    expect(synth.spoken[2].voice.voiceURI).not.toBe(synth.spoken[1].voice.voiceURI);
    expect(done).toBe(true);                              // onDone fired after the last line
    expect(player.isPlaying()).toBe(false);
  });

  it('a fresh play() cancels the prior queue; empty script finishes immediately', () => {
    const synth = mockSynth();
    const player = createCastPlayer({ synth, Utterance: MockUtterance });
    player.play([{ voice: 'jesus', text: 'I am the way' }], voiceForKey);
    player.play([{ voice: 'jesus', text: 'the truth' }], voiceForKey);
    expect(synth.canceledCount()).toBeGreaterThanOrEqual(2);   // cancel before each play
    let done = false;
    player.play([], voiceForKey, () => { done = true; });
    expect(done).toBe(true);
    expect(player.isPlaying()).toBe(false);
  });

  it('stop() halts playback and cancels the engine', () => {
    const synth = mockSynth();
    const player = createCastPlayer({ synth, Utterance: MockUtterance });
    player.stop();
    expect(synth.canceledCount()).toBe(1);
    expect(player.isPlaying()).toBe(false);
  });
});
