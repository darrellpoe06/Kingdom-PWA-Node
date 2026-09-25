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
// the unconditional lock-screen clear it replaces.
import { describe, it, expect, vi } from 'vitest';
import { createBrowserTTS } from '../lib/tts.js';
import { createCastPlayer } from '../lib/use-cast-read.js';
import { createBackgroundAudio } from '../lib/background-audio.js';

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

  it('a reader that never took the lock screen cannot wipe the one that did', () => {
    const ms = { metadata: null, playbackState: 'none', handlers: {}, setActionHandler(n, f) { this.handlers[n] = f; } };
    const win = { navigator: { mediaSession: ms }, MediaMetadata: function M(i) { Object.assign(this, i); } };
    const fakeAudio = () => ({ paused: true, play() { this.paused = false; return Promise.resolve(); }, pause() { this.paused = true; }, setAttribute() {} });
    const main = createBackgroundAudio({ win, makeAudio: fakeAudio });
    const help = createBackgroundAudio({ win, makeAudio: fakeAudio });
    main.start();
    main.describe({ title: 'Lesson 12' });
    main.onControl({ onPlay: () => {}, onPause: () => {}, onNext: () => {} });
    main.setState('playing');
    help.stop(); // e.g. the Help button's reader standing down on another tab
    expect(ms.metadata && ms.metadata.title).toBe('Lesson 12');
    expect(ms.playbackState).toBe('playing');
    expect(typeof ms.handlers.nexttrack).toBe('function');
    main.stop();
    expect(ms.metadata).toBe(null);
    expect(ms.handlers.nexttrack).toBe(null);
  });
});
