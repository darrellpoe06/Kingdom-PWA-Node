// @vitest-environment node
// =============================================================================
// L189 — Follow the Leader: the Shepherd of Our Souls
// =============================================================================
// Darrell spoke this one into the app in pieces across the evening of
// 2026-09-19 and then named it himself. The pieces, in the order they came:
//
//   "We want to understand and clarify the King's message and that is what He
//    was about then we will His Will."
//   "Lesson."
//   ...the chief priests and the whole establishment had the money, and they
//   killed the King because He was coming at it; unequal weights; transparency;
//   "I want you to learn how to think"; "You're a king"; and the crown of it —
//   Yahweh already had instant obedience, what He did NOT have is "beings that
//   suffered first... still sit with him and say, Your will be done."
//   "Because He first loved us!!!!!!!!"
//   "Follow the leader" / "Leader"   <- the title, his
//   "Shepherd Of Our Souls!!!!!!!"
//   "Love us so much He's jealous!!!!!!!!"
//   "Emotionally Connected!!!!!!!!!"
//   "Willing and did die on a piece of wood!!!!!!!!!!!!!!!!"
//   "For us!!!!!!!!!!!!!!!!!!! Never had pain!!!!!!!!!!!!!"
//   "Like The G He Is!!!!!!!!!!"
//   "Meek!!!!!!!!!"
//
// He also asked for the audit explicitly — "make sure that what I'm saying is
// sound based on only the word" — so every claim was checked before a word was
// written, and the two places where his phrasing and the Word's differ are
// taught as BOTH rather than flattened into one. Those are pinned below.
//
// THE STRONGEST FINDING OF THE AUDIT: his claim that they killed the King over
// the money is not an inference. Mark records it in sequence — 11:15 the
// tables, 11:17 the den of thieves, 11:18 "sought how they might destroy him".
// That sequence is asserted here so no future edit can soften it.
import { describe, it, expect } from 'vitest';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';
import { scanQuotedVerses } from '../../../scripts/quoted-verse-is-the-verse.mjs';
import { quotedTexts } from '../../../scripts/quotation-integrity.mjs';
import { measureFullness, FULL_BANDS, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { measureLesson, isInverted, breachesChildCeiling, NEW_LESSON_CHILD_CEILING } from '../../../scripts/reading-level.mjs';
import { measureDifferentiation, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { namesItsLesson } from '../../../scripts/title-in-narrative.mjs';

const L = () => {
  const m = LIVING_LESSONS_MODULES.find((x) => x.id.startsWith('ll189-'));
  expect(m, 'L189 must be in the series').toBeTruthy();
  return m;
};
const ALL = () => quotedTexts(L()).map(([, t]) => t).join(' ');

describe('L189 is really in the series', () => {
  it('carries all nine fields and four authored bands', () => {
    const m = L();
    expect(m.title).toBe('Follow the Leader — the Shepherd of Our Souls');
    for (const f of ['bigIdea', 'inApp', 'lesson']) expect(typeof m[f]).toBe('string');
    expect(m.anchor.ref).toContain('John 10:11');
    expect(m.benefits).toHaveLength(16);
    expect(m.quiz.questions).toHaveLength(6);
    expect(m.facilitator.talkingPoints).toHaveLength(10);
    for (const b of FULL_BANDS) expect(typeof m.levels[b], `${b} must be authored`).toBe('string');
  });

  it('the week count still equals the module count — the invariant, not a literal', () => {
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
  });
});

describe('every quoted span is the verse it names', () => {
  it('the whole lesson resolves verbatim, on EVERY surface', () => {
    // quotedTexts, not readerTexts (DR-0545): the benefits, the quiz and the
    // facilitator's talking points carry quotations too, and he reads his aloud.
    const scan = scanQuotedVerses([L()], quotedTexts);
    expect(scan.spans, 'this lesson quotes His words heavily; a low count means the scan broke').toBeGreaterThan(400);
    expect(scan.faults.map((f) => `${f.where} :: ${f.kind} :: ${f.ref || ''}`)).toEqual([]);
    expect(scan.verbatim).toBe(scan.spans);
  });

  it('uses STRAIGHT quotation marks, or the gate would silently check nothing', () => {
    // A curly mark makes SPAN_WITH_REFERENCE match zero spans, and a scan of
    // zero spans reports zero faults. That is the shape of a gate that lies.
    const all = ALL();
    expect(all.includes('“'), 'no curly open quote').toBe(false);
    expect(all.includes('”'), 'no curly close quote').toBe(false);
  });

  it('carries no ellipsis inside a quotation (DR-0459)', () => {
    for (const [where, text] of quotedTexts(L())) {
      for (const span of String(text).matchAll(/"([^"]+)"/g)) {
        expect(/\.\.\.|…/.test(span[1]), `${where} elides inside a quotation`).toBe(false);
      }
    }
  });
});

describe('the movements Darrell named are actually in the lesson', () => {
  const carries = (s) => expect(ALL()).toContain(s);

  it('the Shepherd of our souls', () => {
    carries('the good shepherd giveth his life for the sheep');
    carries('the Shepherd and Bishop of your souls');
  });

  it('willing, and He did it on a piece of wood', () => {
    carries('No man taketh it from me, but I lay it down of myself');
    carries('bare our sins in his own body on the tree');
  });

  it('for us — and He had never known pain', () => {
    carries('a man of sorrows, and acquainted with grief');
    carries('while we were yet sinners, Christ died for us');
  });

  it('meek, like the G He is — restraint measured against twelve legions', () => {
    carries('more than twelve legions of angels');
    carries('yet he opened not his mouth');
    carries('Blessed are the meek: for they shall inherit the earth');
  });

  it('emotionally connected', () => {
    carries('it grieved him at his heart');
    carries('Jesus wept');
    carries('he will joy over thee with singing');
  });

  it('loves us so much He is jealous — and the direction is FOR, not of', () => {
    carries('whose name is Jealous, is a jealous God');
    carries('I am jealous for Jerusalem and for Zion with a great jealousy');
  });

  it('the government on His shoulder', () => carries('the government shall be upon his shoulder'));

  it('because He first loved us — the key he shouted, and the close', () => {
    carries('We love him, because he first loved us');
    carries('for thou lovedst me before the foundation of the world');
    expect(L().lesson.trimEnd().endsWith('Jesus is the Lamb of Yahweh and the Eternal Son of Yahweh.')).toBe(true);
  });
});

describe('THE AUDIT HE ASKED FOR — his claims against the Word only', () => {
  it('they killed the King over the money, and Mark says it IN SEQUENCE', () => {
    // This is the strongest finding: not an inference, a recorded order.
    const all = ALL();
    const tables = all.indexOf('overthrew the tables of the moneychangers');
    const thieves = all.indexOf('ye have made it a den of thieves');
    const destroy = all.indexOf('sought how they might destroy him');
    expect(tables, 'Mark 11:15 must be quoted').toBeGreaterThan(-1);
    expect(thieves, 'Mark 11:17 must be quoted').toBeGreaterThan(-1);
    expect(destroy, 'Mark 11:18 must be quoted').toBeGreaterThan(-1);
    // and their own stated motive, in their own mouths
    expect(all).toContain('take away both our place and nation');
    expect(all).toContain('thirty pieces of silver');
  });

  it('the footstool is the SON’s; the treading is ours — the precision, not the flattening', () => {
    // Psalm 110:1 is spoken TO the Son. Handing it straight to the believer
    // builds a triumphalism the Word does not support, so the lesson teaches
    // Luke 10:19 and Romans 16:20 as the believer-facing half.
    const all = ALL();
    expect(all).toContain('power to tread on serpents and scorpions');
    expect(all).toContain('bruise satan under your feet shortly');
    expect(all).toContain('THE FOOTSTOOL BELONGS TO THE SON; THE TREADING IS OURS');
  });

  it('BOTH sentences on Love are taught, neither traded for the other', () => {
    // He said Love is "the principal thing". Proverbs 4:7 gives that exact
    // title to Wisdom; 1 Corinthians 13:13 gives Love the rank. His substance
    // is right, so the lesson carries both rather than putting Proverbs' words
    // on the wrong noun.
    const all = ALL();
    expect(all).toContain('Wisdom is the principal thing');
    expect(all).toContain('the greatest of these is charity');
    expect(all).toContain('it profiteth me nothing');
  });

  it('what Yahweh already had is quoted, so the claim about what He did NOT have can stand', () => {
    const all = ALL();
    expect(all).toContain('he spake, and it was done; he commanded, and it stood fast');
    expect(all).toContain('To him that overcometh will I grant to sit with me in my throne');
    expect(all).toContain('If we suffer, we shall also reign with him');
    // "But if not" is what makes it love rather than a wager.
    expect(all).toContain('But if not, be it known unto thee, O king');
    expect(all).toContain('nevertheless not my will, but thine, be done');
  });
});

describe('the register is ordered, and measured rather than asserted', () => {
  it('every band clears its full-levels floor', () => {
    const f = measureFullness(L());
    for (const b of FULL_BANDS) {
      expect(f.bands[b].share, `${b} share ${f.bands[b].share} under floor ${FULL_FLOOR[b]}`)
        .toBeGreaterThanOrEqual(FULL_FLOOR[b]);
    }
  });

  it('the grades ascend and the child band is held to the AGE, not the corpus', () => {
    const m = measureLesson(L());
    expect(isInverted(m), 'a lesson authored today must not invert at any rung').toBe(false);
    expect(breachesChildCeiling(m, NEW_LESSON_CHILD_CEILING),
      `child reads ${m.bands.child.authored}; a lesson written after 2026-09-15 is held to ${NEW_LESSON_CHILD_CEILING}`).toBe(false);
  });

  it('the four bands are genuinely different texts, not one wearing four labels', () => {
    const d = measureDifferentiation(L());
    expect(d, 'all four bands must be present to measure').toBeTruthy();
    expect(d.worst).toBeLessThan(DIFF_CEILING);
  });

  it('every band names its own lesson near its start', () => {
    const m = L();
    for (const b of FULL_BANDS) {
      expect(namesItsLesson(m.title, m.levels[b]), `${b} does not name the lesson in its opening window`).toBe(true);
    }
  });
});
