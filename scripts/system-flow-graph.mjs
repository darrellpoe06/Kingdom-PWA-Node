// =============================================================================
// system-flow-graph — the WHOLE-SYSTEM flow graph and the gates that keep it
// whole (DR-0622: end to end means continuous; the live data is the proof).
// =============================================================================
// Darrell, 2026-09-24: "All workflows will work, will flow into another
// workflow and all those will have a comprehensive overall solid sound
// workflow ... The data should be the proof of the end, whole end to end
// process ... and that data should seed the next process."
//
// The interconnect manifest (interconnect-manifest.mjs) proved isolated PAIRS
// by file wiring. This module proves the WHOLE: every workflow, NAS rider and
// app surface declares what it READS, what it WRITES, and which node its output
// SEEDS next (scripts/system-flow-registry.mjs). From those declarations it
// derives every connection (a writer and a reader of the same resource), and it
// fails the build on:
//
//   dead-end   — a resource someone writes and no one reads, unless it is a
//                declared SINK with a stated reason;
//   orphan     — a resource someone reads and no one writes, unless it is a
//                declared SOURCE (an outside origin) with a stated reason;
//   no-table   — a db: resource whose table no migration creates, or a proof
//                column no migration declares;
//   no-wiring  — a declared read/write whose file does not carry the token
//                (the consumer does not actually read the table);
//   unseeded   — a declared `seeds` target that shares no resource with it;
//   uncovered  — a workflow file, NAS rider/loop, or a table created after the
//                baseline, with no declared place in the graph;
//   no-route   — an app↔NAS connection over a same-origin route the NAS's
//                public Funnel does not actually mount (infra/nas-transport/
//                RECORDED-STATE.md): wired in the code, reaching nothing;
//   open-loop  — a declared continuous loop that does not close, unless it
//                carries a named blocker AND a re-review date.
//
// The static graph is baked into the app through the interconnect manifest;
// the LIVE numbers (count written, newest row, count consumed downstream) are
// measured every 6 hours by .github/workflows/system-flow-proof.yml into the
// system_flow_proof table (migration 0234), which the app reads.
//
// Every check is a pure function of injectable inputs, so the vitest can plant
// each break and REQUIRE a finding (DR-0076 proven-to-catch).
// =============================================================================
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WF_DIR = join(ROOT, '.github', 'workflows');
const MIG_DIRS = [join(ROOT, 'infra/supabase'), join(ROOT, 'infra/supabase/migrations-auto')];

// --- the schema, read from the migrations ------------------------------------
// Union of every column any migration declares for a table (CREATE TABLE body
// + ALTER TABLE ... ADD COLUMN). A union is deliberately generous: the live
// proof run is the second, stricter witness — a column that is declared here
// but absent live makes that measurement fail loudly, never read as fresh.
export function parseSchema(sqlTexts) {
  const tables = new Map();
  const add = (t, c) => {
    const k = t.toLowerCase();
    if (!tables.has(k)) tables.set(k, new Set());
    if (c) tables.get(k).add(c.toLowerCase());
  };
  for (const sql of sqlTexts) {
    const text = String(sql).replace(/--[^\n]*/g, '');
    const create = /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?"?([a-z_0-9]+|%I)"?\s*\(/gi;
    let m;
    while ((m = create.exec(text))) {
      // A loop-generated table (`FOREACH t IN ARRAY ARRAY['a','b'] ... CREATE
      // TABLE %I`, migration 0077) is every name in the nearest ARRAY before it.
      let names = [m[1]];
      if (m[1] === '%I') {
        const before = text.slice(Math.max(0, m.index - 1200), m.index);
        const arrs = [...before.matchAll(/array\s*\[([^\]]+)\]/gi)];
        names = arrs.length ? [...arrs[arrs.length - 1][1].matchAll(/'([a-z_0-9]+)'/gi)].map((x) => x[1]) : [];
      }
      // Walk to the matching close paren of the column list.
      let depth = 1; let i = create.lastIndex; const start = i;
      while (i < text.length && depth > 0) { if (text[i] === '(') depth++; else if (text[i] === ')') depth--; i++; }
      const body = text.slice(start, i - 1);
      for (const table of names) add(table, null);
      let d = 0; let cur = '';
      const parts = [];
      for (const ch of body) {
        if (ch === '(') d++;
        if (ch === ')') d--;
        if (ch === ',' && d === 0) { parts.push(cur); cur = ''; } else cur += ch;
      }
      parts.push(cur);
      for (const p of parts) {
        const col = p.trim().match(/^"?([a-z_][a-z_0-9]*)"?\s+/i);
        if (!col) continue;
        if (/^(constraint|primary|unique|foreign|check|exclude|like)$/i.test(col[1])) continue;
        for (const table of names) add(table, col[1]);
      }
    }
    const alter = /alter\s+table\s+(?:if\s+exists\s+)?(?:only\s+)?(?:public\.)?"?([a-z_0-9]+)"?([\s\S]*?);/gi;
    while ((m = alter.exec(text))) {
      for (const c of m[2].matchAll(/add\s+column\s+(?:if\s+not\s+exists\s+)?"?([a-z_][a-z_0-9]*)"?/gi)) add(m[1], c[1]);
    }
  }
  return tables;
}

