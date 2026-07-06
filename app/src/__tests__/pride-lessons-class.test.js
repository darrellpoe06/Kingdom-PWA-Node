// @vitest-environment node
//
// pride-lessons-class — "Pride Before the Fall: The Increase Is the Lord's" must
// ride the SHARED Learn engine as a SELF-PACED, brain-sized, BUILDING series
// (meta.unit → "Lesson(s)", no cohort clock), carry age-adaptive levels (child +
// teen + senior on every lesson) + a passable quiz, hold the WELL-BEING line
// (gratitude, never self-contempt), obey the Typographic Theology bindings, and —
// the binding gate — quote ONLY VERBATIM KJV (DR-0076: every quoted verse checked
// against the in-repo public-domain KJV).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PRIDE_LESSONS_META, PRIDE_LESSONS_MODULES, PRIDE_LESSONS_SESSION_MINUTES,
  PRIDE_LESSONS_CONFIRMED_COHORT, PRIDE_LESSONS_PROPOSED_COHORT_START,
  buildPrideLessonsSchedule, prideLessonsProgressSummary, exportPrideLessonsCurriculumMarkdown,
  resolvePrideLessonsCohort, PRIDE_LESSONS_TUTOR_META,
  PRIDE_LESSONS_INTEREST_TAG, PRIDE_LESSONS_HELPER_TAG,
} from '../lib/pride-lessons-class.js';
import { tutorSystemPrompt } from '../lib/class-tutor.js';
import { resolveLevel, lessonPlanForAge } from '../lib/learn-framework.js';

const KJV_DIR = join(dirname(fileURLToPath(import.meta.url)), '../../public/bible/kjv');
function kjv(book, chap, verses) {
  const data = JSON.parse(readFileSync(join(KJV_DIR, `${book}.json`), 'utf8'));
  const chapter = data.chapters[chap - 1];
  return verses.map((v) => chapter[v - 1]).join(' ');
}
const CORPUS = PRIDE_LESSONS_MODULES.map((m) => [
  m.bigIdea, m.inApp, m.lesson, m.anchor?.theme,
  ...Object.values(m.levels || {}),
  ...(m.benefits || []),
  ...(m.facilitator?.talkingPoints || []),
  m.facilitator?.howToRun,
  ...(m.facilitator?.discussionPrompts || []),
].join('\n')).join('\n');

