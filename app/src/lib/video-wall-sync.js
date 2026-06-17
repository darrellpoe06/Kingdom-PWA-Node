// =============================================================================
// video-wall-sync — gated fetch + writes for the church's capital projects
// =============================================================================
// The Sanctuary LED Video Wall is the first tracked CAPITAL PROJECT. Its money
// (an invoice total, community donations) is REAL church financial data, so it
// lives ONLY in the gated tables (0030-church-capital-projects.sql), scoped to
// the church instance, RLS owner/admin only. This module is the single door the
// Video Wall page uses to read/write it — modeled on conference-sync/choir-sync.
//
// ACCESS: read + write = owner/admin (financial). getVideoWallAccess() resolves
// signedIn / canSee / canEdit + the tenant. RLS enforces it regardless of the
// client; canSee just hides the empty financial UI from non-staff.
//
// The pure helpers (pixelMath, budgetTotals, donationProgress) carry NO money —
// they are derivations the component + tests share, so the pixel math is proven
// (Verification Doctrine: measure/derive, don't claim).
// =============================================================================
import supabase from './supabase.js';
import { churchInstanceId } from './church-instance.js';

const MM_PER_FOOT = 304.8;

async function currentSession() {
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}
function resolveDisplayName(session, explicit) {
  const trimmed = (explicit || '').trim();
  if (trimmed) return trimmed;
  return session.user.email?.split('@')[0] || 'Member';
}

// --- Pure mappers (DB row -> camelCase; exported for tests) -------------------
export function toProjectShape(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category ?? 'facilities',
    status: row.status ?? 'planning',
    vendor: row.vendor ?? null,
    vendorUrl: row.vendor_url ?? null,
    summary: row.summary ?? null,
    installNote: row.install_note ?? null,
    pledgedTotal: row.pledged_total != null ? Number(row.pledged_total) : null,
    receivedTotal: row.received_total != null ? Number(row.received_total) : null,
    donationNote: row.donation_note ?? null,
    heroImageUrl: row.hero_image_url ?? null,
    sortOrder: row.sort_order ?? 0,
    updatedAt: row.updated_at ?? null,
  };
}
export function toBudgetLineShape(row) {
  return {
    id: row.id,
    projectId: row.project_id,
    label: row.label,
    amount: row.amount != null ? Number(row.amount) : null,
    currency: row.currency ?? 'USD',
    kind: row.kind ?? 'current',
    sourceLabel: row.source_label ?? null,
    sourceUrl: row.source_url ?? null,
    note: row.note ?? null,
    sortOrder: row.sort_order ?? 0,
  };
}

// --- Pure derivations (NO money; shared by component + tests) -----------------

// Pixel-pitch math. P<pitch>mm means `pitch` mm between pixel centers, so the
// pixel count along an edge = physical length / pitch. We derive from the STATED
// physical size; the true count snaps to the installed cabinet grid (typically
// 168 px per 500 mm cabinet for P2.976) and is confirmed from the packing list
// at install. Every assumption is returned, not hidden — so nothing is claimed
// as exact that cannot be derived.
export function pixelMath({ pitchMm, heightFt, widthFtMin, widthFtMax }) {
  const safePitch = Number(pitchMm) > 0 ? Number(pitchMm) : null;
  if (!safePitch) return null;
  const pxFromFeet = (ft) => Math.round((Number(ft) * MM_PER_FOOT) / safePitch);
  const heightPx = pxFromFeet(heightFt);
  const widthPxMin = pxFromFeet(widthFtMin);
  const widthPxMax = pxFromFeet(widthFtMax ?? widthFtMin);
  const mp = (w, h) => +(((w * h) / 1_000_000)).toFixed(2);
  return {
    pitchMm: safePitch,
    heightFt: Number(heightFt),
    widthFtMin: Number(widthFtMin),
    widthFtMax: Number(widthFtMax ?? widthFtMin),
    heightPx,
    widthPxMin,
    widthPxMax,
    megapixelsMin: mp(widthPxMin, heightPx),
    megapixelsMax: mp(widthPxMax, heightPx),
    // A single source machine outputs 4K = 3840x2160 = ~8.29 MP, so the wall is
    // well within one GPU's output — the dual-4070s give headroom + redundancy,
    // not a resolution requirement. (Derived, not asserted.)
    fits4kSingleOutput: widthPxMax <= 3840 && heightPx <= 2160,
    assumptions: [
      `Pixel count derived from pitch (${safePitch} mm) x the STATED physical size (~${Number(heightFt)} ft H x ${Number(widthFtMin)}-${Number(widthFtMax ?? widthFtMin)} ft W).`,
      'True count snaps to the installed cabinet grid (commonly 168 px per 500 mm cabinet for P2.976); confirm from the packing list at install.',
      'Physical dimensions are approximate from the email thread, not a final survey.',
    ],
  };
}

// Budget totals by kind. The REAL current cost sums only `current` lines; NULL
// amounts (not yet quoted) are surfaced separately, never counted as zero-cost.
export function budgetTotals(lines) {
  const list = Array.isArray(lines) ? lines : [];
  const sumKind = (k) =>
    list.filter((l) => l.kind === k && l.amount != null).reduce((s, l) => s + l.amount, 0);
  const unquoted = list.filter((l) => l.kind === 'discussed' && l.amount == null).length;
  return {
    currentTotal: sumKind('current'),
    supersededTotal: sumKind('superseded'),
    discussedTotal: sumKind('discussed'),
    unquotedCount: unquoted,
    hasUnquoted: unquoted > 0,
  };
}

