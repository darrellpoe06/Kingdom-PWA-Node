// =============================================================================
// teacher — WHO teaches a lesson in the app, and how honestly to say it
// =============================================================================
// Darrell, 2026-09-15: "Can I create some sort of AI version of myself, my
// voice, my image and likeness to be the teacher of these lessons... in the
// app?" Yes — in two halves, each with its own sovereign studio (DR-0430):
//   voice     infra/voice-studio  (:8770)  his cloned voice, from his recorded sample
//   likeness  infra/avatar-studio (:8772)  a talking portrait, from his enrolled photo
// This module is the PURE resolver every surface reads: given the enrolment
// row and what is armed on this device, what can the Teacher panel honestly
// do right now — and what must it say. The rules:
//   • nothing is 'real' unless the studio is armed AND the person's own sample
//     is on this device AND they enrolled themselves (consent is a row);
//   • every label begins "AI-generated" (DR-0138 / DR-0382: a stand-in is
//     never passed off as the person);
//   • no enrolment → no Teacher panel at all (a hollow surface is a lie,
//     DR-0381).
// Pure; unit-tested; proven-to-catch (a resolver that said 'real' without the
// studio would fail the suite).
import { CONSENT } from './voice-registry.js';

export const TEACHER_PERSONA = 'darrell';
export const TEACHER_NAME = 'Darrell Poe';
export const LIKENESS_SCOPE = 'lesson-teacher';

/** The person enrolled their LIKENESS themselves (a granted voice row carrying the likeness stamp). */
export function likenessConsented(profile) {
  return !!(profile && profile.consentState === CONSENT.GRANTED && profile.meta && profile.meta.likeness_consent_at);
}

/** The honest one-line label for a Teacher state. Always begins "AI-generated". */
export function teacherLabel({ voice, likeness } = {}) {
  const v = voice === 'real' ? 'his cloned voice' : 'a stand-in device voice (the voice studio is not armed)';
  const l = likeness === 'real' ? 'a talking portrait'
    : likeness === 'still' ? 'his portrait, still (the likeness studio is not armed)'
      : 'no portrait on this device';
  return `AI-generated · ${v} · ${l}`;
}

/**
 * Resolve what the Teacher can honestly do on THIS device right now.
 * @param {object} o
 * @param {object|null} o.profile        the persona's voice_profiles row (registry shape)
 * @param {boolean} o.voiceReady         the sovereign voice studio is configured
 * @param {boolean} o.avatarReady        the sovereign likeness studio is configured
 * @param {boolean} o.hasVoiceSample     his recorded sample is on this device
 * @param {boolean} o.hasPortrait        his enrolled portrait is on this device
 */
export function resolveTeacher({ profile = null, voiceReady = false, avatarReady = false, hasVoiceSample = false, hasPortrait = false } = {}) {
  const enrolled = likenessConsented(profile);
  const voiceConsent = !!(profile && profile.consentState === CONSENT.GRANTED);
  const voice = voiceConsent && hasVoiceSample && voiceReady ? 'real' : (voiceConsent ? 'stand-in' : 'none');
  const likeness = enrolled && hasPortrait ? (avatarReady ? 'real' : 'still') : 'none';
  return {
    personKey: TEACHER_PERSONA,
    name: (profile && profile.displayName) || TEACHER_NAME,
    enrolled,
    voice,
    likeness,
    label: teacherLabel({ voice, likeness }),
  };
}

/** What the Teacher says when asked to teach a lesson: the hook, in his voice. */
export function teacherIntroText(module) {
  if (!module) return '';
  const parts = [];
  if (module.title) parts.push(`${module.title}.`);
  if (module.bigIdea) parts.push(String(module.bigIdea));
  if (module.anchor && module.anchor.theme) parts.push(String(module.anchor.theme));
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}
