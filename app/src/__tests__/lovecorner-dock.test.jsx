// @vitest-environment jsdom
// =============================================================================
// The church door's bottom bar — Home · Watch · Word (with Give and More),
// and More lists every Church sub-tab the shell gated, grouped. Inside
// PoeTech the platform bar is unchanged (2026-11-12 redesign, brief §10).
// =============================================================================
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import ChromeDock from '../components/ChromeDock.jsx';
import { churchSubTabs } from '../lib/church-tabs.jsx';
import { subscribeChurchHomeSection } from '../lib/church-home-section.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let container, root, origMM, origW;
beforeEach(() => {
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
  origMM = window.matchMedia; origW = window.innerWidth; window.innerWidth = 390;
  window.matchMedia = (q) => ({ matches: /max-width: (639|1023)/.test(q), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
});
afterEach(() => { act(() => root.unmount()); container.remove(); window.matchMedia = origMM; window.innerWidth = origW; });
const mount = (nav) => act(() => root.render(createElement(ChromeDock, { onFeedback: () => {}, nav })));
const q = (sel) => container.querySelector(sel);
const click = (el) => act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));

const CHURCH_DOOR = (extra = {}) => ({ groups: [{ key: 'soul', label: 'Soul', items: [['church', 'Church']], links: [] }], view: 'church', churchView: 'home', homeView: 'current', churchTabs: churchSubTabs({}), onNavigate: () => {}, money: null, ...extra });
const POETECH = (extra = {}) => ({ groups: [{ key: 'family', label: '', items: [['overview', 'Home'], ['books', 'Money']], links: [] }, { key: 'soul', label: 'Soul', items: [['church', 'Church']], links: [] }], view: 'church', churchView: 'home', homeView: 'current', churchTabs: churchSubTabs({}), onNavigate: () => {}, money: null, ...extra });

describe('on the church door', () => {
  it('the bar carries Home · Watch · Word and none of the platform tabs', () => {
    mount(CHURCH_DOOR());
    for (const k of ['church-home', 'church-watch', 'church-word']) expect(q(`[data-testid="dock-tab-${k}"]`), k).toBeTruthy();
    for (const k of ['home', 'bigpicture', 'books', 'messages']) expect(q(`[data-testid="dock-tab-${k}"]`), k).toBeNull();
    expect(q('[data-testid="dock-tab-church-home"]').getAttribute('aria-current')).toBe('page');
  });
  it('Watch opens the Church home on its Worship section; Word opens the Word tab', () => {
    const went = []; const sections = [];
    const off = subscribeChurchHomeSection((id) => sections.push(id));
    mount(CHURCH_DOOR({ onNavigate: (v, home, sub) => went.push([v, sub]) }));
    click(q('[data-testid="dock-tab-church-watch"]'));
    click(q('[data-testid="dock-tab-church-word"]'));
    off();
    expect(went).toEqual([['church', 'home'], ['church', 'pulpit']]);
    expect(sections).toEqual(['worship']);
  });
  it('More lists every gated Church sub-tab, grouped, and a tap opens it', () => {
    const went = [];
    mount(CHURCH_DOOR({ onNavigate: (v, home, sub) => went.push([v, sub]) }));
    click(q('[data-testid="dock-more"]'));
    for (const g of ['worship', 'ministries', 'learning', 'campus']) expect(q(`[data-testid="dock-more-church-${g}"]`), g).toBeTruthy();
    for (const id of churchSubTabs({}).map(([i]) => i)) expect(q(`[data-testid="dock-more-church-tab-${id}"]`), id).toBeTruthy();
    expect(q('[data-testid="dock-more-church-tab-institute"]').textContent).toContain('TLC Theological Institute');
    expect(q('[data-testid="dock-more-church"]')).toBeNull();
    click(q('[data-testid="dock-more-church-tab-institute"]'));
    expect(went).toEqual([['church', 'institute']]);
  });
  it('a signed-in office viewer sees My church and Church office groups too', () => {
    mount(CHURCH_DOOR({ churchTabs: churchSubTabs({ signedIn: true, officeRole: 'owner', isChurchStaff: true }) }));
    click(q('[data-testid="dock-more"]'));
    expect(q('[data-testid="dock-more-church-mine"]')).toBeTruthy();
    expect(q('[data-testid="dock-more-church-office"]')).toBeTruthy();
    expect(q('[data-testid="dock-more-church-tab-giving-book"]')).toBeTruthy();
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
