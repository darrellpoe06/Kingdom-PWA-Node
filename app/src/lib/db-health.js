// =============================================================================
// db-health — the in-app DB Health data layer (Governor surface)
// =============================================================================
// Reads the db-migrate ledger (public._schema_migrations) through the
// family-gated schema_migrations_health() RPC (0060), so a governor can verify
// schema state from INSIDE the app: what is applied, what FAILED (with the real
// error), and when the lane last ran. No painted status — every value is a real
// ledger row written by scripts/db-migrate-apply.sh (DR-0084 §3, DR-0076).
//
// The doing (applying migrations) stays on the deploy lane, inside the Cage —
// this surface is the WATCHING layer: read-only, it cannot break the lane and
// never executes DDL in the browser (DR-0083 posture, DR-0084 §4).
import supabase from './supabase.js';

// fetchSchemaHealth() -> one of:
//   { status: 'ok', data }            — the RPC returned the ledger snapshot
//   { status: 'unauthorized' }        — signed in, but not a poe-family governor
//   { status: 'unavailable', error }  — RPC missing / transient / not signed in
export async function fetchSchemaHealth() {
  try {
    const { data, error } = await supabase.rpc('schema_migrations_health');
    if (error) {
      const code = error.code || '';
      const msg = (error.message || '').toLowerCase();
      if (code === '42501' || msg.includes('not authorized')) {
        return { status: 'unauthorized' };
      }
      return { status: 'unavailable', error };
    }
    return { status: 'ok', data: data || null };
  } catch (e) {
    return { status: 'unavailable', error: e };
  }
}

// summary() — safe accessor. Missing keys read 0 (an absent count is zero, honest).
export function summary(result) {
  const s = (result && result.summary) || {};
  const applied = Number(s.applied || 0);
  const failed = Number(s.failed || 0);
  const total = Number(s.total || applied + failed);
  return { applied, failed, total };
}

// summaryTiles() — the KPI row: Applied / Failed / Last applied.
export function summaryTiles(result) {
  const s = summary(result);
  return [
    { label: 'Applied', value: String(s.applied) },
    { label: 'Failed', value: String(s.failed) },
    { label: 'Last applied', value: fmtWhen(result && result.last_applied_at) },
  ];
}

// healthKpiStatus() — the ONE roll-up dot for the card.
//   any failed row       -> 'problem'  (a migration broke and did not apply)
//   ledger not init       -> 'attention' (runner has never populated it here)
//   otherwise             -> 'good'
export function healthKpiStatus(result) {
  if (!result) return 'idle';
  if (result.ledger_initialized === false) return 'attention';
  if (summary(result).failed > 0) return 'problem';
  return 'good';
}

export function healthKpiLabel(result) {
  if (!result) return 'No data';
  if (result.ledger_initialized === false) return 'Ledger not initialized';
  const f = summary(result).failed;
  if (f > 0) return `${f} failed`;
  return 'All applied';
}

// failedList() — the migrations the lane could not apply, with the real error.
export function failedList(result) {
  const arr = (result && result.failed) || [];
  return Array.isArray(arr) ? arr : [];
}

// migrations() — newest-applied-first list for the detail table.
export function migrations(result) {
  const arr = (result && result.migrations) || [];
  return Array.isArray(arr) ? arr : [];
}

// fmtWhen() — a short, human timestamp. Never invents a value.
export function fmtWhen(ts) {
  if (!ts) return '—';
  const s = String(ts);
  // ISO -> "YYYY-MM-DD HH:MM"; leave anything else as-is (truncated).
  const m = s.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/);
  return m ? `${m[1]} ${m[2]}` : s.slice(0, 16);
}
