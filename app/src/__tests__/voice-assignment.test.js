// @vitest-environment node
//
// voice-assignment — the gendered, distinct stand-in mapping (lib/voice-assignment).
// Proven-to-catch (DR-0076): the headline test reproduces Darrell's exact report —
// "all the voices are the same female even when choosing a man" — and asserts the
// fix: a male person maps to a MALE device voice, a female person to a FEMALE one,
// and two different people map to two DIFFERENT voices. It fails against the old
// behavior (every option falling through to the one default voice).
import { describe, it, expect } from 'vitest';
import {
  classifyVoiceGender, buildStandInAssignments, standInVoiceURI, voiceForLocale,
} from '../lib/voice-assignment.js';

// A merged-catalog shape (what mergeVoiceCatalog returns): System + 3 people.
const CATALOG = [
  { id: 'system-default', kind: 'synthetic', personKey: null },
  { id: 'voice-dp', kind: 'personal', personKey: 'darrell', gender: 'male' },
  { id: 'voice-cp', kind: 'personal', personKey: 'christina', gender: 'female' },
  { id: 'voice-bg', kind: 'personal', personKey: 'bishop-gwin', gender: 'male' },
];

// Windows desktop voice set (what the real preview actually exposes): 2 male, 1 female.
const WIN_VOICES = [
  { name: 'Microsoft David - English (United States)', voiceURI: 'david', lang: 'en-US' },
  { name: 'Microsoft Mark - English (United States)', voiceURI: 'mark', lang: 'en-US' },
  { name: 'Microsoft Zira - English (United States)', voiceURI: 'zira', lang: 'en-US' },
];

describe('classifyVoiceGender', () => {
  it('reads explicit Male/Female tokens (Google, Android)', () => {
    expect(classifyVoiceGender({ name: 'Google UK English Male' })).toBe('male');
    expect(classifyVoiceGender({ name: 'Google UK English Female' })).toBe('female');
    expect(classifyVoiceGender({ name: 'English (United States) female' })).toBe('female');
  });
  it('never misreads "female" as male (the substring trap)', () => {
    expect(classifyVoiceGender({ name: 'Karen Female' })).toBe('female');
  });
  it('classifies common engine names across platforms', () => {
    expect(classifyVoiceGender({ name: 'Microsoft David - English (United States)' })).toBe('male');
    expect(classifyVoiceGender({ name: 'Microsoft Zira - English (United States)' })).toBe('female');
    expect(classifyVoiceGender({ name: 'Samantha' })).toBe('female');   // iOS/macOS
    expect(classifyVoiceGender({ name: 'Daniel' })).toBe('male');       // iOS/macOS UK
    expect(classifyVoiceGender({ name: 'Rishi' })).toBe('male');        // en-IN male
  });
  it('returns unknown when there is no signal', () => {
    expect(classifyVoiceGender({ name: 'Google US English', voiceURI: 'x' })).toBe('unknown');
    expect(classifyVoiceGender(null)).toBe('unknown');
  });
});

describe('buildStandInAssignments — the bug fix, proven-to-catch', () => {
  const a = buildStandInAssignments(CATALOG, WIN_VOICES);

  it('a MALE person reads in a MALE device voice (not the default female)', () => {
    expect(classifyVoiceGender(a['voice-dp'])).toBe('male');
    expect(classifyVoiceGender(a['voice-bg'])).toBe('male');
  });

  it('a FEMALE person reads in a FEMALE device voice', () => {
    expect(classifyVoiceGender(a['voice-cp'])).toBe('female');
    expect(a['voice-cp'].voiceURI).toBe('zira');
  });

  it('different people get DIFFERENT voices when the device has enough', () => {
    expect(a['voice-dp'].voiceURI).not.toBe(a['voice-cp'].voiceURI); // man != woman
    expect(a['voice-dp'].voiceURI).not.toBe(a['voice-bg'].voiceURI); // two men differ (David/Mark)
  });

  it('assigns the System voice and exposes a voiceURI resolver', () => {
    expect(a['system-default']).toBeTruthy();
    expect(standInVoiceURI(a, 'voice-dp')).toBe(a['voice-dp'].voiceURI);
    expect(standInVoiceURI(a, 'nope')).toBeUndefined();
  });

  it('is empty/safe when the device has no voices yet', () => {
    expect(buildStandInAssignments(CATALOG, [])).toEqual({});
    expect(buildStandInAssignments(CATALOG, null)).toEqual({});
  });
});

describe('buildStandInAssignments — gender correctness outranks distinctness', () => {
  it('keeps a man male even when male voices run out (reuses a male, not a female)', () => {
    // Only ONE male voice for TWO men: both must stay male (one reused), never female.
    const oneMale = [
      { name: 'Microsoft David', voiceURI: 'david', lang: 'en-US' },
      { name: 'Microsoft Zira', voiceURI: 'zira', lang: 'en-US' },
    ];
    const a = buildStandInAssignments(CATALOG, oneMale);
    expect(classifyVoiceGender(a['voice-dp'])).toBe('male');
    expect(classifyVoiceGender(a['voice-bg'])).toBe('male'); // reused David, NOT Zira
    expect(classifyVoiceGender(a['voice-cp'])).toBe('female');
  });
});

describe('voiceForLocale — the accent dropdown actually changes accent', () => {
  const accented = [
    { name: 'Daniel', voiceURI: 'uk-m', lang: 'en-GB' },
    { name: 'Google UK English Female', voiceURI: 'uk-f', lang: 'en-GB' },
    { name: 'Rishi', voiceURI: 'in-m', lang: 'en-IN' },
    { name: 'Microsoft David', voiceURI: 'us-m', lang: 'en-US' },
  ];
  it('picks a voice in the wanted locale', () => {
    expect(voiceForLocale(accented, 'en-IN').voiceURI).toBe('in-m');
    expect(voiceForLocale(accented, 'en-GB').lang).toBe('en-GB');
  });
  it('honors gender within the locale when asked', () => {
    expect(voiceForLocale(accented, 'en-GB', 'female').voiceURI).toBe('uk-f');
    expect(voiceForLocale(accented, 'en-GB', 'male').voiceURI).toBe('uk-m');
  });
  it('returns null when nothing matches', () => {
    expect(voiceForLocale([], 'en-GB')).toBe(null);
    expect(voiceForLocale(accented, 'fr-FR')).toBe(null);
  });
});
