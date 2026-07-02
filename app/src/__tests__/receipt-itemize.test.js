// receipt-itemize — proven-to-catch tests (DR-0076 verification doctrine).
// A green verdict here MUST mean the receipt items reconcile to the bank debit,
// so each gate is tampered to confirm it FAILS. Real Walmart / Walgreens receipt
// shapes drive the category-derivation + split assertions.
import { describe, it, expect } from 'vitest';
import {
  hasReceiptItems, receiptOrders, allReceiptItems, itemsSubtotalCents,
  categorizeItem, categorySplit, derivedCategory, receiptVerification,
} from '../lib/receipt-itemize.js';

// A real-shaped Walmart order-confirmation: groceries + household on one debit.
// items[].price is the extended line total. tax makes items+tax == paid == debit.
const WALMART = {
  matched: true,
  matched_to: ['bank', 'email'],
  merchant: 'Walmart',
  method: 'visa-debit',
  card_last4: '3344',
  total: 84.73,
  orders: [{
    order: '2000123456789',
    tax: 3.11,
    paid: 84.73,
    items: [
      { name: 'Great Value Whole Milk 1 gal', qty: 1, price: 3.98 },
      { name: 'Bananas each', qty: 6, price: 1.62 },
      { name: 'Boneless Chicken Breast', qty: 1, price: 9.44 },
      { name: 'Large White Eggs 18ct', qty: 1, price: 4.87 },
      { name: 'Tide PODS Laundry Detergent 42ct', qty: 1, price: 12.97 },
      { name: 'Bounty Paper Towels 6 rolls', qty: 1, price: 14.94 },
      { name: 'Charmin Toilet Paper 12 rolls', qty: 1, price: 13.97 },
      { name: 'Honey Nut Cereal', qty: 2, price: 5.96 },
      { name: 'Tylenol Extra Strength 100ct', qty: 1, price: 12.87 },
    ],
  }],
};
// Derive paid/total from the items so the fixture is internally consistent
// (items 80.62 + tax 3.11 = 83.73). No hand-typed total to drift out of sync.
const wmItemsSum = WALMART.orders[0].items.reduce((s, i) => s + i.price, 0); // 80.62
WALMART.orders[0].paid = Math.round((wmItemsSum + WALMART.orders[0].tax) * 100) / 100; // 83.73
WALMART.total = WALMART.orders[0].paid;
const WALMART_DEBIT = -WALMART.total;

const WALGREENS = {
  matched: true,
  matched_to: ['bank', 'email'],
  merchant: 'Walgreens',
  method: 'visa-debit',
  card_last4: '3344',
  orders: [{
    order: 'WAG-88231',
    tax: 0.62,
    items: [
      { name: 'Amoxicillin 500mg Rx', qty: 1, price: 10.00, category: 'medical' },
      { name: 'Advil Ibuprofen 200mg 100ct', qty: 1, price: 9.49 },
      { name: 'Band-Aid Flexible Fabric', qty: 1, price: 4.29 },
      { name: 'Dawn Dish Soap', qty: 1, price: 3.99 },
    ],
  }],
};
const wagItemsSum = WALGREENS.orders[0].items.reduce((s, i) => s + i.price, 0); // 27.77
WALGREENS.orders[0].paid = Math.round((wagItemsSum + WALGREENS.orders[0].tax) * 100) / 100; // 28.39
WALGREENS.total = WALGREENS.orders[0].paid;
const WALGREENS_DEBIT = -WALGREENS.total;

describe('receipt presence', () => {
  it('detects receipt items and ignores medical invoice-rollup orders', () => {
    expect(hasReceiptItems(WALMART)).toBe(true);
    expect(receiptOrders(WALMART)).toHaveLength(1);
    // an order with lines[] but no items[] (the medical path) is NOT a receipt order
    expect(hasReceiptItems({ matched: true, orders: [{ paid: 10, lines: ['Visit'] }] })).toBe(false);
    expect(allReceiptItems(WALMART)).toHaveLength(9);
  });
  it('itemsSubtotalCents sums extended line prices in integer cents', () => {
    expect(itemsSubtotalCents(WALMART.orders[0].items)).toBe(8062);
  });
});

