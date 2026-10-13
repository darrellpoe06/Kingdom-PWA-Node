// @vitest-environment node
// =============================================================================
// Are the words ON THE WALL the words that were actually SUNG?
// =============================================================================
// Darrell 2026-09-20: "the YouTube videos are supposed to be getting the songs
// lyrics and making sure they are accurate on the screen."
//
// THE GAP, measured before this was written. The chain was already whole —
// captions land in video_transcripts, choir-words.js drafts a sheet from them,
// a director confirms it, ndi-output.js puts the stanza on the wall — and
// ari-words-training.js measures a DRAFT against a FINAL. Nothing compared the
// FINISHED words against WHAT WAS SUNG, so a sheet could be confirmed once and
// drift, or be typed from somebody else's recording, and every instrument in
// the house would report green while the room read lines nobody sang.
//
// THE ASYMMETRY IS THE DESIGN. On-the-wall-but-not-heard is a real fault: text
// in front of the congregation on our authority that the recording does not
// support. Heard-but-not-on-the-wall is ORDINARY — an ad-lib, a repeat, a
// vamp, a spoken exhortation — and is very often exactly right. Blending them
// into one score would hide the first inside the second, so only the first
// drives the verdict and the tests below pin that.
import { describe, it, expect } from 'vitest';
import {
  VERDICT, contentWords, renditionWindow, lyricsAgainstRendition,
  accuracyLine, songsNeedingWordReview,
} from '../lib/lyrics-accuracy.js';

// A caption transcript, in the shape YouTube actually produces: no punctuation,
// no capitals, run together, with the preacher talking either side of the song.
const TRANSCRIPT = [
  'and we thank him this morning church we thank him now the choir is going to come',
  'my worship is for real you dont know my story you dont know the things that ive',
  'come through you cannot imagine the pain the trials i had to endure my worship is',
  'for real sing it again my worship is for real amen amen let the church say amen',
  'now turn with me in your bibles to the book of romans chapter eight',
].join(' ');

const SUNG = ['My worship is for real', 'You don\'t know my story',
  'You don\'t know the things that I\'ve come through',
  'You cannot imagine the pain', 'The trials I had to endure'].join('\n');

describe('the measure itself is sound before anything is measured with it', () => {
  it('drops the words too common to carry evidence either way', () => {
    // 'the' and 'and' appear in every transcript ever made; a match built on
    // them would be a coincidence dressed as a finding.
    expect(contentWords('The worship and the story')).toEqual(['worship', 'story']);
  });

  it('finds the slice of transcript the rendition occupies, reaching BEFORE the anchor', () => {
    // The heard quote is usually a line from partway in, so a window that
    // started AT the anchor would miss the song's opening lines.
    const w = renditionWindow(TRANSCRIPT, { heardQuote: 'the trials i had to endure' });
    expect(w).toBeTruthy();
    expect(w.text).toContain('my worship is for real');
  });

  it('returns a stated non-answer rather than a padded score', () => {
    expect(lyricsAgainstRendition(SUNG, '').verdict).toBe(VERDICT.NO_TRANSCRIPT);
    expect(lyricsAgainstRendition('', TRANSCRIPT).verdict).toBe(VERDICT.NO_WORDS);
    expect(lyricsAgainstRendition(SUNG, 'a transcript about something else entirely with no song in it').verdict)
      .toBe(VERDICT.NOT_FOUND);
  });

  it('every verdict has an honest line a steward can read', () => {
    for (const v of Object.values(VERDICT)) {
      const line = accuracyLine({ verdict: v, heardShare: 40, unheardLines: [{}], extraHeard: [] });
      expect(line.length, `${v} has no readable line`).toBeGreaterThan(20);
    }
  });
});

