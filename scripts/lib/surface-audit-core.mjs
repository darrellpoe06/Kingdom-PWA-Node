// =============================================================================
// surface-audit-core.mjs — PURE logic for the proactive surface audit (DR-0086).
// No I/O, no net. The testable core the CLI harness + the NAS loop are built on.
// =============================================================================
// THE GAP THIS CLOSES (Darrell, 2026-07-01): "everything I brought up this
// morning literally didn't need me to name if our orchestrator and uiux etc
// teams were working... Why do I have to catch you failing to deliver my
// requirements instead of you being proactive?" He is the GOVERNOR, not the QA.
// The morning's misses — endless-scroll list, oldest-first sort, static IN/OUT
// tiles, admin unreachable, harvest stuck at 0 — are a CLASS a human with full
// context would catch by reflex. This encodes that reflex as a standing check so
// it never again depends on a given session noticing (the same move tenancy-guard
// made for data-isolation).
//
// This module is PURE so the verification gate can prove it (DR-0076): every
// finding is a deterministic function of (surface metadata, source text, rubric).
// The CLI harness (scripts/surface-audit.mjs) does the I/O — read the registry,
// read each component source, write the findings artifact + event reel — and asks
// THIS module what is wrong. Deterministic + $0 + NO LLM: a model is reserved only
// for kind:'judgment' items, which this deterministic core refuses (like the NAS
// loop refuses kind:'ai') so the always-on loop never waits on a vendor.
// =============================================================================

export const SEVERITY_RANK = { critical: 0, high: 1, medium: 2, low: 3 };
export const SUPPORTED_KINDS = ['source-pattern', 'reachability', 'judgment'];

// --- Rubric validation -------------------------------------------------------
// A rubric is { version, dimensions, items:[...], liveProbes? }. Each item is
// { id, label, dimension, severity, kind, ... }. We validate the shape so a
// malformed rubric fails loudly instead of silently auditing nothing (a gate
// that checks nothing is itself a lie — DR-0076 anti-theater).
export function validateRubric(rubric) {
  const errors = [];
  if (rubric === null || typeof rubric !== 'object' || Array.isArray(rubric)) {
    return { ok: false, errors: ['rubric must be a JSON object'] };
  }
  if (rubric.version !== 1) errors.push('version must be 1');
  if (!Array.isArray(rubric.items)) {
    errors.push('items must be an array');
    return { ok: false, errors };
  }
  const seen = new Set();
  rubric.items.forEach((it, i) => {
    const at = `items[${i}]${it && it.id ? ` (${it.id})` : ''}`;
    if (!it || typeof it !== 'object') { errors.push(`${at}: must be an object`); return; }
    if (typeof it.id !== 'string' || !/^[a-z0-9][a-z0-9-]{1,50}$/.test(it.id)) errors.push(`${at}: id must be kebab-case`);
    if (it.id) { if (seen.has(it.id)) errors.push(`${at}: duplicate id`); seen.add(it.id); }
    if (typeof it.label !== 'string' || !it.label) errors.push(`${at}: label required`);
    if (!(it.severity in SEVERITY_RANK)) errors.push(`${at}: severity must be one of ${Object.keys(SEVERITY_RANK).join('|')}`);
    if (!SUPPORTED_KINDS.includes(it.kind)) errors.push(`${at}: kind must be one of ${SUPPORTED_KINDS.join('|')}`);
    if (it.kind === 'source-pattern') {
      if (!Array.isArray(it.patterns) || it.patterns.length === 0) errors.push(`${at}: source-pattern needs a non-empty patterns[]`);
      if (it.expect !== 'present' && it.expect !== 'absent') errors.push(`${at}: expect must be 'present' or 'absent'`);
      // Each pattern must be a compilable regex.
      for (const p of (it.patterns || [])) {
        try { new RegExp(p, it.flags || ''); } catch (e) { errors.push(`${at}: bad regex ${JSON.stringify(p)}: ${e.message}`); }
      }
    }
  });
  return { ok: errors.length === 0, errors };
}