describe('item categorization', () => {
  it('categorizes grocery, household, and medical item names', () => {
    expect(categorizeItem({ name: 'Great Value Whole Milk 1 gal' }).category).toBe('groceries');
    expect(categorizeItem({ name: 'Tide PODS Laundry Detergent 42ct' }).category).toBe('household');
    expect(categorizeItem({ name: 'Charmin Toilet Paper 12 rolls' }).category).toBe('household');
    expect(categorizeItem({ name: 'Tylenol Extra Strength 100ct' }).category).toBe('medical');
    expect(categorizeItem({ name: 'Amoxicillin 500mg Rx' }).category).toBe('medical');
  });
  it('an explicit parser category always wins', () => {
    expect(categorizeItem({ name: 'anything', category: 'fuel' })).toEqual({ category: 'fuel', source: 'parser' });
  });
  it('returns null for an unrecognizable item (no false confidence)', () => {
    expect(categorizeItem({ name: 'ZXQ widget 9000' }).category).toBeNull();
  });
  it('categorizes PLURAL grocery/household item names (receipt lines are plural)', () => {
    // Regression: a rigid \bword\b dropped "Bananas"/"Eggs"/"Paper Towels".
    expect(categorizeItem({ name: 'Bananas each' }).category).toBe('groceries');
    expect(categorizeItem({ name: 'Large White Eggs 18ct' }).category).toBe('groceries');
    expect(categorizeItem({ name: 'Bounty Paper Towels 6 rolls' }).category).toBe('household');
    // and it does NOT over-match lookalikes (dining stays dining)
    expect(categorizeItem({ name: 'Chipotle bowl' }).category).not.toBe('groceries');
  });
  it('categorizes kids clothing + school supplies as household', () => {
    expect(categorizeItem({ name: 'Kids Winter Jacket' }).category).toBe('household');
    expect(categorizeItem({ name: 'School Backpack' }).category).toBe('household');
    expect(categorizeItem({ name: 'Notebooks 5-pack' }).category).toBe('household');
    expect(categorizeItem({ name: 'Colored Pencils 24ct' }).category).toBe('household');
    expect(categorizeItem({ name: 'Insulated Lunch Box' }).category).toBe('household');
  });
});

describe('categorySplit — one charge across categories', () => {
  it('splits the Walmart charge into groceries + household + medical', () => {
    const s = categorySplit(WALMART);
    expect(s.isSplit).toBe(true);
    const cats = s.parts.map((p) => p.category);
    expect(cats).toContain('groceries');
    expect(cats).toContain('household');
    expect(cats).toContain('medical');
    // dominant is household here (Tide+Bounty+Charmin = 41.88 > groceries)
    expect(s.dominant).toBe('household');
    // the split sums back to the item subtotal (nothing dropped)
    const splitSum = s.parts.reduce((a, p) => a + p.amount, 0);
    expect(Math.round(splitSum * 100)).toBe(8062);
  });
  it('derivedCategory picks the dominant real category', () => {
    expect(derivedCategory(WALMART)).toBe('household');
    expect(derivedCategory(WALGREENS)).toBe('medical'); // Amoxicillin+Advil+Band-Aid > Dawn
  });
});

describe('receiptVerification — the item-level gate (proven-to-catch)', () => {
  it('VERIFIES when items+tax roll up to paid and paid rolls up to the bank debit', () => {
    const v = receiptVerification(WALMART, WALMART_DEBIT);
    expect(v.verified).toBe(true);
    expect(v.reason).toBeNull();
    const w = receiptVerification(WALGREENS, WALGREENS_DEBIT);
    expect(w.verified).toBe(true);
  });

  it('FAILS when a single item price is tampered (items no longer sum to paid)', () => {
    const tampered = JSON.parse(JSON.stringify(WALMART));
    tampered.orders[0].items[0].price += 5.00; // milk suddenly $5 more
    const v = receiptVerification(tampered, WALMART_DEBIT);
    expect(v.verified).toBe(false);
    expect(v.reason).toMatch(/!= paid/);
  });

  it('FAILS when the receipt total does not match the bank debit', () => {
    const v = receiptVerification(WALMART, -100.00); // bank says $100, receipt says 83.73
    expect(v.verified).toBe(false);
    expect(v.reason).toMatch(/bank debit/);
  });

  it('FAILS with no receipt items at all', () => {
    const v = receiptVerification({ matched: true, orders: [{ paid: 10, lines: ['x'] }] }, -10);
    expect(v.verified).toBe(false);
    expect(v.reason).toBe('no receipt items');
  });

  it('absorbs a 1-2 cent vendor rounding difference (tolerance)', () => {
    const rounded = JSON.parse(JSON.stringify(WALMART));
    rounded.orders[0].paid += 0.01; // 1c rounding
    const debit = -(rounded.orders[0].paid);
    expect(receiptVerification(rounded, debit).verified).toBe(true);
  });
});
