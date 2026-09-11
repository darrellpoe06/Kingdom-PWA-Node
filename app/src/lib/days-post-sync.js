// =============================================================================
// days-post-sync — the seam for the sorting tray (0204, DR-0360)
// =============================================================================
// Reads go through RLS: 0201's rule (yours, or shared with the household) plus
// 0204's one narrow addition (a document a guardian released into the tray).
// Releasing is owner/admin only, enforced in the function, not here.
// =============================================================================
import supabase from './supabase.js';
import { validateSort } from './days-post.js';

export const TIMEOUT_MS = 20000;

function withTimeout(promise, ms, what) {
  let t;
  const timer = new Promise((_, rej) => { t = setTimeout(() => rej(new Error(`${what} timed out after ${ms} ms`)), ms); });
  return Promise.race([promise, timer]).finally(() => clearTimeout(t));
}
function message(error) {
  const raw = String((error && (error.message || error.msg)) || error || '').replace(/^.*?:\s*/, '');
  return raw || 'That did not go through.';
}

const fromRow = (d) => ({
  id: d.id,
  label: d.label || '',
  category: d.category || '',
  whereFiled: d.where_filed || '',
  arrivedOn: d.arrived_on || '',
  means: d.means || null,
  product: d.routed_product || null,
  place: d.routed_place || '',
  routedAt: d.routed_at || null,
  routedBy: d.routed_by || null,
  releasedForSorting: !!d.sorting_released_at,
  releasedBy: d.sorting_released_by || null,
  createdBy: d.created_by,
  createdAt: d.created_at,
});

/** Every document this signed-in person may see, with its sorting state. */
export async function listPost(instanceId = null) {
  try {
    let q = supabase.from('family_documents')
      .select('id, instance_id, created_by, created_at, label, category, where_filed, arrived_on, means, routed_product, routed_place, routed_at, routed_by, sorting_released_at, sorting_released_by')
      .order('arrived_on', { ascending: false, nullsFirst: false });
    if (instanceId) q = q.eq('instance_id', instanceId);
    const { data, error } = await withTimeout(q, TIMEOUT_MS, 'reading the post');
    if (error) return { ok: false, reason: 'rpc-error', message: message(error), rows: [] };
    return { ok: true, rows: (data || []).map(fromRow) };
  } catch (e) {
    return { ok: false, reason: 'network-error', message: message(e), rows: [] };
  }
}

/** Sort a piece of post. Passing nothing clears it — a sort is reversible. */
export async function sortDocument(documentId, { means = null, product = null, place = null, arrivedOn = null } = {}) {
  if (!documentId) return { ok: false, reason: 'no-document', message: 'Nothing to sort.' };
  const errors = validateSort({ means, product, place });
  if (errors.length) return { ok: false, reason: 'invalid', errors, message: errors[0] };
  try {
    const { data, error } = await withTimeout(
      supabase.rpc('document_route', {
        document_id_in: documentId, means_in: means, product_in: product,
        place_in: place, arrived_on_in: arrivedOn,
      }), TIMEOUT_MS, 'sorting the document');
    if (error) return { ok: false, reason: 'rpc-error', message: message(error) };
    return { ok: true, document: fromRow(data) };
  } catch (e) {
    return { ok: false, reason: 'network-error', message: message(e) };
  }
}

/**
 * Put one document in the tray, or take it back out. A guardian's decision
 * about what a child sees (DR-0094) — the database refuses anyone else.
 */
export async function releaseForSorting(documentId, release = true) {
  if (!documentId) return { ok: false, reason: 'no-document', message: 'Nothing to release.' };
  try {
    const { data, error } = await withTimeout(
      supabase.rpc('document_release_for_sorting', { document_id_in: documentId, release_in: !!release }),
      TIMEOUT_MS, release ? 'putting it in the tray' : 'taking it back');
    if (error) return { ok: false, reason: 'rpc-error', message: message(error) };
    return { ok: true, document: fromRow(data) };
  } catch (e) {
    return { ok: false, reason: 'network-error', message: message(e) };
  }
}
