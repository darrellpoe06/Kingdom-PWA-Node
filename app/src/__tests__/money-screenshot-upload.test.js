// money-screenshot-upload.test.js — Money → Upload a Chase 7206 screenshot →
// extract → review → approve → save (Darrell 2026-11-06, the first milestone).
// A banking-app screenshot is not a statement: it shows the balance AS OF A
// DAY and a few recent rows. Through the one Books upload (DR-0709) it becomes
// the bank-verified balance checkpoint the Money engine already trusts, plus
// its rows through the same dedupe every import uses. Nothing is invented.
import { describe, it, expect, vi } from 'vitest';
import { extractDocument, classifyText, asOfDateOf, snapshotLines, DOC_TYPES, DOC_TYPE_LABEL } from '../lib/books-intake-extract.js';
import { memoryStore } from '../lib/books-intake-store.js';
import { intakeFiles, answer, commitDoc, canWrite } from '../lib/books-intake-pipeline.js';
import { buildSafeToSpend, obligationEvents, resolveScope, addDays } from '../lib/safe-to-spend.js';
import { deriveAccountBalances, latestCheckpoints } from '../lib/financial-engineering.js';

const fakeFile = (name, type, body) => ({ name, type, size: body.length, text: async () => body, arrayBuffer: async () => new TextEncoder().encode(body).buffer });

// What OCR reads off the Chase app on the Fold, 2026-11-05.
const CHASE_7206 = [
  'Chase',
  'TOTAL CHECKING (...7206)',
  'Available balance',
  '$5,774.00',
  'Present balance $5,774.00',
  'as of Nov 5, 2026',
  'Transactions',
  'Pending',
  'Nov 5  Zelle payment to BG & Mom JPM99D23RK9R  -$750.00',
  'Posted',
  'Nov 4  CASH APP*DARRELL POE  +$700.00',
  'Nov 3  UIUC PAYROLL DIRECT DEP  $1,912.40',
  'Oct 31  AMEREN ILLINOIS BILL PAY  -$161.04',
].join('\n');
const CHASE_7206_NO_DATE = CHASE_7206.split('\n').filter((l) => !/as of/i.test(l)).join('\n');
const CHASE_3322 = ['Chase', 'BUSINESS CHECKING (...3322)', 'Available balance', '$2,539.53', 'as of Nov 4, 2026', 'Transactions', 'Nov 4  CASH APP*DARRELL POE  +$450.00'].join('\n');

const ACCOUNTS = [
  { id: 'a-7206', name: 'Chase 7206', fragment: '7206', type: 'checking', entityId: 'e-personal', balance: 0 },
  { id: 'a-3322', name: 'Chase 3322', fragment: '3322', type: 'checking', entityId: 'e-poeprops', balance: 0 },
];
const ENTITIES = [{ id: 'e-personal', name: 'Personal', type: 'personal' }, { id: 'e-poeprops', name: 'Poe Properties LLC', type: 'business' }];
const ctxFor = (store, transactions = [], extra = {}) => ({ store, hint: 'overview', known: { accounts: ACCOUNTS, entities: ENTITIES, transactions }, reader: async (f) => ({ text: await f.text(), method: 'ocr:test' }), ...extra });
const at = (y, m, d) => new Date(y, m - 1, d, 12);

