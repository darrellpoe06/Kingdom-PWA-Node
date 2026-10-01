// =============================================================================
// books-intake-extract — classify ANY financial document and extract it into
// ONE common shape (DR-0709, the one Books upload)
// =============================================================================
// Darrell 2026-09-30: "It should be able to take anything and make it work with
// our known data." Every file, whatever it is, comes out of this module in the
// SAME shape, so matching, reconciling, the question queue and the write step
// never branch on where a document came from:
//
//   { doc_type, confidence,
//     dates: { document, period_start, period_end, due, paid },
//     amounts: [{ label, value }], parties: [{ role, name }],
//     account_hint: { last4, institution }, entity_hint, property_hint,
//     line_items: [{ date, description, amount, balance? }],
//     tax_year, source_file, summary, layout_key, uncertain: [] }
//
// Per-type extractors are PLUG-INS (registerExtractor). The classifier scores
// the words on the page; the Books tab the person opened the upload from is a
// small HINT added to the score, never a route. A card statement uploaded from
// the Taxes tab is still read as a card statement.
//
// Everything here is pure: text in, shape out. Reading the file (PDF text, OCR)
// is books-intake-read.js; nothing here touches the network or storage.
// =============================================================================
import { parseStatementSummary } from './debt-history.js';
import { accountFragment } from './bank-formats.js';
import { parseAmount } from './statement-import.js';

export const DOC_TYPES = Object.freeze([
  'transactions-export', 'card-statement', 'bank-statement', 'loan-statement',
  'bill', 'invoice', 'receipt', 'pay-stub', 'tax-form', 'unknown',
]);

export const DOC_TYPE_LABEL = Object.freeze({
  'transactions-export': 'Transactions download',
  'card-statement': 'Credit card statement',
  'bank-statement': 'Bank statement',
  'loan-statement': 'Loan or mortgage statement',
  bill: 'Bill (utility, phone, insurance)',
  invoice: 'Invoice',
  receipt: 'Receipt',
  'pay-stub': 'Pay stub',
  'tax-form': 'Tax form (W-2, 1099, 1098, return)',
  unknown: 'Something else',
});

// The tab a person opened the upload from, as a prior. Small on purpose: it can
// break a near-tie, never overturn what the page itself says.
export const TAB_HINTS = Object.freeze({
  debts: ['card-statement', 'loan-statement'],
  accounts: ['bank-statement', 'transactions-export'],
  transactions: ['transactions-export', 'bank-statement', 'card-statement'],
  imported: ['transactions-export'],
  taxes: ['tax-form'],
  k1099: ['tax-form', 'invoice'],
  cart: ['receipt', 'bill'],
  calendar: ['bill'],
  owed: ['bill', 'invoice'],
  plan: ['bill', 'pay-stub'],
  entities: [],
  legal: [],
});
export const HINT_WEIGHT = 1.5;
export const CONFIDENT = 0.6;

