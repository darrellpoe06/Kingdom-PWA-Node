// money-three-accounts.test.js — the three real accounts, kept apart and each
// verified by its own screenshot (Darrell 2026-11-11: Personal Chase 7206
// $3,183.10, Poe Properties Chase 3322 $4,479.53, TLC Therapy Solutions 8168
// $370.69; the two business balances showed older figures).
//
// What was wrong and is pinned here:
//   * an account named by its digits with no fragment ("Chase 3322") never
//     matched its screenshot, so the upload asked which account — or created
//     a twin (accountLast4 now reads the name);
//   * a new account for an unknown screenshot was created with NO owner, so it
//     rode Personal and business cash became personal spending money (an
//     owner question now blocks the write);
//   * a figure that stayed old said nothing about why: every account now
//     carries its trail (every check on file, the rows since, and a check
//     dated after today, which is never used and is named).
import { describe, it, expect } from 'vitest';
import { extractDocument, isDebtPaymentRow } from '../lib/books-intake-extract.js';
import { accountLast4, resolveAccount } from '../lib/books-intake-match.js';
import { memoryStore } from '../lib/books-intake-store.js';
import { intakeFiles, answer, commitDoc, receive } from '../lib/books-intake-pipeline.js';
import { buildSafeToSpend, obligationEvents, incomeEvents, resolveScope, addDays } from '../lib/safe-to-spend.js';
import { deriveAccountBalances, latestCheckpoints, checkpointHistory, balanceCheckpointRow } from '../lib/financial-engineering.js';

const fakeFile = (name, type, body) => ({
  name,
  type,
  size: body.length,
  text: async () => body,
  arrayBuffer: async () => new TextEncoder().encode(body).buffer,
});
const at = (y, m, d) => new Date(y, m - 1, d, 12);
const NOV11 = at(2026, 11, 11);

// The three screens as OCR reads them off the Fold.
const CHASE_7206 = [
  'Chase',
  'TOTAL CHECKING (...7206)',
  'Available balance',
  '$3,183.10',
  'Present balance $3,183.10',
  'as of Nov 11, 2026',
  'Transactions',
  'Nov 10  CASH APP*DARRELL POE  +$700.00',
  'Nov 9  UIUC PAYROLL DIRECT DEP  $1,912.40',
  'Nov 7  COUNTY MARKET  -$86.22',
].join('\n');
const CHASE_3322 = [
  'Chase',
  'BUSINESS COMPLETE CHECKING (...3322)',
  'Available balance',
  '$4,479.53',
  'as of Nov 10, 2026',
  'Transactions',
  'Nov 10  AMEREN ILLINOIS BILL PAY  -$161.04',
  'Nov 6  FIRST STATE BK LOAN PMT 5342  -$612.00',
  'Nov 3  ONLINE TRANSFER TO CHK ...7206  -$500.00',
  'Nov 1  ZELLE FROM ANTAURIS MURRELL  +$700.00',
].join('\n');
// A different bank prints the account another way; no "(...8168)" here.
const TLC_8168 = [
  'First State Bank',
  'TLC THERAPY SOLUTIONS LLC',
  'Business Checking x8168',
  'Available balance',
  '$370.69',
  'as of Nov 9, 2026',
  'Recent activity',
  '11/07  SQUARE INC DEPOSIT  +$240.00',
  '11/05  QUICKBOOKS PAYMENTS  -$29.99',
].join('\n');