// The migration lane creates its own ledger table (scripts/db-migrate-apply.sh).
const SCHEMA_EXTRA = ['scripts/db-migrate-apply.sh', 'infra/nas-supabase/replay_migrations.sh'];
export function readSchema() {
  const texts = [];
  for (const p of SCHEMA_EXTRA) if (existsSync(join(ROOT, p))) texts.push(readFileSync(join(ROOT, p), 'utf8'));
  for (const dir of MIG_DIRS) {
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.sql')).sort()) texts.push(readFileSync(join(dir, f), 'utf8'));
  }
  return parseSchema(texts);
}

// Tables created per migration file, so the coverage gate can tell a table
// born AFTER the baseline from a legacy one.
export function tablesByMigration() {
  const out = [];
  const dir = join(ROOT, 'infra/supabase/migrations-auto');
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.sql')).sort()) {
    const s = parseSchema([readFileSync(join(dir, f), 'utf8')]);
    for (const t of s.keys()) out.push({ file: f, table: t });
  }
  return out;
}

export function listWorkflows() {
  return existsSync(WF_DIR) ? readdirSync(WF_DIR).filter((f) => /\.ya?ml$/.test(f)).sort() : [];
}

export function listNasRiders() {
  const out = [];
  try {
    const s = JSON.parse(readFileSync(join(ROOT, 'infra/nas-loops/services.json'), 'utf8'));
    for (const x of s.services || []) out.push(`service:${x.name}`);
  } catch { /* absent file = no riders declared */ }
  try {
    const r = JSON.parse(readFileSync(join(ROOT, 'infra/nas-loops/registry.json'), 'utf8'));
    for (const x of r.loops || []) out.push(`loop:${x.name}`);
  } catch { /* absent file = no loops declared */ }
  return out;
}

// --- resources ---------------------------------------------------------------
export const resTable = (res) => (String(res).startsWith('db:') ? String(res).slice(3).split('#')[0] : null);
export const resFacet = (res) => (String(res).includes('#') ? String(res).split('#')[1] : null);

// --- derive the graph from the declarations ----------------------------------
export function deriveGraph(registry) {
  const { nodes, resources } = registry;
  const writers = new Map(); const readers = new Map();
  const push = (m, k, v) => { if (!m.has(k)) m.set(k, []); m.get(k).push(v); };
  for (const n of nodes) {
    for (const w of n.writes || []) push(writers, w.res, n.id);
    for (const r of n.reads || []) push(readers, r.res, n.id);
  }
  const edges = [];
  for (const [res, ws] of writers) {
    for (const from of ws) for (const to of readers.get(res) || []) {
      if (from === to) continue;
      edges.push({ id: `${from}>${to}:${res}`, from, to, res });
    }
  }
  const all = new Set([...writers.keys(), ...readers.keys(), ...Object.keys(resources || {})]);
  return { writers, readers, edges, resources: [...all].sort() };
}

