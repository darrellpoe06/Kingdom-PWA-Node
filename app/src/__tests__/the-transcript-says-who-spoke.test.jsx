// =============================================================================
// THE TRANSCRIPT SAYS WHO SPOKE (DR-0706)
// =============================================================================
// Darrell 2026-09-30: "Differentiate between speakers... Bishop Gwin is BG...
// Darrell Poe is DP..." / "Make sure our process can tell who's talking moving
// forward". The NAS writes a marked transcript (speaker_turns.py, pinned in
// test_speaker_turns.py); this pins the shape the app reads, and that "Your
// lessons" shows each turn with its label, and an unmarked one as before.
import { describe, it, expect, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { speakerLines, transcriptSpeakers, transcriptWords } from '../lib/lesson-inbox.js';
import { TranscriptWords } from '../components/LessonInbox.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// The exact body lesson_voice_transcribe.py writes when the speakers are marked.
const MARKED = [
  'Lesson. A spoken lesson, transcribed by Whisper (small) on the NAS CPU, 18:54. These are the words as Whisper heard them.',
  'Speakers: marked by voice on our own machine. BG = Bishop Gwin; DP = Darrell Poe. S1 = a voice not yet named.',
  'S1 = Janelle (Bishop Gwin called them by name just before they spoke).',
  '',
  'BG: Number four, God defines success. Janelle.',
  'S1: I was going to say the new chancellor wanted to be a good ancestor.',
  'DP: I\'m actually in technology.',
].join('\n');
const UNMARKED = 'Lesson. A spoken lesson, transcribed by Whisper (small) on the NAS CPU. These are the words as Whisper heard them.\nSpeakers: not marked. Whisper does not tell voices apart, so who spoke is read from the recording\'s context and the sender\'s own account.\n\nNumber four.\nAmen.';

let host;
afterEach(() => { if (host) { host.remove(); host = null; } });
function render(el) {
  host = document.createElement('div');
  document.body.appendChild(host);
  act(() => { createRoot(host).render(el); });
  return host;
}

describe('the shape the app reads', () => {
  it('a marked transcript splits into labelled turns, and its header is kept', () => {
    const words = transcriptWords(MARKED);
    expect(speakerLines(words).map((t) => t.who)).toEqual(['BG', 'S1', 'DP']);
    expect(transcriptSpeakers(MARKED)).toContain('BG = Bishop Gwin; DP = Darrell Poe.');
    expect(transcriptSpeakers(MARKED)).toContain('S1 = Janelle');
  });

  it('PROVEN-TO-CATCH: an unmarked transcript, or one bad line, is never half-parsed into turns', () => {
    expect(speakerLines(transcriptWords(UNMARKED))).toBeNull();
    expect(speakerLines('BG: Amen.\nBishop said: hello')).toBeNull();
    expect(transcriptWords(UNMARKED)).toBe('Number four.\nAmen.');
  });
});

describe('"Your lessons" shows who spoke', () => {
  it('each turn carries its label', () => {
    const el = render(<TranscriptWords words={transcriptWords(MARKED)} speakers={transcriptSpeakers(MARKED)} />);
    const turns = [...el.querySelectorAll('[data-testid="lesson-turn"]')].map((p) => p.textContent);
    expect(turns[0]).toBe('BG Number four, God defines success. Janelle.');
    expect(turns[2]).toBe('DP I\'m actually in technology.');
    expect(el.querySelector('[data-testid="lesson-speakers"]').textContent).toContain('Darrell Poe');
  });

  it('an unmarked transcript reads as its words, as before', () => {
    const el = render(<TranscriptWords words={transcriptWords(UNMARKED)} speakers={transcriptSpeakers(UNMARKED)} />);
    expect(el.querySelector('[data-testid="lesson-words"]').textContent).toBe('Number four.\nAmen.');
    expect(el.querySelector('[data-testid="lesson-turn"]')).toBeNull();
  });
});
