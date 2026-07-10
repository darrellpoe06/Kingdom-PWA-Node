// @vitest-environment node
//
// voice-dictation primitive — the "type or speak in every input" capability.
// The React hook is thin glue; the bits worth proving are the two pure
// functions it leans on: feature detection (which decides whether a surface
// shows a mic at all — the graceful-degradation half) and transcript parsing
// (which turns the Web Speech result event into the text we insert).
import { describe, it, expect } from 'vitest';
import { detectSpeechRecognition, extractTranscript, extractNewFinalTranscript, decideOnEngineEnd, VOICE_SESSION_CAP_MS } from '../lib/voice-dictation.js';

describe('detectSpeechRecognition — show the mic only where supported', () => {
  it('returns null when no SpeechRecognition is present (type-only fallback)', () => {
    expect(detectSpeechRecognition({})).toBe(null);
  });
  it('returns null when window itself is absent (SSR / no DOM)', () => {
    expect(detectSpeechRecognition(undefined)).toBe(null);
  });
  it('finds the standard SpeechRecognition', () => {
    const SR = function () {};
    expect(detectSpeechRecognition({ SpeechRecognition: SR })).toBe(SR);
  });
  it('finds the webkit-prefixed constructor (Safari / iOS)', () => {
    const SR = function () {};
    expect(detectSpeechRecognition({ webkitSpeechRecognition: SR })).toBe(SR);
  });
});

describe('extractTranscript — turn a result event into insertable text', () => {
  it('joins multiple results into one trimmed phrase', () => {
    const event = { results: [
      [{ transcript: 'please pray' }],
      [{ transcript: 'for Sister Mae' }],
    ] };
    expect(extractTranscript(event)).toBe('please pray for Sister Mae');
  });
  it('collapses whitespace', () => {
    const event = { results: [[{ transcript: '  the   sink  ' }]] };
    expect(extractTranscript(event)).toBe('the sink');
  });
  it('is safe on an empty / malformed event', () => {
    expect(extractTranscript(null)).toBe('');
    expect(extractTranscript({})).toBe('');
    expect(extractTranscript({ results: [[{}]] })).toBe('');
  });
});

// PUSH-TO-END (Darrell 2026-07-10: "long pauses stop it instead of push to
// end"). The engine ends itself on silence; the session must not — only the
// speaker's Stop tap or the hard cap ends a note. The decision is pure and
// pinned here (proven-to-catch: the old behavior — stop on every engine end —
// fails these).
describe('decideOnEngineEnd — a pause is not a Stop', () => {
  it('RESTARTS when the engine quits on a pause while the speaker still holds the mic', () => {
    expect(decideOnEngineEnd({ active: true, startedAt: 1000, now: 61000 })).toBe('restart');
  });
  it('STOPS only when the speaker tapped Stop (active=false)', () => {
    expect(decideOnEngineEnd({ active: false, startedAt: 1000, now: 61000 })).toBe('stopped');
  });
  it('THE BRAKE: caps a session at the hard limit so a forgotten mic never listens forever', () => {
    expect(decideOnEngineEnd({ active: true, startedAt: 0, now: VOICE_SESSION_CAP_MS })).toBe('cap');
    expect(decideOnEngineEnd({ active: true, startedAt: 0, now: VOICE_SESSION_CAP_MS - 1 })).toBe('restart');
  });
});

describe('extractNewFinalTranscript — a continuous session never re-inserts earlier sentences', () => {
  it('forwards only the results from resultIndex onward', () => {
    const event = {
      resultIndex: 1,
      results: [
        Object.assign([{ transcript: 'first sentence already delivered' }], { isFinal: true }),
        Object.assign([{ transcript: 'the new words after the pause' }], { isFinal: true }),
      ],
    };
    expect(extractNewFinalTranscript(event)).toBe('the new words after the pause');
  });
  it('skips interim (non-final) results so half-words never land in the field', () => {
    const event = {
      resultIndex: 0,
      results: [
        Object.assign([{ transcript: 'finished thought' }], { isFinal: true }),
        Object.assign([{ transcript: 'still bei' }], { isFinal: false }),
      ],
    };
    expect(extractNewFinalTranscript(event)).toBe('finished thought');
  });
  it('treats an engine with no finality marks as final (no words lost)', () => {
    const event = { results: [[{ transcript: 'plain engine words' }]] };
    expect(extractNewFinalTranscript(event)).toBe('plain engine words');
  });
  it('is safe on malformed events', () => {
    expect(extractNewFinalTranscript(null)).toBe('');
    expect(extractNewFinalTranscript({})).toBe('');
  });
});
