// money-chase-running-balance.test.js — Chase's running balance is never the
// transaction amount (Christina 2026-11-18, Chase Personal Checking 7206).
//
// Chase prints each row's amount on the right (red out, blue in) and the
// account's running balance in smaller gray type beneath it. OCR does not keep
// that geometry: the gray balance can arrive on its own line before or after
// the amount, or ahead of it on one line. The old reader took the first figure
// it met as the amount, and on a screen that signs its debits an unsigned
// figure reads as money in, so six real rows became deposits of the running
// balance. These are her six rows; every layout OCR can give them is tested.
import { describe, it, expect, vi } from 'vitest';
import { readSnapshotRows } from '../lib/snapshot-rows.js';
import { extractDocument } from '../lib/books-intake-extract.js';
import { memoryStore } from '../lib/books-intake-store.js';
import { intakeFiles, commitDoc } from '../lib/books-intake-pipeline.js';
import { balanceCheckpointRow, deriveAccountBalances } from '../lib/financial-engineering.js';
import { recheckScreenshotImports } from '../lib/screenshot-import-recheck.js';

vi.mock('../lib/books-intake-cloud.js', () => ({ keepOriginalInCloud: async () => ({ ok: false, reason: 'test' }) }));

const AS_OF = '2026-11-17';
// Her six rows: what Chase shows as the amount, and the gray balance under it.
// Newest first, as the app lists them.
const SIX = [
  { day: 'Nov 16, 2026', desc: 'Zelle payment to TLC THERAPY SOLUTIONS', amount: '-$75.00', balance: '$3,941.72', want: -75 },
  { day: null, desc: 'ATM CASH DEPOSIT', amount: '$1,000.00', balance: '$4,497.99', want: 1000 },
  { day: 'Nov 15, 2026', desc: 'Zelle payment to TLC THERAPY SOLUTIONS', amount: '-$837.00', balance: '$6,890.57', want: -837 },
  { day: null, desc: 'Transfer from GMR', amount: '$55.00', balance: '$8,529.13', want: 55 },
  { day: null, desc: 'Cash App from Darrell', amount: '$1,450.00', balance: '$8,474.13', want: 1450 },
  { day: null, desc: 'Transfer from Chase 3322', amount: '$2,201.00', balance: '$7,024.13', want: 2201 },
];
// What the old reader saved for them (her report): every one a deposit of the balance.
const OLD = [3941.72, 4497.99, 6890.57, 8529.13, 8474.13, 7024.13];

const HEADER = ['CHASE', 'TOTAL CHECKING (...7206)', 'Available balance $2,559.78', 'Present balance $2,559.78'];
const LAYOUTS = {
  'balance on its own line, then the amount': (r) => [r.desc, r.balance, r.amount],
  'balance and amount on one line, balance first': (r) => [r.desc, `${r.balance} ${r.amount}`],
  'all on one line, balance first': (r) => [`${r.desc} ${r.balance} ${r.amount}`],
  'amount with the row, balance on the line under it': (r) => [`${r.desc} ${r.amount}`, r.balance],
  'amount on its own line, then the balance': (r) => [r.desc, r.amount, r.balance],
};
const screen = (layout) => [...HEADER, ...SIX.flatMap((r) => [...(r.day ? [r.day] : []), ...LAYOUTS[layout](r)])].join('\n');

