// @vitest-environment node
//
// call-to-give — the Call-to-Give archive derives from the SAME corpus +
// transcript rows everything else reads (DR-0134): the detector is
// deterministic and conservative (support cues alone never claim a giving
// appeal), every detected segment needs church review (DR-0076), a video
// without a transcript reads AWAITING honestly, and coverage is measured with
// the honest denominator (detection only runs where a transcript exists).
import { describe, it, expect } from 'vitest';
import {
  CALL_TO_GIVE_RECORDED, LINKED_SERVICE_VIDEO, TRANSCRIPT_PIPELINE_NOTE,
  STRONG_CUES, extractCallToGive, buildCallToGiveArchive, callToGiveCoverage,
} from '../lib/call-to-give.js';

const APPEAL = `
  Praise the Lord church. Now it is our giving time — as we receive the offering
  this morning, remember the Word says bring ye all the tithes into the storehouse.
  You can give on Givelify or Cash App, or mail your tithes to the church office.
`;

describe('extractCallToGive — deterministic, conservative', () => {
  it('detects a real giving appeal at HIGH confidence with an excerpt and cues', () => {
    const out = extractCallToGive(APPEAL);
    expect(out.found).toBe(true);
    expect(out.confidence).toBe('high');
    expect(out.cues).toContain('giving time');
    expect(out.excerpt.length).toBeGreaterThan(20);
    expect(out.needsReview).toBe(true); // the church confirms; the detector proposes
  });
  it('a single strong cue reads MEDIUM, still needs review', () => {
    const out = extractCallToGive('before we close, this is our offering time, amen.');
    expect(out).toMatchObject({ found: true, confidence: 'medium', needsReview: true });
  });
  it('support cues alone NEVER claim a giving appeal — a teaching on the tithe is not a Call to Give', () => {
    const out = extractCallToGive('Abraham gave a tithe of all, and the offering of Cain was not respected.');
    expect(out.found).toBe(false);
    expect(out.confidence).toBe('none');
  });
  it('degrades honestly on empty input', () => {
    expect(extractCallToGive('').found).toBe(false);
    expect(extractCallToGive(null).found).toBe(false);
  });
  it('matching is case-insensitive (transcripts arrive in every casing)', () => {
    expect(extractCallToGive('IT IS GIVING TIME! WAYS TO GIVE ARE ON THE SCREEN').found).toBe(true);
  });
});

describe('buildCallToGiveArchive — derives from the SAME corpus, invents nothing', () => {
  const corpus = [
    { video_id: 'vid-a', youtube_url: 'https://youtube.com/watch?v=vid-a', service_date: '2026-07-05', title: 'Sunday Service', speaker: 'Bishop Gwin' },
    { video_id: 'vid-b', youtube_url: 'https://youtube.com/watch?v=vid-b', service_date: '2026-06-28', title: 'Sunday Service' },
    { title: 'document-only sermon row (no video)' },
  ];
  const transcripts = { 'vid-a': { text: APPEAL } };

  it('detected where transcribed, AWAITING where not, document-only rows excluded', () => {
    const rows = buildCallToGiveArchive(corpus, transcripts);
    expect(rows).toHaveLength(2); // the video-less row is not a video to harvest
    const a = rows.find((r) => r.videoId === 'vid-a');
    const b = rows.find((r) => r.videoId === 'vid-b');
    expect(a.segment).toMatchObject({ found: true, needsReview: true });
    expect(a.awaitingTranscript).toBe(false);
    expect(b.segment).toBeNull();
    expect(b.awaitingTranscript).toBe(true); // honest, never painted
  });
  it('sorts newest-first and degrades on empty input', () => {
    const rows = buildCallToGiveArchive(corpus, transcripts);
    expect(rows[0].videoId).toBe('vid-a');
    expect(buildCallToGiveArchive(null)).toEqual([]);
  });
  it('a transcript for a video NOT in the corpus creates nothing (attribution, not invention)', () => {
    const rows = buildCallToGiveArchive(corpus, { 'vid-ghost': { text: APPEAL } });
    expect(rows.some((r) => r.videoId === 'vid-ghost')).toBe(false);
  });
});

describe('callToGiveCoverage — measured, honest denominator', () => {
  it('counts corpus / transcribed / detected / awaiting from the derived rows', () => {
    const rows = buildCallToGiveArchive(
      [
        { video_id: 'a', service_date: '2026-07-05' },
        { video_id: 'b', service_date: '2026-06-28' },
        { video_id: 'c', service_date: '2026-06-21' },
      ],
      { a: { text: APPEAL }, b: { text: 'a teaching with no appeal in it' } },
    );
    const cov = callToGiveCoverage(rows);
    expect(cov).toMatchObject({ corpus: 3, withTranscript: 2, detected: 1, awaiting: 1 });
    expect(cov.detectedOfTranscribed).toBe(50); // of TRANSCRIBED, not of corpus
  });
  it('an empty archive reads zero everywhere, never NaN', () => {
    expect(callToGiveCoverage([])).toMatchObject({ corpus: 0, detectedOfTranscribed: 0 });
  });
});

describe('the honest constants', () => {
  it('the linked service video carries its real id and pending provenance', () => {
    expect(LINKED_SERVICE_VIDEO.videoId).toBe('efj-t2_Z-nI');
    expect(LINKED_SERVICE_VIDEO.provenance).toContain('pending');
  });
  it('the transcript answer is dated and carries provenance (P30 freshness)', () => {
    expect(TRANSCRIPT_PIPELINE_NOTE.asOf).toBe(CALL_TO_GIVE_RECORDED);
    expect(TRANSCRIPT_PIPELINE_NOTE.provenance).toContain('load-transcripts.py');
  });
  it('the strong-cue vocabulary stays real phrases, lowercase (the normalizer contract)', () => {
    for (const c of STRONG_CUES) expect(c).toBe(c.toLowerCase());
  });
});
