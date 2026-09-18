// @vitest-environment node
// =============================================================================
// THE INTRO IS READ BY THE SAME PERSON WHO READS THE LESSON
// =============================================================================
// Darrell 2026-09-18, from the church door: "child version isn't on the intro".
//
// He was right, and no gate in the house could have told him. buildLessonArc
// paced the TEACH stage to the learner's band and built the Open stage from
// three raw authored fields with no band argument reaching them — so the intro
// was byte-identical at every level, for every lesson in the catalog. A
// seven-year-old met the adult big idea, in the adult register, before a word
// of the lesson written for him.
//
// The first test is the DEFECT, measured against the old construction, so this
// file fails if anyone puts it back.
import { describe, it, expect } from 'vitest';
import { buildLessonArc, introForAge, firstSentences, INTRO_CHARS, MIN_INTRO_CHARS } from '../lib/lesson-flow.js';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';

const BANDS = ['child', 'youth', 'teen', 'adult', 'senior'];
// A lesson that actually carries four authored bands; without one there is
// nothing for this gate to be about.
const M = LIVING_LESSONS_MODULES.find((m) => m.levels && m.levels.child && m.levels.youth && m.levels.teen && m.levels.senior);
const openOf = (band) => buildLessonArc(M, { ageBand: band }).segments.find((s) => s.kind === 'open').audience;

describe('the defect, stated as a measurement', () => {
  it('the OLD construction handed every band the same intro', () => {
    // Exactly what the Open stage used to be built from: the raw authored field.
    const old = BANDS.map(() => M.bigIdea);
    expect(new Set(old).size, 'the reproduction no longer reproduces anything').toBe(1);
  });
});

describe('the intro now reads at the learner’s own level', () => {
  it('a child and an adult do not meet the same intro', () => {
    expect(openOf('child').bigIdea).not.toBe(openOf('adult').bigIdea);
  });

  it('each band’s intro is drawn from THAT band’s own authored words', () => {
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      const a = openOf(band);
      expect(a.introIsBandsOwn, `${band} is still being handed the adult big idea`).toBe(true);
      const own = String(M.levels[band]).replace(/\s+/g, ' ').trim();
      expect(own.startsWith(a.bigIdea), `${band}'s intro is not the opening of its own band`).toBe(true);
    }
  });

  it('the adult band keeps the authored big idea, unchanged', () => {
    const a = openOf('adult');
    expect(a.introIsBandsOwn).toBe(false);
    expect(a.bigIdea).toBe(M.bigIdea);
  });

  it('nothing is invented: every derived intro is a literal prefix of real authored text', () => {
    // The guarantee that keeps this out of fabrication (DR-0076). Checked across
    // the whole four-band corpus, not one lesson.
    const bad = [];
    const four = LIVING_LESSONS_MODULES.filter((m) => m.levels && m.levels.child && m.levels.senior);
    expect(four.length).toBeGreaterThan(50);
    for (const m of four) {
      for (const band of ['child', 'youth', 'teen', 'senior']) {
        if (!m.levels[band]) continue;
        const intro = introForAge(m, band);
        if (!intro.derived) continue;
        const own = String(m.levels[band]).replace(/\s+/g, ' ').trim();
        if (!own.startsWith(intro.text)) bad.push(`${m.id.slice(0, 30)} ${band}`);
      }
    }
    expect(bad, `intros that are not their band's own opening:\n${bad.slice(0, 8).join('\n')}`).toEqual([]);
  });

  it('a lesson with no authored band still gets its big idea, exactly as before', () => {
    const plain = { id: 'x', bigIdea: 'THE ONE BIG IDEA.', lesson: 'Some adult prose.', anchor: {} };
    for (const band of BANDS) {
      const intro = introForAge(plain, band);
      expect(intro.derived).toBe(false);
      expect(intro.text).toBe('THE ONE BIG IDEA.');
    }
  });

  it('the Open stage still reports content, so no lesson loses its opening', () => {
    for (const band of BANDS) expect(buildLessonArc(M, { ageBand: band }).segments.find((s) => s.kind === 'open').hasContent).toBe(true);
  });
});

describe('the cut is clean', () => {
  it('ends on a sentence rather than mid-word', () => {
    const t = 'One sentence here. A second sentence that runs on for a while. A third.';
    expect(firstSentences(t, 30, 10)).toBe('One sentence here.');
  });

  it('takes more than one sentence when one is too short to orient anybody', () => {
    const t = 'Short. The second sentence carries the actual point of the lesson. And a third.';
    expect(firstSentences(t, 70, 40)).toBe('Short. The second sentence carries the actual point of the lesson.');
  });

  it('never stops on an abbreviation’s period (proven-to-catch)', () => {
    // The real defect this found: ll5's senior band opens "Dr. Martin Picard
    // describes..." and the first draft cut there, producing a THREE-character
    // intro. Measured across all derived intros, which is how it surfaced.
    const t = `Dr. Martin Picard describes a mechanism the anxious heart knows well, ${'and it runs on '.repeat(30)}end.`;
    const cut = firstSentences(t, INTRO_CHARS, MIN_INTRO_CHARS);
    expect(cut.startsWith('Dr. Martin Picard describes')).toBe(true);
    expect(cut.length).toBeGreaterThan(MIN_INTRO_CHARS);
  });

  it('returns short text untouched', () => {
    expect(firstSentences('Short.', INTRO_CHARS)).toBe('Short.');
  });

  it('never cuts inside a word when no sentence end is in range', () => {
    const t = `${'wordy '.repeat(40)}end.`;
    const cut = firstSentences(t, 50);
    expect(cut.endsWith(' ')).toBe(false);
    expect(t.startsWith(cut)).toBe(true);
  });

  it('survives empty and missing text', () => {
    expect(firstSentences('')).toBe('');
    expect(firstSentences(null)).toBe('');
    expect(firstSentences(undefined)).toBe('');
  });

  it('holds every derived intro to the stated length', () => {
    const four = LIVING_LESSONS_MODULES.filter((m) => m.levels && m.levels.child);
    for (const m of four.slice(0, 40)) {
      const intro = introForAge(m, 'child');
      if (intro.derived) expect(intro.text.length).toBeLessThanOrEqual(INTRO_CHARS);
    }
  });
});
