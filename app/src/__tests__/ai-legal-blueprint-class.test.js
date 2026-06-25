// @vitest-environment node
//
// ai-legal-blueprint-class — "AI Legal Blueprint: What Never to Tell a Chatbot"
// must use the SHARED Learn framework (computed timeline, multi-modal fields),
// carry the age-adaptive levels (child + teen + senior on every module) and the
// Research -> Plan -> Execute primitive, teach the real DO-NOT-SHARE categories
// and the real "why" (retention/training/legal), name reported incidents only as
// reported, and ALWAYS carry the not-legal-advice caveat (DR-0076 — honest, no
// fabrication; education, not counsel).
import { describe, it, expect } from 'vitest';
import {
  AI_LEGAL_BLUEPRINT_META, AI_LEGAL_BLUEPRINT_MODULES, AI_LEGAL_BLUEPRINT_SESSION_MINUTES,
  AI_LEGAL_BLUEPRINT_CONFIRMED_COHORT, AI_LEGAL_BLUEPRINT_PROPOSED_COHORT_START,
  buildAiLegalBlueprintSchedule, aiLegalBlueprintProgressSummary, exportAiLegalBlueprintCurriculumMarkdown,
  resolveAiLegalBlueprintCohort, AI_LEGAL_BLUEPRINT_TUTOR_META,
  AI_LEGAL_BLUEPRINT_INTEREST_TAG, AI_LEGAL_BLUEPRINT_HELPER_TAG,
} from '../lib/ai-legal-blueprint-class.js';
import { tutorSystemPrompt } from '../lib/class-tutor.js';
import { resolveForAge, lessonPlanForAge } from '../lib/learn-framework.js';

describe('curriculum shape', () => {
  it('has the full 6-week module set', () => {
    expect(AI_LEGAL_BLUEPRINT_MODULES).toHaveLength(6);
    expect(AI_LEGAL_BLUEPRINT_META.weeks).toBe(6);
    expect(AI_LEGAL_BLUEPRINT_MODULES.every((m) => m.id && m.title && m.bigIdea && m.inApp && m.anchor?.ref)).toBe(true);
    const ids = AI_LEGAL_BLUEPRINT_MODULES.map((m) => m.id);
    expect(ids).toContain('aib1-the-one-rule');                 // the frame
    expect(ids).toContain('aib2-do-not-share-list');            // the cheat-sheet
    expect(ids).toContain('aib4-the-law-plain');                // the legal why
    expect(ids).toContain('aib6-safe-use-blueprint-sovereign'); // the capstone + sovereign tie-in
  });
  it('every module id is unique and prefixed aib*', () => {
    const ids = AI_LEGAL_BLUEPRINT_MODULES.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => id.startsWith('aib'))).toBe(true);
  });
  it('the session flow sums to 60 minutes and points hands-on at the app', () => {
    expect(AI_LEGAL_BLUEPRINT_SESSION_MINUTES).toBe(60);
    expect(AI_LEGAL_BLUEPRINT_META.handsOnLabel).toMatch(/app/i);
  });
  it('every week carries the facilitator guide + a real lesson + R->P->E', () => {
    for (const m of AI_LEGAL_BLUEPRINT_MODULES) {
      expect(m.lesson.length).toBeGreaterThan(80);
      expect(m.facilitator.talkingPoints.length).toBeGreaterThan(0);
      expect(typeof m.facilitator.howToRun).toBe('string');
      expect(m.facilitator.discussionPrompts.length).toBeGreaterThan(0);
      expect(m.rpe?.research && m.rpe?.plan && m.rpe?.execute).toBeTruthy();
    }
  });
  it('every week has a passable check-for-understanding quiz with valid answers', () => {
    for (const m of AI_LEGAL_BLUEPRINT_MODULES) {
      expect(m.quiz?.questions?.length).toBeGreaterThan(0);
      for (const q of m.quiz.questions) {
        expect(Array.isArray(q.options)).toBe(true);
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThan(q.options.length);
      }
    }
  });
});

