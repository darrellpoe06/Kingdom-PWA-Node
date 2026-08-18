// =============================================================================
// The time picker gets out of the way once it has been used
// =============================================================================
// Darrell 2026-08-14, on a phone with the reader running, looking at Pattern 18
// of the Eternal Algorithms: "this aspect is taking up a large part of reading
// area."
//
// He was right. Seven presets plus a minus/plus pair plus a label plus an
// explanatory note is roughly a third of a phone's visible content, sitting
// permanently above the Word — and doing it WHILE the reader read, for a control
// whose job ended the moment he chose 45M.
//
// This is DR-0290's rule one surface over: nothing sits between a reader and
// what they came for. A CHOSEN time collapses to one line that still states the
// choice; an UNCHOSEN one stays open, because then the control IS the task.
//
// (His premise — that this is the presenter's control — is the opposite of the
// truth, and worth pinning so nobody "fixes" it back: DR-0215 built it for the
// LEARNER, and being reachable only from the facilitator panel was the defect.
// The facilitator's own run-of-show passes alwaysOpen.)
//
// PROVEN-TO-CATCH (DR-0076 §3): removing the collapsed branch fails 'collapses
// once a time is chosen'; collapsing an unchosen picker fails 'stays open until
// a choice is made'; dropping alwaysOpen fails the facilitator case.
// @vitest-environment jsdom
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { TimeFit } from '../components/LessonFlow.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container, root;
async function mount(props) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(createElement(TimeFit, props)); });
}
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
});
const buttons = () => [...container.querySelectorAll('button')];
const byText = (re) => buttons().find((b) => re.test(b.textContent || ''));
const byLabel = (re) => buttons().find((b) => re.test(b.getAttribute('aria-label') || ''));
const click = async (el) => { await act(async () => { el.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); }); };

describe('TimeFit', () => {
  it('stays open until a choice is made — then the control IS the task', async () => {
    await mount({ value: null, onChange: () => {} });
    expect(container.querySelector('[role="group"]')).toBeTruthy();
    expect(byText(/^45m$/)).toBeTruthy();
  });

  it('collapses once a time is chosen, giving the reading area back', async () => {
    await mount({ value: 45, onChange: () => {} });
    expect(byText(/^45m$/), 'the seven presets must be gone').toBeFalsy();
    expect(byLabel(/five minutes shorter/i), 'the +/- pair must be gone').toBeFalsy();
    expect(container.querySelector('[role="group"]')).toBeFalsy();
  });

  it('still states the choice while collapsed — it hides, it does not go silent', async () => {
    await mount({ value: 45, onChange: () => {} });
    const strip = byLabel(/paced to 45 minutes/i);
    expect(strip).toBeTruthy();
    expect(strip.textContent).toMatch(/45 min/);
    expect(strip.textContent).toMatch(/nothing is cut/i);
  });

  it('reopens on one tap, so the choice is never a trap', async () => {
    await mount({ value: 45, onChange: () => {} });
    await click(byLabel(/paced to 45 minutes/i));
    expect(byText(/^45m$/)).toBeTruthy();
    expect(byText(/^90m$/)).toBeTruthy();
  });

  it('closes again the moment a new time is picked', async () => {
    const onChange = vi.fn();
    await mount({ value: 45, onChange });
    await click(byLabel(/paced to 45 minutes/i));
    await click(byText(/^25m$/));
    expect(onChange).toHaveBeenCalledWith(25);
    expect(byText(/^25m$/), 'choice made — the room goes back to the reading').toBeFalsy();
  });

  it('is never spoken by the reader, in either state', async () => {
    await mount({ value: 45, onChange: () => {} });
    expect(container.querySelector('[data-read-skip]')).toBeTruthy();
    await act(async () => { root.render(createElement(TimeFit, { value: null, onChange: () => {} })); });
    expect(container.querySelector('[data-read-skip]')).toBeTruthy();
  });

  it('stays expanded for the facilitator, who re-times repeatedly', async () => {
    await mount({ value: 45, onChange: () => {}, alwaysOpen: true });
    expect(byText(/^45m$/)).toBeTruthy();
    expect(byLabel(/paced to 45 minutes/i)).toBeFalsy();
  });
});
