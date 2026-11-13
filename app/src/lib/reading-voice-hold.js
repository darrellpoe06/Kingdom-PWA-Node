// =============================================================================
// The words a held reading says (DR-1482)
// =============================================================================
// When the NAS reading voice fails and this phone has no voice of the same
// kind, the reading waits at that sentence instead of going on in a different
// voice. This builds what it says, and, when the NAS voice can be kept on the
// phone, the button that keeps it. Split out of use-read-aloud.js so that hook
// stays inside its file budget; the decision to hold stays in the hook.

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
