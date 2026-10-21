// =============================================================================
// properties/development-cloud — the development project's records (DR-1166,
// migration 0307): the project, its budget lines, change orders, commercial
// bays, phase checks and capital, in the landlord instance. And its TEAM
// (DR-1175, migration 0308): who fills each of the sixteen roles.
// =============================================================================
// RLS is the wall (0307, inherited unchanged by 0308: owner, admin and member
// read; owner or admin write);
// these functions never widen it. Every call carries a timeout, so a dark
// network ends in a reason instead of a spinner. Never throws: every function
// returns { ok, ... } with an honest reason. Injectable client for tests.
// Money arrives and leaves in integer cents; the engine in development.js
// reads these rows in its own shape through `projectForEngine`.
// =============================================================================
import supabase from '../../lib/supabase.js';
import { getDoorsInstanceId } from '../../lib/table-sync.js';

const ok = (extra = {}) => ({ ok: true, ...extra });
const no = (reason, error) => ({ ok: false, reason, error: (error && error.message) || undefined });
const TIMEOUT_MS = 15000;
const withTimeout = (q) => (q && typeof q.abortSignal === 'function' && typeof AbortSignal !== 'undefined' && AbortSignal.timeout
  ? q.abortSignal(AbortSignal.timeout(TIMEOUT_MS)) : q);
const why = (e) => (e && (e.name === 'TimeoutError' || e.name === 'AbortError' || /abort|timed? ?out/i.test(e.message || ''))
  ? 'timed-out'
  : /dev_projects|dev_budget_lines|dev_team|relation .* does not exist/i.test((e && e.message) || '') ? 'not-enabled-yet' : 'failed');

// `dev_team` (DR-1175, migration 0308) is the sixth child: the PEOPLE, beside
// the five that count the building. It goes LAST, because `loadProject`
// destructures its reads in this order.
export const CHILD_TABLES = ['dev_budget_lines', 'dev_change_orders', 'dev_bays', 'dev_checks', 'dev_capital', 'dev_team'];

const userId = async (client) => {
  try { return (await client.auth.getUser()).data?.user?.id || null; } catch { return null; }
};

/** The landlord instance the projects live in (DR-0365). */
export async function developmentInstanceId() {
  try { return (await getDoorsInstanceId()) || null; } catch { return null; }
}

/** Every project in the instance, newest first. */
export async function loadProjects(instanceId, client = supabase) {
  if (!instanceId) return no('no-instance');
  try {
    const { data, error } = await withTimeout(client.from('dev_projects').select('*')
      .eq('instance_id', instanceId).order('created_at', { ascending: false }));
    if (error) return no(why(error), error);
    return ok({ projects: data || [] });
  } catch (e) { return no(why(e), e); }
}

/** One project and everything under it. */
export async function loadProject(projectId, client = supabase) {
  if (!projectId) return no('no-project');
  try {
    const reads = CHILD_TABLES.map((t) => withTimeout(client.from(t).select('*').eq('project_id', projectId)));
    const results = await Promise.all(reads);
    const bad = results.find((r) => r.error);
    if (bad) return no(why(bad.error), bad.error);
    const [lines, changeOrders, bays, checks, capital, team] = results.map((r) => r.data || []);
    return ok({ lines, changeOrders, bays, checks, capital, team });
  } catch (e) { return no(why(e), e); }
}

/** Start a project. */
export async function createProject(instanceId, fields, client = supabase) {
  if (!instanceId) return no('no-instance');
  if (!fields || !String(fields.name || '').trim()) return no('needs-a-name');
  try {
    const uid = await userId(client);
    if (!uid) return no('signed-out');
    const { data, error } = await withTimeout(client.from('dev_projects')
      .insert({ ...fields, instance_id: instanceId, created_by: uid }).select().single());
    if (error) return no(why(error), error);
    return ok({ project: data });
  } catch (e) { return no(why(e), e); }
}

export async function patchProject(id, patch, client = supabase) {
  try {
    const { data, error } = await withTimeout(client.from('dev_projects')
      .update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id).select().single());
    if (error) return no(why(error), error);
    return ok({ project: data });
  } catch (e) { return no(why(e), e); }
}

/** Add a row to one of the project's tables. */
export async function addRow(table, project, row, client = supabase) {
  if (!CHILD_TABLES.includes(table)) return no('unknown-table');
  if (!project || !project.id) return no('no-project');
  try {
    const extra = table === 'dev_change_orders' ? { created_by: await userId(client) } : {};
    const { data, error } = await withTimeout(client.from(table)
      .insert({ ...row, ...extra, project_id: project.id, instance_id: project.instance_id }).select().single());
    if (error) return no(why(error), error);
    return ok({ row: data });
  } catch (e) { return no(why(e), e); }
}

