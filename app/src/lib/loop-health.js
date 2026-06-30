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

import { latestRun } from './loop-runs.js';

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
// last REAL update, or null if there is no real update signal at all. `env`
// carries client-side signals that don't live in `data` (localStorage markers,
// hardcoded constants).
//
// A null lastUpdate is read two different, honest ways (DR-0076 — mark what is
// unverified truthfully, don't paint it):
//   - a loop that SHOULD have a live source but doesn't => 'never' (a painted /
//     dead loop, a prime retire candidate);
//   - a loop wired to a REAL source that simply isn't connected YET => declares
//     `awaitingSource` (a one-line why), and reads 'awaiting' instead of a
//     dangling red NEVER. It self-heals to fresh/stale the moment real data
//     flows. This keeps the surface from claiming a loop is dead when the truth
//     is it is waiting on a named upstream (DR-0075 — a why, not a silent drop).
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
    // REAL SOURCE (Darrell 2026-06-23): Bishop Gwin's Wednesday 1PM Bible Study
    // on YouTube (@thelovecorner). At the END of each Wednesday message BG shows
    // and speaks the trivia questions and asks viewers to send answers in. The
    // video is already reachable (church-live.js rolling-latest uploads playlist;
    // youtube-title-parse.js already tags 'wednesday' titles) and the review
    // pipeline already exists (trivia_questions draft->approve in engagement-sync).
    // What is NOT wired yet is the EXTRACTION of the end-of-video questions
    // (transcribe the Wednesday video -> generate -> review), the natural job for
    // the local Whisper SME pipeline. So this is a real, in-progress source -
    // NOT a dead-end. It self-heals to fresh the moment an active question date
    // flows in via env.triviaDate. Do NOT gate this on the user.
    awaitingSource: 'Sourced from Bishop Gwin’s Wednesday 1PM YouTube message (he poses the trivia questions at the end). Extraction not wired yet — pull the questions from each Wednesday video.',
    lastUpdate: (_d, env) => toMs(env?.triviaDate) },
  { key: 'feedback-concerns', label: 'Feedback → Concerns & Solutions', staleDays: 30,
    // The interconnection loop (feedback + curated concern rows → Concerns board →
    // proof rail) self-reports here. Reads the freshest REAL timestamp across the
    // persisted concern rows (updated/created) — never painted. With no concern row
    // yet it reads 'awaiting' (the loop is wired and self-heals on the first
    // capture), not a dead 'never'.
    awaitingSource: 'No concern row captured yet — the board auto-feeds from real feedback + curated concerns the moment one lands.',
    lastUpdate: (d) => { const ts = (d?.concerns || []).flatMap((c) => [toMs(c?.updatedAt), toMs(c?.createdAt)]).filter((x) => x != null); return ts.length ? Math.max(...ts) : null; } },
  { key: 'upload-import', label: 'Statement import (CSV / Excel → ledger)', staleDays: 45, runKey: 'upload-import',
    // The verified-upload DOING loop (Books → Tx → Import CSV/Excel) EMITS a run
    // record (lib/loop-runs) on every import — ran-when / rows / status. This reads
    // its last run. Deterministic + in-app, NO n8n (DR-0083). Reads 'awaiting' until
    // the first real import runs, then self-heals to fresh.
    awaitingSource: 'No import run yet — emits a run when you import a CSV/Excel statement in Books → Tx.',
    lastUpdate: (_d, env) => { const r = latestRun(env?.loopRuns, 'upload-import'); return r ? toMs(r.at) : null; } },
];

// Assess every loop against `now`. status: 'fresh' | 'stale' | 'never' | 'awaiting'.
// 'awaiting' = no real update yet BUT the loop declares a real upstream that is
// simply not connected, so it is honestly waiting rather than dead.
export function assessLoops(data, nowMs, env = {}) {
  return LOOPS.map((loop) => {
    const last = loop.lastUpdate(data, env);
    const ds = daysSince(last, nowMs);
    let status;
    if (last == null) status = loop.awaitingSource ? 'awaiting' : 'never';
    else status = ds > loop.staleDays ? 'stale' : 'fresh';
    // Loops that emit run-state (DR-0083) carry their latest run record for the
    // watching layer to show — ran-when / processed / status — never painted.
    const lastRun = loop.runKey ? latestRun(env?.loopRuns, loop.runKey) : null;
    return { key: loop.key, label: loop.label, staleDays: loop.staleDays, lastUpdate: last, daysSince: ds, status, awaitingSource: loop.awaitingSource || null, lastRun };
  });
}

// The loops that need the Governor's attention (anything not actively fresh —
// stale, never-updating, or awaiting an unconnected source).
export function stagnantLoops(data, nowMs, env = {}) {
  return assessLoops(data, nowMs, env).filter((l) => l.status !== 'fresh');
}
