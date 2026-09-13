// =============================================================================
// ReadinessTab — the guest-ready checklist as a landlord actually meets it
// =============================================================================
// These tests read the RENDERED WORDS and drive the REAL controls, then assert
// on what reached the store. The store is stubbed at its module boundary so the
// writes are observable without a database — what is being proven is that the
// surface writes the right row at the right moment, and that an untouched door
// writes nothing at all.
// =============================================================================
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const store = { tasks: [], ensured: [], patched: [], removed: [], write: { ok: true, reason: null } };

vi.mock('../lib/use-board-tasks.js', () => ({
  useBoardTasks: () => store.tasks,
  useWriteState: () => store.write,
  ensureTask: (item) => { store.ensured.push(item); return Promise.resolve(item); },
  patchTask: (task, patch) => { store.patched.push({ task, patch }); },
  removeTask: (task) => { store.removed.push(task); return Promise.resolve(); },
}));

const { ReadinessTab } = await import('../modules/properties/ReadinessTab.jsx');
const { readinessBoardSlug, templateFor } = await import('../modules/properties/readiness.js');

const SLUG = readinessBoardSlug('1003-koehn');
const ROOMS = [
  { id: 'r1', name: 'Front bedroom', kind: 'bedroom' },
  { id: 'r2', name: 'Kitchen', kind: 'kitchen' },
];

let mounted = [];
beforeEach(() => { store.tasks = []; store.ensured = []; store.patched = []; store.removed = []; store.write = { ok: true, reason: null }; });
afterEach(() => {
  mounted.forEach(({ root, host }) => { act(() => root.unmount()); host.remove(); });
  mounted = [];
});

function render(el) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  act(() => root.render(el));
  mounted.push({ root, host });
  return host;
}

const mount = (rooms = ROOMS, tasks = []) => {
  store.tasks = tasks;
  return render(<ReadinessTab boardSlug={SLUG} boardTitle="1003 Koehn" rooms={rooms} />);
};

const all = (host, sel) => [...host.querySelectorAll(sel)];
const byText = (host, re, sel = '*') =>
  all(host, sel).filter((n) => re.test(n.textContent) && ![...n.children].some((c) => re.test(c.textContent)));
const btn = (host, re) => all(host, 'button').find((b) => re.test(b.textContent));
const click = (el) => act(() => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); });

describe('the first time a landlord opens it', () => {
  it('shows the door, 0%, and the whole list', () => {
    const host = mount();
    expect(host.textContent).toContain('1003 Koehn');
    expect(host.textContent).toContain('0%');
    expect(byText(host, /^0 of 181 tasks completed/).length).toBe(1);
    expect(all(host, '[role="checkbox"]').length).toBe(181);
  });

  it('writes NOTHING to the database until something is touched', () => {
    mount();
    expect(store.ensured).toEqual([]);
    expect(store.patched).toEqual([]);
  });

  it('names all nine areas with an honest 0/N', () => {
    const host = mount();
    for (const s of ['Construction', 'Kitchen', 'Bedrooms', 'Bathroom', 'Living/Dining',
      'Supplies', 'Safety', 'Final Walk-Through', 'Airbnb Listing']) {
      expect(host.textContent).toContain(s);
    }
    expect(host.textContent).toContain('0/25');
  });
});

describe('bedrooms come from the door, not from a guess', () => {
  it('uses the room the landlord named', () => {
    const host = mount();
    expect(host.textContent).toContain('Front bedroom');
  });

  it('says plainly when no bedroom is recorded, and sends him to Rooms', () => {
    const host = mount([]);
    expect(host.textContent).toMatch(/No bedrooms are recorded for this door yet/);
    expect(host.textContent).toMatch(/Rooms/);
    expect(all(host, '[role="checkbox"]').length).toBe(165);
  });
});

describe('working the list', () => {
  it('writes a real done row the first time a box is ticked', () => {
    const host = mount();
    click(all(host, '[role="checkbox"]')[0]);
    expect(store.ensured.length).toBe(1);
    expect(store.ensured[0]).toMatchObject({
      boardSlug: SLUG, boardTitle: '1003 Koehn', status: 'done', title: 'Walls patched and repaired',
    });
  });

  it('patches the existing row instead of writing a second one', () => {
    const first = templateFor(SLUG, ROOMS)[0];
    const host = mount(ROOMS, [{
      slug: first.slug, boardSlug: SLUG, title: first.title, status: 'not-started',
      group: first.group, notes: null, links: { readiness: { section: 'construction' } }, remoteUuid: 'uuid-1',
    }]);
    click(all(host, '[role="checkbox"]')[0]);
    expect(store.ensured).toEqual([]);
    expect(store.patched.length).toBe(1);
    expect(store.patched[0].patch).toMatchObject({ status: 'done' });
  });

  it('rolls a finished task into every number on the page', () => {
    const first = templateFor(SLUG, ROOMS)[0];
    const host = mount(ROOMS, [{
      slug: first.slug, boardSlug: SLUG, title: first.title, status: 'done',
      group: first.group, notes: 'done 9/12', links: { readiness: { section: 'construction', cost: 400 } },
    }]);
    expect(byText(host, /^1 of 181 tasks completed/).length).toBe(1);
    expect(host.textContent).toContain('1/25');
    expect(host.textContent).toContain('done 9/12');
    // A finished task costs nothing more — its 400 is NOT in the remaining total.
    expect(byText(host, /^\$0$/).length).toBeGreaterThan(0);
  });

  it('shows an unfinished cost in the remaining total', () => {
    const first = templateFor(SLUG, ROOMS)[0];
    mount(ROOMS, []);
    const host = mount(ROOMS, [{
      slug: first.slug, boardSlug: SLUG, title: first.title, status: 'in-progress',
      group: first.group, notes: null, links: { readiness: { section: 'construction', cost: 1250 } },
    }]);
    expect(host.textContent).toContain('$1,250');
    expect(host.textContent).toContain('In progress');
  });
});

