// @vitest-environment node
//
// wealth-lessons-class — "Stewardship & Wealth: The Way Up" must ride the SHARED
// Learn engine as a SELF-PACED, brain-sized, BUILDING series (meta.unit → "Lesson(s)",
// no cohort clock), carry age-adaptive levels (child + teen + senior on every lesson)
// + a passable quiz, hold the WELL-BEING + "teaching-not-personalized-advice" bright
// line on the money mechanics, obey the Typographic Theology bindings, and — the
// binding gate — quote ONLY VERBATIM KJV (DR-0076: no verse typed from memory; every
// quoted verse is checked against the in-repo public-domain KJV).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  WEALTH_LESSONS_META, WEALTH_LESSONS_MODULES, WEALTH_LESSONS_SESSION_MINUTES,
  WEALTH_LESSONS_CONFIRMED_COHORT, WEALTH_LESSONS_PROPOSED_COHORT_START,
  buildWealthLessonsSchedule, wealthLessonsProgressSummary, exportWealthLessonsCurriculumMarkdown,
  resolveWealthLessonsCohort, WEALTH_LESSONS_TUTOR_META,
  WEALTH_LESSONS_INTEREST_TAG, WEALTH_LESSONS_HELPER_TAG,
} from '../lib/wealth-lessons-class.js';
import { tutorSystemPrompt } from '../lib/class-tutor.js';
import { resolveLevel, lessonPlanForAge } from '../lib/learn-framework.js';

const KJV_DIR = join(dirname(fileURLToPath(import.meta.url)), '../../public/bible/kjv');
function kjv(book, chap, verses) {
  const data = JSON.parse(readFileSync(join(KJV_DIR, `${book}.json`), 'utf8'));
  const chapter = data.chapters[chap - 1];
  return verses.map((v) => chapter[v - 1]).join(' ');
}
// The whole authored corpus (every string a reader/teacher could see).
const CORPUS = WEALTH_LESSONS_MODULES.map((m) => [
  m.bigIdea, m.inApp, m.lesson, m.anchor?.theme,
  ...Object.values(m.levels || {}),
  ...(m.benefits || []),
  ...(m.facilitator?.talkingPoints || []),
  m.facilitator?.howToRun,
  ...(m.facilitator?.discussionPrompts || []),
].join('\n')).join('\n');

describe('curriculum shape (self-paced, building series)', () => {
  it('has the full eight-lesson set that builds in order, each with the required fields', () => {
    expect(WEALTH_LESSONS_MODULES).toHaveLength(8);
    expect(WEALTH_LESSONS_META.weeks).toBe(8);
    expect(WEALTH_LESSONS_MODULES.every((m) => m.id && m.title && m.bigIdea && m.inApp && m.anchor?.ref)).toBe(true);
    expect(WEALTH_LESSONS_MODULES.map((m) => m.id)).toEqual([
      'sw1-own-what-produces',
      'sw2-store-dont-devour',
      'sw3-the-borrower-is-servant',
      'sw4-buy-the-asset-not-the-spectacle',
      'sw5-pay-it-off',
      'sw6-the-refinance',
      'sw7-an-inheritance',
      'sw8-give-yahweh-the-glory',
    ]);
  });
  it('every lesson id is unique and prefixed sw*', () => {
    const ids = WEALTH_LESSONS_MODULES.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => id.startsWith('sw'))).toBe(true);
  });
  it('is configured as a SELF-PACED unit (lesson, not weekly cohort)', () => {
    expect(WEALTH_LESSONS_META.unit?.selfPaced).toBe(true);
    expect(WEALTH_LESSONS_META.unit?.noun).toBe('lesson');
    expect(WEALTH_LESSONS_SESSION_MINUTES).toBeGreaterThan(0);
  });
  it('every lesson carries the facilitator guide + a real lesson + benefits + passable quiz', () => {
    for (const m of WEALTH_LESSONS_MODULES) {
      expect(m.lesson.length).toBeGreaterThan(80);
      expect(m.facilitator.talkingPoints.length).toBeGreaterThan(0);
      expect(typeof m.facilitator.howToRun).toBe('string');
      expect(m.facilitator.discussionPrompts.length).toBeGreaterThan(0);
      expect(Array.isArray(m.benefits) && m.benefits.length).toBeTruthy();
      expect(m.quiz?.questions?.length).toBeGreaterThan(0);
      for (const q of m.quiz.questions) {
        expect(Array.isArray(q.options)).toBe(true);
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThan(q.options.length);
      }
    }
  });
});

