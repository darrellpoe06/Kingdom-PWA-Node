// =============================================================================
// record-marks — the pictures the learner record awards, by name (DR-1417)
// =============================================================================
// Darrell asked for "black lions for 100%... sword of the spirit... emojis" on
// the record. The house rule (scripts/consistency-guard.mjs) is that a
// device-font emoji is never used as a UI glyph, because it draws as an empty
// box on a phone whose system lacks it. These marks keep that rule's purpose:
// each is drawn ONLY from the app's own self-hosted artwork (public/emoji/,
// lib/emoji.js), never from the device font. If the picture cannot load, the
// mark draws nothing, and the words beside it still say everything.
//
// Named here, as code points, so a component asks for "the sword" and no
// component carries a device glyph. Every mark's file is proven to be on disk
// by __tests__/record-marks.test.js.
// =============================================================================
import { emojiAssetPath } from './emoji.js';

export const RECORD_MARKS = {
  lion: '\u{1F981}',
  sword: '\u{1F5E1}\u{FE0F}',
  crown: '\u{1F451}',
  book: '\u{1F4D6}',
  target: '\u{1F3AF}',
};

/** The self-hosted picture for a mark, or '' for a name that is not a mark. */
export function recordMarkSrc(name) {
  const ch = RECORD_MARKS[name];
  return ch ? emojiAssetPath(ch) : '';
}
