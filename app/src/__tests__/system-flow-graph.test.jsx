// =============================================================================
// The whole-system flow graph (DR-0622): end to end means continuous; the live
// data is the proof. Every gate is proven to CATCH its break (DR-0076 §3) by a
// planted violation, and proven quiet on the real graph.
// =============================================================================
import { describe, it, expect, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  checkGraph, buildFlowGraph, parseSchema, buildProofSql, cronFreshDays, deriveGraph, loopState, realContext,
} from '../../../scripts/system-flow-graph.mjs';
import { SYSTEM_FLOW } from '../../../scripts/system-flow-registry.mjs';
import { runRow, runsSql, parseOutput } from '../../../scripts/system-flow-proof.mjs';
import {
  resourceVerdict, fetchFlowProof, flowEscalations, connectionStates, flowTally, normalizeGraph, ageWords,
} from '../lib/system-flow.js';
import { deriveOperations } from '../lib/operations-intelligence.js';
import { lessonItems, fetchMyLessons, transcriptWords } from '../lib/lesson-inbox.js';
import { parseFeedStats, statsSql, FEED_URL } from '../../../scripts/video-stats-feed.mjs';
import { namedNotes, matchNotes, fixSql, parseCommits } from '../../../scripts/feedback-fixed.mjs';
import { receiptCode } from '../lib/feedback-receipt.js';
import { fetchScribeSessions, fetchScribeWords, scribeAuth } from '../lib/workflow-scribe.js';
import { parseMountedRoutes } from '../../../scripts/system-flow-graph.mjs';
import ScribeRecordings from '../components/ScribeRecordings.jsx';
import SystemFlowProof from '../components/SystemFlowProof.jsx';
import LessonInbox from '../components/LessonInbox.jsx';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const read = (...p) => readFileSync(join(ROOT, ...p), 'utf8');
const NOW = Date.parse('2026-09-24T18:00:00Z');
const DAY = 86400000;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// A tiny world for planting breaks: two files, one table, one workflow.
const FILES = {
  'a.js': "supabase.from('notes').insert(x)",
  'b.js': "supabase.from('notes').select('*')",
  'w.yml': 'runs-on: ubuntu-latest',
};
const ctx = (over = {}) => ({
  schema: new Map([['notes', new Set(['id', 'created_at'])]]),
  fileText: (p) => (p in FILES ? FILES[p] : null),
  workflows: [], riders: [], newTables: [], baseline: { tables: [] },
  ...over,
});
const writer = { id: 'writer', name: 'W', file: 'a.js', writes: [{ res: 'db:notes' }], seeds: ['reader'] };
const reader = { id: 'reader', name: 'R', file: 'b.js', reads: [{ res: 'db:notes' }] };
const gates = (reg, c = ctx()) => checkGraph({ resources: {}, loops: [], ...reg }, c).map((f) => f.gate);

describe('the real graph — built from the code, and whole', () => {
  const g = buildFlowGraph(SYSTEM_FLOW);

  it('has no dead end, orphan, missing table, false consumer, unplaced workflow or open loop', () => {
    expect(g.findings, g.findings.map((f) => `[${f.gate}] ${f.message}`).join('\n')).toEqual([]);
  });

  it('places EVERY workflow file and EVERY NAS rider — not a sample', () => {
    const c = realContext();
    expect(c.workflows.length).toBeGreaterThan(40);
    const wf = new Set(SYSTEM_FLOW.nodes.map((n) => n.workflow).filter(Boolean));
    for (const w of c.workflows) expect(wf.has(w), `${w} has no place`).toBe(true);
    const riders = new Set(SYSTEM_FLOW.nodes.map((n) => n.rider).filter(Boolean));
    for (const r of c.riders) expect(riders.has(r), `${r} has no place`).toBe(true);
  });

  it('covers the named flows: feedback, lessons, prompts, decisions, ops, sermons, health, the family key, board tasks', () => {
    const ids = new Set(SYSTEM_FLOW.nodes.map((n) => n.id));
    for (const id of ['feedback-door', 'feedback-queue', 'lesson-mail-watch', 'lesson-door', 'lesson-voice', 'one-voice', 'prompt-history',
      'decision-board', 'ops-queue', 'ops-runner', 'transcript-trickle', 'sermon-reader', 'site-health', 'ops-surface', 'family-key', 'bridge-provision', 'board-tasks']) {
      expect(ids.has(id), id).toBe(true);
    }
  });

  it('finds the cycles the data really runs in (the loops close)', () => {
    const closed = g.loops.filter((l) => l.closed).map((l) => l.id);
    expect(closed).toEqual(expect.arrayContaining(['feedback-loop', 'ops-loop', 'models-loop', 'prompt-loop', 'lane-loop']));
    expect(g.cycles.length).toBeGreaterThan(3);
  });

  it('every workflow’s run is read by the flow proof — the monitors join the loop', () => {
    const d = deriveGraph(SYSTEM_FLOW);
    for (const n of SYSTEM_FLOW.nodes.filter((x) => x.workflow && x.id !== 'flow-proof')) {
      expect(d.edges.some((e) => e.from === n.id && e.to === 'flow-proof' && e.res === `gh:run:${n.workflow}`), n.workflow).toBe(true);
    }
  });
});

