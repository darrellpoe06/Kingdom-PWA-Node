// @vitest-environment node
//
// adoption-lessons-class — "The Spirit of Adoption: Made Wholly His" must ride the
// SHARED Learn engine as a SELF-PACED, brain-sized, BUILDING series (meta.unit →
// "Lesson(s)", no cohort clock), carry age-adaptive levels (child + teen + senior
// on every lesson) + a passable quiz, hold the WELL-BEING line (full belonging,
// chosen, never earned), obey the Typographic Theology bindings, and — the binding
// gate — quote ONLY VERBATIM KJV (DR-0076: every quoted verse checked against the
// in-repo KJV).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ADOPTION_LESSONS_META, ADOPTION_LESSONS_MODULES, ADOPTION_LESSONS_SESSION_MINUTES,
  ADOPTION_LESSONS_CONFIRMED_COHORT, ADOPTION_LESSONS_PROPOSED_COHORT_START,
  buildAdoptionLessonsSchedule, adoptionLessonsProgressSummary, exportAdoptionLessonsCurriculumMarkdown,
  resolveAdoptionLessonsCohort, ADOPTION_LESSONS_TUTOR_META,
  ADOPTION_LESSONS_INTEREST_TAG, ADOPTION_LESSONS_HELPER_TAG,
} from '../lib/adoption-lessons-class.js';
import { tutorSystemPrompt } from '../lib/class-tutor.js';
import { resolveLevel, lessonPlanForAge } from '../lib/learn-framework.js';

const KJV_DIR = join(dirname(fileURLToPath(import.meta.url)), '../../public/bible/kjv');
function kjv(book, chap, verses) {
  const data = JSON.parse(readFileSync(join(KJV_DIR, `${book}.json`), 'utf8'));
  const chapter = data.chapters[chap - 1];
  return verses.map((v) => chapter[v - 1]).join(' ');
}
const CORPUS = ADOPTION_LESSONS_MODULES.map((m) => [
  m.bigIdea, m.inApp, m.lesson, m.anchor?.theme,
  ...Object.values(m.levels || {}),
  ...(m.benefits || []),
  ...(m.facilitator?.talkingPoints || []),
  m.facilitator?.howToRun,
  ...(m.facilitator?.discussionPrompts || []),
].join('\n')).join('\n');

describe('curriculum shape (self-paced, building series)', () => {
  it('has the full five-lesson set that builds in order, each with the required fields', () => {
    expect(ADOPTION_LESSONS_MODULES).toHaveLength(5);
    expect(ADOPTION_LESSONS_META.weeks).toBe(5);
    expect(ADOPTION_LESSONS_MODULES.every((m) => m.id && m.title && m.bigIdea && m.inApp && m.anchor?.ref)).toBe(true);
    expect(ADOPTION_LESSONS_MODULES.map((m) => m.id)).toEqual([
      'ad1-the-spirit-of-adoption',
      'ad2-no-more-a-servant-but-a-son',
      'ad3-a-father-to-the-fatherless',
      'ad4-what-manner-of-love-chosen',
      'ad5-full-family-full-inheritance',
    ]);
  });
  it('every lesson id is unique and prefixed ad*', () => {
    const ids = ADOPTION_LESSONS_MODULES.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => id.startsWith('ad'))).toBe(true);
  });
  it('is configured as a SELF-PACED unit (lesson, not weekly cohort)', () => {
    expect(ADOPTION_LESSONS_META.unit?.selfPaced).toBe(true);
    expect(ADOPTION_LESSONS_META.unit?.noun).toBe('lesson');
    expect(ADOPTION_LESSONS_SESSION_MINUTES).toBeGreaterThan(0);
  });
  it('every lesson carries the facilitator guide + a real lesson + benefits + passable quiz', () => {
    for (const m of ADOPTION_LESSONS_MODULES) {
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
    for (const m of ADOPTION_LESSONS_MODULES) {
      for (const band of ['child', 'teen', 'senior']) {
        expect(typeof m.levels?.[band]).toBe('string');
        expect(m.levels[band].length).toBeGreaterThan(40);
      }
    }
  });
  it('a young band chunks a lesson into several short segments; an adult gets it at once', () => {
    const m = ADOPTION_LESSONS_MODULES.find((x) => x.id === 'ad2-no-more-a-servant-but-a-son');
    expect(resolveLevel(m, 'senior').text).toBe(m.levels.senior);
    expect(lessonPlanForAge(m, 'child').totalSegments).toBeGreaterThan(1);
    expect(lessonPlanForAge(m, 'adult').totalSegments).toBe(1);
  });
});

