// =============================================================================
// ReviewFeed — the in-app Governor "Review" surface (DR-0061 / DR-0065)
// =============================================================================
// Shows the freshness loop's staged proposals (DR-0072): each is a summary the
// LOCAL model produced from a link the family saved, optionally cross-checked by
// a vendor model. This is where the Governor reviews what the always-on loop is
// flowing — REAL runtime data from the NAS, fetched live (not a build-time
// snapshot like the decision queue). An empty feed says so honestly; it never
// paints rows (DR-0061: a surface is a live view of real state).
//
// DATA + AUTH (Reality-Trace, CLAUDE.md):
//   - Real data: GET {N8N_BASE}/webhook/review-feed -> wf-review-feed reads the
//     real /data/finance-events/_freshness/*.json files the v1 loop writes.
//   - This endpoint carries ONLY low-sensitivity PUBLIC-web summaries. Family
//     feedback (family-private data) is deliberately NOT served here — its
//     canonical home is the Supabase `feedback` table, read via RLS in its own
//     panels (feedback-sync.js). Keeping private data off this endpoint is what
//     lets a build-time shared token be an appropriate speed-bump here,
//     consistent with N8N-WEBHOOK-AUTH-PATTERN.md (true per-session auth for
//     every webhook arrives together at L12, the multi-user auth layer).
//   - Governor-gated at the call site (Projects.jsx), like the decision queue:
//     the loop output is family-internal oversight, not a public surface.
import React, { useEffect, useState } from 'react';
import { N8N_BASE } from '../lib/n8n-base.js';

// Build-time shared token (Vite inlines VITE_-prefixed vars). NOT a per-user
// secret — a speed-bump paired with the Governor gate. See the header note.
const REVIEW_TOKEN = (import.meta.env?.VITE_REVIEW_TOKEN || '').trim();

// Pure shape-normalizer (exported for tests): tolerate a missing/garbled
// response so the surface degrades gracefully instead of throwing on bad data.
export function normalizeReviewFeed(raw) {
  const r = raw && typeof raw === 'object' ? raw : {};
  const freshness = Array.isArray(r.freshness)
    ? r.freshness.filter((it) => it && it.id)
    : [];
  return { ok: r.ok === true, count: freshness.length, freshness };
}

// A vendor_synthesis that begins with "(vendor" is the graceful-degradation
// note the loop writes when the vendor was over-quota/offline — not a real
// cross-check. Treat it as "pending" rather than rendering it as synthesis.
export function isPendingSynthesis(v) {
  const s = (v || '').toString().trim();
  return !s || s.charAt(0) === '(';
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!REVIEW_TOKEN) {
        if (!cancelled) setState({ status: 'unconfigured', data: null, error: null });
        return;
      }
      try {
        const res = await fetch(`${N8N_BASE}/webhook/review-feed`, {
          method: 'GET',
          headers: { 'X-Review-Token': REVIEW_TOKEN },
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

  const { status, data, error } = state;

  return (
    <div className="space-y-4">
      <section className="bg-white border-2 border-[#1A1815] p-4 sm:p-5">
        <div className="text-[10px] uppercase tracking-[0.3em] text-[#5A6E3D] font-semibold">🔄 Review · What the freshness loop is flowing</div>
        <p className="text-sm mt-1 text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
          When you save a link, the local AI reads it and stages a short summary of the current best practice it asserts — optionally cross-checked by a vendor model. They wait here for your eyes. Nothing is auto-applied to the system; you decide what becomes a change. Family feedback lives in its own panels, not here.
        </p>
      </section>

      {status === 'loading' && (
        <div className="bg-white border border-[#E8E4DC] p-6 text-center">
          <p className="text-sm text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>Loading the staged proposals…</p>
        </div>
      )}

      {status === 'unconfigured' && (
        <div className="bg-white border border-[#8B6F47] p-4">
          <p className="text-sm text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
            The review feed isn&apos;t wired up in this build yet (no <code className="text-xs">VITE_REVIEW_TOKEN</code>). Once it&apos;s set in the deploy environment, staged proposals will appear here automatically.
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
            const pending = isPendingSynthesis(p.vendor_synthesis);
            return (
              <div key={p.id} className="bg-white border-l-4 border border-[#E8E4DC] p-4" style={{ borderLeftColor: '#5A6E3D' }}>
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
                {pending ? (
                  <p className="text-[11px] text-[#5A5751] italic mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
                    <span className="uppercase tracking-wider text-[10px] mr-1">Vendor cross-check ·</span>pending (local summary stands)
                  </p>
                ) : (
                  <p className="text-xs text-[#5A6E3D] mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
                    <span className="uppercase tracking-wider text-[10px] mr-1">Vendor cross-check ·</span>{p.vendor_synthesis}
                  </p>
                )}
                {p.note && (
                  <p className="text-[11px] text-[#5A5751] italic mt-1" style={{ fontFamily: '"Fraunces", serif' }}>Note · {p.note}</p>
                )}
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
