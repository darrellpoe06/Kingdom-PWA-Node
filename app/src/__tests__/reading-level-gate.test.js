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
  CHILD_CEILING, NEW_LESSON_CHILD_CEILING, BAND_ORDER,
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
    expect(BAND_ORDER).toEqual(['child', 'youth', 'teen', 'senior']);
  });
});

// =============================================================================
// THE YOUTH RUNG (DR-0544, 2026-09-19)
// =============================================================================
// This gate shipped 2026-09-06 measuring child -> teen -> senior. The youth
// band arrived with L81 and was never added to BAND_ORDER, so for two weeks the
// app displayed a youth level that nothing in this file scored — while the
// band-fill pass was authoring eighty more of them. Adding the rung made 30
// pre-existing inversions visible at once, every one of them the same shape:
// the YOUNGER band reading HARDER than the teen band above it.
//
// Darrell, 2026-09-19, on seeing the level row: "Choosing to change the
// length?!!!!!!!!!!! Not the lessons to fit the level?!!!!!!!!!!!!!" A youth
// band that reads harder than the teen band is that complaint, measured.
describe('the youth band is on the ladder — it was not, and that was the gap', () => {
  const four = (child, youth, teen, senior) => ({ id: 'llY-test', levels: { child, youth, teen, senior }, lesson: teen });
  const CHILDISH = 'God is good. He loves you. He gave His Son. That is the news.';
  const MIDDLING = 'The point runs a little deeper than one sentence, and it rewards a second look.';
  const OLDER = 'The exposition proceeds through several considerations, each requiring deliberate examination.';
  const DENSE = 'Notwithstanding the aforementioned soteriological considerations, the hermeneutical framework necessitates comprehensive reevaluation of eschatological presuppositions.';

  it('measureLesson now reports a youth figure at all — it returned none before', () => {
    const m = measureLesson(four(CHILDISH, MIDDLING, OLDER, DENSE));
    expect(Object.keys(m.bands).sort()).toEqual(['adult', 'child', 'senior', 'teen', 'youth']);
    expect(m.bands.youth.authored).not.toBeNull();
  });

  it('PROVEN-TO-CATCH: youth harder than teen is an inversion', () => {
    // The exact shape found 30 times in the live corpus the day the rung landed.
    expect(isInverted(measureLesson(four(CHILDISH, DENSE, MIDDLING, OLDER)))).toBe(true);
  });

  it('PROVEN-TO-CATCH: youth EASIER than child is an inversion too', () => {
    expect(isInverted(measureLesson(four(MIDDLING, CHILDISH, OLDER, DENSE)))).toBe(true);
  });

  it('PROVEN-TO-CATCH: the same lesson passed before the rung existed', () => {
    // Without youth on the ladder the child->teen->senior reading is clean, so
    // the old gate would have called this lesson correct. That is the miss.
    const inverted = four(CHILDISH, DENSE, MIDDLING, OLDER);
    const { youth, ...withoutYouth } = inverted.levels;
    expect(youth).toBeTruthy();
    expect(isInverted(measureLesson({ ...inverted, levels: withoutYouth })), 'the old three-rung ladder saw nothing wrong here').toBe(false);
    expect(isInverted(measureLesson(inverted)), 'the four-rung ladder catches it').toBe(true);
  });

  it('a correctly ordered four-band lesson still passes', () => {
    expect(isInverted(measureLesson(four(CHILDISH, MIDDLING, OLDER, DENSE)))).toBe(false);
  });

  it('a lesson with no youth band is judged exactly as before', () => {
    const m = { id: 'llNoYouth', levels: { child: CHILDISH, teen: OLDER, senior: DENSE }, lesson: OLDER };
    expect(isInverted(measureLesson(m))).toBe(false);
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

// THE AGE CEILING FOR NEW LESSONS (DR-0417 D3, Darrell 2026-09-15: "Yes. Nice!").
// 7.0 was the corpus median, not the age. Ages 6–10 are grades 1–5, so a
// lesson written after the decision is held to 5.0; the existing corpus keeps
// its shrink-only 7.0 ratchet and is brought down lesson by lesson.
describe('a NEW lesson is held to the AGE, not the corpus', () => {
  const lessonAt = (id, child) => ({ id, levels: { child, teen: 'A slightly longer explanation follows here, and it rewards attention.', senior: 'An altogether more considerable exposition, comprising subordinate clauses and qualifications.' }, lesson: 'x.' });
  // Measured grade 6-ish: under 7.0, over 5.0 — the exact case the old gate let through.
  const grade6 = 'The family gathered around the table for dinner. Father read a story about the shepherd who found his lost sheep.';
  const grade2 = 'God is good. He loves you. He gave His Son. That is the news.';

  it('the new-lesson ceiling is a real, stated value below the corpus ceiling', () => {
    expect(NEW_LESSON_CHILD_CEILING).toBe(5.0);
    expect(NEW_LESSON_CHILD_CEILING).toBeLessThan(CHILD_CEILING);
  });

  it('PROVEN-TO-CATCH: a lesson NOT in knownLessons with a child level over 5.0 (and under 7.0) FAILS', () => {
    const m = measureLesson(lessonAt('llNEW-x', grade6));
    expect(m.bands.child.authored).toBeGreaterThan(NEW_LESSON_CHILD_CEILING);
    expect(m.bands.child.authored).toBeLessThanOrEqual(CHILD_CEILING);
    const scan = scanSeries([lessonAt('llNEW-x', grade6)]);
    const r = ratchet(scan, { inverted: [], childOverCeiling: [], knownLessons: ['llOLD-y'] });
    expect(r.freshOverCeiling).toEqual([]);            // the corpus ratchet alone would have let it through
    expect(r.freshOverNewCeiling).toEqual(['llNEW-x']); // the age ceiling catches it
  });

  it('the same text in a KNOWN lesson is judged by the 7.0 ratchet only', () => {
    const scan = scanSeries([lessonAt('llOLD-y', grade6)]);
    const r = ratchet(scan, { inverted: [], childOverCeiling: [], knownLessons: ['llOLD-y'] });
    expect(r.freshOverNewCeiling).toEqual([]);
  });

  it('a new lesson written for the age passes', () => {
    const scan = scanSeries([lessonAt('llNEW-z', grade2)]);
    const r = ratchet(scan, { inverted: [], childOverCeiling: [], knownLessons: [] });
    expect(r.freshOverNewCeiling).toEqual([]);
  });

  it('knownLessons is carried from the committed baseline, never rebuilt from the scan', () => {
    const fresh = buildBaseline(scanSeries([lessonAt('llNEW-z', grade2)]));
    expect(fresh.knownLessons).toEqual(baseline.knownLessons);
    expect(fresh.knownLessons).not.toContain('llNEW-z');
    expect(fresh.newLessonCeiling).toBe(NEW_LESSON_CHILD_CEILING);
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
    expect(
      r.freshOverNewCeiling,
      `these lessons were written after 2026-09-15 and their child level reads above grade ${baseline.newLessonCeiling} (ages 6–10 are grades 1–5):\n${r.freshOverNewCeiling.join('\n')}`,
    ).toEqual([]);
  });

  it('knownLessons is the 2026-09-15 corpus, fixed at 153, every one still on disk — and every lesson written since is held to the age', () => {
    expect(baseline.knownLessons.length).toBe(153);
    const onDisk = new Set(LIVING_LESSONS_MODULES.map((m) => m.id));
    for (const id of baseline.knownLessons) expect(onDisk.has(id), `${id} is in knownLessons but not on disk`).toBe(true);
    const newer = LIVING_LESSONS_MODULES.filter((m) => !baseline.knownLessons.includes(m.id));
    for (const m of newer) expect(breachesChildCeiling(measureLesson(m), NEW_LESSON_CHILD_CEILING), `${m.id} was written after the age ceiling and its child level reads above grade 5`).toBe(false);
  });

  it('the committed baseline is the REAL debt, not a painted number', () => {
    // A baseline that drifted from the scan would silently stop gating.
    const fresh = buildBaseline(scan);
    expect(fresh.inverted).toEqual(baseline.inverted);
    expect(fresh.childOverCeiling).toEqual(baseline.childOverCeiling);
    expect(fresh.measuredLessons).toBe(baseline.measuredLessons);
    expect(fresh.knownLessons).toEqual(baseline.knownLessons);
  });

  it('the youth debt the rung exposed is recorded, and may only shrink', () => {
    // 30 lessons read harder at youth than at teen the day the rung landed
    // (DR-0544). They are debt, not a pass: recording them is what lets the
    // gate fail a NEW one immediately. This number is a CEILING — every one
    // re-authored lowers it, and it must never rise.
    const withYouthInversion = scan.measured.filter((m) => {
      const b = m.bands;
      return b.youth && b.teen && b.child
        && (b.child.authored > b.youth.authored || b.youth.authored > b.teen.authored);
    });
    expect(withYouthInversion.length).toBeLessThanOrEqual(30);
    for (const m of withYouthInversion) {
      expect(baseline.inverted, `${m.id} inverts at the youth rung and is not recorded as debt`).toContain(m.id);
    }
  });

  it('the debt is real and non-empty — this gate is not decoration', () => {
    // If these ever reach zero, that is a genuine win and the assertions flip
    // to `toEqual([])`. Until then, pretending the debt is closed is the lie.
    expect(baseline.inverted.length).toBeGreaterThan(0);
    expect(baseline.childOverCeiling.length).toBeGreaterThan(0);
  });

  // The two newest lessons are the STANDARD the recorded debt is measured
  // against: every lesson authored since this gate landed must ascend cleanly
  // child -> teen -> senior. L130 (2026-09-07) is checked alongside L129 rather
  // than replacing it, so the standard accumulates instead of moving.
  it.each([['ll129-'], ['ll130-']])('%s, authored since this gate, is CLEAN', (prefix) => {
    const m = scan.measured.find((x) => x.id.startsWith(prefix));
    expect(m, `${prefix} must be measured`).toBeTruthy();
    expect(isInverted(m), 'a lesson authored since this gate must not invert').toBe(false);
    expect(breachesChildCeiling(m), 'its child level must sit under the ceiling').toBe(false);
    expect(m.bands.child.authored).toBeLessThan(m.bands.teen.authored);
    expect(m.bands.teen.authored).toBeLessThan(m.bands.senior.authored);
  });
});
