// @vitest-environment node
//
// table-lessons-class — "The Table & the Footstool: Meek, Sound-Minded, Seated"
// must ride the SHARED Learn engine as a SELF-PACED, brain-sized, BUILDING series
// (meta.unit → "Lesson(s)", no cohort clock), carry age-adaptive levels (child +
// teen + senior on every lesson) + a passable quiz, hold the WELL-BEING line (rest
// and honor received, meekness as strength-under-control, fear a counterfeit),
// obey the Typographic Theology bindings, and — the binding gate — quote ONLY
// VERBATIM KJV (DR-0076: every quoted verse checked against the in-repo KJV).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  TABLE_LESSONS_META, TABLE_LESSONS_MODULES, TABLE_LESSONS_SESSION_MINUTES,
  TABLE_LESSONS_CONFIRMED_COHORT, TABLE_LESSONS_PROPOSED_COHORT_START,
  buildTableLessonsSchedule, tableLessonsProgressSummary, exportTableLessonsCurriculumMarkdown,
  resolveTableLessonsCohort, TABLE_LESSONS_TUTOR_META,
  TABLE_LESSONS_INTEREST_TAG, TABLE_LESSONS_HELPER_TAG,
} from '../lib/table-lessons-class.js';
import { tutorSystemPrompt } from '../lib/class-tutor.js';
import { resolveLevel, lessonPlanForAge } from '../lib/learn-framework.js';

const KJV_DIR = join(dirname(fileURLToPath(import.meta.url)), '../../public/bible/kjv');
function kjv(book, chap, verses) {
  const data = JSON.parse(readFileSync(join(KJV_DIR, `${book}.json`), 'utf8'));
  const chapter = data.chapters[chap - 1];
  return verses.map((v) => chapter[v - 1]).join(' ');
}
const CORPUS = TABLE_LESSONS_MODULES.map((m) => [
  m.bigIdea, m.inApp, m.lesson, m.anchor?.theme,
  ...Object.values(m.levels || {}),
  ...(m.benefits || []),
  ...(m.facilitator?.talkingPoints || []),
  m.facilitator?.howToRun,
  ...(m.facilitator?.discussionPrompts || []),
].join('\n')).join('\n');

describe('curriculum shape (self-paced, building series)', () => {
  it('has the full five-lesson set that builds in order, each with the required fields', () => {
    expect(TABLE_LESSONS_MODULES).toHaveLength(5);
    expect(TABLE_LESSONS_META.weeks).toBe(5);
    expect(TABLE_LESSONS_MODULES.every((m) => m.id && m.title && m.bigIdea && m.inApp && m.anchor?.ref)).toBe(true);
    expect(TABLE_LESSONS_MODULES.map((m) => m.id)).toEqual([
      'tf1-a-table-before-your-enemies',
      'tf2-your-enemies-a-footstool',
      'tf3-the-meek-inherit',
      'tf4-a-sound-mind-not-fear',
      'tf5-programmed-by-his-word',
    ]);
  });
  it('every lesson id is unique and prefixed tf*', () => {
    const ids = TABLE_LESSONS_MODULES.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => id.startsWith('tf'))).toBe(true);
  });
  it('is configured as a SELF-PACED unit (lesson, not weekly cohort)', () => {
    expect(TABLE_LESSONS_META.unit?.selfPaced).toBe(true);
    expect(TABLE_LESSONS_META.unit?.noun).toBe('lesson');
    expect(TABLE_LESSONS_SESSION_MINUTES).toBeGreaterThan(0);
  });
  it('every lesson carries the facilitator guide + a real lesson + benefits + passable quiz', () => {
    for (const m of TABLE_LESSONS_MODULES) {
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
    for (const m of TABLE_LESSONS_MODULES) {
      for (const band of ['child', 'teen', 'senior']) {
        expect(typeof m.levels?.[band]).toBe('string');
        expect(m.levels[band].length).toBeGreaterThan(40);
      }
    }
  });
  it('a young band chunks a lesson into several short segments; an adult gets it at once', () => {
    const m = TABLE_LESSONS_MODULES.find((x) => x.id === 'tf5-programmed-by-his-word');
    expect(resolveLevel(m, 'senior').text).toBe(m.levels.senior);
    expect(lessonPlanForAge(m, 'child').totalSegments).toBeGreaterThan(1);
    expect(lessonPlanForAge(m, 'adult').totalSegments).toBe(1);
  });
});

