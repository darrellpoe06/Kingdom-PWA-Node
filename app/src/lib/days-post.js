// =============================================================================
// days-post — the day's post: what arrived, what it means, where it belongs
// (DR-0360, migration 0204)
// =============================================================================
// Darrell 2026-09-11: "people can review their documents that came in that day
// and sort them to their respective products and locations for users to see a
// now or later whenever they want" — and, on the children: "Yes. We want our
// children to learn the process and a system helps them to learn how we work."
//
// UNSORTED IS A REAL STATE, not a failure. "Now or later" only works if the
// pile itself supports being left alone, so nothing here nags and nothing
// auto-files. A document sits unsorted until a person decides.
//
// The child's lane: a guardian releases ONE document into the tray. Releasing
// is the guardian's judgement (DR-0094), recorded with their name. A child
// sorts what the household calls it — never the ledger, never an amount, and
// not the file's bytes (storage policy is untouched by the release).
// =============================================================================

/** What a document MEANS. Darrell's own three, in his own order. */
export const MEANINGS = Object.freeze([
  {
    id: 'bill-to-pay',
    business: 'Payable — awaiting payment',
    plain: 'Pay this bill',
    childExplains: 'Someone is asking us for money we agreed to pay.',
  },
  {
    id: 'proof-of-payment',
    business: 'Remittance advice / paid receipt',
    plain: 'You paid this bill — here is the proof',
    childExplains: 'This is the receipt that shows the bill was already paid.',
  },
  {
    id: 'for-the-record',
    business: 'Supporting documentation',
    plain: 'Keep it — it supports something else',
    childExplains: 'Nobody has to do anything. We just keep it in case we need it.',
  },
]);

export const MEANING_IDS = Object.freeze(MEANINGS.map((m) => m.id));
export const meaning = (id) => MEANINGS.find((m) => m.id === id) || null;

/** Which product it belongs to. The same three the database allows. */
export const PRODUCTS = Object.freeze([
  { id: 'poetech', label: 'PoeTech (the household)' },
  { id: 'properties', label: 'Poe Properties (a door)' },
  { id: 'tlc', label: 'TLC (the practice)' },
]);

export const PRODUCT_IDS = Object.freeze(PRODUCTS.map((p) => p.id));

/** A sort is complete when it says what it means AND where it belongs. */
export function isSorted(doc) {
  return !!(doc && doc.means && doc.product);
}

/**
 * Refuse a sort locally before it reaches the database — the database refuses
 * the same things, so this is the sentence a person gets instead of an error.
 */
export function validateSort({ means = null, product = null, place = null } = {}) {
  const errors = [];
  if (means != null && !MEANING_IDS.includes(means)) {
    errors.push('Say what the document is: a bill to pay, proof of payment, or for the record.');
  }
  if (product != null && !PRODUCT_IDS.includes(product)) {
    errors.push('That is not one of our products.');
  }
  if (place != null && String(place).length > 200) {
    errors.push('The place is a short label, not a paragraph.');
  }
  // Clearing BOTH is how a sort is undone; clearing only one is half a fact.
  if (means == null && product != null) errors.push('A document that belongs somewhere still has to say what it is.');
  return errors;
}

/**
 * The day's post, split the way a person actually works it: what still needs a
 * decision, and what has already been filed. Newest arrival first — the post
 * that came today is the post you are standing over.
 */
export function theDaysPost(documents = [], { today = null } = {}) {
  const rows = (documents || []).filter(Boolean);
  const arrived = (d) => d.arrivedOn || (d.createdAt || '').slice(0, 10) || '';
  const byNewest = (a, b) => String(arrived(b)).localeCompare(String(arrived(a)));

  const unsorted = rows.filter((d) => !isSorted(d)).sort(byNewest);
  const sorted = rows.filter(isSorted).sort(byNewest);
  const todaysArrivals = today ? rows.filter((d) => arrived(d) === today) : [];

  return {
    unsorted,
    sorted,
    todaysArrivals,
    // Counts a surface can state without pretending to know more than it does.
    counts: {
      total: rows.length,
      unsorted: unsorted.length,
      sorted: sorted.length,
      today: todaysArrivals.length,
      inTray: rows.filter((d) => d.releasedForSorting).length,
    },
  };
}

/** Group filed post the way the household thinks about it: by product, then place. */
export function byDestination(documents = []) {
  const out = {};
  for (const d of (documents || []).filter(isSorted)) {
    const p = d.product || 'unsorted';
    out[p] = out[p] || {};
    const place = d.place || '—';
    (out[p][place] = out[p][place] || []).push(d);
  }
  return out;
}

/**
 * What a child is told they are doing. Not a simplified version of the books —
 * a true description of a smaller job, which is the honest way to teach it.
 */
export const THE_CHORE = Object.freeze({
  title: 'Sorting the post',
  what: 'Post arrives. Someone has to say what each piece is and where it belongs.',
  how: 'Open the tray, read the label, choose what it is, and choose where it goes.',
  why: 'This is the first step of how money is handled here. Nothing gets paid, filed or found without it.',
  notYours: 'You will not see amounts or the books. That part is the grown-ups’ job, and it stays theirs.',
});
