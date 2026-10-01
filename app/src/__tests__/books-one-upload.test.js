// DR-0709 — the one Books upload. Every claim the pipeline makes is pinned
// here, and each test was watched failing against a broken variant first
// (see the DR's proven-to-catch notes).
import { describe, it, expect, vi } from 'vitest';
import { extractDocument, classifyText, DOC_TYPES } from '../lib/books-intake-extract.js';
import { reconcileExtraction, buildTimeline } from '../lib/books-intake-reconcile.js';
import { resolveAccount, matchDocument } from '../lib/books-intake-match.js';
import { ocrRoute, readAnyFile, readPdf } from '../lib/books-intake-read.js';
import { memoryStore } from '../lib/books-intake-store.js';
import { intakeFiles, answer, commitDoc, canWrite, processDoc, receive, planWrite } from '../lib/books-intake-pipeline.js';
import { queueSummary } from '../lib/books-intake-questions.js';

// A file-like object: the pipeline only ever calls name/type/size/text/arrayBuffer.
const fakeFile = (name, type, body) => ({
  name, type, size: body.length,
  text: async () => (typeof body === 'string' ? body : new TextDecoder().decode(body)),
  arrayBuffer: async () => (typeof body === 'string' ? new TextEncoder().encode(body).buffer : body.buffer),
});

const CARD_TEXT = [
  'Chase Freedom',
  'Account ending in 4321',
  'Opening/Closing Date 08/12/26 - 09/11/26',
  'Previous Balance $1,000.00',
  'Payments and Credits -500.00',
  'Purchases +$250.00',
  'Fees Charged $0.00',
  'Interest Charged $12.34',
  'New Balance $762.34',
  'Minimum Payment Due $35.00',
  'Payment Due Date 10/08/26',
  'Annual Percentage Rate (APR) 24.99%',
  'Credit Limit $5,000.00',
  '08/15 AMAZON MKTP 150.00',
  '08/20 GROCERY STORE 100.00',
  '08/25 PAYMENT THANK YOU -500.00',
  '09/11 INTEREST CHARGE ON PURCHASES 12.34',
].join('\n');

const W2_TEXT = 'Form W-2 Wage and Tax Statement 2025\nEmployer\'s name ACME LLC\nWages, tips, other compensation 52,000.00\nOMB No. 1545-0008\nDepartment of the Treasury - Internal Revenue Service';
const RECEIPT_TEXT = 'WALMART SUPERCENTER\n09/05/2026\nSUBTOTAL 20.00\nTAX 1.60\nTOTAL 21.60\nVISA ****1234\nTHANK YOU';
const CSV_TEXT = 'Transaction Date,Description,Amount\n09/01/2026,COFFEE SHOP,-4.50\n09/02/2026,PAYROLL DEPOSIT,1200.00\n';

