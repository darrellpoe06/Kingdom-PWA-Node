// =============================================================================
// The stranger lens reaches the work orders too
// =============================================================================
// Darrell, 2026-11-12, reviewing in "as a new user" from his phone, looking at
// his own Poe Properties board under a banner that said a person with no invite
// sees this: "I can see all this as a new person with no record?! They can see
// our businesses?!"
//
// WHAT WAS TRUE, SAID FIRST, because the alarm and the defect are different
// things. A real person with no invite reads NOTHING of this.
// infra/supabase/tests/0260-door-work-orders-smoke.sql asserts it in its own
// case table -- "S and O2 read nothing of I" -- and runs as a required CI job
// on every push (`app — door work orders (PostgreSQL)`). RLS was never the
// hole; no business data was exposed to anyone.
//
// WHAT WAS WRONG IS THE LENS. DR-1240's stranger mode was wired into four
// surfaces -- Properties, Research, Messages, Vault -- exactly the four its
// banner names. This board was not one of them, and it is mounted TWICE
// (Projects and LifeHub). So a steward reviewing his own exposure, still signed
// in as himself and therefore still reading his own rows, was shown work
// orders, a worker's name, an apartment and 33 interior photographs under a
// banner promising the opposite.
//
// That is worse than a cosmetic miss. This lens exists so a steward can check
// what he is exposing (DR-0104); a lens that under-hides tells him strangers
// see what they cannot, and teaches him to distrust the only instrument he has
// for the question. These cases pin the three properties that make it
// trustworthy: it hides, it does not even FETCH, and it says so out loud.
import { describe, it, expect, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import WorkOrderTriage from '../components/WorkOrderTriage.jsx';

let container = null;
let root = null;
const render = async (props) => {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(createElement(WorkOrderTriage, props)); });
};
afterEach(() => { if (root) act(() => root.unmount()); container?.remove(); root = null; container = null; });

const DOOR = '11111111-2222-4333-8444-555555555555';
// A row shaped like the one on his screen: a real business, a named worker.
const incidents = [{
  id: 'wo-1', title: 'Exhaust Fan and microwave installation inside apartment 2.',
  createdAt: '2026-10-22T14:00:00Z', doorId: DOOR, status: 'open',
  assignee: 'Coreyon Mallory', building: 'Poe Properties',
}];
const noop = { load: async () => ({ ok: true, photos: [] }), thumb: async () => null, image: async () => null, remember: async () => {}, instanceId: async () => 'inst-1' };

describe('under the stranger lens the board hides, and says so', () => {
  it('renders none of the work orders, the worker or the business', async () => {
    await render({ incidents, stranger: true, load: async () => ({ ok: true, requests: [], docs: [], events: [], notes: [], unreadable: [] }), photoOps: noop });
    const text = container.textContent;
    expect(text, 'a work order title reached a lens that promised none').not.toContain('apartment 2');
    expect(text, "a worker's name reached the stranger lens").not.toContain('Coreyon');
    expect(text, 'the business reached the stranger lens').not.toContain('Poe Properties');
  });

  it('PROVEN TO CATCH: the same board DOES show them to the steward himself', async () => {
    // Anti-vacuity. Without this the case above would pass on a board that
    // renders nothing for anyone — a lens that "works" by being broken.
    await render({ incidents, stranger: false, load: async () => ({ ok: true, requests: [], docs: [], events: [], notes: [], unreadable: [] }), photoOps: noop });
    expect(container.textContent).toContain('apartment 2');
  });

  it('does not even ASK for the rows, so the preview reads nothing it would hide', async () => {
    let asked = 0;
    const counting = async () => { asked += 1; return { ok: true, requests: [], docs: [], events: [], notes: [], unreadable: [] }; };
    let photosAsked = 0;
    const countingPhotos = { ...noop, load: async () => { photosAsked += 1; return { ok: true, photos: [] }; } };
    await render({ incidents, stranger: true, load: counting, photoOps: countingPhotos });
    expect(asked, 'the stranger lens still pulled the work orders from the database').toBe(0);
    expect(photosAsked, 'the stranger lens still pulled the pictures').toBe(0);
  });

  it('says it is hidden rather than going blank (DR-0381)', async () => {
    await render({ incidents, stranger: true, load: async () => ({ ok: true, requests: [], docs: [], events: [], notes: [], unreadable: [] }), photoOps: noop });
    const panel = container.querySelector('[data-testid="work-order-triage-stranger"]');
    expect(panel, 'the board vanished silently — hidden and broken must not look alike').toBeTruthy();
    expect(panel.textContent).toMatch(/hidden under this lens/i);
    // And it points at the REAL gate, not at this mask, so the steward reads a
    // statement about what actually protects the rows.
    expect(panel.textContent).toMatch(/database refuses/i);
  });
});
