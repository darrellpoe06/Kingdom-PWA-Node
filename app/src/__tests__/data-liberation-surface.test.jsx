// =============================================================================
// Your Data surface — live render proof (Verification Doctrine: observe the REAL
// surface, not just the pure logic). The lib tests prove canDelete() refuses;
// these prove the SCREEN refuses, which is the thing a person actually meets.
//
// The defect being guarded: a user reaches the last step, the "free up the
// space" action is showing, they tap it, and their originals are gone while
// their copy was silently incomplete. lib/data-liberation can be perfect and
// this can still happen if the component renders the action anyway. So the
// assertion is about ABSENCE — the advance control must not be in the DOM until
// both confirmations are ticked.
//
// Also proves the audience requirements Darrell set (2026-08-11: "user
// friendly... we have elderly users", "kids elderly and all ages... even
// experts"): plain language with no jargon on the default path, real tap-target
// sizes, and an expert view that unfolds without ever bypassing the gate.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import DataLiberation from '../components/DataLiberation.jsx';
import { VENDORS } from '../lib/data-liberation.js';

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

const render = () => act(() => root.render(createElement(DataLiberation)));
const text = () => container.textContent || '';
const buttons = () => Array.from(container.querySelectorAll('button, a'));
const findByText = (re) => buttons().find((b) => re.test(b.textContent || ''));
const click = (el) => act(() => {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
});

/** Walk the guided path to the step just before deleting. */
const advanceTo = (stopAfter) => {
  for (let i = 0; i < stopAfter; i += 1) {
    const next = findByText(/I have done this/i);
    if (!next) break;
    click(next);
  }
};

describe('choosing a service', () => {
  it('opens on a plain question, not a wall of options', () => {
    render();
    expect(text()).toMatch(/Bring your things home/i);
    expect(text()).toMatch(/Where are your things now\?/i);
  });

  it('offers every vendor by a name a person would recognise', () => {
    render();
    for (const v of VENDORS) {
      expect(text(), `${v.name} must be offered`).toContain(v.name);
    }
  });

  it('reassures before anything is chosen that nothing gets deleted first', () => {
    render();
    expect(text()).toMatch(/[Nn]othing is deleted/);
  });
});

describe('the guided path is readable by anyone', () => {
  beforeEach(() => {
    render();
    click(findByText(/Google Photos/i));
  });

  it('shows exactly one step, numbered in words a person can place themselves in', () => {
    expect(text()).toMatch(/Step 1 of 5/);
    expect(text()).toMatch(/What to do now/i);
  });

  it('uses NO jargon on the default path', () => {
    // The words a nervous first-timer must never have to decode. "Takeout" is
    // allowed only where it is the literal name printed on Google's own page.
    const body = text();
    for (const jargon of [/\bbyte\b/i, /\bsha256\b/i, /\bmbox\b/i, /\bsidecar\b/i, /\bmetadata\b/i, /\bverif(y|ied|ication)\b/i]) {
      expect(body, `jargon ${jargon} must not appear on the simple path`).not.toMatch(jargon);
    }
  });

  it('gives every control a real tap target for unsteady hands', () => {
    for (const el of buttons()) {
      const h = el.style.minHeight || el.style.height;
      // Every interactive element declares its own height; none rely on default.
      expect(h, `control "${(el.textContent || '').slice(0, 28)}" needs an explicit tap height`).toBeTruthy();
      expect(parseInt(h, 10)).toBeGreaterThanOrEqual(44);
    }
  });

  it('always offers a way back out', () => {
    expect(findByText(/Choose something else/i)).toBeTruthy();
  });
});

describe('THE SAFETY GATE — the screen must refuse, not just the library', () => {
  beforeEach(() => {
    render();
    click(findByText(/Google Photos/i));
    advanceTo(4); // -> requested -> building -> ready -> LANDED (the check step)
  });

  it('reaches the last step and asks for two separate confirmations', () => {
    expect(text()).toMatch(/Before anything is deleted/i);
    expect(container.querySelectorAll('input[type="checkbox"]').length).toBe(2);
  });

  it('does NOT render the delete action while both boxes are unticked', () => {
    expect(findByText(/freed up the space/i)).toBeFalsy();
    expect(text()).toMatch(/Tick both boxes/i);
  });

  it('still does NOT render it with only the files-open box ticked', () => {
    const boxes = container.querySelectorAll('input[type="checkbox"]');
    act(() => {
      boxes[0].checked = true;
      boxes[0].dispatchEvent(new Event('click', { bubbles: true }));
      boxes[0].dispatchEvent(new Event('change', { bubbles: true }));
    });
    expect(findByText(/freed up the space/i)).toBeFalsy();
  });

  it('explains WHY in plain words — a copy can look fine and be incomplete', () => {
    expect(text()).toMatch(/missing/i);
    expect(text()).toMatch(/looks perfectly fine|still looks/i);
  });

  it('never blames the person — the company sent it incomplete', () => {
    expect(text()).toMatch(/a company sends your copy with things missing/i);
  });
});

describe('experts get everything at once, and the gate is not one of the things they skip', () => {
  beforeEach(() => {
    render();
    click(findByText(/Google Photos/i));
  });

  it('offers the unfold in plain words, not "advanced"', () => {
    const toggle = findByText(/all the steps at once/i);
    expect(toggle).toBeTruthy();
    expect(text()).not.toMatch(/\badvanced\b/i);
  });

  it('unfolds the full list with the technical detail an expert wants', () => {
    click(findByText(/all the steps at once/i));
    expect(text()).toMatch(/All steps at once/i);
    expect(text()).toMatch(/takeout\.google\.com/);
    expect(text()).toMatch(/Link window/i);
    expect(text()).toMatch(/infra\/nas-photos-archive/);
  });

  it('states provenance rather than implying it', () => {
    click(findByText(/all the steps at once/i));
    expect(text()).toMatch(/Verified 2026-08-11/);
  });

  it('DOES NOT expose a delete action from the expert view at step 1', () => {
    click(findByText(/all the steps at once/i));
    expect(findByText(/freed up the space/i)).toBeFalsy();
  });
});

describe('a vendor we did not verify says so, instead of pretending', () => {
  it('warns that the vendor may have changed their pages', () => {
    render();
    click(findByText(/Amazon Photos/i));
    expect(text()).toMatch(/changes their pages/i);
  });
});
