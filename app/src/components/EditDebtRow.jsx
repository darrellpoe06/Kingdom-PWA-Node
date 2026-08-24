// EditDebtRow — edit EVERY field on a debt, in place on the Debts tab.
//
// Christina 2026-08-10: "I need to be able to edit each line that is input or
// each line that is there in general, manually."
//
// What existed before this: three tiny inline cell editors (rate, min, owed),
// each gated. Name and entity could not be changed at all; credit limit and
// highest balance had no editor; a row could not be parked or removed; a
// mortgage line had no editor of any kind; and a rate the ledger derived was
// locked outright — visible on her own screenshot as the Chase line of credit
// at 17.44% with nothing to tap. So "edit each line" was not true of any row.
//
// This opens the whole record at once, which also suits the phone the family
// actually uses: one tap to open, real labelled inputs instead of hunting for
// a 9px "+ rate" link, one Save.
//
// Two rules carried through from the rest of the tab:
//   · a cleared field means UNKNOWN, not zero. Blanking the monthly payment
//     removes the claim rather than asserting $0/mo (DR-0076).
//   · the ledger keeps its authority. Editing the owed balance on an account
//     with real transactions posts a visible balance-adjustment row rather
//     than rewriting history (resolveAccountUpdates), and a statement-derived
//     rate stays visible next to any override, with a one-tap revert.
import React, { useState } from 'react';

const serif = { fontFamily: '"Fraunces", serif' };
const mono = { fontFamily: '"JetBrains Mono", monospace' };
const INPUT = 'w-full text-sm px-2 py-2 min-h-[40px] border border-[#1A1815] bg-white focus:outline focus:outline-2 focus:outline-[#B85838]';
const LABEL = 'block text-[0.625rem] uppercase tracking-wider text-[#5A5751] mb-1';
const BTN = 'text-xs uppercase tracking-wider px-3 py-2 min-h-[40px] font-semibold focus:outline focus:outline-2 focus:outline-[#1A1815]';

// A field the person left blank is UNKNOWN. Only '' maps to null; a typed 0 is
// a real zero and must survive (a confirmed 0% card, a paid-off balance).
const numOrNull = (v) => {
  const s = String(v ?? '').trim();
  if (!s) return null;
  const n = parseFloat(s.replace(/[$,%\s]/g, ''));
  return isFinite(n) ? Math.abs(n) : null;
};
const str = (v) => (v == null || !isFinite(v) ? '' : String(v));

