// =============================================================================
// Discussions — the discuss-then-document surface, inside the app
// =============================================================================
// "I want to start managing projects from inside the PoeTech app, and the
// discussions." (Darrell, 2026-06-17.) A discussion is a first-class record that
// DRIVES a project: a directive, a decision (with its rationale), a reflection
// (the Word/Study-grounded thinking), or a braked hand-off. Each links to the
// project(s) it drives, so a project shows its driving discussions inline (see
// Projects.jsx) and this surface is the place to capture + manage them.
//
// Ties into:
//   * Darrell's Study (the Yahweh/Word discussions source) — a reflection can
//     carry a Study reference (links.study_ref).
//   * the decisions ledger (docs/decisions/) — a decision can carry a DR ref
//     (links.dr_ref), the in-app companion to the repo Decision Record.
//
// Real data: every record is a row in the `discussions` table (migration 0035),
// synced cross-device. NO-LEAK: the list is filtered by visibleDiscussions so a
// PRIVATE record only shows to its author or an owner (proven-to-catch test).
import React, { useMemo, useState } from 'react';
import {
  DISCUSSION_KINDS, kindMeta, validateDiscussion, normalizeProjectSlugs,
  visibleDiscussions, sortDiscussions,
} from '../lib/discussions.js';
import { handoffSummary } from '../lib/orchestrator-handoff.js';
import { ARI } from '../lib/ari.js';
import { ariNotesFromLedger, ariAssignments, resolveDuties } from '../lib/ari-notes.js';
import { useBoardTasks } from '../lib/use-board-tasks.js';

// The decision ledger — Ari's derived note source (re-parsed every build).
const DR_LEDGER = (typeof __DR_LEDGER__ !== 'undefined') ? __DR_LEDGER__ : { ok: false, count: 0, items: [] };

