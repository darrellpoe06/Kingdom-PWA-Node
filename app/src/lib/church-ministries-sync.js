// =============================================================================
// church-ministries-sync — the office's own door to its own list
// =============================================================================
// Darrell 2026-09-20: "expandable by staff and no need for technical work."
//
// church_ministries (0223) is the living list; lib/church-ministries.js holds
// the seed it sits on. This is the read/write door, modeled on
// church-devices-sync.js so the office meets ONE way of editing staff data.
//
// ONE DIFFERENCE FROM EVERY SIBLING, AND IT IS DELIBERATE: the READ needs no
// session. The flyer carrying this QR code is handed to strangers in the
// street, so a visitor who has never signed in must still see what they are
// being invited into. Only the WRITE asks who you are.
import supabase from './supabase.js';
import { churchInstanceId } from './church-instance.js';
import { mergeMinistries, ministryToRow, CHURCH_MINISTRIES } from './church-ministries.js';

/** Who may edit. Reading is everyone's; only the office writes. */
export async function getMinistryAccess(displayName) {
  try {
    const { data: { session } = {} } = await supabase.auth.getSession();
    if (!session) return { signedIn: false, canEdit: false, tenantId: null, role: null };
    const tenantId = await churchInstanceId(displayName);
    if (!tenantId) return { signedIn: true, canEdit: false, tenantId: null, role: null };
    const { data: role } = await supabase.rpc('user_role_in_instance', { tenant_uuid: tenantId });
    return { signedIn: true, canEdit: role === 'owner' || role === 'admin', tenantId, role: role ?? null };
  } catch (_) {
    // A failed access check means NO EDIT, never a guess in the permissive
    // direction. RLS is the real gate regardless; this only shapes the UI.
    return { signedIn: false, canEdit: false, tenantId: null, role: null };
  }
}

/**
 * The list to render. ALWAYS returns a usable list: the seed is the floor, and
 * any failure at all — offline, no table yet, RLS refusal — falls back to it
 * rather than showing a church with no ministries. An empty volunteer list on
 * the morning a flyer goes out is worse than a slightly stale one.
 */
export async function loadMinistries(displayName) {
  try {
    const tenantId = await churchInstanceId(displayName);
    if (!tenantId) return { list: CHURCH_MINISTRIES, fromOffice: false };
    const { data, error } = await supabase
      .from('church_ministries')
      .select('slug,name,blurb,join_note,view,sub,feedback_key,sort_order,is_active')
      .eq('instance_id', tenantId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (error || !Array.isArray(data)) return { list: CHURCH_MINISTRIES, fromOffice: false };
    return { list: mergeMinistries(data), fromOffice: data.length > 0 };
  } catch (_) {
    return { list: CHURCH_MINISTRIES, fromOffice: false };
  }
}

/** Add or update one ministry. Upsert on (instance_id, slug) so an edit to a seeded one sticks. */
export async function saveMinistry(ministry, { tenantId, userId } = {}) {
  if (!tenantId || !ministry || !ministry.id) return { ok: false, error: 'missing-tenant-or-slug' };
  const row = ministryToRow(ministry, { tenantId, userId });
  const { error } = await supabase
    .from('church_ministries')
    .upsert(row, { onConflict: 'instance_id,slug' });
  return error ? { ok: false, error: error.message } : { ok: true };
}

/**
 * Retire a ministry. NEVER a delete: a ministry that ran for years is part of
 * the church's history, and the volunteers who served in it are attached to
 * that slug. is_active=false takes it off the list and keeps the record.
 */
export async function retireMinistry(slug, { tenantId } = {}) {
  if (!tenantId || !slug) return { ok: false, error: 'missing-tenant-or-slug' };
  const { error } = await supabase
    .from('church_ministries')
    .update({ is_active: false })
    .eq('instance_id', tenantId)
    .eq('slug', slug);
  return error ? { ok: false, error: error.message } : { ok: true };
}

/** A blank ministry the office can fill in. */
export function blankMinistry(sortOrder = 100) {
  return { id: '', name: '', blurb: '', join: '', surface: null, feedbackKey: null, sortOrder };
}

/**
 * A slug the office never has to think about: derived from the name, stable,
 * and safe in a URL. Returns '' for a name with nothing usable in it, so a
 * caller can refuse the save rather than writing a row keyed on ''.
 */
export function slugify(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}