export async function patchRow(table, id, patch, client = supabase) {
  if (!CHILD_TABLES.includes(table)) return no('unknown-table');
  try {
    const { data, error } = await withTimeout(client.from(table).update(patch).eq('id', id).select().single());
    if (error) return no(why(error), error);
    return ok({ row: data });
  } catch (e) { return no(why(e), e); }
}

export async function deleteRow(table, id, client = supabase) {
  if (!CHILD_TABLES.includes(table)) return no('unknown-table');
  try {
    const { error } = await withTimeout(client.from(table).delete().eq('id', id));
    if (error) return no(why(error), error);
    return ok();
  } catch (e) { return no(why(e), e); }
}

/** Record a phase check: one row per project, phase and check. */
export async function setCheck(project, { phaseKey, checkKey, state, checkedOn, signedBy, note }, client = supabase) {
  if (!project || !project.id) return no('no-project');
  if (state !== 'pending' && !checkedOn) return no('needs-a-date');
  try {
    const { data, error } = await withTimeout(client.from('dev_checks').upsert({
      project_id: project.id, instance_id: project.instance_id, phase_key: phaseKey, check_key: checkKey,
      state, checked_on: checkedOn || null, signed_by: signedBy || null, note: note || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'project_id,phase_key,check_key' }).select().single());
    if (error) return no(why(error), error);
    return ok({ row: data });
  } catch (e) { return no(why(e), e); }
}

/**
 * Name whoever fills a role, or change what is written about them (DR-1175).
 * One row per project and role, so saving the same role twice replaces the
 * person rather than growing a second row the counts would both read.
 *
 * A blank name is REFUSED rather than written: the database's own check would
 * refuse it too, and an unnamed row would read as a filled role on every
 * surface that counts them. Clearing a role is `deleteRow('dev_team', id)` —
 * the role goes back to being a gap, which is the truth.
 */
export async function setTeamMember(project, { roleKey, label, name, company, phone, email, note, joinedOn } = {}, client = supabase) {
  if (!project || !project.id) return no('no-project');
  if (!String(roleKey || '').trim()) return no('needs-a-role');
  // Its own reason, NOT the project's `needs-a-name`: the two say different
  // things to a person and must not share one sentence.
  if (!String(name || '').trim()) return no('needs-a-person');
  try {
    const { data, error } = await withTimeout(client.from('dev_team').upsert({
      project_id: project.id, instance_id: project.instance_id,
      role_key: String(roleKey).trim(), label: label || null, name: String(name).trim(),
      company: company || null, phone: phone || null, email: email || null, note: note || null,
      joined_on: joinedOn || null, updated_at: new Date().toISOString(),
    }, { onConflict: 'project_id,role_key' }).select().single());
    if (error) return no(why(error), error);
    return ok({ row: data });
  } catch (e) { return no(why(e), e); }
}

/** The database rows in the engine's own shape (development.js). */
export function projectForEngine(project, { lines = [], changeOrders = [], bays = [], checks = [], capital = [], team = [] } = {}) {
  const results = {};
  for (const c of checks) {
    results[c.phase_key] = results[c.phase_key] || {};
    results[c.phase_key][c.check_key] = { state: c.state, date: c.checked_on, by: c.signed_by, note: c.note };
  }
  const bp = (v) => (v === null || v === undefined ? null : Number(v) / 100);
  // The team by role key, which is the shape `teamState` reads (DR-1175). A
  // role with no row is simply absent, so the gap stays a gap.
  const filled = {};
  for (const m of team) {
    filled[m.role_key] = {
      id: m.id, roleKey: m.role_key, label: m.label, name: m.name, company: m.company,
      phone: m.phone, email: m.email, note: m.note, joinedOn: m.joined_on,
    };
  }
  return {
    team: Object.values(filled),
    filled,
    kind: project.kind,
    hasElevator: !!project.has_elevator,
    lines: lines.map((l) => ({ id: l.id, kind: l.kind, group: l.grp, label: l.label, budgetCents: l.budget_cents, actualCents: l.actual_cents, done: !!l.done })),
    changeOrders: changeOrders.map((c) => ({ id: c.id, label: c.label, amountCents: c.amount_cents, source: c.source, status: c.status, decidedOn: c.decided_on })),
    bays: bays.map((b) => ({ id: b.id, name: b.name, sqFt: b.sq_ft, tenant: b.tenant, tiCents: b.ti_cents, tiDrawnCents: b.ti_drawn_cents })),
    results,
    capital: capital.map((c) => ({ id: c.id, kind: c.kind, name: c.name, amountCents: c.amount_cents, rateBp: c.rate_bp, shareBp: c.share_bp })),
    grossSqFt: project.gross_sq_ft,
    valuationInput: {
      units: project.units,
      grossSqFt: project.gross_sq_ft,
      residentialNoiCents: project.residential_noi_cents,
      residentialCapRatePct: bp(project.residential_cap_bp),
      commercialNoiCents: project.commercial_noi_cents,
      commercialCapRatePct: bp(project.commercial_cap_bp),
    },
  };
}