describe('proven-to-catch — each gate fails on its planted break', () => {
  it('quiet on a whole little graph', () => {
    expect(gates({ nodes: [writer, reader] })).toEqual([]);
  });

  it('dead end: an output no one consumes', () => {
    expect(gates({ nodes: [writer] })).toContain('dead-end');
    // …unless it is a declared sink WITH a reason; a blank reason still fails.
    expect(gates({ nodes: [{ ...writer, seeds: [] }], resources: { 'db:notes': { sink: 'A person reads it on paper.' } } })).toEqual([]);
    expect(gates({ nodes: [{ ...writer, seeds: [] }], resources: { 'db:notes': { sink: ' ' } } })).toContain('dead-end');
  });

  it('dead end on the REAL registry: remove the app reading the NAS runner’s outcome and the gate catches it', () => {
    const nodes = SYSTEM_FLOW.nodes.map((n) => (n.id === 'ops-queue' ? { ...n, reads: [] } : n));
    const f = checkGraph({ ...SYSTEM_FLOW, nodes }, realContext());
    expect(f.some((x) => x.gate === 'dead-end' && x.id === 'db:ops_commands#finished')).toBe(true);
  });

  it('orphan: an input no producer feeds', () => {
    expect(gates({ nodes: [reader] })).toContain('orphan');
    expect(gates({ nodes: [reader], resources: { 'db:notes': { source: 'The outside world writes it.' } } })).toEqual([]);
  });

  it('no-table: a declared table no migration creates, and a proof column no migration declares', () => {
    const w = { ...writer, writes: [{ res: 'db:ghosts', token: 'notes' }], seeds: [] };
    const r = { ...reader, reads: [{ res: 'db:ghosts', token: 'notes' }] };
    expect(gates({ nodes: [w, r] })).toContain('no-table');
    expect(gates({ nodes: [writer, reader], resources: { 'db:notes': { proof: { ts: 'updated_at' } } } })).toContain('no-table');
  });

  it('no-wiring: a declared consumer that does not actually read the table (grep in its file)', () => {
    const liar = { ...reader, reads: [{ res: 'db:notes', file: 'w.yml' }] };
    expect(gates({ nodes: [writer, liar] })).toContain('no-wiring');
    expect(gates({ nodes: [writer, { ...reader, file: 'missing.js' }] })).toContain('no-wiring');
  });

  it('unseeded: a seed claim with no shared resource behind it', () => {
    const other = { id: 'other', name: 'O', file: 'b.js', reads: [] };
    expect(gates({ nodes: [{ ...writer, seeds: ['other'] }, reader, other] })).toContain('unseeded');
  });

  it('uncovered: a new workflow, a new NAS rider, a new table with no place', () => {
    expect(gates({ nodes: [writer, reader] }, ctx({ workflows: ['new-thing.yml'] }))).toContain('uncovered');
    expect(gates({ nodes: [writer, reader] }, ctx({ riders: ['service:new-rider'] }))).toContain('uncovered');
    const withTable = ctx({ newTables: [{ file: '0299-new.sql', table: 'brand_new' }] });
    expect(gates({ nodes: [writer, reader] }, withTable)).toContain('uncovered');
    const wfNode = { ...writer, workflow: 'w.yml' };
    expect(gates({ nodes: [wfNode, reader] }, ctx({ workflows: ['w.yml'] }))).toEqual([]);
  });

  it('the real coverage gate catches a workflow file added with no place in the graph', () => {
    const c = realContext();
    const f = checkGraph(SYSTEM_FLOW, { ...c, workflows: [...c.workflows, 'unplaced-new.yml'] });
    expect(f.some((x) => x.gate === 'uncovered' && x.id === 'unplaced-new.yml')).toBe(true);
  });

  it('open-loop: a declared loop that does not close fails unless it names a blocker and a date', () => {
    const loops = [{ id: 'l', name: 'back', path: ['writer', 'reader'] }];
    expect(gates({ nodes: [writer, reader], loops })).toContain('open-loop');
    const named = [{ ...loops[0], open: { blocker: 'The reader writes back in the next push.', reReview: '2026-09-26' } }];
    expect(gates({ nodes: [writer, reader], loops: named })).toEqual([]);
    const undated = [{ ...loops[0], open: { blocker: 'soon' } }];
    expect(gates({ nodes: [writer, reader], loops: undated })).toContain('open-loop');
  });

  it('an open gap on a resource must carry its blocker AND a date', () => {
    expect(gates({ nodes: [{ ...writer, seeds: [] }], resources: { 'db:notes': { open: { blocker: 'x' } } } })).toContain('open-gap');
    expect(gates({ nodes: [{ ...writer, seeds: [] }], resources: { 'db:notes': { open: { blocker: 'x', reReview: '2026-09-30' } } } })).toEqual([]);
  });

  it('loopState reports the missing step by name', () => {
    const s = loopState({ nodes: [writer, reader], resources: {}, loops: [{ id: 'l', name: 'n', path: ['writer', 'reader'] }] });
    expect(s[0].closed).toBe(false);
    expect(s[0].steps.find((x) => !x.connected)).toMatchObject({ from: 'reader', to: 'writer' });
  });
});

