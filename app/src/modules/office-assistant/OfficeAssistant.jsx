// =============================================================================
// OfficeAssistant — the config-driven UI for the office referral + assistant
// =============================================================================
// The generalized version of components/TlcAssistant.jsx: every label, template,
// category, and target comes from `config`; every derived number from `model`
// (real records, nothing painted — DR-0061); every write from the passed-in
// `store` (one singleton per office). Mount it as `<OfficeAssistant config={CFG}
// store={officeStore} isGovernor={...} />` — TLC does exactly that via
// components/TlcAssistant.jsx.
//
// NO PHI: referral SOURCES only (organizations + office contacts), never clients
// or protected health information (config.noPhiNote states the office's boundary).
import React, { useMemo, useState } from 'react';
import { SectionTitle, MetricCell } from '../../components/shared.jsx';
import UiIcon from '../../components/UiIcon.jsx';
import SectionTabs from '../../components/SectionTabs.jsx';
import { createOfficeModel, isSeedId } from './model.js';

const num = (n) => (Number(n) || 0).toLocaleString();
const pct = (n) => `${Math.round(Number(n) || 0)}%`;
const shortDate = (iso) => { if (!iso) return ''; try { return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); } catch { return ''; } };

// Badge class derived from the outcome's own flags, so any office's outcome set
// renders correctly: good => green, still-open => amber, closed/neutral => grey.
function outcomeBadgeClass(o) {
  if (o && o.good) return 'bg-[#F0F4EA] text-[#3F5226] border-[#5A6E3D]';
  if (o && o.open) return 'bg-[#FBF7EC] text-[#B45309] border-[#B85838]';
  return 'bg-[#FAF8F4] text-[#8A857C] border-[#C9C2B4]';
}

function Badge({ children, cls }) {
  return <span className={`inline-block px-1.5 py-0.5 border text-[0.625rem] font-semibold uppercase tracking-wide ${cls}`}>{children}</span>;
}
function Bar({ pct: p, good }) {
  return (
    <div className="h-2 w-full bg-[#FAF8F4] border border-[#C9C2B4] overflow-hidden">
      <div className={`h-full ${good ? 'bg-[#5A6E3D]' : 'bg-[#B85838]'}`} style={{ width: `${Math.min(100, p)}%` }} />
    </div>
  );
}

export default function OfficeAssistant({ config, store, model: modelProp = null, isGovernor = false }) {
  // The model is pure — derive it from config once (or accept an injected one).
  const model = useMemo(() => modelProp || createOfficeModel(config), [modelProp, config]);
  const state = store.useStore();
  const orgs = useMemo(() => state.orgs || [], [state.orgs]);
  const posts = useMemo(() => state.posts || [], [state.posts]);
  const schedule = useMemo(() => state.schedule || [], [state.schedule]);
  const now = new Date().toISOString();

  const stats = useMemo(() => model.orgStats(orgs), [model, orgs]);
  const report = useMemo(() => model.dailyReport(orgs, posts, now), [model, orgs, posts, now]);
  const week = useMemo(() => model.weeklyProgress(orgs, posts, now), [model, orgs, posts, now]);
  const goal = useMemo(() => model.networkGoal(orgs), [model, orgs]);
  const dueList = useMemo(() => model.followUpsDue(orgs, now), [model, orgs, now]);
  const converting = useMemo(() => model.topConvertingSources(orgs), [model, orgs]);
  const todayCat = model.categoryForDay(now);

  const ctx = { config, model, store, isGovernor };

  const sections = [
    { id: 'today', label: 'Today', icon: 'home', render: () => <TodaySection {...ctx} report={report} todayCat={todayCat} dueList={dueList} goal={goal} schedule={schedule} /> },
    { id: 'referrals', label: `Referral DB (${stats.total})`, icon: 'users', render: () => <ReferralSection {...ctx} orgs={orgs} stats={stats} goal={goal} converting={converting} /> },
    { id: 'outreach', label: 'Outreach', icon: 'mail', render: () => <OutreachSection {...ctx} dueList={dueList} /> },
    { id: 'content', label: 'Content', icon: 'palette', render: () => <ContentSection {...ctx} posts={posts} ideas={state.ideas || []} /> },
    { id: 'goals', label: 'Weekly goals', icon: 'chart', render: () => <GoalsSection {...ctx} week={week} /> },
    { id: 'ari', label: 'Ari 24/7', icon: 'sparkle', render: () => <AriSection {...ctx} converting={converting} /> },
  ];

  const eyebrow = [config.brand, config.brandTagline].filter(Boolean).join(' · ');
  return (
    <div className="max-w-5xl">
      <SectionTitle eyebrow={eyebrow}>Assistant</SectionTitle>
      <div className="mb-3 text-[0.6875rem] text-[#8A857C] leading-relaxed">{config.noPhiNote}</div>
      <SectionTabs sections={sections} ariaLabel={`${config.brand} assistant sections`} idBase={`office-${config.id}`} defaultId="today" />
    </div>
  );
}

