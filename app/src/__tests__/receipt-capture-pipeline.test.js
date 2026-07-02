// receipt capture pipeline — EXIF read/strip, OCR structuring, and matching.
// Proven-to-catch (DR-0076): tamper the OCR text or the amount and confirm the
// receipt is ROUTED TO REVIEW rather than auto-filed wrong.
import { describe, it, expect } from 'vitest';
import { parseTiff, normalizeExifDate, findTiffStart, readExif } from '../lib/receipt-image.js';
import { structureReceiptText, parseItems, totalsOf, LOW_OCR_CONFIDENCE } from '../lib/receipt-ocr.js';
import {
  normalizeReceipt, matchReceiptToTransactions, fileReceipt,
} from '../lib/receipt-match.js';
import { processReceipt } from '../lib/receipt-capture.js';

// --- EXIF ---------------------------------------------------------------------
// Build a minimal little-endian TIFF: IFD0 -> {ExifIFD ptr, GPS ptr};
// ExifIFD -> DateTimeOriginal "2026:05:17 14:30:00".
function craftTiff({ withGps = true } = {}) {
  const buf = new ArrayBuffer(100);
  const dv = new DataView(buf);
  const u8 = (o, v) => dv.setUint8(o, v);
  // header
  u8(0, 0x49); u8(1, 0x49);            // 'II' little-endian
  dv.setUint16(2, 0x002a, true);       // 42
  dv.setUint32(4, 8, true);            // IFD0 at offset 8
  // IFD0 at 8
  dv.setUint16(8, withGps ? 2 : 1, true); // entry count
  // entry1: ExifIFD pointer (0x8769) LONG count1 -> 38
  dv.setUint16(10, 0x8769, true); dv.setUint16(12, 4, true); dv.setUint32(14, 1, true); dv.setUint32(18, 38, true);
  let next = 22;
  if (withGps) {
    // entry2: GPS pointer (0x8825) LONG count1 -> 76 (presence only)
    dv.setUint16(22, 0x8825, true); dv.setUint16(24, 4, true); dv.setUint32(26, 1, true); dv.setUint32(30, 76, true);
    next = 34;
  }
  dv.setUint32(next, 0, true);         // next IFD = 0
  // ExifIFD at 38
  dv.setUint16(38, 1, true);           // 1 entry
  // DateTimeOriginal (0x9003) ASCII count20 -> offset 56
  dv.setUint16(40, 0x9003, true); dv.setUint16(42, 2, true); dv.setUint32(44, 20, true); dv.setUint32(48, 56, true);
  dv.setUint32(52, 0, true);           // next IFD = 0
  // string at 56
  const s = '2026:05:17 14:30:00\0';
  for (let i = 0; i < s.length; i++) u8(56 + i, s.charCodeAt(i));
  return buf;
}

describe('EXIF read + strip', () => {
  it('parses DateTimeOriginal and detects GPS presence', () => {
    const r = parseTiff(craftTiff({ withGps: true }), 0);
    expect(r.capturedAt).toEqual({ raw: '2026:05:17 14:30:00', iso: '2026-05-17T14:30:00', date: '2026-05-17' });
    expect(r.hasGps).toBe(true);
    expect(r.gps).toBeNull(); // detected-and-dropped: coordinates never stored
  });
  it('reports no GPS when the GPS IFD is absent', () => {
    expect(parseTiff(craftTiff({ withGps: false }), 0).hasGps).toBe(false);
  });
  it('normalizeExifDate handles the EXIF colon format and rejects junk', () => {
    expect(normalizeExifDate('2026:05:17 14:30:00').date).toBe('2026-05-17');
    expect(normalizeExifDate('not a date')).toBeNull();
  });
  it('a non-JPEG / canvas-stripped buffer has no EXIF (clean, not an error)', () => {
    const png = new ArrayBuffer(8); new DataView(png).setUint32(0, 0x89504e47); // PNG sig-ish
    expect(findTiffStart(png)).toBe(-1);
    expect(readExif(png)).toEqual({ capturedAt: null, hasGps: false, gps: null });
  });
});

