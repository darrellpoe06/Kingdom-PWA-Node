// =============================================================================
// BankReconcile — each checking account's books against the bank, on the Money
// Overview (Christina 2026-11-18: "reconciling my actual Chase balance,
// transactions, and unpaid bills so Safe-to-Spend becomes reliable").
// Read only: it shows lib/account-reconciliation.js and changes nothing. It
// never goes blank: with no account to check it says so and what to add.
// =============================================================================
import React, { useMemo } from 'react';
import { reconcileAccount } from '../../lib/account-reconciliation.js';

const SERIF = { fontFamily: '"Fraunces", serif' };
const LABEL = { reconciled: 'Matches the bank', 'needs-attention': 'Needs attention', 'not-enough-data': 'Not enough to check yet' };
const TONE = { reconciled: 'text-[#5A6E3D]', 'needs-attention': 'text-[#7A1F1F]', 'not-enough-data': 'text-[#8B6F47]' };

export default function BankReconcile({ data = {}, entities = [], currentDate = new Date(), show = (n) => String(n) }) {
  const reports = useMemo(() => {
    const inScope = (a) => !entities.length || a.entityId == null || entities.some((e) => e.id === a.entityId);
    return (data.accounts || [])
      .filter((a) => a && (a.type === 'checking' || a.type === 'savings') && !a.inLegal && inScope(a))
      .map((a) => reconcileAccount(data, a.id, { asOf: currentDate }));
  }, [data, entities, currentDate]);
  return (
    <section aria-labelledby="recon-h" data-testid="bank-reconcile" className="rounded-2xl border border-[#E8E4DC] bg-[#FAF8F4] p-4 text-[#1A1815]">
      <h2 id="recon-h" className="text-lg font-semibold" style={SERIF}>
        Reconcile with the bank
      </h2>
      <p className="text-[0.75rem] text-[#5A5751]">
        Your books against each bank balance and the bank&rsquo;s own running balances. Nothing here changes your records.
      </p>
      {reports.length === 0 && (
        <p className="mt-2 text-[0.75rem] text-[#8B6F47]" data-testid="bank-reconcile-empty">
          No checking or savings account in this view yet. Add the account in Books, then upload its account-details screenshot and a Chase download to check it
          here.
        </p>
      )}
      <ul className="mt-2 space-y-2">
        {reports.map((r) => (
          <li key={r.accountId} data-testid="bank-reconcile-account" data-status={r.status}>
            <details className="rounded-xl bg-white border border-[#E8E4DC] p-3">
              <summary className="cursor-pointer min-h-[36px] flex flex-wrap items-center gap-2">
                <span className="font-semibold" style={SERIF}>
                  {r.name}
                </span>
                <span className={`text-[0.75rem] font-semibold ${TONE[r.status]}`} data-testid="bank-reconcile-status">
                  {LABEL[r.status]}
                </span>
                {r.findings.length > 0 && <span className="text-[0.75rem] text-[#5A5751]">{`${r.findings.length} to look at`}</span>}
              </summary>
              <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[0.75rem]">
                <dt className="text-[#5A5751]">Bank balance</dt>
                <dd>{r.bank ? `${show(r.bank.balance)} on ${r.bank.day}${r.bank.basis ? ` (${r.bank.basis})` : ''}` : 'none yet'}</dd>
                <dt className="text-[#5A5751]">Running-balance chain</dt>
                <dd>
                  {r.chain.ok == null
                    ? 'not enough rows to check'
                    : r.chain.ok
                      ? `unbroken (${r.chain.checked} rows)`
                      : `broken (${r.chain.checked} rows checked)`}
                </dd>
                {r.chainVsBank && (
                  <>
                    <dt className="text-[#5A5751]">Books vs bank</dt>
                    <dd>
                      {Math.abs(r.chainVsBank.diff) < 0.005
                        ? 'match'
                        : r.chainVsBank.explainedByPending
                          ? `${show(r.chainVsBank.diff)} = pending charges`
                          : `${show(r.chainVsBank.diff)} apart`}
                    </dd>
                  </>
                )}
                {r.sinceVerified && (
                  <>
                    <dt className="text-[#5A5751]">Since the bank balance</dt>
                    <dd>{`${r.sinceVerified.count} row${r.sinceVerified.count === 1 ? '' : 's'}, ${show(r.sinceVerified.net)}`}</dd>
                  </>
                )}
                <dt className="text-[#5A5751]">Bills reserved this period</dt>
                <dd>{`${r.bills.items.length + r.bills.dateNeeded.length}, ${show(r.bills.total)}`}</dd>
              </dl>
              {r.findings.length > 0 && (
                <ol className="mt-2 list-decimal pl-4 space-y-1 text-[0.75rem]" data-testid="bank-reconcile-findings">
                  {r.findings.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ol>
              )}
              {r.bills.items.length + r.bills.dateNeeded.length > 0 && (
                <ul className="mt-2 text-[0.75rem] space-y-0.5" data-testid="bank-reconcile-bills">
                  {r.bills.items.map((b, i) => (
                    <li key={`${b.label}-${b.date}-${i}`}>{`${b.date} · ${b.label}${b.inferred ? ' (guessed)' : ''} · ${show(b.amount)}`}</li>
                  ))}
                  {r.bills.dateNeeded.map((b, i) => (
                    <li key={`${b.label}-dn-${i}`}>{`Due date needed · ${b.label} · ${show(b.amount)}`}</li>
                  ))}
                </ul>
              )}
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}
