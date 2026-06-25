// @vitest-environment node
//
// sovereign-ai-class — "Sovereign A.I.: Why We Build Local" must use the SHARED
// Learn framework (8-week set, computed timeline, multi-modal fields), teach the
// REAL, VERIFIED model + hardware landscape (DR-0076 — no fabrication), carry the
// age-adaptive levels (teen + senior on every module) and the Research → Plan →
// Execute primitive, and never assert the illustrative "provider banned a model"
// scenario as a real event.
import { describe, it, expect } from 'vitest';
import {
  SOVEREIGN_AI_META, SOVEREIGN_AI_MODULES, SOVEREIGN_AI_SESSION_MINUTES,
  SOVEREIGN_AI_CONFIRMED_COHORT, SOVEREIGN_AI_PROPOSED_COHORT_START,
  buildSovereignAiSchedule, sovereignAiProgressSummary, exportSovereignAiCurriculumMarkdown,
  resolveSovereignAiCohort, SOVEREIGN_AI_TUTOR_META,
  SOVEREIGN_AI_INTEREST_TAG, SOVEREIGN_AI_HELPER_TAG,
} from '../lib/sovereign-ai-class.js';
import { tutorSystemPrompt } from '../lib/class-tutor.js';
import { resolveForAge, lessonPlanForAge } from '../lib/learn-framework.js';

describe('curriculum shape', () => {
  it('has the full 8-week module set', () => {
    expect(SOVEREIGN_AI_MODULES).toHaveLength(8);
    expect(SOVEREIGN_AI_META.weeks).toBe(8);
    expect(SOVEREIGN_AI_MODULES.every((m) => m.id && m.title && m.bigIdea && m.inApp && m.anchor?.ref)).toBe(true);
    const ids = SOVEREIGN_AI_MODULES.map((m) => m.id);
    expect(ids).toContain('sov1-generator-in-the-garage');     // the thesis
    expect(ids).toContain('sov3-model-tier-landscape');        // the tiers
    expect(ids).toContain('sov7-five-opportunities');          // the strategy
    expect(ids).toContain('sov8-build-sovereign-hand-it-on');  // the capstone
  });
  it('every module id is unique and prefixed sov*', () => {
    const ids = SOVEREIGN_AI_MODULES.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => id.startsWith('sov'))).toBe(true);
  });
  it('the session flow sums to 75 minutes', () => {
    expect(SOVEREIGN_AI_SESSION_MINUTES).toBe(75);
    expect(SOVEREIGN_AI_META.handsOnLabel).toMatch(/app/i);
  });
  it('every week carries the facilitator guide + a real lesson + R→P→E', () => {
    for (const m of SOVEREIGN_AI_MODULES) {
      expect(m.lesson.length).toBeGreaterThan(80);
      expect(m.facilitator.talkingPoints.length).toBeGreaterThan(0);
      expect(typeof m.facilitator.howToRun).toBe('string');
      expect(m.facilitator.discussionPrompts.length).toBeGreaterThan(0);
      expect(m.rpe?.research && m.rpe?.plan && m.rpe?.execute).toBeTruthy();
    }
  });
  it('every week has a passable check-for-understanding quiz', () => {
    for (const m of SOVEREIGN_AI_MODULES) {
      expect(m.quiz?.questions?.length).toBeGreaterThan(0);
      for (const q of m.quiz.questions) {
        expect(Array.isArray(q.options)).toBe(true);
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThan(q.options.length);
      }
    }
  });
});

describe('age-adaptive content (teen + senior on every module)', () => {
  it('EVERY module carries teen + senior level text (one curriculum, age-right)', () => {
    for (const m of SOVEREIGN_AI_MODULES) {
      expect(typeof m.levels?.teen).toBe('string');
      expect(m.levels.teen.length).toBeGreaterThan(40);
      expect(typeof m.levels?.senior).toBe('string');
      expect(m.levels.senior.length).toBeGreaterThan(60);
    }
  });
  it('a teen reads the teen text; a young band gets a short, multi-segment plan; an adult gets the base lesson', () => {
    const m = SOVEREIGN_AI_MODULES[2]; // the model-tier-landscape week
    const teenText = resolveForAge(m, 'teen').text;
    expect(teenText).toBe(m.levels.teen);
    // The child band (45-word segments) falls back to the teen text (no child level)
    // and chunks it into a short, multi-segment paced plan.
    const childPlan = lessonPlanForAge(m, 'child');
    expect(childPlan.totalSegments).toBeGreaterThan(1);
    const adult = lessonPlanForAge(m, 'adult');
    expect(adult.totalSegments).toBe(1);               // full base lesson at once
  });
});

