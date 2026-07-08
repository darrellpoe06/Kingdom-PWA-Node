// =============================================================================
// Learn catalog — EVERY course in the Church → Learn picker renders (proven-to-
// catch, DR-0076). The 2026-07-08 "Living lessons break" proved the class: the
// existing render test exercised only the DEFAULT course, so a course whose
// DATA or renderer threw (for any single chip) shipped green and died on the
// live site behind the surface boundary. This harness mirrors the host's
// descriptor wiring for the WHOLE catalog and clicks every course chip — a
// crash in any course's render now fails CI instead of production.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import ChurchLearn from '../components/ChurchLearn.jsx';
import { LEARN_CATALOG, learnCatalogSummary, buildCatalogCourseDescriptors } from '../lib/learn-catalog.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container, root;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); });

const extraCourses = buildCatalogCourseDescriptors();

const mount = (props = {}) =>
  act(() => root.render(createElement(ChurchLearn, {
    extraCourses,
    progress: {},
    toggleModule: () => {},
    quizState: {},
    recordQuiz: () => {},
    learnLevel: 'auto',
    setLearnLevel: () => {},
    ageBand: 'adult',
    setAgeBand: () => {},
    ...props,
  })));

const clickCourse = (title) => {
  const tab = [...container.querySelectorAll('[role="tab"]')].find((b) => (b.textContent || '').includes(title));
  if (!tab) throw new Error(`course chip not found: ${title}`);
  act(() => tab.dispatchEvent(new MouseEvent('click', { bubbles: true })));
};

describe('Learn catalog — every finished course renders in the picker', () => {
  it('every catalog course chip is present and renders its curriculum without crashing', () => {
    mount();
    for (const entry of LEARN_CATALOG) {
      clickCourse(entry.meta.title);
      // The course body rendered — its unit rows (Week/Lesson/Issue/Session/Voice N)
      // are on the DOM, not an error card.
      expect(container.textContent, `${entry.key} should render its rows`).toMatch(
        new RegExp(`(${entry.unitCap || 'Week'})\\s*1`),
      );
      expect(container.textContent).not.toContain('hit an error');
    }
  });

  it('the catalog holds every finished course — including Kingdom Economics and Prophetic Voices', () => {
    const keys = LEARN_CATALOG.map((c) => c.key);
    expect(keys).toContain('kingdom-economics');
    expect(keys).toContain('prophetic-voices');
    expect(keys).toContain('living-lessons');
    expect(keys).toContain('world-issues');
  });

  it('the derived lesson floor holds: at least 40 finished lessons across the catalog', () => {
    const { courses, lessons } = learnCatalogSummary();
    expect(courses).toBeGreaterThanOrEqual(12);
    expect(lessons).toBeGreaterThanOrEqual(40);
  });

  it('the host wires EVERY catalog course into the Learn tab (no course built but unsurfaced)', async () => {
    const fs = await import('node:fs');
    const host = fs.readFileSync('src/poe-financial-mvp-v28.jsx', 'utf8');
    const wrapper = fs.readFileSync('src/components/ChurchLearn.jsx', 'utf8');
    for (const entry of LEARN_CATALOG) {
      if (entry.wiring === 'component') {
        expect(wrapper, `ChurchLearn must own course key "${entry.key}"`).toContain(`key: '${entry.key}'`);
      } else if (entry.wiring === 'cohort') {
        expect(host, `host must wire cohort course key "${entry.key}"`).toContain(`key: '${entry.key}'`);
      } else {
        // Self-paced courses ride the registry — the host must mount them via
        // buildSelfPacedDescriptors, so ANY course added to the registry ships.
        expect(host).toContain('buildSelfPacedDescriptors(');
      }
    }
  });

  it('EVERY course lib in src/lib is registered in the catalog (built ⇒ surfaced)', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const libDir = 'src/lib';
    const registered = new Set(LEARN_CATALOG.map((c) => c.key));
    for (const f of fs.readdirSync(libDir)) {
      if (!f.endsWith('.js')) continue;
      const src = fs.readFileSync(path.join(libDir, f), 'utf8');
      // A course lib = exports a *_META with a weeks: count and a key.
      const metaMatch = src.match(/export const \w+_META = \{[\s\S]*?\n\};/);
      if (!metaMatch || !/\n\s*weeks:\s*\d+/.test(metaMatch[0])) continue;
      const keyMatch = metaMatch[0].match(/key:\s*'([\w-]+)'/);
      const key = keyMatch ? keyMatch[1] : 'ai'; // church-classes.js META carries no key; it is the component-owned ai course
      expect(registered.has(key), `course lib ${f} (key "${key}") must be registered in LEARN_CATALOG`).toBe(true);
    }
  });
});
