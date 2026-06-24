// =============================================================================
// thought-finalizer — proven-to-catch gate (Verification Doctrine, DR-0076).
// =============================================================================
// The finalizer applies Darrell's 4th-dimensional framework (4D / 3D / OUTCOME)
// to a private thought. The binding properties — each test FAILS if the behavior
// regresses, asserting the catch:
//   1. FAITHFUL — finalizing NEVER mutates the owner's own words (title/deep/
//      plain/scripture). His meaning is senior to the model's.
//   2. TEACHING-READY GATE — a thought is finalized only when ACCEPTED with all
//      three parts; a mere suggestion is not finalized.
//   3. BATCH — unfinalizedThoughts() is exactly the "review all 10" set:
//      reviewable thoughts not yet finalized.
//   4. PARSE — parseSuggestion survives fences/prose/partials; garbage -> null
//      (honest empty, never a painted treatment).
//   5. REVERSIBLE — clearFinalization restores 'unfinalized'.
//   6. SOVEREIGN — the client routes LOCAL (qwen2.5) via a RELATIVE /n8n path.
//   7. FORWARD-COMPAT — an old entry with no finalization normalizes clean.
//   8. CONTENT-ENGINE — a teaching-ready thought maps onto an Eternal Algorithm.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { normalizeEntry, normalizeFinalization } from '../lib/study-space.js';
import {
  FINALIZE_MODEL, finalizeEndpoint,
  hasAllParts, isFinalized, isTeachingReady, isReviewableThought,
  unfinalizedThoughts, finalizationProgress,
  finalizerSystemPrompt, finalizerUserPrompt, buildFinalizePayload,
  parseSuggestion, applySuggestion, editFinalization, acceptFinalization,
  clearFinalization, toEternalAlgorithmDraft,
} from '../lib/thought-finalizer.js';

const thought = (over = {}) => normalizeEntry({
  title: 'Joy is the strength', deep: 'The deep version, his words.', plain: 'The plain version.',
  scripture: 'Nehemiah 8:10', tags: ['joy'], ...over,
});
const SUGG = {
  fourD: { summary: '4D eternal reading.', scripture: 'Nehemiah 8:10' },
  threeD: { summary: '3D practical reading.' },
  outcome: 'A strength that does not flicker.',
};

describe('faithfulness — the owner words are never overwritten', () => {
  it('applySuggestion adds only the finalization layer, leaving words untouched', () => {
    const t = thought();
    const after = applySuggestion(t, SUGG);
    expect(after.title).toBe(t.title);
    expect(after.deep).toBe(t.deep);
    expect(after.plain).toBe(t.plain);
    expect(after.scripture).toBe(t.scripture);
    expect(after.finalization.status).toBe('suggested');
    expect(after.finalization.fourD.summary).toBe('4D eternal reading.');
    // original object not mutated
    expect(t.finalization.status).toBe('unfinalized');
  });
  it('accept + edit still never touch the words', () => {
    const t = thought();
    const edited = editFinalization(applySuggestion(t, SUGG), { outcome: 'Edited win.' });
    const accepted = acceptFinalization(edited, '2026-06-24T00:00:00.000Z');
    expect(accepted.deep).toBe(t.deep);
    expect(accepted.plain).toBe(t.plain);
    expect(accepted.title).toBe(t.title);
    expect(accepted.finalization.outcome).toBe('Edited win.');
    expect(accepted.finalization.status).toBe('accepted');
    expect(accepted.finalization.acceptedAt).toBe('2026-06-24T00:00:00.000Z');
  });
});

describe('teaching-ready gate', () => {
  it('hasAllParts requires 4D + 3D + outcome (scripture optional)', () => {
    expect(hasAllParts(SUGG)).toBe(true);
    expect(hasAllParts({ ...SUGG, fourD: { summary: '', scripture: '' } })).toBe(false);
    expect(hasAllParts({ ...SUGG, outcome: '' })).toBe(false);
    // scripture empty is still complete
    expect(hasAllParts({ ...SUGG, fourD: { summary: '4D.', scripture: '' } })).toBe(true);
  });
  it('a suggestion is NOT finalized; only an accepted+complete one is', () => {
    const suggested = applySuggestion(thought(), SUGG);
    expect(isFinalized(suggested)).toBe(false);
    const accepted = acceptFinalization(suggested, '2026-06-24T00:00:00.000Z');
    expect(isFinalized(accepted)).toBe(true);
    expect(isTeachingReady(accepted)).toBe(true);
  });
  it('accepted but MISSING a part is not teaching-ready', () => {
    const partial = acceptFinalization(applySuggestion(thought(), { ...SUGG, outcome: '' }), 'x');
    expect(isFinalized(partial)).toBe(false);
  });
});

