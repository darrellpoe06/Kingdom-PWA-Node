// Practice + InquiryRow + Practice-specific constants — extracted from
// monolith (r31) per MODULAR-EXTENSIBILITY.md. This was the chronic
// truncation tail-victim after BooksEntities extraction; moving it here
// keeps the monolith tail on stable utility code that's rarely edited.
//
// TLC isolation: per LEGAL-PRIVACY-BOUNDARY.md + ECOSYSTEM-PARTICIPANTS.md,
// this surface tracks PRE-INTAKE inquiries only (non-PHI). PHI stays in
// Acuity, never in SKOS.
import React, { useState, useMemo } from 'react';
import { MetricCell, SectionTitle } from './shared.jsx';
import { findRelatedAuto } from '../poe-financial-mvp-v28.jsx';
import { Queue } from './Queue.jsx';
import { ClientGrowth } from './ClientGrowth.jsx';
import { PracticeLearn } from './PracticeLearn.jsx';
import SectionBoundary from './SectionBoundary.jsx';
import SectionTabs from './SectionTabs.jsx';
import { TLC_TEAM, TLC_INSURANCE } from '../lib/tlc-practice.js';

// Local helper (avoid main-monolith dep).
const fmtCompact = (n) => { if (n == null || !isFinite(n)) return '—'; const a = Math.abs(n); const sign = n < 0 ? '-' : ''; if (a >= 1000000000) return `${sign}$${(a/1000000000).toFixed(2)}B`; if (a >= 1000000) return `${sign}$${(a/1000000).toFixed(1)}M`; if (a >= 1000) return `${sign}$${Math.round(a/1000)}k`; return `${sign}$${Math.round(a)}`; };

// FLAG-11 fix (2026-05-24, CALC-INVENTORY.md): pipeline-revenue formulas
// were `clients × 150 × 12` which produces $1,800/client/year, but the
// stated assumption shown to the user is "$150/session × 1 session/week ×
// 48 weeks/year (~$7.2K/client/yr)". The math was 4× too low. Explicit
// constants below match the disclosure so the formula and the displayed
// assumption stay in sync. Christina is the right judge of any future
// adjustment; these defaults match what was always shown to the user.
export const RATE_PER_SESSION = 150;
export const SESSIONS_PER_WEEK = 1;
export const ACTIVE_WEEKS_PER_YEAR = 48;
export const ANNUAL_REVENUE_PER_CLIENT = RATE_PER_SESSION * SESSIONS_PER_WEEK * ACTIVE_WEEKS_PER_YEAR; // = $7,200

const INQUIRY_STATUSES = [
  { key: 'new',                label: 'New',              color: 'rust',    group: 'active' },
  { key: 'attempting-contact', label: 'Attempting contact', color: 'rust',  group: 'active' },
  { key: 'contacted',          label: 'Contacted',        color: 'rust',    group: 'active' },
  { key: 'scheduled-intake',   label: 'Moved to Acuity ✓', color: 'green',  group: 'closed' },
  { key: 'declined',           label: 'Declined services', color: 'gray',   group: 'closed' },
  { key: 'lost',               label: 'No response',       color: 'gray',   group: 'closed' },
];

const TIMES_TO_CALL = ['morning','afternoon','evening','weekend','anytime'];

// Pure data — duplicated locally to keep this module free of main-monolith
// deps (same pattern as INQUIRY_STATUSES above).
const INQUIRY_SOURCES = [
  { key: 'church',       label: 'Church / parishioner' },
  { key: 'referral',     label: 'Personal referral' },
  { key: 'facebook',     label: 'Facebook' },
  { key: 'instagram',    label: 'Instagram' },
  { key: 'google',       label: 'Google search' },
  { key: 'website',      label: 'TLC website' },
  { key: 'word-of-mouth',label: 'Word of mouth' },
  { key: 'other',        label: 'Other' },
];
const INQUIRY_INTERESTS = [
  { key: 'individual',   label: 'Individual therapy' },
  { key: 'couples',      label: 'Couples therapy' },
  { key: 'family',       label: 'Family therapy' },
  { key: 'child',        label: 'Child / adolescent' },
  { key: 'group',        label: 'Group / support' },
  { key: 'consultation', label: 'Consultation only' },
  { key: 'unsure',       label: 'Not sure yet' },
];

