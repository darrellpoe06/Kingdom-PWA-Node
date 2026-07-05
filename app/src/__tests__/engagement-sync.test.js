// =============================================================================
// engagement-sync — chooseTriviaSource, the pure live-vs-anchor switch the
// Engagement trivia card runs over getActiveQuestion's result. LIVE renders
// only for a real, fidelity-passing trivia_questions row; everything else
// falls back to the authored anchor set with its own honest dating.
//
// Proven-to-catch (DR-0076): each fallback test asserts the switch CATCHES a
// specific broken class rather than painting a live claim on the fallback.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { chooseTriviaSource } from '../lib/engagement-sync.js';

// A well-formed live row in the toQuestionShape shape the card receives.
const LIVE = {
  id: 'a1b2c3d4-0000-0000-0000-000000000001',
  prompt: 'What did Jesus tell Peter to do with his sword?',
  choices: [
    { key: 'a', label: 'Put it away' },
    { key: 'b', label: 'Sharpen it' },
    { key: 'c', label: 'Give it to Malchus' },
  ],
  correctChoice: 'a',
  scriptureRef: 'John 18:11',
  source: 'bg-email',
  status: 'active',
  messageDate: '2026-07-01',
};

describe('chooseTriviaSource — a real, well-formed question renders live', () => {
  it('returns live mode with the question passed through untouched', () => {
    const r = chooseTriviaSource(LIVE);
    expect(r.mode).toBe('live');
    expect(r.question).toBe(LIVE); // same object — nothing repainted
  });
});

describe('chooseTriviaSource — every other state falls back to the anchor set', () => {
  it('falls back when there is no live question (null / undefined)', () => {
    expect(chooseTriviaSource(null)).toEqual({ mode: 'anchor', reason: 'no-live-question' });
    expect(chooseTriviaSource(undefined)).toEqual({ mode: 'anchor', reason: 'no-live-question' });
  });

  it('falls back on a retracted question even if handed one directly', () => {
    const r = chooseTriviaSource({ ...LIVE, status: 'rejected' });
    expect(r.mode).toBe('anchor');
    expect(r.reason).toBe('retracted');
  });

  it('falls back on a fidelity failure and names the issues (broken extraction)', () => {
    const r = chooseTriviaSource({ ...LIVE, prompt: '?' });
    expect(r.mode).toBe('anchor');
    expect(r.reason).toBe('failed-fidelity');
    expect(r.issues).toContain('prompt-missing-or-too-short');
  });

  it('falls back when the correct choice matches no choice key', () => {
    const r = chooseTriviaSource({ ...LIVE, correctChoice: 'z' });
    expect(r.mode).toBe('anchor');
    expect(r.reason).toBe('failed-fidelity');
    expect(r.issues).toContain('correct-choice-not-in-choices');
  });

  it('never throws on garbage input — falls back instead', () => {
    expect(() => chooseTriviaSource({})).not.toThrow();
    expect(chooseTriviaSource({}).mode).toBe('anchor');
    expect(() => chooseTriviaSource({ choices: 'not-an-array' })).not.toThrow();
  });
});