describe('her six Chase 7206 rows read as the amounts Chase shows, never the running balance', () => {
  it.each(Object.keys(LAYOUTS))('%s', (layout) => {
    const { rows } = readSnapshotRows(screen(layout), { asOf: AS_OF });
    expect(rows.map((r) => r.amount)).toEqual(SIX.map((r) => r.want));
    expect(rows.map((r) => r.runningBalance)).toEqual([3941.72, 4497.99, 6890.57, 8529.13, 8474.13, 7024.13]);
    // Not one of the old wrong figures survives as an amount.
    for (const old of OLD) expect(rows.map((r) => r.amount)).not.toContain(old);
    expect(rows.map((r) => r.date)).toEqual(['2026-11-16', '2026-11-16', '2026-11-15', '2026-11-15', '2026-11-15', '2026-11-15']);
  });

  it('withdrawals stay withdrawals: both Zelle payments are money out', () => {
    const { rows } = readSnapshotRows(screen('balance on its own line, then the amount'), { asOf: AS_OF });
    expect(rows.filter((r) => /Zelle/.test(r.description)).map((r) => r.amount)).toEqual([-75, -837]);
  });

  it("where the balances prove it, the sign comes from them: Chase's balance rose by $55 and by $1,450", () => {
    const { rows } = readSnapshotRows(screen('balance on its own line, then the amount'), { asOf: AS_OF });
    const gmr = rows.find((r) => /GMR/.test(r.description));
    const cash = rows.find((r) => /Cash App/.test(r.description));
    expect([gmr.signFrom, cash.signFrom]).toEqual(['balance', 'balance']);
  });

  it('an unsigned debit is still money out when the balance fell by it', () => {
    const text = [
      'Nov 16, 2026',
      'Zelle payment to TLC',
      '$3,941.72',
      '$75.00',
      'Grocery store',
      '$4,016.72',
      '$20.00',
      'Payroll',
      '$4,036.72',
      '$500.00',
    ].join('\n');
    const { rows } = readSnapshotRows(text, { asOf: AS_OF });
    expect(rows[0].amount).toBe(-75);
    expect(rows[1].amount).toBe(-20);
  });

  it('a printed sign that the balances contradict is shown, never chosen', () => {
    const text = ['Nov 16, 2026', 'Refund', '$3,941.72', '-$75.00', 'Coffee', '$3,866.72', '-$5.00', 'Rent', '$3,871.72', '-$700.00'].join('\n');
    const { rows } = readSnapshotRows(text, { asOf: AS_OF });
    // 3,941.72 - 3,866.72 = +75: the balance rose, the screen says minus.
    expect(rows[0].amountUnclear).toBe('sign-conflict');
    expect(rows[0].amount).toBeNull();
  });

  it('a row whose amount OCR lost (only the gray balance left) is never written, and says so', () => {
    const text = [...HEADER, 'Nov 16, 2026', SIX[0].desc, SIX[0].balance, ...LAYOUTS['balance on its own line, then the amount'](SIX[1])].join('\n');
    const { rows } = readSnapshotRows(text, { asOf: AS_OF });
    expect(rows[0]).toMatchObject({ description: SIX[0].desc, amount: null, amountUnclear: 'one-figure', printed: [3941.72] });
    const x = extractDocument({ text }, { name: 's.jpg' }, { forceType: 'account-snapshot', asOf: AS_OF });
    expect(x.line_items.map((r) => r.description)).not.toContain(SIX[0].desc);
    expect(x.preview_items.find((r) => r.description === SIX[0].desc).amountUnclear).toBe('one-figure');
  });
});

describe('transfers between her own accounts are transfers, not income', () => {
  it('Zelle to TLC, Cash App from Darrell and the transfer from Chase 3322 are suggested as transfers; GMR is not assumed', () => {
    const { rows } = readSnapshotRows(screen('balance on its own line, then the amount'), { asOf: AS_OF });
    const cat = Object.fromEntries(rows.map((r) => [`${r.description} ${r.amount}`, r.category || null]));
    expect(cat['Zelle payment to TLC THERAPY SOLUTIONS -75']).toBe('transfer');
    expect(cat['Cash App from Darrell 1450']).toBe('transfer');
    expect(cat['Transfer from Chase 3322 2201']).toBe('transfer');
    expect(cat['Transfer from GMR 55']).toBeNull();
  });
});

describe('a balance screen and a history screen are told apart', () => {
  it('the account-details screen gives the balance $2,559.78 and no rows', () => {
    const text = [
      'CHASE',
      'TOTAL CHECKING (...7206)',
      'Account details',
      'Available balance',
      '$2,559.78',
      'Present balance',
      '$2,559.78',
      'as of Nov 17, 2026',
    ].join('\n');
    const x = extractDocument({ text }, { name: 'details.jpg' }, { forceType: 'account-snapshot' });
    expect(x.summary).toMatchObject({ availableBalance: 2559.78, currentBalance: 2559.78, newBalance: 2559.78, screen: 'balance' });
    expect(x.line_items).toEqual([]);
    expect(x.preview_items).toEqual([]);
    expect(x.uncertain).not.toContain('balance_kind');
  });
  it('the history screen gives rows, and no running balance becomes the account balance', () => {
    const x = extractDocument({ text: screen('balance on its own line, then the amount') }, { name: 'h.jpg' }, { forceType: 'account-snapshot', asOf: AS_OF });
    expect(x.summary.screen).toBe('history+balance');
    expect(x.summary.newBalance).toBe(2559.78);
    expect(x.line_items.map((r) => r.amount)).toEqual(SIX.map((r) => r.want));
  });
});