const ENTITIES = [
  { id: 'e-personal', name: 'Personal', type: 'personal' },
  { id: 'e-poeprops', name: 'Poe Properties LLC', type: 'business' },
  { id: 'e-tlc', name: 'TLC Therapy Solutions', type: 'business' },
];
// The 3322 account has NO fragment — only its name carries the digits.
const ACCOUNTS = [
  { id: 'a-7206', name: 'Chase Personal Checking 7206', fragment: '...7206', type: 'checking', entityId: 'e-personal', balance: 0, isPrimary: true },
  { id: 'a-3322', name: 'Chase 3322', type: 'checking', entityId: 'e-poeprops', balance: 0 },
  { id: 'a-8168', name: 'TLC Therapy Solutions 8168', fragment: '', type: 'checking', entityId: 'e-tlc', balance: 0 },
];
const ctxFor = (store, transactions = [], extra = {}) => ({
  store,
  hint: 'overview',
  known: { accounts: ACCOUNTS, entities: ENTITIES, transactions },
  reader: async (f) => ({ text: await f.text(), method: 'ocr:test' }),
  ...extra,
});
const ledgerSinks = (ledger) => ({
  commitImportedRows: async (rows) => {
    rows.forEach((r, i) => ledger.push({ id: `t-${ledger.length + i}`, ...r }));
    return { saved: rows.length };
  },
});
const dataWith = (ledger, extra = {}) => ({
  entities: ENTITIES,
  accounts: ACCOUNTS,
  transactions: ledger,
  recurringObligations: [],
  inflows: { salaries: [], rentals: [] },
  moneyPlan: { settings: { reserveByEntity: { personal: 10000 } } },
  ...extra,
});

async function approveAll(
  ledger,
  files = [
    ['7206.jpg', CHASE_7206],
    ['3322.jpg', CHASE_3322],
    ['8168.jpg', TLC_8168],
  ]
) {
  const store = memoryStore();
  const out = [];
  for (const [name, text] of files) {
    const [doc] = await intakeFiles([fakeFile(name, 'image/jpeg', text)], ctxFor(store, ledger));
    out.push(await commitDoc(doc, { store, sinks: ledgerSinks(ledger), known: { accounts: ACCOUNTS, entities: ENTITIES, transactions: ledger } }));
  }
  return out;
}

