// =============================================================================
// saved-prompts — your prompt history: dated, sortable, searchable for the
// similar ones, reusable in one tap (DR-0615)
// =============================================================================
// Darrell 2026-09-24: "We also need a historical prompts space so I can use the
// same or similar prompts later for various reasons." / "Dated and sortable etc."
//
// The rows live in `saved_prompts` (migration 0232), private to their author.
// A lesson or a PoeTech request sent from the Thinking Space or the Yahweh
// Hears You box is remembered automatically; anything else is remembered only
// when the person chooses "Save as prompt". Private notes never leave the
// device. The same words again raise the count and the date (remember_prompt),
// never a second copy.
// The sorting, search and date text are pure; the I/O takes the client as an
// argument so every path is proven in tests.
// =============================================================================

export const AUTO_REMEMBERED = Object.freeze(['lesson', 'poetech']);

export const SORTS = Object.freeze([
  { key: 'recent', label: 'Most recent' },
  { key: 'type', label: 'By type' },
  { key: 'oldest', label: 'Oldest first' },
  { key: 'used', label: 'Most used' },
  { key: 'kept', label: 'Kept first' },
  { key: 'az', label: 'A to Z' },
]);

// THE TYPE OF A PROMPT IS WHERE IT WAS SENT (DR-1141; Darrell 2026-10-20:
// "Can we sort based on type and use our standard subtab standard?"). A row
// remembered by a send carries its destination (lesson, poetech, prayer…);
// a row kept by "Save as prompt" carries none and is its own type, "saved".
export const SAVED_TYPE = 'saved';
const TYPE_LABELS = Object.freeze({ poetech: 'PoeTech', saved: 'Saved', lesson: 'Lesson', prayer: 'Prayer', pastor: 'Pastor', serve: 'Serve', work: 'Work', counseling: 'Counseling', private: 'Private' });
/** The type key of one row: its destination, else "saved". */
export function promptType(row) {
  const d = String((row && row.destination) || '').trim().toLowerCase();
  return d || SAVED_TYPE;
}
/** A type's label for a tab. */
export function promptTypeLabel(type) {
  const k = String(type || SAVED_TYPE);
  return TYPE_LABELS[k] || (k.charAt(0).toUpperCase() + k.slice(1));
}
/** The types present in a list, most rows first, each with its count. Pure. */
export function promptTypes(list) {
  const counts = new Map();
  for (const r of list || []) { const k = promptType(r); counts.set(k, (counts.get(k) || 0) + 1); }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([key, count]) => ({ key, label: promptTypeLabel(key), count }));
}

const STOP = new Set('the a an and or of to in on for with is are was be it this that i you we my your our at as by from what how why who when'.split(' '));

export function words(text) {
  return String(text || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));
}

const t = (v) => { const n = Date.parse(v || ''); return Number.isFinite(n) ? n : 0; };

export function sortPrompts(list, by = 'recent') {
  const arr = [...(list || [])];
  const recent = (a, b) => t(b.last_used_at) - t(a.last_used_at);
  switch (by) {
    case 'oldest': return arr.sort((a, b) => t(a.created_at) - t(b.created_at));
    case 'used': return arr.sort((a, b) => (b.use_count || 0) - (a.use_count || 0) || recent(a, b));
    case 'kept': return arr.sort((a, b) => (b.kept ? 1 : 0) - (a.kept ? 1 : 0) || recent(a, b));
    case 'type': return arr.sort((a, b) => promptType(a).localeCompare(promptType(b)) || recent(a, b));
    case 'az': return arr.sort((a, b) => String(a.title || a.body || '').localeCompare(String(b.title || b.body || ''), undefined, { sensitivity: 'base' }));
    default: return arr.sort(recent);
  }
}

/**
 * Search that finds the SIMILAR ones, not only the exact phrase: every prompt
 * sharing at least one meaningful word is kept, ranked by how many it shares.
 * An exact phrase match ranks first. An empty query returns the list unchanged.
 */
