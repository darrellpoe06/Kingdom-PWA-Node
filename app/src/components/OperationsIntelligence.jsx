// =============================================================================
// OperationsIntelligence — Phase 1b: the readouts for PoeTech's OWN operations,
// from the workflows it already runs (DR-0616)
// =============================================================================
// Kept as its own section beside the organization's readouts, never mixed into
// them: these rows are the platform's (health-probe incidents, decision-record
// re-review dates and missing decisions, the family's data loops, hand-offs).
// Every item names its source and says why in one sentence (lib/operations-
// intelligence.js). The incident read goes through lib/site-health.js, the same
// reader the OpsBoard uses; a failed read is said, never painted as zero.
// =============================================================================
import React, { useEffect, useMemo, useState } from 'react';
import { deriveOperations, INCIDENT_HOURS, REPEAT_OBSERVATIONS, DUE_SOON_REVIEW_DAYS } from '../lib/operations-intelligence.js';
import { STALL_DAYS } from '../lib/decision-intelligence.js';
import { fetchSiteHealth } from '../lib/site-health.js';
import { fetchFlowProof, flowEscalations, normalizeGraph } from '../lib/system-flow.js';
import supabase from '../lib/supabase.js';

const LEDGER = (typeof __DR_LEDGER__ !== 'undefined') ? __DR_LEDGER__ : { ok: false, count: 0, items: [] };
const SERIF = { fontFamily: '"Fraunces", serif' };
const MONO = { fontFamily: '"JetBrains Mono", monospace' };
const PANELS = [
  { key: 'escalations', title: 'Escalation · what has stalled', text: 'text-[#B85838]', border: 'border-[#B85838]', empty: 'No open incident, stale loop or waiting hand-off past its threshold.' },
  { key: 'timelineThreats', title: 'Timeline threats · re-reviews due or passed', text: 'text-[#8B6F47]', border: 'border-[#8B6F47]', empty: 'No decision record’s re-review date has passed or falls this week.' },
  { key: 'risks', title: 'Risks · what keeps failing', text: 'text-[#B85838]', border: 'border-[#B85838]', empty: 'No health probe has recorded the same failure repeatedly.' },
  { key: 'decisionsRequired', title: 'Decisions required · records still proposed', text: 'text-[#5A6E3D]', border: 'border-[#5A6E3D]', empty: 'No decision record is still waiting to be decided.' },
];
const LIVE = { fetchSiteHealth, supabase };
// The whole-system flow graph, file-verified at build (DR-0622); its live
// numbers come from system_flow_proof.
const GRAPH = normalizeGraph(typeof __INTERCONNECT_LOOPS__ !== 'undefined' && __INTERCONNECT_LOOPS__ ? __INTERCONNECT_LOOPS__.graph : null);

export default function OperationsIntelligence({ loopData = null, loopEnv = {}, discussions = [], ledger = LEDGER, nowMs = Date.now(), deps = LIVE, graph = GRAPH }) {
  const [health, setHealth] = useState({ ok: false, incidents: null, notice: 'reading the incident ledger' });
  const [proof, setProof] = useState({ ok: false, rows: {}, reason: 'reading the flow proof' });
  useEffect(() => {
    let live = true;
    if (deps && deps.supabase) fetchFlowProof(deps).then((p) => { if (live) setProof(p); });
    else setProof({ ok: false, rows: {}, reason: 'no database in this view' });
    return () => { live = false; };
  }, [deps]);
  const flows = useMemo(() => (proof.ok ? flowEscalations(graph, proof, nowMs) : null), [graph, proof, nowMs]);
  useEffect(() => {
    let live = true;
    deps.fetchSiteHealth().then((h) => { if (live) setHealth(h || { ok: false, incidents: null, notice: 'no answer' }); }, (e) => { if (live) setHealth({ ok: false, incidents: null, notice: e?.message || 'unreadable' }); });
    return () => { live = false; };
  }, [deps]);

  const r = useMemo(
    () => deriveOperations({ ledger, incidents: health.ok ? health.incidents : null, loopData, loopEnv, discussions, flows, nowMs }),
    [ledger, health, loopData, loopEnv, discussions, flows, nowMs],
  );

  return (
    <div className="space-y-3" data-testid="operations-intelligence">
      <section className="bg-white border-2 border-[#1A1815] p-4 sm:p-5">
        <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#2A5A8E] font-semibold">Governance · PoeTech operations</div>
        <p className="text-sm mt-1 text-[#1A1815]" style={SERIF}>
          The platform&apos;s own signals, from workflows that already run: the health probes&apos; incident issues, each decision record&apos;s re-review date and decision, the family&apos;s data loops, and open hand-offs.
          {r.ok ? ` Read from: ${r.sources.join(' · ')}.` : ' Unavailable: no operations signal could be read.'}
        </p>
        {!health.ok && <p className="text-[0.6875rem] text-[#B85838] mt-1" style={SERIF} data-testid="ops-incidents-unread">Incidents not read: {health.notice}. The other signals still show.</p>}
        <p className="text-[0.6875rem] text-[#5A5751] mt-1" style={SERIF} data-testid="ops-flow-proof">
          {proof.ok
            ? `System flow proof, measured on the live database ${String(proof.measuredAt || '').slice(0, 16).replace('T', ' ')} UTC: ${flows.length} connection(s) broken, gone quiet or open appear under Escalation.`
            : `System flow proof not read (${proof.reason}); no connection is counted as healthy.`}
        </p>
        <p className="text-[0.625rem] text-[#5A5751] mt-1" style={MONO}>
          incident open {INCIDENT_HOURS}h = escalation · the same failure ×{REPEAT_OBSERVATIONS} = risk · re-review due within {DUE_SOON_REVIEW_DAYS}d or passed · hand-off open {STALL_DAYS}d
        </p>
      </section>
      {r.ok && (
        <div className="grid gap-3 sm:grid-cols-2">
          {PANELS.map((p) => {
            const list = r[p.key] || [];
            return (
              <section key={p.key} className="bg-white border border-[#E8E4DC] p-3" data-testid={`ops-${p.key}`}>
                <div className="flex items-baseline justify-between">
                  <h4 className={`text-[0.625rem] uppercase tracking-wider font-semibold ${p.text}`}>{p.title}</h4>
                  <span className={`text-[0.625rem] ${list.length ? p.text : 'text-[#5A5751]'}`} style={MONO}>{list.length}</span>
                </div>
                {list.length === 0
                  ? <p className="text-[0.6875rem] text-[#5A5751] italic mt-1" style={SERIF}>{p.empty}</p>
                  : (
                    <ul className="mt-1.5 space-y-1.5">
                      {list.slice(0, 8).map((it, i) => (
                        <li key={`${it.id || it.key}-${i}`} className={`border-l-2 pl-2 ${p.border}`}>
                          <p className="text-xs text-[#1A1815]" style={{ ...SERIF, fontWeight: 600 }}>{it.title}</p>
                          <p className="text-[0.6875rem] text-[#5A5751]" style={SERIF}>{it.why}</p>
                          <p className="text-[0.5625rem] text-[#5A5751]" style={MONO}>from {it.sources.join(', ')}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                {list.length > 8 && <p className="text-[0.625rem] text-[#5A5751] mt-1">and {list.length - 8} more</p>}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