describe('a banking-app screenshot is its own kind of document (PROVEN TO CATCH)', () => {
  it('is in the catalog with a label a person recognizes', () => {
    expect(DOC_TYPES).toContain('account-snapshot');
    expect(DOC_TYPE_LABEL['account-snapshot']).toMatch(/screenshot/i);
  });
  it('the Chase 7206 screen classifies as a screenshot, not a bank statement, with confidence', () => {
    const c = classifyText(CHASE_7206, { hint: 'overview' });
    expect(c.doc_type).toBe('account-snapshot');
    expect(c.confidence).toBeGreaterThanOrEqual(0.6);
    const noHint = classifyText(CHASE_7206);
    expect(noHint.doc_type).toBe('account-snapshot');
  });
  it('extracts the available balance, the day, the last four, and the rows with the right year and signs', () => {
    const x = extractDocument({ text: CHASE_7206 }, { name: 'Screenshot_20261105_Chase.jpg', type: 'image/jpeg', receivedAt: '2026-11-05T18:00:00.000Z' });
    expect(x.summary.availableBalance).toBe(5774);
    expect(x.summary.newBalance).toBe(5774);
    expect(x.summary.balanceKind).toBe('available');
    expect(x.dates.document).toBe('2026-11-05');
    expect(x.account_hint).toMatchObject({ last4: '7206', institution: 'Chase' });
    expect(x.line_items.map((r) => [r.date, r.amount])).toEqual([
      ['2026-11-05', -750], ['2026-11-04', 700], ['2026-11-03', 1912.4], ['2026-10-31', -161.04],
    ]);
    expect(x.line_items[0].pending).toBe(true);
    expect(x.line_items[1].pending).toBeUndefined();
    expect(x.uncertain).toEqual([]);
  });
  it('a Cash App move between the family\'s own accounts is a transfer, never income', () => {
    const x = extractDocument({ text: CHASE_7206 }, { name: 's.jpg' });
    const cashApp = x.line_items.find((r) => /cash app/i.test(r.description));
    expect(cashApp.category).toBe('transfer');
    expect(x.line_items.find((r) => /payroll/i.test(r.description)).category).toBeUndefined();
  });
  it('reads the day in its common spellings, and refuses to guess one', () => {
    expect(asOfDateOf('Balance as of 11/05/2026')).toBe('2026-11-05');
    expect(asOfDateOf('As of November 5, 2026')).toBe('2026-11-05');
    expect(asOfDateOf('Nothing dated here')).toBeNull();
    expect(snapshotLines('Nov 4  SOMETHING  -$5.00', { asOf: null })).toEqual([]);
    // a December row on a January screen belongs to the year before
    expect(snapshotLines('Dec 30  LATE ROW  -$5.00', { asOf: '2027-01-03' })[0].date).toBe('2026-12-30');
  });
  it('a screenshot with no date asks for the day, offering the day it was uploaded first — never assuming it', async () => {
    const store = memoryStore();
    const now = () => '2026-11-05T18:00:00.000Z';
    const [doc] = await intakeFiles([fakeFile('shot.jpg', 'image/jpeg', CHASE_7206_NO_DATE)], { ...ctxFor(store), now });
    expect(doc.status).toBe('needs-answer');
    const q = doc.questions.find((qq) => qq.field === 'as_of');
    expect(q).toBeTruthy();
    expect(q.blocking).toBe(true);
    expect(q.suggestions[0].value).toBe('2026-11-05');
    expect(canWrite(doc)).toBe(false);
    const answered = await answer(doc, q.id, '2026-11-05', ctxFor(store));
    expect(answered.status).toBe('ready');
    expect(answered.plan.checkpoint).toMatchObject({ balance: 5774, day: '2026-11-05', basis: 'available' });
    expect(answered.extraction.line_items).toHaveLength(4);
  });
});


