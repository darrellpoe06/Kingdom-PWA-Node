// =============================================================================
// rent-statement — the tenant's keepable payment record (rentals build step b3a)
// =============================================================================
// Darrell 2026-07-27: "allow the tenants to see their payment historical events
// so they will also have records." Two honest halves:
//
//   b3a (THIS, ships now, no migration): the owner — already signed in and
//     authorized over the ledger — generates a plain, dated STATEMENT of a
//     door's payment history and hands it to the tenant (native share / copy /
//     text). The tenant "has their records" today, sovereignly, with no new
//     auth surface and no new data access.
//
//   b3b (follow-on, Tier C): the tenant signs in to a live self-service view.
//     The DATABASE half is ALREADY built — schema-v2.9-portal-rls.sql's
//     `rent_payments_renter_portal_read` / `leases_renter_portal_read` let a
//     renter (and household members) read their OWN rows via
//     current_external_user_id(). What remains is the external-user portal
//     auth flow in the app (issuing that session + linking a renter to it) —
//     a governed Tier-C build, surfaced separately.
//
// This module is PURE: it formats real rows (from loadRentPayments) into text.
// It invents nothing — a month with no receipt events lists none; totals are
// summed from the real amounts (DR-0076/DR-0061). Money never moves (DR-0094).
// =============================================================================

const money = (n) => `$${(Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const METHOD_LABEL = { cash: 'Cash', check: 'Check', ach: 'ACH/bank', zelle: 'Zelle', venmo: 'Venmo', cashapp: 'Cash App', other: 'Other' };
const methodLabel = (m) => METHOD_LABEL[m] || (m ? String(m) : '');

/** Sum received + expected across the statement's months. Pure. */
export function statementTotals(rows) {
  const list = Array.isArray(rows) ? rows : [];
  let received = 0;
  let expected = 0;
  for (const r of list) { received += Number(r.received) || 0; expected += Number(r.expected) || 0; }
  const balance = expected - received;
  return { received, expected, balance };
}

/**
 * Build the plain-text statement the owner hands the tenant. Deterministic:
 * no Date.now() — the caller passes `asOf` (a YYYY-MM-DD string) for the header.
 * Rows are whatever loadRentPayments returned (newest-first); we present them
 * as-is. Returns a single string.
 */
export function buildTenantStatement({ doorName = '', tenantName = '', rows = [], asOf = '' } = {}) {
  const list = Array.isArray(rows) ? rows : [];
  const { received, expected, balance } = statementTotals(list);
  const lines = [];
  lines.push('RENT PAYMENT STATEMENT');
  if (doorName) lines.push(`Property: ${doorName}`);
  if (tenantName) lines.push(`Tenant: ${tenantName}`);
  if (asOf) lines.push(`As of: ${asOf}`);
  lines.push('');
  if (list.length === 0) {
    lines.push('No payments recorded yet.');
  } else {
    for (const r of list) {
      lines.push(`${r.month} — paid ${money(r.received)} of ${money(r.expected)} (${r.status || ''})`);
      const events = Array.isArray(r.events) ? r.events : [];
      for (const e of events) {
        const when = e.at ? String(e.at).slice(0, 10) : '';
        const where = e.location ? ` · ${e.location}` : '';
        const meth = methodLabel(e.method);
        lines.push(`    ${money(e.amount)}${meth ? ` · ${meth}` : ''}${where}${when ? ` · ${when}` : ''}`);
      }
    }
    lines.push('');
    lines.push(`Total paid: ${money(received)} of ${money(expected)} due`);
    lines.push(balance > 0 ? `Balance outstanding: ${money(balance)}` : 'Paid in full for the months shown.');
  }
  lines.push('');
  lines.push('Recorded in PoeTech — no money moves in the app; this is a record of payments entered.');
  return lines.join('\n');
}