const SIGNALS = {
  'card-statement': [/minimum payment/i, /payment due date/i, /credit (limit|line)/i, /new balance/i, /annual percentage rate|\bapr\b/i, /purchases/i, /cash advance/i],
  'bank-statement': [/checking|savings/i, /beginning balance|opening balance/i, /ending balance/i, /deposits(?: and| &)? (other )?(credits|additions)/i, /withdrawals/i, /statement period/i],
  'loan-statement': [/principal/i, /escrow/i, /mortgage|loan number|auto loan/i, /interest rate/i, /amount due/i, /payoff/i],
  bill: [/account number/i, /amount due|total due|please pay/i, /due date|due by/i, /service (period|address)|billing period/i, /kwh|usage|utility|electric|water|gas service|internet|wireless|premium/i],
  invoice: [/\binvoice\b/i, /invoice (no|number|#)/i, /bill to/i, /terms|net \d+/i, /subtotal/i, /qty|quantity/i],
  receipt: [/\breceipt\b/i, /subtotal/i, /\btotal\b/i, /\b(visa|mastercard|debit|cash|change)\b/i, /thank you/i, /\btax\b/i],
  'pay-stub': [/gross pay/i, /net pay/i, /pay period/i, /\bytd\b|year to date/i, /federal (income )?tax|fica|social security|medicare/i, /earnings/i, /deductions/i],
  'tax-form': [/\bform (w-?2|1099|1098|1040|k-?1)\b/i, /\bw-?2\b|\b1099-[a-z]+\b|\b1098\b/i, /internal revenue service|\birs\b/i, /\bomb no\b/i, /wages, tips/i, /payer'?s|recipient'?s/i, /tax year/i],
};

const TAX_KIND_RE = [
  ['w2', /\bw-?2\b/i], ['1099-received', /\b1099\b/i], ['k1', /\bk-?1\b/i],
  ['return', /\b1040\b|\bu\.?s\.? individual income tax return/i], ['schedule', /\bschedule [a-z]\b/i],
];

const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const msToIso = (ms) => (ms == null || !Number.isFinite(ms) ? null : iso(new Date(ms)));

/** A date written any common way on paper -> 'YYYY-MM-DD', or null. */
export function toIsoDate(raw, fallbackYear = null) {
  const s = String(raw || '').trim();
  if (!s) return null;
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return `${m[1]}-${pad(m[2])}-${pad(m[3])}`;
  m = s.match(/^(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?$/);
  if (m) {
    let y = m[3];
    if (!y) { if (!fallbackYear) return null; y = String(fallbackYear); }
    if (y.length === 2) y = (Number(y) > 50 ? '19' : '20') + y;
    const mo = Number(m[1]); const da = Number(m[2]);
    if (mo < 1 || mo > 12 || da < 1 || da > 31) return null;
    return `${y}-${pad(mo)}-${pad(da)}`;
  }
  const ms = Date.parse(s);
  return Number.isFinite(ms) ? iso(new Date(ms)) : null;
}

/** An empty common shape. Every extractor fills a copy of this. */
export function emptyExtraction(source = {}) {
  return {
    doc_type: 'unknown',
    confidence: 0,
    dates: { document: null, period_start: null, period_end: null, due: null, paid: null },
    amounts: [],
    parties: [],
    account_hint: { last4: null, institution: null },
    entity_hint: null,
    property_hint: null,
    line_items: [],
    tax_year: null,
    source_file: { name: source.name || '', size: source.size || 0, type: source.type || '', received_at: source.receivedAt || null, doc_id: source.id || null },
    summary: {},
    layout_key: null,
    uncertain: [],
  };
}

/** Score the page against every type. The tab hint is a prior, not a route. */
export function classifyText(text = '', { hint = null, rows = null } = {}) {
  const s = String(text || '');
  const scores = {};
  for (const [type, signals] of Object.entries(SIGNALS)) {
    scores[type] = signals.reduce((n, re) => n + (re.test(s) ? 1 : 0), 0);
  }
  // A parsed table of dated rows is itself the strongest signal of a download.
  if (rows && rows.length) scores['transactions-export'] = 4 + Math.min(rows.length, 4);
  for (const t of (hint && TAB_HINTS[hint]) || []) scores[t] = (scores[t] || 0) + HINT_WEIGHT;
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [topType, top] = ranked[0] || ['unknown', 0];
  const second = ranked[1] ? ranked[1][1] : 0;
  // Confidence rises with how many signals fired AND how clearly the winner
  // leads. Three or more real signals with a clear lead reads as certain.
  const strength = Math.min(1, top / 4);
  const lead = top > 0 ? Math.min(1, (top - second) / 2) : 0;
  const confidence = Math.round((0.6 * strength + 0.4 * lead) * 100) / 100;
  const pageSignals = top - ((hint && (TAB_HINTS[hint] || []).includes(topType)) ? HINT_WEIGHT : 0);
  if (top < 2 || pageSignals < 1) return { doc_type: 'unknown', confidence: Math.min(confidence, 0.3), ranked: ranked.map(([t]) => t) };
  return { doc_type: topType, confidence, ranked: ranked.map(([t]) => t) };
}

const ISSUER_RE = [
  ['Chase', /\bchase\b|jpmorgan/i], ['Capital One', /capital\s*one/i], ['Discover', /\bdiscover\b/i],
  ['American Express', /american\s*express|\bamex\b/i], ['Citi', /\bciti\b|citibank/i], ['Wells Fargo', /wells\s*fargo/i],
  ['Bank of America', /bank\s*of\s*america/i], ['Synchrony', /synchrony/i], ['Navy Federal', /navy federal/i],
  ['USAA', /\busaa\b/i], ['PNC', /\bpnc\b/i], ['Truist', /truist/i], ['Regions', /\bregions\b/i],
];
export function institutionOf(text = '') {
  const hit = ISSUER_RE.find(([, re]) => re.test(String(text)));
  return hit ? hit[0] : null;
}

function moneyAfter(text, labels) {
  for (const label of labels) {
    const re = new RegExp(`${label}[^\\n\\r$\\d(-]{0,40}(\\(?-?\\$?\\s?[\\d,]+\\.\\d{2}\\)?-?)`, 'i');
    const m = String(text).match(re);
    if (m) return parseAmount(m[1]);
  }
  return null;
}

function periodOf(text) {
  const d = '(\\d{1,2}/\\d{1,2}/\\d{2,4}|[A-Z][a-z]{2,8}\\.?\\s+\\d{1,2},?\\s+\\d{4})';
  const re = new RegExp(`(?:statement period|billing period|opening/closing date|pay period|service period|period)[^\\n\\r\\d]{0,20}${d}\\s*(?:-|–|to|through|thru)\\s*${d}`, 'i');
  const m = String(text).match(re);
  if (!m) return { start: null, end: null };
  return { start: toIsoDate(m[1]), end: toIsoDate(m[2]) };
}

function taxYearOf(text) {
  const m = String(text).match(/(?:tax year|for (?:calendar )?year|form (?:w-?2|1099[-a-z]*|1098|1040)[^\n\r\d]{0,40})\s*(20\d{2}|19\d{2})/i)
    || String(text).match(/\b(20\d{2})\s+form\s+(?:w-?2|1099|1098|1040)/i);
  return m ? Number(m[1]) : null;
}

// Line items printed on a statement page: a date, words, and an amount at the
// end of the line. The year is taken from the period when the line omits it.
export function lineItemsFromText(text, { year = null, endMonth = null } = {}) {
  const out = [];
  const re = /^\s*(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\s+(?:\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\s+)?(.+?)\s+(\(?-?\$?[\d,]+\.\d{2}\)?-?)\s*$/;
  for (const line of String(text || '').split(/\r?\n/)) {
    const m = line.match(re);
    if (!m) continue;
    // A December line on a statement closing in January belongs to the year before.
    const mo = Number(m[1].split('/')[0]);
    const y = year && endMonth && mo > endMonth && !/\/\d{2,4}$/.test(m[1]) ? year - 1 : year;
    const date = toIsoDate(m[1], y);
    if (!date) continue;
    out.push({ date, description: m[2].replace(/\s{2,}/g, ' ').trim(), amount: parseAmount(m[3]) });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Extractor plug-ins. Each takes (ctx) and returns a PARTIAL shape; the caller
// merges it over emptyExtraction. Adding a document kind is one register call.
// ---------------------------------------------------------------------------
const EXTRACTORS = new Map();
export function registerExtractor(type, fn) { EXTRACTORS.set(type, fn); }
export function extractorFor(type) { return EXTRACTORS.get(type) || EXTRACTORS.get('unknown'); }

function statementCommon({ text }) {
  const summary = parseStatementSummary(text);
  const period = periodOf(text);
  const end = period.end || msToIso(summary.closingDate);
  const year = end ? Number(end.slice(0, 4)) : null;
  return {
    summary: {
      previousBalance: summary.previousBalance ?? moneyAfter(text, ['beginning balance', 'opening balance']),
      newBalance: summary.statementBalance ?? moneyAfter(text, ['ending balance']),
      paymentsCredits: summary.paymentsCredits,
      purchases: moneyAfter(text, ['purchases(?:\\s*(?:and|&)\\s*adjustments)?', 'new charges']),
      fees: moneyAfter(text, ['fees charged', 'total fees']),
      interest: moneyAfter(text, ['interest charged', 'total interest']),
      deposits: moneyAfter(text, ['deposits(?: and| &)? (?:other )?(?:credits|additions)', 'total deposits']),
      withdrawals: moneyAfter(text, ['withdrawals(?: and| &)? (?:other )?(?:debits|subtractions)', 'total withdrawals']),
      minimumPayment: summary.minimumPayment,
      apr: summary.apr,
    },
    dates: { period_start: period.start, period_end: end, due: msToIso(summary.dueDate), document: end },
    account_hint: { last4: accountFragment(text), institution: institutionOf(text) },
    line_items: lineItemsFromText(text, { year, endMonth: end ? Number(end.slice(5, 7)) : null }),
  };
}

registerExtractor('transactions-export', ({ rows = [], text = '' }) => {
  const dates = rows.map((r) => r.date).filter(Boolean).sort();
  return {
    line_items: rows.map((r) => ({ date: r.date, description: r.description, amount: Number(r.amount) || 0, ...(r.balance != null ? { balance: r.balance } : {}), ...(r.fitid ? { fitid: r.fitid } : {}) })),
    dates: { period_start: dates[0] || null, period_end: dates[dates.length - 1] || null, document: dates[dates.length - 1] || null },
    account_hint: { last4: accountFragment(text), institution: institutionOf(text) },
  };
});
registerExtractor('card-statement', statementCommon);
registerExtractor('bank-statement', statementCommon);
registerExtractor('loan-statement', (ctx) => {
  const base = statementCommon(ctx);
  base.summary.principal = moneyAfter(ctx.text, ['principal balance', 'outstanding principal', 'principal']);
  base.summary.escrow = moneyAfter(ctx.text, ['escrow balance', 'escrow']);
  base.summary.amountDue = moneyAfter(ctx.text, ['total amount due', 'amount due', 'payment amount']);
  return base;
});
function billLike({ text }) {
  const due = toIsoDate((String(text).match(/(?:due date|due by|payment due)[^\n\r\d]{0,20}(\d{1,2}\/\d{1,2}\/\d{2,4}|[A-Z][a-z]{2,8}\.?\s+\d{1,2},?\s+\d{4})/i) || [])[1]);
  const docDate = toIsoDate((String(text).match(/(?:bill date|invoice date|statement date|date)[^\n\r\d]{0,12}(\d{1,2}\/\d{1,2}\/\d{2,4}|[A-Z][a-z]{2,8}\.?\s+\d{1,2},?\s+\d{4})/i) || [])[1]);
  const period = periodOf(text);
  const total = moneyAfter(text, ['total amount due', 'amount due', 'total due', 'balance due', 'please pay', '\\btotal\\b']);
  const address = (String(text).match(/(?:service address|property address)[:\s]+([^\n\r]{6,80})/i) || [])[1] || null;
  return {
    amounts: total != null ? [{ label: 'total', value: total }] : [],
    dates: { document: docDate, due, period_start: period.start, period_end: period.end },
    account_hint: { last4: accountFragment(text), institution: institutionOf(text) },
    property_hint: address ? address.trim() : null,
  };
}
registerExtractor('bill', billLike);
registerExtractor('invoice', (ctx) => {
  const base = billLike(ctx);
  const no = (String(ctx.text).match(/invoice\s*(?:no\.?|number|#)\s*[:#]?\s*([A-Z0-9-]{2,20})/i) || [])[1] || null;
  base.summary = { invoiceNumber: no };
  return base;
});
registerExtractor('receipt', ({ text }) => {
  const total = moneyAfter(text, ['grand total', '\\btotal\\b', '\\bamount\\b']);
  const date = toIsoDate((String(text).match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/) || [])[1]);
  const merchant = String(text).split(/\r?\n/).map((l) => l.trim()).find((l) => /[a-z]{3}/i.test(l)) || null;
  return {
    amounts: total != null ? [{ label: 'total', value: total }] : [],
    dates: { document: date, paid: date },
    parties: merchant ? [{ role: 'merchant', name: merchant.slice(0, 60) }] : [],
  };
});
registerExtractor('pay-stub', ({ text }) => {
  const period = periodOf(text);
  const gross = moneyAfter(text, ['gross pay', 'gross earnings', 'total gross']);
  const net = moneyAfter(text, ['net pay', 'net amount', 'take home']);
  const payDate = toIsoDate((String(text).match(/(?:pay date|check date)[^\n\r\d]{0,12}(\d{1,2}\/\d{1,2}\/\d{2,4})/i) || [])[1]);
  const employer = (String(text).match(/(?:employer|company)[:\s]+([^\n\r]{3,60})/i) || [])[1] || null;
  return {
    amounts: [gross != null && { label: 'gross', value: gross }, net != null && { label: 'net', value: net }].filter(Boolean),
    dates: { period_start: period.start, period_end: period.end, paid: payDate, document: payDate },
    parties: employer ? [{ role: 'employer', name: employer.trim() }] : [],
    summary: { gross, net },
  };
});
registerExtractor('tax-form', ({ text }) => {
  const kind = (TAX_KIND_RE.find(([, re]) => re.test(String(text))) || ['other'])[0];
  const wages = moneyAfter(text, ['wages, tips, other compensation', 'nonemployee compensation', 'total income']);
  return {
    tax_year: taxYearOf(text),
    summary: { taxKind: kind },
    amounts: wages != null ? [{ label: 'reported', value: wages }] : [],
  };
});
registerExtractor('unknown', () => ({}));

/** A stable key for "documents that look like this one" (the learned layout). */
export function layoutKeyOf({ doc_type, institution, headerSignature = '', text = '' }) {
  const anchors = headerSignature
    || String(text).split(/\r?\n/).map((l) => l.trim().toLowerCase().replace(/[\d$.,/#-]+/g, '').replace(/\s+/g, ' '))
      .filter((l) => l.length >= 4).slice(0, 3).join('|');
  return [doc_type || 'unknown', (institution || '').toLowerCase(), anchors].join('::');
}

/**
 * Classify + extract: the ONE entry point. `read` is the reader's result
 * ({ text, rows?, headerSignature? }), `source` the stored document.
 */
export function extractDocument(read = {}, source = {}, { hint = null, forceType = null } = {}) {
  const base = emptyExtraction(source);
  const text = String(read.text || '');
  const cls = forceType ? { doc_type: forceType, confidence: 1, ranked: [forceType] } : classifyText(text, { hint, rows: read.rows });
  const partial = extractorFor(cls.doc_type)({ text, rows: read.rows || [] }) || {};
  const out = {
    ...base, ...partial,
    doc_type: cls.doc_type,
    confidence: cls.confidence,
    ranked: cls.ranked,
    dates: { ...base.dates, ...(partial.dates || {}) },
    account_hint: { ...base.account_hint, ...(partial.account_hint || {}) },
    summary: { ...(partial.summary || {}) },
  };
  if (!out.tax_year && cls.doc_type === 'tax-form') out.tax_year = taxYearOf(text);
  out.layout_key = layoutKeyOf({ doc_type: out.doc_type, institution: out.account_hint.institution, headerSignature: read.headerSignature, text });
  if (cls.doc_type === 'unknown' || cls.confidence < CONFIDENT) out.uncertain.push('doc_type');
  return out;
}
