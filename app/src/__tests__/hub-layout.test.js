// =============================================================================
// Each person arranges their own Life Hub (DR-1201) — the pure rules
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  HUB_SECTIONS, DEFAULT_LAYOUT, HUB_LAYOUT_KEY, normalizeLayout, isStandard, moveSection, toggleHidden,
  layoutRuns, loadHubLayout, saveHubLayout, hiddenLine,
} from '../lib/hub-layout.js';

const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), m }; };

describe('a layout is always whole', () => {
  it('unknown ids are dropped, missing ids come back in the standard order, duplicates once', () => {
    expect(normalizeLayout({ order: ['actions', 'ghost', 'actions', 'tiles'], hidden: ['ghost', 'tiles', 'tiles'] }))
      .toEqual({ order: ['actions', 'tiles', 'welcome', 'messages', 'focus'], hidden: ['tiles'] });
    expect(normalizeLayout(null)).toEqual({ order: HUB_SECTIONS.map((s) => s.id), hidden: [] });
    expect(isStandard(DEFAULT_LAYOUT)).toBe(true);
  });
  it('moves stop at the ends; hide toggles; the header is not a section and cannot be hidden', () => {
    expect(moveSection(DEFAULT_LAYOUT, 'welcome', -1).order[0]).toBe('welcome');
    expect(moveSection(DEFAULT_LAYOUT, 'actions', -1).order.slice(-2)).toEqual(['actions', 'focus']);
    expect(toggleHidden(toggleHidden(DEFAULT_LAYOUT, 'tiles'), 'tiles').hidden).toEqual([]);
    expect(HUB_SECTIONS.map((s) => s.id)).not.toContain('header');
    expect(toggleHidden(DEFAULT_LAYOUT, 'header').hidden).toEqual([]);
  });
});

describe('the render runs keep the cards side by side in any order', () => {
  it('standard: welcome, tiles, then the three cards in one row', () => {
    expect(layoutRuns(DEFAULT_LAYOUT)).toEqual([
      { kind: 'block', id: 'welcome' }, { kind: 'block', id: 'tiles' }, { kind: 'cards', ids: ['messages', 'focus', 'actions'] },
    ]);
  });
  it('a card moved above the tiles gets its own row; hidden sections are not rendered', () => {
    const l = { order: ['actions', 'tiles', 'welcome', 'messages', 'focus'], hidden: ['welcome'] };
    expect(layoutRuns(l)).toEqual([{ kind: 'cards', ids: ['actions'] }, { kind: 'block', id: 'tiles' }, { kind: 'cards', ids: ['messages', 'focus'] }]);
  });
});

describe('kept on this device, and blocked storage never breaks the front door', () => {
  it('saves a chosen layout, removes the key for the standard one, and reads both back', () => {
    const s = mem();
    const l = toggleHidden(moveSection(DEFAULT_LAYOUT, 'focus', -1), 'messages');
    expect(saveHubLayout(l, s)).toBe(true);
    expect(loadHubLayout(s)).toEqual(normalizeLayout(l));
    expect(saveHubLayout(DEFAULT_LAYOUT, s)).toBe(true);
    expect(s.m.has(HUB_LAYOUT_KEY)).toBe(false);
  });
  it('PROVEN TO CATCH: a store that throws, or holds garbage, reads as the standard order', () => {
    const boom = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); }, removeItem: () => { throw new Error('blocked'); } };
    expect(loadHubLayout(boom)).toEqual(normalizeLayout(null));
    expect(saveHubLayout(DEFAULT_LAYOUT, boom)).toBe(false);
    const junk = mem(); junk.setItem(HUB_LAYOUT_KEY, '{not json');
    expect(loadHubLayout(junk)).toEqual(normalizeLayout(null));
  });
  it('a hidden section is said in one line, never a silent blank', () => {
    expect(hiddenLine(DEFAULT_LAYOUT)).toBe('');
    expect(hiddenLine({ hidden: ['tiles'] })).toBe('One section is hidden on this device.');
    expect(hiddenLine({ hidden: ['tiles', 'focus'] })).toBe('2 sections are hidden on this device.');
  });
});
