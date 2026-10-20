// =============================================================================
// withdraw-my-words — a person's own words can be WITHDRAWN from the lesson
// door and SENT where they belong (DR-1142)
// =============================================================================
// Darrell 2026-10-20: "Do we have the ability to send our words anywhere after
// collected???! We need that in case it goes to the wrong location or we may
// want to create a lesson from a situation or few" — then: "just to make
// sure... it goes to the correct location... for processing".
//
// BEFORE: the words could come back to the box and go anywhere (DR-0636,
// DR-1141), but the row that went to the wrong door stayed there, and the NAS
// lesson builder would still build a lesson from it. The inbox is append-only
// from the app (0127), so no client could change that row.
//
// NOW: migration 0304's withdraw_my_inbox_row(p_id, p_undo) — the one door the
// database opens for this, and only to the row's own writer — marks the row
// and its children `withdrawn`. Nothing builds from a withdrawn row; its words
// still come back through Whisper; p_undo restores it. The MOVE is then the
// DR-1141 move with the route pre-chosen: the words land in the box, the chip
// is set, and the person's own Send carries them through that door with that
// door's own effects (a PoeTech request is also filed in Feedback, a prayer
// joins the list). Nothing is routed invisibly; the person has the last word.
//
// Pure except withdrawMyWords (takes the client) and moveMyWords (dispatches
// the box event on the window it is given).
// =============================================================================
import { sendPromptToBox } from './saved-prompts.js';
import { DESTINATIONS } from './one-voice-routing.js';

/** Tags that mean a lesson exists or is being decided: not withdrawn here (0304 refuses too). */
export const BUILT_TAGS = Object.freeze(['lesson-captured', 'lesson-building', 'lesson-published', 'awaiting-review']);

/** Whether a Your-lessons item may still be withdrawn (the same rule the database keeps). */
export function withdrawable(item) {
  const tags = Array.isArray(item && item.progressTags) ? item.progressTags : [];
  return !!item && !item.published && !BUILT_TAGS.some((t) => tags.includes(t));
}

/** The latest withdrawn@ / restored@ stamp on a row's tags: { withdrawn, at }. Pure. */
export function withdrawnMark(tags) {
  const list = Array.isArray(tags) ? tags.map(String) : [];
  const stamps = list.filter((t) => /^(withdrawn|restored)@\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(t)).sort((a, b) => (a.slice(a.indexOf('@')) < b.slice(b.indexOf('@')) ? -1 : 1));
  const last = stamps[stamps.length - 1] || '';
  return { withdrawn: list.includes('withdrawn'), at: last ? last.slice(last.indexOf('@') + 1) : '' };
}

/** Where words may be moved to: every door but the lesson door they came from. */
export const MOVE_ROUTES = Object.freeze(DESTINATIONS.filter((d) => d.key !== 'lesson').map((d) => ({ key: d.key, label: d.label })));

const MISSING_RPC = /withdraw_my_inbox_row|schema cache|42883/i;

/**
 * Withdraw (or restore) one of the signed-in person's own inbox rows.
 * @returns {Promise<{ok:boolean, withdrawn:boolean, changed:boolean, reason:string}>}
 *   reason is '' on success; 'not-available-yet' when the database has not taken
 *   0304; 'not-yours' when the database refused (42501); else its words.
 */
export async function withdrawMyWords({ supabase, id, undo = false } = {}) {
  if (!supabase || typeof supabase.rpc !== 'function' || !id) return { ok: false, withdrawn: false, changed: false, reason: 'no-client' };
  try {
    const { data, error } = await supabase.rpc('withdraw_my_inbox_row', { p_id: id, p_undo: !!undo });
    if (error) {
      const msg = String(error.message || error.code || 'error');
      if (error.code === '42501' || /only the person who wrote it/i.test(msg)) return { ok: false, withdrawn: false, changed: false, reason: 'not-yours' };
      if (MISSING_RPC.test(msg) && !/sign in|no such row|belongs to another|already built/i.test(msg)) return { ok: false, withdrawn: false, changed: false, reason: 'not-available-yet' };
      return { ok: false, withdrawn: false, changed: false, reason: msg.replace(/^withdraw_my_inbox_row:\s*/, '') };
    }
    const d = data && typeof data === 'object' ? data : {};
    return { ok: true, withdrawn: !!d.withdrawn, changed: d.changed !== false, reason: '' };
  } catch (e) {
    return { ok: false, withdrawn: false, changed: false, reason: String((e && e.message) || e) };
  }
}

/**
 * Put these words in the box with a door already chosen. The person presses Send.
 * Returns false when there are no words or no window to tell.
 */
export function moveMyWords({ words, route, target = typeof window !== 'undefined' ? window : null } = {}) {
  const body = String(words || '').trim();
  if (!body || !MOVE_ROUTES.some((r) => r.key === route)) return false;
  return sendPromptToBox(body, target, { mode: 'replace', route });
}
