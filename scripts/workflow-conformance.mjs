// =============================================================================
// workflow-conformance — n8n workflow health, now ENFORCED (DR-0058, DR-0132 §4)
// =============================================================================
// Operationalizes the 2026-06-13 review's W1-W4 findings as a standing, $0,
// no-LLM scan: which workflows would be unsafe IF activated.
//
// WAS REPORT-ONLY UNTIL 2026-08-16. It always exited 0, so it surfaced the
// problem and never held the line — and DR-0132 §4 had already decided
// otherwise: "Whatever n8n remains gets the discipline the review named: gate
// on scripts/workflow-conformance.mjs (activation, errorWorkflow, headerAuth).
// A green gate must *mean* running-and-correct." Darrell, 2026-08-16: "make the
// conformance gate fail the build."
//
// Checks per workflow JSON:
//   W1 brakes      — a schedule/cron-triggered workflow with no executionTimeout
//                    AND no $getWorkflowStaticData (no concurrency lock / kill-switch)
//   W2 errorWf     — no settings.errorWorkflow (failures go silent; except the
//                    errorTrigger handlers themselves)
//   W3 auth        — a webhook with authentication != headerAuth and no in-code
//                    bearer/authorization check
//
// TWO TIERS, because the risk is not uniform and a flat gate would be either
// useless or unshippable (92 findings across 55 workflows today):
//
//   TIER 1 — ACTIVE workflows must conform. HARD, NEVER GRANDFATHERED.
//     An active non-conforming workflow is a LIVE defect: a cron with no brakes
//     is the 2026-06-06 runaway precedent, an unauthenticated live webhook is an
//     open door, and no errorWorkflow means failures are silent (P17: wf30's
//     ntfy failed quietly for who knows how long). No baseline entry can excuse
//     one. This is the check DR-0132 §4 actually asked for.
//
//   TIER 2 — INACTIVE workflows ratchet. Today's set is frozen; a NEW finding
//     fails; fixing one shrinks the baseline. An inactive non-conforming
//     workflow is a latent activation gate, not a live bug — that is precisely
//     what the original report-only note said, and it is why failing all 92 at
//     once would block every build while telling Darrell nothing he can act on.
//
// WHAT THIS CANNOT SEE, STATED PLAINLY (DR-0076 §8, and DR-0306's rule that an
// instrument must not be trusted for a property it never measures). It reads the
// `active` flag in the REPO JSON. Activation actually lives in n8n's SQLite DB
// on the NAS, so repo-active and box-running DRIFT — that exact drift is
// recorded in DR-0132's context ("built != running"), where wf18 flipped
// inactive on a restart and stayed down a day. So:
//
//     THIS GATE GOVERNS WHAT WE SHIP. IT DOES NOT KNOW WHAT IS RUNNING.
//
// A workflow activated by hand on the box (as wf-ops-announce was, 2026-08-16)
// is live and unconformed while this gate reports clean, because its repo JSON
// still says inactive. Closing that needs the box to report its own activation
// state back — real work, not done, dated in DR-0307.
//
// Usage:
//   node scripts/workflow-conformance.mjs            # report + enforce
//   node scripts/workflow-conformance.mjs --report   # the old report, exit 0
//   node scripts/workflow-conformance.mjs --write    # re-freeze the baseline
//   node scripts/workflow-conformance.mjs --selftest # proven-to-catch
// =============================================================================
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const BASELINE = join(HERE, 'workflow-conformance-baseline.json');
const DIRS = ['docs/00-foundations/n8n-workflows', 'infra/n8n'];

function loadJson(p) {
  try {
    let raw = readFileSync(p, 'utf8');
    if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1); // strip BOM
    return JSON.parse(raw);
  } catch { return null; }
}

/**
 * Inspect one parsed workflow. Pure, so the selftest can feed it objects.
 * @returns {{code:'W1'|'W2'|'W3', detail:string}[]}
 */
