// @vitest-environment node
// A SLIDE IS NOT A BIBLIOGRAPHY, AND PLAY STARTS THE LESSON.
// =============================================================================
// Darrell 2026-09-13, from a real slide and a real lesson list:
//   "the PowerPoints have too many references so we need to fix that somehow"
//   "Let the Play buttons just start the lessons"
//   "Recently Opened should be links like the others so users can click where
//    they were!!! Also the last lessons dont click when you click them"
//
// The reference overload is OURS. A lesson's anchor carries every reference the
// WHOLE lesson stands on — L149's is eighty — and the opener slide printed the
// entire string. On a projector that is a wall of green semicolons with no
// teaching visible: a LIST rendered as content, the same defect as the reader
// performing the index (DR-0391).
//
// The cap must be HONEST, never a silent truncation — a room that cannot see
// there are more has been told something false — and the full list must survive
// where a list belongs: the presenter's notes.
import { describe, it, expect } from 'vitest';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { lessonPresentable, slideAnchorRefs, SLIDE_REF_MAX, OPENER_REF_MAX } from '../lib/presentable.js';

const L149 = LIVING_LESSONS_MODULES.find((m) => m.id.startsWith('ll149'));

describe('slideAnchorRefs — capped, and honest about it', () => {
  it('leaves a short list alone', () => {
    expect(slideAnchorRefs('John 3:16; Romans 5:8')).toBe('John 3:16; Romans 5:8');
  });
  it('caps a long list and SAYS how many are hidden', () => {
    const many = Array.from({ length: 20 }, (_, i) => `John ${i + 1}:1`).join('; ');
    const out = slideAnchorRefs(many);
    expect(out.split(';').length).toBeLessThanOrEqual(SLIDE_REF_MAX + 1);
    expect(out).toMatch(/\+14 more/);
  });
  it('NEVER truncates silently — the count is always present when it caps', () => {
    const many = Array.from({ length: 40 }, (_, i) => `Acts ${i + 1}:1`).join('; ');
    expect(slideAnchorRefs(many)).toMatch(/\+\d+ more/);
  });
  it('is total on junk input', () => {
    expect(slideAnchorRefs('')).toBe('');
    expect(slideAnchorRefs(null)).toBe('');
    expect(slideAnchorRefs(undefined)).toBe('');
  });
  it('honours an explicit max', () => {
    const many = 'A 1:1; B 1:1; C 1:1; D 1:1';
    expect(slideAnchorRefs(many, 2)).toBe('A 1:1; B 1:1 +2 more');
  });
});