describe('the schema is read from the migrations, not guessed', () => {
  it('reads CREATE TABLE columns, ALTER … ADD COLUMN, and loop-created tables', () => {
    const s = parseSchema([
      'CREATE TABLE IF NOT EXISTS public.a (id uuid PRIMARY KEY, n int NOT NULL, CONSTRAINT c CHECK (n > 0));',
      'ALTER TABLE a ADD COLUMN IF NOT EXISTS extra text;',
      "FOREACH t IN ARRAY ARRAY['x_one','x_two'] LOOP EXECUTE format($d$ CREATE TABLE IF NOT EXISTS %I ( id uuid, doc jsonb ) $d$, t); END LOOP;",
    ]);
    expect([...s.get('a')].sort()).toEqual(['extra', 'id', 'n']);
    expect([...s.get('x_two')].sort()).toEqual(['doc', 'id']);
    expect(s.has('constraint')).toBe(false);
  });
  it('the real schema carries the proof table (migration 0234) with the columns the app reads', () => {
    const cols = realContext().schema.get('system_flow_proof');
    for (const c of ['run_id', 'measured_at', 'resource', 'written', 'newest_at', 'consumed', 'note', 'error']) expect(cols.has(c), c).toBe(true);
  });
});

describe('the live measurement is read-only, per-resource, and never blanks', () => {
  const sql = buildProofSql(SYSTEM_FLOW, 'run-1');
  it('measures every table-backed resource in its own sub-transaction', () => {
    const measured = Object.entries(SYSTEM_FLOW.resources).filter(([k, v]) => k.startsWith('db:') && v.proof).map(([k]) => k);
    expect(measured.length).toBeGreaterThan(20);
    for (const r of measured) expect(sql).toContain(`'${r}'`);
    expect((sql.match(/EXCEPTION WHEN others THEN/g) || []).length).toBe(measured.length);
  });
  it('writes only its own table — never INSERT/UPDATE/DELETE on a product table', () => {
    const writes = [...sql.matchAll(/\b(INSERT INTO|UPDATE|DELETE FROM)\s+(public\.)?([a-z_]+)/gi)].map((m) => m[3]);
    expect(new Set(writes)).toEqual(new Set(['system_flow_proof']));
  });
  it('a workflow’s run becomes a row: success, failure, never-ran', () => {
    expect(runRow('ci.yml', { conclusion: 'success', updated_at: '2026-09-24T10:00:00Z', html_url: 'u' })).toMatchObject({ written: 1, consumed: 1 });
    expect(runRow('ci.yml', { conclusion: 'failure', updated_at: '2026-09-24T10:00:00Z' })).toMatchObject({ written: 1, consumed: 0 });
    expect(runRow('ci.yml', null)).toMatchObject({ written: 0 });
    expect(runsSql('r', [runRow('a.yml', null)])).toMatch(/INSERT INTO public\.system_flow_proof/);
  });
  it('parses the psql output back into rows', () => {
    expect(parseOutput('db:feedback|12|2026-09-24T01:00:00Z|3|\ndb:x||||relation does not exist')).toEqual([
      { resource: 'db:feedback', written: 12, newest_at: '2026-09-24T01:00:00Z', consumed: 3, error: null },
      { resource: 'db:x', written: null, newest_at: null, consumed: null, error: 'relation does not exist' },
    ]);
  });
  it('a schedule implies its freshness; no schedule runs when asked', () => {
    expect(cronFreshDays("cron: '41 */6 * * *'")).toBe(2);
    expect(cronFreshDays("cron: '0 16 * * 1,4'")).toBe(8);
    expect(cronFreshDays('on: workflow_dispatch')).toBe(null);
  });
});

