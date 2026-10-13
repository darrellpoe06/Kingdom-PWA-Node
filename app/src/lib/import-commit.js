// =============================================================================
// import-commit — verify what an import actually SAVED, and report N of M
// =============================================================================
// Christina's books, 2026-07-18: an import used to fire per-row cloud uploads
// fire-and-forget, so a row that failed to upload was silently local-only and the
// user never knew (the June gap). REV-0114 added retry; this closes the loop: the
// import AWAITS every upload, counts what actually landed, RE-UPLOADS the misses,
// and reports "Saved N of M to the cloud" — so a partial save is VISIBLE and
// self-healing, never silent again (EXECUTION-OUTCOME-OBSERVABILITY / DR-0076).
//
// Pure w.r.t. the injected `upload` (transactionsSync.upload). Testable without a
// live Supabase: pass a mock uploader and assert the summary + retry behavior.
// =============================================================================

// reconcileCommit(rows, results) — given the rows attempted and the per-row upload
// results (transactionsSync.upload shape: {uploaded:true,remoteId} on success,
// {skipped:'signed-out'|'no-tenant'} when cloud sync is OFF, {skipped:'insert-error'}
// on a real failure), return { total, saved, failed, failedRows, remoteIds, offline }.
// `offline` = every row skipped because sync is off (local-only mode) — not a
// failure, so the readout says "saved locally" instead of crying wolf.
export function reconcileCommit(rows, results) {
  const list = rows || [];
  const total = list.length;
  const failedRows = [];
  const remoteIds = {};
  let saved = 0;
  let offlineCount = 0;
  (results || []).forEach((res, i) => {
    if (res && res.uploaded) { saved += 1; if (res.remoteId != null && list[i]) remoteIds[list[i].id] = res.remoteId; }
    else if (res && (res.skipped === 'signed-out' || res.skipped === 'no-tenant')) { offlineCount += 1; }
    else { failedRows.push(list[i]); }
  });
  return { total, saved, failed: failedRows.length, failedRows, remoteIds, offline: total > 0 && offlineCount === total };
}

// commitRowsToCloud(rows, upload) — upload each row (upload already retries
// transient failures, REV-0114), await all, and return { results, summary }. Never
// throws — a thrown upload becomes an insert-error result for that row.
export async function commitRowsToCloud(rows, upload) {
  const results = [];
  for (const row of rows || []) {
    let res;
    try { res = await upload(row); } catch (e) { res = { skipped: 'insert-error', error: e }; }
    results.push(res);
  }
  return { results, summary: reconcileCommit(rows, results) };
}

// commitWithRepair(rows, upload, { passes }) — commit, then RE-UPLOAD the rows that
// did not land, up to `passes` extra times. Returns the final summary (with any
// still-failing rows). This is the self-heal: a burst that dropped rows on pass 1
// gets them on pass 2, and whatever still fails is reported, not hidden.
export async function commitWithRepair(rows, upload, { passes = 1 } = {}) {
  let { summary } = await commitRowsToCloud(rows, upload);
  let attempt = 0;
  while (summary.failed > 0 && !summary.offline && attempt < passes) {
    attempt += 1;
    const retry = await commitRowsToCloud(summary.failedRows, upload);
    // Merge: the retry's saved add to the running total; its remoteIds fold in.
    summary = {
      total: summary.total,
      saved: summary.saved + retry.summary.saved,
      failed: retry.summary.failed,
      failedRows: retry.summary.failedRows,
      remoteIds: { ...summary.remoteIds, ...retry.summary.remoteIds },
      offline: retry.summary.offline,
    };
  }
  return summary;
}

// commitReadout(summary) — the one-line human message for the import result.
export function commitReadout(summary) {
  if (!summary || !summary.total) return '';
  if (summary.offline) return `Saved ${summary.total} locally — you're not signed in, so they'll sync to the cloud when you sign in.`;
  if (summary.failed === 0) return `Saved all ${summary.total} to the cloud.`;
  return `Saved ${summary.saved} of ${summary.total} to the cloud — ${summary.failed} did not upload. Check your connection and re-run the import; already-saved rows won't double up.`;
}