describe('age-adaptive, brain-sized delivery (child + teen + senior on every lesson)', () => {
  it('EVERY lesson carries child + teen + senior level text (one curriculum, age-right)', () => {
    for (const m of WEALTH_LESSONS_MODULES) {
      for (const band of ['child', 'teen', 'senior']) {
        expect(typeof m.levels?.[band]).toBe('string');
        expect(m.levels[band].length).toBeGreaterThan(40);
      }
    }
  });
  it('a young band chunks a lesson into several short segments; an adult gets the whole lesson at once', () => {
    const m = WEALTH_LESSONS_MODULES.find((x) => x.id === 'sw6-the-refinance');
    expect(resolveLevel(m, 'senior').text).toBe(m.levels.senior);
    expect(lessonPlanForAge(m, 'child').totalSegments).toBeGreaterThan(1);
    expect(lessonPlanForAge(m, 'adult').totalSegments).toBe(1);
  });
});

describe('the series teaches its building substance in order', () => {
  const find = (id) => WEALTH_LESSONS_MODULES.find((m) => m.id === id);
  const blob = (id) => {
    const m = find(id);
    return (m.lesson + '\n' + m.levels.senior + '\n' + m.levels.teen + '\n' + m.bigIdea).toLowerCase();
  };
  it('L1 own-what-produces: the fruit tree / asset-vs-consumable / keep the tree', () => {
    const b = blob('sw1-own-what-produces');
    expect(b).toMatch(/fruit tree|seed is in itself/);
    expect(b).toMatch(/produc/);
    expect(b).toMatch(/consum|used up|firewood/);
  });
  it('L2 store-dont-devour: the store / the ant / slow beats fast', () => {
    const b = blob('sw2-store-dont-devour');
    expect(b).toMatch(/store/);
    expect(b).toMatch(/ant/);
    expect(b).toMatch(/emergency fund|reserve|buffer/);
  });
  it('L3 the-borrower-is-servant: debt as a claim on future work / trap vs tool / owe only love', () => {
    const b = blob('sw3-the-borrower-is-servant');
    expect(b).toMatch(/borrower is servant/);
    expect(b).toMatch(/future work|claim on your future|trap/);
    expect(b).toMatch(/owe no man/);
  });
  it('L4 buy-the-asset: the honeymoon-rental testimony / asset-vs-spectacle / prepare the field first', () => {
    const b = blob('sw4-buy-the-asset-not-the-spectacle');
    expect(b).toMatch(/christina/);
    expect(b).toMatch(/rental house|honeymoon/);
    expect(b).toMatch(/spectacle|produc/);
    expect(b).toMatch(/prepare (thy|the) work|field/);
  });
  it('L5 pay-it-off: free and clear / the widow’s oil order (pay first, then live) / launch pad', () => {
    const b = blob('sw5-pay-it-off');
    expect(b).toMatch(/free and clear|paid.?off/);
    expect(b).toMatch(/oil/);
    expect(b).toMatch(/pay thy debt|pay the debt/);
  });
  it('L6 the-refinance (keystone): ~80% LTV / loan-not-income / rent services the loan / keep the tree', () => {
    const b = blob('sw6-the-refinance');
    expect(b).toMatch(/refinance/);
    expect(b).toMatch(/80% ?(of|loan|ltv)|loan-to-value/);
    expect(b).toMatch(/not income|borrowed money is not income/);
    expect(b).toMatch(/not taxed as income|isn.t taxed as income|are not taxed as income/);
    expect(b).toMatch(/rent (the house earns )?services the (new )?loan|services (the )?loan/);
    expect(b).toMatch(/without (cutting|selling)|keep the tree|still standing/);
  });
  it('L7 inheritance: children’s children / river not a pile / the Way is the deepest inheritance', () => {
    const b = blob('sw7-an-inheritance');
    expect(b).toMatch(/children.s children/);
    expect(b).toMatch(/river|flow/);
    expect(b).toMatch(/the way|righteousness endures|testimony/);
  });
  it('L8 give-glory capstone: the danger is success / power to get wealth / He will not share His glory', () => {
    const b = blob('sw8-give-yahweh-the-glory');
    expect(b).toMatch(/my power|might of mine hand|hath gotten me this wealth/);
    expect(b).toMatch(/power to get wealth/);
    expect(b).toMatch(/glory will i not give|will not (give|share) (his |my )?glory|not share/);
    expect(b).toMatch(/received/);
  });
});

