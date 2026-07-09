// =============================================================================
// watchlist-sync — the Markets ticker watchlist follows the family sign-in
// =============================================================================
// 2026-07-05 live-data rails: the Markets tab's quotes are a live external
// feed, but the WATCHLIST itself (which tickers to quote) was device-local —
// add 'nvda.us' on the phone and the desktop never learns. The list is plain
// strings (Stooq symbols), so the generic table-sync (id-keyed objects) does
// not fit; this is the same fail-soft rail hand-shaped for a string set:
// one row per (instance, symbol) in `market_watchlist` (0077), realtime
// stream, every call a no-op when signed out or before the migration lands.
import supabase from './supabase.js';
import { getInstanceId } from './table-sync.js';

const TABLE = 'market_watchlist';

async function currentSession() {
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

// Normalize the same way the add reducer does — lowercase, trimmed.
export function normalizeSymbol(sym) {
  return (sym || '').trim().toLowerCase();
}

// Merge remote + local symbol lists: union, remote order first (created_at),
// locals that haven't landed yet appended. Pure — tested.
export function mergeWatchlists(local = [], remote = []) {
  const seen = new Set();
  const out = [];
  for (const sym of [...remote, ...local]) {
    const s = normalizeSymbol(sym);
    if (!s || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

async function fetchSymbols() {
  let tenantId;
  try {
    tenantId = await getInstanceId();
  } catch (e) {
    console.warn('[watchlist-sync] tenant lookup failed:', e);
    return null;
  }
  const { data, error } = await supabase
    .from(TABLE)
    .select('symbol, created_at')
    .eq('instance_id', tenantId)
    .order('created_at', { ascending: true });
  if (error) {
    console.warn('[watchlist-sync] fetch failed:', error);
    return null;
  }
  return (data || []).map((r) => r.symbol);
}

export async function uploadSymbol(sym) {
  const session = await currentSession();
  if (!session) return { skipped: 'signed-out' };
  const s = normalizeSymbol(sym);
  if (!s) return { skipped: 'empty' };
  let tenantId;
  try {
    tenantId = await getInstanceId();
  } catch (e) {
    return { skipped: 'no-tenant', error: e };
  }
  // Idempotent: the (instance_id, symbol) unique index makes a duplicate add
  // a conflict, which we treat as already-present (fail-soft, not an error).
  const { error } = await supabase
    .from(TABLE)
    .insert({ instance_id: tenantId, created_by: session.user.id, symbol: s });
  if (error && error.code !== '23505') {
    console.warn('[watchlist-sync] upload failed:', error);
    return { skipped: 'insert-error', error };
  }
  return { uploaded: true };
}

export async function removeSymbol(sym) {
  const session = await currentSession();
  if (!session) return { skipped: 'signed-out' };
  const s = normalizeSymbol(sym);
  let tenantId;
  try {
    tenantId = await getInstanceId();
  } catch (e) {
    return { skipped: 'no-tenant', error: e };
  }
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('instance_id', tenantId)
    .eq('symbol', s);
  if (error) {
    console.warn('[watchlist-sync] delete failed:', error);
    return { skipped: 'delete-error', error };
  }
  return { deleted: true };
}

// On first sign-in push every local symbol the cloud doesn't hold, then hand
// back the merged list (remote ∪ local). Mirrors table-sync initialSync.
export async function initialSyncWatchlist(localSymbols = []) {
  const session = await currentSession();
  if (!session) return { skipped: 'signed-out' };
  const remote = await fetchSymbols();
  if (!remote) return { skipped: 'fetch-failed' };
  const remoteSet = new Set(remote.map(normalizeSymbol));
  for (const sym of localSymbols) {
    const s = normalizeSymbol(sym);
    if (s && !remoteSet.has(s)) await uploadSymbol(s);
  }
  return { merged: mergeWatchlists(localSymbols, remote) };
}

// Fetch-all + realtime stream (RLS-scoped). onRemote(symbols[]) fires with the
// full current list on connect and after every change. Fail-soft signed out.
export function subscribeWatchlist(onRemote) {
  let channel = null;
  let cancelled = false;
  const refresh = () => {
    fetchSymbols().then((symbols) => {
      if (symbols && !cancelled) onRemote(symbols);
    });
  };
  (async () => {
    const session = await currentSession();
    if (!session || cancelled) return;
    refresh();
    let tenantId = null;
    try { tenantId = await getInstanceId(); } catch (_) { /* fetch stays scoped */ }
    if (cancelled) return;
    channel = supabase
      .channel(`${TABLE}-stream`)
      .on(
        'postgres_changes',
        {
          event: '*', schema: 'public', table: TABLE,
          ...(tenantId ? { filter: `instance_id=eq.${tenantId}` } : {}),
        },
        () => refresh()
      )
      .subscribe();
  })();
  return function unsubscribe() {
    cancelled = true;
    if (channel) supabase.removeChannel(channel);
  };
}
