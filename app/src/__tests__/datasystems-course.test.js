// @vitest-environment node
//
// datasystems-course — "PoeTech Data Systems & Infrastructure" must use the SHARED
// Learn engine as a SELF-PACED staff/volunteer onboarding course (meta.unit ->
// "Module(s)", no cohort clock), teach REAL, VERIFIED facts about the system and the
// church tech stack (DR-0076 — no fabrication), carry experience-adaptive levels
// (teen + senior on every module) + a passable quiz, be HONEST about what awaits an
// SME (flagged, never invented), and be LIVING — it shares material with the in-app
// contextual "?" help (it imports the same HELP registry), so the course and the
// inline help cannot silently drift apart.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  DATASYSTEMS_META, DATASYSTEMS_MODULES, DATASYSTEMS_SESSION_MINUTES,
  DATASYSTEMS_CONFIRMED_COHORT, DATASYSTEMS_PROPOSED_COHORT_START,
  buildDatasystemsSchedule, datasystemsProgressSummary, exportDatasystemsCurriculumMarkdown,
  resolveDatasystemsCohort, DATASYSTEMS_TUTOR_META,
  DATASYSTEMS_INTEREST_TAG, DATASYSTEMS_HELPER_TAG,
  surfaceTourFromHelp, onboardingRoadmapSections,
} from '../lib/datasystems-course.js';
import { HELP } from '../lib/help-content.js';
import { gradeQuiz, resolveLevel, lessonPlanForAge } from '../lib/learn-framework.js';
import { tutorSystemPrompt } from '../lib/class-tutor.js';

const byId = (id) => DATASYSTEMS_MODULES.find((m) => m.id === id);
const blob = (m) => (m.lesson + ' ' + (m.levels?.senior || '') + ' ' + (m.levels?.teen || '') + ' ' + m.bigIdea + ' ' + JSON.stringify(m.facilitator)).toLowerCase();

describe('curriculum shape (self-paced onboarding course)', () => {
  it('has the full module set, each with the required fields, and meta.weeks matches', () => {
    expect(DATASYSTEMS_MODULES.length).toBeGreaterThanOrEqual(14);
    expect(DATASYSTEMS_META.weeks).toBe(DATASYSTEMS_MODULES.length);
    expect(DATASYSTEMS_MODULES.every((m) => m.id && m.title && m.bigIdea && m.inApp && m.anchor?.ref)).toBe(true);
  });
  it('covers all five areas of the brief (understanding, infrastructure, skills, onboarding, living)', () => {
    const ids = DATASYSTEMS_MODULES.map((m) => m.id);
    // Area 1 — understanding
    expect(ids).toContain('dsi1-what-poetech-is');
    expect(ids).toContain('dsi2-the-shared-data-layer');
    expect(ids).toContain('dsi3-the-loops');
    expect(ids).toContain('dsi4-how-modules-connect');
    expect(ids).toContain('dsi5-meet-ari');
    // Area 2 — infrastructure
    expect(ids).toContain('dsi6-the-nas');
    expect(ids).toContain('dsi7-the-gpu-node');
    expect(ids).toContain('dsi8-the-led-wall');
    expect(ids).toContain('dsi9-sunday-and-wednesday');
    // Area 3 — skills
    expect(ids).toContain('dsi10-running-a-service');
    expect(ids).toContain('dsi11-adding-content-no-json');
    expect(ids).toContain('dsi12-voice-and-help');
    expect(ids).toContain('dsi13-roles-and-permissions');
    // Area 4 + 5 — onboarding path + living
    expect(ids).toContain('dsi14-your-onboarding-path');
  });
  it('every module id is unique and prefixed dsi*', () => {
    const ids = DATASYSTEMS_MODULES.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => id.startsWith('dsi'))).toBe(true);
  });
  it('is configured as a SELF-PACED unit (module, not weekly cohort)', () => {
    expect(DATASYSTEMS_META.unit?.selfPaced).toBe(true);
    expect(DATASYSTEMS_META.unit?.noun).toBe('module');
    expect(DATASYSTEMS_SESSION_MINUTES).toBeGreaterThan(0);
  });
  it('every module carries a real lesson, the facilitator guide, and benefits', () => {
    for (const m of DATASYSTEMS_MODULES) {
      expect(m.lesson.length).toBeGreaterThan(80);
      expect(m.facilitator.talkingPoints.length).toBeGreaterThan(0);
      expect(typeof m.facilitator.howToRun).toBe('string');
      expect(m.facilitator.discussionPrompts.length).toBeGreaterThan(0);
      expect(Array.isArray(m.benefits) && m.benefits.length).toBeTruthy();
    }
  });
});

