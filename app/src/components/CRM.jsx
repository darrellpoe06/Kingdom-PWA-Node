// =============================================================================
// CRM.jsx — the in-app surface for the ONE shared CRM backbone (crm-engine.js)
// =============================================================================
// Where the unified CRM lives in-app: a single board every funnel rides. Pick a
// business (TLC / GTM / Boxcar / Real Estate) and a pipeline within it; see the
// real leads grouped by stage, the conversion math, the follow-up DRAFT queue
// (a human approves every send), and the consent + seed honesty on each card.
//
// REALITY-TRACE (DR-0076 / P15): every number on this surface comes from real
// records — the existing TLC `inquiries` (federated via leadFromInquiry) plus
// net-new `crm_leads` (live via crmLeadsSync). Seed/demo leads are badged and
// excluded from the pipeline math. No painted numbers.
//
// GUARDRAILS surfaced + enforced: consent gates every outreach action (served,
// not surveilled); follow-up steps are drafts requiring human approval (LLMs
// draft, humans send); leads carry contact-level data only (no PHI / no payment);
// money is never processed here.
//
// Family/Governor-gated in the shell (no-leak), like the Center + Study tabs.
// =============================================================================
import React, { useState, useMemo, useEffect } from 'react';
import { MetricCell, TabScroll } from './shared.jsx';
import {
  BUSINESSES, getBusiness, pipelinesForBusiness, getPipeline,
  stagesFor, STAGE_META, sourceLabel, SOURCES, CONTACT_METHODS,
  newLead, moveStage, nextStage, pipelineStats, isSeedLead,
  canOutreach, consentReason, nextFollowUp, advanceSequence,
  leadFromInquiry, leadFromPracticeAcquisition, GUARDRAILS,
} from '../lib/crm-engine.js';
import { crmLeadsSync, addActivity } from '../lib/crm-sync.js';

const BUSINESS_ORDER = ['tlc', 'gtm', 'boxcar', 'realestate'];

function stageColor(group) {
  return group === 'won' ? 'text-[#5A6E3D]' : group === 'lost' ? 'text-[#5A5751]' : 'text-[#B85838]';
}