describe('age-adaptive content (child + teen + senior on every module)', () => {
  it('EVERY module carries child + teen + senior level text — the audience includes kids + seniors', () => {
    for (const m of AI_LEGAL_BLUEPRINT_MODULES) {
      expect(typeof m.levels?.child).toBe('string');
      expect(m.levels.child.length).toBeGreaterThan(40);
      expect(typeof m.levels?.teen).toBe('string');
      expect(m.levels.teen.length).toBeGreaterThan(40);
      expect(typeof m.levels?.senior).toBe('string');
      expect(m.levels.senior.length).toBeGreaterThan(60);
    }
  });
  it('a child reads the child text; a young band gets a short multi-segment plan; an adult gets the base lesson', () => {
    const m = AI_LEGAL_BLUEPRINT_MODULES[1]; // the DO-NOT-SHARE list week
    const childText = resolveForAge(m, 'child').text;
    expect(childText).toBe(m.levels.child);
    const childPlan = lessonPlanForAge(m, 'child');
    expect(childPlan.totalSegments).toBeGreaterThan(1);
    const adult = lessonPlanForAge(m, 'adult');
    expect(adult.totalSegments).toBe(1);               // full base lesson at once
  });
});

describe('substance — the DO-NOT-SHARE categories and the "why" (honest, no fabrication)', () => {
  it('the one-rule week frames the billboard test and "delete is not erase"', () => {
    const m = AI_LEGAL_BLUEPRINT_MODULES.find((x) => x.id === 'aib1-the-one-rule');
    const text = (m.lesson + m.levels.senior).toLowerCase();
    expect(text).toMatch(/billboard/);
    expect(text).toMatch(/delete/);
    expect(text).toMatch(/train/);
  });
  it('the cheat-sheet week names the regulated categories (SSN, financial, health, passwords, others/kids)', () => {
    const m = AI_LEGAL_BLUEPRINT_MODULES.find((x) => x.id === 'aib2-do-not-share-list');
    const blob = (m.lesson + m.levels.senior + JSON.stringify(m.quiz)).toLowerCase();
    expect(blob).toMatch(/social security|ssn/);
    expect(blob).toMatch(/bank|card|routing|account/);
    expect(blob).toMatch(/health|diagnos|medic/);
    expect(blob).toMatch(/password|api key|secret/);
    expect(blob).toMatch(/other people|someone else|other.s/);
    expect(blob).toMatch(/child|minor|kid/);
  });
  it('the "how the machine remembers" week names retention, human review, training, and tiers', () => {
    const m = AI_LEGAL_BLUEPRINT_MODULES.find((x) => x.id === 'aib3-how-the-machine-remembers');
    const text = (m.lesson + m.levels.senior).toLowerCase();
    expect(text).toMatch(/retain|stored|retention/);
    expect(text).toMatch(/human review|reviewer|read/);
    expect(text).toMatch(/train/);
    expect(text).toMatch(/enterprise|business|api|tier/);
    expect(text).toMatch(/zero.?data.?retention|zero retention/);
  });
  it('the legal week names HIPAA, privilege, trade secret, privacy laws, and the Samsung + Italy incidents', () => {
    const m = AI_LEGAL_BLUEPRINT_MODULES.find((x) => x.id === 'aib4-the-law-plain');
    const blob = (m.lesson + m.levels.senior + JSON.stringify(m.facilitator)).toLowerCase();
    expect(blob).toMatch(/hipaa/);
    expect(blob).toMatch(/privilege/);
    expect(blob).toMatch(/trade secret/);
    expect(blob).toMatch(/ccpa|cpra|gdpr|ferpa/);
    expect(blob).toMatch(/samsung/);
    expect(blob).toMatch(/italy|garante/);
  });
});