describe('the series teaches its building substance in order', () => {
  const find = (id) => TABLE_LESSONS_MODULES.find((m) => m.id === id);
  const blob = (id) => {
    const m = find(id);
    return (m.lesson + '\n' + m.levels.senior + '\n' + m.levels.teen + '\n' + m.bigIdea).toLowerCase();
  };
  it('L1: a table in the presence of enemies / He sets it, you receive / cup overflows', () => {
    const b = blob('tf1-a-table-before-your-enemies');
    expect(b).toMatch(/table before me in the presence of mine enemies|table.*presence.*enemies/);
    expect(b).toMatch(/receive|don.t (earn|have to)|sit down/);
    expect(b).toMatch(/runneth over|overflow/);
  });
  it('L2: enemies a footstool / you sit, He subdues / the seated Christ', () => {
    const b = blob('tf2-your-enemies-a-footstool');
    expect(b).toMatch(/footstool/);
    expect(b).toMatch(/you sit|sit thou|invited to be seated/);
    expect(b).toMatch(/christ|jesus|right hand/);
  });
  it('L3: the meek inherit / meek = strength under control / Moses & Jesus', () => {
    const b = blob('tf3-the-meek-inherit');
    expect(b).toMatch(/blessed are the meek|the meek/);
    expect(b).toMatch(/strength under|not weak|inherit/);
    expect(b).toMatch(/moses/);
  });
  it('L4: a sound mind not fear / fear not from God / stayed on Him in perfect peace', () => {
    const b = blob('tf4-a-sound-mind-not-fear');
    expect(b).toMatch(/sound mind/);
    expect(b).toMatch(/spirit of fear|not given us the spirit of fear/);
    expect(b).toMatch(/perfect peace|stayed on/);
  });
  it('L5: renewed mind / cast down imaginations, take thoughts captive / His 4th-dimensional Data', () => {
    const b = blob('tf5-programmed-by-his-word');
    expect(b).toMatch(/renewing of your mind|renewed mind|not conformed/);
    expect(b).toMatch(/captiv|casting down imaginations/);
    expect(b).toMatch(/4th-dimensional data|program/);
  });
});

