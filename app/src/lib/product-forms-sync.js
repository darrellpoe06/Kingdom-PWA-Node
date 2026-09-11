// =============================================================================
// product-forms-sync — the seam for every product's live forms (0200, DR-0357)
// =============================================================================
// Read: product_forms_read(product, instance) — a member of the instance, or
// an ANONYMOUS applicant for the 'properties' product, which is the whole
// point: someone with no account fills the rental application and must see the
// landlord's current wording, not the wording at deploy time.
// Save: product_form_save(product, key, body, note, instance) — owner/admin,
// a note required, every save a new version.
//
// Fail-soft like every seam that feeds a form: a failed read resolves to the
// ORIGINAL the code ships, so a form never blocks on the network. The caller
// is told it is the original (`ok: false`) and can say so.
// =============================================================================
import supabase from './supabase.js';
import { resolveProduct, validateFor, normalizeFor, productDef } from './product-forms.js';

export const RPC_TIMEOUT_MS = 15000;

function withTimeout(promise, ms, what) {
  let t;
  const timer = new Promise((_, rej) => { t = setTimeout(() => rej(new Error(`${what} timed out after ${ms} ms`)), ms); });
  return Promise.race([promise, timer]).finally(() => clearTimeout(t));
}

function message(error) {
  const raw = String((error && (error.message || error.msg)) || error || '').replace(/^.*?:\s*/, '');
  return raw || 'That did not go through.';
}

/**
 * A product's live definitions, resolved onto the originals. Never throws.
 * @returns {{ ok, resolved, instanceId, reason?, message? }}
 */
export async function readProductForms(product, instanceId = null) {
  if (!productDef(product)) return { ok: false, reason: 'unknown-product', message: 'No such product.', resolved: resolveProduct(product, null), instanceId: null };
  try {
    const { data, error } = await withTimeout(
      supabase.rpc('product_forms_read', { product_in: product, instance_in: instanceId }),
      RPC_TIMEOUT_MS, 'reading the forms');
    if (error) return { ok: false, reason: 'rpc-error', message: message(error), resolved: resolveProduct(product, null), instanceId };
    const rows = data && typeof data === 'object' ? { ...data } : {};
    const resolvedInstance = rows._instance_id || instanceId || null;
    delete rows._instance_id;
    return { ok: true, resolved: resolveProduct(product, rows), instanceId: resolvedInstance };
  } catch (e) {
    return { ok: false, reason: 'network-error', message: message(e), resolved: resolveProduct(product, null), instanceId };
  }
}

/**
 * Save one of a product's forms or documents. Refuses locally first, so a body
 * the engine would reject never reaches the database.
 * @returns {{ ok, saved?, errors?, message? }}
 */
export async function saveProductForm(product, key, body, note, instanceId = null) {
  const normalized = normalizeFor(product, key, body);
  if (!normalized) return { ok: false, reason: 'unknown-form', message: 'No such form.' };
  const errors = validateFor(product, key, normalized);
  if (errors.length) return { ok: false, reason: 'invalid', errors, message: errors[0] };
  const clean = String(note || '').trim();
  if (clean.length < 3) return { ok: false, reason: 'no-note', message: 'Say in a few words what changed.' };
  try {
    const { data, error } = await withTimeout(
      supabase.rpc('product_form_save', { product_in: product, key_in: key, body_in: normalized, note_in: clean, instance_in: instanceId }),
      RPC_TIMEOUT_MS, 'saving the form');
    if (error) return { ok: false, reason: 'rpc-error', message: message(error) };
    return { ok: true, saved: data };
  } catch (e) {
    return { ok: false, reason: 'network-error', message: message(e) };
  }
}
