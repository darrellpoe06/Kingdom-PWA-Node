import { describe, it, expect } from 'vitest';
import {
  draftCourseFromSource, distillTranscript, verifyCopyrightSafe, attributionLine,
  MAX_VERBATIM_WORDS, MAX_QUOTE_WORDS,
} from '../lib/tlc-course-ingest.js';
import { makeCourse } from '../lib/tlc-training-library.js';

// A realistic teaching transcript (synthetic — written for the test, not a real video).
const TRANSCRIPT = `
Today we are going to talk about how anxiety works in the body and the mind. Anxiety is the body's alarm
system and it is trying to protect you from danger. When the alarm fires without a real threat it becomes a
problem for many people in everyday life. The first skill we will practice is paced breathing where you make
your exhale longer than your inhale to calm the nervous system down. The second skill is grounding through the
senses naming the things you can see hear and feel around you right now. These coping skills are supports and
they are not a replacement for real treatment with a licensed professional. When we work with a client we listen
much more than we advise and we validate the feeling before we ever try to solve the problem in front of us.
The therapeutic relationship itself is one of the strongest predictors of whether therapy actually helps a person.
`;

describe('YouTube ingest — distill into ORIGINAL, attributed draft material', () => {
  it('distillTranscript extracts short key points and a capped quote (no long verbatim runs)', () => {
    const d = distillTranscript(TRANSCRIPT);
    expect(d.keyPoints.length).toBeGreaterThan(0);
    for (const p of d.keyPoints) expect(p.split(/\s+/).length).toBeLessThanOrEqual(10);
    expect(d.quote.split(/\s+/).filter(Boolean).length).toBeLessThanOrEqual(MAX_QUOTE_WORDS);
    expect(d.modules.length).toBeGreaterThan(0);
  });

  it('draftCourseFromSource builds an attributed, validated:false, youtube-distilled course', () => {
    const course = draftCourseFromSource({
      url: 'https://youtu.be/abc', channel: '@teacher', teacher: 'Dr. Example',
      field: 'Crisis & risk', transcript: TRANSCRIPT, now: '2026-06-29T00:00:00Z',
    });
    expect(course.origin).toBe('youtube-distilled');
    expect(course.validated).toBe(false);
    expect(course.source.teacher).toBe('Dr. Example');
    expect(course.field).toBe('Crisis & risk');
    expect(course.summary).toMatch(/Dr\. Example/);
    expect(course.modules.length).toBeGreaterThan(0);
    expect(course.smeConfirm).toBeTruthy();
  });

  it('PROVEN-TO-CATCH: the distilled draft passes the copyright gate (no verbatim reproduction)', () => {
    const course = draftCourseFromSource({ url: 'u', teacher: 'T', field: 'Individual therapy', transcript: TRANSCRIPT, now: 'NOW' });
    const check = verifyCopyrightSafe(course, TRANSCRIPT);
    expect(check.safe).toBe(true);
    expect(check.violations.length).toBe(0);
  });

  it('PROVEN-TO-CATCH: a course that LIFTS a long verbatim run is REJECTED by the gate', () => {
    // Build a course whose body copies a long consecutive run straight from the transcript.
    const verbatimRun = TRANSCRIPT.trim().split(/\s+/).slice(0, MAX_VERBATIM_WORDS + 8).join(' ');
    const bad = makeCourse({
      id: 'bad', field: 'Individual therapy', title: 'Lifted',
      modules: [{ id: 'bad-m1', title: 'x', bigIdea: 'y', levels: { standard: verbatimRun }, quiz: { questions: [] } }],
    });
    const check = verifyCopyrightSafe(bad, TRANSCRIPT);
    expect(check.safe).toBe(false);
    expect(check.violations.length).toBeGreaterThan(0);
    expect(check.violations[0].moduleId).toBe('bad-m1');
  });

  it('without captions, returns an honest SKELETON flagged SME-pending (no painted content)', () => {
    const course = draftCourseFromSource({ url: 'https://youtu.be/x', field: 'Documentation', teacher: 'T' });
    expect(course.origin).toBe('youtube-distilled');
    expect(course.modules.length).toBe(0);
    expect(course.smeConfirm).toMatch(/caption/i);
    expect(course.summary).toMatch(/awaiting/i);
  });

  it('attributionLine credits the teacher AND frames them as a conduit who sources Yahweh', () => {
    const line = attributionLine({ teacher: 'Dr. Q', channel: '@q', url: 'http://x' });
    expect(line).toMatch(/Dr\. Q/);                       // credited (honesty/copyright)
    expect(line).toMatch(/conduit/i);                     // not elevated above the Word
    expect(line).toMatch(/all true knowledge is from Yahweh/i);
    expect(line).toMatch(/tested against Scripture/i);
    expect(line).toMatch(/Christina/);                    // SME gate
  });

  it('records source REACH as an asset when provided (honest, no fabricated count)', () => {
    const course = draftCourseFromSource({
      url: 'u', teacher: 'Big Name', field: 'Individual therapy', transcript: TRANSCRIPT,
      reach: { recognition: 'Millions of views (reported).', exactCount: null }, now: 'NOW',
    });
    expect(course.sourceReach).toBeTruthy();
    expect(course.sourceReach.recognition).toMatch(/million/i);
    expect(course.sourceReach.exactCount).toBe(null);
  });
});