describe('WELL-BEING: rest and honor received, never striving or self-exaltation (binding)', () => {
  it('L1 frames the table as received grace (you don’t earn the seat)', () => {
    const m = TABLE_LESSONS_MODULES.find((x) => x.id === 'tf1-a-table-before-your-enemies');
    const b = (m.lesson + JSON.stringify(m.facilitator)).toLowerCase();
    expect(b).toMatch(/every verb is his|thou preparest|receive.*seat|don.t (earn|cook)/);
    expect(b).toMatch(/grace/);
  });
  it('the tutor posture holds rest/honor, meekness as strength, fear as counterfeit, and gives Yahweh the glory', () => {
    const p = TABLE_LESSONS_TUTOR_META.posture.toLowerCase();
    expect(p).toMatch(/rest and honor|settle the anxious/);
    expect(p).toMatch(/strength under god|never being a doormat|meekness is strength/);
    expect(p).toMatch(/fear is a counterfeit/);
    expect(p).toMatch(/give yahweh the glory|the honor and the victory are his/);
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
    ['Psalms', 23, 5, 'Thou preparest a table before me in the presence of mine enemies: thou anointest my head with oil; my cup runneth over'],
    ['Psalms', 23, 1, 'The LORD is my shepherd; I shall not want'],
    ['Psalms', 110, 1, 'Sit thou at my right hand, until I make thine enemies thy footstool'],
    ['Hebrews', 10, 12, 'sat down on the right hand of God'],
    ['Matthew', 5, 5, 'Blessed are the meek: for they shall inherit the earth'],
    ['Numbers', 12, 3, 'very meek, above all the men which were upon the face of the earth'],
    ['Matthew', 11, 29, 'I am meek and lowly in heart'],
    ['2Timothy', 1, 7, 'God hath not given us the spirit of fear; but of power, and of love, and of a sound mind'],
    ['Isaiah', 26, 3, 'Thou wilt keep him in perfect peace, whose mind is stayed on thee'],
    ['Philippians', 4, 7, 'the peace of God, which passeth all understanding, shall keep your hearts and minds'],
    ['Romans', 12, 2, 'be not conformed to this world: but be ye transformed by the renewing of your mind'],
    ['2Corinthians', 10, 5, 'bringing into captivity every thought to the obedience of Christ'],
    ['Joshua', 1, 8, 'thou shalt meditate therein day and night'],
    ['Colossians', 3, 2, 'Set your affection on things above, not on things on the earth'],
  ];
  it.each(QUOTED)('%s %i:%i quoted verbatim', (book, chap, verse, fragment) => {
    const real = kjv(book, chap, [verse]);
    expect(real).toContain(fragment);
    expect(CORPUS).toContain(fragment);
  });
});

describe('shared machinery (self-paced schedule, progress, export, cohort, tutor)', () => {
  it('the schedule is self-paced — lesson numbers, NO painted dates', () => {
    const sched = buildTableLessonsSchedule();
    expect(sched).toHaveLength(5);
    expect(sched[0].week).toBe(1);
    expect(sched.every((r) => r.date === null)).toBe(true);
  });
  it('progress is counted from the real record', () => {
    const r = tableLessonsProgressSummary({ 'tf1-a-table-before-your-enemies': true, 'tf4-a-sound-mind-not-fear': true });
    expect(r.total).toBe(5);
    expect(r.done).toBe(2);
    expect(r.pct).toBe(Math.round((2 / 5) * 100));
  });
  it('the cohort resolves self-paced (never a painted confirmed date)', () => {
    expect(TABLE_LESSONS_CONFIRMED_COHORT.confirmed).toBe(false);
    expect(TABLE_LESSONS_PROPOSED_COHORT_START).toBe(null);
    expect(resolveTableLessonsCohort(null).confirmed).toBe(false);
  });
  it('the markdown export carries the title and a real lesson row', () => {
    const md = exportTableLessonsCurriculumMarkdown();
    expect(md).toContain('# The Table & the Footstool: Meek, Sound-Minded, Seated');
    expect(md).toContain(TABLE_LESSONS_MODULES[0].title);
    expect(md.toLowerCase()).toContain('lesson 1');
  });
  it('the tutor prompt is table-series-flavored, holds the verify discipline, and names the lesson', () => {
    const sys = tutorSystemPrompt(TABLE_LESSONS_MODULES[0], TABLE_LESSONS_TUTOR_META);
    expect(sys).toContain('The Table & the Footstool');
    expect(sys.toLowerCase()).toMatch(/verify|wrong|fabricate/);
    expect(sys).toContain(TABLE_LESSONS_MODULES[0].title);
  });
  it('has distinct interest + helper tags so the Governor roster separates sign-ups', () => {
    expect(TABLE_LESSONS_INTEREST_TAG).toMatch(/Table & Footstool/);
    expect(TABLE_LESSONS_HELPER_TAG).toMatch(/Table & Footstool/);
    expect(TABLE_LESSONS_INTEREST_TAG).not.toBe(TABLE_LESSONS_HELPER_TAG);
  });
});
