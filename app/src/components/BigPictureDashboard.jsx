// =============================================================================
// BigPictureDashboard — the Overview surface (view === 'overview')
// =============================================================================
// Extracted WHOLE from the monolith shell 2026-07-03 (second extraction of the
// modularization lane, after ChurchHome). Behavior unchanged by design: same
// hero strip (CompactHero), Action Queue with inline per-row expansion, entity
// rollups, buffer fund, capex, dispatch panel, Life gallery — same props from
// the shell's overview mount. Statically imported by the shell (NOT lazy /
// registry): overview is the app's LANDING view, so it belongs in the main
// chunk — a lazy chunk here would put a loading flash on first paint.
// CompactHero moved along with it (only user). The urgency/capacity layer it
// reads lives in lib/opportunity-capacity.js (moved in the same pass).
// =============================================================================
import React, { useState } from 'react';
import { MetricCell } from './shared.jsx';
import UiIcon from './UiIcon.jsx';
import TraceableNumber from './TraceableNumber.jsx';
import { DispatchPanel } from './DispatchPanel.jsx';
import { LifeGallery } from './LifeGallery.jsx';
import { fmt, fmtCompact } from '../lib/format.js';
import { relativeWhen } from '../lib/calendar-shared.js';
import { getAssignments, summarize as summarizeAssignments } from '../lib/assignments.js';
import {
  traceNetCashFlow, traceCollectionRate, traceToDebt,
  traceReserves, traceDebtFree, traceRentalsFree,
} from '../lib/number-trace.js';
import {
  URGENCY_BANDS, URGENCY_INDEX, dueDateFor,
  capacitySnapshot, capacityDecisionForNewProject,
} from '../lib/opportunity-capacity.js';

// Urgency accents as CLASSES (not inline hex) so the per-theme remap keeps the
// band chips legible in midnight/dark (legibility-guard; inline style hex can't
// be theme-remapped). Keys mirror URGENCY_BANDS' accents.
const URGENCY_ACCENT_CLS = {
  change: 'text-[#B85838] border-[#B85838]',
  incident: 'text-[#D97706] border-[#D97706]',
  project: 'text-[#5A6E3D] border-[#5A6E3D]',
};

