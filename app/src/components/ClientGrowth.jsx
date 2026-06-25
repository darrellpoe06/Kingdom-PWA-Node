// =============================================================================
// ClientGrowth — the in-app "client growth / acquisition" workflow surface
// =============================================================================
// The reusable 4-stage "revenue agent team" workflow, rendered under the Practice
// (TLC Therapy Solutions) tab. It RUNS the four stages (Market Signal Researcher
// → Offer Architect → Content Angle Strategist → Conversion System Builder),
// stores leads (the CRM), tracks the funnel, and surfaces every output as a DRAFT
// a human approves. Reusable for any practice / tenant / audience by config
// (lib/client-acquisition.js): B2B (default, product customers) or patient.
//
// REALITY-TRACE (DR-0076 / the no-painted-numbers rule):
//   * Leads + funnel counts come from the REAL synced practice_leads list (props).
//   * Stage DRAFTS are device-local working content (localStorage) — honest, no
//     half-built sync table; cross-device sync of approved outputs is a re-review
//     follow-up.
//   * The sovereign A.I. drafting runs on the NAS workflow (wf-practice-growth).
//     Until that's wired, the surface does NOT paint fake A.I. output — it gives
//     the human the exact prompt to run and a box to capture the real result.
// =============================================================================
import React, { useState, useMemo, useEffect } from 'react';
import { SectionTitle, MetricCell, TabScroll } from './shared.jsx';
import {
  ACQUISITION_STAGES,
  buildStageBrief,
  buildStagePrompt,
  makeAcquisitionConfig,
  listAudiencePresets,
  DEFAULT_AUDIENCE_KEY,
  funnelStagesFor,
  funnelMetrics,
  nextFunnelStage,
  newLead,
  newStageOutput,
  canApproveOutput,
  canOutreach,
  screenMarketingClaim,
  flagPotentialPhi,
  LEAD_SOURCES,
  FUNNEL_STAGE_META,
  GUARDRAILS,
  PRACTICE_GROWTH_WEBHOOK,
  sensitivityFor,
} from '../lib/client-acquisition.js';

const OUTPUTS_LS_KEY = 'poe.clientGrowth.outputs.v1';
const AUDIENCE_LS_KEY = 'poe.clientGrowth.audience.v1';

function loadLS(key, fallback) {
  try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); }
  catch { return fallback; }
}
function saveLS(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage may be unavailable */ }
}

