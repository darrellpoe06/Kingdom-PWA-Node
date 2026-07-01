// =============================================================================
// EternalAlgorithmsStudy — live render proof (DR-0076: observe the REAL surface).
// Mounts the actual public study component and proves, on the rendered DOM:
//   - the "Eternal Algorithms" series banner + the if/then decision-logic frame;
//   - study #1 (Conditional Truth) with a Scripture-anchored teaching section
//     whose verse renders as VERBATIM public-domain KJV text (not painted);
//   - the interactive self-examination is present and persists an answer;
//   - the belief-vs-action round runs and shows the Yahweh-axis mirror.
// A separate assertion confirms it is PUBLIC — it renders for a signed-out /
// non-circle visitor (no circle gate), unlike the private Study.
// =============================================================================
import { describe, it, expect, beforeEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import EternalAlgorithmsStudy from '../components/EternalAlgorithmsStudy.jsx';
import { kjvText } from '../lib/scriptures.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container, root;
const clickEl = async (el) => { await act(async () => { el.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); }); };
const btn = (re) => [...container.querySelectorAll('button')].find((b) => re.test((b.textContent || '').trim()));
const btns = (re) => [...container.querySelectorAll('button')].filter((b) => re.test((b.textContent || '').trim()));

beforeEach(() => { try { localStorage.clear(); } catch { /* no storage */ } });

async function mount(props = {}) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(EternalAlgorithmsStudy, { email: 'visitor@example.com', view: 'church', churchView: 'eternal-algorithms', ...props }));
  });
}

describe('EternalAlgorithmsStudy — the public series surface renders faithfully', () => {
  it('shows the series banner, the decision-logic frame, and study #1', async () => {
    await mount();
    const text = container.textContent || '';
    expect(text).toMatch(/Eternal Algorithms/);
    expect(text).toMatch(/if \/ then/i);
    expect(text).toMatch(/beyond our comprehension/i);         // reverent, not reduced
    expect(text).toMatch(/piecing together the Truth/i);        // humble-seeking posture
    expect(text).toMatch(/Study 1 · Conditional Truth/);
  });

  it('renders a teaching verse as verbatim public-domain KJV text (not painted)', async () => {
    await mount();
    // Deuteronomy 30:19 is the first section's primary ref; its KJV text is bundled.
    const kjv = kjvText('Deuteronomy 30:19');
    expect(kjv).toMatch(/choose life/);
    expect(container.textContent).toContain(kjv.slice(0, 40)); // the real verse is on screen
  });

  it('is PUBLIC — it renders for a non-circle visitor with no locked message', async () => {
    await mount({ email: 'nobody@example.com' });
    expect(container.textContent).not.toMatch(/locked|for the circle only|not available/i);
    expect(container.textContent).toMatch(/Examine yourself/);
  });

  it('the self-examination persists an honest answer on this device', async () => {
    await mount();
    const area = container.querySelector('#probe-doer-not-hearer');
    expect(area).toBeTruthy();
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      setter.call(area, 'I avoided the hard conversation');
      area.dispatchEvent(new window.Event('input', { bubbles: true }));
    });
    // saved to device-local storage (sovereign)
    const stored = JSON.parse(localStorage.getItem('poetech.eastudy.v1:visitor@example.com') || '{}');
    expect(stored['doer-not-hearer'].probe).toBe('I avoided the hard conversation');
    // the mirror (mercy + accountability) is revealed once engaged
    expect(container.textContent).toMatch(/looking without forgetting|gap named/i);
  });

  it('runs the belief-vs-action round and shows the Yahweh-axis mirror', async () => {
    await mount();
    await clickEl(btn(/Run the belief-vs-action round/));
    const text0 = container.textContent || '';
    expect(text0).toMatch(/I do the word/);                     // the redemption choice is offered
    // pick the "do the word" choice on the first card
    const doWord = btns(/I do the word — close the gap/)[0];
    expect(doWord).toBeTruthy();
    await clickEl(doWord);
    const text = container.textContent || '';
    expect(text).toMatch(/measured by Yahweh/i);                // the axis mirror shows
    expect(text).toMatch(/Kingdom-weighted total/i);
    expect(text).toMatch(/mirror, not a verdict/i);
  });
});
