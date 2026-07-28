// @vitest-environment node
//
// sound-board-class — "Running the Board: Live Sound for the House of God" must use
// the SHARED Learn engine as a SELF-PACED lesson series (meta.unit → "Lesson(s)", no
// cohort clock), teach REAL, VERIFIED live-sound craft (DR-0076 — no fabrication: the
// frequency ranges, the gain-staging target as a rule-of-thumb, the feedback loop +
// ring-out, monitors-vs-house, choir blend, before/during/after), carry experience-
// adaptive levels (teen + senior on every lesson) + a passable quiz, and hold the
// BINDING assistive-only safety line (the A.I. suggests; a human runs the board).
import { describe, it, expect } from 'vitest';
import {
  SOUND_BOARD_META, SOUND_BOARD_MODULES, SOUND_BOARD_SESSION_MINUTES,
  SOUND_BOARD_CONFIRMED_COHORT, SOUND_BOARD_PROPOSED_COHORT_START,
  buildSoundBoardSchedule, soundBoardProgressSummary, exportSoundBoardCurriculumMarkdown,
  resolveSoundBoardCohort, SOUND_BOARD_TUTOR_META,
  SOUND_BOARD_INTEREST_TAG, SOUND_BOARD_HELPER_TAG,
} from '../lib/sound-board-class.js';
import { tutorSystemPrompt } from '../lib/class-tutor.js';
import { resolveLevel, lessonPlanForAge } from '../lib/learn-framework.js';

describe('curriculum shape (self-paced lesson series)', () => {
  it('has the full eight-lesson set, each with the required fields', () => {
    expect(SOUND_BOARD_MODULES).toHaveLength(8);
    expect(SOUND_BOARD_META.weeks).toBe(8);
    expect(SOUND_BOARD_MODULES.every((m) => m.id && m.title && m.bigIdea && m.inApp && m.anchor?.ref)).toBe(true);
    const ids = SOUND_BOARD_MODULES.map((m) => m.id);
    expect(ids).toContain('snd1-the-board-and-the-signal-chain');
    expect(ids).toContain('snd2-gain-staging');
    expect(ids).toContain('snd3-eq-the-frequency-ranges');
    expect(ids).toContain('snd4-taming-feedback');
    expect(ids).toContain('snd5-monitors-vs-the-house');
    expect(ids).toContain('snd6-mixing-the-worship-team-and-choir');
    expect(ids).toContain('snd7-before-during-after');
    expect(ids).toContain('snd8-our-digital-console-yamaha-ql');
  });
  it('every lesson id is unique and prefixed snd*', () => {
    const ids = SOUND_BOARD_MODULES.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => id.startsWith('snd'))).toBe(true);
  });
  it('is configured as a SELF-PACED unit (lesson, not weekly cohort)', () => {
    expect(SOUND_BOARD_META.unit?.selfPaced).toBe(true);
    expect(SOUND_BOARD_META.unit?.noun).toBe('lesson');
    expect(SOUND_BOARD_META.handsOnLabel).toMatch(/board/i);
    expect(SOUND_BOARD_SESSION_MINUTES).toBeGreaterThan(0);
  });
  it('every lesson carries the facilitator guide + a real lesson + benefits', () => {
    for (const m of SOUND_BOARD_MODULES) {
      expect(m.lesson.length).toBeGreaterThan(80);
      expect(m.facilitator.talkingPoints.length).toBeGreaterThan(0);
      expect(typeof m.facilitator.howToRun).toBe('string');
      expect(m.facilitator.discussionPrompts.length).toBeGreaterThan(0);
      expect(Array.isArray(m.benefits) && m.benefits.length).toBeTruthy();
    }
  });
  it('every lesson has a passable check-for-understanding quiz', () => {
    for (const m of SOUND_BOARD_MODULES) {
      expect(m.quiz?.questions?.length).toBeGreaterThan(0);
      for (const q of m.quiz.questions) {
        expect(Array.isArray(q.options)).toBe(true);
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThan(q.options.length);
      }
    }
  });
});

describe('experience-adaptive content (teen + senior on every lesson)', () => {
  it('EVERY lesson carries teen + senior level text (one curriculum, experience-right)', () => {
    for (const m of SOUND_BOARD_MODULES) {
      expect(typeof m.levels?.teen).toBe('string');
      expect(m.levels.teen.length).toBeGreaterThan(40);
      expect(typeof m.levels?.senior).toBe('string');
      expect(m.levels.senior.length).toBeGreaterThan(60);
    }
  });
  it('a teen reads the teen text; a young band chunks to a short plan; an adult gets the base lesson', () => {
    const m = SOUND_BOARD_MODULES[2]; // the EQ frequency-ranges lesson
    expect(resolveLevel(m, 'teen').text).toBe(m.levels.teen);
    const childPlan = lessonPlanForAge(m, 'child');
    expect(childPlan.totalSegments).toBeGreaterThan(1);
    const adult = lessonPlanForAge(m, 'adult');
    expect(adult.totalSegments).toBeGreaterThanOrEqual(1);
  });
});