function ClientGrowth({ leads = [], addLead, updateLead, deleteLead }) {
  const [audienceKey, setAudienceKey] = useState(() => loadLS(AUDIENCE_LS_KEY, DEFAULT_AUDIENCE_KEY));
  const [outputs, setOutputs] = useState(() => loadLS(OUTPUTS_LS_KEY, []));
  const [openStage, setOpenStage] = useState('market-signal');
  const [showLeadForm, setShowLeadForm] = useState(false);

  useEffect(() => { saveLS(AUDIENCE_LS_KEY, audienceKey); }, [audienceKey]);
  useEffect(() => { saveLS(OUTPUTS_LS_KEY, outputs); }, [outputs]);

  const config = useMemo(() => makeAcquisitionConfig({ audiencePresetKey: audienceKey }), [audienceKey]);
  const presets = listAudiencePresets();

  // Real data only — leads scoped to the selected audience path.
  const audienceLeads = useMemo(
    () => leads.filter((l) => (l.audiencePresetKey || DEFAULT_AUDIENCE_KEY) === audienceKey),
    [leads, audienceKey]
  );
  const metrics = useMemo(() => funnelMetrics(audienceLeads, config), [audienceLeads, config]);
  const funnel = useMemo(() => funnelStagesFor(config), [config]);

  const audienceOutputs = useMemo(
    () => outputs.filter((o) => o.audiencePresetKey === audienceKey),
    [outputs, audienceKey]
  );

  // The approved prior-stage content, summarized to chain into the next prompt.
  const priorSummary = useMemo(() => {
    const approved = audienceOutputs.filter((o) => o.status === 'approved');
    if (!approved.length) return '';
    return approved
      .map((o) => {
        const s = ACQUISITION_STAGES.find((x) => x.key === o.stageKey);
        return `[${s ? s.role : o.stageKey}] ${o.content.slice(0, 400)}`;
      })
      .join('\n');
  }, [audienceOutputs]);

  const addOutput = (stageKey, content) => {
    const out = newStageOutput(stageKey, content, { audiencePresetKey: audienceKey });
    setOutputs((prev) => [...prev, out]);
  };
  const approveOutput = (id) => {
    setOutputs((prev) => prev.map((o) => (o.id === id ? { ...o, status: 'approved', approvedAt: new Date().toISOString() } : o)));
  };
  const removeOutput = (id) => {
    setOutputs((prev) => prev.filter((o) => o.id !== id));
  };

  return (
    <div className="space-y-5">
      <section className="bg-white border-2 border-[#1A1815] p-5 sm:p-6">
        <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] font-semibold mb-1">Client Growth · Revenue Agent Team</div>
        <h2 className="text-2xl mb-1" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>
          A 4-stage acquisition workflow
        </h2>
        <p className="text-sm text-[#5A5751] leading-relaxed max-w-prose" style={{ fontFamily: '"Fraunces", serif' }}>
          Market Signal Researcher → Offer Architect → Content Angle Strategist → Conversion System Builder.
          The sovereign A.I. drafts; <strong>you approve</strong> before anything goes out. Leads land here in PoeTech.
        </p>

        {/* Audience switcher — B2B leads (default product path) + patient path */}
        <div className="mt-4">
          <div className="text-[9px] uppercase tracking-wider text-[#5A5751] mb-1.5">Who are we acquiring?</div>
          <TabScroll label="Acquisition audience">
            {presets.map((p) => (
              <button
                key={p.key}
                onClick={() => setAudienceKey(p.key)}
                aria-pressed={audienceKey === p.key}
                className={`px-3 py-2 min-h-[40px] text-[11px] uppercase tracking-wider whitespace-nowrap border focus:outline focus:outline-2 focus:outline-[#B85838] ${audienceKey === p.key ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'bg-white text-[#5A5751] border-[#E8E4DC] hover:border-[#B85838]'}`}
              >
                {p.key === DEFAULT_AUDIENCE_KEY ? 'B2B · Practices' : 'Patient path'}
              </button>
            ))}
          </TabScroll>
          <p className="text-[11px] text-[#5A5751] italic mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
            {config.audienceWho}.
          </p>
          {config.phiSensitive && (
            <p className="text-[11px] text-[#B85838] mt-1.5 font-medium">
              ⚠ Highest sensitivity: pre-intake / contact-level only. No PHI, no clinical detail — ever. This path stays local-only.
            </p>
          )}
        </div>
      </section>

      {/* Pipeline summary — REAL data only */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#E8E4DC] border border-[#E8E4DC]">
        <MetricCell label="Leads" value={`${metrics.total}`} sub={`${metrics.active} active`} small accent="rust" />
        <MetricCell label="Won" value={`${metrics.won}`} sub="converted / intake" small accent="green" />
        <MetricCell label="Conversion" value={metrics.closed > 0 ? `${metrics.conversionRate.toFixed(0)}%` : '—'} sub="of closed" small />
        <MetricCell label="Consented" value={`${metrics.consented}`} sub="outreach OK" small />
      </section>

      {/* The 4-stage workflow */}
      <section>
        <SectionTitle eyebrow="The workflow">Run the team · 4 stages</SectionTitle>
        <div className="space-y-2.5">
          {ACQUISITION_STAGES.map((stage) => (
            <StageCard
              key={stage.key}
              stage={stage}
              config={config}
              priorSummary={priorSummary}
              open={openStage === stage.key}
              onToggle={() => setOpenStage(openStage === stage.key ? null : stage.key)}
              outputs={audienceOutputs.filter((o) => o.stageKey === stage.key)}
              addOutput={addOutput}
              approveOutput={approveOutput}
              removeOutput={removeOutput}
            />
          ))}
        </div>
      </section>

      {/* Lead pipeline (CRM) */}
      <section>
        <div className="flex items-baseline justify-between mb-3 pb-2 border-b border-[#1A1815] gap-2 flex-wrap">
          <h2 className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751]">Lead pipeline · {audienceLeads.length}</h2>
          <button onClick={() => setShowLeadForm(!showLeadForm)} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815]">
            {showLeadForm ? '× Cancel' : '+ Log lead'}
          </button>
        </div>

        {showLeadForm && (
          <LeadForm
            config={config}
            audienceKey={audienceKey}
            onSave={(lead) => { addLead && addLead(lead); setShowLeadForm(false); }}
          />
        )}

        {/* Funnel bar — real counts per stage */}
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
                    <span style={{ fontFamily: '"Fraunces", serif' }}>{s.label}</span>
                    <span className="text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{count}</span>
                  </div>
                  <div className="h-1.5 bg-[#E8E4DC]"><div className={`h-full ${barColor}`} style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
          </div>
        </div>

        {audienceLeads.length === 0 ? (
          <div className="bg-white border border-[#E8E4DC] p-6 text-center">
            <p className="text-sm text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
              No leads yet on this path. Run the workflow above, then log the {config.leadNoun}s it surfaces here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {[...audienceLeads].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((lead) => (
              <LeadRow key={lead.id} lead={lead} config={config} updateLead={updateLead} deleteLead={deleteLead} />
            ))}
          </div>
        )}
      </section>

      {/* Guardrails ledger — always visible, binding */}
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
          The A.I. drafts and researches; Christina and Darrell approve before anything goes out. We produce packaging, sequences, and leads — never transactions.
        </p>
      </section>
    </div>
  );
}

