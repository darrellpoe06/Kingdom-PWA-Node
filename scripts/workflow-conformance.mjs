// =============================================================================
// workflow-conformance — deterministic n8n workflow health check (DR-0058)
// =============================================================================
// Operationalizes the 2026-06-13 review's W1-W4 findings as a standing, $0,
// no-LLM scan: which workflows would be unsafe IF activated. Report-only
// (always exits 0) so it never blocks a build; it surfaces the gates that must
// close before any workflow flips active (the R8/R13 HOLD list, made visible).
//
// Checks per workflow JSON:
//   W1 brakes      — a schedule/cron-triggered workflow with no executionTimeout
//                    AND no $getWorkflowStaticData (no concurrency lock / kill-switch)
//   W2 errorWf     — no settings.errorWorkflow (failures go silent; except the
//                    errorTrigger handlers themselves)
//   W3 auth        — a webhook with authentication != headerAuth and no in-code
//                    bearer/authorization check
//
// Run: node scripts/workflow-conformance.mjs
// =============================================================================
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIRS = ['docs/00-foundations/n8n-workflows', 'infra/n8n'];

function loadJson(p) {
  try {
    let raw = readFileSync(p, 'utf8');
    if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1); // strip BOM
    return JSON.parse(raw);
  } catch { return null; }
}

const files = [];
for (const d of DIRS) {
  if (!existsSync(d)) continue;
  for (const f of readdirSync(d)) {
    if (f.endsWith('.json') && statSync(join(d, f)).isFile()) files.push(join(d, f));
  }
}

const blob = (wf) => JSON.stringify(wf.nodes || []);
const triggerTypes = (wf) => (wf.nodes || []).map(n => n.type || '');

const noBrakes = [], noErrorWf = [], noAuth = [];
let active = 0, total = 0;

for (const p of files) {
  const wf = loadJson(p);
  if (!wf || !wf.nodes) continue;
  total++;
  if (wf.active === true) active++;
  const name = p.split('/').pop();
  const types = triggerTypes(wf);
  const isSchedule = types.some(t => t.includes('scheduleTrigger'));
  const isWebhook = types.some(t => t === 'n8n-nodes-base.webhook');
  const isErrorTrigger = types.some(t => t.includes('errorTrigger'));
  const code = blob(wf);

  // W1 — schedule workflows need the three brakes.
  if (isSchedule) {
    const hasTimeout = !!(wf.settings && wf.settings.executionTimeout);
    const hasLock = code.includes('getWorkflowStaticData');
    if (!hasTimeout || !hasLock) noBrakes.push(`${name} (timeout:${!!hasTimeout} lock/kill:${hasLock})`);
  }
  // W2 — every non-error-handler workflow should route failures to an error workflow.
  if (!isErrorTrigger) {
    const hasErrorWf = !!(wf.settings && wf.settings.errorWorkflow);
    if (!hasErrorWf) noErrorWf.push(name);
  }
  // W3 — webhooks need auth (header-auth or an in-code bearer check).
  if (isWebhook) {
    const headerAuth = code.includes('"authentication":"headerAuth"') || code.includes('"authentication": "headerAuth"');
    const codeBearer = /authorization|bearer/i.test(code);
    if (!headerAuth && !codeBearer) noAuth.push(name);
  }
}

console.log('# WORKFLOW CONFORMANCE (deterministic, report-only)\n');
console.log(`Scanned ${total} workflows · ${active} active · ${total - active} inactive (the R8/R13 HOLD is why)\n`);
console.log(`## W1 — schedule workflows missing brakes (timeout + lock/kill): ${noBrakes.length}`);
noBrakes.forEach(x => console.log(`  - ${x}`));
console.log(`\n## W2 — workflows with no settings.errorWorkflow (silent failures): ${noErrorWf.length}`);
noErrorWf.slice(0, 50).forEach(x => console.log(`  - ${x}`));
console.log(`\n## W3 — webhooks with no auth (headerAuth or in-code bearer): ${noAuth.length}`);
noAuth.forEach(x => console.log(`  - ${x}`));
console.log(`\nReport-only — these are activation gates, not live bugs (everything but the error handler ships inactive). See 2026-06-13-rigorous-review-findings.md (W1-W4).`);
