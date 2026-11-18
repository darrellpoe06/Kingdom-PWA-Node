// =============================================================================
// keep-voice-on-wifi — the man's voice kept on the phone by itself, on wifi
// =============================================================================
// Darrell, 2026-11-13, rendered for meaning (DR-0331): he wants the man's
// voice the same from the start of a reading to its end, every time. DR-1254
// left one call open (keep the Piper man's voice, about 63 MB, on first use,
// weighed against a family data plan); DR-1482 made the reader hold rather
// than switch, and offered a button. This settles it: the first reading in
// the man's voice on an UNMETERED connection keeps the voice on the phone in
// the background, with the same downloader the button uses
// (device-voice.js downloadDeviceVoice). From then on a NAS hiccup is read
// by that same man's voice on the phone: no switch, no hold.
//
// UNMETERED IS MEASURED, NEVER ASSUMED (DR-0076). Only navigator.connection
// saying wifi or ethernet, with Save-Data off, counts. Cellular, any other
// type, or no navigator.connection at all (iOS Safari, Firefox) is NOT
// unmetered: there the button stays the way (DR-1482).
// =============================================================================
import { checkDeviceVoice, downloadDeviceVoice } from './device-voice.js';

const UNMETERED = new Set(['wifi', 'ethernet']);

/** Is this connection known to be unmetered? Pure; unknown is false. */
export function connectionIsUnmetered(nav) {
  const c = nav && nav.connection;
  if (!c || typeof c !== 'object') return false;
  if (c.saveData === true) return false;
  return UNMETERED.has(String(c.type || '').toLowerCase());
}

// One keep per session at most: set the moment a download starts (or the
// voice is found already kept or unsupported), never on a metered check, so
// a reading started on cellular and the next on wifi still keeps it.
const session = { settled: false, done: null };

/** Tests only. */
export function _resetKeepVoiceOnWifi() {
  session.settled = false;
  session.done = null;
}

/**
 * Start keeping the man's voice on this phone, in the background, when the
 * reading is in the man's voice, the connection is unmetered and the voice is
 * not yet kept. Never throws, never awaited by the reading; failures are
 * written to the reader's trip through `note`.
 * @returns {Promise<{ started?: true, done?: Promise<object>, skipped?: string }>}
 */
export async function keepVoiceOnWifi({ voice, nav = globalThis.navigator, check = checkDeviceVoice, download = downloadDeviceVoice, note } = {}) {
  const say = (detail) => {
    try {
      if (note) note('keep-voice', detail);
    } catch (_) {
      /* the trip is best effort */
    }
  };
  if (voice !== 'male') return { skipped: 'not-the-man' };
  if (session.settled) return { skipped: 'once' };
  if (!connectionIsUnmetered(nav)) return { skipped: 'not-unmetered' };
  let dv;
  try {
    dv = await check({ voice: 'male' });
  } catch (_) {
    return { skipped: 'check-failed' };
  }
  if (session.settled) return { skipped: 'once' };
  session.settled = true;
  if (!dv || dv.state !== 'downloadable') return { skipped: (dv && dv.state) || 'unknown' };
  say({ started: true, type: String((nav && nav.connection && nav.connection.type) || '') });
  session.done = Promise.resolve()
    .then(() => download({ voice: 'male' }))
    .then(
      (r) => {
        if (r && r.ok) say({ kept: true, bytes: r.bytes || 0 });
        else say({ error: (r && r.error) || 'no-answer' });
        return r || { error: 'no-answer' };
      },
      (e) => {
        say({ error: (e && e.message) || 'threw' });
        return { error: 'threw' };
      }
    );
  return { started: true, done: session.done };
}