// -----------------------------------------------------------------------------
// StageCard — one of the four roles: brief + guardrails + the generated prompt +
// the honest A.I.-drafting seam + draft capture/approval.
// -----------------------------------------------------------------------------
function StageCard({ stage, config, priorSummary, open, onToggle, outputs, addOutput, approveOutput, removeOutput }) {
  const brief = useMemo(() => buildStageBrief(stage.key, config), [stage.key, config]);
  const prompt = useMemo(() => buildStagePrompt(stage.key, config, { priorSummary }), [stage.key, config, priorSummary]);
  const [draft, setDraft] = useState('');
  const [aiState, setAiState] = useState({ status: 'idle', message: '' }); // idle | running | wired | unwired | error
  const [copied, setCopied] = useState(false);

  const approvedCount = outputs.filter((o) => o.status === 'approved').length;

  const liveFindings = useMemo(() => ({
    claims: screenMarketingClaim(draft),
    phi: flagPotentialPhi(draft),
  }), [draft]);
  const draftBlocked = liveFindings.claims.some((f) => f.severity === 'block') || liveFindings.phi.length > 0;

  const copyPrompt = async () => {
    try { await navigator.clipboard.writeText(prompt); setCopied(true); setTimeout(() => setCopied(false), 1800); }
    catch { setCopied(false); }
  };

  // Honest LLM seam: POST to the NAS workflow. If it isn't wired yet (most
  // likely today), say so plainly and let the human capture the real output —
  // never paint a fake A.I. result.
  const draftWithAi = async () => {
    setAiState({ status: 'running', message: 'Asking the sovereign A.I. team…' });
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 12000);
      const res = await fetch(PRACTICE_GROWTH_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: stage.key,
          audience: config.audiencePresetKey,
          sensitivity: sensitivityFor(config),
          prompt,
        }),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json().catch(() => ({}));
      const text = data.draft || data.text || data.output || '';
      if (text) {
        setDraft(text);
        setAiState({ status: 'wired', message: 'Draft returned — review, edit, and approve below.' });
      } else {
        setAiState({ status: 'unwired', message: 'The A.I. workflow responded with no draft. Copy the prompt and capture the result manually.' });
      }
    } catch (e) {
      setAiState({
        status: 'unwired',
        message: 'Sovereign A.I. drafting runs on the NAS workflow (wf-practice-growth), which isn’t wired yet. Copy the prompt into your A.I. and paste the result below — nothing here is faked.',
      });
    }
  };

  const saveDraft = () => {
    if (!draft.trim()) return;
    addOutput(stage.key, draft.trim());
    setDraft('');
    setAiState({ status: 'idle', message: '' });
  };

  return (
    <div className="bg-white border border-[#E8E4DC]">
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 p-3.5 text-left hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]"
      >
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

          {/* What this stage produces */}
          <div>
            <div className="text-[9px] uppercase tracking-wider text-[#5A5751] mb-1">Produces</div>
            <ul className="text-xs text-[#5A5751] space-y-0.5" style={{ fontFamily: '"Fraunces", serif' }}>
              {stage.outputs.map((o, i) => <li key={i}>• {o}</li>)}
            </ul>
          </div>

          {/* Guardrails on this stage */}
          <div className="flex flex-wrap gap-1.5">
            {brief.guardrails.map((g) => (
              <span key={g.key} title={g.detail} className="text-[9px] uppercase tracking-wider px-2 py-1 border border-[#E8E4DC] text-[#5A5751] bg-[#FAF8F4]">
                {g.label}
              </span>
            ))}
          </div>

          {/* The generated prompt the sovereign A.I. runs */}
          <div className="bg-[#FAF8F4] border border-[#E8E4DC] p-2.5">
            <div className="flex items-baseline justify-between gap-2 mb-1">
              <div className="text-[9px] uppercase tracking-wider text-[#5A5751]">A.I. prompt (deterministic)</div>
              <button onClick={copyPrompt} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] min-h-[32px]">
                {copied ? '✓ Copied' : 'Copy prompt'}
              </button>
            </div>
            <pre className="text-[11px] text-[#1A1815] whitespace-pre-wrap leading-snug" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{prompt}</pre>
          </div>

          {/* Draft capture + honest A.I. seam */}
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <button onClick={draftWithAi} disabled={aiState.status === 'running'} className="bg-[#1A1815] text-white px-3 py-2 text-[10px] uppercase tracking-wider hover:bg-[#B85838] disabled:opacity-50 min-h-[36px]">
                {aiState.status === 'running' ? 'Drafting…' : '⚡ Draft with sovereign A.I.'}
              </button>
              <span className="text-[10px] text-[#5A5751] italic">or paste / write the draft below</span>
            </div>
            {aiState.message && (
              <p className={`text-[11px] mb-1.5 ${aiState.status === 'wired' ? 'text-[#5A6E3D]' : 'text-[#B85838]'}`} style={{ fontFamily: '"Fraunces", serif' }}>
                {aiState.message}
              </p>
            )}
            <textarea
              rows="5"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={`Capture the ${brief.producesLabel.toLowerCase()} draft here…`}
              className="w-full p-2 border border-[#E8E4DC] text-sm bg-white"
              style={{ fontFamily: '"Fraunces", serif' }}
            />
            {/* Live guardrail check on the draft */}
            {draft.trim() && (liveFindings.claims.length > 0 || liveFindings.phi.length > 0) && (
              <div className="mt-1.5 space-y-1">
                {liveFindings.claims.map((f, i) => (
                  <div key={`c${i}`} className={`text-[11px] ${f.severity === 'block' ? 'text-[#B85838] font-medium' : 'text-[#5A5751]'}`}>
                    {f.severity === 'block' ? '⛔' : '⚠'} "{f.term}" — {f.why} <span className="italic">Fix: {f.fix}</span>
                  </div>
                ))}
                {liveFindings.phi.map((f, i) => (
                  <div key={`p${i}`} className="text-[11px] text-[#B85838] font-medium">⛔ Possible PHI: "{f.term}" — {f.why}</div>
                ))}
              </div>
            )}
            <button
              onClick={saveDraft}
              disabled={!draft.trim() || draftBlocked}
              className="mt-2 w-full bg-[#5A6E3D] text-white py-2 text-[10px] uppercase tracking-wider hover:bg-[#1A1815] disabled:opacity-40 min-h-[36px]"
            >
              {draftBlocked ? 'Resolve guardrail issues to save' : 'Save draft for review'}
            </button>
          </div>

          {/* Captured outputs for this stage */}
          {outputs.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="text-[9px] uppercase tracking-wider text-[#5A5751]">Captured · {outputs.length}</div>
              {outputs.map((o) => (
                <OutputRow key={o.id} output={o} onApprove={approveOutput} onRemove={removeOutput} />
              ))}
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
  return (
    <div className="border border-[#E8E4DC] bg-[#FAF8F4] p-2">
      <div className="flex items-baseline justify-between gap-2">
        <button onClick={() => setShow(!show)} className="text-left flex-1 min-w-0 focus:outline focus:outline-2 focus:outline-[#B85838]">
          <span className={`text-[10px] uppercase tracking-wider mr-2 ${output.status === 'approved' ? 'text-[#5A6E3D]' : 'text-[#B85838]'}`}>
            {output.status === 'approved' ? '✓ Approved' : 'Draft'}
          </span>
          <span className="text-xs text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
            {output.content.slice(0, 70)}{output.content.length > 70 ? '…' : ''}
          </span>
        </button>
        <div className="flex items-center gap-1.5 shrink-0">
          {output.status !== 'approved' && (
            <button
              onClick={() => onApprove(output.id)}
              disabled={!approvable}
              title={approvable ? 'Approve this draft' : 'Resolve guardrail issues first'}
              className="text-[10px] uppercase tracking-wider text-[#5A6E3D] hover:text-[#1A1815] disabled:opacity-40 min-h-[32px] px-2"
            >
              Approve
            </button>
          )}
          <button onClick={() => onRemove(output.id)} aria-label="Delete draft" className="text-sm text-[#5A5751] hover:text-[#B85838] min-h-[32px] min-w-[32px]">×</button>
        </div>
      </div>
      {!approvable && output.status !== 'approved' && (
        <div className="text-[10px] text-[#B85838] mt-1">Blocked: resolve the guardrail issue(s) before approving.</div>
      )}
      {show && <pre className="text-[11px] text-[#1A1815] whitespace-pre-wrap leading-snug mt-1.5" style={{ fontFamily: '"Fraunces", serif' }}>{output.content}</pre>}
    </div>
  );
}