// Health insurance carriers commonly used in US mental health billing.
// `accepted: true` marks the carriers TLC Therapy Solutions has contracted
// with per the homepage advisement (BCBS, Aetna, UHC, Cigna, VA). They
// surface first in the dropdown with a checkmark.
const INSURANCE_CARRIERS = [
  { key: 'bcbs',      label: 'Blue Cross Blue Shield (BCBS)', accepted: true  },
  { key: 'aetna',     label: 'Aetna',                          accepted: true  },
  { key: 'uhc',       label: 'UnitedHealthcare (UHC)',         accepted: true  },
  { key: 'cigna',     label: 'Cigna',                          accepted: true  },
  { key: 'va',        label: 'VA / Veterans Affairs',          accepted: true  },
  { key: 'tricare',   label: 'Tricare (military)',             accepted: false },
  { key: 'medicare',  label: 'Medicare',                       accepted: false },
  { key: 'medicaid',  label: 'Medicaid / IL HFS',              accepted: false },
  { key: 'optum',     label: 'Optum (UHC behavioral)',         accepted: false },
  { key: 'magellan',  label: 'Magellan Health',                accepted: false },
  { key: 'beacon',    label: 'Beacon / Carelon Behavioral',    accepted: false },
  { key: 'humana',    label: 'Humana',                         accepted: false },
  { key: 'eap',       label: 'EAP (Employer Assistance)',      accepted: false },
  { key: 'self-pay',  label: 'Self-pay / private',             accepted: false },
  { key: 'unsure',    label: 'Unsure / need to verify',        accepted: false },
  { key: 'other',     label: 'Other (specify in notes)',       accepted: false },
];

// Map legacy hasInsurance values (Y/N/unsure) -> structured keys for display.
const insuranceLabel = (val) => {
  if (!val) return 'Unsure';
  if (val === 'Y' || val === 'yes') return 'Yes (carrier unspecified)';
  if (val === 'N' || val === 'no')  return 'Self-pay / private';
  const m = INSURANCE_CARRIERS.find(c => c.key === val);
  return m ? m.label + (m.accepted ? ' ✓' : '') : val;
};

