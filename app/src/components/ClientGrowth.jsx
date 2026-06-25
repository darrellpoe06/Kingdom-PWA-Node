// =============================================================================
// ClientGrowth — the in-app 3-sided "revenue agent team" COCKPIT (observable)
// =============================================================================
// Rebuilt 2026-06-25 to answer Darrell's three questions ON the surface:
//
//   1. WHAT SHOULD IT DO  — the CONTRACT strip: one trigger runs all 4 stages;
//      the team auto-produces research/offers/content/sequences + draft leads;
//      YOU approve anything outbound; nothing is sent automatically.
//   2. DOES IT DO IT      — Run the team executes end-to-end, BOUNDED BY THREE
//      BRAKES (budget cap + single-flight lock + kill-switch). It produces real
//      drafts; when the sovereign-A.I. workflow is pending it hands you the exact
//      prompt instead of faking output (DR-0076). Outbound stays human-approved.
//   3. WHY CAN'T I TELL   — the COCKPIT (top): live state, the current stage,
//      what it produced, what's awaiting your approval, the brakes — no mystery.
//   4. REPORT + METRICS   — the ACTIVITY REPORT: what each run DID, WHY (decision
//      rationale: "did X, not Y, because Z"), and metrics from REAL runs/leads.
//
// REALITY-TRACE: leads/funnel/balance come from the REAL synced practice_leads
// list (props). Runs, stage drafts, the outbound queue, and the brake state are
// device-local working content (localStorage). The sovereign A.I. drafting runs
// on the NAS workflow wf-practice-growth; until it returns content a run produces
// the deterministic prompt-pack to capture by hand — never a fake A.I. result.
// =============================================================================
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { SectionTitle, MetricCell, TabScroll } from './shared.jsx';
import {
  ACQUISITION_STAGES, buildStageBrief, buildStagePrompt, makeAcquisitionConfig,
  SIDE_KEYS, DEFAULT_SIDE_KEY, getSidePreset,
  funnelStagesFor, funnelMetrics, nextFunnelStage, stageRequiresOutbound,
  newLead, newStageOutput, canApproveOutput, canOutreach, autoAdvanceLead,
  newRun, setRunStep, runOverallStatus, summarizeForChain,
  newOutboundItem, canApproveOutbound,
  marketplaceBalance, CADENCE_DEFAULT, evaluateCadenceGate, cadenceStatusLabel,
  screenMarketingClaim, flagPotentialPhi, LEAD_SOURCES, FUNNEL_STAGE_META,
  GUARDRAILS, PRACTICE_GROWTH_WEBHOOK, sensitivityFor,
  // cockpit + observability + brakes + report
  runStatusLabel, runPhase, runProgress,
  stepRationale, rationaleText, pushRunEvent,
  RUN_BUDGET_DEFAULT, RUN_COST_PER_STAGE, newRunLock, acquireRunLock, releaseRunLock,
  isLockStale, budgetRemaining, evaluateRunGate, buildActivityReport,
} from '../lib/client-acquisition.js';
import { tracksForSide, ceCreditsToConfirm, isTrackPublishable } from '../lib/tlc-lessons.js';

const LS = {
  side: 'poe.clientGrowth.side.v2',
  outputs: 'poe.clientGrowth.outputs.v2',
  runs: 'poe.clientGrowth.runs.v2',       // v2: run HISTORY (v1 replaced; we now append)
  outbound: 'poe.clientGrowth.outbound.v1',
  cadence: 'poe.clientGrowth.cadence.v1',
  runlock: 'poe.clientGrowth.runlock.v1', // single-flight brake (shared across tabs)
  budget: 'poe.clientGrowth.runbudget.v1',
  kill: 'poe.clientGrowth.killswitch.v1',
};
function loadLS(key, fallback) { try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); } catch { return fallback; } }
function saveLS(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* no storage */ } }

const SIDE_TAB_LABEL = { client: 'Clients', therapist: 'Therapists', training: 'Training' };
const MAX_RUN_HISTORY = 24;

// POST to the NAS practice-growth workflow. Returns parsed JSON or throws.
async function callPracticeGrowth(payload, signal) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 14000);
  if (signal) signal.addEventListener('abort', () => ctrl.abort(), { once: true });
  try {
    const res = await fetch(PRACTICE_GROWTH_WEBHOOK, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload), signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json().catch(() => ({}));
  } finally { clearTimeout(timer); }
}