describe('the real corpus — no slide carries a wall of references', () => {
  it('L149 has eighty anchors, and the ROOM sees a handful', () => {
    expect(L149.anchor.ref.split(';').length).toBeGreaterThan(40);
    for (const sc of lessonPresentable(L149, { level: 'senior' }).scenes) {
      const ref = sc.audience?.anchorRef;
      if (!ref) continue;
      const shown = ref.split(';').length;
      expect(shown, `${sc.indexLabel} prints ${shown} references`).toBeLessThanOrEqual(OPENER_REF_MAX + 1);
      expect(ref).toMatch(/\+\d+ more/);
    }
  });

  it('holds across EVERY lesson, not just the one that was reported', () => {
    const offenders = [];
    for (const m of LIVING_LESSONS_MODULES) {
      for (const sc of lessonPresentable(m, { level: 'senior' }).scenes) {
        const ref = sc.audience?.anchorRef;
        if (ref && ref.split(';').length > OPENER_REF_MAX + 1) offenders.push(`${m.id} · ${sc.indexLabel}`);
      }
    }
    expect(offenders, `slides printing a bibliography:\n  ${offenders.slice(0, 8).join('\n  ')}`).toEqual([]);
  });

  it('the verbatim block on a TEACHING slide is capped', () => {
    for (const sc of lessonPresentable(L149, { level: 'senior' }).scenes) {
      if (/The Word we stood on/.test(sc.audience?.title || '')) continue;  // the reference slide, below
      const block = String(sc.audience?.scripture || '').split('\n').filter(Boolean);
      if (!block.length) continue;
      expect(block.length, sc.indexLabel).toBeLessThanOrEqual(SLIDE_REF_MAX + 1);
    }
  });

  it('THE LIST LIVES AT THE END — the closing slide carries every reference', () => {
    // Darrell 2026-09-13: "Put the list of links at the end of lessons for
    // reference purposes... so it doesn't take away from the lessons." The cap
    // protects the TEACHING slides; the reference slide is the place the whole
    // list belongs, because it is last and competes with nothing.
    const scenes = lessonPresentable(L149, { level: 'senior' }).scenes;
    const recap = scenes[scenes.length - 1];
    expect(recap.audience.title).toMatch(/The Word we stood on/);
    const lines = String(recap.audience.scripture || '').split('\n').filter(Boolean);
    expect(lines.length).toBeGreaterThan(40);
    // and it does NOT also repeat the bare anchor list above the verses
    expect(recap.audience.anchorRef).toBeFalsy();
  });

  it('and the opener names only what the session opens ON', () => {
    const scenes = lessonPresentable(L149, { level: 'senior' }).scenes;
    const opener = scenes.find((sc) => sc.audience?.anchorRef && !/title/i.test(sc.id));
    expect(opener.audience.anchorRef.split(';').length).toBeLessThanOrEqual(OPENER_REF_MAX + 1);
  });

  it('and NOTHING is lost — the presenter still holds the full list', () => {
    const notes = lessonPresentable(L149, { level: 'senior' }).scenes
      .flatMap((sc) => sc.notes || []);
    const longest = Math.max(...notes.map((n) => (Array.isArray(n.items) ? n.items.length : 0)));
    expect(longest, 'the full Scripture list must survive in the notes').toBeGreaterThan(40);
  });
});

describe('Play READS the lesson (it does not open the deck)', () => {
  // RE-POINTED 2026-09-14. This pinned the previous attempt: Play opening the
  // presenter already-presenting via setPresentAutoStart. Darrell, in capitals:
  // "Play Button reads the lesson!!!!! Does not open the PowerPoint!!!" Proven
  // by DRIVING the built app -- pressing Play gave 0 speech calls and opened the
  // presenter; after the fix it gives real speech and the presenter stays shut.
  it('both Play routes ask for a reading rather than presenting', async () => {
    const { readFileSync } = await import('node:fs');
    const { join, dirname } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const here = dirname(fileURLToPath(import.meta.url));
    const learn = readFileSync(join(here, '..', 'components', 'ChurchLearn.jsx'), 'utf8');
    // the card's Play and the by-title index's Play both request a read
    expect((learn.match(/requestRead\(m\.id\)/g) || []).length).toBeGreaterThanOrEqual(2);
    // and neither opens the presenter any more
    expect(learn).not.toMatch(/setPresentAutoStart\(true\)/);
  });
});

describe('Recently opened is a link, like the ones below it', () => {
  it('is styled as a link rather than a bordered chip', async () => {
    const { readFileSync } = await import('node:fs');
    const { join, dirname } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const here = dirname(fileURLToPath(import.meta.url));
    const src = readFileSync(join(here, '..', 'components', 'ChurchLearn.jsx'), 'utf8');
    // anchor on the JSX label, not on a code comment that mentions it
    const i = src.indexOf('>Recently opened<');
    expect(i, 'the Recently opened row must exist').toBeGreaterThan(0);
    const block = src.slice(i, i + 2600);
    expect(block).toMatch(/underline/);
    expect(block).toMatch(/min-h-\[44px\]/);      // the house tap floor, not 36
    expect(block).not.toMatch(/border border-\[#E8E4DC\]/); // the old chip border
  });
});
