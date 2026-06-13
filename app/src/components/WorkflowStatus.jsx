// =============================================================================
// WorkflowStatus — live readout of the automation fleet (DR-0061 Stage 2)
// =============================================================================
// Brings the REAL system into the app: which n8n workflows exist, which are
// active, and how the last run went — fetched live from the NAS via the
// same-origin /n8n rewrite (wf-workflow-status). Degrades honestly: if the feed
// isn't wired yet it says so and how to connect it, instead of faking data.
//
// Pairs with the build-time repo counts on the Build board (#68): those are
// "what's built"; this is "what's actually running right now."
import React, { useEffect, useState } from 'react';
import { N8N_BASE, n8nAuthHeaders } from '../lib/n8n-base.js';

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

const STATUS_DOT = {
  success: '#5A6E3D',
  error: '#B85838',
  crashed: '#B85838',
  running: '#2A5A8E',
  waiting: '#5A5751',
  'never-run': '#C9C3B8',
  unknown: '#5A5751',
};

export default function WorkflowStatus() {
  const [state, setState] = useState({ phase: 'loading', data: null, error: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const url = `${N8N_BASE.replace(/\/+$/, '')}/webhook/workflow-status`;
        const r = await fetch(url, { headers: { Accept: 'application/json', ...n8nAuthHeaders(true) }, mode: 'cors' });
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

  return (
    <section className="bg-white border border-[#1A1815] p-4">
      <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-1">📡 Live automation status</div>

      {state.phase === 'loading' && (
        <p className="text-xs text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>Checking the automation fleet…</p>
      )}

      {state.phase === 'offline' && (
        <div className="text-xs text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
          <p>Live status isn&apos;t connected yet — showing nothing rather than guessing.</p>
          {state.error && /api key not configured/i.test(state.error) ? (
            <p className="mt-1 text-[11px]">To light it up: import <span className="font-mono">wf-workflow-status</span> on the NAS, add an n8n API key to <span className="font-mono">/data/secrets/n8n-api-key.txt</span>, and activate it.</p>
          ) : (
            <p className="mt-1 text-[11px]">Import + activate <span className="font-mono">wf-workflow-status</span> on the NAS to connect this readout.</p>
          )}
        </div>
      )}

      {state.phase === 'ok' && state.data && (
        <div>
          <div className="text-[10px] uppercase tracking-wider font-semibold">
            <span className="text-[#5A6E3D]">🟢 {state.data.active} of {state.data.total} running</span>
            {state.data.recentErrors > 0 && <span className="text-[#B85838]"> · ⚠ {state.data.recentErrors} recent error{state.data.recentErrors === 1 ? '' : 's'}</span>}
          </div>
          <div className="mt-2 max-h-64 overflow-y-auto border border-[#E8E4DC]">
            {state.data.workflows.map((w, i) => (
              <div key={w.name + i} className={`flex items-center gap-2 px-2 py-1.5 ${i < state.data.workflows.length - 1 ? 'border-b border-[#F2EEE6]' : ''}`}>
                <span aria-hidden="true" className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: STATUS_DOT[w.lastStatus] || STATUS_DOT.unknown }} title={w.lastStatus} />
                <span className="text-xs flex-1 min-w-0 truncate" style={{ fontFamily: '"Fraunces", serif' }}>{w.name}</span>
                <span className="text-[9px] uppercase tracking-wider text-[#5A5751] shrink-0" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                  {w.active ? 'on' : 'off'}{w.lastRun ? ` · ${String(w.lastRun).slice(0, 10)}` : ''}
                </span>
              </div>
            ))}
          </div>
          <p className="text-[9px] text-[#5A5751] italic mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
            Live from the NAS — real run-status, not the repo file count.
          </p>
        </div>
      )}
    </section>
  );
}
