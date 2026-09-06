// @vitest-environment node
// =============================================================================
// reading-level — is a "child" level actually written for a child? MEASURED.
// =============================================================================
// Darrell, 2026-09-06: "Did our build make sure to have each version of the
// Lesson based on neuroplasticity and the brain's positions based on age and
// experience according to the biblical scriptures and the competencies most
// human beings have capacity for at those ages?"
//
// The structural half was already enforced — every lesson carries authored
// prose for all five bands, no band falls back, a child level cannot carry
// adult content, and none may be a stub. What was NEVER checked was the
// REGISTER: whether the child text actually reads like child text. That was
// authorial judgment, and judgment unmeasured is a claim (DR-0076 §4).
//
// THE FIRST MEASUREMENT FOUND THE CLAIM PARTLY FALSE, which is why this file
// exists rather than an assurance in a session note:
//   • 30 of 128 lessons read HARDER at child level than at teen level;
//   • 17 child levels read above the ceiling, the worst around grade 11.8 —
//     which is not a child level in any sense a six-to-ten-year-old would
//     recognise.
// Those are recorded as SHRINK-ONLY debt. A new lesson at the wrong register
// fails the build.
//
// THE METHODOLOGICAL CAVEAT, ASSERTED RATHER THAN BURIED. Flesch-Kincaid is a
// syllable-and-sentence-length formula. It does not know that "whosoever" and
// "notwithstanding" are KJV quotations we are REQUIRED to reproduce verbatim
// and forbidden to simplify. Scoring raw text would punish faithfulness to
// Scripture. So the gate scores our AUTHORED PROSE with quoted Scripture
// removed, and that property is itself tested below. Neither number is
// comprehension; both are proxies, and a proxy installed where the truth was
// available is its own defect (DR-0332). What this honestly catches is the
// gross case, and the gross case is currently present 30 times.
import { describe, it, expect } from 'vitest';
import {
  syllables, ourProseOnly, fleschKincaidGrade, measureLesson,
  isInverted, breachesChildCeiling, scanSeries, ratchet, buildBaseline,
  CHILD_CEILING, BAND_ORDER,
} from '../../../scripts/reading-level.mjs';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import baseline from '../lib/reading-level-baseline.json';

describe('the measure itself behaves', () => {
  it('counts syllables plausibly', () => {
    expect(syllables('cat')).toBe(1);
    expect(syllables('happy')).toBe(2);
    expect(syllables('')).toBe(0);
    expect(syllables('notwithstanding')).toBeGreaterThanOrEqual(3);
  });

  it('scores simple prose LOW and dense prose HIGH', () => {
    const simple = 'God is good. He loves you. He gave His Son. That is the news.';
    const dense = 'Notwithstanding the aforementioned soteriological considerations, the hermeneutical framework necessitates a comprehensive reevaluation of the eschatological presuppositions underpinning contemporary interpretive methodologies.';
    expect(fleschKincaidGrade(simple)).toBeLessThan(5);
    expect(fleschKincaidGrade(dense)).toBeGreaterThan(15);
    expect(fleschKincaidGrade(simple)).toBeLessThan(fleschKincaidGrade(dense));
  });

  it('never divides by zero on a fragment, and returns null with no words', () => {
    expect(fleschKincaidGrade('no terminator here')).toBeGreaterThan(-20);
    expect(fleschKincaidGrade('')).toBeNull();
    expect(fleschKincaidGrade('   ')).toBeNull();
  });
});

describe('quoted Scripture is EXCLUDED — faithfulness must not score as bad writing', () => {
  it('strips double-quoted spans, keeping our own sentences', () => {
    const text = 'Here is the plain point. "Notwithstanding in this rejoice not, that the spirits are subject unto you" is the verse. And here is the rest.';
    const ours = ourProseOnly(text);
    expect(ours).not.toContain('Notwithstanding');
    expect(ours).toContain('Here is the plain point.');
    expect(ours).toContain('And here is the rest.');
  });

  it('PROVEN-TO-CATCH: a level made of KJV quotes does not score as bad AUTHORING', () => {
    // The failure this exclusion prevents: an author writes a genuinely simple
    // child level around a long verse, and a raw score condemns them for the
    // verse. Verbatim quotation is required by DR-0076 and is not theirs to fix.
    const simpleAroundAVerse = 'God gives. He is good. "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life." He gives to you too. That is the whole idea.';
    const authored = fleschKincaidGrade(ourProseOnly(simpleAroundAVerse));
    const raw = fleschKincaidGrade(simpleAroundAVerse);
    expect(authored).toBeLessThan(raw);
    expect(authored).toBeLessThan(CHILD_CEILING);
  });

  it('but our OWN dense prose is still scored — the exclusion is not a loophole', () => {
    const dense = 'The hermeneutical framework necessitates comprehensive reevaluation of eschatological presuppositions underpinning interpretive methodologies.';
    expect(fleschKincaidGrade(ourProseOnly(dense))).toBeGreaterThan(CHILD_CEILING);
  });
});

