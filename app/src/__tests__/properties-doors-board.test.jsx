// =============================================================================
// DoorsBoard — the landlord's own properties, and the defect that hid them
// =============================================================================
// THE DEFECT (measured 2026-08-27): loadMyDoors read rental_tenancies only, and
// the role resolver needed a tenancy to call someone an owner. With 12 rentals
// and zero tenancies — the family's real state — the landlord opened his own
// app to an empty screen built for a tenant, and there was no path anywhere in
// it to create the first tenancy. The emptiness was self-sustaining.
//
// AND THE KEY MISMATCH: rental_tenancies.rental_ref is TEXT (the rentals slug);
// property_rooms.rental_ref and property_photos.rental_ref are UUID (the
// rentals id). Read from the live catalog after I had passed the slug to both.
// Matching a door to its tenancy on the wrong key silently shows every occupied
// door as vacant, which is the worst possible thing for this board to be wrong
// about — so it is pinned here.
//
// Every personal name below is invented; no tenant name belongs in a repo.
// =============================================================================
import React, { act } from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { DoorsBoard, statusWord, COMING_WINDOW_DAYS } from '../modules/properties/DoorTabs.jsx';
import { tenancyRowForDoor, buildEdit } from '../modules/properties/staging.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// The board's default view became GRID on 2026-08-28 (Darrell: "I like the grid
// look as the default"). The stored preference still wins, so these tests pin
// the view they are actually about instead of inheriting whichever is default —
// a test that silently depends on a default is a test that breaks when somebody
// changes one for a good reason.
beforeEach(() => {
  try { localStorage.setItem('poe-properties-view', 'list'); } catch { /* ignore */ }
});

let mounted = [];
afterEach(() => {
  mounted.forEach(({ root, host }) => { act(() => root.unmount()); host.remove(); });
  mounted = [];
  try { localStorage.clear(); } catch { /* ignore */ }
});

function render(el) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  act(() => root.render(el));
  mounted.push({ root, host });
  return host;
}
const txt = (host) => host.textContent;
const buttons = (host) => [...host.querySelectorAll('button')];
const byText = (host, re) => buttons(host).find((b) => re.test(b.textContent));
const click = (n) => act(() => { n.dispatchEvent(new MouseEvent('click', { bubbles: true })); });

const rentals = [
  { id: 'u-koehn', slug: 'koehn-1003', instance_id: 'i1', address: '1003 Koehn Dr', city: 'Danville', state: 'IL', monthly_rent: '680.00' },
  { id: 'u-pros', slug: 'prospect-805', instance_id: 'i1', address: '805 North Prospect Avenue', city: 'Champaign', state: 'Illinois', monthly_rent: '0.00' },
];
// A tenancy points at the SLUG, not the id.
const tenancy = {
  id: 't1', rental_ref: 'koehn-1003', status: 'active',
  property_label: '1003 Koehn Dr', tenant_name: null, monthly_rent: '680.00',
};

describe('the landlord sees his own doors', () => {
  it('lists every rental, tenancy or not', () => {
    const host = render(<DoorsBoard rentals={rentals} tenancies={[]} canManage />);
    expect(txt(host)).toContain('1003 Koehn Dr');
    expect(txt(host)).toContain('805 North Prospect Avenue');
    expect(txt(host)).toMatch(/Your doors \(2\)/);
  });

  it('says the account is empty rather than rendering a bare frame', () => {
    const host = render(<DoorsBoard rentals={[]} tenancies={[]} canManage />);
    expect(txt(host)).toMatch(/No properties are on your account yet/);
  });

  it('matches a tenancy to its door by SLUG — the key rental_tenancies holds', () => {
    const host = render(<DoorsBoard rentals={rentals} tenancies={[tenancy]} canManage />);
    expect(txt(host)).toContain('Rented');
    expect(txt(host)).toMatch(/1 rented · 1 available/);
  });

  it('does NOT match on the rentals id — the mismatch that showed occupied doors as vacant', () => {
    const wrongKey = [{ ...tenancy, rental_ref: 'u-koehn' }];
    const host = render(<DoorsBoard rentals={rentals} tenancies={wrongKey} canManage />);
    expect(txt(host)).toMatch(/0 rented · 2 available/);
  });

  it('shows the address on its own line, not folded into a name', () => {
    const host = render(<DoorsBoard rentals={rentals} tenancies={[]} canManage />);
    expect(txt(host)).toContain('1003 Koehn Dr');
    expect(txt(host)).toContain('Danville, IL');
  });

  it('shows the rent whether the door is rented or available', () => {
    const host = render(<DoorsBoard rentals={rentals} tenancies={[tenancy]} canManage />);
    expect(txt(host)).toContain('$680/mo');
  });

  it('says a door has no rent on record rather than showing $0', () => {
    const host = render(<DoorsBoard rentals={[rentals[1]]} tenancies={[]} canManage />);
    expect(txt(host)).toMatch(/no rent on record/);
  });

  it('names an unnamed household honestly instead of "Unknown"', () => {
    const host = render(<DoorsBoard rentals={rentals} tenancies={[tenancy]} canManage />);
    expect(txt(host)).toMatch(/Household not named in the record/);
  });
});

