#!/usr/bin/env node
// =============================================================================
// system-flow-proof — measure every connection of the whole-system flow graph
// on the LIVE database, and every workflow's latest run (DR-0622).
// =============================================================================
// Run by .github/workflows/system-flow-proof.yml every 6 hours:
//
//   node scripts/system-flow-proof.mjs runs  > runs.json      (GitHub API)
//   node scripts/system-flow-proof.mjs sql RUN_ID runs.json    > proof.sql
//   bash scripts/live-sql.sh '|' < proof.sql                  > out.txt
//   node scripts/system-flow-proof.mjs summary RUN_ID < out.txt >> $GITHUB_STEP_SUMMARY
//
// READ-ONLY on every product table; it writes only its own rows into
// system_flow_proof (migration 0234), which the app reads. Deterministic: the
// same database and the same runs give the same rows. Each measurement runs in
// its own sub-transaction, so one missing column records its error and never
// blanks the rest (unknown is never green — DR-0076).
// =============================================================================
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildProofSql, resourceVerdict, resourceMetas, realContext, ROOT } from './system-flow-graph.mjs';
import { SYSTEM_FLOW } from './system-flow-registry.mjs';

const q = (s) => (s == null ? 'NULL' : `'${String(s).replace(/'/g, "''")}'`);

export function workflowFiles(registry = SYSTEM_FLOW) {
  return registry.nodes.filter((n) => n.workflow).map((n) => n.workflow).sort();
}

// The latest DECISIVE run of one workflow → one proof row. Measured by the
// first proof run (36059041587): "latest completed run on any branch" judged
// ci.yml and auto-merge.yml broken on a PR's `action_required`, and judged a
// switched-off drain broken on its `skipped` fires. So: runs on main first;
// only success / failure / timed_out decide; a workflow whose recent fires
// were all skipped is OFF by its stop-path (note 'off'), never broken; one that
// never ran is written = 0 (never painted as fine).
const DECISIVE = new Set(['success', 'failure', 'timed_out']);
export function pickRun(runs) {
  const list = Array.isArray(runs) ? runs : [];
  const decisive = list.find((r) => DECISIVE.has(r && r.conclusion));
  if (decisive) return decisive;
  if (list.length && list.every((r) => r && r.conclusion === 'skipped')) return { conclusion: 'off', updated_at: list[0].updated_at, html_url: list[0].html_url };
  return null;
}
// Which runs judge a workflow, measured by the second proof run (36062392420):
//   'main'        — a scheduled witness: its runs on main (it runs there);
//   'any'         — a hand-dispatched tool: its latest decisive run anywhere
//                   (people dispatch it from the branch they are working on);
//   'any-success' — a lane workflow whose runs are per-PR (ci, auto-merge): a
//                   red PR is the gate working, not the workflow broken, so it
//                   is healthy when it has succeeded recently anywhere.
export function runRuleFor(node, yamlText) {
  if (node && node.runRule) return node.runRule;
  return /\bcron:/.test(String(yamlText || '')) ? 'main' : 'any';
}
export function pickByRule(rule, mainRuns, anyRuns) {
  if (rule === 'any-success') {
    const ok = (anyRuns || []).find((r) => r && r.conclusion === 'success');
    return ok || pickRun(anyRuns);
  }
  if (rule === 'main') return pickRun(mainRuns) || pickRun(anyRuns);
  return pickRun(anyRuns) || pickRun(mainRuns);
}

export function runRow(file, run) {
  if (!run) return { resource: `gh:run:${file}`, written: 0, newest_at: null, consumed: null, note: 'no completed run on record' };
  if (run.conclusion === 'off') return { resource: `gh:run:${file}`, written: 1, newest_at: run.updated_at || null, consumed: null, note: `off ${run.html_url || ''}`.trim() };
  const ok = run.conclusion === 'success';
  return {
    resource: `gh:run:${file}`,
    written: 1,
    newest_at: run.updated_at || run.created_at || null,
    consumed: ok ? 1 : 0,
    note: `${run.conclusion || run.status} ${run.html_url || ''}`.trim(),
  };
}

