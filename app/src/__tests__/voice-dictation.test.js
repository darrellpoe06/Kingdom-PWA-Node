// @vitest-environment node
//
// voice-dictation primitive — the "type or speak in every input" capability.
// The React hook is thin glue; the bits worth proving are the two pure
// functions it leans on: feature detection (which decides whether a surface
// shows a mic at all — the graceful-degradation half) and transcript parsing
// (which turns the Web Speech result event into the text we insert).
import { describe, it, expect } from 'vitest';
import { detectSpeechRecognition, extractTranscript } from '../lib/voice-dictation.js';

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
