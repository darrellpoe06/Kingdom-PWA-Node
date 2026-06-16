// =============================================================================
// loop-health — detect stagnant loops so the app reviews its own dead/fake ones
// =============================================================================
// Darrell 2026-06-15: "we need a loop review inside the PoeTech app — if anything
// begins to not loop or is stagnant, it asks if we should keep it after so long of
// it not updating data." This is the systematized, in-app version of the manual
// fake-loop audit: each tracked loop declares a REAL freshness signal (its last
// actual update, read from real state — never painted). A loop that hasn't updated
// past its threshold is flagged for a Governor keep/retire decision.
//
// Grounds: DR-0061 (a surface is a live view of real flow), DR-0075 (nothing
// stagnates silently — a parked thing gets a why + re-review), DR-0076 (verify,
// don't claim). Pure + deterministic so it's testable and the local-LLM
// orchestrator can run it headless.
// =============================================================================

export function toMs(v) {
  if (v == null || v === '') return null;
  const t = Date.parse(v);
  return Number.isNaN(t) ? null : t;
}

export function daysSince(lastMs, nowMs) {
  if (lastMs == null) return null;
  return Math.floor((nowMs - lastMs) / 86400000);
}

// The loop registry. Each loop's `lastUpdate(data, env)` returns the ms of its
// last REAL update, or null if there is no real update signal at all (a painted
// / dead loop — a prime retire candidate). `env` carries client-side signals
// that don't live in `data` (localStorage markers, hardcoded constants).
export const LOOPS = [
  { key: 'financial',     label: 'Financial data (accounts · debts · income)', staleDays: 35,
    // Freshest of: a manual data stamp OR the latest financial DOCUMENT that
    // actually arrived from the sourced email/bank stream (env.financialDocAt).
    // So the loop reads "updating" WHEN a Chase/etc. document comes in, not on a
    // hand-set date (Darrell 2026-06-16: "based on when a financial document comes in").
    lastUpdate: (d, env) => { const ts = [toMs(d?.meta?.lastUpdated), toMs(env?.financialDocAt)].filter((x) => x != null); return ts.length ? Math.max(...ts) : null; } },
  { key: 'ledger',        label: 'Transaction ledger',                          staleDays: 45,
    lastUpdate: (d) => { const ts = (d?.transactions || []).map(t => toMs(t?.date) ?? toMs(t?.createdAt)).filter(Boolean); return ts.length ? Math.max(...ts) : null; } },
  { key: 'cloud-snapshot',label: 'Cloud sync (family snapshot)',                staleDays: 21,
    lastUpdate: (_d, env) => toMs(env?.snapshotMarker) },
  { key: 'numeric-verify',label: 'Balance verification',                        staleDays: 60,
    lastUpdate: (d) => toMs(d?.numericSyncVerifiedAt) },
  { key: 'engagement',    label: 'Daily trivia / sermon',                       staleDays: 10,
    lastUpdate: (_d, env) => toMs(env?.triviaDate) },
];

// Assess every loop against `now`. status: 'fresh' | 'stale' | 'never'.
export function assessLoops(data, nowMs, env = {}) {
  return LOOPS.map((loop) => {
    const last = loop.lastUpdate(data, env);
    const ds = daysSince(last, nowMs);
    let status;
    if (last == null) status = 'never';
    else status = ds > loop.staleDays ? 'stale' : 'fresh';
    return { key: loop.key, label: loop.label, staleDays: loop.staleDays, lastUpdate: last, daysSince: ds, status };
  });
}

// The loops that need the Governor's attention (stagnant or never-updating).
export function stagnantLoops(data, nowMs, env = {}) {
  return assessLoops(data, nowMs, env).filter((l) => l.status !== 'fresh');
}