describe('verified live-sound substance (DR-0076 — accurate, no fabrication)', () => {
  it('the signal-chain lesson names the chain order and the two destinations', () => {
    const m = SOUND_BOARD_MODULES.find((x) => x.id === 'snd1-the-board-and-the-signal-chain');
    const text = (m.lesson + m.levels.senior).toLowerCase();
    expect(text).toMatch(/signal chain/);
    expect(text).toMatch(/gain/);
    expect(text).toMatch(/fader/);
    expect(text).toMatch(/monitor/);
    expect(text).toMatch(/mains|front of house|house/);
  });
  it('the gain-staging lesson teaches pre-fader clipping and frames the dBFS target as a rule-of-thumb', () => {
    const m = SOUND_BOARD_MODULES.find((x) => x.id === 'snd2-gain-staging');
    const blob = m.lesson + m.levels.senior;
    expect(blob.toLowerCase()).toMatch(/clip/);
    expect(blob.toLowerCase()).toMatch(/pre-fader|before the fader/);
    expect(blob).toMatch(/-18 ?dBFS/);
    expect(blob.toLowerCase()).toMatch(/rule-of-thumb|not a law|guide, not/);
  });
  it('the EQ lesson teaches the frequency ranges, subtractive EQ, and high-pass discipline', () => {
    const m = SOUND_BOARD_MODULES.find((x) => x.id === 'snd3-eq-the-frequency-ranges');
    const blob = (m.lesson + m.levels.senior).toLowerCase();
    expect(blob).toMatch(/hz/);
    expect(blob).toMatch(/khz/);
    expect(blob).toMatch(/low-mid/);
    expect(blob).toMatch(/presence|intelligib/);
    expect(blob).toMatch(/high-pass/);
    expect(blob).toMatch(/cut.*before.*boost|subtractive/);
  });
  it('the feedback lesson explains the loop, gain-before-feedback, and ringing out', () => {
    const m = SOUND_BOARD_MODULES.find((x) => x.id === 'snd4-taming-feedback');
    const blob = (m.lesson + m.levels.senior).toLowerCase();
    expect(blob).toMatch(/loop/);
    expect(blob).toMatch(/gain-before-feedback|gain before feedback/);
    expect(blob).toMatch(/ring(ing)? out/);
    expect(blob).toMatch(/notch/);
    expect(blob).toMatch(/resonan/);
  });
  it('the monitors-vs-house lesson names the cardinal error and the two-mix split', () => {
    const m = SOUND_BOARD_MODULES.find((x) => x.id === 'snd5-monitors-vs-the-house');
    const blob = (m.lesson + m.levels.senior).toLowerCase();
    expect(blob).toMatch(/front of house|house mix/);
    expect(blob).toMatch(/aux|monitor send/);
    expect(blob).toMatch(/in-ear|iem/);
    expect(blob).toMatch(/pre-fader/);
  });
  it('the worship/choir lesson teaches vocal-on-top, frequency lanes, and choir blend + feedback', () => {
    const m = SOUND_BOARD_MODULES.find((x) => x.id === 'snd6-mixing-the-worship-team-and-choir');
    const blob = (m.lesson + m.levels.senior).toLowerCase();
    expect(blob).toMatch(/lead vocal/);
    expect(blob).toMatch(/choir/);
    expect(blob).toMatch(/blend/);
    expect(blob).toMatch(/high-pass|hpf/);
    expect(blob).toMatch(/kick|bass/);
  });
  it('the before/during/after lesson names all three windows and ride-the-faders + loudness stewardship', () => {
    const m = SOUND_BOARD_MODULES.find((x) => x.id === 'snd7-before-during-after');
    const blob = (m.lesson + m.levels.senior).toLowerCase();
    expect(blob).toMatch(/line check/);
    expect(blob).toMatch(/scene|snapshot/);
    expect(blob).toMatch(/ride|riding the faders/);
    expect(blob).toMatch(/listen back|review/);
    expect(blob).toMatch(/loudness|hearing/);
  });
  it('the digital-console lesson teaches the Yamaha QL workflow: scenes, Selected Channel, the remote editor, and virtual soundcheck', () => {
    const m = SOUND_BOARD_MODULES.find((x) => x.id === 'snd8-our-digital-console-yamaha-ql');
    const blob = (m.lesson + m.levels.senior).toLowerCase();
    expect(blob).toMatch(/yamaha ql|ql-series|ql series/);
    expect(blob).toMatch(/scene|snapshot/);
    expect(blob).toMatch(/selected channel/);
    expect(blob).toMatch(/stagemix|ql editor/);
    expect(blob).toMatch(/virtual soundcheck/);
    expect(blob).toMatch(/dante/);
    expect(blob).toMatch(/ql1|ql5/); // confirm-by-channel-count honesty
  });
});

