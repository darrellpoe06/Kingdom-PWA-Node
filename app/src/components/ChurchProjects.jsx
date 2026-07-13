// =============================================================================
// ChurchProjects — the Love Corner Projects board (a Church sub-tab)
// =============================================================================
// Darrell 2026-07-13: the Love Corner app's own Projects tab — the church manages
// its initiatives here (video wall, bus ministry, the Assembly, infra, the door,
// outreach). Stage lanes (Research → Plan → Execute → Done / Parked), by-area
// grouping, and honest progress — every count DERIVED from real project records.
// Staff-gated at the mount; a non-steward gets a read-only view.
import React, { useMemo, useState } from 'react';
import { SectionTitle, MetricCell } from './shared.jsx';
import UiIcon from './UiIcon.jsx';
import SectionTabs from './SectionTabs.jsx';
import {
  useChurchProjects, addProject, setStage, advanceProject, removeProject,
} from '../lib/use-church-projects.js';
import {
  STAGES, WORKING_STAGES, CHURCH_AREAS, stageMeta, churchArea,
  projectsByStage, projectStats, overdueProjects, validateProject, isSeedId,
} from '../lib/church-projects.js';

const num = (n) => (Number(n) || 0).toLocaleString();
const pct = (n) => `${Math.round(Number(n) || 0)}%`;
const shortDate = (iso) => { if (!iso) return ''; try { return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); } catch { return ''; } };

function Badge({ children, cls }) {
  return <span className={`inline-block px-1.5 py-0.5 border text-[0.625rem] font-semibold uppercase tracking-wide ${cls}`}>{children}</span>;
}
const STAGE_BADGE = {
  research: 'bg-[#FAF8F4] text-[#5A5751] border-[#C9C2B4]',
  plan: 'bg-[#FBF7EC] text-[#B45309] border-[#B85838]',
  execute: 'bg-[#F0F4EA] text-[#3F5226] border-[#5A6E3D]',
  done: 'bg-[#F0F4EA] text-[#3F5226] border-[#5A6E3D]',
  parked: 'bg-[#FAF8F4] text-[#8A857C] border-[#C9C2B4]',
};

export default function ChurchProjects({ isChurchStaff = false } = {}) {
  const projects = useChurchProjects();
  const now = new Date().toISOString();
  const [areaFilter, setAreaFilter] = useState('all');

  const filtered = useMemo(() => (areaFilter === 'all' ? projects : projects.filter((p) => p.areaId === areaFilter)), [projects, areaFilter]);
  const stats = useMemo(() => projectStats(projects), [projects]);
  const lanes = useMemo(() => projectsByStage(filtered), [filtered]);
  const overdue = useMemo(() => overdueProjects(projects, now), [projects, now]);

  const sections = [
    { id: 'board', label: 'Board', icon: 'sliders', render: () => (
      <BoardSection lanes={lanes} isChurchStaff={isChurchStaff} />
    ) },
    { id: 'areas', label: 'By area', icon: 'book', render: () => (
      <AreasSection stats={stats} projects={filtered} isChurchStaff={isChurchStaff} />
    ) },
  ];

  return (
    <div className="max-w-5xl">
      <SectionTitle eyebrow="The Love Corner · project management">Projects</SectionTitle>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 mb-3">
        <MetricCell label="Projects" value={num(stats.total)} />
        <MetricCell label="Active" value={num(stats.active)} accent />
        <MetricCell label="Done" value={num(stats.done)} sub={pct(stats.pctDone) + ' complete'} />
        <MetricCell label="Overdue" value={num(overdue.length)} />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label className="text-[0.625rem] uppercase tracking-wide text-[#5A5751]">Area</label>
        <select value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)} className="border border-[#C9C2B4] bg-white px-2 py-1 text-sm" aria-label="Filter by area">
          <option value="all">All areas</option>
          {CHURCH_AREAS.map((a) => <option key={a.id} value={a.id}>{a.label} ({stats.byArea[a.id] || 0})</option>)}
        </select>
      </div>

      {isChurchStaff && <AddProjectForm />}

      {!isChurchStaff && (
        <div className="border border-[#E8E4DC] bg-[#FAF8F4] p-3 mb-3 text-xs text-[#5A5751]">
          You’re viewing the church’s project board. Sign in with a church staff account to add or move projects.
        </div>
      )}

      <div className="mt-3">
        <SectionTabs sections={sections} ariaLabel="Church projects views" idBase="cproj" defaultId="board" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Board — stage lanes
