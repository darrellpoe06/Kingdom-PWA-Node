// =============================================================================
// DoorTabs — journey walks and surface-says-truth
// (COMPREHENSIVE-REVIEW-STANDARD dimensions 2 and 3)
// =============================================================================
// Dimension 2 asks that the real journeys be walked AS THAT USER, not as the
// code's author. Dimension 3 asks that every explanatory string the surface
// shows be checked against the traced mechanism — "a false explanation is a
// defect of the first rank."
//
// So these tests read the rendered words, not the props. Where the surface
// tells the landlord something about how the system works, the test holds that
// sentence against what the code actually does.
// =============================================================================
import { describe, it, expect, vi, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { TimelineTab, RoomsTab } from '../modules/properties/DoorTabs.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// A small query layer over the real DOM, so these tests read the words a person
// sees rather than the props a developer passed.
let mounted = [];
afterEach(() => {
  mounted.forEach(({ root, host }) => { act(() => root.unmount()); host.remove(); });
  mounted = [];
});

function render(el) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  act(() => root.render(el));
  const entry = { root, host };
  mounted.push(entry);
  return { host, unmount: () => { act(() => root.unmount()); host.remove(); mounted = mounted.filter((m) => m !== entry); } };
}

const texts = (host, sel = '*') => [...host.querySelectorAll(sel)];
const match = (node, m) => (m instanceof RegExp ? m.test(node.textContent) : node.textContent === m);
// The deepest element carrying the text — avoids matching every ancestor.
const findAll = (host, m, sel = '*') =>
  texts(host, sel).filter((n) => match(n, m) && ![...n.children].some((c) => match(c, m)));
