// money-outstanding-checks.test.js — Phase 1.4, ledger integrity: a check the
// books have and the bank has not yet taken (Christina 2026-11-17: check #9879,
// $2,200.88, cleared Personal 7206 after it was written; until it cleared, the
// bank's balance did not hold it and Personal cash read $2,200.88 too high).
//
// The amounts are the real check's; the days are a worked example (the live
// rows are read only in the Phase 1.4 census, never in a public test).
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { balanceTrace, deriveAccountBalances, balanceCheckpointRow } from '../lib/financial-engineering.js';
import { checkBalanceDerivation } from '../lib/ledger-integrity.js';
import { runningBalanceByTxId } from '../lib/imported-view.js';
import { notYetAtBank, outstandingAt } from '../lib/outstanding-checks.js';

const TZ_BEFORE = process.env.TZ;
beforeAll(() => {
  process.env.TZ = 'America/Chicago';
});
afterAll(() => {
  if (TZ_BEFORE === undefined) delete process.env.TZ;
  else process.env.TZ = TZ_BEFORE;
});

const day = (d) => new Date(2026, 10, d, 12);
const ACCT = { id: 'a-7206', name: 'Chase 7206', fragment: '7206', type: 'checking', entityId: 'e-personal', balance: 0 };

// The bank says $5,000.00 at the end of 11-09. Check #9879 was written 11-05 and
// the bank had not taken it by then. A $40 card purchase on 11-10.
function books({ check = {}, more = [] } = {}) {
  return {
    accounts: [ACCT],
    transactions: [
      { id: 'cp9', ...balanceCheckpointRow('a-7206', 5000, '2026-11-09', { basis: 'available', source: 'screenshot 11-09' }) },
      { id: 'ck9879', date: '2026-11-05', accountId: 'a-7206', amount: -2200.88, description: 'CHECK 9879', category: 'other', ...check },
      { id: 'c1', date: '2026-11-10', accountId: 'a-7206', amount: -40, description: 'CIRCLE K', category: 'fuel' },
      ...more,
    ],
  };
}

describe('the rule', () => {
  it('a row is outside the bank only when marked outstanding or dated by the bank after the day', () => {
    expect(notYetAtBank({ outstanding: true }, '2026-11-09')).toBe(true);
    expect(notYetAtBank({ outstanding: true, clearedOn: '2026-11-12' }, '2026-11-09')).toBe(true);
    expect(notYetAtBank({ outstanding: true, clearedOn: '2026-11-09' }, '2026-11-09')).toBe(false);
    expect(notYetAtBank({ clearedOn: '2026-11-12' }, '2026-11-09')).toBe(true);
    expect(notYetAtBank({}, '2026-11-09')).toBe(false);
    expect(notYetAtBank({ clearedOn: 'soon' }, '2026-11-09')).toBe(false); // an unreadable day is not a bank day
  });
  it('only rows dated on or before the checkpoint can be outstanding at it', () => {
    const rows = [
      { day: '2026-11-05', amount: -2200.88, outstanding: true },
      { day: '2026-11-10', amount: -40, outstanding: true },
    ];
    expect(outstandingAt(rows, '2026-11-09').map((r) => r.amount)).toEqual([-2200.88]);
  });
});

describe('check #9879 ($2,200.88) before and after the bank takes it', () => {
  it('nothing marked: the balance is exactly what it was before this change (PROVEN TO CATCH: an unmarked ledger never moves)', () => {
    expect(deriveAccountBalances(books(), day(11))['a-7206']).toBe(4960);
  });
  it('written, not yet taken: the family has $2,200.88 less than the bank shows', () => {
    const d = books({ check: { outstanding: true } });
    expect(deriveAccountBalances(d, day(11))['a-7206']).toBe(2759.12);
  });
  it('the bank takes it on 11-12, and the 11-12 screenshot already holds it: subtracted once, never twice', () => {
    const d = books({
      check: { outstanding: true, clearedOn: '2026-11-12' },
      more: [{ id: 'cp12', ...balanceCheckpointRow('a-7206', 2759.12, '2026-11-12', { basis: 'available', source: 'screenshot 11-12' }) }],
    });
    expect(deriveAccountBalances(d, day(11))['a-7206']).toBe(2759.12); // still outside the 11-09 figure
    expect(deriveAccountBalances(d, day(12))['a-7206']).toBe(2759.12); // inside the 11-12 figure
    expect(deriveAccountBalances(d, day(13))['a-7206']).toBe(2759.12);
  });
  it('a day before every bank check counts back from the earliest one, the check included', () => {
    const d = books({ check: { outstanding: true } });
    // 11-07: the 11-09 figure less the outstanding check; no row between 11-07 and 11-09 to undo
    expect(deriveAccountBalances(d, day(7))['a-7206']).toBe(2799.12);
  });
});

describe('every surface says the same figure', () => {
  const d = () => books({ check: { outstanding: true } });
  it('the trail names the check and adds up to the Overview to the cent', () => {
    const t = balanceTrace(d(), 'a-7206', day(11));
    expect(t.outstanding.map((r) => r.id)).toEqual(['ck9879']);
    expect(t.sumOutstanding).toBe(-2200.88);
    expect(t.rowsSince.map((r) => r.id)).toEqual(['c1']);
    expect(t.balance).toBe(2759.12);
    expect(t.balance).toBe(deriveAccountBalances(d(), day(11))['a-7206']);
  });
  it('the independent cents check agrees with the engine', () => {
    expect(checkBalanceDerivation(d(), day(11)).status).toBe('pass');
  });
  it('the register: the newest row reads the Overview figure', () => {
    const run = runningBalanceByTxId(d().transactions, d().accounts);
    expect(run.c1).toBe(2759.12);
  });
  it('with nothing marked, the trail carries an empty outstanding list', () => {
    const t = balanceTrace(books(), 'a-7206', day(11));
    expect(t.outstanding).toEqual([]);
    expect(t.balance).toBe(4960);
  });
});