describe('end to end: what Approve writes', () => {
  const ACCOUNTS = [{ id: 'a-7206', name: 'Chase 7206', fragment: '7206', type: 'checking', entityId: 'e-personal', balance: 0 }];
  const ENTITIES = [
    { id: 'e-personal', name: 'Personal', type: 'personal' },
    { id: 'e-poeprops', name: 'Poe Properties LLC', type: 'business' },
    { id: 'e-tlc', name: 'TLC Therapy Solutions', type: 'business' },
  ];
  const file = (body) => ({
    name: 'chase.jpg',
    type: 'image/jpeg',
    size: body.length,
    text: async () => body,
    arrayBuffer: async () => new TextEncoder().encode(body).buffer,
  });
  it('writes the six real amounts to Chase 7206 (Personal), with the balance $2,559.78 as the checkpoint', async () => {
    const store = memoryStore();
    const body = [...screen('balance on its own line, then the amount').split('\n'), 'as of Nov 17, 2026'].join('\n');
    const ctx = {
      store,
      hint: 'overview',
      known: { accounts: ACCOUNTS, entities: ENTITIES, transactions: [] },
      reader: async (f) => ({ text: await f.text(), method: 'ocr:test' }),
    };
    const [doc] = await intakeFiles([file(body)], ctx);
    expect(doc.plan.kind).toBe('snapshot');
    const written = [];
    await commitDoc(doc, {
      store,
      known: ctx.known,
      sinks: {
        commitImportedRows: async (rows) => {
          written.push(...rows);
          return { total: rows.length, saved: rows.length };
        },
      },
    });
    const rows = written.filter((r) => r.category !== 'balance-checkpoint');
    expect(rows.map((r) => [r.amount, r.accountId])).toEqual(SIX.map((r) => [r.want, 'a-7206']));
    // Own-account transfers are written as transfers (never income); GMR as the screen gives it.
    expect(rows.map((r) => r.category === 'transfer')).toEqual([true, false, true, false, true, true]);
    const cp = written.find((r) => r.category === 'balance-checkpoint');
    expect(cp.reconciliation.balance).toBe(2559.78);
  });
});

describe('a pending charge is not subtracted twice', () => {
  it("Chase's available balance already includes it: the books read exactly the available balance that day", () => {
    const data = {
      accounts: [{ id: 'a-7206', name: 'Chase 7206', type: 'checking', entityId: 'e-personal', balance: 0 }],
      transactions: [
        { id: 'cp', ...balanceCheckpointRow('a-7206', 2559.78, AS_OF, { basis: 'available' }) },
        { id: 'p1', accountId: 'a-7206', date: AS_OF, description: 'CIRCLE K (pending)', amount: -40, pending: true },
      ],
    };
    expect(deriveAccountBalances(data, new Date(2026, 10, 17, 12))['a-7206']).toBe(2559.78);
  });
});

describe('screenshots already added are re-checked, and nothing is changed', () => {
  it('lists every row the old reader saved as the running balance, with what the screen says', () => {
    const text = screen('balance on its own line, then the amount');
    const doc = {
      id: 'doc-1',
      name: 'chase-7206.jpg',
      status: 'added',
      read: { text },
      extraction: { doc_type: 'account-snapshot', dates: { document: AS_OF } },
      questions: [],
    };
    // What the old reader wrote: each row as a deposit of its running balance.
    const ledger = SIX.map((r, i) => ({
      id: `t${i}`,
      accountId: 'a-7206',
      docId: 'doc-1',
      source: 'screenshot',
      date: i < 2 ? '2026-11-16' : '2026-11-15',
      description: r.desc,
      amount: OLD[i],
    }));
    const frozen = JSON.stringify(ledger);
    const res = recheckScreenshotImports([doc], ledger);
    expect(res.checked).toBe(1);
    expect(res.findings.map((f) => [f.description, f.written, f.correct])).toEqual(SIX.map((r, i) => [r.desc, OLD[i], r.want]));
    expect(JSON.stringify(ledger)).toBe(frozen);
  });
  it('a correct import has no findings; a screenshot added on another device is counted, not passed', () => {
    const text = screen('amount with the row, balance on the line under it');
    const good = SIX.map((r, i) => ({ docId: 'd', date: i < 2 ? '2026-11-16' : '2026-11-15', description: r.desc, amount: r.want }));
    expect(
      recheckScreenshotImports([{ id: 'd', status: 'added', read: { text }, extraction: { doc_type: 'account-snapshot', dates: { document: AS_OF } } }], good)
        .findings
    ).toEqual([]);
    const elsewhere = recheckScreenshotImports([{ id: 'd', status: 'added', extraction: { doc_type: 'account-snapshot' } }], good);
    expect(elsewhere).toMatchObject({ checked: 0, notCheckable: 1 });
  });
});