// --- Finding helpers ---------------------------------------------------------
// A stable key so the same defect on the same surface dedupes across runs and can
// be diffed to detect a RESOLVED finding (the surface passed re-audit).
export function findingKey(f) {
  return `${f.surface || '-'}::${f.item || '-'}::${f.line == null ? '-' : f.line}`;
}

function firstMatchLine(source, re) {
  const lines = String(source || '').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = re.exec(lines[i]);
    re.lastIndex = 0;
    if (m) return { line: i + 1, snippet: lines[i].trim().slice(0, 200) };
  }
  return null;
}

// --- Source-pattern check ----------------------------------------------------
// Run every source-pattern rubric item against ONE surface's source. `expect:
// 'absent'` => a match is a finding (with the offending line). `expect: 'present'`
// => the ABSENCE of any match is a finding. Items list their own excludeSurfaces.
export function auditSource(surface, source, rubric) {
  const findings = [];
  const items = (rubric && rubric.items) || [];
  for (const it of items) {
    if (it.kind !== 'source-pattern') continue;
    if (Array.isArray(it.excludeSurfaces) && it.excludeSurfaces.includes(surface.id)) continue;
    // A check may SCOPE itself to named surfaces (e.g. only long-list surfaces
    // must paginate). An empty/absent includeSurfaces means "every surface".
    if (Array.isArray(it.includeSurfaces) && it.includeSurfaces.length && !it.includeSurfaces.includes(surface.id)) continue;
    let hit = null;
    for (const p of it.patterns) {
      const re = new RegExp(p, it.flags || '');
      const m = firstMatchLine(source, re);
      if (m) { hit = { ...m, pattern: p }; break; }
    }
    const isFinding = it.expect === 'absent' ? !!hit : !hit;
    if (!isFinding) continue;
    findings.push(makeFinding(it, surface, {
      detail: it.expect === 'absent'
        ? `Found on line ${hit.line}.`
        : `The expected marker for this check was not found anywhere in the surface.`,
      evidence: hit ? hit.snippet : null,
      line: hit ? hit.line : null,
    }));
  }
  return findings;
}

function makeFinding(item, surface, extra) {
  const f = {
    surface: surface.id,
    surfaceLabel: surface.label || surface.id,
    item: item.id,
    title: item.label,
    dimension: item.dimension || null,
    severity: item.severity,
    severityRank: SEVERITY_RANK[item.severity],
    detail: extra.detail || '',
    evidence: extra.evidence || null,
    line: extra.line == null ? null : extra.line,
    file: surface.file || null,
    fix: item.fix || '',
    detectedBy: 'surface-audit',
  };
  f.key = findingKey(f);
  return f;
}

// --- Reachability check (registry vs shell render) ---------------------------
// A top-level surface (nav:'top') is reachable only if the shell has a
// `view === '<id>'` render branch. A registered surface with NO such branch is
// dead — a user can never reach it in-app (the 'admin not reachable' class).
// Conservative ON PURPOSE: it asserts the render branch a top surface literally
// needs, so it never false-positives. Church/books SUB-surfaces route through a
// composite (churchView/booksView) the shell resolves dynamically; the
// deterministic check does NOT cover them (documented limitation — surfaced by
// the CLI, never silently dropped, per Verification Doctrine "no silent caps").
export function checkReachability(surfaces, shellSource, rubric) {
  const item = (rubric.items || []).find((i) => i.kind === 'reachability');
  if (!item) return { findings: [], checked: [], skipped: [] };
  const src = String(shellSource || '');
  const findings = [];
  const checked = [];
  const skipped = [];
  for (const s of surfaces) {
    if (s.nav !== 'top') { skipped.push(s.id); continue; }
    if (Array.isArray(item.excludeSurfaces) && item.excludeSurfaces.includes(s.id)) { skipped.push(s.id); continue; }
    const view = s.view || s.id;
    // Whitespace-tolerant: view === 'x' | view==="x" | view ===`x`
    const re = new RegExp(`view\\s*===\\s*['"\`]${escapeRe(view)}['"\`]`);
    checked.push(s.id);
    if (!re.test(src)) {
      findings.push(makeFinding(item, s, {
        detail: `Registered in surfaces.js but no \`view === '${view}'\` render branch found in the shell — unreachable in-app.`,
        evidence: `expected: view === '${view}'`,
        line: null,
      }));
    }
  }
  return { findings, checked, skipped };
}

