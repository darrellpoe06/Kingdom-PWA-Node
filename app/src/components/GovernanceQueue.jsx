// =============================================================================
// GovernanceQueue — the decision queue + the decided ledger, inside the app
// =============================================================================
// "Built inside and outside of the app if necessary for comprehensive review
// and continuity of work." (Darrell, 2026-06-13.)
//
// Two real sources, both parsed at build time so this surface is fully usable
// with NO external (GitHub) dependency — sovereignty + DR-0065 (the app is the
// primary artifact):
//   • OPEN queue   — docs/governance/decision-queue.md → __GOVERNANCE_QUEUE__
//   • DECIDED ledger — docs/decisions/ (per-DR files + INDEX.md chain table)
//                      → __DR_LEDGER__
// No second source, no painted data, no outbound github.com link (DR-0061).
// The vite define re-parses on every build, so the bundled ledger stays current.
//
// Governor-only: the queue names credentials, spend, and Tier-C activations, so
// it renders only for a signed-in family/governor account (isGovernor gate at
// the call site).
import React from 'react';

// Guarded so tests / SSR that don't run the vite define still render.
const QUEUE = (typeof __GOVERNANCE_QUEUE__ !== 'undefined')
  ? __GOVERNANCE_QUEUE__
  : { ok: false, openCount: 0, items: [] };

const LEDGER = (typeof __DR_LEDGER__ !== 'undefined')
  ? __DR_LEDGER__
  : { ok: false, count: 0, items: [] };

// Pure shape-normalizer (exported for tests): tolerate a missing/garbled define.
export function normalizeGovernanceQueue(raw) {
  const q = raw && typeof raw === 'object' ? raw : {};
  const items = Array.isArray(q.items) ? q.items.filter(it => it && it.id) : [];
  return { ok: q.ok === true, openCount: items.length, items };
}

// Pure shape-normalizer for the decided ledger (exported for tests).
export function normalizeDecisionLedger(raw) {
  const q = raw && typeof raw === 'object' ? raw : {};
  const items = Array.isArray(q.items)
    ? q.items.filter(it => it && it.id).map(it => ({
        id: it.id,
        num: typeof it.num === 'number' ? it.num : 0,
        title: it.title || '',
        date: it.date || '',
        status: (it.status || '').toLowerCase(),
        tier: it.tier || '',
        supersededBy: it.supersededBy || '',
        decision: it.decision || '',
        rationale: it.rationale || '',
        owner: it.owner || '',
        source: it.source || '',
      }))
    : [];
  return { ok: q.ok === true, count: items.length, items };
}

const tierColor = (t) => (t === 'C' ? '#B85838' : t === 'B' ? '#8B6F47' : '#5A6E3D');

// Status pill color — superseded reads muted, accepted reads settled-green.
const statusColor = (s) => (s === 'superseded' ? '#8A6D3B' : s === 'accepted' ? '#5A6E3D' : '#5A5751');

