// @vitest-environment node
//
// age-adaptive — the SHARED-framework deepening (Darrell 2026-06-16): ONE curriculum
// translated by AGE (developmental pacing), multi-screen venue cast, the HONEST
// generative-visual build target, and feedback-by-age. Adversarial: it tries to make
// the layer fabricate (paint a generative image, invent engagement, lose lesson text)
// and FAILS the build if it does.
import { describe, it, expect } from 'vitest';
import {
  AGE_BANDS, DEFAULT_AGE_BAND, normalizeAgeBand, ageBandProfile, depthChainForAge,
  resolveForAge, chunkLessonForAge, lessonPlanForAge,
} from '../lib/learn-framework.js';
import {
  VISUAL_MODES, GENERATIVE_VISUAL_PIPELINE, generativeVisualAvailable, resolveVisualMode,
  buildVenueCast, DEFAULT_VENUE_SCREENS, normalizeVisualMode,
} from '../lib/venue-cast.js';
import {
  LEARN_ENGAGEMENT_TAG, ENGAGEMENT_SIGNALS, engagementFeedbackText, parseEngagement,
  aggregateEngagementByAge, isEngagementSignal, engagementRowsByAge,
} from '../lib/learn-engagement.js';

const sampleModule = {
  id: 'demo', title: 'Demo', lesson: 'The first idea is that the box does more than one job at a time and we should understand each one. The second idea is that storage and services are different responsibilities that live in the same machine for good reasons. The third idea is that we keep the family data safe across several drives. The fourth idea is that the same box runs the helpers and the local model. The fifth idea is that we never memorize the live numbers because we read them off a real probe instead. The sixth idea is that owning the machine is what keeps the data ours and protects the people who depend on it every single day.',
  levels: {
    child: 'A short, plain, playful child version of the lesson that a ten year old can follow easily.',
    teen: 'A teen version, plainer than standard with encouragement.',
    senior: 'A senior version that gets to the why and the edge cases for an experienced builder.',
  },
};

describe('age bands + developmental defaults', () => {
  it('has child → senior bands with real pacing knobs', () => {
    const ids = AGE_BANDS.map((b) => b.id);
    expect(ids).toEqual(['child', 'youth', 'teen', 'adult', 'senior']);
    const child = ageBandProfile('child');
    expect(child.segmentMinutes).toBeLessThan(ageBandProfile('adult').segmentMinutes); // shorter for a child
    expect(child.breakEveryMin).toBeGreaterThan(0);     // breaks on for a child
    expect(child.contentBeforeCheck).toBe(1);           // one idea, then a check
    for (const b of AGE_BANDS) {
      expect(typeof b.pacing).toBe('string');
      expect(b.range).toBeTruthy();
    }
  });
  it('normalizeAgeBand defends against junk', () => {
    expect(normalizeAgeBand('nope')).toBe(DEFAULT_AGE_BAND);
    expect(normalizeAgeBand(null)).toBe(DEFAULT_AGE_BAND);
    expect(normalizeAgeBand('child')).toBe('child');
  });
});

describe('one curriculum, translated by age (resolveForAge fallback chain)', () => {
  it('child → teen → standard → base fallback never returns empty', () => {
    expect(depthChainForAge('child')).toEqual(['child', 'teen', 'standard']);
    // module WITH child text → child
    expect(resolveForAge(sampleModule, 'child').text).toBe(sampleModule.levels.child);
    // module with only teen+senior → child falls back to teen
    const noChild = { ...sampleModule, levels: { teen: sampleModule.levels.teen, senior: sampleModule.levels.senior } };
    expect(resolveForAge(noChild, 'child').text).toBe(noChild.levels.teen);
    // module with NO levels → base lesson (never empty)
    const bare = { id: 'b', lesson: 'base only' };
    expect(resolveForAge(bare, 'child').text).toBe('base only');
    expect(resolveForAge(bare, 'senior').branched).toBe(false);
  });
  it('an explicit depth override wins over the age default', () => {
    expect(resolveForAge(sampleModule, 'child', 'senior').text).toBe(sampleModule.levels.senior);
  });
});

