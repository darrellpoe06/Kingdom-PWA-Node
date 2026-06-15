// =============================================================================
// LlmHealth — live readout of the local LLMs (Ollama on the NAS)
// =============================================================================
// "How do I pay attention to the local LLMs?" — this is the answer made into a
// surface. Fetched live from the NAS via the same-origin /n8n rewrite
// (wf-llm-health -> Ollama /api/ps + /api/tags + /api/version). Shows what's
// loaded RIGHT NOW (the thing that ran away on 2026-06-06: a pinned keep_alive
// model that never unloaded), what's installed, and the Ollama version.
//
// Reality-trace (CLAUDE.md Layer 0, P15/P16): every value here traces to a real
// Ollama API call. When the feed isn't wired it says so and how to connect it,
// instead of painting a number. The runaway signature — a loaded model with no
// real expiry — is surfaced as a visible warning, not buried.
//
// Pairs with WorkflowStatus (the n8n fleet) on the Build board: that is "what
// automation is running"; this is "what models are hot."
import React, { useEffect, useState } from 'react';
import { N8N_BASE, n8nAuthHeaders } from '../lib/n8n-base.js';
import { KpiDot } from './KpiDot.jsx';
import { kpiColor } from '../lib/kpi-status.js';

// Pure, testable: the card's one overall-health KPI, mapped onto the shared
// status states (lib/kpi-status.js). A pinned model (the 2026-06-06 runaway
// signature) is the attention signal; offline/loading is honest "no data" (idle,
// never a misleading green).
export function llmHealthKpi(phase, data) {
  if (phase === 'loading') return { status: 'idle', label: 'Checking' };
  if (phase !== 'ok' || !data) return { status: 'idle', label: 'Not connected' };
  if (data.anyPinned) return { status: 'attention', label: 'Pinned — check' };
  if (data.loadedCount === 0) return { status: 'good', label: 'Idle — healthy' };
  return { status: 'good', label: `${data.loadedCount} loaded` };
}

// Bytes -> "X.Y GB". Defensive: null/garbage -> null (caller hides the field).
export function formatGB(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return null;
  return `${(bytes / 1e9).toFixed(1)} GB`;
}

// Pure, testable: turn the raw feed body into a normalized shape. Never throws.
// `pinned` is computed server-side (the Code node has the clock) and passed
// through as a boolean, so this stays time-independent and unit-testable.
export function normalizeLlmHealth(json) {
  if (!json || typeof json !== 'object' || json.ok === false) {
    return { ok: false, error: (json && json.error) || 'unavailable', loaded: [], installed: [] };
  }
  const loadedRaw = Array.isArray(json.loaded) ? json.loaded : [];
  const installedRaw = Array.isArray(json.installed) ? json.installed : [];
  const loaded = loadedRaw.map(m => ({
    name: String((m && m.name) || '(unnamed)'),
    sizeVram: Number.isFinite(m && m.size_vram) ? m.size_vram
      : (Number.isFinite(m && m.sizeVram) ? m.sizeVram : null),
    expiresAt: (m && (m.expires_at || m.expiresAt)) || null,
    pinned: (m && m.pinned) === true,
  }));
  const installed = installedRaw.map(m => ({
    name: String((m && m.name) || '(unnamed)'),
    size: Number.isFinite(m && m.size) ? m.size : null,
  })).sort((a, b) => a.name.localeCompare(b.name));
  return {
    ok: true,
    generatedAt: json.generated_at || json.generatedAt || null,
    version: json.version ? String(json.version) : null,
    loaded,
    installed,
    loadedCount: Number.isFinite(json.loaded_count) ? json.loaded_count : loaded.length,
    installedCount: Number.isFinite(json.installed_count) ? json.installed_count : installed.length,
    anyPinned: json.any_pinned === true || loaded.some(m => m.pinned),
  };
}

