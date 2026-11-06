// =============================================================================
// The tail is a dropdown, not mandatory (DR-1372)
// =============================================================================
// Darrell, 2026-11-06, scrolling the sixteen-book timeline inside a lesson:
// "This list should be in a tab we can link to not in every lesson it takes
// too long... maybe it can be a drop-down option for reading each lesson
// hidden by default also... the asking others for their testimony should be
// a drop down too.... not read each time!!!!!!!!!!!!" Then: "The timelines
// should be a possible drop-down like a story we add at the end to summarize
// the points... however I like us reading those... not some things." And:
// "Not mandatory!!!!!!"
//
// THREE THINGS THIS GATE HOLDS:
//   1. The voice: readAloudTextFromArc leaves out everything from TALK ABOUT
//      IT TOGETHER to the end, even when the tail is split across segments,
//      and reads it only when asked (includeTalk). The stories stay read.
//   2. The page: LessonProse renders the TALK section inside a closed
//      <details>; the standalone prompts block is a closed <details> too.
//   3. The figures: the timeline/figures block is a closed <details> with the
//      Bible link still inside, so the chart is reviewable, never a wall.
//
// PROVEN-TO-CATCH (DR-0076 §3): with includeTalk the tail comes back word for
// word, so a voice that silently dropped it for good would fail case 1b; a
// <details open> on either fold fails cases 2 and 3.
import React, { act } from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { readAloudTextFromArc } from '../lib/lesson-flow.js';
import { splitTalkTogether, isTalkHeading, segmentsWithoutTalkTail } from '../lib/talk-together.js';
import { lessonTimelineFor } from '../lib/lesson-figures.js';
import { LessonProse } from '../components/ChurchLearn.jsx';
import LessonFigures from '../components/LessonFigures.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const L288 = LIVING_LESSONS_MODULES.find((m) => m.id.startsWith('ll288-'));
const BODY = 'ONE. The first point. TWO. The second point, with a story in it.';
const TAIL = 'TALK ABOUT IT TOGETHER. Parents, ask your children what they saw today. Children, ask your mom or your dad where it lands. Friends, tell one friend this week.';

let root; let host;
function render(el) {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root.render(el));
  return host;
}
afterEach(() => { if (root) act(() => root.unmount()); if (host) host.remove(); root = null; host = null; });

describe('the voice reads the teaching and the stories, not the tail', () => {
  it('splitTalkTogether cuts at the heading and leaves text without one whole', () => {
    expect(splitTalkTogether(`${BODY}\n\n${TAIL}`)).toEqual({ body: BODY, talk: TAIL });
    expect(splitTalkTogether(BODY)).toEqual({ body: BODY, talk: '' });
    expect(isTalkHeading('TALK ABOUT IT TOGETHER.')).toBe(true);
    expect(isTalkHeading('ONE. The first point.')).toBe(false);
  });

  it('a tail split across segments is all tail; the stories before it are all body', () => {
    const segs = [BODY, `Still teaching. ${TAIL}`, 'Youth: a later prompt on its own segment.'];
    const cut = segmentsWithoutTalkTail(segs);
    expect(cut.body).toEqual([BODY, 'Still teaching.']);
    expect(cut.talk).toEqual([TAIL, 'Youth: a later prompt on its own segment.']);
  });

  it('1a. readAloudTextFromArc leaves the tail out by default; 1b. includeTalk brings it back verbatim', () => {
    const arc = {
      audienceSegments: [
        { kind: 'teach', audience: { lessonPlan: { segments: [BODY, TAIL, 'Adult: one more.'] }, stories: [] } },
      ],
    };
    const spoken = readAloudTextFromArc(arc);
    expect(spoken).toContain('The first point');
    expect(spoken).not.toMatch(/TALK ABOUT IT TOGETHER/);
    expect(spoken).not.toContain('one more');
    const asked = readAloudTextFromArc(arc, { includeTalk: true });
    expect(asked).toContain(TAIL);
    expect(asked).toContain('Adult: one more.');
  });

  it('on a real lesson (L288) the default voice stops before TALK ABOUT IT TOGETHER', () => {
    expect(L288).toBeTruthy();
    const arc = { audienceSegments: [{ kind: 'teach', audience: { lessonPlan: { segments: [L288.lesson] }, stories: [] } }] };
    expect(L288.lesson).toMatch(/TALK ABOUT IT TOGETHER/);
    expect(readAloudTextFromArc(arc)).not.toMatch(/TALK ABOUT IT TOGETHER/);
    expect(readAloudTextFromArc(arc, { includeTalk: true })).toMatch(/TALK ABOUT IT TOGETHER/);
  });
});

describe('the page folds the tail closed', () => {
  it('2. LessonProse puts the TALK section in a closed <details>, the body outside it', () => {
    const h = render(<LessonProse text={`${BODY}\n\n${TAIL}`} />);
    const fold = h.querySelector('[data-testid="lesson-prose-talk-fold"]');
    expect(fold).toBeTruthy();
    expect(fold.tagName).toBe('DETAILS');
    expect(fold.hasAttribute('open')).toBe(false);
    expect(fold.textContent).toMatch(/what they saw today/);
    expect(fold.textContent).not.toMatch(/The first point/);
    expect(h.textContent).toMatch(/The first point/);
  });

  it('a lesson without the heading has no fold at all', () => {
    const h = render(<LessonProse text={BODY} />);
    expect(h.querySelector('[data-testid="lesson-prose-talk-fold"]')).toBeNull();
  });
});

describe('the timeline is a closed dropdown at the end, with the Bible link inside', () => {
  it('3. LessonFigures is a closed <details> and the link to the Bible timeline is still there', () => {
    expect(lessonTimelineFor(L288)).toBeTruthy();
    const h = render(<LessonFigures module={L288} />);
    const fold = h.querySelector('[data-testid="lesson-figures"]');
    expect(fold).toBeTruthy();
    expect(fold.tagName).toBe('DETAILS');
    expect(fold.hasAttribute('open')).toBe(false);
    expect(h.querySelector('[data-testid="lesson-figures-summary"]').textContent).toMatch(/optional/i);
    expect(fold.querySelector('[data-testid="lesson-figure-bible-link"]')).toBeTruthy();
  });
});