describe('available, rented, or coming', () => {
  const days = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

  it('reads a lease ending inside the window as opening, not merely rented', () => {
    const soon = [{ ...tenancy, lease_end: days(34) }];
    const host = render(<DoorsBoard rentals={rentals} tenancies={soon} canManage />);
    expect(txt(host)).toMatch(/Opens in 3[34]d/);
    expect(txt(host)).toMatch(/1 coming/);
  });

  it('leaves a far-off lease end reading simply Rented', () => {
    const far = [{ ...tenancy, lease_end: days(COMING_WINDOW_DAYS + 60) }];
    const host = render(<DoorsBoard rentals={rentals} tenancies={far} canManage />);
    expect(txt(host)).toContain('Rented');
    expect(txt(host)).not.toMatch(/Opens in/);
  });

  it('stops claiming to be coming once the date has passed', () => {
    const past = [{ ...tenancy, lease_end: days(-5) }];
    const host = render(<DoorsBoard rentals={rentals} tenancies={past} canManage />);
    expect(txt(host)).not.toMatch(/Opens in/);
  });

  it('a tenancy with no lease end is Rented, never "available soon"', () => {
    expect(statusWord({ rented: true, comingSoon: false, daysOut: null })).toBe('Rented');
  });

  it('distinguishes advertised from merely available', () => {
    expect(statusWord({ rented: false, listed: true })).toBe('Advertised');
    expect(statusWord({ rented: false, listed: false })).toBe('Available');
  });
});

describe('both views tell the same story', () => {
  it('offers a list and a grid', () => {
    const host = render(<DoorsBoard rentals={rentals} tenancies={[tenancy]} canManage />);
    expect(byText(host, /^List$/)).toBeTruthy();
    expect(byText(host, /^Grid$/)).toBeTruthy();
  });

  it('shows the same status in the grid as in the list', () => {
    const host = render(<DoorsBoard rentals={rentals} tenancies={[tenancy]} canManage />);
    expect(txt(host)).toContain('Rented');
    click(byText(host, /^Grid$/));
    expect(txt(host)).toContain('Rented');
    expect(txt(host)).toContain('$680/mo');
    expect(txt(host)).toContain('1003 Koehn Dr');
  });

  it('remembers the choice on this device', () => {
    const host = render(<DoorsBoard rentals={rentals} tenancies={[]} canManage />);
    click(byText(host, /^Grid$/));
    expect(localStorage.getItem('poe-properties-view')).toBe('grid');
  });

  it('says a door has no photo rather than borrowing another one', () => {
    const host = render(<DoorsBoard rentals={rentals} tenancies={[]} photos={[]} canManage />);
    click(byText(host, /^Grid$/));
    expect(txt(host)).toMatch(/No photo/);
    expect(host.querySelectorAll('img')).toHaveLength(0);
  });

  it('uses the door\'s own photo, keyed by the rentals ID', () => {
    const photos = [{ id: 'p1', rental_ref: 'u-koehn', kind: 'listing', caption: 'Front', storage_path: 'data:image/jpeg;base64,x', taken_at: '2026-01-01T00:00:00Z' }];
    const host = render(<DoorsBoard rentals={rentals} tenancies={[]} photos={photos} canManage />);
    const img = host.querySelector('img');
    expect(img).toBeTruthy();
    expect(img.getAttribute('alt')).toBe('Front');
    expect(txt(host)).toMatch(/1 photo/);
  });

  it('prefers a listing shot over a condition shot for the cover', () => {
    const photos = [
      { id: 'cond', rental_ref: 'u-koehn', kind: 'move-out-condition', caption: 'Carpet', storage_path: 'data:image/jpeg;base64,a', taken_at: '2026-05-01T00:00:00Z' },
      { id: 'list', rental_ref: 'u-koehn', kind: 'listing', caption: 'Front', storage_path: 'data:image/jpeg;base64,b', taken_at: '2026-01-01T00:00:00Z' },
    ];
    const host = render(<DoorsBoard rentals={rentals} tenancies={[]} photos={photos} canManage />);
    expect(host.querySelector('img').getAttribute('alt')).toBe('Front');
  });
});