export default function GovernanceQueue() {
  const { items, openCount } = normalizeGovernanceQueue(QUEUE);
  const ledger = normalizeDecisionLedger(LEDGER);
  return (
    <div className="space-y-6">
      {/* ---- OPEN: decisions waiting on the governor ---- */}
      <div className="space-y-4">
        <section className="bg-white border-2 border-[#1A1815] p-4 sm:p-5">
          <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] font-semibold">⚖ Governance · Decisions waiting on you</div>
          <p className="text-sm mt-1 text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
            The work that needs your call, batched so you decide a stack at once instead of one ping at a time. This is the live queue from the repo, rendered here — the AI keeps building everything that doesn&apos;t need you; these are the {openCount} that do.
          </p>
        </section>

        {items.length === 0 ? (
          <div className="bg-white border border-[#E8E4DC] p-6 text-center">
            <p className="text-sm text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
              Nothing waiting on you right now — the queue is clear.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((it) => (
              <div key={it.id} className="bg-white border-l-4 border border-[#E8E4DC] p-4" style={{ borderLeftColor: tierColor(it.tier) }}>
                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                  <span className="text-[10px] uppercase tracking-wider text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{it.id}</span>
                  {it.tier && <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: tierColor(it.tier) }}>Tier {it.tier}</span>}
                </div>
                <h4 className="text-base mt-0.5" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{it.title}</h4>
                {it.unblocks && <p className="text-xs text-[#1A1815] mt-1" style={{ fontFamily: '"Fraunces", serif' }}><span className="uppercase tracking-wider text-[#5A5751] text-[10px]">Unblocks · </span>{it.unblocks}</p>}
                {it.recommendation && <p className="text-xs text-[#5A6E3D] mt-1" style={{ fontFamily: '"Fraunces", serif' }}><span className="uppercase tracking-wider text-[10px]">My rec · </span>{it.recommendation}</p>}
                {it.track && <p className="text-[10px] text-[#5A5751] italic mt-1" style={{ fontFamily: '"Fraunces", serif' }}>Track · {it.track}</p>}
              </div>
            ))}
          </div>
        )}

        <p className="text-[10px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
          Bright lines (money, credentials, clinical data, the family&apos;s voice) are never auto-decided — they always wait here for you.
        </p>
      </div>

      {/* ---- DECIDED: the Decision Record ledger, rendered natively ---- */}
      <div className="space-y-3">
        <section className="bg-white border-2 border-[#1A1815] p-4 sm:p-5">
          <div className="text-[10px] uppercase tracking-[0.3em] text-[#5A6E3D] font-semibold">📜 Governance · Decided — the ledger</div>
          <p className="text-sm mt-1 text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
            Every decision that has landed, in full — number, title, the decision, the why, and the date. {ledger.count > 0 ? `${ledger.count} records` : 'No records'}, read straight from the repo at build time and rendered here. Nothing to open elsewhere.
          </p>
        </section>

        {ledger.items.length === 0 ? (
          <div className="bg-white border border-[#E8E4DC] p-6 text-center">
            <p className="text-sm text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
              The ledger could not be loaded for this build.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {ledger.items.map((dr) => (
              <details key={dr.id} className="bg-white border-l-4 border border-[#E8E4DC] group" style={{ borderLeftColor: tierColor(dr.tier) }}>
                <summary className="p-4 cursor-pointer list-none focus:outline focus:outline-2 focus:outline-[#B85838]">
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <span className="text-[10px] uppercase tracking-wider text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{dr.id}</span>
                    <span className="flex items-center gap-2 flex-wrap">
                      {dr.tier && <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: tierColor(dr.tier) }}>Tier {dr.tier}</span>}
                      {dr.status && (
                        <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: statusColor(dr.status) }}>
                          {dr.status}{dr.supersededBy ? ` → ${dr.supersededBy}` : ''}
                        </span>
                      )}
                      {dr.date && <span className="text-[10px] text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{dr.date}</span>}
                    </span>
                  </div>
                  <h4 className="text-base mt-0.5" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{dr.title || dr.id}</h4>
                </summary>
                <div className="px-4 pb-4 -mt-1 space-y-3">
                  {dr.decision && (
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-[#5A6E3D] font-semibold">Decision</div>
                      <p className="text-xs text-[#1A1815] mt-0.5 whitespace-pre-wrap" style={{ fontFamily: '"Fraunces", serif' }}>{dr.decision}</p>
                    </div>
                  )}
                  {dr.rationale && (
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-[#5A5751] font-semibold">Why</div>
                      <p className="text-xs text-[#5A5751] mt-0.5 whitespace-pre-wrap" style={{ fontFamily: '"Fraunces", serif' }}>{dr.rationale}</p>
                    </div>
                  )}
                  {(dr.owner || dr.source) && (
                    <div className="flex flex-col gap-0.5">
                      {dr.owner && <p className="text-[10px] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}><span className="uppercase tracking-wider">Owner · </span>{dr.owner}</p>}
                      {dr.source && <p className="text-[10px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>Source · {dr.source}</p>}
                    </div>
                  )}
                  {!dr.decision && !dr.rationale && !dr.owner && !dr.source && (
                    <p className="text-xs text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
                      Recorded in the ledger; see the title above for the decision.
                    </p>
                  )}
                </div>
              </details>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
