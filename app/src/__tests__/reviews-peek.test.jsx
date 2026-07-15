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

describe('recentReviews — newest first, capped', () => {
  it('reverses (append-only file is oldest-first) and caps to the limit', () => {
    expect(recentReviews(sample, 2).map((r) => r.id)).toEqual(['REV-0003', 'REV-0002']);
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
