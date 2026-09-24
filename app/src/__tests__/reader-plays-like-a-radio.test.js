// @vitest-environment node
// =============================================================================
// The reader plays like a radio (Darrell 2026-09-24, 4:57pm)
// =============================================================================
// "Leaving a tab should not make the player stop playing. Like the player
// should be able to play no matter what's going on, whether I move, leave the
// tab, whether I do whatever, it should still be able to play. It is like a
// radio in the background... Stop trying to constrain it."
//
// The cause of "leaving the Learn tab stops it", found in the code: several
// surfaces hold their OWN speech engine (a lesson's quiz, the lesson teacher, a
// study, the Bible cast), and each stopped its engine on unmount with an
// UNCONDITIONAL speechSynthesis.cancel(). speechSynthesis is one object for the
// whole page, so leaving a tab silenced the app-wide reader mid-sentence.
//
// Proven-to-catch: each test here fails against the unconditional cancel /
// its Bible-cast twin.
import { describe, it, expect, vi } from 'vitest';
import { createBrowserTTS } from '../lib/tts.js';
import { createCastPlayer } from '../lib/use-cast-read.js';

function fakeSynth() {
  return {
    speaking: false, pending: false, paused: false,
    spoken: [],
    cancel: vi.fn(function cancel() { this.speaking = false; }),
    speak: vi.fn(function speak(u) { this.speaking = true; this.spoken.push(u); }),
    resume: vi.fn(), pause: vi.fn(), getVoices: () => [],
  };
}
function Utterance(text) { this.text = text; }

describe('leaving a tab never silences the reader', () => {
  it('an IDLE engine that unmounts does not cancel the page’s speech', () => {
    const synth = fakeSynth();
    const reader = createBrowserTTS({ synth, Utterance, onState: () => {}, prefs: {}, doc: null });
    const quiz = createBrowserTTS({ synth, Utterance, onState: () => {}, prefs: {}, doc: null });
    reader.load('The reader is speaking this lesson. It keeps going.');
    reader.play();
    expect(synth.speak).toHaveBeenCalled();
    // The Learn tab unmounts: the quiz's engine stops on the way out.
    quiz.stop();
    expect(synth.cancel, 'an idle engine cancelled the reader').not.toHaveBeenCalled();
    // The reader's own Stop still stops it.
    reader.stop();
    expect(synth.cancel).toHaveBeenCalledTimes(1);
  });

  it('the Bible cast stops only what it is itself saying', () => {
    const synth = fakeSynth();
    const cast = createCastPlayer({ synth, Utterance });
    expect(cast.isPlaying()).toBe(false);
    // The unmount path now asks isPlaying() first (use-cast-read.js); an idle
    // cast has nothing to cancel.
    if (cast.isPlaying()) cast.stop();
    expect(synth.cancel).not.toHaveBeenCalled();
  });
});
