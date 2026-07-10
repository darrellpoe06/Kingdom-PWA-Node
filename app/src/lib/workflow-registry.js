// =============================================================================
// workflow-registry — Ari's workflow expertise, DERIVED from the stored exports
// =============================================================================
// "Ari should be an expert on each workflow PoeTech stores — why we use it."
// (Darrell, 2026-07-10 — DR-0157.) The registry is measured at build time from
// the REAL workflow exports in the repo (docs/00-foundations/n8n-workflows/ +
// infra/n8n/ — vite.config.js buildWorkflowRegistry): name, active flag,
// webhook doors, node count, and the recorded WHY (the paired README's first
// paragraph). Nothing here is hand-typed.
//
// The honesty rule (NO-STATIC-DATA / DR-0076): a workflow whose why is not yet
// recorded shows as a NAMED GAP Ari owns closing — never a generated-sounding
// description, never a blank that hides the debt. Expertise is the record,
// growing file by file, and the readout tells the truth about how far it's got.
// =============================================================================

// The build-injected registry; empty under test/dev unless injected.
export function storedWorkflowRegistry() {
  return (typeof __WORKFLOW_REGISTRY__ !== 'undefined' && Array.isArray(__WORKFLOW_REGISTRY__))
    ? __WORKFLOW_REGISTRY__
    : [];
}

// Shape the bench readout: totals measured from the rows, the documented set,
// and the gap list (workflows with no recorded why — Ari's open expertise
// debts, each named by file so closing one is a concrete commit).
export function workflowExpertise(rows) {
  const list = (Array.isArray(rows) ? rows : []).filter((r) => r && r.file);
  const documented = list.filter((r) => typeof r.why === 'string' && r.why.trim().length > 0);
  const gaps = list.filter((r) => !r.why || !String(r.why).trim());
  return {
    total: list.length,
    active: list.filter((r) => r.active === true).length,
    withWebhooks: list.filter((r) => Array.isArray(r.webhooks) && r.webhooks.length > 0).length,
    documented: documented.length,
    documentedRows: documented,
    gaps: gaps.map((r) => ({ file: r.file, dir: r.dir || '', name: r.name || r.file })),
  };
}

// One line Ari can speak for a workflow: the recorded why, or the honest gap.
export function workflowWhyLine(row) {
  if (!row) return '';
  const why = String(row.why || '').trim();
  if (why) return why;
  return 'Why-we-use-it not yet recorded for this stored workflow — an open expertise gap Ari owns (DR-0157); the record grows by pairing a README beside the export, never by inventing a description.';
}