function EditDebtRow({ debt: d, entities = [], colSpan = 6, onClose, updateAccount, deleteAccount, updateRental }) {
  const isRental = d.source === 'rental';
  const [form, setForm] = useState({
    name: d.name || '',
    entityId: d.entityId || '',
    balance: str(d.balance),
    rate: d.rateKnown ? str(d.rate) : '',
    minPayment: d.minPayment ? str(d.minPayment) : '',
    creditLimit: str(d.creditLimit),
    highestBalance: str(d.highestBalance),
    payeeAlias: d.payeeAlias || '',
    leaveAlone: !!d.leaveAlone,
  });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = (e) => {
    if (e) e.preventDefault();
    const rate = numOrNull(form.rate);
    const balance = numOrNull(form.balance);
    const minPayment = numOrNull(form.minPayment);

    if (isRental && updateRental && d.rentalId) {
      // A mortgage lives on the property record; only its money terms belong to
      // this tab. The property's name and address stay owned by Real Estate.
      updateRental(d.rentalId, {
        mortgage: { balance: balance ?? 0, rate: rate ?? 0, monthlyPI: minPayment ?? 0 },
      });
      onClose();
      return;
    }
    if (!d.accountId || !updateAccount) { onClose(); return; }

    const updates = {
      name: form.name.trim() || d.name,
      entityId: form.entityId || null,
      minPayment: minPayment ?? 0,
      creditLimit: form.creditLimit.trim() === '' ? null : numOrNull(form.creditLimit),
      highestBalance: form.highestBalance.trim() === '' ? null : numOrNull(form.highestBalance),
      payeeAlias: form.payeeAlias.trim() || null,
      leaveAlone: !!form.leaveAlone,
    };
    // The balance is only sent when it actually changed, so simply opening the
    // editor on a ledgered account can never post a spurious adjustment row.
    if (balance != null && Math.abs(balance - (d.balance || 0)) > 0.005) updates.balance = balance;
    // A rate the person typed is KNOWN, including a deliberate 0%. If the
    // ledger derives its own rate and this differs from it, the edit is
    // recorded as an explicit override rather than silently replacing the data.
    if (rate != null) {
      updates.rate = rate;
      updates.rateKnown = true;
      if (d.dataRate != null) updates.rateOverridden = Math.abs(rate - d.dataRate) > 0.005;
    } else {
      updates.rate = 0;
      updates.rateKnown = false;
      if (d.dataRate != null) updates.rateOverridden = false;
    }
    updateAccount(d.accountId, updates);
    onClose();
  };

  const revertRate = () => {
    if (!d.accountId || !updateAccount) return;
    updateAccount(d.accountId, { rateOverridden: false });
    setForm((f) => ({ ...f, rate: str(d.dataRate) }));
  };

  const remove = () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    if (d.accountId && deleteAccount) deleteAccount(d.accountId);
    onClose();
  };

  return (
    <tr className="border-b-2 border-[#1A1815] bg-[#FAF8F4]">
      <td colSpan={colSpan} className="p-4">
        <form onSubmit={save} className="space-y-3">
          <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-medium">
            Editing {d.name}{isRental ? ' · mortgage terms' : ''}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {!isRental && (
              <>
                <div className="sm:col-span-2">
                  <label className={LABEL} htmlFor={`e-name-${d.id}`}>Account name</label>
                  <input id={`e-name-${d.id}`} className={INPUT} value={form.name} onChange={set('name')} autoFocus />
                </div>
                <div>
                  <label className={LABEL} htmlFor={`e-ent-${d.id}`}>Whose / which entity</label>
                  <select id={`e-ent-${d.id}`} className={INPUT} value={form.entityId} onChange={set('entityId')}>
                    <option value="">—</option>
                    {entities.map((en) => (
                      <option key={en.id} value={en.id}>{String(en.name || '').split('(')[0].trim()}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div>
              <label className={LABEL} htmlFor={`e-bal-${d.id}`}>Amount owed</label>
              <input id={`e-bal-${d.id}`} className={INPUT} style={mono} inputMode="decimal" value={form.balance} onChange={set('balance')} />
              {d.hasPayments && !isRental && (
                <p className="text-[0.5625rem] text-[#5A5751] mt-1" style={serif}>
                  This account has real transactions — a change is recorded as a dated adjustment, so the history stays intact.
                </p>
              )}
            </div>

            <div>
              <label className={LABEL} htmlFor={`e-rate-${d.id}`}>Interest rate %</label>
              <input id={`e-rate-${d.id}`} className={INPUT} style={mono} inputMode="decimal" value={form.rate} onChange={set('rate')} placeholder="leave blank if unknown" />
              {d.dataRate != null && (
                <p className="text-[0.5625rem] text-[#5A5751] mt-1" style={serif}>
                  Statements say <strong style={mono}>{d.dataRate}%</strong>.
                  {d.rateSource === 'override' && (
                    <> You've overridden it.{' '}
                      <button type="button" onClick={revertRate} className="uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] underline">revert to data</button>
                    </>
                  )}
                </p>
              )}
              {d.dataRate == null && (
                <p className="text-[0.5625rem] text-[#5A5751] mt-1" style={serif}>Enter 0 only if it really is a 0% card.</p>
              )}
            </div>

            <div>
              <label className={LABEL} htmlFor={`e-min-${d.id}`}>Monthly payment</label>
              <input id={`e-min-${d.id}`} className={INPUT} style={mono} inputMode="decimal" value={form.minPayment} onChange={set('minPayment')} placeholder="leave blank if unknown" />
            </div>

            {!isRental && (
              <>
                <div>
                  <label className={LABEL} htmlFor={`e-lim-${d.id}`}>Credit limit</label>
                  <input id={`e-lim-${d.id}`} className={INPUT} style={mono} inputMode="decimal" value={form.creditLimit} onChange={set('creditLimit')} />
                </div>
                <div>
                  <label className={LABEL} htmlFor={`e-high-${d.id}`}>Highest balance</label>
                  <input id={`e-high-${d.id}`} className={INPUT} style={mono} inputMode="decimal" value={form.highestBalance} onChange={set('highestBalance')} />
                </div>
                <div className="sm:col-span-3">
                  <label className={LABEL} htmlFor={`e-alias-${d.id}`}>Payment name in the bank ledger</label>
                  <input id={`e-alias-${d.id}`} className={INPUT} value={form.payeeAlias} onChange={set('payeeAlias')} placeholder="e.g. AMERICAN EXPRESS ACH PMT — how the bank names this debt's payment" />
                  <p className="text-[0.5625rem] text-[#5A5751] mt-1" style={serif}>
                    Payments are matched by NAME, never by amount. If this row says "no payments seen" while you pay it every month, copy the payment's name from the Tx tab here — the real history then drives the payoff date.
                  </p>
                </div>
              </>
            )}
          </div>

          {!isRental && (
            <label className="flex items-center gap-2 text-xs" style={serif}>
              <input type="checkbox" className="w-5 h-5 accent-[#B85838]" checked={form.leaveAlone}
                onChange={(e) => setForm((f) => ({ ...f, leaveAlone: e.target.checked }))} />
              <span>Leave alone — keep it listed, but out of the totals and the payoff plan</span>
            </label>
          )}

          <div className="flex gap-2 flex-wrap items-center pt-1">
            <button type="submit" className={`${BTN} bg-[#B85838] text-white hover:bg-[#1A1815]`}>Save</button>
            <button type="button" className={`${BTN} border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white`} onClick={onClose}>Cancel</button>
            {!isRental && d.accountId && deleteAccount && (
              <button type="button" onClick={remove}
                className={`${BTN} ml-auto border ${confirmDelete ? 'bg-[#B85838] text-white border-[#B85838]' : 'border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white'}`}>
                {confirmDelete ? 'Tap again to remove' : 'Remove debt'}
              </button>
            )}
          </div>
          {isRental && (
            <p className="text-[0.5625rem] text-[#5A5751]" style={serif}>
              This is a property mortgage. Its name, address and tenant live on the Real Estate tab; the money terms are editable here.
            </p>
          )}
        </form>
      </td>
    </tr>
  );
}

export { EditDebtRow };
export default EditDebtRow;
