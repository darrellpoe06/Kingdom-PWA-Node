// =============================================================================
// snapshot-slim — never let photo bytes block the financial save (2026-07-18)
// =============================================================================
// Darrell/Christina, live: "This device's storage is full — changes are NOT being
// saved" — with the app pointing at Big Picture photos, and images they "didn't
// upload between builds." Root cause: the local snapshot (window.storage.set
// 'poe-financial-v28') serializes ALL of `data`, and when a NAS photo upload
// falls back to local-only (LifeGallery), the photo is kept in data.lifePhotos
// with its FULL base64 `src`. A few of those blow the ~5MB localStorage quota, the
// whole snapshot throws QuotaExceededError, and the FINANCIAL data (a week of
// entries) stops saving with it — the worst trade there is.
//
// The bytes have a durable home already: the family NAS (and the cloud snapshot).
// localStorage only needs a light reference. This strips heavy inline image bytes
// (base64 `data:` URLs on lifePhotos / receipts) from the copy that goes to
// localStorage, so the financial snapshot always fits and always saves. The
// IN-MEMORY `data` is never touched — only the persisted copy is slimmed, and a
// dropped byte is flagged (srcDropped) so the gallery can show a placeholder
// instead of a broken tile. NAS-hosted photos (src is a normal URL, not `data:`)
// are untouched. Pure + deterministic. This is EXECUTION-OUTCOME-OBSERVABILITY +
// the localStorage-hydration lesson (LESSONS-LEARNED 2026-06-03) made structural:
// the critical data's persistence can never be held hostage by an optional blob.
// =============================================================================

// True for a heavy inline image byte string (a base64 data URL). NAS/cloud URLs
// (https://…, /webhook/…) are light references and are kept as-is.
function isInlineImage(v) {
  return typeof v === 'string' && v.startsWith('data:');
}

// Strip the inline base64 bytes from one photo-like object, keeping every other
// field (id, caption, category, date) and flagging the drop. Non-inline srcs
// (NAS/cloud URLs) pass through unchanged.
function slimPhoto(p) {
  if (!p || typeof p !== 'object') return p;
  const out = { ...p };
  let dropped = false;
  for (const key of ['src', 'dataUrl', 'thumb', 'full']) {
    if (isInlineImage(out[key])) { out[key] = ''; dropped = true; }
  }
  if (dropped) out.srcDropped = true;
  return out;
}

// slimSnapshotData(data) -> a shallow copy of `data` with heavy inline image bytes
// removed from the collections that can carry them (lifePhotos, and any receipts
// array on transactions). Everything else — all financial data — is passed through
// by reference (no deep clone; the persisted JSON is what shrinks). Pure.
export function slimSnapshotData(data) {
  if (!data || typeof data !== 'object') return data;
  const out = { ...data };
  if (Array.isArray(data.lifePhotos)) out.lifePhotos = data.lifePhotos.map(slimPhoto);
  if (Array.isArray(data.photos)) out.photos = data.photos.map(slimPhoto);
  // Transaction RECEIPT images are the OTHER heavy inline bytes in the ledger — a
  // books user (Christina) can attach a photo to every transaction, and those
  // base64 receipts bloat the snapshot exactly like gallery photos do. Strip the
  // receipt's inline bytes from the persisted copy (its amount/merchant/note/date
  // stay) so a ledger full of receipt photos can't block the financial save. The
  // receipt src also syncs to the cloud, so the image itself is not lost.
  if (Array.isArray(data.transactions)) {
    out.transactions = data.transactions.map((t) => {
      if (t && t.receipt && isInlineImage(t.receipt.src)) {
        return { ...t, receipt: { ...t.receipt, src: '', srcDropped: true } };
      }
      return t;
    });
  }
  return out;
}

// Heavy collections that are RECOVERABLE from the cloud (each has its own sync),
// so they can be dropped from the LOCAL cache as a last resort without losing
// anything — the current ledger (transactions/accounts/entities) must save even on
// a device with years of history. recordEvents is the append-only edit-history log
// (record-events-sync); it grows without bound and reconstructs from the cloud.
const RECOVERABLE_HEAVY = ['recordEvents'];

// extraSlimSnapshotData(data) -> the slim copy with the recoverable-heavy
// collections ALSO dropped (a marker records that they were shed so the UI can say
// so). This is the final tier: it guarantees the current financial state fits even
// when images are already stripped and the sheer volume of history is the weight.
export function extraSlimSnapshotData(data) {
  const out = slimSnapshotData(data);
  if (!out || typeof out !== 'object') return out;
  const shed = [];
  for (const key of RECOVERABLE_HEAVY) {
    if (Array.isArray(out[key]) && out[key].length) { out[key] = []; shed.push(key); }
  }
  if (shed.length) out.localCacheShed = shed;
  return out;
}

