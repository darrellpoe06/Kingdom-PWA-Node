// =============================================================================
// account-reconciliation — one account's books against the bank, in one place
// (Christina 2026-11-18: "Our next priority is reconciling my actual Chase
// balance, transactions, and unpaid bills so Safe-to-Spend becomes reliable").
//
// READ ONLY, and the family's own (DATA-AS-EMPOWERMENT: it reads the
// household's records for the household, stores nothing new, sends nothing
// anywhere, changes nothing). It composes proofs that already exist:
//   1. the BANK: the latest bank-verified balance (a checkpoint from an
//      account-details screenshot) and its day;
//   2. the CHAIN: the bank's own running balances on the imported rows must
//      link into one unbroken chain (imported-view auditBalanceContinuity); a
//      break means a row is missing or doubled, and the balances on each side
//      of the break say where to look;
//   3. CHAIN vs BANK: the newest running balance on or before the checkpoint
//      day should equal the checkpoint; a difference explained exactly by
//      pending charges is named as such, any other difference is a finding;
//   4. SINCE VERIFIED: rows dated after the checkpoint, not yet confirmed by
//      the bank;
//   5. BILLS: the unpaid bills and minimums Safe-to-Spend reserves in its
//      period (the same engine, the same rules), and the ones with no due date.
// Each finding says what it means and what to do. Nothing is guessed: no
// checkpoint, no running balances or no bills is said plainly, never shown as
// fine.
// =============================================================================
import { latestCheckpoints } from './financial-engineering.js';
import { auditBalanceContinuity, balanceCheckpoint } from './imported-view.js';
import { buildSafeToSpend } from './safe-to-spend.js';

