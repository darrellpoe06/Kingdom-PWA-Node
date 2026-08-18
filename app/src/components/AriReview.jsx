// =============================================================================
// AriReview — Ari's comprehensive, cloud-runnable review of the whole app
// =============================================================================
// Darrell 2026-07-11: "We need Ari to have better comprehensive reviews of the
// PoeTech App." This is the surface for lib/ari-app-review.js: Ari synthesizes
// the app's OWN real records into a ranked, dimensional health read — delivery
// integrity (board vs the build record), plan health (undated / overdue), review
// freshness (dated re-reviews), concern & feedback backlog, and data integrity —
// running anywhere the app runs (no NAS, no diff).
//
// EVIDENCE, NOT CLAIMS (DR-0076): every finding shows the real count + source it
// was computed from; a clean dimension reads "clear", never a painted score.
// COLOR THEOLOGY (DR-0099): true red is reserved for the Blood — severities use
// the app's established tokens (brick / terracotta / olive / muted), never red.
// Theme CLASSES + rem only, so the global text-size control scales it.
// =============================================================================
import React, { useMemo, useState, useEffect } from 'react';
import { useBoardTasks } from '../lib/use-board-tasks.js';
import { fetchWaysBrain } from '../lib/ways-brain.js';
import { SectionTitle } from './shared.jsx';
import { buildAppReview, reviewHeadline } from '../lib/ari-app-review.js';
import { fleetOversight } from '../lib/agent-brakes.js';
import { REVIEW_WATCHER_MEMBER } from '../lib/review-watcher.js';
import { adjustmentsSummary, ADJUSTMENTS_DOCTRINE } from '../lib/ari-adjustments.js';
import { runAriLoop, loopHeadline } from '../lib/ari-loop.js';
import { ARI } from '../lib/ari.js';
import { normalizeWaysPrinciples } from '../lib/ways-principles.js';

// Build-time-injected repo ledgers (same globals PerpetualReport reads); the
// items feed the re-review freshness dimension. Guarded so a test/SSR context
// without the define plugin degrades to empty, never throws.
const DR_LEDGER = (typeof __DR_LEDGER__ !== 'undefined') ? __DR_LEDGER__ : { items: [] };
// The binding-principle registry (docs/decisions/PRINCIPLES.md), baked at build
// (DR-0219 — the Ways surfaced live). Read once, honest-empty off-build/in-test.
const DR_PRINCIPLES = (typeof __DR_PRINCIPLES__ !== 'undefined') ? __DR_PRINCIPLES__ : { items: [] };
const UIUX_REVIEWS = (typeof __UIUX_REVIEWS__ !== 'undefined') ? __UIUX_REVIEWS__ : { items: [] };

// Severity -> established app tokens. NOT true red (Color Theology): brick for
// the most serious, terracotta to address, muted for minor, olive for clear.
const SEV = {
  bug: { label: 'Critical', dot: 'bg-[#7A1F1F]', text: 'text-[#7A1F1F]' },
  warning: { label: 'To address', dot: 'bg-[#B85838]', text: 'text-[#B85838]' },
  nit: { label: 'Minor', dot: 'bg-[#5A5751]', text: 'text-[#5A5751]' },
  ok: { label: 'Clear', dot: 'bg-[#5A6E3D]', text: 'text-[#5A6E3D]' },
};
const sevMeta = (s) => SEV[s] || SEV.nit;

