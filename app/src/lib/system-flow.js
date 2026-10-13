// =============================================================================
// system-flow — the whole-system flow graph, read with its LIVE numbers
// (DR-0622: end to end means continuous; the live data is the proof)
// =============================================================================
// The graph's structure (every workflow, NAS rider and surface, what each
// reads, writes and seeds) is file-verified at build and baked into the
// interconnect manifest (__INTERCONNECT_LOOPS__.graph). The numbers are real
// rows: every 6 hours .github/workflows/system-flow-proof.yml measures each
// connection on the live database and each workflow's latest run into
// system_flow_proof (migration 0234; governors read it).
//
// This module is PURE except fetchFlowProof, which takes the Supabase client
// as an argument. It is also the one verdict the build-side scripts use
// (scripts/system-flow-graph.mjs re-exports resourceVerdict), so the runner's
// summary and the app can never disagree. Unknown is never green (DR-0076).
// =============================================================================

export const DAY_MS = 86400000;

// The states a connection can be in, in the words a non-engineer reads.
export const FLOW_STATES = Object.freeze({
  flowing: { tone: 'good', label: 'flowing' },
  stale: { tone: 'attention', label: 'gone quiet' },
  unconsumed: { tone: 'attention', label: 'waiting to be picked up' },
  empty: { tone: 'attention', label: 'nothing written yet' },
  broken: { tone: 'problem', label: 'broken' },
  open: { tone: 'problem', label: 'open — being fixed' },
  off: { tone: 'idle', label: 'switched off' },
  unknown: { tone: 'idle', label: 'not measured yet' },
});

/**
 * The verdict for one resource's latest reading.
 * meta: { proof: { ts, fresh, consumed }, run: { fresh } } — row: a
 * system_flow_proof row. Returns { state, say, age }.
 */
export function resourceVerdict(meta, row, nowMs) {
  if (!row) return { state: 'unknown', say: 'not measured yet — no live reading on record' };
  if (String(row.resource || '').startsWith('gh:run:')) {
    if (row.written == null || Number.isNaN(Number(row.written))) return { state: 'unknown', say: `its runs could not be read${row.note ? ` (${row.note})` : ''}` };
    if (Number(row.written) === 0) return { state: 'empty', say: 'it has never run' };
    if (String(row.note || '').startsWith('off')) return { state: 'off', say: 'switched off by its stop-path: its recent fires were all skipped' };
    const t = row.newest_at ? Date.parse(row.newest_at) : NaN;
    const age = Number.isFinite(t) ? Math.floor((nowMs - t) / DAY_MS) : null;
    if (row.consumed != null && row.consumed !== '' && Number(row.consumed) === 0) return { state: 'broken', say: `its last run did not succeed${row.note ? ` (${String(row.note).split(' ')[0]})` : ''}`, age };
    const fresh = meta && meta.run ? meta.run.fresh : null;
    if (fresh != null && age != null && age > fresh) return { state: 'stale', say: `its schedule stopped: last run ${age} days ago (expected within ${fresh})`, age };
    return { state: 'flowing', say: fresh == null ? 'its last run succeeded (it runs when asked)' : 'its last run succeeded, on schedule', age };
  }
  if (row.error) return { state: 'unknown', say: `the measurement failed: ${row.error}` };
  const written = Number(row.written);
  if (row.written == null || !Number.isFinite(written)) return { state: 'unknown', say: 'no count came back' };
  if (written === 0) return { state: 'empty', say: 'nothing has ever been written here' };
  const proof = (meta && meta.proof) || {};
  const fresh = proof.fresh || (meta && meta.fresh) || 30;
  const newest = row.newest_at ? Date.parse(row.newest_at) : NaN;
  if ((proof.ts || (meta && meta.measured)) && !Number.isFinite(newest)) return { state: 'unknown', say: 'rows exist but carry no date' };
  const age = Number.isFinite(newest) ? Math.floor((nowMs - newest) / DAY_MS) : null;
  if (age != null && age > fresh) return { state: 'stale', say: `nothing new for ${age} days (expected within ${fresh})`, age };
  if (row.consumed != null && row.consumed !== '' && Number(row.consumed) === 0) return { state: 'unconsumed', say: `${written} written, none picked up downstream yet`, age };
  return { state: 'flowing', say: 'fresh rows, and picked up downstream', age };
}

/** Normalize the baked graph (the `graph` field of the interconnect manifest). */
export function normalizeGraph(raw) {
  const g = raw && typeof raw === 'object' ? raw : {};
  const arr = (x) => (Array.isArray(x) ? x : []);
  return {
    ok: arr(g.nodes).length > 0,
    nodes: arr(g.nodes),
    edges: arr(g.edges),
    resources: arr(g.resources),
    loops: arr(g.loops),
    chains: arr(g.chains),
    findings: arr(g.findings),
    summary: g.summary || {},
  };
}