describe('the verdict — unknown is never green', () => {
  const meta = { proof: { ts: 'created_at', fresh: 7 } };
  it('each state, from the numbers', () => {
    expect(resourceVerdict(meta, null, NOW).state).toBe('unknown');
    expect(resourceVerdict(meta, { error: 'column x does not exist' }, NOW).state).toBe('unknown');
    expect(resourceVerdict(meta, { written: 0 }, NOW).state).toBe('empty');
    expect(resourceVerdict(meta, { written: 5, newest_at: new Date(NOW - 20 * DAY).toISOString() }, NOW).state).toBe('stale');
    expect(resourceVerdict(meta, { written: 5, newest_at: new Date(NOW - DAY).toISOString(), consumed: 0 }, NOW).state).toBe('unconsumed');
    expect(resourceVerdict(meta, { written: 5, newest_at: new Date(NOW - DAY).toISOString(), consumed: 2 }, NOW).state).toBe('flowing');
    expect(resourceVerdict(meta, { written: 5, newest_at: null }, NOW).state).toBe('unknown');
  });
  it('a workflow run: failed is broken, an old scheduled run is stale, never-ran is empty', () => {
    const run = { run: { fresh: 2 } };
    expect(resourceVerdict(run, { resource: 'gh:run:x.yml', written: 1, consumed: 0, newest_at: new Date(NOW).toISOString(), note: 'failure u' }, NOW).state).toBe('broken');
    expect(resourceVerdict(run, { resource: 'gh:run:x.yml', written: 1, consumed: 1, newest_at: new Date(NOW - 9 * DAY).toISOString() }, NOW).state).toBe('stale');
    expect(resourceVerdict(run, { resource: 'gh:run:x.yml', written: 0 }, NOW).state).toBe('empty');
    expect(resourceVerdict({ run: { fresh: null } }, { resource: 'gh:run:x.yml', written: 1, consumed: 1, newest_at: new Date(NOW - 90 * DAY).toISOString() }, NOW).state).toBe('flowing');
  });
  it('ages read in plain words', () => {
    expect(ageWords(new Date(NOW - 5 * 60000).toISOString(), NOW)).toBe('5 min ago');
    expect(ageWords(new Date(NOW - 3 * DAY).toISOString(), NOW)).toBe('3 days ago');
    expect(ageWords('', NOW)).toBe('no date');
  });
});

// A fake Supabase that answers the proof table (and the lesson inbox).
function fakeSb(rows, { uid = 'u1' } = {}) {
  const q = { calls: [] };
  const chain = (table) => {
    const st = { table, filters: [] };
    const api = {
      select: () => api, order: () => api, limit: () => Promise.resolve({ data: rows[table] || [], error: null }),
      contains: (...a) => { st.filters.push(['contains', ...a]); return api; },
      eq: (...a) => { st.filters.push(['eq', ...a]); return api; },
    };
    q.calls.push(st);
    return api;
  };
  return { from: chain, auth: { getSession: async () => ({ data: { session: uid ? { user: { id: uid } } : null } }) }, q };
}

