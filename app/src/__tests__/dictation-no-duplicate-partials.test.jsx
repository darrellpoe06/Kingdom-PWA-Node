// @vitest-environment jsdom
//
// DR-0685 — THE 54,115-CHARACTER LESSON. On 2026-09-29 17:59 a lesson spoken
// into Thinking Space on Darrell's phone (Android, Chrome) was saved to
// public.agent_inbox (row 8d290c20-…) as 54,115 characters that begin:
//
//   "lesson lesson or or how or how or how did or how did or how did the ..."
//
// Every growing snapshot of the sentence was kept as if it were new words.
// That is what Android Chrome's recognizer does in continuous mode: it hands
// back each partial as a result already marked FINAL, holding the WHOLE
// utterance so far (cumulative), often at a fresh result index each time, and
// sometimes re-reporting the whole list from resultIndex 0. The old hook
// committed every final slice it was handed, so each snapshot was appended.
//
// These tests replay that exact event shape through the real surface
// (Thinking Space's box is OneVoiceInput -> useVoiceDictation) and pin:
//   - interim words REPLACE (shown live, never appended);
//   - a final commits ONCE;
//   - Android's cumulative finals never duplicate (only the new words land);
//   - the desktop shape (separate finals per utterance) is unchanged.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import OneVoiceInput from '../components/OneVoiceInput.jsx';
import { createFinalCommitter, growingPrefixDelta } from '../lib/voice-dictation.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

class FakeRecognition {
  constructor() { FakeRecognition.last = this; }
  start() {}
  stop() { this.onend && this.onend(); }
}
const res = (text, isFinal) => { const r = [{ transcript: text }]; r.isFinal = isFinal; return r; };

// The head of the real row, as the phone produced it: two utterances, each
// reported as a run of cumulative snapshots.
const U1 = ['lesson', 'lesson'];
const U2 = ['or', 'or how', 'or how', 'or how did', 'or how did', 'or how did the',
  'or how did the', 'or how did the all', 'or how did the all those',
  'or how did the all those people', 'or how did the all those people know'];
const SPOKEN = 'lesson or how did the all those people know';

let container;
async function mount() {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { createRoot(container).render(createElement(OneVoiceInput, { surface: 'notes', submitLabel: 'Save', addNote: vi.fn() })); });
}
const box = () => container.querySelector('[data-testid="one-voice-text"]');
const button = (re) => [...container.querySelectorAll('button')].find((b) => re.test(b.textContent));
const click = async (el) => { await act(async () => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); }); };
const emit = async (event) => { await act(async () => { FakeRecognition.last.onresult(event); }); };

beforeEach(() => { localStorage.clear(); window.SpeechRecognition = FakeRecognition; });
afterEach(() => { delete window.SpeechRecognition; container && container.remove(); });

describe('Thinking Space dictation on Android Chrome — the box holds what was said, once', () => {
  it('REPRODUCES the row: cumulative finals at a fresh index each time land once', async () => {
    await mount();
    await click(button(/Speak/));
    const all = [];
    for (const t of [...U1, ...U2]) {
      all.push(res(t, true));
      await emit({ resultIndex: all.length - 1, results: [...all] });
    }
    await click(button(/Stop/));
    expect(box().value).toBe(SPOKEN);
  });

  it('cumulative finals re-reported from resultIndex 0 (whole list every event) land once', async () => {
    await mount();
    await click(button(/Speak/));
    const all = [];
    for (const t of [...U1, ...U2]) {
      all.push(res(t, true));
      await emit({ resultIndex: 0, results: [...all] });
    }
    await click(button(/Stop/));
    expect(box().value).toBe(SPOKEN);
  });

  it('one result slot reused for the growing utterance (index 0, marked final) lands once', async () => {
    await mount();
    await click(button(/Speak/));
    for (const t of U2) await emit({ resultIndex: 0, results: [res(t, true)] });
    await click(button(/Stop/));
    expect(box().value).toBe('or how did the all those people know');
  });

  it('interim words REPLACE while speaking, and the final commits once', async () => {
    await mount();
    await click(button(/Speak/));
    for (const t of ['how', 'how did', 'how did they', 'how did they know']) {
      await emit({ resultIndex: 0, results: [res(t, false)] });
      expect(box().value).toBe(t);
    }
    await emit({ resultIndex: 0, results: [res('how did they know', true)] });
    await emit({ resultIndex: 0, results: [res('how did they know', true)] });
    await click(button(/Stop/));
    expect(box().value).toBe('how did they know');
  });

  it('the desktop shape is unchanged: separate utterances all land, in order', async () => {
    await mount();
    await click(button(/Speak/));
    const all = [res('please pray', true)];
    await emit({ resultIndex: 0, results: [...all] });
    all.push(res('for Sister Mae', false));
    await emit({ resultIndex: 1, results: [...all] });
    all[1] = res('for Sister Mae', true);
    await emit({ resultIndex: 1, results: [...all] });
    all.push(res('and her son', true));
    await emit({ resultIndex: 2, results: [...all] });
    await click(button(/Stop/));
    expect(box().value).toBe('please pray for Sister Mae and her son');
  });
});

describe('the committer — the safety net for a transcript that grows by prefix', () => {
  it('growingPrefixDelta returns only the new words (case / punctuation tolerant)', () => {
    expect(growingPrefixDelta('or how', 'or how did the')).toBe('did the');
    expect(growingPrefixDelta('or how', 'Or how, did')).toBe('did');
    expect(growingPrefixDelta('or how did', 'or how')).toBe('');      // a shrink is not new words
    expect(growingPrefixDelta('or how', 'or how')).toBe('');          // a repeat is not new words
    expect(growingPrefixDelta('lesson', 'Jesus was')).toBe(null);     // not a growth: a new utterance
    expect(growingPrefixDelta('or ho', 'or how')).toBe(null);         // word boundary, not character
  });

  it('a genuine repeat after a real pause is kept (the window, not a blanket ban)', () => {
    let now = 0;
    const c = createFinalCommitter({ now: () => now });
    expect(c.commit({ resultIndex: 0, results: [res('amen', true)] })).toBe('amen');
    now = 30_000;
    expect(c.commit({ resultIndex: 1, results: [res('amen', true), res('amen', true)] })).toBe('amen');
  });

  it('PROVEN-TO-CATCH: the old commit rule (every final slice) rebuilds the row\'s shape', () => {
    // The pre-fix hook forwarded extractNewFinalTranscript(e) for every event.
    // Run that rule over the same events and it reproduces the row's opening;
    // the committer over the same events does not.
    const oldRule = (e) => e.results.slice(e.resultIndex).filter((r) => r.isFinal).map((r) => r[0].transcript).join(' ');
    const c = createFinalCommitter();
    const all = [];
    const oldOut = [];
    const newOut = [];
    for (const t of [...U1, ...U2]) {
      all.push(res(t, true));
      const e = { resultIndex: all.length - 1, results: [...all] };
      oldOut.push(oldRule(e));
      const chunk = c.commit(e);
      if (chunk) newOut.push(chunk);
    }
    expect(oldOut.join(' ').startsWith('lesson lesson or or how or how or how did or how did or how did the')).toBe(true);
    expect(newOut.join(' ')).toBe(SPOKEN);
  });
});
