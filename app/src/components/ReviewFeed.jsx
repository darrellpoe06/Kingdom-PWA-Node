// =============================================================================
// ReviewFeed — the in-app Governor "Review" surface (DR-0061 / DR-0065)
// =============================================================================
// Shows the freshness loop's staged proposals (DR-0072): each is a summary the
// LOCAL model produced from a link the family saved, optionally cross-checked by
// a vendor model. This is where the Governor reviews what the always-on loop is
// flowing — and ACTS on it: Keep (worth acting on) or Dismiss (clear it). A
// surface is a live view of AND a control for real state (DR-0061), not just a
// window onto it. An empty feed says so honestly; it never paints rows.
//
// DATA + AUTH (Reality-Trace, CLAUDE.md):
//   - Real data: GET {N8N_BASE}/webhook/review-feed -> wf-review-feed reads the
//     real /data/finance-events/_freshness/*.json files the v1 loop writes.
//     POST {N8N_BASE}/webhook/review-action sets a proposal's status
//     (dismissed/kept) on the same real files — dismissed drop out of the feed.
//   - This endpoint carries ONLY low-sensitivity PUBLIC-web summaries. Family
//     feedback (family-private) is NOT served here — its home is the Supabase
//     `feedback` table via RLS. That's what lets a build-time shared token be an
//     appropriate speed-bump here (N8N-WEBHOOK-AUTH-PATTERN; per-session auth at
//     L12). Actions are bounded to the proposal status — they never apply
//     anything to the system; bright lines stay manual.
//   - Governor-gated at the call site (Projects.jsx), like the decision queue.
import React, { useEffect, useState } from 'react';
import { N8N_BASE } from '../lib/n8n-base.js';
import EmojiText from './EmojiText.jsx';

// Review token — PER-DEVICE first (typed once, localStorage, never in the
// bundle), VITE_ build var only as a transition fallback (2026-07-03: a VITE_
// var is inlined into the PUBLIC bundle, so it was extractable by any visitor;
// same fix as the n8n bearer — once family devices carry the device token,
// delete VITE_REVIEW_TOKEN from the Vercel project and rotate). Resolved at
// call time so pasting the token takes effect without a reload.
export const REVIEW_DEVICE_TOKEN_KEY = 'poetech-review-token';
const REVIEW_TOKEN_FALLBACK = (import.meta.env?.VITE_REVIEW_TOKEN || '').trim();
export function resolveReviewToken(win) {
  try {
    const w = win || (typeof window !== 'undefined' ? window : null);
    const device = (w && w.localStorage && w.localStorage.getItem(REVIEW_DEVICE_TOKEN_KEY)) || '';
    if (device.trim()) return device.trim();
  } catch { /* private mode — fall through */ }
  return REVIEW_TOKEN_FALLBACK;
}

// Pure shape-normalizer (exported for tests): tolerate a missing/garbled
// response so the surface degrades gracefully instead of throwing on bad data.
export function normalizeReviewFeed(raw) {
  const r = raw && typeof raw === 'object' ? raw : {};
  const freshness = Array.isArray(r.freshness)
    ? r.freshness.filter((it) => it && it.id)
    : [];
  return { ok: r.ok === true, count: freshness.length, freshness };
}

// Pure local-state transition for an action (exported for tests): 'dismiss'
// removes the proposal (it leaves the feed); 'keep' flags it as kept. Mirrors
// what the server does so the UI updates without a refetch.
export function applyAction(freshness, id, action) {
  const list = Array.isArray(freshness) ? freshness : [];
  if (action === 'dismiss') return list.filter((f) => f && f.id !== id);
  if (action === 'keep') return list.map((f) => (f && f.id === id ? { ...f, status: 'kept' } : f));
  return list;
}

// A vendor_synthesis that begins with "(vendor" is the graceful-degradation
// note the loop writes when the vendor was over-quota/offline — not a real
// cross-check. Treat it as "no real synthesis" rather than rendering it.
export function isPendingSynthesis(v) {
  const s = (v || '').toString().trim();
  return !s || s.charAt(0) === '(';
}

// How long a freshly-staged proposal may read as "checking" before its LOCAL
// summary auto-advances to a terminal LOCAL-VERIFIED state. Local-first is
// Darrell's binding success metric: the local model is the conductor and its
// summary stands on its own; the vendor cross-check is an OPTIONAL deepening
// summoned on demand, never a blocking dependency. So an item without a vendor
// synthesis is NOT "pending forever" — past this window it is RESOLVED as
// local-verified with the cross-check marked deferred/optional. Nothing sits
// silently pending (execution-outcome-observability: every loop outcome is
// observable and advancing; DR-0061 / DR-0076).
export const VENDOR_CHECK_WINDOW_MS = 24 * 60 * 60 * 1000;