describe('THE REAL CHECK — a sheet against the rendition', () => {
  it('a sheet that matches what was sung passes', () => {
    const r = lyricsAgainstRendition(SUNG, TRANSCRIPT, { heardQuote: 'my worship is for real' });
    expect(r.verdict).toBe(VERDICT.MATCHED);
    expect(r.heardShare).toBeGreaterThanOrEqual(80);
    expect(r.checked).toBe(5);
  });

  it('PROVEN-TO-CATCH: a line on the wall that was never sung is reported', () => {
    // The defect this module exists for. Four real lines and one that belongs
    // to a different song — which is exactly what a sheet typed from somebody
    // else's recording looks like.
    const bent = [SUNG, 'Break every chain there is power in the name of Jesus'].join('\n');
    const r = lyricsAgainstRendition(bent, TRANSCRIPT, { heardQuote: 'my worship is for real' });
    const flagged = r.unheardLines.map((u) => u.line);
    expect(flagged).toContain('Break every chain there is power in the name of Jesus');
    expect(flagged, 'a line that WAS sung got flagged').not.toContain('My worship is for real');
  });

  it('PROVEN-TO-CATCH: a sheet from the wrong song entirely fails the verdict', () => {
    const wrong = ['Break every chain', 'There is power in the name of Jesus',
      'All the chains broken off', 'Amazing grace how sweet the sound'].join('\n');
    const r = lyricsAgainstRendition(wrong, TRANSCRIPT, { title: 'my worship is for real' });
    expect(r.verdict).toBe(VERDICT.REVIEW);
    expect(r.heardShare).toBeLessThan(60);
  });

  it('an AD-LIB never lowers the verdict — heard-but-not-on-the-wall is ordinary', () => {
    // "sing it again", "amen amen", the exhortation either side: all sung, none
    // on the sheet. That is a faithful sheet of a lively rendition, not a fault.
    const r = lyricsAgainstRendition(SUNG, TRANSCRIPT, { heardQuote: 'my worship is for real' });
    expect(r.verdict).toBe(VERDICT.MATCHED);
    expect(r.extraHeard.length, 'the ad-libs were not even noticed').toBeGreaterThan(0);
    expect(r.extraHeard).toContain('amen');
  });

  it('the two failures are reported SEPARATELY, which is the whole design', () => {
    const bent = [SUNG, 'Break every chain there is power in the name of Jesus'].join('\n');
    const r = lyricsAgainstRendition(bent, TRANSCRIPT, { heardQuote: 'my worship is for real' });
    // on the wall, not heard -> actionable
    expect(r.unheardLines.length).toBe(1);
    // heard, not on the wall -> reported, never penalised
    expect(r.extraHeard.length).toBeGreaterThan(0);
    expect(r).not.toHaveProperty('combinedScore');
  });

  it('is DESCRIPTIVE, never prescriptive — it proposes no replacement words', () => {
    // The binding rule from choir-renditions.js (Darrell 2026-06-24). An
    // auto-corrector would quietly make the record PRESCRIBE how to sing.
    const r = lyricsAgainstRendition(SUNG, TRANSCRIPT, { heardQuote: 'my worship is for real' });
    const keys = Object.keys(r);
    for (const forbidden of ['suggested', 'correction', 'replacement', 'fixed', 'rewrite']) {
      expect(keys, `the result proposes a ${forbidden}`).not.toContain(forbidden);
    }
  });

  it('a low score flags for review and never claims the sheet is wrong', () => {
    // A caption transcript mishears, drops and runs words together. The verdict
    // name and the steward line both have to carry that, or a steward will
    // "correct" a correct sheet to match a bad transcript.
    const line = accuracyLine({ verdict: VERDICT.REVIEW, heardShare: 20, unheardLines: [{}, {}], extraHeard: [] });
    expect(line).toMatch(/review/i);
    expect(line).toMatch(/mishears|does not say the sheet is wrong/i);
  });
});

describe('the review queue a steward actually opens', () => {
  it('lists only the songs that need a look, worst first', () => {
    const rows = [
      { title: 'My Worship', videoId: 'v1', words: SUNG, heardQuote: 'my worship is for real' },
      { title: 'Wrong Sheet', videoId: 'v1', words: 'Break every chain there is power in the name of Jesus\nAll the chains broken off', heardQuote: 'my worship is for real' },
      { title: 'No Transcript Yet', videoId: 'v9', words: SUNG },
    ];
    const q = songsNeedingWordReview(rows, { v1: TRANSCRIPT });
    expect(q.map((x) => x.title)).toEqual(['Wrong Sheet']);
    expect(q[0].unheardLines.length).toBeGreaterThan(0);
  });

  it('a song with no transcript is never dragged into the queue as a fault', () => {
    const q = songsNeedingWordReview(
      [{ title: 'No Transcript Yet', videoId: 'v9', words: SUNG }], {},
    );
    expect(q).toEqual([]);
  });
});
