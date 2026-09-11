// =============================================================================
// ConcernsBoard · Most reported — live render proof (Verification Doctrine:
// observe the REAL surface, not the helper it calls).
//
// Darrell, 2026-09-11, showing the COLG leadership why feedback goes in the app:
// "we got fifty feedback things, we can look through a list and go, oh, that's
// what they talking about... there's twenty people that has the same issue. We
// gotta fix that first."
//
// This mounts the actual board in jsdom and proves the strip renders the PEOPLE
// count, leads with the biggest fix-once-clear-many, lets a severe-but-rare
// issue cut the line, and stays off the page entirely when nothing repeats.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { ConcernsBoard } from '../components/ConcernsBoard.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container, root;
beforeEach(() => { container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });

const render = (feedback) => act(() => {
  root.render(createElement(ConcernsBoard, { concerns: [], feedback }));
});

const say = (id, who, text) => ({ id, userId: who, text, createdAt: '2026-09-11' });

describe('the Most reported strip on the real board', () => {
  it('shows the head-count for a complaint many people made', () => {
    const feedback = Array.from({ length: 12 }, (_, i) =>
      say(`g${i}`, `person-${i}`, i % 2 ? 'the give button is broken' : "give button doesn't work"));
    render(feedback);
    const text = container.textContent;
    expect(text).toContain('Most reported');
    expect(text).toMatch(/12/);
    expect(text).toMatch(/give button/i);
  });

  it('leads with the issue the most people reported', () => {
    const many = Array.from({ length: 9 }, (_, i) => say(`m${i}`, `p${i}`, 'the give button is broken'));
    const few = [say('f1', 'x', 'the bus schedule is broken'), say('f2', 'y', 'bus schedule broken')];
    render([...few, ...many]);
    const rows = Array.from(container.querySelectorAll('ol li')).map((li) => li.textContent);
    expect(rows.length).toBeGreaterThanOrEqual(2);
    expect(rows[0]).toMatch(/give button/i);
    expect(rows[1]).toMatch(/bus schedule/i);
  });

  it('lets TWO people on a serious issue cut ahead of twenty on a small one', () => {
    const nit = Array.from({ length: 20 }, (_, i) => say(`n${i}`, `p${i}`, 'the wording on this page is confusing'));
    const bad = [
      say('b1', 'x', 'my giving entry disappeared after I saved it'),
      say('b2', 'y', 'giving entry disappeared after saved'),
    ];
    render([...nit, ...bad]);
    const rows = Array.from(container.querySelectorAll('ol li')).map((li) => li.textContent);
    expect(rows[0]).toMatch(/disappeared/i);
  });

  it('states the repeat rate — what answering everyone individually was costing', () => {
    const feedback = [
      ...Array.from({ length: 9 }, (_, i) => say(`g${i}`, `p${i}`, 'the give button is broken')),
      say('z', 'z', 'the bus schedule is broken'),
    ];
    render(feedback);
    expect(container.textContent).toMatch(/80% were a repeat/);
  });

  it('stays OFF the page when nothing repeats (no strip of ones)', () => {
    render([
      say(1, 'a', 'the give button is broken'),
      say(2, 'b', 'I love the new bus ministry page'),
    ]);
    expect(container.textContent).not.toContain('Most reported');
  });

  it('stays off the page with no feedback at all, and does not throw', () => {
    render([]);
    expect(container.textContent).not.toContain('Most reported');
  });
});
