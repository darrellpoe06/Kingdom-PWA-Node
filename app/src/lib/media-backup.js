// =============================================================================
// media-backup — phone photos AND videos onto the family NAS (chunked, verified)
// =============================================================================
// 2026-07-05, Darrell: "Can this app upload and give me the option of moving
// all my photos and videos to my server or nas ... so I can get a new phone
// and all my images and videos are safe on the nas?" This is that lane. It
// writes to the sovereign Python server (infra/nas-property-photos/
// photo_server.py) over the same-origin /nas-photos path — NOT the n8n
// photo-upload webhook, whose JSON/base64 transport caps at 8 MB and is
// image-only. Videos need raw bytes, so every file here streams as chunks:
//
//   1. GET /media-exists           — dedup: already on the NAS? skip, 0 bytes moved
//   2. GET /media-upload-status    — resume: how much of a part already landed
//   3. POST /media-upload × N      — raw ~6 MB chunks; a 409 carries the server's
//                                    real offset and the client adopts it (a
//                                    replayed chunk is a no-op, never corruption)
//   4. complete:true + bytes === file.size  — VERIFIED (DR-0076) before the
//      local ledger marks the file backed up. No byte match, no checkmark.
//
// The ledger (localStorage) only remembers WHICH files this device verified on
// the NAS — never the bytes — so re-running "back up" skips everything already
// safe and the button is honest about what's left.
//
// HONEST LIMIT (2026-06-11-photo-sovereignty-and-phone-backup.md): a PWA
// cannot reach the camera roll in the background. This lane is foreground —
// you pick files (or a whole folder on Android Chrome) and watch them land.
// Automatic every-new-shot backup remains the Synology Photos app's job; the
// surface says so instead of faking it.
import { bridgeToken } from './nas-photos.js';

// Same sovereign server, same same-origin base as property photos. Pinned by
// test so this can never silently route back through /n8n/webhook.
export const MEDIA_BASE = '/nas-photos';
export const MEDIA_LEDGER_KEY = 'poetech-media-backup-ledger';
export const MEDIA_DEVICE_KEY = 'poetech-media-backup-device';
export const CHUNK_BYTES = 6 * 1024 * 1024;           // under every proxy body cap
export const MAX_MEDIA_BYTES = 4 * 1024 * 1024 * 1024; // matches the server cap
const LEDGER_MAX_ENTRIES = 4000;

// Extensions the server whitelists (it re-validates + magic-byte checks; this
// client copy exists so unsupported files are named honestly before upload).
export const MEDIA_FILE_RE = /\.(jpe?g|png|webp|heic|heif|gif|mp4|mov|m4v|webm|mkv|avi|3gp)$/i;
export function isMediaFile(name) {
  return typeof name === 'string' && MEDIA_FILE_RE.test(name);
}

// --- Device label (which phone these files came from → NAS folder name) ------
export function sanitizeDeviceLabel(label) {
  let clean = String(label || '').trim().replace(/[^A-Za-z0-9._-]/g, '-').replace(/-{2,}/g, '-');
  clean = clean.replace(/^[.\-_]+|[.\-_]+$/g, '');
  if (!clean || clean.length > 48 || clean.includes('..')) return '';
  return clean;
}

export function deviceLabel() {
  try { return sanitizeDeviceLabel(localStorage.getItem(MEDIA_DEVICE_KEY) || ''); } catch (_) { return ''; }
}

export function setDeviceLabel(label) {
  const clean = sanitizeDeviceLabel(label);
  try {
    if (!clean) localStorage.removeItem(MEDIA_DEVICE_KEY);
    else localStorage.setItem(MEDIA_DEVICE_KEY, clean);
  } catch (_) { /* storage unavailable — no-op */ }
  return clean;
}

// --- Filename + identity ------------------------------------------------------
// Mirror of the server's sanitizer: basename, safe chars, whitelisted extension.
// Header values must be ASCII, so the sanitized name is what goes on the wire.
export function sanitizeMediaName(name) {
  const base = String(name || '').replace(/\\/g, '/').split('/').pop() || '';
  const clean = base.replace(/[^A-Za-z0-9._-]/g, '_').replace(/^[._]+|[._]+$/g, '');
  if (!clean || clean.length > 120 || clean.includes('..') || !isMediaFile(clean)) return '';
  return clean;
}

// Stable identity for "have we backed this exact file up from this device?".
// name+size+lastModified is the camera-file reality: any edit changes it.
export function fileFingerprint(file) {
  return `${file.name}|${file.size}|${file.lastModified}`;
}

// Deterministic upload id — the SAME file resumes the SAME part file on the
// NAS across app restarts, which is what makes interrupted uploads cheap.
export function uploadId(device, file) {
  const raw = `${device}-${file.size}-${file.lastModified}-${sanitizeMediaName(file.name)}`;
  return raw.replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 120);
}

// The file's own date (capture ~ lastModified for camera files) → the NAS
// year/month folder, so a backup reads like an album, not a dump.
export function mediaDate(file) {
  const d = new Date(file.lastModified || Date.now());
  return Number.isFinite(d.getTime()) ? d.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
}

// --- Ledger: which files THIS device has verified on the NAS ------------------
function readLedger() {
  try {
    const raw = JSON.parse(localStorage.getItem(MEDIA_LEDGER_KEY) || 'null');
    if (raw && raw.v === 1 && raw.entries && typeof raw.entries === 'object') return raw;
  } catch (_) { /* corrupt → start fresh */ }
  return { v: 1, entries: {} };
}

