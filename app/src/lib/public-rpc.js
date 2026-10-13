// =============================================================================
// public-rpc — anon reads that can NEVER hang behind the auth machinery
// =============================================================================
// Root cause this exists to kill (Darrell 2026-07-07, "sewing classes haven't
// loaded once"): every supabase-js REST call awaits auth.getSession() before
// sending — and getSession waits on a CROSS-TAB navigator lock shared with
// every other window on this origin (the installed PoeTech PWA included).
// A frozen background app window holding that lock wedges the public door's
// first data byte indefinitely; browser fetch() has no timeout of its own,
// so the UI never even reaches its error branch.
//
// Public door reads (classes, showcase) are forced-safe SECURITY DEFINER RPCs
// granted to anon BY DESIGN — the user's session adds nothing to them. So
// they ride a plain fetch() with the anon key and a hard deadline: no auth-js,
// no locks, no way to hang past the timeout. Steward WRITES keep the real
// client — they genuinely need the session.
// =============================================================================

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const PUBLIC_RPC_TIMEOUT_MS = 12000;

// AbortController + setTimeout (not AbortSignal.timeout) — the door is exactly
// where old IG/FB in-app webviews land, and this pattern works on all of them.
export async function publicRpc(fn, args = {}, { timeoutMs = PUBLIC_RPC_TIMEOUT_MS, fetchImpl = null } = {}) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { data: null, error: { message: 'missing-supabase-env' } };
  }
  const doFetch = fetchImpl || fetch;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await doFetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(args),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      let detail = null;
      try { detail = await res.json(); } catch { /* non-JSON error body */ }
      return { data: null, error: { status: res.status, message: detail?.message || `rpc-${fn}-http-${res.status}` } };
    }
    const data = await res.json();
    return { data, error: null };
  } catch (e) {
    const timedOut = e?.name === 'AbortError';
    return { data: null, error: { message: timedOut ? `rpc-${fn}-timeout` : (e?.message || 'network-error'), timedOut } };
  } finally {
    clearTimeout(timer);
  }
}