// ---------------------------------------------------------------------------
function BoardSection({ lanes, isChurchStaff }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      {WORKING_STAGES.map((s) => (
        <div key={s.id} className="border border-[#E8E4DC] bg-[#FAF8F4] p-2">
          <div className="text-xs font-semibold text-[#1A1815] mb-1.5">{s.label} <span className="text-[#8A857C] font-normal">· {lanes[s.id].length}</span></div>
          <div className="space-y-1">
            {lanes[s.id].length === 0 && <div className="text-[0.6875rem] text-[#8A857C] px-1 py-2">Nothing here.</div>}
            {lanes[s.id].map((p) => <ProjectCard key={p.id} project={p} isChurchStaff={isChurchStaff} />)}
          </div>
        </div>
      ))}
      {/* terminal rests shown together below the working lanes */}
      <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {['done', 'parked'].map((sid) => (
          <div key={sid} className="border border-[#E8E4DC] bg-white p-2">
            <div className="text-xs font-semibold text-[#1A1815] mb-1.5">{stageMeta(sid).label} <span className="text-[#8A857C] font-normal">· {lanes[sid].length}</span></div>
            <div className="space-y-1">
              {lanes[sid].length === 0 && <div className="text-[0.6875rem] text-[#8A857C] px-1 py-2">None.</div>}
              {lanes[sid].map((p) => <ProjectCard key={p.id} project={p} isChurchStaff={isChurchStaff} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProjectCard({ project, isChurchStaff }) {
  const area = churchArea(project.areaId);
  return (
    <div className="border border-[#E8E4DC] bg-white p-2">
      <div className="flex items-start justify-between gap-1.5">
        <span className="text-xs font-semibold text-[#1A1815] leading-snug">{project.title}</span>
        {area && <span className="shrink-0 text-[#8A857C]" title={area.label}><UiIcon name={area.icon} /></span>}
      </div>
      <div className="mt-0.5 text-[0.625rem] text-[#8A857C]">{area ? area.label : ''}{project.owner ? ` · ${project.owner}` : ''}{project.dueOn ? ` · due ${shortDate(project.dueOn)}` : ''}</div>
      {project.notes && <div className="mt-1 text-[0.6875rem] text-[#5A5751] leading-relaxed">{project.notes}</div>}
      {isChurchStaff && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          {project.stage !== 'done' && <button type="button" onClick={() => advanceProject(project.id)} className="border border-[#5A6E3D] bg-[#F0F4EA] text-[#3F5226] px-1.5 py-0.5 text-[0.625rem] font-semibold">Advance →</button>}
          <select value={project.stage} onChange={(e) => setStage(project.id, e.target.value)} className="border border-[#C9C2B4] bg-white px-1 py-0.5 text-[0.625rem]" aria-label={`Stage for ${project.title}`}>
            {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          {!isSeedId(project.id) && <button type="button" onClick={() => removeProject(project.id)} className="text-[0.625rem] text-[#8A857C] underline">remove</button>}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// By area — grouped list
// ---------------------------------------------------------------------------
function AreasSection({ stats, projects, isChurchStaff }) {
  return (
    <div className="space-y-3">
      {CHURCH_AREAS.filter((a) => (stats.byArea[a.id] || 0) > 0).map((a) => (
        <div key={a.id}>
          <div className="flex items-center gap-1.5 text-sm font-semibold text-[#1A1815] mb-1">
            <UiIcon name={a.icon} /> {a.label} <span className="text-[#8A857C] font-normal text-xs">· {stats.byArea[a.id]}</span>
          </div>
          <div className="space-y-1">
            {projects.filter((p) => p.areaId === a.id).map((p) => (
              <div key={p.id} className="border border-[#E8E4DC] bg-white p-2 flex items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-semibold text-[#1A1815]">{p.title}</span>
                  {p.owner && <span className="ml-1.5 text-[0.625rem] text-[#8A857C]">{p.owner}</span>}
                </div>
                <span className="flex items-center gap-1.5">
                  {p.dueOn && <span className="text-[0.625rem] text-[#8A857C]">{shortDate(p.dueOn)}</span>}
                  <Badge cls={STAGE_BADGE[p.stage]}>{stageMeta(p.stage).label}</Badge>
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
      {stats.total === 0 && <div className="border border-[#E8E4DC] bg-[#FAF8F4] p-4 text-sm text-[#5A5751]">No projects yet.</div>}
      {!isChurchStaff && stats.total > 0 && <div className="text-[0.625rem] text-[#8A857C]">Read-only — sign in as church staff to manage.</div>}
    </div>
  );
}

function AddProjectForm() {
  const [f, setF] = useState({ title: '', areaId: 'worship-av', stage: 'research', owner: '', dueOn: '', notes: '' });
  const [error, setError] = useState('');
  const set = (k) => (e) => setF((cur) => ({ ...cur, [k]: e.target.value }));

  const onAdd = () => {
    const check = validateProject(f);
    if (!check.ok) { setError(check.error); return; }
    addProject({ ...f, dueOn: f.dueOn ? new Date(f.dueOn).toISOString() : null });
    setF((cur) => ({ ...cur, title: '', owner: '', dueOn: '', notes: '' }));
    setError('');
  };

  return (
    <div className="border border-[#E8E4DC] bg-[#FAF8F4] p-3">
      <div className="text-sm font-semibold text-[#1A1815] mb-2">Add a project</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input value={f.title} onChange={set('title')} placeholder="Project title" className="border border-[#C9C2B4] bg-white px-2 py-1 text-sm sm:col-span-2" aria-label="Project title" />
        <select value={f.areaId} onChange={set('areaId')} className="border border-[#C9C2B4] bg-white px-2 py-1 text-sm" aria-label="Area">
          {CHURCH_AREAS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
        </select>
        <select value={f.stage} onChange={set('stage')} className="border border-[#C9C2B4] bg-white px-2 py-1 text-sm" aria-label="Stage">
          {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <input value={f.owner} onChange={set('owner')} placeholder="Owner / team" className="border border-[#C9C2B4] bg-white px-2 py-1 text-sm" aria-label="Owner" />
        <input value={f.dueOn} onChange={set('dueOn')} type="date" className="border border-[#C9C2B4] bg-white px-2 py-1 text-sm" aria-label="Due date" />
        <textarea value={f.notes} onChange={set('notes')} placeholder="Notes" rows={2} className="border border-[#C9C2B4] bg-white px-2 py-1 text-sm sm:col-span-2" aria-label="Notes" />
      </div>
      {error && <div className="mt-1.5 text-xs text-[#7A1F1F]">{error}</div>}
      <button type="button" onClick={onAdd} className="mt-2 border border-[#5A6E3D] bg-[#F0F4EA] text-[#3F5226] px-3 py-1.5 text-sm font-semibold">Add project</button>
    </div>
  );
}