// =============================================================================
// BIG PICTURE — v7 dashboard horizontal-first
// =============================================================================
export function BigPictureDashboard({ data = {}, snowballExtra = 0, totals, pressure, setPressure, pressureCalc, projection, rentalSnowball, flaggedRentals, flaggedOpportunities, entityRollups, reserves, upcomingEvents, welcomeDismissed, dismissWelcome, setView, setFeedbackOpen, bufferTarget = 0, bufferCurrent = 0, setBufferCurrent, capexItems = [], watchlist = [], rentals = [], incidents = [], projects = [], resolveIncident, skillProfiles = [], addIncident, addProject, entities = [], ingestData = null, setBooksView = null, contractors = [], workerOps = {}, lifePhotos = [], addLifePhotos, updateLifePhoto, deleteLifePhoto }) {
  // Round 16/17 — Action Queue per-row inline expansion. Tracks which queue
  // item (if any) is currently expanded. Tapping the row body opens the full
  // details + lifecycle log + jump-link inline, so the user never loses
  // context by navigating away. Per
  // /docs/00-foundations/_root/LIFECYCLE-AND-HANDOFF.md Pattern 1 + the
  // founder's UX feedback (r17): "clicking Open jumps to another page and I
  // lose what I clicked — feels clunky."
  const [expandedItemId, setExpandedItemId] = useState(null);
  // Round 12 — Manual Add Item form state for the Action Queue.
  const [showAddQueue, setShowAddQueue] = useState(false);
  const blankQueueItem = () => ({ urgency: 'incident', description: '', linkType: '', linkId: '', cost: 0, dueDate: '' });
  const [queueForm, setQueueForm] = useState(blankQueueItem());
  const pickUrgency = (key) => setQueueForm(f => ({ ...f, urgency: key, dueDate: dueDateFor(key) }));
  const submitQueueItem = () => {
    if (!queueForm.description.trim()) { alert('Describe the issue or work first.'); return; }
    if (queueForm.urgency === 'project') {
      const hpw = 4;
      const decision = capacityDecisionForNewProject(projects, skillProfiles, hpw, { label: `"${queueForm.description}" (~${hpw} hrs/wk)` });
      if (decision.decision === 'cancel') return;
      const todayIso = new Date().toISOString().slice(0, 10);
      addProject && addProject({
        title: queueForm.description.slice(0, 80) + (decision.decision === 'add-tbd' ? ' (TBD)' : ''),
        startDate: todayIso,
        endDate: queueForm.dueDate || '',
        status: decision.decision === 'add-tbd' ? 'tbd' : 'planning',
        domain: 'personal',
        description: `Created from Action Queue.${decision.decision === 'add-tbd' ? '\n\nTBD — parked because family is near/over capacity.' : ''}`,
        hoursPerWeek: hpw,
        entityId: queueForm.linkType === 'entity' ? queueForm.linkId : 'e-personal',
        contractorIds: [],
        conversationLog: [],
      });
      alert(`Added as Project (${decision.decision === 'add-tbd' ? 'TBD' : 'planning'}). Edit details on the Projects tab.`);
    } else {
      addIncident && addIncident({
        date: new Date().toISOString().slice(0, 10),
        amount: parseFloat(queueForm.cost) || 0,
        category: queueForm.linkType === 'rental' ? 'tenant-or-property' : 'general',
        entityId: queueForm.linkType === 'entity' ? queueForm.linkId : (queueForm.linkType === 'rental' ? 'e-poeprops' : 'e-personal'),
        description: queueForm.description,
        urgency: queueForm.urgency,
        status: 'open',
        dueDate: queueForm.dueDate || dueDateFor(queueForm.urgency),
        linkedTo: queueForm.linkType && queueForm.linkId ? { type: queueForm.linkType, id: queueForm.linkId } : undefined,
      });
    }
    setQueueForm(blankQueueItem());
    setShowAddQueue(false);
  };
  // Round 11 — Family capacity snapshot. Sums project hrs/wk (active only)
  // against total skillProfile hrs/wk. Surfaces a meter and warns at 80%/100%.
  const capacity = capacitySnapshot(projects, skillProfiles);
  // Round 10 — Action Queue. Consolidates all open ITSM-class items across the
  // app: Changes (broken now), Incidents (3-day fix), active Projects. Each
  // entry shows urgency band, what + where, age in days. Click jumps to source.
  const todayISO = new Date().toISOString().slice(0, 10);
  const ageInDays = (dateStr) => {
    if (!dateStr) return 0;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 0;
    return Math.floor((Date.now() - d.getTime()) / 86400000);
  };
  const isOverdue = (item) => item.dueDate && item.dueDate < todayISO;
  const openIncidents = incidents.filter(i => i.status !== 'resolved');
  const activeProjects = projects.filter(p => p.status !== 'complete' && p.status !== 'on-hold');
  // Tenant-not-paying — derived from rentals with status 'late' that don't
  // already have an open incident pointing at them.
  const tenantLateRentals = rentals.filter(r => r.status === 'late' && (r.rent || 0) > 0);
  const tenantLateNotTracked = tenantLateRentals.filter(r => !openIncidents.some(i => i.linkedTo?.type === 'rental' && i.linkedTo?.id === r.id));
  // Sort: by urgency order (change first), then by overdue, then by due date.
  const queue = [
    ...openIncidents.map(i => ({
      kind: 'incident',
      id: i.id,
      urgency: i.urgency || 'incident',
      title: i.description,
      meta: i.amount ? fmt(i.amount) : '',
      date: i.date,
      dueDate: i.dueDate,
      jump: (i.linkedTo?.type === 'rental') ? 'rentals' : (i.category === 'medical' || i.category === 'personal') ? 'books' : 'books',
      overdue: isOverdue(i),
      _item: i,
    })),
    ...tenantLateNotTracked.map(r => ({
      kind: 'tenant-late',
      id: `tlr-${r.id}`,
      urgency: 'incident',
      title: `Tenant at ${r.name} behind on rent`,
      meta: `${fmt(r.rent - (r.actual || 0))} short`,
      date: todayISO,
      dueDate: dueDateFor('incident'),
      jump: 'rentals',
      overdue: false,
      _item: r,
    })),
    ...activeProjects.map(p => ({
      kind: 'project',
      id: p.id,
      urgency: 'project',
      title: p.title,
      meta: p.status,
      date: p.startDate,
      dueDate: p.endDate,
      jump: 'projects',
      overdue: isOverdue({ dueDate: p.endDate }),
      _item: p,
    })),
  ].sort((a, b) => {
    const ua = URGENCY_INDEX[a.urgency]?.order || 99;
    const ub = URGENCY_INDEX[b.urgency]?.order || 99;
    if (ua !== ub) return ua - ub;
    if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
    return (a.dueDate || '').localeCompare(b.dueDate || '');
  });
  const counts = URGENCY_BANDS.reduce((acc, u) => {
    acc[u.key] = queue.filter(q => q.urgency === u.key).length;
    return acc;
  }, {});
  // v28+ MVP v1.5 — Buffer Fund mini-card. Spec source: Poe Family Financial
  // Control System v1 → BufferFund sheet ("single highest-ROI move you can make").
  // Preparatory scaffolding — values feed the pending Buffer Fund progress bar
  // + gap callout. Display wiring not yet landed.
  // eslint-disable-next-line no-unused-vars
  const bufferPct = bufferTarget > 0 ? Math.min(100, Math.round((bufferCurrent / bufferTarget) * 100)) : 0;
  // eslint-disable-next-line no-unused-vars
  const bufferGap = Math.max(0, bufferTarget - bufferCurrent);
  // v28+ MVP v1.5 — Cross-references pulled from the single source of truth
  // (setData) so the dashboard reflects edits anywhere in the app without
  // duplicating data. Each is a one-liner computation, no extra state.
  const capexOpenSpend = capexItems.filter(c => c.status !== 'purchased').reduce((s, c) => s + (parseFloat(c.cost) || 0), 0);
  const capexP1Count = capexItems.filter(c => (c.priority || 99) <= 1 && c.status !== 'purchased').length;
  const watchlistCount = watchlist.length;
  const roomItemsNeedingWork = rentals.reduce((s, r) => s + ((r.rooms || []).reduce((ss, rm) => ss + (rm.items || []).filter(it => it.status === 'needs-work' || it.status === 'quoted' || it.status === 'scheduled').length, 0)), 0);
  const equipmentTracked = rentals.reduce((s, r) => s + (r.equipment || []).length, 0);
  const leasesEndingSoon = rentals.filter(r => r.lease?.end).filter(r => {
    const end = new Date(r.lease.end); const now = new Date();
    const days = (end - now) / 86400000; return days >= 0 && days <= 60;
  }).length;
  return (
    <div className="space-y-3 sm:space-y-4">
      {/* WELCOME PANEL — only shows until dismissed */}
      {!welcomeDismissed && (
        <section className="bg-white border-2 border-[#B85838] p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
            <div className="min-w-0">
              <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold mb-1">MVP v1.0 · Welcome</div>
              <h2 className="text-2xl sm:text-3xl mb-2" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>Welcome to Your PoeTech Family OS.</h2>
              <p className="text-base leading-relaxed text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
                A family's stronghold for stewardship, work, and ministry made visible. Sample data is loaded so you can see how everything connects before importing real numbers.
              </p>
            </div>
            <button type="button" onClick={dismissWelcome} className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815] shrink-0">× Dismiss</button>
          </div>
          <div className="mt-4">
            <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-2">Things to try</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { icon: 'chart', label: 'Big Picture', desc: 'You\'re here — household snapshot · 3 hero metrics, pressure slider' },
                { icon: 'coins', label: 'Debts → snowball slider', desc: 'Drag it · watch interest savings move · "YOU SAVE" updates live' },
                { icon: 'home', label: 'Rentals → snowball cascade', desc: 'See which properties pay off when · 7-year debt freedom target' },
                { icon: 'heart', label: 'Practice tab', desc: 'Your practice pipeline · 8 sample inquiries · direct booking links' },
                { icon: 'calendar', label: 'Projects → workload bars', desc: 'See when heavy months are coming · 6 example projects loaded' },
                { icon: 'palette', label: 'Theme swatches (top right)', desc: 'Try them — midnight is the default, easy on the eyes' },
                { icon: 'volume', label: 'Read aloud (bottom right)', desc: 'Tap the speaker — reads any page aloud · 4 speed options for accessibility' },
              ].map((t, i) => (
                <div key={i} className="bg-[#FAF8F4] border border-[#E8E4DC] p-3">
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="text-base"><UiIcon name={t.icon} /></span>
                    <span className="text-sm" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{t.label}</span>
                  </div>
                  <p className="text-xs text-[#5A5751] leading-snug" style={{ fontFamily: '"Fraunces", serif' }}>{t.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-[#E8E4DC]">
            <p className="text-sm leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>
              <strong>When something works, doesn't work, or could be better — tap the floating <button type="button" onClick={() => setFeedbackOpen(true)} className="text-[#B85838] underline font-semibold hover:text-[#1A1815]"><UiIcon name="chat" /> Feedback</button> button bottom-left of any page.</strong> We'll review your notes together. This is your home base — make it yours.
            </p>
            <div className="flex gap-2 mt-3 flex-wrap">
              <button type="button" onClick={dismissWelcome} className="bg-[#1A1815] text-[#FAF8F4] px-5 py-2 text-xs uppercase tracking-wider hover:bg-[#B85838]">Got it · Let's go</button>
              <button type="button" onClick={() => setFeedbackOpen(true)} className="border border-[#B85838] text-[#B85838] px-5 py-2 text-xs uppercase tracking-wider hover:bg-[#B85838] hover:text-white">Leave first impression</button>
            </div>
          </div>
        </section>
      )}

      {/* v28+ MVP v1.5 round 10 — ACTION QUEUE
          One-glance triage panel: Changes (broken now), Incidents (3-day fix),
          Projects (planned work). Anything across the app that needs attention
          surfaces here so you don't have to bounce between tabs to see "what's
          on fire today." Each row jumps to the source view when clicked. */}
      {/* Round 13 — Always render the Action Queue panel. The "+ Add item"
          button stays accessible even when the queue is empty so the family
          can log a Change / Incident / Project at any time. Empty-state copy
          appears in place of the queue rows when nothing's open. */}
      {(
        <section aria-labelledby="action-queue-h" className="bg-white border border-[#1A1815] p-4 sm:p-5">
          <div className="flex items-baseline justify-between gap-2 flex-wrap mb-3">
            <div>
              <h2 id="action-queue-h" className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold">Action Queue · what needs you</h2>
              <p className="text-xs text-[#5A5751] mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>
                Changes are broken NOW (fix today). Incidents need resolution within 3 days. Projects are multi-day planned work.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex gap-1 text-[0.625rem] uppercase tracking-wider">
                {URGENCY_BANDS.map(u => (
                  <span key={u.key} className={`px-2 py-1 border ${counts[u.key] > 0 ? (URGENCY_ACCENT_CLS[u.key] || 'text-[#5A5751] border-[#E8E4DC]') : 'text-[#5A5751] border-[#E8E4DC]'}`}>
                    <span aria-hidden="true">{u.symbol} </span>{u.label} · {counts[u.key]}
                  </span>
                ))}
              </div>
              <button type="button" onClick={() => { setShowAddQueue(s => !s); if (!showAddQueue) setQueueForm({ ...blankQueueItem(), dueDate: dueDateFor('incident') }); }} className="text-xs uppercase tracking-wider px-3 py-2 border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">{showAddQueue ? '× Cancel' : '+ Add item'}</button>
            </div>
          </div>

          {/* Round 12 — Manual creator with parameter rules inline */}
          {showAddQueue && (
            <div className="bg-[#FAF8F4] border-2 border-[#B85838] p-3 mb-4 space-y-3">
              <div>
                <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-2">What kind of item is this?</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {URGENCY_BANDS.map(u => (
                    <button key={u.key} type="button" onClick={() => pickUrgency(u.key)} className="text-left p-3 border min-h-[64px] focus:outline focus:outline-2 focus:outline-[#B85838]" style={queueForm.urgency === u.key ? { backgroundColor: u.accent, color: 'white', borderColor: u.accent } : { color: u.accent, borderColor: u.accent }}>
                      <div className="text-xs uppercase tracking-wider font-semibold"><span aria-hidden="true">{u.symbol}</span> {u.label}</div>
                      <div className="text-[0.625rem] mt-1 opacity-90" style={{ fontFamily: '"Fraunces", serif' }}>
                        {u.key === 'change' && 'Broken NOW. Acted on today. Same-day due. Routes to Incidents.'}
                        {u.key === 'incident' && 'Needs resolution within ~3 days. Routes to Incidents.'}
                        {u.key === 'project' && 'Takes longer than 3 days. Routes to Projects (capacity check; TBD if family is over).'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="aq-desc" className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] block mb-1">What's the issue or work?</label>
                <input id="aq-desc" autoFocus className="w-full p-2 border border-[#1A1815] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]" placeholder="e.g., Furnace died at 240 Cedar Ln Apt 4 · Replace front door lock · File quarterly taxes" value={queueForm.description} onChange={e => setQueueForm({ ...queueForm, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label htmlFor="aq-link" className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] block mb-1">Linked to (optional)</label>
                  <select id="aq-link" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]" value={queueForm.linkType} onChange={e => setQueueForm({ ...queueForm, linkType: e.target.value, linkId: '' })}>
                    <option value="">— nothing specific —</option>
                    <option value="rental">A property</option>
                    <option value="project">An existing project</option>
                    <option value="entity">An entity (LLC / household)</option>
                  </select>
                </div>
                {queueForm.linkType && (
                  <div>
                    <label htmlFor="aq-linkid" className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] block mb-1">Which one?</label>
                    <select id="aq-linkid" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]" value={queueForm.linkId} onChange={e => setQueueForm({ ...queueForm, linkId: e.target.value })}>
                      <option value="">— pick one —</option>
                      {queueForm.linkType === 'rental' && rentals.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                      {queueForm.linkType === 'project' && projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                      {queueForm.linkType === 'entity' && entities.map(e => <option key={e.id} value={e.id}>{e.name.split('(')[0].trim()}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label htmlFor="aq-due" className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] block mb-1">Due date (auto from urgency, editable)</label>
                  <input id="aq-due" type="date" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]" value={queueForm.dueDate} onChange={e => setQueueForm({ ...queueForm, dueDate: e.target.value })} />
                </div>
              </div>
              <div>
                <label htmlFor="aq-cost" className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] block mb-1">Estimated cost (optional)</label>
                <input id="aq-cost" type="number" step="0.01" min="0" inputMode="decimal" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]" value={queueForm.cost} onChange={e => setQueueForm({ ...queueForm, cost: e.target.value })} />
              </div>
              <div className="flex gap-2 flex-wrap pt-1">
                <button type="button" onClick={submitQueueItem} className="bg-[#1A1815] text-white px-4 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">Save {URGENCY_INDEX[queueForm.urgency]?.label}</button>
                <button type="button" onClick={() => setShowAddQueue(false)} className="border border-[#1A1815] px-4 py-2 text-xs uppercase tracking-wider hover:bg-white min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">Cancel</button>
              </div>
            </div>
          )}
          <div className="bg-white border border-[#E8E4DC]">
            {queue.length === 0 && (
              <div className="p-6 text-center">
                <div className="text-2xl mb-1" aria-hidden="true">✓</div>
                <div className="text-sm text-[#5A6E3D] font-semibold" style={{ fontFamily: '"Fraunces", serif' }}>Nothing open. Clean queue.</div>
                <p className="text-xs text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>Need to log something new? Tap <strong>+ Add item</strong> above.</p>
              </div>
            )}
            {queue.slice(0, 8).map((q, i, arr) => {
              const band = URGENCY_INDEX[q.urgency] || URGENCY_INDEX.incident;
              const age = ageInDays(q.date);
              // Resolve the underlying source record to read its lifecycle log
              // and full description. Incidents live in `incidents[]`; projects
              // live in `projects[]`.
              const sourceItem = q.kind === 'incident'
                ? (incidents.find(it => it.id === q.id) || null)
                : (projects.find(p => p.id === q.id) || null);
              const lifecycleLog = (sourceItem && sourceItem.lifecycle && sourceItem.lifecycle.log) || [];
              const fullDescription = sourceItem ? (sourceItem.description || '') : '';
              const expanded = expandedItemId === q.id;
              // Human-friendly destination tab labels for the "Open in X tab" link.
              const jumpLabelMap = { 'real-estate': 'Real Estate', 'projects': 'Projects', 'practice': 'Practice', 'books': 'Books', 'inbound': 'Inbound', 'capex': 'Projects · Inventory' };
              const jumpLabel = jumpLabelMap[q.jump] || (q.jump ? q.jump.replace(/-/g, ' ') : 'source');
              return (
                <div key={q.id} className={`${i < arr.length - 1 ? 'border-b border-[#E8E4DC]' : ''} ${q.overdue ? 'bg-[#FAF8F4]' : ''}`}>
                  <div className="p-3 flex items-center gap-3 flex-wrap">
                    <span aria-hidden="true" className="inline-block w-6 text-center text-base font-bold" style={{ color: band.accent }} title={band.label}>{band.symbol}</span>
                    {/* The whole left side is one big button — tap anywhere on it
                        to expand the row inline. No navigation, no context loss. */}
                    <button
                      type="button"
                      onClick={() => setExpandedItemId(expanded ? null : q.id)}
                      aria-expanded={expanded}
                      aria-label={expanded ? `Collapse details for ${q.title}` : `Show details and history for ${q.title}`}
                      className="flex-1 min-w-0 text-left hover:bg-[#FAF8F4] -mx-1 px-1 py-0.5 focus:outline focus:outline-2 focus:outline-[#B85838]"
                    >
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-[0.625rem] uppercase tracking-wider font-semibold" style={{ color: band.accent }}>{band.label}</span>
                        <span style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{q.title}</span>
                        {q.overdue && <span className="text-[0.625rem] uppercase tracking-wider text-[#B85838] font-semibold"><UiIcon name="alert" /> overdue</span>}
                        <span className="text-[0.625rem] text-[#5A5751] ml-auto font-semibold" aria-hidden="true">{expanded ? '▲' : '▼'} details</span>
                      </div>
                      <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                        {q.kind} · opened {age}d ago{q.dueDate ? ` · due ${q.dueDate}` : ''}{q.meta ? ` · ${q.meta}` : ''}{(() => { const s = summarizeAssignments(getAssignments(sourceItem)); return s ? ` · crew ${s}` : ''; })()}{lifecycleLog.length > 1 ? ` · ${lifecycleLog.length} log entries` : ''}
                      </div>
                    </button>
                    {/* Primary action (Resolve for incidents) stays visible on the
                        collapsed row — most-common action, one tap away. */}
                    <div className="flex items-center gap-1 shrink-0">
                      {q.kind === 'incident' && resolveIncident && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); resolveIncident(q.id); }}
                          aria-label={`Mark "${q.title}" resolved`}
                          className="text-xs uppercase tracking-wider px-3 py-1.5 border border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]"
                        >
                          ✓ Resolve
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Inline expansion — full description + lifecycle log +
                      explicit "Open in <tab>" jump link. The user sees
                      everything in place; they only navigate away if they
                      explicitly choose to. Per CONNECTED-CONTEXT.md + the
                      r17 UX fix: "click Open and I lose what I clicked." */}
                  {expanded && (
                    <div className="px-3 pb-3 pt-2 bg-[#FAF8F4] border-t border-[#E8E4DC] space-y-3">
                      {fullDescription && fullDescription !== q.title && (
                        <p className="text-sm text-[#1A1815] leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>{fullDescription}</p>
                      )}
                      {/* Dispatch — the path from "needs fixed" to a 1099 worker's
                          phone. Renders for any incident; pulls the linked
                          property so the job text carries the full address. */}
                      {q.kind === 'incident' && sourceItem && workerOps.onAssign && (
                        <div className="bg-white border border-[#E8E4DC] p-2.5">
                          <DispatchPanel
                            incident={sourceItem}
                            property={sourceItem.linkedTo?.type === 'rental' ? (rentals.find(r => r.id === sourceItem.linkedTo.id) || null) : null}
                            contractors={contractors}
                            {...workerOps}
                            onResolve={resolveIncident}
                          />
                        </div>
                      )}
                      {lifecycleLog.length > 0 && (
                        <div>
                          <div className="text-[0.5625rem] uppercase tracking-[0.25em] text-[#5A5751] font-semibold mb-2">Lifecycle history · {lifecycleLog.length} {lifecycleLog.length === 1 ? 'entry' : 'entries'}</div>
                          <ol className="space-y-1.5">
                            {lifecycleLog.map((entry, idx) => (
                              <li key={idx} className="text-xs text-[#1A1815] flex flex-wrap items-baseline gap-x-2" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                                <span className="text-[0.625rem] text-[#5A5751]">{(entry.at || '').slice(0, 16).replace('T', ' ')}</span>
                                <span className="text-[0.625rem]">
                                  {entry.fromPhase ? <><span className="text-[#5A5751]">{entry.fromPhase}</span><span className="text-[#5A5751]"> → </span></> : null}
                                  <span className="font-semibold" style={{ color: band.accent }}>{entry.toPhase}</span>
                                </span>
                                <span className="text-[0.625rem] text-[#5A5751]">by {entry.by || 'user'}</span>
                                {entry.note && <span className="text-[0.6875rem] text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>— {entry.note}</span>}
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                      <div className="flex gap-2 flex-wrap pt-1">
                        <button
                          type="button"
                          onClick={() => setView(q.jump)}
                          className="text-xs uppercase tracking-wider px-3 py-1.5 border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]"
                        >
                          Open in {jumpLabel} tab ↗
                        </button>
                        <button
                          type="button"
                          onClick={() => setExpandedItemId(null)}
                          className="text-xs uppercase tracking-wider px-3 py-1.5 text-[#5A5751] hover:text-[#1A1815] min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]"
                        >
                          Collapse
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {queue.length > 8 && (
              <div className="p-3 text-[0.625rem] uppercase tracking-wider text-[#5A5751] text-center border-t border-[#E8E4DC]" style={{ fontFamily: '"Fraunces", serif' }}>
                + {queue.length - 8} more · open the source tab to see them all
              </div>
            )}
          </div>
        </section>
      )}

      {/* Round 11 — Family capacity meter. At-a-glance "do we have time?"
          Shown only when skill profiles + projects both exist. Color-banded:
          green <80%, amber 80-100%, rust >100% (over-committed). */}
      {capacity.hasProfiles && (capacity.available > 0) && (
        <section aria-labelledby="capacity-h" className="bg-white border border-[#1A1815] p-4 sm:p-5">
          <div className="flex items-baseline justify-between gap-2 flex-wrap mb-2">
            <div>
              <h2 id="capacity-h" className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] font-semibold">Family Capacity · this week</h2>
              <p className="text-xs text-[#5A5751] mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>
                Sum of all active projects' hrs/wk vs sum of skill-profile hrs/wk. Healthy zone: under 80%. New projects past this line get parked as TBD by default.
              </p>
            </div>
            <div className="text-right">
              <div className={`text-2xl ${capacity.pct >= 100 ? 'text-[#B85838]' : capacity.pct >= 80 ? 'text-[#D97706]' : 'text-[#5A6E3D]'}`} style={{ fontFamily: '"Fraunces", serif', fontWeight: 700 }}>
                {capacity.pct}%
              </div>
              <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                {capacity.committed} / {capacity.available} hrs/wk · {capacity.remaining} free
              </div>
            </div>
          </div>
          <div role="progressbar" aria-labelledby="capacity-h" aria-valuenow={capacity.pct} aria-valuemin="0" aria-valuemax="100">
            <div className="w-full bg-[#FAF8F4] h-3 border border-[#E8E4DC]">
              <div
                className="h-full transition-all"
                style={{
                  width: `${Math.min(100, capacity.pct)}%`,
                  backgroundColor: capacity.pct >= 100 ? '#B85838' : capacity.pct >= 80 ? '#D97706' : '#5A6E3D',
                }}
              />
            </div>
            <div className="flex justify-between text-[0.5625rem] uppercase tracking-wider text-[#5A5751] mt-1">
              <span>0%</span><span>healthy ≤80%</span><span>tight ≤100%</span><span>over</span>
            </div>
          </div>
          {capacity.pct >= 80 && (
            <p className={`text-xs mt-2 ${capacity.pct >= 100 ? 'text-[#B85838]' : 'text-[#D97706]'}`} style={{ fontFamily: '"Fraunces", serif' }}>
              <strong>{capacity.pct >= 100 ? 'Over-committed.' : 'Tight.'}</strong> New projects from Dev/Ops &quot;Wrap me&quot; or Tenant-as-Project will prompt before adding. {projects.filter(p => p.status === 'tbd').length > 0 && <> {projects.filter(p => p.status === 'tbd').length} project{projects.filter(p => p.status === 'tbd').length === 1 ? '' : 's'} already parked as TBD.</>}
            </p>
          )}
        </section>
      )}

      {/* HERO ROW — FORCED HORIZONTAL ON MOBILE */}
      <section className="grid grid-cols-3 gap-2 sm:gap-4">
        <CompactHero label="Net cash flow" value={`${totals.netCashFlow >= 0 ? '+' : ''}${fmtCompact(totals.netCashFlow)}`} sub="per mo · all entities" accent={totals.netCashFlow >= 0 ? 'green' : 'rust'} trace={traceNetCashFlow(data, totals)} />
        <CompactHero label="Consumer debt free" value={projection.debtFreeDate} sub={`${projection.debtFreeYears.toFixed(1)}yr · pressure ${pressure}`} trace={traceDebtFree(data, totals, projection, pressureCalc, 'date')} />
        <CompactHero label="Rentals owned free" value={rentalSnowball.allClearedDate} sub={`${rentalSnowball.allClearedYears.toFixed(1)}yr · snowball`} trace={traceRentalsFree(data, rentalSnowball, snowballExtra, 'date')} />
      </section>

      {/* Phase 2B.2 — Bank reconciliation status strip. Surfaces the same
          ingest data that Tx + Accounts show, but as a Big-Picture-level
          "here's what your books look like next to what the banks say."
          Three cells, all clickable. Stays hidden until ingestData arrives
          to avoid layout shift on slow networks. */}
      {ingestData && ingestData.meta && ingestData.meta.loaded && Object.keys(ingestData.bank_balances || {}).length > 0 && (() => {
        const allUserAccounts = entityRollups.flatMap(r => r.accounts || []);
        let linkedCount = 0;
        let bankCash = 0;
        let manualCash = 0;
        for (const a of allUserAccounts) {
          if (!['checking','savings','cash','investment'].includes(a.type) || a.inLegal) continue;
          const manualBal = (a.derivedBalance ?? a.balance ?? 0);
          manualCash += manualBal;
          const last4 = (a.fragment || '').match(/(\d{4})/)?.[1];
          if (!last4) { bankCash += manualBal; continue; }
          const balKey = Object.keys(ingestData.bank_balances).find(k => k.includes(last4));
          if (balKey && typeof ingestData.bank_balances[balKey].ledger_balance === 'number') {
            linkedCount += 1;
            bankCash += ingestData.bank_balances[balKey].ledger_balance;
          } else {
            bankCash += manualBal;
          }
        }
        const sc = (ingestData.counts && ingestData.counts.status_counts) || {};
        const needsAttention = (sc.unexplained || 0) + (sc.unconfirmed || 0);
        const cashDelta = +(bankCash - manualCash).toFixed(2);
        const totalInstitutions = (ingestData.counts && ingestData.counts.institutions || []).length;
        return (
          <section aria-labelledby="bank-recon-h">
            <h2 id="bank-recon-h" className="sr-only">Bank reconciliation status</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-[#E8E4DC] border border-[#E8E4DC]">
              <button type="button" onClick={() => { setView('books'); setBooksView && setBooksView('accounts'); }} className="bg-white p-3 text-left hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]">
                <div className="text-[0.5625rem] uppercase tracking-[0.2em] text-[#5A5751]">Bank cash · linked</div>
                <div className={`text-lg ${bankCash < 0 ? 'text-[#B85838]' : 'text-[#1A1815]'}`} style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{fmtCompact(bankCash)}</div>
                <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">{linkedCount} of {allUserAccounts.filter(a => ['checking','savings','cash','investment'].includes(a.type) && !a.inLegal).length} accounts · {totalInstitutions} feeds</div>
              </button>
              <button type="button" onClick={() => { setView('books'); setBooksView && setBooksView('accounts'); }} className="bg-white p-3 text-left hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]">
                <div className="text-[0.5625rem] uppercase tracking-[0.2em] text-[#5A5751]">Manual vs bank</div>
                <div className={`text-lg ${Math.abs(cashDelta) < 0.5 ? 'text-[#5A6E3D]' : cashDelta < 0 ? 'text-[#B85838]' : 'text-[#D97706]'}`} style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{cashDelta >= 0 ? '+' : ''}{fmtCompact(cashDelta)}</div>
                <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">{Math.abs(cashDelta) < 0.5 ? 'reconciled' : cashDelta < 0 ? 'bank lower than ledger' : 'bank higher than ledger'}</div>
              </button>
              <button type="button" onClick={() => { setView('books'); setBooksView && setBooksView('transactions'); }} className="bg-white p-3 text-left hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]" title="Books → Tx → tap the 'Needs attention' filter pill">
                <div className="text-[0.5625rem] uppercase tracking-[0.2em] text-[#5A5751]">Needs attention</div>
                <div className={`text-lg ${needsAttention > 0 ? 'text-[#B85838]' : 'text-[#5A6E3D]'}`} style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{needsAttention}</div>
                <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">{needsAttention > 0 ? 'ingest rows · review on Tx' : 'fully reconciled'}</div>
              </button>
            </div>
          </section>
        );
      })()}

      {/* v28+ MVP v1.5 — Cross-reference strip.
          Pulls live counts from Real Estate, Markets, and Capex so the
          dashboard reflects edits anywhere in the app without duplicating
          state. Every cell is a button → jumps to the source view.
          FUTURE-MODULE HOOK: New modules can drop a cell into this strip
          by following the same prop pattern (label + value + onClick → view). */}
      {(capexItems.length > 0 || watchlist.length > 0 || equipmentTracked > 0 || roomItemsNeedingWork > 0 || leasesEndingSoon > 0) && (
        <section aria-labelledby="xref-strip-h">
          <h2 id="xref-strip-h" className="sr-only">Cross-reference summary</h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-px bg-[#E8E4DC] border border-[#E8E4DC]">
            <button type="button" onClick={() => setView('rentals')} className="bg-white p-3 text-left hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]">
              <div className="text-[0.5625rem] uppercase tracking-[0.2em] text-[#5A5751]">Property work</div>
              <div className="text-lg" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{roomItemsNeedingWork}</div>
              <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">room items open</div>
            </button>
            <button type="button" onClick={() => setView('rentals')} className="bg-white p-3 text-left hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]">
              <div className="text-[0.5625rem] uppercase tracking-[0.2em] text-[#5A5751]">Equipment</div>
              <div className="text-lg" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{equipmentTracked}</div>
              <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">tracked items</div>
            </button>
            <button type="button" onClick={() => setView('rentals')} className={`bg-white p-3 text-left hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838] ${leasesEndingSoon > 0 ? 'bg-[#FAF8F4]' : ''}`}>
              <div className="text-[0.5625rem] uppercase tracking-[0.2em] text-[#5A5751]">Leases</div>
              <div className={`text-lg ${leasesEndingSoon > 0 ? 'text-[#B85838]' : ''}`} style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{leasesEndingSoon}</div>
              <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">ending in 60d</div>
            </button>
            <button type="button" onClick={() => setView('about')} className="bg-white p-3 text-left hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]">
              <div className="text-[0.5625rem] uppercase tracking-[0.2em] text-[#5A5751]">Capex open</div>
              <div className="text-lg" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{fmtCompact(capexOpenSpend)}</div>
              <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">{capexP1Count} P1 · {capexItems.length} total</div>
            </button>
            <button type="button" onClick={() => setView('markets')} className="bg-white p-3 text-left hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]">
              <div className="text-[0.5625rem] uppercase tracking-[0.2em] text-[#5A5751]">Watchlist</div>
              <div className="text-lg" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{watchlistCount}</div>
              <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">{watchlistCount === 1 ? 'ticker' : 'tickers'}</div>
            </button>
          </div>
        </section>
      )}

      {/* v28+ MVP v1.5 round 3 — Buffer Fund relocated to Books → Accounts
          (lives next to All Accounts Total where its meaning is clearest). */}

      {/* ENTITY STRIP — horizontal on all screens */}
      <section>
        <div className="text-[0.5625rem] uppercase tracking-[0.25em] text-[#5A5751] mb-1.5">Entities</div>
        <div className="grid grid-cols-4 gap-px bg-[#E8E4DC] border border-[#E8E4DC]">
          {entityRollups.map((r) => (
            <div key={r.entity.id} className="bg-[#FAF8F4] p-2 sm:p-3">
              <div className="text-[0.5625rem] uppercase tracking-[0.15em] text-[#5A5751]">{r.entity.type}</div>
              <div className="text-xs sm:text-sm leading-tight mt-0.5" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{r.entity.name.split('(')[0].split('LLC')[0].trim()}</div>
              <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] mt-1.5">Inflow</div>
              <div className="text-xs sm:text-sm" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{fmtCompact(r.inflow)}</div>
              {r.debtBalance > 0 && (<><div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] mt-1">Debt</div><div className="text-xs sm:text-sm text-[#B85838]" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{fmtCompact(r.debtBalance)}</div></>)}
            </div>
          ))}
        </div>
      </section>

      {/* PRESSURE + WHAT CHANGES side-by-side on tablet+, stacked on mobile */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-white border border-[#1A1815] p-4 sm:p-5">
          <div className="flex items-baseline justify-between mb-2">
            <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751]">Pressure</div>
            <div className="text-xl" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{pressure}/10</div>
          </div>
          <input type="range" min="1" max="10" step="1" value={pressure} onChange={(e) => setPressure(parseInt(e.target.value))} className="w-full accent-[#B85838] mb-2" />
          <div className="flex justify-between text-[0.5625rem] uppercase tracking-wider text-[#5A5751] mb-3">
            <span>Loose</span><span>Moderate</span><span>Sprint</span>
          </div>
          <p className="text-xs sm:text-sm italic" style={{ fontFamily: '"Fraunces", serif' }}>{pressureCalc.stress} pressure — {pressureCalc.desc}.</p>
        </div>

        <div className="bg-white border border-[#1A1815] p-4 sm:p-5">
          <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] mb-2">What changes at this setting</div>
          <div className="grid grid-cols-2 gap-px bg-[#E8E4DC] border border-[#E8E4DC]">
            <MetricCell label="Debt free in" value={`${projection.debtFreeYears.toFixed(1)} yr`} small trace={traceDebtFree(data, totals, projection, pressureCalc, 'years')} />
            <MetricCell label="Interest" value={fmtCompact(projection.totalInterestPaid)} small trace={traceDebtFree(data, totals, projection, pressureCalc, 'interest')} />
            <MetricCell label="To debt/mo" value={fmt(pressureCalc.extraAvailable)} small trace={traceToDebt(data, totals, pressureCalc)} />
            <MetricCell label="Reserves" value={fmt(pressureCalc.reservesDeducted)} small accent="rust" trace={traceReserves(data, reserves)} />
          </div>
        </div>
      </section>

      {/* Money Date + Upcoming Events */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-white border border-[#1A1815] p-4 sm:p-5">
          <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] mb-2 font-medium">Money Date Packet</div>
          <div className="space-y-2.5">
            {flaggedRentals.length > 0 && (
              <div className="border-l-2 border-[#B85838] pl-3">
                <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] mb-0.5">Needs attention</div>
                {flaggedRentals.map((r) => (
                  <div key={r.id} className="text-xs sm:text-sm">
                    <span style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{r.name}</span>
                    <span className="text-[#5A5751]"> — {fmt(r.rent - r.actual)} short</span>
                  </div>
                ))}
              </div>
            )}
            <div className="border-l-2 border-[#5A6E3D] pl-3">
              <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] mb-0.5">On track</div>
              <div className="text-xs sm:text-sm">
                <TraceableNumber trace={traceCollectionRate(data, totals)} label="rent collection rate"><span style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{totals.collectionRate.toFixed(1)}%</span></TraceableNumber> rent collection
              </div>
            </div>
            {flaggedOpportunities.length > 0 && (
              <div className="border-l-2 border-[#1A1815] pl-3">
                <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] mb-0.5">Priority opportunities</div>
                {flaggedOpportunities.slice(0,2).map((o) => (
                  <div key={o.id} className="text-xs sm:text-sm">
                    <span style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{o.what}</span>
                    <span className="text-[#5A5751]"> — {fmt(o.monthly)}/mo</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-[#1A1815] p-4 sm:p-5">
          <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] mb-2">Upcoming Events</div>
          {upcomingEvents.length === 0 ? (
            <p className="text-xs text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No events scheduled. Add one in Books → Calendar.</p>
          ) : (
            <div className="space-y-2">
              {upcomingEvents.slice(0, 4).map(e => (
                <div key={e.id} className="border-l-2 border-[#B85838] pl-3">
                  <div className="text-xs sm:text-sm flex justify-between gap-2">
                    <span style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{e.title}</span>
                    <span className="text-[#5A5751] shrink-0 text-[0.625rem] uppercase tracking-wider">{relativeWhen(e.dateTime)}</span>
                  </div>
                  <div className="text-[0.625rem] text-[#5A5751] uppercase tracking-wider">{e.date}{e.time ? ` · ${e.time}` : ''} · {e.category}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* THE BIGGEST PICTURE — family / business / project hero photos. Moved to
          the BOTTOM (2026-06-24, Darrell): the Action Queue ("what needs you")
          leads the tab; the photo wall closes it as the "this is what it's all
          for" coda. */}
      <LifeGallery photos={lifePhotos} addLifePhotos={addLifePhotos} updateLifePhoto={updateLifePhoto} deleteLifePhoto={deleteLifePhoto} rentals={rentals} />
    </div>
  );
}

function CompactHero({ label, value, sub, accent, trace }) {
  const colorClass = accent === 'green' ? 'text-[#5A6E3D]' : accent === 'rust' ? 'text-[#B85838]' : 'text-[#1A1815]';
  const valueEl = (
    <div className={`text-base sm:text-2xl leading-tight truncate ${colorClass}`} style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{value}</div>
  );
  return (
    <div className="bg-white border border-[#1A1815] p-2.5 sm:p-4 min-w-0">
      <div className="text-[0.5625rem] sm:text-[0.625rem] uppercase tracking-[0.2em] text-[#5A5751] mb-1 leading-tight">{label}</div>
      {trace ? <TraceableNumber trace={trace} label={label} className="max-w-full">{valueEl}</TraceableNumber> : valueEl}
      {sub && <div className="text-[0.5625rem] sm:text-xs text-[#5A5751] mt-1 leading-tight">{sub}</div>}
    </div>
  );
}
