// @vitest-environment jsdom
// THE CHECK READS ITS CHOICES TO A LITTLE LEARNER (DR-0431).
// The 2026-09-14 rule mutes an adult quiz's options from the reader (decoys
// would be taught as truth). A pre-K learner cannot READ the options, so a
// course whose decoys are letters and numbers opts in with readOptionsAloud:
// the options leave data-read-skip and each carries a speaker button.
// Proven-to-catch: the adult default is unchanged (options stay muted).
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

const speak = vi.fn();
vi.mock('../lib/tts.js', async (orig) => { const m = await orig(); return { ...m, useTextToSpeech: () => ({ supported: true, speak, stop: () => {}, isReading: false, isPaused: false, rate: 1, voices: [], pause: () => {}, resume: () => {}, setRate: () => {}, setVoiceURI: () => {} }) }; });
const { QuizBlock } = await import('../components/ChurchLearn.jsx');

let host; let root;
beforeEach(() => { host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host); speak.mockClear(); });
afterEach(() => { act(() => root.unmount()); host.remove(); });
const quiz = { questions: [{ q: 'Which letter starts Adam?', options: ['A', 'B', 'C'], answer: 0, explain: 'A is for Adam.' }] };

describe('QuizBlock', () => {
  it('an adult module keeps its options muted from the reader (the 2026-09-14 rule)', () => {
    act(() => { root.render(createElement(QuizBlock, { module: { id: 'adult', quiz } })); });
    const box = host.querySelector('fieldset > div');
    expect(box.hasAttribute('data-read-skip')).toBe(true);
    expect(host.querySelector('button[aria-label^="Hear"]')).toBeNull();
  });
  it('a readOptionsAloud module reads them: no mute, a speaker per option that speaks that option', () => {
    act(() => { root.render(createElement(QuizBlock, { module: { id: 'lil', quiz, readOptionsAloud: true } })); });
    const box = host.querySelector('fieldset > div');
    expect(box.hasAttribute('data-read-skip')).toBe(false);
    const speakers = [...host.querySelectorAll('button[aria-label^="Hear"]')];
    expect(speakers.length).toBe(3);
    act(() => { speakers[1].click(); });
    expect(speak).toHaveBeenCalledWith('B');
  });
});