describe('measureLesson and the two offence shapes', () => {
  const lesson = (child, teen, senior) => ({ id: 'llX-test', levels: { child, teen, senior }, lesson: teen });

  it('reports both the authored and the full-text figure per band', () => {
    const m = measureLesson(lesson('See the dog. It runs.', 'A slightly longer explanation follows here.', 'An altogether more considerable exposition, comprising subordinate clauses.'));
    expect(m.bands.child.authored).not.toBeNull();
    expect(m.bands.child.full).not.toBeNull();
    expect(Object.keys(m.bands).sort()).toEqual(['adult', 'child', 'senior', 'teen']);
  });

  it('PROVEN-TO-CATCH: an inverted lesson (child harder than teen) is caught', () => {
    const bad = lesson(
      'The hermeneutical presuppositions necessitate comprehensive reevaluation throughout.',
      'God is good. He loves you.',
      'A considerably more elaborate exposition of the matter under discussion.',
    );
    expect(isInverted(measureLesson(bad)), 'a child level harder than the teen level must be caught').toBe(true);
  });

  it('PASSES a correctly ordered lesson', () => {
    const good = lesson(
      'God is good. He loves you. He gave His Son.',
      'The point runs deeper than a single sentence, and it rewards attention.',
      'The exposition proceeds through several considerations, each requiring deliberate examination.',
    );
    expect(isInverted(measureLesson(good))).toBe(false);
  });

  it('PROVEN-TO-CATCH: a child level above the ceiling is caught', () => {
    const bad = lesson(
      'The hermeneutical framework necessitates comprehensive reevaluation of eschatological presuppositions.',
      'x.', 'y.',
    );
    expect(breachesChildCeiling(measureLesson(bad))).toBe(true);
  });

  it('does not judge a lesson missing a band — the coverage gates own that', () => {
    // Two gates blaming each other for one defect is how a gap survives both.
    expect(isInverted(measureLesson({ id: 'x', levels: { child: 'One idea. Short.' } }))).toBe(false);
  });

  it('the ceiling and the band order are real, stated values', () => {
    expect(CHILD_CEILING).toBe(7.0);
    expect(BAND_ORDER).toEqual(['child', 'teen', 'senior']);
  });
});

describe('the ratchet — new offenders FAIL, the debt may only shrink', () => {
  const scanOf = (inverted, over) => ({ total: 3, measured: [], inverted, childOverCeiling: over });

  it('PROVEN-TO-CATCH: an offender NOT in the baseline is reported fresh', () => {
    const r = ratchet(scanOf(['llNEW'], []), { inverted: ['llOLD'], childOverCeiling: [] });
    expect(r.freshInverted).toEqual(['llNEW']);
  });

  it('a recorded offender is NOT reported fresh (it is known debt, not a regression)', () => {
    const r = ratchet(scanOf(['llOLD'], []), { inverted: ['llOLD'], childOverCeiling: [] });
    expect(r.freshInverted).toEqual([]);
  });

  it('reports healing, so the baseline can be shrunk deliberately', () => {
    const r = ratchet(scanOf([], []), { inverted: ['llOLD'], childOverCeiling: ['llOLD2'] });
    expect(r.healedInverted).toEqual(['llOLD']);
    expect(r.healedOverCeiling).toEqual(['llOLD2']);
  });

  it('catches a fresh ceiling breach independently of inversion', () => {
    const r = ratchet(scanOf([], ['llNEW']), { inverted: [], childOverCeiling: [] });
    expect(r.freshOverCeiling).toEqual(['llNEW']);
  });
});

describe('THE LIVE SERIES — measured, not asserted', () => {
  const scan = scanSeries(LIVING_LESSONS_MODULES);

  it('the scan reads the REAL modules (non-vacuous)', () => {
    expect(scan.total).toBe(LIVING_LESSONS_MODULES.length);
    expect(scan.total).toBeGreaterThan(100);
    expect(scan.measured.every((m) => m.bands.child)).toBe(true);
  });

  it('NO NEW lesson may be added at the wrong register', () => {
    const r = ratchet(scan, baseline);
    expect(
      r.freshInverted,
      `these lessons read HARDER at child level than at teen level and are not in the baseline:\n${r.freshInverted.join('\n')}`,
    ).toEqual([]);
    expect(
      r.freshOverCeiling,
      `these child levels read above grade ${baseline.ceiling} and are not in the baseline:\n${r.freshOverCeiling.join('\n')}`,
    ).toEqual([]);
  });

  it('the committed baseline is the REAL debt, not a painted number', () => {
    // A baseline that drifted from the scan would silently stop gating.
    const fresh = buildBaseline(scan);
    expect(fresh.inverted).toEqual(baseline.inverted);
    expect(fresh.childOverCeiling).toEqual(baseline.childOverCeiling);
    expect(fresh.measuredLessons).toBe(baseline.measuredLessons);
  });

  it('the debt is real and non-empty — this gate is not decoration', () => {
    // If these ever reach zero, that is a genuine win and the assertions flip
    // to `toEqual([])`. Until then, pretending the debt is closed is the lie.
    expect(baseline.inverted.length).toBeGreaterThan(0);
    expect(baseline.childOverCeiling.length).toBeGreaterThan(0);
  });

  it('L129, the newest lesson, is CLEAN — the standard the debt is measured against', () => {
    const l129 = scan.measured.find((m) => m.id.startsWith('ll129-'));
    expect(l129, 'L129 must be measured').toBeTruthy();
    expect(isInverted(l129), 'the newest lesson must not invert').toBe(false);
    expect(breachesChildCeiling(l129), 'the newest child level must sit under the ceiling').toBe(false);
    expect(l129.bands.child.authored).toBeLessThan(l129.bands.teen.authored);
    expect(l129.bands.teen.authored).toBeLessThan(l129.bands.senior.authored);
  });
});
