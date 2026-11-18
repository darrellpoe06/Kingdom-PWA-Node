// =============================================================================
// money-readiness — may the FOS Money Phase 1.4 migration be applied? Read
// from the house itself, with no key (DR-1360; migration 0334).
//
// Christina 2026-11-17: no Money migration until authorized database access,
// a confirmed backup, and a tested migration. The record answers the first
// without a key (DR-1269: the NAS applies merged migrations on its own clock;
// DR-1398: the proof rides the public road). This reads the other two facts
// the house now publishes about itself — money_readiness_receipt():
//   · the backup: the NAS's own nightly verdict and weekly restore drill
//     (db_backup.sh, DR-1113), reported by the db-backup-receipt rider;
//   · the books: which Phase 1.4 columns exist on transactions, whether a
//     CHECK limits categories, whether the obligations tables are live.
// Never an amount, a row or a name: the receipt carries none.
//
// judgeReadiness is pure. An absent, unreadable or stale receipt reads as
// NOT CONFIRMED, never as ready (DR-0076: unknown is never current).
// =============================================================================

export const BACKUP_FRESH_HOURS = 36; // one nightly dump, plus a missed night's grace
export const DRILL_FRESH_DAYS = 8; // the drill runs weekly
export const PHASE_14_COLUMNS = ['outstanding', 'cleared_on', 'pending', 'source', 'doc_id'];

const hoursSince = (iso, now) => {
  const t = Date.parse(iso || '');
  return Number.isFinite(t) ? (now.getTime() - t) / 3600000 : null;
};

/** One line per precondition, and whether the migration may be applied. */
export function judgeReadiness(receipt, now = new Date()) {
  const steps = [];
  const r = receipt && typeof receipt === 'object' ? receipt : null;
  const b = r && r.backup && typeof r.backup === 'object' ? r.backup : null;

  if (!r) {
    steps.push({ key: 'receipt', ok: false, line: 'The database has not answered the readiness question yet.' });
    return { ready: false, steps };
  }

  // 1. A confirmed backup: the newest verified dump, recent.
  if (!b || b.seen !== true) steps.push({ key: 'backup', ok: false, line: 'No backup receipt yet: the NAS has not reported its backup.' });
  else if (b.readable === false) steps.push({ key: 'backup', ok: false, line: 'The backup receipt could not be read.' });
  else {
    const age = hoursSince(b.at, now);
    if (b.ok !== true) steps.push({ key: 'backup', ok: false, line: `The last backup did not verify${b.error ? ' (an error was recorded on the NAS)' : ''}.` });
    else if (age == null || age > BACKUP_FRESH_HOURS)
      steps.push({
        key: 'backup',
        ok: false,
        line: `The last verified backup is ${age == null ? 'of unknown age' : `${Math.round(age)} hours old`}; a fresh one is needed.`,
      });
    else
      steps.push({
        key: 'backup',
        ok: true,
        line: `Verified backup ${Math.round(age)} hours ago (${b.toc_entries ?? '?'} archive entries, ${b.kept ?? '?'} kept).`,
      });

    // 2. A restore drill that passed, recently: a backup never restored is a claim (DR-1113).
    const d = b.drill || {};
    const dAge = hoursSince(b.last_drill_at, now);
    if (d.verdict === 'passed' && dAge != null && dAge <= DRILL_FRESH_DAYS * 24)
      steps.push({
        key: 'drill',
        ok: true,
        line: `Restore drill passed ${Math.round(dAge / 24)} day(s) ago: ${d.tables ?? '?'} of ${d.tables_live ?? '?'} tables restored.`,
      });
    else if (d.verdict === 'failed') steps.push({ key: 'drill', ok: false, line: 'The last restore drill FAILED: the backup did not restore whole.' });
    else steps.push({ key: 'drill', ok: false, line: 'No recent passing restore drill is on record.' });
  }

  // 3. The books: what the migration would add, and what is already there.
  const cols = r.transactions_columns && typeof r.transactions_columns === 'object' ? r.transactions_columns : {};
  const present = PHASE_14_COLUMNS.filter((c) => cols[c] === true);
  steps.push({
    key: 'schema',
    ok: true,
    line:
      present.length === PHASE_14_COLUMNS.length
        ? 'The Phase 1.4 columns are already applied.'
        : present.length
          ? `Already present: ${present.join(', ')}.`
          : 'The Phase 1.4 columns are not applied yet.',
    applied: present.length === PHASE_14_COLUMNS.length,
  });
  if (r.category_check === true)
    steps.push({
      key: 'category-check',
      ok: false,
      line: 'A database rule limits categories: "tithes" must be added to it before the Tithes category can sync.',
    });
  steps.push({
    key: 'obligations',
    ok: true,
    line:
      r.obligations_table === true && r.obligation_settlements_table === true
        ? 'The obligations tables are live (reimbursements can be saved).'
        : 'The obligations tables are not live: reimbursements cannot be saved yet.',
    live: r.obligations_table === true && r.obligation_settlements_table === true,
  });

  const ready = steps.filter((s) => ['backup', 'drill', 'category-check'].includes(s.key)).every((s) => s.ok);
  return { ready, steps };
}

/** Ask the database. Returns { receipt, error }; never throws. */
export async function readMoneyReadiness(client) {
  if (!client || typeof client.rpc !== 'function') return { receipt: null, error: 'no database client' };
  try {
    const { data, error } = await client.rpc('money_readiness_receipt');
    return error ? { receipt: null, error: error.message || 'refused' } : { receipt: data || null, error: null };
  } catch (e) {
    return { receipt: null, error: (e && e.message) || 'unreachable' };
  }
}