// Strongly connected components (Tarjan) over the node graph: every cycle the
// data actually runs in.
export function findCycles(nodes, edges) {
  const adj = new Map(nodes.map((n) => [n.id, new Set()]));
  for (const e of edges) if (adj.has(e.from)) adj.get(e.from).add(e.to);
  let index = 0; const idx = new Map(); const low = new Map(); const on = new Set(); const stack = []; const out = [];
  const strong = (v) => {
    idx.set(v, index); low.set(v, index); index++; stack.push(v); on.add(v);
    for (const w of adj.get(v) || []) {
      if (!idx.has(w)) { strong(w); low.set(v, Math.min(low.get(v), low.get(w))); } else if (on.has(w)) low.set(v, Math.min(low.get(v), idx.get(w)));
    }
    if (low.get(v) === idx.get(v)) {
      const comp = []; let w;
      do { w = stack.pop(); on.delete(w); comp.push(w); } while (w !== v);
      if (comp.length > 1) out.push(comp.sort());
    }
  };
  for (const n of nodes) if (!idx.has(n.id)) strong(n.id);
  return out;
}

// --- the gates ---------------------------------------------------------------
// ctx is injectable so the tests can plant each break:
//   { schema: Map, fileText(path) -> string|null, workflows: [], riders: [],
//     newTables: [{file, table}], baseline: {tables: []} }
export function checkGraph(registry, ctx) {
  const findings = [];
  const f = (gate, id, message) => findings.push({ gate, id, message });
  const { nodes, resources = {}, loops = [] } = registry;
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const g = deriveGraph(registry);

  // duplicate ids
  const seen = new Set();
  for (const n of nodes) { if (seen.has(n.id)) f('duplicate', n.id, `node id "${n.id}" is declared twice`); seen.add(n.id); }

  // A gap being fixed passes only with a named blocker AND a dated re-review.
  const openOk = (o) => !!(o && String(o.blocker || '').trim() && /^\d{4}-\d{2}-\d{2}$/.test(String(o.reReview || '')));
  for (const [res, meta] of Object.entries(resources)) {
    if (meta.open && !openOk(meta.open)) f('open-gap', res, `${res} is marked open without a named blocker and a re-review date`);
  }

  // dead ends + orphans
  for (const res of g.resources) {
    const meta = resources[res] || {};
    const w = g.writers.get(res) || []; const r = g.readers.get(res) || [];
    const excused = openOk(meta.open);
    if (w.length && !r.length && !meta.sink && !excused) f('dead-end', res, `${res} is written by ${w.join(', ')} and read by no one — wire a consumer, or declare it a sink with the reason`);
    if (r.length && !w.length && !meta.source && !excused) f('orphan', res, `${res} is read by ${r.join(', ')} and written by no one — wire a producer, or declare its outside source with the reason`);
    if (w.length && meta.source) f('orphan', res, `${res} is declared an outside source but ${w.join(', ')} writes it — remove the source note`);
    if (!w.length && !r.length) f('dead-end', res, `${res} is declared but no node reads or writes it`);
    if (meta.sink && !String(meta.sink).trim()) f('dead-end', res, `${res} is a sink with no stated reason`);
    if (meta.source && !String(meta.source).trim()) f('orphan', res, `${res} is a source with no stated reason`);
  }

  // tables + proof columns exist in the migrations
  for (const res of g.resources) {
    const t = resTable(res);
    if (!t) continue;
    if (!ctx.schema.has(t)) { f('no-table', res, `${res}: no migration creates table "${t}"`); continue; }
    const p = (resources[res] || {}).proof;
    if (p && p.ts && !ctx.schema.get(t).has(String(p.ts).toLowerCase())) f('no-table', res, `${res}: proof column "${p.ts}" is declared by no migration for "${t}"`);
  }

  // the declared wiring is really in the file
  for (const n of nodes) {
    if (!n.file || ctx.fileText(n.file) == null) f('no-wiring', n.id, `${n.id}: anchor file ${n.file || '(none)'} does not exist`);
    for (const [kind, list] of [['reads', n.reads || []], ['writes', n.writes || []]]) {
      for (const x of list) {
        const file = x.file || n.file;
        const token = x.token || resTable(x.res) || x.res.split(':').slice(1).join(':');
        const text = ctx.fileText(file);
        if (text == null) f('no-wiring', n.id, `${n.id} ${kind} ${x.res}: file ${file} does not exist`);
        else if (!text.includes(token)) f('no-wiring', n.id, `${n.id} ${kind} ${x.res}: "${token}" is not in ${file} (the declared ${kind === 'reads' ? 'consumer does not read' : 'producer does not write'} it)`);
      }
    }
  }

  // every seed is backed by a shared resource
  for (const n of nodes) {
    for (const s of n.seeds || []) {
      if (!byId.has(s)) { f('unseeded', n.id, `${n.id} seeds "${s}", which is not a node`); continue; }
      if (!g.edges.some((e) => e.from === n.id && e.to === s)) f('unseeded', n.id, `${n.id} says it seeds ${s}, but ${s} reads nothing ${n.id} writes`);
    }
    const out = g.edges.filter((e) => e.from === n.id);
    if ((n.writes || []).length && !out.length && !(n.writes || []).every((w) => (resources[w.res] || {}).sink)) {
      // covered by dead-end already when nobody reads; nothing extra here
    }
  }

  // coverage: every workflow file, NAS rider and new table has a place
  const coveredWf = new Set(nodes.map((n) => n.workflow).filter(Boolean));
  for (const w of ctx.workflows) if (!coveredWf.has(w)) f('uncovered', w, `workflow ${w} has no declared place in the flow graph (reads, writes, what it seeds)`);
  for (const w of coveredWf) if (!ctx.workflows.includes(w)) f('uncovered', w, `node declares workflow ${w}, which does not exist`);
  const coveredRider = new Set(nodes.map((n) => n.rider).filter(Boolean));
  for (const r of ctx.riders) if (!coveredRider.has(r)) f('uncovered', r, `NAS ${r} has no declared place in the flow graph`);
  for (const r of coveredRider) if (!ctx.riders.includes(r)) f('uncovered', r, `node declares NAS ${r}, which is not in services.json / registry.json`);
  const declaredTables = new Set(g.resources.map(resTable).filter(Boolean));
  const baseline = new Set((ctx.baseline && ctx.baseline.tables) || []);
  for (const { file, table } of ctx.newTables || []) {
    if (!declaredTables.has(table) && !baseline.has(table)) f('uncovered', `db:${table}`, `table ${table} (born in ${file}) has no declared place in the flow graph`);
  }
  for (const t of baseline) if (declaredTables.has(t)) f('uncovered', `db:${t}`, `table ${t} is now in the graph — remove it from the baseline so the list only shrinks`);

  // every NAS route a connection rides is really mounted on the Funnel
  if (ctx.mountedRoutes) {
    for (const res of g.resources) {
      const route = (resources[res] || {}).route;
      if (!route) continue;
      if (!ctx.mountedRoutes.includes(route) && !openOk((resources[res] || {}).open)) {
        f('no-route', res, `${res} rides ${route}, which the NAS's public Funnel does not mount (infra/nas-transport/RECORDED-STATE.md) — the connection reaches nothing`);
      }
    }
  }

  // declared continuous loops close, or carry a named blocker + date
  for (const l of loops) {
    const path = l.path || [];
    const gaps = [];
    for (let i = 0; i < path.length; i++) {
      const a = path[i]; const b = path[(i + 1) % path.length];
      if (!byId.has(a)) { gaps.push(`${a} is not a node`); continue; }
      if (!g.edges.some((e) => e.from === a && e.to === b)) gaps.push(`${a} → ${b}`);
    }
    if (gaps.length && !(l.open && l.open.blocker && /^\d{4}-\d{2}-\d{2}$/.test(String(l.open.reReview || '')))) {
      f('open-loop', l.id, `loop "${l.name}" does not close (${gaps.join('; ')}) and names no blocker with a re-review date`);
    }
  }
  return findings;
}

