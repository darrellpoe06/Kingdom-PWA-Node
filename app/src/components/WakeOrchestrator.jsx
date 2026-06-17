// =============================================================================
// WakeOrchestrator — the in-app cockpit for the wake/handoff orchestrator
// =============================================================================
// Darrell (2026-06-16): the control + observability surface must live INSIDE the
// app, not just as NAS scripts. "The NAS runs the engine; the app is the cockpit."
// Governor-gated, on the Build board, alongside OpsBoard + QualityProof.
//
// Shows REAL orchestrator state, fetched live from the NAS via the same-origin
// /n8n rewrite (wf-wake-orchestrator -> the portable bundle's state files):
//   - the HANDOFF LOG (what the offline model left + the wake_at)
//   - SCHEDULED WAKES + due status
//   - which VENDOR was summoned for which lane/task (+ cost)
//   - BUDGET + BRAKE status (cap used, concurrency lock, kill-switch, arm,
//     wake-summon consent)
//   - ARM / DISARM / KILL-SWITCH controls, operable in-app (Governor)
//
// Reality-trace (P15/P16, DR-0076): every value traces to a real state file. When
// the feed isn't wired it says so + how to connect it + the paste-ready arm step,
// instead of painting a status. Ships INERT: the default state is kill-switch
// engaged; arming is a deliberate, confirmed, Tier C act done by Darrell.
import React, { useCallback, useEffect, useState } from 'react';
import { N8N_BASE, n8nAuthHeaders } from '../lib/n8n-base.js';
import { KpiDot } from './KpiDot.jsx';
import { kpiColor } from '../lib/kpi-status.js';
import {
  normalizeWakeState,
  wakeOrchestratorKpi,
  brakeRows,
  budgetStatus,
  CONTROL_ACTIONS,
} from '../lib/wake-orchestrator.js';

const FEED_URL = `${N8N_BASE.replace(/\/+$/, '')}/webhook/wake-orchestrator`;
const CONTROL_URL = `${N8N_BASE.replace(/\/+$/, '')}/webhook/wake-orchestrator-control`;

// The paste-ready arm step (authoritative path on the NAS), shown whenever the
// feed isn't connected and under the in-app controls as the fallback.
const ARM_STEPS = `cd /volume1/PoeTech/portable
sed -i 's/^BUDGET_PER_TASK_USD=.*/BUDGET_PER_TASK_USD=2/' .env
sed -i 's/^BUDGET_DAILY_USD=.*/BUDGET_DAILY_USD=25/' .env
./disarm.sh --off    # disengage kill-switch
./arm.sh             # arm standby
./wake-arm.sh        # consent to vendor-summon on wake
docker compose restart`;

