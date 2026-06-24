// =============================================================================
// thought-finalizer — proven-to-catch gate (Verification Doctrine, DR-0076).
// =============================================================================
// The finalizer distills a deep-only Study reflection (4D deep source -> 3D plain
// + scripture + tags) so it flips to "DISTILLED · DEEP + PLAIN", and extracts the
// eternal algorithm(s) it distills to into the EA library. Binding properties —
// each test FAILS if the behavior regresses:
//   1. FAITHFUL — distilling NEVER changes the 4D deep source (or the title).
//   2. FILL-IF-EMPTY — scripture/tags the author wrote are never clobbered.
//   3. BADGE — applying a plain distillation makes distillState() -> 'both'.
//   4. BATCH — pendingDistillation() = exactly the "needs a plain version" set.
//   5. EXTRACT + IDEMPOTENT — algorithms auto-merge into the library, deduped by
//      name (no duplicate on re-run / across reflections).
//   6. REVERSIBLE — revert restores the deep-only state from the snapshot.
//   7. PARSE — survives fences/prose/partials; garbage -> null (honest empty).
//   8. SOVEREIGN — the client routes LOCAL (qwen2.5) via a RELATIVE /n8n path.
//   9. FORWARD-COMPAT — an old entry with no finalization normalizes clean.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { normalizeEntry, normalizeFinalization, distillState } from '../lib/study-space.js';
import {
  FINALIZE_MODEL, finalizeEndpoint,
  needsDistillation, isDistilled, pendingDistillation, distillationProgress,
  finalizerSystemPrompt, finalizerUserPrompt, buildFinalizePayload,
  parseDistillation, algorithmsFromResult, mergeAlgorithmsIntoLibrary,
  applyDistillation, revertDistillation,
} from '../lib/thought-finalizer.js';

const deepOnly = (over = {}) => normalizeEntry({
  kind: 'reflection', title: 'Broken tablets', deep: 'The deep captured exchange, his words.', ...over,
});
const RESULT = {
  plain: 'The plain wider-audience version. Practically, do the thing.',
  scripture: 'Exodus 32:19',
  tags: ['brokenness', 'covenant'],
  algorithms: [{
    name: 'Build by Brokenness', fourD: { summary: 'Eternal reading.', scripture: 'Exodus 32:19' },
    threeD: { summary: 'Practical reading.' }, outcome: 'Strength from the break.', tags: ['brokenness'],
  }],
};

describe('faithfulness — the 4D deep source is never changed', () => {
  it('applyDistillation fills plain/scripture/tags but keeps deep + title verbatim', () => {
    const e = deepOnly();
    const after = applyDistillation(e, RESULT, { algorithmIds: ['a1'] });
    expect(after.deep).toBe(e.deep);          // VERBATIM
    expect(after.title).toBe(e.title);
    expect(after.plain).toBe(RESULT.plain);   // the empty 3D layer got filled
    expect(after.scripture).toBe('Exodus 32:19');
    expect(after.tags).toEqual(['brokenness', 'covenant']);
    expect(after.finalization.status).toBe('distilled');
    expect(after.finalization.algorithmIds).toEqual(['a1']);
    expect(e.plain).toBe('');                  // original object not mutated
  });
  it('fill-if-empty: an author-written scripture/tags are NOT clobbered', () => {
    const e = deepOnly({ scripture: 'Psalm 51', tags: ['repentance'] });
    const after = applyDistillation(e, RESULT);
    expect(after.scripture).toBe('Psalm 51');         // kept
    expect(after.tags).toEqual(['repentance']);        // kept
    expect(after.finalization.autofilled.scripture).toBe(false);
    expect(after.finalization.autofilled.tags).toBe(false);
    expect(after.finalization.autofilled.plain).toBe(true);
  });
});

describe('the live badge', () => {
  it('a deep-only entry needs a plain version; distilling flips it to both', () => {
    const e = deepOnly();
    expect(distillState(e)).toBe('deep-only');
    expect(needsDistillation(e)).toBe(true);
    expect(isDistilled(e)).toBe(false);
    const after = applyDistillation(e, RESULT);
    expect(distillState(after)).toBe('both');
    expect(isDistilled(after)).toBe(true);
    expect(needsDistillation(after)).toBe(false);
  });
});

describe('batch — the "review all 10" set', () => {
  it('pendingDistillation = reflections that need a plain version', () => {
    const a = deepOnly({ title: 'A' });
    const b = applyDistillation(deepOnly({ title: 'B' }), RESULT); // distilled
    const c = normalizeEntry({ title: 'C', deep: 'd', plain: 'already plain' }); // already both
    const empty = normalizeEntry({}); // no deep
    expect(pendingDistillation([a, b, c, empty]).map((e) => e.title)).toEqual(['A']);
  });
  it('distillationProgress counts honestly over thoughts with a deep source', () => {
    const p = distillationProgress([deepOnly(), applyDistillation(deepOnly(), RESULT), normalizeEntry({})]);
    expect(p.total).toBe(2);
    expect(p.finished).toBe(1);
    expect(p.pending).toBe(1);
  });
});

