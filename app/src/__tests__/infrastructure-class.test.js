// @vitest-environment node
//
// infrastructure-class — "The Infrastructure: How We Build It Sovereign" must use
// the SHARED Learn framework (10-week set, computed timeline, multi-modal fields,
// SOP library), teach the REAL, VERIFIED architecture (DR-0076 — no fabrication),
// and carry the two deepenings Darrell asked for: AGE-ADAPTIVE levels (child +
// senior on every module) and CHRISTIAN'S HOME PATH (a real hardware pairing on
// every module) plus the Research → Plan → Execute primitive.
import { describe, it, expect } from 'vitest';
import {
  INFRA_META, INFRA_MODULES, INFRA_SESSION_FLOW, INFRA_SESSION_MINUTES,
  INFRA_CONFIRMED_COHORT, INFRA_PROPOSED_COHORT_START,
  buildInfraSchedule, infraProgressSummary, exportInfraCurriculumMarkdown,
  resolveInfraCohort, INFRA_SOP_SEQUENCES, INFRA_TUTOR_META,
} from '../lib/infrastructure-class.js';
import { tutorSystemPrompt } from '../lib/class-tutor.js';
import { resolveForAge, lessonPlanForAge } from '../lib/learn-framework.js';

describe('curriculum shape', () => {
  it('has the full 10-week module set covering BOTH stacks', () => {
    expect(INFRA_MODULES).toHaveLength(10);
    expect(INFRA_META.weeks).toBe(10);
    expect(INFRA_MODULES.every((m) => m.id && m.title && m.bigIdea && m.inApp && m.anchor?.ref)).toBe(true);
    const ids = INFRA_MODULES.map((m) => m.id);
    expect(ids).toContain('inf2-the-nas');        // home stack
    expect(ids).toContain('inf8-church-stack');   // church stack
    expect(ids).toContain('inf10-build-right-raise-builders'); // capstone
  });
  it('every module ids are unique and prefixed inf*', () => {
    const ids = INFRA_MODULES.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => id.startsWith('inf'))).toBe(true);
  });
  it('the session flow sums to 75 minutes with the hardware hands-on label', () => {
    expect(INFRA_SESSION_MINUTES).toBe(75);
    expect(INFRA_SESSION_FLOW.some((s) => /hardware/i.test(s.name))).toBe(true);
    expect(INFRA_META.handsOnLabel).toMatch(/hardware/i);
  });
  it('every week carries the facilitator guide + a real lesson', () => {
    for (const m of INFRA_MODULES) {
      expect(m.lesson.length).toBeGreaterThan(80);
      expect(m.facilitator.talkingPoints.length).toBeGreaterThan(0);
      expect(typeof m.facilitator.howToRun).toBe('string');
      expect(m.facilitator.discussionPrompts.length).toBeGreaterThan(0);
    }
  });
  it('every week has a passable check-for-understanding quiz', () => {
    for (const m of INFRA_MODULES) {
      expect(m.quiz?.questions?.length).toBeGreaterThan(0);
      for (const q of m.quiz.questions) {
        expect(Array.isArray(q.options)).toBe(true);
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThan(q.options.length);
      }
    }
  });
});

describe('age-adaptive content (Darrell deepening 1)', () => {
  it('EVERY module carries child + senior level text (one curriculum, age-right)', () => {
    for (const m of INFRA_MODULES) {
      expect(typeof m.levels?.child).toBe('string');
      expect(m.levels.child.length).toBeGreaterThan(40);
      expect(typeof m.levels?.senior).toBe('string');
      expect(m.levels.senior.length).toBeGreaterThan(60);
    }
  });
  it('a child reads the child text and gets a short, multi-segment paced plan', () => {
    const m = INFRA_MODULES[1]; // the NAS week
    const childText = resolveForAge(m, 'child').text;
    expect(childText).toBe(m.levels.child);
    const plan = lessonPlanForAge(m, 'child');
    expect(plan.totalSegments).toBeGreaterThan(1);   // chunked for a 10-year-old
    expect(plan.breakAfterSegments).toBeGreaterThan(0); // break nudges on
    expect(plan.checkAfterSegments).toBe(1);          // one idea, then a check
    // an adult gets the base lesson, chunked into readable sections
    const adult = lessonPlanForAge(m, 'adult');
    expect(adult.totalSegments).toBeGreaterThanOrEqual(1);
  });
});

describe("Christian's home path (Darrell deepening 2) + Research→Plan→Execute", () => {
  it('EVERY module pairs a REAL device (look/touch/safe) and runs R→P→E', () => {
    for (const m of INFRA_MODULES) {
      expect(Array.isArray(m.hardware)).toBe(true);
      expect(m.hardware.length).toBeGreaterThan(0);
      expect(m.hardware.every((h) => h.device && h.look && h.safe)).toBe(true);
      expect(m.rpe?.research && m.rpe?.plan && m.rpe?.execute).toBeTruthy();
    }
  });
});