export function runsSql(runId, rows) {
  if (!rows.length) return '';
  const values = rows.map((r) => `(${q(runId)}, ${q(r.resource)}, ${r.written == null ? 'NULL' : Number(r.written)}, ${r.newest_at ? `${q(r.newest_at)}::timestamptz` : 'NULL'}, ${r.consumed == null ? 'NULL' : Number(r.consumed)}, ${q(r.note)})`);
  return `INSERT INTO public.system_flow_proof (run_id, resource, written, newest_at, consumed, note) VALUES\n${values.join(',\n')};\n`;
}

async function fetchRuns() {
  const repo = process.env.GITHUB_REPOSITORY || 'darrellpoe06/Kingdom-PWA-Node';
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || '';
  const out = [];
  const ctx = realContext();
  for (const node of SYSTEM_FLOW.nodes.filter((n) => n.workflow)) {
    const file = node.workflow;
    const rule = runRuleFor(node, ctx.fileText(node.file));
    const base = `https://api.github.com/repos/${repo}/actions/workflows/${file}/runs?status=completed&per_page=20`;
    const headers = { Accept: 'application/vnd.github+json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
    try {
      const [resMain, resAny] = await Promise.all([fetch(`${base}&branch=main`, { headers }), fetch(base, { headers })]);
      if (!resMain.ok || !resAny.ok) { out.push({ ...runRow(file, null), written: null, note: `GitHub answered ${resMain.status}/${resAny.status}` }); continue; }
      const mainRuns = (await resMain.json()).workflow_runs || [];
      const anyRuns = (await resAny.json()).workflow_runs || [];
      out.push(runRow(file, pickByRule(rule, mainRuns, anyRuns)));
    } catch (e) {
      out.push({ resource: `gh:run:${file}`, written: null, newest_at: null, consumed: null, note: `could not ask GitHub: ${e.message}` });
    }
  }
  return out;
}

export function parseOutput(text) {
  return String(text || '').split('\n').filter((l) => l.includes('|')).map((l) => {
    const [resource, written, newest_at, consumed, error, note] = l.split('|');
    return { resource, written: written === '' ? null : Number(written), newest_at: newest_at || null, consumed: consumed === '' ? null : Number(consumed), error: error || null, note: note || null };
  });
}

export function summarize(rows, nowMs = Date.now()) {
  const counts = {};
  const metas = resourceMetas(SYSTEM_FLOW, realContext().fileText);
  const lines = ['### System flow proof — every connection, measured live', '', '| resource | state | written | newest | consumed | said plainly |', '| --- | --- | --- | --- | --- | --- |'];
  for (const r of rows) {
    const meta = metas[r.resource] || {};
    const v = resourceVerdict(meta, r, nowMs);
    counts[v.state] = (counts[v.state] || 0) + 1;
    lines.push(`| ${r.resource} | ${v.state} | ${r.written ?? ''} | ${r.newest_at ?? ''} | ${r.consumed ?? ''} | ${v.say} |`);
  }
  lines.splice(1, 0, '', Object.entries(counts).map(([k, v]) => `**${v}** ${k}`).join(' · '));
  return lines.join('\n');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [cmd, runId, runsFile] = process.argv.slice(2);
  if (cmd === 'runs') {
    fetchRuns().then((rows) => process.stdout.write(JSON.stringify(rows, null, 1)));
  } else if (cmd === 'sql') {
    if (!runId) { console.error('usage: sql RUN_ID [runs.json]'); process.exit(2); }
    const runs = runsFile ? JSON.parse(readFileSync(runsFile, 'utf8')) : [];
    // The run rows go in first, in the same DO transaction's session, so the
    // final SELECT reports them beside the table measurements.
    process.stdout.write(runsSql(runId, runs));
    process.stdout.write(buildProofSql(SYSTEM_FLOW, runId));
    process.stdout.write('\n');
  } else if (cmd === 'summary') {
    const text = readFileSync(0, 'utf8');
    process.stdout.write(summarize(parseOutput(text)) + '\n');
  } else {
    console.error('usage: node scripts/system-flow-proof.mjs runs | sql RUN_ID [runs.json] | summary RUN_ID < psql-output');
    console.error(`root: ${join(ROOT)}`);
    process.exit(2);
  }
}