export default function WakeOrchestrator() {
  const [state, setState] = useState({ phase: 'loading', data: null, error: null });
  const [busy, setBusy] = useState(null); // the action currently in flight
  const [controlNote, setControlNote] = useState(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch(FEED_URL, { headers: { Accept: 'application/json', ...n8nAuthHeaders(true) }, mode: 'cors' });
      const json = await r.json().catch(() => null);
      const norm = normalizeWakeState(json);
      if (!norm.ok) { setState({ phase: 'offline', data: null, error: norm.error }); return; }
      setState({ phase: 'ok', data: norm, error: null });
    } catch {
      setState({ phase: 'offline', data: null, error: 'unreachable' });
    }
  }, []);

  useEffect(() => { let live = true; (async () => { if (live) await load(); })(); return () => { live = false; }; }, [load]);

  // POST a control action. Never claims success on its own word: it re-fetches
  // the real state afterward, so the dots reflect the orchestrator, not the click
  // (Verification Doctrine). A failed POST shows the error + the paste fallback.
  const control = useCallback(async (action) => {
    const meta = CONTROL_ACTIONS[action];
    if (!meta) return;
    if (meta.confirm && typeof window !== 'undefined' && window.confirm) {
      const ok = window.confirm(
        `${meta.label}\n\nThis moves the orchestrator toward LIVE autonomous operation (Tier C). `
        + `Only do this attended, with budgets set, never while traveling. Continue?`,
      );
      if (!ok) return;
    }
    setBusy(action); setControlNote(null);
    try {
      const r = await fetch(CONTROL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...n8nAuthHeaders(true) },
        mode: 'cors',
        body: JSON.stringify({ action }),
      });
      const json = await r.json().catch(() => null);
      if (!r.ok || !json || json.ok === false) {
        setControlNote({ kind: 'error', text: (json && json.error) || `control failed (${r.status})` });
      } else {
        setControlNote({ kind: 'ok', text: `${meta.label} — applied.` });
      }
    } catch {
      setControlNote({ kind: 'error', text: 'control endpoint unreachable — use the paste-ready step below.' });
    } finally {
      setBusy(null);
      await load(); // re-bind the dots to real state, success or fail
    }
  }, [load]);

  const kpi = wakeOrchestratorKpi(state.phase, state.data);
  const d = state.data;

  return (
    <section className="bg-white border border-[#1A1815] p-4">
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold">
          ⏰ Wake Orchestrator · cockpit
        </div>
        <KpiDot status={kpi.status} label={kpi.label} className="text-[9px] uppercase tracking-wider text-[#5A5751] shrink-0" />
      </div>
      <p className="text-[10px] text-[#5A5751] italic mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
        The NAS runs the engine; this is the cockpit. A vendor leaves a handoff before going offline; the NAS wakes it back up — tiered + braked.
      </p>

      {state.phase === 'loading' && (
        <p className="text-xs text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>Reading orchestrator state…</p>
      )}

      {state.phase === 'offline' && (
        <div className="text-xs text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
          <p>The orchestrator feed isn&apos;t connected yet — showing nothing rather than guessing.</p>
          <p className="mt-1 text-[11px]">To light it up: deploy the portable bundle on the NAS and import <span className="font-mono">wf-wake-orchestrator</span> (it reads the bundle&apos;s <span className="font-mono">state/</span> files and serves them same-origin).</p>
          <details className="mt-2">
            <summary className="cursor-pointer text-[11px] uppercase tracking-wider text-[#B85838]">Paste-ready arm step (Tier C — attended only)</summary>
            <pre className="mt-1 p-2 bg-[#1A1815] text-[#F2EEE6] text-[10px] overflow-x-auto whitespace-pre" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{ARM_STEPS}</pre>
          </details>
        </div>
      )}

      {state.phase === 'ok' && d && (
        <div className="space-y-3">
          {/* BRAKE + BUDGET STATUS */}
          <div>
            <div className="text-[9px] uppercase tracking-wider text-[#5A5751] font-semibold mb-1">Brakes &amp; budget</div>
            <div className="border border-[#E8E4DC]">
              {brakeRows(d.brakes).map((row, i, arr) => (
                <div key={row.key} className={`flex items-center gap-2 px-2 py-1.5 ${i < arr.length - 1 ? 'border-b border-[#F2EEE6]' : ''}`}>
                  <span aria-hidden="true" className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: kpiColor(row.status) }} />
                  <span className="text-xs flex-1 min-w-0" style={{ fontFamily: '"Fraunces", serif' }}>{row.label}</span>
                  <span className="text-[9px] uppercase tracking-wider text-[#5A5751] shrink-0 text-right" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{row.detail}</span>
                </div>
              ))}
            </div>
            {(() => { const bs = budgetStatus(d.brakes.budget); return (
              <div className="mt-1 h-1.5 bg-[#E8E4DC] overflow-hidden" role="img" aria-label={`Daily budget ${bs.label}`}>
                <div className="h-full" style={{ width: `${bs.pct}%`, backgroundColor: kpiColor(bs.status) }} />
              </div>
            ); })()}
          </div>

          {/* CONTROLS (Governor) */}
          <div>
            <div className="text-[9px] uppercase tracking-wider text-[#5A5751] font-semibold mb-1">Controls</div>
            <div className="flex flex-wrap gap-1.5">
              <ControlButton action="kill" busy={busy} onClick={control} kind="panic" />
              <ControlButton action="unkill" busy={busy} onClick={control} />
              <ControlButton action="arm" busy={busy} onClick={control} />
              <ControlButton action="disarm" busy={busy} onClick={control} />
              <ControlButton action="wake-arm" busy={busy} onClick={control} />
              <ControlButton action="wake-disarm" busy={busy} onClick={control} />
            </div>
            {controlNote && (
              <p className={`mt-1 text-[10px] ${controlNote.kind === 'error' ? 'text-[#DC2626]' : 'text-[#15803D]'}`} style={{ fontFamily: '"Fraunces", serif' }}>
                {controlNote.text}
              </p>
            )}
            <p className="mt-1 text-[9px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
              Controls flip the real state files; the engine re-reads them on its next tick. Arming is Tier C — attended only.
            </p>
          </div>

          {/* SCHEDULED WAKES / HANDOFF LOG */}
          <div>
            <div className="text-[9px] uppercase tracking-wider text-[#5A5751] font-semibold mb-1">Handoffs &amp; scheduled wakes ({d.handoffs.length})</div>
            {d.handoffs.length === 0 ? (
              <p className="text-[11px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No handoffs in the inbox — nothing scheduled.</p>
            ) : (
              <div className="border border-[#E8E4DC]">
                {d.handoffs.map((h, i, arr) => (
                  <div key={h.id + i} className={`px-2 py-1.5 ${i < arr.length - 1 ? 'border-b border-[#F2EEE6]' : ''}`}>
                    <div className="flex items-center gap-2">
                      <span aria-hidden="true" className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: kpiColor(h.due ? 'attention' : 'idle') }} title={h.due ? 'due' : 'pending'} />
                      <span className="text-xs flex-1 min-w-0 truncate" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{h.lane || h.id}</span>
                      <span className="text-[9px] uppercase tracking-wider text-[#5A5751] shrink-0" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                        {h.due ? 'DUE' : 'pending'} · {h.wakeAtLabel}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#1A1815] mt-0.5 truncate" style={{ fontFamily: '"Fraunces", serif' }}>{h.task}</div>
                    <div className="text-[9px] uppercase tracking-wider text-[#5A5751] mt-0.5" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                      from {h.issuedBy || '?'} · suggests {h.suggestedVendor}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* VENDOR SUMMONS */}
          {d.summons.length > 0 && (
            <div>
              <div className="text-[9px] uppercase tracking-wider text-[#5A5751] font-semibold mb-1">Recent vendor summons</div>
              <div className="border border-[#E8E4DC]">
                {d.summons.map((s, i, arr) => (
                  <div key={s.ts + i} className={`flex items-center gap-2 px-2 py-1.5 ${i < arr.length - 1 ? 'border-b border-[#F2EEE6]' : ''}`}>
                    <span className="text-xs flex-1 min-w-0 truncate" style={{ fontFamily: '"Fraunces", serif' }}>
                      <span className="font-semibold">{s.vendor || '?'}</span> · {s.lane}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-[#5A5751] shrink-0" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                      {s.costUsd > 0 ? `$${s.costUsd.toFixed(4)}` : '$0'} · {String(s.ts).slice(11, 16)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* EVENT REEL */}
          {d.events.length > 0 && (
            <div>
              <div className="text-[9px] uppercase tracking-wider text-[#5A5751] font-semibold mb-1">Event reel</div>
              <div className="max-h-40 overflow-y-auto border border-[#E8E4DC]">
                {d.events.map((e, i, arr) => (
                  <div key={e.ts + i} className={`flex items-baseline gap-2 px-2 py-1 ${i < arr.length - 1 ? 'border-b border-[#F2EEE6]' : ''}`}>
                    <span className="text-[9px] uppercase tracking-wider text-[#B85838] shrink-0" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{e.event}</span>
                    <span className="text-[10px] text-[#5A5751] flex-1 min-w-0 truncate" style={{ fontFamily: '"Fraunces", serif' }}>{e.detail}</span>
                    <span className="text-[9px] text-[#5A5751] shrink-0" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{String(e.ts).slice(11, 16)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-[9px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
            Live from the NAS — real bundle state, not a guess.{d.generatedAt ? ` Read ${String(d.generatedAt).slice(11, 19)}Z.` : ''}
          </p>
        </div>
      )}
    </section>
  );
}

// A single control button. Panic-class is filled red (instant, no confirm);
// arming-class is outlined (confirmed in the handler). Disabled while any action
// is in flight so a double-tap can't stack.
function ControlButton({ action, busy, onClick, kind }) {
  const meta = CONTROL_ACTIONS[action];
  if (!meta) return null;
  const panic = kind === 'panic';
  return (
    <button
      type="button"
      onClick={() => onClick(action)}
      disabled={!!busy}
      aria-label={meta.label}
      className={`text-[10px] uppercase tracking-wider px-2.5 py-1 min-h-[32px] border focus:outline focus:outline-2 focus:outline-[#B85838] disabled:opacity-50 ${
        panic
          ? 'bg-[#DC2626] text-white border-[#DC2626] hover:bg-[#B91C1C]'
          : meta.toward === 'live'
            ? 'text-[#B45309] border-[#B45309] hover:bg-[#B45309] hover:text-white'
            : 'text-[#15803D] border-[#15803D] hover:bg-[#15803D] hover:text-white'
      }`}
    >
      {busy === action ? '…' : meta.label}
    </button>
  );
}