export function inspectWorkflow(wf) {
  const out = [];
  if (!wf || !wf.nodes) return out;
  const types = (wf.nodes || []).map((n) => n.type || '');
  const isSchedule = types.some((t) => t.includes('scheduleTrigger'));
  const isWebhook = types.some((t) => t === 'n8n-nodes-base.webhook');
  const isErrorTrigger = types.some((t) => t.includes('errorTrigger'));
  const code = JSON.stringify(wf.nodes || []);

  if (isSchedule) {
    const hasTimeout = !!(wf.settings && wf.settings.executionTimeout);
    const hasLock = code.includes('getWorkflowStaticData');
    if (!hasTimeout || !hasLock) out.push({ code: 'W1', detail: `timeout:${hasTimeout} lock/kill:${hasLock}` });
  }
  if (!isErrorTrigger) {
    if (!(wf.settings && wf.settings.errorWorkflow)) out.push({ code: 'W2', detail: 'no settings.errorWorkflow' });
  }
  if (isWebhook) {
    const headerAuth = code.includes('"authentication":"headerAuth"') || code.includes('"authentication": "headerAuth"');
    const codeBearer = /authorization|bearer/i.test(code);
    if (!headerAuth && !codeBearer) out.push({ code: 'W3', detail: 'webhook with no headerAuth and no in-code bearer check' });
  }
  return out;
}

export function scan(files) {
  const findings = [];
  let active = 0, total = 0;
  for (const p of files) {
    const wf = loadJson(p);
    if (!wf || !wf.nodes) continue;
    total += 1;
    const isActive = wf.active === true;
    if (isActive) active += 1;
    const name = p.split('/').pop();
    for (const f of inspectWorkflow(wf)) {
      findings.push({ key: `${name}|${f.code}`, name, file: p, active: isActive, ...f });
    }
  }
  return { findings, active, total };
}

function collectFiles() {
  const files = [];
  for (const d of DIRS) {
    const abs = join(ROOT, d);
    if (!existsSync(abs)) continue;
    for (const f of readdirSync(abs)) {
      if (f.endsWith('.json') && statSync(join(abs, f)).isFile()) files.push(join(d, f));
    }
  }
  return files.map((f) => join(ROOT, f));
}

function report({ findings, active, total }) {
  const by = (c) => findings.filter((f) => f.code === c);
  console.log('# WORKFLOW CONFORMANCE (deterministic)\n');
  console.log(`Scanned ${total} workflows · ${active} repo-active · ${total - active} repo-inactive\n`);
  for (const [c, label] of [['W1', 'schedule workflows missing brakes (timeout + lock/kill)'],
    ['W2', 'workflows with no settings.errorWorkflow (silent failures)'],
    ['W3', 'webhooks with no auth (headerAuth or in-code bearer)']]) {
    const rows = by(c);
    console.log(`## ${c} — ${label}: ${rows.length}`);
    rows.slice(0, 60).forEach((r) => console.log(`  - ${r.name}${r.active ? '  [ACTIVE]' : ''}  ${r.detail}`));
    console.log('');
  }
}

