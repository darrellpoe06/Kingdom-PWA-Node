// ReviewsPeek — proves the review records surface newest-first, expand on tap,
// and stay honest-empty (Darrell 2026-07-15: "it's difficult to see your
// reviews ... add [them] inside the app"). Uses react-dom/client + act, the
// repo's render-test convention (no @testing-library dependency).
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import ReviewsPeek, { recentReviews } from '../components/ReviewsPeek.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const sample = {
  ok: true,
  count: 3,
  items: [
    { id: 'REV-0001', title: 'First (oldest)', date: '2026-07-01', surface: 'a', type: 'ui-ux', status: 'logged', findings: 'oldest findings' },
    { id: 'REV-0002', title: 'Second', date: '2026-07-10', surface: 'b', type: 'orchestration', status: 'logged', findings: 'middle findings' },
    { id: 'REV-0003', title: 'Third (newest)', date: '2026-07-15', surface: 'c', type: 'ui-ux', status: 'logged', findings: 'newest findings here' },
  ],
};

let container, root;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const mount = (props) => act(() => root.render(createElement(ReviewsPeek, props)));
const clickText = (text) => {
  const el = [...container.querySelectorAll('button')].find((b) => b.textContent.includes(text));
  if (!el) throw new Error(`no button containing "${text}"`);
  act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));
};

describe('recentReviews — newest first by Date, capped', () => {
  it('sorts by date descending and caps to the limit', () => {
    expect(recentReviews(sample, 2).map((r) => r.id)).toEqual(['REV-0003', 'REV-0002']);
  });
  it('does NOT trust file position: a prepended newest-first run atop an older body still sorts by date (the 2026-08-05 stale-strip catch, REV-0239)', () => {
    // The real registry's shape: a newest-first block first, older records after.
    const mixed = {
      ok: true,
      count: 4,
      items: [
        { id: 'REV-0230', title: 'Newest (prepended)', date: '2026-08-01' },
        { id: 'REV-0219', title: 'Newer (prepended)', date: '2026-07-31' },
        { id: 'REV-0001', title: 'Oldest (body)', date: '2026-06-16' },
        { id: 'REV-0217', title: 'Body tail', date: '2026-07-30' },
      ],
    };
    // Position-order ("tail is newest") would have returned REV-0217/REV-0001
    // first; date-order surfaces the true newest.
    expect(recentReviews(mixed, 3).map((r) => r.id)).toEqual(['REV-0230', 'REV-0219', 'REV-0217']);
  });
  it('breaks a same-date tie on the higher REV id and sorts unparseable dates last', () => {
    const tied = {
      ok: true,
      count: 3,
      items: [
        { id: 'REV-0010', title: 'A', date: '2026-07-01' },
        { id: 'REV-0012', title: 'B', date: '2026-07-01' },
        { id: 'REV-0011', title: 'no date', date: '' },
      ],
    };
    expect(recentReviews(tied, 3).map((r) => r.id)).toEqual(['REV-0012', 'REV-0010', 'REV-0011']);
  });
  it('is safe on empty / missing data', () => {
    expect(recentReviews(null)).toEqual([]);
    expect(recentReviews({ items: null })).toEqual([]);
  });
});

describe('ReviewsPeek — render', () => {
  it('shows the count and, when opened, the newest record first', () => {
    mount({ reviews: sample, defaultOpen: true });
    expect(container.textContent).toContain('Recent reviews (3)');
    expect(container.textContent).toContain('Third (newest)');
    expect(container.textContent).toContain('Ways review'); // orchestration humanized
  });

  it('expands a record to reveal its findings on tap', () => {
    mount({ reviews: sample, defaultOpen: true });
    expect(container.textContent).not.toContain('newest findings here');
    clickText('Third (newest)');
    expect(container.textContent).toContain('newest findings here');
  });

  it('is honest-empty: no records -> a plain note, never painted rows', () => {
    mount({ reviews: { ok: false, count: 0, items: [] }, defaultOpen: true });
    expect(container.textContent).toContain('No review records yet');
  });

  it('collapsed by default: the peek does not clutter the strip until opened', () => {
    mount({ reviews: sample });
    expect(container.textContent).not.toContain('Third (newest)');
    clickText('Recent reviews');
    expect(container.textContent).toContain('Third (newest)');
  });
});