describe('TASK 1 — each account finds its own screenshot (PROVEN TO CATCH)', () => {
  it('an account named by its digits is known by them: fragment first, then the name', () => {
    expect(accountLast4({ fragment: '...7206', name: 'Chase Personal Checking 7206' })).toBe('7206');
    expect(accountLast4({ name: 'Chase 3322' })).toBe('3322');
    expect(accountLast4({ name: 'TLC Therapy Solutions 8168', fragment: '' })).toBe('8168');
    expect(accountLast4({ name: 'Family Savings' })).toBe('');
  });
  it('the 3322 screenshot lands on "Chase 3322" (no fragment on file) and the TLC screen ("x8168") on TLC — never a question, never a twin', async () => {
    const store = memoryStore();
    const [poe] = await intakeFiles([fakeFile('3322.jpg', 'image/jpeg', CHASE_3322)], ctxFor(store));
    expect(poe.extraction.account_hint.last4).toBe('3322');
    expect(poe.matched.account).toMatchObject({ accountId: 'a-3322', certain: true });
    expect(poe.matched.entity.entityId).toBe('e-poeprops');
    expect(poe.status).toBe('ready');
    expect(poe.questions.filter((q) => q.status === 'open')).toHaveLength(0);
    const [tlc] = await intakeFiles([fakeFile('8168.jpg', 'image/jpeg', TLC_8168)], ctxFor(store));
    expect(tlc.extraction.account_hint).toMatchObject({ last4: '8168', institution: 'First State Bank' });
    expect(tlc.matched.account).toMatchObject({ accountId: 'a-8168', certain: true });
    expect(tlc.matched.entity.entityId).toBe('e-tlc');
    expect(tlc.plan.checkpoint).toEqual({ balance: 370.69, day: '2026-11-09', basis: 'available' });
    // Before the fix the name's digits were ignored: no certain account.
    expect(resolveAccount({ account_hint: { last4: '3322' } }, [{ id: 'x', name: 'Chase 3322', fragment: null }]).accountId).toBe('x');
  });
  it('approving the three screenshots: Personal $3,183.10, Poe Properties $4,479.53, TLC $370.69 — each verified on its own day, none mixed', async () => {
    const ledger = [];
    const docs = await approveAll(ledger);
    expect(docs.map((d) => d.status)).toEqual(['added', 'added', 'added']);
    const data = dataWith(ledger);
    const bal = deriveAccountBalances(data, NOV11);
    expect(bal['a-7206']).toBe(3183.1);
    expect(bal['a-3322']).toBe(4479.53);
    expect(bal['a-8168']).toBe(370.69);
    const cps = latestCheckpoints(data, NOV11);
    expect(cps['a-7206'].day).toBe('2026-11-11');
    expect(cps['a-3322'].day).toBe('2026-11-10');
    expect(cps['a-8168'].day).toBe('2026-11-09');
    const all = buildSafeToSpend(data, { currentDate: NOV11, period: '14d', scope: 'consolidated' });
    const row = (id) => all.byEntity.find((r) => r.scope.id === id);
    expect(row('e-personal').lines.availableCash).toBe(3183.1);
    expect(row('e-poeprops').lines.availableCash).toBe(4479.53);
    expect(row('e-tlc').lines.availableCash).toBe(370.69);
    // The combined headline is Personal money only.
    expect(all.lines.availableCash).toBe(3183.1);
    // Only one account and one checkpoint per screenshot; no twins.
    expect(ledger.filter((t) => t.category === 'balance-checkpoint')).toHaveLength(3);
    expect(docs.every((d) => !d.createdAccountId)).toBe(true);
  });
  it('an older screenshot approved later never overrides a newer verified balance; the trail shows both checks', async () => {
    const ledger = [];
    await approveAll(ledger, [['3322.jpg', CHASE_3322]]); // $4,479.53 on Nov 10
    const older = CHASE_3322.replace('$4,479.53', '$2,539.53').replace('as of Nov 10, 2026', 'as of Nov 4, 2026');
    await approveAll(ledger, [['old-3322.jpg', older]]);
    const data = dataWith(ledger);
    expect(deriveAccountBalances(data, NOV11)['a-3322']).toBe(4479.53);
    expect(latestCheckpoints(data, NOV11)['a-3322'].day).toBe('2026-11-10');
    expect(checkpointHistory(data)['a-3322'].map((c) => c.day)).toEqual(['2026-11-04', '2026-11-10']);
    const r = buildSafeToSpend(data, { currentDate: NOV11, period: '14d', scope: 'e-poeprops' });
    const src = r.balanceSources.find((b) => b.id === 'a-3322');
    expect(src.verifiedOn).toBe('2026-11-10');
    expect(src.checkpoints.map((c) => [c.day, c.balance])).toEqual([
      ['2026-11-10', 4479.53],
      ['2026-11-04', 2539.53],
    ]);
    expect(src.checkpoints[0].source).toMatch(/screenshot 3322\.jpg/);
  });
  it('a screenshot whose day was read as AFTER today is not used, and the trail says so by name', async () => {
    const ledger = [{ id: 'old', ...balanceCheckpointRow('a-3322', 2539.53, '2026-11-04', { basis: 'available', source: 'entered by hand' }) }];
    const future = CHASE_3322.replace('as of Nov 10, 2026', 'as of Dec 10, 2026');
    await approveAll(ledger, [['3322.jpg', future]]);
    const data = dataWith(ledger);
    // The old check stands, moved only by the screen's own rows after it (Nov 6 −612, Nov 10 −161.04)…
    expect(deriveAccountBalances(data, NOV11)['a-3322']).toBe(1766.49);
    expect(latestCheckpoints(data, NOV11)['a-3322'].day).toBe('2026-11-04');
    const r = buildSafeToSpend(data, { currentDate: NOV11, period: '14d', scope: 'e-poeprops' });
    const src = r.balanceSources.find((b) => b.id === 'a-3322');
    expect(src.laterCheckpoint).toMatchObject({ day: '2026-12-10', balance: 4479.53 }); // …and the reason is on the surface
    expect(r.assumptions.some((a) => /Chase 3322: a verified balance of \$4,479\.53 is dated 2026-12-10, after today/.test(a))).toBe(true);
  });
  it('the rows since the check in force are counted and named, so a moved figure explains itself', async () => {
    const ledger = [];
    await approveAll(ledger, [['3322.jpg', CHASE_3322]]);
    ledger.push({
      id: 'after',
      date: '2026-11-11',
      accountId: 'a-3322',
      amount: -1939.53,
      description: 'FIRST STATE BK LOAN PMT 5312',
      category: 'debt-payment',
    });
    const data = dataWith(ledger);
    expect(deriveAccountBalances(data, NOV11)['a-3322']).toBe(2540);
    const r = buildSafeToSpend(data, { currentDate: NOV11, period: '14d', scope: 'e-poeprops' });
    const src = r.balanceSources.find((b) => b.id === 'a-3322');
    expect(src).toMatchObject({ balance: 2540, verifiedOn: '2026-11-10', verifiedBalance: 4479.53, sinceVerified: { count: 1, net: -1939.53 } });
  });
  it('an unknown account on a screenshot asks which account AND whose it is; a chosen account settles both, a created one carries the chosen owner', async () => {
    const store = memoryStore();
    // A screen that names neither a known account nor its owner.
    const unknown = TLC_8168.replace('x8168', 'x9901').replace('TLC THERAPY SOLUTIONS LLC\n', '');
    const [doc] = await intakeFiles([fakeFile('new.jpg', 'image/jpeg', unknown)], ctxFor(store));
    expect(doc.status).toBe('needs-answer');
    const fields = doc.questions.filter((q) => q.status === 'open').map((q) => q.field);
    expect(fields).toEqual(['account', 'entity']);
    expect(doc.questions.find((q) => q.field === 'entity').blocking).toBe(true);
    // Choosing an existing account: its owner is the owner; no entity question remains.
    const chosen = await answer(doc, `${doc.id}:account`, 'account:a-8168', ctxFor(store));
    expect(chosen.matched.entity.entityId).toBe('e-tlc');
    expect(chosen.questions.filter((q) => q.status === 'open')).toHaveLength(0);
    expect(chosen.status).toBe('ready');
    // Creating a new one: the write waits for the owner, then the account is born in that pocket.
    const [doc2] = await intakeFiles([fakeFile('new2.jpg', 'image/jpeg', unknown)], ctxFor(store));
    let created = await answer(doc2, `${doc2.id}:account`, 'create', ctxFor(store));
    expect(created.status).toBe('needs-answer');
    expect(created.plan.kind).toBe('none');
    created = await answer(created, `${doc2.id}:entity`, 'entity:e-tlc', ctxFor(store));
    expect(created.status).toBe('ready');
    const added = [];
    const sinks = {
      ...ledgerSinks([]),
      addAccount: (item) => {
        added.push(item);
        return { id: 'a-new', ...item };
      },
    };
    const out = await commitDoc(created, { store, sinks, known: { accounts: ACCOUNTS, entities: ENTITIES, transactions: [] } });
    expect(out.status).toBe('added');
    expect(added[0]).toMatchObject({ name: 'First State Bank 9901', entityId: 'e-tlc', fragment: '9901' });
  });
});