describe('the series teaches its building substance in order', () => {
  const find = (id) => ADOPTION_LESSONS_MODULES.find((m) => m.id === id);
  const blob = (id) => {
    const m = find(id);
    return (m.lesson + '\n' + m.levels.senior + '\n' + m.levels.teen + '\n' + m.bigIdea).toLowerCase();
  };
  it('L1: the Spirit of adoption, not fear again / Abba / the Spirit witnesses', () => {
    const b = blob('ad1-the-spirit-of-adoption');
    expect(b).toMatch(/spirit of adoption/);
    expect(b).toMatch(/abba/);
    expect(b).toMatch(/beareth witness|bears witness|children of god/);
  });
  it('L2: no more a servant but a son / redeemed / heir', () => {
    const b = blob('ad2-no-more-a-servant-but-a-son');
    expect(b).toMatch(/no more a servant, but a son|servant.*son/);
    expect(b).toMatch(/redeem/);
    expect(b).toMatch(/heir/);
  });
  it('L3: a father to the fatherless / sets the solitary in families / outsider made insider', () => {
    const b = blob('ad3-a-father-to-the-fatherless');
    expect(b).toMatch(/father of the fatherless|father to the fatherless/);
    expect(b).toMatch(/solitary in families/);
    expect(b).toMatch(/outsider|sons and daughters/);
  });
  it('L4: chosen on purpose / predestinated / what manner of love', () => {
    const b = blob('ad4-what-manner-of-love-chosen');
    expect(b).toMatch(/chosen on purpose|predestinat/);
    expect(b).toMatch(/good pleasure of his will/);
    expect(b).toMatch(/what manner of love/);
  });
  it('L5: full family, full inheritance / no more a stranger / joint-heirs with Christ', () => {
    const b = blob('ad5-full-family-full-inheritance');
    expect(b).toMatch(/no more strangers|household of god/);
    expect(b).toMatch(/joint-heirs with christ/);
    expect(b).toMatch(/half-adopt|wholly his|all the way/);
  });
});

