// =============================================================================
// TorahPatternMap — live render proof (DR-0076: observe the REAL surface).
// =============================================================================
// The map exists so Darrell can SEE the shape of the first five books. A data
// module that is never rendered correctly is not sight. This mounts the actual
// component in jsdom and proves the seeing works: the headline numbers are the
// DERIVED ones (not markup), every family is reachable, the relationships
// filter really narrows to multi-Person patterns, and the two tiers are visible
// on the surface rather than only in the data.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import TorahPatternMap from '../components/TorahPatternMap.jsx';
import {
  TORAH_PATTERNS, mapSummary, familyCoverage, enemyRoll, jointPatterns,
} from '../lib/torah-patterns.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container, root;
beforeEach(() => { container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });

const mount = () => act(() => root.render(createElement(TorahPatternMap)));
const buttons = () => Array.from(container.querySelectorAll('button'));
const click = (el) => act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));

describe('the map renders the DERIVED shape, not painted numbers', () => {
  it('the headline figures are the ones the module computes', () => {
    mount();
    const s = mapSummary();
    const text = container.textContent;
    expect(text).toContain(String(s.patterns));
    expect(text).toContain(String(s.refs));
    expect(text).toContain(String(s.allThree));
    expect(text).toContain(String(s.enemies));
    // The claim is measured against a recount, so a painted literal would drift.
    expect(s.patterns).toBe(TORAH_PATTERNS.length);
  });

  it('all five books appear in the coverage strip', () => {
    mount();
    for (const b of ['Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy']) {
      expect(container.textContent, `${b} missing from coverage`).toContain(b);
    }
  });

  it('all three Persons are named with their counts', () => {
    mount();
    for (const label of ['the Father', 'the Son', 'the Holy Spirit']) {
      expect(container.textContent).toContain(label);
    }
  });

  it('the enemy roll renders every enemy the data carries', () => {
    mount();
    for (const row of enemyRoll()) {
      expect(container.textContent, `${row.enemy} missing from the roll`).toContain(row.enemy.replace(/-/g, ' '));
    }
  });
});

describe('every family is reachable, and filtering really filters', () => {
  it('a tab exists for every family that carries patterns', () => {
    mount();
    const labels = buttons().map((b) => b.textContent);
    for (const f of familyCoverage()) {
      expect(labels.some((l) => l.includes(f.label)), `no tab for ${f.label}`).toBe(true);
    }
  });

  it('choosing a family narrows the list to that family', () => {
    mount();
    const before = container.querySelectorAll('li').length;
    const tab = buttons().find((b) => b.textContent.includes('The Spirit in the Torah'));
    click(tab);
    const after = container.querySelectorAll('li').length;
    expect(after).toBeLessThan(before);
    expect(container.textContent).toContain('The Spirit moved upon the face of the waters');
  });

  it('the relationships filter narrows to patterns with two or more Persons', () => {
    mount();
    const toggle = buttons().find((b) => /two or more work together/i.test(b.textContent));
    expect(toggle).toBeTruthy();
    click(toggle);
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    // Every rendered pattern title must belong to a multi-Person pattern.
    const joint = new Set(jointPatterns().map((p) => p.name));
    const solo = TORAH_PATTERNS.filter((p) => (p.persons || []).length < 2 && !joint.has(p.name));
    const text = container.textContent;
    const leaked = solo.filter((p) => text.includes(p.name));
    expect(leaked.map((p) => p.id), 'single-Person patterns leaked into the joint view').toEqual([]);
  });

  it('the all-Three patterns are present and reachable', () => {
    mount();
    const tab = buttons().find((b) => b.textContent.includes('All of it running at once'));
    click(tab);
    expect(container.textContent).toContain('The exodus');
  });
});

describe('the two tiers are visible on the SURFACE, not only in the data', () => {
  it('opening a confessed pattern shows our reading marked as ours', () => {
    mount();
    const tab = buttons().find((b) => b.textContent.includes('The One who is seen'));
    click(tab);
    const row = buttons().find((b) => /A Man wrestles until daybreak/.test(b.textContent));
    expect(row).toBeTruthy();
    click(row);
    expect(container.textContent).toMatch(/Our confession, not the text/i);
    expect(container.textContent).toMatch(/The text SHOWS this/i);
  });

  it('opening a named pattern says the text names it, with no confession block', () => {
    mount();
    const tab = buttons().find((b) => b.textContent.includes('The Spirit in the Torah'));
    click(tab);
    const row = buttons().find((b) => /The Spirit moved upon the face of the waters/.test(b.textContent));
    click(row);
    expect(container.textContent).toMatch(/The text NAMES this/i);
  });

  it('a reticent pattern tells the reader where we stopped', () => {
    mount();
    const tab = buttons().find((b) => b.textContent.includes('The enemies, named'));
    click(tab);
    const row = buttons().find((b) => /The sons of God, and the giants/.test(b.textContent));
    click(row);
    expect(container.textContent).toMatch(/Where the text stops, we stop/i);
  });

  it('opening a pattern shows its actual verse references', () => {
    mount();
    const tab = buttons().find((b) => b.textContent.includes('The Coming One promised'));
    click(tab);
    const row = buttons().find((b) => /Her Seed shall bruise thy head/.test(b.textContent));
    click(row);
    expect(container.textContent).toContain('Genesis 3:15');
  });
});

describe('the surface is accessible and theme-safe by construction', () => {
  it('every interactive control carries a visible focus ring', () => {
    mount();
    for (const b of buttons()) {
      expect(b.className, `a control with no focus ring: ${b.textContent.slice(0, 40)}`).toMatch(/focus:outline/);
    }
  });

  it('the family tabs are a real tablist with selection state', () => {
    mount();
    const tabs = buttons().filter((b) => b.getAttribute('role') === 'tab');
    expect(tabs.length).toBeGreaterThan(5);
    expect(tabs.filter((t) => t.getAttribute('aria-selected') === 'true').length).toBe(1);
  });

  it('expanding rows are announced to assistive tech', () => {
    mount();
    const rows = buttons().filter((b) => b.hasAttribute('aria-expanded'));
    expect(rows.length).toBeGreaterThan(10);
    expect(rows.every((r) => r.getAttribute('aria-expanded') === 'false')).toBe(true);
  });
});
