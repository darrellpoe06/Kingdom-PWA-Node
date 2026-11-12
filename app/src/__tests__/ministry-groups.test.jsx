// @vitest-environment jsdom
// =============================================================================
// ministry-groups — the Ministries landing groups the ONE registry into four
// families; every ministry lands in exactly one, an unknown one is never
// hidden, and the doors open real sub-tabs (Phase 3 of the redesign).
// =============================================================================
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MINISTRY_GROUPS, groupFor, groupedMinistries } from '../lib/ministry-groups.js';
import { CHURCH_MINISTRIES } from '../lib/church-ministries.js';
import { VALID_CHURCH_SUBS } from '../lib/nav-history.js';
import { ChurchMinistries } from '../components/ChurchMinistries.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('the four families', () => {
  it('are the four the brief names, and every registry id belongs to exactly one', () => {
    expect(MINISTRY_GROUPS.map((g) => g.title)).toEqual(['Music & Worship', 'Transportation', 'Children & Youth', 'Church Life']);
    const all = MINISTRY_GROUPS.flatMap((g) => g.ids);
    expect(new Set(all).size).toBe(all.length);
    for (const m of CHURCH_MINISTRIES) expect(all, m.id).toContain(m.id);
    for (const id of all)
      expect(
        CHURCH_MINISTRIES.some((m) => m.id === id),
        id
      ).toBe(true);
  });
  it('Choir and the Bus Ministry keep their own doors; the Youth Ministry opens the Youth Zone', () => {
    const by = Object.fromEntries(CHURCH_MINISTRIES.map((m) => [m.id, m]));
    expect(by.choir.surface).toEqual({ view: 'church', sub: 'choir' });
    expect(by.bus.surface).toEqual({ view: 'church', sub: 'bus' });
    expect(by.youth.surface).toEqual({ view: 'church', sub: 'youth' });
    for (const m of CHURCH_MINISTRIES) if (m.surface) expect(VALID_CHURCH_SUBS, m.id).toContain(m.surface.sub);
  });
  it('an unknown id lands in Church Life, never nowhere; grouping keeps the registry order', () => {
    expect(groupFor('a-row-the-office-added')).toBe('life');
    const g = groupedMinistries([...CHURCH_MINISTRIES, { id: 'new-row', name: 'New Row', surface: null, feedbackKey: 'church-ministries' }]);
    expect(g.find((x) => x.key === 'life').ministries.map((m) => m.id)).toContain('new-row');
    expect(g.find((x) => x.key === 'music').ministries.map((m) => m.id)).toEqual(
      ['choir', 'band', 'music', 'media']
        .filter((id) => CHURCH_MINISTRIES.some((m) => m.id === id))
        .sort((a, b) => CHURCH_MINISTRIES.findIndex((m) => m.id === a) - CHURCH_MINISTRIES.findIndex((m) => m.id === b))
    );
    expect(g.reduce((n, x) => n + x.ministries.length, 0)).toBe(CHURCH_MINISTRIES.length + 1);
  });
});

describe('the landing on the real surface', () => {
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
  const q = (sel) => container.querySelector(sel);
  const click = (el) => act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));

  it('shows the four family cards with doors for the ministries that have a page, and names the rest honestly', () => {
    const opened = [];
    const fed = [];
    act(() => root.render(createElement(ChurchMinistries, { onOpen: (s) => opened.push(s), onFeedback: (k) => fed.push(k) })));
    for (const k of ['music', 'transport', 'youth', 'life']) expect(q(`[data-testid="ministry-family-${k}"]`), k).toBeTruthy();
    click(q('[data-testid="ministry-door-choir"]'));
    click(q('[data-testid="ministry-door-bus"]'));
    click(q('[data-testid="ministry-door-youth"]'));
    expect(opened).toEqual([
      { view: 'church', sub: 'choir' },
      { view: 'church', sub: 'bus' },
      { view: 'church', sub: 'youth' },
    ]);
    expect(q('[data-testid="ministry-named-band"]').textContent).toContain('no page yet');
    click(q('[data-testid="ministry-named-band"]'));
    expect(fed).toEqual(['church-band']);
  });
  it('the landing steps aside while a search narrows the list, and the full list below is unchanged', () => {
    act(() => root.render(createElement(ChurchMinistries, {})));
    expect(q('[data-testid="ministry-landing"]')).toBeTruthy();
    const input = q('input[type="search"]');
    act(() => {
      const d = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      d.call(input, 'choir');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(q('[data-testid="ministry-landing"]')).toBeNull();
    expect(container.textContent).toContain('Open Choir');
  });
  it('every button carries a focus ring', () => {
    act(() => root.render(createElement(ChurchMinistries, {})));
    for (const b of container.querySelectorAll('button')) expect(b.className, b.textContent).toMatch(/focus:outline/);
  });
});
