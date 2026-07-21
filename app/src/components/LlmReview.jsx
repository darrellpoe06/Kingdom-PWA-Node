// =============================================================================
// LlmReview — advisory local-LLM code-review readout (Build board)
// =============================================================================
// "Have the local LLMs review the app for bugs or fixes." (Darrell, 2026-06-16.)
// This surfaces the report from scripts/orchestration/llm-review.mjs — qwen2.5
// on the NAS reading a branch's DIFF and flagging likely bugs (file:line +
// concern + suggested fix). Fetched live from the sovereign same-origin static
// report /reviews/llm-review.json (DR-0218 zero-n8n) — the review pipeline
// writes it to the Caddy site, exactly like LlmHealth reads its own JSON.
//
// ADVISORY, never a gate (the banner says so): the merge gate is deterministic
// CI (lint + vitest). This is a second pair of eyes, shown in the open.
//
// HONEST OFFLINE (DR-0076): no report yet / feed unreachable -> it says how to
// light it up, never a painted "all clear". Pairs with LlmHealth ("what models
// are hot") + WorkflowStatus ("what automation runs"); this is "what the local
// model thinks of the latest change."
import React, { useEffect, useState } from 'react';
import { n8nAuthHeaders } from '../lib/n8n-base.js';
import { normalizeLlmReview, llmReviewKpi, findingLocation } from '../lib/llm-review.js';
import { KpiDot } from './KpiDot.jsx';
import { kpiColor } from '../lib/kpi-status.js';

const SEV_ICON = { bug: '🐞', warning: '⚠️', nit: '·' };
const SEV_STATUS = { bug: 'problem', warning: 'attention', nit: 'idle' };

export default function LlmReview() {
  const [state, setState] = useState({ phase: 'loading', data: null, error: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Sovereign, same-origin static report (DR-0218 zero-n8n): the review
        // pipeline writes /reviews/llm-review.json to the Caddy site; no n8n.
        const url = '/reviews/llm-review.json';
        const r = await fetch(url, { headers: { Accept: 'application/json', ...n8nAuthHeaders(true) } });
        const json = await r.json().catch(() => null);
        if (cancelled) return;
        const norm = normalizeLlmReview(json);
        if (!norm.ok) { setState({ phase: 'offline', data: null, error: norm.error }); return; }
        setState({ phase: 'ok', data: norm, error: null });
      } catch (e) {
        if (!cancelled) setState({ phase: 'offline', data: null, error: 'unreachable' });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const kpi = llmReviewKpi(state.phase, state.data);
  const d = state.data;

  return (
    <section className="bg-white border border-[#1A1815] p-4">
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold">
          🔍 Local-LLM code review · advisory
        </div>
        <KpiDot status={kpi.status} label={kpi.label} className="text-[9px] uppercase tracking-wider text-[#5A5751] shrink-0" />
      </div>

      {state.phase === 'loading' && (
        <p className="text-xs text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>Checking the latest review…</p>
      )}

      {state.phase === 'offline' && (
        <div className="text-xs text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
          <p>No local-LLM review is connected yet — showing nothing rather than guessing.</p>
          <p className="mt-1 text-[11px]">To light it up: run <span className="font-mono">scripts/orchestration/llm-review.sh</span> on a branch (qwen2.5 reviews the diff), then import + activate <span className="font-mono">wf-llm-review</span> on the NAS to serve the report here.</p>
        </div>
      )}

      {state.phase === 'ok' && d && (
        <div>
          {/* The headline count — bugs lead, then warnings. */}
          <div className="text-[10px] uppercase tracking-wider font-semibold">
            {d.counts.findings === 0 ? (
              <span className="text-[#5A6E3D]">🟢 No likely bugs flagged in the latest change</span>
            ) : (
              <span>
                {d.counts.bugs > 0 && <span className="text-[#DC2626]">🐞 {d.counts.bugs} likely bug{d.counts.bugs === 1 ? '' : 's'}</span>}
                {d.counts.bugs > 0 && d.counts.warnings > 0 && <span className="text-[#5A5751]"> · </span>}
                {d.counts.warnings > 0 && <span className="text-[#B45309]">⚠ {d.counts.warnings} warning{d.counts.warnings === 1 ? '' : 's'}</span>}
                {d.counts.nits > 0 && <span className="text-[#5A5751]"> · {d.counts.nits} nit{d.counts.nits === 1 ? '' : 's'}</span>}
              </span>
            )}
          </div>

          {/* Context line — what was reviewed, by which model, sovereign or escalated. */}
          <div className="text-[9px] uppercase tracking-wider text-[#5A5751] mt-1" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
            {d.head ? `${d.base || '?'} → ${d.head}` : ''}
            {d.filesReviewedCount != null ? ` · ${d.filesReviewedCount} file${d.filesReviewedCount === 1 ? '' : 's'}` : ''}
            {d.model ? ` · ${d.escalated ? 'vendor ' : ''}${d.model}` : ''}
          </div>

          {d.escalationRecommended && !d.escalated && (
            <p className="text-[10px] text-[#B45309] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
              Diff exceeds the local model&apos;s scope — a deeper vendor review is recommended (not run): {d.escalationReason}
            </p>
          )}

          {/* The findings list. */}
          {d.findings.length > 0 && (
            <div className="mt-2 border border-[#E8E4DC]">
              {d.findings.map((f, i) => (
                <div key={findingLocation(f) + i} className={`px-2 py-1.5 ${i < d.findings.length - 1 ? 'border-b border-[#F2EEE6]' : ''}`}>
                  <div className="flex items-center gap-2">
                    <span aria-hidden="true" className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: kpiColor(SEV_STATUS[f.severity] || 'idle') }} title={f.severity} />
                    <span className="text-[10px] uppercase tracking-wider text-[#5A5751] shrink-0" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                      {SEV_ICON[f.severity] || '•'} {findingLocation(f)}
                    </span>
                  </div>
                  <p className="text-xs text-[#1A1815] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>{f.concern}</p>
                  {f.suggestion && (
                    <p className="text-[11px] text-[#5A5751] mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>
                      <span className="uppercase tracking-wider text-[9px] text-[#5A6E3D] font-semibold">Fix · </span>{f.suggestion}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          <p className="text-[9px] text-[#5A5751] italic mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
            Advisory only — a second pair of eyes on the diff. The merge gate is the test suite (lint + vitest), not this.
          </p>
        </div>
      )}
    </section>
  );
}
