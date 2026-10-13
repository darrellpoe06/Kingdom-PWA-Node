// =============================================================================
// openers-sync — read the household's registered openers from the real table
// =============================================================================
// The header's opener button draws from `household_openers` (migration 0254)
// and nothing else: no hardcoded list, no demo row (DR-0061). RLS is the real
// gate (DR-0060) — the policy only returns rows to the family, so a church or
// premium account asking this question gets an empty list and therefore no
// button, with no client-side check standing in for a server one.
//
// A fetch that FAILS returns null, never []. The difference matters: [] means
// "this house has no openers registered", which is honest and hides the button;
// null means "we could not ask", which must not be reported as nothing-exists.
import { supabase } from './supabase.js';

async function currentSession() {
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

/** The columns the header needs. Never the device address, pin, topic or URL —
 *  those live on the NAS only, so a browser cannot leak them. */
export const OPENER_COLUMNS = 'id, name, place, kind, enabled, reports';

/** Read the rows once. Returns an array, or null when the question failed. */
export async function fetchOpeners() {
  const { data, error } = await supabase.from('household_openers').select(OPENER_COLUMNS).order('name');
  if (error) { console.warn('[openers] fetch failed:', error); return null; }
  return data || [];
}

/**
 * Keep the header in step with the table. Calls `onChange(rows|null)` with the
 * first read and again on any change. Returns an unsubscribe.
 */
export function subscribeOpeners(onChange) {
  let channel = null;
  let cancelled = false;
  (async () => {
    const session = await currentSession();
    if (!session || cancelled) { if (!cancelled) onChange([]); return; }
    const first = await fetchOpeners();
    if (!cancelled) onChange(first);
    channel = supabase
      .channel('household_openers-stream')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'household_openers' }, () => {
        fetchOpeners().then((rows) => { if (!cancelled) onChange(rows); });
      })
      .subscribe();
  })();
  return function unsubscribe() {
    cancelled = true;
    if (channel) supabase.removeChannel(channel);
  };
}

/**
 * Keep the press. The result stored is the one `readPressResult` read, so an
 * unanswered press is kept as 'unknown' rather than as opened (DR-0076). RLS
 * requires `pressed_by` to be the caller (migration 0254), and the ledger has
 * no update or delete policy, so what lands here stays.
 *
 * Never throws and never blocks the press: a door that opened must not look
 * like a failure because the record could not be written.
 */
export async function recordPress(opener, read) {
  if (!opener || !opener.id || !read) return false;
  try {
    const { data } = await supabase.auth.getUser();
    const uid = data && data.user ? data.user.id : null;
    if (!uid) return false;
    const { error } = await supabase.from('opener_presses').insert({
      opener_id: opener.id,
      pressed_by: uid,
      result: read.state,
      reason: read.state === 'failed' ? String(read.text || '').slice(0, 500) : '',
    });
    if (error) { console.warn('[openers] press not recorded:', error); return false; }
    return true;
  } catch (e) {
    console.warn('[openers] press not recorded:', e);
    return false;
  }
}