describe('WELL-BEING: full belonging, chosen, never earned (binding)', () => {
  it('L1 frames adoption as received (not the spirit of fear/bondage)', () => {
    const m = ADOPTION_LESSONS_MODULES.find((x) => x.id === 'ad1-the-spirit-of-adoption');
    const b = (m.lesson + JSON.stringify(m.facilitator)).toLowerCase();
    expect(b).toMatch(/not.*spirit of (bondage|fear)|not on probation|received, not/);
    expect(b).toMatch(/abba/);
  });
  it('the tutor posture holds full/chosen belonging, heals the father-wound, and gives Yahweh the glory', () => {
    const p = ADOPTION_LESSONS_TUTOR_META.posture.toLowerCase();
    expect(p).toMatch(/full belonging|wholly his|does not half-adopt/);
    expect(p).toMatch(/never earning|chosen/);
    expect(p).toMatch(/father-wound|fathers the fatherless/);
    expect(p).toMatch(/give yahweh the glory|the love that adopted us is his/);
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
    ['Romans', 8, 15, 'ye have not received the spirit of bondage again to fear; but ye have received the Spirit of adoption, whereby we cry, Abba, Father'],
    ['Romans', 8, 16, 'The Spirit itself beareth witness with our spirit, that we are the children of God'],
    ['Galatians', 4, 5, 'To redeem them that were under the law, that we might receive the adoption of sons'],
    ['Galatians', 4, 6, 'God hath sent forth the Spirit of his Son into your hearts, crying, Abba, Father'],
    ['Galatians', 4, 7, 'thou art no more a servant, but a son; and if a son, then an heir of God through Christ'],
    ['Psalms', 68, 5, 'A father of the fatherless, and a judge of the widows, is God in his holy habitation'],
    ['Psalms', 68, 6, 'God setteth the solitary in families'],
    ['2Corinthians', 6, 18, 'will be a Father unto you, and ye shall be my sons and daughters'],
    ['Ephesians', 1, 5, 'Having predestinated us unto the adoption of children by Jesus Christ to himself, according to the good pleasure of his will'],
    ['1John', 3, 1, 'Behold, what manner of love the Father hath bestowed upon us, that we should be called the sons of God'],
    ['Ephesians', 2, 19, 'ye are no more strangers and foreigners, but fellowcitizens with the saints, and of the household of God'],
    ['Romans', 8, 17, 'if children, then heirs; heirs of God, and joint-heirs with Christ'],
    ['John', 1, 12, 'as many as received him, to them gave he power to become the sons of God'],
  ];
  it.each(QUOTED)('%s %i:%i quoted verbatim', (book, chap, verse, fragment) => {
    const real = kjv(book, chap, [verse]);
    expect(real).toContain(fragment);
    expect(CORPUS).toContain(fragment);
  });
});

describe('shared machinery (self-paced schedule, progress, export, cohort, tutor)', () => {
  it('the schedule is self-paced — lesson numbers, NO painted dates', () => {
    const sched = buildAdoptionLessonsSchedule();
    expect(sched).toHaveLength(5);
    expect(sched[0].week).toBe(1);
    expect(sched.every((r) => r.date === null)).toBe(true);
  });
  it('progress is counted from the real record', () => {
    const r = adoptionLessonsProgressSummary({ 'ad1-the-spirit-of-adoption': true, 'ad5-full-family-full-inheritance': true });
    expect(r.total).toBe(5);
    expect(r.done).toBe(2);
    expect(r.pct).toBe(Math.round((2 / 5) * 100));
  });
  it('the cohort resolves self-paced (never a painted confirmed date)', () => {
    expect(ADOPTION_LESSONS_CONFIRMED_COHORT.confirmed).toBe(false);
    expect(ADOPTION_LESSONS_PROPOSED_COHORT_START).toBe(null);
    expect(resolveAdoptionLessonsCohort(null).confirmed).toBe(false);
  });
  it('the markdown export carries the title and a real lesson row', () => {
    const md = exportAdoptionLessonsCurriculumMarkdown();
    expect(md).toContain('# The Spirit of Adoption: Made Wholly His');
    expect(md).toContain(ADOPTION_LESSONS_MODULES[0].title);
    expect(md.toLowerCase()).toContain('lesson 1');
  });
  it('the tutor prompt is adoption-series-flavored, holds the verify discipline, and names the lesson', () => {
    const sys = tutorSystemPrompt(ADOPTION_LESSONS_MODULES[0], ADOPTION_LESSONS_TUTOR_META);
    expect(sys).toContain('The Spirit of Adoption');
    expect(sys.toLowerCase()).toMatch(/verify|wrong|fabricate/);
    expect(sys).toContain(ADOPTION_LESSONS_MODULES[0].title);
  });
  it('has distinct interest + helper tags so the Governor roster separates sign-ups', () => {
    expect(ADOPTION_LESSONS_INTEREST_TAG).toMatch(/Spirit of Adoption/);
    expect(ADOPTION_LESSONS_HELPER_TAG).toMatch(/Spirit of Adoption/);
    expect(ADOPTION_LESSONS_INTEREST_TAG).not.toBe(ADOPTION_LESSONS_HELPER_TAG);
  });
});