describe('every quiz is actually passable (no typo can strand a learner)', () => {
  it('each question has >=2 options and an integer answer index in range', () => {
    for (const m of DATASYSTEMS_MODULES) {
      expect(m.quiz?.questions?.length).toBeGreaterThan(0);
      for (const q of m.quiz.questions) {
        expect(Array.isArray(q.options)).toBe(true);
        expect(q.options.length).toBeGreaterThanOrEqual(2);
        expect(Number.isInteger(q.answer)).toBe(true);
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThan(q.options.length);
      }
    }
  });
  it('answering every question with its real answer scores 100% and passes', () => {
    for (const m of DATASYSTEMS_MODULES) {
      const perfect = {};
      m.quiz.questions.forEach((q, i) => { perfect[i] = q.answer; });
      expect(gradeQuiz(m.quiz, perfect).passed).toBe(true);
    }
  });
});

describe('experience-adaptive content (teen + senior on every module)', () => {
  it('EVERY module carries teen + senior level text (one curriculum, experience-right)', () => {
    for (const m of DATASYSTEMS_MODULES) {
      expect(typeof m.levels?.teen).toBe('string');
      expect(m.levels.teen.length).toBeGreaterThan(40);
      expect(typeof m.levels?.senior).toBe('string');
      expect(m.levels.senior.length).toBeGreaterThan(60);
    }
  });
  it('a teen reads the teen text; a child chunks to a short plan; an adult gets the base lesson', () => {
    const m = byId('dsi6-the-nas');
    expect(resolveLevel(m, 'teen').text).toBe(m.levels.teen);
    expect(lessonPlanForAge(m, 'child').totalSegments).toBeGreaterThan(1);
    expect(lessonPlanForAge(m, 'adult').totalSegments).toBeGreaterThanOrEqual(1);
  });
});