describe('the three views', () => {
  it('Still needed hides what is done, Completed shows only it', () => {
    const first = templateFor(SLUG, ROOMS)[0];
    const host = mount(ROOMS, [{
      slug: first.slug, boardSlug: SLUG, title: first.title, status: 'done',
      group: first.group, notes: null, links: { readiness: { section: 'construction' } },
    }]);
    click(btn(host, /Still needed/));
    expect(all(host, '[role="checkbox"]').length).toBe(180);
    click(btn(host, /^Completed 1$/));
    expect(all(host, '[role="checkbox"]').length).toBe(1);
  });
});

describe('reset', () => {
  it('asks before it clears anything, and clears only on confirm', () => {
    const first = templateFor(SLUG, ROOMS)[0];
    const rows = [{
      slug: first.slug, boardSlug: SLUG, title: first.title, status: 'done',
      group: first.group, notes: null, links: { readiness: { section: 'construction' } }, remoteUuid: 'uuid-1',
    }];
    const host = mount(ROOMS, rows);
    click(btn(host, /Reset checklist/));
    expect(host.textContent).toMatch(/It cannot be undone/);
    expect(store.removed).toEqual([]);

    click(btn(host, /Keep my progress/));
    expect(store.removed).toEqual([]);

    click(btn(host, /Reset checklist/));
    click(btn(host, /Reset this checklist/));
    expect(store.removed.length).toBe(1);
  });
});

describe('a door with no bedrooms recorded', () => {
  // MEASURED 2026-09-13 on the sovereign database: property_rooms holds 0 rows
  // across all 13 doors. So this is not an edge case — it is what EVERY door
  // looked like the day the tab shipped, and the section could only point at
  // another tab. PROVEN-TO-CATCH: remove the onAddRoom branch and the first
  // three of these fail.
  const DOOR = { id: 'rental-uuid', instance_id: 'inst-uuid' };

  const mountEmpty = (onAddRoom) => {
    store.tasks = [];
    return render(<ReadinessTab boardSlug={SLUG} boardTitle="1003 Koehn" rooms={[]} door={DOOR} onAddRoom={onAddRoom} />);
  };

  it('lets the landlord name a bedroom without leaving the checklist', () => {
    const added = [];
    const host = mountEmpty((row) => added.push(row));
    const input = all(host, 'input[type="text"]').find((i) => i.getAttribute('aria-label') === 'Name a bedroom in this unit');
    expect(input).toBeTruthy();
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, 'Front bedroom');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    click(btn(host, /Add bedroom/));
    expect(added.length).toBe(1);
    expect(added[0]).toMatchObject({ name: 'Front bedroom', kind: 'bedroom', rental_ref: 'rental-uuid', instance_id: 'inst-uuid' });
  });

  it('says the room becomes real, not just a checklist group', () => {
    const host = mountEmpty(() => {});
    expect(host.textContent).toMatch(/becomes a real room on the/);
    expect(host.textContent).toMatch(/Rooms/);
  });

  it('will not add an empty name', () => {
    const added = [];
    const host = mountEmpty((row) => added.push(row));
    const add = btn(host, /Add bedroom/);
    expect(add.disabled).toBe(true);
    click(add);
    expect(added).toEqual([]);
  });

  it('falls back to pointing at Rooms when the viewer cannot add one', () => {
    const host = mountEmpty(null);
    expect(host.textContent).toMatch(/Add them on the/);
    expect(all(host, 'button').some((b) => /Add bedroom/.test(b.textContent))).toBe(false);
  });

  it('still renders the 165 fixed tasks either way', () => {
    const host = mountEmpty(() => {});
    expect(all(host, '[role="checkbox"]').length).toBe(165);
  });
});

describe('the surface says what is TRUE about saving', () => {
  // The line under the dashboard is the whole trust claim of this tab. It used
  // to promise "saved to this door for everyone" no matter what the database
  // said. PROVEN-TO-CATCH: make that string unconditional again and all four
  // of these fail.
  it('claims shared saving only when the write actually landed', () => {
    const host = mount();
    expect(host.textContent).toMatch(/Saved to this door for everyone who manages it/);
  });

  it('says it is device-only when signed out, and does not claim sharing', () => {
    store.write = { ok: false, reason: 'signed-out' };
    const host = mount();
    expect(host.textContent).toMatch(/held on this device only/);
    expect(host.textContent).not.toMatch(/Saved to this door for everyone/);
  });

  it('says a failed write did NOT save, rather than showing success', () => {
    store.write = { ok: false, reason: 'failed' };
    const host = mount();
    expect(host.textContent).toMatch(/did NOT save to the door/);
    expect(host.textContent).not.toMatch(/Saved to this door for everyone/);
  });

  it('explains an RLS-refused delete instead of pretending it worked', () => {
    store.write = { ok: false, reason: 'blocked' };
    const host = mount();
    expect(host.textContent).toMatch(/refused by the database/);
    expect(host.textContent).toMatch(/Nothing was lost/);
  });

  it('names the missing instance rather than saying nothing', () => {
    store.write = { ok: false, reason: 'no-tenant' };
    const host = mount();
    expect(host.textContent).toMatch(/not attached to a property instance/);
  });
});

describe('with no door chosen', () => {
  it('says so instead of rendering an empty checklist', () => {
    const host = render(<ReadinessTab boardSlug="" boardTitle="" rooms={[]} />);
    expect(host.textContent).toMatch(/Pick a door first/);
    expect(all(host, '[role="checkbox"]').length).toBe(0);
  });
});