function escapeRe(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// --- Orchestrate a full audit ------------------------------------------------
// sources: { [surfaceId]: sourceText }. shellSource: the monolith/shell text
// (for reachability). Returns { findings, summary, coverage }.
export function runAudit({ surfaces = [], sources = {}, shellSource = '', rubric } = {}) {
  const v = validateRubric(rubric);
  if (!v.ok) throw new Error(`invalid rubric: ${v.errors.join('; ')}`);
  let findings = [];
  const audited = [];
  const missingSource = [];
  for (const s of surfaces) {
    const src = sources[s.id];
    if (src == null) { missingSource.push(s.id); continue; }
    audited.push(s.id);
    findings = findings.concat(auditSource(s, src, rubric));
  }
  const reach = checkReachability(surfaces, shellSource, rubric);
  findings = findings.concat(reach.findings);
  // Deterministic order: severity then surface then item then line.
  findings.sort((a, b) =>
    a.severityRank - b.severityRank ||
    a.surface.localeCompare(b.surface) ||
    a.item.localeCompare(b.item) ||
    ((a.line || 0) - (b.line || 0)));
  return {
    findings,
    summary: summarize(findings),
    coverage: {
      surfacesTotal: surfaces.length,
      auditedSource: audited.length,
      missingSource,
      reachabilityChecked: reach.checked,
      reachabilitySkipped: reach.skipped,
    },
  };
}

export function summarize(findings) {
  const out = { total: findings.length, critical: 0, high: 0, medium: 0, low: 0, byDimension: {} };
  for (const f of findings) {
    if (f.severity in out) out[f.severity] += 1;
    const d = f.dimension || 'other';
    out.byDimension[d] = (out.byDimension[d] || 0) + 1;
  }
  return out;
}

// --- Map a finding to a Concerns-board concern card --------------------------
// The board is the family-facing home for every concern (concerns.js). An audit
// finding becomes a read-through concern card: the auto-filed defect on one side,
// the suggested fix + severity on the other — so it LANDS ACTIONABLE, exactly
// like a triaged feedback row. Not persisted into the `concerns` table; the
// findings artifact stays the source of truth (a re-audit that no longer finds it
// drops the card = auto-resolved).
export function findingToConcern(f) {
  const sevLabel = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' }[f.severity] || f.severity;
  const where = f.line ? ` (line ${f.line})` : '';
  return {
    id: `audit-${f.key.replace(/[^a-zA-Z0-9]+/g, '-')}`,
    concern: `[Auto-audit] ${f.surfaceLabel}: ${f.title}${where}. ${f.detail}`,
    solution: f.fix || null,
    status: 'open',
    targetDate: null,
    whenNote: `auto-audit · ${sevLabel}${f.dimension ? ' · ' + f.dimension : ''}`,
    area: `Audit · ${f.surfaceLabel}`,
    source: 'audit',
    readOnly: true,
    severity: f.severity,
    evidence: f.evidence || null,
    surface: f.surface,
    file: f.file || null,
    dimension: f.dimension || null,
  };
}

// --- Diff two runs to detect RESOLVED findings -------------------------------
// A finding present last run but absent this run means the surface passed
// re-audit — the fix landed. This is how a dispatched fix is marked resolved
// deterministically (no human, no LLM): the finding simply stops being produced.
export function diffFindings(prevFindings = [], currFindings = []) {
  const prev = new Map(prevFindings.map((f) => [f.key, f]));
  const curr = new Map(currFindings.map((f) => [f.key, f]));
  const resolved = [...prev.values()].filter((f) => !curr.has(f.key));
  const introduced = [...curr.values()].filter((f) => !prev.has(f.key));
  const persisting = [...curr.values()].filter((f) => prev.has(f.key));
  return { resolved, introduced, persisting };
}