function writeLedger(ledger) {
  // Bounded: prune oldest entries past the cap so the ledger can't grow into
  // the localStorage quota that belongs to the app's real data.
  const keys = Object.keys(ledger.entries);
  if (keys.length > LEDGER_MAX_ENTRIES) {
    keys.sort((a, b) => (ledger.entries[a].at || 0) - (ledger.entries[b].at || 0));
    for (const k of keys.slice(0, keys.length - LEDGER_MAX_ENTRIES)) delete ledger.entries[k];
  }
  try { localStorage.setItem(MEDIA_LEDGER_KEY, JSON.stringify(ledger)); } catch (_) { /* quota — skip */ }
}

export function isBackedUp(file) {
  return !!readLedger().entries[fileFingerprint(file)];
}

export function markBackedUp(file, at) {
  const ledger = readLedger();
  ledger.entries[fileFingerprint(file)] = { at: at || Date.now(), bytes: file.size };
  writeLedger(ledger);
}

export function backedUpCount() {
  return Object.keys(readLedger().entries).length;
}

// --- URLs (exported so tests pin the sovereign path) ---------------------------
export function mediaExistsUrl(device, name, size, date) {
  return `${MEDIA_BASE}/media-exists?device=${encodeURIComponent(device)}&name=${encodeURIComponent(name)}&size=${size}&date=${encodeURIComponent(date)}`;
}

export function mediaStatusUrl(id) {
  return `${MEDIA_BASE}/media-upload-status?id=${encodeURIComponent(id)}`;
}

export const MEDIA_UPLOAD_URL = `${MEDIA_BASE}/media-upload`;

function authHeaders() {
  return { authorization: `Bearer ${bridgeToken()}` };
}

// --- Service probe --------------------------------------------------------------
// Honest capability check: is the NAS server running WITH the media endpoints?
// 'ready' | 'needs-update' (server live but pre-media build) | 'no-token' |
// 'unauthorized' | 'unreachable'. The card states the real one, never a fake ✓.
export async function checkMediaService() {
  if (!bridgeToken()) return 'no-token';
  try {
    const resp = await fetch(mediaStatusUrl('service-probe-0000'), { headers: authHeaders() });
    if (resp.status === 404) return 'needs-update';
    if (resp.status === 401) return 'unauthorized';
    if (resp.ok) return 'ready';
    return 'unreachable';
  } catch (_) {
    return 'unreachable';
  }
}

// --- The upload ------------------------------------------------------------------
// Returns { ok:true, bytes, skipped?, dedup? } on VERIFIED success,
// { ok:false, stopped:true } when the caller stopped it, or
// { ok:false, error } — the caller lists failures honestly, never swallows them.
export async function uploadMedia(file, { device, onProgress, shouldStop, chunkBytes = CHUNK_BYTES } = {}) {
  if (!bridgeToken()) return { ok: false, error: 'no-token' };
  const dev = sanitizeDeviceLabel(device || deviceLabel()) || 'my-phone';
  const name = sanitizeMediaName(file && file.name);
  if (!name || !file.size || file.size > MAX_MEDIA_BYTES) return { ok: false, error: 'unsupported' };
  const date = mediaDate(file);
  const headers = authHeaders();
  try {
    // 1. Dedup: already on the NAS (same device/date/name/size)? Zero bytes moved.
    const ex = await fetch(mediaExistsUrl(dev, name, file.size, date), { headers });
    if (ex.ok) {
      const j = await ex.json().catch(() => null);
      if (j && j.exists) {
        markBackedUp(file);
        if (onProgress) onProgress(file.size, file.size);
        return { ok: true, bytes: file.size, skipped: true };
      }
    }
    // 2. Resume: adopt however much of this exact file already landed.
    const id = uploadId(dev, file);
    let offset = 0;
    const st = await fetch(mediaStatusUrl(id), { headers });
    if (st.ok) {
      const j = await st.json().catch(() => null);
      if (j && typeof j.bytes === 'number') offset = Math.max(0, Math.min(j.bytes, file.size));
    }
    // 3. Chunks until the server says complete.
    let conflicts = 0;
    while (offset < file.size) {
      if (shouldStop && shouldStop()) return { ok: false, stopped: true };
      const end = Math.min(offset + chunkBytes, file.size);
      const chunk = await file.slice(offset, end).arrayBuffer();
      const resp = await fetch(MEDIA_UPLOAD_URL, {
        method: 'POST',
        headers: {
          ...headers,
          'content-type': 'application/octet-stream',
          'x-upload-id': id,
          'x-media-device': dev,
          'x-media-name': name,
          'x-media-total': String(file.size),
          'x-media-offset': String(offset),
          'x-media-date': date,
        },
        body: chunk,
      });
      if (resp.status === 409) {
        // The server knows the part's real size — adopt it and continue.
        const j = await resp.json().catch(() => null);
        conflicts += 1;
        if (j && typeof j.bytes === 'number' && j.bytes !== offset && conflicts <= 3) {
          offset = Math.max(0, Math.min(j.bytes, file.size));
          continue;
        }
        return { ok: false, error: 'offset-conflict' };
      }
      if (!resp.ok) return { ok: false, error: `upload-failed-${resp.status}` };
      const j = await resp.json().catch(() => null);
      if (!j || j.ok !== true) return { ok: false, error: 'bad-response' };
      offset = typeof j.bytes === 'number' ? j.bytes : end;
      if (onProgress) onProgress(offset, file.size);
      if (j.complete) {
        // 4. VERIFIED or not done (DR-0076): the NAS's byte count must equal
        // the file's — only then does the ledger mark it safe.
        if (j.bytes === file.size) {
          markBackedUp(file);
          return { ok: true, bytes: j.bytes, dedup: !!j.dedup };
        }
        return { ok: false, error: 'size-mismatch' };
      }
    }
    return { ok: false, error: 'incomplete' };
  } catch (_) {
    return { ok: false, error: 'network' };
  }
}