describe('developmental chunking + plan (same text, age-right delivery)', () => {
  it('a child gets many short segments; an adult gets the whole lesson; NO text is lost', () => {
    const childSegs = chunkLessonForAge(sampleModule.lesson, 'child');
    const adultSegs = chunkLessonForAge(sampleModule.lesson, 'adult');
    expect(childSegs.length).toBeGreaterThan(1);
    expect(adultSegs.length).toBe(1);
    // every word survives the chunking (no summarizing/fabrication)
    const childWords = childSegs.join(' ').replace(/\s+/g, ' ').trim().split(' ').length;
    const wholeWords = sampleModule.lesson.replace(/\s+/g, ' ').trim().split(' ').length;
    expect(childWords).toBe(wholeWords);
  });
  it('lessonPlanForAge exposes the real timeline knobs', () => {
    const plan = lessonPlanForAge(sampleModule, 'child');
    expect(plan.totalSegments).toBe(plan.segments.length);
    expect(plan.breakAfterSegments).toBeGreaterThan(0);
    expect(plan.checkAfterSegments).toBe(1);
    expect(plan.band.id).toBe('child');
    expect(() => lessonPlanForAge(null, 'child')).not.toThrow();
    expect(lessonPlanForAge(null, 'child').segments).toEqual([]);
  });
});

describe('generative visuals are an HONEST build target, never faked (DR-0076)', () => {
  it('the pipeline is marked build-target and NOT hardware-ready', () => {
    expect(GENERATIVE_VISUAL_PIPELINE.status).toBe('build-target');
    expect(GENERATIVE_VISUAL_PIPELINE.hardwareReady).toBe(false);
    expect(GENERATIVE_VISUAL_PIPELINE.sovereign).toBe(true);
    expect(VISUAL_MODES.find((m) => m.id === 'generative').available).toBe(false);
  });
  it('generative mode is unavailable unless a REAL hardware signal is passed', () => {
    expect(generativeVisualAvailable()).toBe(false);
    expect(generativeVisualAvailable(false)).toBe(false);
    expect(generativeVisualAvailable(true)).toBe(true);
    // a request for generative degrades to static + explains why, when no GPU
    const r = resolveVisualMode('generative', false);
    expect(r.mode).toBe('static');
    expect(r.degraded).toBe(true);
    expect(r.reason).toBeTruthy();
    // only lights up with a real hardware-ready signal
    expect(resolveVisualMode('generative', true).mode).toBe('generative');
    expect(normalizeVisualMode('junk')).toBe('static');
  });
});

describe('multi-screen venue cast (one lesson, each screen at its level)', () => {
  it('builds a per-screen plan from one source module', () => {
    const cast = buildVenueCast(sampleModule, { baseAge: 'adult', visualMode: 'static' });
    expect(cast.moduleId).toBe('demo');
    expect(cast.visualMode).toBe('static');
    expect(cast.screens.length).toBe(DEFAULT_VENUE_SCREENS.length);
    for (const s of cast.screens) {
      expect(s.ageBand).toBeTruthy();
      expect(s.plan.totalSegments).toBeGreaterThan(0); // each screen has a real plan
    }
  });
  it('a generative request without GPU degrades honestly in the cast', () => {
    const cast = buildVenueCast(sampleModule, { visualMode: 'generative', hwReady: false });
    expect(cast.visualMode).toBe('static');
    expect(cast.visualModeDegraded).toBe(true);
  });
});

