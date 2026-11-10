// @vitest-environment jsdom
// =============================================================================
// A lesson row's title is never crushed by its buttons (DR-1397)
// =============================================================================
// Darrell's A++ screenshot, 2026-11-10 ("Fix it"): in the Latest list the row
// "Nov 6, 2026 · Living Lessons from the Word · L287 · Spoken in the Break..."
// stood one word per line, because the title was allowed to shrink to nothing
// (flex-1 min-w-0) while CONTINUE · ALL READ and ▶ PLAY held their width beside
// it. The title now claims 12rem before it will share the line (and rem grows
// with the text size), so at a large size the buttons wrap below the title;
// a long word wraps inside it.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import LatestLessons from '../components/LatestLessons.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const FLOOR = 'flex-[1_1_12rem]';

describe('a lesson row keeps room for its title', () => {
  it('in the Latest list, every row title claims 12rem and wraps long words, beside Continue and Play', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    const schedule = [1, 2, 3, 4, 5, 6].map((i) => ({ id: `ll28${i}-x`, title: `Spoken in the Break, Heard in the Light ${i}`, added: `2026-11-0${i}` }));
    const courses = [{ key: 'living-lessons', meta: { title: 'Living Lessons from the Word' }, schedule }];
    act(() => root.render(createElement(LatestLessons, { courses, onOpen: () => {}, onPlay: () => {}, onContinue: () => {} })));
    const rows = [...host.querySelectorAll('li[data-lesson-id]')];
    expect(rows.length).toBeGreaterThan(5);
    for (const li of rows.slice(0, 5)) {
      const title = li.querySelector('button');
      expect(title.className).toContain(FLOOR);
      expect(title.className).toContain('[overflow-wrap:anywhere]');
      expect(li.className).toContain('flex-wrap');
      expect(li.querySelector('[data-testid="latest-play"]'), 'Play is still in the row').toBeTruthy();
    }
    act(() => root.unmount());
    host.remove();
  });

  it('in the course list too (the same row in ChurchLearn)', () => {
    const src = readFileSync(join(process.cwd(), 'src', 'components', 'ChurchLearn.jsx'), 'utf8');
    const at = src.indexOf('<li key={m.id} data-lesson-id={m.id} className="flex flex-wrap items-center gap-2">');
    expect(at).toBeGreaterThan(-1);
    expect(src.slice(at, at + 400)).toContain(FLOOR);
  });

  it('PROVEN TO CATCH: the crushable title (flex-1 min-w-0 with no floor) is gone from both rows', () => {
    for (const f of ['LatestLessons.jsx', 'ChurchLearn.jsx']) {
      const src = readFileSync(join(process.cwd(), 'src', 'components', f), 'utf8');
      expect(src, f).not.toContain('className="flex-1 min-w-0 text-left py-2 min-h-[44px] text-sm');
    }
  });
});
