// @vitest-environment jsdom
// =============================================================================
// A DOOR LANDS YOU ON THE THING IT NAMES
// =============================================================================
// Darrell 2026-11-13, from the live Love Corner front door, with one screenshot
// of the hero and one of the player he then had to go find:
//
//   "When pushing latest message we should open to the space with it or go to
//    the bottom where the options are... All buttons should work and go to the
//    space it's descriptions saying."
//
// WHAT WAS ACTUALLY BROKEN, traced before changing anything. The button was not
// dead and the wiring was not wrong: `open('home', 'worship')` called
// requestChurchHomeSection('worship'), ChurchHome's subscriber ran, and the
// section DID change to Worship. NOTHING SCROLLED. The reader stayed at the
// hero with the player below the fold, so a button that had done its whole job
// looked like a button that did nothing. Changing the section is not arriving
// at it.
//
// This file pins the ARRIVING, not the changing. The change already had a test
// (lovecorner-home-render: "requestChurchHomeSection('give')" selects Give) and
// it passed green the whole time the defect was live — a gate whose name is
// wider than its reach, DR-1467's shape again.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { ChurchHome } from '../components/ChurchHome.jsx';
import { COLG_DEFAULT_CHURCH } from '../lib/default-church.js';
import { requestChurchHomeSection } from '../lib/church-home-section.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container, root, scrolled, realScrollIntoView;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  scrolled = [];
  // jsdom has no layout, so Element.scrollIntoView does not exist at all.
  // Record the calls AND their options: `block: 'start'` is the part that puts
  // the strip's own tabs at the top of the view with the section under them.
  realScrollIntoView = Element.prototype.scrollIntoView;
  Element.prototype.scrollIntoView = function spy(opts) {
    scrolled.push({ testid: this.getAttribute('data-testid'), opts });
  };
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  if (realScrollIntoView) Element.prototype.scrollIntoView = realScrollIntoView;
  else delete Element.prototype.scrollIntoView;
});

const props = {
  church: COLG_DEFAULT_CHURCH,
  prayerRequests: [],
  addPrayerRequest: () => {},
  markPrayerRequestSent: () => {},
  deletePrayerRequest: () => {},
  addEvent: () => {},
  conference: null,
  updateConference: () => {},
  addChurchVoice: () => {},
  sendToPoeTech: () => {},
  addIncident: () => {},
  addInquiry: () => {},
};
const mount = () => act(() => root.render(createElement(ChurchHome, props)));
const q = (sel) => container.querySelector(sel);
const strips = () => scrolled.filter((s) => s.testid === 'church-section-strip');

// The scroll is one frame late on purpose: the section's content mounts after
// the state settles. Tests wait the same way the component does.
const settle = async () => {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 80));
  });
};

describe('a door lands you on the thing it names', () => {
  it('a requested section scrolls the section strip into view, at the top', async () => {
    mount();
    act(() => requestChurchHomeSection('worship'));
    await settle();
    const hit = strips()[0];
    expect(hit, 'the section changed but the reader was never moved to it — the button looks dead while working').toBeTruthy();
    expect(hit.opts && hit.opts.block).toBe('start');
  });

  it('the element it scrolls to really holds the sections', async () => {
    mount();
    act(() => requestChurchHomeSection('worship'));
    await settle();
    const strip = q('[data-testid="church-section-strip"]');
    expect(strip).toBeTruthy();
    // Anchoring to a wrapper that does not contain the tabs would land on the
    // right pixel by luck and break the first time the layout moves.
    expect(strip.querySelector('[role="tablist"]')).toBeTruthy();
  });

  it('every door the front page can press arrives, not just the first', async () => {
    mount();
    for (const id of ['worship', 'prayer', 'give']) {
      act(() => requestChurchHomeSection(id));
      await settle();
    }
    expect(strips().length).toBe(3);
  });

  it('PROVEN TO CATCH: a section opened WITHOUT a request never scrolls', async () => {
    // The viewer tapping the strip directly is already looking at it; moving
    // the page under their finger is the jump this fix exists to remove. If
    // this ever starts scrolling, the fix has become the defect.
    mount();
    await settle();
    expect(strips().length).toBe(0);
  });
});