export default function LlmHealth() {
  const [state, setState] = useState({ phase: 'loading', data: null, error: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const url = `${N8N_BASE.replace(/\/+$/, '')}/webhook/llm-health`;
        const r = await fetch(url, { headers: { Accept: 'application/json', ...n8nAuthHeaders(true) }, mode: 'cors' });
        const json = await r.json().catch(() => null);
        if (cancelled) return;
        const norm = normalizeLlmHealth(json);
        if (!norm.ok) { setState({ phase: 'offline', data: null, error: norm.error }); return; }
        setState({ phase: 'ok', data: norm, error: null });
      } catch (e) {
        if (!cancelled) setState({ phase: 'offline', data: null, error: 'unreachable' });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const kpi = llmHealthKpi(state.phase, state.data);

  return (
    <section className="bg-white border border-[#1A1815] p-4">
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold">
          🧠 Local LLMs · Ollama{state.phase === 'ok' && state.data?.version ? ` ${state.data.version}` : ''}
        </div>
        <KpiDot status={kpi.status} label={kpi.label} className="text-[9px] uppercase tracking-wider text-[#5A5751] shrink-0" />
      </div>

      {state.phase === 'loading' && (
        <p className="text-xs text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>Checking the local models…</p>
      )}

      {state.phase === 'offline' && (
        <div className="text-xs text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
          <p>Local-LLM status isn&apos;t connected yet — showing nothing rather than guessing.</p>
          <p className="mt-1 text-[11px]">To light it up: import <span className="font-mono">wf-llm-health</span> on the NAS and activate it (it reads Ollama&apos;s <span className="font-mono">/api/ps</span> on <span className="font-mono">192.168.1.26:11434</span>).</p>
        </div>
      )}

      {state.phase === 'ok' && state.data && (
        <div>
          {/* What's hot right now — the attention line. */}
          {state.data.loadedCount === 0 ? (
            <div className="text-[10px] uppercase tracking-wider font-semibold text-[#5A6E3D]">🟢 Idle — 0 models loaded, no VRAM held</div>
          ) : (
            <>
              <div className="text-[10px] uppercase tracking-wider font-semibold">
                <span className="text-[#2A5A8E]">🔵 {state.data.loadedCount} loaded</span>
                {state.data.anyPinned && <span className="text-[#B85838]"> · ⚠ pinned — no expiry</span>}
              </div>
              <div className="mt-2 border border-[#E8E4DC]">
                {state.data.loaded.map((m, i) => (
                  <div key={m.name + i} className={`flex items-center gap-2 px-2 py-1.5 ${i < state.data.loaded.length - 1 ? 'border-b border-[#F2EEE6]' : ''}`}>
                    <span aria-hidden="true" className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: kpiColor(m.pinned ? 'attention' : 'good') }} title={m.pinned ? 'pinned (no expiry)' : 'loaded'} />
                    <span className="text-xs flex-1 min-w-0 truncate" style={{ fontFamily: '"Fraunces", serif' }}>{m.name}</span>
                    <span className="text-[9px] uppercase tracking-wider text-[#5A5751] shrink-0" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                      {formatGB(m.sizeVram) ? `${formatGB(m.sizeVram)} vram` : ''}
                      {m.pinned ? ' · PINNED' : (m.expiresAt ? ` · unloads ${String(m.expiresAt).slice(11, 16)}` : '')}
                    </span>
                  </div>
                ))}
              </div>
              {state.data.anyPinned && (
                <p className="text-[10px] text-[#B85838] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
                  A loaded model with no expiry is the 2026-06-06 runaway signature — worth a look.
                </p>
              )}
            </>
          )}

          {/* What's installed on disk. */}
          <div className="mt-3 text-[9px] uppercase tracking-wider text-[#5A5751] font-semibold" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
            {state.data.installedCount} installed
          </div>
          <div className="mt-1 max-h-40 overflow-y-auto border border-[#E8E4DC]">
            {state.data.installed.map((m, i) => (
              <div key={m.name + i} className={`flex items-center gap-2 px-2 py-1 ${i < state.data.installed.length - 1 ? 'border-b border-[#F2EEE6]' : ''}`}>
                <span className="text-xs flex-1 min-w-0 truncate" style={{ fontFamily: '"Fraunces", serif' }}>{m.name}</span>
                {formatGB(m.size) && (
                  <span className="text-[9px] uppercase tracking-wider text-[#5A5751] shrink-0" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{formatGB(m.size)}</span>
                )}
              </div>
            ))}
          </div>

          <p className="text-[9px] text-[#5A5751] italic mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
            Live from the NAS — real Ollama <span className="font-mono not-italic">/api/ps</span>, not a guess.
          </p>
        </div>
      )}
    </section>
  );
}