async function selftest() {
  let failures = 0;
  const check = (n, pass, d) => { if (!pass) failures += 1; console.log(`${pass ? 'PASS' : 'FAIL'}  ${n}${d ? ` — ${d}` : ''}`); };

  const cron = (extra = {}) => ({ nodes: [{ type: 'n8n-nodes-base.scheduleTrigger' }], settings: { errorWorkflow: 'E1' }, ...extra });
  check('a cron with no timeout and no lock trips W1',
    inspectWorkflow(cron()).some((f) => f.code === 'W1'));
  check('a cron WITH both brakes does not trip W1',
    !inspectWorkflow({ nodes: [{ type: 'n8n-nodes-base.scheduleTrigger', p: 'getWorkflowStaticData' }], settings: { errorWorkflow: 'E1', executionTimeout: 300 } }).some((f) => f.code === 'W1'));

  check('a workflow with no errorWorkflow trips W2',
    inspectWorkflow({ nodes: [{ type: 'n8n-nodes-base.noOp' }], settings: {} }).some((f) => f.code === 'W2'));
  check('an errorTrigger handler is EXEMPT from W2',
    !inspectWorkflow({ nodes: [{ type: 'n8n-nodes-base.errorTrigger' }], settings: {} }).some((f) => f.code === 'W2'));

  check('an unauthenticated webhook trips W3',
    inspectWorkflow({ nodes: [{ type: 'n8n-nodes-base.webhook' }], settings: { errorWorkflow: 'E1' } }).some((f) => f.code === 'W3'));
  check('a headerAuth webhook does not trip W3',
    !inspectWorkflow({ nodes: [{ type: 'n8n-nodes-base.webhook', parameters: { authentication: 'headerAuth' } }], settings: { errorWorkflow: 'E1' } }).some((f) => f.code === 'W3'));

  // TIER 1 is the point of this change: active + non-conforming must fail even
  // when the same key sits in the baseline.
  const activeBad = { active: true, nodes: [{ type: 'n8n-nodes-base.scheduleTrigger' }], settings: {} };
  const f = inspectWorkflow(activeBad);
  check('an ACTIVE cron with no brakes and no errorWorkflow yields W1 AND W2', f.length === 2, f.map((x) => x.code).join('+'));

  const { blocking } = judge(
    [{ key: 'x.json|W1', name: 'x.json', code: 'W1', detail: 'd', active: true }],
    ['x.json|W1'], // grandfathered — must NOT save an active workflow
  );
  check('a baseline entry can NEVER excuse an ACTIVE workflow', blocking.length === 1, JSON.stringify(blocking[0]?.why));

  const { blocking: none } = judge(
    [{ key: 'y.json|W2', name: 'y.json', code: 'W2', detail: 'd', active: false }],
    ['y.json|W2'],
  );
  check('a grandfathered INACTIVE finding does not block', none.length === 0);

  const { blocking: fresh } = judge(
    [{ key: 'z.json|W3', name: 'z.json', code: 'W3', detail: 'd', active: false }], [],
  );
  check('a NEW inactive finding DOES block (the ratchet bites)', fresh.length === 1);

  console.log(`\n${failures === 0 ? 'SELFTEST OK' : 'SELFTEST FAILED'} — ${failures} failure(s)`);
  process.exit(failures === 0 ? 0 : 1);
}

/** Decide what blocks. Exported so the selftest and vitest can drive it. */
export function judge(findings, baseline) {
  const known = new Set(baseline);
  const blocking = [];
  for (const f of findings) {
    if (f.active) blocking.push({ ...f, why: 'ACTIVE workflow must conform — never grandfathered' });
    else if (!known.has(f.key)) blocking.push({ ...f, why: 'NEW finding — the baseline is shrink-only' });
  }
  const keys = [...new Set(findings.map((f) => f.key))];
  const healed = baseline.filter((k) => !keys.includes(k));
  return { blocking, healed };
}

function main() {
  if (process.argv.includes('--selftest')) return selftest();
  const result = scan(collectFiles());
  report(result);

  const keys = [...new Set(result.findings.map((f) => f.key))].sort();
  if (process.argv.includes('--write')) {
    writeFileSync(BASELINE, `${JSON.stringify(keys, null, 2)}\n`);
    console.log(`workflow-conformance: froze ${keys.length} grandfathered findings.`);
    return process.exit(0);
  }
  if (process.argv.includes('--report')) {
    console.log('Report-only mode (--report): exiting 0 regardless.');
    return process.exit(0);
  }

  const baseline = existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, 'utf8')) : [];
  const { blocking, healed } = judge(result.findings, baseline);

  console.log(`${result.findings.length} findings; ${baseline.length} grandfathered (inactive only).`);
  console.log('NOTE: this reads the repo `active` flag. Activation lives in n8n\'s DB on the NAS,');
  console.log('      so this gates WHAT WE SHIP, not what is running (DR-0132 context; DR-0307).');

  if (!blocking.length && !healed.length) {
    console.log('\nOK — no active non-conformance, no new findings; the baseline holds (shrink-only).');
    return process.exit(0);
  }
  console.error('\nworkflow-conformance: FAIL —');
  for (const b of blocking) {
    console.error(`  ${b.code}  ${b.name}${b.active ? '  [ACTIVE]' : ''}\n     ${b.detail}\n     ${b.why}`);
  }
  for (const k of healed) console.error(`  ${k} now conforms — remove it from scripts/workflow-conformance-baseline.json (shrink-only).`);
  console.error('\nW1 = brakes on a cron (2026-06-06 runaway precedent). W2 = failures must not be silent (P17).');
  console.error('W3 = a live webhook needs auth. DR-0132 §4: a green gate must MEAN running-and-correct.');
  return process.exit(1);
}

if (process.argv[1] && process.argv[1].endsWith('workflow-conformance.mjs')) main();