describe('verified technical substance (DR-0076 — honest, no fabrication)', () => {
  it('the thesis week names resilience + sovereignty and the "we don’t sell data" promise', () => {
    const m = SOVEREIGN_AI_MODULES.find((x) => x.id === 'sov1-generator-in-the-garage');
    const text = (m.lesson + m.levels.senior).toLowerCase();
    expect(text).toMatch(/resilien/);
    expect(text).toMatch(/sovereign/);
    expect(text).toMatch(/don.t sell|never sell|not.*sell/);
  });
  it('the size week teaches quantization and the ~48GB VRAM / 70B fact', () => {
    const m = SOVEREIGN_AI_MODULES.find((x) => x.id === 'sov2-what-a-model-costs-to-run');
    expect((m.lesson + m.levels.senior).toLowerCase()).toMatch(/quantiz/);
    expect(m.lesson + m.levels.senior).toMatch(/48 ?GB/);
    expect(m.lesson + m.levels.senior).toMatch(/70B|70 ?B/);
  });
  it('the tier week names the three tiers, the CPU-only NAS, and verified real models', () => {
    const m = SOVEREIGN_AI_MODULES.find((x) => x.id === 'sov3-model-tier-landscape');
    const blob = m.lesson + m.levels.senior + JSON.stringify(m.facilitator);
    expect(blob).toMatch(/AI Forge|Forge/);
    expect(blob).toMatch(/Synology|CPU/);
    expect(blob.toLowerCase()).toMatch(/deep-reasoning|deep reasoning/);
    // VERIFIED model names (web-confirmed mid-2026 against the Ollama library)
    expect(blob).toMatch(/Qwen2\.5/);
    expect(blob).toMatch(/Gemma 3/);
    expect(blob).toMatch(/DeepSeek-R1/);
    // honest "names move fast — verify the live tag" discipline
    expect(blob.toLowerCase()).toMatch(/ollama list|ollama\.com\/library|move fast|current as of|current-as-of/);
  });
  it('the ceiling week is HONEST that small CPU models are slow + weaker on long complex personas', () => {
    const m = SOVEREIGN_AI_MODULES.find((x) => x.id === 'sov4-honest-ceiling');
    const text = (m.lesson + m.levels.senior).toLowerCase();
    expect(text).toMatch(/slow|latenc/);
    expect(text).toMatch(/persona|multi-step|reasoning/);
    expect(text).toMatch(/ceiling/);
  });
  it('the GPU/AI Forge tier is honest that the farm is planned/unbought today', () => {
    const blob = SOVEREIGN_AI_MODULES.map((m) => m.lesson + m.levels.senior).join(' ').toLowerCase();
    expect(blob).toMatch(/planned|not yet bought|unbought/);
    expect(blob).toMatch(/4070/); // the church 4070s are the only real GPUs today
  });
  it('the routing week names Ollama, the Cage/brakes, RAG, and the local-only sovereignty line', () => {
    const m = SOVEREIGN_AI_MODULES.find((x) => x.id === 'sov5-how-skos-runs-it');
    const blob = (m.lesson + m.levels.senior + JSON.stringify(m.facilitator)).toLowerCase();
    expect(blob).toMatch(/ollama/);
    expect(blob).toMatch(/cage/);
    expect(blob).toMatch(/three brakes|kill-switch|budget/);
    expect(blob).toMatch(/rag|retriev/);
    expect(blob).toMatch(/local-only/);
  });
  it('the trade-offs week is honest that vendors win on multimodal/video + long context', () => {
    const m = SOVEREIGN_AI_MODULES.find((x) => x.id === 'sov6-vendor-vs-local-tradeoffs');
    const text = (m.lesson + m.levels.senior).toLowerCase();
    expect(text).toMatch(/multimodal|video/);
    expect(text).toMatch(/long.?context|very-long/);
  });
  it('the strategy week names all FIVE local-A.I. opportunities', () => {
    const m = SOVEREIGN_AI_MODULES.find((x) => x.id === 'sov7-five-opportunities');
    const text = (m.lesson + m.levels.senior + JSON.stringify(m.facilitator)).toLowerCase();
    expect(text).toMatch(/regulated/);
    expect(text).toMatch(/data-never-leaves|never leaves/);
    expect(text).toMatch(/air-gapped/);
    expect(text).toMatch(/zero-internet|no internet/);
    expect(text).toMatch(/resilience-as-a-service/);
  });
});

