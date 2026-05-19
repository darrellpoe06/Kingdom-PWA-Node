// Projects · ProjectsWrapper · ProjectConversationLog · DateField —
// extracted from monolith (r34) per MODULAR-EXTENSIBILITY.md. Includes
// PROJECT_DOMAINS + PROJECT_STATUSES constants. Inline edit per row
// shipped r20; this is the structural extraction.
import React, { useState, useMemo } from 'react';
import { MetricCell, SectionTitle } from './shared.jsx';

const fmt = (n) => n == null || !isFinite(n) ? '—' : `${n < 0 ? '-' : ''}$${Math.abs(Math.round(n)).toLocaleString()}`;
const fmtCompact = (n) => { if (n == null || !isFinite(n)) return '—'; const a = Math.abs(n); const sign = n < 0 ? '-' : ''; if (a >= 1000000000) return `${sign}$${(a/1000000000).toFixed(2)}B`; if (a >= 1000000) return `${sign}$${(a/1000000).toFixed(1)}M`; if (a >= 1000) return `${sign}$${Math.round(a/1000)}k`; return `${sign}$${Math.round(a)}`; };

const PROJECT_DOMAINS = [
  { key: 'personal', label: 'Personal', color: '#5A6E3D' },
  { key: 'family', label: 'Family', color: '#B85838' },
  { key: 'friends', label: 'Friends · Community', color: '#8B6F47' },
  { key: 'church', label: 'Church · Ministry', color: '#7A5A8E' },
  { key: 'business-poetech', label: 'PoeTech', color: '#1A1815' },
  { key: 'business-poeprops', label: 'Poe Properties', color: '#5A4A2E' },
  { key: 'business-tlc', label: 'TLC Therapy', color: '#3E6E78' },
  { key: 'business-uiuc', label: 'UIUC · Day Job', color: '#4A4A4A' },
  { key: 'tech', label: 'Tech · Repair · Build', color: '#2A5A8E' },
  { key: 'other', label: 'Other', color: '#5A5751' },
];
const PROJECT_STATUSES = ['planning', 'active', 'ending-soon', 'complete', 'on-hold', 'tbd'];

function ProjectsWrapper({ projects, scopes, entities, contractors = [], addProject, updateProject, deleteProject, addScope, deleteScope, capexItems = [], addCapexItem, updateCapexItem, deleteCapexItem, netCashFlow = 0, rentals = [], accounts = [] }) {
  const [subView, setSubView] = useState('list');
  return (
    <div className="space-y-4">
      <div className="border-b border-[#E8E4DC]">
        <div className="flex gap-1 text-xs">
          {[['list','Projects · Timeline'],['scopes','Scopes · Agreements'],['inventory','Inventory · Capital Forecast']].map(([id, label]) => (
            <button key={id} onClick={() => setSubView(id)} className={`px-3 py-2 whitespace-nowrap border-b-2 transition-colors focus:outline focus:outline-2 focus:outline-[#B85838] ${subView === id ? 'border-[#B85838] text-[#1A1815] font-medium' : 'border-transparent text-[#5A5751] hover:text-[#1A1815]'}`}>{label}</button>
          ))}
        </div>
      </div>
      {subView === 'list' && (
        <>
          <Projects projects={projects} entities={entities} contractors={contractors} addProject={addProject} updateProject={updateProject} deleteProject={deleteProject} />
          {/* v28+ MVP v1.5 round 3 — Inventory + forecast also appears at the
              bottom of the Projects list so the connection is obvious. The
              dedicated Inventory sub-tab is where the editing/adding lives. */}
          <ProjectInventory projects={projects} entities={entities} capexItems={capexItems} addCapexItem={addCapexItem} updateCapexItem={updateCapexItem} deleteCapexItem={deleteCapexItem} netCashFlow={netCashFlow} rentals={rentals} accounts={accounts} compact />
        </>
      )}
      {subView === 'scopes' && <Scope scopes={scopes} projects={projects} entities={entities} addScope={addScope} deleteScope={deleteScope} />}
      {subView === 'inventory' && <ProjectInventory projects={projects} entities={entities} capexItems={capexItems} addCapexItem={addCapexItem} updateCapexItem={updateCapexItem} deleteCapexItem={deleteCapexItem} netCashFlow={netCashFlow} rentals={rentals} accounts={accounts} />}
    </div>
  );
}

