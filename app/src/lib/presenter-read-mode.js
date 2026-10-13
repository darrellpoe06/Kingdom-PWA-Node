// =============================================================================
// presenter-read-mode — WHAT the read-aloud reads, and the law that outranks it
// =============================================================================
// Darrell 2026-09-13, after a label-only fix landed: "Give the options for both
// one or the other... maybe a toggle that has all options?" — and separately,
// on the notes panel: "long scroll or per section depending on the choice the
// user makes."
//
// THE HISTORY THIS MODULE EXISTS TO SETTLE. He asked on 2026-08-10 to be able
// to listen to the full message from the console. A first attempt simply fed
// the presenter's private notes to the voice whenever no audience surface
// looked alive, and `presenter-read-aloud.test.jsx` rejected it — correctly,
// because the no-leak law is "what is read aloud IS what is projected," and a
// clever inline condition is exactly the kind of thing that is right the day it
// is written and wrong the day someone adds a fourth way to present.
//
// So the want and the law are BOTH kept, and the law is made structural rather
// than clever:
//
//   * The speaker CHOOSES what the reading is — the room's slide, his own
//     script, or both. That is his console and his ear.
//   * The choice is a PREFERENCE. `audienceLive()` is a FACT. When any audience
//     surface is alive — presenting on this screen, a projector window open, a
//     congregation broadcast running — the fact wins and the reading collapses
//     to the room's slide, whatever the speaker picked. He does not have to
//     remember to switch back before he casts, because forgetting is the
//     failure mode a room would hear.
//   * That collapse happens HERE, in `effectiveReadMode`, on every render —
//     not once when the mode is chosen. Going live mid-reading re-registers the
//     target through this function, so the script drops out at the moment the
//     screen goes up rather than at the end of the part.
//
// Pure and deterministic: no DOM, no storage, no React. The component supplies
// the facts; this decides.

/** What the speaker can ask the reader to read. `room` is the safe default. */
export const READ_MODES = [
  { id: 'room', label: 'What the room sees', hint: 'The slide only — the same words on the screen.' },
  { id: 'script', label: 'My script', hint: 'Your presenter notes only — the lesson in full.' },
  { id: 'both', label: 'Room + my script', hint: 'The slide, then your notes for this part.' },
];

export const DEFAULT_READ_MODE = 'room';

/** How the notes panel is laid out. `scroll` is what shipped before. */
export const NOTE_LAYOUTS = [
  { id: 'scroll', label: 'Long scroll', hint: 'Every note open, top to bottom.' },
  { id: 'sections', label: 'One section at a time', hint: 'Collapsed; open the one you are teaching.' },
];

export const DEFAULT_NOTE_LAYOUT = 'scroll';

export const isReadMode = (id) => READ_MODES.some((m) => m.id === id);
export const isNoteLayout = (id) => NOTE_LAYOUTS.some((l) => l.id === id);

/**
 * Is any audience surface alive right now?
 *
 * Deliberately INCLUSIVE, and deliberately treating the unknown as live: a
 * surface state this function does not recognise counts as live, so adding a
 * fourth way to present fails CLOSED (room-only) instead of silently opening
 * the speaker's script to a room. The only state that counts as not-live is the
 * one we positively know is closed.
 */
export function audienceLive({ onScreen, audienceState, followCode } = {}) {
  if (onScreen) return true;                       // this device IS the room's screen
  if (followCode) return true;                     // congregation devices are following
  return audienceState !== 'closed';               // anything but a known-closed projector
}

/**
 * The mode actually in force: the speaker's choice, unless a room can hear it.
 * An unknown/absent choice falls back to the safe default rather than throwing.
 */
export function effectiveReadMode(chosen, live) {
  const want = isReadMode(chosen) ? chosen : DEFAULT_READ_MODE;
  return live ? DEFAULT_READ_MODE : want;
}

/** True when the speaker picked a script mode that the live room is overriding. */
export function scriptSuppressed(chosen, live) {
  return Boolean(live) && isReadMode(chosen) && chosen !== DEFAULT_READ_MODE;
}

/**
 * Flatten presenter notes into speakable prose. Headings are spoken because a
 * speaker listening hands-free needs to know which point he is in; a note with
 * no body and no items contributes nothing rather than an empty sentence.
 */
export function notesToSpeech(notes) {
  if (!Array.isArray(notes)) return '';
  return notes.map((n) => {
    if (!n || typeof n !== 'object') return '';
    const items = Array.isArray(n.items) ? n.items.filter((s) => typeof s === 'string' && s.trim()) : [];
    const body = typeof n.body === 'string' ? n.body.trim() : '';
    if (!body && !items.length) return '';
    const heading = typeof n.heading === 'string' ? n.heading.trim() : '';
    return [heading, body, ...items].filter(Boolean).join('. ');
  }).filter(Boolean).join(' ');
}

/**
 * The text to register as the reading, for a mode already passed through
 * effectiveReadMode(). Falls back to the slide whenever the script half is
 * empty, so choosing "my script" on a part with no notes still reads something
 * rather than registering nothing and leaving a dead play button.
 */
export function readingTextFor(mode, slideText, scriptText) {
  const slide = typeof slideText === 'string' ? slideText.trim() : '';
  const script = typeof scriptText === 'string' ? scriptText.trim() : '';
  if (mode === 'script') return script || slide;
  if (mode === 'both') return [slide, script].filter(Boolean).join(' ');
  return slide;
}

/**
 * The label the play button carries, built from the part so it says what it
 * will read (DR-0381: a constant placeholder label is a hollow surface).
 */
export function readingLabel(partLabel, mode) {
  const part = String(partLabel || '').trim() || 'this part';
  if (mode === 'script') return `${part} — your script`;
  if (mode === 'both') return `${part} — the room, then your script`;
  return `${part} — what the room sees`;
}