describe('two answers on one screenshot: each stays saved, and the document reaches Ready (Darrell 2026-11-06, PROVEN TO CATCH)', () => {
  // His real Chase 7206 screen: no date on it, Available $4,687.18 and Present $5,062.72.
  const REAL = ['Chase', 'Chase Personal Checking (...7206)', 'Available balance', '$4,687.18', 'Present balance $5,062.72', 'Transactions', 'Nov 5  Zelle payment to BG & Mom JPM99D23RK9R  -$750.00'].join('\n');
  const REAL_ACCOUNTS = [{ id: 'a-7206', name: 'Chase Personal Checking', fragment: '7206', type: 'checking', entityId: 'e-personal', balance: 0 }];
  const ctx2 = (store, transactions = []) => ({ store, hint: 'overview', known: { accounts: REAL_ACCOUNTS, entities: ENTITIES, transactions }, reader: async (f) => ({ text: await f.text() }), now: () => '2026-11-06T18:00:00.000Z' });
  it('date first, then Available: both answers stay on the document, nothing is re-asked, status is ready with the $4,687.18 checkpoint for 2026-11-06', async () => {
    const store = memoryStore();
    const [doc] = await intakeFiles([fakeFile('shot.jpg', 'image/jpeg', REAL)], ctx2(store));
    expect(doc.questions.map((q) => q.field).sort()).toEqual(['as_of', 'balance_kind']);
    const d2 = await answer(doc, `${doc.id}:as_of`, '2026-11-06', ctx2(store));
    expect(d2.questions.find((q) => q.field === 'as_of')).toMatchObject({ status: 'answered', answer: '2026-11-06' });
    expect(d2.questions.filter((q) => q.status === 'open').map((q) => q.field)).toEqual(['balance_kind']);
    const d3 = await answer(d2, `${d2.id}:balance_kind`, 'available', ctx2(store));
    expect(d3.questions.filter((q) => q.status !== 'answered')).toHaveLength(0);
    expect(d3.questions.map((q) => [q.field, q.answer]).sort()).toEqual([['as_of', '2026-11-06'], ['balance_kind', 'available']]);
    expect(d3.status).toBe('ready');
    expect(canWrite(d3)).toBe(true);
    expect(d3.plan).toMatchObject({ kind: 'snapshot', accountId: 'a-7206', checkpoint: { balance: 4687.18, day: '2026-11-06', basis: 'available' } });
    expect(d3.extraction.uncertain).toEqual([]);
  });
  it('Available first, then the date: the same end state', async () => {
    const store = memoryStore();
    const [doc] = await intakeFiles([fakeFile('shot.jpg', 'image/jpeg', REAL)], ctx2(store));
    const d2 = await answer(doc, `${doc.id}:balance_kind`, 'available', ctx2(store));
    expect(d2.questions.filter((q) => q.status === 'open').map((q) => q.field)).toEqual(['as_of']);
    const d3 = await answer(d2, `${d2.id}:as_of`, '2026-11-06', ctx2(store));
    expect(d3.status).toBe('ready');
    expect(d3.plan.checkpoint).toMatchObject({ balance: 4687.18, day: '2026-11-06', basis: 'available' });
  });
  it('choosing Present instead records $5,062.72 as the current balance', async () => {
    const store = memoryStore();
    const [doc] = await intakeFiles([fakeFile('shot.jpg', 'image/jpeg', REAL)], ctx2(store));
    const d2 = await answer(doc, `${doc.id}:as_of`, '2026-11-06', ctx2(store));
    const d3 = await answer(d2, `${d2.id}:balance_kind`, 'current', ctx2(store));
    expect(d3.status).toBe('ready');
    expect(d3.plan.checkpoint).toMatchObject({ balance: 5062.72, day: '2026-11-06', basis: 'current' });
  });
  it('approval writes the verified balance to the EXISTING Chase 7206 account (no new account), the engine reads it verified on 2026-11-06, and the one row lands once', async () => {
    const store = memoryStore();
    const ledger = [];
    const addAccount = vi.fn();
    const sinks = { addAccount, commitImportedRows: async (rows) => { rows.forEach((r, i) => ledger.push({ id: `t-${ledger.length + i}`, ...r })); return { saved: rows.length }; } };
    const [doc] = await intakeFiles([fakeFile('shot.jpg', 'image/jpeg', REAL)], ctx2(store));
    const d2 = await answer(doc, `${doc.id}:as_of`, '2026-11-06', ctx2(store));
    const d3 = await answer(d2, `${d2.id}:balance_kind`, 'available', ctx2(store));
    const out = await commitDoc(d3, { store, sinks, known: { accounts: REAL_ACCOUNTS, entities: ENTITIES, transactions: [] } });
    expect(out.status).toBe('added');
    expect(addAccount).not.toHaveBeenCalled();
    const cps = ledger.filter((t) => t.category === 'balance-checkpoint');
    expect(cps).toHaveLength(1);
    expect(cps[0]).toMatchObject({ accountId: 'a-7206', date: '2026-11-06' });
    expect(cps[0].reconciliation).toMatchObject({ balance: 4687.18, basis: 'available' });
    expect(ledger.filter((t) => t.category !== 'balance-checkpoint')).toHaveLength(1);
    const data = { entities: ENTITIES, accounts: REAL_ACCOUNTS, transactions: ledger, recurringObligations: [], inflows: { salaries: [], rentals: [] }, moneyPlan: { settings: { reserveByEntity: { personal: 10000 } } } };
    expect(deriveAccountBalances(data, at(2026, 11, 6))['a-7206']).toBe(4687.18);
    const r = buildSafeToSpend(data, { currentDate: at(2026, 11, 6), period: '7d', scope: 'personal' });
    expect(r.balanceSources.find((b) => b.id === 'a-7206')).toMatchObject({ verifiedOn: '2026-11-06', verifiedBalance: 4687.18 });
    expect(r.lines.availableCash).toBe(4687.18);
    expect(r.safeToSpendNow).toBe(0); // under the $10,000 reserve
    // approving the same screenshot again writes nothing more
    const [again] = await intakeFiles([fakeFile('shot2.jpg', 'image/jpeg', REAL)], ctx2(store, ledger));
    const a2 = await answer(again, `${again.id}:as_of`, '2026-11-06', ctx2(store, ledger));
    const a3 = await answer(a2, `${a2.id}:balance_kind`, 'available', ctx2(store, ledger));
    const before = ledger.length;
    await commitDoc(a3, { store, sinks, known: { accounts: REAL_ACCOUNTS, entities: ENTITIES, transactions: ledger } });
    expect(ledger.length).toBe(before);
  });
});