// Donation progress. `known` is false until BG's real figures are entered, so
// the UI shows "awaiting figures" instead of a painted 0% bar.
export function donationProgress({ pledged, received } = {}) {
  const p = pledged != null ? Number(pledged) : null;
  const r = received != null ? Number(received) : null;
  const known = p != null || r != null;
  const pct = p && p > 0 && r != null ? Math.min(100, Math.round((r / p) * 100)) : null;
  const remaining = p != null && r != null ? Math.max(0, +(p - r).toFixed(2)) : null;
  return { pledged: p, received: r, known, pct, remaining };
}

// Editor controls render only for owner/admin; RLS still enforces it.
export function deriveAccess(role) {
  const canEdit = role === 'owner' || role === 'admin';
  return { canEdit, canSee: canEdit };
}

export async function getVideoWallAccess(displayName) {
  const session = await currentSession();
  if (!session) return { signedIn: false, canSee: false, canEdit: false, tenantId: null, role: null };
  const tenantId = await churchInstanceId(displayName);
  if (!tenantId) return { signedIn: true, canSee: false, canEdit: false, tenantId: null, role: null };
  const { data: role } = await supabase.rpc('user_role_in_instance', { tenant_uuid: tenantId });
  const { canEdit, canSee } = deriveAccess(role);
  return { signedIn: true, canSee, canEdit, tenantId, role: role ?? null };
}

// --- Generic fetch + realtime subscribe (same pattern as conference-sync) -----
function makeSubscriber(table, mapRow, orderBy) {
  return function subscribe(onChange) {
    let channel = null;
    let cancelled = false;
    (async () => {
      const session = await currentSession();
      if (!session || cancelled) return;
      const fetchAll = async () => {
        const q = supabase.from(table).select('*');
        const { data, error } = orderBy ? await q.order(orderBy.col, { ascending: orderBy.asc }) : await q;
        if (error) { console.warn(`[video-wall-sync] ${table} fetch failed:`, error); return null; }
        return (data || []).map((r) => mapRow(r));
      };
      const initial = await fetchAll();
      if (initial && !cancelled) onChange(initial);
      channel = supabase
        .channel(`${table}-stream`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
          fetchAll().then((rows) => { if (rows && !cancelled) onChange(rows); });
        })
        .subscribe();
    })();
    return function unsubscribe() {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  };
}

export const subscribeProjects = makeSubscriber('church_capital_projects', toProjectShape, { col: 'sort_order', asc: true });
export const subscribeBudgetLines = makeSubscriber('church_capex_budget_lines', toBudgetLineShape, { col: 'sort_order', asc: true });

// --- Writes (RLS-enforced; fail soft + surface to caller) --------------------
async function writeContext(displayName) {
  const session = await currentSession();
  if (!session) return { error: 'signed-out' };
  const tenantId = await churchInstanceId(displayName);
  if (!tenantId) return { error: 'no-church' };
  return { tenantId, userId: session.user.id, displayName: resolveDisplayName(session, displayName) };
}

export async function saveProject(project, displayName) {
  const ctx = await writeContext(displayName);
  if (ctx.error) return { skipped: ctx.error };
  const row = {
    name: project.name ?? '',
    category: project.category ?? 'facilities',
    status: project.status ?? 'planning',
    vendor: project.vendor ?? null,
    vendor_url: project.vendorUrl ?? null,
    summary: project.summary ?? null,
    install_note: project.installNote ?? null,
    pledged_total: project.pledgedTotal != null ? project.pledgedTotal : null,
    received_total: project.receivedTotal != null ? project.receivedTotal : null,
    donation_note: project.donationNote ?? null,
    hero_image_url: project.heroImageUrl ?? null,
    sort_order: project.sortOrder ?? 0,
  };
  if (project.id) {
    const { error } = await supabase.from('church_capital_projects').update({ ...row, updated_by: ctx.userId }).eq('id', project.id);
    return error ? { skipped: 'update-error', error } : { saved: true, id: project.id };
  }
  const { data, error } = await supabase
    .from('church_capital_projects')
    .insert({ ...row, slug: project.slug || 'project', instance_id: ctx.tenantId, created_by: ctx.userId })
    .select('id').single();
  return error ? { skipped: 'insert-error', error } : { saved: true, id: data?.id };
}

export async function saveBudgetLine(line, projectId, displayName) {
  const ctx = await writeContext(displayName);
  if (ctx.error) return { skipped: ctx.error };
  const row = {
    label: line.label ?? '',
    amount: line.amount != null ? line.amount : null,
    currency: line.currency ?? 'USD',
    kind: line.kind ?? 'current',
    source_label: line.sourceLabel ?? null,
    source_url: line.sourceUrl ?? null,
    note: line.note ?? null,
    sort_order: line.sortOrder ?? 0,
  };
  if (line.id) {
    const { error } = await supabase.from('church_capex_budget_lines').update({ ...row, updated_by: ctx.userId }).eq('id', line.id);
    return error ? { skipped: 'update-error', error } : { saved: true, id: line.id };
  }
  const { data, error } = await supabase
    .from('church_capex_budget_lines')
    .insert({ ...row, project_id: projectId, instance_id: ctx.tenantId, created_by: ctx.userId })
    .select('id').single();
  return error ? { skipped: 'insert-error', error } : { saved: true, id: data?.id };
}

export async function deleteBudgetLine(id) {
  const { error } = await supabase.from('church_capex_budget_lines').delete().eq('id', id);
  return error ? { skipped: 'delete-error', error } : { deleted: true };
}