describe('verified substance (DR-0076 — accurate facts, grounded in the real system)', () => {
  it('Area 1: foundations teach no-painted-numbers + sovereignty, the data layer + RLS, the loops, the harvest, and Ari', () => {
    expect(blob(byId('dsi1-what-poetech-is'))).toMatch(/painted|sovereign/);
    const dl = blob(byId('dsi2-the-shared-data-layer'));
    expect(dl).toMatch(/row-level security|rls/);
    expect(dl).toMatch(/device/);
    expect(dl).toMatch(/sync/);
    const loops = blob(byId('dsi3-the-loops'));
    expect(loops).toMatch(/detect/);
    expect(loops).toMatch(/understand/);
    expect(loops).toMatch(/execute/);
    expect(loops).toMatch(/\bqc\b|quality control/);
    expect(loops).toMatch(/update/);
    expect(loops).toMatch(/verif/);
    const conn = blob(byId('dsi4-how-modules-connect'));
    expect(conn).toMatch(/transcri/);
    expect(conn).toMatch(/harvest/);
    expect(conn).toMatch(/crm/);
    const ari = blob(byId('dsi5-meet-ari'));
    expect(ari).toMatch(/el roi/);
    expect(ari).toMatch(/lion/);
    expect(ari).toMatch(/unseen/);
    expect(ari).toMatch(/can be wrong/);
  });
  it('Area 2: infrastructure teaches the real NAS, the GPU node, the LED wall, and the service day', () => {
    const nas = blob(byId('dsi6-the-nas'));
    expect(nas).toMatch(/synology|ds1621xs/);
    expect(nas).toMatch(/barn/);
    expect(nas).toMatch(/brain/);
    expect(nas).toMatch(/no gpu|no graphics/);
    const gpu = blob(byId('dsi7-the-gpu-node'));
    expect(gpu).toMatch(/rtx 4070/);
    expect(gpu).toMatch(/two|2 /);
    expect(gpu).toMatch(/whisper|transcri/);
    expect(gpu).toMatch(/70b|70-billion/); // honest capacity limit
    const wall = blob(byId('dsi8-the-led-wall'));
    expect(wall).toMatch(/novastar/);
    expect(wall).toMatch(/vx1000/);
    expect(wall).toMatch(/p1\.99|1\.99 ?mm/);  // confirmed Mirackle pitch (corrects the 1.9mm estimate)
    expect(wall).toMatch(/16:9/);              // confirmed aspect (corrects the ~4:3 estimate)
    expect(wall).toMatch(/2560/);              // confirmed native res ~2560x1440 (corrects ~1920x1440)
    expect(wall).toMatch(/ndi/);
    expect(wall).toMatch(/native resolution/);
    const svc = blob(byId('dsi9-sunday-and-wednesday'));
    expect(svc).toMatch(/lane/);
    expect(svc).toMatch(/propresenter/);
    expect(svc).toMatch(/reliab|gate/);
  });
  it('Area 3: skills teach running a service, no-code content, the voice/help, and roles', () => {
    const run = blob(byId('dsi10-running-a-service'));
    expect(run).toMatch(/cue/);
    expect(run).toMatch(/holding slide/);
    expect(run).toMatch(/white screen/);
    expect(run).toMatch(/ahead/);
    const add = blob(byId('dsi11-adding-content-no-json'));
    expect(add).toMatch(/no code|no-code/);
    expect(add).toMatch(/json/);
    expect(add).toMatch(/persist|saved/);
    const vh = blob(byId('dsi12-voice-and-help'));
    expect(vh).toMatch(/read this/);
    expect(vh).toMatch(/talk about this/);
    expect(vh).toMatch(/fabricat|guard/);
    expect(vh).toMatch(/large.print|text size/);
    const roles = blob(byId('dsi13-roles-and-permissions'));
    expect(roles).toMatch(/relationship/);
    expect(roles).toMatch(/structural/);
    expect(roles).toMatch(/tenant/);
    expect(roles).toMatch(/child/);
  });
  it('Area 4/5: onboarding teaches hours-not-weeks, completion, LIVING (shared help), and honest SME flags', () => {
    const ob = blob(byId('dsi14-your-onboarding-path'));
    expect(ob).toMatch(/hours/);
    expect(ob).toMatch(/living/);
    expect(ob).toMatch(/to confirm|sme|subject-matter expert/);
    expect(ob).toMatch(/completion|certificate/);
  });
});

describe('HONEST about its edges (Verification Doctrine — SME items flagged, not fabricated)', () => {
  it('the infrastructure modules carry explicit SME / TO CONFIRM flags rather than presenting estimates as settled', () => {
    expect(blob(byId('dsi6-the-nas'))).toMatch(/sme flag|build in progress|confirm/);
    expect(blob(byId('dsi7-the-gpu-node'))).toMatch(/sme flag|confirm/);
    expect(blob(byId('dsi8-the-led-wall'))).toMatch(/sme flag|datasheet|novalct|confirm/);
    expect(blob(byId('dsi9-sunday-and-wednesday'))).toMatch(/sme flag|confirm/);
  });
  it('the tutor posture is honest + verifiable: names the SMEs, can-be-wrong, and never presents an estimate as settled', () => {
    const p = DATASYSTEMS_TUTOR_META.posture.toLowerCase();
    expect(p).toMatch(/to confirm|subject-matter expert/);
    expect(p).toMatch(/christina/);
    expect(p).toMatch(/bishop gwin/);
    expect(p).toMatch(/sound engineer/);
    expect(p).toMatch(/darrell/);
    expect(p).toMatch(/can be wrong|verify/);
    expect(p).toMatch(/estimate.*settled|never present an estimate/);
  });
});

