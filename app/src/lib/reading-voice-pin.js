// =============================================================================
// reading-voice-pin — one reading, one voice, from its first word to its last
// =============================================================================
// Darrell 2026-09-25, on his Android phone (Chrome, the installed app):
// "Reading with two voices at times and the voices change on their own at
// times... female to male etc.. different female voices." (DR-0654)
//
// A reading can move between engines: the NAS audio voice, the phone's Web
// Speech, the studio. Each hand-off used to choose its voice afresh. The NAS
// voice for the System voice was a woman's, the phone's System stand-in could
// be a man's, and a hand-off made while the phone's voice list was still
// empty fell to whatever the phone's default happened to be. So the reading
// changed voice mid-lesson.
//
// A PIN is made when a reading starts and kept until it ends: the gender the
// reading speaks in and, once chosen, the one device voice it uses. A hand-off
// honours the pin; it never chooses again. Pure, so the choice is tested with
// real voice lists.
// =============================================================================
import { classifyVoiceGender } from './voice-assignment.js';

/** A fresh pin for a reading that is starting. */
export function newReadingPin(gender) {
  return { gender: gender === 'male' ? 'male' : 'female', uri: undefined, matched: false };
}

/**
 * The device voice a pinned reading uses. Keeps a voice already chosen;
 * otherwise prefers `preferredURI` when it is the pin's gender, then the first
 * English voice of the pin's gender, then `preferredURI` unmatched.
 * Returns { uri, matched } where matched says the gender is the pin's.
 */
export function deviceVoiceForPin(pin, { voices = [], preferredURI } = {}) {
  const list = (Array.isArray(voices) ? voices : []).filter((v) => v && v.voiceURI);
  if (pin && pin.uri && list.some((v) => v.voiceURI === pin.uri)) return { uri: pin.uri, matched: !!pin.matched };
  const gender = pin && pin.gender;
  const preferred = list.find((v) => v.voiceURI === preferredURI);
  if (preferred && classifyVoiceGender(preferred) === gender) return { uri: preferred.voiceURI, matched: true };
  const en = list.filter((v) => /^en/i.test(v.lang || ''));
  const same = (en.length ? en : list).find((v) => classifyVoiceGender(v) === gender);
  if (same) return { uri: same.voiceURI, matched: true };
  return { uri: preferred ? preferred.voiceURI : (list.length ? undefined : preferredURI), matched: false };
}

/** The gender of a device voice by its URI, or '' when it cannot be told. */
export function genderOfDeviceVoice(uri, voices = []) {
  const v = (Array.isArray(voices) ? voices : []).find((x) => x && x.voiceURI === uri);
  const g = v ? classifyVoiceGender(v) : 'unknown';
  return g === 'unknown' ? '' : g;
}