describe('batch — the "review all 10" set', () => {
  it('unfinalizedThoughts = reviewable thoughts not yet finalized', () => {
    const a = thought({ title: 'A' });
    const b = applySuggestion(thought({ title: 'B' }), SUGG); // suggested, not accepted
    const c = acceptFinalization(applySuggestion(thought({ title: 'C' }), SUGG), 'x'); // finalized
    const empty = normalizeEntry({}); // not reviewable (no words)
    const set = unfinalizedThoughts([a, b, c, empty]);
    expect(set.map((e) => e.title)).toEqual(['A', 'B']);
  });
  it('isReviewableThought needs at least one of the owner words', () => {
    expect(isReviewableThought(normalizeEntry({}))).toBe(false);
    expect(isReviewableThought(thought())).toBe(true);
    expect(isReviewableThought(normalizeEntry({ title: 'only a title' }))).toBe(true);
  });
  it('finalizationProgress counts honestly', () => {
    const c = acceptFinalization(applySuggestion(thought(), SUGG), 'x');
    const p = finalizationProgress([thought(), applySuggestion(thought(), SUGG), c]);
    expect(p.total).toBe(3);
    expect(p.finalized).toBe(1);
    expect(p.suggested).toBe(1);
    expect(p.pending).toBe(2);
  });
});

describe('parse — trust nothing unverified', () => {
  it('parses strict JSON', () => {
    expect(parseSuggestion(JSON.stringify(SUGG)).outcome).toBe('A strength that does not flicker.');
  });
  it('parses a ```json fenced block', () => {
    const raw = '```json\n' + JSON.stringify(SUGG) + '\n```';
    expect(parseSuggestion(raw).fourD.summary).toBe('4D eternal reading.');
  });
  it('parses an Ollama envelope { response }', () => {
    expect(parseSuggestion({ response: JSON.stringify(SUGG) }).threeD.summary).toBe('3D practical reading.');
  });
  it('parses prose-wrapped JSON', () => {
    expect(parseSuggestion('Sure!\n' + JSON.stringify(SUGG) + '\nHope that helps').outcome).toBeTruthy();
  });
  it('garbage / empty / null -> null (honest, not painted)', () => {
    expect(parseSuggestion('not json at all')).toBeNull();
    expect(parseSuggestion('{}')).toBeNull();
    expect(parseSuggestion('')).toBeNull();
    expect(parseSuggestion(null)).toBeNull();
  });
  it('a partial object keeps what parsed', () => {
    const p = parseSuggestion(JSON.stringify({ outcome: 'just the win' }));
    expect(p.outcome).toBe('just the win');
    expect(p.fourD.summary).toBe('');
  });
});

describe('reversible + forward-compat + sovereign', () => {
  it('clearFinalization restores unfinalized, words intact', () => {
    const t = thought();
    const cleared = clearFinalization(acceptFinalization(applySuggestion(t, SUGG), 'x'));
    expect(cleared.finalization.status).toBe('unfinalized');
    expect(cleared.deep).toBe(t.deep);
  });
  it('an old entry with no finalization normalizes to a clean unfinalized layer', () => {
    const old = normalizeEntry({ title: 'legacy', deep: 'x' });
    expect(old.finalization.status).toBe('unfinalized');
    expect(normalizeFinalization(undefined).status).toBe('unfinalized');
    expect(normalizeFinalization({ status: 'bogus' }).status).toBe('unfinalized');
  });
  it('the client routes LOCAL: qwen2.5 via a relative /n8n path, never a vendor/Funnel URL', () => {
    expect(FINALIZE_MODEL).toBe('qwen2.5');
    const ep = finalizeEndpoint();
    expect(ep.startsWith('/n8n/')).toBe(true);
    expect(ep).not.toMatch(/https?:\/\//);
    expect(buildFinalizePayload(thought()).model).toBe('qwen2.5');
  });
});

describe('prompt + content-engine handoff', () => {
  it('the system prompt bakes in the framework + Word-first no-fabrication rule', () => {
    const sys = finalizerSystemPrompt();
    expect(sys).toMatch(/fourD/);
    expect(sys).toMatch(/threeD/);
    expect(sys).toMatch(/outcome/);
    expect(sys).toMatch(/ESV/);
    expect(sys).toMatch(/NEVER invent/i);
  });
  it('the user prompt carries the owner words, not invented content', () => {
    const up = finalizerUserPrompt(thought());
    expect(up).toMatch(/Joy is the strength/);
    expect(up).toMatch(/The deep version/);
  });
  it('a teaching-ready thought maps onto an Eternal Algorithm; an unready one does not', () => {
    const ready = acceptFinalization(applySuggestion(thought(), SUGG), 'x');
    const draft = toEternalAlgorithmDraft(ready);
    expect(draft.name).toBe('Joy is the strength');
    expect(draft.fourD.summary).toBe('4D eternal reading.');
    expect(draft.outcome).toBe('A strength that does not flicker.');
    expect(toEternalAlgorithmDraft(thought())).toBeNull();
  });
});