describe('LIVING tie — the course shares material with the in-app "?" help', () => {
  it('surfaceTourFromHelp() builds its tour straight from the live HELP registry (cannot drift apart)', () => {
    const tour = surfaceTourFromHelp();
    expect(tour.length).toBeGreaterThan(0);
    for (const stop of tour) {
      expect(HELP[stop.key]).toBeTruthy();             // every stop is a real help key
      expect(stop.title).toBe(HELP[stop.key].title);   // sourced from help, not re-authored
      expect(stop.what).toBe(HELP[stop.key].what);
    }
  });
  it('surfaceTourFromHelp() filters out any key that is not a real help surface', () => {
    const tour = surfaceTourFromHelp(['about', 'this-key-does-not-exist-xyz']);
    expect(tour.map((s) => s.key)).toEqual(['about']);
  });
  it('onboardingRoadmapSections() points at the live shared roadmap', () => {
    const sections = onboardingRoadmapSections();
    expect(Array.isArray(sections)).toBe(true);
    expect(sections.length).toBeGreaterThan(0);
    expect(sections.every((s) => s.key && s.title)).toBe(true);
  });
});

describe('shared machinery (self-paced schedule, progress, export, cohort, tutor)', () => {
  it('the schedule is self-paced — module numbers, NO painted dates', () => {
    const sched = buildDatasystemsSchedule();
    expect(sched).toHaveLength(DATASYSTEMS_MODULES.length);
    expect(sched[0].week).toBe(1);
    expect(sched.every((r) => r.date === null)).toBe(true);
  });
  it('progress is counted from the real record', () => {
    const r = datasystemsProgressSummary({ 'dsi1-what-poetech-is': true, 'dsi2-the-shared-data-layer': true });
    expect(r.total).toBe(DATASYSTEMS_MODULES.length);
    expect(r.done).toBe(2);
    expect(r.pct).toBe(Math.round((2 / DATASYSTEMS_MODULES.length) * 100));
  });
  it('the cohort resolves self-paced (never a painted confirmed date)', () => {
    expect(DATASYSTEMS_CONFIRMED_COHORT.confirmed).toBe(false);
    expect(DATASYSTEMS_PROPOSED_COHORT_START).toBe(null);
    expect(resolveDatasystemsCohort(null).confirmed).toBe(false);
  });
  it('the markdown export carries the title and a real module', () => {
    const md = exportDatasystemsCurriculumMarkdown();
    expect(md).toContain('# PoeTech Data Systems & Infrastructure');
    expect(md).toContain(DATASYSTEMS_MODULES[0].title);
  });
  it('the tutor prompt is course-flavored and holds the verify discipline', () => {
    const sys = tutorSystemPrompt(DATASYSTEMS_MODULES[0], DATASYSTEMS_TUTOR_META);
    expect(sys).toContain('PoeTech Data Systems & Infrastructure');
    expect(sys.toLowerCase()).toMatch(/verify|wrong/);
    expect(sys).toContain(DATASYSTEMS_MODULES[0].title);
  });
  it('has distinct interest + helper tags so the Governor roster separates sign-ups', () => {
    expect(DATASYSTEMS_INTEREST_TAG).toMatch(/Data Systems/);
    expect(DATASYSTEMS_HELPER_TAG).toMatch(/Data Systems/);
    expect(DATASYSTEMS_INTEREST_TAG).not.toBe(DATASYSTEMS_HELPER_TAG);
  });
});

describe('registered in the Learn UI (the course actually surfaces)', () => {
  // Since 2026-07-08 the self-paced courses ride the ONE course registry
  // (lib/learn-catalog.js) instead of hand-built host descriptors — the host
  // mounts buildSelfPacedDescriptors() and the registry carries the key, the
  // helper tag, and the descriptor (learn-catalog-render.test.jsx clicks every
  // registered course in a real render).
  it('the course is registered in the Learn catalog and the host mounts the registry', async () => {
    const { LEARN_CATALOG, helperTagForCourse } = await import('../lib/learn-catalog.js');
    const entry = LEARN_CATALOG.find((c) => c.key === 'datasystems');
    expect(entry).toBeTruthy();
    expect(entry.wiring).toBe('self-paced');
    expect(helperTagForCourse('datasystems')).toBe(DATASYSTEMS_HELPER_TAG);
    const hostPath = fileURLToPath(new URL('../poe-financial-mvp-v28.jsx', import.meta.url));
    const src = readFileSync(hostPath, 'utf8');
    expect(src).toContain("from './lib/learn-catalog.js'");
    expect(src).toMatch(/extraCourses=\{\[[^\]]*\.\.\.selfPacedCourses[^\]]*\]\}/);
  });
});
