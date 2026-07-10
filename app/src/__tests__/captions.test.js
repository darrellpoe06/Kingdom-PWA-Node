// captions.test.js — the sovereign caption spine, proven to catch (DR-0076).
// Every assertion pins a real behavior the display + coverage surfaces rely on:
// round-tripping VTT, finding the active line at a playhead time, searching, and
// the honest "an untimed transcript is NOT a caption track" distinction.
import { describe, it, expect } from 'vitest';
import {
  cleanCueText,
  vttTimestamp,
  formatClock,
  cuesFromSegments,
  buildVtt,
  parseVtt,
  activeCueIndex,
  activeCue,
  searchCues,
  hasCaptions,
  captionSourceLabel,
  captionSummary,
} from '../lib/captions.js';

describe('cleanCueText', () => {
  it('strips speaker carets but keeps spoken words AND non-speech cues ([Music])', () => {
    // [Music]/[Applause] are legitimate caption cues for deaf/HOH viewers, so
    // unlike the transcript miner we KEEP them; only the ">>" carets are noise.
    expect(cleanCueText('>> and Jesus said [Music] have mercy')).toBe('and Jesus said [Music] have mercy');
  });
  it('collapses whitespace/newlines and handles null', () => {
    expect(cleanCueText('a\n\n  b   c')).toBe('a b c');
    expect(cleanCueText(null)).toBe('');
    expect(cleanCueText(undefined)).toBe('');
  });
});

describe('vttTimestamp', () => {
  it('always renders HH:MM:SS.mmm', () => {
    expect(vttTimestamp(0)).toBe('00:00:00.000');
    expect(vttTimestamp(1.5)).toBe('00:00:01.500');
    expect(vttTimestamp(65.25)).toBe('00:01:05.250');
    expect(vttTimestamp(3661.001)).toBe('01:01:01.001');
  });
  it('carries millisecond rounding into seconds', () => {
    expect(vttTimestamp(0.9999)).toBe('00:00:01.000');
  });
  it('clamps negatives / non-finite to zero', () => {
    expect(vttTimestamp(-5)).toBe('00:00:00.000');
    expect(vttTimestamp(NaN)).toBe('00:00:00.000');
    expect(vttTimestamp(Infinity)).toBe('00:00:00.000');
  });
});

describe('formatClock', () => {
  it('is M:SS under an hour and H:MM:SS past it', () => {
    expect(formatClock(9)).toBe('0:09');
    expect(formatClock(65)).toBe('1:05');
    expect(formatClock(3725)).toBe('1:02:05');
  });
});

describe('cuesFromSegments (youtube-transcript-api / Whisper shape)', () => {
  it('builds sorted, cleaned, non-overlapping cues from {text,start,duration}', () => {
    const segs = [
      { text: 'have mercy on us', start: 5, duration: 3 },
      { text: '>> Jesus Master', start: 2, duration: 2 },
    ];
    const cues = cuesFromSegments(segs);
    expect(cues).toEqual([
      { start: 2, end: 4, text: 'Jesus Master' },
      { start: 5, end: 8, text: 'have mercy on us' },
    ]);
  });
  it('clamps a cue end that overruns the next cue start', () => {
    const cues = cuesFromSegments([
      { text: 'one', start: 0, duration: 10 },
      { text: 'two', start: 4, duration: 2 },
    ]);
    expect(cues[0].end).toBe(4); // clamped from 10 down to next start
    expect(cues[1]).toEqual({ start: 4, end: 6, text: 'two' });
  });
  it('drops empty text and tolerates offset/dur aliases', () => {
    const cues = cuesFromSegments([
      { text: '   ', start: 0, duration: 1 },
      { text: 'kept', offset: 3, dur: 2 },
    ]);
    expect(cues).toEqual([{ start: 3, end: 5, text: 'kept' }]);
  });
  it('returns [] for non-arrays', () => {
    expect(cuesFromSegments(null)).toEqual([]);
    expect(cuesFromSegments(undefined)).toEqual([]);
  });
});

