// =============================================================================
// SystemFlowProof — the whole system, end to end, with its live numbers
// (DR-0622). Rendered inside Quality / Proof → Interconnect, above the
// file-verified pairs it widens.
// =============================================================================
// Darrell 2026-09-24: "The data should be the proof of the end, whole end to
// end process. So we can actually see."
//
// Reads two real things and nothing else:
//   - the graph, file-verified at build (every workflow, NAS rider and screen,
//     what each reads, writes and seeds; __INTERCONNECT_LOOPS__.graph);
//   - the latest proof run from system_flow_proof (migration 0234), measured on
//     the live database every 6 hours by system-flow-proof.yml.
// Each chain is a list a phone can read: every step, what it writes, who picks
// it up, the numbers and their age, and the state in plain words. Unknown is
// never green; an open gap says its blocker and its date.
// =============================================================================
import React, { useEffect, useMemo, useState } from 'react';
import { KpiDot } from './KpiDot.jsx';
import supabase from '../lib/supabase.js';
import {
  normalizeGraph, fetchFlowProof, resourceVerdict, metaFor, connectionStates, flowTally, ageWords, FLOW_STATES,
} from '../lib/system-flow.js';

const SERIF = { fontFamily: '"Fraunces", serif' };
const MONO = { fontFamily: '"JetBrains Mono", monospace' };
const LIVE = { supabase };

function stateOf(resource, row, nowMs) {
  if (resource.open) return { state: 'open', say: `${resource.open.blocker} (re-review ${resource.open.reReview})` };
  if (!resource.measured) return { state: 'unknown', say: 'wired in the code; this carrier has no live number to read' };
  return resourceVerdict(metaFor(resource), row ? { ...row, resource: resource.id } : null, nowMs);
}

function numbers(row, nowMs) {
  if (!row || row.error) return '';
  if (String(row.resource || '').startsWith('gh:run:')) return row.newest_at ? `last run ${ageWords(row.newest_at, nowMs)}` : '';
  const parts = [];
  if (row.written != null) parts.push(`${row.written} written`);
  if (row.newest_at) parts.push(`newest ${ageWords(row.newest_at, nowMs)}`);
  if (row.consumed != null) parts.push(`${row.consumed} picked up downstream`);
  return parts.join(' · ');
}