// --- OCR structuring ----------------------------------------------------------
const WALMART_OCR = [
  'Walmart',
  'Save money. Live better.',
  'ST# 05260 OP# 009043 TE# 44 TR# 08123',
  'GREAT VALUE MILK 3.98',
  'BANANAS 1.62 F',
  'TIDE PODS 42CT 12.97 X',
  'BOUNTY PAPER TOWELS 14.94',
  'TYLENOL 100CT 12.87',
  'SUBTOTAL 46.38',
  'TAX 1 2.32',
  'TOTAL 48.70',
  'VISA TEND 48.70',
  '05/17/2026',
].join('\n');

describe('OCR structuring', () => {
  it('pulls line items and skips summary/meta rows', () => {
    const items = parseItems(WALMART_OCR);
    const names = items.map((i) => i.name);
    expect(names).toContain('GREAT VALUE MILK');
    expect(names).toContain('TIDE PODS 42CT');
    // meta rows are NOT items
    expect(names.some((n) => /SUBTOTAL|TOTAL|VISA|ST#/.test(n))).toBe(false);
    expect(items.find((i) => i.name === 'TIDE PODS 42CT').price).toBe(12.97);
  });
  it('extracts total + tax (order/grand total, not subtotal)', () => {
    const { total, tax } = totalsOf(WALMART_OCR);
    expect(total).toBe(48.70);
    expect(tax).toBe(2.32);
  });
  it('structures a high-confidence receipt when items reconcile to total', () => {
    const r = structureReceiptText(WALMART_OCR);
    expect(r.merchant).toBe('Walmart');
    expect(r.total).toBe(48.70);
    expect(r.date).toBe('2026-05-17');
    expect(r.items.length).toBe(5); // MILK, BANANAS, TIDE, BOUNTY, TYLENOL = 46.38 + 2.32 tax = 48.70
    expect(r.reconciles).toBe(true);
    expect(r.confidence).toBeGreaterThanOrEqual(LOW_OCR_CONFIDENCE);
  });
  it('LOW confidence when the total is unreadable (missing) — routes to review', () => {
    const noTotal = WALMART_OCR.replace(/TOTAL 48\.70/, 'TOTAL ?8.7O'); // OCR garbled the total
    const r = structureReceiptText(noTotal);
    expect(r.total).toBeNull();
    expect(r.confidence).toBeLessThan(LOW_OCR_CONFIDENCE);
  });
  it('uses the EXIF capture date when the text has no readable date', () => {
    const noDate = WALMART_OCR.replace('05/17/2026', '');
    expect(structureReceiptText(noDate, { exifDate: '2026-05-17' }).date).toBe('2026-05-17');
  });
});

// --- matching / filing --------------------------------------------------------
const LEDGER = [
  { id: 'tx-a', date: '2026-05-17', amount: -48.70, description: 'WALMART SUPERCENTER', category: 'other' },
  { id: 'tx-b', date: '2026-05-18', amount: -28.39, description: 'WALGREENS #4821', category: 'other' },
  { id: 'tx-c', date: '2026-05-20', amount: -48.70, description: 'SHELL OIL', category: 'fuel', reconciliation: { matched: true } },
];

describe('receipt matching + filing (shared downstream)', () => {
  const receipt = normalizeReceipt(structureReceiptText(WALMART_OCR), { source: 'photo', image: { name: 'r.jpg', capturedAt: { iso: '2026-05-17T14:30:00', date: '2026-05-17' } } });

  it('matches to the Walmart bank row by amount + date + merchant (not Shell)', () => {
    const tx = matchReceiptToTransactions(receipt, LEDGER);
    expect(tx.id).toBe('tx-a'); // merchant hint breaks the $48.70 tie vs Shell
  });
  it('does NOT match a row that already has a reconciliation (dedupe)', () => {
    // remove the merchant hint so only amount/date select; tx-c is deduped out,
    // leaving tx-a as the only open $48.70 row.
    const noMerch = { ...receipt, merchant: null };
    expect(matchReceiptToTransactions(noMerch, LEDGER).id).toBe('tx-a');
  });
  it('fileReceipt AUTO-FILES a matched, reconciling, confident receipt with proof image', () => {
    const res = fileReceipt(receipt, LEDGER);
    expect(res.status).toBe('matched');
    expect(res.transactionId).toBe('tx-a');
    expect(res.reconciliation.matched_to).toEqual(['bank', 'photo']);
    expect(res.reconciliation.source_image.stripped_exif).toBe(true);
    expect(res.reconciliation.source_image.captured_at).toBe('2026-05-17T14:30:00');
    expect(res.reconciliation.verify_ok).toBe(true);
  });
  it('QUEUES for review when no bank row matches the amount (proven-to-catch)', () => {
    const orphan = normalizeReceipt({ ...structureReceiptText(WALMART_OCR), total: 999.99, tax: 953.61 }, { source: 'photo' });
    const res = fileReceipt(orphan, LEDGER);
    expect(res.status).toBe('review');
    expect(res.reason).toMatch(/no matching bank transaction/);
  });
  it('QUEUES a low-confidence OCR read instead of filing it wrong', () => {
    const low = normalizeReceipt(structureReceiptText(WALMART_OCR.replace(/TOTAL 48\.70/, 'TOTAL ?8.7O')), { source: 'photo' });
    const res = fileReceipt(low, LEDGER);
    expect(res.status).toBe('review');
  });
  it('QUEUES when items do not reconcile to the matched bank amount', () => {
    // total matches tx-a ($48.70) but items were tampered so they no longer sum
    const bad = normalizeReceipt(structureReceiptText(WALMART_OCR), { source: 'photo' });
    bad.items[0].price += 5.0;
    const res = fileReceipt(bad, LEDGER);
    expect(res.status).toBe('review');
    expect(res.reason).toMatch(/do not reconcile/);
  });
});

// --- full photo orchestration (processReceipt) --------------------------------
describe('processReceipt — OCR engine injected (no canvas/File)', () => {
  const prepared = { dataUrl: 'data:image/jpeg;base64,AAAA', name: 'r.jpg', exif: { capturedAt: { iso: '2026-05-17T14:30:00', date: '2026-05-17' }, hasGps: true } };

  it('photo -> matched, proof-attached, item-categorized', async () => {
    const d = await processReceipt(prepared, { ocr: async () => WALMART_OCR, transactions: LEDGER });
    expect(d.status).toBe('matched');
    expect(d.transactionId).toBe('tx-a');
    expect(d.category).toBe('household');        // dominant item category
    expect(d.reconciliation.matched_to).toEqual(['bank', 'photo']);
    expect(d.reconciliation.source_image.captured_at).toBe('2026-05-17T14:30:00');
    expect(d.reconciliation.source_image.stripped_exif).toBe(true);
    expect(d.reconciliation.source_image.has_gps).toBe(true); // recorded, but no coords stored
  });

  it('OCR failure -> review with an honest reason (never a silent drop)', async () => {
    const d = await processReceipt(prepared, { ocr: async () => { throw new Error('engine down'); }, transactions: LEDGER });
    expect(d.status).toBe('review');
    expect(d.ocrError).toBe(true);
    expect(d.reason).toMatch(/OCR unavailable/i);
  });

  it('unreadable receipt (no total) -> review, keeps the proof image', async () => {
    const d = await processReceipt(prepared, { ocr: async () => 'blurry nonsense no prices here', transactions: LEDGER });
    expect(d.status).toBe('review');
    expect(d.image.name).toBe('r.jpg');
  });
});
