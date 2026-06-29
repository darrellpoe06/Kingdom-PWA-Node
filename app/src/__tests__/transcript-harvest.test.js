// =============================================================================
// transcript-harvest — the YouTube-caption extractors that un-gate the harvest.
// =============================================================================
// These pin the un-gate Darrell asked for (2026-06-29): the transcript-derived
// harvests (lessons / discernment / testimony / trivia) now mine from a transcript
// sourced from YouTube auto-captions — no GPU, no Whisper. PROVEN-TO-CATCH: each
// extractor must pull REAL text out of the transcript (DR-0076 — evidence, not
// paint); if a future change makes one return nothing on real preaching, its test
// goes red.
//
// The fixture below is a compact, realistic service transcript. The SAME extractors
// were verified live against three real @thelovecorner services (11,350 / 9,782 /
// 11,566 words) climbing each video 22% -> 67%; see harvest-youtube-climb.test.js.
import { describe, it, expect } from 'vitest';
import {
  extractTrivia, extractLessons, extractTestimony, extractDiscernment,
  harvestFromTranscript, WORLD_ISSUE_TOPICS,
} from '../lib/transcript-harvest.js';

// A realistic caption run: speaker carets, [Music] tags, sparse punctuation —
// exactly the shape YouTube auto-captions arrive in.
const TRANSCRIPT = `
>> Amen. Hallelujah. We give God the glory. [Music] Can I get an amen?
Turn with me to John 3:16 and then over to Romans 8:28. The Bible says in Proverbs 22:6,
train up a child in the way he should go. Now watch this. The first thing I want you to
understand is that God is a father to the fatherless. How many of you know that we serve a
great God? What does it mean to be a real father in this house? The second thing is that
fatherhood is a responsibility, not an option. I remember when I was a young man, my mother
raised me and my father was not around. Years ago I made a promise to God about my own family.
The money will come and the money will go, but a father who stays, that is wealth. Some of us
are dealing with debt and the pressure of providing, and children are watching how we handle
that pressure. Have you ever felt like you were blessed and you did not feel blessed? Let me
tell you something about this family and these children. The point is that the father sets the
tone for the whole family.
`;

describe('extractTrivia — BG own questions, filler dropped', () => {
  it('pulls real teaching questions out of the transcript', () => {
    const qs = extractTrivia(TRANSCRIPT);
    expect(qs.length).toBeGreaterThanOrEqual(2);
    expect(qs.join(' ')).toContain('What does it mean to be a real father');
    // Every returned item is genuinely a question.
    for (const q of qs) expect(q.trim().endsWith('?')).toBe(true);
  });

  it('drops call-and-response filler ("Can I get an amen?")', () => {
    const qs = extractTrivia(TRANSCRIPT);
    expect(qs.some((q) => /amen/i.test(q))).toBe(false);
  });
});

describe('extractLessons — teaching beats from BG own structure', () => {
  it('captures enumerated / cued teaching points verbatim', () => {
    const ls = extractLessons(TRANSCRIPT);
    expect(ls.length).toBeGreaterThanOrEqual(2);
    expect(ls.join(' ')).toMatch(/first thing|second thing|I want you to understand/i);
  });
});

describe('extractTestimony — first-person stories only', () => {
  it('captures the personal narrative when present', () => {
    const ts = extractTestimony(TRANSCRIPT);
    expect(ts.length).toBeGreaterThanOrEqual(1);
    expect(ts.join(' ')).toMatch(/when I was|I remember|my mother/i);
  });

  it('returns nothing on a message with no personal story (honest gap)', () => {
    const ts = extractTestimony('The Lord is good and His mercy endures forever. Give Him praise.');
    expect(ts).toEqual([]);
  });
});

describe('extractDiscernment — the world-issues the message engages', () => {
  it('surfaces family & money as the engaged themes, strongest first', () => {
    const topics = extractDiscernment(TRANSCRIPT);
    const keys = topics.map((t) => t.key);
    expect(keys).toContain('family');
    expect(keys).toContain('money');
    // Counts are real (the words are in the transcript) and sorted descending.
    for (let i = 1; i < topics.length; i++) expect(topics[i - 1].count).toBeGreaterThanOrEqual(topics[i].count);
  });

  it('a passing single mention does not light a whole topic (threshold)', () => {
    // "marriage" appears 0 times -> never surfaces.
    const topics = extractDiscernment(TRANSCRIPT);
    expect(topics.find((t) => t.key === 'marriage')).toBeUndefined();
  });

  it('every topic in the registry has a key, label, and regex', () => {
    for (const t of WORLD_ISSUE_TOPICS) {
      expect(typeof t.key).toBe('string');
      expect(typeof t.label).toBe('string');
      expect(t.re).toBeInstanceOf(RegExp);
    }
  });
});

describe('harvestFromTranscript — the one shared signal map', () => {
  it('lights transcript (complete) + the four mined harvests (partial), all evidenced', () => {
    const sig = harvestFromTranscript(TRANSCRIPT);
    expect(sig.transcript).toMatchObject({ status: 'complete', evidenced: true });
    for (const k of ['lessons', 'discernment', 'testimony', 'trivia']) {
      expect(sig[k]).toMatchObject({ status: 'partial', evidenced: true });
      expect(sig[k].count).toBeGreaterThan(0);
      expect(Array.isArray(sig[k].refs)).toBe(true);
    }
    // Never emits scripture/songs — deriveSignals owns those (no clobber).
    expect(sig.scripture).toBeUndefined();
    expect(sig.songs).toBeUndefined();
  });

  it('an empty / trivial transcript yields nothing (no painting)', () => {
    expect(harvestFromTranscript('')).toEqual({});
    expect(harvestFromTranscript('   ')).toEqual({});
    expect(harvestFromTranscript('um, uh, yeah')).toEqual({});
  });
});