describe('TASK 2 — transactions from screenshots are accurate', () => {
  it('reads deposits, expenses, an own-account transfer and a loan payment, each told apart', () => {
    const x = extractDocument({ text: CHASE_3322 }, { name: '3322.jpg', type: 'image/jpeg', receivedAt: '2026-11-10T18:00:00.000Z' });
    const rows = Object.fromEntries(x.line_items.map((r) => [r.description, r]));
    expect(rows['ZELLE FROM ANTAURIS MURRELL']).toMatchObject({ date: '2026-11-01', amount: 700 });
    expect(rows['ZELLE FROM ANTAURIS MURRELL'].category).toBeUndefined(); // a deposit, ordinary
    expect(rows['AMEREN ILLINOIS BILL PAY']).toMatchObject({ date: '2026-11-10', amount: -161.04 });
    expect(rows['ONLINE TRANSFER TO CHK ...7206']).toMatchObject({ amount: -500, category: 'transfer' });
    expect(rows['FIRST STATE BK LOAN PMT 5342']).toMatchObject({ amount: -612, category: 'debt-payment' });
    expect(isDebtPaymentRow('CHASE CARD AUTOPAY')).toBe(true);
    expect(isDebtPaymentRow('COUNTY MARKET')).toBe(false);
  });
  it('every row lands on its own account; the same screenshot twice adds nothing; an overlapping later screenshot adds only the new rows', async () => {
    const ledger = [];
    await approveAll(ledger);
    const own = (id) => ledger.filter((t) => t.accountId === id && t.category !== 'balance-checkpoint');
    expect(own('a-7206').map((t) => t.description)).toEqual(['CASH APP*DARRELL POE', 'UIUC PAYROLL DIRECT DEP', 'COUNTY MARKET']);
    expect(own('a-3322')).toHaveLength(4);
    expect(own('a-8168')).toHaveLength(2);
    const before = ledger.length;
    await approveAll(ledger);
    expect(ledger.length).toBe(before); // nothing twice: no rows, no checkpoints
    const later = CHASE_3322.replace('$4,479.53', '$4,279.53')
      .replace('as of Nov 10, 2026', 'as of Nov 11, 2026')
      .replace('Transactions\n', 'Transactions\nNov 11  LOWES  -$200.00\n');
    const [doc] = await approveAll(ledger, [['3322b.jpg', later]]);
    expect(doc.links.find((l) => l.kind === 'transactions')).toMatchObject({ count: 1, duplicates: 4 });
    expect(own('a-3322').map((t) => t.description)).toContain('LOWES');
    expect(deriveAccountBalances(dataWith(ledger), NOV11)['a-3322']).toBe(4279.53);
  });
  it('a bill already paid in the screenshot rows is recognized as paid: counted once as cleared, never subtracted again', async () => {
    const ledger = [];
    await approveAll(ledger, [['3322.jpg', CHASE_3322]]);
    const data = dataWith(ledger, {
      recurringObligations: [
        {
          id: 'ob-ameren',
          name: 'Ameren Illinois',
          group: 'business',
          type: 'regular',
          amount: 161.04,
          frequency: 'monthly',
          nextDue: '2026-11-10',
          entityId: 'e-poeprops',
          accountId: 'a-3322',
          enabled: true,
          verifiedAt: '2026-11-11T12:00:00.000Z',
        },
      ],
    });
    const sc = resolveScope(data, 'e-poeprops');
    const ob = obligationEvents(data, sc, NOV11, addDays(NOV11, 30), {}, { asOf: NOV11 });
    expect(ob.settled.some((e) => /Ameren/i.test(e.label) && e.settled === 'paid-in-ledger')).toBe(true);
    expect(ob.events.filter((e) => /Ameren/i.test(e.label)).map((e) => e.date)).toEqual(['2026-12-10']);
    const r = buildSafeToSpend(data, { currentDate: NOV11, period: '30d', scope: 'e-poeprops' });
    expect(r.windows.cleared.items.map((i) => i.label)).toContain('Ameren Illinois');
    expect(r.windows.next14.items.filter((i) => /Ameren/i.test(i.label))).toHaveLength(0);
    expect(r.lines.availableCash).toBe(4479.53); // the bank figure already has the payment inside it
  });
  it("money moved between the family's own accounts is never income and never a bill", async () => {
    const ledger = [];
    await approveAll(ledger);
    const data = dataWith(ledger);
    const sc = resolveScope(data, 'personal');
    const inc = incomeEvents(data, sc, NOV11, addDays(NOV11, 30), {}, NOV11);
    expect(inc.events.some((e) => /CASH APP/i.test(e.label))).toBe(false);
    const ob = obligationEvents(data, resolveScope(data, 'e-poeprops'), NOV11, addDays(NOV11, 60), {}, { asOf: NOV11 });
    expect(ob.events.some((e) => /TRANSFER/i.test(e.label))).toBe(false);
    expect(ob.events.some((e) => /LOAN PMT/i.test(e.label))).toBe(false); // the debt's minimum carries it, not a guessed bill
  });
  it('the original is kept before anything is read, even when reading fails; a dated, single-balance screenshot asks nothing', async () => {
    const store = memoryStore();
    const file = fakeFile('blurry.jpg', 'image/jpeg', 'nothing legible');
    const kept = await receive(file, { store });
    expect((await store.getDoc(kept.id)).blob).toBe(file);
    const [doc] = await intakeFiles([file], {
      ...ctxFor(store),
      reader: async () => {
        throw new Error('OCR found no text');
      },
    });
    expect(doc.status).toBe('needs-answer');
    expect(doc.questions[0].field).toBe('unreadable');
    expect((await store.getDoc(doc.id)).blob).toBe(file);
    const [clean] = await intakeFiles([fakeFile('7206.jpg', 'image/jpeg', CHASE_7206)], ctxFor(store));
    expect(clean.questions).toHaveLength(0);
    expect(clean.status).toBe('ready');
  });
});

