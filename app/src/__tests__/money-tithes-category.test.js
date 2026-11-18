// money-tithes-category.test.js — Phase 1.4: Tithes / Church Giving is its own
// category (Christina 2026-11-17, decision 1: the $837 church tithe is not the
// same line as other giving). Code only: the books store a category as text,
// so no database change is needed.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TX_CATEGORIES, categorize, categoryLabel } from '../lib/categorize.js';
import { tierOfCategory } from '../lib/spending-priorities.js';
import { reviewLineItems } from '../lib/intake-row-review.js';

const HERE = dirname(fileURLToPath(import.meta.url));

describe('Tithes / Church Giving', () => {
  it('is a category, labeled for people', () => {
    expect(TX_CATEGORIES).toContain('tithes');
    expect(TX_CATEGORIES).toContain('charitable');
    expect(categoryLabel('tithes')).toBe('Tithes / Church Giving');
  });
  it('church giving reads as tithes; other giving stays charitable', () => {
    expect(categorize('THE LOVE CORNER CHURCH').category).toBe('tithes');
    expect(categorize('ONLINE TITHE PAYMENT').category).toBe('tithes');
    expect(categorize('SUNDAY OFFERING').category).toBe('tithes');
    expect(categorize('SALVATION ARMY DONATION').category).toBe('charitable');
    expect(categorize('GOFUNDME').category).toBe('charitable');
  });
  it('is covenant giving, never discretionary', () => {
    expect(tierOfCategory('tithes')).toBe('covenant');
  });
  it('an import suggests it, marked as a suggestion', () => {
    const [row] = reviewLineItems([{ date: '2026-11-16', description: 'ONLINE TITHE PAYMENT', amount: -837 }]);
    expect(row).toMatchObject({ category: 'tithes', categorySource: 'suggested' });
  });
  it('a row filed as tithes keeps it everywhere a category is checked against a list (PROVEN TO CATCH: a list without it turns it into "other")', () => {
    const books = readFileSync(join(HERE, '..', 'components', 'BooksTransactions.jsx'), 'utf8');
    expect(books.match(/const TX_CATEGORIES = \[([^\]]+)\]/)[1]).toContain("'tithes'");
    expect(books).toMatch(/\['salary','rental-income'[^\]]*'tithes'[^\]]*\]\.includes\(r\.category\)/);
    const sync = readFileSync(join(HERE, '..', 'lib', 'verified-ledger-sync.js'), 'utf8');
    expect(sync.match(/const ALLOWED_CATEGORY = new Set\(\[([^\]]+)\]/)[1]).toContain("'tithes'");
  });
});
