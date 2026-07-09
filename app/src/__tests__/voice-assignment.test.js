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
  resolveVoiceURIForId, deviceVoiceOptions, hasVoiceOfGender, PHONE_DEFAULT_VOICE,
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

describe('classifyVoiceGender — voiceURI gender hints (Android/ChromeOS variants)', () => {
  it('reads a gender hint from the voiceURI when the name has none', () => {
    expect(classifyVoiceGender({ name: 'English United States', voiceURI: 'en-us-x-iom-male-local' })).toBe('male');
    expect(classifyVoiceGender({ name: 'English United States', voiceURI: 'en-us-x-tpf-female-local' })).toBe('female');
    expect(classifyVoiceGender({ name: 'Voice 3', voiceURI: 'com.acme.tts#male_2' })).toBe('male');
  });
  it('does not false-positive a plain locale URI', () => {
    expect(classifyVoiceGender({ name: 'Google US English', voiceURI: 'en-US-Standard' })).toBe('unknown');
  });
});

describe('resolveVoiceURIForId — a user PIN wins, applied on every read', () => {
  const WIN = [
    { name: 'Microsoft David', voiceURI: 'david', lang: 'en-US' },
    { name: 'Microsoft Mark', voiceURI: 'mark', lang: 'en-US' },
    { name: 'Microsoft Zira', voiceURI: 'zira', lang: 'en-US' },
  ];
  const a = buildStandInAssignments(CATALOG, WIN);

  it('honors a pin when that voice exists on the device', () => {
    const overrides = { 'voice-dp': 'mark' };
    expect(resolveVoiceURIForId('voice-dp', { assignments: a, overrides, available: WIN })).toBe('mark');
  });
  it('IGNORES a pin whose voice is not on this device (no mis-apply across devices)', () => {
    const overrides = { 'voice-dp': 'some-other-phone-voice' };
    // falls back to the auto MALE assignment, never the stale pin
    const got = resolveVoiceURIForId('voice-dp', { assignments: a, overrides, available: WIN });
    expect(got).not.toBe('some-other-phone-voice');
    expect(['david', 'mark']).toContain(got); // a male voice
  });
  it('falls back to auto when there is no pin', () => {
    expect(resolveVoiceURIForId('voice-cp', { assignments: a, overrides: {}, available: WIN })).toBe('zira');
  });
});

describe('Phone-default voice (the Android male path)', () => {
  const FEMALE_ONLY = [
    { name: 'Google US English', voiceURI: 'en-us-x-iol-local', lang: 'en-US' }, // female-ish, unknown by name
    { name: 'English United Kingdom', voiceURI: 'en-gb-x-rjs-local', lang: 'en-GB' },
  ];
  it('offers "Phone’s default voice" FIRST so a female-only browser can still go male via OS settings', () => {
    const opts = deviceVoiceOptions(FEMALE_ONLY);
    expect(opts[0].uri).toBe(PHONE_DEFAULT_VOICE);
    expect(opts[0].name).toMatch(/default/i);
    expect(opts.length).toBe(3); // phone-default + the 2 device voices
  });
  it('honors a phone-default PIN directly (no getVoices entry needed) — flows to "use OS default"', () => {
    const overrides = { 'voice-dp': PHONE_DEFAULT_VOICE };
    const got = resolveVoiceURIForId('voice-dp', { assignments: {}, overrides, available: FEMALE_ONLY });
    expect(got).toBe(PHONE_DEFAULT_VOICE);
  });
  it('AUTO-routes a MALE person to the OS default when the device has NO male voice (Darrell 2026-07-04: "the male voices never worked")', () => {
    // Android Chrome exposes only gender-ambiguous Google voices → no male voice.
    const assignments = buildStandInAssignments(CATALOG, FEMALE_ONLY);
    // The men (Darrell, Bishop Gwin) must NOT get a female-sounding web voice — they
    // read in the OS default, which the user can set to male in Android TTS settings.
    expect(standInVoiceURI(assignments, 'voice-dp')).toBe(PHONE_DEFAULT_VOICE);
    expect(standInVoiceURI(assignments, 'voice-bg')).toBe(PHONE_DEFAULT_VOICE);
    // …and the real play-path resolver agrees (no pin set → the auto mapping).
    expect(resolveVoiceURIForId('voice-dp', { assignments, overrides: {}, available: FEMALE_ONLY })).toBe(PHONE_DEFAULT_VOICE);
    // A woman can still use a neutral (female-sounding) web voice — she is NOT forced
    // to the OS default, so she never inherits a male OS voice.
    expect(standInVoiceURI(assignments, 'voice-cp')).not.toBe(PHONE_DEFAULT_VOICE);
    // When a real male voice DOES exist, the man gets it (no regression).
    const withMale = buildStandInAssignments(CATALOG, [...FEMALE_ONLY, { name: 'Daniel', voiceURI: 'dan', lang: 'en-GB' }]);
    expect(standInVoiceURI(withMale, 'voice-dp')).toBe('dan');
  });
});

describe('deviceVoiceOptions + hasVoiceOfGender — the picker + honest male-availability', () => {
  const WIN = [
    { name: 'Microsoft David', voiceURI: 'david', lang: 'en-US' },
    { name: 'Microsoft Zira', voiceURI: 'zira', lang: 'en-US' },
  ];
  it('lists device voices tagged with gender for the dropdown (after the phone-default option)', () => {
    const opts = deviceVoiceOptions(WIN);
    expect(opts.map((o) => o.uri)).toEqual([PHONE_DEFAULT_VOICE, 'david', 'zira']);
    expect(opts.find((o) => o.uri === 'david').gender).toBe('male');
    expect(opts.find((o) => o.uri === 'zira').gender).toBe('female');
  });
  it('reports whether a male/female voice exists (drives the honest caveat)', () => {
    expect(hasVoiceOfGender(WIN, 'male')).toBe(true);
    expect(hasVoiceOfGender([{ name: 'Samantha', voiceURI: 's', lang: 'en-US' }], 'male')).toBe(false);
    expect(hasVoiceOfGender([], 'male')).toBe(false);
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
