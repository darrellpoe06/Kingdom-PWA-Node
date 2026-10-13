// =============================================================================
// vault-store — the seam between the vault and the sovereign database (0251)
// =============================================================================
// Everything that crosses this seam is CIPHERTEXT or KDF parameters. The clear
// record exists only in the component's memory while the vault is open. RLS is
// the wall (owner only, every verb); this file never filters on the client's
// behalf, it only names the table.
//
// Two copies, same bytes: the database (every device of the owner syncs from
// it, last-writer-wins on updated_at) and a device-local cache in localStorage
// (so the vault opens offline, and opens instantly). Both hold ciphertext, so a
// stolen phone's cache is as useless as a dumped table.
//
// Fail-quiet contract like family-vault-sync.js: these never throw; every call
// has a ceiling; the caller renders the reason.
// =============================================================================
import supabase from './supabase.js';

export const TIMEOUT_MS = 20000;
const CACHE_PREFIX = 'poe.vault.v1:'; // + user id -> { header, items }

function withTimeout(promise, ms, what) {
  let t;
  const timer = new Promise((_, rej) => { t = setTimeout(() => rej(new Error(`${what} timed out after ${ms} ms`)), ms); });
  return Promise.race([promise, timer]).finally(() => clearTimeout(t));
}
function message(error) {
  const raw = String((error && (error.message || error.msg)) || error || '').replace(/^.*?:\s*/, '');
  return raw || 'That did not go through.';
}

export async function currentUserId() {
  try {
    const { data } = await withTimeout(supabase.auth.getUser(), TIMEOUT_MS, 'reading who is signed in');
    return (data && data.user && data.user.id) || null;
  } catch {
    return null;
  }
}

// --- device cache (ciphertext only) -----------------------------------------
export function readCache(userId, storage = safeStorage()) {
  if (!userId || !storage) return null;
  try {
    const raw = storage.getItem(CACHE_PREFIX + userId);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}
export function writeCache(userId, { header, items }, storage = safeStorage()) {
  if (!userId || !storage) return false;
  try {
    storage.setItem(CACHE_PREFIX + userId, JSON.stringify({ header: header || null, items: Array.isArray(items) ? items : [], at: new Date().toISOString() }));
    return true;
  } catch {
    return false;
  }
}
export function clearCache(userId, storage = safeStorage()) {
  if (!userId || !storage) return;
  try { storage.removeItem(CACHE_PREFIX + userId); } catch { /* fine */ }
}
function safeStorage() {
  try { return globalThis.localStorage || null; } catch { return null; }
}

// --- header -------------------------------------------------------------------
const headerFromRow = (r) => r && ({
  kdf: r.kdf, iterations: r.iterations, salt: r.salt, verifier_iv: r.verifier_iv, verifier_ct: r.verifier_ct,
  version: r.version, createdAt: r.created_at || null, updatedAt: r.updated_at || null,
});

export async function loadHeader() {
  try {
    const { data, error } = await withTimeout(
      supabase.from('vault_header').select('kdf, iterations, salt, verifier_iv, verifier_ct, version, created_at, updated_at').maybeSingle(),
      TIMEOUT_MS, 'reading the vault header',
    );
    if (error) return { ok: false, reason: 'rpc-error', message: message(error), header: null };
    return { ok: true, header: headerFromRow(data) || null };
  } catch (e) {
    return { ok: false, reason: 'timeout', message: message(e), header: null };
  }
}

export async function saveHeader(userId, header) {
  try {
    const row = { user_id: userId, kdf: header.kdf, iterations: header.iterations, salt: header.salt, verifier_iv: header.verifier_iv, verifier_ct: header.verifier_ct, version: header.version || 1 };
    const { error } = await withTimeout(supabase.from('vault_header').upsert(row, { onConflict: 'user_id' }), TIMEOUT_MS, 'saving the vault header');
    if (error) return { ok: false, reason: 'rpc-error', message: message(error) };
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: 'timeout', message: message(e) };
  }
}

// --- items (ciphertext rows) --------------------------------------------------
const itemFromRow = (r) => ({ id: r.id, iv: r.iv, ct: r.ct, version: r.version || 1, updatedAt: r.updated_at || null, deletedAt: r.deleted_at || null });

export async function listItems() {
  try {
    const { data, error } = await withTimeout(
      supabase.from('vault_items').select('id, iv, ct, version, updated_at, deleted_at').order('updated_at', { ascending: false }).limit(5000),
      TIMEOUT_MS, 'reading the vault',
    );
    if (error) return { ok: false, reason: 'rpc-error', message: message(error), rows: [] };
    return { ok: true, rows: (data || []).map(itemFromRow) };
  } catch (e) {
    return { ok: false, reason: 'timeout', message: message(e), rows: [] };
  }
}

export async function upsertItem(userId, row) {
  try {
    const payload = { id: row.id, user_id: userId, iv: row.iv, ct: row.ct, version: row.version || 1, deleted_at: row.deletedAt || null };
    const { error } = await withTimeout(supabase.from('vault_items').upsert(payload, { onConflict: 'user_id,id' }), TIMEOUT_MS, 'saving the item');
    if (error) return { ok: false, reason: 'rpc-error', message: message(error) };
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: 'timeout', message: message(e) };
  }
}

/** Soft delete: the row stays (deleted_at set) so a late device never resurrects it. */
export async function deleteItem(userId, id) {
  try {
    const { error } = await withTimeout(
      supabase.from('vault_items').update({ deleted_at: new Date().toISOString() }).eq('user_id', userId).eq('id', id),
      TIMEOUT_MS, 'removing the item',
    );
    if (error) return { ok: false, reason: 'rpc-error', message: message(error) };
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: 'timeout', message: message(e) };
  }
}

/** Last-writer-wins merge of two ciphertext row sets by id. Pure. */
export function mergeRows(a, b) {
  const by = new Map();
  for (const r of [...(a || []), ...(b || [])]) {
    if (!r || !r.id) continue;
    const prev = by.get(r.id);
    if (!prev || String(r.updatedAt || '') > String(prev.updatedAt || '')) by.set(r.id, r);
  }
  return [...by.values()];
}