describe('WELL-BEING + honest bounds on the money mechanics (binding)', () => {
  it('the refinance lesson holds the "teaching, not personalized advice" line and the real cautions', () => {
    const m = WEALTH_LESSONS_MODULES.find((x) => x.id === 'sw6-the-refinance');
    const b = (m.lesson + JSON.stringify(m.facilitator) + m.levels.senior).toLowerCase();
    expect(b).toMatch(/not personalized|not .*advice|teaching, not/);
    expect(b).toMatch(/trusted advisor/);
    expect(b).toMatch(/over-leverage|able to make the payment|re-encumber/);
    expect(b).toMatch(/rates?|fees|appraisal/);
  });
  it('the course footer + tutor carry the not-advice bright line', () => {
    expect(WEALTH_LESSONS_META.footer.toLowerCase()).toMatch(/not personalized|not .*advice/);
    expect(WEALTH_LESSONS_TUTOR_META.posture.toLowerCase()).toMatch(/not personalized|not .*advice/);
  });
  it('money is framed as a tool/trust, never a master (no greed-preaching)', () => {
    const t = WEALTH_LESSONS_TUTOR_META.posture.toLowerCase();
    expect(t).toMatch(/never a master|tool and a trust|tool and a trust/);
    expect(t).toMatch(/never .*shame the poor|never shame the poor/);
  });
});

describe('Typographic Theology (CLAUDE.md binding rules) in authored content', () => {
  it('never lowercases the divine name Yahweh', () => {
    expect(CORPUS).not.toMatch(/\byahweh\b/);
  });
  it('never capitalizes the adversary as a proper name', () => {
    expect(CORPUS).not.toMatch(/\bSatan\b/);
    expect(CORPUS).not.toMatch(/\bLucifer\b/);
    expect(CORPUS).not.toMatch(/\bThe Devil\b/);
  });
});