describe('verified technical substance (DR-0076 — honest, no fabrication)', () => {
  it('the NAS week names the real CPU-only Xeon truth', () => {
    const nas = INFRA_MODULES.find((m) => m.id === 'inf2-the-nas');
    expect(nas.levels.senior).toMatch(/Xeon D-1527/);
    expect((nas.lesson + nas.levels.senior).toLowerCase()).toContain('ecc');
    expect(nas.lesson.toLowerCase()).toMatch(/graphics card|cpu-only|cpu only/);
  });
  it('the GPU week is HONEST that the farm is planned/unbought today', () => {
    const gpu = INFRA_MODULES.find((m) => m.id === 'inf7-gpu-vram-farm');
    expect(gpu.lesson.toLowerCase()).toMatch(/planned|not yet bought|unbought/);
    expect((gpu.lesson + gpu.levels.senior)).toMatch(/48 ?GB/);
    expect(gpu.media.some((x) => x.type === 'diagram' && x.key === 'cpu-vs-gpu')).toBe(true);
    expect(gpu.media.some((x) => x.type === 'diagram' && x.key === 'vram-ladder')).toBe(true);
  });
  it('the network week names the real VLAN segmentation', () => {
    const net = INFRA_MODULES.find((m) => m.id === 'inf4-network-gateway');
    expect(net.levels.senior).toMatch(/UCG-Max|VLAN/);
  });
});

describe('shared machinery (computed timeline, progress, export, cohort, tutor)', () => {
  it('the timeline is COMPUTED (not painted) from the cohort start', () => {
    const sched = buildInfraSchedule('2026-07-18');
    expect(sched).toHaveLength(10);
    expect(sched[0].week).toBe(1);
    expect(sched[0].date instanceof Date).toBe(true);
    // week 2 is exactly 7 days after week 1
    expect(sched[1].date.getTime() - sched[0].date.getTime()).toBe(7 * 86400000);
  });
  it('progress is counted from the real record', () => {
    const r = infraProgressSummary({ 'inf1-what-is-sovereign': true, 'inf2-the-nas': true });
    expect(r.total).toBe(10);
    expect(r.done).toBe(2);
    expect(r.pct).toBe(20);
  });
  it('the cohort starts PROPOSED (not confirmed) until Darrell locks it', () => {
    expect(INFRA_CONFIRMED_COHORT.confirmed).toBe(false);
    expect(resolveInfraCohort(null).confirmed).toBe(false);
    expect(resolveInfraCohort(null).startDate).toBe(INFRA_PROPOSED_COHORT_START);
    // a Governor's live local confirm overrides for his own instance
    expect(resolveInfraCohort({ confirmed: true }).confirmed).toBe(true);
  });
  it('the markdown export carries the SOP library + the consent line', () => {
    const md = exportInfraCurriculumMarkdown('2026-07-18');
    expect(md).toContain('# The Infrastructure: How We Build It Sovereign');
    expect(md).toContain('Sequence / SOP Library');
    expect(md.toLowerCase()).toContain('never the congregation');
    // a real infra sequence checklist made it into the paper export
    expect(md).toContain(INFRA_SOP_SEQUENCES[0].title);
  });
  it('the tutor prompt is infrastructure-flavored, age-aware, and keeps verify discipline', () => {
    const sys = tutorSystemPrompt(INFRA_MODULES[1], INFRA_TUTOR_META);
    expect(sys).toContain('The Infrastructure');
    expect(sys.toLowerCase()).toContain('child');   // age-aware posture
    expect(sys.toLowerCase()).toContain('test');     // verify discipline held
    expect(sys).toContain(INFRA_MODULES[1].title);
  });
});

describe('SOP library (POV build sequences for both stacks)', () => {
  it('reserves a clip + a real checklist per sequence, none captured yet (honest)', () => {
    expect(INFRA_SOP_SEQUENCES.length).toBeGreaterThan(0);
    for (const s of INFRA_SOP_SEQUENCES) {
      expect(s.id && s.title && s.station && s.owner).toBeTruthy();
      expect(Array.isArray(s.steps) && s.steps.length).toBeTruthy();
      expect(s.clip.status).toBe('pending-capture'); // DR-0076: no fake clip
      expect(s.clip.src).toBe(null);
    }
  });
  it('covers BOTH stacks (a home sequence and a church sequence)', () => {
    const ids = INFRA_SOP_SEQUENCES.map((s) => s.id);
    expect(ids).toContain('inf-sop-nas-powerup');       // home
    expect(ids).toContain('inf-sop-church-nas-build');  // church
  });
});
