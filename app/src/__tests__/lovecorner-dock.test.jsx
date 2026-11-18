// @vitest-environment jsdom
// =============================================================================
// The church door's bottom bar — the seven tabs of Darrell's picture (DR-1484):
// Home · Watch · Bible · Events · Give · Ministries · Institute, no More (the
// header's All Features sheet carries every tab) and no second bell. Inside
// PoeTech the platform bar is unchanged.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import ChromeDock from '../components/ChromeDock.jsx';
import { churchSubTabs } from '../lib/church-tabs.jsx';
import { subscribeChurchHomeSection, publishChurchHomeSection } from '../lib/church-home-section.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let container, root, origMM, origW;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  origMM = window.matchMedia;
  origW = window.innerWidth;
  window.innerWidth = 390;
  window.matchMedia = (q) => ({
    matches: /max-width: (639|1023)/.test(q),
    media: q,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  });
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  window.matchMedia = origMM;
  window.innerWidth = origW;
});
const mount = (nav) => act(() => root.render(createElement(ChromeDock, { onFeedback: () => {}, nav })));
const q = (sel) => container.querySelector(sel);
const click = (el) => act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));

const CHURCH_DOOR = (extra = {}) => ({
  groups: [{ key: 'soul', label: 'Soul', items: [['church', 'Church']], links: [] }],
  view: 'church',
  churchView: 'home',
  homeView: 'current',
  churchTabs: churchSubTabs({}),
  onNavigate: () => {},
  money: null,
  ...extra,
});
const POETECH = (extra = {}) => ({
  groups: [
    {
      key: 'family',
      label: '',
      items: [
        ['overview', 'Home'],
        ['books', 'Money'],
      ],
      links: [],
    },
    { key: 'soul', label: 'Soul', items: [['church', 'Church']], links: [] },
  ],
  view: 'church',
  churchView: 'home',
  homeView: 'current',
  churchTabs: churchSubTabs({}),
  onNavigate: () => {},
  money: null,
  ...extra,
});

describe('on the church door', () => {
  it('the bar carries the seven tabs of the picture and none of the platform tabs; no More, no second bell (DR-1484)', () => {
    mount(CHURCH_DOOR());
    for (const k of ['church-home', 'church-watch', 'church-bible', 'church-events', 'church-ministries', 'church-institute'])
      expect(q(`[data-testid="dock-tab-${k}"]`), k).toBeTruthy();
    expect(q('[data-testid="dock-give"]')).toBeTruthy();
    for (const k of ['home', 'bigpicture', 'books', 'messages', 'church-word']) expect(q(`[data-testid="dock-tab-${k}"]`), k).toBeNull();
    expect(q('[data-testid="dock-more"]')).toBeNull();
    expect(q('[data-testid="dock-arrivals"]')).toBeNull();
    expect(q('[data-testid="dock-tab-church-home"]').getAttribute('aria-current')).toBe('page');
    expect(q('[data-testid="dock-tab-church-watch"]').getAttribute('aria-current')).toBeNull();
  });
  it("the order on the bar is the picture's: Home · Watch · Bible · Events · Give · Ministries · Institute", () => {
    mount(CHURCH_DOOR());
    const ids = [...q('[data-testid="dock-tabs"]').querySelectorAll('button')].map((b) => b.getAttribute('data-testid'));
    expect(ids).toEqual([
      'dock-tab-church-home',
      'dock-tab-church-watch',
      'dock-tab-church-bible',
      'dock-tab-church-events',
      'dock-give',
      'dock-tab-church-ministries',
      'dock-tab-church-institute',
    ]);
  });
  it('Watch and Events open the Church home on their sections; Bible, Ministries and Institute open their tabs', () => {
    const went = [];
    const sections = [];
    const off = subscribeChurchHomeSection((id) => sections.push(id));
    mount(CHURCH_DOOR({ onNavigate: (v, home, sub) => went.push([v, sub]) }));
    for (const k of ['church-watch', 'church-bible', 'church-events', 'church-ministries', 'church-institute']) click(q(`[data-testid="dock-tab-${k}"]`));
    off();
    expect(went).toEqual([
      ['church', 'home'],
      ['church', 'scripture'],
      ['church', 'home'],
      ['church', 'ministries'],
      ['church', 'institute'],
    ]);
    expect(sections).toEqual(['worship', 'times']);
  });
  it('Watch lights up when the home shows its Worship section (the churchHomeSection the shell now passes)', () => {
    mount(CHURCH_DOOR({ churchHomeSection: 'worship' }));
    expect(q('[data-testid="dock-tab-church-watch"]').getAttribute('aria-current')).toBe('page');
    expect(q('[data-testid="dock-tab-church-home"]').getAttribute('aria-current')).toBeNull();
  });
  it('the home publishing its open section lights the matching tab without the shell passing one', () => {
    mount(CHURCH_DOOR());
    act(() => publishChurchHomeSection('times'));
    expect(q('[data-testid="dock-tab-church-events"]').getAttribute('aria-current')).toBe('page');
    expect(q('[data-testid="dock-tab-church-home"]').getAttribute('aria-current')).toBeNull();
    act(() => publishChurchHomeSection(null));
    expect(q('[data-testid="dock-tab-church-home"]').getAttribute('aria-current')).toBe('page');
  });
  it('Give on the bar is the existing give button and opens its panel', () => {
    mount(CHURCH_DOOR({ church: { name: 'Church' } }));
    click(q('[data-testid="dock-give"]'));
    expect(document.body.textContent).toMatch(/give/i);
  });
});

describe('inside PoeTech', () => {
  it('the platform bar is unchanged and the church groups do not appear', () => {
    mount(POETECH());
    expect(q('[data-testid="dock-tab-home"]')).toBeTruthy();
    expect(q('[data-testid="dock-tab-church-home"]')).toBeNull();
    click(q('[data-testid="dock-more"]'));
    expect(q('[data-testid="dock-more-church-worship"]')).toBeNull();
    expect(q('[data-testid="dock-more-church"]')).toBeTruthy();
  });
});