function CRM({ inquiries = [], practiceLeads = [], currentUserId = null }) {
  const [business, setBusiness] = useState('tlc');
  const [pipeline, setPipeline] = useState('tlc-client-intake');
  const [showCapture, setShowCapture] = useState(false);
  const [showGuardrails, setShowGuardrails] = useState(false);
  const [remoteLeads, setRemoteLeads] = useState([]); // net-new crm_leads (live)
  const [localLeads, setLocalLeads] = useState([]);    // optimistic / signed-out session adds
  const [form, setForm] = useState(emptyForm());

  function emptyForm() {
    return { name: '', contactMethod: 'email', contactValue: '', source: 'website', sourceDetail: '', notes: '', consentOk: false };
  }

  // Live subscribe to crm_leads (no-op when signed out — board still shows the
  // federated inquiries below). Keeps the board in sync across devices.
  useEffect(() => {
    const unsub = crmLeadsSync.subscribe((items) => setRemoteLeads(items || []));
    return unsub;
  }, []);

  // When the business changes, snap the pipeline to that business's first.
  useEffect(() => {
    const ps = pipelinesForBusiness(business);
    if (ps.length && !ps.some((p) => p.id === pipeline)) setPipeline(ps[0].id);
  }, [business]); // eslint-disable-line react-hooks/exhaustive-deps

  // The unified lead list — the one pane over every funnel. Federate the existing
  // specialized tables read-side (TLC `inquiries` + the live client-acquisition
  // `practice_leads`, mapped via the engine adapters) alongside net-new
  // `crm_leads` + session-local adds. Deduped by id (later sources win).
  const allLeads = useMemo(() => {
    const fedInquiries = (inquiries || []).map((i) => leadFromInquiry(i)).filter(Boolean);
    const fedPractice = (practiceLeads || []).map((p) => leadFromPracticeAcquisition(p)).filter(Boolean);
    const byId = new Map();
    for (const l of [...fedInquiries, ...fedPractice, ...localLeads, ...remoteLeads]) byId.set(l.id, l);
    return [...byId.values()];
  }, [inquiries, practiceLeads, remoteLeads, localLeads]);

  const pipeLeads = useMemo(() => allLeads.filter((l) => l.pipeline === pipeline), [allLeads, pipeline]);
  const stats = useMemo(() => pipelineStats(allLeads, { pipeline }), [allLeads, pipeline]);
  const stageDefs = useMemo(() => stagesFor(pipeline), [pipeline]);
  const pipe = getPipeline(pipeline);
  const biz = getBusiness(business);

  // Leads (real, non-seed, consented) with an available follow-up draft.
  const followUps = useMemo(() => {
    return pipeLeads
      .filter((l) => !isSeedLead(l))
      .map((l) => ({ lead: l, step: nextFollowUp(l) }))
      .filter((x) => x.step.available);
  }, [pipeLeads]);

  // ---- write helpers (best-effort sync + optimistic local) --------------------
  const patchLead = (lead, patch) => {
    const next = { ...lead, ...patch };
    setLocalLeads((prev) => upsert(prev, next));
    setRemoteLeads((prev) => prev.map((l) => (l.id === lead.id ? next : l)));
    if (lead.remoteUuid) crmLeadsSync.updateRow(lead.remoteUuid, toPatchRow(patch));
  };

  const onMove = (lead, toStage) => {
    const moved = moveStage(lead, toStage);
    patchLead(lead, { stage: moved.stage, history: moved.history });
  };

  const onToggleConsent = (lead) => {
    const ok = !canOutreach(lead);
    patchLead(lead, { consent: { ...lead.consent, outreachOk: ok, capturedAt: ok ? new Date().toISOString() : null, note: ok ? 'Consent recorded in-app' : '' } });
  };

  const onApproveSend = (lead, step) => {
    // Human approves the drafted step → record it as sent + advance the sequence.
    if (lead.remoteUuid) addActivity({ leadRemoteId: lead.remoteUuid, kind: 'outreach-sent', channel: step.channel, direction: 'outbound', summary: `Approved + sent: ${step.intent}` });
    const adv = advanceSequence(lead);
    patchLead(lead, { nurtureStep: adv.nurtureStep });
  };

  const onCapture = () => {
    if (!form.name || !form.contactValue) { alert('Name and contact info are required.'); return; }
    const lead = newLead({
      business, pipeline,
      name: form.name, contactMethod: form.contactMethod, contactValue: form.contactValue,
      source: form.source, sourceDetail: form.sourceDetail, notes: form.notes,
      consent: { outreachOk: form.consentOk, channels: form.consentOk ? [form.contactMethod] : [], capturedAt: form.consentOk ? new Date().toISOString() : null, note: form.consentOk ? 'Consent recorded at capture' : '' },
    });
    setLocalLeads((prev) => upsert(prev, lead));
    crmLeadsSync.upload(lead); // best-effort persist (no-op signed out)
    setForm(emptyForm());
    setShowCapture(false);
  };

  const onDelete = (lead) => {
    if (!confirm(`Remove lead ${lead.name || lead.id}?`)) return;
    setLocalLeads((prev) => prev.filter((l) => l.id !== lead.id));
    setRemoteLeads((prev) => prev.filter((l) => l.id !== lead.id));
    if (lead.remoteUuid) crmLeadsSync.deleteRow(lead.remoteUuid);
  };

  return (
    <div className="space-y-5">
      {/* Header / reality-trace banner */}
      <section className="bg-white border-2 border-[#1A1815] p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] font-semibold mb-1">Sovereign CRM · one backbone</div>
            <h2 className="text-2xl mb-1" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>Every funnel, one pipeline.</h2>
            <p className="text-sm text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
              Leads from every business flow into one model — contacts, stages, follow-up, and source attribution — in our own store. No third-party CRM.
            </p>
          </div>
          <button type="button" onClick={() => setShowGuardrails(!showGuardrails)} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] border border-[#E8E4DC] px-2.5 py-1.5">
            {showGuardrails ? '× Hide' : '🛡 Guardrails'}
          </button>
        </div>
        <p className="text-[11px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
          Real data only: {(inquiries || []).length} TLC inquiries + {(practiceLeads || []).length} client-acquisition leads federated + {remoteLeads.length} synced leads. Seed/demo leads are badged and excluded from the math.
        </p>
        {showGuardrails && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Object.values(GUARDRAILS).map((g) => (
              <div key={g.label} className="border border-[#E8E4DC] bg-[#FAF8F4] p-2.5">
                <div className="text-[10px] uppercase tracking-wider text-[#5A6E3D] font-semibold">{g.label}</div>
                <div className="text-[11px] text-[#5A5751] mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{g.detail}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Business switcher */}
      <TabScroll label="Business">
        {BUSINESS_ORDER.map((key) => {
          const b = BUSINESSES[key];
          return (
            <button key={key} role="tab" aria-selected={business === key} onClick={() => setBusiness(key)} className={`px-3 py-2 whitespace-nowrap border-b-2 ${business === key ? 'border-[#B85838] text-[#1A1815] font-medium' : 'border-transparent text-[#5A5751] hover:text-[#1A1815]'}`}>
              {b.label}
            </button>
          );
        })}
      </TabScroll>

      {/* Pipeline sub-tabs */}
      <TabScroll label="Pipeline" rowClassName="text-[11px]">
        {pipelinesForBusiness(business).map((p) => (
          <button key={p.id} role="tab" aria-selected={pipeline === p.id} onClick={() => setPipeline(p.id)} className={`px-2.5 py-1.5 whitespace-nowrap uppercase tracking-wider border ${pipeline === p.id ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'text-[#5A5751] border-[#E8E4DC] hover:border-[#B85838]'}`}>
            {p.label}
          </button>
        ))}
      </TabScroll>

      {pipe && (
        <>
          {/* Compliance note for the selected pipeline */}
          {pipe.complianceNote && (
            <p className="text-[11px] text-[#5A5751] italic border-l-2 border-[#E8E4DC] pl-3" style={{ fontFamily: '"Fraunces", serif' }}>
              {pipe.phiSensitive ? '⚠ ' : ''}{pipe.complianceNote}
            </p>
          )}

          {/* Stats */}
          <section className="grid grid-cols-4 gap-px bg-[#E8E4DC] border border-[#E8E4DC]">
            <MetricCell label="Active" value={`${stats.active}`} sub={`${stats.total} total`} small accent="rust" />
            <MetricCell label="Won" value={`${stats.won}`} small accent="green" />
            <MetricCell label="Conversion" value={stats.closed > 0 ? `${stats.conversionRate.toFixed(0)}%` : '—'} sub="of closed" small />
            <MetricCell label="Consented" value={`${stats.consented}`} sub="can reach" small />
          </section>

          {/* Capture */}
          <section>
            <div className="flex items-baseline justify-between mb-2 pb-2 border-b border-[#1A1815] gap-2 flex-wrap">
              <h2 className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751]">{pipe.label} · {pipeLeads.length} {pipe.leadNoun}{pipeLeads.length === 1 ? '' : 's'}</h2>
              <button type="button" onClick={() => setShowCapture(!showCapture)} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815]">{showCapture ? '× Cancel' : '+ Capture lead'}</button>
            </div>

            {showCapture && (
              <div className="bg-white border border-[#B85838] p-4 mb-3 space-y-3">
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#B85838] font-medium">New {pipe.leadNoun} · {biz.label}</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Name *</label>
                    <input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Contact method</label>
                    <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={form.contactMethod} onChange={(e) => setForm({ ...form, contactMethod: e.target.value })}>
                      {CONTACT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Contact info *</label>
                  <input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={form.contactValue} onChange={(e) => setForm({ ...form, contactValue: e.target.value })} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Source</label>
                    <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                      {(pipe.sources || SOURCES.map((s) => s.key)).map((k) => <option key={k} value={k}>{sourceLabel(k)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Source detail</label>
                    <input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={form.sourceDetail} onChange={(e) => setForm({ ...form, sourceDetail: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Notes (contact-level only — no clinical, no payment)</label>
                  <textarea rows="2" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
                <label className="flex items-start gap-2 text-xs cursor-pointer">
                  <input type="checkbox" className="mt-0.5" checked={form.consentOk} onChange={(e) => setForm({ ...form, consentOk: e.target.checked })} />
                  <span style={{ fontFamily: '"Fraunces", serif' }} className="text-[#5A5751]">They consented to outreach on <strong>{form.contactMethod}</strong>. (Served, not surveilled — no consent, no outreach.)</span>
                </label>
                <button type="button" onClick={onCapture} className="w-full bg-[#1A1815] text-[#FAF8F4] py-2 text-xs uppercase tracking-wider hover:bg-[#B85838]">Capture Lead</button>
              </div>
            )}
          </section>

          {/* Follow-up draft queue (human approves every send) */}
          {followUps.length > 0 && (
            <section className="bg-white border-2 border-[#5A6E3D] p-4">
              <div className="text-[10px] uppercase tracking-[0.25em] text-[#5A6E3D] font-semibold mb-2">Follow-up drafts · {followUps.length} · a human approves every send</div>
              <div className="space-y-2">
                {followUps.map(({ lead, step }) => (
                  <div key={lead.id} className="border border-[#E8E4DC] bg-[#FAF8F4] p-2.5 flex items-start justify-between gap-2 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{lead.name || lead.contactValue} <span className="text-[10px] uppercase tracking-wider text-[#5A5751]">· {step.channel} · step {step.step + 1}</span></div>
                      <div className="text-[11px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>Draft intent: {step.intent}</div>
                      <div className="text-[9px] uppercase tracking-wider text-[#5A6E3D] mt-0.5">Draft · awaiting human approval</div>
                    </div>
                    <button type="button" onClick={() => onApproveSend(lead, step)} className="text-[10px] uppercase tracking-wider bg-[#5A6E3D] text-white px-3 py-1.5 hover:bg-[#1A1815] shrink-0">Approve + sent</button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Board — leads grouped by stage */}
          <section className="space-y-3">
            {stageDefs.map((sd) => {
              const leadsInStage = pipeLeads.filter((l) => l.stage === sd.key);
              if (leadsInStage.length === 0) return null;
              return (
                <div key={sd.key}>
                  <div className={`text-[10px] uppercase tracking-[0.25em] font-semibold mb-1.5 ${stageColor(sd.group)}`}>{sd.label} · {leadsInStage.length}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {leadsInStage.map((lead) => (
                      <LeadCard key={lead.id} lead={lead} pipeline={pipeline} onMove={onMove} onToggleConsent={onToggleConsent} onDelete={onDelete} />
                    ))}
                  </div>
                </div>
              );
            })}
            {pipeLeads.length === 0 && (
              <div className="bg-white border border-[#E8E4DC] p-6 text-center">
                <p className="text-sm text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No leads in this pipeline yet. Capture one above, or wire the funnel's form to land leads here automatically.</p>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function LeadCard({ lead, pipeline, onMove, onToggleConsent, onDelete }) {
  const [open, setOpen] = useState(false);
  const consented = canOutreach(lead);
  const seed = isSeedLead(lead);
  const reason = consentReason(lead);
  const adv = nextStage(pipeline, lead.stage);
  const advLabel = adv ? (STAGE_META[adv]?.label || adv) : null;

  return (
    <div className="bg-white border border-[#E8E4DC] p-3 hover:border-[#B85838] transition-colors">
      <div className="flex items-baseline justify-between gap-2">
        <div className="min-w-0">
          <span style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }} className="text-sm">{lead.name || lead.contactValue || 'Unnamed lead'}</span>
          {seed && <span className="ml-1.5 text-[9px] uppercase tracking-wider text-[#5A5751] border border-[#E8E4DC] px-1 py-0.5">seed</span>}
        </div>
        <button type="button" onClick={() => setOpen(!open)} className="text-[10px] uppercase tracking-wider text-[#5A5751] shrink-0">{open ? '×' : 'Details'}</button>
      </div>
      <div className="text-[10px] uppercase tracking-wider text-[#5A5751] mt-0.5">{sourceLabel(lead.source)}{lead.sourceDetail ? ` · ${lead.sourceDetail}` : ''}</div>
      <div className="mt-1 flex items-center gap-1.5 flex-wrap">
        <span className={`text-[10px] uppercase tracking-wider ${consented ? 'text-[#5A6E3D]' : 'text-[#5A5751]'}`}>{consented ? '✓ outreach OK' : '✕ no consent'}</span>
      </div>

      {open && (
        <div className="mt-2 pt-2 border-t border-[#E8E4DC] space-y-2 text-xs">
          {lead.contactValue && <div><span className="text-[9px] uppercase tracking-wider text-[#5A5751]">Contact</span><div style={{ fontFamily: '"Fraunces", serif' }}>{lead.contactValue} · {lead.contactMethod}</div></div>}
          {lead.notes && <div><span className="text-[9px] uppercase tracking-wider text-[#5A5751]">Notes</span><div style={{ fontFamily: '"Fraunces", serif' }}>{lead.notes}</div></div>}
          {!consented && reason && <div className="text-[11px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>{reason}</div>}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <button type="button" onClick={() => onToggleConsent(lead)} className="text-[10px] uppercase tracking-wider px-2 py-1.5 border border-[#E8E4DC] hover:border-[#5A6E3D]">{consented ? 'Revoke consent' : 'Record consent'}</button>
            {advLabel && <button type="button" onClick={() => onMove(lead, adv)} className="text-[10px] uppercase tracking-wider px-2 py-1.5 border border-[#E8E4DC] hover:border-[#B85838]">→ {advLabel}</button>}
            <button type="button" onClick={() => onDelete(lead)} aria-label="Remove lead" className="text-[10px] uppercase tracking-wider px-2 py-1.5 border border-transparent text-[#5A5751] hover:border-[#B85838] hover:text-[#B85838]">Remove</button>
          </div>
        </div>
      )}
    </div>
  );
}

// upsert a lead into a list by id (immutable).
function upsert(list, lead) {
  const i = (list || []).findIndex((l) => l.id === lead.id);
  if (i < 0) return [...(list || []), lead];
  const copy = [...list];
  copy[i] = lead;
  return copy;
}

// Map an app-shape patch to the snake_case columns the sync update expects.
function toPatchRow(patch) {
  const row = {};
  if ('stage' in patch) row.stage = patch.stage;
  if ('history' in patch) row.history = patch.history;
  if ('consent' in patch) row.consent = patch.consent;
  if ('nurtureStep' in patch) row.nurture_step = patch.nurtureStep;
  if ('notes' in patch) row.notes = patch.notes;
  return row;
}

export { CRM };
export default CRM;
