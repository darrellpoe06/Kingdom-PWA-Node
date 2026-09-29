// Render test for the Who He Is register (DR-0675): a lesson of the course
// shows EVERY passage it carries, each with where, when, what, how, whether He
// was there, and Who He Is. The counts on screen are the lengths of the lists
// the data gives; opening a book shows every passage in it.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import WhoHeIsRegister from '../components/WhoHeIsRegister.jsx';
import { WHO_HE_IS_LESSON_SPECS } from '../lib/who-he-is-course.js';
import { registerFor, byBook, WHO_HE_IS_EDGE } from '../lib/who-he-is.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container; let root;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const spec = (id) => WHO_HE_IS_LESSON_SPECS[id];
const click = (el) => act(() => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
const button = (re) => [...container.querySelectorAll('button')].find((b) => re.test(b.textContent));

describe('WhoHeIsRegister — every passage, made plain', () => {
  it('shows the derived count and every book, and opening a book shows every passage with its six lines', () => {
    const s = spec('whohe5-the-prophets');
    const { primary } = registerFor(s);
    act(() => root.render(createElement(WhoHeIsRegister, { spec: s })));
    expect(container.textContent).toContain(`Every passage set here — ${primary.length}`);
    const groups = byBook(primary);
    for (const g of groups) expect(button(new RegExp(`${g.book} — ${g.entries.length}`)), g.book).toBeTruthy();
    click(button(/^▸ Isaiah/));
    const isaiah = groups.find((g) => g.book === 'Isaiah');
    expect(container.querySelectorAll('li[data-entry]').length).toBe(isaiah.entries.length);
    const card = container.querySelector('li[data-entry]').textContent;
    for (const label of ['Where:', 'When:', 'What:', 'How:', 'Was He there:', 'Who He Is:']) expect(card).toContain(label);
  });

  it('"Open all" shows every passage in the lesson at once', () => {
    const s = spec('whohe11-the-letters-who-he-is-to-the-churches');
    const { primary } = registerFor(s);
    act(() => root.render(createElement(WhoHeIsRegister, { spec: s })));
    click(button(/^Open all/));
    expect(container.querySelectorAll('li[data-entry]').length).toBe(primary.length);
  });

  it('a lesson with nothing set in its era says so, and lists what points there', () => {
    const s = spec('whohe13-he-comes-again');
    const { pointing } = registerFor(s);
    act(() => root.render(createElement(WhoHeIsRegister, { spec: s })));
    expect(container.textContent).toContain('No passage is set in this part of the line');
    click(button(/point here — /));
    expect(container.querySelectorAll('li[data-entry]').length).toBe(pointing.length);
  });

  it('the first lesson shows the edge, every passage of it', () => {
    act(() => root.render(createElement(WhoHeIsRegister, { spec: spec('whohe1-all-of-them-the-rule-the-line-and-the-edge') })));
    expect(container.textContent).toContain(`The edge — named, not dropped (${WHO_HE_IS_EDGE.length})`);
    for (const g of WHO_HE_IS_EDGE) expect(container.textContent).toContain(g.ref);
  });
});