function Practice({ inquiries, contractors, addInquiry, updateInquiry, deleteInquiry, practiceLeads = [], addLead, updateLead, deleteLead, email = '', isStaff = false }) {
  const [statusFilter, setStatusFilter] = useState('active');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyInquiry());
  // CONNECTED-CONTEXT task #88 — auto-link suggestions selected by the user
  // before save. Per IN-PLACE-FIRST: lives in the create form, not a modal.
  const [selectedLinks, setSelectedLinks] = useState([]);

  function emptyInquiry() {
    return { firstName: '', contactMethod: 'phone', contactValue: '', interestArea: 'unsure', hasInsurance: 'unsure', preferredProvider: 'any', bestTimeToCall: 'anytime', source: 'church', sourceDetail: '', notes: '' };
  }

  // Top-5 candidate links computed from the draft inquiry's source. Per
  // CONNECTED-CONTEXT.md the matcher is pure and runs in-memory; recomputes
  // whenever the source field changes or the inquiry list updates.
  const suggestedLinks = useMemo(() => {
    if (!showForm || !form.source) return [];
    return findRelatedAuto(form, 'inquiry', { inquiries }, 5);
  }, [showForm, form, inquiries]);

  const inquiryDisplay = (id) => {
    const inq = inquiries.find(i => i.id === id);
    if (!inq) return id;
    return `${inq.firstName}${inq.sourceDetail ? ` · ${inq.sourceDetail}` : ''}`;
  };

  const toggleLink = (link) => {
    setSelectedLinks(prev => prev.some(l => l.toEntityId === link.toEntityId)
      ? prev.filter(l => l.toEntityId !== link.toEntityId)
      : [...prev, link]
    );
  };

  const mswContractors = contractors.filter(c => c.direction === 'outbound');

  const stats = useMemo(() => {
    const total = inquiries.length;
    const newCount = inquiries.filter(i => i.status === 'new').length;
    const inProgress = inquiries.filter(i => ['attempting-contact','contacted'].includes(i.status)).length;
    const converted = inquiries.filter(i => i.status === 'scheduled-intake').length;
    const declined = inquiries.filter(i => ['declined','lost'].includes(i.status)).length;
    const closed = converted + declined;
    const conversionRate = closed > 0 ? (converted / closed) * 100 : 0;
    const bySource = INQUIRY_SOURCES.map(s => ({ key: s.key, label: s.label, count: inquiries.filter(i => i.source === s.key).length })).filter(s => s.count > 0).sort((a,b) => b.count - a.count);
    return { total, newCount, inProgress, converted, declined, closed, conversionRate, bySource };
  }, [inquiries]);

  const visible = useMemo(() => {
    let list = [...inquiries];
    if (statusFilter === 'active') list = list.filter(i => INQUIRY_STATUSES.find(s => s.key === i.status)?.group === 'active');
    else if (statusFilter === 'closed') list = list.filter(i => INQUIRY_STATUSES.find(s => s.key === i.status)?.group === 'closed');
    else if (statusFilter !== 'all') list = list.filter(i => i.status === statusFilter);
    return list.sort((a,b) => new Date(b.receivedAt) - new Date(a.receivedAt));
  }, [inquiries, statusFilter]);

  const submit = () => {
    if (!form.firstName || !form.contactValue) { alert('First name and contact info are required.'); return; }
    addInquiry({ ...form, links: selectedLinks });
    setForm(emptyInquiry());
    setSelectedLinks([]);
    setShowForm(false);
  };

  // Harmonized to the shared SectionTabs primitive (Darrell 2026-07-04: "sliding
  // tabs for all tabs instead of a long scroll"): the old hand-rolled subTab
  // strip + branches became sections of the same guarded, keyboard-navigable
  // tablist every surface slides on. All state stays up here; the render thunks
  // below are plain closures over it. The TLC identity banner and the inquiry
  // KPI strip stay PINNED above the strip (Darrell 2026-07-07: no scrolling to
  // see KPIs — they are always visible on every section).
  const operationsSections = [
    {
      id: 'inquiries',
      label: 'Inquiries',
      render: () => (<div className="space-y-5">
      <section>
        <SectionTitle eyebrow="Practice Operations">Pre-Intake Inquiry Tracking</SectionTitle>
        <p className="text-sm text-[#5A5751] leading-relaxed max-w-prose" style={{ fontFamily: '"Fraunces", serif' }}>
          Capture and track inquiries from prospective clients before they enter Acuity. <strong>No clinical detail. No PHI.</strong> Once an inquiry becomes a scheduled intake, the relationship moves to Acuity — the record of the inquiry stays here for marketing and source tracking only.
        </p>
      </section>

      {/* 2026-05-24: Inquiries section (the Queue + filters + new-inquiry
          form) sits right under the pinned stats row. Pipeline Revenue +
          By Source breakdowns live on the "Revenue & sources" chip. */}

      {/* Add inquiry */}
      <section>
        <div className="flex items-baseline justify-between mb-3 pb-2 border-b border-[#1A1815] gap-2 flex-wrap">
          <h2 className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751]">Inquiries · {visible.length}</h2>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex gap-1 text-[10px] uppercase tracking-wider">
              {[['active','Active'],['closed','Closed'],['all','All']].map(([k, l]) => (
                <button key={k} onClick={() => setStatusFilter(k)} className={`px-2 py-1 ${statusFilter === k ? 'bg-[#1A1815] text-white' : 'text-[#5A5751]'}`}>{l}</button>
              ))}
            </div>
            <button type="button" onClick={() => { setShowForm(!showForm); if (showForm) setSelectedLinks([]); }} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815]">{showForm ? '× Cancel' : '+ Log inquiry'}</button>
          </div>
        </div>

        {showForm && (
          <div className="bg-white border border-[#B85838] p-4 mb-3 space-y-3">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#B85838] font-medium">New inquiry</div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">First name *</label>
                <input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="Sarah" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Contact method</label>
                <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={form.contactMethod} onChange={e => setForm({...form, contactMethod: e.target.value})}>
                  <option value="phone">Phone</option><option value="email">Email</option><option value="text">Text</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Contact info *</label>
              <input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder={form.contactMethod === 'email' ? 'sarah@example.com' : '555-555-1234'} value={form.contactValue} onChange={e => setForm({...form, contactValue: e.target.value})} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Interest area</label>
                <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={form.interestArea} onChange={e => setForm({...form, interestArea: e.target.value})}>
                  {INQUIRY_INTERESTS.map(i => <option key={i.key} value={i.key}>{i.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Has insurance?</label>
                <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={form.hasInsurance} onChange={e => setForm({...form, hasInsurance: e.target.value})}>
                  <optgroup label="✓ Accepted by TLC (in-network)">
                    {INSURANCE_CARRIERS.filter(c => c.accepted).map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </optgroup>
                  <optgroup label="Other carriers / out-of-network">
                    {INSURANCE_CARRIERS.filter(c => !c.accepted).map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </optgroup>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Preferred provider</label>
                <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={form.preferredProvider} onChange={e => setForm({...form, preferredProvider: e.target.value})}>
                  <option value="any">Any provider</option>
                  <option value="christina">Christina</option>
                  {mswContractors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Best time to reach</label>
                <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={form.bestTimeToCall} onChange={e => setForm({...form, bestTimeToCall: e.target.value})}>
                  {TIMES_TO_CALL.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">How did they hear about us?</label>
              <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={form.source} onChange={e => setForm({...form, source: e.target.value})}>
                {INQUIRY_SOURCES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
              <input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4] mt-1.5" placeholder="Source detail (e.g., 'Sister Margaret', 'Sunday bulletin', specific FB ad name)" value={form.sourceDetail} onChange={e => setForm({...form, sourceDetail: e.target.value})} />
            </div>

            <div>
              <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Notes (no clinical detail)</label>
              <textarea rows="2" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="General context only — e.g., 'Asked about evening availability', 'Friend of Lisa from choir'" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
            </div>

            {suggestedLinks.length > 0 && (
              <div className="bg-[#FAF8F4] border border-[#E8E4DC] p-3" aria-labelledby="auto-link-h">
                <div id="auto-link-h" className="text-[10px] uppercase tracking-wider text-[#5A5751] mb-2 font-semibold">
                  🔗 Possibly related — tap to link ({suggestedLinks.length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {suggestedLinks.map(link => {
                    const isSelected = selectedLinks.some(l => l.toEntityId === link.toEntityId);
                    return (
                      <button
                        key={link.toEntityId}
                        type="button"
                        onClick={() => toggleLink(link)}
                        aria-pressed={isSelected}
                        className={`text-[10px] uppercase tracking-wider px-2.5 py-1.5 border min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838] ${isSelected ? 'bg-[#5A6E3D] text-white border-[#5A6E3D]' : 'border-[#E8E4DC] text-[#5A5751] hover:border-[#1A1815] bg-white'}`}
                      >
                        <span aria-hidden="true">{isSelected ? '✓ ' : '+ '}</span>
                        {inquiryDisplay(link.toEntityId)} <span className="opacity-70 normal-case italic">· {link.kind}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[9px] text-[#5A5751] italic mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
                  Auto-detected from same source. Tap to record the connection; tap again to remove. Connections are also visible on the inquiry record later.
                </p>
              </div>
            )}

            <button type="button" onClick={submit} className="w-full bg-[#1A1815] text-[#FAF8F4] py-2 text-xs uppercase tracking-wider hover:bg-[#B85838]">Log Inquiry</button>
            <p className="text-[10px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
              Reminder: do not record clinical history, diagnoses, presenting concerns, or anything that would be PHI. Move the relationship to Acuity for actual intake.
            </p>
          </div>
        )}

        {visible.length === 0 ? (
          <div className="bg-white border border-[#E8E4DC] p-6 text-center">
            <p className="text-sm text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
              {inquiries.length === 0 ? "No inquiries yet. Click '+ Log inquiry' to record the next one that comes in by phone, email, or referral." : `No inquiries in '${statusFilter}' status. Switch the filter above.`}
            </p>
          </div>
        ) : (
          <Queue
            title="Inquiries · Promote queue"
            subtitle="Focused inquiry shows full detail (status, contact, conversation log). Browse the rest below; click any card to bring it into focus."
            emoji="📞"
            accent="#B85838"
            items={visible}
            getKey={(inq) => inq.id}
            defaultPageSize={5}
            pageSizeOptions={[5, 25, 50]}
            renderFocus={(inq) => (
              <InquiryRow
                inq={inq}
                contractors={mswContractors}
                updateInquiry={updateInquiry}
                deleteInquiry={deleteInquiry}
                isLast={true}
                queueMode={true}
              />
            )}
            renderCard={(inq) => {
              const si = INQUIRY_STATUSES.find(s => s.key === inq.status) || INQUIRY_STATUSES[0];
              const so = INQUIRY_SOURCES.find(s => s.key === inq.source);
              const ii = INQUIRY_INTERESTS.find(s => s.key === inq.interestArea);
              const receivedDate = new Date(inq.receivedAt);
              const daysAgo = Math.floor((Date.now() - receivedDate.getTime()) / 86400000);
              const ago = daysAgo === 0 ? 'today' : daysAgo === 1 ? 'yesterday' : `${daysAgo}d ago`;
              const lastLog = inq.conversationLog && inq.conversationLog.length > 0
                ? [...inq.conversationLog].sort((a, b) => b.date.localeCompare(a.date))[0]
                : null;
              const statusColor = si.color === 'green' ? 'text-[#5A6E3D]' : si.color === 'rust' ? 'text-[#B85838]' : 'text-[#5A5751]';
              return (
                <div>
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <div className="flex items-baseline gap-2 flex-wrap min-w-0">
                      <span style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{inq.firstName}</span>
                      <span className={`text-[10px] uppercase tracking-wider font-medium ${statusColor}`}>{si.label}</span>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-[#5A5751] shrink-0">{ago}</span>
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-[#5A5751] mt-0.5">
                    {so?.label || inq.source} · {ii?.label || inq.interestArea}
                  </div>
                  {lastLog && (
                    <div className="text-xs text-[#5A5751] italic mt-1 truncate" style={{ fontFamily: '"Fraunces", serif' }}>
                      Last: {lastLog.summary}
                    </div>
                  )}
                  {!lastLog && inq.notes && (
                    <div className="text-xs text-[#5A5751] italic mt-1 truncate" style={{ fontFamily: '"Fraunces", serif' }}>
                      {inq.notes.length > 80 ? inq.notes.slice(0, 77) + '...' : inq.notes}
                    </div>
                  )}
                </div>
              );
            }}
            actions={[
              { label: '× Delete', onClick: (inq) => { if (confirm(`Delete inquiry from ${inq.firstName}?`)) deleteInquiry(inq.id); }, secondary: true },
            ]}
          />
        )}
      </section>
      </div>),
    },
    {
      id: 'services',
      label: 'Services & team',
      render: () => (<div className="space-y-5">
      {/* Therapy Options · all link to Acuity booking */}
      <section>
        <SectionTitle eyebrow="Therapy Services">All Options · Direct Online Intake</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {[
            { name: 'Individual Therapy', desc: 'One-on-one · adult', for: 'Anxiety · depression · grief · life transitions · faith integration' },
            { name: 'Couples Therapy', desc: 'Marriage & relationships', for: 'Communication · conflict · pre-marital · rebuilding trust' },
            { name: 'Family Therapy', desc: 'Multi-generation work', for: 'Parent-child · sibling dynamics · blended families' },
            { name: 'Child & Adolescent', desc: 'Ages 6-17', for: 'Anxiety · school refusal · behavioral · trauma · identity' },
            { name: 'Group Therapy', desc: 'Themed cohort groups', for: 'Connection-based healing · processing in community' },
            { name: 'Clinical Consultation', desc: 'For pastors & professionals', for: 'Referral guidance · faith-clinical integration · supervision' },
          ].map(s => (
            <div key={s.name} className="bg-white border border-[#E8E4DC] p-3 hover:border-[#B85838] transition-colors">
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <h4 className="text-sm" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{s.name}</h4>
                <a href="https://tlctherapysolutions-scheduleappointment.as.me/" target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] whitespace-nowrap">Book →</a>
              </div>
              <div className="text-[10px] uppercase tracking-wider text-[#5A5751] mb-1">{s.desc}</div>
              <p className="text-xs leading-snug text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>{s.for}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Clinical team · roster with portal links */}
      <section>
        <SectionTitle eyebrow="Clinical Team">Match a Preferred Provider</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {TLC_TEAM.map(c => (
            <a key={c.name} href={c.url} target="_blank" rel="noopener noreferrer" className="bg-white border border-[#E8E4DC] p-3 hover:border-[#B85838] transition-colors flex gap-3 items-start">
              <img src={c.photo} alt={c.name} loading="lazy" className="w-16 h-16 sm:w-20 sm:h-20 object-cover border border-[#E8E4DC] shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2 mb-0.5">
                  <span style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }} className="text-sm">{c.name}</span>
                  <span className="text-[10px] uppercase tracking-wider text-[#B85838] shrink-0">View →</span>
                </div>
                <div className="text-[10px] uppercase tracking-wider text-[#5A5751] mb-1">{c.role}</div>
                <p className="text-xs leading-snug text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>{c.specialty}</p>
              </div>
            </a>
          ))}
        </div>
        <div className="mt-3 p-3 bg-white border border-[#E8E4DC]">
          <div className="text-[10px] uppercase tracking-[0.2em] text-[#B85838] font-semibold mb-1">Insurance Accepted</div>
          <p className="text-xs" style={{ fontFamily: '"Fraunces", serif' }}>
            {TLC_INSURANCE}
          </p>
        </div>
      </section>
      </div>),
    },
    // Gated like the original block: no revenue section until a real inquiry
    // exists (never an empty panel — surface-audit no-dead-ends).
    stats.total > 0 ? {
      id: 'revenue',
      label: 'Revenue & sources',
      render: () => (<div className="space-y-5">
      {/* Revenue projection — assumptions made explicit, replaces actual data once Acuity sync is built */}
        <section className="bg-white border-2 border-[#5A6E3D] p-4 sm:p-5">
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#5A6E3D] font-semibold mb-3">Pipeline Revenue · Estimates (until Acuity sync is built)</div>
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-3">
            <div>
              <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-[#5A5751]">Active pipeline</div>
              <div className="text-lg sm:text-2xl" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{fmtCompact((stats.newCount + stats.inProgress) * (stats.conversionRate || 50) / 100 * ANNUAL_REVENUE_PER_CLIENT)}</div>
              <div className="text-[9px] sm:text-[10px] text-[#5A5751]">expected annual · at current conv</div>
            </div>
            <div>
              <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-[#5A5751]">Converted clients</div>
              <div className="text-lg sm:text-2xl" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{fmtCompact(stats.converted * ANNUAL_REVENUE_PER_CLIENT)}</div>
              <div className="text-[9px] sm:text-[10px] text-[#5A5751]">annual recurring est.</div>
            </div>
            <div>
              <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-[#5A6E3D] font-semibold">If all active convert</div>
              <div className="text-xl sm:text-3xl text-[#5A6E3D]" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{fmtCompact((stats.newCount + stats.inProgress) * ANNUAL_REVENUE_PER_CLIENT)}</div>
              <div className="text-[9px] sm:text-[10px] text-[#5A5751]">upside</div>
            </div>
          </div>
          <p className="text-[10px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
            Assumptions: ~$150/session avg blended (insurance + self-pay), 1 session/week, 48 weeks/year (~$7.2K/client/yr). Estimates only until Acuity integration syncs actual booked + completed session data.
          </p>
        </section>

      {/* Source breakdown */}
      {stats.bySource.length > 0 && (
        <section className="bg-white border border-[#1A1815] p-4">
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] mb-2">By source</div>
          <div className="space-y-1.5">
            {stats.bySource.map(s => {
              const pct = (s.count / stats.total) * 100;
              return (
                <div key={s.key}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span style={{ fontFamily: '"Fraunces", serif' }}>{s.label}</span>
                    <span className="text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{s.count}</span>
                  </div>
                  <div className="h-1.5 bg-[#E8E4DC]"><div className="h-full bg-[#B85838]" style={{ width: `${pct}%` }}></div></div>
                </div>
              );
            })}
          </div>
        </section>
      )}
      </div>),
    } : null,
  ];

  const sections = [
    {
      id: 'operations',
      label: 'Operations',
      icon: 'tools',
      // Operations was still a multi-screen stack — the 3rd-row chips (Darrell
      // 2026-07-05: "a 3rd row of sliding tabs if that tab scrolls really long")
      // split it: day-to-day inquiries, the services/team cards, revenue.
      render: () => (
        <SectionTabs variant="sub" sections={operationsSections} ariaLabel="Operations sections" idBase="practice-ops" defaultId="services" />
      ),
    },
    {
      id: 'growth',
      label: 'Client Growth',
      icon: 'chart',
      render: () => (
        <ClientGrowth leads={practiceLeads} addLead={addLead} updateLead={updateLead} deleteLead={deleteLead} />
      ),
    },
    {
      id: 'learn',
      label: 'Learn',
      icon: 'bookOpen',
      render: () => (
        <SectionBoundary name="Practice Learn">
          <PracticeLearn email={email} isStaff={isStaff} />
        </SectionBoundary>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Pinned above the section strip: the TLC identity banner + the live
          inquiry KPIs — always visible, never a scroll (or a tab) away. */}
      {/* TLC Therapy Solutions integration banner */}
      <section className="bg-white border-2 border-[#1A1815] p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] font-semibold mb-1">TLC Therapy Solutions</div>
            <h2 className="text-2xl mb-1" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>Real Solutions for Real Life.</h2>
            <p className="text-sm text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>Faith-integrated therapy. Online & in-person. Christina Poe, LCSW + clinical team.</p>
          </div>
          <a href="https://tlctherapysolutions-scheduleappointment.as.me/" target="_blank" rel="noopener noreferrer" className="bg-[#1A1815] text-[#FAF8F4] px-4 py-2.5 text-xs uppercase tracking-wider hover:bg-[#B85838] whitespace-nowrap">📅 Book a Session →</a>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          <a href="https://tlctherapysolutions.me/" target="_blank" rel="noopener noreferrer" className="border border-[#E8E4DC] p-2.5 hover:border-[#B85838]">
            <div className="text-[9px] uppercase tracking-wider text-[#5A5751]">Site</div>
            <div style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>tlctherapysolutions.com →</div>
          </a>
          <a href="https://tlctherapysolutions.me/find-your-therapist-flexible-career-opportunities-african-american-women-men-multicultural-illinois-communities" target="_blank" rel="noopener noreferrer" className="border border-[#E8E4DC] p-2.5 hover:border-[#B85838]">
            <div className="text-[9px] uppercase tracking-wider text-[#5A5751]">Match a Therapist</div>
            <div style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>Find Your Therapist →</div>
          </a>
          <a href="mailto:contact@tlctherapysolutions.com" className="border border-[#E8E4DC] p-2.5 hover:border-[#B85838]">
            <div className="text-[9px] uppercase tracking-wider text-[#5A5751]">Direct Contact</div>
            <div style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>contact@tlctherapysolutions.com</div>
          </a>
        </div>
      </section>

      {/* Stats row */}
      <section className="grid grid-cols-4 gap-px bg-[#E8E4DC] border border-[#E8E4DC]">
        <MetricCell label="Active" value={`${stats.newCount + stats.inProgress}`} sub={`${stats.newCount} new`} small accent="rust" />
        <MetricCell label="Converted" value={`${stats.converted}`} sub="to intake" small accent="green" />
        <MetricCell label="Declined" value={`${stats.declined}`} small />
        <MetricCell label="Conversion" value={stats.closed > 0 ? `${stats.conversionRate.toFixed(0)}%` : '—'} sub="of closed" small />
      </section>

      <SectionTabs sections={sections} ariaLabel="Practice sections" idBase="practice" defaultId="operations" />
    </div>
  );
}

function InquiryRow({ inq, contractors, updateInquiry, deleteInquiry, isLast, queueMode = false }) {
  // queueMode (2026-05-24): when true, this row is being rendered as the
  // focus pane of a Queue widget — render the expanded content always,
  // skip the collapsed-row chrome (Details toggle + delete button), since
  // the Queue itself handles delete via its action row and the focus pane
  // is by definition always-expanded.
  const [expanded, setExpanded] = useState(queueMode);
  const [statusNotes, setStatusNotes] = useState('');
  // v28+ Conversation log per inquiry (mirrors property records)
  const [showConvForm, setShowConvForm] = useState(false);
  const [convForm, setConvForm] = useState({ date: new Date().toISOString().slice(0,10), person: '', summary: '', notes: '' });
  const addConvNote = () => {
    if (!convForm.summary) { alert('Summary is required.'); return; }
    const entry = { ...convForm, id: `cv-${Date.now()}` };
    updateInquiry(inq.id, { conversationLog: [...(inq.conversationLog || []), entry] });
    setConvForm({ date: new Date().toISOString().slice(0,10), person: '', summary: '', notes: '' });
    setShowConvForm(false);
  };
  const deleteConvNote = (entryId) => {
    if (!confirm('Delete this conversation note?')) return;
    updateInquiry(inq.id, { conversationLog: (inq.conversationLog || []).filter(e => e.id !== entryId) });
  };
  const statusInfo = INQUIRY_STATUSES.find(s => s.key === inq.status) || INQUIRY_STATUSES[0];
  const sourceInfo = INQUIRY_SOURCES.find(s => s.key === inq.source);
  const interestInfo = INQUIRY_INTERESTS.find(i => i.key === inq.interestArea);
  const providerLabel = inq.preferredProvider === 'any' ? 'any provider' : inq.preferredProvider === 'christina' ? 'Christina' : (contractors.find(c => c.id === inq.preferredProvider)?.name || inq.preferredProvider);
  const receivedDate = new Date(inq.receivedAt);
  const daysAgo = Math.floor((Date.now() - receivedDate.getTime()) / 86400000);

  const changeStatus = (newStatus) => {
    updateInquiry(inq.id, { status: newStatus, statusNotes });
    setStatusNotes('');
  };

  const statusColor = statusInfo.color === 'green' ? 'text-[#5A6E3D]' : statusInfo.color === 'rust' ? 'text-[#B85838]' : 'text-[#5A5751]';

  return (
    <div className={queueMode ? '' : `p-3 ${!isLast ? 'border-b border-[#E8E4DC]' : ''}`}>
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{inq.firstName}</span>
            <span className={`text-[10px] uppercase tracking-wider font-medium ${statusColor}`}>{statusInfo.label}</span>
          </div>
          <div className="text-[10px] uppercase tracking-wider text-[#5A5751] mt-0.5">
            {daysAgo === 0 ? 'today' : daysAgo === 1 ? 'yesterday' : `${daysAgo}d ago`} · {sourceInfo?.label} · {interestInfo?.label}
          </div>
        </div>
        {!queueMode && (
          <div className="flex items-baseline gap-1.5 shrink-0">
            <button type="button" onClick={() => setExpanded(!expanded)} className="text-[10px] uppercase tracking-wider text-[#5A5751]">{expanded ? '× Close' : 'Details'}</button>
            <button type="button" onClick={() => { if (confirm('Delete this inquiry?')) deleteInquiry(inq.id); }} aria-label="Delete" className="text-sm text-[#5A5751] hover:text-[#B85838] hover:bg-[#FAF8F4] border border-transparent hover:border-[#B85838] px-3 py-1.5 min-h-[36px] min-w-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">×</button>
          </div>
        )}
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-[#E8E4DC] space-y-3">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="text-[9px] uppercase tracking-wider text-[#5A5751]">Contact</div>
              <div style={{ fontFamily: '"Fraunces", serif' }}>{inq.contactValue}</div>
              <div className="text-[10px] text-[#5A5751]">{inq.contactMethod} · best: {inq.bestTimeToCall}</div>
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-wider text-[#5A5751]">Provider</div>
              <div style={{ fontFamily: '"Fraunces", serif' }}>{providerLabel}</div>
              <div className="text-[10px] text-[#5A5751]">Insurance: {insuranceLabel(inq.hasInsurance)}</div>
            </div>
          </div>

          {inq.sourceDetail && (<div><div className="text-[9px] uppercase tracking-wider text-[#5A5751]">Source detail</div><div className="text-xs" style={{ fontFamily: '"Fraunces", serif' }}>{inq.sourceDetail}</div></div>)}
          {inq.notes && (<div><div className="text-[9px] uppercase tracking-wider text-[#5A5751]">Notes</div><div className="text-xs" style={{ fontFamily: '"Fraunces", serif' }}>{inq.notes}</div></div>)}

          <div>
            <div className="text-[9px] uppercase tracking-wider text-[#5A5751] mb-1.5">Update status</div>
            <input className="w-full p-1.5 border border-[#E8E4DC] text-xs bg-[#FAF8F4] mb-1.5" placeholder="Optional: notes on this status change" value={statusNotes} onChange={e => setStatusNotes(e.target.value)} />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
              {INQUIRY_STATUSES.filter(s => s.key !== inq.status).map(s => (
                <button key={s.key} onClick={() => changeStatus(s.key)} className="text-[10px] uppercase tracking-wider px-2 py-1.5 border border-[#E8E4DC] hover:border-[#B85838] hover:bg-[#FAF8F4]">{s.label}</button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-[#E8E4DC]">
            <div className="flex items-baseline justify-between gap-2 mb-1.5">
              <div className="text-[9px] uppercase tracking-wider text-[#5A5751]">💬 Conversation Log · {(inq.conversationLog || []).length}</div>
              <button type="button" onClick={() => setShowConvForm(!showConvForm)} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815]">{showConvForm ? '× Cancel' : '+ Log a call / message'}</button>
            </div>
            {showConvForm && (
              <div className="bg-white border border-[#B85838] p-2 mb-2 space-y-1.5">
                <div className="grid grid-cols-2 gap-1.5">
                  <input type="date" className="p-1.5 border border-[#E8E4DC] text-xs bg-[#FAF8F4]" value={convForm.date} onChange={e => setConvForm({ ...convForm, date: e.target.value })} />
                  <input className="p-1.5 border border-[#E8E4DC] text-xs bg-[#FAF8F4]" placeholder="Who: Christina / Maya / VM left" value={convForm.person} onChange={e => setConvForm({ ...convForm, person: e.target.value })} />
                </div>
                <input className="w-full p-1.5 border border-[#E8E4DC] text-xs bg-[#FAF8F4]" placeholder="Summary (required) — e.g., 'verified BCBS, scheduled intake for 5/19 11am'" value={convForm.summary} onChange={e => setConvForm({ ...convForm, summary: e.target.value })} />
                <textarea className="w-full p-1.5 border border-[#E8E4DC] text-xs bg-[#FAF8F4]" rows="2" placeholder="Notes · tone · next step · what to send afterward" value={convForm.notes} onChange={e => setConvForm({ ...convForm, notes: e.target.value })} />
                <button type="button" onClick={addConvNote} className="w-full bg-[#1A1815] text-white py-1.5 text-[10px] uppercase tracking-wider font-semibold hover:bg-[#B85838]">Save Note</button>
              </div>
            )}
            {(inq.conversationLog || []).length === 0 && !showConvForm ? (
              <p className="text-[10px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No conversation notes yet.</p>
            ) : (
              <div className="space-y-1">
                {[...(inq.conversationLog || [])].sort((a, b) => b.date.localeCompare(a.date)).map(e => (
                  <div key={e.id} className="bg-[#FAF8F4] border border-[#E8E4DC] p-1.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{e.date}{e.person ? ` · ${e.person}` : ''}</div>
                        {e.notes && <div className="text-[10px] text-[#5A5751] italic mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{e.notes}</div>}
                      </div>
                      <button type="button" onClick={() => deleteConvNote(e.id)} aria-label="Delete" className="text-sm text-[#5A5751] hover:text-[#B85838] hover:bg-[#FAF8F4] border border-transparent hover:border-[#B85838] px-3 py-1.5 min-h-[36px] min-w-[36px] shrink-0 focus:outline focus:outline-2 focus:outline-[#B85838]">×</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {inq.statusHistory && inq.statusHistory.length > 1 && (
            <div>
              <div className="text-[9px] uppercase tracking-wider text-[#5A5751] mb-1">History</div>
              <div className="space-y-0.5 text-[10px] text-[#5A5751]">
                {inq.statusHistory.map((h, i) => (
                  <div key={i}>
                    {new Date(h.at).toLocaleDateString()} — {INQUIRY_STATUSES.find(s => s.key === h.status)?.label || h.status}
                    {h.notes && <span className="italic"> · "{h.notes}"</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


export { Practice, InquiryRow, INQUIRY_STATUSES, INSURANCE_CARRIERS, insuranceLabel };
export default Practice;