describe('what a non-manager can do', () => {
  it('sees the doors but is offered no controls', () => {
    const host = render(<DoorsBoard rentals={rentals} tenancies={[tenancy]} canManage={false} />);
    expect(txt(host)).toContain('1003 Koehn Dr');
    expect(byText(host, /Start a tenancy/)).toBeUndefined();
    expect(byText(host, /^Advertise$/)).toBeUndefined();
    expect(byText(host, /Edit tenant/)).toBeUndefined();
    expect(byText(host, /Edit door/)).toBeUndefined();
  });
});

describe('starting a tenancy on an empty door', () => {
  it('hands back the door it was opened for', () => {
    const onStart = vi.fn();
    const host = render(<DoorsBoard rentals={rentals} tenancies={[]} canManage onStart={onStart} />);
    click(buttons(host).find((b) => /Start a tenancy/.test(b.textContent)));
    click(byText(host, /Start the tenancy/));
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onStart.mock.calls[0][0].rental.id).toBe('u-koehn');
  });

  it('prefills the rent from the door\'s OWN record, not a guess', () => {
    const host = render(<DoorsBoard rentals={rentals} tenancies={[]} canManage onStart={() => {}} />);
    click(buttons(host).find((b) => /Start a tenancy/.test(b.textContent)));
    const values = [...host.querySelectorAll('input')].map((i) => i.value);
    expect(values).toContain('680.00');
  });

  it('accepts a tenancy with no tenant name — the 1003 Koehn case', () => {
    const r = tenancyRowForDoor({ instanceId: 'i1', rentalRef: 'koehn-1003', monthlyRent: 680, subsidised: true });
    expect(r.ok).toBe(true);
    expect(r.row.tenant_name).toBeNull();      // NULL, never the string "Unknown"
    expect(r.row.notes).toMatch(/Subsidised/);
    expect(r.row.rental_ref).toBe('koehn-1003');
  });

  it('still refuses a tenancy with no door to hang on', () => {
    expect(tenancyRowForDoor({ instanceId: 'i1' }).reason).toBe('no-door');
  });
});

describe('editing what is already there', () => {
  it('offers Edit on an occupied door', () => {
    const host = render(<DoorsBoard rentals={rentals} tenancies={[tenancy]} canManage onEditTenancy={() => {}} />);
    expect(byText(host, /Edit tenant/)).toBeTruthy();
  });

  it('sends only what changed, with a sentence describing it', () => {
    const onEditTenancy = vi.fn();
    const host = render(<DoorsBoard rentals={rentals} tenancies={[tenancy]} canManage onEditTenancy={onEditTenancy} />);
    click(byText(host, /Edit tenant/));
    const nameInput = [...host.querySelectorAll('input')].find((i) => i.value === '');
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(nameInput, 'Jordan Ellery');
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));
    });
    click(byText(host, /Save the change/));
    expect(onEditTenancy).toHaveBeenCalledTimes(1);
    const [id, patch, summary] = onEditTenancy.mock.calls[0];
    expect(id).toBe('t1');
    expect(patch).toEqual({ tenant_name: 'Jordan Ellery' });
    expect(summary).toMatch(/Tenant: \(blank\) → Jordan Ellery/);
  });

  it('will not save when nothing changed', () => {
    const host = render(<DoorsBoard rentals={rentals} tenancies={[tenancy]} canManage onEditTenancy={() => {}} />);
    click(byText(host, /Edit tenant/));
    expect(byText(host, /Nothing changed/).disabled).toBe(true);
  });

  it('describes a numeric change without tripping on string-vs-number', () => {
    const e = buildEdit({ monthly_rent: '680.00' }, { monthly_rent: '680' }, [{ key: 'monthly_rent', label: 'Rent', numeric: true }]);
    expect(e.changed).toBe(false);
  });
});

