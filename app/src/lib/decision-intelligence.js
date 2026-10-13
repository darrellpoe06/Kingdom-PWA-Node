// =============================================================================
// decision-intelligence — the six readouts of Darrell's brief, derived from the
// rows the app already writes: repeated risks, dependencies, ownership gaps,
// what has stalled, patterns across areas, and what threatens a date
// =============================================================================
// Darrell, 2026-09-23: "How can PoeTech App do these functions for me?!!!!"
// The functions, in his words — Risks: what appears repeatedly? Dependencies:
// what cannot move until another item is completed? Ownership gaps: who
// should own this but doesn't? Escalation needs: what has stalled? Patterns:
// what concerns are appearing across multiple projects? Timeline threats:
// what evidence suggests delivery dates are at risk? — plus the column his
// board recommends: Decision required (who needs to decide what).
//
// THE REAL DATA (DR-0061). concerns (0039 + 0228: concern, evidence, impact,
// decision_required, outcome, owner, target_date, status, area, links,
// updated_at), projects (title, end_date, status, blocker, assignee_personas),
// discussions (kind handoff → meta.handoff.to). Every readout item names the
// rows it was derived from (`sources`) and states its reason in one plain
// sentence (`why`). No rows → ok:false "unavailable", never a painted zero
// (DR-0076 / DR-0100). PURE and deterministic: same rows + same nowMs → same
// readout; the clock is an argument, never read inside.
//
// THRESHOLDS are named constants, stated on the surface, so "stalled" means
// one measurable thing and not a feeling.
// =============================================================================

export const STALL_DAYS = 21;          // no update for this long on an open row = stalled
export const DUE_SOON_DAYS = 14;       // a target inside this window with no work started = a threat
export const PROJECT_HORIZON_DAYS = 30; // a project ending inside this window with an open blocker = a threat
export const REPEAT_MIN = 2;           // the same signature this many times = a repeated risk

const DAY = 86400000;
const OPEN = new Set(['open', 'in-progress']);

const STOP = new Set(('a an the and or of to in on for with without from by at is are was were be been it its this that these those we our you your they their as into over under not no yes do does did done has have had can cannot could should would will if then than so such via per about after before again still just only also more most less least very much many any some all each every one two three new old same other another when where what which who whom whose how why up down out off').split(' '));

export function isoDay(v) {
  if (!v) return '';
  const s = String(v);
  return s.length >= 10 ? s.slice(0, 10) : s;
}

export function daysBetween(fromIso, toMs) {
  if (!fromIso || !Number.isFinite(toMs)) return null;
  const t = Date.parse(String(fromIso).length === 10 ? `${fromIso}T00:00:00Z` : fromIso);
  if (!Number.isFinite(t)) return null;
  return Math.floor((toMs - t) / DAY);
}

// The content signature of a sentence: its three most telling words, sorted.
// Two concerns with the same signature are the same worry stated twice.
export function signatureOf(text, n = 3) {
  const words = String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    // A token carrying a digit is an id, a count, a phone number or an account
    // name, never the substance of a worry, and it must never be shown back as
    // a pattern (DR-0612, measured on live feedback rows).
    .filter((w) => w.length >= 4 && !STOP.has(w) && !/\d/.test(w));
  const freq = new Map();
  for (const w of words) freq.set(w, (freq.get(w) || 0) + 1);
  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
    .slice(0, n)
    .map((e) => e[0])
    .sort()
    .join('+');
}

const conc = (c) => ({
  id: c.id,
  label: String(c.concern || '').trim().slice(0, 120),
  area: (c.area || '').trim() || 'general',
  status: c.status || 'open',
  owner: (c.owner || '').trim(),
  targetDate: isoDay(c.targetDate || c.target_date),
  updatedAt: c.updatedAt || c.updated_at || c.createdAt || c.created_at || '',
  links: c.links && typeof c.links === 'object' ? c.links : {},
  decisionRequired: (c.decisionRequired || c.decision_required || '').trim(),
  evidence: (c.evidence || '').trim(),
  impact: (c.impact || '').trim(),
  outcome: (c.outcome || '').trim(),
  solution: (c.solution || '').trim(),
});

