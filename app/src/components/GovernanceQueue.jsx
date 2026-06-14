// =============================================================================
// GovernanceQueue — the decision queue, inside the app
// =============================================================================
// "Built inside and outside of the app if necessary for comprehensive review
// and continuity of work." (Darrell, 2026-06-13.)
//
// The repo file docs/governance/decision-queue.md is the SINGLE source of truth.
// vite.config parses its OPEN items at build time into __GOVERNANCE_QUEUE__, so
// this surface shows the SAME real file — reviewed in the app, decided in the
// repo (or, later, written back). No second source, no painted data (DR-0061).
//
// Governor-only: the queue names credentials, spend, and Tier-C activations, so
// it renders only for a signed-in family/governor account (isGovernor gate at
// the call site).
import React from 'react';

// Guarded so tests / SSR that don't run the vite define still render.
const QUEUE = (typeof __GOVERNANCE_QUEUE__ !== 'undefined')
  ? __GOVERNANCE_QUEUE__
  : { ok: false, openCount: 0, items: [] };

const REPO_FILE_URL = 'https://github.com/darrellpoe06/Kingdom-PWA-Node/blob/main/docs/governance/decision-queue.md';

// Pure shape-normalizer (exported for tests): tolerate a missing/garbled define.
export function normalizeGovernanceQueue(raw) {
  const q = raw && typeof raw === 'object' ? raw : {};
  const items = Array.isArray(q.items) ? q.items.filter(it => it && it.id) : [];
  return { ok: q.ok === true, openCount: items.length, items };
}

const tierColor = (t) => (t === 'C' ? '#B85838' : t === 'B' ? '#8B6F47' : '#5A6E3D');

export default function GovernanceQueue() {
  const { items, openCount } = normalizeGovernanceQueue(QUEUE);
  return (
    <div className="space-y-4">
      <section className="bg-white border-2 border-[#1A1815] p-4 sm:p-5">
        <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] font-semibold">⚖ Governance · Decisions waiting on you</div>
        <p className="text-sm mt-1 text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
          The work that needs your call, batched so you decide a stack at once instead of one ping at a time. This is the same queue as the repo file — review here, decide there. The AI keeps building everything that doesn&apos;t need you; these are the {openCount} that do.
        </p>
        <a href={REPO_FILE_URL} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-[10px] uppercase tracking-wider text-[#2A5A8E] underline">
          Open the full queue to decide →
        </a>
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
  );
}
