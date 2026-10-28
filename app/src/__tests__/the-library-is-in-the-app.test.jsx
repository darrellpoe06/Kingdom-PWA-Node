// =============================================================================
// THE LIBRARY IS IN THE APP — beside the record, counted from what is mounted
// (DR-1261)
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import ChurchLearn from '../components/ChurchLearn.jsx';
import { buildCatalogCourseDescriptors } from '../lib/learn-catalog.js';
import { clearAllPlaces } from '../lib/learn-resume.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('the Record area carries the library', () => {
  let host, root;
  const courses = buildCatalogCourseDescriptors();
  beforeEach(() => { window.localStorage.clear(); clearAllPlaces(); host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host); });
  afterEach(() => { act(() => root.unmount()); host.remove(); window.localStorage.clear(); });

  it('the fold line, the figures, the course table, the queue and the how — from the mounted catalog, for a signed-out reader too', () => {
    act(() => root.render(createElement(ChurchLearn, {
      extraCourses: courses, progress: {}, toggleModule: vi.fn(), quizState: {}, recordQuiz: () => {},
      learnLevel: 'auto', setLearnLevel: () => {}, ageBand: 'adult', setAgeBand: () => {}, signedIn: false,
    })));
    const tab = [...host.querySelectorAll('[data-testid="learn-areas"] button')].find((b) => /^Record/.test((b.textContent || '').trim()));
    act(() => { tab.click(); });
    const panel = host.querySelector('[data-testid="learn-library-census"]');
    expect(panel, 'the library stands in the Record area').toBeTruthy();
    const lessons = Number(host.querySelector('[data-testid="library-census"]').getAttribute('data-lessons'));
    expect(lessons).toBeGreaterThan(600);
    // The fold line is the census of exactly what the app mounted — more than
    // the catalog descriptors alone, since the shell's own courses ride in.
    const summary = panel.querySelector('summary').textContent;
    expect(summary).toMatch(/The library — [\d,]+ lessons in \d+ courses · [\d,]+ of [\d,]+ readings written · [\d,]+ whole in every version and part · [\d,]+ waiting/);
    expect(host.querySelector('[data-testid="library-whole"]')).toBeTruthy();
    expect(host.querySelector('[data-testid="library-waiting"]')).toBeTruthy();
    expect(host.querySelectorAll('[data-testid="library-census"] tbody tr').length).toBeGreaterThan(40);
    const queue = host.querySelector('[data-testid="library-queue"]');
    expect(queue.querySelectorAll('li').length).toBe(12);
    expect(queue.textContent).toMatch(/waits for the (Child|Youth|Teen|Adult|Senior) version|waits for (an exam|benefits|talking points|a run of show)/);
    expect(host.querySelector('[data-testid="library-how"]').textContent).toMatch(/How the library is managed/);
    expect(host.querySelector('[data-testid="library-how"]').textContent).toMatch(/How learning is measured/);
  });
});