describe('TASK 4 — Safe to Spend answers the seven questions over the three accounts', () => {
  // Confirmed from the bank's own row on the review screen, so it carries the bank's spelling.
  const fsbLoan = {
    id: 'ob-fsb-5342',
    name: 'First State Bank loan 5342',
    paidAs: 'FIRST STATE BK LOAN PMT 5342',
    group: 'rental',
    type: 'regular',
    amount: 612,
    frequency: 'monthly',
    nextDue: '2026-11-01',
    entityId: 'e-poeprops',
    accountId: 'a-3322',
    enabled: true,
    graceDays: 15,
  };
  it('cash now, paid, due, income, reserve, safe today and extra toward debt — Personal with the $10,000 reserve untouched', async () => {
    const ledger = [];
    await approveAll(ledger);
    const data = dataWith(ledger, {
      recurringObligations: [
        {
          id: 'ob-bg',
          name: 'BG & Mom',
          group: 'family',
          type: 'regular',
          amount: 750,
          frequency: 'biweekly',
          nextDue: '2026-11-18',
          entityId: 'e-personal',
          accountId: 'a-7206',
          enabled: true,
        },
      ],
    });
    const r = buildSafeToSpend(data, { currentDate: NOV11, period: '14d', scope: 'personal' });
    expect(r.lines.availableCash).toBe(3183.1); // 1. what I actually have (bank-verified)
    expect(r.balanceSources[0]).toMatchObject({ verifiedOn: '2026-11-11', counted: true });
    expect(r.windows.cleared.total).toBe(0); // 2. nothing paid inside the window yet
    expect(r.windows.next14.items.map((i) => [i.label, i.amount, i.date])).toEqual([['BG & Mom', 750, '2026-11-18']]); // 3. what is coming due
    expect(r.lines.expectedIncome).toBe(0); // 4. no income entered: $0, never invented
    expect(r.lines.minCushion).toBe(10000); // 5. what stays untouched
    expect(r.safeToSpendNow).toBe(0); // 6. nothing is safe while cash is under the reserve
    expect(r.shortfall).toBe(10000 - (3183.1 - 750));
    expect(r.lines.potentialDebtPayment).toBe(0); // 7. nothing extra toward debt
    expect(r.status).toBe('verified');
  });
  it('business cash is never personal spending money: each entity on its own row, the headline is Personal', async () => {
    const ledger = [];
    await approveAll(ledger);
    const data = dataWith(ledger, { moneyPlan: { settings: { reserveByEntity: { personal: 10000, 'e-poeprops': 1000, 'e-tlc': 0 } } } });
    const all = buildSafeToSpend(data, { currentDate: NOV11, period: '14d', scope: 'consolidated' });
    const row = (id) => all.byEntity.find((r) => r.scope.id === id);
    expect(all.safeToSpendNow).toBe(0);
    expect(row('e-poeprops').safeToSpendNow).toBe(3479.53);
    expect(row('e-tlc').safeToSpendNow).toBe(370.69);
    expect(all.explanation[0]).toMatch(/Personal money only/);
    expect(row('e-poeprops').lines.availableCash + row('e-tlc').lines.availableCash).toBeGreaterThan(all.lines.availableCash);
  });
  it('a cleared bill is never deducted twice: the Ameren payment inside the Nov 10 bank figure leaves the projection', async () => {
    const ledger = [];
    await approveAll(ledger, [['3322.jpg', CHASE_3322]]);
    const data = dataWith(ledger, {
      recurringObligations: [
        {
          id: 'ob-ameren',
          name: 'Ameren Illinois',
          group: 'business',
          type: 'regular',
          amount: 161.04,
          frequency: 'monthly',
          nextDue: '2026-11-10',
          entityId: 'e-poeprops',
          accountId: 'a-3322',
          enabled: true,
          verifiedAt: '2026-11-11T12:00:00.000Z',
        },
      ],
    });
    const r = buildSafeToSpend(data, { currentDate: NOV11, period: '14d', scope: 'e-poeprops' });
    expect(r.lines.billsDue).toBe(0);
    expect(r.lines.projectedLowest.amount).toBe(4479.53);
  });
  it('missing information is named, never shown as a verified number: an unverified account is left out and the status says why', async () => {
    const ledger = [];
    await approveAll(ledger, [['7206.jpg', CHASE_7206]]); // only Personal verified
    const data = dataWith(ledger);
    const tlc = buildSafeToSpend(data, { currentDate: NOV11, period: '14d', scope: 'e-tlc' });
    expect(tlc.status).toBe('estimate');
    expect(tlc.reconciliationRequired).toBe(true);
    expect(tlc.safeToSpendNow).toBe(0);
    expect(tlc.confidence.reasons.join(' ')).toMatch(/TLC Therapy Solutions 8168/);
    const all = buildSafeToSpend(data, { currentDate: NOV11, period: '14d', scope: 'consolidated' });
    expect(all.byEntity.find((r) => r.scope.id === 'e-tlc').balanceSources[0]).toMatchObject({ verifiedOn: null, counted: true });
  });
  it('TASK 3 — a missed loan payment is past due on its contract date, apart from the regular bills; 7/14/30-day windows and the income before them', async () => {
    const ledger = [];
    await approveAll(ledger, [['3322.jpg', CHASE_3322]]);
    const data = dataWith(ledger, {
      recurringObligations: [
        fsbLoan,
        {
          id: 'ob-ins',
          name: 'Country Financial insurance',
          group: 'rental',
          type: 'regular',
          amount: 210,
          frequency: 'monthly',
          nextDue: '2026-11-25',
          entityId: 'e-poeprops',
          accountId: 'a-3322',
          enabled: true,
        },
      ],
      inflows: { salaries: [], rentals: [{ id: 'r-805', name: '805 Main', rent: 700, actual: 700, status: 'paying', entityId: 'e-poeprops' }] },
      moneyPlan: { settings: { reserveByEntity: { 'e-poeprops': 0 }, rentDueDay: 1 } },
    });
    const r = buildSafeToSpend(data, { currentDate: NOV11, period: '14d', scope: 'e-poeprops' });
    const W = r.windows;
    // The Nov 6 loan payment on the screen was 5342's October installment? No: the
    // ledger row pays the Nov 1 occurrence (inside its window), so 5342 is settled…
    // …unless the payment is not there. Remove it to see the grace state.
    const unpaid = { ...data, transactions: data.transactions.filter((t) => !/LOAN PMT/.test(t.description || '')) };
    const u = buildSafeToSpend(unpaid, { currentDate: NOV11, period: '14d', scope: 'e-poeprops' });
    const past = u.windows.pastDue.items.find((i) => /5342/.test(i.label));
    expect(past).toMatchObject({ dueDate: '2026-11-01', status: 'in-grace', graceEndsOn: '2026-11-16', amount: 612 });
    expect(u.windows.regular30.items.filter((i) => /5342/.test(i.label)).map((i) => i.date)).toEqual(['2026-12-01']); // next month's is a regular bill
    expect(u.windows.next7.items.some((i) => /5342/.test(i.label))).toBe(true); // still owed now
    // With the payment on the screen, the loan is paid and leaves every window.
    expect(W.pastDue.items).toHaveLength(0);
    expect(W.cleared.items.map((i) => i.label)).toContain('First State Bank loan 5342');
    // 7 / 14 / 30 days, and the income that arrives before each window's bills.
    expect(W.next7.total).toBe(0);
    expect(W.next14.total).toBe(210); // the insurance on Nov 25 is inside 14 days
    expect(W.next30.items.map((i) => [i.label, i.date])).toEqual([
      ['Country Financial insurance', '2026-11-25'],
      ['First State Bank loan 5342', '2026-12-01'],
    ]);
    expect(W.income14.total).toBe(0);
    expect(W.income30).toMatchObject({ total: 700 });
    expect(W.income30.items[0]).toMatchObject({ date: '2026-12-01', label: 'Rent · 805 Main', inferred: false });
  });
});