// Loop closure state for display (the same walk as the gate, never a claim).
export function loopState(registry) {
  const g = deriveGraph(registry);
  const byId = new Set(registry.nodes.map((n) => n.id));
  return (registry.loops || []).map((l) => {
    const steps = (l.path || []).map((a, i, p) => {
      const b = p[(i + 1) % p.length];
      const via = g.edges.filter((e) => e.from === a && e.to === b).map((e) => e.res);
      return { from: a, to: b, via, connected: byId.has(a) && via.length > 0 };
    });
    return { id: l.id, name: l.name, closed: steps.every((s) => s.connected), steps, open: l.open || null };
  });
}

// --- the live proof SQL --------------------------------------------------------
// One DO block: each measurement runs in its own sub-transaction, so a bad
// column or a missing table records its error and never blanks the rest
// (unknown is never green — DR-0076). Reads product tables only; writes only
// its own proof rows. Old runs past 30 days are pruned from the proof table.
const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
export function buildProofSql(registry, runId) {
  const lines = [];
  for (const [res, meta] of Object.entries(registry.resources || {})) {
    const t = resTable(res);
    if (!t || !meta.proof) continue;
    const p = meta.proof;
    const where = p.where ? `WHERE ${p.where}` : '';
    const andWhere = (x) => (p.where ? `WHERE (${p.where}) AND (${x})` : `WHERE ${x}`);
    const newest = p.ts ? `max(${p.ts})` : 'NULL::timestamptz';
    const consumed = p.consumed ? `(SELECT count(*) FROM public.${t} ${andWhere(p.consumed)})` : 'NULL::bigint';
    const sql = `SELECT count(*), ${newest}, ${consumed} FROM public.${t} ${where}`;
    lines.push(`  BEGIN
    EXECUTE ${q(sql)} INTO w, n, c;
    INSERT INTO public.system_flow_proof (run_id, resource, written, newest_at, consumed) VALUES (${q(runId)}, ${q(res)}, w, n, c);
  EXCEPTION WHEN others THEN
    INSERT INTO public.system_flow_proof (run_id, resource, error) VALUES (${q(runId)}, ${q(res)}, left(SQLERRM, 300));
  END;`);
  }
  return `DO $flow$
DECLARE w bigint; n timestamptz; c bigint;
BEGIN
${lines.join('\n')}
  DELETE FROM public.system_flow_proof WHERE measured_at < now() - interval '30 days';
END $flow$;
SELECT resource, coalesce(written::text,''), coalesce(to_char(newest_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"'),''), coalesce(consumed::text,''), coalesce(error,''), coalesce(replace(note, '|', '/'),'')
  FROM public.system_flow_proof WHERE run_id = ${q(runId)} ORDER BY resource;`;
}

