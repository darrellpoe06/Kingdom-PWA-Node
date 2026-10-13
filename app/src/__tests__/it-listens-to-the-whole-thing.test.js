// The five-minute cap was a lid on a microphone asked to do two different jobs.
//
// Darrell, 2026-09-22, sending a screenshot of the Notes box beside a reel
// playing on his phone: "This needs to be able to listen to the whole thing".
//
// One microphone, two jobs. DICTATION is a person speaking a note into a box,
// and five minutes is right for it. LISTENING is something that PLAYS — a reel,
// a sermon, a class, an interview — and every one of those runs past five
// minutes. At five minutes the session ended and everything after it was simply
// not heard. The lid is the defect, not the microphone. Same shape as the
// sticky lesson title earlier the same day: bound it, do not remove it.
//
// WHY THE BRAKE STAYS. A live microphone is exactly the class the three-brakes
// rule governs, and the cap is that brake. So it is SIZED, not deleted:
//
//   * HARD CEILING — three hours, and no tap extends it. That number is not
//     invented here; it is the self-stop workflow-scribe already carries for a
//     long capture, so the app's two long-listening paths stop on one clock
//     rather than on two opinions.
//   * OPT-IN — every other surface keeps five minutes. Nothing starts listening
//     for three hours because someone touched a mic.
//   * HONEST — and this is the defect that was already there: the cap message
//     was the literal string "5 minutes" while decideOnEngineEnd already took a
//     capMs the hook never passed. The first caller to set a different cap
//     would have been told a time that was not the time. A brake that
//     misreports itself is worse than one nobody can see.
//
// AND THE LIMIT IS ON THE SCREEN. A web page cannot reach into another app and
// take its audio. What this has is the microphone, so it hears what is played
// OUT LOUD and hears nothing through headphones. Saying so costs one line;
// not saying it costs him a three-hour recording of silence.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  decideOnEngineEnd, capMinutes, VOICE_SESSION_CAP_MS, LONG_FORM_SESSION_CAP_MS,
} from '../lib/voice-dictation.js';

const r = (p) => readFileSync(resolve(__dirname, p), 'utf8');
const INPUT = r('../components/OneVoiceInput.jsx');
const DICT = r('../lib/voice-dictation.js');

describe('the cap is sized to the job instead of being one number for both', () => {
  it('dictation is unchanged at five minutes', () => {
    expect(VOICE_SESSION_CAP_MS).toBe(5 * 60 * 1000);
  });

  it('long-form is three hours — workflow-scribe’s own self-stop, not a new opinion', () => {
    expect(LONG_FORM_SESSION_CAP_MS).toBe(180 * 60 * 1000);
  });

  it('REPRODUCES THE DEFECT: a 40-minute sermon died at five minutes', () => {
    const startedAt = 0;
    const fortyMinutes = 40 * 60 * 1000;
    // The old behaviour, which is still the default for dictation.
    expect(decideOnEngineEnd({ active: true, startedAt, now: fortyMinutes })).toBe('cap');
    // The same forty minutes, asked to listen to the whole thing.
    expect(decideOnEngineEnd({ active: true, startedAt, now: fortyMinutes, capMs: LONG_FORM_SESSION_CAP_MS })).toBe('restart');
  });

  it('a pause inside a long session still just restarts', () => {
    expect(decideOnEngineEnd({ active: true, startedAt: 0, now: 90 * 60 * 1000, capMs: LONG_FORM_SESSION_CAP_MS })).toBe('restart');
  });

  it('the ceiling is HARD — past three hours it stops, held mic or not', () => {
    expect(decideOnEngineEnd({ active: true, startedAt: 0, now: LONG_FORM_SESSION_CAP_MS, capMs: LONG_FORM_SESSION_CAP_MS })).toBe('cap');
    expect(decideOnEngineEnd({ active: true, startedAt: 0, now: 5 * 60 * 60 * 1000, capMs: LONG_FORM_SESSION_CAP_MS })).toBe('cap');
  });

  it('the speaker’s own Stop still wins at any length', () => {
    expect(decideOnEngineEnd({ active: false, startedAt: 0, now: 1000, capMs: LONG_FORM_SESSION_CAP_MS })).toBe('stopped');
  });
});

describe('the cap message says the real number', () => {
  it('renders both caps the way a person says them', () => {
    expect(capMinutes(VOICE_SESSION_CAP_MS)).toBe('5 minutes');
    expect(capMinutes(LONG_FORM_SESSION_CAP_MS)).toBe('3 hours');
  });

  it('says "1 hour" and "1 minute", because "1 hours" teaches distrust', () => {
    expect(capMinutes(60 * 60 * 1000)).toBe('1 hour');
    expect(capMinutes(60 * 1000)).toBe('1 minute');
  });

  it('falls back to minutes when it is not a whole number of hours', () => {
    expect(capMinutes(90 * 60 * 1000)).toBe('90 minutes');
  });

  it('the hook interpolates it rather than hardcoding five', () => {
    // The pre-fix line was the literal string '5 minutes' while the pure
    // decision function already accepted a capMs nobody passed it.
    expect(DICT).toMatch(/Paused after \$\{capMinutes\(capMs\)\} of listening/);
    expect(DICT).not.toMatch(/Paused after 5 minutes of listening/);
  });

  it('the hook actually PASSES capMs to the decision, which is what was missing', () => {
    expect(DICT).toMatch(/export function useVoiceDictation\(\{ onTranscript, lang = 'en-US', capMs = VOICE_SESSION_CAP_MS \} = \{\}\)/);
    const onEnd = DICT.slice(DICT.indexOf('r.onend = () =>'), DICT.indexOf('r.onend = () =>') + 500);
    expect(onEnd).toMatch(/capMs,/);
  });
});

describe('the control is opt-in and says what it cannot hear', () => {
  it('the box offers it', () => {
    expect(INPUT).toMatch(/data-testid="listen-whole-thing"/);
    expect(INPUT).toMatch(/Listen to the whole thing/);
  });

  it('it is OFF by default, so no other surface starts a three-hour session', () => {
    expect(INPUT).toMatch(/const \[wholeThing, setWholeThing\] = useState\(false\);/);
  });

  it('the long cap is used ONLY when it is on', () => {
    expect(INPUT).toMatch(/capMs: wholeThing \? LONG_FORM_SESSION_CAP_MS : VOICE_SESSION_CAP_MS/);
  });

  it('it cannot be flipped mid-session, which would change the cap under a running clock', () => {
    const block = INPUT.slice(INPUT.indexOf('data-testid="listen-whole-thing"') - 200, INPUT.indexOf('data-testid="listen-whole-thing"') + 300);
    expect(block).toMatch(/disabled=\{mic\.listening\}/);
  });

  it('while listening, the surface states when it will stop itself', () => {
    expect(INPUT).toMatch(/stops itself after \{capMinutes\(/);
  });

  it('and it says OUT LOUD, because a page cannot take another app’s audio', () => {
    expect(INPUT).toMatch(/data-testid="listen-whole-thing-limit"/);
    expect(INPUT).toMatch(/play the sound OUT LOUD/);
    expect(INPUT).toMatch(/through headphones it hears nothing/);
  });
});
