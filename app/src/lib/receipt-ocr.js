// =============================================================================
// receipt-ocr — structure RAW OCR TEXT into a normalized receipt (+ confidence)
// =============================================================================
// The photo/OCR path's structurer. A receipt photo is OCR'd on-device by the
// existing Tesseract engine (lib/recipe-photo-import.js `ocrImage` — sovereign,
// the image never leaves the device), which hands us messy text. This turns that
// text into the SAME normalized receipt shape the email path produces, so both
// flow into ONE downstream (lib/receipt-match.js -> the reconciliation block ->
// the ReceiptItemization dropdown). One build, not a silo.
//
// The line/total parsing mirrors infra/nas-finance-ingest/receipts.py 1:1
// (_parse_lines_generic / _totals) so a receipt structured on-device and one
// structured on the NAS agree. Deterministic; the LLM is only a fallback for
// text too messy to parse (justified, and it runs on the NAS, not here).
//
// CONFIDENCE is first-class: OCR is noisy, so every structured receipt carries a
// 0..1 score and the reasons behind it. A low score routes the receipt to the
// review queue instead of being trusted silently (QC — never silently wrong).
// =============================================================================

// Vendor detection — the merchant name is usually near the top of a receipt.
// Ordered; first hit wins. Extend as new vendors are seen.
const VENDORS = [
  [/wal-?mart/i, 'Walmart'],
  [/walgreens/i, 'Walgreens'],
  [/\btarget\b/i, 'Target'],
  [/\bcvs\b/i, 'CVS'],
  [/costco/i, 'Costco'],
  [/sam'?s club/i, "Sam's Club"],
  [/\bkroger\b/i, 'Kroger'],
  [/\bmeijer\b/i, 'Meijer'],
  [/\baldi\b/i, 'Aldi'],
  [/trader joe/i, "Trader Joe's"],
  [/whole foods/i, 'Whole Foods'],
  [/home depot/i, 'Home Depot'],
  [/lowe'?s/i, "Lowe's"],
  [/\bmenards\b/i, 'Menards'],
  [/\bamazon\b/i, 'Amazon'],
  [/\bshell\b/i, 'Shell'],
  [/\bcircle k\b/i, 'Circle K'],
];

function detectVendor(text) {
  for (const [re, name] of VENDORS) if (re.test(text)) return name;
  return null;
}

// A date anywhere in the text: MM/DD/YYYY or MM-DD-YY or YYYY-MM-DD. Returns
// YYYY-MM-DD or null. OCR mangles dates, so this is a best-effort; the EXIF
// capture date (passed by the caller) is the more reliable anchor.
function detectDate(text) {
  let m = text.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = text.match(/\b(\d{1,2})[/-](\d{1,2})[/-](20\d{2}|\d{2})\b/);
  if (m) {
    let [, mo, d, y] = m;
    if (y.length === 2) y = '20' + y;
    return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return null;
}

const money = (s) => {
  const m = String(s).match(/-?\$?\s*([0-9][0-9,]*\.[0-9]{2})/);
  return m ? parseFloat(m[1].replace(/,/g, '')) : null;
};

// Lines that are NOT items (summary/meta rows). Mirrors receipts.py _SKIP_LINE.
// Kept in lock-step with _SKIP_LINE in infra/nas-finance-ingest/receipts.py so
// the on-device and NAS structurers drop the SAME non-item rows.
const SKIP = /(subtotal|sub-total|tax|total|savings|discount|order (total|summary)|shipping|handling|tip|balance|payment|amount (charged|paid)|change|cash|debit|credit|visa|mastercard|amex|account|member|tend|thank you|track|view order|return|st#|op#|te#|tr#|ref\b|auth)/i;
// An item line: "<name> ... $<extended price>" (the price is the line total).
const LINE_PRICE = /^(.+?)\s+(?:qty\s*(\d+)\s+)?\$?(\d+\.\d{2})\s*[A-Z]?\s*$/i;
const QTY_INLINE = /(?:qty\s*(\d+)|(\d+)\s*@|x\s*(\d+)\b)/i;

// parseItems(text) — pull {name, qty, price} rows. Skips summary/meta lines and
// obvious noise (all-digits, too-short names). Mirrors receipts.py.
export function parseItems(text) {
  const items = [];
  for (const raw of String(text).split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || SKIP.test(line)) continue;
    const m = line.match(LINE_PRICE);
    if (!m) continue;
    const name = m[1].replace(/\s{2,}/g, ' ').replace(/^[\s.\-*]+|[\s.\-*]+$/g, '');
    if (name.length < 2 || /^[\d.$,]+$/.test(name)) continue;
    const price = parseFloat(m[3]);
    const item = { name: name.slice(0, 80), price: Math.round(price * 100) / 100 };
    let qty = m[2] ? parseInt(m[2], 10) : null;
    if (!qty) { const q = QTY_INLINE.exec(line); if (q) qty = parseInt(q[1] || q[2] || q[3], 10); }
    if (qty && qty !== 1) item.qty = qty;
    items.push(item);
  }
  return items;
}

// totalsOf(text) — extract (total, tax) from the summary lines. Last "total"
// wins (the grand/order total is usually last). Mirrors receipts.py _totals.
export function totalsOf(text) {
  let total = null;
  let tax = null;
  for (const raw of String(text).split(/\r?\n/)) {
    const line = raw.trim();
    const low = line.toLowerCase();
    if (tax == null && /\btax\b/.test(low) && !/pre-?tax/.test(low)) tax = money(line);
    if (/\b(order total|grand total|total|balance due|amount due)\b/.test(low) && !low.includes('subtotal')) {
      const t = money(line);
      if (t != null) total = t;
    }
  }
  return { total, tax };
}

const cents = (n) => Math.round((Number(n) || 0) * 100);

// structureReceiptText(text, opts) — OCR text -> normalized receipt + a
// confidence score with reasons. opts.exifDate (YYYY-MM-DD from the photo's
// capture time) is used as the date when the text has none. Returns:
//   { merchant, date, total, tax, items, confidence, confidenceReasons, source:'photo' }
export function structureReceiptText(text, opts = {}) {
  const t = String(text || '');
  const merchant = detectVendor(t);
  const items = parseItems(t);
  const { total, tax } = totalsOf(t);
  const date = detectDate(t) || opts.exifDate || null;

  // Confidence — additive signals, then penalize an items-vs-total mismatch.
  const reasons = [];
  let score = 0;
  if (merchant) { score += 0.25; reasons.push('vendor recognized'); } else reasons.push('vendor not recognized');
  if (total != null) { score += 0.25; reasons.push('total found'); } else reasons.push('no total found');
  if (items.length) { score += 0.2; reasons.push(`${items.length} line item(s)`); } else reasons.push('no line items parsed');
  if (date) { score += 0.1; reasons.push('date found'); } else reasons.push('no date');

  // The strongest signal: do the items (+tax) reconcile to the stated total?
  let reconciles = false;
  if (total != null && items.length) {
    const itemsC = items.reduce((s, i) => s + cents(i.price), 0);
    const computed = itemsC + cents(tax);
    const diff = Math.abs(computed - cents(total));
    if (diff <= 2) { score += 0.2; reconciles = true; reasons.push('items reconcile to total'); }
    else reasons.push(`items ${(itemsC / 100).toFixed(2)}+tax != total ${total.toFixed(2)}`);
  }
  const confidence = Math.min(1, Math.round(score * 100) / 100);
  return {
    merchant, date, total,
    tax: tax == null ? 0 : tax,
    items,
    confidence,
    confidenceReasons: reasons,
    reconciles,
    source: 'photo',
  };
}

// LOW_OCR_CONFIDENCE — at/below this a structured receipt routes to review
// rather than auto-filing. Tuned so "vendor+total+items+reconciles" (0.9) auto-
// files and a missing total or non-reconciling read (<=0.6) queues for a human.
export const LOW_OCR_CONFIDENCE = 0.7;
