// Four things the Voice studio said that were not so.
//
// Darrell, 2026-09-22, across four messages and five screenshots, on a build
// where he was enrolled, the studio answered, and a sample was saved:
//
//   "Where does my voice go after?!!! I would like to have access to it stay
//    right there after the recording!!!!!! Why not?!!!! Also where does it live
//    on the device anywhy... also does it work?!!!"
//   "Nothing changed the actual voice from the same female no matter what I
//    pick!!!!!"
//   "No choice for male or female like the verbiage on the app explains... not
//    accurate?!!!!!!!!"
//
// 1. THE RECORDING WAS TAKEN AWAY THE MOMENT IT WAS SAVED. `saveRecording`
//    called `recorder.reset()`, which dropped the only playable handle on the
//    audio, leaving the sentence "A voice sample is saved on this device" and no
//    way to hear it. The bytes were in IndexedDB the whole time; the surface
//    simply would not hand them back.
//
// 2. NOBODY SAID WHERE IT LIVED. "It stays on this device" is not an answer to
//    "where does it live on the device."
//
// 3. THE GENDER COPY ASSERTED THE WRONG REASON. It said "this browser only
//    exposes female voices to web pages." On his Android that is not what is
//    happening: the list is not female-only, it is GENDERLESS — every entry is
//    named by locale ("English Nigeria (en_NG)", "Assamese India (as_IN)"), so
//    `classifyVoiceGender` returns 'unknown' for all of them and no male/female
//    match is possible from that list at all. Asserting a wrong reason is its own
//    defect: it sent him hunting for a female-vs-male toggle that could not exist.
//
// 4. "CLONED VOICE LIVE" WAS NOT EARNED. The card read "Enrolled · consent
//    granted · cloned voice live" and "IN USE" while a device voice was what he
//    actually heard. `prov.real` only knows the studio is configured and
//    answering — it does not know whether THIS device holds the sample the clone
//    is conditioned on. Without it the read falls back and the card still says
//    live. Same class as a feedback log counting rows it never fetched.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describeDeviceVoices } from '../lib/voice-assignment.js';

const STUDIO = readFileSync(resolve(__dirname, '../components/VoiceStudio.jsx'), 'utf8');

// His actual Android list, as the screenshots show it.
const ANDROID_LOCALE_LIST = [
  { name: 'English Australia (en_AU)', voiceURI: 'a', lang: 'en-AU' },
  { name: 'English United Kingdom (en_GB)', voiceURI: 'b', lang: 'en-GB' },
  { name: 'English India (en_IN)', voiceURI: 'c', lang: 'en-IN' },
  { name: 'English Nigeria (en_NG)', voiceURI: 'd', lang: 'en-NG' },
  { name: 'English United States (en_US)', voiceURI: 'e', lang: 'en-US' },
];

describe('the census counts what the device gave, instead of asserting what it did not', () => {
  it('REPRODUCES HIS DEVICE: a locale-named list is genderless, not female-only', () => {
    const c = describeDeviceVoices(ANDROID_LOCALE_LIST);
    expect(c.total).toBe(5);
    expect(c.male).toBe(0);
    expect(c.female).toBe(0);
    expect(c.unknown).toBe(5);
    expect(c.anyGendered).toBe(false);
    // This is the fact the old copy got wrong: the entries are LANGUAGES.
    expect(c.namedByLocale).toBe(true);
  });

  it('a desktop list that DOES name its voices is counted properly', () => {
    const c = describeDeviceVoices([
      { name: 'Google UK English Male', voiceURI: 'm', lang: 'en-GB' },
      { name: 'Samantha', voiceURI: 'f', lang: 'en-US' },
    ]);
    expect(c.male).toBe(1);
    expect(c.female).toBe(1);
    expect(c.anyGendered).toBe(true);
    expect(c.namedByLocale).toBe(false);
  });

  it('an empty list is an answer, not a crash', () => {
    const c = describeDeviceVoices([]);
    expect(c.total).toBe(0);
    expect(c.anyGendered).toBe(false);
    expect(describeDeviceVoices(undefined).total).toBe(0);
  });

  it('a single locale-named voice still reads as locale-named', () => {
    expect(describeDeviceVoices([{ name: 'English Nigeria (en_NG)', voiceURI: 'x' }]).namedByLocale).toBe(true);
  });
});