const round2 = (n) => Math.round(n * 100) / 100;
const dayOf = (t) => String((t && t.date) || '').slice(0, 10);
const money = (n) => `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const signed = (n) => `${n < 0 ? '−' : '+'}${money(n)}`;
const hasRunning = (t) => t.balance != null && t.balance !== '' && Number.isFinite(Number(t.balance));
function isoDay(d) {
  const x = d instanceof Date ? d : new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}

/**
 * @param {object} data       the household's data (accounts, entities, transactions, recurringObligations, ...)
 * @param {string} accountId  e.g. Chase 7206's id
 * @param {{ asOf?: Date }} [opts]
 * @returns {{ accountId, name, status: 'reconciled'|'needs-attention'|'not-enough-data', bank, chain, chainVsBank, sinceVerified, bills, findings: string[] }}
 */
export function reconcileAccount(data, accountId, { asOf = new Date() } = {}) {
  const account = (data?.accounts || []).find((a) => a && a.id === accountId) || null;
  const rows = (data?.transactions || []).filter((t) => t && t.accountId === accountId && !balanceCheckpoint(t));
  const findings = [];

  // 1. The bank's own balance.
  const cp = latestCheckpoints(data, asOf)[accountId] || null;
  const bank = cp ? { balance: round2(cp.balance), day: cp.day, basis: cp.basis || null } : null;
  if (!bank) findings.push('No bank-verified balance yet: upload the account-details screenshot (available balance) so the books have the bank’s own number.');

  // 2. The running-balance chain on the imported rows.
  const audit = auditBalanceContinuity(rows);
  let chain;
  if (audit.checked < 2)
    chain = {
      checked: audit.checked,
      ok: null,
      note: 'Not enough rows with the bank’s running balance to check the chain (a Chase download carries it; a screenshot row does not).',
    };
  else if (audit.ok) chain = { checked: audit.checked, ok: true, opening: audit.opening, closing: audit.closing };
  else chain = { checked: audit.checked, ok: false, unmatchedBefore: audit.breaks.unmatchedBefore, unmatchedAfter: audit.breaks.unmatchedAfter };
  if (chain.ok === false) {
    findings.push(
      `The bank’s running balances do not link into one chain, so a row is missing or doubled. Look near the balances ${chain.unmatchedAfter.map(money).join(', ')} and ${chain.unmatchedBefore.map(money).join(', ')}.`
    );
  }

  // 3. The newest running balance on or before the bank's day, against the bank.
  let chainVsBank = null;
  if (bank) {
    const onOrBefore = rows.filter((t) => hasRunning(t) && dayOf(t) <= bank.day);
    const latestDay = onOrBefore.reduce((d, t) => (dayOf(t) > d ? dayOf(t) : d), '');
    if (latestDay) {
      const sameDay = onOrBefore.filter((t) => dayOf(t) === latestDay).map((t) => round2(Number(t.balance)));
      // Same-day order is not known from the rows: when the chain is unbroken
      // its closing balance is the day's last; otherwise the first listed.
      const lastRunning = chain.ok && sameDay.includes(chain.closing) ? chain.closing : sameDay[0];
      // Pending charges carry no running balance yet but are already out of
      // the available balance.
      const pending = round2(rows.filter((t) => t.pending && !hasRunning(t) && dayOf(t) <= bank.day).reduce((s, t) => s + Number(t.amount || 0), 0));
      const diff = round2(bank.balance - lastRunning);
      const explainedByPending = Math.abs(diff) >= 0.005 && Math.abs(diff - pending) < 0.005;
      chainVsBank = { lastRunning, lastRunningDay: latestDay, bank: bank.balance, bankDay: bank.day, diff, explainedByPending, pending };
      if (Math.abs(diff) >= 0.005 && !explainedByPending) {
        findings.push(
          `The last running balance in the books (${money(lastRunning)} on ${latestDay}) differs from the bank’s balance (${money(bank.balance)} on ${bank.day}) by ${signed(diff)}: a transaction between those days is missing from the books, or the bank balance was taken on another day.`
        );
      }
    }
  }

  // 4. Rows after the bank's day: not yet confirmed by a bank balance.
  const after = bank ? rows.filter((t) => dayOf(t) > bank.day && dayOf(t) <= isoDay(asOf)) : [];
  const sinceVerified = bank ? { count: after.length, net: round2(after.reduce((s, t) => s + Number(t.amount || 0), 0)) } : null;
  if (bank && after.length)
    findings.push(
      `${after.length} row${after.length === 1 ? '' : 's'} (${signed(sinceVerified.net)}) dated after ${bank.day} ${after.length === 1 ? 'is' : 'are'} not yet confirmed by a bank balance: upload a new account-details screenshot.`
    );

  // 5. The bills Safe-to-Spend reserves in its period for this account's pocket.
  let bills = { period: null, items: [], dateNeeded: [], total: 0 };
  if (account) {
    const ent = (data?.entities || []).find((e) => e && e.id === account.entityId);
    const scope = ent && ent.type !== 'personal' ? ent.id : 'personal';
    const sts = buildSafeToSpend(data, { currentDate: asOf, scope });
    const due = (sts.items || []).filter((it) => it.amount < 0 && ['bill', 'scheduled', 'inferred-bill', 'debt-min', 'mortgage'].includes(it.kind));
    bills = {
      period: sts.period || null,
      items: due
        .filter((it) => !it.dateUnknown)
        .map((it) => ({ date: it.date, label: it.label, amount: round2(-it.amount), kind: it.kind, inferred: it.kind === 'inferred-bill' })),
      dateNeeded: due.filter((it) => it.dateUnknown).map((it) => ({ label: it.label, amount: round2(-it.amount) })),
      total: 0,
    };
    bills.total = round2([...bills.items, ...bills.dateNeeded].reduce((s, b) => s + b.amount, 0));
    if (bills.dateNeeded.length)
      findings.push(
        `${bills.dateNeeded.length} bill${bills.dateNeeded.length === 1 ? '' : 's'} or minimum${bills.dateNeeded.length === 1 ? '' : 's'} with no due date on file ${bills.dateNeeded.length === 1 ? 'is' : 'are'} reserved from today: add the real due date${bills.dateNeeded.length === 1 ? '' : 's'}.`
      );
    const inferred = bills.items.filter((b) => b.inferred).length;
    if (inferred)
      findings.push(
        `${inferred} bill${inferred === 1 ? ' is' : 's are'} guessed from past payments: confirm or dismiss ${inferred === 1 ? 'it' : 'them'} in Money → Bills.`
      );
  }

  const notEnough = !bank && chain.ok == null;
  const status = notEnough ? 'not-enough-data' : findings.length ? 'needs-attention' : 'reconciled';
  return { accountId, name: account ? account.name : accountId, status, bank, chain, chainVsBank, sinceVerified, bills, findings };
}
