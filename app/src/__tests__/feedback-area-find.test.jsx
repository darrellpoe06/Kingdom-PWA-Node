// =============================================================================
// The "Which area?" picker — findable, and honest about what it names.
//
// Darrell, 2026-09-11, with the COLG leadership watching him file feedback
// against the very surface they were looking at:
//   "Okay. Now where is it at?"
//   "Do you see it in there yet? I don't. I don't see the church band."
//   "Which one is it — the church, and his choir, and his choir? We don't want
//    the choir. We want the church."
//   "This already says access... I know I gotta change it."
//
// The list is 138 entries deep. These pin the four fixes, on the REAL modal.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { FEEDBACK_AREAS, filterAreas, FeedbackModal } from '../components/FeedbackCenter.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const allKeys = () => FEEDBACK_AREAS.flatMap((g) => g.items.map(([k]) => k));
const groupOf = (key) => FEEDBACK_AREAS.find((g) => g.items.some(([k]) => k === key))?.group || '';

describe('filterAreas — type to find it', () => {
  it('finds the Bus Ministry by one word', () => {
    const keys = filterAreas(FEEDBACK_AREAS, 'bus', null).flatMap((g) => g.items.map(([k]) => k));
    expect(keys).toContain('church-bus');
    expect(keys.length).toBeLessThan(allKeys().length / 4);
  });

  it('finds the church band — the thing that was not there at all', () => {
    const keys = filterAreas(FEEDBACK_AREAS, 'band', null).flatMap((g) => g.items.map(([k]) => k));
    expect(keys).toContain('church-band');
  });

  it('matches words in any order, and matches the GROUP name too', () => {
    const a = filterAreas(FEEDBACK_AREAS, 'choir songbook', null).flatMap((g) => g.items.map(([k]) => k));
    const b = filterAreas(FEEDBACK_AREAS, 'songbook choir', null).flatMap((g) => g.items.map(([k]) => k));
    expect(a).toEqual(b);
    expect(a).toContain('choir-songbook');
  });

  it('returns the whole list untouched for an empty query', () => {
    expect(filterAreas(FEEDBACK_AREAS, '', null)).toBe(FEEDBACK_AREAS);
    expect(filterAreas(FEEDBACK_AREAS, '   ', null)).toBe(FEEDBACK_AREAS);
  });

  it('ALWAYS keeps the selected area, so a search cannot blank the answer', () => {
    const kept = filterAreas(FEEDBACK_AREAS, 'zzzz-no-such-thing', 'church-bus');
    expect(kept.flatMap((g) => g.items.map(([k]) => k))).toEqual(['church-bus']);
  });

  it('drops empty groups instead of rendering headers with nothing under them', () => {
    for (const grp of filterAreas(FEEDBACK_AREAS, 'choir', null)) {
      expect(grp.items.length).toBeGreaterThan(0);
    }
  });
});

describe('the list says what is true', () => {
  it('gives Choir its own group so it stops drowning Church', () => {
    expect(groupOf('choir-songbook')).toMatch(/choir/i);
    expect(groupOf('choir-songbook')).not.toBe(groupOf('church-bus'));
    const churchGroup = FEEDBACK_AREAS.find((g) => g.group === 'Church');
    expect(churchGroup.items.some(([k]) => k.startsWith('choir-'))).toBe(false);
  });

  it('still carries EVERY choir key — regrouping moved them, it did not drop them', () => {
    for (const k of ['church-choir', 'choir-week', 'choir-songs', 'choir-songbook',
      'choir-schedule', 'choir-teamdocs', 'choir-availability', 'choir-messages',
      'choir-resources', 'choir-roster']) {
      expect(allKeys()).toContain(k);
    }
  });

  it('no longer calls the retired Access tab a place of its own', () => {
    const label = FEEDBACK_AREAS.flatMap((g) => g.items).find(([k]) => k === 'access')[1];
    expect(label).toMatch(/^Admin/);
  });

  it('names the ministries a member would look for', () => {
    expect(allKeys()).toContain('church-band');
    expect(allKeys()).toContain('church-ministries');
  });

  it('keeps every key unique (a duplicate silently eats one surface)', () => {
    const keys = allKeys();
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('the real modal', () => {
  let container, root;
  beforeEach(() => { container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); });

  const mount = () => act(() => {
    root.render(createElement(FeedbackModal, { onClose() {}, onSubmit() {}, currentView: 'church' }));
  });

  it('renders a search box above the area list', () => {
    mount();
    const search = container.querySelector('input[type="search"]');
    expect(search).toBeTruthy();
    expect(search.getAttribute('aria-label')).toMatch(/find an area/i);
  });

  it('narrows the options to the ministry you typed, and says how many matched', () => {
    mount();
    const search = container.querySelector('input[type="search"]');
    const before = container.querySelectorAll('select option').length;
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(search, 'bus');
      search.dispatchEvent(new Event('input', { bubbles: true }));
    });
    const options = Array.from(container.querySelectorAll('select option')).map((o) => o.value);
    expect(options.length).toBeLessThan(before);
    expect(options).toContain('church-bus');
    expect(container.textContent).toMatch(/match(es)? · pick one/);
  });

  it('says so plainly when nothing matches, instead of showing an empty list', () => {
    mount();
    const search = container.querySelector('input[type="search"]');
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(search, 'qqqzzz');
      search.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(container.textContent).toMatch(/Nothing matches that/);
  });
});