describe('the app reads the latest proof run and turns it into escalations', () => {
  const graph = normalizeGraph(buildFlowGraph(SYSTEM_FLOW));
  const recent = new Date(NOW - 3600000).toISOString();
  const rows = [
    { run_id: 'r2', measured_at: recent, resource: 'db:feedback', written: 40, newest_at: new Date(NOW - 40 * DAY).toISOString(), consumed: 10 },
    { run_id: 'r2', measured_at: recent, resource: 'gh:run:site-health.yml', written: 1, newest_at: recent, consumed: 0, note: 'failure u' },
    { run_id: 'r2', measured_at: recent, resource: 'db:ops_commands', written: 9, newest_at: recent, consumed: 9 },
    { run_id: 'r1', measured_at: new Date(NOW - 7 * 3600000).toISOString(), resource: 'db:feedback', written: 1, newest_at: recent, consumed: 1 },
  ];

  it('fetchFlowProof keeps only the newest run', async () => {
    const p = await fetchFlowProof({ supabase: fakeSb({ system_flow_proof: rows }) });
    expect(p.ok).toBe(true);
    expect(p.runId).toBe('r2');
    expect(p.rows['db:feedback'].written).toBe(40);
  });

  it('no proof run yet = not ok, and no escalation is invented', async () => {
    const p = await fetchFlowProof({ supabase: fakeSb({}) });
    expect(p.ok).toBe(false);
    expect(flowEscalations(graph, p, NOW)).toEqual([]);
  });

  it('a quiet table and a failing witness become escalations on the operations board; a flowing one does not', async () => {
    const p = await fetchFlowProof({ supabase: fakeSb({ system_flow_proof: rows }) });
    const flows = flowEscalations(graph, p, NOW);
    const ids = flows.map((f) => f.id);
    expect(ids).toContain('flow-db:feedback');
    expect(ids).toContain('flow-gh:run:site-health.yml');
    expect(ids).not.toContain('flow-db:ops_commands');
    const r = deriveOperations({ flows, nowMs: NOW });
    expect(r.ok).toBe(true);
    expect(r.escalations.some((e) => e.kind === 'flow' && e.id === 'flow-db:feedback')).toBe(true);
    expect(r.read.flows).toBe(flows.length);
    expect(r.sources).toContain('the system flow proof (every connection, measured live)');
    // Not read = not a source, never a painted "all flowing".
    expect(deriveOperations({ flows: null, nowMs: NOW }).ok).toBe(false);
  });

  it('a connection with no live number is never counted as flowing', () => {
    const states = connectionStates(graph, { ok: false, rows: {} }, NOW);
    expect(flowTally(states).flowing).toBe(0);
  });
});

describe('the surfaces', () => {
  let host; let root;
  afterEach(() => { if (root) act(() => root.unmount()); if (host) host.remove(); root = null; host = null; });
  const mount = async (el) => {
    host = document.createElement('div'); document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => { root.render(el); });
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
    return host;
  };

  it('the Interconnect proof shows the whole graph with live numbers, and says plainly when there are none', async () => {
    const graph = buildFlowGraph(SYSTEM_FLOW);
    const recent = new Date(NOW - 3600000).toISOString();
    const withRows = await mount(<SystemFlowProof graph={graph} nowMs={NOW} deps={{ supabase: fakeSb({ system_flow_proof: [
      { run_id: 'r9', measured_at: recent, resource: 'db:ops_commands', written: 9, newest_at: recent, consumed: 9 },
    ] }) }} />);
    const text = withRows.textContent;
    expect(text).toMatch(/The whole system, end to end/);
    expect(text).toMatch(/measured on the live database 1 h ago \(run r9\)/);
    expect(withRows.querySelectorAll('[data-testid="flow-chain"]').length).toBeGreaterThan(8);
    expect(text).toMatch(/9 written · newest 1 h ago · 9 picked up downstream/);
    act(() => root.unmount()); host.remove(); root = null;
    const none = await mount(<SystemFlowProof graph={graph} nowMs={NOW} deps={{ supabase: fakeSb({}) }} />);
    expect(none.textContent).toMatch(/no live reading \(no proof run on record yet\) — nothing below is counted as flowing/);
    expect(none.querySelector('[data-testid="flow-headline"]').textContent).toMatch(/0 flowing/);
  });

  it('the speaker sees each lesson: received, waiting, written down with the words, or why it failed', async () => {
    const rows = [
      { id: 'v1', body: 'Lesson. A spoken lesson (1:02)…', tags: ['lesson', 'voice', 'audio:u1/x.webm', 'voice-transcribed'], created_at: '2026-09-24T10:00:00Z' },
      { id: 't1', body: 'Lesson. A spoken lesson, transcribed by Whisper (large-v3-turbo) on the 4070 tower.\n\nThe keys of hell and death.', tags: ['lesson', 'voice-transcript', 'of:v1', 'mirrored'], created_at: '2026-09-24T10:05:00Z' },
      { id: 'v2', body: 'Lesson. A spoken lesson (0:30)…', tags: ['lesson', 'voice', 'audio:u1/y.webm'], created_at: '2026-09-24T11:00:00Z' },
      { id: 'x1', body: 'Lesson. Be ye doers of the word.', tags: ['lesson'], created_at: '2026-09-24T09:00:00Z' },
    ];
    const items = lessonItems(rows);
    expect(items.map((i) => [i.id, i.state])).toEqual([['v2', 'waiting'], ['v1', 'written'], ['x1', 'sent']]);
    expect(items[1].withReader).toBe(true);
    expect(transcriptWords(items[1].words)).toBe('The keys of hell and death.');
    const sb = fakeSb({ agent_inbox: rows });
    const r = await fetchMyLessons({ supabase: sb });
    expect(r.ok).toBe(true);
    expect(sb.q.calls[0].filters).toEqual(expect.arrayContaining([['contains', 'tags', ['lesson']], ['eq', 'created_by', 'u1']]));
    expect((await fetchMyLessons({ supabase: fakeSb({}, { uid: null }) })).reason).toBe('signed-out');
    const el = await mount(<LessonInbox deps={{ supabase: sb }} />);
    expect(el.textContent).toMatch(/Your lessons · 3/);
    expect(el.textContent).toMatch(/Waiting for Whisper to write it down/);
    expect(el.textContent).toMatch(/Written down by Whisper/);
    const btn = [...el.querySelectorAll('button')].find((b) => /Read the words/.test(b.textContent));
    await act(async () => { btn.click(); });
    expect(el.querySelector('[data-testid="lesson-words"]').textContent).toBe('The keys of hell and death.');
  });
});

