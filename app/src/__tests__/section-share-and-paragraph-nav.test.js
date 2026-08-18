// =============================================================================
// Section share + paragraph navigation (Darrell 2026-08-15)
// =============================================================================
// "a button to copy or share any section as the text... an intro to that
// lesson for each section... prompts the interest of the two people" — and —
// "a way to get back to the top or relisten to the last paragraph or pages/s
// and forward to the whatever number of page/s".
//
// The share payload is the invitation: the section's own text as the body,
// the lesson named, the exact-lesson link attached. The navigation maps the
// reader's sentence segments onto real paragraph blocks so Back/Forward move
// by the unit a listener thinks in.
import { describe, it, expect } from 'vitest';
import { sectionSharePayload, sectionShareText } from '../lib/lesson-links.js';
import { buildFollowMap, paragraphStarts, paragraphJumpTarget } from '../lib/read-follow.js';

const MODULE = { id: 'll1-test', title: 'The Snare of the Fear of Man', bigIdea: 'Fear of man is a snare.' };

describe('sectionSharePayload — the section is the invitation', () => {
  it('carries the section text as the body, the lesson named, and the link', () => {
    const p = sectionSharePayload(MODULE, {
      label: 'Anchor — Proverbs 29:25',
      text: 'The fear of man bringeth a snare.',
      url: 'https://poetech.us/?view=church&sub=learn&course=living&lesson=ll1-test',
      courseTitle: 'Living Lessons',
    });
    expect(p.title).toContain('Anchor — Proverbs 29:25');
    expect(p.title).toContain('The Snare of the Fear of Man');
    expect(p.text).toContain('The fear of man bringeth a snare.');
    expect(p.text).toContain('Living Lessons, The Love Corner');
    expect(p.url).toContain('lesson=ll1-test');
  });

  it('never renders an empty body — falls back to the title', () => {
    const p = sectionSharePayload(MODULE, { label: 'The big idea', text: '', url: '' });
    expect(p.text.length).toBeGreaterThan(0);
  });
});

describe('sectionShareText — the copy block', () => {
  it('names the section and lesson, quotes the text, links the lesson', () => {
    const t = sectionShareText(MODULE, {
      label: 'The big idea', text: 'Fear of man is a snare.', url: 'https://x/?lesson=ll1-test',
    });
    expect(t).toMatch(/^The big idea — from The Snare of the Fear of Man/);
    expect(t).toContain('Fear of man is a snare.');
    expect(t).toContain('Read the whole lesson: https://x/?lesson=ll1-test');
  });
});

describe('paragraphStarts — sentences grouped by their real blocks', () => {
  it('starts a paragraph at each block element', () => {
    const root = document.createElement('div');
    root.innerHTML = '<p>One sentence. Two sentence.</p><p>Three sentence.</p><ul><li>Four sentence.</li></ul>';
    document.body.appendChild(root);
    const follow = buildFollowMap(root);
    const starts = paragraphStarts(follow);
    // 4 sentences across 3 blocks: starts at segment 0 (first <p>),
    // segment 2 (second <p>), segment 3 (the <li>).
    expect(follow.segments.length).toBe(4);
    expect(starts).toEqual([0, 2, 3]);
    root.remove();
  });
});

describe('paragraphJumpTarget — the unit a listener thinks in', () => {
  const starts = [0, 3, 7, 12];
  it('Back mid-paragraph re-listens THIS paragraph', () => {
    expect(paragraphJumpTarget(starts, 5, -1)).toBe(3);
  });
  it('Back at a paragraph start walks to the PREVIOUS one', () => {
    expect(paragraphJumpTarget(starts, 7, -1)).toBe(3);
  });
  it('Back at the very top stays at the top (never negative)', () => {
    expect(paragraphJumpTarget(starts, 0, -1)).toBe(0);
  });
  it('Forward skips to the next paragraph start', () => {
    expect(paragraphJumpTarget(starts, 5, 1)).toBe(7);
  });
  it('Forward in the last paragraph has nowhere to go — null, not a crash', () => {
    expect(paragraphJumpTarget(starts, 13, 1)).toBe(null);
  });
  it('an empty map yields null for either direction', () => {
    expect(paragraphJumpTarget([], 0, 1)).toBe(null);
    expect(paragraphJumpTarget([], 0, -1)).toBe(null);
  });
});
