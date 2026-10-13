// @vitest-environment node
// =============================================================================
// scripture-prompt — the one Scripture-handling instruction, wired everywhere
// Ari speaks (DR-0405)
// =============================================================================
// Darrell asked what our biblical-scriptures prompt is and to BUILD the best
// one. The gap it closes: the tutor/Ari system prompt had "capitalize God" and
// nothing that stopped the model paraphrasing or inventing a verse. These pins
// hold the load-bearing rules AND prove the prompt is actually carried by the
// live surfaces — a wiring that, if removed, FAILS here (proven-to-catch,
// DR-0076 §3).
import { describe, it, expect } from 'vitest';
import { SCRIPTURE_PROMPT } from '../lib/scripture-prompt.js';
import { ARI_PERSONA, ariSystemPrompt } from '../lib/ari.js';
import { tutorSystemPrompt } from '../lib/class-tutor.js';

describe('SCRIPTURE_PROMPT — the load-bearing rules are present', () => {
  it('Word first, and Scripture explains Scripture (teach, do not debate)', () => {
    expect(SCRIPTURE_PROMPT).toMatch(/WORD FIRST/);
    expect(SCRIPTURE_PROMPT).toMatch(/Scripture explain Scripture/);
    expect(SCRIPTURE_PROMPT).toMatch(/do not stage man/i);
  });
  it('never invent or paraphrase a verse — verbatim or say it is not from memory', () => {
    expect(SCRIPTURE_PROMPT).toMatch(/NEVER INVENT OR PARAPHRASE A VERSE/);
    expect(SCRIPTURE_PROMPT).toMatch(/not quoting it from memory/);
    expect(SCRIPTURE_PROMPT).toMatch(/quotation mark around Scripture is a claim/);
  });
  it('His name in our voice, the translation left exact inside a quote', () => {
    expect(SCRIPTURE_PROMPT).toMatch(/say "Yahweh" for the Father/);
    expect(SCRIPTURE_PROMPT).toMatch(/never substitute "Yahweh" into a quotation/);
  });
  it('capitalization binding and honest reticence', () => {
    expect(SCRIPTURE_PROMPT).toMatch(/CAPITALIZE references to God/);
    expect(SCRIPTURE_PROMPT).toMatch(/Never capitalize the adversary/);
    expect(SCRIPTURE_PROMPT).toMatch(/HONEST WHERE THE WORD IS RETICENT/);
  });
  it('carries NO quoted verse itself — a rules-only prompt (it would else break its own rule)', () => {
    // No Book Chapter:Verse citation anywhere in the prompt.
    expect(SCRIPTURE_PROMPT).not.toMatch(/\b[1-3]?\s?[A-Z][a-z]+\s\d+:\d+/);
    // No capitalized adversary name leaked in.
    expect(SCRIPTURE_PROMPT).not.toMatch(/Satan|Lucifer|The Devil|The Adversary/);
  });
});

describe('the prompt is actually WIRED into the live surfaces (proven-to-catch)', () => {
  it('every Ari surface carries it — folded into ARI_PERSONA, so the bare persona still equals itself', () => {
    expect(ARI_PERSONA).toContain(SCRIPTURE_PROMPT);
    // The ari.js composition contract is preserved: no task => bare persona.
    expect(ariSystemPrompt('')).toBe(ARI_PERSONA);
    expect(ariSystemPrompt('TASK: x').startsWith(ARI_PERSONA)).toBe(true);
  });
  it('the class tutor prompt carries it (a scripture answer can no longer paraphrase unchecked)', () => {
    const sys = tutorSystemPrompt(
      { title: 'A week', bigIdea: 'idea', anchor: { ref: 'John 1:1', theme: 'the Word' }, facilitator: {} },
    );
    expect(sys).toContain('NEVER INVENT OR PARAPHRASE A VERSE');
    expect(sys).toContain('WORD FIRST');
  });
});