describe('BINDING safety — assistive today, staged + bounded autonomy, human-on-the-loop always', () => {
  it('the before/during/after lesson: assistive today, human applies; earned bounded stages; instant takeover; never removed from the board', () => {
    const m = SOUND_BOARD_MODULES.find((x) => x.id === 'snd7-before-during-after');
    const blob = (m.lesson + m.levels.senior + m.bigIdea + JSON.stringify(m.facilitator)).toLowerCase();
    expect(blob).toMatch(/assistive/);                       // today: assistive
    expect(blob).toMatch(/suggest/);
    expect(blob).toMatch(/human operator decides|you decide|operator decides/); // human applies
    expect(blob).toMatch(/earned|stage/);                    // autonomy is staged/earned
    expect(blob).toMatch(/take ?over|on the loop|human-on-the-loop/); // instant takeover / on the loop
    expect(blob).toMatch(/ceiling|hard (limit|stop)|rate-limit|scene/); // hard bounds
    expect(blob).toMatch(/never removed|always with you/);   // never removed from the board
  });
  it('the tutor posture: assistive today + staged earned autonomy, hard bounds, instant human takeover, human-on-the-loop', () => {
    const p = SOUND_BOARD_TUTOR_META.posture.toLowerCase();
    expect(p).toMatch(/assistive/);
    expect(p).toMatch(/human operator decides|operator decides|human .* decides/);
    expect(p).toMatch(/earned|staged/);
    expect(p).toMatch(/human-on-the-loop|on the loop/);
    expect(p).toMatch(/takeover|take over/);
    expect(p).toMatch(/ceiling|hard limit|feedback hard-stop|rate-limit/);
    // must NOT promise the human is replaced — skill stays essential
    expect(p).toMatch(/never stops mattering|permanently essential|never tell a learner the a\.i\. will simply replace/);
  });
});

describe('shared machinery (self-paced schedule, progress, export, cohort, tutor)', () => {
  it('the schedule is self-paced — lesson numbers, NO painted dates', () => {
    const sched = buildSoundBoardSchedule();
    expect(sched).toHaveLength(8);
    expect(sched[0].week).toBe(1);
    expect(sched.every((r) => r.date === null)).toBe(true);
  });
  it('progress is counted from the real record', () => {
    const r = soundBoardProgressSummary({ 'snd1-the-board-and-the-signal-chain': true, 'snd2-gain-staging': true });
    expect(r.total).toBe(8);
    expect(r.done).toBe(2);
    expect(r.pct).toBe(Math.round((2 / 8) * 100));
  });
  it('the cohort resolves self-paced (never a painted confirmed date)', () => {
    expect(SOUND_BOARD_CONFIRMED_COHORT.confirmed).toBe(false);
    expect(SOUND_BOARD_PROPOSED_COHORT_START).toBe(null);
    expect(resolveSoundBoardCohort(null).confirmed).toBe(false);
  });
  it('the markdown export carries the title, the tagline cue, and a real lesson', () => {
    const md = exportSoundBoardCurriculumMarkdown();
    expect(md).toContain('# Running the Board: Live Sound for the House of God');
    expect(md).toContain(SOUND_BOARD_MODULES[0].title);
    expect(md.toLowerCase()).toContain('lesson 1');
  });
  it('the tutor prompt is sound-board-flavored, holds the verify discipline, and the assistive-only line', () => {
    const sys = tutorSystemPrompt(SOUND_BOARD_MODULES[0], SOUND_BOARD_TUTOR_META);
    expect(sys).toContain('Running the Board');
    expect(sys.toLowerCase()).toMatch(/verify|wrong/);
    expect(sys).toContain(SOUND_BOARD_MODULES[0].title);
  });
  it('has distinct interest + helper tags so the Governor roster separates sign-ups', () => {
    expect(SOUND_BOARD_INTEREST_TAG).toMatch(/Sound Team/);
    expect(SOUND_BOARD_HELPER_TAG).toMatch(/Sound Team/);
    expect(SOUND_BOARD_INTEREST_TAG).not.toBe(SOUND_BOARD_HELPER_TAG);
  });
});
