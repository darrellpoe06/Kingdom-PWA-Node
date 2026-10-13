// @vitest-environment jsdom
// RE-OPENING THE LESSON YOU ALREADY OPENED MUST STILL ARRIVE.
// =============================================================================
// Darrell 2026-09-13: "Links don't work in last played."
//
// THE DEFECT, and why it hid. The arrival effect was keyed on `resumeLessonId`.
// Setting that state to the SAME id React treats as a no-op — the render is
// skipped, the effect never re-runs, and the tap does absolutely nothing. No
// error, no console warning, no half-open state. Just a button that does not
// work.
//
// It was invisible on the main schedule list, where you rarely tap the lesson
// you just left. It was the NORMAL case on "Recently opened", which is BY
// DEFINITION the list of lessons you have already opened — so the most likely
// tap on that row was the one guaranteed to do nothing.
//
// The fix makes the arrival an EVENT rather than a VALUE: a counter rises on
// every open(), and the effect watches it too.
//
// These tests pin the PROPERTY (a repeated arrival still fires) on a minimal
// component with the same shape, rather than mounting the whole Learn tree —
// what regressed was the dependency wiring, and that is what is asserted.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import React, { useState, useEffect } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container; let root;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

// The shape of the real wiring: an outer that sets the target, an inner whose
// effect performs the arrival.
function Harness({ arrivals, withNonce }) {
  const [lessonId, setLessonId] = useState(null);
  const [nonce, setNonce] = useState(0);
  const open = (id) => { setLessonId(id); setNonce((n) => n + 1); };
  return (
    <>
      <button type="button" onClick={() => open('lesson-a')}>Open A</button>
      <button type="button" onClick={() => open('lesson-b')}>Open B</button>
      <Inner lessonId={lessonId} nonce={nonce} arrivals={arrivals} withNonce={withNonce} />
    </>
  );
}

function Inner({ lessonId, nonce, arrivals, withNonce }) {
  useEffect(() => {
    if (!lessonId) return;
    arrivals.push(lessonId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, withNonce ? [lessonId, nonce] : [lessonId]);
  return <div data-testid="open">{lessonId || 'none'}</div>;
}

const click = (re) => act(() => {
  [...container.querySelectorAll('button')].find((b) => re.test(b.textContent)).click();
});

describe('the defect, reproduced', () => {
  it('WITHOUT the nonce, re-tapping the same lesson is a dead button', () => {
    const arrivals = [];
    act(() => root.render(<Harness arrivals={arrivals} withNonce={false} />));
    click(/Open A/);
    expect(arrivals).toEqual(['lesson-a']);
    click(/Open A/);          // the same lesson again — the "Recently opened" case
    expect(arrivals, 'this is the bug: the second tap does nothing').toEqual(['lesson-a']);
  });

  it('and it hid because a DIFFERENT lesson always worked', () => {
    const arrivals = [];
    act(() => root.render(<Harness arrivals={arrivals} withNonce={false} />));
    click(/Open A/);
    click(/Open B/);
    expect(arrivals).toEqual(['lesson-a', 'lesson-b']);
  });
});

describe('the fix', () => {
  it('WITH the nonce, re-tapping the same lesson arrives every time', () => {
    const arrivals = [];
    act(() => root.render(<Harness arrivals={arrivals} withNonce />));
    click(/Open A/);
    click(/Open A/);
    click(/Open A/);
    expect(arrivals).toEqual(['lesson-a', 'lesson-a', 'lesson-a']);
  });

  it('and switching between lessons still works', () => {
    const arrivals = [];
    act(() => root.render(<Harness arrivals={arrivals} withNonce />));
    click(/Open A/);
    click(/Open B/);
    click(/Open A/);
    expect(arrivals).toEqual(['lesson-a', 'lesson-b', 'lesson-a']);
  });
});

describe('the real component carries the wiring', () => {
  // Source-pinned: what regressed was the dependency array and the prop chain.
  it('ChurchLearn passes a rising nonce and the effect watches it', async () => {
    const { readFileSync } = await import('node:fs');
    const { join, dirname } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const here = dirname(fileURLToPath(import.meta.url));
    const src = readFileSync(join(here, '..', 'components', 'ChurchLearn.jsx'), 'utf8');
    // the effect must depend on the nonce, or a repeated open is dead again
    expect(src).toMatch(/\[resumeLessonId, resumeOpenGuide, resumeNonce\]/);
    // open() must bump it
    expect(src).toMatch(/setResumeLessonId\(id\);\s*setResumeNonce\(\(n\) => n \+ 1\)/);
    // and it must actually reach the child
    expect(src).toMatch(/resumeNonce=\{resumeNonce\}/);
  });
});
