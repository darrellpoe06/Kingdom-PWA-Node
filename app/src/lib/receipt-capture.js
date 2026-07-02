// =============================================================================
// receipt-capture — orchestrate one captured photo through the shared pipeline
// =============================================================================
// The glue the ReceiptCapture UI calls per image, factored out so the whole
// async flow is unit-testable without a canvas or a real File: OCR the (already
// EXIF-stripped) image, structure the text, normalize, and hand to the SAME
// fileReceipt() decision the email path uses. Returns a decision the caller
// acts on — updateTransaction for a match, the review queue for the rest.
//
// The OCR engine is injected (`ocr`) so tests pass known text and production
// passes the on-device Tesseract engine (lib/recipe-photo-import.js ocrImage —
// sovereign, image never leaves the device). An OCR failure is a REVIEW outcome
// with an honest reason, never a silent drop.
// =============================================================================

import { structureReceiptText } from './receipt-ocr.js';
import { normalizeReceipt, fileReceipt } from './receipt-match.js';
import { derivedCategory } from './receipt-itemize.js';

// processReceipt(prepared, opts) — `prepared` is the output of
// prepareReceiptImage (receipt-image.js): { dataUrl, exif:{capturedAt,hasGps},
// name }. opts: { ocr(dataUrl)->text, transactions, minConfidence, onProgress }.
// Returns the fileReceipt decision, enriched with the proof image + (for a
// match) the item-derived category.
export async function processReceipt(prepared, opts = {}) {
  const { ocr, transactions = [], minConfidence, onProgress } = opts;
  const image = {
    dataUrl: prepared.dataUrl || null,
    name: prepared.name || 'receipt.jpg',
    capturedAt: prepared.exif && prepared.exif.capturedAt ? prepared.exif.capturedAt : null,
    hasGps: !!(prepared.exif && prepared.exif.hasGps),
  };
  let text;
  try {
    if (typeof ocr !== 'function') throw new Error('no OCR engine');
    text = await ocr(prepared.dataUrl, onProgress);
  } catch (e) {
    const receipt = normalizeReceipt({}, { source: 'photo', image });
    return { status: 'review', reason: 'could not read the image (OCR unavailable) — file it manually', receipt, image, ocrError: true };
  }
  const structured = structureReceiptText(text, { exifDate: image.capturedAt ? image.capturedAt.date : null });
  const receipt = normalizeReceipt(structured, { source: 'photo', image });
  const decision = fileReceipt(receipt, transactions, { minConfidence });
  decision.image = image;
  decision.rawText = text;
  if (decision.status === 'matched') {
    decision.category = derivedCategory(decision.reconciliation) || null;
  }
  return decision;
}
