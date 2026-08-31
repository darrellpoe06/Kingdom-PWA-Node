// =============================================================================
// showcase — the gallery lane (0092): her work, front-screen, factory-reusable
// =============================================================================
// Thin client over the 0092 RPCs + the public bucket. Reads are anon-safe;
// writes are steward-gated server-side. sortPieces is pure (pinned favorites
// first, then newest — "sorted by whatever makes sense").
// =============================================================================
import supabase from './supabase.js';
import { publicRpc } from './public-rpc.js';
import { compressImageToFile, isLikelyImageFile } from './image.js';

const BUCKET = 'moore-showcase';

// Public read rides publicRpc (anon + hard deadline), NEVER the shared client:
// the shared client's getSession() waits on a cross-tab auth lock, and a wedged
// PoeTech window on the same device hangs it forever (the 2026-07-07 "gallery
// never loads" hang). Steward WRITES below keep the real client — they need
// the session.
export async function fetchShowcase(instanceSlug) {
  const { data, error } = await publicRpc('moore_showcase', { p_instance_slug: instanceSlug });
  if (error) return { ok: false, pieces: [] };
  return { ok: true, pieces: data || [] };
}

// THE BLOB BRIDGE (2026-08-31, the "what happened to the images" regression).
// The sovereign repoint (REPOINT-ARMED 2026-08-19 / DR-0310) moved the app's
// backend to https://poetech.us/sb. It moved the ROWS. It did NOT move the
// blobs: infra/nas-supabase/cutover_sync.py names "3 buckets / 455 objects" a
// recorded NOT-done, on purpose (copying storage.objects rows without their
// files fabricates working-looking links). So from that deploy on, every
// getPublicUrl() built .../sb/storage/v1/object/public/moore-showcase/... at a
// sovereign storage that has no such bucket -> 404 on every gallery image,
// while the hosted project's logs stayed silent because the app had stopped
// talking to it at all. Titles and prices still rendered (they are rows).
//
// VITE_PUBLIC_STORAGE_URL is the bridge: PUBLIC-bucket blobs keep resolving at
// the origin that still HOLDS them, while everything else stays sovereign.
// Unset (the un-armed build, and every local dev run) = the client's own
// origin, exactly as before. DELETE the workflow line that sets it the day the
// blob copy lands, and images follow the sovereign backend with no code change.
// re-review: 2026-09-30
export function publicStorageOrigin() {
  const raw = import.meta.env.VITE_PUBLIC_STORAGE_URL;
  if (typeof raw !== 'string' || !/^https?:\/\//.test(raw)) return null;
  return raw.replace(/\/+$/, '');
}

export function showcaseImageUrl(imagePath) {
  if (!imagePath) return null;
  if (/^https?:\/\//.test(imagePath)) return imagePath;
  const origin = publicStorageOrigin();
  if (origin) {
    // Same shape supabase-js builds, per-segment encoded (a path is
    // `<instance-slug>/<piece-slug>.<ext>`, so the slashes are structural).
    const encoded = String(imagePath).replace(/^\/+/, '').split('/').map(encodeURIComponent).join('/');
    return `${origin}/storage/v1/object/public/${BUCKET}/${encoded}`;
  }
  try {
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(imagePath);
    return data?.publicUrl || null;
  } catch { return null; }
}

// Steward: upload the image file, then register the piece (instance pinned
// server-side by the RPC). Returns { ok } or a structured error.
export async function addPiece({ instanceSlug, title, description = '', productType = 'other', file, priceCents = null }) {
  if (!file || !title?.trim()) return { ok: false, error: 'title-and-image-required' };
  const slug = `sp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  // Bound the bytes AT UPLOAD (2026-08-31). Shay uploads straight off a phone,
  // so the bucket had 10.6 MB and 7.3 MB originals being painted into ~180px
  // grid thumbnails. A transform URL can't fix that here — the sovereign stack
  // runs no imgproxy — so the file itself is bounded before it lands.
  // Best-effort by design: a decoder that can't read this device's format
  // (HEIC on an old browser) uploads the ORIGINAL rather than failing her post.
  let upload = file;
  if (isLikelyImageFile(file)) {
    try { upload = await compressImageToFile(file); } catch { upload = file; }
  }
  const ext = (upload.name || 'jpg').split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const path = `${instanceSlug}/${slug}.${ext}`;
  const up = await supabase.storage.from(BUCKET).upload(path, upload, { upsert: false });
  if (up.error) return { ok: false, error: up.error.message || 'upload-failed' };
  const { error } = await supabase.rpc('add_showcase_piece', {
    p_instance_slug: instanceSlug, p_slug: slug, p_title: title,
    p_description: description, p_product_type: productType, p_image_path: path,
    p_price_cents: priceCents,
  });
  if (error) return { ok: false, error: error.message || 'register-failed' };
  return { ok: true, slug };
}

// Edit an EXISTING piece in place — title/description/price, no re-upload
// (Shay 2026-07-08: old pieces needed delete-and-re-add just to get a price).
// A null priceCents honestly clears the price.
export async function updatePiece({ instanceSlug, slug, title, description = '', priceCents = null }) {
  if (!slug || !title?.trim()) return { ok: false, error: 'title-required' };
  const { data, error } = await supabase.rpc('update_showcase_piece', {
    p_instance_slug: instanceSlug, p_slug: slug, p_title: title,
    p_description: description, p_price_cents: priceCents,
  });
  if (error) return { ok: false, error: error.message || 'update-failed' };
  return { ok: data === true };
}

// Dollars-string → cents, honestly: '' / garbage → null (no price), never 0.
export function priceInputToCents(raw) {
  const t = String(raw ?? '').replace(/[$,\s]/g, '');
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

export async function setPin(instanceSlug, slug, pinned) {
  const { error } = await supabase.rpc('set_showcase_pin', { p_instance_slug: instanceSlug, p_slug: slug, p_pinned: pinned });
  return { ok: !error };
}
export async function removePiece(instanceSlug, slug) {
  const { error } = await supabase.rpc('delete_showcase_piece', { p_instance_slug: instanceSlug, p_slug: slug });
  return { ok: !error };
}

// Pure: pinned favorites first, then newest. The RPC already orders this way;
// re-sorting client-side keeps the rule true after local pin toggles too.
export function sortPieces(pieces = []) {
  return [...(pieces || [])].sort((a, b) => {
    if (!!b.pinned !== !!a.pinned) return b.pinned ? 1 : -1;
    return String(b.created_at || '').localeCompare(String(a.created_at || ''));
  });
}
