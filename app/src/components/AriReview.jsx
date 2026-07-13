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
import React, { useMemo } from 'react';
import { useBoardTasks } from '../lib/use-board-tasks.js';
import { SectionTitle } from './shared.jsx';
import { buildAppReview, reviewHeadline } from '../lib/ari-app-review.js';
import { adjustmentsSummary, ADJUSTMENTS_DOCTRINE } from '../lib/ari-adjustments.js';
import { ARI } from '../lib/ari.js';

// Build-time-injected repo ledgers (same globals PerpetualReport reads); the
// items feed the re-review freshness dimension. Guarded so a test/SSR context
// without the define plugin degrades to empty, never throws.
const DR_LEDGER = (typeof __DR_LEDGER__ !== 'undefined') ? __DR_LEDGER__ : { items: [] };
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

export default function AriReview({ concerns = [], feedback = [], transactions = [], rentals = [], debts = [] }) {
  const { tasks } = useBoardTasks();

  const review = useMemo(() => buildAppReview({
    tasks: tasks || [],
    concerns, feedback,
    reviews: Array.isArray(UIUX_REVIEWS.items) ? UIUX_REVIEWS.items : [],
    decisions: Array.isArray(DR_LEDGER.items) ? DR_LEDGER.items : [],
    transactions, rentals, debts,
  }, Date.now()), [tasks, concerns, feedback, transactions, rentals, debts]);

  const overall = sevMeta(review.summary.status);
  const comp = review.completion;

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

      {/* Top actions to pull next */}
      {review.summary.topActions.length > 0 && (
        <div className="border border-[#E8E4DC] bg-white rounded-lg p-4">
          <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-2">Pull these next</div>
          <ul className="space-y-1.5">
            {review.summary.topActions.map((a, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[#1A1815]">
                <StatusDot status={a.severity} />
                <span>{a.action}{a.count ? ` (${a.count})` : ''}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Ari's adjustments — the propose + gated auto-apply split. Ari applies
          the safe, reversible, evidence-backed fixes itself and logs them; the
          rest it proposes for a human (the gate encodes DR-0076). */}
      {(() => {
        const adj = adjustmentsSummary(review.findings);
        if (adj.autoCount === 0 && adj.proposeCount === 0) return null;
        return (
          <div className="border border-[#E8E4DC] bg-white rounded-lg p-4">
            <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-2">{ARI.name} &middot; adjustments</div>
            <p className="text-sm text-[#1A1815] font-medium">{adj.headline}</p>
            {adj.autoCount > 0 && (
              <div className="mt-3">
                <div className="text-[0.6875rem] uppercase tracking-wider text-[#3F5226] font-semibold mb-1">Ari can apply safely ({adj.autoCount})</div>
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
                  {adj.propose.map((a, i) => (
                    <li key={i} className="text-[0.8125rem] text-[#1A1815] leading-relaxed">
                      <span className="text-[#B45309]">&bull;</span> {a.action || a.title} <span className="text-[0.6875rem] text-[#8A857C]">&mdash; {a.reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="text-[0.625rem] text-[#8A857C] mt-3 leading-relaxed">{ADJUSTMENTS_DOCTRINE}</p>
          </div>
        );
      })()}

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
