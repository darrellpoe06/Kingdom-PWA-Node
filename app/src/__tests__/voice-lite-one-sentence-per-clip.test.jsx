// @vitest-environment jsdom
// =============================================================================
// The NAS voice is handed one short piece at a time, and the highlight is the
// piece that is playing (DR-0653)
// =============================================================================
// Darrell 2026-09-24, on L191 in the NAS voice: "it reads however it loses the
// words and actually degrades into undetectable gibberish... after initially
// sounding like a man", and "The next would be highlighting a sentence before
// or after then its all down hill after the first like 15 - 30 seconds".
//
// Cause, measured on L191's own text: the pieces were glued back into up to
// 600 characters (27 of 28 pieces between 406 and 599), and Piper splits only
// at . ! ?, so a run of semicolon clauses (the 866-character summary) reached
// the model as one utterance and a VITS voice drifts into mush on long input.
// The highlight was a guess from the clip's clock spread evenly over 600
// characters, so it landed a sentence early or late.
//
// Proven-to-catch: the cap test fails on the old gluing (a 573-character
// piece); the alignment test fails if pieces stop being the reading segments;
// the highlight test fails on the old clock guess (it stays on sentence 1).
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { chunkForClips, PIECE_MAX, createClipQueue } from '../lib/clip-queue.js';
import { segmentText } from '../lib/tts.js';

// L191's summary sentence, verbatim from the lesson (866 characters, no full
// stop until the end): the exact input that turned to gibberish.
const L191_SUMMARY = "Son of God and King of Israel; the Son of man on whom heaven opens; the Anointed of Isaiah's scroll; the Messiah at the well; the Son of man who forgives sins; I am, before Abraham; the light of the world; one with the Father; equal with God, by His enemies' own reading; the Christ, the Son of the living God; the resurrection and the life; the Son of God who receives worship; the way, the truth and the life; the One who shows the Father; Master and Lord; the One from the Father come into the world; the One with glory before the world was; I am, in the garden; the Son of the Blessed and Daniel's Son of man; a King with a kingdom not from here; the King who opens paradise; the subject of all the Scriptures; my Lord and my God; the One with all power; Alpha and Omega, the first and the last, the Almighty; and the One who holds the keys of hell and of death.";

describe('no piece the voice cannot hold', () => {
  it('L191’s 866-character summary reaches the voice in pieces of at most 180 characters', () => {
    expect(L191_SUMMARY.length).toBe(866);
    const pieces = chunkForClips(L191_SUMMARY);
    expect(pieces.length).toBeGreaterThan(4);
    for (const p of pieces) expect(p.len, `a ${p.len}-character piece`).toBeLessThanOrEqual(PIECE_MAX);
    expect(pieces.map((p) => p.text).join(' ')).toBe(L191_SUMMARY);
  });

  it('the live probe’s before/after fixture is the app’s own cut, not a copy that can drift', async () => {
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const fx = JSON.parse(readFileSync(join(process.cwd(), '..', 'infra', 'nas-voice-lite', 'fixtures', 'l191-summary.json'), 'utf8'));
    expect(fx.whole).toBe(L191_SUMMARY);
    expect(fx.pieces).toEqual(chunkForClips(L191_SUMMARY).map((p) => p.text));
  });

  it('piece i IS reading segment i — the same cut the highlight map uses', () => {
    const text = `${L191_SUMMARY} In the beginning was the Word. And the Word was with God.`;
    expect(chunkForClips(text).map((p) => p.text)).toEqual(segmentText(text, 180));
  });
});

describe('the queue plays every piece in order at 1.5×', () => {
  it('onPiece reports 0,1,2… exactly once each, and the rate holds on every piece', async () => {
    const pieces = chunkForClips(L191_SUMMARY);
    const audio = { src: '', paused: true, playbackRate: 1, defaultPlaybackRate: 1, play() { this.paused = false; return Promise.resolve(); }, pause() { this.paused = true; } };
    const seen = []; const rates = [];
    const q = createClipQueue({ chunks: pieces, audio, rate: 1.5, fetchClip: async (t) => ({ url: `blob:${t.length}` }), onPiece: (i) => { seen.push(i); rates.push(audio.playbackRate); } });
    await q.start();
    for (let i = 1; i < pieces.length; i++) { audio.onended(); await new Promise((r) => setTimeout(r, 0)); await new Promise((r) => setTimeout(r, 0)); }
    expect(seen).toEqual(pieces.map((_, i) => i));
    expect(rates.every((r) => r === 1.5)).toBe(true);
  });
});

// --- The highlight follows the PIECE, not the clock --------------------------
const lit = [];
vi.mock('../lib/read-follow.js', async (orig) => {
  const actual = await orig();
  return { ...actual, highlightSegment: (r) => { lit.push(r ? r.toString().trim() : null); }, followRange: () => {} };
});
const state = { isReading: false, cloudPiece: -1 };
const spyRead = vi.fn();
vi.mock('../lib/use-read-aloud.js', () => ({
  useReadAloud: () => ({
    supported: true, isReading: state.isReading, isPaused: false, rate: 1.5,
    read: (...a) => spyRead(...a), pause: () => {}, resume: () => {}, stop: () => {}, claimAudio: () => {},
    setRate: () => {}, segmentIndex: 0, deviceRead: false, setBoundaryHandler: null,
    cloudProgress: 0, cloudPiece: state.cloudPiece, audioVoice: 'audio',
    catalog: [{ id: 'sys', label: 'System voice', group: 'Default', usable: true }],
    voiceId: 'sys', setVoiceId: () => {}, currentItem: { id: 'sys', ai: false },
  }),
}));

describe('the lit sentence is the piece that is playing', () => {
  let container, root, el;
  const SENTS = ['The first sentence is short.', 'The second sentence follows it.', 'The third sentence closes the thought.', 'The fourth sentence ends the reading.'];
  beforeEach(() => {
    lit.length = 0; state.isReading = false; state.cloudPiece = -1;
    el = document.createElement('main');
    el.innerHTML = `<div id="l191-lesson"><p>${SENTS.join(' ')}</p></div>`;
    document.body.appendChild(el);
    container = document.createElement('div'); document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(() => { act(() => root.unmount()); container.remove(); el.remove(); });

  it('across a whole reading at 1.5×, sentence i is lit while piece i plays', async () => {
    const { default: TTSControl } = await import('../components/TTSControl.jsx');
    const { setReadTarget, clearReadTarget } = await import('../lib/read-target.js');
    const render = () => act(() => root.render(createElement(TTSControl, { view: 'church' })));
    render();
    act(() => { setReadTarget('l191', { label: 'this lesson', text: SENTS.join(' '), elementId: 'l191-lesson' }); });
    act(() => { container.querySelector('button[aria-label*="read-aloud controls"]').click(); });
    const readBtn = [...container.querySelectorAll('button')].find((b) => /Read this lesson — start to finish/.test(b.textContent));
    act(() => { readBtn.click(); });
    await act(async () => { await new Promise((r) => setTimeout(r, 400)); });
    state.isReading = true;
    for (let i = 0; i < SENTS.length; i++) {
      state.cloudPiece = i;
      render();
      expect(lit.at(-1), `piece ${i} playing`).toBe(SENTS[i]);
    }
    clearReadTarget('l191');
  });
});