describe('curriculum shape (self-paced, building series)', () => {
  it('has the full six-lesson set that builds in order, each with the required fields', () => {
    expect(PRIDE_LESSONS_MODULES).toHaveLength(6);
    expect(PRIDE_LESSONS_META.weeks).toBe(6);
    expect(PRIDE_LESSONS_MODULES.every((m) => m.id && m.title && m.bigIdea && m.inApp && m.anchor?.ref)).toBe(true);
    expect(PRIDE_LESSONS_MODULES.map((m) => m.id)).toEqual([
      'pf1-pride-goes-before-the-fall',
      'pf2-the-increase-is-the-lords',
      'pf3-except-the-lord-build-the-house',
      'pf4-be-grateful-not-proud',
      'pf5-he-makes-us-win',
      'pf6-humble-yourself-and-he-lifts-you',
    ]);
  });
  it('every lesson id is unique and prefixed pf*', () => {
    const ids = PRIDE_LESSONS_MODULES.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => id.startsWith('pf'))).toBe(true);
  });
  it('is configured as a SELF-PACED unit (lesson, not weekly cohort)', () => {
    expect(PRIDE_LESSONS_META.unit?.selfPaced).toBe(true);
    expect(PRIDE_LESSONS_META.unit?.noun).toBe('lesson');
    expect(PRIDE_LESSONS_SESSION_MINUTES).toBeGreaterThan(0);
  });
  it('every lesson carries the facilitator guide + a real lesson + benefits + passable quiz', () => {
    for (const m of PRIDE_LESSONS_MODULES) {
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
  it('EVERY lesson carries child + teen + senior level text', () => {
    for (const m of PRIDE_LESSONS_MODULES) {
      for (const band of ['child', 'teen', 'senior']) {
        expect(typeof m.levels?.[band]).toBe('string');
        expect(m.levels[band].length).toBeGreaterThan(40);
      }
    }
  });
  it('a young band chunks a lesson into several short segments; an adult gets it at once', () => {
    const m = PRIDE_LESSONS_MODULES.find((x) => x.id === 'pf2-the-increase-is-the-lords');
    expect(resolveLevel(m, 'senior').text).toBe(m.levels.senior);
    expect(lessonPlanForAge(m, 'child').totalSegments).toBeGreaterThan(1);
    expect(lessonPlanForAge(m, 'adult').totalSegments).toBe(1);
  });
});

describe('the series teaches its building substance in order', () => {
  const find = (id) => PRIDE_LESSONS_MODULES.find((m) => m.id === id);
  const blob = (id) => {
    const m = find(id);
    return (m.lesson + '\n' + m.levels.senior + '\n' + m.levels.teen + '\n' + m.bigIdea).toLowerCase();
  };
  it('L1: pride goes before the fall / defined as taking God’s credit / before honour is humility', () => {
    const b = blob('pf1-pride-goes-before-the-fall');
    expect(b).toMatch(/pride goeth before/);
    expect(b).toMatch(/haughty|credit|lifting self|above others/);
    expect(b).toMatch(/before honour is humility/);
  });
  it('L2: the increase is the Lord’s / plant & water / the thousand-years point', () => {
    const b = blob('pf2-the-increase-is-the-lords');
    expect(b).toMatch(/god gave the increase|giveth the increase/);
    expect(b).toMatch(/plant|water/);
    expect(b).toMatch(/thousand years/);
  });
  it('L3: except the Lord build the house / without me nothing / Peter’s empty nets', () => {
    const b = blob('pf3-except-the-lord-build-the-house');
    expect(b).toMatch(/except the lord build the house/);
    expect(b).toMatch(/without me ye can do nothing/);
    expect(b).toMatch(/toiled all the night|empty nets/);
  });
  it('L4: be grateful not proud / what hast thou that thou didst not receive / glory in knowing Him', () => {
    const b = blob('pf4-be-grateful-not-proud');
    expect(b).toMatch(/grateful|gratitude/);
    expect(b).toMatch(/didst not receive/);
    expect(b).toMatch(/glory in|knoweth me|knowing (god|him|yahweh)/);
  });
  it('L5: He makes us win / victory is given not earned / not by their own sword or arm', () => {
    const b = blob('pf5-he-makes-us-win');
    expect(b).toMatch(/makes us win|giveth us the victory/);
    expect(b).toMatch(/triumph/);
    expect(b).toMatch(/own sword|own arm|right hand/);
  });
  it('L6: humble yourself and He lifts you / God resists the proud / Nebuchadnezzar', () => {
    const b = blob('pf6-humble-yourself-and-he-lifts-you');
    expect(b).toMatch(/humble yourselves|humble yourself/);
    expect(b).toMatch(/resisteth the proud|resists the proud/);
    expect(b).toMatch(/nebuchadnezzar|great babylon|my majesty/);
  });
});

describe('WELL-BEING: gratitude, never self-contempt (binding)', () => {
  it('the grateful-not-proud lesson explicitly rejects self-contempt as the cure', () => {
    const m = PRIDE_LESSONS_MODULES.find((x) => x.id === 'pf4-be-grateful-not-proud');
    const b = (m.lesson + JSON.stringify(m.facilitator) + m.levels.senior).toLowerCase();
    expect(b).toMatch(/not self-contempt|isn.t self-hatred|not.*worthless|pride (flipped|inverted)/);
    expect(b).toMatch(/grateful|gratitude/);
  });
  it('the tutor posture frames the cure as gratitude, not shame, and gives Yahweh the glory', () => {
    const p = PRIDE_LESSONS_TUTOR_META.posture.toLowerCase();
    expect(p).toMatch(/never self-contempt|pride inverted/);
    expect(p).toMatch(/never shame/);
    expect(p).toMatch(/increase and the victory are (his|yahweh|the lord)/);
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
  const QUOTED = [
    ['Proverbs', 16, 18, 'Pride goeth before destruction, and an haughty spirit before a fall'],
    ['Proverbs', 18, 12, 'Before destruction the heart of man is haughty, and before honour is humility'],
    ['1Corinthians', 3, 6, 'I have planted, Apollos watered; but God gave the increase'],
    ['1Corinthians', 3, 7, 'but God that giveth the increase'],
    ['Psalms', 127, 1, 'Except the LORD build the house, they labour in vain that build it'],
    ['John', 15, 5, 'without me ye can do nothing'],
    ['Luke', 5, 5, 'toiled all the night'],
    ['1Corinthians', 4, 7, 'what hast thou that thou didst not receive'],
    ['Jeremiah', 9, 23, 'Let not the wise man glory in his wisdom, neither let the mighty man glory in his might'],
    ['1Corinthians', 15, 57, 'thanks be to God, which giveth us the victory'],
    ['2Corinthians', 2, 14, 'which always causeth us to triumph in Christ'],
    ['Psalms', 44, 3, 'they got not the land in possession by their own sword, neither did their own arm save them'],
    ['James', 4, 10, 'Humble yourselves in the sight of the Lord, and he shall lift you up'],
    ['James', 4, 6, 'God resisteth the proud, but giveth grace unto the humble'],
    ['1Peter', 5, 6, 'Humble yourselves therefore under the mighty hand of God, that he may exalt you in due time'],
    ['Daniel', 4, 30, 'Is not this great Babylon, that I have built for the house of the kingdom by the might of my power'],
    ['Daniel', 4, 37, 'those that walk in pride he is able to abase'],
  ];
  it.each(QUOTED)('%s %i:%i quoted verbatim', (book, chap, verse, fragment) => {
    const real = kjv(book, chap, [verse]);
    expect(real).toContain(fragment);
    expect(CORPUS).toContain(fragment);
  });
});

describe('shared machinery (self-paced schedule, progress, export, cohort, tutor)', () => {
  it('the schedule is self-paced — lesson numbers, NO painted dates', () => {
    const sched = buildPrideLessonsSchedule();
    expect(sched).toHaveLength(6);
    expect(sched[0].week).toBe(1);
    expect(sched.every((r) => r.date === null)).toBe(true);
  });
  it('progress is counted from the real record', () => {
    const r = prideLessonsProgressSummary({ 'pf1-pride-goes-before-the-fall': true, 'pf5-he-makes-us-win': true });
    expect(r.total).toBe(6);
    expect(r.done).toBe(2);
    expect(r.pct).toBe(Math.round((2 / 6) * 100));
  });
  it('the cohort resolves self-paced (never a painted confirmed date)', () => {
    expect(PRIDE_LESSONS_CONFIRMED_COHORT.confirmed).toBe(false);
    expect(PRIDE_LESSONS_PROPOSED_COHORT_START).toBe(null);
    expect(resolvePrideLessonsCohort(null).confirmed).toBe(false);
  });
  it('the markdown export carries the title and a real lesson row', () => {
    const md = exportPrideLessonsCurriculumMarkdown();
    expect(md).toContain('# Pride Before the Fall: The Increase Is the Lord’s');
    expect(md).toContain(PRIDE_LESSONS_MODULES[0].title);
    expect(md.toLowerCase()).toContain('lesson 1');
  });
  it('the tutor prompt is pride-series-flavored, holds the verify discipline, and names the lesson', () => {
    const sys = tutorSystemPrompt(PRIDE_LESSONS_MODULES[1], PRIDE_LESSONS_TUTOR_META);
    expect(sys).toContain('Pride Before the Fall');
    expect(sys.toLowerCase()).toMatch(/verify|wrong|fabricate/);
    expect(sys).toContain(PRIDE_LESSONS_MODULES[1].title);
  });
  it('has distinct interest + helper tags so the Governor roster separates sign-ups', () => {
    expect(PRIDE_LESSONS_INTEREST_TAG).toMatch(/Pride & the Increase/);
    expect(PRIDE_LESSONS_HELPER_TAG).toMatch(/Pride & the Increase/);
    expect(PRIDE_LESSONS_INTEREST_TAG).not.toBe(PRIDE_LESSONS_HELPER_TAG);
  });
});