describe('Money → upload → review → approve → save, Chase 7206', () => {
  it('matches the account by its last four, keeps it Personal, and plans the verified balance plus 4 new rows', async () => {
    const store = memoryStore();
    const [doc] = await intakeFiles([fakeFile('shot.jpg', 'image/jpeg', CHASE_7206)], ctxFor(store));
    expect(doc.status).toBe('ready');
    expect(doc.questions.filter((q) => q.status === 'open')).toHaveLength(0);
    expect(doc.matched.account).toMatchObject({ accountId: 'a-7206', certain: true });
    expect(doc.matched.entity).toMatchObject({ entityId: 'e-personal' });
    expect(doc.plan).toMatchObject({ kind: 'snapshot', accountId: 'a-7206', checkpoint: { balance: 5774, day: '2026-11-05', basis: 'available' }, checkpointAlreadyRecorded: false, duplicates: 0 });
    expect(doc.plan.rows).toHaveLength(4);
    expect(doc.recon.status).toBe('unverifiable');
    expect(doc.recon.note).toMatch(/bank-verified balance for that day/);
  });
  it('on approval the engine reads $5,774 verified on 2026-11-05 for Personal, and the rows are in the ledger once', async () => {
    const store = memoryStore();
    const ledger = [];
    const sinks = { commitImportedRows: async (rows) => { rows.forEach((r, i) => ledger.push({ id: `t-${ledger.length + i}`, ...r })); return { saved: rows.length }; } };
    const [doc] = await intakeFiles([fakeFile('shot.jpg', 'image/jpeg', CHASE_7206)], ctxFor(store));
    const out = await commitDoc(doc, { store, sinks, known: { accounts: ACCOUNTS, entities: ENTITIES, transactions: [] } });
    expect(out.status).toBe('added');
    expect(out.links.find((l) => l.kind === 'transactions').count).toBe(4);
    expect(out.links.find((l) => l.kind === 'checkpoint')).toMatchObject({ balance: 5774, day: '2026-11-05', basis: 'available' });
    const cp = ledger.find((t) => t.category === 'balance-checkpoint');
    expect(cp).toMatchObject({ accountId: 'a-7206', amount: 0, date: '2026-11-05' });
    expect(cp.reconciliation.balance).toBe(5774);
    expect(cp.reconciliation.basis).toBe('available');

    const data = { entities: ENTITIES, accounts: ACCOUNTS, transactions: ledger, recurringObligations: [], inflows: { salaries: [], rentals: [] }, moneyPlan: { settings: { reserveByEntity: { personal: 10000 } } } };
    expect(deriveAccountBalances(data, at(2026, 11, 5))['a-7206']).toBe(5774);
    expect(latestCheckpoints(data, at(2026, 11, 5))['a-7206'].day).toBe('2026-11-05');
    const r = buildSafeToSpend(data, { currentDate: at(2026, 11, 5), period: '7d', scope: 'personal' });
    expect(r.lines.availableCash).toBe(5774);
    expect(r.balanceSources.find((b) => b.id === 'a-7206')).toMatchObject({ verifiedOn: '2026-11-05', verifiedBalance: 5774 });
    expect(r.status).toBe('verified');
    // Poe Properties never sees Personal's cash
    const poe = buildSafeToSpend(data, { currentDate: at(2026, 11, 5), period: '7d', scope: 'e-poeprops' });
    expect(poe.lines.availableCash).toBe(0);
  });
  it('the same screenshot uploaded again adds nothing: 0 new rows, the checkpoint already recorded', async () => {
    const store = memoryStore();
    const ledger = [];
    const sinks = { commitImportedRows: async (rows) => { rows.forEach((r, i) => ledger.push({ id: `t-${ledger.length + i}`, ...r })); return { saved: rows.length }; } };
    const [first] = await intakeFiles([fakeFile('shot.jpg', 'image/jpeg', CHASE_7206)], ctxFor(store));
    await commitDoc(first, { store, sinks, known: { accounts: ACCOUNTS, entities: ENTITIES, transactions: [] } });
    const before = ledger.length;
    const [again] = await intakeFiles([fakeFile('shot2.jpg', 'image/jpeg', CHASE_7206)], ctxFor(store, ledger));
    expect(again.plan.rows).toHaveLength(0);
    expect(again.plan.duplicates).toBe(4);
    expect(again.plan.checkpointAlreadyRecorded).toBe(true);
    const out = await commitDoc(again, { store, sinks, known: { accounts: ACCOUNTS, entities: ENTITIES, transactions: ledger } });
    expect(out.status).toBe('added');
    expect(ledger.length).toBe(before);
    expect(out.links.find((l) => l.kind === 'checkpoint').alreadyRecorded).toBe(true);
  });
  it('a later screenshot with a newer balance records a second checkpoint and only the rows the books lack', async () => {
    const store = memoryStore();
    const ledger = [];
    const sinks = { commitImportedRows: async (rows) => { rows.forEach((r, i) => ledger.push({ id: `t-${ledger.length + i}`, ...r })); return { saved: rows.length }; } };
    const [first] = await intakeFiles([fakeFile('shot.jpg', 'image/jpeg', CHASE_7206)], ctxFor(store));
    await commitDoc(first, { store, sinks, known: { accounts: ACCOUNTS, entities: ENTITIES, transactions: [] } });
    const later = CHASE_7206.replace('$5,774.00\nPresent balance $5,774.00\nas of Nov 5, 2026', '$5,024.00\nPresent balance $5,024.00\nas of Nov 6, 2026').replace('Pending\n', 'Pending\nNov 6  SHELL OIL  -$42.10\n');
    const [second] = await intakeFiles([fakeFile('shot2.jpg', 'image/jpeg', later)], ctxFor(store, ledger));
    expect(second.plan.rows.map((r) => r.description)).toEqual(['SHELL OIL']);
    await commitDoc(second, { store, sinks, known: { accounts: ACCOUNTS, entities: ENTITIES, transactions: ledger } });
    const data = { entities: ENTITIES, accounts: ACCOUNTS, transactions: ledger, recurringObligations: [], inflows: { salaries: [], rentals: [] }, moneyPlan: { settings: {} } };
    expect(deriveAccountBalances(data, at(2026, 11, 6))['a-7206']).toBe(5024);
    expect(latestCheckpoints(data, at(2026, 11, 6))['a-7206'].day).toBe('2026-11-06');
  });
  it('a Chase 3322 screenshot lands on the Poe Properties account, apart from Personal', async () => {
    const store = memoryStore();
    const [doc] = await intakeFiles([fakeFile('shot.jpg', 'image/jpeg', CHASE_3322)], ctxFor(store));
    expect(doc.status).toBe('ready');
    expect(doc.matched.account.accountId).toBe('a-3322');
    expect(doc.matched.entity.entityId).toBe('e-poeprops');
    expect(doc.plan.checkpoint).toMatchObject({ balance: 2539.53, day: '2026-11-04' });
    expect(doc.plan.rows[0].category).toBe('transfer');
  });
  it('an imported Zelle row settles the BG & Mom bill it paid: paid and cleared, not subtracted again', async () => {
    const store = memoryStore();
    const ledger = [];
    const sinks = { commitImportedRows: async (rows) => { rows.forEach((r, i) => ledger.push({ id: `t-${ledger.length + i}`, ...r })); return { saved: rows.length }; } };
    const [doc] = await intakeFiles([fakeFile('shot.jpg', 'image/jpeg', CHASE_7206)], ctxFor(store));
    await commitDoc(doc, { store, sinks, known: { accounts: ACCOUNTS, entities: ENTITIES, transactions: [] } });
    const data = { entities: ENTITIES, accounts: ACCOUNTS, transactions: ledger, inflows: { salaries: [], rentals: [] }, moneyPlan: { settings: {} },
      recurringObligations: [{ id: 'ob-bg', name: 'BG & Mom', group: 'family', type: 'regular', amount: 750, frequency: 'biweekly', nextDue: '2026-11-05', entityId: 'e-personal', accountId: 'a-7206', enabled: true }] };
    const start = new Date(2026, 10, 5);
    const ob = obligationEvents(data, resolveScope(data, 'personal'), start, addDays(start, 14), {}, { asOf: start });
    expect(ob.settled.some((e) => /BG & Mom/i.test(e.label) && e.settled === 'paid-in-ledger')).toBe(true);
    expect(ob.events.filter((e) => /BG & Mom/i.test(e.label)).map((e) => e.date)).toEqual(['2026-11-19']);
  });
});
