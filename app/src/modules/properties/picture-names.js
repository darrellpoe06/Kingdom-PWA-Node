// =============================================================================
// picture-names — the names an instance gives its pictures (DR-1235, 0310)
// =============================================================================
// Darrell, 2026-10-27: "when adding a new name for an image it should be
// automatically one of the options moving forward." picture_names holds one
// row per name per instance, matched without case or stray spaces, and
// remember_picture_name() is its only writer (it adds a name typed once, or
// counts a reuse). RLS scopes the read to the instances the person names
// pictures in. Its own small module, beside cloud.js, so a screen that offers
// the names (the door's gallery, the work-order triage) reaches them without
// widening cloud.js's surface for every test that mocks it.
// =============================================================================
import supabase from '../../lib/supabase.js';

const ok = (extra = {}) => ({ ok: true, ...extra });
const no = (reason, error) => ({ ok: false, reason, error: (error && error.message) || undefined });

export async function loadPictureNames(client = supabase) {
  try {
    const { data, error } = await client
      .from('picture_names')
      .select('id, instance_id, name, uses, last_used_at')
      .order('name_key', { ascending: true });
    if (error) return no('read-failed', error);
    return ok({ names: data || [] });
  } catch (e) { return no('unexpected', e); }
}

export async function rememberPictureName(instanceId, name, client = supabase) {
  const clean = String(name || '').replace(/\s+/g, ' ').trim();
  if (!instanceId || !clean) return no('no-name');
  try {
    const { data, error } = await client.rpc('remember_picture_name', { p_instance: instanceId, p_name: clean });
    if (error) return no('write-failed', error);
    const row = Array.isArray(data) ? data[0] : data;
    return ok({ name: row || { name: clean } });
  } catch (e) { return no('unexpected', e); }
}

/** The store a screen injects in tests. */
export const NAMES_OPS = Object.freeze({ load: loadPictureNames, remember: rememberPictureName });
