// =============================================================================
// llm-review (app side) — pure, testable normalizer for the advisory review feed
// =============================================================================
// "Have the local LLMs review the app for bugs or fixes." (Darrell, 2026-06-16.)
//
// This is the APP's view of the report produced by scripts/orchestration/
// llm-review.mjs (qwen2.5 on the NAS reviews a branch's diff, ADVISORY). The
// script writes a JSON report to the Caddy site; it is served at the sovereign
// same-origin path GET /reviews/llm-review.json (DR-0218 zero-n8n); LlmReview.jsx
// renders it on the Build board.
//
// HARD constraints carried through to the surface:
//   - ADVISORY ONLY. This is a flagged-concerns view, never a gate and never a
//     claim the code is correct. The merge gate is deterministic CI (lint +
//     vitest); the card says so.
//   - READ-ONLY. Nothing here (or in the script) edits code.
//   - HONEST OFFLINE (DR-0076). No report yet / unreachable feed -> ok:false and
//     the card shows how to light it up, never a painted "all clear".
//
// The PARSING is pure + unit-tested so the card's data handling never ships
// unverified — the live feed needs the NAS, the math does not. Mirrors
// normalizeLlmHealth / normalizeInfraInventory exactly.

// Canonical severities, ranked. Anything else from the feed degrades to 'warning'.
export const SEVERITY_RANK = { bug: 3, warning: 2, nit: 1 };

// Normalize one finding row. Defensive: garbage -> a safe, displayable shape.
function normFinding(f) {
  if (!f || typeof f !== 'object') return null;
  const sev = String(f.severity || 'warning').toLowerCase();
  const concern = String(f.concern || '').trim();
  if (!concern) return null;
  return {
    file: f.file ? String(f.file) : null,
    line: Number.isInteger(f.line) ? f.line : (Number.isFinite(Number(f.line)) ? Number(f.line) : null),
    severity: SEVERITY_RANK[sev] ? sev : 'warning',
    concern,
    suggestion: f.suggestion ? String(f.suggestion).trim() : null,
  };
}

// "file:line" for a finding, or just the file when the line is unknown.
export function findingLocation(f) {
  if (!f || !f.file) return '(unknown)';
  return f.line != null ? `${f.file}:${f.line}` : f.file;
}

// Turn the raw report body into a normalized shape. Never throws. ok:false on
// null / garbage / an explicit error envelope (so the card degrades honestly).
export function normalizeLlmReview(json) {
  if (!json || typeof json !== 'object' || json.ok === false) {
    return { ok: false, error: (json && json.error) || 'unavailable', findings: [] };
  }
  const findings = (Array.isArray(json.findings) ? json.findings : [])
    .map(normFinding)
    .filter(Boolean)
    .sort((a, b) => (SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]) || String(a.file || '').localeCompare(String(b.file || '')));
  const bugs = findings.filter((f) => f.severity === 'bug').length;
  const warnings = findings.filter((f) => f.severity === 'warning').length;
  const filesCount = Number.isFinite(json.files_reviewed_count) ? json.files_reviewed_count
    : (Array.isArray(json.files_reviewed) ? json.files_reviewed.length : null);
  return {
    ok: true,
    generatedAt: json.generated_at || json.generatedAt || null,
    base: json.base ? String(json.base) : null,
    head: json.head ? String(json.head) : null,
    model: json.model ? String(json.model) : null,
    source: json.source ? String(json.source) : 'local',
    escalated: json.escalated === true,
    escalationRecommended: json.escalation_recommended === true || json.escalationRecommended === true,
    escalationReason: json.escalation_reason || json.escalationReason || null,
    filesReviewed: Array.isArray(json.files_reviewed) ? json.files_reviewed.map(String) : [],
    filesReviewedCount: filesCount,
    diffLines: Number.isFinite(json.diff_lines) ? json.diff_lines : (Number.isFinite(json.diffLines) ? json.diffLines : null),
    counts: {
      findings: findings.length,
      bugs,
      warnings,
      nits: findings.length - bugs - warnings,
    },
    findings,
  };
}

// The card's ONE overall KPI, mapped onto the shared status states
// (lib/kpi-status.js). Honest: no report / unreachable = 'idle' (no data), never
// a misleading green. A bug-severity finding is a 'problem'; warnings are
// 'attention'; a clean review is 'good'. Mirrors llmHealthKpi / infraInventoryKpi.
export function llmReviewKpi(phase, data) {
  if (phase === 'loading') return { status: 'idle', label: 'Checking' };
  if (phase !== 'ok' || !data || !data.ok) return { status: 'idle', label: 'No review yet' };
  if (data.counts.bugs > 0) return { status: 'problem', label: `${data.counts.bugs} likely bug${data.counts.bugs === 1 ? '' : 's'}` };
  if (data.counts.warnings > 0) return { status: 'attention', label: `${data.counts.warnings} warning${data.counts.warnings === 1 ? '' : 's'}` };
  return { status: 'good', label: 'No bugs flagged' };
}