describe('no fabrication of the "provider banned a model" scenario (DR-0076)', () => {
  it('never asserts a vendor ban as a real event — if "ban" appears it is framed as illustrative', () => {
    for (const m of SOVEREIGN_AI_MODULES) {
      const blob = `${m.lesson} ${m.levels.teen} ${m.levels.senior} ${m.bigIdea} ${JSON.stringify(m.facilitator)}`;
      // The source video's "Anthropic Fable-5 banned" must never appear as fact.
      expect(blob).not.toMatch(/Fable-?5/i);
      const banMatches = blob.match(/\bban(?:ned|s)?\b/gi) || [];
      if (banMatches.length) {
        // any ban mention must co-occur with an illustrative framing word
        expect(blob.toLowerCase()).toMatch(/imagine|scenario|suppose|illustrat|what if|could/);
      }
    }
  });
});

describe('shared machinery (computed timeline, progress, export, cohort, tutor)', () => {
  it('the timeline is COMPUTED (not painted) from the cohort start', () => {
    const sched = buildSovereignAiSchedule('2026-08-01');
    expect(sched).toHaveLength(8);
    expect(sched[0].week).toBe(1);
    expect(sched[0].date instanceof Date).toBe(true);
    expect(sched[1].date.getTime() - sched[0].date.getTime()).toBe(7 * 86400000);
  });
  it('progress is counted from the real record', () => {
    const r = sovereignAiProgressSummary({ 'sov1-generator-in-the-garage': true, 'sov2-what-a-model-costs-to-run': true });
    expect(r.total).toBe(8);
    expect(r.done).toBe(2);
    expect(r.pct).toBe(25);
  });
  it('the cohort starts PROPOSED (not confirmed) until Darrell locks it', () => {
    expect(SOVEREIGN_AI_CONFIRMED_COHORT.confirmed).toBe(false);
    expect(resolveSovereignAiCohort(null).confirmed).toBe(false);
    expect(resolveSovereignAiCohort(null).startDate).toBe(SOVEREIGN_AI_PROPOSED_COHORT_START);
    expect(resolveSovereignAiCohort({ confirmed: true }).confirmed).toBe(true);
  });
  it('the markdown export carries the title, the tagline, and a real week', () => {
    const md = exportSovereignAiCurriculumMarkdown('2026-08-01');
    expect(md).toContain('# Sovereign A.I.: Why We Build Local');
    expect(md).toContain(SOVEREIGN_AI_MODULES[0].title);
    expect(md.toLowerCase()).toContain('generator in the garage');
  });
  it('the tutor prompt is sovereign-A.I.-flavored, age-aware, and keeps the verify discipline', () => {
    const sys = tutorSystemPrompt(SOVEREIGN_AI_MODULES[0], SOVEREIGN_AI_TUTOR_META);
    expect(sys).toContain('Sovereign A.I.');
    expect(sys.toLowerCase()).toContain('test');   // verify discipline held
    expect(sys).toContain(SOVEREIGN_AI_MODULES[0].title);
  });
  it('has distinct interest + helper tags so the Governor roster separates sign-ups', () => {
    expect(SOVEREIGN_AI_INTEREST_TAG).toMatch(/Sovereign A\.I\./);
    expect(SOVEREIGN_AI_HELPER_TAG).toMatch(/Sovereign A\.I\./);
    expect(SOVEREIGN_AI_INTEREST_TAG).not.toBe(SOVEREIGN_AI_HELPER_TAG);
  });
});
