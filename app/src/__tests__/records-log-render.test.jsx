// @vitest-environment jsdom
//
// RecordsLog render — mount the shared filing-office primitive and prove the
// consumer behavior end-to-end (DR-0076 §7): it opens on the newest month with
// the newest record first (no death scroll), the period control jumps to a month,
// and the two-tier self-explaining panel shows what/where/how with a "Learn more"
// route to Help. Layout-agnostic: it renders whatever renderRow returns.
import { describe, it, expect } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import RecordsLog from '../components/RecordsLog.jsx';

const ITEMS = [
  { id: 'a', d: '2023-11-26', name: 'Old sermon' },
  { id: 'b', d: '2026-06-07', name: 'Earlier June' },
  { id: 'c', d: '2026-06-28', name: 'Newest June' },
];

const base = {
  items: ITEMS,
  getDate: (r) => r.d,
  getText: (r) => r.name,
  renderRow: (r) => createElement('div', { className: 'row' }, r.name),
  countNoun: 'message',
  about: { what: 'A test library.', where: 'A test table.', how: 'Filed by month.', helpTopic: 'church:pulpit' },
};

async function mount(props) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { createRoot(container).render(createElement(RecordsLog, props)); });
  const click = async (el) => { await act(async () => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); }); };
  const byText = (t) => [...container.querySelectorAll('button')].find((b) => b.textContent.trim() === t);
  const byMatch = (re) => [...container.querySelectorAll('button')].find((b) => re.test(b.textContent));
  return { container, click, byText, byMatch };
}

describe('RecordsLog — shared filing-office primitive (real mount)', () => {
  it('opens on the newest month, newest record first (not a death scroll)', async () => {
    const { container } = await mount(base);
    const html = container.innerHTML;
    expect(html).toContain('June 2026');          // sticky month header
    expect(html).toContain('Newest June');
    expect(html).not.toContain('November 2023');   // default = latest month only
    expect(html.indexOf('Newest June')).toBeLessThan(html.indexOf('Earlier June'));
  });

  it('“All” reveals every month, newest month first', async () => {
    const { container, byText, click } = await mount(base);
    await click(byText('All'));
    const html = container.innerHTML;
    expect(html).toContain('June 2026');
    expect(html).toContain('November 2023');
    expect(html.indexOf('June 2026')).toBeLessThan(html.indexOf('November 2023'));
  });

  it('the two-tier self-explaining panel expands to what/where/how + Learn more', async () => {
    const { container, click, byMatch } = await mount(base);
    await click(byMatch(/About this/i));
    const html = container.innerHTML;
    expect(html).toContain('A test library.');   // what
    expect(html).toContain('A test table.');     // where (source)
    expect(html).toContain('Filed by month.');   // how
    expect(html).toContain('Learn more');        // routes to Help (deep tier)
  });
});
