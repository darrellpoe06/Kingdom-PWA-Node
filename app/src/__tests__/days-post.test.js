// days-post — the day's post, and the child who sorts it (DR-0360, 0204).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  MEANINGS, MEANING_IDS, PRODUCTS, meaning, isSorted, validateSort,
  theDaysPost, byDestination, THE_CHORE,
} from '../lib/days-post.js';

const here = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(resolve(here, p), 'utf8');
const M204 = read('../../../infra/supabase/migrations-auto/0204-the-days-post-and-the-child-who-sorts-it.sql');
const S204 = read('../../../infra/supabase/tests/0204-the-days-post-smoke.sql');
const LEG = read('../../../.github/workflows/rls-isolation.yml');

const doc = (over = {}) => ({ id: 'd1', label: 'Ameren envelope', arrivedOn: '2026-09-11', means: null, product: null, place: '', releasedForSorting: false, ...over });

describe('what a piece of post means', () => {
  it('carries Darrell’s own three meanings, each with a child’s sentence', () => {
    expect(MEANING_IDS).toEqual(['bill-to-pay', 'proof-of-payment', 'for-the-record']);
    for (const m of MEANINGS) {
      expect(m.business.length, m.id).toBeGreaterThan(4);
      expect(m.plain.length, m.id).toBeGreaterThan(4);
      expect(m.childExplains.length, m.id).toBeGreaterThan(20);
    }
    expect(meaning('bill-to-pay').plain).toBe('Pay this bill');
    expect(meaning('nope')).toBeNull();
  });

  it('offers exactly the three products the database allows', () => {
    expect(PRODUCTS.map((p) => p.id)).toEqual(['poetech', 'properties', 'tlc']);
  });
});

describe('a sort says what it is AND where it goes', () => {
  it('is not complete with only one half', () => {
    expect(isSorted(doc({ means: 'bill-to-pay' }))).toBe(false);
    expect(isSorted(doc({ product: 'poetech' }))).toBe(false);
    expect(isSorted(doc({ means: 'bill-to-pay', product: 'poetech' }))).toBe(true);
  });

  it('refuses a destination with no meaning — half a fact is not a fact', () => {
    expect(validateSort({ product: 'poetech' }).join(' ')).toContain('still has to say what it is');
  });

  it('refuses a meaning or a product the database would refuse', () => {
    expect(validateSort({ means: 'shred-it' }).join(' ')).toContain('bill to pay');
    expect(validateSort({ means: 'bill-to-pay', product: 'bank' }).join(' ')).toContain('not one of our products');
  });

  it('accepts clearing BOTH — a sort is reversible', () => {
    expect(validateSort({})).toEqual([]);
  });
});

describe('the pile supports being left alone', () => {
  const rows = [
    doc({ id: 'a', arrivedOn: '2026-09-11' }),
    doc({ id: 'b', arrivedOn: '2026-09-10', means: 'bill-to-pay', product: 'poetech', place: '1 Test St' }),
    doc({ id: 'c', arrivedOn: '2026-09-11', means: 'for-the-record', product: 'tlc' }),
    doc({ id: 'd', arrivedOn: '2026-09-09' }),
  ];

  it('splits what still needs a decision from what is filed, newest first', () => {
    const p = theDaysPost(rows, { today: '2026-09-11' });
    expect(p.unsorted.map((d) => d.id)).toEqual(['a', 'd']);
    expect(p.sorted.map((d) => d.id)).toEqual(['c', 'b']);
    expect(p.counts).toMatchObject({ total: 4, unsorted: 2, sorted: 2, today: 2, inTray: 0 });
  });

  it('counts what is in the tray separately from what is sorted', () => {
    const p = theDaysPost([doc({ id: 'x', releasedForSorting: true })], { today: '2026-09-11' });
    expect(p.counts.inTray).toBe(1);
    expect(p.counts.unsorted).toBe(1);
  });

  it('groups filed post by product and then by place, the way the household thinks', () => {
    const g = byDestination(rows);
    expect(g.poetech['1 Test St'].map((d) => d.id)).toEqual(['b']);
    expect(g.tlc['—'].map((d) => d.id)).toEqual(['c']);
    expect(g.properties).toBeUndefined();
  });
});

describe('what a child is told they are doing', () => {
  it('describes a smaller job truthfully, and says what stays the grown-ups’', () => {
    expect(THE_CHORE.title).toBe('Sorting the post');
    expect(THE_CHORE.why).toContain('first step');
    expect(THE_CHORE.notYours).toContain('amounts');
    expect(THE_CHORE.notYours).toContain('books');
  });
});

describe('migration 0204 keeps the promises in the database', () => {
  it('a release is whole or absent — never a decision with nobody accountable', () => {
    expect(M204).toMatch(/CHECK \(\(sorting_released_at IS NULL\) = \(sorting_released_by IS NULL\)\)/);
  });

  it('adds exactly ONE narrow door to the shelf, keeping 0201’s two', () => {
    expect(M204).toMatch(/created_by = auth\.uid\(\)[\s\S]{0,240}shared_with_household[\s\S]{0,240}sorting_released_at IS NOT NULL/);
  });

  it('only a guardian releases, and the refusal says why', () => {
    expect(M204).toMatch(/only a guardian decides what a child sees/);
    expect(M204).toMatch(/coalesce\(v_role, ''\) NOT IN \('owner','admin'\)/);
  });

  it('widens sorting by exactly one case: released, and in this household', () => {
    expect(M204).toMatch(/v_doc\.sorting_released_at IS NOT NULL AND coalesce\(v_role, ''\) <> ''/);
  });

  it('guards every role branch null-safely', () => {
    const branches = M204.match(/IF\s+(NOT\s+)?(coalesce\()?v_role[\s\S]{0,60}?(NOT )?IN \(/g) || [];
    for (const b of branches) expect(b, b).toContain('coalesce(v_role');
  });

  it('the smoke proves the bright line: sorting never opens the books', () => {
    for (const must of [
      'a child saw % document(s) before any release',
      'sorting the post opened the ledger',
      'a child released a document into the tray',
      'a plain member decided what a child sees',
      'the child still saw % document(s) after it was withdrawn',
      'a release with no releaser was accepted',
    ]) {
      expect(S204, must).toContain(must);
    }
  });

  it('rides the product-forms isolation leg with its smoke', () => {
    expect(LEG).toMatch(/migrations: "[^"\n]*0204-the-days-post-and-the-child-who-sorts-it\.sql/);
    expect(LEG).toMatch(/smokes: "[^"\n]*0204-the-days-post-smoke\.sql/);
  });
});
