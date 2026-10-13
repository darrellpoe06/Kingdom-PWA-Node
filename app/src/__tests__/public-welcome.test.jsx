// @vitest-environment jsdom
// =============================================================================
// The link explains itself — after the reading, because the reading is the draw
// =============================================================================
// Darrell 2026-08-10: "When I send a link... it should be almost like a
// newsletter... explains why it exist... then looks for subscriptions", "then
// the real account happens when they sign up... however... the fruit is
// obviously good", "let potential users have the clarity to understand what
// they are using", and the sharpening that decided the shape: "Explains at the
// end... the information is the draw!?? Short and sweet then... explain at the
// end."
//
// So the top is ONE line and the explanation waits until after the reading.
// These pin that shape, and the one thing that could quietly become a lie: the
// counts. They are COUNTED from the mounted catalog at render (DR-0121), never
// typed — a "50+ lessons" that drifts is exactly the class of claim this
// platform exists to refuse.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import PublicWelcome, { catalogTotals } from '../components/PublicWelcome.jsx';
import { LEARN_CATALOG } from '../lib/learn-catalog.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container, root;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); });

const render = (props = {}) => act(() => root.render(createElement(PublicWelcome, props)));
const text = () => container.textContent || '';
const button = (re) => [...container.querySelectorAll('button')].find((b) => re.test(b.textContent || ''));

describe('the top is short and sweet — the reading is the draw', () => {
  it('one line: whose house this is, and that it is free to read', () => {
    render({ placement: 'top' });
    expect(container.querySelector('[data-testid="public-welcome-top"]')).toBeTruthy();
    expect(text()).toContain('The Love Corner');
    expect(text()).toContain('free to read, no account');
  });

  it('it asks for NOTHING at the top — no sign-up pitch before a word is read', () => {
    render({ placement: 'top' });
    expect(button(/Create your free account/i)).toBeFalsy();
    expect(text()).not.toMatch(/subscribe/i);
  });

  it('and it can be put away', () => {
    render({ placement: 'top' });
    act(() => { button(/Hide/i).click(); });
    expect(container.querySelector('[data-testid="public-welcome-top"]')).toBeFalsy();
  });
});

describe('the explanation comes at the END, where it has been earned', () => {
  it('says what this is and why it exists', () => {
    render({ placement: 'end' });
    expect(container.querySelector('[data-testid="public-welcome-end"]')).toBeTruthy();
    expect(text()).toContain('The Church of the Living God');
    expect(text()).toMatch(/why it exists/i);
    expect(text()).toMatch(/Yahweh’s Word comes first/);
  });

  it('is plain about the cost — free to read, nothing locked, nothing sold', () => {
    render({ placement: 'end' });
    expect(text()).toMatch(/free to read, with no account/i);
    expect(text()).toMatch(/Nothing is locked and\s+nothing is sold|nothing is sold/i);
  });

  it('THEN invites the account, and says exactly what an account is for', () => {
    render({ placement: 'end' });
    expect(button(/Create your free account/i)).toBeTruthy();
    expect(text()).toMatch(/your place in a lesson/i);
    expect(text()).toMatch(/we do not sell it/i);
  });

  it('shows the fruit as a COUNT, matching the live catalog', () => {
    render({ placement: 'end' });
    const totals = catalogTotals(LEARN_CATALOG);
    expect(totals.courses).toBeGreaterThan(10);
    expect(totals.lessons).toBeGreaterThan(200);
    expect(text()).toContain(`${totals.courses} courses · ${totals.lessons} lessons`);
  });
});

describe('the counts are counted, never claimed (DR-0121 / DR-0076)', () => {
  it('a course added to the catalog changes the number with no edit here', () => {
    const grown = [...LEARN_CATALOG, { key: 'x', meta: { key: 'x' }, buildScheduleRows: () => [{ id: 'a' }, { id: 'b' }] }];
    const before = catalogTotals(LEARN_CATALOG);
    const after = catalogTotals(grown);
    expect(after.courses).toBe(before.courses + 1);
    expect(after.lessons).toBe(before.lessons + 2);
  });

  it('a catalog entry that throws is counted as zero, never as a crash', () => {
    const hostile = [{ key: 'bad', buildScheduleRows: () => { throw new Error('boom'); } }];
    expect(() => catalogTotals(hostile)).not.toThrow();
    expect(catalogTotals(hostile)).toEqual({ courses: 1, lessons: 0 });
  });

  it('an EMPTY catalog prints no boast at all rather than a zero', () => {
    render({ placement: 'end', catalog: [] });
    expect(text()).not.toMatch(/0 lessons/);
    expect(text()).not.toMatch(/counted live/);
  });
});
