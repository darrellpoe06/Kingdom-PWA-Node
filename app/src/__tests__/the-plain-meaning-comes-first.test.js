// @vitest-environment node
// =============================================================================
// THE PLAIN MEANING COMES FIRST (DR-0521)
// =============================================================================
// Darrell 2026-09-19, reading L175 on his phone, stopped at a word:
//
//   "What is an assay?"   and, a moment later,   "Typo?"
//
// It was not a typo. An assay is a metal-shop test — you heat a sample to find
// out what it actually is, and the assayer's purpose is to establish the
// content, never to destroy the material, which is precisely why 1 Peter 1:7
// reaches for fire and gold. And the lesson SAID that. It said it two sentences
// after he had already met the word cold and had to ask.
//
// That is his own instruction from the same evening, failing on our own text:
// "words that are to big or not usually used will not be understood unless we
// ALSO USE THEM IN CONTEXT". Using a hard word in context is right. Explaining
// it afterwards is not the same thing, because a reader who stopped at the word
// never reached the explanation.
//
// PROVEN-TO-CATCH IS THE POINT (DR-0076 §3). The first block breaks the measure
// on purpose, including on the exact shape Darrell hit.
//
// WHAT THE FIRST MEASUREMENT COST, recorded because it is the more useful half.
// The term list initially carried `tribute` (150 hits) and `pledge` (22), and
// nearly all of them were the ordinary modern senses — paying tribute to
// someone, pledging to do a thing. A check that fires on correct content is a
// check that will pass on wrong content, so both came off before anything was
// baselined. The list holds words a reader genuinely does not have.
import { describe, it, expect } from 'vitest';
import { HARD_TERMS, oursOnly, termFaults, moduleFaults, scanModules } from '../lib/plain-before-the-term.js';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { LEARN_CATALOG } from '../lib/learn-catalog.js';
import baseline from '../lib/plain-before-the-term-baseline.json';

// Every mounted module, once. Living Lessons arrive both directly and through
// the catalog, and counting them twice would double every number here.
const byId = new Map();
for (const m of LIVING_LESSONS_MODULES) if (m && m.id) byId.set(m.id, m);
for (const e of LEARN_CATALOG) {
  try { for (const m of e.buildScheduleRows()) if (m && m.id && !byId.has(m.id)) byId.set(m.id, m); } catch { /* a course that cannot build is another test's problem */ }
}
const MODULES = [...byId.values()];
const live = scanModules(MODULES).sort();

describe('the measure catches what it exists to catch', () => {
  it('catches the exact shape Darrell hit — the word first, the meaning after', () => {
    const late = 'Reframes a hard season as assay rather than abandonment. An assay is run to establish what a material is, never to destroy it.';
    expect(termFaults(late)).toContain('assay');
  });

  it('passes the same sentence once the plain meaning leads', () => {
    const early = 'A metal shop calls that an assay: you heat a sample to find out what it actually is, and never to destroy the metal.';
    expect(termFaults(early)).toEqual([]);
  });

  it('accepts a cue in the SAME sentence, and refuses one in the next', () => {
    expect(termFaults('It is an assay, which is to say you heat a sample and find out what it actually is.')).toEqual([]);
    expect(termFaults('It is an assay. You heat a sample to find out what it actually is.')).toContain('assay');
  });

  it('reads OUR prose only — a term inside a quotation is the Word\'s vocabulary, not ours', () => {
    // We cannot insert a gloss into a KJV quotation and must never try
    // (DR-0210 / DR-0459), so a term appearing only inside one is not a fault.
    const quoted = 'He gave the rule plainly. "He that putteth not out his money to usury, nor taketh reward against the innocent." (Psalms 15:5)';
    expect(oursOnly(quoted)).not.toMatch(/usury/);
    expect(termFaults(quoted)).toEqual([]);
  });

  it('walks every band of a module, so one band cannot go unchecked', () => {
    const m = { id: 'x', lesson: 'ok', levels: { teen: 'That is an assay. You heat a sample afterwards.' } };
    expect(moduleFaults(m)).toEqual(['x.teen: assay']);
  });

  it('the live corpus is really being walked — this is not measuring nothing', () => {
    expect(MODULES.length).toBeGreaterThan(400);
    expect(Object.keys(HARD_TERMS).length).toBeGreaterThan(8);
  });
});

describe('SHRINK-ONLY: the debt may fall and may never grow', () => {
  it('introduces no new term used before its plain meaning', () => {
    const known = new Set(baseline.faults);
    const added = live.filter((f) => !known.has(f));
    expect(added, `NEW hard term used before its plain meaning:\n${added.join('\n')}`).toEqual([]);
  });

  it('never exceeds the recorded debt', () => {
    expect(live.length).toBeLessThanOrEqual(baseline.faults.length);
  });

  it('the baseline records what was actually measured, not a round number', () => {
    expect(baseline.faults.length).toBe(65);
    expect(baseline.measuredModules).toBeGreaterThan(400);
    const counted = Object.values(baseline.byTerm).reduce((a, b) => a + b, 0);
    expect(counted).toBe(baseline.faults.length);
  });

  it('carries a re-review date, because nothing parked is parked forever (DR-0075)', () => {
    expect(baseline.note).toMatch(/re-review: \d{4}-\d{2}-\d{2}/);
  });
});

describe('the two terms repaired rather than recorded', () => {
  it('assay is at zero — the word Darrell actually hit', () => {
    expect(live.filter((f) => f.endsWith(': assay'))).toEqual([]);
    expect(baseline.byTerm.assay).toBeUndefined();
  });

  it('kenosis is at zero', () => {
    expect(live.filter((f) => f.endsWith(': kenosis'))).toEqual([]);
  });

  it('L176 now leads with the plain meaning in every band', () => {
    const m = byId.get('ll176-faith-is-the-substance-and-the-evidence-and-he-made-me-then-died-for-me');
    expect(m, 'L176 is not mounted').toBeTruthy();
    expect(moduleFaults(m).filter((f) => f.endsWith(': assay'))).toEqual([]);
    for (const text of [m.lesson, m.levels.teen, m.levels.senior]) {
      expect(oursOnly(text).toLowerCase()).toMatch(/heat a sample|metal shop/);
    }
  });
});
