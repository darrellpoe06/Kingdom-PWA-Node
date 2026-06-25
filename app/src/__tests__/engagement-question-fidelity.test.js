// =============================================================================
// engagement-question-fidelity — the verifiable EXTRACTION-FIDELITY check that
// REPLACES the old human-approval gate on trivia questions. BG's questions go
// live by default; this deterministic check (not a person) is the only thing
// that stands between an extracted question and the congregation's card.
//
// Proven-to-catch (DR-0076): each test asserts the check CATCHES a specific
// broken-extraction class, so a green run actually means something.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { checkQuestionFidelity } from '../lib/engagement-sync.js';

const GOOD = {
  prompt: 'What did Jesus tell Peter to do with his sword?',
  choices: [
    { key: 'a', label: 'Put it away' },
    { key: 'b', label: 'Sharpen it' },
    { key: 'c', label: 'Give it to Malchus' },
  ],
  correctChoice: 'a',
  source: 'bg-email',
  scriptureRef: 'John 18:11',
};

describe('checkQuestionFidelity — a well-formed BG question publishes', () => {
  it('passes a complete, well-formed question (live by default)', () => {
    const r = checkQuestionFidelity(GOOD);
    expect(r.ok).toBe(true);
    expect(r.issues).toEqual([]);
  });

  it('accepts the snake_case correct_choice shape too', () => {
    const { correctChoice, ...rest } = GOOD;
    const r = checkQuestionFidelity({ ...rest, correct_choice: 'b' });
    expect(r.ok).toBe(true);
  });

  it('defaults an absent source to "standard" (still valid)', () => {
    const { source, ...rest } = GOOD;
    const r = checkQuestionFidelity(rest);
    expect(r.ok).toBe(true);
  });
});

describe('checkQuestionFidelity — catches broken extractions (no person needed)', () => {
  it('catches a missing/too-short prompt', () => {
    const r = checkQuestionFidelity({ ...GOOD, prompt: '?' });
    expect(r.ok).toBe(false);
    expect(r.issues).toContain('prompt-missing-or-too-short');
  });

  it('catches fewer than two choices', () => {
    const r = checkQuestionFidelity({ ...GOOD, choices: [{ key: 'a', label: 'Only one' }], correctChoice: 'a' });
    expect(r.ok).toBe(false);
    expect(r.issues).toContain('fewer-than-two-choices');
  });

  it('catches duplicate choice keys', () => {
    const r = checkQuestionFidelity({
      ...GOOD,
      choices: [{ key: 'a', label: 'One' }, { key: 'a', label: 'Two' }],
    });
    expect(r.ok).toBe(false);
    expect(r.issues).toContain('duplicate-choice-keys');
  });

  it('catches a choice with a missing label', () => {
    const r = checkQuestionFidelity({
      ...GOOD,
      choices: [{ key: 'a', label: 'One' }, { key: 'b', label: '' }],
    });
    expect(r.ok).toBe(false);
    expect(r.issues).toContain('choice-missing-label');
  });

  it('catches a missing correct_choice', () => {
    const { correctChoice, ...rest } = GOOD;
    const r = checkQuestionFidelity(rest);
    expect(r.ok).toBe(false);
    expect(r.issues).toContain('correct-choice-missing');
  });

  it('catches a correct_choice that matches no choice key', () => {
    const r = checkQuestionFidelity({ ...GOOD, correctChoice: 'z' });
    expect(r.ok).toBe(false);
    expect(r.issues).toContain('correct-choice-not-in-choices');
  });

  it('catches an unknown provenance source', () => {
    const r = checkQuestionFidelity({ ...GOOD, source: 'made-up' });
    expect(r.ok).toBe(false);
    expect(r.issues).toContain('unknown-source');
  });

  it('never throws on empty/garbage input — returns issues, not an exception', () => {
    expect(() => checkQuestionFidelity()).not.toThrow();
    expect(checkQuestionFidelity({}).ok).toBe(false);
    expect(() => checkQuestionFidelity({ choices: 'not-an-array' })).not.toThrow();
  });
});
