// =============================================================================
// snapshot-sync — the whole world follows the account (v2.15, 2026-06-12)
// =============================================================================
// The table syncs carry the LISTS (accounts, debts, transactions, projects,
// inquiries, incidents, contractors, rentals, entities). Everything else the
// family lives in — recurring obligations, tax calendar, church + conference,
// events, watchlist, capex, skill profiles, settings, room memory — lived
// only in one device's browser storage, so a brand-new signed-in device
// booted the aspirational seed ("Adam / 240 Cedar Ln", 2026-06-12 report).
// One jsonb row per instance (family_snapshots) carries that remainder.
//
// Deliberate exclusions (binding):
//   - the table-synced lists — their tables stay the source of truth; the
//     payload simply does not contain those keys, so applying it can never
//     clobber them
//   - notes + appDirectives — Thinking Space is private to the PERSON, not
//     the instance; it does not ride a family-shared row
//   - photo bytes — every base64 data-URL is stripped (lifePhotos dropped
//     whole; rooms[].photos dropped per-room). Photos are the R15 sovereign
//     write-path's job; a jsonb row is the wrong home for megabytes.
//
// Conflict model (v1): last-write-wins per instance, pull-once at sign-in
// (applied only when the cloud row is NEWER than this device's last local
// save), leading-edge throttled push. No realtime apply — a mid-session
// overwrite risks more than it saves.
// =============================================================================
import supabase from './supabase.js';

const TABLE_SYNCED_KEYS = [
  'accounts', 'debts', 'transactions', 'projects', 'inquiries',
  'incidents', 'contractors1099', 'entities',
];
const PRIVATE_KEYS = ['notes', 'appDirectives'];
const PHOTO_KEYS = ['lifePhotos'];

// Hard ceiling on what we'll write into a jsonb row. Beyond this something
// is wrong (a base64 slipped a new shape past the stripper) — refuse and
// warn rather than bloat the table.
const MAX_PAYLOAD_BYTES = 2 * 1024 * 1024;

async function currentSession() {
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

async function getTenantId() {
  const { data, error } = await supabase.rpc('join_default_instance', { display_name_in: null });
  if (error) throw error;
  return data;
}

// Deep-copy `node`, omitting any string value that is a data-URL and any
// key literally named 'photos' whose value is an array (room galleries).
export function stripPhotoBytes(node) {
  if (Array.isArray(node)) return node.map(stripPhotoBytes);
  if (node && typeof node === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(node)) {
      if (k === 'photos' && Array.isArray(v)) continue;
      if (typeof v === 'string' && v.startsWith('data:')) continue;
      out[k] = stripPhotoBytes(v);
    }
    return out;
  }
  return node;
}

// Build the cloud payload from the same shape the local persist writes.
// Returns null (with a warning) if the result is still implausibly large.
export function buildSnapshotPayload({ data, pressure, snowballSort, snowballExtra, debtSnowballSort, debtSnowballExtra, theme }) {
  const cleaned = { ...(data || {}) };
  for (const k of [...TABLE_SYNCED_KEYS, ...PRIVATE_KEYS, ...PHOTO_KEYS]) delete cleaned[k];
  const stripped = stripPhotoBytes(cleaned);
  const payload = { v: 1, data: stripped, pressure, snowballSort, snowballExtra, debtSnowballSort, debtSnowballExtra, theme };
  try {
    if (JSON.stringify(payload).length > MAX_PAYLOAD_BYTES) {
      console.warn('[snapshot-sync] payload exceeds 2MB after stripping — not pushing');
      return null;
    }
  } catch (e) {
    console.warn('[snapshot-sync] payload not serializable — not pushing', e);
    return null;
  }
  return payload;
}

// When applying a snapshot over current state, matched rentals keep THIS
// device's room photos (the payload never carries photo bytes, and applying
// a photo-less copy must not erase the local gallery).
export function mergeKeepingLocalRoomPhotos(localRentals = [], snapRentals = []) {
  return snapRentals.map((sr) => {
    const lr = localRentals.find((l) => l.id === sr.id);
    if (!lr) return sr;
    return {
      ...sr,
      rooms: (sr.rooms || []).map((room) => {
        const lroom = (lr.rooms || []).find((x) => x.id === room.id);
        return lroom && Array.isArray(lroom.photos) ? { ...room, photos: lroom.photos } : room;
      }),
    };
  });
}

export async function fetchSnapshot() {
  const session = await currentSession();
  if (!session) return null;
  const tenantId = await getTenantId();
  const { data, error } = await supabase
    .from('family_snapshots')
    .select('payload, updated_at')
    .eq('instance_id', tenantId)
    .maybeSingle();
  if (error) {
    // Table not created yet (v2.15 not run) lands here — quiet no-op.
    console.warn('[snapshot-sync] fetch failed (has schema-v2.15 been applied?):', error.message || error);
    return null;
  }
  if (!data) return null;
  return { payload: data.payload, updatedAt: data.updated_at };
}

export async function pushSnapshot(payload) {
  if (!payload) return { skipped: 'empty-payload' };
  const session = await currentSession();
  if (!session) return { skipped: 'signed-out' };
  const tenantId = await getTenantId();
  const { error } = await supabase
    .from('family_snapshots')
    .upsert(
      { instance_id: tenantId, updated_by: session.user.id, updated_at: new Date().toISOString(), payload },
      { onConflict: 'instance_id' }
    );
  if (error) {
    console.warn('[snapshot-sync] push failed (has schema-v2.15 been applied?):', error.message || error);
    return { skipped: 'push-error', error };
  }
  return { pushed: true };
}