// -----------------------------------------------------------------------------
// LeadForm — capture a lead into the CRM. Pre-intake / contact-level only.
// -----------------------------------------------------------------------------
function LeadForm({ config, audienceKey, onSave }) {
  const [form, setForm] = useState({
    name: '', org: '', role: '', contactMethod: 'email', contactValue: '',
    source: (config.channels && config.channels[0]) || 'other', sourceDetail: '', notes: '', outreachOk: false,
  });
  const b2b = audienceKey === DEFAULT_AUDIENCE_KEY;

  const submit = () => {
    if (!form.name || !form.contactValue) { alert('Name and contact info are required.'); return; }
    const lead = newLead({
      audiencePresetKey: audienceKey,
      name: form.name, org: form.org, role: form.role,
      contactMethod: form.contactMethod, contactValue: form.contactValue,
      source: form.source, sourceDetail: form.sourceDetail, notes: form.notes,
      consent: { outreachOk: form.outreachOk, capturedAt: form.outreachOk ? new Date().toISOString() : null, note: '' },
    });
    onSave(lead);
  };

  return (
    <div className="bg-white border border-[#B85838] p-4 mb-3 space-y-3">
      <div className="text-[10px] uppercase tracking-[0.2em] text-[#B85838] font-medium">New {config.leadNoun}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">{b2b ? 'Contact name' : 'First name'} *</label>
          <input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">{b2b ? 'Practice / org' : 'Referred by'}</label>
          <input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={form.org} onChange={(e) => setForm({ ...form, org: e.target.value })} />
        </div>
      </div>
      {b2b && (
        <div>
          <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Their role</label>
          <input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="e.g., Practice owner, Clinical director" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Contact method</label>
          <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={form.contactMethod} onChange={(e) => setForm({ ...form, contactMethod: e.target.value })}>
            <option value="email">Email</option><option value="phone">Phone</option><option value="text">Text</option><option value="linkedin">LinkedIn</option><option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Contact info *</label>
          <input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={form.contactValue} onChange={(e) => setForm({ ...form, contactValue: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Source</label>
          <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
            {LEAD_SOURCES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Source detail</label>
          <input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="e.g., 'CE webinar Q3', specific angle" value={form.sourceDetail} onChange={(e) => setForm({ ...form, sourceDetail: e.target.value })} />
        </div>
      </div>
      <div>
        <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Notes (no clinical detail)</label>
        <textarea rows="2" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="General context only — no PHI" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </div>
      <label className="flex items-center gap-2 text-xs text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
        <input type="checkbox" checked={form.outreachOk} onChange={(e) => setForm({ ...form, outreachOk: e.target.checked })} className="w-4 h-4" />
        Consent to outreach recorded (served, not surveilled)
      </label>
      <button onClick={submit} className="w-full bg-[#1A1815] text-[#FAF8F4] py-2 text-xs uppercase tracking-wider hover:bg-[#B85838]">Log lead</button>
    </div>
  );
}

// -----------------------------------------------------------------------------
// LeadRow — a lead in the pipeline: stage advance, consent, delete.
// -----------------------------------------------------------------------------
function LeadRow({ lead, config, updateLead, deleteLead }) {
  const [open, setOpen] = useState(false);
  const stageMeta = FUNNEL_STAGE_META[lead.stage] || { label: lead.stage, group: 'active' };
  const next = nextFunnelStage(config, lead.stage);
  const sourceLabel = (LEAD_SOURCES.find((s) => s.key === lead.source) || {}).label || lead.source;
  const stageColor = stageMeta.group === 'won' ? 'text-[#5A6E3D]' : stageMeta.group === 'lost' ? 'text-[#5A5751]' : 'text-[#B85838]';

  const advance = () => {
    if (!next || !updateLead) return;
    updateLead(lead.id, { stage: next, history: [...(lead.history || []), { stage: next, at: new Date().toISOString() }] });
  };
  const markLost = () => {
    if (!updateLead) return;
    updateLead(lead.id, { stage: 'lost', history: [...(lead.history || []), { stage: 'lost', at: new Date().toISOString() }] });
  };
  const toggleConsent = () => {
    if (!updateLead) return;
    const outreachOk = !canOutreach(lead);
    updateLead(lead.id, { consent: { ...(lead.consent || {}), outreachOk, capturedAt: outreachOk ? new Date().toISOString() : null } });
  };

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
          <div className="text-xs text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
            {lead.contactMethod}: {lead.contactValue}
          </div>
          {lead.notes && <div className="text-xs text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>{lead.notes}</div>}
          <div className="flex flex-wrap gap-1.5">
            {next && (
              <button onClick={advance} className="text-[10px] uppercase tracking-wider px-2.5 py-1.5 border border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white min-h-[34px]">
                → {(FUNNEL_STAGE_META[next] || {}).label || next}
              </button>
            )}
            {lead.stage !== 'lost' && (
              <button onClick={markLost} className="text-[10px] uppercase tracking-wider px-2.5 py-1.5 border border-[#E8E4DC] text-[#5A5751] hover:border-[#B85838] min-h-[34px]">
                Mark lost
              </button>
            )}
            <button onClick={toggleConsent} className="text-[10px] uppercase tracking-wider px-2.5 py-1.5 border border-[#E8E4DC] text-[#5A5751] hover:border-[#B85838] min-h-[34px]">
              {canOutreach(lead) ? 'Revoke consent' : 'Record consent'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export { ClientGrowth };
export default ClientGrowth;
