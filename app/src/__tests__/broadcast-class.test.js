// @vitest-environment node
//
// broadcast-class — "The Broadcast: How It All Works" must mirror the youth-class
// shape, teach REAL technical distinctions (DR-0076 — verified facts, not hand-
// waving), and carry the POV SOP module + library. These prove the 9-week set, the
// computed timeline, the rich framework fields, the Gen-2-locked capture spec, and
// that the paper export carries the SOP library + consent line.
import { describe, it, expect } from 'vitest';
import {
  BROADCAST_META, BROADCAST_MODULES, BROADCAST_SESSION_FLOW, BROADCAST_SESSION_MINUTES,
  BROADCAST_CONFIRMED_COHORT, BROADCAST_PROPOSED_COHORT_START,
  buildBroadcastSchedule, broadcastProgressSummary, exportBroadcastCurriculumMarkdown,
  resolveBroadcastCohort, SOP_SEQUENCES, SOP_CAPTURE_PIPELINE,
} from '../lib/broadcast-class.js';

describe('curriculum shape', () => {
  it('has the full 9-week module set (8 stations + the POV SOP module)', () => {
    expect(BROADCAST_MODULES).toHaveLength(9);
    expect(BROADCAST_META.weeks).toBe(9);
    expect(BROADCAST_MODULES.every((m) => m.id && m.title && m.bigIdea && m.inApp && m.anchor?.ref)).toBe(true);
  });
  it('includes the POV SOP module and the excellence capstone', () => {
    const ids = BROADCAST_MODULES.map((m) => m.id);
    expect(ids).toContain('bc8-pov-sops');
    expect(ids).toContain('bc9-excellence-as-worship');
  });
  it('every week carries the facilitator guide + lesson depth', () => {
    for (const m of BROADCAST_MODULES) {
      expect(m.lesson.length).toBeGreaterThan(80);
      expect(Array.isArray(m.facilitator.talkingPoints)).toBe(true);
      expect(m.facilitator.talkingPoints.length).toBeGreaterThan(0);
      expect(typeof m.facilitator.howToRun).toBe('string');
      expect(m.facilitator.discussionPrompts.length).toBeGreaterThan(0);
    }
  });
  it('every week has a check-for-understanding quiz with a valid answer index', () => {
    for (const m of BROADCAST_MODULES) {
      expect(m.quiz?.questions?.length).toBeGreaterThan(0);
      for (const q of m.quiz.questions) {
        expect(Array.isArray(q.options)).toBe(true);
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThan(q.options.length);
      }
    }
  });
  it('the most technical weeks carry skill-level branching and a diagram', () => {
    const gpu = BROADCAST_MODULES.find((m) => m.id === 'bc5-cpu-gpu-cuda');
    expect(gpu.levels.teen).toBeTruthy();
    expect(gpu.levels.senior).toBeTruthy();
    expect(gpu.media.some((x) => x.type === 'diagram' && x.key === 'cpu-vs-gpu')).toBe(true);
  });
  it('the session flow sums to the advertised 75 minutes', () => {
    expect(BROADCAST_SESSION_MINUTES).toBe(75);
    expect(BROADCAST_SESSION_FLOW.length).toBe(6);
  });
});

describe('verified technical substance is present (not hand-waved)', () => {
  it('the GPU week names the real 4070 facts', () => {
    const gpu = BROADCAST_MODULES.find((m) => m.id === 'bc5-cpu-gpu-cuda');
    expect(gpu.lesson).toContain('5,888');
    expect(gpu.lesson).toMatch(/NVENC/);
    expect(gpu.lesson).toMatch(/Ada|AV1/);
  });
  it('the bandwidth week contrasts uncompressed vs compressed and NVMe vs network', () => {
    const bw = BROADCAST_MODULES.find((m) => m.id === 'bc6-bandwidth-network');
    expect(bw.lesson).toMatch(/12 (Gbps|billion)/);
    expect(bw.lesson).toMatch(/NVMe/);
    expect(bw.lesson).toMatch(/Cat6/);
  });
});

describe('POV capture is locked to the Ray-Ban Meta Gen 2 spec (flexible structure)', () => {
  it('the pipeline is sovereign + capture-only with the Gen 2 constraints', () => {
    expect(SOP_CAPTURE_PIPELINE.captureOnly).toBe(true);
    expect(SOP_CAPTURE_PIPELINE.sovereign).toBe(true);
    expect(SOP_CAPTURE_PIPELINE.device).toMatch(/Gen 2/);
    expect(SOP_CAPTURE_PIPELINE.deviceSpec.clipLength).toMatch(/3 ?min/);
    expect(SOP_CAPTURE_PIPELINE.deviceSpec.resolution).toMatch(/3K/);
    expect(SOP_CAPTURE_PIPELINE.deviceSpec.multiClip).toBe(true);
  });
});

describe('timeline + progress are computed, not painted', () => {
  it('buildBroadcastSchedule yields 9 dated rows in order', () => {
    const rows = buildBroadcastSchedule('2026-07-11');
    expect(rows).toHaveLength(9);
    expect(rows[0].week).toBe(1);
    expect(rows[8].week).toBe(9);
    expect(rows[0].weekday).toBe('Saturday');
  });
  it('progress counts only modules actually marked done', () => {
    const s = broadcastProgressSummary({ [BROADCAST_MODULES[0].id]: 'x' });
    expect(s.total).toBe(9);
    expect(s.done).toBe(1);
  });
  it('cohort resolves to the published value, or honors a local override', () => {
    expect(resolveBroadcastCohort(null).startDate).toBe(BROADCAST_CONFIRMED_COHORT.startDate || BROADCAST_PROPOSED_COHORT_START);
    expect(resolveBroadcastCohort({ startDate: '2026-08-01', confirmed: true }).startDate).toBe('2026-08-01');
  });
});

describe('paper export carries the curriculum AND the SOP library', () => {
  it('includes the title, all 9 weeks, and the SOP library + consent', () => {
    const md = exportBroadcastCurriculumMarkdown('2026-07-11');
    expect(md).toContain(BROADCAST_META.title);
    for (const m of BROADCAST_MODULES) expect(md).toContain(m.title);
    expect(md).toContain('Week 9 —');
    expect(md).toContain('Sequence / SOP Library');
    expect(md).toContain('Never the congregation');
    // every SOP sequence's checklist reaches the export
    for (const s of SOP_SEQUENCES) expect(md).toContain(s.title);
  });
});
