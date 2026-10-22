// @vitest-environment node
// =============================================================================
// The rent goes to the books, of its asset, once (DR-1211)
// =============================================================================
// Darrell, 2026-10-22: "Money added to this tab needs to also go to books for
// each asset... also should be synced with the assets tab." MEASURED before
// this: Properties posted rent with the category 'Rental Income' (a label; the
// books keep slugs and coerce anything else to 'other'), with no business and
// no asset on the row, and only when someone pressed "Post to books"; Real
// Estate's rent ledger never posted at all; and the books sync never sent the
// linked_to columns the ledger has had since schema v1.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { rentRecordToBookEntry, rentPaymentToBookEntry, alreadyInBooks, canPostToBooks, assetBooksYear } from '../modules/properties/model.js';
import { transactionToRow, rowToTransaction } from '../lib/transactions-sync.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const DOOR = '6b0a2f4e-1c3d-4e5f-8a9b-0c1d2e3f4a5b';
const IDS = { tenantId: 't', userId: 'u' };

describe('a rent record becomes a books entry that names its asset', () => {
  const rec = { id: 'p1', rental_id: DOOR, amount: 900, for_period: '2026-10', status: 'confirmed', paid_on: '2026-10-03', confirmed_at: '2026-10-04T09:00:00Z' };
  it('in the books’ own category, on the door’s business, linked to the door', () => {
    const e = rentRecordToBookEntry(rec, { propertyLabel: 'Sample Door', entitySlug: 'e-props' });
    expect(e.category).toBe('rental-income');
    expect(e.entityOverride).toBe('e-props');
    expect(e.linkedToKind).toBe('rental');
    expect(e.linkedToId).toBe(DOOR);
    expect(e.date, 'the day the money came, not the day it was confirmed').toBe('2026-10-03');
    expect(e.id).toBe('rent-p1');
  });
  it('PROVEN TO CATCH: the label is not a books category (the books turned it into "other")', () => {
    const src = readFileSync(join(HERE, '..', 'components', 'BooksTransactions.jsx'), 'utf8');
    const kept = src.match(/const TX_CATEGORIES = \[([^\]]+)\]/)[1];
    expect(kept).toContain("'rental-income'");
    expect(kept).not.toContain("'Rental Income'");
    expect(rentRecordToBookEntry(rec).category).not.toBe('Rental Income');
  });
  it('a record that is not confirmed, or is already posted, is never posted', () => {
    expect(canPostToBooks({ ...rec, status: 'reported' }).ok).toBe(false);
    expect(canPostToBooks({ ...rec, posted_tx_id: 'rent-p1' }).ok).toBe(false);
  });
});

describe('the books row carries the asset across devices', () => {
  it('sends and reads the link, and only ever a uuid', () => {
    const row = transactionToRow({ id: 'rent-p1', date: '2026-10-03', amount: 900, category: 'rental-income', linkedToKind: 'rental', linkedToId: DOOR.toUpperCase() }, IDS);
    expect(row.linked_to_kind).toBe('rental');
    expect(row.linked_to_id).toBe(DOOR);
    const back = rowToTransaction({ ...row, id: 'x', slug: 'rent-p1', txn_date: '2026-10-03' });
    expect(back.linkedToId).toBe(DOOR);
  });
  it('PROVEN TO CATCH: a link that is not a uuid is no link (the column is a uuid)', () => {
    const row = transactionToRow({ id: 't', date: '2026-10-03', amount: 1, linkedToKind: 'rental', linkedToId: 'r-1003koehn' }, IDS);
    expect(row.linked_to_id).toBeNull();
    expect(row.linked_to_kind).toBeNull();
  });
  it('an entry with no asset writes nulls, as every row did before', () => {
    const row = transactionToRow({ id: 't', date: '2026-10-03', amount: -20, category: 'fuel' }, IDS);
    expect(row.linked_to_kind).toBeNull();
    expect(row.linked_to_id).toBeNull();
  });
});

describe('the same money is never in the books twice', () => {
  const books = [{ id: 'rent-p1', date: '2026-10-03', amount: 900, linkedToId: DOOR }];
  it('Real Estate’s ledger posts a payment as rental income on its asset', () => {
    const e = rentPaymentToBookEntry({ leaseId: 'L1', month: '2026-10', amount: '450', at: '2026-10-05T12:00:00Z', rentalId: DOOR, entitySlug: 'e-props', label: 'Sample Door' });
    expect(e).toMatchObject({ category: 'rental-income', amount: 450, linkedToKind: 'rental', linkedToId: DOOR, entityOverride: 'e-props', date: '2026-10-05' });
    expect(e.id).toBe('rentpay-L1-2026-10-20261005120000');
  });
  it('PROVEN TO CATCH: the same asset, amount and month entered on the other tab is already in the books', () => {
    expect(alreadyInBooks(books, { rentalId: DOOR, amount: 900, date: '2026-10-20' })).toBe(true);
    expect(alreadyInBooks(books, { rentalId: DOOR, amount: 900, date: '2026-11-01' }), 'another month').toBe(false);
    expect(alreadyInBooks(books, { rentalId: DOOR, amount: 450, date: '2026-10-05' }), 'another amount').toBe(false);
    expect(alreadyInBooks(books, { rentalId: 'other-door', amount: 900, date: '2026-10-05' }), 'another asset').toBe(false);
  });
});

describe('the wiring, read from the source', () => {
  const read = (...p) => readFileSync(join(HERE, '..', ...p), 'utf8');
  it('Properties posts confirmed rent by itself, once, where the books live', () => {
    const src = read('modules', 'properties', 'PropertiesApp.jsx');
    expect(src).toMatch(/loadUnpostedRent\(\)/);
    expect(src).toMatch(/realRole !== 'owner' \|\| preview \|\| !books/);
    expect(src).toMatch(/alreadyInBooks\(books\.transactions/);
  });
  it('Real Estate’s rent ledger is handed the books and posts through them', () => {
    expect(read('components', 'RentLedger.jsx')).toMatch(/books\.postEntry\(entry\)/);
    expect(read('poe-financial-mvp-v28.jsx')).toMatch(/books=\{fullEdit \? \{ postEntry: \(entry\) => addTransaction\(entry\), transactions: data\.transactions \|\| \[\] \} : null\}/);
  });
});

describe('the asset shows the money the books hold for it', () => {
  it('sums this asset’s entries in this year only', () => {
    const tx = [
      { date: '2026-10-03', amount: 900, linkedToId: DOOR },
      { date: '2026-09-03', amount: 900, linkedToId: DOOR },
      { date: '2025-12-03', amount: 900, linkedToId: DOOR },
      { date: '2026-10-03', amount: 700, linkedToId: 'another-door' },
      { date: '2026-10-03', amount: -45, category: 'fuel' },
    ];
    expect(assetBooksYear(tx, DOOR, '2026')).toEqual({ total: 1800, count: 2 });
    expect(assetBooksYear(tx, null, '2026'), 'no asset, no total').toEqual({ total: 0, count: 0 });
  });
  it('the Real Estate card prints it', () => {
    expect(readFileSync(join(HERE, '..', 'components', 'Rentals.jsx'), 'utf8')).toMatch(/assetBooksYear\(books\.transactions, r\.remoteUuid, year\)/);
  });
});
