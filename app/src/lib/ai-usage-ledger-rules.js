// =============================================================================
// ai-usage-ledger-rules — the pure rules of the AI usage ledger (DR-1347)
// =============================================================================
// No JSON import here, so the CLI (scripts/ai-usage-ledger.mjs) and the app
// (lib/ai-usage-ledger.js, which binds the committed file) share one set of
// rules: validate, cover, roll up.
export const FIRST_LEDGERED_DR = 1331;

/** Findings on an entry's shape; [] when sound. */
export function validateEntry(e) {
  const out = [];
  if (!e || typeof e !== 'object') return ['entry is not an object'];
  for (const k of ['id', 'date', 'task', 'model']) if (!e[k] || typeof e[k] !== 'string') out.push(`${e.id || '?'}: ${k} is required`);
  if (e.date && !/^\d{4}-\d{2}-\d{2}$/.test(e.date)) out.push(`${e.id}: date must be YYYY-MM-DD`);
  if (!Array.isArray(e.drs) || !e.drs.length || !e.drs.every((d) => /^DR-\d{4}$/.test(d))) out.push(`${e.id}: drs must name at least one DR-NNNN`);
  if (!(typeof e.wallClockHours === 'number' && e.wallClockHours > 0)) out.push(`${e.id}: wallClockHours must be a positive number measured from commits`);
  if (!(typeof e.estimateWithoutAiHours === 'number' && e.estimateWithoutAiHours > 0)) out.push(`${e.id}: estimateWithoutAiHours must be a positive number`);
  if (!(e.tokens === null || (e.tokens && typeof e.tokens.in === 'number' && typeof e.tokens.out === 'number')))
    out.push(`${e.id}: tokens must be null (no meter) or {in,out}`);
  if (!(e.costUsd === null || typeof e.costUsd === 'number')) out.push(`${e.id}: costUsd must be null (no meter) or a number`);
  if (e.tokens === null && typeof e.costUsd === 'number') out.push(`${e.id}: a cost with no tokens is a guess, not a meter`);
  return out;
}

export function validateLedger(ledger) {
  const out = [];
  const ids = new Set();
  for (const e of ledger.entries || []) {
    out.push(...validateEntry(e));
    if (ids.has(e.id)) out.push(`${e.id}: duplicate id`);
    ids.add(e.id);
    if (e.model && !(ledger.models || {})[e.model]) out.push(`${e.id}: model '${e.model}' is not described in models`);
  }
  for (const s of ledger.sessions || []) {
    if (typeof s.sessionTokensObserved !== 'number' || s.sessionTokensObserved !== s.tokensBudgetAtStart - s.tokensBudgetAtRead)
      out.push(`${s.id}: sessionTokensObserved must equal budgetAtStart - budgetAtRead (a reading, not a guess)`);
    for (const t of s.tasks || []) if (!ids.has(t)) out.push(`${s.id}: names task '${t}' that is not an entry`);
  }
  return out;
}

/** The DR numbers the entries cover. */
export function ledgeredDrs(ledger) {
  return new Set((ledger.entries || []).flatMap((e) => e.drs || []));
}

export function rollup(ledger) {
  const entries = ledger.entries || [];
  const wall = entries.reduce((s, e) => s + e.wallClockHours, 0);
  const est = entries.reduce((s, e) => s + e.estimateWithoutAiHours, 0);
  const metered = entries.filter((e) => e.tokens !== null);
  const usd = metered.reduce((s, e) => s + (e.costUsd || 0), 0);
  const byModel = {};
  for (const e of entries) {
    byModel[e.model] = byModel[e.model] || { tasks: 0, wallClockHours: 0 };
    byModel[e.model].tasks += 1;
    byModel[e.model].wallClockHours += e.wallClockHours;
  }
  const sessionTokens = (ledger.sessions || []).reduce((s, x) => s + (x.sessionTokensObserved || 0), 0);
  return {
    tasks: entries.length,
    wallClockHours: Math.round(wall * 100) / 100,
    estimateWithoutAiHours: Math.round(est * 10) / 10,
    ratio: wall > 0 ? Math.round((est / wall) * 10) / 10 : null,
    meteredTasks: metered.length,
    unmeteredTasks: entries.length - metered.length,
    meteredUsd: Math.round(usd * 100) / 100,
    sessionTokensObserved: sessionTokens,
    byModel,
  };
}
