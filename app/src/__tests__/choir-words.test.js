// @vitest-environment node
//
// choir-words + ari-words-training — the choir's starting point derives from
// the recording, and Ari's skill is MEASURED against the choir's confirmed
// finals (Darrell 2026-07-10: "use one of the final versions from the choir to
// see the difference so Ari can be trained to tease out the words"). Honest by
// construction: no transcript → 'no-transcript', song not found → 'not-found',
// zero confirmed sheets → an honestly-empty calibration, never a padded one.
import { describe, it, expect } from 'vitest';
import {
  DRAFT_WORDS_HEADER, extractHeardQuote, findSongAnchor, wrapAsLines, draftWordsFromTranscript,
} from '../lib/choir-words.js';
import {
  isAutoDraft, wordsDiff, calibrationExamples, calibrationSummaryLine,
} from '../lib/ari-words-training.js';

const TRANSCRIPT = [
  'welcome everybody today the choir sings by bashawn mitchell um my worship is',
  'for real and the song said you don\'t know my story you don\'t know the things',
  'that i\'ve come through you cannot imagine the pain the trials i had to endure',
  'my worship is for real amen amen let the church say amen now turn with me to',
].join(' ');

describe('extractHeardQuote — the harvester note anchors the search', () => {
  it('pulls the quoted heard-in-recording text from the notes', () => {
    const notes = '[auto-draft:v1] Auto-drafted from the service transcript by the worship-song harvester -- please verify or correct the title. Heard in the recording: "my worship is for real. And the song said, "You don\'t know my story"';
    expect(extractHeardQuote(notes)).toContain('my worship is for real');
  });
  it('is null-safe on missing/short notes', () => {
    expect(extractHeardQuote(null)).toBeNull();
    expect(extractHeardQuote('no quote here')).toBeNull();
  });
});

describe('draftWordsFromTranscript — the starting point, honestly labeled', () => {
  it('anchors on the heard quote and returns a labeled, line-wrapped draft', () => {
    const r = draftWordsFromTranscript({ transcriptText: TRANSCRIPT, heardQuote: 'my worship is for real', title: 'My Worship' });
    expect(r.ok).toBe(true);
    expect(r.anchor).toBe('heard');
    expect(r.draft.startsWith(DRAFT_WORDS_HEADER)).toBe(true);
    expect(r.draft).toContain('my worship is for real');
    // Wrapped body lines stay verse-width (the labeled header line is exempt).
    expect(r.draft.split('\n').slice(1).every((l) => l.length <= 60)).toBe(true);
  });
  it('falls back to the title when the quote is absent', () => {
    const r = draftWordsFromTranscript({ transcriptText: TRANSCRIPT, heardQuote: null, title: 'you don\'t know my story' });
    expect(r.ok).toBe(true);
    expect(r.anchor).toBe('title');
  });
  it('says no-transcript / not-found instead of guessing (DR-0076)', () => {
    expect(draftWordsFromTranscript({ transcriptText: '', heardQuote: 'x', title: 'y' })).toMatchObject({ ok: false, reason: 'no-transcript' });
    expect(draftWordsFromTranscript({ transcriptText: TRANSCRIPT, heardQuote: 'totally absent words', title: 'Nope Not Here Ever' })).toMatchObject({ ok: false, reason: 'not-found' });
  });
  it('findSongAnchor tolerates long quotes via the 40-char prefix', () => {
    const long = 'my worship is for real and the song said you don\'t know my story PLUS TAIL DRIFT THAT DIFFERS';
    expect(findSongAnchor(TRANSCRIPT, { heardQuote: long })).toMatchObject({ anchor: 'heard' });
  });
  it('wrapAsLines breaks at word boundaries', () => {
    expect(wrapAsLines('one two three four five', 9)).toBe('one two\nthree\nfour five');
  });
});

describe('the training loop — draft vs the choir\'s confirmed final', () => {
  it('isAutoDraft: the header IS the draft/final boundary', () => {
    expect(isAutoDraft(`${DRAFT_WORDS_HEADER}\n\nwords`)).toBe(true);
    expect(isAutoDraft('You don\'t know my story\nMy worship is for real')).toBe(false);
  });
  it('wordsDiff measures recall and precision of the draft against the final', () => {
    const draft = `${DRAFT_WORDS_HEADER}\n\nmy worship is for real amen amen let the church say amen`;
    const final = 'My worship is for real\nMy worship is for real';
    const d = wordsDiff(draft, final);
    expect(d.comparable).toBe(true);
    expect(d.keptOfFinal).toBeGreaterThan(40);   // the final's words largely came from the draft
    expect(d.keptOfDraft).toBeLessThan(100);     // the choir trimmed the chatter
  });
  it('calibrationExamples derives pairs ONLY from confirmed sheets with transcripts', () => {
    const songs = [
      { id: '1', title: 'My Worship', videoId: 'v1', notes: 'Heard in the recording: "my worship is for real and the song said"', lyrics: 'you don\'t know my story my worship is for real' },
      { id: '2', title: 'Draft still', videoId: 'v1', lyrics: `${DRAFT_WORDS_HEADER}\nx y z` },            // draft -> not a pair
      { id: '3', title: 'No transcript', videoId: 'missing', lyrics: 'real words here' },                    // confirmed, awaiting transcript
      { id: '4', title: 'No words', videoId: 'v1', lyrics: null },                                           // nothing to learn from
    ];
    const out = calibrationExamples(songs, { v1: { text: TRANSCRIPT } });
    expect(out.confirmedSheets).toBe(2);
    expect(out.awaitingTranscript).toBe(1);
    expect(out.examples).toHaveLength(1);
    expect(out.examples[0]).toMatchObject({ songId: '1', anchor: 'heard' });
  });
  it('the summary line is measured, or honestly empty — never padded', () => {
    expect(calibrationSummaryLine({ examples: [], confirmedSheets: 0 })).toContain('No confirmed sheets yet');
    expect(calibrationSummaryLine({ examples: [], confirmedSheets: 2 })).toContain('awaiting transcripts');
    const line = calibrationSummaryLine({ examples: [{ keptOfFinal: 80, keptOfDraft: 40 }, { keptOfFinal: 60, keptOfDraft: 60 }], confirmedSheets: 2 });
    expect(line).toContain('2 confirmed pairs');
    expect(line).toContain('70%');
    expect(line).toContain('50%');
  });
});
