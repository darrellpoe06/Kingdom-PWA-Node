// =============================================================================
// my-voice — "My voice (Darrell)": is it ready, and if not, why (DR-0721)
// =============================================================================
// Darrell 2026-10-01: "Also my recorded voice still will not work as my reader
// voice… why?" — then: "My voice is recorded and stored in that same section
// it recorded it... it just doesn't use it after choosing it", and "When I push
// play on the recorded voice I gave it, it sounds like me... just won't read
// like me."
//
// THE TRACE. Picking his voice saved `person:darrell` (reading-voice.js) and
// the reader DID try it: use-read-aloud sent his sample to /voice/speak as the
// reference for a few-shot clone. The only engine that can turn a recording
// into NEW speech is the XTTS studio on the 4070 tower, and that studio has
// never answered: every arm run since 2026-09-23 stopped at the tower's door.
// The read then fell to the NAS stand-in voice and said so only as a few words
// after "Reading…" in a panel that folds itself away while it reads. He heard
// another voice and was told nothing he could see.
//
// This module is the pure half of the fix: which voice is "mine", what to
// call it, and one plain sentence for every state it can be in. No network,
// no DOM, so the wording is decided in a test.
import { isStudioRoadProblem, isVoiceAuthRefusal, voiceErrorReason } from './voice-service.js';

export const MY_VOICE = Object.freeze({
  READY: 'ready',                   // studio answering, sample on this device
  CHECKING: 'checking',             // the studio has not been asked yet
  STUDIO_OFFLINE: 'studio-offline', // the studio that clones did not answer
  SAMPLE_MISSING: 'sample-missing', // no recording on THIS device
  KEY_REFUSED: 'key-refused',       // the studio door refused this device's key
  FAILED: 'failed',                 // the studio answered with something else
});

/** "Darrell Poe" -> "Darrell". Pure. */
export function firstNameOf(name) {
  const n = String(name || '').trim();
  if (!n) return '';
  return n.split(/\s+/)[0];
}

/** The name the reader shows for the listener's own recorded voice. Pure. */
export function myVoiceLabel(name) {
  const first = firstNameOf(name);
  return first ? `My voice (${first})` : 'My voice';
}

/**
 * Where my voice stands right now. `miss` is the tagged error of the last
 * attempt in this voice ('' when the last one played). Pure.
 */
export function myVoiceStatus({ hasSample = false, studio = 'unknown', miss = '' } = {}) {
  if (!hasSample) return MY_VOICE.SAMPLE_MISSING;
  const m = String(miss || '');
  if (m) {
    if (m === 'no-voice-sample') return MY_VOICE.SAMPLE_MISSING;
    if (isVoiceAuthRefusal(m)) return MY_VOICE.KEY_REFUSED;
    if (isStudioRoadProblem(m)) return MY_VOICE.STUDIO_OFFLINE;
    return MY_VOICE.FAILED;
  }
  if (studio === 'down') return MY_VOICE.STUDIO_OFFLINE;
  if (studio === 'up') return MY_VOICE.READY;
  return MY_VOICE.CHECKING;
}

/** True when the reader can expect to speak in my voice. Pure. */
export function myVoiceUsable(status) {
  return status === MY_VOICE.READY || status === MY_VOICE.CHECKING;
}

/**
 * One plain sentence: which voice will read, and why. Said before play and
 * after a miss, never only as a status word. Pure.
 */
export function myVoiceLine({ name = '', status = MY_VOICE.CHECKING, miss = '' } = {}) {
  const who = myVoiceLabel(name);
  switch (status) {
    case MY_VOICE.READY:
      return `${who} is ready: lessons read in your recorded voice, made on the church’s own voice studio.`;
    case MY_VOICE.CHECKING:
      return `${who}: asking the church’s voice studio whether it is answering. If it is not, you will be told, and the stand-in voice reads.`;
    case MY_VOICE.STUDIO_OFFLINE:
      return `${who} is not reading yet: the voice studio that turns your recording into new speech (the 4070 tower) is not answering. Your recording is safe. Until the studio answers, the church’s stand-in voice reads instead.`;
    case MY_VOICE.SAMPLE_MISSING:
      return `${who} is not reading yet: your recording is not on this device. Record or import it in the Voice tab on this device, then it reads in your voice.`;
    case MY_VOICE.KEY_REFUSED:
      return `${who} is not reading yet: the voice studio refused this device’s family key. Sign out and in again on this device to fetch a fresh one. The stand-in voice reads meanwhile.`;
    default:
      // The studio's own tagged reason, never thrown away (2026-09-22).
      return `${who} did not read: ${voiceErrorReason(miss)} The stand-in voice reads meanwhile.`;
  }
}

/**
 * The words the status line carries beside "Reading…" when a stand-in is
 * speaking in place of my voice. Never empty while that is true. Pure.
 */
export function standInWords(standInWhy, { mine = false } = {}) {
  if (!standInWhy) return '';
  if (mine) return ' · not your voice: the voice studio is not answering, a stand-in reads';
  return standInWhy === 'studio-offline'
    ? ' · stand-in voice, the studio is offline'
    : ' · stand-in voice until the studio is armed';
}