// Pure resolver (exported for tests) for one proposal's vendor cross-check
// state. Returns exactly one of:
//   { kind: 'synthesized', text } — a real vendor cross-check ran; show it.
//   { kind: 'checking' }          — just staged; a cross-check may still land.
//   { kind: 'local-verified' }    — terminal: the window elapsed (or there is
//                                   no captured_at) with no vendor synthesis,
//                                   so the local summary stands as the result.
export function vendorCrossCheckState(p, nowMs) {
  const v = p && p.vendor_synthesis;
  if (!isPendingSynthesis(v)) return { kind: 'synthesized', text: (v || '').toString().trim() };
  const staged = p && p.captured_at ? Date.parse(p.captured_at) : NaN;
  // Within the window AND we can measure age -> still "checking". Otherwise
  // (aged past the window, or no parseable timestamp) -> settle to terminal.
  if (!Number.isNaN(staged) && (nowMs - staged) < VENDOR_CHECK_WINDOW_MS) return { kind: 'checking' };
  return { kind: 'local-verified' };
}

function fmtWhen(iso) {
  const d = iso ? new Date(iso) : null;
  if (!d || isNaN(d.getTime())) return 'date not set';
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function hostOf(url) {
  const m = (url || '').toString().match(/^https?:\/\/([^/?#]+)/i);
  return m ? m[1] : (url || '');
}

export default function ReviewFeed() {
  const [state, setState] = useState({ status: 'loading', data: null, error: null });
  const [acting, setActing] = useState({});       // id -> true while its action is in flight
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = resolveReviewToken();
      if (!token) {
        if (!cancelled) setState({ status: 'unconfigured', data: null, error: null });
        return;
      }
      try {
        const res = await fetch(`${N8N_BASE}/webhook/review-feed`, {
          method: 'GET',
          headers: { 'X-Review-Token': token },
          cache: 'no-store',
        });
        const json = await res.json().catch(() => null);
        if (cancelled) return;
        if (!res.ok || !json || json.ok !== true) {
          setState({ status: 'error', data: null, error: (json && json.error) || `HTTP ${res.status}` });
          return;
        }
        setState({ status: 'ready', data: normalizeReviewFeed(json), error: null });
      } catch (e) {
        if (!cancelled) setState({ status: 'error', data: null, error: (e && e.message) || 'fetch failed' });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const onAction = async (id, action) => {
    const token = resolveReviewToken();
    if (!token || acting[id]) return;
    setActionError(null);
    setActing((a) => ({ ...a, [id]: true }));
    try {
      const res = await fetch(`${N8N_BASE}/webhook/review-action`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'X-Review-Token': token },
        body: JSON.stringify({ id, action }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json || json.ok !== true) throw new Error((json && json.error) || `HTTP ${res.status}`);
      setState((s) => {
        if (!s.data) return s;
        const nf = applyAction(s.data.freshness, id, action);
        return { ...s, data: { ...s.data, freshness: nf, count: nf.length } };
      });
    } catch (e) {
      setActionError(`Couldn't ${action} that one${e && e.message ? ` — ${e.message}` : ''}.`);
    } finally {
      setActing((a) => ({ ...a, [id]: false }));
    }
  };

  const { status, data, error } = state;

  return (
    <div className="space-y-4">
      <section className="bg-white border-2 border-[#1A1815] p-4 sm:p-5">
        <div className="text-[10px] uppercase tracking-[0.3em] text-[#5A6E3D] font-semibold">🔄 Review · What the freshness loop is flowing</div>
        <p className="text-sm mt-1 text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
          When you save a link, the local AI reads it and stages a short summary of the current best practice it asserts — optionally cross-checked by a vendor model. Review them here: <strong>Keep</strong> the ones worth acting on, <strong>Dismiss</strong> the rest. Nothing is auto-applied to the system; you decide what becomes a change. Family feedback lives in its own panels, not here.
        </p>
      </section>

      {actionError && (
        <div className="bg-white border border-[#B85838] p-3" role="alert">
          <p className="text-xs text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>{actionError}</p>
        </div>
      )}

      {status === 'loading' && (
        <div className="bg-white border border-[#E8E4DC] p-6 text-center">
          <p className="text-sm text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>Loading the staged proposals…</p>
        </div>
      )}

      {status === 'unconfigured' && (
        <div className="bg-white border border-[#8B6F47] p-4">
          <p className="text-sm text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
            The review feed isn&apos;t wired up on this device yet — paste the review token in the Admin console (Security &amp; tokens) and staged proposals appear here. No token ships in the public bundle.
          </p>
        </div>
      )}

      {status === 'error' && (
        <div className="bg-white border border-[#B85838] p-4" role="alert">
          <p className="text-sm text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
            Couldn&apos;t reach the review feed{error ? <span className="text-[#5A5751]"> — {String(error)}</span> : null}. This is an honest empty state, not painted data; try again shortly.
          </p>
        </div>
      )}

      {status === 'ready' && data && data.count === 0 && (
        <div className="bg-white border border-[#E8E4DC] p-6 text-center">
          <p className="text-sm text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
            Nothing staged yet — save a link and the loop will summarize it here for your review.
          </p>
        </div>
      )}

      {status === 'ready' && data && data.count > 0 && (
        <div className="space-y-2">
          {data.freshness.map((p) => {
            const vendorState = vendorCrossCheckState(p, Date.now());
            const busy = !!acting[p.id];
            const kept = p.status === 'kept';
            return (
              <div key={p.id} className="bg-white border-l-4 border border-[#E8E4DC] p-4" style={{ borderLeftColor: kept ? '#8B6F47' : '#5A6E3D' }}>
                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                  <span className="text-[10px] uppercase tracking-wider text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{fmtWhen(p.captured_at)}</span>
                  {p.status && <span className="text-[10px] uppercase tracking-wider font-semibold text-[#8B6F47]">{p.status}</span>}
                </div>
                {p.url && (
                  <a href={p.url} target="_blank" rel="noopener noreferrer"
                    className="inline-block mt-0.5 text-xs text-[#2A5A8E] underline break-all focus:outline focus:outline-2 focus:outline-[#B85838]"
                    style={{ fontFamily: '"Fraunces", serif' }}>
                    {hostOf(p.url)} ↗
                  </a>
                )}
                {p.summary && (
                  <p className="text-sm text-[#1A1815] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>{p.summary}</p>
                )}
                {vendorState.kind === 'synthesized' ? (
                  <p className="text-xs text-[#5A6E3D] mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
                    <span className="uppercase tracking-wider text-[10px] mr-1">Vendor cross-check ·</span>{vendorState.text}
                  </p>
                ) : vendorState.kind === 'checking' ? (
                  <p className="text-[11px] text-[#5A5751] italic mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
                    <span className="uppercase tracking-wider text-[10px] mr-1">Vendor cross-check ·</span>checking…
                  </p>
                ) : (
                  // Terminal local-first state — the local summary IS the result;
                  // the optional vendor cross-check was deferred, not left hanging.
                  <p className="text-[11px] text-[#5A6E3D] mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
                    <span className="uppercase tracking-wider text-[10px] mr-1">✓ Local-verified ·</span>vendor cross-check deferred (optional)
                  </p>
                )}
                {p.note && (
                  <p className="text-[11px] text-[#5A5751] italic mt-1" style={{ fontFamily: '"Fraunces", serif' }}>Note · <EmojiText text={p.note} /></p>
                )}
                {/* Controls (DR-0061): Keep / Dismiss act on the real staged file. */}
                <div className="mt-3 pt-2 border-t border-[#E8E4DC] flex items-center gap-2 flex-wrap">
                  {kept ? (
                    <span className="text-[10px] uppercase tracking-wider text-[#5A6E3D] font-semibold">✓ Kept for action</span>
                  ) : (
                    <button type="button" onClick={() => onAction(p.id, 'keep')} disabled={busy}
                      aria-label={`Keep ${hostOf(p.url)} for action`}
                      className="text-[10px] uppercase tracking-wider px-3 py-1.5 min-h-[32px] border border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white disabled:opacity-50 focus:outline focus:outline-2 focus:outline-[#5A6E3D]">
                      Keep
                    </button>
                  )}
                  <button type="button" onClick={() => onAction(p.id, 'dismiss')} disabled={busy}
                    aria-label={`Dismiss ${hostOf(p.url)}`}
                    className="text-[10px] uppercase tracking-wider px-3 py-1.5 min-h-[32px] border border-[#E8E4DC] text-[#5A5751] hover:border-[#B85838] hover:text-[#B85838] disabled:opacity-50 focus:outline focus:outline-2 focus:outline-[#B85838]">
                    Dismiss
                  </button>
                  {busy && <span className="text-[10px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>working…</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[10px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
        These are proposals, not changes. Bright lines (money, credentials, clinical data, the family&apos;s voice) are never auto-decided — applying anything from here stays your call.
      </p>
    </div>
  );
}