describe('eternal-algorithm extraction + idempotent auto-add', () => {
  it('algorithmsFromResult keeps real drafts, drops empty/fabricated ones', () => {
    const drafts = algorithmsFromResult({ algorithms: [
      RESULT.algorithms[0],
      { name: '', fourD: { summary: 'x' } },         // no name -> dropped
      { name: 'Hollow', fourD: { summary: '' }, threeD: { summary: '' }, outcome: '' }, // no substance -> dropped
    ] });
    expect(drafts.map((d) => d.name)).toEqual(['Build by Brokenness']);
  });
  it('merges into the library and dedupes by name (idempotent on re-run)', () => {
    const drafts = algorithmsFromResult(RESULT);
    const first = mergeAlgorithmsIntoLibrary([], drafts, { nowMs: 1 });
    expect(first.entries).toHaveLength(1);
    expect(first.addedIds).toHaveLength(1);
    expect(first.linkedIds).toEqual(first.addedIds);
    // Re-run with the SAME name -> no duplicate; links to the existing id.
    const second = mergeAlgorithmsIntoLibrary(first.entries, drafts, { nowMs: 2 });
    expect(second.entries).toHaveLength(1);
    expect(second.addedIds).toHaveLength(0);
    expect(second.linkedIds).toEqual([first.entries[0].id]);
  });
  it('the merged algorithm carries the 4D/3D/outcome + a provenance link', () => {
    const { entries } = mergeAlgorithmsIntoLibrary([], algorithmsFromResult(RESULT), { nowMs: 1 });
    const a = entries[0];
    expect(a.name).toBe('Build by Brokenness');
    expect(a.fourD.scripture).toBe('Exodus 32:19');
    expect(a.outcome).toBe('Strength from the break.');
    expect(a.links[0].label).toMatch(/Auto-extracted/);
  });
});

describe('reversible', () => {
  it('revert restores the deep-only state from the snapshot', () => {
    const e = deepOnly();
    const after = applyDistillation(e, RESULT, { algorithmIds: ['a1'] });
    const back = revertDistillation(after);
    expect(back.plain).toBe('');               // restored
    expect(back.scripture).toBe('');
    expect(back.tags).toEqual([]);
    expect(back.deep).toBe(e.deep);            // deep still verbatim
    expect(back.finalization.status).toBe('unfinalized');
    expect(distillState(back)).toBe('deep-only');
  });
  it('revert does NOT clobber a field the author wrote himself', () => {
    const e = deepOnly({ scripture: 'Psalm 51' });
    const back = revertDistillation(applyDistillation(e, RESULT));
    expect(back.scripture).toBe('Psalm 51'); // author scripture preserved through the round-trip
  });
});

describe('parse — trust nothing unverified', () => {
  it('parses strict / fenced / enveloped / prose-wrapped JSON', () => {
    expect(parseDistillation(JSON.stringify(RESULT)).plain).toMatch(/Practically/);
    expect(parseDistillation('```json\n' + JSON.stringify(RESULT) + '\n```').tags).toContain('covenant');
    expect(parseDistillation({ response: JSON.stringify(RESULT) }).algorithms).toHaveLength(1);
    expect(parseDistillation('Sure!\n' + JSON.stringify(RESULT) + '\ndone').scripture).toBe('Exodus 32:19');
  });
  it('garbage / empty / null -> null', () => {
    expect(parseDistillation('not json')).toBeNull();
    expect(parseDistillation('{}')).toBeNull();
    expect(parseDistillation('')).toBeNull();
    expect(parseDistillation(null)).toBeNull();
  });
  it('a plain-only result still parses (algorithms optional)', () => {
    const p = parseDistillation(JSON.stringify({ plain: 'just the plain' }));
    expect(p.plain).toBe('just the plain');
    expect(p.algorithms).toEqual([]);
  });
});

describe('forward-compat + sovereign + prompt', () => {
  it('an old entry with no finalization normalizes to a clean unfinalized layer', () => {
    const old = normalizeEntry({ title: 'legacy', deep: 'x' });
    expect(old.finalization.status).toBe('unfinalized');
    expect(old.finalization.algorithmIds).toEqual([]);
    expect(normalizeFinalization({ status: 'bogus' }).status).toBe('unfinalized');
  });
  it('the client routes LOCAL: qwen2.5 via a relative /n8n path, never vendor/Funnel', () => {
    expect(FINALIZE_MODEL).toBe('qwen2.5');
    const ep = finalizeEndpoint();
    expect(ep.startsWith('/n8n/')).toBe(true);
    expect(ep).not.toMatch(/https?:\/\//);
    expect(buildFinalizePayload(deepOnly()).model).toBe('qwen2.5');
  });
  it('the prompt bakes in the framework (4D->3D + benefits + algorithms) + Word-first no-fabrication', () => {
    const sys = finalizerSystemPrompt();
    expect(sys).toMatch(/plain/);
    expect(sys).toMatch(/Practically/);     // the benefits/so-what close
    expect(sys).toMatch(/algorithms/);
    expect(sys).toMatch(/ESV/);
    expect(sys).toMatch(/NEVER invent/i);
    expect(finalizerUserPrompt(deepOnly())).toMatch(/DEEP SOURCE/);
  });
});