const proj = (p) => ({
  id: p.id,
  label: String(p.title || '').trim().slice(0, 120),
  status: p.status || '',
  endDate: isoDay(p.endDate || p.end_date),
  blocker: (p.blocker || '').trim(),
  assignees: Array.isArray(p.assigneePersonas) ? p.assigneePersonas.filter(Boolean) : [],
  domain: (p.domain || '').trim(),
});

const dep = (x) => ({
  // links.depends_on / links.blocked_by: a concern id, a project slug, or a list of either
  ids: [].concat(x.links.depends_on || [], x.links.blocked_by || [], x.links.blockedBy || []).map(String).filter(Boolean),
  projectSlug: x.links.project_slug || x.links.projectSlug || '',
});

// PHASE 1 (DR-0612): the board also reads the rows PoeTech already holds on
// its own boards, its feedback and its incidents. Each is normalized here;
// nothing is inferred from prose beyond the content signature risks use.
const TASK_OPEN = (s) => s !== 'done';
const task = (t) => ({
  id: String(t.id || t.slug),
  label: String(t.title || '').trim().slice(0, 120),
  status: t.status || 'not-started',
  owner: String(t.owner || '').trim(),
  board: String(t.boardTitle || t.board_title || t.boardSlug || 'board').trim(),
  dueDate: isoDay(t.dueDate || t.due_date),
  updatedAt: t.updatedAt || t.updated_at || t.createdAt || t.created_at || '',
  links: t.links && typeof t.links === 'object' ? t.links : {},
});
const INCIDENT_CLOSED = new Set(['resolved', 'declined', 'duplicate', 'done', 'closed']);
const incident = (x) => ({
  id: String(x.id),
  label: String(x.description || x.category || 'incident').trim().slice(0, 120),
  status: x.status || 'open',
  category: String(x.category || 'incident').trim(),
  dueDate: isoDay(x.dueDate || x.due_date),
  updatedAt: x.updatedAt || x.updated_at || x.createdAt || x.created_at || '',
});
const UNTRIAGED = new Set(['', 'new', 'null', 'undefined']);
// Rows the app writes about itself (measured 2026-09-24: 99 of 151 feedback
// rows are "[Learn engagement] band=… signal=started"), not words a person
// wrote. They stay in the feedback table; they are not worries and not a
// triage queue, so the readouts leave them out.
export const MACHINE_FEEDBACK = /^\s*\[(learn engagement)\]/i;
const fb = (f) => ({
  id: `fb-${f.id}`,
  label: String(f.text || f.feedback_text || '').trim().slice(0, 120),
  area: String(f.currentView || f.which_tab || 'feedback').trim() || 'feedback',
  triage: String(f.triageStatus ?? f.triage_status ?? ''),
  createdAt: f.createdAt || f.submittedAt || f.submitted_at || '',
});