// -----------------------------------------------------------------------------
// AriRecord — Ari's notes + responsibilities, DERIVED (DR-0120/DR-0121 item 3).
// "This should be full of Ari notes and Ari has stopped updating as we add
// features" — the fix is structural: one note per dated Decision Record, read
// from the same ledger the Decisions tab reads, so the feed updates with every
// build and can never silently stall. Ari's live workload derives from the real
// board rows (owner = Ari); his standing duties resolve their DR refs against
// the live ledger (a ref that stops resolving reads as missing, DR-0076).
// The credentialed Local-LLM tending lane (Tier C, three brakes) will ADD real
// synced reflections on top when it arms; this derived floor never goes stale.
// -----------------------------------------------------------------------------
function AriRecord() {
  const tasks = useBoardTasks();
  const [visibleCount, setVisibleCount] = useState(6);
  const notes = useMemo(() => ariNotesFromLedger(DR_LEDGER), []);
  const work = useMemo(() => ariAssignments(tasks), [tasks]);
  const duties = useMemo(() => resolveDuties(DR_LEDGER), []);
  return (
    <section className="bg-white border border-[#5A4A2E] p-4">
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A4A2E] font-semibold">{ARI.name}&apos;s record · notes, responsibilities, workload — derived live</div>
        <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">{notes.length} notes · {work.open} open assignment{work.open === 1 ? '' : 's'}</span>
      </div>
      <p className="text-xs text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
        One note per shipped decision, read from the same ledger the Decisions tab reads — it updates with every build, so it cannot silently stall. {ARI.honesty}
      </p>

      {/* Standing duties — each resolved against the live ledger. */}
      <div className="mt-3">
        <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] font-semibold mb-1">Standing responsibilities (assigned by the ledger)</div>
        <ul className="space-y-1">
          {duties.map((d) => (
            <li key={d.key} className="text-[0.6875rem] text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
              <span className="text-[#5A4A2E] mr-1" aria-hidden="true">›</span>{d.duty}{' '}
              {d.found
                ? <span className="text-[0.625rem] text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>({d.drRef}{d.drDate ? ` · ${d.drDate}` : ''})</span>
                : <span className="text-[0.625rem] text-[#DC2626]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>({d.drRef} — not in the ledger)</span>}
            </li>
          ))}
        </ul>
      </div>

      {/* Live workload — the real board rows pushed to Ari. */}
      <div className="mt-3">
        <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] font-semibold mb-1">Current workload (live board items owned by {ARI.name}: {work.open} open · {work.done} done)</div>
        {work.openItems.length === 0 ? (
          <p className="text-[0.6875rem] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No open items pushed to {ARI.name} on this device — the boards sync on sign-in, and any item can be pushed to him from ▦ Boards.</p>
        ) : (
          <ul className="space-y-0.5">
            {work.openItems.slice(0, 5).map((t) => (
              <li key={t.slug} className="text-[0.6875rem] text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
                <span className="text-[#2A5A8E] mr-1" aria-hidden="true">◐</span>{t.title}
                <span className="text-[#5A5751]"> · {t.board}{t.dueDate ? ` · due ${t.dueDate}` : ''} · {t.status}</span>
              </li>
            ))}
            {work.openItems.length > 5 && (
              <li className="text-[0.625rem] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>…and {work.openItems.length - 5} more on ▦ Boards.</li>
            )}
          </ul>
        )}
      </div>

      {/* The derived notes feed. */}
      <div className="mt-3">
        <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] font-semibold mb-1">Notes — what shipped and why (newest first)</div>
        {notes.length === 0 ? (
          <p className="text-[0.6875rem] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>The decision ledger was not parsed in this build — showing nothing rather than inventing notes.</p>
        ) : (
          <>
            <div className="space-y-1.5">
              {notes.slice(0, visibleCount).map((n) => (
                <div key={n.id} className="border-l-2 border-[#5A4A2E] bg-[#FAF8F4] px-2.5 py-1.5">
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <span className="text-xs" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{n.title}</span>
                    <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{n.drRef} · {n.date}</span>
                  </div>
                  <p className="text-[0.6875rem] text-[#5A5751] mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{n.body}</p>
                </div>
              ))}
            </div>
            {notes.length > visibleCount && (
              <button type="button" onClick={() => setVisibleCount((c) => c + 12)}
                className="mt-2 w-full text-[0.625rem] uppercase tracking-wider px-3 py-2 border border-[#E8E4DC] text-[#5A5751] hover:border-[#5A4A2E] hover:text-[#5A4A2E] focus:outline focus:outline-2 focus:outline-[#B85838]">
                Show more notes · {notes.length - visibleCount} remaining
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}

const blankForm = () => ({
  kind: 'directive', title: '', body: '', projectSlugs: [],
  visibility: 'shared', studyRef: '', drRef: '',
});

export default function Discussions({
  discussions = [], projects = [],
  addDiscussion, updateDiscussion, deleteDiscussion,
  currentUserId = null, currentUserPersona = null, isGovernor = false,
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(blankForm());
  const [errs, setErrs] = useState([]);
  const [filterKind, setFilterKind] = useState('all');
  const [filterProject, setFilterProject] = useState('all');

  const projectTitle = useMemo(() => {
    const m = {};
    for (const p of projects) m[p.id] = p.title;
    return m;
  }, [projects]);

  // NO-LEAK wall on top of the DB instance+role boundary.
  const visible = useMemo(
    () => sortDiscussions(visibleDiscussions(discussions, currentUserId, isGovernor)),
    [discussions, currentUserId, isGovernor]
  );

  const filtered = visible.filter((d) => {
    if (filterKind !== 'all' && d.kind !== filterKind) return false;
    if (filterProject !== 'all' && !(Array.isArray(d.projectSlugs) && d.projectSlugs.includes(filterProject))) return false;
    return true;
  });

  const resetForm = () => { setForm(blankForm()); setErrs([]); setEditingId(null); setShowForm(false); };

  const submit = () => {
    const draft = {
      kind: form.kind,
      title: form.title.trim(),
      body: form.body.trim(),
      projectSlugs: normalizeProjectSlugs(form.projectSlugs),
      visibility: form.visibility,
    };
    const v = validateDiscussion(draft);
    if (v.length) { setErrs(v); return; }
    const links = {};
    if (form.studyRef.trim()) links.study_ref = form.studyRef.trim();
    if (form.drRef.trim()) links.dr_ref = form.drRef.trim();
    const record = { ...draft, links, authorPersona: currentUserPersona };
    if (editingId) updateDiscussion(editingId, record);
    else addDiscussion(record);
    resetForm();
  };

  const startEdit = (d) => {
    setEditingId(d.id);
    setForm({
      kind: d.kind, title: d.title || '', body: d.body || '',
      projectSlugs: Array.isArray(d.projectSlugs) ? d.projectSlugs : [],
      visibility: d.visibility || 'shared',
      studyRef: (d.links && d.links.study_ref) || '',
      drRef: (d.links && d.links.dr_ref) || '',
    });
    setErrs([]);
    setShowForm(true);
  };

  const toggleProject = (slug) => setForm((f) => ({
    ...f,
    projectSlugs: f.projectSlugs.includes(slug) ? f.projectSlugs.filter((s) => s !== slug) : [...f.projectSlugs, slug],
  }));

  const fieldCls = 'w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]';
  const labelCls = 'text-[9px] uppercase tracking-wider text-[#5A5751] block mb-1';

  return (
    <div className="space-y-5">
      <section className="bg-white border-2 border-[#1A1815] p-4 sm:p-5">
        <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] font-semibold">💬 Discussions · discuss, then document</div>
        <h2 className="text-2xl mt-1" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>Capture what drives the work.</h2>
        <p className="text-sm mt-1 text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
          The directive, the decision and its reason, the reflection behind it — kept as real records that link to the projects they drive. A decision can carry its Decision-Record number; a reflection can point back to your Study. Nothing here is lost to a chat scroll.
        </p>
      </section>

      {/* Ari's derived record — notes per shipped decision, duties, live workload. */}
      <AriRecord />

      {/* Filters + capture */}
      <section>
        <div className="flex items-baseline justify-between mb-3 pb-2 border-b border-[#1A1815] gap-2 flex-wrap">
          <h3 className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751]">All discussions ({visible.length})</h3>
          <div className="flex gap-2 flex-wrap items-center">
            <select className="text-xs p-1.5 border border-[#E8E4DC] bg-[#FAF8F4]" value={filterKind} onChange={(e) => setFilterKind(e.target.value)} aria-label="Filter by kind">
              <option value="all">All kinds</option>
              {DISCUSSION_KINDS.map((k) => <option key={k.key} value={k.key}>{k.label}</option>)}
            </select>
            <select className="text-xs p-1.5 border border-[#E8E4DC] bg-[#FAF8F4]" value={filterProject} onChange={(e) => setFilterProject(e.target.value)} aria-label="Filter by project">
              <option value="all">All projects</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
            <button type="button" onClick={() => { if (showForm) resetForm(); else { setForm(blankForm()); setShowForm(true); } }} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] border border-transparent hover:border-[#B85838] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">
              {showForm ? '× Cancel' : '+ New discussion'}
            </button>
          </div>
        </div>

        {showForm && (
          <div className="bg-white border border-[#B85838] p-4 mb-4 space-y-3">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#B85838] font-medium">{editingId ? 'Edit discussion' : 'New discussion'}</div>
            <div>
              <span className={labelCls}>Kind</span>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Discussion kind">
                {DISCUSSION_KINDS.filter((k) => k.key !== 'handoff' || editingId).map((k) => (
                  <button key={k.key} type="button" aria-pressed={form.kind === k.key} onClick={() => setForm({ ...form, kind: k.key })}
                    className="text-[10px] px-2.5 py-1.5 border uppercase tracking-wider min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]"
                    style={form.kind === k.key ? { backgroundColor: '#1A1815', color: 'white', borderColor: '#1A1815' } : { color: '#5A5751', borderColor: '#E8E4DC' }}>
                    {k.glyph} {k.label}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-[#5A5751] italic mt-1" style={{ fontFamily: '"Fraunces", serif' }}>{kindMeta(form.kind).blurb}</p>
            </div>
            <input className={fieldCls} placeholder="Title — e.g., 'Prioritize the video wall over the newsletter'" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} aria-label="Discussion title" />
            <div>
              <label htmlFor="disc-body" className={labelCls}>Detail · the why · who said what</label>
              <textarea id="disc-body" className={fieldCls} rows="4" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
            </div>
            <div>
              <span className={labelCls}>Drives which project(s)</span>
              {projects.length === 0 ? (
                <p className="text-[10px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No projects yet — add one in the Projects · Timeline tab, then link it here.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {projects.map((p) => {
                    const on = form.projectSlugs.includes(p.id);
                    return (
                      <button key={p.id} type="button" aria-pressed={on} onClick={() => toggleProject(p.id)}
                        className="text-[10px] px-2 py-1 border uppercase tracking-wider min-h-[32px] focus:outline focus:outline-2 focus:outline-[#B85838]"
                        style={on ? { backgroundColor: '#5A6E3D', color: 'white', borderColor: '#5A6E3D' } : { color: '#5A5751', borderColor: '#E8E4DC' }}>
                        {on ? '✓ ' : ''}{p.title}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            {/* Tie-ins — honest cross-links to the Study + the decisions ledger. */}
            {form.kind === 'reflection' && (
              <div>
                <label htmlFor="disc-study" className={labelCls}>Study reference (optional) — the Yahweh/Word entry this draws on</label>
                <input id="disc-study" className={fieldCls} placeholder="e.g., Study · 2026-06-17 — 'His opinion IS wealth'" value={form.studyRef} onChange={(e) => setForm({ ...form, studyRef: e.target.value })} />
              </div>
            )}
            {form.kind === 'decision' && (
              <div>
                <label htmlFor="disc-dr" className={labelCls}>Decision Record (optional) — the ledger entry, e.g. DR-0075</label>
                <input id="disc-dr" className={fieldCls} placeholder="DR-####" value={form.drRef} onChange={(e) => setForm({ ...form, drRef: e.target.value })} />
              </div>
            )}
            <div>
              <span className={labelCls}>Who can see it</span>
              <div className="flex gap-1.5" role="group" aria-label="Visibility">
                {[['shared', 'Shared with family'], ['private', 'Private (you + owners)']].map(([k, label]) => (
                  <button key={k} type="button" aria-pressed={form.visibility === k} onClick={() => setForm({ ...form, visibility: k })}
                    className="text-[10px] px-2.5 py-1.5 border uppercase tracking-wider min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]"
                    style={form.visibility === k ? { backgroundColor: '#1A1815', color: 'white', borderColor: '#1A1815' } : { color: '#5A5751', borderColor: '#E8E4DC' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {errs.length > 0 && (
              <div className="text-xs text-[#B85838] px-3 py-2 bg-[#FAF8F4] border border-[#B85838]" role="alert" style={{ fontFamily: '"Fraunces", serif' }}>
                {errs.map((e, i) => <div key={i}>{e}</div>)}
              </div>
            )}
            <button type="button" onClick={submit} className="w-full bg-[#1A1815] text-[#FAF8F4] py-2 text-xs uppercase tracking-wider hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">
              {editingId ? 'Save changes' : 'Save discussion'}
            </button>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="bg-white border border-[#E8E4DC] p-6 text-center">
            <p className="text-sm text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
              {visible.length === 0
                ? 'No discussions yet. Capture the first directive, decision, or reflection that drives your work — it becomes a record that links to its project.'
                : 'No discussions match these filters.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((d) => (
              <DiscussionCard
                key={d.id} d={d} projectTitle={projectTitle}
                canManage={isGovernor || d.createdBy === currentUserId}
                onEdit={() => startEdit(d)}
                onStatus={(status) => updateDiscussion(d.id, { status })}
                onDelete={() => { if (confirm(`Delete discussion "${d.title}"?`)) deleteDiscussion(d.id); }}
              />
            ))}
          </div>
        )}
      </section>

      <p className="text-[10px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
        Discussions sync across your devices and stay family-internal. Private ones are visible only to you and the owners. Hand-offs are created from a project (Projects · Timeline) and stay behind the Cage — recorded, never auto-run.
      </p>
    </div>
  );
}

function DiscussionCard({ d, projectTitle, canManage, onEdit, onStatus, onDelete }) {
  const km = kindMeta(d.kind);
  const isHandoff = d.kind === 'handoff';
  const accent = isHandoff ? '#2A5A8E' : d.kind === 'decision' ? '#5A4A2E' : d.kind === 'reflection' ? '#7A5A8E' : '#B85838';
  const statusColor = d.status === 'resolved' ? '#5A6E3D' : d.status === 'archived' ? '#5A5751' : '#B85838';
  return (
    <div className="bg-white border-l-4 border border-[#E8E4DC] p-4" style={{ borderLeftColor: accent }}>
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: accent }}>{km.glyph} {km.label}</span>
        <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: statusColor }}>{d.status}{d.visibility === 'private' ? ' · private' : ''}</span>
      </div>
      <h4 className="text-base mt-0.5" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{d.title}</h4>
      {d.body && <p className="text-xs text-[#1A1815] mt-1 whitespace-pre-wrap" style={{ fontFamily: '"Fraunces", serif' }}>{d.body}</p>}

      {isHandoff && (
        <p className="text-[11px] mt-2 px-2 py-1.5 bg-[#FAF8F4] border-l-2 border-[#2A5A8E]" style={{ fontFamily: '"Fraunces", serif' }}>
          <span className="uppercase tracking-wider text-[10px] text-[#2A5A8E] font-semibold mr-1">🛰 Hand-off</span>{handoffSummary(d)}
        </p>
      )}

      {Array.isArray(d.projectSlugs) && d.projectSlugs.length > 0 && (
        <div className="text-[10px] text-[#5A5751] mt-2 flex flex-wrap items-center gap-1.5">
          <span className="uppercase tracking-wider">Drives:</span>
          {d.projectSlugs.map((s) => (
            <span key={s} className="px-1.5 py-0.5 border border-[#E8E4DC] bg-[#FAF8F4]" style={{ fontFamily: '"Fraunces", serif' }}>{projectTitle[s] || s}</span>
          ))}
        </div>
      )}

      {(d.links && (d.links.study_ref || d.links.dr_ref)) && (
        <div className="text-[10px] text-[#5A5751] mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5" style={{ fontFamily: '"Fraunces", serif' }}>
          {d.links.dr_ref && <span><span className="uppercase tracking-wider text-[#5A4A2E]">⚖ Ledger · </span>{d.links.dr_ref}</span>}
          {d.links.study_ref && <span><span className="uppercase tracking-wider text-[#7A5A8E]">📓 Study · </span>{d.links.study_ref}</span>}
        </div>
      )}

      {canManage && (
        <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider mt-2 pt-2 border-t border-[#E8E4DC]">
          <button type="button" onClick={onEdit} className="text-[#5A5751] hover:text-[#1A1815] hover:bg-[#FAF8F4] border border-transparent hover:border-[#1A1815] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">✎ Edit</button>
          <span aria-hidden="true" className="h-5 w-px bg-[#E8E4DC]" />
          {d.status !== 'resolved' && (
            <button type="button" onClick={() => onStatus('resolved')} className="text-[#5A6E3D] hover:text-white hover:bg-[#5A6E3D] border border-[#5A6E3D] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">✓ Resolve</button>
          )}
          {d.status !== 'archived' && (
            <button type="button" onClick={() => onStatus('archived')} className="text-[#5A5751] hover:text-[#1A1815] hover:bg-[#FAF8F4] border border-transparent hover:border-[#5A5751] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">⏸ Archive</button>
          )}
          {(d.status === 'resolved' || d.status === 'archived') && (
            <button type="button" onClick={() => onStatus('open')} className="text-[#B85838] hover:text-white hover:bg-[#B85838] border border-[#B85838] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">↺ Reopen</button>
          )}
          <span aria-hidden="true" className="h-5 w-px bg-[#E8E4DC]" />
          <button type="button" onClick={onDelete} className="text-[#5A5751] hover:text-[#B85838] hover:bg-[#FAF8F4] border border-transparent hover:border-[#B85838] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">Delete</button>
        </div>
      )}
    </div>
  );
}
