// =============================================================================
// The words a held reading says (DR-1482)
// =============================================================================
// When the NAS reading voice fails and this phone has no voice of the same
// kind, the reading waits at that sentence instead of going on in a different
// voice. This builds what it says, and, when the NAS voice can be kept on the
// phone, the button that keeps it. Split out of use-read-aloud.js so that hook
// stays inside its file budget; the decision to hold stays in the hook.
import { toSpokenForm } from './speech-text.js';
import { deviceVoiceForPin } from './reading-voice-pin.js';

/**
 * @param {object} o
 * @param {boolean} o.man                  the reading's voice is a man's
 * @param {() => Promise<boolean>} o.ready whether the on-device voice is already kept
 * @param {(o: object) => Promise<{state?: string}>} o.check  the on-device voice state
 * @returns {Promise<{ text: string, keepIt: null | { href: string, label: string } }>}
 */
export async function heldForVoiceNotice({ man, ready, check }) {
  const who = man ? 'man’s' : 'woman’s';
  let keepIt = null;
  try {
    // The reading's own voice is asked about, not the man's by default (DR-1494).
    if (!(await ready(man ? 'male' : 'female'))) {
      const dv = await check({ voice: man ? 'male' : 'female' });
      if (dv && dv.state === 'downloadable' && typeof window !== 'undefined' && window.location) {
        keepIt = { href: `${window.location.pathname}?view=voice`, label: `Keep the ${who} voice on this phone` };
      }
    }
  } catch (_) {
    keepIt = null;
  }
  const text = `The church’s ${who} reading voice did not answer, and this phone has no ${who} voice of its own, so the reading waits here instead of going on in a different voice. Press play to try the ${who} voice again; if it still cannot answer, the rest reads in this phone’s own voice.`;
  return { text, keepIt };
}

// =============================================================================
// One sentence in the phone's voice, then back (DR-1498)
// =============================================================================
// When ONE NAS piece will not come (asked twice), the phone says that piece
// alone and the reading's own voice takes the next one (lib/clip-queue.js
// standIn). The DR-1482 rule holds: only a phone voice of the reading's own
// kind may say it. Without one, or with the screen off (Android stops the
// phone's voice in the background), this resolves false and the queue hands
// the reading on, where DR-1482 holds it and says why.

/** How often the phone is asked whether it is still speaking. */
export const STAND_IN_POLL_MS = 250;

/**
 * @param {object} o
 * @param {string} o.text      the piece as written
 * @param {object} o.pin       the reading's pin ({ gender, uri?, matched? })
 * @param {number} [o.rate]
 * @param {boolean} [o.hidden] the page is not on the screen
 * @param {(text: string) => void} [o.say] the reader's notice line
 * @returns {Promise<boolean>} true once the phone has said it
 */
export function speakPieceOnPhone({ text, pin, rate = 1, hidden = false, say = null, synth, Utterance, poll = STAND_IN_POLL_MS } = {}) {
  const s = synth || (typeof window !== 'undefined' ? window.speechSynthesis : null);
  const U = Utterance || (typeof window !== 'undefined' ? window.SpeechSynthesisUtterance : null);
  const words = toSpokenForm(String(text || '')).trim();
  if (hidden || !s || !U || !pin || !words) return Promise.resolve(false);
  let voices = [];
  try { voices = s.getVoices() || []; } catch (_) { voices = []; }
  const pick = deviceVoiceForPin(pin, { voices });
  if (!pick.matched || !pick.uri) return Promise.resolve(false);
  pin.uri = pick.uri; pin.matched = true;
  // Said in one line, as every change of voice is (DR-1254).
  const who = pin.gender === 'male' ? 'a man’s' : 'a woman’s';
  if (typeof say === 'function') say(`One sentence the church’s reading voice could not give is read in this phone’s own voice, ${who} voice like it; then the church’s voice reads on.`);
  return new Promise((resolve) => {
    let done = false;
    let heard = false;
    let timer = null;
    const end = (ok) => { if (done) return; done = true; if (timer) clearInterval(timer); resolve(ok); };
    let u;
    try {
      u = new U(words);
      u.voice = voices.find((v) => v.voiceURI === pick.uri) || null;
      u.rate = Number(rate) > 0 ? Number(rate) : 1;
      u.onstart = () => { heard = true; };
      u.onend = () => end(true);
      u.onerror = () => end(heard);
      s.speak(u);
    } catch (_) { end(false); return; }
    // A phone that never says it ended (Chrome can drop onend) is asked.
    let quiet = 0;
    timer = setInterval(() => {
      let speaking;
      try { speaking = !!(s.speaking || s.pending); } catch (_) { speaking = false; }
      if (speaking) { heard = true; quiet = 0; return; }
      quiet += 1;
      if (heard && quiet >= 2) end(true);
      else if (!heard && quiet * poll >= 5000) end(false);
    }, poll);
  });
}
