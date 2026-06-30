import { describe, it, expect } from 'vitest';
import { getCourse, courseTrainingHours } from '../lib/tlc-training-library.js';
import { courseStrands } from '../lib/tlc-course-strands.js';

const COUPLES_ID = 'tl-couples-and-family-desire-connection-and-covenant-rebuilding-intimacy-in-marriage';

describe('Couples & Family draft — Rivah TV / Ellis, taught as desire discrepancy', () => {
  const course = getCourse(COUPLES_ID);

  it('exists in the Couples & family field as a finished, validated:false draft', () => {
    expect(course).toBeTruthy();
    expect(course.field).toBe('Couples & family');
    expect(course.validated).toBe(false);
    expect(courseTrainingHours(course)).toBeGreaterThan(0);
    expect(course.preTest).toBeTruthy();
    expect(course.postTest).toBeTruthy();
  });

  it('is ATTRIBUTED to Rivah TV + the public Ellis conversation, marked source-distilled', () => {
    expect(course.origin).toBe('youtube-distilled');
    expect(course.source.channel).toBe('Rivah TV');
    expect(course.source.url).toContain('UNTcnf7cRNY');
    expect(course.summary).toMatch(/Rivah TV|Ellis/);
  });

  it('records reach as an ASSET, honestly (no fabricated exact count)', () => {
    expect(course.sourceReach).toBeTruthy();
    expect(course.sourceReach.recognition).toMatch(/million|widely|recognized/i);
    expect(course.sourceReach.exactCount).toBe(null); // not fabricated
  });

  it('PROVEN-TO-CATCH: does NOT teach the gendered stereotype as fact — teaches DESIRE DISCREPANCY', () => {
    const allText = JSON.stringify(course).toLowerCase();
    expect(allText).toMatch(/desire discrepancy/);
    // The even-handed correction is explicit: the stereotype is named and rejected.
    expect(allText).toMatch(/not.{0,40}(gender|stereotype|blame|fact)/);
    // The post-test's correct answer is desire discrepancy, NOT a gender-blame option.
    const q = course.postTest.questions.find((x) => /chore|discrepancy/i.test(x.q));
    expect(q.options[q.answer]).toMatch(/desire discrepancy/i);
    expect(q.options[q.answer]).not.toMatch(/women are|men are/i);
  });

  it('braids all four strands with Yahweh’s covenant design at the centre', () => {
    const s = courseStrands(course);
    expect(s.yahweh.anchors).toEqual(expect.arrayContaining(['Genesis 2:24', 'Ephesians 5:25-33']));
    expect(s.yahweh.principle).toMatch(/covenant|oneness/i);
    expect(s.science).toMatch(/Basson|attachment|dual-control|neuroplasticity/i);
    expect(s.societal).toMatch(/social-media|dignity|stereotype/i);
  });

  it('handles real public figures respectfully — educational, not sensational', () => {
    expect(course.smeConfirm).toMatch(/respectful|never sensational/i);
    // The post-test affirms the source is credited + tested against the Word, not reproduced.
    const attrQ = course.postTest.questions.find((x) => /source conversation/i.test(x.q));
    expect(attrQ.options[attrQ.answer]).toMatch(/credit|test|Word/i);
  });
});