describe('the pieces are really wired', () => {
  it('the proof workflow is braked, read-only, deterministic and reads the LIVE database', () => {
    const y = read('.github', 'workflows', 'system-flow-proof.yml');
    expect(y).toMatch(/cron: '41 \*\/6 \* \* \*'/);
    expect(y).toMatch(/timeout-minutes: 10/);
    expect(y).toMatch(/concurrency:\s*\n\s*group: system-flow-proof/);
    expect(y).toMatch(/bash scripts\/live-sql\.sh/);
    expect(y).toMatch(/SYSTEM_FLOW_PROOF_ENABLED != 'false'/);
    expect(y).not.toMatch(/SUPABASE_DB_URL/);
  });
  it('the proof table is governor-read, client-unwritable, and proven in the RLS matrix', () => {
    const m = read('infra', 'supabase', 'migrations-auto', '0234-every-connection-leaves-its-live-numbers.sql');
    expect(m).toMatch(/ENABLE ROW LEVEL SECURITY/);
    expect(m).toMatch(/i\.slug = 'poe-family'/);
    expect(m).toMatch(/REVOKE INSERT, UPDATE, DELETE ON public\.system_flow_proof FROM authenticated/);
    expect(m).not.toMatch(/FOR (INSERT|UPDATE|DELETE|ALL)/);
    expect(read('.github', 'workflows', 'rls-isolation.yml')).toMatch(/0234-system-flow-proof-smoke\.sql/);
    expect(read('infra', 'supabase', 'tests', '0234-system-flow-proof-smoke.sql')).toMatch(/LEAK: a poe-family VIEWER read/);
  });
  it('the operations board and the Interconnect proof read the proof rows', () => {
    expect(read('app', 'src', 'components', 'OperationsIntelligence.jsx')).toMatch(/flowEscalations\(graph, proof, nowMs\)/);
    expect(read('app', 'src', 'components', 'QualityProof.jsx')).toMatch(/<SystemFlowProof graph=/);
    expect(read('app', 'src', 'components', 'ThinkingSpace.jsx')).toMatch(/<LessonInbox /);
    expect(read('scripts', 'interconnect-guard.mjs')).toMatch(/g\.findings\.length > 0/);
  });
});

