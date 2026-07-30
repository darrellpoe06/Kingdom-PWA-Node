// =============================================================================
// WorkflowStatus — live readout of the automation fleet (DR-0061 Stage 2)
// =============================================================================
// Brings the REAL system into the app: which automations exist, which are
// active, and how the last run went — fetched live from the NAS at the sovereign
// same-origin path GET /automation-status (DR-0218 zero-n8n). The old n8n fleet
// readout (the retired n8n workflow-status webhook) is retired with n8n itself; this now
// points at where the sovereign automation-status server serves. Degrades
// honestly: if the feed isn't wired yet it says so, instead of faking data —
// and it never repaints the build-time repo count as if it were live run-status.
//
// Pairs with the build-time repo counts on the Build board (#68): those are
// "what's built"; this is "what's actually running right now."
import React, { useEffect, useState } from 'react';
import { n8nAuthHeaders } from '../lib/n8n-base.js';
import { KpiDot } from './KpiDot.jsx';
import { kpiColor } from '../lib/kpi-status.js';

// Pure, testable: turn the raw feed body into a normalized shape. Never throws.
export function normalizeWorkflowStatus(json) {
  if (!json || typeof json !== 'object' || json.ok === false) {
    return { ok: false, error: (json && json.error) || 'unavailable', workflows: [] };
  }
  const list = Array.isArray(json.workflows) ? json.workflows : [];
  const workflows = list.map(w => ({
    name: String((w && w.name) || '(unnamed)'),
    active: (w && w.active) === true,
    lastRun: (w && (w.last_run || w.lastRun)) || null,
    lastStatus: String((w && (w.last_status || w.lastStatus)) || 'never-run').toLowerCase(),
  }));
  const active = Number.isFinite(json.active) ? json.active : workflows.filter(w => w.active).length;
  return {
    ok: true,
    generatedAt: json.generated_at || json.generatedAt || null,
    total: Number.isFinite(json.total) ? json.total : workflows.length,
    active,
    recentErrors: Number.isFinite(json.recent_errors) ? json.recent_errors : 0,
    workflows,
  };
}

// The card's one overall KPI, on the shared status states (lib/kpi-status.js).
// Per-row run-status words ('success' / 'error' / 'running' / ...) are also
// synonyms the shared palette resolves, so the dots stay consistent app-wide.
export function workflowStatusKpi(data) {
  if (!data) return { status: 'idle', label: 'Not connected' };
  if (data.recentErrors > 0) return { status: 'attention', label: `${data.recentErrors} recent error${data.recentErrors === 1 ? '' : 's'}` };
  if (data.active === 0) return { status: 'idle', label: 'None running' };
  return { status: 'good', label: `${data.active}/${data.total} running` };
}

export default function WorkflowStatus() {
  const [state, setState] = useState({ phase: 'loading', data: null, error: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const url = '/automation-status';
        const r = await fetch(url, { headers: { Accept: 'application/json', ...n8nAuthHeaders(true) } });
        const json = await r.json().catch(() => null);
        if (cancelled) return;
        const norm = normalizeWorkflowStatus(json);
        if (!norm.ok) { setState({ phase: 'offline', data: null, error: norm.error }); return; }
        setState({ phase: 'ok', data: norm, error: null });
      } catch (e) {
        if (!cancelled) setState({ phase: 'offline', data: null, error: 'unreachable' });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const kpi = workflowStatusKpi(state.phase === 'ok' ? state.data : null);

  return (
    <section className="bg-white border border-[#1A1815] p-4">
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold">📡 Live automation status</div>
        <KpiDot status={kpi.status} label={kpi.label} className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] shrink-0" />
      </div>

      {state.phase === 'loading' && (
        <p className="text-xs text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>Checking the automation fleet…</p>
      )}

      {state.phase === 'offline' && (
        <div className="text-xs text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
          <p>Live status isn&apos;t connected yet — showing nothing rather than guessing.</p>
          <p className="mt-1 text-[0.6875rem]">To light it up: stand up the sovereign automation-status server on the NAS and route <span className="font-mono">/automation-status</span> in Caddy — it reports what the sovereign Python jobs are running, no n8n.</p>
        </div>
      )}

      {state.phase === 'ok' && state.data && (
        <div>
          <div className="text-[0.625rem] uppercase tracking-wider font-semibold">
            <span className="text-[#5A6E3D]">🟢 {state.data.active} of {state.data.total} running</span>
            {state.data.recentErrors > 0 && <span className="text-[#B85838]"> · ⚠ {state.data.recentErrors} recent error{state.data.recentErrors === 1 ? '' : 's'}</span>}
          </div>
          <div className="mt-2 max-h-64 overflow-y-auto border border-[#E8E4DC]">
            {state.data.workflows.map((w, i) => (
              <div key={w.name + i} className={`flex items-center gap-2 px-2 py-1.5 ${i < state.data.workflows.length - 1 ? 'border-b border-[#F2EEE6]' : ''}`}>
                <span aria-hidden="true" className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: kpiColor(w.lastStatus) }} title={w.lastStatus} />
                <span className="text-xs flex-1 min-w-0 truncate" style={{ fontFamily: '"Fraunces", serif' }}>{w.name}</span>
                <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] shrink-0" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                  {w.lastStatus} · {w.active ? 'on' : 'off'}{w.lastRun ? ` · ${String(w.lastRun).slice(0, 10)}` : ''}
                </span>
              </div>
            ))}
          </div>
          <p className="text-[0.5625rem] text-[#5A5751] italic mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
            Live from the NAS — real run-status, not the repo file count.
          </p>
        </div>
      )}
    </section>
  );
}