// The door editor now has TWO selects — "Offered as" and, since 0158, "Address
// on the public shelf". querySelector('select') used to be unambiguous and is
// not any more, so these pick the offering one by the options it carries. A
// test that depends on there being exactly one of something breaks the day
// somebody adds a second for a good reason.
const offeringSelect = (host) =>
  [...host.querySelectorAll('select')].find((el) =>
    [...el.options].some((o) => o.value === 'short-term'));

describe('what a door is offered as', () => {
  // "you only need to create an account for lease or for a short term lease
  // Airbnb... options" — and "only for Apt 2 at 805 N Prospect Ave".
  const shortStay = { ...rentals[1], id: 'u-apt2', slug: 'prospect-805-2', unit: 'Apt 2', offering: 'short-term', nightly_rate: '95.00', min_stay_nights: 2 };

  it('shows a short-stay door as one, with its nightly rate', () => {
    const host = render(<DoorsBoard rentals={[shortStay]} tenancies={[]} canManage />);
    expect(txt(host)).toMatch(/short stay \$95\/night/);
  });

  it('leaves every other door reading as a lease, with nothing added', () => {
    const host = render(<DoorsBoard rentals={rentals} tenancies={[]} canManage />);
    expect(txt(host)).not.toMatch(/short stay/);
  });

  it('offers the door editor on every door, rented or not', () => {
    const host = render(<DoorsBoard rentals={rentals} tenancies={[tenancy]} canManage onEditRental={() => {}} />);
    expect(buttons(host).filter((b) => /Edit door/.test(b.textContent))).toHaveLength(2);
  });

  it('does not light up Save, or write an offering, when nothing was touched', () => {
    const host = render(<DoorsBoard rentals={[rentals[1]]} tenancies={[]} canManage onEditRental={() => {}} />);
    click(byText(host, /Edit door/));
    expect(byText(host, /Nothing changed/).disabled).toBe(true);
  });

  it('separates editing the DOOR from editing the TENANT', () => {
    const host = render(<DoorsBoard rentals={rentals} tenancies={[tenancy]} canManage onEditRental={() => {}} onEditTenancy={() => {}} />);
    expect(byText(host, /Edit tenant/)).toBeTruthy();
    expect(byText(host, /Edit door/)).toBeTruthy();
  });

  it('lets the landlord label the unit — the one thing only he knows', () => {
    const onEditRental = vi.fn();
    const host = render(<DoorsBoard rentals={[rentals[1]]} tenancies={[]} canManage onEditRental={onEditRental} />);
    click(byText(host, /Edit door/));
    const unitInput = [...host.querySelectorAll('input')].find((i) => i.getAttribute('placeholder') === 'e.g. Apt 2');
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(unitInput, 'Apt 2');
      unitInput.dispatchEvent(new Event('input', { bubbles: true }));
    });
    click(byText(host, /Save the change/));
    // ONLY the unit — an untouched offering must not ride along.
    expect(onEditRental.mock.calls[0][1]).toEqual({ unit: 'Apt 2' });
    expect(onEditRental.mock.calls[0][2]).toMatch(/Unit: \(blank\) → Apt 2/);
  });

  it('asks for a nightly rate only once the door is offered short-term', () => {
    const host = render(<DoorsBoard rentals={[rentals[1]]} tenancies={[]} canManage onEditRental={() => {}} />);
    click(byText(host, /Edit door/));
    expect(txt(host)).not.toMatch(/Nightly rate/);
    const select = offeringSelect(host);
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
      setter.call(select, 'short-term');
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    expect(txt(host)).toMatch(/Nightly rate/);
    expect(txt(host)).toMatch(/Minimum stay/);
  });

  it('clears a nightly rate when the door stops being offered short — the DB refuses that pair', () => {
    const onEditRental = vi.fn();
    const host = render(<DoorsBoard rentals={[shortStay]} tenancies={[]} canManage onEditRental={onEditRental} />);
    click(byText(host, /Edit door/));
    const select = offeringSelect(host);
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
      setter.call(select, 'long-term');
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    click(byText(host, /Save the change/));
    const patch = onEditRental.mock.calls[0][1];
    expect(patch.offering).toBe('long-term');
    expect(patch.nightly_rate).toBe(0);
    expect(patch.min_stay_nights).toBe(0);
  });
});
