// =============================================================================
// The lessons one person chose, how far, at what level (DR-0844)
// =============================================================================
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { lessonsWalked, walkedLine } from '../lib/lessons-walked.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const H = vi.hoisted(() => ({ records: [], error: null }));
vi.mock('../lib/learner-records-sync.js', () => ({ fetchLearnerRecords: async () => (H.error ? { records: [], error: H.error } : { records: H.records }) }));
vi.mock('../lib/lesson-pipeline.js', () => ({ findLessonInCatalog: (id) => (String(id).endsWith('l197') ? { lessonId: 'l197', courseKey: 'living-lessons', title: 'Think Soberly', number: 'L197' } : null) }));

import LessonsWalked from '../components/LessonsWalked.jsx';

const ROWS = [
  { user_id: 'u-me', lesson_id: 'l197', course_key: 'living-lessons', age_band: 'adult', completed_at: '2026-10-08T10:00:00Z', quiz_pct: 92, quiz_passed: true, quiz_attempts: 2, quiz_at: '2026-10-08T10:30:00Z', updated_at: '2026-10-08T10:30:00Z' },
  { user_id: 'u-me', lesson_id: 'l150', course_key: 'living-lessons', age_band: 'adult', completed_at: null, quiz_pct: 75, quiz_passed: true, quiz_attempts: 1, quiz_at: '2026-10-01T10:00:00Z', updated_at: '2026-10-01T10:00:00Z' },
  { user_id: 'u-me', lesson_id: 'w1', course_key: 'sovereign-ai', age_band: 'teen', completed_at: '2026-09-20T10:00:00Z', quiz_pct: null, quiz_attempts: 0, updated_at: '2026-09-20T10:00:00Z' },
  { user_id: 'u-other', lesson_id: 'l197', course_key: 'living-lessons', completed_at: '2026-10-08T10:00:00Z', quiz_attempts: 3, updated_at: '2026-10-08T10:00:00Z' },
];

describe('the walk (pure)', () => {
  it('keeps one person\'s lessons, newest first, named from the catalog, banded, and counted by course and level', () => {
    const w = lessonsWalked(ROWS, 'u-me', { titleOf: (id) => (id === 'l197' ? 'L197 Think Soberly' : null) });
    expect(w.lessons.map((l) => [l.title, l.completed, l.band, l.attempts, l.lastAt])).toEqual([
      ['L197 Think Soberly', true, 'mastered', 2, '2026-10-08'],
      ['l150', false, 'passing', 1, '2026-10-01'],
      ['w1', true, 'not-yet', 0, '2026-09-20'],
    ]);
    expect(w.counts).toEqual({ lessons: 3, completed: 2, attempts: 3, tested: 2, bands: { mastered: 1, strong: 0, passing: 1, working: 0, 'not-yet': 1 } });
    expect(w.byCourse).toEqual([{ courseKey: 'living-lessons', lessons: 2, completed: 1, attempts: 3 }, { courseKey: 'sovereign-ai', lessons: 1, completed: 1, attempts: 0 }]);
    expect(w.byLevel).toEqual([{ level: 'adult', n: 2 }, { level: 'teen', n: 1 }]);
    expect(walkedLine(w)).toBe('3 lessons walked, 2 completed, across 2 courses · levels: 2 at adult, 1 at teen · tested 2 (1 mastered, 1 passing; 3 attempts) · last 2026-10-08.');
    expect(walkedLine(lessonsWalked(ROWS, 'u-nobody'))).toBe('No lesson walked yet.');
    expect(lessonsWalked(ROWS, null).counts.lessons).toBe(4);
  });
});

describe('the fold, rendered', () => {
  let container; let root;
  afterEach(() => { if (root) act(() => root.unmount()); if (container) container.remove(); root = container = null; H.records = []; H.error = null; });
  async function mount(props) {
    container = document.createElement('div'); document.body.appendChild(container);
    await act(async () => { root = createRoot(container); root.render(createElement(LessonsWalked, props)); });
    await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
  }
  it('carries the goal, the line, and each lesson with its level and band; compact keeps the line only', async () => {
    H.records = ROWS;
    await mount({ userId: 'u-me' });
    expect(container.textContent).toContain('filled with Yahweh’s perspectives, explicitly, the Highest Authority and Level');
    expect(container.querySelector('[data-testid="lessons-walked-line"]').textContent).toContain('3 lessons walked, 2 completed');
    const rows = Array.from(container.querySelectorAll('[data-testid="lessons-walked-row"]'));
    expect(rows.map((r) => r.getAttribute('data-band'))).toEqual(['mastered', 'passing', 'not-yet']);
    expect(rows[0].textContent).toContain('L197 Think Soberly · living-lessons · adult · completed · Mastered (92%, 2 attempts) · 2026-10-08');
    expect(container.textContent).toContain('opens are not recorded per lesson');
    await act(async () => root.unmount()); root = null; container.remove();
    await mount({ userId: 'u-me', compact: true });
    expect(container.querySelectorAll('[data-testid="lessons-walked-row"]').length).toBe(0);
    expect(container.querySelector('[data-testid="lessons-walked-line"]').textContent).toContain('3 lessons walked');
  });
  it('says when the records could not be read', async () => {
    H.error = new Error('permission denied');
    await mount({ userId: 'u-me' });
    expect(container.querySelector('[data-testid="lessons-walked-reason"]').textContent).toContain('permission denied');
  });
});