function ClientGrowth({ leads = [], addLead, updateLead, deleteLead }) {
  const [sideKey, setSideKey] = useState(() => loadLS(LS.side, DEFAULT_SIDE_KEY));
  const [outputs, setOutputs] = useState(() => loadLS(LS.outputs, []));
  const [runs, setRuns] = useState(() => loadLS(LS.runs, []));
  const [outbound, setOutbound] = useState(() => loadLS(LS.outbound, []));
  const [cadence, setCadence] = useState(() => loadLS(LS.cadence, CADENCE_DEFAULT));
  // --- the three brakes (persisted; real, not theater) ---
  const [runLock, setRunLock] = useState(() => loadLS(LS.runlock, newRunLock()));
  const [budget, setBudget] = useState(() => loadLS(LS.budget, RUN_BUDGET_DEFAULT));
  const [killSwitch, setKillSwitch] = useState(() => loadLS(LS.kill, 'clear'));
  const [openStage, setOpenStage] = useState(null);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [running, setRunning] = useState(false);
  const abortRef = useRef(null);
  const killedRef = useRef(false);

  useEffect(() => { saveLS(LS.side, sideKey); }, [sideKey]);
  useEffect(() => { saveLS(LS.outputs, outputs); }, [outputs]);
  useEffect(() => { saveLS(LS.runs, runs); }, [runs]);
  useEffect(() => { saveLS(LS.outbound, outbound); }, [outbound]);
  useEffect(() => { saveLS(LS.cadence, cadence); }, [cadence]);
  useEffect(() => { saveLS(LS.runlock, runLock); }, [runLock]);
  useEffect(() => { saveLS(LS.budget, budget); }, [budget]);
  useEffect(() => { saveLS(LS.kill, killSwitch); }, [killSwitch]);

  // Dead-man: a lock left held by a wedged/closed run is cleared on mount.
  useEffect(() => {
    if (isLockStale(runLock)) setRunLock(releaseRunLock());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Cross-tab single-flight + kill-switch: react to the other tab's brake writes.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === LS.runlock) setRunLock(loadLS(LS.runlock, newRunLock()));
      if (e.key === LS.kill) setKillSwitch(loadLS(LS.kill, 'clear'));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const config = useMemo(() => makeAcquisitionConfig({ sideKey }), [sideKey]);
  const sideOf = (l) => l.sideKey || l.audiencePresetKey || DEFAULT_SIDE_KEY;
  const sideLeads = useMemo(() => leads.filter((l) => sideOf(l) === sideKey), [leads, sideKey]);
  const metrics = useMemo(() => funnelMetrics(sideLeads, config), [sideLeads, config]);
  const funnel = useMemo(() => funnelStagesFor(config), [config]);
  const balance = useMemo(() => marketplaceBalance(leads), [leads]);

  const sideOutputs = useMemo(() => outputs.filter((o) => o.sideKey === sideKey), [outputs, sideKey]);
  const sideRun = useMemo(() => runs.find((r) => r.sideKey === sideKey) || null, [runs, sideKey]);
  const pendingOutbound = useMemo(() => outbound.filter((o) => o.sideKey === sideKey && o.status === 'pending'), [outbound, sideKey]);
  const report = useMemo(() => buildActivityReport({ runs, leads, outbound, outputs, sideKey }), [runs, leads, outbound, outputs, sideKey]);
  const runGate = useMemo(() => evaluateRunGate({ killSwitch, lock: runLock, budget }), [killSwitch, runLock, budget]);

  const priorSummary = useMemo(
    () => summarizeForChain(sideOutputs.filter((o) => o.status === 'approved')),
    [sideOutputs]
  );

  // -- output helpers -------------------------------------------------------
  const addOutput = (out) => setOutputs((prev) => [...prev, out]);
  const approveOutput = (id) => setOutputs((prev) => prev.map((o) => (o.id === id ? { ...o, status: 'approved', approvedAt: new Date().toISOString() } : o)));
  const removeOutput = (id) => setOutputs((prev) => prev.filter((o) => o.id !== id));
  const syncRun = (r) => setRuns((prev) => prev.map((x) => (x.id === r.id ? r : x)));

  // -- brake controls -------------------------------------------------------
  const stopRun = () => { killedRef.current = true; if (abortRef.current) abortRef.current.abort(); };
  const toggleKillSwitch = () => {
    const next = killSwitch === 'engaged' ? 'clear' : 'engaged';
    setKillSwitch(next);
    if (next === 'engaged') stopRun(); // engaging the master stop halts any in-flight run
  };
  const resetBudget = () => setBudget(RUN_BUDGET_DEFAULT);

  // ========================================================================
  // RUN THE TEAM — one trigger chains all four stages, behind the three brakes.
  // ========================================================================
  const runTheTeam = async () => {
    if (running) return; // single-flight in this tab
    const gate = evaluateRunGate({ killSwitch, lock: runLock, budget });
    if (!gate.allowed) { alert(`Cannot run the team yet:\n- ${gate.reasons.join('\n- ')}`); return; }
    setRunning(true);
    killedRef.current = false;

    let run = newRun(config);
    run = pushRunEvent(run, 'run-started', `${SIDE_TAB_LABEL[sideKey]} side`);
    const lock = acquireRunLock(run.id);
    setRunLock(lock);
    // APPEND to history (newest first), keep the last MAX_RUN_HISTORY runs.
    setRuns((prev) => [run, ...prev].slice(0, MAX_RUN_HISTORY));

    let workingBudget = budget;
    const producedThisRun = [];
    let landedLeads = 0; let queuedOutbound = 0;

    for (const stage of ACQUISITION_STAGES) {
      if (killedRef.current) break;

      run = setRunStep(run, stage.key, { status: 'running' });
      run = pushRunEvent(run, 'stage-started', `${stage.emoji} ${stage.role}`);
      syncRun(run);

      // Spend one budget unit for the call (the budget depletes for real).
      workingBudget = { ...workingBudget, usedCalls: (workingBudget.usedCalls || 0) + RUN_COST_PER_STAGE };
      setBudget(workingBudget);

      const prompt = buildStagePrompt(stage.key, config, { priorSummary: summarizeForChain([...sideOutputs.filter((o) => o.status === 'approved'), ...producedThisRun]) });

      let text = ''; let payload = null; let errored = false;
      const ctrl = new AbortController(); abortRef.current = ctrl;
      try {
        payload = await callPracticeGrowth({ stage: stage.key, audience: sideKey, sensitivity: sensitivityFor(config), prompt }, ctrl.signal);
        text = (payload && (payload.draft || payload.text || payload.output)) || '';
      } catch (e) {
        if (ctrl.signal.aborted) killedRef.current = true; else errored = true;
      }
      abortRef.current = null;
      if (killedRef.current) break;

      if (text) {
        const out = newStageOutput(stage.key, text, { sideKey, runId: run.id });
        producedThisRun.push(out); addOutput(out);
        run = setRunStep(run, stage.key, { status: 'produced', outputId: out.id, rationale: rationaleText(stepRationale(stage.key, 'produced', { live: true })) });
        run = pushRunEvent(run, 'stage-produced', stage.role);
      } else if (errored) {
        run = setRunStep(run, stage.key, { status: 'error', rationale: rationaleText(stepRationale(stage.key, 'error')), message: 'Stage call failed (network/workflow).' });
        run = pushRunEvent(run, 'stage-error', stage.role);
      } else {
        // Honest: the NAS workflow isn't wired (or returned nothing). Capture the
        // exact prompt as a needs-capture output so a human runs it — no fake data.
        const out = { ...newStageOutput(stage.key, '', { sideKey, runId: run.id }), status: 'needs-capture', prompt };
        producedThisRun.push(out); addOutput(out);
        run = setRunStep(run, stage.key, { status: 'needs-capture', outputId: out.id, rationale: rationaleText(stepRationale(stage.key, 'needs-capture')), message: 'Capture the A.I. output (NAS workflow pending).' });
        run = pushRunEvent(run, 'stage-needs-capture', stage.role);
      }
      syncRun(run);

      // Auto-flow: land any returned leads in the CRM and auto-advance across
      // INTERNAL stages only (never across the outbound boundary).
      if (payload && Array.isArray(payload.leads) && addLead) {
        for (const raw of payload.leads) {
          const lead = newLead({ ...raw, sideKey, source: raw.source || 'run-the-team' });
          const auto = autoAdvanceLead(lead, config); // new -> outreach-ready
          const landed = auto ? { ...lead, stage: auto, history: [...lead.history, { stage: auto, at: new Date().toISOString(), note: 'auto-advance (internal)' }] } : lead;
          addLead(landed); landedLeads += 1;
          run = pushRunEvent(run, 'lead-landed', lead.name || lead.id);
        }
        syncRun(run);
      }
    }

    // Draft outbound from the conversion sequence for any outreach-ready leads —
    // QUEUED for approval, never sent.
    const seq = producedThisRun.find((o) => o.stageKey === 'conversion-system' && o.content);
    if (seq && !killedRef.current) {
      const readyLeads = leads.filter((l) => sideOf(l) === sideKey && l.stage === 'outreach-ready');
      for (const lead of readyLeads) {
        const item = newOutboundItem({ leadId: lead.id, sideKey, channel: lead.contactMethod || 'email', subject: `Following up — ${config.tenant}`, body: seq.content.slice(0, 600), runId: run.id });
        setOutbound((prev) => [item, ...prev]);
        queuedOutbound += 1;
        run = pushRunEvent(run, 'outbound-queued', lead.name || lead.id);
      }
    }

    const killed = killedRef.current;
    run = { ...run, finishedAt: new Date().toISOString(), killed, status: killed ? 'killed' : runOverallStatus(run), summary: { landedLeads, queuedOutbound } };
    run = pushRunEvent(run, killed ? 'run-killed' : 'run-finished', killed ? 'stopped' : `landed ${landedLeads}, queued ${queuedOutbound}`);
    syncRun(run);
    setRunLock(releaseRunLock());
    setRunning(false);
  };

  // -- outbound approval (the binding gate) ---------------------------------
  const approveOutboundItem = (item) => {
    const lead = leads.find((l) => l.id === item.leadId);
    const verdict = canApproveOutbound(item, lead);
    if (!verdict.ok) { alert(`Cannot approve:\n- ${verdict.reasons.join('\n- ')}`); return; }
    setOutbound((prev) => prev.map((o) => (o.id === item.id ? { ...o, status: 'approved', approvedAt: new Date().toISOString() } : o)));
    if (lead && updateLead && !stageRequiresOutbound(lead.stage)) {
      updateLead(lead.id, { stage: 'contacted', history: [...(lead.history || []), { stage: 'contacted', at: new Date().toISOString(), note: 'outbound approved' }] });
    }
  };
  const rejectOutboundItem = (id) => setOutbound((prev) => prev.map((o) => (o.id === id ? { ...o, status: 'rejected' } : o)));

  const draftOutreachForLead = (lead) => {
    const seq = [...sideOutputs].reverse().find((o) => o.stageKey === 'conversion-system' && o.status === 'approved' && o.content)
      || [...sideOutputs].reverse().find((o) => o.stageKey === 'conversion-system' && o.content);
    const body = seq ? seq.content.slice(0, 600) : `Hi ${lead.name}, following up from ${config.tenant}. (Draft — edit before sending.)`;
    const item = newOutboundItem({ leadId: lead.id, sideKey, channel: lead.contactMethod || 'email', subject: `Following up — ${config.tenant}`, body });
    setOutbound((prev) => [item, ...prev]);
  };

  return (
    <div className="space-y-5">
      {/* Header + 3-side switcher */}
      <section className="bg-white border-2 border-[#1A1815] p-5 sm:p-6">
        <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] font-semibold mb-1">Client Growth · Revenue Agent Team</div>
        <h2 className="text-2xl mb-1" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>A 4-stage team that runs itself</h2>
        <p className="text-sm text-[#5A5751] leading-relaxed max-w-prose" style={{ fontFamily: '"Fraunces", serif' }}>
          One trigger runs all four stages; the team produces research, offers, content, and sequences, and lands leads in the CRM.
          <strong> You approve anything outbound</strong> — nothing is sent automatically.
        </p>
        <div className="mt-4">
          <div className="text-[9px] uppercase tracking-wider text-[#5A5751] mb-1.5">The three sides of the marketplace</div>
          <TabScroll label="Marketplace side">
            {SIDE_KEYS.map((k) => (
              <button key={k} onClick={() => { setSideKey(k); setOpenStage(null); }} aria-pressed={sideKey === k}
                className={`px-3 py-2 min-h-[40px] text-[11px] uppercase tracking-wider whitespace-nowrap border focus:outline focus:outline-2 focus:outline-[#B85838] ${sideKey === k ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'bg-white text-[#5A5751] border-[#E8E4DC] hover:border-[#B85838]'}`}>
                {SIDE_TAB_LABEL[k]}
              </button>
            ))}
          </TabScroll>
          <p className="text-[11px] text-[#5A5751] italic mt-2" style={{ fontFamily: '"Fraunces", serif' }}>{config.audienceWho}.</p>
          {config.phiSensitive && (
            <p className="text-[11px] text-[#B85838] mt-1.5 font-medium">⚠ Highest sensitivity: pre-intake / contact-level only. No PHI, no clinical detail — ever.</p>
          )}
        </div>
      </section>

      {/* COCKPIT — is it running? which stage? what's waiting on me? (answers "why can't I tell") */}
      <Cockpit
        run={sideRun} running={running} sideLabel={SIDE_TAB_LABEL[sideKey]}
        pendingOutboundCount={pendingOutbound.length} needsCapture={report.needsCapture}
        budget={budget} runLock={runLock} killSwitch={killSwitch} runGate={runGate}
        onRun={runTheTeam} onStop={stopRun} onToggleKill={toggleKillSwitch} onResetBudget={resetBudget}
      />

      {/* THE CONTRACT — what should it do, automated vs you-approve (answers "what should it do") */}
      <ContractStrip />

      {/* APPROVE-OUTBOUND-ONLY queue — the one human gate */}
      <section>
        <SectionTitle eyebrow="The one human gate">Outbound — needs your approval · {pendingOutbound.length}</SectionTitle>
        {pendingOutbound.length === 0 ? (
          <div className="bg-white border border-[#E8E4DC] p-4 text-center">
            <p className="text-sm text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>Nothing waiting to go out. The team auto-produces internally; outbound shows up here for your sign-off.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pendingOutbound.map((item) => {
              const lead = leads.find((l) => l.id === item.leadId);
              const verdict = canApproveOutbound(item, lead);
              return (
                <div key={item.id} className="bg-white border border-[#B85838] p-3">
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <span style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{lead ? lead.name : 'Lead'} · <span className="text-xs text-[#5A5751]">{item.channel}</span></span>
                    <span className="text-[10px] uppercase tracking-wider text-[#B85838]">Pending</span>
                  </div>
                  <div className="text-xs text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}><strong>{item.subject}</strong></div>
                  <pre className="text-[11px] text-[#1A1815] whitespace-pre-wrap leading-snug mt-1" style={{ fontFamily: '"Fraunces", serif' }}>{item.body}</pre>
                  {item.blocked && <div className="text-[11px] text-[#B85838] font-medium mt-1">⛔ Guardrail issue in the copy — resolve before sending.</div>}
                  {!verdict.ok && verdict.reasons.map((r, i) => <div key={i} className="text-[11px] text-[#B85838] mt-0.5">• {r}</div>)}
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => approveOutboundItem(item)} disabled={!verdict.ok}
                      className="text-[10px] uppercase tracking-wider px-3 py-1.5 border border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white disabled:opacity-40 min-h-[34px]">
                      Approve to send
                    </button>
                    <button onClick={() => rejectOutboundItem(item.id)} className="text-[10px] uppercase tracking-wider px-3 py-1.5 border border-[#E8E4DC] text-[#5A5751] hover:border-[#B85838] min-h-[34px]">Reject</button>
                  </div>
                </div>
              );
            })}
            <p className="text-[10px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>Approving marks the draft cleared to send and advances the lead to "Contacted." We never auto-send.</p>
          </div>
        )}
      </section>

      {/* ACTIVITY REPORT — what it DID, WHY, with metrics (answers "report with metrics + rationale") */}
      <ActivityReport report={report} metrics={metrics} sideLabel={SIDE_TAB_LABEL[sideKey]} />

      {/* Marketplace balance — don't over-acquire one side */}
      <section className={`border-2 p-4 ${balance.recommend === 'balanced' ? 'border-[#5A6E3D] bg-white' : 'border-[#B85838] bg-white'}`}>
        <div className="text-[10px] uppercase tracking-[0.25em] font-semibold mb-2" style={{ color: balance.recommend === 'balanced' ? '#5A6E3D' : '#B85838' }}>
          ⚖ Marketplace balance
        </div>
        <div className="grid grid-cols-3 gap-2 mb-2">
          <MetricCell label="Active clients" value={`${balance.clientsActive}`} small accent="rust" />
          <MetricCell label="Serving therapists" value={`${balance.therapistsServing}`} small accent="green" />
          <MetricCell label="Capacity (slots)" value={`${balance.capacity}`} small />
        </div>
        <p className="text-xs" style={{ fontFamily: '"Fraunces", serif' }}>{balance.message}</p>
      </section>

      {/* Pipeline summary (real data) */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#E8E4DC] border border-[#E8E4DC]">
        <MetricCell label="Leads" value={`${metrics.total}`} sub={`${metrics.active} active`} small accent="rust" />
        <MetricCell label="Won" value={`${metrics.won}`} sub="this side" small accent="green" />
        <MetricCell label="Conversion" value={metrics.closed > 0 ? `${metrics.conversionRate.toFixed(0)}%` : '—'} sub="of closed" small />
        <MetricCell label="Consented" value={`${metrics.consented}`} sub="outreach OK" small />
      </section>

      {/* Lead pipeline */}
      <section>
        <div className="flex items-baseline justify-between mb-3 pb-2 border-b border-[#1A1815] gap-2 flex-wrap">
          <h2 className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751]">{SIDE_TAB_LABEL[sideKey]} pipeline · {sideLeads.length}</h2>
          <button onClick={() => setShowLeadForm(!showLeadForm)} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815]">{showLeadForm ? '× Cancel' : '+ Log lead'}</button>
        </div>
        {showLeadForm && <LeadForm config={config} sideKey={sideKey} onSave={(lead) => { addLead && addLead(lead); setShowLeadForm(false); }} />}

        <div className="bg-white border border-[#E8E4DC] p-3 mb-3">
          <div className="text-[9px] uppercase tracking-wider text-[#5A5751] mb-2">Funnel</div>
          <div className="space-y-1.5">
            {funnel.map((s) => {
              const count = metrics.byStage[s.key] || 0;
              const pct = metrics.total > 0 ? (count / metrics.total) * 100 : 0;
              const barColor = s.group === 'won' ? 'bg-[#5A6E3D]' : s.group === 'lost' ? 'bg-[#5A5751]' : 'bg-[#B85838]';
              return (
                <div key={s.key}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span style={{ fontFamily: '"Fraunces", serif' }}>{s.label}{s.requiresOutbound ? '' : ' ·auto'}</span>
                    <span className="text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{count}</span>
                  </div>
                  <div className="h-1.5 bg-[#E8E4DC]"><div className={`h-full ${barColor}`} style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
          </div>
        </div>

        {sideLeads.length === 0 ? (
          <div className="bg-white border border-[#E8E4DC] p-6 text-center">
            <p className="text-sm text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No {config.leadNounPlural} yet. Run the team, or log one manually.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {[...sideLeads].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((lead) => (
              <LeadRow key={lead.id} lead={lead} config={config} updateLead={updateLead} deleteLead={deleteLead} onDraftOutreach={draftOutreachForLead} />
            ))}
          </div>
        )}
      </section>

      {/* Supporting lessons (lead magnets + retention) */}
      <section>
        <SectionTitle eyebrow="Supporting lessons">Learning that backs this side</SectionTitle>
        <p className="text-sm text-[#5A5751] mb-3 max-w-prose" style={{ fontFamily: '"Fraunces", serif' }}>
          Online lessons (built on the Learn engine — age-adaptive, reading-support-ready) are both a <strong>lead magnet</strong> and a <strong>retention / outcomes engine</strong>: they draw {config.leadNounPlural} in and reinforce the care.
        </p>
        <div className="space-y-2">
          {tracksForSide(sideKey).map((track) => {
            const ce = ceCreditsToConfirm(track);
            return (
              <div key={track.key} className="bg-white border border-[#E8E4DC] p-3">
                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                  <span style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{track.title}</span>
                  <span className={`text-[10px] uppercase tracking-wider ${isTrackPublishable(track) ? 'text-[#5A6E3D]' : 'text-[#B85838]'}`}>
                    {isTrackPublishable(track) ? '✓ validated' : 'needs validation'}
                  </span>
                </div>
                <div className="text-xs text-[#5A5751] mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{track.purpose}</div>
                <div className="text-[10px] uppercase tracking-wider text-[#5A5751] mt-1">
                  {track.modules.length} lessons · {track.leadMagnet ? 'lead magnet' : ''}{track.retention ? ' · retention' : ''}{ce > 0 ? ` · ~${ce} CE (to confirm)` : ''}
                </div>
                <ul className="text-[11px] text-[#5A5751] mt-1.5 space-y-0.5" style={{ fontFamily: '"Fraunces", serif' }}>
                  {track.modules.map((m) => <li key={m.id}>• {m.title}</li>)}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* Per-stage manual cards (refine / capture) */}
      <section>
        <SectionTitle eyebrow="The stages">Refine or capture by hand</SectionTitle>
        <div className="space-y-2.5">
          {ACQUISITION_STAGES.map((stage) => (
            <StageCard key={stage.key} stage={stage} config={config} sideKey={sideKey} priorSummary={priorSummary}
              open={openStage === stage.key} onToggle={() => setOpenStage(openStage === stage.key ? null : stage.key)}
              outputs={sideOutputs.filter((o) => o.stageKey === stage.key)}
              addOutput={addOutput} approveOutput={approveOutput} removeOutput={removeOutput} />
          ))}
        </div>
      </section>

      {/* Optional continuous cadence — inert, behind the brakes */}
      <CadencePanel cadence={cadence} setCadence={setCadence} />

      {/* Guardrails ledger */}
      <section className="bg-white border-2 border-[#5A6E3D] p-4 sm:p-5">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#5A6E3D] font-semibold mb-3">Binding guardrails</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {Object.entries(GUARDRAILS).map(([key, g]) => (
            <div key={key} className="border border-[#E8E4DC] p-2.5">
              <div className="text-xs font-semibold" style={{ fontFamily: '"Fraunces", serif' }}>✓ {g.label}</div>
              <div className="text-[11px] text-[#5A5751] mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{g.detail}</div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-[#5A5751] italic mt-3" style={{ fontFamily: '"Fraunces", serif' }}>
          The A.I. drafts, researches, and produces; Christina and Darrell approve anything outbound. We produce packaging, sequences, and leads — never transactions.
        </p>
      </section>
    </div>
  );
}

// -----------------------------------------------------------------------------
// COCKPIT — the live status seat. State, current stage, what's awaiting you, brakes.
// -----------------------------------------------------------------------------
// State is carried by the colored status dot + the colored eyebrow text; the band
// background stays on the approved cream token (no new inline colors — contrast guard).
const PHASE_META = {
  idle:    { label: 'Idle',            color: '#5A5751', bg: '#FAF8F4' },
  running: { label: 'Running',         color: '#B85838', bg: '#FAF8F4' },
  review:  { label: 'Ready to review', color: '#5A6E3D', bg: '#FAF8F4' },
  capture: { label: 'Needs capture',   color: '#B85838', bg: '#FAF8F4' },
  stopped: { label: 'Stopped',         color: '#5A5751', bg: '#FAF8F4' },
  error:   { label: 'Error',           color: '#B85838', bg: '#FAF8F4' },
};
function Cockpit({ run, running, sideLabel, pendingOutboundCount, needsCapture, budget, runLock, killSwitch, runGate, onRun, onStop, onToggleKill, onResetBudget }) {
  const phase = running ? 'running' : runPhase(run);
  const meta = PHASE_META[phase] || PHASE_META.idle;
  const { done, total } = runProgress(run);
  const killEngaged = killSwitch === 'engaged';
  const lockHeld = !!(runLock && runLock.held && !isLockStale(runLock));
  const remaining = budgetRemaining(budget);

  return (
    <section className="border-2 border-[#1A1815] bg-white" aria-label="Run cockpit">
      {/* live state band */}
      <div className="p-4 sm:p-5" style={{ background: meta.bg }}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${running ? 'animate-pulse' : ''}`} style={{ background: meta.color }} aria-hidden="true" />
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.3em] font-semibold" style={{ color: meta.color }}>Cockpit · {meta.label}</div>
              <div className="text-sm text-[#1A1815] mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{runStatusLabel(run && running ? { ...run, status: 'running' } : run)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {running ? (
              <button onClick={onStop} className="bg-[#B85838] text-white px-4 py-2.5 text-xs uppercase tracking-wider hover:bg-[#1A1815] min-h-[44px]">■ Stop run</button>
            ) : (
              <button onClick={onRun} disabled={!runGate.allowed}
                title={runGate.allowed ? 'Run all four stages' : runGate.reasons.join(' ')}
                className="bg-[#1A1815] text-white px-4 py-2.5 text-xs uppercase tracking-wider hover:bg-[#B85838] disabled:opacity-50 min-h-[44px]">
                ⚡ Run the team
              </button>
            )}
          </div>
        </div>

        {/* stage progress dots */}
        {(running || run) && (
          <div className="flex items-center gap-1.5 mt-3" aria-label={`Stage progress ${done} of ${total}`}>
            {ACQUISITION_STAGES.map((s) => {
              const step = (run && run.steps || []).find((x) => x.stageKey === s.key);
              const st = step ? step.status : 'pending';
              const c = st === 'produced' ? '#5A6E3D' : st === 'needs-capture' ? '#B85838' : st === 'error' ? '#B85838' : st === 'running' ? '#1A1815' : '#E8E4DC';
              return (
                <div key={s.key} className="flex items-center gap-1.5" title={`${s.role}: ${st}`}>
                  <span className={`text-[11px] ${st === 'running' ? 'font-semibold' : ''}`} style={{ fontFamily: '"Fraunces", serif', color: c }}>{s.emoji}</span>
                  <span className="inline-block h-1 w-6 sm:w-10" style={{ background: c }} aria-hidden="true" />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* what's on me + brakes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-[#E8E4DC] border-t-2 border-[#1A1815]">
        <div className="bg-white p-3">
          <div className="text-[9px] uppercase tracking-wider text-[#5A5751]">Awaiting your approval</div>
          <div className="text-2xl" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, color: pendingOutboundCount > 0 ? '#B85838' : '#1A1815' }}>{pendingOutboundCount}</div>
          <div className="text-[10px] text-[#5A5751]">outbound draft(s) — nothing sends without you</div>
        </div>
        <div className="bg-white p-3">
          <div className="text-[9px] uppercase tracking-wider text-[#5A5751]">Needs you to capture</div>
          <div className="text-2xl" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, color: needsCapture > 0 ? '#B85838' : '#1A1815' }}>{needsCapture}</div>
          <div className="text-[10px] text-[#5A5751]">A.I. prompt(s) to run (sovereign workflow pending)</div>
        </div>
        <div className="bg-white p-3">
          <div className="text-[9px] uppercase tracking-wider text-[#5A5751]">Brakes</div>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            <button onClick={onToggleKill} title="Master stop — when engaged, no run can start"
              className={`text-[9px] uppercase tracking-wider px-2 py-1 border min-h-[30px] ${killEngaged ? 'bg-[#B85838] text-white border-[#B85838]' : 'border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white'}`}>
              {killEngaged ? '⛔ Kill-switch ON — clear' : '● Kill-switch clear'}
            </button>
            <span className={`text-[9px] uppercase tracking-wider px-2 py-1 border ${lockHeld ? 'border-[#B85838] text-[#B85838]' : 'border-[#E8E4DC] text-[#5A5751]'}`}>
              {lockHeld ? '🔒 Run in progress' : '🔓 Lock free'}
            </span>
          </div>
          <div className="text-[10px] text-[#5A5751] mt-1.5 flex items-center gap-1.5 flex-wrap">
            <span>Budget: {remaining}/{(budget && budget.capCalls) || 0} stage-calls left</span>
            <button onClick={onResetBudget} className="underline hover:text-[#B85838]">reset</button>
          </div>
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// CONTRACT STRIP — "what should it do": the 4 stages + automated vs you-approve.
// -----------------------------------------------------------------------------
function ContractStrip() {
  return (
    <section className="bg-white border border-[#E8E4DC] p-4">
      <div className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] font-semibold mb-1">What the team does · one run</div>
      <p className="text-xs text-[#5A5751] mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
        One trigger → four stages, each feeding the next. The first three <strong>auto-produce drafts</strong>; the fourth builds the sequence and queues outbound that <strong>waits for you</strong>. Nothing is sent automatically.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
        {ACQUISITION_STAGES.map((s, i) => (
          <div key={s.key} className="border border-[#E8E4DC] p-2.5 relative">
            <div className="text-[9px] uppercase tracking-wider text-[#5A5751]">Stage {s.n}{i < ACQUISITION_STAGES.length - 1 ? ' →' : ''}</div>
            <div className="text-sm mt-0.5" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{s.emoji} {s.role}</div>
            <div className="text-[11px] text-[#5A5751] mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>Produces: {s.producesLabel.toLowerCase()}</div>
            <div className={`text-[9px] uppercase tracking-wider mt-1.5 inline-block px-1.5 py-0.5 border bg-[#FAF8F4] ${s.key === 'conversion-system' ? 'text-[#B85838] border-[#B85838]' : 'text-[#5A6E3D] border-[#5A6E3D]'}`}>
              {s.key === 'conversion-system' ? 'Drafts → you approve' : 'Automated draft'}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// ACTIVITY REPORT — what it DID, WHY (rationale), with metrics from real runs.
// -----------------------------------------------------------------------------
function ActivityReport({ report, metrics, sideLabel }) {
  const [openRun, setOpenRun] = useState(null);
  const hrs = Math.floor(report.estMinutesSaved / 60);
  const mins = report.estMinutesSaved % 60;
  const timeSaved = report.estMinutesSaved === 0 ? '—' : hrs > 0 ? `~${hrs}h ${mins}m` : `~${mins}m`;
  return (
    <section>
      <SectionTitle eyebrow="What it did · why · metrics">Activity report · {sideLabel}</SectionTitle>
      {/* metric cells — real counts from real runs/leads/outbound */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#E8E4DC] border border-[#E8E4DC] mb-3">
        <MetricCell label="Runs" value={`${report.runsTotal}`} sub="this side" small accent="rust" />
        <MetricCell label="Drafts produced" value={`${report.draftsProduced}`} sub={`${report.approvedDrafts} approved`} small accent="green" />
        <MetricCell label="Leads landed" value={`${report.leadsLanded}`} sub="by the team" small />
        <MetricCell label="Outbound" value={`${report.outboundApproved}/${report.outboundQueued}`} sub={`${report.outboundPending} pending`} small accent="rust" />
        <MetricCell label="Won" value={`${metrics.won}`} sub="this side" small accent="green" />
        <MetricCell label="Conversion" value={metrics.closed > 0 ? `${metrics.conversionRate.toFixed(0)}%` : '—'} sub="of closed" small />
        <MetricCell label="Needs capture" value={`${report.needsCapture}`} sub="A.I. pending" small />
        <MetricCell label="Est. time saved" value={timeSaved} sub="estimate" small />
      </div>
      <p className="text-[10px] text-[#5A5751] italic mb-3" style={{ fontFamily: '"Fraunces", serif' }}>{report.estTimeSavedAssumption} Counts are real; time-saved is the only estimate.</p>

      {report.perRun.length === 0 ? (
        <div className="bg-white border border-[#E8E4DC] p-5 text-center">
          <p className="text-sm text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No runs yet. Press <strong>Run the team</strong> above — each run logs what it did and why, right here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {report.perRun.map((r) => {
            const open = openRun === r.runId;
            const statusColor = r.status === 'produced' ? 'text-[#5A6E3D]' : r.status === 'killed' ? 'text-[#5A5751]' : 'text-[#B85838]';
            return (
              <div key={r.runId} className="bg-white border border-[#E8E4DC]">
                <button onClick={() => setOpenRun(open ? null : r.runId)} aria-expanded={open}
                  className="w-full flex items-center justify-between gap-2 p-3 text-left hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]">
                  <div className="min-w-0">
                    <span className="text-xs" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>Run · {r.startedAt ? new Date(r.startedAt).toLocaleString() : '—'}</span>
                    <span className={`text-[10px] uppercase tracking-wider ml-2 ${statusColor}`}>{r.status}</span>
                  </div>
                  <span className="text-[10px] text-[#5A5751] shrink-0">{r.draftsProduced} draft(s) · {r.landedLeads} lead(s) · {r.queuedOutbound} outbound {open ? '−' : '+'}</span>
                </button>
                {open && (
                  <div className="p-3 pt-0 space-y-2">
                    {r.decisions.length === 0 ? (
                      <p className="text-[11px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No stage decisions recorded for this run.</p>
                    ) : r.decisions.map((d) => (
                      <div key={d.stageKey} className="border-l-2 border-[#E8E4DC] pl-2.5">
                        <div className="text-[11px]" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{d.emoji} {d.role} <span className="text-[9px] uppercase tracking-wider text-[#5A5751] font-normal">· {d.status}</span></div>
                        <div className="text-[11px] text-[#5A5751] mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{d.rationale}</div>
                      </div>
                    ))}
                    {r.events && r.events.length > 0 && (
                      <details className="mt-1">
                        <summary className="text-[10px] uppercase tracking-wider text-[#5A5751] cursor-pointer">Event log · {r.events.length}</summary>
                        <div className="mt-1 space-y-0.5">
                          {r.events.map((e, i) => (
                            <div key={i} className="text-[10px] text-[#5A5751] flex gap-2" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                              <span className="text-[#B85838]">{e.type}</span><span className="truncate">{e.detail}</span>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// -----------------------------------------------------------------------------
function CadencePanel({ cadence, setCadence }) {
  // The real Cage brakes feed isn't wired into this surface yet; default-deny
  // shows the honest inert state. Arming is reserved for Darrell + the orchestrator.
  const gate = evaluateCadenceGate(cadence, null);
  return (
    <section className="bg-white border border-[#E8E4DC] p-4">
      <div className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] font-semibold mb-1">Optional · continuous cadence</div>
      <p className="text-xs text-[#5A5751] mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
        An auto-run on a schedule (e.g., refresh market signals + surface new leads daily) — <strong>inert by default</strong>, behind the three brakes (budget + lock + kill-switch) and an explicit arm only Darrell sets. It still approves outbound.
      </p>
      <label className="flex items-center gap-2 text-xs text-[#5A5751] mb-1" style={{ fontFamily: '"Fraunces", serif' }}>
        <input type="checkbox" checked={!!cadence.enabled} onChange={(e) => setCadence({ ...cadence, enabled: e.target.checked })} className="w-4 h-4" />
        Enable cadence feature (still requires arming + brakes)
      </label>
      <div className={`text-[11px] mt-1 ${gate.allowed ? 'text-[#5A6E3D]' : 'text-[#5A5751]'}`}>
        Status: {cadenceStatusLabel(cadence, null)}
      </div>
      {!gate.allowed && (
        <ul className="text-[10px] text-[#5A5751] mt-1 space-y-0.5">
          {gate.reasons.map((r, i) => <li key={i}>• {r}</li>)}
        </ul>
      )}
    </section>
  );
}

// -----------------------------------------------------------------------------
function StageCard({ stage, config, sideKey, priorSummary, open, onToggle, outputs, addOutput, approveOutput, removeOutput }) {
  const brief = useMemo(() => buildStageBrief(stage.key, config), [stage.key, config]);
  const prompt = useMemo(() => buildStagePrompt(stage.key, config, { priorSummary }), [stage.key, config, priorSummary]);
  const [draft, setDraft] = useState('');
  const [copied, setCopied] = useState(false);
  const approvedCount = outputs.filter((o) => o.status === 'approved').length;
  const liveFindings = useMemo(() => ({ claims: screenMarketingClaim(draft), phi: flagPotentialPhi(draft) }), [draft]);
  const draftBlocked = liveFindings.claims.some((f) => f.severity === 'block') || liveFindings.phi.length > 0;

  const copyPrompt = async () => { try { await navigator.clipboard.writeText(prompt); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { setCopied(false); } };
  const saveDraft = () => { if (!draft.trim()) return; addOutput(newStageOutput(stage.key, draft.trim(), { sideKey })); setDraft(''); };

  return (
    <div className="bg-white border border-[#E8E4DC]">
      <button onClick={onToggle} aria-expanded={open} className="w-full flex items-center justify-between gap-3 p-3.5 text-left hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]">
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="text-[10px] uppercase tracking-wider text-[#5A5751] shrink-0">Stage {stage.n}</span>
          <span className="shrink-0" aria-hidden="true">{stage.emoji}</span>
          <span style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }} className="truncate">{stage.role}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {approvedCount > 0 && <span className="text-[10px] uppercase tracking-wider text-[#5A6E3D]">{approvedCount} approved</span>}
          <span className="text-[#5A5751]">{open ? '−' : '+'}</span>
        </div>
      </button>
      {open && (
        <div className="p-3.5 pt-0 space-y-3">
          <p className="text-sm text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>{stage.goal}</p>
          <div className="flex flex-wrap gap-1.5">
            {brief.guardrails.map((g) => <span key={g.key} title={g.detail} className="text-[9px] uppercase tracking-wider px-2 py-1 border border-[#E8E4DC] text-[#5A5751] bg-[#FAF8F4]">{g.label}</span>)}
          </div>
          <div className="bg-[#FAF8F4] border border-[#E8E4DC] p-2.5">
            <div className="flex items-baseline justify-between gap-2 mb-1">
              <div className="text-[9px] uppercase tracking-wider text-[#5A5751]">A.I. prompt (deterministic)</div>
              <button onClick={copyPrompt} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] min-h-[32px]">{copied ? '✓ Copied' : 'Copy prompt'}</button>
            </div>
            <pre className="text-[11px] text-[#1A1815] whitespace-pre-wrap leading-snug" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{prompt}</pre>
          </div>
          <div>
            <textarea rows="4" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={`Capture the ${brief.producesLabel.toLowerCase()} draft…`} className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" style={{ fontFamily: '"Fraunces", serif' }} />
            {draft.trim() && (liveFindings.claims.length > 0 || liveFindings.phi.length > 0) && (
              <div className="mt-1.5 space-y-1">
                {liveFindings.claims.map((f, i) => <div key={`c${i}`} className={`text-[11px] ${f.severity === 'block' ? 'text-[#B85838] font-medium' : 'text-[#5A5751]'}`}>{f.severity === 'block' ? '⛔' : '⚠'} "{f.term}" — {f.why} <span className="italic">Fix: {f.fix}</span></div>)}
                {liveFindings.phi.map((f, i) => <div key={`p${i}`} className="text-[11px] text-[#B85838] font-medium">⛔ Possible PHI: "{f.term}" — {f.why}</div>)}
              </div>
            )}
            <button onClick={saveDraft} disabled={!draft.trim() || draftBlocked} className="mt-2 w-full bg-[#5A6E3D] text-white py-2 text-[10px] uppercase tracking-wider hover:bg-[#1A1815] disabled:opacity-40 min-h-[36px]">
              {draftBlocked ? 'Resolve guardrail issues to save' : 'Save draft for review'}
            </button>
          </div>
          {outputs.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="text-[9px] uppercase tracking-wider text-[#5A5751]">Captured · {outputs.length}</div>
              {outputs.map((o) => <OutputRow key={o.id} output={o} onApprove={approveOutput} onRemove={removeOutput} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function OutputRow({ output, onApprove, onRemove }) {
  const [show, setShow] = useState(false);
  const approvable = canApproveOutput(output);
  const needsCapture = output.status === 'needs-capture';
  return (
    <div className="border border-[#E8E4DC] bg-[#FAF8F4] p-2">
      <div className="flex items-baseline justify-between gap-2">
        <button onClick={() => setShow(!show)} className="text-left flex-1 min-w-0 focus:outline focus:outline-2 focus:outline-[#B85838]">
          <span className={`text-[10px] uppercase tracking-wider mr-2 ${output.status === 'approved' ? 'text-[#5A6E3D]' : 'text-[#B85838]'}`}>
            {output.status === 'approved' ? '✓ Approved' : needsCapture ? '✎ Needs capture' : 'Draft'}
          </span>
          <span className="text-xs text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
            {needsCapture ? 'Run the prompt, paste the result' : `${output.content.slice(0, 70)}${output.content.length > 70 ? '…' : ''}`}
          </span>
        </button>
        <div className="flex items-center gap-1.5 shrink-0">
          {output.status !== 'approved' && !needsCapture && (
            <button onClick={() => onApprove(output.id)} disabled={!approvable} title={approvable ? 'Approve' : 'Resolve guardrail issues first'} className="text-[10px] uppercase tracking-wider text-[#5A6E3D] hover:text-[#1A1815] disabled:opacity-40 min-h-[32px] px-2">Approve</button>
          )}
          <button onClick={() => onRemove(output.id)} aria-label="Delete" className="text-sm text-[#5A5751] hover:text-[#B85838] min-h-[32px] min-w-[32px]">×</button>
        </div>
      </div>
      {show && needsCapture && output.prompt && <pre className="text-[11px] text-[#1A1815] whitespace-pre-wrap leading-snug mt-1.5" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{output.prompt}</pre>}
      {show && !needsCapture && <pre className="text-[11px] text-[#1A1815] whitespace-pre-wrap leading-snug mt-1.5" style={{ fontFamily: '"Fraunces", serif' }}>{output.content}</pre>}
    </div>
  );
}

// -----------------------------------------------------------------------------
function LeadForm({ config, sideKey, onSave }) {
  const preset = getSidePreset(sideKey);
  const [form, setForm] = useState({ name: '', org: '', role: '', contactMethod: 'email', contactValue: '', source: (config.channels && config.channels[0]) || 'other', sourceDetail: '', notes: '', outreachOk: false });
  const isClient = sideKey === 'client';
  const submit = () => {
    if (!form.name || !form.contactValue) { alert('Name and contact info are required.'); return; }
    onSave(newLead({ sideKey, name: form.name, org: form.org, role: form.role, contactMethod: form.contactMethod, contactValue: form.contactValue, source: form.source, sourceDetail: form.sourceDetail, notes: form.notes, consent: { outreachOk: form.outreachOk, capturedAt: form.outreachOk ? new Date().toISOString() : null, note: '' } }));
  };
  return (
    <div className="bg-white border border-[#B85838] p-4 mb-3 space-y-3">
      <div className="text-[10px] uppercase tracking-[0.2em] text-[#B85838] font-medium">New {preset ? preset.leadNoun : 'lead'}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">{isClient ? 'First name' : 'Contact name'} *</label><input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">{isClient ? 'Referred by' : 'Practice / org'}</label><input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={form.org} onChange={(e) => setForm({ ...form, org: e.target.value })} /></div>
      </div>
      {!isClient && <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Role / license</label><input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="e.g., LCSW, Clinical director" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} /></div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Contact method</label>
          <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={form.contactMethod} onChange={(e) => setForm({ ...form, contactMethod: e.target.value })}>
            <option value="email">Email</option><option value="phone">Phone</option><option value="text">Text</option><option value="linkedin">LinkedIn</option><option value="other">Other</option>
          </select></div>
        <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Contact info *</label><input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={form.contactValue} onChange={(e) => setForm({ ...form, contactValue: e.target.value })} /></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Source</label>
          <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
            {LEAD_SOURCES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select></div>
        <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Source detail</label><input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={form.sourceDetail} onChange={(e) => setForm({ ...form, sourceDetail: e.target.value })} /></div>
      </div>
      <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Notes (no clinical detail)</label><textarea rows="2" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="General context only — no PHI" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
      <label className="flex items-center gap-2 text-xs text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
        <input type="checkbox" checked={form.outreachOk} onChange={(e) => setForm({ ...form, outreachOk: e.target.checked })} className="w-4 h-4" />
        Consent to outreach recorded (served, not surveilled)
      </label>
      <button onClick={submit} className="w-full bg-[#1A1815] text-[#FAF8F4] py-2 text-xs uppercase tracking-wider hover:bg-[#B85838]">Log lead</button>
    </div>
  );
}

function LeadRow({ lead, config, updateLead, deleteLead, onDraftOutreach }) {
  const [open, setOpen] = useState(false);
  const stageMeta = FUNNEL_STAGE_META[lead.stage] || { label: lead.stage, group: 'active' };
  const next = nextFunnelStage(config, lead.stage);
  const nextNeedsOutbound = next ? stageRequiresOutbound(next) : false;
  const sourceLabel = (LEAD_SOURCES.find((s) => s.key === lead.source) || {}).label || lead.source;
  const stageColor = stageMeta.group === 'won' ? 'text-[#5A6E3D]' : stageMeta.group === 'lost' ? 'text-[#5A5751]' : 'text-[#B85838]';

  const advance = () => { if (next && updateLead && !nextNeedsOutbound) updateLead(lead.id, { stage: next, history: [...(lead.history || []), { stage: next, at: new Date().toISOString() }] }); };
  const markLost = () => { if (updateLead) updateLead(lead.id, { stage: 'lost', history: [...(lead.history || []), { stage: 'lost', at: new Date().toISOString() }] }); };
  const toggleConsent = () => { if (!updateLead) return; const outreachOk = !canOutreach(lead); updateLead(lead.id, { consent: { ...(lead.consent || {}), outreachOk, capturedAt: outreachOk ? new Date().toISOString() : null } }); };

  return (
    <div className="bg-white border border-[#E8E4DC] p-3">
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <button onClick={() => setOpen(!open)} className="text-left flex-1 min-w-0 focus:outline focus:outline-2 focus:outline-[#B85838]">
          <span style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{lead.name}</span>
          {lead.org && <span className="text-[#5A5751] text-xs"> · {lead.org}</span>}
          <span className={`text-[10px] uppercase tracking-wider font-medium ml-2 ${stageColor}`}>{stageMeta.label}</span>
        </button>
        <div className="flex items-center gap-1.5 shrink-0">
          {canOutreach(lead) && <span className="text-[10px] text-[#5A6E3D]" title="Consent recorded">✓ consent</span>}
          <button onClick={() => { if (confirm(`Delete lead ${lead.name}?`)) deleteLead && deleteLead(lead.id); }} aria-label="Delete lead" className="text-sm text-[#5A5751] hover:text-[#B85838] min-h-[32px] min-w-[32px]">×</button>
        </div>
      </div>
      <div className="text-[10px] uppercase tracking-wider text-[#5A5751] mt-0.5">{sourceLabel}{lead.sourceDetail ? ` · ${lead.sourceDetail}` : ''}</div>
      {open && (
        <div className="mt-2.5 pt-2.5 border-t border-[#E8E4DC] space-y-2">
          <div className="text-xs text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>{lead.contactMethod}: {lead.contactValue}</div>
          {lead.notes && <div className="text-xs text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>{lead.notes}</div>}
          <div className="flex flex-wrap gap-1.5">
            {next && !nextNeedsOutbound && (
              <button onClick={advance} className="text-[10px] uppercase tracking-wider px-2.5 py-1.5 border border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white min-h-[34px]">→ {(FUNNEL_STAGE_META[next] || {}).label || next}</button>
            )}
            {next && nextNeedsOutbound && (
              <button onClick={() => onDraftOutreach && onDraftOutreach(lead)} className="text-[10px] uppercase tracking-wider px-2.5 py-1.5 border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white min-h-[34px]" title="Drafts an outbound message into the approval queue (never sent automatically)">✎ Draft outreach → approval</button>
            )}
            {lead.stage !== 'lost' && <button onClick={markLost} className="text-[10px] uppercase tracking-wider px-2.5 py-1.5 border border-[#E8E4DC] text-[#5A5751] hover:border-[#B85838] min-h-[34px]">Mark lost</button>}
            <button onClick={toggleConsent} className="text-[10px] uppercase tracking-wider px-2.5 py-1.5 border border-[#E8E4DC] text-[#5A5751] hover:border-[#B85838] min-h-[34px]">{canOutreach(lead) ? 'Revoke consent' : 'Record consent'}</button>
          </div>
          {next && nextNeedsOutbound && <p className="text-[10px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>Next stage ("{(FUNNEL_STAGE_META[next] || {}).label}") needs a real message to go out — that waits for your approval.</p>}
        </div>
      )}
    </div>
  );
}

export { ClientGrowth };
export default ClientGrowth;