// persistSnapshot(setItem, key, envelope, data) — write the snapshot, PREFERRING
// the full copy (photos kept) and only falling back to the slim copy (inline photo
// bytes stripped) when the full one exceeds the storage quota. So photos are kept
// whenever there is room (nothing lost unless the device is genuinely out of
// space), and a photo can NEVER cost the family their financial data. `setItem` is
// the async storage writer (e.g. window.storage.set); `envelope` is the snapshot
// metadata (owner/savedAt/pressure/…) that wraps `data`. Returns 'full' | 'slim' |
// 'extra' (which tier fit). Tiers: full (photos kept) -> slim (image bytes stripped)
// -> extra (recoverable history ALSO dropped) so the current ledger saves even on a
// device with years of data. Re-throws only when even the extra-slim copy can't be
// written (genuinely out of space — and even then cloud-synced data is not lost).
export async function persistSnapshot(setItem, key, envelope, data) {
  const json = (d) => JSON.stringify({ ...envelope, data: d });
  try {
    await setItem(key, json(data));
    return 'full';
  } catch (_) {
    try {
      await setItem(key, json(slimSnapshotData(data)));
      return 'slim';
    } catch (_2) {
      await setItem(key, json(extraSlimSnapshotData(data)));
      return 'extra';
    }
  }
}

// storageBannerMessage(mode, cloudSafe) -> the HONEST storage banner for a save
// outcome, or null when nothing needs saying. mode: 'full' (all good) | 'slim'
// (image bytes dropped) | 'extra' (recoverable history also dropped) | 'fail'
// (even the trimmed save could not be written). cloudSafe = the financial data is
// cloud-synced, so it is NOT lost even when the local cache can't hold it — the
// message must NOT falsely alarm "changes are NOT being saved" in that case
// (DR-0100: state the truth; do not over-alarm a synced ledger). Pure.
export function storageBannerMessage(mode, cloudSafe) {
  if (mode === 'full') return null;
  // The system handles low space SILENTLY — don't make the user tell/fix the system
  // (Darrell 2026-07-19: "verify that the banner is gone... don't expect users to
  // tell the systems"). When the books are cloud-safe, the slim/extra tiers already
  // did their job (the ledger saved by trimming local-only cache) and NOTHING is at
  // risk, so there is nothing for the user to act on — show NO banner at all. A
  // banner appears ONLY when the user genuinely must act: local space that is NOT
  // cloud-backed (slim/extra), or a hard save FAIL. This is the sibling of the old
  // over-promising copy (which routed to a not-friendly NAS-token backup the app
  // still labels "coming next") — now the honest default is silence when safe.
  if (cloudSafe && (mode === 'slim' || mode === 'extra')) return null;
  if (mode === 'slim') return 'This device is low on space — your books are saving fine, but new photos aren’t kept on this phone. Remove or export a few photos (Big Picture → photos) to free space.';
  if (mode === 'extra') return 'This device is low on space; older edit-history and photos aren’t kept on this phone. Remove or export a few photos (Big Picture → photos) to free space.';
  // 'fail' — even the extra-slim copy could not be written. Measured 2026-08-21
  // on Darrell's phone: the old copy blamed "this device is out of local space"
  // when the device had gigabytes free — the real wall was the browser's ~5MB
  // localStorage cap for the site (now cured by the IndexedDB-backed shim; this
  // tier fires only when IndexedDB is unavailable too). Name the true limit —
  // the app's cache on this device, not the phone's storage (DR-0100).
  return cloudSafe
    ? 'This device could not keep the app’s local cache (a browser storage limit, not your phone being full) — your data is synced to the cloud and safe. A reload usually clears this.'
    : 'This device could not save the app’s local cache (a browser storage limit) — changes are NOT being saved. Sign in so your books sync to the cloud, or free browser site data, then make any small edit to retry.';
}

// snapshotByteSize(obj) -> the UTF-8 byte length of the serialized object, so a
// caller can measure the real weight (VERIFICATION-DOCTRINE: measure, don't guess)
// and decide whether the slim worked. Returns 0 on a serialization failure.
export function snapshotByteSize(obj) {
  try {
    const json = typeof obj === 'string' ? obj : JSON.stringify(obj);
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(json).length;
    // Fallback: count bytes for environments without TextEncoder.
    return unescape(encodeURIComponent(json)).length;
  } catch {
    return 0;
  }
}