export function searchPrompts(list, query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return list || [];
  const qw = new Set(words(q));
  return (list || [])
    .map((p) => {
      const hay = `${p.title || ''} ${p.body || ''} ${p.destination || ''}`.toLowerCase();
      const exact = hay.includes(q) ? 100 : 0;
      const shared = words(hay).filter((w, i, all) => qw.has(w) && all.indexOf(w) === i).length;
      return { p, score: exact + shared };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.p);
}

/** "2026-09-24 15:40" in the viewer's local time; '' when unknown. */
export function dateText(iso) {
  const n = Date.parse(iso || '');
  if (!Number.isFinite(n)) return '';
  const d = new Date(n);
  const p = (x) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export async function rememberPrompt({ supabase, getInstanceId, body, destination = null, keep = false }) {
  const text = String(body || '').trim();
  if (!text) return { ok: false, reason: 'empty' };
  try {
    const { data } = await supabase.auth.getSession();
    if (!data?.session?.user?.id) return { ok: false, reason: 'signed-out' };
    const instanceId = await getInstanceId();
    const { error } = await supabase.rpc('remember_prompt', { p_instance: instanceId, p_body: text, p_destination: destination, p_keep: !!keep });
    return error ? { ok: false, reason: error.message } : { ok: true, reason: '' };
  } catch (e) {
    return { ok: false, reason: e?.message || 'unknown' };
  }
}

export async function listPrompts({ supabase, limit = 500 }) {
  try {
    const { data, error } = await supabase
      .from('saved_prompts')
      .select('id, body, title, destination, kept, use_count, last_used_at, created_at')
      .order('last_used_at', { ascending: false })
      .limit(limit);
    return error ? { ok: false, rows: [], reason: error.message } : { ok: true, rows: data || [], reason: '' };
  } catch (e) {
    return { ok: false, rows: [], reason: e?.message || 'unknown' };
  }
}

export async function setKept({ supabase, id, kept }) {
  const { error } = await supabase.from('saved_prompts').update({ kept: !!kept, updated_at: new Date().toISOString() }).eq('id', id);
  return !error;
}

export async function deletePrompt({ supabase, id }) {
  const { error } = await supabase.from('saved_prompts').delete().eq('id', id);
  return !error;
}

// Reuse: the history hands a prompt back to the box through one window event,
// so the box needs no knowledge of the history and the history none of the box.
export const USE_PROMPT_EVENT = 'poetech:use-prompt';
// THE WORDS GO ANYWHERE, ONE OR SEVERAL (DR-1141; Darrell 2026-10-20: "Do we
// have the ability to send our words anywhere after collected???! We need that
// in case it goes to the wrong location or we may want to create a lesson from
// a situation or few"). One row's words could always come back to the box and
// be sent to any destination; several could not be gathered, because the box
// only ever REPLACED what it held. `mode: 'append'` adds the words under what
// is already in the box, a blank line between, so a lesson can be made from a
// situation, or a few.
export function sendPromptToBox(body, target = typeof window !== 'undefined' ? window : null, { mode = 'replace', route = '' } = {}) {
  if (!target || typeof target.dispatchEvent !== 'function') return false;
  // `route` (DR-1142): the door already chosen for these words; the box sets
  // its chip to it and the person presses Send. Absent, the box suggests one.
  const detail = { body: String(body || ''), mode: mode === 'append' ? 'append' : 'replace' };
  if (route) detail.route = String(route);
  target.dispatchEvent(new CustomEvent(USE_PROMPT_EVENT, { detail }));
  return true;
}
/** Add these words UNDER what the box already holds (the gathering move). */
export function addToBox(body, target = typeof window !== 'undefined' ? window : null) {
  return sendPromptToBox(body, target, { mode: 'append' });
}
/** What the box holds after an event: replaced, or appended under a blank line. Pure. */
export function boxAfter(current, body, mode = 'replace') {
  const add = String(body || '').trim();
  const have = String(current || '').replace(/\s+$/, '');
  if (mode !== 'append' || !have) return add;
  return add ? `${have}\n\n${add}` : have;
}