describe('honest framing (DR-0076)', () => {
  it('carries the not-legal-advice caveat in the content and the tutor meta', () => {
    const blob = AI_LEGAL_BLUEPRINT_MODULES.map((m) => m.lesson + JSON.stringify(m.facilitator)).join(' ').toLowerCase();
    expect(blob).toMatch(/not legal advice|educational, not legal|not.*legal advice/);
    expect(blob).toMatch(/attorney|lawyer/);
    expect(AI_LEGAL_BLUEPRINT_META.footer.toLowerCase()).toMatch(/not legal advice/);
    expect(AI_LEGAL_BLUEPRINT_TUTOR_META.posture.toLowerCase()).toMatch(/not legal advice/);
  });
  it('frames the Italy fine honestly (reportedly annulled) and policy facts as moving/checkable', () => {
    const blob = AI_LEGAL_BLUEPRINT_MODULES.map((m) => m.lesson + m.levels.senior + JSON.stringify(m.facilitator)).join(' ').toLowerCase();
    expect(blob).toMatch(/annul/);                       // the fine was reportedly annulled
    expect(blob).toMatch(/change fast|move.* fast|check the live|current-as-of|current as of/);
  });
  it('the capstone ties to the sovereign/local answer and the companion course', () => {
    const m = AI_LEGAL_BLUEPRINT_MODULES.find((x) => x.id === 'aib6-safe-use-blueprint-sovereign');
    const blob = (m.lesson + m.levels.senior + m.bigIdea).toLowerCase();
    expect(blob).toMatch(/sovereign/);
    expect(blob).toMatch(/never leaves|stays home|our own nas|hardware (you|we) own/);
    expect(blob).toMatch(/sovereign a\.i\.|why we build local/);  // cross-link to the companion course
    expect(blob).toMatch(/redact/);
  });
});

describe('shared machinery (computed timeline, progress, export, cohort, tutor)', () => {
  it('the timeline is COMPUTED (not painted) from the cohort start', () => {
    const sched = buildAiLegalBlueprintSchedule('2026-08-08');
    expect(sched).toHaveLength(6);
    expect(sched[0].week).toBe(1);
    expect(sched[0].date instanceof Date).toBe(true);
    expect(sched[1].date.getTime() - sched[0].date.getTime()).toBe(7 * 86400000);
  });
  it('progress is counted from the real record', () => {
    const r = aiLegalBlueprintProgressSummary({ 'aib1-the-one-rule': true, 'aib2-do-not-share-list': true, 'aib3-how-the-machine-remembers': true });
    expect(r.total).toBe(6);
    expect(r.done).toBe(3);
    expect(r.pct).toBe(50);
  });
  it('the cohort starts PROPOSED (not confirmed) until Darrell locks it', () => {
    expect(AI_LEGAL_BLUEPRINT_CONFIRMED_COHORT.confirmed).toBe(false);
    expect(resolveAiLegalBlueprintCohort(null).confirmed).toBe(false);
    expect(resolveAiLegalBlueprintCohort(null).startDate).toBe(AI_LEGAL_BLUEPRINT_PROPOSED_COHORT_START);
    expect(resolveAiLegalBlueprintCohort({ confirmed: true }).confirmed).toBe(true);
  });
  it('the markdown export carries the title and a real week', () => {
    const md = exportAiLegalBlueprintCurriculumMarkdown('2026-08-08');
    expect(md).toContain('# AI Legal Blueprint: What Never to Tell a Chatbot');
    expect(md).toContain(AI_LEGAL_BLUEPRINT_MODULES[0].title);
  });
  it('the tutor prompt is blueprint-flavored, age-aware, and keeps the verify + not-legal-advice discipline', () => {
    const sys = tutorSystemPrompt(AI_LEGAL_BLUEPRINT_MODULES[0], AI_LEGAL_BLUEPRINT_TUTOR_META);
    expect(sys).toContain('AI Legal Blueprint');
    expect(sys.toLowerCase()).toContain('test');                // verify discipline held
    expect(sys.toLowerCase()).toContain('not legal advice');    // caveat carried
    expect(sys).toContain(AI_LEGAL_BLUEPRINT_MODULES[0].title);
  });
  it('has distinct interest + helper tags so the Governor roster separates sign-ups', () => {
    expect(AI_LEGAL_BLUEPRINT_INTEREST_TAG).toMatch(/AI Legal Blueprint/);
    expect(AI_LEGAL_BLUEPRINT_HELPER_TAG).toMatch(/AI Legal Blueprint/);
    expect(AI_LEGAL_BLUEPRINT_INTEREST_TAG).not.toBe(AI_LEGAL_BLUEPRINT_HELPER_TAG);
  });
});