describe('the surface reports the census instead of the old assertion', () => {
  it('the false "only exposes female voices" claim is gone', () => {
    expect(STUDIO).not.toMatch(/This browser only exposes female voices to web pages/);
  });

  it('it renders the counted numbers', () => {
    expect(STUDIO).toMatch(/data-testid="device-voice-census"/);
    expect(STUDIO).toMatch(/voiceCensus\.total/);
    expect(STUDIO).toMatch(/voiceCensus\.male/);
    expect(STUDIO).toMatch(/voiceCensus\.female/);
  });

  it('it names the real reason when the list is locale-named', () => {
    expect(STUDIO).toMatch(/names every one of them by LANGUAGE rather than by voice/);
    expect(STUDIO).toMatch(/which is why changing the selection does not change how it sounds/);
  });

  it('the Android route is now DEDUCED per device with a door, not one sentence (DR-0576)', () => {
    expect(STUDIO).toMatch(/data-testid="device-voice-settings-door"/);
    expect(STUDIO).toMatch(/voiceRoute\.steps\.map/);
  });

  it('the note is no longer hardcoded to male — a female persona gets the same honesty', () => {
    // The old condition was `v.gender === 'male'`, so Christina would never have
    // been told anything at all on a device that could not match her either.
    expect(STUDIO).toMatch(/!hasVoiceOfGender\(tts\.voices, v\.gender\)/);
    expect(STUDIO).not.toMatch(/v\.gender === 'male' && !hasVoiceOfGender/);
  });
});

describe('the recording stays, and it plays', () => {
  it('a player is rendered for the saved sample', () => {
    expect(STUDIO).toMatch(/data-testid="saved-sample-audio"/);
    // Matched loosely: the element is multi-line because it carries the note
    // about why it has NO width cap, and a pin on its formatting would break
    // the next time anyone touched the attribute order.
    expect(STUDIO).toMatch(/src=\{savedUrl\}/);
    expect(STUDIO).toMatch(/data-testid="saved-sample-audio"/);
  });

  it('what plays is read BACK OUT of the store, not the recorder leftover', () => {
    // So the thing on the page is provably the thing that persisted.
    const block = STUDIO.slice(STUDIO.indexOf('const ok = await saveReference'), STUDIO.indexOf('const ok = await saveReference') + 700);
    expect(block).toMatch(/const saved = await loadReference\(enrolKey\)/);
    expect(block).toMatch(/URL\.createObjectURL\(saved\)/);
  });

  it('the object URL is revoked when it is replaced or removed, so nothing leaks', () => {
    const revokes = STUDIO.match(/URL\.revokeObjectURL\(prev\)/g) || [];
    expect(revokes.length).toBeGreaterThanOrEqual(3);
  });

  it('removing the sample takes the player away with it', () => {
    const block = STUDIO.slice(STUDIO.indexOf('await clearReference(enrolKey)'), STUDIO.indexOf('await clearReference(enrolKey)') + 300);
    expect(block).toMatch(/setSavedUrl/);
  });
});

describe('it says where the voice actually lives', () => {
  it('names the store, the database and the key', () => {
    expect(STUDIO).toMatch(/IndexedDB, database/);
    expect(STUDIO).toMatch(/poe-voice/);
    expect(STUDIO).toMatch(/references/);
    expect(STUDIO).toMatch(/ref:\{enrolKey\}/);
  });

  it('and says the two things that follow from that, plainly', () => {
    expect(STUDIO).toMatch(/does not follow you to another device/);
    // The exact location folds under "Exactly where" (DR-0576) — still on the
    // page, one tap down, and still says what deletes it.
    expect(STUDIO).toMatch(/Clearing this browser’s site data deletes it/);
  });
});

describe('"cloned voice live" has to be earned', () => {
  it('for YOUR OWN voice it requires a sample on THIS device', () => {
    const block = STUDIO.slice(STUDIO.indexOf('cloned voice live'), STUDIO.indexOf('cloned voice live') + 60);
    expect(block).toBeTruthy();
    expect(STUDIO).toMatch(/isMine\s*\n?\s*\?\s*\(myRefExists/);
  });

  it('and when the sample is missing it says exactly that, instead of claiming live', () => {
    expect(STUDIO).toMatch(/THIS device holds no sample of your voice/);
    expect(STUDIO).toMatch(/it will read in a stand-in until you record here/);
  });

  it('the studio being up is still necessary — this narrows the claim, never widens it', () => {
    expect(STUDIO).toMatch(/\{prov\.real && v\.kind === KIND\.PERSONAL/);
  });
});