describe('DR-0076 — every quoted verse fragment is VERBATIM KJV (checked against the in-repo Bible)', () => {
  // For each signature verse the lessons quote, a contiguous fragment the lesson
  // actually uses. Each fragment MUST (a) be a verbatim substring of the real
  // in-repo KJV verse — proving no word was typed from memory — AND (b) appear in
  // the authored corpus. Proven-to-catch: change one word in either place and this
  // fails. (Elided quotes marked with "..." are paraphrase-elisions, not tested
  // here; only contiguous quotations must be verbatim.)
  const QUOTED = [
    ['Genesis', 1, 11, 'the fruit tree yielding fruit after his kind, whose seed is in itself'],
    ['Proverbs', 27, 18, 'Whoso keepeth the fig tree shall eat the fruit thereof'],
    ['Proverbs', 21, 20, 'There is treasure to be desired and oil in the dwelling of the wise; but a foolish man spendeth it up'],
    ['Proverbs', 22, 7, 'the borrower is servant to the lender'],
    ['Romans', 13, 8, 'Owe no man any thing, but to love one another'],
    ['Proverbs', 24, 27, 'Prepare thy work without, and make it fit for thyself in the field; and afterwards build thine house'],
    ['Luke', 14, 28, 'intending to build a tower, sitteth not down first, and counteth the cost, whether he have sufficient to finish it?'],
    ['2Kings', 4, 7, 'sell the oil, and pay thy debt, and live thou and thy children of the rest'],
    ['Deuteronomy', 8, 18, 'it is he that giveth thee power to get wealth, that he may establish his covenant'],
    ['Proverbs', 13, 22, 'A good man leaveth an inheritance to his children’s children: and the wealth of the sinner is laid up for the just'],
    // Lesson 8 — the glory capstone
    ['Deuteronomy', 8, 17, 'My power and the might of mine hand hath gotten me this wealth'],
    ['Isaiah', 42, 8, 'my glory will I not give to another'],
    ['Isaiah', 48, 11, 'I will not give my glory unto another'],
    ['Psalms', 115, 1, 'Not unto us, O LORD, not unto us, but unto thy name give glory'],
    ['1Corinthians', 4, 7, 'what hast thou that thou didst not receive'],
    ['Romans', 11, 36, 'of him, and through him, and to him, are all things'],
  ];
  it.each(QUOTED)('%s %i:%i quoted verbatim', (book, chap, verse, fragment) => {
    const real = kjv(book, chap, [verse]);
    expect(real).toContain(fragment);   // (a) verbatim against the sovereign KJV
    expect(CORPUS).toContain(fragment); // (b) actually present in the lessons
  });
});

describe('shared machinery (self-paced schedule, progress, export, cohort, tutor)', () => {
  it('the schedule is self-paced — lesson numbers, NO painted dates', () => {
    const sched = buildWealthLessonsSchedule();
    expect(sched).toHaveLength(8);
    expect(sched[0].week).toBe(1);
    expect(sched.every((r) => r.date === null)).toBe(true);
  });
  it('progress is counted from the real record', () => {
    const r = wealthLessonsProgressSummary({ 'sw1-own-what-produces': true, 'sw6-the-refinance': true });
    expect(r.total).toBe(8);
    expect(r.done).toBe(2);
    expect(r.pct).toBe(Math.round((2 / 8) * 100));
  });
  it('the cohort resolves self-paced (never a painted confirmed date)', () => {
    expect(WEALTH_LESSONS_CONFIRMED_COHORT.confirmed).toBe(false);
    expect(WEALTH_LESSONS_PROPOSED_COHORT_START).toBe(null);
    expect(resolveWealthLessonsCohort(null).confirmed).toBe(false);
  });
  it('the markdown export carries the title and a real lesson row', () => {
    const md = exportWealthLessonsCurriculumMarkdown();
    expect(md).toContain('# Stewardship & Wealth: The Way Up');
    expect(md).toContain(WEALTH_LESSONS_MODULES[0].title);
    expect(md.toLowerCase()).toContain('lesson 1');
  });
  it('the tutor prompt is stewardship-flavored, holds the verify discipline, and names the lesson', () => {
    const sys = tutorSystemPrompt(WEALTH_LESSONS_MODULES[5], WEALTH_LESSONS_TUTOR_META);
    expect(sys).toContain('Stewardship & Wealth');
    expect(sys.toLowerCase()).toMatch(/verify|wrong|fabricate/);
    expect(sys).toContain(WEALTH_LESSONS_MODULES[5].title);
  });
  it('has distinct interest + helper tags so the Governor roster separates sign-ups', () => {
    expect(WEALTH_LESSONS_INTEREST_TAG).toMatch(/Stewardship & Wealth/);
    expect(WEALTH_LESSONS_HELPER_TAG).toMatch(/Stewardship & Wealth/);
    expect(WEALTH_LESSONS_INTEREST_TAG).not.toBe(WEALTH_LESSONS_HELPER_TAG);
  });
});