// ---------------------------------------------------------------------------
function TodaySection({ config, store, report, todayCat, dueList, goal, schedule }) {
  // The CEO-meeting time reads from the SAME editable schedule (first block), so
  // adjusting the schedule updates this header too — "update the spaces that need
  // that" (Darrell). Falls back to config only if the schedule is empty.
  const firstBlock = (schedule && schedule[0]) || config.dayBlocks[0];
  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 mb-3">
        <MetricCell label="Contacts today" value={num(report.contactsAdded)} sub={`target ${config.dailyTargetContacts}`} accent={report.metTarget} />
        <MetricCell label="Emails today" value={num(report.emailsSent)} />
        <MetricCell label="Calls today" value={num(report.callsMade)} />
        <MetricCell label="Follow-ups due" value={num(report.followUpsNeeded)} />
      </div>

      {todayCat && (
        <div className="border border-[#5A6E3D] bg-[#F0F4EA] p-3 mb-3">
          <div className="text-sm font-semibold text-[#3F5226] mb-1">Today’s focus: {todayCat.label}</div>
          <div className="text-xs text-[#5A5751] leading-relaxed">Research {todayCat.label.toLowerCase()} referral sources. Try: {(todayCat.searches || []).slice(0, 2).map((s) => `“${s}”`).join(', ')}. Goal: {config.dailyTargetContacts} new contacts.</div>
        </div>
      )}

      {(config.ceoMeetingQuestions || []).length > 0 && (
        <div className="border border-[#E8E4DC] bg-white p-3 mb-3">
          <div className="text-sm font-semibold text-[#1A1815] mb-1.5">The daily CEO meeting{firstBlock ? ` (${firstBlock.time})` : ''}</div>
          <ul className="text-xs text-[#5A5751] leading-relaxed list-disc pl-4 space-y-0.5">
            {config.ceoMeetingQuestions.map((q) => <li key={q}>{q}</li>)}
          </ul>
        </div>
      )}

      <ScheduleCard store={store} schedule={schedule} />

      <div className="border border-[#E8E4DC] bg-[#FAF8F4] p-3">
        <div className="text-sm font-semibold text-[#1A1815] mb-1">Daily report</div>
        <div className="text-xs text-[#5A5751] leading-relaxed">
          Contacts added <b>{num(report.contactsAdded)}</b> · Emails <b>{num(report.emailsSent)}</b> · Calls <b>{num(report.callsMade)}</b> · Follow-ups needed <b>{num(report.followUpsNeeded)}</b> · Social posts <b>{num(report.postsCreated)}</b>. Network so far: <b>{num(goal.total)}</b> of {num(goal.low)}–{num(config.networkGoal.high)} ({pct(goal.pct)}). {dueList.length > 0 ? `${dueList.length} follow-up(s) waiting.` : 'No follow-ups overdue.'}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The editable daily schedule ("the afternoon"). View mode reads the real,
// persisted blocks; Edit mode lets staff adjust the time + task + detail, add or
// remove blocks, or reset to the office default. Every change persists to the
// store and the CEO-meeting header above re-reads block[0] automatically.
function ScheduleCard({ store, schedule }) {
  const [editing, setEditing] = useState(false);
  const blocks = schedule || [];
  return (
    <div className="border border-[#E8E4DC] bg-white p-3 mb-3">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="text-sm font-semibold text-[#1A1815]">The afternoon</div>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="text-[0.625rem] uppercase tracking-wider px-2 py-1 border border-[#C9C2B4] text-[#5A5751] hover:border-[#B85838] hover:text-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]"
        >
          {editing ? 'Done' : 'Edit schedule'}
        </button>
      </div>

      {!editing ? (
        blocks.length > 0 ? (
          <div className="grid grid-cols-1 gap-1">
            {blocks.map((b) => (
              <div key={b.id} className="flex gap-2 text-xs">
                <span className="text-[#8A857C] font-mono shrink-0 w-24">{b.time}</span>
                <span><span className="font-semibold text-[#1A1815]">{b.name}.</span> <span className="text-[#5A5751]">{b.detail}</span></span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-[#8A857C]">No blocks yet. Tap <b>Edit schedule</b> to add work times.</div>
        )
      ) : (
        <div className="space-y-2">
          {blocks.map((b) => (
            <div key={b.id} className="border border-[#E8E4DC] bg-[#FAF8F4] p-2 space-y-1.5">
              <div className="flex gap-1.5 items-center">
                <input
                  aria-label="Time"
                  value={b.time}
                  onChange={(e) => store.updateBlock(b.id, { time: e.target.value })}
                  placeholder="12:00–12:20"
                  className="w-28 shrink-0 border border-[#C9C2B4] bg-white px-1.5 py-1 text-xs font-mono focus:outline focus:outline-2 focus:outline-[#B85838]"
                />
                <input
                  aria-label="Task"
                  value={b.name}
                  onChange={(e) => store.updateBlock(b.id, { name: e.target.value })}
                  placeholder="Task"
                  className="flex-1 border border-[#C9C2B4] bg-white px-1.5 py-1 text-xs font-semibold focus:outline focus:outline-2 focus:outline-[#B85838]"
                />
                <button
                  type="button"
                  aria-label={`Remove ${b.name || 'block'}`}
                  onClick={() => store.removeBlock(b.id)}
                  className="shrink-0 px-2 py-1 border border-[#C9C2B4] text-[#B85838] hover:bg-[#B85838] hover:text-white text-xs focus:outline focus:outline-2 focus:outline-[#B85838]"
                >
                  Remove
                </button>
              </div>
              <textarea
                aria-label="Detail"
                value={b.detail}
                onChange={(e) => store.updateBlock(b.id, { detail: e.target.value })}
                placeholder="What happens in this block"
                rows={2}
                className="w-full border border-[#C9C2B4] bg-white px-1.5 py-1 text-xs text-[#5A5751] focus:outline focus:outline-2 focus:outline-[#B85838]"
              />
            </div>
          ))}
          <div className="flex flex-wrap gap-2 pt-0.5">
            <button
              type="button"
              onClick={() => store.addBlock({ time: '', name: '', detail: '' })}
              className="text-[0.625rem] uppercase tracking-wider px-2.5 py-1.5 border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]"
            >
              + Add a block
            </button>
            <button
              type="button"
              onClick={() => { if (typeof window === 'undefined' || window.confirm('Reset the schedule to the office default?')) store.resetSchedule(); }}
              className="text-[0.625rem] uppercase tracking-wider px-2.5 py-1.5 border border-[#C9C2B4] text-[#5A5751] hover:border-[#B85838] hover:text-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]"
            >
              Reset to default
            </button>
          </div>
          <div className="text-[0.625rem] text-[#8A857C] leading-relaxed pt-0.5">Changes save automatically to this device and update the CEO-meeting time above.</div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
function ReferralSection({ config, model, store, isGovernor, orgs, stats, goal, converting }) {
  const [catFilter, setCatFilter] = useState('all');
  const [circleFilter, setCircleFilter] = useState('all');
  const filtered = useMemo(() => orgs.filter((o) =>
    (catFilter === 'all' || o.categoryId === catFilter) &&
    (circleFilter === 'all' || o.circle === circleFilter)), [orgs, catFilter, circleFilter]);

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 mb-3">
        <MetricCell label="Organizations" value={num(stats.total)} sub={`${pct(goal.pct)} to ${num(goal.low)}`} accent />
        <MetricCell label="Flyers sent" value={num(stats.flyersSent)} />
        <MetricCell label="Warm / interested" value={num(stats.interested)} />
        <MetricCell label="Clients referred in" value={num(converting.totalReferred)} sub="inbound attribution" />
      </div>

      <div className="border border-[#E8E4DC] bg-[#FAF8F4] p-3 mb-3">
        <div className="text-[0.625rem] uppercase tracking-wide text-[#5A5751] mb-1">Build in circles — finish {config.geoCircles[0] ? config.geoCircles[0].name : 'the inner ring'} first</div>
        <div className="flex flex-wrap gap-1">
          {config.geoCircles.map((c) => (
            <Badge key={c.id} cls={(stats.byCircle[c.name] || 0) > 0 ? 'bg-[#F0F4EA] text-[#3F5226] border-[#5A6E3D]' : 'bg-[#FAF8F4] text-[#8A857C] border-[#C9C2B4]'}>{c.name} {stats.byCircle[c.name] ? `· ${stats.byCircle[c.name]}` : ''}</Badge>
          ))}
        </div>
      </div>

      {isGovernor && <AddOrgForm config={config} model={model} store={store} />}

      <div className="mt-3 flex flex-wrap items-center gap-2 mb-2">
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="border border-[#C9C2B4] bg-white px-2 py-1 text-sm" aria-label="Filter by category">
          <option value="all">All categories</option>
          {config.referralCategories.map((c) => <option key={c.id} value={c.id}>{c.label} ({stats.byCategory[c.id] || 0})</option>)}
        </select>
        <select value={circleFilter} onChange={(e) => setCircleFilter(e.target.value)} className="border border-[#C9C2B4] bg-white px-2 py-1 text-sm" aria-label="Filter by area">
          <option value="all">All areas</option>
          {config.geoCircles.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
        <span className="text-[0.6875rem] text-[#8A857C]">{filtered.length} shown</span>
      </div>

      <div className="space-y-1">
        {filtered.length === 0 && <div className="border border-[#E8E4DC] bg-[#FAF8F4] p-4 text-sm text-[#5A5751]">No organizations yet. Add the first referral source above.</div>}
        {filtered.map((o) => <OrgRow key={o.id} config={config} model={model} store={store} isGovernor={isGovernor} org={o} />)}
      </div>
    </div>
  );
}

function OrgRow({ config, model, store, isGovernor, org }) {
  const cat = model.referralCategory(org.categoryId);
  const out = model.outcome(org.outcomeId);
  const [note, setNote] = useState(org.notes || '');
  return (
    <div className="border border-[#E8E4DC] bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-[#1A1815]">{org.organization}</div>
          <div className="text-[0.6875rem] text-[#8A857C]">{cat ? cat.label : ''}{org.type ? ` · ${org.type}` : ''} · {org.circle}{org.contactPerson ? ` · ${org.contactPerson}${org.jobTitle ? ` (${org.jobTitle})` : ''}` : ''}</div>
        </div>
        <Badge cls={outcomeBadgeClass(out)}>{out.label}</Badge>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.6875rem] text-[#5A5751]">
        {org.email && <span className="inline-flex items-center gap-1"><UiIcon name="mail" /> {org.email}</span>}
        {org.phone && <span className="inline-flex items-center gap-1"><UiIcon name="phone" /> {org.phone}</span>}
        {org.flyerSent && <Badge cls="bg-[#F0F4EA] text-[#3F5226] border-[#5A6E3D]">Flyer sent</Badge>}
        {org.emailedOn && <span>emailed {shortDate(org.emailedOn)}</span>}
        {org.calledOn && <span>called {shortDate(org.calledOn)}</span>}
        {org.followUpOn && <span>follow-up {shortDate(org.followUpOn)}</span>}
        {org.clientsReferred > 0 && <Badge cls="bg-[#F0F4EA] text-[#3F5226] border-[#5A6E3D]">{org.clientsReferred} referred in</Badge>}
      </div>
      {isGovernor && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <button type="button" onClick={() => store.recordEmail(org.id)} className="border border-[#C9C2B4] bg-white text-[#5A5751] px-2 py-0.5 text-[0.6875rem]">Log email</button>
          <button type="button" onClick={() => store.recordCall(org.id)} className="border border-[#C9C2B4] bg-white text-[#5A5751] px-2 py-0.5 text-[0.6875rem]">Log call</button>
          {!org.flyerSent && <button type="button" onClick={() => store.markFlyerSent(org.id)} className="border border-[#C9C2B4] bg-white text-[#5A5751] px-2 py-0.5 text-[0.6875rem]">Flyer sent</button>}
          <select value={org.outcomeId} onChange={(e) => store.setOrgOutcome(org.id, e.target.value)} className="border border-[#C9C2B4] bg-white px-1.5 py-0.5 text-[0.6875rem]" aria-label={`Outcome for ${org.organization}`}>
            {config.outcomes.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
          <input type="date" onChange={(e) => store.setFollowUp(org.id, e.target.value ? new Date(e.target.value).toISOString() : null)} className="border border-[#C9C2B4] bg-white px-1.5 py-0.5 text-[0.6875rem]" aria-label={`Follow-up date for ${org.organization}`} />
        </div>
      )}
      {/* Notes — clarify anything about this source: verified the office, who you
          spoke to, best time to reach them, the next step. Governor edits inline
          (saves on blur); everyone else reads. Persists via the real record. */}
      {isGovernor ? (
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={() => { if ((note || '') !== (org.notes || '')) store.updateOrg(org.id, { notes: note }); }}
          placeholder="Notes — anything to clarify (verified the office? who you spoke to? best time? next step?)"
          rows={2}
          aria-label={`Notes for ${org.organization}`}
          className="mt-2 w-full border border-[#C9C2B4] bg-[#FAF8F4] px-2 py-1 text-[0.6875rem] text-[#5A5751]"
        />
      ) : org.notes ? (
        <div className="mt-2 text-[0.6875rem] text-[#5A5751] leading-relaxed"><span className="font-semibold text-[#1A1815]">Notes:</span> {org.notes}</div>
      ) : null}
    </div>
  );
}

function AddOrgForm({ config, model, store }) {
  const firstCat = config.referralCategories[0] ? config.referralCategories[0].id : '';
  const firstCircle = config.geoCircles[0] ? config.geoCircles[0].name : '';
  const [f, setF] = useState({ organization: '', categoryId: firstCat, type: '', circle: firstCircle, contactPerson: '', jobTitle: '', email: '', phone: '', website: '', notes: '' });
  const [error, setError] = useState('');
  const cat = model.referralCategory(f.categoryId);
  const set = (k) => (e) => setF((cur) => ({ ...cur, [k]: e.target.value }));

  const onAdd = () => {
    const check = model.validateOrg(f);
    if (!check.ok) { setError(check.error); return; }
    store.addOrg(f);
    setF((cur) => ({ ...cur, organization: '', type: '', contactPerson: '', jobTitle: '', email: '', phone: '', website: '', notes: '' }));
    setError('');
  };

  return (
    <div className="border border-[#E8E4DC] bg-[#FAF8F4] p-3">
      <div className="text-sm font-semibold text-[#1A1815] mb-2">Add a referral source</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input value={f.organization} onChange={set('organization')} placeholder="Organization" className="border border-[#C9C2B4] bg-white px-2 py-1 text-sm sm:col-span-2" aria-label="Organization" />
        <select value={f.categoryId} onChange={set('categoryId')} className="border border-[#C9C2B4] bg-white px-2 py-1 text-sm" aria-label="Category">
          {config.referralCategories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <select value={f.type} onChange={set('type')} className="border border-[#C9C2B4] bg-white px-2 py-1 text-sm" aria-label="Type">
          <option value="">Type…</option>
          {(cat ? (cat.types || []) : []).map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={f.circle} onChange={set('circle')} className="border border-[#C9C2B4] bg-white px-2 py-1 text-sm" aria-label="Area">
          {config.geoCircles.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
        <input value={f.contactPerson} onChange={set('contactPerson')} placeholder="Contact person" className="border border-[#C9C2B4] bg-white px-2 py-1 text-sm" aria-label="Contact person" />
        <input value={f.jobTitle} onChange={set('jobTitle')} placeholder="Job title" className="border border-[#C9C2B4] bg-white px-2 py-1 text-sm" aria-label="Job title" />
        <input value={f.email} onChange={set('email')} placeholder="Email" className="border border-[#C9C2B4] bg-white px-2 py-1 text-sm" aria-label="Email" />
        <input value={f.phone} onChange={set('phone')} placeholder="Phone" className="border border-[#C9C2B4] bg-white px-2 py-1 text-sm" aria-label="Phone" />
        <input value={f.website} onChange={set('website')} placeholder="Website" className="border border-[#C9C2B4] bg-white px-2 py-1 text-sm sm:col-span-2" aria-label="Website" />
        <textarea value={f.notes} onChange={set('notes')} placeholder="Notes — verify this is the right office, who you spoke to, best time to reach them, anything to clarify" rows={2} className="border border-[#C9C2B4] bg-white px-2 py-1 text-sm sm:col-span-2" aria-label="Notes" />
      </div>
      {cat && (cat.searches || []).length > 0 && <div className="mt-1.5 text-[0.625rem] text-[#8A857C]">Search ideas: {cat.searches.map((s) => `“${s}”`).join(' · ')}</div>}
      {error && <div className="mt-1.5 text-xs text-[#7A1F1F]">{error}</div>}
      <button type="button" onClick={onAdd} className="mt-2 border border-[#5A6E3D] bg-[#F0F4EA] text-[#3F5226] px-3 py-1.5 text-sm font-semibold">Add organization</button>
    </div>
  );
}

// ---------------------------------------------------------------------------
function OutreachSection({ config, store, dueList }) {
  return (
    <div>
      <div className="border border-[#E8E4DC] bg-white p-3 mb-3">
        <div className="text-sm font-semibold text-[#1A1815] mb-1">Follow-ups due ({dueList.length})</div>
        {dueList.length === 0 && <div className="text-xs text-[#5A5751]">Nothing overdue — nice.</div>}
        <div className="space-y-1">
          {dueList.map((o) => (
            <div key={o.id} className="flex items-center justify-between gap-2 text-xs">
              <span className="text-[#1A1815]">{o.organization}</span>
              <span className="flex items-center gap-1.5">
                <span className="text-[#8A857C]">{shortDate(o.followUpOn)}</span>
                <button type="button" onClick={() => store.recordCall(o.id)} className="border border-[#C9C2B4] bg-white text-[#5A5751] px-2 py-0.5 text-[0.6875rem]">Log call</button>
              </span>
            </div>
          ))}
        </div>
      </div>

      {config.emailTemplate && <ScriptCard title="Email template" text={config.emailTemplate} />}
      {config.callScript && <ScriptCard title="Phone script" text={config.callScript} />}
    </div>
  );
}

function ScriptCard({ title, text }) {
  const [copied, setCopied] = useState(false);
  const onCopy = () => {
    try { if (navigator.clipboard) { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } } catch { /* clipboard unavailable */ }
  };
  return (
    <div className="border border-[#E8E4DC] bg-[#FAF8F4] p-3 mb-2">
      <div className="flex items-center justify-between mb-1">
        <div className="text-sm font-semibold text-[#1A1815]">{title}</div>
        <button type="button" onClick={onCopy} className="border border-[#C9C2B4] bg-white text-[#5A5751] px-2 py-0.5 text-[0.6875rem]">{copied ? 'Copied' : 'Copy'}</button>
      </div>
      <pre className="text-[0.6875rem] text-[#5A5751] whitespace-pre-wrap leading-relaxed font-sans">{text}</pre>
      <div className="mt-1 text-[0.625rem] text-[#8A857C]">Change [Name] and [Your name], attach the flyer, then record it on the organization.</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
function ContentSection({ config, store, isGovernor, posts, ideas }) {
  return (
    <div>
      <div className="border border-[#E8E4DC] bg-white p-3 mb-3">
        <div className="text-sm font-semibold text-[#1A1815] mb-1.5">Weekly themes</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
          {config.contentThemes.map((t) => (
            <div key={t.day} className="text-xs"><span className="font-semibold text-[#1A1815]">{t.day}:</span> <span className="text-[#5A5751]">{t.theme}</span></div>
          ))}
        </div>
      </div>

      {isGovernor && <AddPostForm config={config} store={store} />}

      <div className="mt-3 space-y-1">
        {posts.length === 0 && <div className="border border-[#E8E4DC] bg-[#FAF8F4] p-4 text-sm text-[#5A5751]">No posts yet.</div>}
        {posts.map((p) => (
          <div key={p.id} className="border border-[#E8E4DC] bg-white p-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-[#1A1815]">{p.theme || 'Post'}{p.isReel ? ' · Reel' : ''}</span>
              <span className="flex items-center gap-1.5">
                <Badge cls={p.status === 'posted' ? 'bg-[#F0F4EA] text-[#3F5226] border-[#5A6E3D]' : 'bg-[#FAF8F4] text-[#8A857C] border-[#C9C2B4]'}>{p.status}</Badge>
                {isGovernor && !isSeedId(p.id) && p.status !== 'posted' && (
                  <select value={p.status} onChange={(e) => store.updatePost(p.id, { status: e.target.value })} className="border border-[#C9C2B4] bg-white px-1.5 py-0.5 text-[0.6875rem]" aria-label="Post status">
                    {config.postStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                )}
              </span>
            </div>
            {p.caption && <div className="text-xs text-[#5A5751] mt-1 leading-relaxed">{p.caption}</div>}
            <div className="text-[0.625rem] text-[#8A857C] mt-1">{(p.platforms || []).join(' · ')}{p.hashtags ? ` · ${p.hashtags}` : ''}</div>
          </div>
        ))}
      </div>

      <IdeasFolder store={store} ideas={ideas} isGovernor={isGovernor} />
    </div>
  );
}

function AddPostForm({ config, store }) {
  const [theme, setTheme] = useState(config.contentThemes[0] ? config.contentThemes[0].theme : '');
  const [caption, setCaption] = useState('');
  const [platforms, setPlatforms] = useState([]);
  const [hashtags, setHashtags] = useState('');
  const [isReel, setIsReel] = useState(false);
  const toggle = (p) => setPlatforms((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));
  const onAdd = () => {
    if (!caption.trim() && !theme) return;
    store.addPost({ theme, caption: caption.trim(), platforms, hashtags: hashtags.trim(), isReel, status: 'drafted' });
    setCaption(''); setHashtags(''); setPlatforms([]); setIsReel(false);
  };
  return (
    <div className="border border-[#E8E4DC] bg-[#FAF8F4] p-3">
      <div className="text-sm font-semibold text-[#1A1815] mb-2">New post</div>
      <div className="grid grid-cols-1 gap-2">
        <select value={theme} onChange={(e) => setTheme(e.target.value)} className="border border-[#C9C2B4] bg-white px-2 py-1 text-sm" aria-label="Theme">
          {config.contentThemes.map((t) => <option key={t.day} value={t.theme}>{t.day} — {t.theme}</option>)}
        </select>
        <textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Caption" rows={2} className="border border-[#C9C2B4] bg-white px-2 py-1 text-sm" aria-label="Caption" />
        <input value={hashtags} onChange={(e) => setHashtags(e.target.value)} placeholder="#hashtags" className="border border-[#C9C2B4] bg-white px-2 py-1 text-sm" aria-label="Hashtags" />
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {config.socialPlatforms.map((p) => (
            <button type="button" key={p} onClick={() => toggle(p)} className={`border px-2 py-0.5 ${platforms.includes(p) ? 'border-[#5A6E3D] bg-[#F0F4EA] text-[#3F5226]' : 'border-[#C9C2B4] bg-white text-[#5A5751]'}`}>{p}</button>
          ))}
          <label className="flex items-center gap-1 text-[#5A5751]"><input type="checkbox" checked={isReel} onChange={(e) => setIsReel(e.target.checked)} /> Reel</label>
        </div>
      </div>
      <button type="button" onClick={onAdd} className="mt-2 border border-[#5A6E3D] bg-[#F0F4EA] text-[#3F5226] px-3 py-1.5 text-sm font-semibold">Add post</button>
    </div>
  );
}

function IdeasFolder({ store, ideas, isGovernor }) {
  const [text, setText] = useState('');
  return (
    <div className="mt-3 border border-[#E8E4DC] bg-white p-3">
      <div className="text-sm font-semibold text-[#1A1815] mb-1.5">Social media ideas</div>
      {isGovernor && (
        <div className="flex items-center gap-2 mb-2">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Save an idea…" className="border border-[#C9C2B4] bg-white px-2 py-1 text-sm flex-1" aria-label="Idea" />
          <button type="button" onClick={() => { if (text.trim()) { store.addIdea(text.trim()); setText(''); } }} className="border border-[#5A6E3D] bg-[#F0F4EA] text-[#3F5226] px-2.5 py-1 text-xs font-semibold">Save</button>
        </div>
      )}
      {ideas.length === 0 ? <div className="text-xs text-[#8A857C]">No saved ideas yet.</div> : (
        <ul className="text-xs text-[#5A5751] list-disc pl-4 space-y-0.5">{ideas.map((i) => <li key={i.id}>{i.text}</li>)}</ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
function GoalsSection({ config, week }) {
  const rows = [
    ['New contacts', week.contacts], ['Outreach emails', week.emails], ['Follow-up calls', week.calls],
    ['Social posts', week.posts], ['Reels', week.reels],
  ];
  return (
    <div>
      <div className="border border-[#E8E4DC] bg-white p-3 mb-3">
        <div className="text-sm font-semibold text-[#1A1815] mb-2">This week vs goal</div>
        <div className="space-y-2">
          {rows.map(([label, r]) => (
            <div key={label}>
              <div className="flex items-center justify-between text-xs mb-0.5">
                <span className="text-[#1A1815]">{label}</span>
                <span className="text-[#5A5751]">{num(r.n)} / {num(r.min)}{r.max !== r.min ? `–${num(r.max)}` : ''}</span>
              </div>
              <Bar pct={r.pct} good={r.n >= r.min} />
            </div>
          ))}
        </div>
      </div>

      {(config.weeklyPlan || []).length > 0 && (
        <div className="border border-[#E8E4DC] bg-[#FAF8F4] p-3">
          <div className="text-sm font-semibold text-[#1A1815] mb-1.5">The week’s shape</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {config.weeklyPlan.map((d) => (
              <div key={d.day} className="text-xs">
                <span className="font-semibold text-[#1A1815]">{d.day}:</span> <span className="text-[#5A5751]">{(d.focus || []).join(' · ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
function AriSection({ config, model, converting }) {
  return (
    <div>
      {config.ariAutomationNote && (
        <div className="border border-[#3F6098] bg-[#FAF8F4] p-3 mb-3">
          <div className="flex items-center gap-1.5 text-[#1A1815] mb-1"><UiIcon name="sparkle" /><span className="text-sm font-semibold">Toward Ari doing this 24/7</span></div>
          <div className="text-xs text-[#5A5751] leading-relaxed">{config.ariAutomationNote}</div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mb-3">
        {(config.ariAutomationPath || []).map((s) => (
          <div key={s.stage} className={`border p-2.5 ${s.built ? 'border-[#5A6E3D] bg-[#F0F4EA]' : 'border-[#E8E4DC] bg-white'}`}>
            <div className="flex items-center gap-1.5">
              <Badge cls={s.built ? 'bg-[#F0F4EA] text-[#3F5226] border-[#5A6E3D]' : 'bg-[#FAF8F4] text-[#8A857C] border-[#C9C2B4]'}>Stage {s.stage}{s.built ? ' · built' : ''}</Badge>
              <span className="text-xs font-semibold text-[#1A1815]">{s.name}</span>
            </div>
            <div className="text-[0.6875rem] text-[#5A5751] mt-1 leading-relaxed">{s.detail}</div>
          </div>
        ))}
      </div>

      <div className="border border-[#E8E4DC] bg-white p-3 mb-3">
        <div className="text-sm font-semibold text-[#1A1815] mb-1.5">What actually converts (inbound → outbound)</div>
        {converting.totalReferred === 0 ? (
          <div className="text-xs text-[#5A5751]">No inbound attributions yet. As inquiries record how they found {config.brand}, the sources that produce clients rise here.</div>
        ) : (
          <div className="space-y-1">
            {converting.sources.map((o) => (
              <div key={o.id} className="flex items-center justify-between text-xs">
                <span className="text-[#1A1815]">{o.organization} <span className="text-[#8A857C]">· {(model.referralCategory(o.categoryId) || {}).label}</span></span>
                <Badge cls="bg-[#F0F4EA] text-[#3F5226] border-[#5A6E3D]">{o.clientsReferred} referred</Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {(config.outboundConstraints || []).length > 0 && (
        <div className="border border-[#E8E4DC] bg-[#FAF8F4] p-3">
          <div className="text-sm font-semibold text-[#1A1815] mb-1.5">The real constraints</div>
          <div className="space-y-1">
            {config.outboundConstraints.map((c) => (
              <div key={c.id} className="text-[0.6875rem] leading-relaxed"><span className="font-semibold text-[#1A1815]">{c.label}:</span> <span className="text-[#5A5751]">{c.detail}</span></div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
