// =============================================================================
// showcase — the gallery lane (0092): her work, front-screen, factory-reusable
// =============================================================================
// Thin client over the 0092 RPCs + the public bucket. Reads are anon-safe;
// writes are steward-gated server-side. sortPieces is pure (pinned favorites
// first, then newest — "sorted by whatever makes sense").
// =============================================================================
import supabase from './supabase.js';
import { publicRpc } from './public-rpc.js';

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

export function showcaseImageUrl(imagePath) {
  if (!imagePath) return null;
  if (/^https?:\/\//.test(imagePath)) return imagePath;
  try {
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(imagePath);
    return data?.publicUrl || null;
  } catch { return null; }
}

// Steward: upload the image file, then register the piece (instance pinned
// server-side by the RPC). Returns { ok } or a structured error.
export async function addPiece({ instanceSlug, title, description = '', productType = 'other', file }) {
  if (!file || !title?.trim()) return { ok: false, error: 'title-and-image-required' };
  const slug = `sp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const ext = (file.name || 'jpg').split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const path = `${instanceSlug}/${slug}.${ext}`;
  const up = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
  if (up.error) return { ok: false, error: up.error.message || 'upload-failed' };
  const { error } = await supabase.rpc('add_showcase_piece', {
    p_instance_slug: instanceSlug, p_slug: slug, p_title: title,
    p_description: description, p_product_type: productType, p_image_path: path,
  });
  if (error) return { ok: false, error: error.message || 'register-failed' };
  return { ok: true, slug };
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