function StatusDot({ status }) {
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${sevMeta(status).dot}`} aria-hidden="true" />;
}

function FindingRow({ f }) {
  const m = sevMeta(f.severity);
  return (
    <li className="border-l-2 pl-3 py-1.5" style={{ borderColor: 'currentColor' }}>
      <div className="flex items-start gap-2">
        <StatusDot status={f.severity} />
        <div className="flex-1">
          <p className="text-sm text-[#1A1815] leading-snug" style={{ fontFamily: 'Fraunces, serif' }}>{f.title}</p>
          {f.evidence && <p className="text-[0.6875rem] text-[#5A5751] mt-0.5">Evidence: {f.evidence}</p>}
          {f.action && <p className={`text-[0.75rem] mt-0.5 ${m.text}`}>→ {f.action}</p>}
        </div>
        <span className={`text-[0.5625rem] uppercase tracking-wider ${m.text} whitespace-nowrap`}>{m.label}</span>
      </div>
    </li>
  );
}

export default function AriReview({ concerns = [], feedback = [], transactions = [], rentals = [], debts = [], demoRowIds = null }) {
  const { tasks } = useBoardTasks();

  const review = useMemo(() => buildAppReview({
    tasks: tasks || [],
    concerns, feedback,
    reviews: Array.isArray(UIUX_REVIEWS.items) ? UIUX_REVIEWS.items : [],
    decisions: Array.isArray(DR_LEDGER.items) ? DR_LEDGER.items : [],
    transactions, rentals, debts, demoRowIds,
    // The app-native agent fleet under Ari's oversight — brake coverage only
    // ever from proven declarations (DR-0225). The n8n workflow registry was
    // removed with the artifacts themselves (DR-0218 zero-n8n, 2026-08-16).
    fleet: fleetOversight({ agents: [REVIEW_WATCHER_MEMBER] }),
  }, Date.now()), [tasks, concerns, feedback, transactions, rentals, debts, demoRowIds]);

  const overall = sevMeta(review.summary.status);
  const comp = review.completion;
  // The binding Ways. FLOOR = the build-time snapshot of PRINCIPLES.md (always
  // present). ENHANCEMENT = the LIVE sovereign brain (/ways/brain.json), fresher
  // + the open re-review backlog, fetched honest-offline (DR-0219). If the live
  // brain is reachable we prefer it; otherwise the snapshot stands.
  const snapshot = useMemo(() => normalizeWaysPrinciples(DR_PRINCIPLES), []);
  const [brain, setBrain] = useState(null);
  useEffect(() => {
    let cancelled = false;
    fetchWaysBrain().then((b) => { if (!cancelled && b.live) setBrain(b); });
    return () => { cancelled = true; };
  }, []);
  const ways = (brain && brain.live && brain.principles.length)
    ? { ok: true, count: brain.principles.length, items: brain.principles }
    : snapshot;
  const waysLive = !!(brain && brain.live);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <SectionTitle eyebrow={`${ARI.name} · comprehensive review`}>How the app is really doing</SectionTitle>
      </div>

      {/* Headline: the one-line read + the honest completion context */}
      <div className="border border-[#E8E4DC] bg-[#FAF8F4] rounded-lg p-4">
        <div className="flex items-center gap-2">
          <StatusDot status={review.summary.status} />
          <p className={`text-sm font-medium ${overall.text}`}>{reviewHeadline(review)}</p>
        </div>
        <p className="text-[0.6875rem] text-[#5A5751] mt-2">
          Live over the app&rsquo;s own records — {comp.done}/{comp.total} board items done
          {comp.pct != null ? ` (${comp.pct}%)` : ''}. Ari re-runs this every time you open it; nothing here is typed in.
        </p>
        {review.summary.total > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {['bug', 'warning', 'nit'].map((s) => review.summary.counts[s] > 0 && (
              <span key={s} className={`text-[0.6875rem] px-2 py-0.5 rounded-full border border-[#E8E4DC] ${sevMeta(s).text}`}>
                {review.summary.counts[s]} {sevMeta(s).label.toLowerCase()}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* The binding Ways — the principles that govern this build, live from the
          repo's PRINCIPLES.md (baked at build; DR-0219). So the Ways drive the
          app in-session even when Claude Code isn't — shown, not just cited. */}
      {ways.ok && (
        <div className="border border-[#E8E4DC] bg-white rounded-lg p-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold">
              Binding Ways &middot; {ways.count} principle{ways.count === 1 ? '' : 's'}
            </div>
            <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] shrink-0">
              {waysLive
                ? `live${brain.counts.open_re_reviews ? ` · ${brain.counts.open_re_reviews} open re-review${brain.counts.open_re_reviews === 1 ? '' : 's'}` : ''}`
                : 'from this build'}
            </span>
          </div>
          <div className="max-h-64 overflow-y-auto -mx-1 px-1">
            <ul className="space-y-2">
              {ways.items.map((p) => (
                <li key={p.id} className="text-sm text-[#1A1815]">
                  <span className="text-[0.6875rem] uppercase tracking-wider text-[#3F5226] font-semibold">{p.id}</span>
                  <span className="text-[#5A5751]"> &mdash; {p.summary}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-[0.6875rem] text-[#5A5751] mt-2">
            The cite-once Ways from <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>PRINCIPLES.md</span> &mdash; from the sovereign brain <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>/ways/brain.json</span> when reachable, else this build&rsquo;s snapshot. Shown in the app, not just cited in commits.
          </p>
        </div>
      )}

      {/* THE ONE ACTION QUEUE — "Pull these next" and Ari's MAPE-K loop merged
          into a single list (DR-0243, Darrell 2026-07-29: "data hidden because
          it just keeps going and duplicate information"). One item renders ONCE:
          the queue here, the evidence in its dimension card below — never a
          third copy. The shared per-item boilerplate reason is stated once
          under the header; only a DIFFERENT reason renders inline. */}
      {(() => {
        const adj = adjustmentsSummary(review.findings);
        if (adj.autoCount === 0 && adj.proposeCount === 0) return null;
        const loop = runAriLoop(review, Date.now());
        const GENERIC = 'Needs human judgment or isn’t provably safe to apply automatically.';
        const QUEUE_CAP = 7;
        const shown = adj.propose.slice(0, QUEUE_CAP);
        const rest = adj.proposeCount - shown.length;
        return (
          <div className="border border-[#E8E4DC] bg-white rounded-lg p-4">
            <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-1">
              Pull these next &middot; {ARI.name}&rsquo;s loop (MAPE-K)
            </div>
            <p className="text-sm text-[#1A1815] font-medium">{loopHeadline(loop)}</p>
            <p className="text-[0.6875rem] text-[#5A5751] mt-0.5">
              Monitor &rarr; Analyze &rarr; Plan &rarr; Execute &rarr; Knowledge &middot; {loop.metrics.stpRate}% straight-through &middot; items marked &bull; need your judgment; the evidence for each lives in its dimension card below.
            </p>
            {adj.autoCount > 0 && (
              <div className="mt-3">
                <div className="text-[0.6875rem] uppercase tracking-wider text-[#3F5226] font-semibold mb-1">{ARI.name} applied safely ({adj.autoCount})</div>
                <ul className="space-y-1">
                  {adj.auto.map((a, i) => (
                    <li key={i} className="text-[0.8125rem] text-[#1A1815] leading-relaxed">
                      <span className="text-[#3F5226]">&#10003;</span> {a.action || a.title}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {adj.proposeCount > 0 && (
              <div className="mt-3">
                <div className="text-[0.6875rem] uppercase tracking-wider text-[#B45309] font-semibold mb-1">Needs your call ({adj.proposeCount})</div>
                <ul className="space-y-1">
                  {shown.map((a, i) => (
                    <li key={i} className="text-[0.8125rem] text-[#1A1815] leading-relaxed">
                      <span className="text-[#B45309]">&bull;</span> {a.action || a.title}
                      {a.reason && a.reason !== GENERIC && (
                        <span className="text-[0.6875rem] text-[#8A857C]"> &mdash; {a.reason}</span>
                      )}
                    </li>
                  ))}
                </ul>
                {rest > 0 && (
                  <p className="text-[0.6875rem] text-[#5A5751] mt-1">…and {rest} more — the dimension cards below carry every one, with evidence.</p>
                )}
              </div>
            )}
            <p className="text-[0.625rem] text-[#8A857C] mt-3 leading-relaxed">{ADJUSTMENTS_DOCTRINE}</p>
          </div>
        );
      })()}

      {/* Ari recommends — data-derived upgrades only Ari could know (from the
          whole live picture, not a typed tip). Directed by Darrell 2026-07-23. */}
      {Array.isArray(review.recommendations) && review.recommendations.length > 0 && (
        <div className="border border-[#3F5226] bg-white rounded-lg p-4">
          <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#3F5226] font-semibold mb-2">{ARI.name} recommends &middot; upgrades from your data</div>
          <ul className="space-y-2.5">
            {review.recommendations.map((r, i) => (
              <li key={i} className="text-sm text-[#1A1815]">
                <div className="flex items-start gap-2">
                  <span className="text-[0.5625rem] uppercase tracking-wider text-[#3F5226] font-semibold shrink-0 mt-1">{r.area}</span>
                  <div>
                    <p className="leading-relaxed">{r.recommendation}</p>
                    <p className="text-[0.6875rem] text-[#5A5751] mt-0.5">Basis: {r.basis}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}


      {/* Per-dimension detail */}
      <div className="space-y-3">
        {review.dimensions.map((d) => {
          const m = sevMeta(d.status);
          return (
            <div key={d.key} className="border border-[#E8E4DC] bg-white rounded-lg p-4">
              <div className="flex items-center gap-2">
                <StatusDot status={d.status} />
                <h3 className="text-base font-semibold text-[#1A1815]" style={{ fontFamily: 'Fraunces, serif' }}>{d.label}</h3>
                <span className={`text-[0.5625rem] uppercase tracking-wider ${m.text} ml-auto`}>{m.label}</span>
              </div>
              <p className="text-[0.6875rem] text-[#5A5751] mt-1">{d.question}</p>
              {d.findings.length > 0 ? (
                <ul className="mt-3 space-y-1">
                  {d.findings.map((f, i) => <FindingRow key={i} f={f} />)}
                </ul>
              ) : (
                <p className="text-[0.75rem] text-[#5A6E3D] mt-2">Clear — no open findings in this dimension.</p>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[0.625rem] text-[#5A5751]">
        Advisory, and complete over these five dimensions — it composes the app&rsquo;s real records (board work vs the build
        record, the plan&rsquo;s dates, the re-review ledger, open concerns &amp; feedback, and derived data contradictions).
        The deterministic CI gates remain the merge brake; this is Ari&rsquo;s read for the family, not a gate.
      </p>
    </div>
  );
}