export default function SystemFlowProof({ graph: rawGraph, deps = LIVE, nowMs: fixedNow = null }) {
  const graph = useMemo(() => normalizeGraph(rawGraph), [rawGraph]);
  const [proof, setProof] = useState({ ok: false, rows: {}, reason: 'loading' });
  useEffect(() => {
    let live = true;
    fetchFlowProof(deps).then((p) => { if (live) setProof(p); });
    return () => { live = false; };
  }, [deps]);
  const nowMs = fixedNow != null ? fixedNow : Date.now();

  const byNode = useMemo(() => new Map(graph.nodes.map((n) => [n.id, n])), [graph]);
  const byRes = useMemo(() => new Map(graph.resources.map((r) => [r.id, r])), [graph]);
  const tally = flowTally(connectionStates(graph, proof, nowMs));
  const chains = useMemo(() => {
    const placed = new Set(graph.chains.flatMap((c) => c.nodes));
    const rest = graph.nodes.map((n) => n.id).filter((id) => !placed.has(id));
    return rest.length ? [...graph.chains, { id: 'rest', name: 'Everything else the system runs', nodes: rest }] : graph.chains;
  }, [graph]);

  if (!graph.ok) {
    return <p className="text-[0.6875rem] text-[#5A5751] italic" style={SERIF}>The flow graph is not in this build — showing nothing rather than guessing.</p>;
  }
  const s = graph.summary;
  return (
    <div className="mb-3" data-testid="system-flow-proof">
      <div className="bg-[#FAF8F4] border border-[#E8E4DC] p-2.5 mb-2">
        <div className="text-[0.625rem] uppercase tracking-wider text-[#1A1815] font-semibold">The whole system, end to end</div>
        <p className="text-[0.6875rem] text-[#1A1815] mt-1" style={SERIF} data-testid="flow-headline">
          {s.nodes} workflows, NAS jobs and screens · {tally.total} connections. On live data: <strong>{tally.flowing}</strong> flowing, <strong>{tally.attention}</strong> need attention, <strong>{tally.problem}</strong> broken or open, <strong>{tally.unknown}</strong> not measured.
        </p>
        <p className="text-[0.625rem] text-[#5A5751] mt-1" style={MONO} data-testid="flow-measured">
          {proof.ok
            ? `measured on the live database ${ageWords(proof.measuredAt, nowMs)} (run ${proof.runId})`
            : `no live reading (${proof.reason}) — nothing below is counted as flowing`}
        </p>
        <p className="text-[0.625rem] text-[#5A5751] mt-1" style={MONO}>
          {s.loopsClosed}/{s.loops} declared loops close · every one of {s.workflows} workflows and {s.riders} NAS jobs has its place · {s.tablesInGraph} of {s.tablesInSchema} tables are in a flow so far
        </p>
      </div>

      <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] font-semibold mb-1">Loops that must close</div>
      <ul className="border border-[#E8E4DC] mb-2">
        {graph.loops.map((l) => (
          <li key={l.id} className="px-2 py-1.5 border-b border-[#F2EEE6] last:border-b-0" data-testid="flow-loop">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs text-[#1A1815]" style={{ ...SERIF, fontWeight: 500 }}>{l.name}</span>
              <KpiDot status={l.closed ? 'good' : 'problem'} label={l.closed ? 'closes' : 'does not close yet'} className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] shrink-0" />
            </div>
            {!l.closed && (
              <p className="text-[0.6875rem] text-[#5A5751] mt-0.5" style={SERIF}>
                Missing: {l.steps.filter((x) => !x.connected).map((x) => `${(byNode.get(x.from) || {}).name || x.from} → ${(byNode.get(x.to) || {}).name || x.to}`).join('; ')}.
                {l.open ? ` ${l.open.blocker} Re-review ${l.open.reReview}.` : ''}
              </p>
            )}
          </li>
        ))}
      </ul>

      <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] font-semibold mb-1">Every chain, step by step</div>
      {chains.map((c) => (
        <details key={c.id} className="border border-[#E8E4DC] mb-1.5" data-testid="flow-chain">
          <summary className="px-2 py-2 text-xs text-[#1A1815] cursor-pointer min-h-[44px] flex items-center" style={{ ...SERIF, fontWeight: 600 }}>{c.name}</summary>
          <ul>
            {c.nodes.map((id) => {
              const n = byNode.get(id);
              if (!n) return null;
              const runRes = n.workflow ? byRes.get(`gh:run:${n.workflow}`) : null;
              const run = runRes ? stateOf(runRes, proof.rows[runRes.id], nowMs) : null;
              const outs = (n.writes || []).filter((r) => !r.startsWith('gh:run:')).map((r) => byRes.get(r)).filter(Boolean);
              return (
                <li key={id} className="px-2 py-1.5 border-t border-[#F2EEE6]" data-testid="flow-node">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs text-[#1A1815]" style={{ ...SERIF, fontWeight: 500 }}>{n.name}</span>
                    {run && <KpiDot status={(FLOW_STATES[run.state] || FLOW_STATES.unknown).tone} label={(FLOW_STATES[run.state] || FLOW_STATES.unknown).label} className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] shrink-0" />}
                  </div>
                  {n.purpose && <p className="text-[0.6875rem] text-[#5A5751]" style={SERIF}>{n.purpose}</p>}
                  {run && <p className="text-[0.625rem] text-[#5A5751]" style={MONO}>{run.say}{proof.rows[runRes.id] ? ` · ${numbers(proof.rows[runRes.id], nowMs)}` : ''}</p>}
                  {outs.map((r) => {
                    const v = stateOf(r, proof.rows[r.id], nowMs);
                    const readers = (r.readers || []).map((x) => (byNode.get(x) || {}).name || x);
                    return (
                      <div key={r.id} className="mt-1 pl-2 border-l-2 border-[#E8E4DC]" data-testid="flow-connection">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-[0.6875rem] text-[#1A1815]" style={SERIF}>writes {r.label} → {readers.length ? readers.join(', ') : (r.sink ? 'a person' : 'no one')}</span>
                          <KpiDot status={(FLOW_STATES[v.state] || FLOW_STATES.unknown).tone} label={(FLOW_STATES[v.state] || FLOW_STATES.unknown).label} className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] shrink-0" />
                        </div>
                        <p className="text-[0.625rem] text-[#5A5751]" style={MONO}>
                          {v.say}{numbers(proof.rows[r.id], nowMs) ? ` · ${numbers(proof.rows[r.id], nowMs)}` : ''}
                        </p>
                        {r.sink && <p className="text-[0.625rem] text-[#5A5751] italic" style={SERIF}>Ends with a person: {r.sink}</p>}
                      </div>
                    );
                  })}
                </li>
              );
            })}
          </ul>
        </details>
      ))}

      {graph.findings.length > 0 && (
        <div className="border border-[#DC2626] p-2 mt-2" role="alert">
          <div className="text-[0.625rem] uppercase tracking-wider text-[#DC2626] font-semibold">This build has {graph.findings.length} gap(s) in the graph</div>
          <ul className="mt-1">{graph.findings.map((f, i) => <li key={i} className="text-[0.6875rem] text-[#1A1815]" style={SERIF}>{f.message}</li>)}</ul>
        </div>
      )}
    </div>
  );
}
