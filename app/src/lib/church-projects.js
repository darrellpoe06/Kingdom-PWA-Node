// =============================================================================
// church-projects — a project/task board for the Love Corner (the church app)
// =============================================================================
// Darrell 2026-07-13: the Love Corner app needs its own Projects tab — a place
// for the church to MANAGE its initiatives (the video wall, bus ministry, the
// Assembly, the infrastructure plan, the branded door, outreach), the way the
// family business has Projects. This is that board, scoped to the church.
//
// The stage lens mirrors the family Projects hub's eternal-sequence
// (project-management.js: Research → Plan → Execute, then Done / Parked) so a
// steward who knows one knows the other — encoded here without the emoji glyphs
// (chrome uses UiIcon, never device emoji).
//
// REAL DATA, NOTHING PAINTED (DR-0061): progress + lane counts derive from real
// project records. The seed is the church's ACTUAL known initiatives at honest,
// steward-editable stages — not invented work. PURE + DETERMINISTIC (DR-0076):
// no localStorage / Date.now here; persistence lives in use-church-projects.js.
// =============================================================================

const asStr = (v) => (typeof v === 'string' ? v : '');
const asArr = (v) => (Array.isArray(v) ? v : []);
const rid = (p, seed) => `${p}-${asStr(seed) || Math.random().toString(36).slice(2, 9)}`;

// The stages, aligned 1:1 with the family hub's eternal-sequence.
export const STAGES = [
  { id: 'research', label: 'Research', working: true, blurb: 'Learn what’s true and what it would take.' },
  { id: 'plan', label: 'Plan', working: true, blurb: 'Shape the path — scope, sequence, who and when.' },
  { id: 'execute', label: 'Execute', working: true, blurb: 'Do the work — the build is running.' },
  { id: 'done', label: 'Done', working: false, terminal: true, blurb: 'Finished — kept for the record.' },
  { id: 'parked', label: 'Parked', working: false, terminal: true, blurb: 'Set down on purpose — waiting on something.' },
];
export const STAGE_IDS = STAGES.map((s) => s.id);
export const WORKING_STAGES = STAGES.filter((s) => s.working);
export const stageMeta = (id) => STAGES.find((s) => s.id === asStr(id)) || STAGES[0];

// Church project areas — the church's real work, grouped.
export const CHURCH_AREAS = [
  { id: 'worship-av', label: 'Worship & A/V', icon: 'monitor' },
  { id: 'ministries', label: 'Ministries', icon: 'heart' },
  { id: 'events', label: 'Events & Assembly', icon: 'calendar' },
  { id: 'facilities', label: 'Facilities & Infra', icon: 'tools' },
  { id: 'outreach', label: 'Community Outreach', icon: 'users' },
  { id: 'digital', label: 'Digital & App', icon: 'sparkle' },
  { id: 'other', label: 'Other', icon: 'book' },
];
export const churchArea = (id) => CHURCH_AREAS.find((a) => a.id === asStr(id)) || null;

export function makeProject(partial = {}, { now = '' } = {}) {
  const p = partial || {};
  return {
    id: asStr(p.id) || rid('cproj'),
    title: asStr(p.title),
    areaId: churchArea(p.areaId) ? p.areaId : 'other',
    stage: STAGE_IDS.includes(p.stage) ? p.stage : 'research',
    owner: asStr(p.owner),
    dueOn: asStr(p.dueOn) || null,
    notes: asStr(p.notes),
    createdIso: asStr(p.createdIso) || asStr(now) || null,
  };
}

export function validateProject(partial) {
  if (!asStr(partial && partial.title).trim()) return { ok: false, error: 'A project title is required.' };
  return { ok: true };
}

// ── derivations (real records) ───────────────────────────────────────────────
export function projectsByStage(projects) {
  const byStage = {};
  for (const s of STAGE_IDS) byStage[s] = [];
  for (const p of asArr(projects)) (byStage[p.stage] || byStage.research).push(p);
  return byStage;
}

export function projectStats(projects) {
  const list = asArr(projects);
  const byArea = {};
  for (const p of list) byArea[p.areaId] = (byArea[p.areaId] || 0) + 1;
  const done = list.filter((p) => p.stage === 'done').length;
  const active = list.filter((p) => stageMeta(p.stage).working).length;
  return {
    total: list.length,
    active,
    done,
    parked: list.filter((p) => p.stage === 'parked').length,
    byArea,
    pctDone: list.length > 0 ? Math.round((done / list.length) * 100) : 0,
  };
}

// Projects with a due date on/before `now` that aren't done/parked — overdue.
export function overdueProjects(projects, nowIso) {
  const n = Date.parse(asStr(nowIso));
  return asArr(projects).filter((p) => {
    if (!p.dueOn || !stageMeta(p.stage).working) return false;
    const t = Date.parse(p.dueOn);
    return Number.isFinite(t) && Number.isFinite(n) && t <= n;
  });
}

// Advance a project one working stage (research → plan → execute → done).
export function nextStage(stage) {
  const order = ['research', 'plan', 'execute', 'done'];
  const i = order.indexOf(asStr(stage));
  if (i < 0 || i >= order.length - 1) return 'done';
  return order[i + 1];
}

// ---------------------------------------------------------------------------
// Seed — the church's REAL known initiatives at honest, steward-editable stages
// (not invented work). Stages reflect what the codebase already shows in flight;
// the steward corrects any that have moved. `seed-` ids for cloud-upload filtering.
// ---------------------------------------------------------------------------
export const SEED_PROJECTS = [
  makeProject({ id: 'seed-cproj-videowall', title: 'Sanctuary LED video wall', areaId: 'worship-av', stage: 'execute', owner: 'A/V team', notes: 'Wall + NDI/CUDA media pipeline; install underway.', createdIso: '2026-06-22T00:00:00.000Z' }),
  makeProject({ id: 'seed-cproj-assembly', title: '77th National Assembly', areaId: 'events', stage: 'execute', owner: 'Conference team', dueOn: '2026-07-15T00:00:00.000Z', notes: 'Program transcribed in the Event Center; runs Jul 15–16.', createdIso: '2026-07-10T00:00:00.000Z' }),
  makeProject({ id: 'seed-cproj-bus', title: 'Bus / Van Ministry', areaId: 'ministries', stage: 'execute', owner: 'Ministry lead', notes: 'Routes + riders; shipped to the app.', createdIso: '2026-07-12T00:00:00.000Z' }),
  makeProject({ id: 'seed-cproj-infra', title: 'Church infrastructure plan', areaId: 'facilities', stage: 'plan', owner: 'IT / facilities', notes: 'Network, devices, and the media/AI node plan.', createdIso: '2026-06-23T00:00:00.000Z' }),
  makeProject({ id: 'seed-cproj-lovecorner', title: 'Love Corner branded door', areaId: 'digital', stage: 'plan', owner: 'PoeTech', notes: 'The church’s own-named install; opens publicly pending Bishop Gwin + Governor sign-off.', createdIso: '2026-07-11T00:00:00.000Z' }),
  makeProject({ id: 'seed-cproj-outreach', title: 'Community outreach', areaId: 'outreach', stage: 'research', owner: 'Outreach ministry', notes: 'Who the church can serve and reach next.', createdIso: '2026-07-13T00:00:00.000Z' }),
];

export function mergeSeed(userRows, seeds) {
  const byId = new Map();
  for (const s of asArr(seeds)) if (s && s.id) byId.set(s.id, s);
  for (const u of asArr(userRows)) if (u && u.id) byId.set(u.id, u);
  return Array.from(byId.values());
}
export const isSeedId = (id) => typeof id === 'string' && id.startsWith('seed-');