// deriveDecisionIntelligence — the whole readout in one pass.
export function deriveDecisionIntelligence({ concerns = [], projects = [], discussions = [], boardTasks = [], feedback = [], incidents = [], nowMs } = {}) {
  const now = Number.isFinite(nowMs) ? nowMs : NaN;
  const cs = (concerns || []).filter((c) => c && c.id).map(conc);
  const ps = (projects || []).filter((p) => p && p.id).map(proj);
  const ds = (discussions || []).filter((d) => d && d.id);
  const ts = (boardTasks || []).filter((t) => t && (t.id || t.slug)).map(task);
  const fs = (feedback || []).filter((f) => f && f.id && !MACHINE_FEEDBACK.test(String(f.text || f.feedback_text || ''))).map(fb);
  const is = (incidents || []).filter((x) => x && x.id).map(incident);
  const total = cs.length + ps.length + ds.length + ts.length + fs.length + is.length;
  const byId = new Map();
  for (const c of cs) byId.set(String(c.id), { kind: 'concern', ...c });
  for (const p of ps) byId.set(String(p.id), { kind: 'project', ...p });
  for (const t of ts) byId.set(String(t.id), { kind: 'task', ...t, status: t.status });

  const empty = { ok: false, reason: 'no concerns, projects, discussions, board tasks, feedback or incidents to read', counts: {}, risks: [], dependencies: [], ownershipGaps: [], escalations: [], patterns: [], timelineThreats: [], decisionsRequired: [] };
  if (!total) return empty;

  // 1. RISKS — what appears repeatedly: the same signature stated on two or
  //    more concerns, feedback items or incidents (any status: a resolved
  //    worry that returns is the point). Board task titles are work, not
  //    worries, so they do not count here.
  const bySig = new Map();
  const worries = [
    ...cs,
    ...fs.map((f) => ({ id: f.id, label: f.label, area: f.area, status: UNTRIAGED.has(f.triage) ? 'open' : 'done' })),
    ...is.map((x) => ({ id: x.id, label: x.label, area: x.category, status: INCIDENT_CLOSED.has(x.status) ? 'done' : 'open' })),
  ];
  for (const c of worries) {
    const sig = signatureOf(c.label);
    if (!sig) continue;
    if (!bySig.has(sig)) bySig.set(sig, []);
    bySig.get(sig).push(c);
  }
  const risks = [];
  for (const [sig, list] of bySig) {
    if (list.length < REPEAT_MIN) continue;
    const open = list.filter((c) => OPEN.has(c.status)).length;
    risks.push({
      key: sig,
      title: list[0].label,
      count: list.length,
      open,
      areas: Array.from(new Set(list.map((c) => c.area))).sort(),
      sources: list.map((c) => c.id),
      why: `Stated ${list.length} times (${open} still open) as "${sig.split('+').join(', ')}" across ${Array.from(new Set(list.map((c) => c.area))).length} area(s).`,
    });
  }
  risks.sort((a, b) => b.count - a.count || b.open - a.open || (a.key < b.key ? -1 : 1));

  // 2. DEPENDENCIES — what cannot move until another item is completed.
  const dependencies = [];
  for (const c of cs) {
    if (!OPEN.has(c.status)) continue;
    const d = dep(c);
    for (const id of d.ids) {
      const target = byId.get(id);
      const targetOpen = !target || (target.kind === 'concern' ? OPEN.has(target.status) : target.status !== 'done' && target.status !== 'complete');
      if (!targetOpen) continue;
      dependencies.push({
        id: c.id,
        title: c.label,
        waitsOn: id,
        waitsOnTitle: target ? target.label : '(not on this board)',
        sources: [c.id, id],
        why: target ? `Waits on ${target.kind} "${target.label}" which is ${target.status || 'not done'}.` : `Waits on "${id}", which is not a row this board holds.`,
      });
    }
  }
  for (const p of ps) {
    if (!p.blocker || p.status === 'done' || p.status === 'complete') continue;
    dependencies.push({ id: p.id, title: p.label, waitsOn: '', waitsOnTitle: p.blocker, sources: [p.id], why: `Project names its own blocker: "${p.blocker.slice(0, 140)}".` });
  }
  for (const t of ts) {
    if (!TASK_OPEN(t.status)) continue;
    const ids = [].concat(t.links.depends_on || [], t.links.blocked_by || []).map(String).filter(Boolean);
    for (const id of ids) {
      const target = byId.get(id);
      if (target && (target.kind === 'task' ? !TASK_OPEN(target.status) : target.status === 'done')) continue;
      dependencies.push({ id: t.id, title: t.label, waitsOn: id, waitsOnTitle: target ? target.label : '(not on this board)', sources: [t.id, id], why: `Task on ${t.board} waits on ${target ? `"${target.label}"` : `"${id}"`}.` });
    }
    if (t.status === 'blocked' && !ids.length) dependencies.push({ id: t.id, title: t.label, waitsOn: '', waitsOnTitle: 'marked blocked', sources: [t.id], why: `Task on ${t.board} is marked blocked and does not name what it waits on.` });
  }
  for (const x of is) {
    if (x.status === 'blocked') dependencies.push({ id: x.id, title: x.label, waitsOn: '', waitsOnTitle: 'marked blocked', sources: [x.id], why: `Incident (${x.category}) is marked blocked.` });
  }

  // 3. OWNERSHIP GAPS — who should own this but doesn't.
  const ownershipGaps = [];
  for (const c of cs) if (OPEN.has(c.status) && !c.owner) ownershipGaps.push({ id: c.id, kind: 'concern', title: c.label, area: c.area, sources: [c.id], why: `${c.status === 'in-progress' ? 'In-progress' : 'Open'} concern in ${c.area} with no owner set.` });
  for (const p of ps) if (p.status && p.status !== 'done' && p.status !== 'complete' && p.assignees.length === 0) ownershipGaps.push({ id: p.id, kind: 'project', title: p.label, area: p.domain || 'project', sources: [p.id], why: `Project "${p.label}" (${p.status}) has no assignee.` });
  for (const t of ts) if (TASK_OPEN(t.status) && !t.owner) ownershipGaps.push({ id: t.id, kind: 'task', title: t.label, area: t.board, sources: [t.id], why: `Open task on ${t.board} with no owner.` });
  for (const d of ds) {
    if (d.kind !== 'handoff') continue;
    const to = d.meta && (d.meta.handoff?.to || d.meta.to);
    if (!to) ownershipGaps.push({ id: d.id, kind: 'handoff', title: d.title || 'Hand-off', area: 'board', sources: [d.id], why: 'A hand-off was recorded with no one to receive it.' });
  }

  // 4. ESCALATIONS — what has stalled: a slipped target, or no update for STALL_DAYS.
  const escalations = [];
  for (const c of cs) {
    if (!OPEN.has(c.status)) continue;
    const slip = c.targetDate ? daysBetween(c.targetDate, now) : null;
    const idle = c.updatedAt ? daysBetween(c.updatedAt, now) : null;
    if (slip != null && slip > 0) escalations.push({ id: c.id, title: c.label, kind: 'slipped', days: slip, sources: [c.id], why: `Target ${c.targetDate} passed ${slip} day(s) ago and the row is still ${c.status}.` });
    else if (idle != null && idle >= STALL_DAYS) escalations.push({ id: c.id, title: c.label, kind: 'idle', days: idle, sources: [c.id], why: `No update for ${idle} days (threshold ${STALL_DAYS}) while ${c.status}.` });
  }
  for (const p of ps) {
    if (!p.endDate || p.status === 'done' || p.status === 'complete') continue;
    const slip = daysBetween(p.endDate, now);
    if (slip != null && slip > 0) escalations.push({ id: p.id, title: p.label, kind: 'slipped', days: slip, sources: [p.id], why: `Project end date ${p.endDate} passed ${slip} day(s) ago and status is ${p.status}.` });
  }
  for (const t of ts) {
    if (!TASK_OPEN(t.status)) continue;
    const slip = t.dueDate ? daysBetween(t.dueDate, now) : null;
    const idle = t.updatedAt ? daysBetween(t.updatedAt, now) : null;
    if (slip != null && slip > 0) escalations.push({ id: t.id, title: t.label, kind: 'slipped', days: slip, sources: [t.id], why: `Due ${t.dueDate} on ${t.board}, passed ${slip} day(s) ago, still ${t.status}.` });
    else if (t.status === 'blocked' && idle != null && idle >= STALL_DAYS) escalations.push({ id: t.id, title: t.label, kind: 'idle', days: idle, sources: [t.id], why: `Blocked on ${t.board} with no update for ${idle} days.` });
  }
  for (const x of is) {
    if (INCIDENT_CLOSED.has(x.status)) continue;
    const slip = x.dueDate ? daysBetween(x.dueDate, now) : null;
    const idle = x.updatedAt ? daysBetween(x.updatedAt, now) : null;
    if (slip != null && slip > 0) escalations.push({ id: x.id, title: x.label, kind: 'slipped', days: slip, sources: [x.id], why: `Incident (${x.category}) due ${x.dueDate} passed ${slip} day(s) ago, still ${x.status}.` });
    else if (idle != null && idle >= STALL_DAYS) escalations.push({ id: x.id, title: x.label, kind: 'idle', days: idle, sources: [x.id], why: `Incident (${x.category}) ${x.status} with no update for ${idle} days.` });
  }
  // Feedback waiting for triage is ONE escalation with its count, never one
  // item per row: a queue that has not been read is the finding.
  const waiting = fs.filter((f) => UNTRIAGED.has(f.triage)).map((f) => ({ f, age: daysBetween(f.createdAt, now) })).filter((x) => x.age != null && x.age >= STALL_DAYS);
  if (waiting.length) {
    const oldest = Math.max(...waiting.map((x) => x.age));
    escalations.push({ id: 'feedback-triage', title: `${waiting.length} feedback item(s) waiting for triage`, kind: 'queue', days: oldest, count: waiting.length, sources: waiting.slice(0, 12).map((x) => x.f.id), why: `${waiting.length} feedback item(s) have waited ${STALL_DAYS}+ days with no triage (oldest ${oldest} days).` });
  }
  escalations.sort((a, b) => b.days - a.days || (a.id < b.id ? -1 : 1));

  // 5. PATTERNS — the same worry across more than one area, or an area that
  //    keeps collecting open concerns.
  const patterns = [];
  for (const r of risks) if (r.areas.length >= 2) patterns.push({ key: r.key, title: r.title, areas: r.areas, count: r.count, sources: r.sources, why: `The same concern is on the board in ${r.areas.join(', ')}.` });
  const byArea = new Map();
  for (const c of cs) if (OPEN.has(c.status)) { if (!byArea.has(c.area)) byArea.set(c.area, []); byArea.get(c.area).push(c); }
  for (const [area, list] of byArea) if (list.length >= 3) patterns.push({ key: `area:${area}`, title: `${list.length} open concerns in ${area}`, areas: [area], count: list.length, sources: list.map((c) => c.id), why: `${area} carries ${list.length} open concerns at once.` });
  const stuckByBoard = new Map();
  for (const t of ts) {
    if (!TASK_OPEN(t.status)) continue;
    const slip = t.dueDate ? daysBetween(t.dueDate, now) : null;
    if (t.status === 'blocked' || (slip != null && slip > 0)) { if (!stuckByBoard.has(t.board)) stuckByBoard.set(t.board, []); stuckByBoard.get(t.board).push(t); }
  }
  for (const [board, list] of stuckByBoard) if (list.length >= 3) patterns.push({ key: `board:${board}`, title: `${list.length} tasks overdue or blocked on ${board}`, areas: [board], count: list.length, sources: list.map((t) => t.id), why: `${board} carries ${list.length} tasks past due or blocked at once.` });
  patterns.sort((a, b) => b.count - a.count || (a.key < b.key ? -1 : 1));

  // 6. TIMELINE THREATS — evidence a date is at risk: a target inside
  //    DUE_SOON_DAYS with no work started; a project ending inside
  //    PROJECT_HORIZON_DAYS with an open blocker or an open concern linked to it.
  const timelineThreats = [];
  for (const c of cs) {
    if (c.status !== 'open' || !c.targetDate) continue;
    const left = -(daysBetween(c.targetDate, now) ?? -Infinity);
    if (left >= 0 && left <= DUE_SOON_DAYS) timelineThreats.push({ id: c.id, title: c.label, date: c.targetDate, daysLeft: left, sources: [c.id], why: `Due in ${left} day(s) and no work has started (status open).` });
  }
  for (const p of ps) {
    if (!p.endDate || p.status === 'done' || p.status === 'complete') continue;
    const left = -(daysBetween(p.endDate, now) ?? -Infinity);
    if (left < 0 || left > PROJECT_HORIZON_DAYS) continue;
    const linked = cs.filter((c) => OPEN.has(c.status) && dep(c).projectSlug === p.id);
    if (p.blocker || linked.length) timelineThreats.push({ id: p.id, title: p.label, date: p.endDate, daysLeft: left, sources: [p.id, ...linked.map((c) => c.id)], why: `Ends in ${left} day(s) with ${p.blocker ? 'a named blocker' : ''}${p.blocker && linked.length ? ' and ' : ''}${linked.length ? `${linked.length} open concern(s) linked to it` : ''}.` });
  }
  for (const t of ts) {
    if (t.status !== 'not-started' || !t.dueDate) continue;
    const left = -(daysBetween(t.dueDate, now) ?? -Infinity);
    if (left >= 0 && left <= DUE_SOON_DAYS) timelineThreats.push({ id: t.id, title: t.label, date: t.dueDate, daysLeft: left, sources: [t.id], why: `Due in ${left} day(s) on ${t.board} and not started.` });
  }
  for (const x of is) {
    if (x.status !== 'open' || !x.dueDate) continue;
    const left = -(daysBetween(x.dueDate, now) ?? -Infinity);
    if (left >= 0 && left <= DUE_SOON_DAYS) timelineThreats.push({ id: x.id, title: x.label, date: x.dueDate, daysLeft: left, sources: [x.id], why: `Incident (${x.category}) due in ${left} day(s) and not yet worked.` });
  }
  timelineThreats.sort((a, b) => a.daysLeft - b.daysLeft || (a.id < b.id ? -1 : 1));

  // 7. DECISIONS REQUIRED — the board's own column: an open row that names
  //    who must decide what.
  const decisionsRequired = cs
    .filter((c) => OPEN.has(c.status) && c.decisionRequired)
    .map((c) => ({ id: c.id, title: c.label, decision: c.decisionRequired.slice(0, 240), impact: c.impact.slice(0, 240), evidence: c.evidence.slice(0, 240), owner: c.owner, sources: [c.id], why: 'The row names a decision it is waiting on.' }));

  const counts = { risks: risks.length, dependencies: dependencies.length, ownershipGaps: ownershipGaps.length, escalations: escalations.length, patterns: patterns.length, timelineThreats: timelineThreats.length, decisionsRequired: decisionsRequired.length };
  return { ok: true, read: { concerns: cs.length, projects: ps.length, discussions: ds.length, boardTasks: ts.length, feedback: fs.length, incidents: is.length }, counts, risks, dependencies, ownershipGaps, escalations, patterns, timelineThreats, decisionsRequired };
}

// The chain a concern carries as database fields (0228), in the five-slot
// shape the Governance ledger renders. Empty = not recorded, said as such.
export function concernChain(c) {
  const x = conc(c || {});
  const slot = (heading, text) => (text ? { heading, text } : null);
  const out = {
    concern: slot('Concern', x.label),
    evidence: slot('Evidence', x.evidence),
    impact: slot('Impact', x.impact),
    decision: slot(x.decisionRequired ? 'Decision required' : 'Solution', x.decisionRequired || x.solution),
    outcome: slot('Outcome', x.outcome),
  };
  out.missing = ['concern', 'evidence', 'impact', 'decision', 'outcome'].filter((k) => !out[k]);
  out.complete = out.missing.length === 0;
  out.reReview = '';
  return out;
}
