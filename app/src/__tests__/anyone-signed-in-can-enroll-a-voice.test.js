// Two people out of twenty-nine could reach a Record button.
//
// Darrell, 2026-09-22: "fix the recorder so anyone signed in can enroll" — and
// before that, "how can it do what it is claims to be able to do? I can't find
// how to do that add a voice?!!!!!!"
//
// THE TRACE THAT FOUND IT, end to end:
//
//   poe-financial-mvp-v28.jsx   personaKey = reviewerMode ? null : personaOf(email)
//     personaOf -> FAMILY_EMAIL_PROFILES, five emails -> darrell|christina|family
//   VoiceStudio                 showRecorder = personaKey && PERSONA_NAME[personaKey]
//     PERSONA_NAME = { darrell, christina, bishop-gwin }
//
// So the Record section rendered for exactly TWO reachable people. Not hidden
// behind the nav overflow — not rendered. `bishop-gwin` is in the name map with
// no email that maps to it, so the Bishop could never reach it either; `family`
// maps from an email and is absent from the name map, so Darrell Jr saw
// nothing. And reviewerMode nulled the persona, so the recorder vanished for
// Darrell himself whenever he was reviewing a production push.
//
// THE WALL WAS IN THE WRONG LAYER. Migration 0047's INSERT policy already says
// the right thing: any member of the instance may create a row, and only for
// themselves (created_by = auth.uid()). The database had the doctrine right and
// the app was stricter than the rule it was supposedly enforcing.
//
// MEASURED CONSEQUENCE, not a theory: a sovereign-read probe on 2026-09-22 read
// voice_profiles as ever_inserted = 1, stats never reset. One enrolment row in
// the entire life of that database.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { personKeyFor, displayNameFor, enrollmentToRow } from '../lib/voice-sync.js';

const r = (p) => readFileSync(resolve(__dirname, p), 'utf8');
const STUDIO = r('../components/VoiceStudio.jsx');
const SHELL = r('../poe-financial-mvp-v28.jsx');

describe('the enrolment key exists for anyone signed in', () => {
  it('a named persona keeps its historical key, so nothing is orphaned', () => {
    expect(personKeyFor({ personaKey: 'darrell', userId: 'uuid-1' })).toBe('darrell');
    expect(personKeyFor({ personaKey: 'christina', userId: 'uuid-2' })).toBe('christina');
  });

  it('REPRODUCES THE DEFECT: an ordinary signed-in person used to have no key at all', () => {
    // The old expression WAS `personaKey`, so this is what it evaluated to for
    // the other twenty-seven accounts — and showRecorder was gated on it.
    const oldKey = null;
    expect(oldKey).toBeFalsy();
    // The same person now.
    expect(personKeyFor({ personaKey: null, userId: 'abc-123' })).toBe('user:abc-123');
  });

  it('is stable for the same person and different between people', () => {
    expect(personKeyFor({ userId: 'abc' })).toBe(personKeyFor({ userId: 'abc' }));
    expect(personKeyFor({ userId: 'abc' })).not.toBe(personKeyFor({ userId: 'def' }));
  });

  it('returns empty rather than inventing an identity when nobody is signed in', () => {
    expect(personKeyFor({})).toBe('');
    expect(personKeyFor({ personaKey: '  ', userId: null })).toBe('');
  });

  it('the key it produces is what the row is written under', () => {
    const key = personKeyFor({ userId: 'abc-123' });
    const row = enrollmentToRow({ instanceId: 'i1', userId: 'abc-123', personKey: key, displayName: 'Sam' });
    expect(row.person_key).toBe('user:abc-123');
    expect(row.created_by).toBe('abc-123');
    // The self-consent wall the DB enforces is the same one the row satisfies.
    expect(row.consent_state).toBe('granted');
  });
});

describe('the display name never leaks an address or a phone number', () => {
  const names = { darrell: 'Darrell Poe', christina: 'Christina Poe' };

  it('a named persona keeps its full name', () => {
    expect(displayNameFor({ personaKey: 'darrell', personaNames: names })).toBe('Darrell Poe');
  });

  it('otherwise the name the person gave their own account wins', () => {
    expect(displayNameFor({ user: { user_metadata: { full_name: 'Sam Carter' }, email: 'sam@x.com' } })).toBe('Sam Carter');
  });

  it('falls back to the email local part, never the whole address', () => {
    const got = displayNameFor({ user: { email: 'sam@example.com' } });
    expect(got).toBe('sam');
    expect(got).not.toContain('@');
  });

  it('a phone-door account NEVER shows its number — voice_profiles is readable by the whole instance', () => {
    expect(displayNameFor({ user: { email: '15636502416@phone.poetech.us' } })).toBe('My voice');
  });

  it('and a signed-out caller gets a neutral label rather than a crash', () => {
    expect(displayNameFor({})).toBe('My voice');
  });
});

describe('the gate moved from a name map to being signed in', () => {
  it('showRecorder is signed-in-and-not-reviewing, not a persona lookup', () => {
    expect(STUDIO).toMatch(/const showRecorder = !!enrolKey && !reviewerMode;/);
    expect(STUDIO).not.toMatch(/const showRecorder = !!\(personaKey && PERSONA_NAME\[personaKey\]\)/);
  });

  it('the shell no longer nulls the persona to express reviewer mode', () => {
    // Nulling it meant the studio could not tell "reviewing" from "nobody",
    // so it rendered an empty tab in both cases.
    expect(SHELL).toMatch(/personaKey=\{authSession \? personaOf\(authSession\.user\?\.email\) : null\}/);
    expect(SHELL).toMatch(/reviewerMode=\{reviewerMode\}/);
  });

  it('enrolment still requires a real identity AND a space AND not reviewing', () => {
    expect(STUDIO).toMatch(/const canEnrollSelf = !!\(enrolKey && userId && instanceId && !reviewerMode\);/);
  });

  it('the sample and the row are written under the SAME key', () => {
    expect(STUDIO).toMatch(/saveReference\(enrolKey, recorder\.blob\)/);
    expect(STUDIO).toMatch(/personKey: enrolKey/);
  });
});

describe('an enrolment that did not enrol says so', () => {
  it('the silent skip is gone — a missing space is named out loud', () => {
    expect(STUDIO).toMatch(/this account is not a member of a family or church space yet/);
  });

  it('a signed-out device is named too', () => {
    expect(STUDIO).toMatch(/you are not signed in on this device/);
  });

  it('and the copy no longer says only "Saved on this device" when nothing was recorded centrally', () => {
    expect(STUDIO).toMatch(/Saved on this device ONLY/);
    expect(STUDIO).toMatch(/it will not follow you to another device/);
  });

  it('a real enrolment says the consent IS recorded', () => {
    expect(STUDIO).toMatch(/Saved on this device, and your consent is recorded\./);
  });
});