const find = (host, m, sel = '*') => findAll(host, m, sel)[0] || null;
const q = (host) => ({
  getByText: (m) => {
    const n = find(host, m);
    if (!n) throw new Error(`not on the page: ${m}`);
    return n;
  },
  queryByText: (m) => find(host, m),
  getAllByRole: () => texts(host, 'h1,h2,h3,h4'),
  getByPlaceholderText: (p) => {
    const n = host.querySelector(`[placeholder="${p}"]`);
    if (!n) throw new Error(`no field placeheld "${p}"`);
    return n;
  },
});
const click = (node) => act(() => { node.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
const type = (node, value) => act(() => {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(node, value);
  node.dispatchEvent(new Event('input', { bubbles: true }));
});

const door = { id: 'rental-1', instance_id: 'inst-1' };

const tenancies = [
  { id: 't1', tenant_name: 'Jordan Ellery', lease_start: '2022-01-01', lease_end: '2023-06-30', status: 'ended' },
  { id: 't2', tenant_name: 'Rowan Fitch', lease_start: '2023-09-01', lease_end: null, status: 'active' },
];
const photos = [
  { id: 'po', taken_at: '2023-06-29T00:00:00Z', kind: 'move-out-condition', tenancy_id: null, caption: 'Carpet stained' },
  { id: 'pi', taken_at: '2023-08-30T00:00:00Z', kind: 'move-in-condition', tenancy_id: null, caption: 'New carpet' },
];

describe('journey: the landlord opens a door and reads its history', () => {
  it('shows the door empty when it is empty, rather than a painted example', () => {
    const { host } = render(<TimelineTab />);
    const screen = q(host);
    expect(screen.getByText(/because it is empty, not because something failed to load/i)).toBeTruthy();
  });

  it('shows each tenancy as its own chapter, current one first', () => {
    const { host } = render(<TimelineTab tenancies={tenancies} photos={photos} />);
    const screen = q(host);
    const headings = screen.getAllByRole('heading');
    const text = headings.map((h) => h.textContent);
    expect(text).toContain('Rowan Fitch');
    expect(text).toContain('Jordan Ellery');
    expect(text.indexOf('Rowan Fitch')).toBeLessThan(text.indexOf('Jordan Ellery'));
  });

  it('says a running tenancy is still here rather than inventing a move-out', () => {
    const { host } = render(<TimelineTab tenancies={tenancies} />);
    const screen = q(host);
    expect(screen.getByText(/still here/i)).toBeTruthy();
  });

  it('gives the turn between tenants its own section, naming both households', () => {
    const { host } = render(<TimelineTab tenancies={tenancies} photos={photos} />);
    const screen = q(host);
    expect(screen.getByText('Between tenants')).toBeTruthy();
    expect(screen.getByText(/After Jordan Ellery, before Rowan Fitch/)).toBeTruthy();
  });

  // SURFACE-SAYS-TRUTH: the sentence about the condition sets must track what
  // turnPhotos() actually found, not be a fixed reassuring string.
  it('says both condition sets are on file only when they are', () => {
    const first = render(<TimelineTab tenancies={tenancies} photos={photos} />);
    let screen = q(first.host);
    expect(screen.getByText(/Both condition sets are on file/)).toBeTruthy();
    first.unmount();

    const second = render(<TimelineTab tenancies={tenancies} photos={[photos[0]]} />);
    screen = q(second.host);
    expect(screen.queryByText(/Both condition sets are on file/)).toBeNull();
    expect(screen.getByText(/Only one side of the turn was photographed/)).toBeTruthy();
  });

  it('marks a photo dated by its upload, so unknown timing never reads as known', () => {
    const { host } = render(<TimelineTab tenancies={tenancies} photos={[{ id: 'p', uploaded_at: '2023-07-10T00:00:00Z', kind: 'turn', tenancy_id: null }]} />);
    const screen = q(host);
    expect(screen.getByText(/the camera recorded no time/i)).toBeTruthy();
  });

  it('says a tenancy recorded nothing rather than leaving a blank card', () => {
    const undated = [{ id: 't9', tenant_name: 'Sasha Kerr', status: 'active' }];
    const { host } = render(<TimelineTab tenancies={undated} />);
    const screen = q(host);
    expect(screen.getByText(/Nothing was recorded during this tenancy/i)).toBeTruthy();
    expect(screen.getByText(/no dates recorded/i)).toBeTruthy();
  });
});

describe('journey: the landlord checks the payment record', () => {
  // The real 1003 Koehn shape: three payments, four months nobody filled in.
  const closed = [tenancies[0]]; // Jordan Ellery, 2022-01-01 to 2023-06-30
  const rent = [
    { id: 'r1', for_period: '2022-09', amount: 646, status: 'confirmed' },
    { id: 'r2', for_period: '2022-10', amount: 640, status: 'confirmed' },
    { id: 'r3', for_period: '2022-11', amount: 680, status: 'confirmed' },
  ];

  it('never shows a total bare — the basis and the caveat ride with it', () => {
    const { host } = render(<TimelineTab tenancies={closed} rent={rent} expectedRent={680} />);
    const screen = q(host);
    // The tenancy ran 2022-01 to 2023-06, so the ledger covers 18 months and
    // only three of them carry a payment. The bare total would read as settled.
    expect(screen.getByText(/^Incomplete:/)).toBeTruthy();
    expect(screen.getByText('3 of 18 month(s)')).toBeTruthy();
    expect(screen.getByText(/No record at all for:/)).toBeTruthy();
  });

  it('names the two months the voucher did not cover the contract rent', () => {
    const { host } = render(<TimelineTab tenancies={closed} rent={rent} expectedRent={680} />);
    const screen = q(host);
    expect(screen.getByText(/paid 646 against 680/)).toBeTruthy();
    expect(screen.getByText(/paid 640 against 680/)).toBeTruthy();
  });

  it('says every month is confirmed only when the ledger has no gap', () => {
    const oneMonth = [{ id: 'tm', tenant_name: 'Sasha Kerr', lease_start: '2024-01-05', lease_end: '2024-01-31', status: 'ended' }];
    const clean = [{ id: 'a', for_period: '2024-01', amount: 680, status: 'confirmed' }];
    const { host } = render(<TimelineTab tenancies={oneMonth} rent={clean} expectedRent={680} />);
    const screen = q(host);
    expect(screen.getByText(/Every month in this ledger carries a confirmed payment/)).toBeTruthy();
    expect(screen.queryByText(/^Incomplete:/)).toBeNull();
  });
});

describe('journey: the landlord turns a 2-bedroom into a 3-bedroom', () => {
  const twoBed = [
    { id: 'a', name: 'Bedroom 1', kind: 'bedroom', sort_order: 10 },
    { id: 'b', name: 'Bedroom 2', kind: 'bedroom', sort_order: 20 },
    { id: 'c', name: 'Bathroom', kind: 'bathroom', sort_order: 30 },
  ];

  it('shows the size counted from the rooms on screen', () => {
    const { host } = render(<RoomsTab door={door} rooms={twoBed} canManage />);
    const screen = q(host);
    expect(screen.getByText('2 bed / 1 bath')).toBeTruthy();
    expect(screen.getByText(/counted from the rooms/i)).toBeTruthy();
  });

  it('previews the reclassification before the room is added', () => {
    const { host } = render(<RoomsTab door={door} rooms={twoBed} canManage />);
    const screen = q(host);
    type(screen.getByPlaceholderText('Bedroom 3'), 'Bedroom 3');
    expect(screen.getByText(/This door is now 3 bed \/ 1 bath \(was 2 bed \/ 1 bath\)/)).toBeTruthy();
  });

  it('hands the built row to the caller and clears the form', () => {
    const onAdd = vi.fn();
    const { host } = render(<RoomsTab door={door} rooms={twoBed} canManage onAdd={onAdd} />);
    const screen = q(host);
    const input = screen.getByPlaceholderText('Bedroom 3');
    type(input, 'Bedroom 3');
    click(screen.getByText('Add'));
    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onAdd.mock.calls[0][0]).toMatchObject({ name: 'Bedroom 3', kind: 'bedroom', rental_ref: 'rental-1' });
    expect(input.value).toBe('');
  });

  it('shows the duplicate refusal in the surface, not only in the console', () => {
    const { host } = render(<RoomsTab door={door} rooms={twoBed} canManage />);
    const screen = q(host);
    type(screen.getByPlaceholderText('Bedroom 3'), 'bathroom');
    click(screen.getByText('Add'));
    expect(screen.getByText(/already has a room called "bathroom"/i)).toBeTruthy();
  });

  it('counts a half bath as a half', () => {
    const { host } = render(<RoomsTab door={door} rooms={[...twoBed, { id: 'd', name: 'Half bath', kind: 'bathroom', sort_order: 40 }]} canManage />);
    const screen = q(host);
    expect(screen.getByText('2 bed / 1.5 bath')).toBeTruthy();
  });

  it('calls a unit with rooms but no bedroom a studio', () => {
    const { host } = render(<RoomsTab door={door} rooms={[{ id: 'k', name: 'Kitchen', kind: 'kitchen' }]} canManage />);
    const screen = q(host);
    expect(screen.getByText(/^Studio$/)).toBeTruthy();
  });

  it('says the size is not recorded rather than claiming a studio with no rooms', () => {
    const { host } = render(<RoomsTab door={door} rooms={[]} canManage />);
    const screen = q(host);
    expect(screen.getByText('Size not recorded')).toBeTruthy();
  });
});

describe('journey: the landlord removes a room', () => {
  const rooms = [{ id: 'rm1', name: 'Bedroom 3', kind: 'bedroom', sort_order: 10 }];
  const photos2 = [{ id: 'p1', room_id: 'rm1' }, { id: 'p2', room_id: 'rm1' }];

  // SURFACE-SAYS-TRUTH: "Remove" must not let the landlord believe the photos
  // go with it. There is no DELETE grant — archived_at is the removal.
  it('tells the landlord the photos survive before it removes anything', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const onPatch = vi.fn();
    const { host } = render(<RoomsTab door={door} rooms={rooms} photos={photos2} canManage onPatch={onPatch} />);
    const screen = q(host);
    click(screen.getByText('Remove'));
    expect(confirm).toHaveBeenCalledWith(expect.stringMatching(/2 photo\(s\) stay on the property's record/));
    expect(onPatch).not.toHaveBeenCalled(); // declined
    confirm.mockRestore();
  });

  it('archives rather than deletes when confirmed', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const onPatch = vi.fn();
    const { host } = render(<RoomsTab door={door} rooms={rooms} photos={photos2} canManage onPatch={onPatch} />);
    const screen = q(host);
    click(screen.getByText('Remove'));
    expect(onPatch).toHaveBeenCalledWith('rm1', expect.objectContaining({ archived_at: expect.any(String) }));
    expect(onPatch.mock.calls[0][1]).not.toHaveProperty('deleted');
    confirm.mockRestore();
  });

  it('keeps a removed room visible with a way back', () => {
    const archived = [{ id: 'rm9', name: 'Attic', kind: 'attic', archived_at: '2024-01-01T00:00:00Z' }];
    const { host } = render(<RoomsTab door={door} rooms={archived} canManage />);
    const screen = q(host);
    expect(screen.getByText('Removed rooms')).toBeTruthy();
    expect(screen.getByText(/Their history stays on the record/)).toBeTruthy();
    expect(screen.getByText('Put back')).toBeTruthy();
  });
});

describe('journey: a tenant or worker opens the same tabs', () => {
  const rooms = [{ id: 'a', name: 'Bedroom 1', kind: 'bedroom', sort_order: 10 }];

  it('shows the rooms but offers no way to change them', () => {
    const { host } = render(<RoomsTab door={door} rooms={rooms} canManage={false} />);
    const screen = q(host);
    expect(screen.getByText(/Bedroom 1/)).toBeTruthy();
    expect(screen.queryByText('Add a room')).toBeNull();
    expect(screen.queryByText('Remove')).toBeNull();
  });

  it('offers no starter templates to someone who cannot manage the door', () => {
    const { host } = render(<RoomsTab door={door} rooms={[]} canManage={false} />);
    const screen = q(host);
    expect(screen.queryByText(/Start from house/)).toBeNull();
  });
});

describe('the unsorted pile stays visible', () => {
  it('counts pictures filed to no room and says why they are shown', () => {
    const rooms = [{ id: 'a', name: 'Kitchen', kind: 'kitchen', sort_order: 10 }];
    const mixed = [{ id: 'p1', room_id: 'a' }, { id: 'p2', room_id: null }, { id: 'p3', room_id: null }];
    const { host } = render(<RoomsTab door={door} rooms={rooms} photos={mixed} canManage />);
    const screen = q(host);
    const card = screen.getByText('Not yet in a room').closest('section');
    const inCard = q(card);
    expect(inCard.getByText(/2 pictures at this door are not/)).toBeTruthy();
    expect(inCard.getByText(/stays somebody\u2019s job/)).toBeTruthy();
  });
});