// --- verdicts (shared with the app: app/src/lib/system-flow.js mirrors this) --

// How often a workflow is expected to have run, from its own schedule: a
// daily-or-faster cron → 2 days; a weekly cron → 8; a monthly one → 32; no
// schedule (dispatch / push / PR only) → null, "runs when asked".
// A schedule commented out is not a schedule (measured 2026-09-25, run
// 36077477281: transcript-backfill and ari-comprehensive-review both carry a
// "#   - cron:" line and were judged as stopped witnesses).
export function liveYaml(yamlText) {
  return String(yamlText || '').split('\n').filter((l) => !/^\s*#/.test(l)).join('\n');
}

export function cronFreshDays(yamlText) {
  const crons = [...liveYaml(yamlText).matchAll(/cron:\s*['"]([^'"]+)['"]/g)].map((m) => m[1].trim().split(/\s+/));
  if (!crons.length) return null;
  let best = null;
  for (const c of crons) {
    const [, , dom = '*', , dow = '*'] = c;
    const d = dom !== '*' && !dom.startsWith('*/') ? 32 : dow !== '*' ? 8 : 2;
    best = best == null ? d : Math.min(best, d);
  }
  return best;
}

// The one verdict, shared with the app so the runner and the screen agree.
export { resourceVerdict } from '../app/src/lib/system-flow.js';

// Each resource's meta as the verdict reads it: the declared meta, plus, for a
// workflow's run, the freshness its own schedule implies.
export function resourceMetas(registry, fileText) {
  const out = {};
  for (const [k, v] of Object.entries(registry.resources || {})) out[k] = v;
  for (const n of registry.nodes) {
    if (!n.workflow) continue;
    out[`gh:run:${n.workflow}`] = { label: `${n.name} — its latest run`, run: { fresh: cronFreshDays(fileText(n.file)) } };
  }
  return out;
}

// --- assemble for the app + the CLI ------------------------------------------
// The routes the public Funnel mounts: the table rows of RECORDED-STATE.md
// above its UNACTUATED ledger.
export function parseMountedRoutes(md) {
  const text = String(md || '');
  const head = text.split(/^## UNACTUATED/m)[0];
  return [...head.matchAll(/^\|\s*`(\/[a-z0-9-]+)`\s*\|/gim)].map((m) => m[1]);
}

export function realContext() {
  const cache = new Map();
  const fileText = (p) => {
    if (cache.has(p)) return cache.get(p);
    const abs = join(ROOT, p);
    const v = existsSync(abs) ? readFileSync(abs, 'utf8') : null;
    cache.set(p, v);
    return v;
  };
  let baseline = { tables: [] };
  try { baseline = JSON.parse(readFileSync(join(ROOT, 'scripts/system-flow-baseline.json'), 'utf8')); } catch { /* none */ }
  const BORN_AFTER = baseline.after || '0233';
  const newTables = tablesByMigration().filter((x) => x.file.slice(0, 4) > BORN_AFTER);
  const mountedRoutes = parseMountedRoutes(fileText('infra/nas-transport/RECORDED-STATE.md'));
  return { schema: readSchema(), fileText, workflows: listWorkflows(), riders: listNasRiders(), newTables, baseline, mountedRoutes };
}

export function buildFlowGraph(registry, ctx = realContext()) {
  const g = deriveGraph(registry);
  const findings = checkGraph(registry, ctx);
  const loops = loopState(registry);
  const cycles = findCycles(registry.nodes, g.edges);
  const declaredTables = new Set(g.resources.map(resTable).filter(Boolean));
  const metas = resourceMetas(registry, ctx.fileText);
  return {
    ok: findings.length === 0,
    nodes: registry.nodes.map((n) => ({ id: n.id, name: n.name, kind: n.kind, file: n.file, workflow: n.workflow || null, rider: n.rider || null, reads: (n.reads || []).map((r) => r.res), writes: (n.writes || []).map((w) => w.res), seeds: n.seeds || [], purpose: n.purpose || '' })),
    edges: g.edges,
    resources: g.resources.map((res) => {
      const m = metas[res] || {};
      const run = res.startsWith('gh:run:');
      return {
        id: res, label: m.label || res, sink: m.sink || null, source: m.source || null,
        open: m.open || null,
        fresh: run ? (m.run ? m.run.fresh : null) : ((m.proof && m.proof.fresh) || null),
        measured: run || !!(m.proof && resTable(res)),
        writers: g.writers.get(res) || [], readers: g.readers.get(res) || [],
      };
    }),
    loops,
    cycles,
    chains: registry.chains || [],
    findings,
    summary: {
      nodes: registry.nodes.length,
      edges: g.edges.length,
      resources: g.resources.length,
      measured: g.resources.filter((r) => r.startsWith('gh:run:') || (((registry.resources || {})[r] || {}).proof && resTable(r))).length,
      loopsClosed: loops.filter((l) => l.closed).length,
      loops: loops.length,
      cycles: cycles.length,
      workflows: ctx.workflows.length,
      riders: ctx.riders.length,
      tablesInGraph: declaredTables.size,
      tablesInSchema: ctx.schema.size,
      // Legacy tables no flow declares yet — shown as a number, never green.
      tablesAwaitingPlace: [...ctx.schema.keys()].filter((t) => !declaredTables.has(t)).length,
      findings: findings.length,
    },
  };
}