// =============================================================================
// Push 2 (DR-0622): the gaps the graph found, closed edge by edge.
// =============================================================================
describe('the orphan closed: video reach has a producer', () => {
  const FEED = '<feed><entry><yt:videoId>abcDEF12345</yt:videoId><media:group><media:community><media:starRating count="12" average="5.00"/><media:statistics views="345"/></media:community></media:group></entry><entry><yt:videoId>noStats0001</yt:videoId></entry></feed>';
  it('reads views and likes from the channel’s public feed, with no key', () => {
    expect(FEED_URL).toMatch(/feeds\/videos\.xml\?channel_id=UC821pJh7YR5llBNnWUJj-ZA$/);
    expect(parseFeedStats(FEED)).toEqual([{ videoId: 'abcDEF12345', views: 345, likes: 12 }]);
    expect(parseFeedStats('garbage')).toEqual([]);
  });
  it('writes only onto videos the service record already holds, idempotently', () => {
    const sql = statsSql(parseFeedStats(FEED));
    expect(sql).toMatch(/JOIN public\.choir_sermons cs ON cs\.video_id = f\.video_id/);
    expect(sql).toMatch(/ON CONFLICT \(instance_id, video_id\) DO UPDATE/);
    expect(statsSql([])).toMatch(/no-stats/);
  });
  it('the graph now has a writer for sermon_video_stats and no open gap on it', () => {
    const r = buildFlowGraph(SYSTEM_FLOW).resources.find((x) => x.id === 'db:sermon_video_stats');
    expect(r.writers).toContain('video-stats');
    expect(r.open).toBe(null);
  });
});

describe('the fix loop closed: a shipped fix marks the note it names', () => {
  const open = ['00c981a4-1111-4222-8333-444455556666', '9f1e2d3c-aaaa-4bbb-8ccc-dddddddddddd'];
  const commits = parseCommits(`abc1234\tFix the bell (fixes feedback ${receiptCode(open[0])})\t\x1edef5678\tAnother\tthis is feedback 9f1e2d3c\x1eeee0000\tNothing named here, just feedback in general\t\x1e`);
  it('finds a note named by its board reference or by its id, and nothing else', () => {
    const refs = namedNotes(commits);
    expect(refs.map((r) => r.sha)).toEqual(['abc1234', 'def5678']);
    expect(matchNotes(refs, open).map((x) => x.id).sort()).toEqual([...open].sort());
  });
  it('proven quiet: a reference to no open note marks nothing', () => {
    expect(matchNotes(namedNotes(commits), ['11111111-2222-4333-8444-555566667777'])).toEqual([]);
    expect(fixSql([])).toMatch(/SELECT 'fixed', 0/);
  });
  it('never reopens a declined note, and says which change fixed it', () => {
    const sql = fixSql(matchNotes(namedNotes(commits), open));
    expect(sql).toMatch(/triage_status NOT IN \('fixed', 'declined'\)/);
    expect(sql).toMatch(/Fixed by the update abc1234/);
    expect([...sql.matchAll(/\bUPDATE\s+public\.([a-z_]+)/g)].map((x) => x[1])).toEqual(['feedback']);
  });
  it('the workflow marks only what the DEPLOYED build carries, braked', () => {
    const y = read('.github', 'workflows', 'feedback-fixed.yml');
    expect(y).toMatch(/deploy-cloudflare-pages\.yml\/runs\?status=success/);
    expect(y).toMatch(/timeout-minutes: 5/);
    expect(y).toMatch(/group: feedback-fixed/);
  });
  it('the fix loop now closes in the graph', () => {
    expect(buildFlowGraph(SYSTEM_FLOW).loops.find((x) => x.id === 'fix-loop').closed).toBe(true);
  });
});

