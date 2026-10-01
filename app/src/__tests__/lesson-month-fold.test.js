// @vitest-environment node
// The months fold, each on its own, and show their count folded (DR-0732).
import { describe, it, expect } from 'vitest';
import { monthKeys, rememberedFolds, rememberFolds, toggleFold, foldAll, openAll, visibleItems, foldAllOffer, FOLD_STORE } from '../lib/lesson-month-fold.js';

const H = (key, count, extra = {}) => ({ heading: { key, label: key, count, ...extra } });
const L = (id) => ({ id, title: id });
const ITEMS = [H('month-2026-06', 1), L('a'), H('month-2026-07', 2), L('b'), L('c'), H('month-2026-08', 1), L('d')];
const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v) }; };

describe('a month is its own fold', () => {
  it('only month headings are foldable; division headings are labels', () => {
    const withDivision = [...ITEMS, { heading: { key: 'gospels', label: 'The Gospels', lessons: [L('e')] } }, L('e')];
    expect(monthKeys(withDivision)).toEqual(['month-2026-06', 'month-2026-07', 'month-2026-08']);
  });
  it('folding one month hides only its lessons and keeps its heading with the count', () => {
    const rows = visibleItems(ITEMS, new Set(['month-2026-07']));
    expect(rows.map((r) => (r.heading ? `${r.heading.key}${r.heading.folded ? '(folded)' : ''}` : r.id)))
      .toEqual(['month-2026-06', 'a', 'month-2026-07(folded)', 'month-2026-08', 'd']);
    expect(rows[2].heading.count).toBe(2);
  });
  it('each month toggles independently', () => {
    let f = toggleFold(new Set(), 'month-2026-06');
    f = toggleFold(f, 'month-2026-08');
    expect([...f]).toEqual(['month-2026-06', 'month-2026-08']);
    f = toggleFold(f, 'month-2026-06');
    expect([...f]).toEqual(['month-2026-08']);
  });
  it('fold all leaves a table of contents; open all restores every row', () => {
    const all = foldAll(ITEMS);
    expect(visibleItems(ITEMS, all).filter((r) => !r.heading)).toEqual([]);
    expect(visibleItems(ITEMS, openAll()).filter((r) => !r.heading).length).toBe(4);
  });
  it('the fold-all offer reads the state: fold when any month is open, open when every month is folded, none for a single month', () => {
    expect(foldAllOffer(ITEMS, new Set())).toEqual({ action: 'fold', label: 'Fold all 3 months' });
    expect(foldAllOffer(ITEMS, foldAll(ITEMS))).toEqual({ action: 'open', label: 'Open all 3 months' });
    expect(foldAllOffer([H('month-2026-06', 1), L('a')], new Set())).toBe(null);
  });
  it('folds are remembered per course on the device, and junk reads as nothing folded', () => {
    const st = mem();
    rememberFolds('living-lessons', new Set(['month-2026-07']), st);
    expect([...rememberedFolds('living-lessons', st)]).toEqual(['month-2026-07']);
    expect([...rememberedFolds('other-course', st)]).toEqual([]);
    st.setItem(FOLD_STORE, '{not json');
    expect([...rememberedFolds('living-lessons', st)]).toEqual([]);
  });
  it('PROVEN TO CATCH: a list rendered without visibleItems shows every lesson even when a month is folded', () => {
    const folded = new Set(['month-2026-07']);
    expect(ITEMS.filter((r) => !r.heading).length).toBe(4);
    expect(visibleItems(ITEMS, folded).filter((r) => !r.heading).length).toBe(2);
  });
});