describe('feedback-tuned for every age (engagement by age band)', () => {
  it('emits a tagged, parseable signal carrying the age band', () => {
    const text = engagementFeedbackText({ courseKey: 'infrastructure', courseTitle: 'Infra', moduleId: 'inf2-the-nas', ageBand: 'child', signal: 'completed', who: 'Christian' });
    expect(text.startsWith(LEARN_ENGAGEMENT_TAG)).toBe(true);
    const rec = parseEngagement({ id: '1', text });
    expect(rec.band).toBe('child');
    expect(rec.signal).toBe('completed');
    expect(rec.course).toBe('infrastructure');
    expect(rec.module).toBe('inf2-the-nas');
  });
  it('every declared signal is recognized; junk is not', () => {
    for (const s of ENGAGEMENT_SIGNALS) expect(isEngagementSignal(s.id)).toBe(true);
    expect(isEngagementSignal('nope')).toBe(false);
    expect(parseEngagement({ text: 'just a normal feedback note' })).toBe(null);
  });
  it('aggregates by age band from the real feed (empty → honest zeros)', () => {
    const empty = aggregateEngagementByAge([]);
    expect(empty.totals.records).toBe(0);
    for (const b of AGE_BANDS) expect(empty.byBand[b.id].total).toBe(0);

    const feed = [
      { id: '1', text: engagementFeedbackText({ courseKey: 'infrastructure', moduleId: 'inf1', ageBand: 'child', signal: 'started', who: 'C' }) },
      { id: '2', text: engagementFeedbackText({ courseKey: 'infrastructure', moduleId: 'inf1', ageBand: 'child', signal: 'completed', who: 'C' }) },
      { id: '3', text: engagementFeedbackText({ courseKey: 'infrastructure', moduleId: 'inf1', ageBand: 'adult', signal: 'started', who: 'A' }) },
      { id: '4', text: 'unrelated feedback row' },
    ];
    const agg = aggregateEngagementByAge(feed);
    expect(agg.totals.records).toBe(3);
    expect(agg.byBand.child.total).toBe(2);
    expect(agg.byBand.child.counts.completed).toBe(1);
    expect(agg.byBand.child.score).toBeGreaterThan(agg.byBand.adult.score); // completing > starting
    expect(agg.byBand.adult.total).toBe(1);
  });

  it('the "Engagement by age" readout shows EVERY band, even ones with zero signals (Darrell 2026-07-19)', () => {
    // PROVEN-TO-CATCH: the render previously dropped any band with total===0, so
    // Youth/Teen vanished from the panel — "does not explain all levels, leaves out
    // teen." engagementRowsByAge must return one row per AGE_BAND, always, with the
    // quiet ones flagged (not omitted). Regress to filtering zeros and this fails.
    const feed = [
      { id: '1', text: engagementFeedbackText({ courseKey: 'infrastructure', moduleId: 'inf1', ageBand: 'child', signal: 'completed', who: 'C' }) },
      { id: '2', text: engagementFeedbackText({ courseKey: 'infrastructure', moduleId: 'inf1', ageBand: 'adult', signal: 'started', who: 'A' }) },
    ];
    const rows = engagementRowsByAge(aggregateEngagementByAge(feed));
    // ONE row per age band, in framework order — child through senior, none dropped
    expect(rows.map((r) => r.id)).toEqual(AGE_BANDS.map((b) => b.id));
    // teen + youth are present even though nobody used them yet
    const teen = rows.find((r) => r.id === 'teen');
    const youth = rows.find((r) => r.id === 'youth');
    expect(teen).toBeTruthy();
    expect(youth).toBeTruthy();
    expect(teen.quiet).toBe(true);   // no signals → dimmed "no signals yet", NOT removed
    expect(youth.quiet).toBe(true);
    // the bands with real use carry their real numbers, not quiet
    const child = rows.find((r) => r.id === 'child');
    expect(child.quiet).toBe(false);
    expect(child.total).toBe(1);
    expect(child.completed).toBe(1);
    // even a totally empty feed still yields all five rows (honest zeros, DR-0076)
    const emptyRows = engagementRowsByAge(aggregateEngagementByAge([]));
    expect(emptyRows.length).toBe(AGE_BANDS.length);
    expect(emptyRows.every((r) => r.quiet)).toBe(true);
    // defends junk input without throwing
    expect(() => engagementRowsByAge(null)).not.toThrow();
    expect(engagementRowsByAge(null).length).toBe(AGE_BANDS.length);
  });
});
