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

  it('a group header collapses to hide its rows (the shared collapsible-group behavior)', async () => {
    const { container, click } = await mount(base);
    expect(container.innerHTML).toContain('Newest June'); // expanded by default
    // the GROUP header (has the count), not the month-stepper button (also "June 2026")
    const header = [...container.querySelectorAll('button')].find((b) => /June 2026/.test(b.textContent) && /message/.test(b.textContent));
    await click(header);
    const html = container.innerHTML;
    expect(html).toContain('June 2026');          // header + count still shown
    expect(html).not.toContain('Newest June');    // rows hidden while collapsed
  });
});

// THE WORD (Darrell 2026-11-19): "all months can collapse and open ... all
// videos the default with months showing and only the latest month open so
// the new users can tell." defaultPeriod="all" + openNewestOnly is that shape.
describe('RecordsLog — every month a folder, only the newest open (The Word)', () => {
  const ALL_ITEMS = [
    { id: 'a', d: '2023-11-26', name: 'Old sermon' },
    { id: 'b', d: '2026-06-07', name: 'Earlier June' },
    { id: 'c', d: '2026-06-28', name: 'Newest June' },
    { id: 'd', d: '2026-05-10', name: 'May message' },
  ];
  const word = { ...base, items: ALL_ITEMS, defaultPeriod: 'all', openNewestOnly: true };
  const header = (container, month) => [...container.querySelectorAll('button')]
    .find((b) => b.textContent.includes(month) && /message/.test(b.textContent));

  it('opens on All: every month header shows, only the newest month is open', async () => {
    const { container } = await mount(word);
    const html = container.innerHTML;
    expect(html).toContain('Showing 4 of 4 messages');
    for (const m of ['June 2026', 'May 2026', 'November 2023']) expect(header(container, m)).toBeTruthy();
    expect(html).toContain('Newest June');      // the newest month is open
    expect(html).toContain('Earlier June');
    expect(html).not.toContain('May message');  // older months start closed
    expect(html).not.toContain('Old sermon');
    expect(header(container, 'June 2026').getAttribute('aria-expanded')).toBe('true');
    expect(header(container, 'May 2026').getAttribute('aria-expanded')).toBe('false');
  });

  it('every month opens and closes on its own header', async () => {
    const { container, click } = await mount(word);
    await click(header(container, 'May 2026'));
    expect(container.innerHTML).toContain('May message');
    await click(header(container, 'June 2026'));
    expect(container.innerHTML).not.toContain('Newest June');
    await click(header(container, 'May 2026'));
    expect(container.innerHTML).not.toContain('May message');
    await click(header(container, 'June 2026'));
    expect(container.innerHTML).toContain('Newest June');
  });

  it('the newest month is the newest MESSAGE, whichever way the list is sorted', async () => {
    const { container } = await mount({ ...word, defaultSort: 'asc' });
    expect(container.innerHTML).toContain('Newest June');
    expect(container.innerHTML).not.toContain('Old sermon');
  });

  it('Open all months / Close all months', async () => {
    const { container, click, byMatch } = await mount(word);
    await click(byMatch(/^Open all months$/));
    for (const t of ['Newest June', 'May message', 'Old sermon']) expect(container.innerHTML).toContain(t);
    await click(byMatch(/^Close all months$/));
    for (const t of ['Newest June', 'May message', 'Old sermon']) expect(container.innerHTML).not.toContain(t);
  });

  it('a single month (stepped to) is open by itself', async () => {
    const { container, click, byText } = await mount(word);
    await click(byText('This Month'));
    await click([...container.querySelectorAll('button')].find((b) => b.getAttribute('aria-label') === 'Previous month'));
    // whatever month that lands on, a lone group is never hidden behind its header
    const groups = [...container.querySelectorAll('button[aria-expanded]')].filter((b) => /message/.test(b.textContent));
    if (groups.length === 1) expect(groups[0].getAttribute('aria-expanded')).toBe('true');
  });

  it('says the whole span at a glance, and a year chip opens that year', async () => {
    const { container, click, byMatch } = await mount({ ...word, yearIndex: true });
    const html = container.innerHTML;
    expect(container.textContent).toContain('Every message from November 2023 to June 2026');
    expect(container.textContent).toContain('4 in all');
    expect(byMatch(/^2026/)).toBeTruthy();
    expect(byMatch(/^2023/)).toBeTruthy();
    expect(html).not.toContain('Old sermon');
    await click(byMatch(/^2023/));
    expect(container.innerHTML).toContain('Old sermon');      // 2023's month is now open
    expect(header(container, 'November 2023').getAttribute('aria-expanded')).toBe('true');
  });

  it('no year strip unless asked (other surfaces unchanged)', async () => {
    const { container } = await mount(word);
    expect(container.textContent).not.toContain('Every message from');
  });

  it('the Word library uses this shape', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const src = fs.readFileSync(path.resolve(__dirname, '../components/Pulpit.jsx'), 'utf8');
    expect(src).toMatch(/countNoun="message"[\s\S]{0,300}defaultPeriod="all"[\s\S]{0,40}openNewestOnly[\s\S]{0,20}yearIndex/);
  });
});