/** The latest proof run: { ok, runId, measuredAt, rows: {resource: row}, reason }. */
export async function fetchFlowProof({ supabase, limit = 600 } = {}) {
  try {
    const { data, error } = await supabase
      .from('system_flow_proof')
      .select('run_id, measured_at, resource, written, newest_at, consumed, note, error')
      .order('measured_at', { ascending: false })
      .limit(limit);
    if (error) return { ok: false, runId: null, measuredAt: null, rows: {}, reason: error.message };
    const list = Array.isArray(data) ? data : [];
    if (!list.length) return { ok: false, runId: null, measuredAt: null, rows: {}, reason: 'no proof run on record yet' };
    const runId = list[0].run_id;
    const rows = {};
    let measuredAt = list[0].measured_at;
    for (const r of list) {
      if (r.run_id !== runId) continue;
      rows[r.resource] = r;
      if (r.measured_at < measuredAt) measuredAt = r.measured_at;
    }
    return { ok: true, runId, measuredAt, rows, reason: '' };
  } catch (e) {
    return { ok: false, runId: null, measuredAt: null, rows: {}, reason: e?.message || 'unknown' };
  }
}

/** Age of a timestamp in plain words. */
export function ageWords(iso, nowMs) {
  const t = iso ? Date.parse(iso) : NaN;
  if (!Number.isFinite(t)) return 'no date';
  const mins = Math.max(0, Math.round((nowMs - t) / 60000));
  if (mins < 60) return `${mins} min ago`;
  const h = Math.round(mins / 60);
  if (h < 48) return `${h} h ago`;
  return `${Math.round(h / 24)} days ago`;
}

/**
 * Every connection with its verdict. A connection is one writer → reader of
 * one resource; its numbers are the resource's latest reading. A resource
 * marked open (being fixed) reads `open` whatever its numbers say, and a
 * connection that is not table- or run-backed reads `unknown` — the wiring is
 * proven at build, but no live number exists for it (never green).
 */
// The verdict's meta for a baked graph resource.
export const metaFor = (r) => (String(r.id || '').startsWith('gh:run:') ? { run: { fresh: r.fresh ?? null } } : { fresh: r.fresh, measured: true });

export function connectionStates(graph, proof, nowMs) {
  const byRes = new Map(graph.resources.map((r) => [r.id, r]));
  const rows = (proof && proof.rows) || {};
  return graph.edges.map((e) => {
    const meta = byRes.get(e.res) || {};
    const row = rows[e.res] || null;
    let v;
    if (meta.open) v = { state: 'open', say: meta.open.blocker, age: null };
    else if (!meta.measured) v = { state: 'unknown', say: 'wired in the code; this carrier has no live number to read', age: null };
    else v = resourceVerdict(metaFor(meta), row ? { ...row, resource: e.res } : null, nowMs);
    return { ...e, label: meta.label || e.res, row, ...v };
  });
}

/** Headline counts over connections: { total, flowing, attention, problem, unknown }. */
export function flowTally(states) {
  const t = { total: states.length, flowing: 0, attention: 0, problem: 0, unknown: 0 };
  for (const s of states) {
    const tone = (FLOW_STATES[s.state] || FLOW_STATES.unknown).tone;
    if (tone === 'good') t.flowing += 1;
    else if (tone === 'attention') t.attention += 1;
    else if (tone === 'problem') t.problem += 1;
    else t.unknown += 1;
  }
  return t;
}

/**
 * The flow proof as ESCALATIONS for the Decision Intelligence board: every
 * resource that is broken, stale, empty, unconsumed or open becomes one item
 * that names where it comes from and says why in one sentence. Resources, not
 * edges, so one quiet table is one escalation, not one per reader.
 */
export function flowEscalations(graph, proof, nowMs) {
  if (!proof || !proof.ok) return [];
  const out = [];
  for (const r of graph.resources) {
    if (!r.measured && !r.open) continue;
    let v;
    if (r.open) v = { state: 'open', say: r.open.blocker, age: null };
    else {
      const row = proof.rows[r.id];
      if (!row) continue;
      v = resourceVerdict(metaFor(r), { ...row, resource: r.id }, nowMs);
    }
    if (!['broken', 'stale', 'empty', 'unconsumed', 'open'].includes(v.state)) continue;
    out.push({
      id: `flow-${r.id}`,
      title: `${r.label}: ${(FLOW_STATES[v.state] || {}).label || v.state}`,
      kind: 'flow',
      days: Number.isFinite(v.age) ? v.age : 0,
      sources: [r.id],
      why: `${v.say}. Written by ${(r.writers || []).join(', ') || 'no one'}; read by ${(r.readers || []).join(', ') || 'no one'}.`,
    });
  }
  return out;
}