// A real, minimal PDF with a text layer: one line of text per statement line.
function textPdf(lines) {
  const esc = (s) => s.replace(/[\\()]/g, (c) => `\\${c}`);
  const stream = `BT /F1 10 Tf 12 TL 40 760 Td ${lines.map((l) => `(${esc(l)}) Tj T*`).join(' ')} ET`;
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let out = '%PDF-1.4\n';
  const offs = [];
  objs.forEach((o, i) => { offs.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offs.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}`;
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(out);
}

async function loadPdfjsForNode() {
  const lib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const { createRequire } = await import('node:module');
  const require = createRequire(import.meta.url);
  lib.GlobalWorkerOptions.workerSrc = require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs');
  return lib;
}

const ACCOUNTS = [
  { id: 'a-chk', name: 'Chase Checking', fragment: '...7206', type: 'bank', entityId: 'e-fam' },
  { id: 'a-cc', name: 'Chase Freedom', fragment: '...4321', type: 'credit', entityId: 'e-fam' },
];
const ENTITIES = [{ id: 'e-fam', name: 'Poe Family' }, { id: 'e-biz', name: 'PoeTech LLC' }];

describe('one common shape across every kind', () => {
  it('a statement, a W-2, a receipt and a download all come out in the SAME shape', () => {
    const keys = ['doc_type', 'confidence', 'dates', 'amounts', 'parties', 'account_hint', 'entity_hint', 'property_hint', 'line_items', 'tax_year', 'source_file'];
    const docs = [
      extractDocument({ text: CARD_TEXT }, { name: 'stmt.pdf' }),
      extractDocument({ text: W2_TEXT }, { name: 'w2.pdf' }),
      extractDocument({ text: RECEIPT_TEXT }, { name: 'r.jpg' }),
      extractDocument({ text: CSV_TEXT, rows: [{ date: '2026-09-01', description: 'COFFEE', amount: -4.5 }] }, { name: 'x.csv' }),
    ];
    expect(docs.map((d) => d.doc_type)).toEqual(['card-statement', 'tax-form', 'receipt', 'transactions-export']);
    for (const d of docs) {
      for (const k of keys) expect(d, k).toHaveProperty(k);
      expect(Object.keys(d.dates).sort()).toEqual(['document', 'due', 'paid', 'period_end', 'period_start']);
      expect(DOC_TYPES).toContain(d.doc_type);
    }
    expect(docs[1].tax_year).toBe(2025);
    expect(docs[2].amounts[0].value).toBe(21.6);
  });

  it('the tab is a hint that breaks a tie, never a route', () => {
    // A card statement opened from Taxes is still a card statement.
    expect(classifyText(CARD_TEXT, { hint: 'taxes' }).doc_type).toBe('card-statement');
    // A page with nothing on it stays unknown even from Debts.
    expect(classifyText('hello', { hint: 'debts' }).doc_type).toBe('unknown');
  });
});

describe('a text PDF statement is read, extracted and reconciled', () => {
  it('reads a real PDF text layer and the numbers close to the cent', async () => {
    const pdfjs = await loadPdfjsForNode();
    const file = fakeFile('chase-statement.pdf', 'application/pdf', textPdf(CARD_TEXT.split('\n')));
    const read = await readPdf(file, { pdfjs });
    expect(read.method).toBe('pdf-text');
    const x = extractDocument(read, { name: file.name });
    expect(x.doc_type).toBe('card-statement');
    expect(x.account_hint).toEqual({ last4: '4321', institution: 'Chase' });
    expect(x.dates.period_end).toBe('2026-09-11');
    expect(x.dates.due).toBe('2026-10-08');
    expect(x.line_items).toHaveLength(4);
    expect(x.line_items[0]).toMatchObject({ date: '2026-08-15', amount: 150 });
    const recon = reconcileExtraction(x);
    expect(recon.status).toBe('reconciled');
    expect(recon.checks.map((c) => c.name)).toEqual(['summary', 'line-items']);
  }, 20000);
});

describe('OCR is sovereign: the NAS first, the device second, never a cloud AI', () => {
  it('uses the NAS when it answers', async () => {
    const nas = vi.fn(async () => ({ ok: true, text: 'from nas' }));
    const device = vi.fn(async () => ({ ok: true, text: 'from device' }));
    const r = await ocrRoute(new Blob(['x']), { nas, device });
    expect(r).toMatchObject({ ok: true, via: 'nas', text: 'from nas' });
    expect(device).not.toHaveBeenCalled();
  });
  it('falls back to the device when the NAS does not answer', async () => {
    const nas = vi.fn(async () => ({ ok: false, reason: 'nas-404' }));
    const device = vi.fn(async () => ({ ok: true, text: 'from device' }));
    const r = await ocrRoute(new Blob(['x']), { nas, device });
    expect(r.via).toBe('device');
    expect(r.tried.map((t) => t.via)).toEqual(['nas', 'device']);
  });
  it('a photo is routed to OCR; the only network target is same-origin /books/ocr', async () => {
    const calls = [];
    const fetcher = async (url) => { calls.push(url); return { ok: true, json: async () => ({ text: RECEIPT_TEXT }) }; };
    const { nasOcr } = await import('../lib/books-intake-read.js');
    const read = await readAnyFile(new File(['jpg'], 'receipt.jpg', { type: 'image/jpeg' }), { ocr: (b, o) => ocrRoute(b, { ...o, nas: (bb, oo) => nasOcr(bb, { ...oo, fetcher }), device: async () => ({ ok: false }) }) });
    expect(read.method).toBe('ocr:nas');
    expect(calls).toHaveLength(1);
    expect(new URL(calls[0], 'http://localhost/').pathname).toBe('/books/ocr');
  });
});

describe('matching reuses what the books know', () => {
  it('reuses the account by last-4 and never proposes a duplicate', () => {
    const x = extractDocument({ text: CARD_TEXT }, { name: 'stmt.pdf' });
    const r = resolveAccount(x, ACCOUNTS);
    expect(r).toMatchObject({ accountId: 'a-cc', certain: true });
    const m = matchDocument(x, { accounts: ACCOUNTS, entities: ENTITIES }, { text: CARD_TEXT });
    expect(m.proposedAccount).toBeNull();
    expect(m.entity.entityId).toBe('e-fam'); // from the matched account's owner
  });
  it('a card never seen is PROPOSED behind a question, not created', async () => {
    const store = memoryStore();
    const accounts = ACCOUNTS.filter((a) => a.id !== 'a-cc');
    const [doc] = await intakeFiles([fakeFile('s.txt', 'text/plain', CARD_TEXT)], { store, known: { accounts, entities: ENTITIES, transactions: [] }, reader: async (f) => ({ text: await f.text() }) });
    expect(doc.status).toBe('needs-answer');
    const q = doc.questions.find((qq) => qq.field === 'account');
    expect(q.suggestions.some((s) => s.value === 'create')).toBe(true);
    const addAccount = vi.fn();
    const res = await commitDoc(doc, { store, sinks: { addAccount, commitImportedRows: vi.fn() } });
    expect(res.commitResult.written).toBe(false);
    expect(addAccount).not.toHaveBeenCalled();
  });
  it('rows already in the ledger are not added twice (planBulkImport dedupe)', async () => {
    const store = memoryStore();
    const ctx = { store, known: { accounts: ACCOUNTS, entities: ENTITIES, transactions: [] }, reader: async (f) => ({ text: await f.text() }) };
    const [doc] = await intakeFiles([fakeFile('s.txt', 'text/plain', CARD_TEXT)], ctx);
    expect(doc.status).toBe('ready');
    const committed = [];
    const out = await commitDoc(doc, { store, known: ctx.known, sinks: { commitImportedRows: async (rows) => { committed.push(...rows); return { saved: rows.length }; }, updateAccount: vi.fn() } });
    expect(out.status).toBe('added');
    expect(committed).toHaveLength(4);
    // Card sign: a +150 charge on the statement is -150 in the ledger.
    expect(committed.find((r) => r.description.startsWith('AMAZON')).amount).toBe(-150);
    // Upload the same statement again against the ledger that now holds it.
    const again = await intakeFiles([fakeFile('s.txt', 'text/plain', CARD_TEXT)], { ...ctx, known: { ...ctx.known, transactions: committed } });
    const second = [];
    await commitDoc(again[0], { store, known: { ...ctx.known, transactions: committed }, sinks: { commitImportedRows: async (rows) => { second.push(...rows); return {}; } } });
    expect(second).toHaveLength(0);
  });
});

describe('truth before speed', () => {
  it('a statement whose numbers do not add up is NEVER written as fact', async () => {
    const store = memoryStore();
    const broken = CARD_TEXT.replace('New Balance $762.34', 'New Balance $900.00');
    const [doc] = await intakeFiles([fakeFile('s.txt', 'text/plain', broken)], { store, known: { accounts: ACCOUNTS, entities: ENTITIES, transactions: [] }, reader: async (f) => ({ text: await f.text() }) });
    expect(doc.recon.status).toBe('mismatch');
    expect(doc.status).toBe('needs-answer');
    expect(canWrite(doc)).toBe(false);
    // Even after a person answers "hold", nothing is written.
    const held = await answer(doc, `${doc.id}:reconcile`, 'hold', { store, known: { accounts: ACCOUNTS, entities: ENTITIES, transactions: [] }, reader: async (f) => ({ text: await f.text() }) });
    const commitImportedRows = vi.fn();
    const res = await commitDoc(held, { store, sinks: { commitImportedRows } });
    expect(res.commitResult.written).toBe(false);
    expect(commitImportedRows).not.toHaveBeenCalled();
  });

  it('the write plan itself refuses a mismatch, even with every question answered', () => {
    const doc = { extraction: extractDocument({ text: CARD_TEXT }, {}), recon: { status: 'mismatch' }, questions: [{ blocking: true, status: 'answered' }], matched: { account: { accountId: 'a-cc' } } };
    expect(planWrite(doc).kind).toBe('none');
  });

  it('a skipped question leaves the document stored and pending while the rest proceed', async () => {
    const store = memoryStore();
    const ctx = { store, known: { accounts: ACCOUNTS, entities: ENTITIES, transactions: [] }, reader: async (f) => ({ text: await f.text() }) };
    const docs = await intakeFiles([
      fakeFile('mystery.txt', 'text/plain', 'hello there, nothing financial here'),
      fakeFile('s.txt', 'text/plain', CARD_TEXT),
    ], ctx);
    const [mystery, card] = docs;
    const qid = mystery.questions[0].id;
    const skipped = await answer(mystery, qid, null, ctx);
    expect(skipped.questions[0].status).toBe('skipped');
    expect(skipped.status).toBe('needs-answer');
    expect((await store.getDoc(mystery.id)).name).toBe('mystery.txt'); // still stored
    expect(card.status).toBe('ready'); // the other document moved on
    expect(queueSummary(await store.listDocs())).toMatchObject({ skipped: 1, documents: 1 });
  });
});

describe('the system learns a layout', () => {
  it('the second upload of the same layout asks nothing', async () => {
    const store = memoryStore();
    const accounts = [{ id: 'a-x', name: 'Store Card', fragment: '' }];
    const ctx = { store, known: { accounts, entities: [ENTITIES[0]], transactions: [] }, reader: async (f) => ({ text: await f.text() }) };
    const noDigits = CARD_TEXT.replace('Account ending in 4321\n', '').replace('Chase Freedom', 'Store Card Services');
    const [first] = await intakeFiles([fakeFile('a.txt', 'text/plain', noDigits)], ctx);
    const q = first.questions.find((qq) => qq.field === 'account');
    expect(q).toBeTruthy();
    await answer(first, q.id, 'account:a-x', ctx);
    const [second] = await intakeFiles([fakeFile('b.txt', 'text/plain', noDigits)], ctx);
    expect(second.questions.filter((qq) => qq.status !== 'answered')).toHaveLength(0);
    expect(second.remembered).toMatchObject({ account: 'account:a-x' });
    expect(second.status).toBe('ready');
  });
  it('an unknown kind lands on the teach-the-system queue with a count', async () => {
    const store = memoryStore();
    const ctx = { store, known: {}, reader: async (f) => ({ text: await f.text() }) };
    const [d] = await intakeFiles([fakeFile('m.txt', 'text/plain', 'a letter from grandma')], ctx);
    await answer(d, `${d.id}:doc_type`, 'unknown', ctx);
    const teach = await store.listTeach();
    expect(teach).toHaveLength(1);
    expect(teach[0].count).toBe(1);
  });
});

describe('the timeline', () => {
  it('names a missing month between two statements of the same account', () => {
    const mk = (id, end, due) => ({ id, accountId: 'a-cc', extraction: { doc_type: 'card-statement', account_hint: {}, dates: { period_end: end, due, paid: null } } });
    const t = buildTimeline([mk('1', '2026-06-11', '2026-07-08'), mk('2', '2026-08-11', '2026-09-08')], '2026-09-30');
    expect(t.gaps).toEqual([{ accountKey: 'a-cc', missing: ['2026-07'] }]);
    expect(t.entries.map((e) => e.dueStatus)).toEqual(['overdue', 'overdue']);
  });
});

describe('tax papers go to the NAS and only the NAS', () => {
  it('the tax route calls uploadTax and no other sink', async () => {
    const store = memoryStore();
    const ctx = { store, known: { accounts: ACCOUNTS, entities: [ENTITIES[0]], transactions: [] }, reader: async (f) => ({ text: await f.text() }) };
    const [doc] = await intakeFiles([fakeFile('w2-2025.pdf', 'application/pdf', W2_TEXT)], ctx);
    expect(doc.plan).toMatchObject({ kind: 'tax', year: 2025, entityId: 'e-fam' });
    const sinks = { uploadTax: vi.fn(async () => ({ ok: true })), commitImportedRows: vi.fn(), addAccount: vi.fn(), addReceipt: vi.fn() };
    const out = await commitDoc(doc, { store, sinks });
    expect(sinks.uploadTax).toHaveBeenCalledTimes(1);
    expect(sinks.uploadTax.mock.calls[0][0]).toMatchObject({ year: 2025, entityId: 'e-fam', kind: 'w2' });
    expect(sinks.commitImportedRows).not.toHaveBeenCalled();
    expect(sinks.addReceipt).not.toHaveBeenCalled();
    expect(out.links).toEqual([{ kind: 'tax', year: 2025, entityId: 'e-fam', where: 'nas' }]);
  });
  it('lib/tax-upload posts to the same-origin NAS route', async () => {
    const { uploadTaxDoc, __setUploadFetcher } = await import('../lib/tax-upload.js');
    const urls = [];
    __setUploadFetcher(async (url) => { urls.push(url); return { ok: true, json: async () => ({}) }; });
    const fd = { append: () => {} };
    await uploadTaxDoc({ file: { name: 'w2.pdf', size: 10, type: 'application/pdf' }, entityId: 'e-fam', year: 2025, kind: 'w2' }, { formData: fd });
    __setUploadFetcher(null);
    expect(new URL(urls[0], 'http://localhost/').pathname).toBe('/taxes/upload');
  });
});

describe('demo mode writes nothing', () => {
  it('no sink is called and no cloud copy is made', async () => {
    const store = memoryStore();
    const cloudKeep = vi.fn();
    const ctx = { store, demo: true, cloudKeep, known: { accounts: ACCOUNTS, entities: ENTITIES, transactions: [] }, reader: async (f) => ({ text: await f.text() }) };
    const d = await receive(fakeFile('s.txt', 'text/plain', CARD_TEXT), ctx);
    const doc = await processDoc(d, ctx);
    expect(doc.status).toBe('ready');
    const sinks = { commitImportedRows: vi.fn(), addAccount: vi.fn(), uploadTax: vi.fn(), addReceipt: vi.fn(), updateAccount: vi.fn() };
    const out = await commitDoc(doc, { store, sinks, demo: true });
    expect(out.commitResult).toMatchObject({ written: false });
    for (const fn of Object.values(sinks)) expect(fn).not.toHaveBeenCalled();
    expect(cloudKeep).not.toHaveBeenCalled();
    expect(canWrite(doc, { demo: true })).toBe(false);
  });
});

describe('never reject, never lose', () => {
  it('stores the original first even when reading throws', async () => {
    const store = memoryStore();
    const [doc] = await intakeFiles([fakeFile('weird.bin', 'application/octet-stream', 'x')], { store, known: {}, reader: async () => { throw new Error('boom'); } });
    expect(doc.status).toBe('needs-answer');
    const kept = await store.getDoc(doc.id);
    expect(kept.receivedAt).toBeTruthy();
    expect(kept.blob.name).toBe('weird.bin');
    expect(kept.questions[0].field).toBe('unreadable');
  });
  it('the original is already stored before any reader touches it', async () => {
    const store = memoryStore();
    let storedWhenRead = null;
    await intakeFiles([fakeFile('a.pdf', 'application/pdf', 'x')], { store, known: {}, reader: async () => { storedWhenRead = (await store.listDocs()).length; return { text: '' }; } });
    expect(storedWhenRead).toBe(1);
  });
  it('a CSV download is read through the proven statement reader', async () => {
    const read = await readAnyFile(fakeFile('chase7206.csv', 'text/csv', CSV_TEXT));
    expect(read.rows).toHaveLength(2);
    const x = extractDocument(read, { name: 'chase7206.csv' });
    expect(x.doc_type).toBe('transactions-export');
    expect(resolveAccount(x, ACCOUNTS).accountId).toBe('a-chk'); // by file name, the proven router
  });
});