describe('buildVtt / parseVtt round-trip', () => {
  const cues = [
    { start: 2, end: 4, text: 'Jesus Master' },
    { start: 5, end: 8, text: 'have mercy on us' },
  ];
  it('builds a valid WEBVTT document', () => {
    const vtt = buildVtt(cues);
    expect(vtt.startsWith('WEBVTT')).toBe(true);
    expect(vtt).toContain('00:00:02.000 --> 00:00:04.000');
    expect(vtt).toContain('Jesus Master');
  });
  it('round-trips through parseVtt', () => {
    const parsed = parseVtt(buildVtt(cues));
    expect(parsed).toEqual(cues);
  });
  it('parses real-world VTT with numeric ids, CRLF, and a NOTE block', () => {
    const raw = 'WEBVTT\r\n\r\nNOTE from YouTube\r\n\r\n1\r\n00:00:01.000 --> 00:00:03.000\r\nfirst line\r\n\r\n2\r\n00:00:03.000 --> 00:00:05.000\r\nsecond line';
    const parsed = parseVtt(raw);
    expect(parsed).toEqual([
      { start: 1, end: 3, text: 'first line' },
      { start: 3, end: 5, text: 'second line' },
    ]);
  });
  it('tolerates MM:SS.mmm short timestamps and comma millis', () => {
    const parsed = parseVtt('WEBVTT\n\n01:05.000 --> 01:07,500\nshort form');
    expect(parsed).toEqual([{ start: 65, end: 67.5, text: 'short form' }]);
  });
  it('returns [] for empty / non-vtt input', () => {
    expect(parseVtt('')).toEqual([]);
    expect(parseVtt(null)).toEqual([]);
    expect(parseVtt('WEBVTT\n\n')).toEqual([]);
  });
});

describe('activeCueIndex (binary search on the playhead)', () => {
  const cues = [
    { start: 0, end: 2, text: 'a' },
    { start: 2, end: 4, text: 'b' },
    { start: 6, end: 8, text: 'c' }, // gap 4-6
  ];
  it('finds the cue whose [start,end) contains t', () => {
    expect(activeCueIndex(cues, 0)).toBe(0);
    expect(activeCueIndex(cues, 1.9)).toBe(0);
    expect(activeCueIndex(cues, 2)).toBe(1);
    expect(activeCueIndex(cues, 7)).toBe(2);
  });
  it('returns -1 before the first cue, in a gap, and after the last', () => {
    expect(activeCueIndex(cues, -1)).toBe(-1);
    expect(activeCueIndex(cues, 5)).toBe(-1); // gap
    expect(activeCueIndex(cues, 99)).toBe(-1);
  });
  it('is robust to empty and non-finite input', () => {
    expect(activeCueIndex([], 1)).toBe(-1);
    expect(activeCueIndex(cues, NaN)).toBe(-1);
  });
  it('activeCue returns the object or null', () => {
    expect(activeCue(cues, 3)).toEqual({ start: 2, end: 4, text: 'b' });
    expect(activeCue(cues, 5)).toBe(null);
  });
});

describe('searchCues', () => {
  const cues = [
    { start: 0, end: 2, text: 'Go show yourselves to the priests' },
    { start: 2, end: 4, text: 'and one of them returned' },
    { start: 4, end: 6, text: 'thy faith hath made thee whole' },
  ];
  it('finds case-insensitive substring matches with index + start', () => {
    const hits = searchCues(cues, 'whole');
    expect(hits).toEqual([{ index: 2, start: 4, end: 6, text: 'thy faith hath made thee whole' }]);
  });
  it('ignores queries shorter than 2 chars', () => {
    expect(searchCues(cues, 'a')).toEqual([]);
    expect(searchCues(cues, '')).toEqual([]);
  });
});

describe('hasCaptions — untimed transcript is NOT a caption track', () => {
  it('true only when there is at least one timed cue', () => {
    expect(hasCaptions([{ start: 0, end: 2, text: 'x' }])).toBe(true);
    expect(hasCaptions([{ start: 2, end: 2, text: 'x' }])).toBe(false); // zero-length
    expect(hasCaptions([])).toBe(false);
    expect(hasCaptions(null)).toBe(false);
  });
});

describe('provenance + summary', () => {
  it('labels known caption sources (DB enum vocabulary) and falls back for unknown', () => {
    expect(captionSourceLabel('youtube-asr')).toBe('YouTube auto-captions');
    expect(captionSourceLabel('whisper-nas')).toBe('Whisper (sovereign, church GPU)');
    expect(captionSourceLabel('manual')).toBe('Human-corrected');
    expect(captionSourceLabel('bogus')).toBe('Unknown source');
  });
  it('summarizes a track from vtt or cues', () => {
    const vtt = buildVtt([{ start: 0, end: 90, text: 'a' }, { start: 90, end: 120, text: 'b' }]);
    const s = captionSummary({ vtt, source: 'whisper-nas' });
    expect(s.captioned).toBe(true);
    expect(s.cueCount).toBe(2);
    expect(s.durationSec).toBe(120);
    expect(s.sourceLabel).toBe('Whisper (sovereign, church GPU)');
  });
  it('an untimed transcript summarizes as not captioned', () => {
    const s = captionSummary({ cues: [], source: 'youtube-asr' });
    expect(s.captioned).toBe(false);
    expect(s.cueCount).toBe(0);
  });
});