describe('what the first live proof run taught the measurement (run 36059041587)', () => {
  it('a PR’s action_required or a cancelled run never judges a workflow broken; skipped fires read as switched off', async () => {
    const { pickRun } = await import('../../../scripts/system-flow-proof.mjs');
    expect(pickRun([{ conclusion: 'action_required' }, { conclusion: 'cancelled' }, { conclusion: 'success', updated_at: 't' }]).conclusion).toBe('success');
    expect(pickRun([{ conclusion: 'skipped', updated_at: 't' }, { conclusion: 'skipped' }]).conclusion).toBe('off');
    expect(pickRun([{ conclusion: 'action_required' }])).toBe(null);
    const off = runRow('push-outbox-drain.yml', pickRun([{ conclusion: 'skipped', updated_at: '2026-09-24T20:54:00Z' }]));
    expect(resourceVerdict({ run: { fresh: 2 } }, off, NOW).state).toBe('off');
  });
  it('the migration ledger read is the live database’s own (_sovereign_replay), in the graph and in the app’s function', () => {
    const g = buildFlowGraph(SYSTEM_FLOW);
    const r = g.resources.find((x) => x.id === 'db:_sovereign_replay');
    expect(r.writers).toEqual(expect.arrayContaining(['db-migrate', 'sovereign-replay']));
    expect(r.readers).toEqual(expect.arrayContaining(['schema-health', 'sovereign-drift']));
    expect(g.resources.find((x) => x.id === 'db:_schema_migrations')).toBeUndefined();
    const fn = read('infra', 'supabase', 'migrations-auto', '0235-the-migration-ledger-the-app-shows-is-the-live-ones.sql');
    expect(fn).toMatch(/RETURNS jsonb/);
    expect(fn).toMatch(/i\.slug = 'poe-family'/);
    expect(read('.github', 'workflows', 'sovereign-drift.yml')).toMatch(/select fname from public\._sovereign_replay order by fname/);
  });
});

describe('the Scribe chain: reaches the NAS, and its words come back', () => {
  it('no-route gate: a connection over a route the Funnel does not mount is caught (proven on the real registry)', () => {
    const c = realContext();
    expect(c.mountedRoutes).toEqual(expect.arrayContaining(['/sb', '/nas-photos', '/taxes', '/voice', '/scribe']));
    const without = { ...c, mountedRoutes: c.mountedRoutes.filter((r) => r !== '/scribe') };
    const f = checkGraph(SYSTEM_FLOW, without);
    expect(f.filter((x) => x.gate === 'no-route').map((x) => x.id).sort()).toEqual(['http:scribe-results', 'http:scribe-upload']);
    expect(parseMountedRoutes('| `/a` | x |\n## UNACTUATED\n| `/b` | y |')).toEqual(['/a']);
  });

  it('the app sends the family key, and reads each recording back', async () => {
    expect(scribeAuth('k')).toEqual({ Authorization: 'Bearer k' });
    expect(scribeAuth('')).toEqual({});
    const calls = [];
    const fetchImpl = async (url, init) => {
      calls.push([url, init.headers]);
      if (url === '/scribe/sessions') return { ok: true, json: async () => ({ sessions: [{ sessionId: 's-12345678', kind: 'meeting', createdAt: '2026-09-24T10:00:00Z', state: 'minuted' }] }) };
      return { ok: true, json: async () => ({ transcript: 'Welcome. Let us begin.', minutes: 'Decided: meet weekly.' }) };
    };
    const list = await fetchScribeSessions({ token: 'fam', fetchImpl });
    expect(list.sessions[0].state).toBe('minuted');
    expect(calls[0][1]).toEqual({ Authorization: 'Bearer fam' });
    expect((await fetchScribeWords('s-12345678', { token: 'fam', fetchImpl })).minutes).toBe('Decided: meet weekly.');
    expect((await fetchScribeSessions({ fetchImpl: async () => ({ ok: false, status: 401 }) })).reason).toBe('http-401');

    const host = document.createElement('div'); document.body.appendChild(host);
    const root = createRoot(host);
    await act(async () => { root.render(<ScribeRecordings deps={{ token: 'fam', fetchImpl }} />); });
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
    expect(host.textContent).toMatch(/Your recordings · 1/);
    expect(host.textContent).toMatch(/Written down, with minutes/);
    const btn = [...host.querySelectorAll('button')].find((b) => /Read what was said/.test(b.textContent));
    await act(async () => { btn.click(); });
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
    expect(host.querySelector('[data-testid="scribe-words"]').textContent).toBe('Welcome. Let us begin.');
    act(() => root.unmount()); host.remove();
  });

  it('the upload itself now carries the family key (the first hop was refused before)', () => {
    const src = read('app', 'src', 'components', 'WorkflowScribe.jsx');
    expect(src).toMatch(/createChunkUploader\(\{ endpoint: '\/scribe', token \}\)/);
    expect((src.match(/\.\.\.scribeAuth\(token\)/g) || []).length).toBe(2);
    expect(read('infra', 'nas-scribe', 'install.sh')).toMatch(/funnel --bg --set-path \/scribe http:\/\/127\.0\.0\.1:8791/);
  });
});