// ProjectConversationLog — per-project conversation thread (mirrors the
// pattern used on property records and Practice inquiries). State lives
// inside the component so each project keeps its own form / open-toggle.
function ProjectConversationLog({ project, updateProject }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0,10), person: '', summary: '', notes: '' });
  const blank = () => ({ date: new Date().toISOString().slice(0,10), person: '', summary: '', notes: '' });
  const addNote = () => {
    if (!form.summary) { alert('Summary is required.'); return; }
    const entry = { ...form, id: `cv-${Date.now()}` };
    updateProject(project.id, { conversationLog: [...(project.conversationLog || []), entry] });
    setForm(blank()); setShowForm(false);
  };
  const deleteNote = (entryId) => {
    if (!confirm('Delete this conversation note?')) return;
    updateProject(project.id, { conversationLog: (project.conversationLog || []).filter(e => e.id !== entryId) });
  };
  const log = project.conversationLog || [];
  return (
    <div className="mt-3 pt-2 border-t border-[#E8E4DC]">
      <div className="flex items-baseline justify-between gap-2 mb-1.5">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold">💬 Conversations · {log.length}</div>
        <button type="button" onClick={(e) => { e.preventDefault(); setShowForm(!showForm); setForm(blank()); }} className="text-xs uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] hover:bg-[#FAF8F4] border border-transparent hover:border-[#B85838] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">{showForm ? '× Cancel' : '+ Log a touchpoint'}</button>
      </div>
      {showForm && (
        <div className="bg-white border border-[#B85838] p-2 mb-2 space-y-1.5">
          <div className="grid grid-cols-2 gap-1.5">
            <input type="date" className="p-1.5 border border-[#E8E4DC] text-xs bg-[#FAF8F4]" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            <input className="p-1.5 border border-[#E8E4DC] text-xs bg-[#FAF8F4]" placeholder="Who: client / contractor / stakeholder" value={form.person} onChange={e => setForm({ ...form, person: e.target.value })} />
          </div>
          <input className="w-full p-1.5 border border-[#E8E4DC] text-xs bg-[#FAF8F4]" placeholder="Summary (required) — e.g., 'kickoff call, requirements confirmed'" value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} />
          <textarea className="w-full p-1.5 border border-[#E8E4DC] text-xs bg-[#FAF8F4]" rows="2" placeholder="Notes · decisions · next step · who owns what" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          <button type="button" onClick={addNote} className="w-full bg-[#1A1815] text-white py-1.5 text-[10px] uppercase tracking-wider font-semibold hover:bg-[#B85838]">Save Note</button>
        </div>
      )}
      {log.length === 0 && !showForm ? (
        <p className="text-[10px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No conversation notes yet.</p>
      ) : (
        <div className="space-y-1">
          {[...log].sort((a, b) => b.date.localeCompare(a.date)).map(e => (
            <div key={e.id} className="bg-[#FAF8F4] border border-[#E8E4DC] p-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-[10px]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{e.date}{e.person ? ` · ${e.person}` : ''}</div>
                  <div className="text-xs mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{e.summary}</div>
                  {e.notes && <div className="text-[10px] text-[#5A5751] italic mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{e.notes}</div>}
                </div>
                <button type="button" onClick={() => deleteNote(e.id)} aria-label="Delete" className="text-sm text-[#5A5751] hover:text-[#B85838] hover:bg-[#FAF8F4] border border-transparent hover:border-[#B85838] px-3 py-1.5 min-h-[36px] min-w-[36px] shrink-0 focus:outline focus:outline-2 focus:outline-[#B85838]">×</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Projects({ projects, entities, contractors = [], addProject, updateProject, deleteProject }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterDomain, setFilterDomain] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [projError, setProjError] = useState('');
  const [openConvId, setOpenConvId] = useState(null);
  const [newProject, setNewProject] = useState({
    title: '', startDate: '', endDate: '', status: 'planning',
    domain: 'personal', description: '', hoursPerWeek: 0, entityId: 'e-personal',
    contractorIds: []
  });

  const submitProject = () => {
    if (!newProject.title || !newProject.startDate) {
      setProjError('Title and start date are required.');
      return;
    }
    setProjError('');
    if (editingId) {
      updateProject(editingId, newProject);
      setEditingId(null);
    } else {
      addProject(newProject);
    }
    setNewProject({ title: '', startDate: '', endDate: '', status: 'planning', domain: 'personal', description: '', hoursPerWeek: 0, entityId: 'e-personal', contractorIds: [] });
    setShowForm(false);
  };

  const startEdit = (p) => {
    setNewProject({
      title: p.title, startDate: p.startDate, endDate: p.endDate || '',
      status: p.status, domain: p.domain, description: p.description || '',
      hoursPerWeek: p.hoursPerWeek || 0, entityId: p.entityId || 'e-personal',
      contractorIds: Array.isArray(p.contractorIds) ? p.contractorIds : []
    });
    setEditingId(p.id);
    setShowForm(false);
    setProjError('');
    // r19 — Inline edit per IN-PLACE-FIRST.md. The top "Add new" form stays
    // closed during edit; the same form mounts inline under the edited row.
    // Real Estate Quick-Edit pattern (shipped r7) — eyes stay where you tapped.
  };
  const cancelEdit = () => { setEditingId(null); setProjError(''); setNewProject({ title: '', startDate: '', endDate: '', status: 'planning', domain: 'personal', description: '', hoursPerWeek: 0, entityId: 'e-personal', contractorIds: [] }); };

  // Filter and sort
  const filtered = projects.filter(p => {
    if (filterDomain !== 'all' && p.domain !== filterDomain) return false;
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    return true;
  }).sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

  // Compute timeline range
  const now = new Date();
  const visibleProjects = filtered.filter(p => p.status !== 'complete');
  let earliestDate = now;
  let latestDate = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
  visibleProjects.forEach(p => {
    const s = new Date(p.startDate);
    const e = p.endDate ? new Date(p.endDate) : new Date(s.getFullYear(), s.getMonth() + 3, s.getDate());
    if (s < earliestDate) earliestDate = s;
    if (e > latestDate) latestDate = e;
  });
  const rangeStart = new Date(Math.min(earliestDate.getTime(), now.getTime() - 30*24*60*60000));
  const rangeEnd = new Date(latestDate.getTime() + 30*24*60*60000);
  const totalDays = Math.max(1, (rangeEnd - rangeStart) / (1000 * 60 * 60 * 24));

  // Workload calculation — sum of active project hours/week by month
  const monthlyWorkload = useMemo(() => {
    const months = {};
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
      months[key] = { label: MONTHS_ABBR[d.getMonth()] + " '" + String(d.getFullYear()).slice(2), hours: 0, projects: [] };
    }
    projects.filter(p => p.status === 'active' || p.status === 'ending-soon').forEach(p => {
      const s = new Date(p.startDate);
      const e = p.endDate ? new Date(p.endDate) : new Date(s.getFullYear() + 1, s.getMonth(), s.getDate());
      Object.keys(months).forEach(key => {
        const [y, m] = key.split('-').map(Number);
        const monthStart = new Date(y, m, 1);
        const monthEnd = new Date(y, m + 1, 0);
        if (e >= monthStart && s <= monthEnd) {
          months[key].hours += (p.hoursPerWeek || 0);
          months[key].projects.push(p.title);
        }
      });
    });
    return months;
  }, [projects, now]);

  const totalActiveHours = Object.values(monthlyWorkload).length > 0 ? Object.values(monthlyWorkload)[0].hours : 0;
  const peakWorkload = Math.max(...Object.values(monthlyWorkload).map(m => m.hours), 1);

  const domainColor = (key) => PROJECT_DOMAINS.find(d => d.key === key)?.color || '#5A5751';
  const domainLabel = (key) => PROJECT_DOMAINS.find(d => d.key === key)?.label || key;
  const statusColor = (s) => s === 'active' ? '#5A6E3D' : s === 'ending-soon' ? '#B85838' : s === 'complete' ? '#5A5751' : s === 'on-hold' ? '#8B6F47' : '#1A1815';

  return (
    <div className="space-y-6">
      <section className="bg-white border border-[#1A1815] p-5 sm:p-6">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] mb-2 font-medium">Projects · Timeline · Workload</div>
        <h2 className="text-2xl mb-3" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>See your whole life at once.</h2>
        <p className="text-base leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>
          Personal projects · family commitments · friend time · church work · day job · PoeTech · Poe Properties · TLC · tech repairs. Every project has a start, an end, and a weekly load. Track them all in one place so you can see when things are heavy and when they ease up. Coordinate, not just survive.
        </p>
      </section>

      {/* Snapshot stats — at a glance */}
      {projects.length > 0 && (
        <section>
          <div className="grid grid-cols-4 gap-px bg-[#E8E4DC] border border-[#E8E4DC]">
            <MetricCell label="Active" value={`${projects.filter(p => p.status === 'active').length}`} sub="in flight" small accent="green" />
            <MetricCell label="Ending soon" value={`${projects.filter(p => p.status === 'ending-soon').length}`} sub="<30 days" small accent="rust" />
            <MetricCell label="Planning" value={`${projects.filter(p => p.status === 'planning').length}`} sub="to launch" small />
            <MetricCell label="Total weekly" value={`${projects.filter(p => p.status === 'active' || p.status === 'ending-soon').reduce((s,p) => s + (p.hoursPerWeek || 0), 0)}h`} sub="/wk active" small />
          </div>
        </section>
      )}

      {/* Workload visualization */}
      {projects.length > 0 && (
        <section>
          <SectionTitle eyebrow="Coordination">12-Month Workload Forecast · Hours / Week</SectionTitle>
          <div className="bg-white border border-[#1A1815] p-5">
            <div className="space-y-1.5">
              {Object.entries(monthlyWorkload).map(([key, m], i) => {
                const pct = (m.hours / peakWorkload) * 100;
                const isHeavy = m.hours > 40;
                const isModerate = m.hours > 20 && m.hours <= 40;
                return (
                  <div key={key} className="flex items-center gap-2">
                    <div className="text-[10px] uppercase tracking-wider text-[#5A5751] w-12 shrink-0" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{m.label}</div>
                    <div className="flex-1 h-5 bg-[#FAF8F4] border border-[#E8E4DC] relative">
                      <div className={`h-full ${isHeavy ? 'bg-[#B85838]' : isModerate ? 'bg-[#8B6F47]' : 'bg-[#5A6E3D]'}`} style={{ width: `${Math.min(pct, 100)}%` }}></div>
                      {m.hours > 0 && <div className="absolute inset-0 flex items-center px-2 text-[10px]" style={{ fontFamily: '"JetBrains Mono", monospace', color: isHeavy ? '#FAF8F4' : '#1A1815' }}>{m.hours}h/wk · {m.projects.length} active</div>}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-[#5A5751] italic mt-3" style={{ fontFamily: '"Fraunces", serif' }}>
              Olive: sustainable (≤20h/wk added load) · Brown: stretched (20-40h) · Terracotta: overloaded (40+h). When you can see the heavy months coming, you can plan rest, delegate, or push timelines.
            </p>
          </div>
        </section>
      )}

      {/* Filter + add */}
      <section>
        <div className="flex items-baseline justify-between mb-3 pb-2 border-b border-[#1A1815] gap-2 flex-wrap">
          <h2 className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751]">All Projects</h2>
          <div className="flex gap-2 flex-wrap items-center">
            <select className="text-xs p-1.5 border border-[#E8E4DC] bg-[#FAF8F4]" value={filterDomain} onChange={e => setFilterDomain(e.target.value)}>
              <option value="all">All domains</option>
              {PROJECT_DOMAINS.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
            </select>
            <select className="text-xs p-1.5 border border-[#E8E4DC] bg-[#FAF8F4]" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="all">All statuses</option>
              {PROJECT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button type="button" onClick={() => { setEditingId(null); setNewProject({ title: '', startDate: '', endDate: '', status: 'planning', domain: 'personal', description: '', hoursPerWeek: 0, entityId: 'e-personal', contractorIds: [] }); setShowForm(!showForm); }} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815]">{showForm ? '× Cancel' : '+ Add project'}</button>
          </div>
        </div>

        {/* r19 — Top form panel ONLY for ADD NEW. Edit happens inline under
            the edited row (see renderProjectForm + the row map below). */}
        {showForm && !editingId && (
          <div className="bg-white border border-[#B85838] p-4 mb-3 space-y-3">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#B85838] font-medium">New project</div>
            <input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="Project title (e.g., PoeTech v1 launch, kitchen renovation, mom's care plan)" value={newProject.title} onChange={e => setNewProject({...newProject, title: e.target.value})} />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Start date</label>
                <input type="date" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={newProject.startDate} onChange={e => setNewProject({...newProject, startDate: e.target.value})} />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">End date (target)</label>
                <input type="date" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={newProject.endDate} onChange={e => setNewProject({...newProject, endDate: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Domain</label>
                <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={newProject.domain} onChange={e => setNewProject({...newProject, domain: e.target.value})}>
                  {PROJECT_DOMAINS.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Status</label>
                <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={newProject.status} onChange={e => setNewProject({...newProject, status: e.target.value})}>
                  {PROJECT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Hours / week (estimate)</label>
                <input type="number" min="0" step="1" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={newProject.hoursPerWeek} onChange={e => setNewProject({...newProject, hoursPerWeek: parseInt(e.target.value) || 0})} />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Entity (optional)</label>
                <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={newProject.entityId} onChange={e => setNewProject({...newProject, entityId: e.target.value})}>
                  <option value="e-personal">Personal</option><option value="e-poeprops">Poe Properties</option><option value="e-poetech">PoeTech</option><option value="e-tlc">TLC Therapy</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-wider text-[#5A5751] block mb-1.5">1099 contractors assigned (optional)</label>
              {contractors.length === 0 ? (
                <div className="text-[10px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No contractors yet — add them in Books · 1099s. They'll appear here as toggleable chips.</div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {contractors.map(k => {
                    const assigned = (newProject.contractorIds || []).includes(k.id);
                    return (
                      <button type="button" key={k.id} onClick={() => setNewProject({ ...newProject, contractorIds: assigned ? (newProject.contractorIds || []).filter(id => id !== k.id) : [...(newProject.contractorIds || []), k.id] })} className={`text-[10px] px-2 py-1 border uppercase tracking-wider ${assigned ? 'border-[#B85838] bg-[#B85838] text-white' : 'border-[#E8E4DC] text-[#5A5751] hover:border-[#B85838] hover:text-[#1A1815]'}`}>
                        {assigned ? '✓ ' : ''}{k.name}
                      </button>
                    );
                  })}
                </div>
              )}
              <p className="text-[10px] text-[#5A5751] italic mt-1" style={{ fontFamily: '"Fraunces", serif' }}>Optional — attach the 1099 workers helping with this project so YTD tracking and tax docs flow correctly.</p>
            </div>
            {/* Round 7 fix — bumped rows from 2 → 8 so multi-line descriptions
                (especially the auto-created "Wrap me with the tech" handoff
                from Dev/Ops, which includes the opportunity context) are fully
                visible and editable without scrolling inside the textarea. */}
            <div>
              <label htmlFor="proj-desc" className="text-[9px] uppercase tracking-wider text-[#5A5751] block mb-1">Description · key milestones · who's involved · opportunity context (for auto-created projects from Dev/Ops, this carries the example + tech-stack details — feel free to edit)</label>
              <textarea id="proj-desc" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]" rows="8" value={newProject.description} onChange={e => setNewProject({...newProject, description: e.target.value})} />
            </div>
            {projError && <div className="text-xs text-[#B85838] mb-2 px-3 py-2 bg-[#FAF8F4] border border-[#B85838]" role="alert" style={{ fontFamily: '"Fraunces", serif' }}>{projError}</div>}
            <button type="button" onClick={submitProject} className="w-full bg-[#1A1815] text-[#FAF8F4] py-2 text-xs uppercase tracking-wider hover:bg-[#B85838]">{editingId ? 'Save Changes' : 'Save Project'}</button>
          </div>
        )}

        {filtered.length === 0 && !showForm && (
          <div className="bg-white border border-[#E8E4DC] p-6 text-center">
            <p className="text-sm text-[#5A5751] italic mb-4" style={{ fontFamily: '"Fraunces", serif' }}>
              No projects yet. Add the things you're working on across your life — work, family, ministry, side projects, repairs. The first ones often feel obvious; the value comes when you can see them all together.
            </p>
            <button type="button" onClick={() => {
              const examples = [
                { title: 'PoeTech v1 Public Launch · Loved Ones cohort', startDate: '2026-05-16', endDate: '2026-09-30', status: 'active', domain: 'business-poetech', description: 'Foundation launch through Church of the Living God. Onboard first 100 founding families. Validate pricing tiers and core Financial module.', hoursPerWeek: 20, entityId: 'e-poetech' },
                { title: 'Christiana college transition', startDate: '2026-05-16', endDate: '2026-08-25', status: 'active', domain: 'family', description: 'Visits, paperwork, dorm prep, financial aid coordination, the goodbye conversations that matter.', hoursPerWeek: 4, entityId: 'e-personal' },
                { title: 'Sponsor outreach Q3 — first cohort', startDate: '2026-06-01', endDate: '2026-08-31', status: 'planning', domain: 'business-poetech', description: 'Reach out to Tier B + C targets. Sign 1 Module Sponsor + 2 Directory Partners by Sept.', hoursPerWeek: 5, entityId: 'e-poetech' },
                { title: '1508 Holly Hill — resolve LATE rent', startDate: '2026-05-16', endDate: '2026-06-15', status: 'ending-soon', domain: 'business-poeprops', description: 'Tenant conversation, payment plan or escalation. Recover $850 gap or transition unit.', hoursPerWeek: 3, entityId: 'e-poeprops' },
                { title: 'TLC — add 1-2 MSW contractors', startDate: '2026-06-01', endDate: '2026-09-15', status: 'planning', domain: 'business-tlc', description: 'Recruit through Christina\'s clinical network. Each contractor = ~$2K/mo additional revenue.', hoursPerWeek: 4, entityId: 'e-tlc' },
                { title: 'Holy Spirit Integration Worldview · finish + KDP', startDate: '2026-05-16', endDate: '2026-11-30', status: 'active', domain: 'business-poetech', description: 'Complete the book. KDP submission. Print proof. Launch alongside Spiritual Life module.', hoursPerWeek: 6, entityId: 'e-poetech' },
              ];
              examples.forEach(ex => addProject(ex));
            }} className="text-[10px] uppercase tracking-wider px-4 py-2 border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white">
              📋 Load 6 example projects to see how it works
            </button>
            <p className="text-[10px] text-[#5A5751] mt-3" style={{ fontFamily: '"Fraunces", serif' }}>
              You can delete any of the examples and add your own — they're just there to show the workload visualization at work.
            </p>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="space-y-2">
            {filtered.map(p => {
              const now = new Date();
              const start = new Date(p.startDate);
              const end = p.endDate ? new Date(p.endDate) : null;
              const isOverdue = end && end < now && p.status !== 'complete';
              const daysUntilEnd = end ? Math.ceil((end - now) / (1000 * 60 * 60 * 24)) : null;
              const totalDays = end ? Math.ceil((end - start) / (1000 * 60 * 60 * 24)) : null;
              const daysElapsed = Math.max(0, Math.ceil((now - start) / (1000 * 60 * 60 * 24)));
              const progressPct = totalDays && totalDays > 0 ? Math.min(100, (daysElapsed / totalDays) * 100) : 0;
              return (
                <div key={p.id} className="bg-white border-l-4 border border-[#E8E4DC] p-4" style={{ borderLeftColor: domainColor(p.domain) }}>
                  <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
                    <h4 className="text-base" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{p.title}</h4>
                    {/* Round 7 — properly-sized Edit / Delete tap targets, divider between them. */}
                    <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider">
                      <span style={{ color: statusColor(p.status) }} className="font-medium px-2">{p.status}{p.status === 'tbd' && ' · parked'}</span>
                      {/* Round 11 — TBD projects show a "Promote → Active" button so the user
                          can flip them when capacity opens up. Plain text-only edit otherwise. */}
                      {p.status === 'tbd' && (
                        <>
                          <span aria-hidden="true" className="h-5 w-px bg-[#E8E4DC]" />
                          <button type="button" onClick={() => updateProject(p.id, { status: 'planning' })} aria-label={`Promote ${p.title} from TBD to planning`} className="text-xs uppercase tracking-wider text-[#5A6E3D] hover:text-white hover:bg-[#5A6E3D] border border-[#5A6E3D] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">▶ Promote</button>
                        </>
                      )}
                      <span aria-hidden="true" className="h-5 w-px bg-[#E8E4DC]" />
                      <button type="button" onClick={() => startEdit(p)} aria-label={`Edit project ${p.title}`} className="text-xs uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815] hover:bg-[#FAF8F4] border border-transparent hover:border-[#1A1815] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">✎ Edit</button>
                      <span aria-hidden="true" className="h-5 w-px bg-[#E8E4DC]" />
                      <button type="button" onClick={() => { if (confirm(`Delete project "${p.title}"?`)) deleteProject(p.id); }} aria-label={`Delete project ${p.title}`} className="text-xs uppercase tracking-wider text-[#5A5751] hover:text-[#B85838] hover:bg-[#FAF8F4] border border-transparent hover:border-[#B85838] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">Delete</button>
                    </div>
                  </div>
                  <div className="text-xs text-[#5A5751] mb-2">
                    <span style={{ color: domainColor(p.domain) }} className="font-medium">{domainLabel(p.domain)}</span>
                    <span> · </span>
                    <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>{start.toLocaleDateString()}</span>
                    {end && <><span> → </span><span style={{ fontFamily: '"JetBrains Mono", monospace' }} className={isOverdue ? 'text-[#B85838] font-medium' : ''}>{end.toLocaleDateString()}{isOverdue ? ' (overdue)' : daysUntilEnd > 0 && daysUntilEnd < 30 ? ` (${daysUntilEnd}d left)` : ''}</span></>}
                    {p.hoursPerWeek > 0 && <> · {p.hoursPerWeek}h/wk</>}
                  </div>
                  {Array.isArray(p.contractorIds) && p.contractorIds.length > 0 && (
                    <div className="text-[10px] text-[#5A5751] mb-2 flex flex-wrap gap-1.5">
                      <span className="uppercase tracking-wider">👤 1099:</span>
                      {p.contractorIds.map(cid => {
                        const k = contractors.find(c => c.id === cid);
                        return k ? <span key={cid} className="px-1.5 py-0.5 border border-[#E8E4DC] bg-[#FAF8F4]" style={{ fontFamily: '"Fraunces", serif' }}>{k.name}</span> : null;
                      })}
                    </div>
                  )}
                  {totalDays && p.status !== 'complete' && (
                    <div className="h-1 bg-[#E8E4DC] mb-2">
                      <div className="h-full" style={{ width: `${progressPct}%`, backgroundColor: domainColor(p.domain) }}></div>
                    </div>
                  )}
                  {p.description && <p className="text-xs leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>{p.description}</p>}
                  <div className="mt-2">
                    {/* Round 9 — type="button" prevents default-submit behavior on browsers
                        that interpret a naked <button> as a form-submit even without a form
                        ancestor (which can scroll the page to the top under some conditions). */}
                    <button type="button" onClick={(e) => { e.preventDefault(); setOpenConvId(openConvId === p.id ? null : p.id); }} className="text-xs uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] hover:bg-[#FAF8F4] border border-transparent hover:border-[#B85838] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">
                      {openConvId === p.id ? '× Close conversations' : `💬 Conversations (${(p.conversationLog || []).length})`}
                    </button>
                  </div>
                  {openConvId === p.id && <ProjectConversationLog project={p} updateProject={updateProject} />}
                  {/* r19 — Inline edit form, mounted DIRECTLY under the row
                      the user clicked Edit on. No jump-to-top, eyes stay put.
                      Per IN-PLACE-FIRST.md + Real Estate Quick-Edit pattern. */}
                  {editingId === p.id && (
                    <div className="mt-3 p-3 bg-[#FAF8F4] border-2 border-[#B85838] space-y-3">
                      <div className="flex items-baseline justify-between gap-2">
                        <div className="text-[10px] uppercase tracking-[0.2em] text-[#B85838] font-medium">Quick edit · {p.title}</div>
                        <button type="button" onClick={cancelEdit} className="text-[10px] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815]">× Cancel</button>
                      </div>
                      <input className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" placeholder="Project title" value={newProject.title} onChange={e => setNewProject({...newProject, title: e.target.value})} />
                      <div className="grid grid-cols-2 gap-2">
                        <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Start date</label><input type="date" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={newProject.startDate} onChange={e => setNewProject({...newProject, startDate: e.target.value})} /></div>
                        <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">End date (target)</label><input type="date" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={newProject.endDate} onChange={e => setNewProject({...newProject, endDate: e.target.value})} /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Domain</label><select className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={newProject.domain} onChange={e => setNewProject({...newProject, domain: e.target.value})}>{PROJECT_DOMAINS.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}</select></div>
                        <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Status</label><select className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={newProject.status} onChange={e => setNewProject({...newProject, status: e.target.value})}>{PROJECT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Hours / week</label><input type="number" min="0" step="1" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={newProject.hoursPerWeek} onChange={e => setNewProject({...newProject, hoursPerWeek: parseInt(e.target.value) || 0})} /></div>
                        <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Entity</label><select className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={newProject.entityId} onChange={e => setNewProject({...newProject, entityId: e.target.value})}><option value="e-personal">Personal</option><option value="e-poeprops">Poe Properties</option><option value="e-poetech">PoeTech</option><option value="e-tlc">TLC Therapy</option></select></div>
                      </div>
                      <div>
                        <label className="text-[9px] uppercase tracking-wider text-[#5A5751] block mb-1.5">1099 contractors assigned</label>
                        {contractors.length === 0 ? (
                          <div className="text-[10px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No contractors yet — add them in Books · 1099s.</div>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {contractors.map(k => {
                              const assigned = (newProject.contractorIds || []).includes(k.id);
                              return (
                                <button type="button" key={k.id} onClick={() => setNewProject({ ...newProject, contractorIds: assigned ? (newProject.contractorIds || []).filter(id => id !== k.id) : [...(newProject.contractorIds || []), k.id] })} className={`text-[10px] px-2 py-1 border uppercase tracking-wider ${assigned ? 'border-[#B85838] bg-[#B85838] text-white' : 'border-[#E8E4DC] text-[#5A5751] hover:border-[#B85838] hover:text-[#1A1815]'}`}>
                                  {assigned ? '✓ ' : ''}{k.name}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <div>
                        <label htmlFor={`proj-desc-edit-${p.id}`} className="text-[9px] uppercase tracking-wider text-[#5A5751] block mb-1">Description · milestones · context</label>
                        <textarea id={`proj-desc-edit-${p.id}`} className="w-full p-2 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]" rows="6" value={newProject.description} onChange={e => setNewProject({...newProject, description: e.target.value})} />
                      </div>
                      {projError && <div className="text-xs text-[#B85838] px-3 py-2 bg-white border border-[#B85838]" role="alert" style={{ fontFamily: '"Fraunces", serif' }}>{projError}</div>}
                      <div className="flex gap-2">
                        <button type="button" onClick={submitProject} className="flex-1 bg-[#1A1815] text-[#FAF8F4] py-2 text-xs uppercase tracking-wider hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">Save changes</button>
                        <button type="button" onClick={cancelEdit} className="px-4 py-2 border border-[#1A1815] text-xs uppercase tracking-wider hover:bg-white focus:outline focus:outline-2 focus:outline-[#B85838]">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

// DateField - input type="date" with explicit year nav (arrows + dropdown)
// Browser native date picker keeps working; arrows step by 1 year, dropdown
// jumps to any year in range (currentYear - 5 to currentYear + 25).
function DateField({ value, onChange, className }) {
  const todayY = new Date().getFullYear();
  const currentYear = value && /^\d{4}-/.test(value) ? parseInt(value.slice(0, 4)) : todayY;
  const years = [];
  for (let y = currentYear - 10; y <= currentYear + 30; y++) years.push(y);
  const setYear = (year) => {
    if (!value) {
      const t = new Date();
      const m = String(t.getMonth() + 1).padStart(2, '0');
      const d = String(t.getDate()).padStart(2, '0');
      onChange(`${year}-${m}-${d}`);
      return;
    }
    const [, mm, dd] = value.split('-');
    onChange(`${year}-${mm || '01'}-${dd || '01'}`);
  };
  return (
    <div className={`flex items-center gap-1 ${className || ''}`}>
      <button type="button" onClick={() => setYear(currentYear - 1)} title="Previous year" aria-label="Previous year" className="px-2 py-1.5 text-xs border border-[#E8E4DC] text-[#5A5751] hover:text-[#1A1815] hover:border-[#1A1815] bg-[#FAF8F4]">«</button>
      <input type="date" className="flex-1 p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={value || ''} onChange={e => onChange(e.target.value)} />
      <button type="button" onClick={() => setYear(currentYear + 1)} title="Next year" aria-label="Next year" className="px-2 py-1.5 text-xs border border-[#E8E4DC] text-[#5A5751] hover:text-[#1A1815] hover:border-[#1A1815] bg-[#FAF8F4]">»</button>
      <select value={currentYear} onChange={e => setYear(parseInt(e.target.value))} className="p-2 border border-[#E8E4DC] text-xs bg-[#FAF8F4]" title="Jump to year" aria-label="Jump to year">
        {years.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  );
}

export { ProjectsWrapper, Projects, ProjectConversationLog, DateField, PROJECT_DOMAINS, PROJECT_STATUSES };
export default ProjectsWrapper;
